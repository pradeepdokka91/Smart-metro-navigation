import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { createHash, randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const port = 3000;
const mysqlConnection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
async function query(sql, params = []) {
  const [result] = await mysqlConnection.execute(sql, params);
  return result;
}
console.log("✅ Connected to MySQL successfully!");
const sessions = new Map();



const mailer = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
  ? nodemailer.createTransport({ service: "gmail", auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD } })
  : null;

function sendJson(response, status, body, headers = {}) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...headers });
  response.end(JSON.stringify(body));
}

function parseCookies(request) {
  return Object.fromEntries((request.headers.cookie ?? "").split(";").filter(Boolean).map((item) => {
    const [key, ...value] = item.trim().split("=");
    return [key, decodeURIComponent(value.join("="))];
  }));
}

async function getSessionUser(request) {
  const token = parseCookies(request).sid;
  const session = token && sessions.get(token);

  if (!session || session.expiresAt < Date.now()) {
    if (token) sessions.delete(token);
    return null;
  }

  const users = await query(
    "SELECT id, name, email FROM users WHERE id = ?",
    [session.userId]
  );

  return users.length > 0 ? users[0] : null;
}
  
function passwordHash(password) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

function passwordMatches(password, storedValue) {
  const [salt, storedHash] = storedValue.split(":");
  const attemptedHash = scryptSync(password, salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(storedHash, "hex"), Buffer.from(attemptedHash, "hex"));
}

function otpHash(email, otp) {
  return createHash("sha256").update(`${email}:${otp}`).digest("hex");
}

function createSession(userId) {
  const token = randomBytes(32).toString("hex");
  sessions.set(token, { userId, expiresAt: Date.now() + 86_400_000 });
  return token;
}

async function readBody(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 20_000) throw new Error("Request too large");
  }
  return body ? JSON.parse(body) : {};
}

