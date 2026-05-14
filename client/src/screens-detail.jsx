// Ride detail screen + availability picker.

const { useState: uS2, useEffect: uE2, useRef: uR2, useMemo: uM2, useCallback: uCb2 } = React;

/* ---------- Availability slot grid (tap + drag paint) ---------- */
const AvailabilityGrid = ({ window: w, durationMin, value, onChange }) => {
  const slots = uM2(() => slotsBetween(w.start, w.end, 30), [w.start, w.end]);
  const set = uM2(() => new Set(value || []), [value]);
  const paintMode = uR2(null); // 'on' | 'off'
  const lastTap = uR2(0);

  const toggle = (slot) => {
    const next = new Set(set);
    if (next.has(slot)) next.delete(slot);
    else next.add(slot);
    onChange([...next].sort());
  };

  const startPaint = (slot, e) => {
    e.preventDefault();
    const hasIt = set.has(slot);
    paintMode.current = hasIt ? 'off' : 'on';
    const next = new Set(set);
    if (hasIt) next.delete(slot); else next.add(slot);
    onChange([...next].sort());
  };
  const paintOver = (slot) => {
    if (!paintMode.current) return;
    const next = new Set(set);
    if (paintMode.current === 'on') next.add(slot); else next.delete(slot);
    onChange([...next].sort());
  };
  const endPaint = () => { paintMode.current = null; };

  const handlePointerMove = (e) => {
    if (!paintMode.current) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const slot = el?.closest?.('[data-slot]')?.dataset?.slot;
    if (slot) paintOver(slot);
  };

  const handleDoubleTap = () => {
    if (set.size === slots.length) onChange([]);
    else onChange([...slots]);
  };

  // estimate how many contiguous slots are selected & if it fits duration
  const needed = Math.ceil((durationMin || 60) / 30);
  let bestRun = 0, run = 0;
  slots.forEach(s => { if (set.has(s)) { run++; bestRun = Math.max(bestRun, run); } else run = 0; });
  const fits = bestRun >= needed;

  return (
    <>
      <div className="tw-window">
        Window <strong>{fmtTime(w.start)}–{fmtTime(w.end)}</strong> · ride is{' '}
        <strong>{fmtDuration(durationMin)}</strong> · tap or drag to mark when you can ride
      </div>
      <div
        className="tw-grid"
        onPointerMove={handlePointerMove}
        onPointerUp={endPaint}
        onPointerCancel={endPaint}
        onPointerLeave={endPaint}
        onDoubleClick={handleDoubleTap}
      >
        {slots.map(s => (
          <div
            key={s}
            data-slot={s}
            className={'tw-slot' + (set.has(s) ? ' on' : '')}
            onPointerDown={(e) => startPaint(s, e)}
            onClick={(e) => e.preventDefault()}
          >
            {fmtTime(s)}
          </div>
        ))}
      </div>
      {set.size > 0 && (
        <div className="tw-summary">
          <Icon name={fits ? 'check' : 'q'} size={14} stroke={2.2}
            style={{ color: fits ? 'var(--moss)' : 'var(--warn)' }} />
          <span>
            {set.size} slot{set.size === 1 ? '' : 's'} selected
            {fits ? ' — fits the full ride 👍' : ' — not quite a continuous window yet'}
          </span>
        </div>
      )}
      <div className="tw-hint">double-tap the grid to {set.size === slots.length ? 'clear all' : 'mark all'}</div>
    </>
  );
};

