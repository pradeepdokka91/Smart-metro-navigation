// Each station is a "node". Each connection is an "edge" with a travel time.
const metroNetwork = {
  Miyapur: [{ station: "JNTU College", time: 4, line: "Blue" }, { station: "Nizampet", time: 4, line: "Blue" }],
  Nizampet: [{ station: "Miyapur", time: 4, line: "Blue" }],
  "JNTU College": [
    { station: "Miyapur", time: 4, line: "Blue" },
    { station: "KPHB Colony", time: 3, line: "Blue" }
  ],
  "KPHB Colony": [
    { station: "JNTU College", time: 3, line: "Blue" },
    { station: "Hitech City", time: 5, line: "Blue" }
  ],
  "Hitech City": [
    { station: "KPHB Colony", time: 5, line: "Blue" },
    { station: "Ameerpet", time: 7, line: "Blue" },
    { station: "Raidurg", time: 5, line: "Blue" }
  ],
  Ameerpet: [
    { station: "Hitech City", time: 7, line: "Blue" },
    { station: "Punjagutta", time: 3, line: "Blue" },
    { station: "Secunderabad", time: 6, line: "Red" },
    { station: "Raidurg", time: 8, line: "Blue" },
    // These two fictional express links make the three route choices visibly different.
    { station: "Parade Ground", time: 11, fare: 10, line: "Red" },
    { station: "MGBS", time: 20, fare: 50, line: "Blue" }
  ],
  Raidurg: [{ station: "Hitech City", time: 5, line: "Blue" }, { station: "Ameerpet", time: 8, line: "Blue" }],
  Punjagutta: [
    { station: "Ameerpet", time: 3, line: "Blue" },
    { station: "LB Nagar", time: 9, line: "Blue" }
  ],
  "LB Nagar": [{ station: "Punjagutta", time: 9, line: "Blue" }],
  Secunderabad: [
    { station: "Ameerpet", time: 6, line: "Red" },
    { station: "Parade Ground", time: 4, line: "Red" },
    { station: "Mettuguda", time: 5, line: "Red" }
  ],
  Mettuguda: [{ station: "Secunderabad", time: 5, line: "Red" }, { station: "Uppal", time: 6, line: "Red" }],
  Uppal: [{ station: "Mettuguda", time: 6, line: "Red" }, { station: "Nagole", time: 5, line: "Red" }],
  Nagole: [{ station: "Uppal", time: 5, line: "Red" }],
  "Parade Ground": [
    { station: "Secunderabad", time: 4, line: "Red" },
    { station: "MGBS", time: 6, line: "Green" },
    { station: "Ameerpet", time: 11, fare: 10, line: "Red" },
    { station: "JBS Parade", time: 5, line: "Green" }
  ],
  MGBS: [
    { station: "Parade Ground", time: 6, line: "Green" },
    { station: "Ameerpet", time: 20, fare: 50, line: "Blue" },
    { station: "JBS Parade", time: 9, line: "Green" },
    { station: "Sultan Bazar", time: 4, line: "Green" }
  ],
  "JBS Parade": [{ station: "Parade Ground", time: 5, line: "Green" }, { station: "MGBS", time: 9, line: "Green" }],
  "Sultan Bazar": [{ station: "MGBS", time: 4, line: "Green" }, { station: "Malakpet", time: 5, line: "Green" }],
  Malakpet: [{ station: "Sultan Bazar", time: 5, line: "Green" }]
};

const startSelect = document.querySelector("#start");
const destinationSelect = document.querySelector("#destination");
const result = document.querySelector("#result");
const alternatives = document.querySelector("#alternatives");
const algorithmOutput = document.querySelector("#algorithm-output");
const authGuest = document.querySelector("#auth-guest");
const authUser = document.querySelector("#auth-user");
const authForm = document.querySelector("#auth-form");
const authMessage = document.querySelector("#auth-message");
const recoveryPanel = document.querySelector("#recovery-panel");
const otpRequestForm = document.querySelector("#otp-request-form");
const otpResetForm = document.querySelector("#otp-reset-form");
const recoveryMessage = document.querySelector("#recovery-message");
const bookingPanel = document.querySelector("#booking-panel");
const bookingForm = document.querySelector("#booking-form");
const ticketDisplay = document.querySelector("#ticket-display");
const map = document.querySelector("#metro-map");
const lineColors = { Blue: "#45b7ff", Red: "#ff6672", Green: "#61dc9a" };
let selectedMode = "fastest";
let selectedAlgorithm = "dijkstra";
let authMode = "login";
let currentUser = null;
let lastJourney = null;
let delayMinutes = 0;
let delayedEdgeKey = "";

