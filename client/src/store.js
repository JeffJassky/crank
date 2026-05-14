// Mock "server" + local user identity. Everything kept in localStorage to feel real.
// Exposes window.Store with methods used by the screens.

(function () {
  const LS_USER = 'cbr.user';
  const LS_DB = 'cbr.db.v5';

  // helpers
  const todayISO = () => new Date().toISOString().slice(0, 10);
  const addDays = (iso, n) => {
    const d = new Date(iso + 'T12:00:00');
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };

  const seedDate = todayISO();
  const seed = {
    rides: [
      {
        id: 'r1',
        title: 'Saturday morning gravel loop',
        description: 'Easy spin out to the reservoir + coffee at the turnaround. Casual pace, regroup at every climb. New folks very welcome — bring whatever bike you’ve got.',
        date: addDays(seedDate, 3),
        endDate: null,
        mode: 'window', // 'allday' | 'window'
        windowStart: '08:00',
        windowEnd: '13:00',
        durationMin: 180,
        distanceMi: 28,
        startAddress: 'Lighthouse Coffee, 2401 SE Division St',
        mapQuery: 'Lighthouse Coffee, 2401 SE Division St, Portland, OR',
        status: 'open', // 'open' | 'locked'
        lockedStart: null,
        proposedBy: 'maeve',
        createdAt: Date.now() - 86400000 * 2,
        routes: [
          { id: 'rt1a', name: 'Reservoir out-and-back', distanceMi: 26, note: 'The usual. ~600 ft.', mapQuery: 'Sellwood to Bull Run Reservoir, OR' },
          { id: 'rt1b', name: 'Springwater extension', distanceMi: 34, note: 'Adds the Boring lollipop.', mapQuery: 'Springwater Corridor Boring loop' },
          { id: 'rt1c', name: 'Skyline grinder', distanceMi: 30, note: 'More climbing if you’re feeling it.', mapQuery: 'Skyline Blvd Portland gravel' },
        ],
        routeVotes: { theo: 'rt1a', maeve: 'rt1b', rin: 'rt1a', jules: 'rt1a' },
        rsvps: {
          maeve: { state: 'going', slots: ['08:00','08:30','09:00','09:30','10:00'] },
          theo:  { state: 'going', slots: ['08:30','09:00','09:30','10:00','10:30'] },
          rin:   { state: 'maybe', slots: ['09:00','09:30','10:00','10:30','11:00'] },
          jules: { state: 'going', slots: ['08:00','08:30','09:00','09:30'] },
          ari:   { state: 'maybe', slots: ['09:30','10:00','10:30'] },
        },
      },
      {
        id: 'r2',
        title: 'After-work taco shakedown',
        description: 'Fast-ish 12 mi loop to test the new tubeless setup. Tacos at La Bonita after. Pace ~16mph, no drop on the climbs.',
        date: addDays(seedDate, 1),
        endDate: null,
        mode: 'window',
        windowStart: '17:00',
        windowEnd: '20:00',
        durationMin: 90,
        distanceMi: 12,
        startAddress: 'Ladd Circle, SE Portland',
        mapQuery: 'Ladd Circle Park, Portland, OR',
        status: 'locked',
        lockedStart: '18:00',
        proposedBy: 'theo',
        createdAt: Date.now() - 86400000 * 4,
        routes: [],
        routeVotes: {},
        rsvps: {
          theo:  { state: 'going', slots: ['18:00','18:30'] },
          maeve: { state: 'going', slots: ['18:00','18:30'] },
          rin:   { state: 'going', slots: ['18:00'] },
          ari:   { state: 'cant', slots: [] },
        },
      },
      {
        id: 'r3',
        title: 'All-day Hood loop',
        description: 'The big one. Roughly 95 mi, ~8000 ft. Bring food, bring lights just in case. Regroups but expect a real ride.',
        date: addDays(seedDate, 9),
        endDate: null,
        mode: 'allday',
        windowStart: null,
        windowEnd: null,
        durationMin: null,
        distanceMi: 95,
        startAddress: 'Sandy River Delta Park',
        mapQuery: 'Sandy River Delta Park, OR',
        status: 'open',
        lockedStart: null,
        proposedBy: 'jules',
        createdAt: Date.now() - 86400000 * 1,
        routes: [
          { id: 'rt3a', name: 'Lolo Pass classic', distanceMi: 95, note: 'Sandy → Lolo → ZigZag → back.', mapQuery: 'Lolo Pass Road Mt Hood' },
          { id: 'rt3b', name: 'Timberline detour', distanceMi: 108, note: 'Adds the climb up to the lodge. Lunch up top.', mapQuery: 'Timberline Lodge Mt Hood OR' },
        ],
        routeVotes: { jules: 'rt3a' },
        rsvps: {
          jules: { state: 'going', slots: [] },
          theo:  { state: 'maybe', slots: [] },
        },
      },
      {
        id: 'r6',
        title: 'Coast tour — Astoria to Newport',
        description: 'A real touring crank down the 101. Tents or hostels, we’ll figure it out. Full panniers welcome. Carpool back from Newport.',
        date: addDays(seedDate, 18),    // window start
        endDate: addDays(seedDate, 32),  // window end (search range)
        tourDays: 3,
        mode: 'allday',
        durationMin: null,
        distanceMi: 175,
        startAddress: 'Astoria Riverwalk',
        mapQuery: 'Astoria, OR',
        status: 'open',
        lockedStart: null, // when locked, a YYYY-MM-DD date
        proposedBy: 'theo',
        createdAt: Date.now() - 86400000 * 0.8,
        routes: [
          { id: 'rt6a', name: 'Coastal 101 (classic)', distanceMi: 175, note: 'Stick to the 101 the whole way. Camp at Cape Lookout night 2.', mapQuery: 'Astoria to Newport US-101' },
          { id: 'rt6b', name: 'Inland Three Capes detour', distanceMi: 192, note: 'Adds Cape Meares + Netarts. Less traffic, more climbing.', mapQuery: 'Three Capes Scenic Loop Oregon' },
        ],
        routeVotes: { theo: 'rt6a', jules: 'rt6a', maeve: 'rt6b' },
        rsvps: {
          theo:  { state: 'going', slots: [addDays(seedDate, 18), addDays(seedDate, 19), addDays(seedDate, 20), addDays(seedDate, 21), addDays(seedDate, 22), addDays(seedDate, 23)] },
          jules: { state: 'going', slots: [addDays(seedDate, 20), addDays(seedDate, 21), addDays(seedDate, 22), addDays(seedDate, 23), addDays(seedDate, 24)] },
          maeve: { state: 'maybe', slots: [addDays(seedDate, 25), addDays(seedDate, 26), addDays(seedDate, 27)] },
          ari:   { state: 'maybe', slots: [addDays(seedDate, 21), addDays(seedDate, 22), addDays(seedDate, 23)] },
        },
      },
      {
        id: 'r4',
        title: 'Forest Park dirt poke',
        description: 'Short and dirty. Leif Erikson → Wildwood, single track if it’s dry. 1.5 hr ride window.',
        date: addDays(seedDate, 5),
        endDate: null,
        mode: 'window',
        windowStart: '09:00',
        windowEnd: '14:00',
        durationMin: 90,
        distanceMi: 14,
        startAddress: 'Forest Park, Lower Macleay Trailhead',
        mapQuery: 'Lower Macleay Trailhead, Portland, OR',
        status: 'open',
        lockedStart: null,
        proposedBy: 'rin',
        createdAt: Date.now() - 86400000 * 0.5,
        routes: [],
        routeVotes: {},
        rsvps: {
          rin:   { state: 'going', slots: ['09:30','10:00','10:30','11:00'] },
          maeve: { state: 'maybe', slots: ['10:00','10:30','11:00'] },
          ari:   { state: 'going', slots: ['09:00','09:30','10:00','10:30'] },
        },
      },
      {
        id: 'r5',
        title: 'Sunset coffeeneuring',
        description: 'Slow recovery spin. Two espresso stops, max. Helmet decorations welcome.',
        date: addDays(seedDate, 14),
        endDate: null,
        mode: 'allday',
        distanceMi: 18,
        startAddress: 'Heart Coffee, 2211 E Burnside St',
        mapQuery: 'Heart Coffee, 2211 E Burnside St, Portland, OR',
        status: 'open',
        lockedStart: null,
        proposedBy: 'ari',
        createdAt: Date.now() - 86400000 * 0.2,
        routes: [],
        routeVotes: {},
        rsvps: {
          ari: { state: 'going', slots: [] },
        },
      },
    ],
  };

  function loadDB() {
    try {
      const raw = localStorage.getItem(LS_DB);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    localStorage.setItem(LS_DB, JSON.stringify(seed));
    return JSON.parse(JSON.stringify(seed));
  }
  function saveDB(db) { localStorage.setItem(LS_DB, JSON.stringify(db)); }

  function getUser() { return localStorage.getItem(LS_USER) || null; }
  function setUser(name) {
    const clean = (name || '').trim().replace(/\s+/g, '_').toLowerCase();
    if (!clean) return null;
    localStorage.setItem(LS_USER, clean);
    return clean;
  }
  function clearUser() { localStorage.removeItem(LS_USER); }

  const listeners = new Set();
  function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  function emit() { listeners.forEach(fn => fn()); }

  let db = loadDB();

  function listRides() { return db.rides.slice().sort((a,b) => a.date.localeCompare(b.date)); }
  function getRide(id) { return db.rides.find(r => r.id === id) || null; }

  function upsertRide(ride) {
    const idx = db.rides.findIndex(r => r.id === ride.id);
    if (idx >= 0) db.rides[idx] = ride;
    else db.rides.push(ride);
    saveDB(db); emit();
  }

  function deleteRide(id) {
    db.rides = db.rides.filter(r => r.id !== id);
    saveDB(db); emit();
  }

  function setRSVP(rideId, user, state, slots) {
    const r = getRide(rideId);
    if (!r) return;
    r.rsvps = r.rsvps || {};
    if (state === null) { delete r.rsvps[user]; }
    else { r.rsvps[user] = { state, slots: slots || r.rsvps[user]?.slots || [] }; }
    saveDB(db); emit();
  }

  function setRouteVote(rideId, user, routeId) {
    const r = getRide(rideId);
    if (!r) return;
    r.routeVotes = r.routeVotes || {};
    // toggle: if voting for same route again, clear
    if (r.routeVotes[user] === routeId) delete r.routeVotes[user];
    else r.routeVotes[user] = routeId;
    saveDB(db); emit();
  }

  function setRideStatus(rideId, status, lockedStart) {
    const r = getRide(rideId);
    if (!r) return;
    r.status = status;
    if (status === 'locked') r.lockedStart = lockedStart;
    else r.lockedStart = null;
    saveDB(db); emit();
  }

  function resetSeed() {
    localStorage.removeItem(LS_DB);
    db = loadDB();
    emit();
  }

  window.Store = {
    getUser, setUser, clearUser,
    listRides, getRide,
    upsertRide, deleteRide,
    setRSVP, setRideStatus, setRouteVote,
    subscribe, resetSeed,
    todayISO, addDays,
  };
})();
