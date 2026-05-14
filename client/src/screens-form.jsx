// Propose + Edit ride form. Schema is date-range first.

const { useState: uS3, useMemo: uM3, useEffect: uE3 } = React;

const blankRide = (user) => {
  const today = window.Store.todayISO();
  return {
    id: 'r' + Math.random().toString(36).slice(2, 8),
    title: '',
    description: '',
    earliestDate: today,
    latestDate:   window.Store.addDays(today, 30),
    windowStart: null,
    windowEnd:   null,
    durationMin: null,
    tourDays:    null,
    distanceMi: '',
    startAddress: '',
    mapQuery: '',
    status: 'open',
    lockedDate: null,
    lockedStart: null,
    proposedBy: user,
    createdAt: Date.now(),
    routes: [],
    routeVotes: {},
    rsvps: { [user]: { state: 'going', slots: [] } },
  };
};

const newRouteId = () => 'rt' + Math.random().toString(36).slice(2, 7);

const hourOptions = (() => {
  const out = [];
  for (let h = 4; h <= 23; h++) for (let m of [0, 30]) {
    const v = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    out.push({ v, label: fmtTime(v) });
  }
  return out;
})();

const durationOptions = [
  { v: 30, label: '30 min' },  { v: 60, label: '1 hour' },
  { v: 90, label: '1h 30m' },  { v: 120, label: '2 hours' },
  { v: 150, label: '2h 30m' }, { v: 180, label: '3 hours' },
  { v: 240, label: '4 hours' }, { v: 300, label: '5 hours' },
  { v: 360, label: '6 hours' }, { v: 420, label: '7 hours' },
  { v: 480, label: '8 hours' }, { v: 540, label: '9 hours' },
  { v: 600, label: '10 hours' }, { v: 660, label: '11 hours' },
  { v: 720, label: '12 hours' },
];

// Migrate an old-schema ride (date, endDate, mode) onto the new fields.
const normalizeForEdit = (r) => ({
  ...r,
  earliestDate: r.earliestDate || r.date || window.Store.todayISO(),
  latestDate:   r.latestDate   || r.endDate || r.date || window.Store.todayISO(),
  windowStart:  r.windowStart  || (r.mode === 'window' ? '09:00' : null),
  windowEnd:    r.windowEnd    || (r.mode === 'window' ? '13:00' : null),
  durationMin:  r.durationMin  || (r.mode === 'window' ? 120 : null),
  tourDays:     r.tourDays     || null,
  lockedDate:   r.lockedDate   || null,
  lockedStart:  r.lockedStart  || null,
});