// These positions tell the browser where to draw each station on our visual map.
const stationPositions = {
  Nizampet: [35, 95], Miyapur: [125, 95], "JNTU College": [230, 95], "KPHB Colony": [340, 95],
  "Hitech City": [450, 95], Raidurg: [520, 40], Ameerpet: [585, 165], Punjagutta: [700, 165],
  "LB Nagar": [830, 165], Secunderabad: [585, 290], Mettuguda: [700, 290], Uppal: [810, 290], Nagole: [920, 290],
  "JBS Parade": [410, 410], "Parade Ground": [585, 410], MGBS: [585, 520], "Sultan Bazar": [700, 520], Malakpet: [830, 520]
};

function fillStationMenus() {
  Object.keys(metroNetwork).forEach((station) => {
    startSelect.add(new Option(station, station));
    destinationSelect.add(new Option(station, station));
  });
  destinationSelect.selectedIndex = 1;
}

function edgeKey(firstStation, secondStation) {
  return [firstStation, secondStation].sort().join("|");
}

function fillDelayMenu() {
  const delaySelect = document.querySelector("#delay-edge");
  const seenEdges = new Set();
  Object.entries(metroNetwork).forEach(([station, connections]) => {
    connections.forEach(({ station: neighbour }) => {
      const key = edgeKey(station, neighbour);
      if (seenEdges.has(key)) return;
      seenEdges.add(key);
      delaySelect.add(new Option(`${station} ↔ ${neighbour}`, key));
    });
  });
  delayedEdgeKey = delaySelect.value;
}

function edgeTravelTime(fromStation, connection) {
  const isDelayed = delayMinutes > 0 && edgeKey(fromStation, connection.station) === delayedEdgeKey;
  return connection.time + (isDelayed ? delayMinutes : 0);
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) }
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? "Please try again.");
  return body;
}

function setAuthMode(mode) {
  authMode = mode;
  const registering = mode === "register";
  document.querySelector("#auth-title").textContent = registering ? "Create your account" : "Log in to save journeys";
  document.querySelector("#name-field").hidden = !registering;
  document.querySelector("#auth-name").required = registering;
  document.querySelector("#auth-password").autocomplete = registering ? "new-password" : "current-password";
  document.querySelector(".auth-submit").textContent = registering ? "Create account" : "Log in";
  document.querySelectorAll(".auth-tab").forEach((button) => button.classList.toggle("selected", button.dataset.authMode === mode));
  authMessage.textContent = "";
}

function showAccount(user) {
  currentUser = user;
  authGuest.hidden = Boolean(user);
  authUser.hidden = !user;
  if (user) {
    document.querySelector("#user-name").textContent = user.name;
    document.querySelector("#user-email").textContent = user.email;
    loadSavedJourneys();
    loadTickets();
  }
  if (lastJourney) showRoute();
}

async function loadSession() {
  try {
    const { user } = await api("/api/me");
    showAccount(user);
  } catch {
    // The page remains usable when the local server is not running.
  }
}

