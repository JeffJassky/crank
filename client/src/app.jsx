// Main app: hash-routed shell + identity gate.

const { useState: uS4, useEffect: uE4, useMemo: uM4 } = React;

// Hash routes: #/, #/propose, #/me, #/ride/<id>, #/ride/<id>/edit
const parseHash = () => {
  const h = window.location.hash.replace(/^#\/?/, '');
  if (!h) return { name: 'browse' };
  if (h === 'propose') return { name: 'propose' };
  if (h === 'me') return { name: 'profile' };
  const m = h.match(/^ride\/([^/]+)(?:\/(edit))?$/);
  if (m) return { name: m[2] === 'edit' ? 'edit' : 'detail', rideId: m[1] };
  return { name: 'browse' };
};
const viewToHash = (v) => {
  if (v.name === 'browse')   return '';
  if (v.name === 'propose')  return '#/propose';
  if (v.name === 'profile')  return '#/me';
  if (v.name === 'detail')   return `#/ride/${v.rideId}`;
  if (v.name === 'edit')     return `#/ride/${v.rideId}/edit`;
  return '';
};

/* ---------- Profile (you) sheet — accessible from chip in header ---------- */
const ProfileSheet = ({ user, onSwitchUser, onClose, toast }) => {
  return (
    <div className="screen">
      <div className="app-header has-back">
        <button className="back-btn" onClick={onClose}><Icon name="back" size={20} /> Back</button>
        <div className="app-header-title" style={{ fontSize: 22 }}>You</div>
        <span style={{ width: 40 }} />
      </div>
      <div className="screen-scroll" style={{ padding: '8px 18px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 0 22px' }}>
          <Avatar name={user} size={56} />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, lineHeight: 1, letterSpacing: '-0.01em' }}>{user}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>your handle on this board</div>
          </div>
        </div>

        <div className="kv-list" style={{ borderTop: '1px solid var(--hair)', paddingTop: 14 }}>
          <div className="kv"><span className="k">Synced as</span><span className="v">{user}</span></div>
          <div className="kv"><span className="k">Stored</span><span className="v">on this device + the board</span></div>
        </div>

        <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5, margin: '20px 0 14px' }}>
          New device or new browser? Just enter your username again — your rides and RSVPs will load up.
        </p>

        <button className="btn btn-ghost btn-block" onClick={onSwitchUser}>Switch username</button>
      </div>
    </div>
  );
};

/* ---------- App shell ---------- */
const App = () => {
  const [user, setUser] = uS4(() => window.Store.getUser());
  const [view, setViewState] = uS4(parseHash);
  const [rides, setRides] = uS4(() => window.Store.listRides());
  const [toast, setToast] = uS4(null);

  // Keep state and location.hash in sync. Browser back/forward fires hashchange.
  uE4(() => {
    const onHash = () => setViewState(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const setView = (v) => {
    const next = viewToHash(v);
    if (window.location.hash !== next && !(next === '' && !window.location.hash)) {
      // Use replaceState-style write to avoid stacking duplicate history entries
      // when navigating from initial empty hash; pushState for genuine navigation.
      window.location.hash = next;
    }
    setViewState(v);
  };

  uE4(() => window.Store.subscribe(() => setRides(window.Store.listRides())), []);

  uE4(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1700);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = (m) => setToast(m);

  if (!user) {
    return (
      <div className="phone">
        {/* Preserve the requested view (from hash) once they identify. */}
        <UsernameGate onEnter={(u) => { setUser(u); }} />
      </div>
    );
  }

  const activeRide = view.rideId ? rides.find(r => r.id === view.rideId) : null;

  const goBrowse = () => setView({ name: 'browse' });
  const openRide = (id) => setView({ name: 'detail', rideId: id });

  let screen;
  if (view.name === 'browse') {
    screen = <BrowseScreen
      rides={rides}
      currentUser={user}
      onOpenRide={openRide}
      onPropose={() => setView({ name: 'propose' })}
      onOpenProfile={() => setView({ name: 'profile' })}
    />;
  } else if (view.name === 'detail' && activeRide) {
    screen = <DetailScreen
      ride={activeRide}
      currentUser={user}
      onBack={goBrowse}
      onEdit={() => setView({ name: 'edit', rideId: activeRide.id })}
      onLockIn={(locked) => {
        window.Store.setRideStatus(activeRide.id, 'locked', locked);
        const label = locked?.time ? `Locked in for ${fmtTime(locked.time)}` : locked?.date ? `Locked in for ${shortDate(locked.date)}` : 'Confirmed';
        showToast(label);
      }}
      onUnlock={() => { window.Store.setRideStatus(activeRide.id, 'open', null); showToast('Reopened for availability'); }}
      toast={showToast}
    />;
  } else if (view.name === 'propose') {
    screen = <RideForm
      currentUser={user}
      onCancel={goBrowse}
      onSave={(r) => { window.Store.upsertRide(r); showToast('Ride posted'); setView({ name: 'detail', rideId: r.id }); }}
    />;
  } else if (view.name === 'edit' && activeRide) {
    screen = <RideForm
      initial={activeRide}
      isEdit
      currentUser={user}
      onCancel={() => setView({ name: 'detail', rideId: activeRide.id })}
      onSave={(r) => { window.Store.upsertRide(r); showToast('Saved'); setView({ name: 'detail', rideId: r.id }); }}
      onDelete={() => { window.Store.deleteRide(activeRide.id); showToast('Ride cancelled'); goBrowse(); }}
    />;
  } else if (view.name === 'profile') {
    screen = <ProfileSheet
      user={user}
      onSwitchUser={() => { window.Store.clearUser(); setUser(null); }}
      onClose={goBrowse}
      toast={showToast}
    />;
  } else {
    screen = <BrowseScreen rides={rides} currentUser={user} onOpenRide={openRide} onPropose={() => setView({ name: 'propose' })} onOpenProfile={() => setView({ name: 'profile' })} />;
  }

  const tabsHidden = view.name === 'propose' || view.name === 'edit' || view.name === 'profile';

  return (
    <div className="phone">
      {screen}
      {!tabsHidden && (
        <div className="tabbar">
          <button className={'tab' + (view.name === 'browse' ? ' active' : '')} onClick={goBrowse}>
            <Icon name="feed" size={20} />
            <span>Rides</span>
            <span className="tab-dot" />
          </button>
          <button className="tab" onClick={() => setView({ name: 'propose' })}>
            <Icon name="plus" size={20} stroke={2.2} />
            <span>Propose</span>
            <span className="tab-dot" />
          </button>
          <button className={'tab' + (view.name === 'profile' ? ' active' : '')} onClick={() => setView({ name: 'profile' })}>
            <Icon name="user" size={20} />
            <span>You</span>
            <span className="tab-dot" />
          </button>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
