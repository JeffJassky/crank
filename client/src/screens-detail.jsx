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

/* ---------- Day availability picker (allday + flex date, incl. tours) ---------- */
const DayAvailabilityGrid = ({ windowStart, windowEnd, tourDays, value, onChange }) => {
  const days = uM2(() => datesBetween(windowStart, windowEnd), [windowStart, windowEnd]);
  const set = uM2(() => new Set(value || []), [value]);
  const paintMode = uR2(null);
  const tourMode = (tourDays || 0) > 1;

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

  // contiguous run check vs tour length (only matters in tour mode)
  let bestRun = 0, run = 0;
  days.forEach(d => {
    if (set.has(d)) { run++; bestRun = Math.max(bestRun, run); }
    else run = 0;
  });
  const fits = tourMode ? (bestRun >= tourDays) : (set.size > 0);

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
        {tourMode
          ? <>Tour is <strong>{tourDays} days</strong> · window <strong>{shortDate(windowStart)}–{shortDate(windowEnd)}</strong> · tap or drag days you can crank</>
          : <>Window <strong>{shortDate(windowStart)}–{shortDate(windowEnd)}</strong> · tap or drag every day you could do this</>}
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
            {tourMode
              ? (fits ? ` — you can do the full ${tourDays}-day tour` : ` — not a full ${tourDays}-day stretch yet`)
              : ''}
          </span>
        </div>
      )}
      <div className="tw-hint">double-tap the grid to {set.size === days.length ? 'clear all' : 'mark all'}</div>
    </>
  );
};

