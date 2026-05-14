// Cloudflare Pages Function: dynamic 1200x630 OG image for a ride.
// Mirrors the ride detail header — proposer eyebrow, big serif title,
// italic when-line, description, and a 3-up stats panel.

const FIRESTORE_BASE =
  'https://firestore.googleapis.com/v1/projects/crank-jj/databases/(default)/documents';

export async function onRequestGet(context) {
  const { params } = context;
  const id = String(params.id).replace(/\.svg$/i, '');

  let ride = null;
  try {
    const r = await fetch(`${FIRESTORE_BASE}/rides/${encodeURIComponent(id)}`);
    if (r.ok) ride = parseFirestoreDoc(await r.json());
  } catch (_) {}

  return new Response(renderOg(ride), {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'public, max-age=60, s-maxage=60',
    },
  });
}

// ───────── palette (matches client/src/styles.css) ─────────
const BG     = '#F6F2EA';
const PAPER  = '#FBF8F2';
const INK    = '#1F1B16';
const INK2   = '#5C544A';
const INK3   = '#8C8478';
const ACCENT = '#D97757';
const MOSS   = '#6B8E5A';
const CLAY   = '#B85C3C';
const HAIR   = '#DCD2BD';

// ───────── canvas + layout ─────────
const W = 1200, H = 630;
const PAD_X = 70;

// Top brand + status (~y=75)
const BRAND_Y = 78;

// Invite eyebrow above title
const INVITE_Y = 145;

// Title baseline anchor
const TITLE_Y0 = 235;
const TITLE_LH = 96;
const TITLE_SIZE = 84;

// Italic when-line follows title
const WHEN_GAP = 56;

// Description follows when-line
const DESC_GAP = 50;
const DESC_LH  = 36;

// Bottom stats panel (paper background, top + bottom borders)
const STATS_BAR_Y0 = 480;   // top border
const STATS_BAR_Y1 = 615;   // bottom border
const STAT_VAL_Y   = 555;
const STAT_LABEL_Y = 595;

function renderOg(ride) {
  if (!ride || !ride.title) return renderBlank();

  const desc = (ride.description || '').replace(/\s+/g, ' ').trim();
  const when = buildWhen(ride);
  const invite = ride.proposedBy ? `${ride.proposedBy.toUpperCase()} INVITES YOU TO RIDE` : '';

  const miles    = ride.distanceMi != null ? String(ride.distanceMi) : '—';
  const duration = durationLabel(ride);
  const going    = String(countGoing(ride));

  // Title: 2 lines max, greedy.
  const titleLines  = wrap(ride.title, 22).slice(0, 2);
  const titleBottom = TITLE_Y0 + (titleLines.length - 1) * TITLE_LH;

  // When line.
  const whenY = titleBottom + WHEN_GAP;

  // Description: balanced 2-line wrap; truncate to fit.
  const descMaxLines = Math.max(1, Math.floor((STATS_BAR_Y0 - 20 - (whenY + DESC_GAP)) / DESC_LH));
  const descLines = wrapBalanced(desc, Math.min(2, descMaxLines));
  const descY0 = whenY + DESC_GAP;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Georgia, 'Times New Roman', serif">
  <defs>
    <radialGradient id="g" cx="100%" cy="0%" r="80%">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.16"/>
      <stop offset="60%" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <rect width="${W}" height="${H}" fill="url(#g)"/>

  <!-- brand mark -->
  <g transform="translate(${PAD_X} ${BRAND_Y})">
    <circle cx="14" cy="-7" r="16" fill="${ACCENT}"/>
    <text x="14" y="-1" font-size="20" fill="${PAPER}" text-anchor="middle" font-style="italic">c</text>
    <text x="44" y="0" font-family="ui-sans-serif, system-ui, sans-serif" font-size="14" font-weight="700" letter-spacing="4" fill="${INK2}">CRANK · BIKEY BOYS</text>
  </g>

  ${renderStatusPill(ride)}

  ${invite ? `
  <text x="${PAD_X}" y="${INVITE_Y}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="16" font-weight="700" letter-spacing="3.5" fill="${CLAY}">${esc(invite)}</text>` : ''}

  <!-- title -->
  ${titleLines.map((line, i) => `
  <text x="${PAD_X}" y="${TITLE_Y0 + i * TITLE_LH}" font-size="${TITLE_SIZE}" fill="${INK}" font-weight="400">${esc(line)}</text>`).join('')}

  <!-- when (italic serif) -->
  <text x="${PAD_X}" y="${whenY}" font-style="italic" font-size="30" fill="${INK2}">${esc(when)}</text>

  <!-- description (sans, balanced wrap) -->
  ${descLines.map((line, i) => `
  <text x="${PAD_X}" y="${descY0 + i * DESC_LH}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="24" fill="${INK2}" font-weight="400">${esc(line)}</text>`).join('')}

  <!-- stats panel: paper-colored bg, top + bottom borders -->
  <rect x="0" y="${STATS_BAR_Y0}" width="${W}" height="${STATS_BAR_Y1 - STATS_BAR_Y0}" fill="${PAPER}"/>
  <line x1="0" y1="${STATS_BAR_Y0}" x2="${W}" y2="${STATS_BAR_Y0}" stroke="${HAIR}" stroke-width="1.5"/>
  <line x1="0" y1="${STATS_BAR_Y1}" x2="${W}" y2="${STATS_BAR_Y1}" stroke="${HAIR}" stroke-width="1.5"/>

  ${renderStat(W * (1/6), miles, 'MILES')}
  ${renderColSeparator(W * (2/6))}
  ${renderStat(W * (3/6), duration, 'DURATION')}
  ${renderColSeparator(W * (4/6))}
  ${renderStat(W * (5/6), going, going === '1' ? 'CRANKING' : 'CRANKING')}
</svg>`;
}

function renderBlank() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Georgia, 'Times New Roman', serif">
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <text x="${W/2}" y="${H/2 - 20}" font-size="120" fill="${INK}" text-anchor="middle">Crank</text>
  <text x="${W/2}" y="${H/2 + 60}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="22" letter-spacing="4" fill="${INK3}" text-anchor="middle">BIKEY BOYS</text>
</svg>`;
}

