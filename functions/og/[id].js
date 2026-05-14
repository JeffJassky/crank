// Cloudflare Pages Function: dynamic 1200x630 OG image for a ride.
// SVG output — supported by iMessage, Slack, Discord, FB, LinkedIn.
// Twitter requires PNG/JPG; Twitter card may fall back to summary instead of
// summary_large_image. Good enough for friend-group sharing.

const FIRESTORE_BASE =
  'https://firestore.googleapis.com/v1/projects/crank-jj/databases/(default)/documents';

export async function onRequestGet(context) {
  const { params } = context;
  // Allow /og/<id> or /og/<id>.svg
  const id = String(params.id).replace(/\.svg$/i, '');

  let ride = null;
  try {
    const r = await fetch(`${FIRESTORE_BASE}/rides/${encodeURIComponent(id)}`);
    if (r.ok) ride = parseFirestoreDoc(await r.json());
  } catch (_) {}

  const svg = renderOg(ride);
  return new Response(svg, {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'public, max-age=60, s-maxage=60',
    },
  });
}

// ───────── render ─────────

const PAPER = '#F6F2EA';
const INK   = '#1F1B16';
const INK2  = '#5C544A';
const INK3  = '#8C8478';
const ACCENT = '#D97757';
const MOSS = '#6B8E5A';
const HAIR = '#DCD2BD';

function renderOg(ride) {
  const title = ride?.title || 'Crank';
  const sub   = ride ? buildSub(ride) : 'Bikey Boys';
  const meta  = ride ? buildMeta(ride) : '';
  const status = ride?.status === 'locked' ? 'LOCKED' : ride ? 'OPEN' : '';

  const titleLines = wrap(title, 22).slice(0, 3);
  const titleY0 = 250;
  const titleLineHeight = 100;

  const subLines = wrap(sub, 50).slice(0, 2);
  const subY0 = titleY0 + titleLines.length * titleLineHeight + 30;

  const metaY = 560;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${PAPER}"/>
  <!-- subtle radial -->
  <defs>
    <radialGradient id="g" cx="85%" cy="-5%" r="65%">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>

  <!-- top mark -->
  <g transform="translate(70 110)">
    <circle cx="22" cy="-8" r="24" fill="${ACCENT}"/>
    <text x="22" y="-1" font-family="Georgia, 'Times New Roman', serif" font-size="22" fill="${PAPER}" text-anchor="middle" font-style="italic">c</text>
    <text x="62" y="2" font-family="Georgia, 'Times New Roman', serif" font-size="22" font-weight="700" letter-spacing="4" fill="${INK2}">CRANK · BIKEY BOYS</text>
  </g>

  ${status ? `
  <g transform="translate(1050 80)">
    <rect x="0" y="0" width="80" height="32" rx="16" fill="${status === 'LOCKED' ? MOSS : 'none'}" stroke="${status === 'LOCKED' ? MOSS : ACCENT}" stroke-width="2" stroke-dasharray="${status === 'LOCKED' ? '0' : '5 4'}"/>
    <text x="40" y="22" font-family="ui-sans-serif, system-ui, sans-serif" font-size="14" font-weight="700" letter-spacing="2" fill="${status === 'LOCKED' ? PAPER : ACCENT}" text-anchor="middle">${status}</text>
  </g>` : ''}

  <!-- title -->
  ${titleLines.map((line, i) => `
  <text x="70" y="${titleY0 + i * titleLineHeight}" font-family="Georgia, 'Times New Roman', serif" font-size="92" fill="${INK}" font-weight="400">${esc(line)}</text>`).join('')}

  <!-- sub (when / distance) -->
  ${subLines.map((line, i) => `
  <text x="70" y="${subY0 + i * 44}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="32" fill="${INK2}" font-weight="500">${esc(line)}</text>`).join('')}

  <!-- bottom meta line -->
  <line x1="70" y1="${metaY - 24}" x2="1130" y2="${metaY - 24}" stroke="${HAIR}" stroke-width="1"/>
  <text x="70" y="${metaY}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="22" font-weight="600" letter-spacing="2" fill="${INK3}">${esc(meta.toUpperCase())}</text>
</svg>`;
}

function buildSub(ride) {
  const e = ride.earliestDate || ride.date;
  const l = ride.latestDate  || ride.endDate || ride.date;
  const tour = (ride.tourDays || 0) > 1;
  const win  = !!ride.windowStart;
  const flex = e && l && l > e;

  if (ride.status === 'locked' && ride.lockedDate) {
    return ride.lockedStart
      ? `${longDate(ride.lockedDate)} at ${fmtTime(ride.lockedStart)}`
      : longDate(ride.lockedDate);
  }
  if (tour) return `${ride.tourDays}-day tour · ${shortDate(e)} – ${shortDate(l)}`;
  if (flex && win) return `${shortDate(e)} – ${shortDate(l)} · ${fmtTime(ride.windowStart)}–${fmtTime(ride.windowEnd)}`;
  if (flex) return `${shortDate(e)} – ${shortDate(l)}`;
  if (win)  return `${longDate(e)} · ${fmtTime(ride.windowStart)}–${fmtTime(ride.windowEnd)}`;
  return `${longDate(e)} · all day`;
}

function buildMeta(ride) {
  const bits = [];
  if (ride.distanceMi) bits.push(`${ride.distanceMi} MI`);
  if (ride.durationMin) bits.push(fmtDuration(ride.durationMin).toUpperCase());
  const going = ride.rsvps
    ? Object.values(ride.rsvps).filter(r => r && r.state === 'going').length
    : 0;
  if (going) bits.push(`${going} GOING`);
  if (ride.proposedBy) bits.push(`BY ${String(ride.proposedBy).toUpperCase()}`);
  return bits.join('  ·  ');
}

// ───────── helpers ─────────

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function wrap(text, maxChars) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const tryStr = (cur + ' ' + w).trim();
    if (tryStr.length > maxChars && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = tryStr;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function unwrap(field) {
  if (!field) return undefined;
  if ('stringValue' in field) return field.stringValue;
  if ('integerValue' in field) return Number(field.integerValue);
  if ('doubleValue' in field) return field.doubleValue;
  if ('booleanValue' in field) return field.booleanValue;
  if ('nullValue' in field) return null;
  if ('timestampValue' in field) return field.timestampValue;
  if ('arrayValue' in field) return (field.arrayValue.values || []).map(unwrap);
  if ('mapValue' in field) {
    const o = {};
    for (const [k, v] of Object.entries(field.mapValue.fields || {})) o[k] = unwrap(v);
    return o;
  }
  return undefined;
}
function parseFirestoreDoc(doc) {
  const out = {};
  for (const [k, v] of Object.entries(doc.fields || {})) out[k] = unwrap(v);
  return out;
}

function shortDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}
function longDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
}
function fmtTime(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'pm' : 'am';
  const h12 = ((h + 11) % 12) + 1;
  return m === 0 ? `${h12}${period}` : `${h12}:${String(m).padStart(2,'0')}${period}`;
}
function fmtDuration(min) {
  if (!min) return '';
  const h = Math.floor(min / 60), m = min % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}