/* ---------- Flexible-window picker (windowed + multi-date range) ---------- */
const FlexibleWindowGrid = ({ earliestDate, latestDate, windowStart, windowEnd, durationMin, value, onChange }) => {
  const dates = uM2(() => datesBetween(earliestDate, latestDate), [earliestDate, latestDate]);
  const slotsPerDay = uM2(() => slotsBetween(windowStart, windowEnd, 30), [windowStart, windowEnd]);
  const set = uM2(() => new Set(value || []), [value]);
  const paintMode = uR2(null);

  const startPaint = (k, e) => {
    e.preventDefault();
    const has = set.has(k);
    paintMode.current = has ? 'off' : 'on';
    const next = new Set(set);
    if (has) next.delete(k); else next.add(k);
    onChange([...next].sort());
  };
  const paintOver = (k) => {
    if (!paintMode.current) return;
    const next = new Set(set);
    if (paintMode.current === 'on') next.add(k); else next.delete(k);
    onChange([...next].sort());
  };
  const endPaint = () => { paintMode.current = null; };
  const handlePointerMove = (e) => {
    if (!paintMode.current) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const k = el?.closest?.('[data-slot]')?.dataset?.slot;
    if (k) paintOver(k);
  };

  return (
    <>
      <div className="tw-window">
        Window <strong>{shortDate(earliestDate)}–{shortDate(latestDate)}</strong> · daily{' '}
        <strong>{fmtTime(windowStart)}–{fmtTime(windowEnd)}</strong> · ride is{' '}
        <strong>{fmtDuration(durationMin)}</strong>
      </div>
      <div
        onPointerMove={handlePointerMove}
        onPointerUp={endPaint}
        onPointerCancel={endPaint}
        onPointerLeave={endPaint}
        style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none' }}
      >
        {dates.map(d => {
          const date = new Date(d + 'T12:00:00');
          const label = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
          return (
            <div key={d} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 6, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {label}
              </div>
              <div className="tw-grid">
                {slotsPerDay.map(s => {
                  const k = `${d} ${s}`;
                  return (
                    <div
                      key={s}
                      data-slot={k}
                      className={'tw-slot' + (set.has(k) ? ' on' : '')}
                      onPointerDown={(e) => startPaint(k, e)}
                      onClick={(e) => e.preventDefault()}
                    >
                      {fmtTime(s)}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {set.size > 0 && (
        <div className="tw-summary">
          <Icon name="check" size={14} stroke={2.2} style={{ color: 'var(--moss)' }} />
          <span>{set.size} slot{set.size === 1 ? '' : 's'} marked across the window</span>
        </div>
      )}
    </>
  );
};

/* ---------- Day heatmap (organizer view for tours) ---------- */
const DayHeatmap = ({ ride }) => {
  const days = uM2(() => datesBetween(earliestOf(ride), latestOf(ride)), [ride]);
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
  const singleRoute = routes.length === 1;
  const counts = routeVoteCounts(ride);
  const totalVotes = Object.values(counts).reduce((a, b) => a + b, 0);
  const maxVotes = Math.max(1, ...Object.values(counts));
  const myVote = (ride.routeVotes || {})[currentUser];
  const leader = leadingRoute(ride);

  return (
    <div className="route-options">
      {routes.map(rt => {
        const n = counts[rt.id] || 0;
        const isLead = !singleRoute && totalVotes > 0 && leader && rt.id === leader.id;
        const youVoted = myVote === rt.id;
        return (
          <div key={rt.id} className={`route-opt${isLead ? ' leading' : ''}${!singleRoute && youVoted ? ' you-voted' : ''}`}>
            <div className="route-opt-head">
              <h4 className="route-opt-name">{rt.name}</h4>
              {isLead && <span className="route-leading-badge">leading</span>}
            </div>
            {(rt.distanceMi || rt.mapQuery) && (
              <div className="route-opt-meta">
                {rt.distanceMi && <span>{rt.distanceMi} mi</span>}
                {rt.mapQuery && (
                  <a href={mapsLinkFor(rt.mapQuery)}
                    target="_blank" rel="noopener noreferrer">
                    <Icon name="map" size={11} /> Open in Maps
                  </a>
                )}
              </div>
            )}
            {rt.note && <p className="route-opt-note">{rt.note}</p>}
            {!singleRoute && (
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
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ---------- Detail screen ---------- */
const DetailScreen = ({ ride, currentUser, onBack, onEdit, onLockIn, onUnlock, toast }) => {
  const isProposer = ride.proposedBy === currentUser;
  const my = ride.rsvps?.[currentUser];
  const tour = isTour(ride);
  const flex = isFlexDate(ride);
  const win  = hasWindow(ride);
  const earliest = earliestOf(ride);
  const latest   = latestOf(ride);

  const [pickerSlots, setPickerSlots] = uS2(my?.slots || []);

  uE2(() => { setPickerSlots(my?.slots || []); }, [ride.id, my?.state]);

  const setState = (state) => {
    const slots = state === 'cant' ? [] : pickerSlots;
    window.Store.setRSVP(ride.id, currentUser, state, slots);
    toast(state === 'going' ? "You're in" : state === 'maybe' ? 'Marked maybe' : "Marked can't go");
  };

  const onSlotsChange = (next) => {
    setPickerSlots(next);
    const state = my?.state || (next.length ? 'going' : null);
    if (state) window.Store.setRSVP(ride.id, currentUser, state, next);
  };

  const recommended = uM2(() => recommendStart(ride), [ride]);  // { date, time } | null
  const { going, maybe, cant } = rsvpSummary(ride);
  const lead = leadingRoute(ride);
  const mapQ = ride.startAddress || ride.mapQuery;
  const mapSrc = mapsEmbedFor(mapQ);
  const mapHref = mapsLinkFor(mapQ);

  // Picker dispatch
  const open = ride.status === 'open' && my?.state && my.state !== 'cant';
  const showSlotPicker = open && win && !flex;
  const showDayPicker  = open && !win && (flex || tour);
  const showFlexPicker = open && win && flex;
  const showOrgSlotHeat = isProposer && win && !flex && (going.length + maybe.length > 0);
  const showOrgDayHeat  = isProposer && !win && (flex || tour) && (going.length + maybe.length > 0);

  // Lock-in card content
  let lockCard = null;
  if (ride.status !== 'locked' && isProposer && going.length + maybe.length > 0) {
    if (tour && recommended?.date) {
      const end = new Date(recommended.date + 'T12:00:00'); end.setDate(end.getDate() + ride.tourDays - 1);
      const endStr = end.toISOString().slice(0,10);
      lockCard = {
        title: `Lock the ${ride.tourDays}-day stretch`,
        body: 'When most folks have marked days, lock the dates so people can plan.',
        recommend: <><strong>{shortDate(recommended.date)}</strong> – <strong>{shortDate(endStr)}</strong> · best for the group</>,
        cta: 'Lock these dates',
        payload: recommended,
      };
    } else if (win && flex && recommended?.date && recommended?.time) {
      lockCard = {
        title: 'Lock the day and time',
        body: 'When most folks have weighed in, lock a date + start time so people can plan.',
        recommend: <><strong>{shortDate(recommended.date)}</strong> · <strong>{fmtTime(recommended.time)}</strong> · best for the group</>,
        cta: `Lock ${shortDate(recommended.date)} at ${fmtTime(recommended.time)}`,
        payload: recommended,
      };
    } else if (win && !flex && recommended?.time) {
      lockCard = {
        title: 'Pick the official time',
        body: 'When most folks have weighed in, lock a start time so people can plan.',
        recommend: <><strong>{fmtTime(recommended.time)}</strong> · best for the group</>,
        cta: `Lock in ${fmtTime(recommended.time)}`,
        payload: recommended,
      };
    } else if (!win && flex && !tour && recommended?.date) {
      lockCard = {
        title: 'Pick the day',
        body: 'When most folks have marked days, lock the official day.',
        recommend: <><strong>{shortDate(recommended.date)}</strong> · best for the group</>,
        cta: `Lock ${shortDate(recommended.date)}`,
        payload: recommended,
      };
    } else if (!win && !flex && going.length > 0) {
      lockCard = {
        title: 'Confirm this ride',
        body: 'Once enough folks are in, mark it confirmed so it stops feeling tentative.',
        cta: "Confirm it's a go",
        payload: null,
      };
    }
  }

  return (
    <div className="screen">
      <div className="app-header has-back">
        <button className="back-btn" onClick={onBack}><Icon name="back" size={20} /> Rides</button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="icon-btn" onClick={async () => {
            const url = window.location.href;
            if (navigator.share) {
              try { await navigator.share({ title: ride.title, url }); } catch (e) {}
            } else if (navigator.clipboard) {
              try { await navigator.clipboard.writeText(url); toast('Link copied'); } catch (e) {}
            }
          }} title="Share">
            <Icon name="share" size={16} />
          </button>
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
            <StatusPill ride={ride} />
            <span className="detail-by">
              {summarizeWhen(ride)} · by <strong style={{ color: 'var(--ink)' }}>{ride.proposedBy}</strong>
            </span>
          </div>
          <h1 className="detail-title">{ride.title}</h1>
          <p className="detail-desc">{ride.description}</p>
        </div>

        <div className="detail-stats">
          <div className="stat">
            <div className="stat-val">{ride.distanceMi || (lead?.distanceMi) || '—'}</div>
            <div className="stat-label">{tour ? 'miles total' : 'miles'}</div>
          </div>
          <div className="stat">
            <div className="stat-val">
              {tour ? `${ride.tourDays}d` : !win ? 'all day' : fmtDuration(ride.durationMin) || '—'}
            </div>
            <div className="stat-label">{tour ? 'tour length' : 'duration'}</div>
          </div>
          <div className="stat">
            <div className="stat-val">{going.length}</div>
            <div className="stat-label">cranking</div>
          </div>
        </div>

        {ride.status === 'locked' ? (
          <div className="locked-banner">
            <Icon name="lock" size={16} />
            <div>
              <strong>Locked · {summarizeWhen(ride)}</strong>
              {win && ride.durationMin ? ` · ~${fmtDuration(ride.durationMin)}` : ''}
              {isProposer && <> <button className="linkbtn" onClick={onUnlock}>Reopen</button></>}
            </div>
          </div>
        ) : lockCard ? (
          <div className="lockin-card">
            <h4>{lockCard.title}</h4>
            <p>{lockCard.body}</p>
            {lockCard.recommend && (
              <div className="recommend">
                <span>{lockCard.recommend}</span>
                <span className="badge">recommended</span>
              </div>
            )}
            <button className="btn btn-accent btn-block" onClick={() => onLockIn(lockCard.payload)}>
              <Icon name="lock" size={14} stroke={2.2} /> {lockCard.cta}
            </button>
          </div>
        ) : null}

        {ride.routes && ride.routes.length > 0 && (
          <div className="section-block">
            <h3>{ride.routes.length === 1 ? 'Route' : 'Route options · tap to vote'}</h3>
            <RouteOptions ride={ride} currentUser={currentUser} isProposer={isProposer} />
          </div>
        )}

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

        {showSlotPicker && (
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

        {showDayPicker && (
          <div className="section-block">
            <h3>{tour ? 'Which days work?' : 'Which days could you do this?'}</h3>
            <DayAvailabilityGrid
              windowStart={earliest}
              windowEnd={latest}
              tourDays={ride.tourDays || 1}
              value={pickerSlots}
              onChange={onSlotsChange}
            />
          </div>
        )}

        {showFlexPicker && (
          <div className="section-block">
            <h3>Which days and times work?</h3>
            <FlexibleWindowGrid
              earliestDate={earliest}
              latestDate={latest}
              windowStart={ride.windowStart}
              windowEnd={ride.windowEnd}
              durationMin={ride.durationMin}
              value={pickerSlots}
              onChange={onSlotsChange}
            />
          </div>
        )}

        {showOrgSlotHeat && (
          <div className="section-block">
            <h3>Group availability</h3>
            <Heatmap ride={ride} />
          </div>
        )}
        {showOrgDayHeat && (
          <div className="section-block">
            <h3>Group availability</h3>
            <DayHeatmap ride={ride} />
          </div>
        )}

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

        {mapSrc ? (
          <div className="map-frame" style={{ marginTop: 22 }}>
            <iframe src={mapSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Start location" />
          </div>
        ) : mapHref ? (
          <a href={mapHref} target="_blank" rel="noopener noreferrer" className="map-frame map-link" style={{ marginTop: 22 }}>
            <Icon name="map" size={20} />
            <span>Open meet point in Google Maps</span>
            <Icon name="chev" size={16} />
          </a>
        ) : null}

        <div className="section-block">
          <h3>Details</h3>
          <div className="kv-list">
            {ride.startAddress && <div className="kv"><span className="k">Meet address</span><span className="v" style={{ textAlign: 'right' }}>{ride.startAddress}</span></div>}
            <div className="kv"><span className="k">When</span>
              <span className="v" style={{ textAlign: 'right' }}>{summarizeWhen(ride)}</span></div>
            {(ride.distanceMi || lead?.distanceMi) && <div className="kv"><span className="k">Distance</span><span className="v">{ride.distanceMi || lead.distanceMi} mi · est.</span></div>}
            {!tour && ride.durationMin && <div className="kv"><span className="k">Duration</span><span className="v">{fmtDuration(ride.durationMin)}</span></div>}
            <div className="kv"><span className="k">Proposed</span><span className="v">{ride.proposedBy}</span></div>
          </div>
        </div>

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
};

Object.assign(window, { DetailScreen, AvailabilityGrid, Heatmap, RouteOptions, DayAvailabilityGrid, DayHeatmap, FlexibleWindowGrid });
