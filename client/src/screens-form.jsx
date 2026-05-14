// Propose + Edit ride form (shared component).

const { useState: uS3, useMemo: uM3, useEffect: uE3 } = React;

const blankRide = (user) => {
  const today = new Date();
  const d = new Date(today);
  d.setDate(d.getDate() + 3);
  return {
    id: 'r' + Math.random().toString(36).slice(2, 8),
    title: '',
    description: '',
    date: d.toISOString().slice(0,10),
    endDate: null,
    tourDays: null,
    mode: 'window',
    windowStart: '09:00',
    windowEnd: '13:00',
    durationMin: 120,
    distanceMi: '',
    startAddress: '',
    mapQuery: '',
    status: 'open',
    lockedStart: null,
    proposedBy: user,
    createdAt: Date.now(),
    routes: [],
    routeVotes: {},
    rsvps: { [user]: { state: 'going', slots: [] } },
  };
};

const newRouteId = () => 'rt' + Math.random().toString(36).slice(2, 7);

const minToHHMM = (m) => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;

const hourOptions = (() => {
  const out = [];
  for (let h = 5; h <= 22; h++) for (let m of [0, 30]) {
    const v = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    out.push({ v, label: fmtTime(v) });
  }
  return out;
})();

const durationOptions = [
  { v: 30, label: '30 min' },
  { v: 60, label: '1 hour' },
  { v: 90, label: '1h 30m' },
  { v: 120, label: '2 hours' },
  { v: 150, label: '2h 30m' },
  { v: 180, label: '3 hours' },
  { v: 240, label: '4 hours' },
  { v: 300, label: '5 hours' },
  { v: 360, label: '6 hours' },
];