const RideForm = ({ initial, isEdit, currentUser, onCancel, onSave }) => {
  const [draft, setDraft] = uS3(() => initial ? normalizeForEdit(initial) : blankRide(currentUser));
  const set = (patch) => setDraft(d => ({ ...d, ...patch }));

  const windowed = !!draft.windowStart;
  const tour     = (draft.tourDays || 0) > 1;
  const span     = Math.round(
    (new Date(draft.latestDate + 'T12:00:00') - new Date(draft.earliestDate + 'T12:00:00')) / 86400000
  ) + 1;
  const flex     = span > 1;

  const valid =
    draft.title.trim().length > 0 &&
    draft.earliestDate && draft.latestDate &&
    draft.latestDate >= draft.earliestDate &&
    (!windowed || (draft.windowStart < draft.windowEnd && draft.durationMin)) &&
    (!tour || (draft.tourDays >= 2 && span >= draft.tourDays));

  const setEarliest = (v) => {
    const patch = { earliestDate: v };
    if (v > draft.latestDate) patch.latestDate = v;
    set(patch);
  };
  const setLatest = (v) => {
    if (v >= draft.earliestDate) set({ latestDate: v });
  };

  const toggleWindow = () => {
    if (windowed) set({ windowStart: null, windowEnd: null, durationMin: null });
    else          set({ windowStart: '09:00', windowEnd: '13:00', durationMin: 120 });
  };
  const toggleTour = () => {
    if (tour) set({ tourDays: null });
    else {
      // Tours are always allday. Ensure span ≥ tourDays.
      const wantDays = 3;
      const minSpan = Math.max(span, wantDays + 3);
      const patch = { tourDays: wantDays, windowStart: null, windowEnd: null, durationMin: null };
      if (span < minSpan) patch.latestDate = window.Store.addDays(draft.earliestDate, minSpan - 1);
      set(patch);
    }
  };

  // Routes
  const addRoute = () => set({ routes: [...(draft.routes || []), { id: newRouteId(), name: '', distanceMi: '', note: '', mapQuery: '' }] });
  const updateRoute = (id, patch) =>
    set({ routes: (draft.routes || []).map(r => r.id === id ? { ...r, ...patch } : r) });
  const removeRoute = (id) => set({
    routes: (draft.routes || []).filter(r => r.id !== id),
    routeVotes: Object.fromEntries(Object.entries(draft.routeVotes || {}).filter(([u, rid]) => rid !== id)),
  });

  const save = () => {
    if (!valid) return;
    const next = { ...draft };
    // strip legacy fields if present
    delete next.date; delete next.endDate; delete next.mode;
    if (next.startAddress && !next.mapQuery) next.mapQuery = next.startAddress;
    if (next.distanceMi === '' || next.distanceMi === null) delete next.distanceMi;
    else next.distanceMi = Number(next.distanceMi);
    next.routes = (next.routes || []).filter(r => r.name && r.name.trim().length > 0).map(r => {
      const rt = { ...r, name: r.name.trim() };
      if (rt.distanceMi === '' || rt.distanceMi == null) delete rt.distanceMi;
      else rt.distanceMi = Number(rt.distanceMi);
      if (!rt.note) delete rt.note;
      if (!rt.mapQuery) delete rt.mapQuery;
      return rt;
    });
    next.routeVotes = next.routeVotes || {};
    onSave(next);
  };

  return (
    <div className="screen">
      <div className="app-header has-back">
        <button className="back-btn" onClick={onCancel}><Icon name="back" size={20} /> {isEdit ? 'Ride' : 'Cancel'}</button>
        <div className="app-header-title" style={{ fontSize: 22 }}>{isEdit ? 'Edit ride' : 'Propose a ride'}</div>
        <span style={{ width: 40 }} />
      </div>

      <div className="screen-scroll form-screen">
        <div className="form-row">
          <label>Title</label>
          <input className="input" value={draft.title}
            placeholder="e.g. Saturday gravel loop"
            onChange={e => set({ title: e.target.value })} />
        </div>

        <div className="form-row">
          <label>What's the vibe?</label>
          <textarea className="textarea" value={draft.description}
            placeholder="Distance, pace, regroups, who it's for…"
            onChange={e => set({ description: e.target.value })} />
        </div>

        <div className="form-row">
          <label>When could it happen?</label>
          <div className="row-2">
            <input className="input" type="date" value={draft.earliestDate}
              min={window.Store.todayISO()}
              onChange={e => setEarliest(e.target.value)} />
            <input className="input" type="date" value={draft.latestDate}
              min={draft.earliestDate}
              onChange={e => setLatest(e.target.value)} />
          </div>
          <div className="helper">
            {flex
              ? `${span}-day window — riders mark which days work.`
              : 'Same date for both = fixed day. Use a range and riders vote.'}
          </div>
        </div>

        <div className="form-row">
          <label>Time of day</label>
          <div className="toggle-pair">
            <button type="button" className={!windowed ? 'active' : ''} onClick={() => windowed && toggleWindow()}>
              All day
            </button>
            <button type="button" className={windowed ? 'active' : ''} onClick={() => !windowed && toggleWindow()}>
              Specific time window
            </button>
          </div>
        </div>

        {windowed && (
          <div className="form-row">
            <label>Window & duration</label>
            <div className="time-pickers">
              <select className="input" value={draft.windowStart} onChange={e => set({ windowStart: e.target.value })}>
                {hourOptions.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
              </select>
              <select className="input" value={draft.windowEnd} onChange={e => set({ windowEnd: e.target.value })}>
                {hourOptions.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
              </select>
              <select className="input" value={draft.durationMin} onChange={e => set({ durationMin: Number(e.target.value) })}>
                {durationOptions.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
              </select>
            </div>
            <div className="helper">Earliest start · latest start · how long the ride is</div>
          </div>
        )}

        <div className="form-row">
          <label>Is this a multi-day tour?</label>
          <div className="toggle-pair">
            <button type="button" className={!tour ? 'active' : ''} onClick={() => tour && toggleTour()}>
              No, single day
            </button>
            <button type="button" className={tour ? 'active' : ''} onClick={() => !tour && toggleTour()}>
              Multi-day tour
            </button>
          </div>
        </div>

        {tour && (
          <div className="form-row">
            <label>Tour length</label>
            <select className="input" value={draft.tourDays}
              onChange={e => {
                const n = Number(e.target.value);
                const patch = { tourDays: n };
                if (span < n) patch.latestDate = window.Store.addDays(draft.earliestDate, n - 1);
                set(patch);
              }}>
              {[2,3,4,5,6,7,8,10,12,14].map(n => (
                <option key={n} value={n}>{n} days</option>
              ))}
            </select>
            <div className="helper">Riders mark which days they could crank — system picks the best {draft.tourDays}-day stretch.</div>
          </div>
        )}

        <div className="form-row" style={{ marginBottom: 0 }}>
          <label>Distance <span style={{ textTransform: 'none', letterSpacing: 'normal', color: 'var(--ink-3)', fontSize: 11 }}>· estimated, optional</span></label>
          <input className="input" type="number" inputMode="decimal" value={draft.distanceMi}
            placeholder="e.g. 24 mi"
            onChange={e => set({ distanceMi: e.target.value })} />
        </div>

        <div className="form-row" style={{ marginTop: 16 }}>
          <label>Meet address <span style={{ textTransform: 'none', letterSpacing: 'normal', color: 'var(--ink-3)', fontSize: 11 }}>· where we meet</span></label>
          <input className="input" value={draft.startAddress}
            placeholder="Coffee shop, park, intersection…"
            onChange={e => set({ startAddress: e.target.value })} />
          <div className="helper">We'll embed a map of this spot — unless a route below has its own location.</div>
        </div>

        <div className="form-row" style={{ marginTop: 22 }}>
          <label>Route options <span style={{ textTransform: 'none', letterSpacing: 'normal', color: 'var(--ink-3)', fontSize: 11 }}>· optional, riders vote</span></label>
          <div className="route-editor">
            {(draft.routes || []).map(rt => (
              <div key={rt.id} className="route-edit-row">
                <div className="row-3">
                  <input className="input" placeholder="Route name (e.g. Skyline loop)"
                    value={rt.name} onChange={e => updateRoute(rt.id, { name: e.target.value })} />
                  <input className="input" placeholder="mi" inputMode="decimal"
                    value={rt.distanceMi ?? ''} onChange={e => updateRoute(rt.id, { distanceMi: e.target.value })} />
                  <button type="button" className="del" onClick={() => removeRoute(rt.id)} aria-label="Remove route">
                    <Icon name="x" size={16} />
                  </button>
                </div>
                <input className="input" placeholder="Short note (optional)"
                  value={rt.note || ''} onChange={e => updateRoute(rt.id, { note: e.target.value })} />
                <input className="input" placeholder="Map location or area (optional)"
                  value={rt.mapQuery || ''} onChange={e => updateRoute(rt.id, { mapQuery: e.target.value })} />
              </div>
            ))}
            <button type="button" className="add-route-btn" onClick={addRoute}>
              <Icon name="plus" size={14} stroke={2.4} />
              Add{(draft.routes && draft.routes.length) ? ' another' : ''} route option
            </button>
          </div>
          {(draft.routes && draft.routes.length > 0) && (
            <div className="helper" style={{ marginTop: 8 }}>Each rider gets one vote. The route with the most votes shows as <em>leading</em>.</div>
          )}
        </div>

        <div style={{ height: 100 }} />
      </div>

      <div className="form-cta">
        <button className="btn btn-primary btn-block btn-lg" onClick={save} disabled={!valid}
          style={!valid ? { opacity: 0.45, pointerEvents: 'none' } : null}>
          {isEdit ? 'Save changes' : 'Post ride'} <Icon name="chev" size={16} />
        </button>
      </div>
    </div>
  );
};

Object.assign(window, { RideForm, blankRide });