/* ---------- Organizer heatmap ---------- */
const Heatmap = ({ ride }) => {
  const heat = uM2(() => slotHeat(ride), [ride]);
  if (!heat.length) return null;
  const max = Math.max(1, ...heat.map(h => h.score));
  const tint = (n) => {
    if (n === 0) return 'var(--sand)';
    const t = n / max;
    // moss with alpha
    return `rgba(107,142,90,${0.25 + t * 0.7})`;
  };

  // chunk into rows of 12
  const rows = [];
  for (let i = 0; i < heat.length; i += 12) rows.push(heat.slice(i, i + 12));

  return (
    <div className="heat">
      {rows.map((row, ri) => (
        <div key={ri} className="heat-row">
          <span style={{ letterSpacing: '0.04em' }}>{fmtTime(row[0].slot)}–{fmtTime(row[row.length-1].slot)}</span>
          <div className="heat-cells">
            {row.map(({ slot, score }) => (
              <div key={slot} className="heat-cell" style={{ background: tint(score) }} title={`${slot} · ${score}`} />
            ))}
          </div>
        </div>
      ))}
      <div className="heat-legend">
        <span>fewer</span>
        <span className="heat-swatches">
          {[0, 0.25, 0.5, 0.75, 1].map(v => (
            <span key={v} className="heat-swatch" style={{ background: v === 0 ? 'var(--sand)' : `rgba(107,142,90,${0.25 + v * 0.7})` }} />
          ))}
        </span>
        <span>more available</span>
      </div>
    </div>
  );
};