const RideForm = ({ initial, isEdit, currentUser, onCancel, onSave }) => {
  const [draft, setDraft] = uS3(initial || blankRide(currentUser));
  const set = (patch) => setDraft(d => ({ ...d, ...patch }));
  const multi = isTour(draft);

  const valid = draft.title.trim().length > 0 &&
    draft.date &&
    (multi
      ? (draft.endDate && draft.endDate >= draft.date && draft.tourDays >= 2
         && (Math.round((new Date(draft.endDate+'T12:00:00') - new Date(draft.date+'T12:00:00'))/86400000) + 1) >= draft.tourDays)
      : (draft.mode === 'allday' || (draft.windowStart < draft.windowEnd && draft.durationMin)));

  const setFormat = (fmt) => {
    if (fmt === 'single-window') set({ endDate: null, tourDays: null, mode: 'window' });
    else if (fmt === 'single-allday') set({ endDate: null, tourDays: null, mode: 'allday' });
    else if (fmt === 'multi') {
      // default: 3-day tour, 14-day search window
      const start = new Date(draft.date + 'T12:00:00');
      const end = new Date(start); end.setDate(end.getDate() + 13);
      set({ tourDays: 3, endDate: end.toISOString().slice(0,10), mode: 'allday' });
    }
  };
  const currentFormat = multi ? 'multi' : (draft.mode === 'window' ? 'single-window' : 'single-allday');

  const windowSpanDays = multi
    ? Math.round((new Date(draft.endDate + 'T12:00:00') - new Date(draft.date + 'T12:00:00')) / 86400000) + 1
    : 0;
  const setWindowSpan = (n) => {
    const start = new Date(draft.date + 'T12:00:00');
    const end = new Date(start); end.setDate(end.getDate() + (n - 1));
    set({ endDate: end.toISOString().slice(0,10) });
  };

  // Route editor
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
    if (next.startAddress && !next.mapQuery) next.mapQuery = next.startAddress;
    if (next.distanceMi === '' || next.distanceMi === null) delete next.distanceMi;
    else next.distanceMi = Number(next.distanceMi);
    // clean routes
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
          <label>Format</label>
          <div className="format-grid">
            <button type="button" className={'fmt-opt' + (currentFormat === 'single-window' ? ' active' : '')}
              onClick={() => setFormat('single-window')}>
              <span className="fmt-opt-title">Single day</span>
              <span className="fmt-opt-sub">in a time window</span>
            </button>
            <button type="button" className={'fmt-opt' + (currentFormat === 'single-allday' ? ' active' : '')}
              onClick={() => setFormat('single-allday')}>
              <span className="fmt-opt-title">Single day</span>
              <span className="fmt-opt-sub">all day</span>
            </button>
            <button type="button" className={'fmt-opt' + (currentFormat === 'multi' ? ' active' : '')}
              onClick={() => setFormat('multi')}>
              <span className="fmt-opt-title">Tour</span>
              <span className="fmt-opt-sub">multi-day</span>
            </button>
          </div>
        </div>

        <div className="form-row">
          <label>{multi ? 'Earliest possible start' : 'Date'}</label>
          <input className="input" type="date" value={draft.date}
            min={window.Store.todayISO()}
            onChange={e => {
              const v = e.target.value;
              const patch = { date: v };
              if (multi) {
                // keep window length stable, recompute endDate
                const end = new Date(v + 'T12:00:00');
                end.setDate(end.getDate() + (windowSpanDays - 1));
                patch.endDate = end.toISOString().slice(0,10);
              }
              set(patch);
            }} />
        </div>

        {multi && (
          <>
            <div className="form-row">
              <label>How long is the tour</label>
              <select className="input" value={draft.tourDays || 3}
                onChange={e => set({ tourDays: Number(e.target.value) })}>
                {[2,3,4,5,6,7,8,10,12,14].map(n => (
                  <option key={n} value={n}>{n} days</option>
                ))}
              </select>
              <div className="helper">Length of the tour itself — folks vote on which {draft.tourDays}-day stretch works.</div>
            </div>
            <div className="form-row">
              <label>Search window <span style={{ textTransform: 'none', letterSpacing: 'normal', color: 'var(--ink-3)', fontSize: 11 }}>· how far out to look</span></label>
              <select className="input" value={windowSpanDays || 14}
                onChange={e => setWindowSpan(Number(e.target.value))}>
                {[7, 10, 14, 21, 28, 35, 42, 56].map(n => (
                  <option key={n} value={n}>{n} days ({n / 7} {n / 7 === 1 ? 'week' : 'weeks'})</option>
                ))}
              </select>
              <div className="helper">
                Riders mark which days they're available in this window. We'll find the best{' '}
                {draft.tourDays}-day block.
              </div>
            </div>
          </>
        )}

        {!multi && draft.mode === 'window' && (
          <div className="form-row">
            <label>Time window & duration</label>
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

        <div className="form-row" style={{ marginBottom: 0 }}>
          <label>Distance <span style={{ textTransform: 'none', letterSpacing: 'normal', color: 'var(--ink-3)', fontSize: 11 }}>· estimated, optional</span></label>
          <input className="input" type="number" inputMode="decimal" value={draft.distanceMi}
            placeholder="e.g. 24 mi"
            onChange={e => set({ distanceMi: e.target.value })} />
        </div>

        <div className="form-row" style={{ marginTop: 16 }}>
          <label>Meat address <span style={{ textTransform: 'none', letterSpacing: 'normal', color: 'var(--ink-3)', fontSize: 11 }}>· where we meet</span></label>
          <input className="input" value={draft.startAddress}
            placeholder="Coffee shop, park, intersection…"
            onChange={e => set({ startAddress: e.target.value })} />
          <div className="helper">We'll embed a map of this spot — unless a route below has its own location.</div>
        </div>

        {/* Route options editor */}
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
                <input className="input" placeholder="Short note (optional) — e.g. ‘adds the climb up the lodge’"
                  value={rt.note || ''} onChange={e => updateRoute(rt.id, { note: e.target.value })} />
                <input className="input" placeholder="Map location or area (optional) — e.g. ‘Skyline Blvd, Portland’"
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

        {isEdit && draft.status === 'locked' && !multi && (
          <div className="form-row" style={{ marginTop: 16 }}>
            <label>Locked start time</label>
            <select className="input" value={draft.lockedStart || ''}
              onChange={e => set({ lockedStart: e.target.value })}>
              {hourOptions.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
            </select>
          </div>
        )}

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
