// Shared UI primitives + icons + date helpers.
// All Babel scripts share the global window namespace; expose at the bottom.

const { useState, useEffect, useRef, useMemo, useCallback } = React;

/* ---------- icons (sized for inline use) ---------- */
const Icon = ({ name, size = 16, stroke = 1.6, ...rest }) => {
  const paths = {
    back: <polyline points="14 4 6 12 14 20" />,
    chev: <polyline points="9 6 15 12 9 18" />,
    pin: <><path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z" /><circle cx="12" cy="9" r="2.4" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 16 14" /></>,
    ruler: <path d="M3 13l8-8 8 8-8 8zM7 11l2 2M9 9l2 2M11 7l2 2" />,
    plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
    check: <polyline points="5 12.5 10 17 19 7" />,
    x: <><line x1="6" y1="6" x2="18" y2="18" /><line x1="6" y1="18" x2="18" y2="6" /></>,
    q: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 4.3 1.7c-.9 .8-1.8 1.3-1.8 2.8" /><circle cx="12" cy="17.5" r="0.7" fill="currentColor" /></>,
    home: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
    feed: <><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="14" y2="17" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>,
    edit: <><path d="M14 5l5 5L9 20H4v-5L14 5z" /></>,
    bike: <><circle cx="6" cy="16" r="4" /><circle cx="18" cy="16" r="4" /><path d="M6 16l5-8h4l3 8M11 8h-3M15 8l1-2h2" /></>,
    map: <><polygon points="3 6 9 4 15 6 21 4 21 18 15 20 9 18 3 20" /><line x1="9" y1="4" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="20" /></>,
    lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
    unlock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 7-2" /></>,
    spark: <path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3" />,
    cal: <><rect x="4" y="6" width="16" height="14" rx="2" /><line x1="4" y1="10" x2="20" y2="10" /><line x1="9" y1="3" x2="9" y2="7" /><line x1="15" y1="3" x2="15" y2="7" /></>,
    more: <><circle cx="6" cy="12" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="18" cy="12" r="1.2" fill="currentColor" /></>,
    share: <><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" /><polyline points="8 7 12 3 16 7" /><line x1="12" y1="3" x2="12" y2="15" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      {paths[name]}
    </svg>
  );
};

/* ---------- status bar ---------- */
const StatusBar = () => (
  <div className="statusbar">
    <span>9:41</span>
    <span className="statusbar-right">
      <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor"><circle cx="2" cy="9" r="1.5"/><circle cx="6.5" cy="7" r="1.5"/><circle cx="11" cy="5" r="1.5"/><circle cx="15.5" cy="3" r="1.5"/></svg>
      <svg width="16" height="11" viewBox="0 0 16 11" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="0.75" y="0.75" width="11" height="9.5" rx="2"/><rect x="2" y="2" width="8" height="7" rx="1" fill="currentColor"/><rect x="13" y="3.5" width="2" height="4" rx="0.5" fill="currentColor"/></svg>
    </span>
  </div>
);

/* ---------- avatar (color from username) ---------- */
const avatarPalette = ['#D97757','#6B8E5A','#B85C3C','#7A8FBC','#C98A2E','#A06B9E','#5C8E84','#A8755A'];
const colorFor = (name) => {
  if (!name) return avatarPalette[0];
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return avatarPalette[h % avatarPalette.length];
};
const Avatar = ({ name, size = 22, className = '' }) => (
  <span className={'avatar ' + className} style={{ width: size, height: size, background: colorFor(name), color: '#FBF8F2' }}>
    {(name || '?').slice(0,1).toUpperCase()}
  </span>
);

