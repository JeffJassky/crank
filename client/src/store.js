// Firestore-backed Store. Same window.Store API the screens already use.
// Atomic field writes via dot-path so concurrent RSVPs don't clobber.

(function () {
  const LS_USER = 'cbr.user';

  if (!window.firebase || !window.__FIREBASE_CONFIG__) {
    console.error('Firebase SDK or config missing — check script order in index.html');
    return;
  }

  if (firebase.apps.length === 0) firebase.initializeApp(window.__FIREBASE_CONFIG__);
  const db = firebase.firestore();
  const ridesCol = db.collection('rides');
  const FieldValue = firebase.firestore.FieldValue;

  const cache = {};
  const listeners = new Set();
  const emit = () => listeners.forEach(fn => fn());

  ridesCol.onSnapshot(snap => {
    snap.docChanges().forEach(change => {
      if (change.type === 'removed') delete cache[change.doc.id];
      else cache[change.doc.id] = { id: change.doc.id, ...change.doc.data() };
    });
    emit();
  }, err => console.error('rides onSnapshot', err));

  const todayISO = () => new Date().toISOString().slice(0, 10);
  const addDays = (iso, n) => {
    const d = new Date(iso + 'T12:00:00');
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };

  function getUser() { return localStorage.getItem(LS_USER) || null; }
  function setUser(name) {
    const clean = (name || '').trim().replace(/\s+/g, ' ');
    if (!clean) return null;
    localStorage.setItem(LS_USER, clean);
    return clean;
  }
  function clearUser() { localStorage.removeItem(LS_USER); }

  function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

  function listRides() {
    return Object.values(cache).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }
  function getRide(id) { return cache[id] || null; }

  function upsertRide(ride) {
    const { id, ...data } = ride;
    return ridesCol.doc(id).set(data).catch(err => console.error('upsertRide', err));
  }

  function deleteRide(id) {
    return ridesCol.doc(id).delete().catch(err => console.error('deleteRide', err));
  }

  function setRSVP(rideId, user, state, slots) {
    const ref = ridesCol.doc(rideId);
    if (state === null) {
      return ref.update({ [`rsvps.${user}`]: FieldValue.delete() })
        .catch(err => console.error('setRSVP delete', err));
    }
    return ref.update({ [`rsvps.${user}`]: { state, slots: slots || [] } })
      .catch(err => console.error('setRSVP', err));
  }

  function setRouteVote(rideId, user, routeId) {
    const ref = ridesCol.doc(rideId);
    const current = cache[rideId]?.routeVotes?.[user];
    if (current === routeId) {
      return ref.update({ [`routeVotes.${user}`]: FieldValue.delete() })
        .catch(err => console.error('setRouteVote clear', err));
    }
    return ref.update({ [`routeVotes.${user}`]: routeId })
      .catch(err => console.error('setRouteVote', err));
  }

  // locked = { date, time } | null
  function setRideStatus(rideId, status, locked) {
    const patch = {
      status,
      lockedDate:  status === 'locked' ? (locked?.date || null) : null,
      lockedStart: status === 'locked' ? (locked?.time || null) : null,
    };
    return ridesCol.doc(rideId).update(patch).catch(err => console.error('setRideStatus', err));
  }

  window.Store = {
    getUser, setUser, clearUser,
    listRides, getRide,
    upsertRide, deleteRide,
    setRSVP, setRideStatus, setRouteVote,
    subscribe,
    todayISO, addDays,
  };
})();