function validEmail(email) {
  return typeof email === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function handleApi(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
const user = await getSessionUser(request);
  if (request.method === "GET" && url.pathname === "/api/me") {
    return sendJson(response, 200, { user });
  }

  // Continue with register, login, forgot password...
  


  if (request.method === "POST" && url.pathname === "/api/register") {
    const { name, email, password } = await readBody(request);
    const cleanName = typeof name === "string" ? name.trim() : "";
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (cleanName.length < 2 || !validEmail(cleanEmail) || typeof password !== "string" || password.length < 6) {
      return sendJson(response, 400, { error: "Enter your name, a valid email, and a password with at least 6 characters." });
    }
    const existingUsers = await query(
  "SELECT id FROM users WHERE email = ?",
  [cleanEmail]
);

if (existingUsers.length > 0) {
  return sendJson(response, 409, {
    error: "An account already exists for that email."
  });
}
    const result = await query(
    "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
    [cleanName, cleanEmail, passwordHash(password)]
  );

  const newUser = {
    id: result.insertId,
    name: cleanName,
    email: cleanEmail,
  };

  const token = createSession(newUser.id);

  return sendJson(
    response,
    201,
    { user: newUser },
    {
      "Set-Cookie": `sid=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`
    }
  );
}

  if (request.method === "POST" && url.pathname === "/api/login") {
    const { email, password } = await readBody(request);
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const users = await query(
  "SELECT * FROM users WHERE email = ?",
  [cleanEmail]
);

const foundUser = users.length > 0 ? users[0] : null;
    if (!foundUser || typeof password !== "string" || !passwordMatches(password, foundUser.password)) {
      return sendJson(response, 401, { error: "Email or password is incorrect." });
    }
    const token = createSession(foundUser.id);
    return sendJson(response, 200, { user: { id: foundUser.id, name: foundUser.name, email: foundUser.email } }, { "Set-Cookie": `sid=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400` });
  }

  if (request.method === "POST" && url.pathname === "/api/forgot-password") {
    const { email } = await readBody(request);
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!validEmail(cleanEmail)) return sendJson(response, 400, { error: "Enter a valid email address." });
    if (!mailer) return sendJson(response, 503, { error: "Gmail is not configured yet. Add your Gmail details to the local .env file, then restart the server." });
    const users = await query(
  "SELECT id, name FROM users WHERE email = ?",
  [cleanEmail]
);

const foundUser = users.length > 0 ? users[0] : null;
    if (foundUser) {
      const otp = String(randomInt(0, 1_000_000)).padStart(6, "0");
      await query(
  "DELETE FROM password_reset_otps WHERE email = ?",
  [cleanEmail]
);
      await query(
  "INSERT INTO password_reset_otps (email, otp_hash, expires_at) VALUES (?, ?, ?)",
  [
    cleanEmail,
    otpHash(cleanEmail, otp),
    Date.now() + 10 * 60 * 1000
  ]
);
      await mailer.sendMail({
        from: process.env.GMAIL_FROM || process.env.GMAIL_USER,
        to: cleanEmail,
        subject: "Your Smart Metro password reset code",
        text: `Hello ${foundUser.name}, your Smart Metro Navigator password reset code is ${otp}. It expires in 10 minutes. If you did not request this, you can ignore this email.`
      });
    }
    return sendJson(response, 200, { message: "If an account uses that email, a six-digit OTP has been sent." });
  }

  if (request.method === "POST" && url.pathname === "/api/reset-password") {
    const { email, otp, newPassword } = await readBody(request);
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!validEmail(cleanEmail) || !/^\d{6}$/.test(otp ?? "") || typeof newPassword !== "string" || newPassword.length < 6) {
      return sendJson(response, 400, { error: "Enter your email, six-digit OTP, and a new password with at least 6 characters." });
    }
const records = await query(
  "SELECT * FROM password_reset_otps WHERE email = ? ORDER BY id DESC LIMIT 1",
  [cleanEmail]
);

const record = records.length > 0 ? records[0] : null;    const expired = !record || record.expires_at < Date.now() || record.attempts >= 5;
    if (expired) {
await query(
  "DELETE FROM password_reset_otps WHERE email = ?",
  [cleanEmail]
);      return sendJson(response, 400, { error: "That OTP has expired. Please request a new one." });
    }
    const matches = timingSafeEqual(Buffer.from(record.otp_hash, "hex"), Buffer.from(otpHash(cleanEmail, otp), "hex"));
    if (!matches) {
await query(
  "UPDATE password_reset_otps SET attempts = attempts + 1 WHERE id = ?",
  [record.id]
);      return sendJson(response, 400, { error: "That OTP is incorrect." });
    }
await query(
  "UPDATE users SET password = ? WHERE email = ?",
  [passwordHash(newPassword), cleanEmail]
);    await query(
  "DELETE FROM password_reset_otps WHERE email = ?",
  [cleanEmail]
);
    return sendJson(response, 200, { message: "Password reset successfully. You can now log in." });
  }

  if (request.method === "POST" && url.pathname === "/api/logout") {
    const token = parseCookies(request).sid;
    if (token) sessions.delete(token);
    return sendJson(response, 200, { ok: true }, { "Set-Cookie": "sid=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0" });
  }

  if (request.method === "GET" && url.pathname === "/api/journeys") {
    if (!user) return sendJson(response, 401, { error: "Please log in first." });
    const journeys = await query(
  `SELECT start_station, destination_station, priority,
          route, travel_time, fare, changes,
          delay_minutes, created_at
   FROM journeys
   WHERE user_id = ?
   ORDER BY id DESC
   LIMIT 8`,
  [user.id]
);
    return sendJson(response, 200, { journeys });
  }

  if (request.method === "POST" && url.pathname === "/api/journeys") {
    if (!user) return sendJson(response, 401, { error: "Please log in first." });
    const { start, destination, priority, route, travelTime, fare, changes, delayMinutes } = await readBody(request);
    const valuesAreValid = [start, destination, priority, route].every((value) => typeof value === "string" && value.length > 0)
      && [travelTime, fare, changes, delayMinutes].every(Number.isInteger);
    if (!valuesAreValid) return sendJson(response, 400, { error: "Journey details are incomplete." });
    await query(
  `INSERT INTO journeys
   (user_id, start_station, destination_station,
    priority, route, travel_time,
    fare, changes, delay_minutes)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    user.id,
    start,
    destination,
    priority,
    route,
    travelTime,
    fare,
    changes,
    delayMinutes,
  ]
);
    return sendJson(response, 201, { ok: true });
  }

  if (request.method === "GET" && url.pathname === "/api/tickets") {
    if (!user) return sendJson(response, 401, { error: "Please log in first." });
    const tickets = await query(
  `SELECT id, booking_code, passenger_name,
          travel_date, coach_preference,
          start_station, destination_station,
          priority, route, travel_time,
          fare, changes, status, created_at
   FROM tickets
   WHERE user_id = ?
   ORDER BY id DESC
   LIMIT 12`,
  [user.id]
);
    return sendJson(response, 200, { tickets });
  }

  if (request.method === "POST" && url.pathname === "/api/tickets") {
    if (!user) return sendJson(response, 401, { error: "Please log in first." });
    const { passengerName, travelDate, coachPreference, start, destination, priority, route, travelTime, fare, changes } = await readBody(request);
    const textValues = [passengerName, travelDate, coachPreference, start, destination, priority, route];
    const validValues = textValues.every((value) => typeof value === "string" && value.trim().length > 0)
      && /^\d{4}-\d{2}-\d{2}$/.test(travelDate)
      && [travelTime, fare, changes].every(Number.isInteger);
    if (!validValues) return sendJson(response, 400, { error: "Please complete all ticket details." });
    const bookingCode = `MET-${randomBytes(3).toString("hex").toUpperCase()}`;
    const result = await query(
  `INSERT INTO tickets (
      booking_code,
      user_id,
      passenger_name,
      travel_date,
      coach_preference,
      start_station,
      destination_station,
      priority,
      route,
      travel_time,
      fare,
      changes
   )
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    bookingCode,
    user.id,
    passengerName.trim(),
    travelDate,
    coachPreference,
    start,
    destination,
    priority,
    route,
    travelTime,
    fare,
    changes,
  ]
);
    const tickets = await query(
  `SELECT id, booking_code, passenger_name,
          travel_date, coach_preference,
          start_station, destination_station,
          priority, route, travel_time,
          fare, changes, status, created_at
   FROM tickets
   WHERE id = ?`,
  [result.insertId]
);