/* ---------- date utilities ---------- */
const dayName = (iso) => {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase();
};
const longDate = (iso) => {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
};
const shortDate = (iso) => {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const dateRangeLabel = (start, end) => {
  if (!end || end === start) return longDate(start);
  const a = new Date(start + 'T12:00:00');
  const b = new Date(end + 'T12:00:00');
  const sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  const aStr = a.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const bStr = sameMonth
    ? b.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })
    : b.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  return `${aStr} – ${bStr}`;
};
const dateRangeShort = (start, end) => {
  if (!end || end === start) return shortDate(start);
  const a = new Date(start + 'T12:00:00');
  const b = new Date(end + 'T12:00:00');
  const sameMonth = a.getMonth() === b.getMonth();
  const aStr = a.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const bStr = sameMonth
    ? String(b.getDate())
    : b.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${aStr}–${bStr}`;
};

// ---------- ride field accessors (with back-compat for old `date`/`endDate`/`mode`) ----------
const earliestOf = (r) => r.earliestDate || r.date || null;
const latestOf   = (r) => r.latestDate  || r.endDate || r.date || null;
const hasWindow  = (r) => !!r.windowStart;
const isTour     = (r) => !!(r.tourDays && r.tourDays > 1);
const isMultiDay = isTour;
const dateSpan   = (r) => {
  const a = earliestOf(r), b = latestOf(r);
  if (!a || !b) return 0;
  return Math.round((new Date(b+'T12:00:00') - new Date(a+'T12:00:00'))/86400000) + 1;
};
const isFlexDate = (r) => dateSpan(r) > 1;

// Slot-encoding key used in rsvps[].slots:
//   - allday rides:               "YYYY-MM-DD"
//   - windowed, single-day range: "HH:MM"
//   - windowed, multi-day range:  "YYYY-MM-DD HH:MM"
const slotKey = (date, time, isFlex) => time == null ? date : (isFlex ? `${date} ${time}` : time);

// All dates (YYYY-MM-DD) between start and end inclusive.
const datesBetween = (start, end) => {
  const out = [];
  if (!start || !end) return out;
  const a = new Date(start + 'T12:00:00');
  const b = new Date(end + 'T12:00:00');
  while (a <= b) {
    out.push(a.toISOString().slice(0,10));
    a.setDate(a.getDate() + 1);
  }
  return out;
};

const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const daysBetween = (a, b) => Math.round((startOfDay(b) - startOfDay(a)) / 86400000);

const groupRides = (rides) => {
  const today = startOfDay(new Date());
  const groups = { today: [], tomorrow: [], thisWeek: [], nextWeek: [], later: [], past: [] };
  rides.forEach(r => {
    // Group by the locked date if locked, otherwise by the earliest possible date.
    const anchor = r.lockedDate || earliestOf(r);
    if (!anchor) { groups.later.push(r); return; }
    const d = new Date(anchor + 'T12:00:00');
    const diff = daysBetween(today, d);
    const latestAnchor = latestOf(r);
    const latestDiff = latestAnchor ? daysBetween(today, new Date(latestAnchor + 'T12:00:00')) : diff;
    if (latestDiff < 0) groups.past.push(r);
    else if (diff <= 0 && latestDiff >= 0) groups.today.push(r);
    else if (diff === 1) groups.tomorrow.push(r);
    else if (diff <= 6) groups.thisWeek.push(r);
    else if (diff <= 13) groups.nextWeek.push(r);
    else groups.later.push(r);
  });
  return groups;
};

/* ---------- time helpers ---------- */
const fmtTime = (hhmm) => {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'pm' : 'am';
  const h12 = ((h + 11) % 12) + 1;
  return m === 0 ? `${h12}${period}` : `${h12}:${String(m).padStart(2,'0')}${period}`;
};
const fmtDuration = (min) => {
  if (!min) return '';
  const h = Math.floor(min / 60), m = min % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
};

const slotsBetween = (start, end, stepMin = 30) => {
  if (!start || !end) return [];
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let cur = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const out = [];
  while (cur < endMin) {
    out.push(`${String(Math.floor(cur/60)).padStart(2,'0')}:${String(cur%60).padStart(2,'0')}`);
    cur += stepMin;
  }
  return out;
};

/* ---------- ride helpers ---------- */
const rsvpSummary = (ride) => {
  const r = ride.rsvps || {};
  const going = [], maybe = [], cant = [];
  Object.entries(r).forEach(([u, v]) => {
    if (v.state === 'going') going.push(u);
    else if (v.state === 'maybe') maybe.push(u);
    else if (v.state === 'cant') cant.push(u);
  });
  return { going, maybe, cant };
};

// Recommend best (date, time) for any ride. time is null for allday rides.
// Picks the contiguous N-slot/N-day window maximizing (going) + 0.5*(maybe).
const recommendStart = (ride) => {
  const rs = ride.rsvps || {};
  const earliest = earliestOf(ride), latest = latestOf(ride);
  if (!earliest || !latest) return null;
  const dates = datesBetween(earliest, latest);
  const flex = isFlexDate(ride);
  const tour = isTour(ride);
  const window = hasWindow(ride);

  // Tour: pick the best contiguous N-day block. Slots are dates.
  if (tour) {
    const needed = ride.tourDays;
    if (dates.length < needed) return null;
    let best = { date: dates[0], score: -1 };
    for (let i = 0; i + needed <= dates.length; i++) {
      const win = dates.slice(i, i + needed);
      let score = 0;
      Object.values(rs).forEach(({ state, slots: us }) => {
        if (state === 'cant') return;
        const set = new Set(us || []);
        const hits = win.filter(d => set.has(d)).length;
        const ratio = hits / needed;
        if (ratio === 1) score += (state === 'going' ? 1 : 0.5);
        else        score += (state === 'going' ? ratio * 0.6 : ratio * 0.3);
      });
      if (score > best.score) best = { date: win[0], score };
    }
    return { date: best.date, time: null };
  }

  // Allday + single date: nothing to recommend, RSVP is the answer.
  if (!window && !flex) return null;

  // Allday + flex date: pick best single date. Slots are dates.
  if (!window && flex) {
    let best = { date: dates[0], score: -1 };
    dates.forEach(d => {
      let score = 0;
      Object.values(rs).forEach(({ state, slots: us }) => {
        if (state === 'cant') return;
        if ((us || []).includes(d)) score += (state === 'going' ? 1 : 0.5);
      });
      if (score > best.score) best = { date: d, score };
    });
    return { date: best.date, time: null };
  }

  // Windowed cases: find best contiguous slot window of duration.
  const slots = slotsBetween(ride.windowStart, ride.windowEnd, 30);
  const needed = Math.ceil((ride.durationMin || 60) / 30);
  if (slots.length < needed) return null;

  // Windowed + single date: slots stored as "HH:MM".
  if (!flex) {
    const fixedDate = dates[0];
    let best = { time: slots[0], score: -1 };
    for (let i = 0; i + needed <= slots.length; i++) {
      const win = slots.slice(i, i + needed);
      let score = 0;
      Object.values(rs).forEach(({ state, slots: us }) => {
        if (state === 'cant') return;
        // accept "HH:MM" or "DATE HH:MM" defensively
        const set = new Set((us || []).map(x => x.includes(' ') ? x.split(' ')[1] : x));
        const hits = win.filter(s => set.has(s)).length;
        const ratio = hits / needed;
        if (ratio === 1) score += (state === 'going' ? 1 : 0.5);
        else        score += (state === 'going' ? ratio * 0.6 : ratio * 0.3);
      });
      if (score > best.score) best = { time: win[0], score };
    }
    return { date: fixedDate, time: best.time };
  }

  // Windowed + flex date: best (date, slot-window) combo. Slots are "DATE HH:MM".
  let best = { date: dates[0], time: slots[0], score: -1 };
  dates.forEach(d => {
    for (let i = 0; i + needed <= slots.length; i++) {
      const win = slots.slice(i, i + needed);
      let score = 0;
      Object.values(rs).forEach(({ state, slots: us }) => {
        if (state === 'cant') return;
        const set = new Set(us || []);
        const hits = win.filter(s => set.has(`${d} ${s}`)).length;
        const ratio = hits / needed;
        if (ratio === 1) score += (state === 'going' ? 1 : 0.5);
        else        score += (state === 'going' ? ratio * 0.6 : ratio * 0.3);
      });
      if (score > best.score) best = { date: d, time: win[0], score };
    }
  });
  return { date: best.date, time: best.time };
};

// Per-slot availability score, only meaningful for single-day windowed rides.
const slotHeat = (ride) => {
  if (!hasWindow(ride)) return [];
  const slots = slotsBetween(ride.windowStart, ride.windowEnd, 30);
  const rs = ride.rsvps || {};
  return slots.map(s => {
    let n = 0;
    Object.values(rs).forEach(({ state, slots: us }) => {
      if (state === 'cant') return;
      const has = (us || []).some(x => (x.includes(' ') ? x.split(' ')[1] : x) === s);
      if (has) n += (state === 'going' ? 1 : 0.5);
    });
    return { slot: s, score: n };
  });
};

const routeVoteCounts = (ride) => {
  const counts = {};
  (ride.routes || []).forEach(r => { counts[r.id] = 0; });
  Object.values(ride.routeVotes || {}).forEach(rid => {
    if (counts[rid] != null) counts[rid] += 1;
  });
  return counts;
};
// Compact display of a ride's "when". Used by cards + headers.
const summarizeWhen = (ride) => {
  const e = earliestOf(ride), l = latestOf(ride);
  const flex = isFlexDate(ride);
  const tour = isTour(ride);
  const win  = hasWindow(ride);
  if (ride.status === 'locked') {
    if (tour && ride.lockedDate) {
      const end = new Date(ride.lockedDate + 'T12:00:00'); end.setDate(end.getDate() + ride.tourDays - 1);
      return `${shortDate(ride.lockedDate)}–${shortDate(end.toISOString().slice(0,10))}`;
    }
    if (ride.lockedDate && ride.lockedStart) return `${shortDate(ride.lockedDate)} · ${fmtTime(ride.lockedStart)}`;
    if (ride.lockedDate)  return shortDate(ride.lockedDate);
    if (ride.lockedStart) return fmtTime(ride.lockedStart);
    return 'Confirmed';
  }
  if (tour) return `${ride.tourDays}d tour · ${dateRangeShort(e, l)} window`;
  if (flex && win)  return `${dateRangeShort(e, l)} · ${fmtTime(ride.windowStart)}–${fmtTime(ride.windowEnd)}`;
  if (flex)         return dateRangeShort(e, l);
  if (win)          return `${shortDate(e)} · ${fmtTime(ride.windowStart)}–${fmtTime(ride.windowEnd)}`;
  return `${shortDate(e)} · all day`;
};

// Build a "Open in Maps" link from either an address string or a paste-in URL.
const mapsLinkFor = (q) => {
  if (!q) return null;
  if (/^https?:\/\//i.test(q)) return q;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
};
// Build an embeddable Maps URL. Returns null for share URLs (can't embed without key).
const mapsEmbedFor = (q, zoom = 14) => {
  if (!q) return null;
  if (/^https?:\/\//i.test(q)) return null;
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=${zoom}&output=embed`;
};

const leadingRoute = (ride) => {
  if (!ride.routes || ride.routes.length === 0) return null;
  const counts = routeVoteCounts(ride);
  let best = ride.routes[0], bestN = counts[best.id] || 0;
  ride.routes.forEach(r => {
    if ((counts[r.id] || 0) > bestN) { best = r; bestN = counts[r.id]; }
  });
  return bestN > 0 ? best : ride.routes[0];
};

// Export to window for sibling Babel scripts.
Object.assign(window, {
  Icon, StatusBar, Avatar, colorFor,
  dayName, longDate, shortDate, dateRangeLabel, dateRangeShort,
  isMultiDay, isTour, hasWindow, isFlexDate, dateSpan, earliestOf, latestOf, slotKey,
  datesBetween,
  groupRides, daysBetween, startOfDay,
  fmtTime, fmtDuration, slotsBetween,
  rsvpSummary, recommendStart, slotHeat, summarizeWhen,
  routeVoteCounts, leadingRoute, mapsLinkFor, mapsEmbedFor,
});