/* ---------- Day availability picker (for tours) ---------- */
const DayAvailabilityGrid = ({ windowStart, windowEnd, tourDays, value, onChange }) => {
  const days = uM2(() => datesBetween(windowStart, windowEnd), [windowStart, windowEnd]);
  const set = uM2(() => new Set(value || []), [value]);
  const paintMode = uR2(null);

  const startPaint = (day, e) => {
    e.preventDefault();
    const has = set.has(day);
    paintMode.current = has ? 'off' : 'on';
    const next = new Set(set);
    if (has) next.delete(day); else next.add(day);
    onChange([...next].sort());
  };
  const paintOver = (day) => {
    if (!paintMode.current) return;
    const next = new Set(set);
    if (paintMode.current === 'on') next.add(day); else next.delete(day);
    onChange([...next].sort());
  };
  const endPaint = () => { paintMode.current = null; };
  const handlePointerMove = (e) => {
    if (!paintMode.current) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const d = el?.closest?.('[data-day]')?.dataset?.day;
    if (d) paintOver(d);
  };
  const handleDoubleTap = () => {
    if (set.size === days.length) onChange([]);
    else onChange([...days]);
  };

  // contiguous run check vs tour length
  let bestRun = 0, run = 0;
  days.forEach(d => {
    if (set.has(d)) { run++; bestRun = Math.max(bestRun, run); }
    else run = 0;
  });
  const fits = bestRun >= tourDays;

  // group by month for friendlier display
  const groups = [];
  days.forEach(d => {
    const date = new Date(d + 'T12:00:00');
    const key = date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    let g = groups.find(x => x.key === key);
    if (!g) { g = { key, label: key, days: [] }; groups.push(g); }
    g.days.push(d);
  });

  return (
    <>
      <div className="tw-window">
        Tour is <strong>{tourDays} days</strong> · window <strong>{shortDate(windowStart)}–{shortDate(windowEnd)}</strong> · tap or drag days you can crank
      </div>
      <div
        onPointerMove={handlePointerMove}
        onPointerUp={endPaint}
        onPointerCancel={endPaint}
        onPointerLeave={endPaint}
        onDoubleClick={handleDoubleTap}
        style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none' }}
      >
        {groups.map(g => (
          <div key={g.key} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 6 }}>
              {g.label}
            </div>
            <div className="day-grid">
              {g.days.map(d => {
                const date = new Date(d + 'T12:00:00');
                return (
                  <div
                    key={d}
                    data-day={d}
                    className={'day-cell' + (set.has(d) ? ' on' : '')}
                    onPointerDown={(e) => startPaint(d, e)}
                    onClick={(e) => e.preventDefault()}
                  >
                    <span className="day-cell-dow">{date.toLocaleDateString(undefined, { weekday: 'short' }).slice(0,3)}</span>
                    <span className="day-cell-num">{date.getDate()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {set.size > 0 && (
        <div className="tw-summary">
          <Icon name={fits ? 'check' : 'q'} size={14} stroke={2.2}
            style={{ color: fits ? 'var(--moss)' : 'var(--warn)' }} />
          <span>
            {set.size} day{set.size === 1 ? '' : 's'} marked
            {fits ? ` — you can do the full ${tourDays}-day tour` : ` — not a full ${tourDays}-day stretch yet`}
          </span>
        </div>
      )}
      <div className="tw-hint">double-tap the grid to {set.size === days.length ? 'clear all' : 'mark all'}</div>
    </>
  );
};

/* ---------- Day heatmap (organizer view for tours) ---------- */
const DayHeatmap = ({ ride }) => {
  const days = uM2(() => datesBetween(ride.date, ride.endDate), [ride.date, ride.endDate]);
  if (!days.length) return null;
  const rs = ride.rsvps || {};
  const scores = days.map(d => {
    let n = 0;
    Object.values(rs).forEach(({ state, slots: us }) => {
      if (state === 'cant') return;
      if ((us || []).includes(d)) n += (state === 'going' ? 1 : 0.5);
    });
    return { day: d, score: n };
  });
  const max = Math.max(1, ...scores.map(s => s.score));
  const tint = (n) => n === 0 ? 'var(--sand)' : `rgba(107,142,90,${0.25 + (n / max) * 0.7})`;

  // show best window highlight
  const tourDays = ride.tourDays || 2;
  let bestI = 0, bestSum = -1;
  for (let i = 0; i + tourDays <= scores.length; i++) {
    const sum = scores.slice(i, i + tourDays).reduce((a, b) => a + b.score, 0);
    if (sum > bestSum) { bestSum = sum; bestI = i; }
  }

  return (
    <div>
      <div className="day-heat">
        {scores.map(({ day, score }, i) => {
          const inBest = bestSum > 0 && i >= bestI && i < bestI + tourDays;
          const date = new Date(day + 'T12:00:00');
          return (
            <div key={day} className={'day-heat-cell' + (inBest ? ' best' : '')}
              style={{ background: tint(score) }} title={`${day} · ${score}`}>
              <span className="dh-dow">{date.toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
              <span className="dh-num">{date.getDate()}</span>
            </div>
          );
        })}
      </div>
      <div className="heat-legend" style={{ marginTop: 12 }}>
        <span>fewer</span>
        <span className="heat-swatches">
          {[0, 0.25, 0.5, 0.75, 1].map(v => (
            <span key={v} className="heat-swatch" style={{ background: v === 0 ? 'var(--sand)' : `rgba(107,142,90,${0.25 + v * 0.7})` }} />
          ))}
        </span>
        <span>more available</span>
      </div>
    </div>
  );
};

/* ---------- Route options + voting ---------- */
const RouteOptions = ({ ride, currentUser, isProposer }) => {
  const routes = ride.routes || [];
  if (routes.length === 0) return null;
  const counts = routeVoteCounts(ride);
  const totalVotes = Object.values(counts).reduce((a, b) => a + b, 0);
  const maxVotes = Math.max(1, ...Object.values(counts));
  const myVote = (ride.routeVotes || {})[currentUser];
  const leader = leadingRoute(ride);

  return (
    <div className="route-options">
      {routes.map(rt => {
        const n = counts[rt.id] || 0;
        const isLead = totalVotes > 0 && leader && rt.id === leader.id;
        const youVoted = myVote === rt.id;
        return (
          <div key={rt.id} className={`route-opt${isLead ? ' leading' : ''}${youVoted ? ' you-voted' : ''}`}>
            <div className="route-opt-head">
              <h4 className="route-opt-name">{rt.name}</h4>
              {isLead && <span className="route-leading-badge">leading</span>}
            </div>
            {(rt.distanceMi || rt.mapQuery) && (
              <div className="route-opt-meta">
                {rt.distanceMi && <span>{rt.distanceMi} mi</span>}
                {rt.mapQuery && (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rt.mapQuery)}`}
                    target="_blank" rel="noopener noreferrer">
                    <Icon name="map" size={11} /> Open in Maps
                  </a>
                )}
              </div>
            )}
            {rt.note && <p className="route-opt-note">{rt.note}</p>}
            <div className="route-opt-foot">
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="route-bar">
                  <div className="route-bar-fill" style={{ width: totalVotes ? `${(n / maxVotes) * 100}%` : '0%' }} />
                </div>
                <span style={{ fontSize: 12, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums', minWidth: 56, textAlign: 'right' }}>
                  {n} {n === 1 ? 'vote' : 'votes'}
                </span>
              </div>
              <button
                className={'route-vote-btn' + (youVoted ? ' voted' : '')}
                onClick={() => window.Store.setRouteVote(ride.id, currentUser, rt.id)}>
                {youVoted ? <><Icon name="check" size={12} stroke={2.4} /> Voted</> : 'Vote'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ---------- Detail screen ---------- */
const DetailScreen = ({ ride, currentUser, onBack, onEdit, onLockIn, onUnlock, onDelete, toast }) => {
  const isProposer = ride.proposedBy === currentUser;
  const my = ride.rsvps?.[currentUser];
  const multi = isMultiDay(ride);
  const [pickerSlots, setPickerSlots] = uS2(my?.slots || []);
  const [confirmDelete, setConfirmDelete] = uS2(false);

  uE2(() => { setPickerSlots(my?.slots || []); }, [ride.id, my?.state]);

  const setState = (state) => {
    const slots = state === 'cant' ? [] : pickerSlots;
    window.Store.setRSVP(ride.id, currentUser, state, slots);
    toast(state === 'going' ? "You're in" : state === 'maybe' ? 'Marked maybe' : "Marked can't go");
  };

  const onSlotsChange = (next) => {
    setPickerSlots(next);
    // auto-update server-side as user paints
    const state = my?.state || (next.length ? 'going' : null);
    if (state) window.Store.setRSVP(ride.id, currentUser, state, next);
  };

  const recommended = uM2(() => recommendStart(ride), [ride]);
  const { going, maybe, cant } = rsvpSummary(ride);
  const lead = leadingRoute(ride);
  const mapQ = (lead?.mapQuery) || ride.mapQuery;
  const mapSrc = mapQ ? `https://www.google.com/maps?q=${encodeURIComponent(mapQ)}&output=embed` : null;
  const showTimePicker = ride.mode === 'window' && ride.status === 'open' && !multi;
  const showDayPicker = multi && ride.status === 'open';

  // formatted lock label depending on ride kind
  const fmtLocked = () => {
    if (!ride.lockedStart) return '';
    if (multi) {
      const start = new Date(ride.lockedStart + 'T12:00:00');
      const end = new Date(start); end.setDate(end.getDate() + (ride.tourDays - 1));
      return `${shortDate(ride.lockedStart)}–${shortDate(end.toISOString().slice(0,10))}`;
    }
    return fmtTime(ride.lockedStart);
  };

  return (
    <div className="screen">
      <div className="app-header has-back">
        <button className="back-btn" onClick={onBack}><Icon name="back" size={20} /> Rides</button>
        <div style={{ display: 'flex', gap: 8 }}>
          {isProposer && (
            <button className="icon-btn" onClick={onEdit} title="Edit">
              <Icon name="edit" size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="screen-scroll">
        <div className="detail-hero">
          <div className="detail-eyebrow">
            <StatusPill status={ride.status} lockedStart={ride.lockedStart} multi={multi} />
            <span className="detail-by">
              {multi
                ? (ride.status === 'locked'
                  ? `${fmtLocked()} · by `
                  : `${ride.tourDays}-day tour · window ${shortDate(ride.date)}–${shortDate(ride.endDate)} · by `)
                : `${longDate(ride.date)} · by `}
              <strong style={{ color: 'var(--ink)' }}>{ride.proposedBy}</strong>
            </span>
          </div>
          <h1 className="detail-title">{ride.title}</h1>
          <p className="detail-desc">{ride.description}</p>
        </div>

        <div className="detail-stats">
          <div className="stat">
            <div className="stat-val">{ride.distanceMi || (lead?.distanceMi) || '—'}</div>
            <div className="stat-label">{multi ? 'miles total' : 'miles'}</div>
          </div>
          <div className="stat">
            <div className="stat-val">
              {multi
                ? `${ride.tourDays}d`
                : ride.mode === 'allday' ? 'all day' : fmtDuration(ride.durationMin) || '—'}
            </div>
            <div className="stat-label">{multi ? 'tour length' : 'duration'}</div>
          </div>
          <div className="stat">
            <div className="stat-val">{going.length}</div>
            <div className="stat-label">cranking</div>
          </div>
        </div>

        {/* lock-in banner */}
        {ride.status === 'locked' ? (
          <div className="locked-banner">
            <Icon name="lock" size={16} />
            <div>
              <strong>{multi ? `Locked: ${fmtLocked()}` : `Locked in for ${fmtTime(ride.lockedStart)}.`}</strong>
              {' '}{!multi && ride.mode === 'window' && `Ride is ~${fmtDuration(ride.durationMin)}.`}
              {isProposer && <> <button className="linkbtn" onClick={onUnlock}>Reopen</button></>}
            </div>
          </div>
        ) : (isProposer && !multi && ride.mode === 'window' && going.length + maybe.length > 0 && recommended) ? (
          <div className="lockin-card">
            <h4>Pick the official time</h4>
            <p>You proposed this — when most folks have weighed in, lock a start time so people can plan.</p>
            <div className="recommend">
              <span><strong>{fmtTime(recommended)}</strong> · best for the group</span>
              <span className="badge">recommended</span>
            </div>
            <button className="btn btn-accent btn-block" onClick={() => onLockIn(recommended)}>
              <Icon name="lock" size={14} stroke={2.2} /> Lock in {fmtTime(recommended)}
            </button>
          </div>
        ) : (isProposer && multi && going.length + maybe.length > 0 && recommended) ? (
          <div className="lockin-card">
            <h4>Pick the {ride.tourDays}-day stretch</h4>
            <p>You proposed this — when most folks have marked days, lock the official window so people can plan.</p>
            <div className="recommend">
              <span>
                <strong>{shortDate(recommended)}</strong>
                {' '}–{' '}
                <strong>{(() => {
                  const s = new Date(recommended + 'T12:00:00'); s.setDate(s.getDate() + ride.tourDays - 1);
                  return shortDate(s.toISOString().slice(0,10));
                })()}</strong>
                {' '}· best for the group
              </span>
              <span className="badge">recommended</span>
            </div>
            <button className="btn btn-accent btn-block" onClick={() => onLockIn(recommended)}>
              <Icon name="lock" size={14} stroke={2.2} /> Lock these dates
            </button>
          </div>
        ) : (isProposer && !multi && ride.mode === 'allday' && going.length > 0) ? (
          <div className="lockin-card">
            <h4>Confirm this ride</h4>
            <p>Once enough folks are in, mark it confirmed so it stops feeling tentative.</p>
            <button className="btn btn-accent btn-block" onClick={() => onLockIn(null)}>
              <Icon name="lock" size={14} stroke={2.2} /> Confirm it's a go
            </button>
          </div>
        ) : null}

        {mapSrc && (
          <div className="map-frame">
            <iframe
              src={mapSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Start location"
            />
          </div>
        )}

        {/* Routes + voting */}
        {ride.routes && ride.routes.length > 0 && (
          <div className="section-block">
            <h3>Route options · tap to vote</h3>
            <RouteOptions ride={ride} currentUser={currentUser} isProposer={isProposer} />
          </div>
        )}

        {/* RSVP segmented */}
        <div className="section-block">
          <h3>Crankin'?</h3>
          <div className="rsvp-seg">
            {[
              { val: 'going', label: 'Going', icon: 'check' },
              { val: 'maybe', label: 'Maybe', icon: 'q' },
              { val: 'cant',  label: 'Diarrhea',  icon: 'x' },
            ].map(opt => (
              <button
                key={opt.val}
                className="rsvp-opt"
                data-val={opt.val}
                data-active={my?.state === opt.val}
                onClick={() => setState(opt.val)}
              >
                <span className="rsvp-icon"><Icon name={opt.icon} size={14} stroke={2.2} /></span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* time-slot picker (single-day window rides) */}
        {showTimePicker && my?.state && my.state !== 'cant' && (
          <div className="section-block">
            <h3>When can you crank?</h3>
            <AvailabilityGrid
              window={{ start: ride.windowStart, end: ride.windowEnd }}
              durationMin={ride.durationMin}
              value={pickerSlots}
              onChange={onSlotsChange}
            />
          </div>
        )}

        {/* day picker (tours) */}
        {showDayPicker && my?.state && my.state !== 'cant' && (
          <div className="section-block">
            <h3>Which days work?</h3>
            <DayAvailabilityGrid
              windowStart={ride.date}
              windowEnd={ride.endDate}
              tourDays={ride.tourDays}
              value={pickerSlots}
              onChange={onSlotsChange}
            />
          </div>
        )}

        {/* organizer heatmaps */}
        {showTimePicker && isProposer && (going.length + maybe.length > 0) && (
          <div className="section-block">
            <h3>Group availability</h3>
            <Heatmap ride={ride} />
          </div>
        )}
        {showDayPicker && isProposer && (going.length + maybe.length > 0) && (
          <div className="section-block">
            <h3>Group availability</h3>
            <DayHeatmap ride={ride} />
          </div>
        )}

        {/* attendees list */}
        <div className="section-block">
          <h3>Who's cranking ({going.length + maybe.length})</h3>
          <div className="attendees">
            {[...going.map(u => ({ u, s: 'going' })),
              ...maybe.map(u => ({ u, s: 'maybe' })),
              ...cant.map(u => ({ u, s: 'cant' }))].map(({ u, s }) => (
              <div className="attendee-row" key={u + s}>
                <Avatar name={u} size={32} />
                <span className="attendee-name">
                  {u}{u === currentUser && <span className="you">(you)</span>}
                </span>
                <span className={`attendee-status ${s}`}>{s === 'going' ? 'Going' : s === 'maybe' ? 'Maybe' : 'Diarrhea'}</span>
              </div>
            ))}
            {(going.length + maybe.length + cant.length) === 0 && (
              <div className="empty">No responses yet. First on the chain gang gets bragging rights.</div>
            )}
          </div>
        </div>

        {/* details */}
        <div className="section-block">
          <h3>Details</h3>
          <div className="kv-list">
            <div className="kv"><span className="k">When</span>
              <span className="v" style={{ textAlign: 'right' }}>
                {multi
                  ? (ride.status === 'locked'
                      ? fmtLocked()
                      : `${ride.tourDays}-day · search ${shortDate(ride.date)}–${shortDate(ride.endDate)}`)
                  : `${longDate(ride.date)}${ride.status === 'locked' ? ` · ${fmtTime(ride.lockedStart)}` : ride.mode === 'window' ? ` · ${fmtTime(ride.windowStart)}–${fmtTime(ride.windowEnd)}` : ' · all day'}`}
              </span></div>
            {(ride.distanceMi || lead?.distanceMi) && <div className="kv"><span className="k">Distance</span><span className="v">{ride.distanceMi || lead.distanceMi} mi · est.</span></div>}
            {!multi && ride.durationMin && <div className="kv"><span className="k">Duration</span><span className="v">{fmtDuration(ride.durationMin)}</span></div>}
            {ride.startAddress && <div className="kv"><span className="k">Meat address</span><span className="v" style={{ textAlign: 'right' }}>{ride.startAddress}</span></div>}
            <div className="kv"><span className="k">Proposed</span><span className="v">{ride.proposedBy}</span></div>
          </div>
        </div>

        {/* danger zone — only proposer */}
        {isProposer && (
          <div className="section-block" style={{ paddingBottom: 24 }}>
            {!confirmDelete ? (
              <button className="btn btn-ghost btn-block" onClick={() => setConfirmDelete(true)} style={{ color: 'var(--danger)', borderColor: 'var(--hair)' }}>
                Cancel this crank
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmDelete(false)}>Keep</button>
                <button className="btn" style={{ flex: 1, background: 'var(--danger)', color: 'var(--bg)' }} onClick={() => onDelete()}>Yes, kill it</button>
              </div>
            )}
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
};

Object.assign(window, { DetailScreen, AvailabilityGrid, Heatmap, RouteOptions, DayAvailabilityGrid, DayHeatmap });