const ticket = tickets[0];
    return sendJson(response, 201, { ticket });
  }

  const cancelMatch = url.pathname.match(/^\/api\/tickets\/(\d+)\/cancel$/);
  if (request.method === "POST" && cancelMatch) {
    if (!user) return sendJson(response, 401, { error: "Please log in first." });
const tickets = await query(
  "SELECT id, status FROM tickets WHERE id = ? AND user_id = ?",
  [Number(cancelMatch[1]), user.id]
);

const ticket = tickets.length > 0 ? tickets[0] : null;
    if (!ticket) return sendJson(response, 404, { error: "Ticket not found." });
    if (ticket.status === "Cancelled") return sendJson(response, 400, { error: "This ticket is already cancelled." });
await query(
  "UPDATE tickets SET status = 'Cancelled' WHERE id = ?",
  [ticket.id]
);
    return sendJson(response, 200, { ok: true });
  }

  return sendJson(response, 404, { error: "API route not found." });
}

const mimeTypes = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8" };
async function serveStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const requested = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = join(process.cwd(), normalize(requested).replace(/^[/\\]+/, ""));
  if (!filePath.startsWith(process.cwd())) return sendJson(response, 403, { error: "Forbidden" });
  try {
    const content = await readFile(filePath);
    response.writeHead(200, { "Content-Type": mimeTypes[extname(filePath)] ?? "application/octet-stream" });
    response.end(content);
  } catch {
    sendJson(response, 404, { error: "File not found" });
  }
}

createServer(async (request, response) => {
  try {
    if (request.url.startsWith("/api/")) await handleApi(request, response);
    else await serveStatic(request, response);
  } catch (error) {
    console.error(error);
    sendJson(response, 500, { error: "Something went wrong. Please try again." });
  }
}).listen(port, () => console.log(`Smart Metro Navigator is running at http://localhost:${port}`));