function renderStatusPill(ride) {
  const text = statusPillText(ride);
  const locked = ride.status === 'locked';
  // 24px font, ~3.5 letter-spacing → ~16px/char. Pad 48px each side.
  const fontSize = 24;
  const height = 60;
  const padX = 48;
  const width = Math.max(180, Math.round(text.length * 16) + padX * 2);
  const x = W - PAD_X - width;
  const y = BRAND_Y - 32;
  const cy = y + height / 2 + fontSize * 0.36; // baseline tweak for visual center
  if (locked) {
    return `<g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${height / 2}" fill="${MOSS}"/>
      <text x="${x + width/2}" y="${cy}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="${fontSize}" font-weight="700" letter-spacing="3.5" fill="${PAPER}" text-anchor="middle">${esc(text)}</text>
    </g>`;
  }
  return `<g>
    <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${height / 2}" fill="none" stroke="${CLAY}" stroke-width="2" stroke-dasharray="6 5"/>
    <text x="${x + width/2}" y="${cy}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="${fontSize}" font-weight="700" letter-spacing="3.5" fill="${CLAY}" text-anchor="middle">${esc(text)}</text>
  </g>`;
}

function statusPillText(ride) {
  if (ride.status === 'locked') return 'LOCKED';
  const e = ride.earliestDate || ride.date;
  const l = ride.latestDate  || ride.endDate || ride.date;
  const tour = (ride.tourDays || 0) > 1;
  const flex = e && l && l > e;
  const win  = !!ride.windowStart;
  if (tour) return 'OPEN · GATHERING RSVPS';
  if (flex && win) return 'OPEN · FIND A DAY & TIME';
  if (flex) return 'OPEN · FIND A DATE';
  if (win)  return 'OPEN · FIND A TIME';
  return 'OPEN';
}

function renderStat(cx, value, label) {
  const fontSize = value.length > 6 ? 42 : value.length > 4 ? 50 : 60;
  return `
  <text x="${cx}" y="${STAT_VAL_Y}" font-size="${fontSize}" fill="${INK}" text-anchor="middle" font-weight="400">${esc(value)}</text>
  <text x="${cx}" y="${STAT_LABEL_Y}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="13" letter-spacing="3" font-weight="600" fill="${INK3}" text-anchor="middle">${esc(label)}</text>`;
}

function renderColSeparator(x) {
  return `<line x1="${x}" y1="${STATS_BAR_Y0 + 22}" x2="${x}" y2="${STATS_BAR_Y1 - 22}" stroke="${HAIR}" stroke-width="1.5"/>`;
}

// ───────── content helpers ─────────

function buildWhen(ride) {
  const e = ride.earliestDate || ride.date;
  const l = ride.latestDate  || ride.endDate || ride.date;
  const tour = (ride.tourDays || 0) > 1;
  const win  = !!ride.windowStart;
  const flex = e && l && l > e;

  if (ride.status === 'locked' && ride.lockedDate) {
    return ride.lockedStart
      ? `${longDate(ride.lockedDate)} · ${fmtTime(ride.lockedStart)}`
      : longDate(ride.lockedDate);
  }
  if (tour) return `${ride.tourDays}-day tour · ${shortDate(e)}–${shortDate(l)}`;
  if (flex && win) return `${shortDate(e)} – ${shortDate(l)} · ${fmtTime(ride.windowStart)}–${fmtTime(ride.windowEnd)}`;
  if (flex) return `${shortDate(e)} – ${shortDate(l)}`;
  if (win)  return `${longDate(e)} · ${fmtTime(ride.windowStart)}–${fmtTime(ride.windowEnd)}`;
  return `${longDate(e)} · all day`;
}

function durationLabel(ride) {
  const tour = (ride.tourDays || 0) > 1;
  const win  = !!ride.windowStart;
  if (tour) return `${ride.tourDays}d`;
  if (!win) return 'all day';
  if (ride.durationMin) return fmtDuration(ride.durationMin);
  return '—';
}

function countGoing(ride) {
  if (!ride.rsvps) return 0;
  return Object.values(ride.rsvps).filter(r => r && r.state === 'going').length;
}

// ───────── primitives ─────────

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Greedy single-line-cap wrap. Used for the title.
function wrap(text, maxChars) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
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

// Balanced wrap — picks target width = ceil(total/lines) so the last line
// isn't an orphan single-word fragment. Used for the description.
function wrapBalanced(text, maxLines) {
  const s = String(text || '').trim();
  if (!s) return [];
  if (maxLines <= 1) return [s];

  // If it fits on one line at a typical width (~58 chars) just return it.
  if (s.length <= 58) return [s];

  const totalLen = s.length;
  const targetLen = Math.ceil(totalLen / maxLines);

  const words = s.split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const tryStr = (cur + ' ' + w).trim();
    if (tryStr.length > targetLen && cur && lines.length < maxLines - 1) {
      lines.push(cur);
      cur = w;
    } else {
      cur = tryStr;
    }
  }
  if (cur) lines.push(cur);

  // If the last line still overshoots (very long words), truncate with ellipsis.
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    const last = kept[kept.length - 1];
    kept[kept.length - 1] = last.replace(/[\s ]*$/, '') + '…';
    return kept;
  }
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
