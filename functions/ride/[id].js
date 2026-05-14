// Cloudflare Pages Function: serve the SPA shell with ride-specific OG tags
// injected so iMessage/Slack/Messenger previews show the ride's title +
// description + dynamic OG image.
//
// Runs at the edge for every GET to /ride/<id>. Browsers still hydrate as a
// normal SPA after the page loads.

const FIRESTORE_BASE =
  'https://firestore.googleapis.com/v1/projects/crank-jj/databases/(default)/documents';

export async function onRequestGet(context) {
  const { params, env, request } = context;
  const id = params.id;

  let ride = null;
  try {
    const r = await fetch(`${FIRESTORE_BASE}/rides/${encodeURIComponent(id)}`);
    if (r.ok) ride = parseFirestoreDoc(await r.json());
  } catch (_) { /* fall through to plain SPA */ }

  // Pull the static shell (index.html) and rewrite a few tags.
  const shellRes = await env.ASSETS.fetch(new Request(new URL('/index.html', request.url).toString()));
  let html = await shellRes.text();

  if (ride && ride.title) {
    const url = new URL(request.url);
    const title = `${ride.title} · Crank`;
    const desc = buildDescription(ride);
    const ogImage = `${url.origin}/og/${encodeURIComponent(id)}.svg`;

    const tags = [
      `<title>${esc(title)}</title>`,
      `<meta name="description" content="${esc(desc)}" />`,
      `<meta property="og:title" content="${esc(title)}" />`,
      `<meta property="og:description" content="${esc(desc)}" />`,
      `<meta property="og:image" content="${esc(ogImage)}" />`,
      `<meta property="og:image:width" content="1200" />`,
      `<meta property="og:image:height" content="630" />`,
      `<meta property="og:url" content="${esc(url.href)}" />`,
      `<meta property="og:type" content="website" />`,
      `<meta property="og:site_name" content="Crank" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${esc(title)}" />`,
      `<meta name="twitter:description" content="${esc(desc)}" />`,
      `<meta name="twitter:image" content="${esc(ogImage)}" />`,
    ].join('\n  ');

    // Drop the default <title> and inject our tags before </head>.
    html = html.replace(/<title>[^<]*<\/title>/, '');
    html = html.replace('</head>', `  ${tags}\n</head>`);
  }

  return new Response(html, {
    headers: {
      'content-type': 'text/html;charset=UTF-8',
      'cache-control': 'public, max-age=60, s-maxage=60',
    },
  });
}

// ───────── helpers ─────────

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
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

function fmtTime(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'pm' : 'am';
  const h12 = ((h + 11) % 12) + 1;
  return m === 0 ? `${h12}${period}` : `${h12}:${String(m).padStart(2,'0')}${period}`;
}

function buildDescription(ride) {
  const e = ride.earliestDate || ride.date;
  const l = ride.latestDate  || ride.endDate || ride.date;
  const tour = (ride.tourDays || 0) > 1;
  const win  = !!ride.windowStart;
  const flex = e && l && l > e;

  let when;
  if (ride.status === 'locked' && ride.lockedDate) {
    when = ride.lockedStart ? `${shortDate(ride.lockedDate)} · ${fmtTime(ride.lockedStart)}` : shortDate(ride.lockedDate);
  } else if (tour) {
    when = `${ride.tourDays}d tour · ${shortDate(e)}–${shortDate(l)}`;
  } else if (flex && win) {
    when = `${shortDate(e)}–${shortDate(l)} · ${fmtTime(ride.windowStart)}–${fmtTime(ride.windowEnd)}`;
  } else if (flex) {
    when = `${shortDate(e)}–${shortDate(l)}`;
  } else if (win) {
    when = `${shortDate(e)} · ${fmtTime(ride.windowStart)}–${fmtTime(ride.windowEnd)}`;
  } else {
    when = `${shortDate(e)} · all day`;
  }

  const goingCount = ride.rsvps
    ? Object.values(ride.rsvps).filter(r => r && r.state === 'going').length
    : 0;

  const bits = [when];
  if (ride.distanceMi) bits.push(`${ride.distanceMi} mi`);
  if (goingCount) bits.push(`${goingCount} going`);
  if (ride.proposedBy) bits.push(`proposed by ${ride.proposedBy}`);

  const tail = bits.join(' · ');
  const ridebrief = (ride.description || '').trim();
  if (!ridebrief) return tail;
  return ridebrief.length > 140
    ? `${ridebrief.slice(0, 137)}… — ${tail}`
    : `${ridebrief} — ${tail}`;
}
