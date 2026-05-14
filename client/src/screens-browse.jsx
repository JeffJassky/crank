// Username gate + Browse screen + ride card.

const { useState: uS1, useEffect: uE1, useMemo: uM1 } = React;

/* ---------- Username gate ---------- */
const UsernameGate = ({ onEnter }) => {
  const [name, setName] = uS1('');
  const [error, setError] = uS1('');
  const submit = (e) => {
    e.preventDefault();
    const v = name.trim();
    if (v.length < 2) { setError('At least 2 characters.'); return; }
    if (!/^[a-zA-Z0-9_\-() ]+$/.test(v)) { setError('Letters, numbers, spaces, parens, dashes & underscores only.'); return; }
    const u = window.Store.setUser(v);
    onEnter(u);
  };

  return (
    <div className="gate">
      <div className="gate-mark">
        <span className="badge"><Icon name="bike" size={14} /></span>
        <span>Bikey Boys</span>
      </div>
      <h1>
        Show up.<br />
        Crank <em>hogs.</em>
      </h1>
      <p className="lede">
        A tiny ride board for the group. Propose something, tap the times you can crank,
        and we’ll find when everyone’s actually free.
      </p>

      <form className="gate-form" onSubmit={submit}>
        <label className="gate-label" htmlFor="name">Pick a username</label>
        <input
          id="name"
          className="gate-input"
          placeholder="e.g. maeve, theo, rin…"
          autoCapitalize="none"
          autoCorrect="off"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(''); }}
          autoFocus
        />
        {error
          ? <div className="gate-foot" style={{ color: 'var(--danger)' }}>{error}</div>
          : <div className="gate-foot">No password — your username is your handle for everyone on the board. Use the same one across devices to find your hog.</div>}
        <div style={{ height: 18 }} />
        <button className="btn btn-primary btn-block btn-lg" type="submit">
          Crank on <Icon name="chev" size={16} />
        </button>
      </form>
    </div>
  );
};

/* ---------- Ride card ---------- */
const StatusPill = ({ ride }) => {
  const tour = isTour(ride);
  const flex = isFlexDate(ride);
  if (ride.status === 'locked') return (
    <span className="status-pill locked">
      <Icon name="lock" size={11} stroke={2.2} />
      {summarizeWhen(ride)}
    </span>
  );
  if (ride.status === 'past') return <span className="status-pill past">Past</span>;
  const sub = tour ? 'Open · gathering RSVPs' : flex ? 'Open · find a date' : hasWindow(ride) ? 'Open · find a time' : 'Open';
  return <span className="status-pill open"><span className="dot" />{sub}</span>;
};

const RideCard = ({ ride, onClick, currentUser }) => {
  const { going, maybe } = rsvpSummary(ride);
  const total = going.length + maybe.length;
  const youGoing = ride.rsvps?.[currentUser]?.state;
  const tour = isTour(ride);
  const flex = isFlexDate(ride);
  const timeBit = summarizeWhen(ride);

  const dispGoing = going.slice(0, 3);
  const lead = leadingRoute(ride);
  const counts = routeVoteCounts(ride);
  const totalVotes = Object.values(counts).reduce((a, b) => a + b, 0);
  const distanceDisplay = lead?.distanceMi ?? ride.distanceMi;

  return (
    <article
      className={`ride-card ${ride.status}`}
      onClick={() => onClick(ride.id)}
      role="button"
      tabIndex={0}
    >
      <div className="ride-card-top">
        <h3 className="ride-title">{ride.title}</h3>
        <StatusPill ride={ride} />
      </div>
      <p className="ride-desc">{ride.description}</p>
      <div className="ride-meta">
        <span className="ride-meta-item">
          <Icon name={(tour || flex) ? 'cal' : 'clock'} size={13} />{timeBit}
        </span>
        {distanceDisplay && <span className="ride-meta-item"><Icon name="ruler" size={13} />{distanceDisplay} mi</span>}
        {ride.startAddress && <span className="ride-meta-item"><Icon name="pin" size={13} />{ride.startAddress.split(',')[0]}</span>}
      </div>

      {ride.routes && ride.routes.length > 0 && (
        <div className="route-chip">
          <Icon name="map" size={12} />
          <span className="route-chip-name">
            {ride.routes.length === 1
              ? <strong>{ride.routes[0].name}</strong>
              : <>
                  {ride.routes.length} routes
                  {lead && totalVotes > 0 ? <> · leading: <strong>{lead.name}</strong></> : <> · vote open</>}
                </>
            }
          </span>
        </div>
      )}

      <div className="ride-footer">
        <div className="rsvp-count">
          {total > 0 ? (
            <>
              <span className="avatars">
                {dispGoing.map(u => <Avatar key={u} name={u} />)}
                {total > 3 && <span className="avatar more">+{total - 3}</span>}
              </span>
              <span>{going.length} going{maybe.length ? ` · ${maybe.length} maybe` : ''}</span>
            </>
          ) : (
            <span style={{ color: 'var(--ink-3)' }}>First on the chain gang</span>
          )}
        </div>
        {youGoing && (
          <span className={`attendee-status ${youGoing}`}>{youGoing === 'going' ? "You're cranking" : youGoing === 'maybe' ? 'You: maybe' : 'Diarrhea'}</span>
        )}
      </div>
    </article>
  );
};

/* ---------- Browse ---------- */
const groupLabels = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  thisWeek: 'This week',
  nextWeek: 'Next week',
  later: 'Later',
  past: 'Past rides',
};

const BrowseScreen = ({ rides, currentUser, onOpenRide, onPropose, onOpenProfile }) => {
  const grouped = uM1(() => groupRides(rides), [rides]);
  const order = ['today','tomorrow','thisWeek','nextWeek','later','past'];

  const yourActive = rides.filter(r =>
    r.proposedBy === currentUser || r.rsvps?.[currentUser]
  ).length;

  return (
    <div className="screen">
      <div className="app-header">
        <div>
          <div className="app-header-title">Cranks</div>
          <div className="app-header-sub">{rides.length} on the board · {yourActive} with you</div>
        </div>
        <button className="identity-chip" onClick={onOpenProfile}>
          <Avatar name={currentUser} size={24} />
          <span>{currentUser}</span>
        </button>
      </div>

      <div className="screen-scroll">
        {order.map(key => {
          const list = grouped[key];
          if (!list || list.length === 0) return null;
          return (
            <section key={key}>
              <div className="section-head">
                <h2 className="section-title">{groupLabels[key]}</h2>
                <span className="section-meta">{list.length} ride{list.length === 1 ? '' : 's'}</span>
              </div>
              <div className="feed">
                {list.map(r => (
                  <RideCard key={r.id} ride={r} currentUser={currentUser} onClick={onOpenRide} />
                ))}
              </div>
            </section>
          );
        })}
        <div style={{ height: 110 }} />
      </div>

      <button className="fab" onClick={onPropose}>
        <Icon name="plus" size={16} stroke={2.4} />
        Propose a crank
      </button>
    </div>
  );
};

Object.assign(window, { UsernameGate, BrowseScreen, RideCard, StatusPill });