async function loadSavedJourneys() {
  if (!currentUser) return;
  try {
    const { journeys } = await api("/api/journeys");
    const container = document.querySelector("#saved-journeys");
    container.innerHTML = journeys.length ? `<p class="saved-title">Saved journeys</p>${journeys.map((item) => `
      <div class="saved-journey"><strong>${item.start_station} → ${item.destination_station}</strong><br>${item.travel_time} min · ₹${item.fare} · ${item.changes} changes</div>`).join("")}` : "<p class=\"saved-journey\">No saved journeys yet. Plan one, then press Save journey.</p>";
  } catch {
    // A short-lived network error should not interrupt route planning.
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function showTicket(ticket) {
  const cancelled = ticket.status === "Cancelled";
  ticketDisplay.innerHTML = `
    <div class="ticket-top">
      <div><p class="eyebrow">SMART METRO · BOARDING PASS</p><h2>${escapeHtml(ticket.start_station)} → ${escapeHtml(ticket.destination_station)}</h2><p class="ticket-code">${escapeHtml(ticket.booking_code)}</p></div>
      <span class="ticket-status ${cancelled ? "cancelled" : ""}">${escapeHtml(ticket.status)}</span>
    </div>
    <p class="ticket-route">${escapeHtml(ticket.route)}</p>
    <div class="ticket-meta">
      <span>Passenger<strong>${escapeHtml(ticket.passenger_name)}</strong></span>
      <span>Travel date<strong>${escapeHtml(ticket.travel_date)}</strong></span>
      <span>Coach<strong>${escapeHtml(ticket.coach_preference)}</strong></span>
      <span>Travel time<strong>${ticket.travel_time} min</strong></span>
      <span>Fare paid<strong>₹${ticket.fare}</strong></span>
      <span>Changes<strong>${ticket.changes}</strong></span>
    </div>
    <div class="barcode" aria-label="Ticket barcode"></div>`;
  ticketDisplay.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function loadTickets() {
  if (!currentUser) return;
  try {
    const { tickets } = await api("/api/tickets");
    const container = document.querySelector("#my-tickets");
    container.innerHTML = tickets.length ? `<p class="saved-title">My tickets</p>${tickets.map((ticket) => `
      <div class="account-ticket"><strong>${escapeHtml(ticket.start_station)} → ${escapeHtml(ticket.destination_station)}</strong> · ${escapeHtml(ticket.travel_date)}<br>
      ${escapeHtml(ticket.booking_code)} · ₹${ticket.fare} · ${escapeHtml(ticket.status)}
      ${ticket.status === "Booked" ? `<br><button class="cancel-ticket" data-ticket-id="${ticket.id}">Cancel ticket</button>` : ""}</div>`).join("")}` : "";
    container.querySelectorAll(".cancel-ticket").forEach((button) => button.addEventListener("click", () => cancelTicket(button.dataset.ticketId)));
  } catch {
    // Ticket history can be retried after a connection error.
  }
}

async function cancelTicket(ticketId) {
  if (!confirm("Cancel this ticket?")) return;
  try {
    await api(`/api/tickets/${ticketId}/cancel`, { method: "POST" });
    loadTickets();
  } catch (error) {
    alert(error.message);
  }
}

function openBooking() {
  if (!currentUser || !lastJourney) return;
  const { journey, start, destination } = lastJourney;
  document.querySelector("#booking-summary").textContent = `${start} → ${destination} · ${journey.time} minutes · ₹${journey.fare}`;
  document.querySelector("#passenger-name").value = currentUser.name;
  const today = new Date().toISOString().slice(0, 10);
  const dateInput = document.querySelector("#travel-date");
  dateInput.min = today;
  dateInput.value = today;
  document.querySelector("#booking-message").textContent = "";
  bookingPanel.hidden = false;
  bookingPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function saveJourney() {
  if (!currentUser || !lastJourney) return;
  const saveButton = document.querySelector("#save-journey");
  saveButton.disabled = true;
  saveButton.textContent = "Saving…";
  try {
    await api("/api/journeys", {
      method: "POST",
      body: JSON.stringify({
        start: lastJourney.start,
        destination: lastJourney.destination,
        priority: selectedMode,
        route: lastJourney.journey.route.join(" → "),
        travelTime: lastJourney.journey.time,
        fare: lastJourney.journey.fare,
        changes: lastJourney.changes,
        delayMinutes
      })
    });
    saveButton.textContent = "Journey saved ✓";
    loadSavedJourneys();
  } catch (error) {
    saveButton.disabled = false;
    saveButton.textContent = error.message;
  }
}

// Dijkstra finds the route with the smallest total cost. The cost can be time or fare.
function findRouteByWeight(start, destination, getWeight, blockedEdges = new Set()) {
  const times = Object.fromEntries(Object.keys(metroNetwork).map((station) => [station, Infinity]));
  const previous = {};
  const unvisited = new Set(Object.keys(metroNetwork));
  times[start] = 0;

  while (unvisited.size > 0) {
    let current = [...unvisited].reduce((best, station) => times[station] < times[best] ? station : best);
    if (times[current] === Infinity || current === destination) break;
    unvisited.delete(current);

    metroNetwork[current].forEach((connection) => {
      if (blockedEdges.has(edgeKey(current, connection.station))) return;
      const newCost = times[current] + getWeight(current, connection);
      if (newCost < times[connection.station]) {
        times[connection.station] = newCost;
        previous[connection.station] = { station: current, line: connection.line };
      }
    });
  }

  if (times[destination] === Infinity) return null;

  const route = [];
  const lines = [];
  for (let station = destination; station; station = previous[station]?.station) {
    route.unshift(station);
    if (previous[station]) lines.unshift(previous[station].line);
  }
  const time = route.slice(0, -1).reduce((total, station, index) => {
    const connection = metroNetwork[station].find((edge) => edge.station === route[index + 1]);
    return total + edgeTravelTime(station, connection);
  }, 0);
  const fare = route.slice(0, -1).reduce((total, station, index) => {
    return total + edgeFare(metroNetwork[station].find((edge) => edge.station === route[index + 1]));
  }, 0);
  return { route, lines, time, fare };
}

function edgeFare(connection) {
  return connection.fare ?? connection.time * 2;
}

function createJourneyFromRoute(route) {
  const lines = [];
  let time = 0;
  let fare = 0;
  route.slice(0, -1).forEach((station, index) => {
    const connection = metroNetwork[station].find((edge) => edge.station === route[index + 1]);
    lines.push(connection.line);
    time += edgeTravelTime(station, connection);
    fare += edgeFare(connection);
  });
  return { route, lines, time, fare };
}

// BFS visits nearby stations first, so it finds a route with the fewest stops.
function findRouteWithBfs(start, destination) {
  const visited = new Set([start]);
  const queue = [[start]];
  let explored = 0;
  while (queue.length) {
    const route = queue.shift();
    const station = route.at(-1);
    explored += 1;
    if (station === destination) return { ...createJourneyFromRoute(route), explored };
    metroNetwork[station].forEach((connection) => {
      if (!visited.has(connection.station)) {
        visited.add(connection.station);
        queue.push([...route, connection.station]);
      }
    });
  }
  return null;
}

// DFS goes as deep as possible before backtracking. Its first route is not guaranteed to be best.
function findRouteWithDfs(start, destination) {
  const visited = new Set();
  const stack = [[start]];
  let explored = 0;
  while (stack.length) {
    const route = stack.pop();
    const station = route.at(-1);
    if (visited.has(station)) continue;
    visited.add(station);
    explored += 1;
    if (station === destination) return { ...createJourneyFromRoute(route), explored };
    [...metroNetwork[station]].reverse().forEach((connection) => {
      if (!visited.has(connection.station)) stack.push([...route, connection.station]);
    });
  }
  return null;
}

// Floyd–Warshall compares every station with every other station (all-pairs shortest paths).
function findRouteWithFloydWarshall(start, destination) {
  const stations = Object.keys(metroNetwork);
  const distances = Object.fromEntries(stations.map((from) => [from, Object.fromEntries(stations.map((to) => [to, from === to ? 0 : Infinity]))]));
  const nextStation = Object.fromEntries(stations.map((station) => [station, {}]));
  stations.forEach((from) => metroNetwork[from].forEach((connection) => {
    const time = edgeTravelTime(from, connection);
    if (time < distances[from][connection.station]) {
      distances[from][connection.station] = time;
      nextStation[from][connection.station] = connection.station;
    }
  }));
  stations.forEach((via) => stations.forEach((from) => stations.forEach((to) => {
    const throughVia = distances[from][via] + distances[via][to];
    if (throughVia < distances[from][to]) {
      distances[from][to] = throughVia;
      nextStation[from][to] = nextStation[from][via];
    }
  })));

  if (!nextStation[start][destination]) return null;
  const route = [start];
  while (route.at(-1) !== destination) route.push(nextStation[route.at(-1)][destination]);
  return { ...createJourneyFromRoute(route), explored: stations.length ** 3 };
}

// This version stores both the station and the metro line in its search state.
// That lets it prefer fewer line switches, then use travel time to break a tie.
function findRouteWithFewestChanges(start, destination, blockedEdges = new Set()) {
  const startState = `${start}::Start`;
  const costs = { [startState]: 0 };
  const previous = {};
  const queue = [{ state: startState, station: start, line: null, cost: 0 }];
  let endState;

  while (queue.length) {
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift();
    if (current.cost !== costs[current.state]) continue;
    if (current.station === destination) { endState = current.state; break; }

    metroNetwork[current.station].forEach((connection) => {
      if (blockedEdges.has(edgeKey(current.station, connection.station))) return;
      const changedLine = current.line && current.line !== connection.line ? 1 : 0;
      const nextState = `${connection.station}::${connection.line}`;
      const nextCost = current.cost + changedLine * 1000 + edgeTravelTime(current.station, connection);
      if (nextCost < (costs[nextState] ?? Infinity)) {
        costs[nextState] = nextCost;
        previous[nextState] = { state: current.state, line: connection.line };
        queue.push({ state: nextState, station: connection.station, line: connection.line, cost: nextCost });
      }
    });
  }

  if (!endState) return null;

  const route = [];
  const lines = [];
  for (let state = endState; state !== startState; state = previous[state].state) {
    route.unshift(state.split("::")[0]);
    lines.unshift(previous[state].line);
  }
  route.unshift(start);
  const time = route.slice(0, -1).reduce((total, station, index) => {
    const connection = metroNetwork[station].find((edge) => edge.station === route[index + 1]);
    return total + edgeTravelTime(station, connection);
  }, 0);
  const fare = route.slice(0, -1).reduce((total, station, index) => total + edgeFare(metroNetwork[station].find((edge) => edge.station === route[index + 1])), 0);
  return { route, lines, time, fare };
}

function findBestJourney(start, destination, blockedEdges = new Set()) {
  if (selectedMode === "cheapest") {
    const journey = findRouteByWeight(start, destination, (_, connection) => edgeFare(connection), blockedEdges);
    return journey && { ...journey, title: "Your cheapest route" };
  }
  if (selectedMode === "fewestChanges") {
    const journey = findRouteWithFewestChanges(start, destination, blockedEdges);
    return journey && { ...journey, title: "Your route with the fewest changes" };
  }
  const journey = findRouteByWeight(start, destination, (station, connection) => edgeTravelTime(station, connection), blockedEdges);
  return journey && { ...journey, title: "Your fastest route" };
}

function countChanges(journey) {
  return journey.lines.filter((line, index) => index > 0 && line !== journey.lines[index - 1]).length;
}

function findAlternateRoutes(start, destination, mainJourney) {
  const uniqueRoutes = new Map();
  mainJourney.route.slice(0, -1).forEach((station, index) => {
    const blockedEdges = new Set([edgeKey(station, mainJourney.route[index + 1])]);
    const candidate = findBestJourney(start, destination, blockedEdges);
    if (candidate) uniqueRoutes.set(candidate.route.join(" → "), candidate);
  });

  return [...uniqueRoutes.values()]
    .filter((journey) => journey.route.join(" → ") !== mainJourney.route.join(" → "))
    .sort((first, second) => {
      if (selectedMode === "cheapest") return first.fare - second.fare;
      if (selectedMode === "fewestChanges") return countChanges(first) - countChanges(second) || first.time - second.time;
      return first.time - second.time;
    })
    .slice(0, 2);
}

function renderAlternates(start, destination, mainJourney) {
  const routes = findAlternateRoutes(start, destination, mainJourney);
  if (!routes.length) {
    alternatives.innerHTML = "";
    return;
  }
  alternatives.innerHTML = `
    <h2 class="alternatives-title">Alternate routes</h2>
    <p class="alternatives-subtitle">Different paths, ranked using your selected priority.</p>
    <div class="alternative-list">${routes.map((journey, index) => `
      <article class="alternative">
        <div class="alternative-top">
          <span class="alternative-name">Alternative ${index + 1}</span>
          <span class="alternative-details">${journey.time} min · ₹${journey.fare} · ${countChanges(journey)} changes</span>
        </div>
        <p class="alternative-route">${journey.route.join(" → ")}</p>
      </article>`).join("")}
    </div>`;
}

function renderAlgorithmDemo() {
  const start = startSelect.value;
  const destination = destinationSelect.value;
  const demos = {
    dijkstra: {
      heading: "Dijkstra — fastest total travel time",
      explanation: "It compares the total number of minutes for possible routes and keeps improving the best known route.",
      journey: findRouteByWeight(start, destination, (station, connection) => edgeTravelTime(station, connection))
    },
    bfs: {
      heading: "BFS — fewest station stops",
      explanation: "It explores all nearby stations before moving farther away. It does not use time or fare.",
      journey: findRouteWithBfs(start, destination)
    },
    dfs: {
      heading: "DFS — explore deeply first",
      explanation: "It follows one branch as far as it can, then backtracks. This is useful for exploration, not route optimisation.",
      journey: findRouteWithDfs(start, destination)
    },
    floyd: {
      heading: "Floyd–Warshall — every station pair",
      explanation: "It calculates fastest paths between all station pairs. This is useful when many route queries are needed.",
      journey: findRouteWithFloydWarshall(start, destination)
    }
  };
  const demo = demos[selectedAlgorithm];
  const journey = demo.journey;
  algorithmOutput.innerHTML = `
    <h3>${demo.heading}</h3>
    <p>${demo.explanation}</p>
    <p class="algorithm-route">${journey.route.join(" → ")}</p>
    <p><strong>${journey.time} min</strong> · ${journey.route.length - 1} stops · ${journey.explored ?? "weighted"} ${selectedAlgorithm === "floyd" ? "comparisons" : "stations explored"}</p>`;
}

function showRoute() {
  const start = startSelect.value;
  const destination = destinationSelect.value;
  if (start === destination) {
    result.innerHTML = '<p class="empty-message">Please choose two different stations.</p>';
    lastJourney = null;
    bookingPanel.hidden = true;
    alternatives.innerHTML = "";
    renderMetroMap([]);
    return;
  }

  const journey = findBestJourney(start, destination);
  const changes = countChanges(journey);
  lastJourney = { start, destination, journey, changes };
  const routeHtml = journey.route.map((station) => `<span class="station">${station}</span>`).join('<span class="arrow">→</span>');

  result.innerHTML = `
    <h2 class="route-title">${journey.title}</h2>
    ${delayMinutes ? `<p class="delay-note">⚠ ${delayMinutes}-minute delay active on the selected connection.</p>` : ""}
    <div class="route">${routeHtml}</div>
    <div class="stats">
      <div class="stat">Travel time<strong>${journey.time} minutes</strong></div>
      <div class="stat">Estimated fare<strong>₹${journey.fare}</strong></div>
      <div class="stat">Line changes<strong>${changes}</strong></div>
    </div>
    <div class="result-actions">
      <button id="save-journey" class="save-button" ${currentUser ? "" : "disabled"}>${currentUser ? "Save this journey" : "Log in to save this journey"}</button>
      <button id="book-ticket" class="book-button" ${currentUser ? "" : "disabled"}>${currentUser ? "Book ticket" : "Log in to book ticket"}</button>
    </div>`;
  document.querySelector("#save-journey").addEventListener("click", saveJourney);
  document.querySelector("#book-ticket").addEventListener("click", openBooking);
  renderMetroMap(journey.route);
  renderAlternates(start, destination, journey);
  renderAlgorithmDemo();
}

function renderMetroMap(activeRoute) {
  const drawnEdges = new Set();
  const normalTracks = [];

  Object.entries(metroNetwork).forEach(([station, connections]) => {
    connections.forEach(({ station: neighbour, line }) => {
      const edgeKey = [station, neighbour].sort().join("|");
      if (drawnEdges.has(edgeKey)) return;
      drawnEdges.add(edgeKey);
      const [x1, y1] = stationPositions[station];
      const [x2, y2] = stationPositions[neighbour];
      normalTracks.push(`<line class="track" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${lineColors[line]}" />`);
    });
  });

  const highlightedTracks = activeRoute.slice(0, -1).map((station, index) => {
    const [x1, y1] = stationPositions[station];
    const [x2, y2] = stationPositions[activeRoute[index + 1]];
    return `<line class="route-track" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
  });

  const delayedTrack = delayMinutes ? (() => {
    const [firstStation, secondStation] = delayedEdgeKey.split("|");
    const [x1, y1] = stationPositions[firstStation];
    const [x2, y2] = stationPositions[secondStation];
    return `<line class="delayed-track" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
  })() : "";

  const stations = Object.entries(stationPositions).map(([station, [x, y]]) => {
    const active = activeRoute.includes(station) ? "active" : "";
    return `<g><circle class="map-station ${active}" cx="${x}" cy="${y}" r="11" />
      <text class="station-label ${active}" x="${x}" y="${y - 20}">${station}</text></g>`;
  });
  map.innerHTML = [...normalTracks, ...highlightedTracks, delayedTrack, ...stations].join("");
}

document.querySelector("#find-route").addEventListener("click", showRoute);
document.querySelector("#delay-edge").addEventListener("change", (event) => {
  delayedEdgeKey = event.target.value;
  showRoute();
});
document.querySelector("#delay-minutes").addEventListener("input", (event) => {
  delayMinutes = Number(event.target.value);
  document.querySelector("#delay-value").textContent = `${delayMinutes} min`;
  showRoute();
});
document.querySelectorAll(".option-button").forEach((button) => {
  button.addEventListener("click", () => {
    selectedMode = button.dataset.mode;
    document.querySelectorAll(".option-button").forEach((item) => item.classList.toggle("selected", item === button));
    document.querySelector("#find-route").textContent = `Find ${button.textContent.trim().toLowerCase()} route`;
    showRoute();
  });
});
document.querySelectorAll(".algorithm-button").forEach((button) => {
  button.addEventListener("click", () => {
    selectedAlgorithm = button.dataset.algorithm;
    document.querySelectorAll(".algorithm-button").forEach((item) => item.classList.toggle("selected", item === button));
    renderAlgorithmDemo();
  });
});
document.querySelectorAll(".auth-tab").forEach((button) => button.addEventListener("click", () => setAuthMode(button.dataset.authMode)));
document.querySelector("#forgot-password").addEventListener("click", () => {
  recoveryPanel.hidden = !recoveryPanel.hidden;
  recoveryMessage.textContent = "";
  if (!recoveryPanel.hidden) document.querySelector("#recovery-email").focus();
});
otpRequestForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = otpRequestForm.querySelector("button");
  button.disabled = true;
  recoveryMessage.textContent = "";
  try {
    const { message } = await api("/api/forgot-password", { method: "POST", body: JSON.stringify({ email: document.querySelector("#recovery-email").value }) });
    recoveryMessage.textContent = message;
    otpResetForm.hidden = false;
    document.querySelector("#recovery-otp").focus();
  } catch (error) {
    recoveryMessage.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});
otpResetForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = otpResetForm.querySelector("button");
  button.disabled = true;
  recoveryMessage.textContent = "";
  try {
    const email = document.querySelector("#recovery-email").value;
    const { message } = await api("/api/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, otp: document.querySelector("#recovery-otp").value, newPassword: document.querySelector("#recovery-password").value })
    });
    document.querySelector("#auth-email").value = email;
    setAuthMode("login");
    recoveryPanel.hidden = true;
    otpResetForm.hidden = true;
    otpRequestForm.reset();
    otpResetForm.reset();
    authMessage.textContent = message;
  } catch (error) {
    recoveryMessage.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});
authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = authForm.querySelector("button[type=submit]");
  submitButton.disabled = true;
  authMessage.textContent = "";
  try {
    const body = {
      email: document.querySelector("#auth-email").value,
      password: document.querySelector("#auth-password").value
    };
    if (authMode === "register") body.name = document.querySelector("#auth-name").value;
    const { user } = await api(`/api/${authMode === "register" ? "register" : "login"}`, { method: "POST", body: JSON.stringify(body) });
    authForm.reset();
    showAccount(user);
  } catch (error) {
    authMessage.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
});
document.querySelector("#logout").addEventListener("click", async () => {
  await api("/api/logout", { method: "POST" });
  document.querySelector("#saved-journeys").innerHTML = "";
  document.querySelector("#my-tickets").innerHTML = "";
  bookingPanel.hidden = true;
  showAccount(null);
});
bookingForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentUser || !lastJourney) return;
  const submitButton = bookingForm.querySelector("button[type=submit]");
  const message = document.querySelector("#booking-message");
  submitButton.disabled = true;
  message.textContent = "";
  try {
    const { journey, start, destination, changes } = lastJourney;
    const { ticket } = await api("/api/tickets", {
      method: "POST",
      body: JSON.stringify({
        passengerName: document.querySelector("#passenger-name").value,
        travelDate: document.querySelector("#travel-date").value,
        coachPreference: document.querySelector("#coach-preference").value,
        start, destination, priority: selectedMode, route: journey.route.join(" → "),
        travelTime: journey.time, fare: journey.fare, changes
      })
    });
    bookingPanel.hidden = true;
    showTicket(ticket);
    loadTickets();
  } catch (error) {
    message.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
});
document.querySelector("#swap").addEventListener("click", () => {
  [startSelect.value, destinationSelect.value] = [destinationSelect.value, startSelect.value];
  showRoute();
});

fillStationMenus();
fillDelayMenu();
renderMetroMap([]);
renderAlgorithmDemo();
loadSession();
