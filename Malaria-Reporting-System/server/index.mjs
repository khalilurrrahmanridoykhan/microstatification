import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import express from "express";
import jwt from "jsonwebtoken";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const dataDir = path.join(projectRoot, "data");
const distDir = path.join(projectRoot, "dist");
const dbPath = path.join(dataDir, "malaria-reporting.sqlite");
const monthColumns = [
  "jan_cases",
  "feb_cases",
  "mar_cases",
  "apr_cases",
  "may_cases",
  "jun_cases",
  "jul_cases",
  "aug_cases",
  "sep_cases",
  "oct_cases",
  "nov_cases",
  "dec_cases",
];

const jwtSecret = process.env.JWT_SECRET || "malaria-reporting-local-secret";

fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(dbPath);
db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

initializeDatabase();
seedDatabase();

const app = express();
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, database: dbPath });
});

app.get(["/api/csrf-token", "/api/csrf-token/"], (_req, res) => {
  const token = crypto.randomBytes(32).toString("hex");

  res.set("Cache-Control", "no-store");
  res.cookie("csrftoken", token, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  res.json({
    csrfToken: token,
    csrf_token: token,
  });
});

app.post(["/api/auth/login", "/api/auth/login/"], (req, res) => {
  const loginId = normalizeEmail(req.body?.email ?? req.body?.username);
  const password = String(req.body?.password ?? "");

  if (!loginId || !password) {
    return sendError(res, 400, "Email or username and password are required.");
  }

  const user = getUserByLogin(loginId);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return sendError(res, 401, "Invalid email, username, or password.");
  }

  return res.json({
    token: createToken(user),
    ...serializeSession(user),
  });
});

app.post(["/api/auth/logout", "/api/auth/logout/"], (_req, res) => {
  res.status(204).end();
});

app.get(["/api/auth/me", "/api/auth/me/"], authenticate, (req, res) => {
  res.json(serializeSession(req.authUser));
});

app.get("/api/local-records", authenticate, (req, res) => {
  const year = parseYear(req.query.year);
  if (!year) {
    return sendError(res, 400, "A valid year is required.");
  }

  const query = `
    SELECT
      lr.*,
      d.name AS district_name,
      up.name AS upazila_name,
      n.name AS union_name,
      v.name AS village_name,
      v.ward_no AS ward_no
    FROM local_records lr
    JOIN villages v ON v.id = lr.village_id
    JOIN unions n ON n.id = v.union_id
    JOIN upazilas up ON up.id = n.upazila_id
    JOIN districts d ON d.id = up.district_id
    WHERE lr.reporting_year = ?
      AND (? = 'admin' OR lr.sk_user_id = ?)
    ORDER BY d.name, up.name, n.name, v.name
  `;

  const rows = db.prepare(query).all(year, req.authUser.role, req.authUser.id);
  res.json(rows);
});

app.put("/api/local-records/:id", authenticate, (req, res) => {
  const existing = db.prepare("SELECT * FROM local_records WHERE id = ?").get(req.params.id);
  if (!existing) {
    return sendError(res, 404, "Record not found.");
  }

  if (!isAdmin(req) && existing.sk_user_id !== req.authUser.id) {
    return sendError(res, 403, "You do not have access to this record.");
  }

  try {
    const payload = buildLocalRecordUpdate(existing, req.body ?? {}, req.authUser.role);
    updateRecord("local_records", existing.id, payload);
    res.json({ success: true });
  } catch (error) {
    res.status(error.statusCode || 400).json({ error: error.message });
  }
});

app.get("/api/non-local-records", authenticate, (req, res) => {
  const year = parseYear(req.query.year);
  if (!year) {
    return sendError(res, 400, "A valid year is required.");
  }

  const rows = db.prepare(`
    SELECT *
    FROM non_local_records
    WHERE reporting_year = ?
      AND (? = 'admin' OR sk_user_id = ?)
    ORDER BY created_at
  `).all(year, req.authUser.role, req.authUser.id);

  res.json(rows);
});

app.post("/api/non-local-records", authenticate, (req, res) => {
  try {
    const payload = buildNonLocalInsert(req.body ?? {}, req.authUser);
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO non_local_records (
        id,
        sk_user_id,
        reporting_year,
        country,
        district_or_state,
        upazila_or_township,
        union_name,
        village_name,
        jan_cases,
        feb_cases,
        mar_cases,
        apr_cases,
        may_cases,
        jun_cases,
        jul_cases,
        aug_cases,
        sep_cases,
        oct_cases,
        nov_cases,
        dec_cases
      ) VALUES (
        @id,
        @sk_user_id,
        @reporting_year,
        @country,
        @district_or_state,
        @upazila_or_township,
        @union_name,
        @village_name,
        @jan_cases,
        @feb_cases,
        @mar_cases,
        @apr_cases,
        @may_cases,
        @jun_cases,
        @jul_cases,
        @aug_cases,
        @sep_cases,
        @oct_cases,
        @nov_cases,
        @dec_cases
      )
    `).run({ id, ...payload });

    res.status(201).json(db.prepare("SELECT * FROM non_local_records WHERE id = ?").get(id));
  } catch (error) {
    res.status(error.statusCode || 400).json({ error: error.message });
  }
});

app.put("/api/non-local-records/:id", authenticate, (req, res) => {
  const existing = db.prepare("SELECT * FROM non_local_records WHERE id = ?").get(req.params.id);
  if (!existing) {
    return sendError(res, 404, "Record not found.");
  }

  if (!isAdmin(req) && existing.sk_user_id !== req.authUser.id) {
    return sendError(res, 403, "You do not have access to this record.");
  }

  try {
    const payload = buildNonLocalUpdate(existing, req.body ?? {}, req.authUser.role);
    updateRecord("non_local_records", existing.id, payload);
    res.json({ success: true });
  } catch (error) {
    res.status(error.statusCode || 400).json({ error: error.message });
  }
});

app.delete("/api/non-local-records/:id", authenticate, (req, res) => {
  const existing = db.prepare("SELECT * FROM non_local_records WHERE id = ?").get(req.params.id);
  if (!existing) {
    return sendError(res, 404, "Record not found.");
  }

  if (!isAdmin(req) && existing.sk_user_id !== req.authUser.id) {
    return sendError(res, 403, "You do not have access to this record.");
  }

  db.prepare("DELETE FROM non_local_records WHERE id = ?").run(req.params.id);
  res.status(204).end();
});

app.get("/api/admin/reviews", authenticate, requireAdmin, (req, res) => {
  const year = parseYear(req.query.year);
  const recordType = req.query.recordType === "non_local" ? "non_local" : "local";

  if (!year) {
    return sendError(res, 400, "A valid year is required.");
  }

  const rows = recordType === "local" ? getLocalReviewRows(year) : getNonLocalReviewRows(year);
  const approvals = db.prepare(`
    SELECT record_id, month, status
    FROM monthly_approvals
    WHERE record_type = ? AND reporting_year = ?
  `).all(recordType, year);

  res.json({ rows, approvals });
});

app.post("/api/admin/monthly-approvals", authenticate, requireAdmin, (req, res) => {
  const recordType = req.body?.recordType === "non_local" ? "non_local" : "local";
  const recordId = String(req.body?.recordId ?? "");
  const reportingYear = parseYear(req.body?.reportingYear);
  const month = Number(req.body?.month);
  const status = req.body?.status === "PENDING" ? "PENDING" : "APPROVED";

  if (!recordId || !reportingYear || !Number.isInteger(month) || month < 1 || month > 12) {
    return sendError(res, 400, "Invalid approval payload.");
  }

  const tableName = recordType === "local" ? "local_records" : "non_local_records";
  const existing = db.prepare(`SELECT id FROM ${tableName} WHERE id = ? AND reporting_year = ?`).get(recordId, reportingYear);
  if (!existing) {
    return sendError(res, 404, "Record not found.");
  }

  db.prepare(`
    INSERT INTO monthly_approvals (
      id,
      record_type,
      record_id,
      reporting_year,
      month,
      status,
      approved_by,
      approved_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(record_type, record_id, reporting_year, month) DO UPDATE SET
      status = excluded.status,
      approved_by = excluded.approved_by,
      approved_at = CURRENT_TIMESTAMP
  `).run(
    crypto.randomUUID(),
    recordType,
    recordId,
    reportingYear,
    month,
    status,
    req.authUser.id,
  );

  res.json({ success: true });
});

app.get("/api/admin/users", authenticate, requireAdmin, (_req, res) => {
  const rows = db.prepare(`
    SELECT
      u.id,
      u.full_name,
      u.email,
      u.role,
      u.created_at,
      COUNT(a.id) AS assignment_count
    FROM users u
    LEFT JOIN assignments a ON a.sk_user_id = u.id
    GROUP BY u.id
    ORDER BY
      CASE WHEN u.role = 'admin' THEN 0 ELSE 1 END,
      u.full_name,
      u.email
  `).all();

  res.json(rows);
});

app.post("/api/admin/users", authenticate, requireAdmin, (req, res) => {
  const fullName = String(req.body?.full_name ?? "").trim();
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password ?? "");
  const role = req.body?.role === "admin" ? "admin" : "sk";

  if (!fullName || !email || !password) {
    return sendError(res, 400, "Name, email, and password are required.");
  }

  if (getUserByEmail(email)) {
    return sendError(res, 409, "A user with that email already exists.");
  }

  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO users (id, full_name, email, password_hash, role)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, fullName, email, bcrypt.hashSync(password, 10), role);

  res.status(201).json({ success: true });
});

app.put("/api/admin/users/:id", authenticate, requireAdmin, (req, res) => {
  const existing = getUserById(req.params.id);
  if (!existing) {
    return sendError(res, 404, "User not found.");
  }

  const fullName = String(req.body?.full_name ?? existing.full_name).trim();
  const email = normalizeEmail(req.body?.email ?? existing.email);
  const role = req.body?.role === "admin" ? "admin" : "sk";
  const password = String(req.body?.password ?? "");

  if (!fullName || !email) {
    return sendError(res, 400, "Name and email are required.");
  }

  const duplicate = db.prepare("SELECT id FROM users WHERE email = ? AND id != ?").get(email, existing.id);
  if (duplicate) {
    return sendError(res, 409, "A user with that email already exists.");
  }

  if (existing.id === req.authUser.id && role !== "admin") {
    return sendError(res, 400, "You cannot remove your own admin access.");
  }

  if (password) {
    db.prepare(`
      UPDATE users
      SET full_name = ?, email = ?, role = ?, password_hash = ?
      WHERE id = ?
    `).run(fullName, email, role, bcrypt.hashSync(password, 10), existing.id);
  } else {
    db.prepare(`
      UPDATE users
      SET full_name = ?, email = ?, role = ?
      WHERE id = ?
    `).run(fullName, email, role, existing.id);
  }

  res.json({ success: true });
});

app.delete("/api/admin/users/:id", authenticate, requireAdmin, (req, res) => {
  if (req.params.id === req.authUser.id) {
    return sendError(res, 400, "You cannot delete the current signed-in user.");
  }

  const existing = getUserById(req.params.id);
  if (!existing) {
    return sendError(res, 404, "User not found.");
  }

  db.prepare("DELETE FROM users WHERE id = ?").run(existing.id);
  res.status(204).end();
});

app.get("/api/admin/locations", authenticate, requireAdmin, (_req, res) => {
  const districts = db.prepare("SELECT id, name FROM districts ORDER BY name").all();
  const upazilas = db.prepare("SELECT id, district_id, name FROM upazilas ORDER BY name").all();
  const unions = db.prepare("SELECT id, upazila_id, name FROM unions ORDER BY name").all();
  const villages = db.prepare("SELECT id, union_id, name, ward_no FROM villages ORDER BY name").all();

  const payload = districts.map((district) => ({
    ...district,
    upazilas: upazilas
      .filter((upazila) => upazila.district_id === district.id)
      .map((upazila) => ({
        ...upazila,
        unions: unions
          .filter((unionItem) => unionItem.upazila_id === upazila.id)
          .map((unionItem) => ({
            ...unionItem,
            villages: villages.filter((village) => village.union_id === unionItem.id),
          })),
      })),
  }));

  res.json(payload);
});

app.get("/api/admin/assignments", authenticate, requireAdmin, (_req, res) => {
  const rows = db.prepare(`
    SELECT
      a.id,
      a.sk_user_id,
      a.village_id,
      u.full_name AS sk_name,
      d.name AS district_name,
      up.name AS upazila_name,
      n.name AS union_name,
      v.name AS village_name,
      v.ward_no AS ward_no
    FROM assignments a
    JOIN users u ON u.id = a.sk_user_id
    JOIN villages v ON v.id = a.village_id
    JOIN unions n ON n.id = v.union_id
    JOIN upazilas up ON up.id = n.upazila_id
    JOIN districts d ON d.id = up.district_id
    ORDER BY u.full_name, d.name, up.name, n.name, v.name
  `).all();

  res.json(rows);
});

app.post("/api/admin/assignments", authenticate, requireAdmin, (req, res) => {
  const skUserId = String(req.body?.skUserId ?? "");
  const villageId = String(req.body?.villageId ?? "");

  const user = getUserById(skUserId);
  if (!user || user.role !== "sk") {
    return sendError(res, 400, "Please choose a valid SK user.");
  }

  const village = db.prepare("SELECT id FROM villages WHERE id = ?").get(villageId);
  if (!village) {
    return sendError(res, 400, "Please choose a valid village.");
  }

  const currentAssignment = db.prepare("SELECT id, sk_user_id FROM assignments WHERE village_id = ?").get(villageId);
  if (currentAssignment) {
    if (currentAssignment.sk_user_id === skUserId) {
      ensureLocalRecord(skUserId, villageId, getDhakaYear());
      return res.json({ success: true, message: "Village is already assigned to that SK." });
    }

    db.prepare("UPDATE assignments SET sk_user_id = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?").run(skUserId, currentAssignment.id);
  } else {
    db.prepare(`
      INSERT INTO assignments (id, sk_user_id, village_id)
      VALUES (?, ?, ?)
    `).run(crypto.randomUUID(), skUserId, villageId);
  }

  ensureLocalRecord(skUserId, villageId, getDhakaYear());
  res.json({ success: true, message: "Village assigned successfully." });
});

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "API route not found." });
});

if (fs.existsSync(path.join(distDir, "index.html"))) {
  app.use(express.static(distDir));
  app.get("/{*path}", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }

    return res.sendFile(path.join(distDir, "index.html"));
  });
}

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Internal server error." });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, "0.0.0.0", () => {
  console.log(`Local API listening on http://0.0.0.0:${port}`);
  console.log(`SQLite database: ${dbPath}`);
});

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'sk')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS districts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS upazilas (
      id TEXT PRIMARY KEY,
      district_id TEXT NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(district_id, name)
    );

    CREATE TABLE IF NOT EXISTS unions (
      id TEXT PRIMARY KEY,
      upazila_id TEXT NOT NULL REFERENCES upazilas(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(upazila_id, name)
    );

    CREATE TABLE IF NOT EXISTS villages (
      id TEXT PRIMARY KEY,
      union_id TEXT NOT NULL REFERENCES unions(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      ward_no TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(union_id, name, ward_no)
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id TEXT PRIMARY KEY,
      sk_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      village_id TEXT NOT NULL UNIQUE REFERENCES villages(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(sk_user_id, village_id)
    );

    CREATE TABLE IF NOT EXISTS local_records (
      id TEXT PRIMARY KEY,
      village_id TEXT NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
      sk_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reporting_year INTEGER NOT NULL,
      hh INTEGER NOT NULL DEFAULT 0,
      population INTEGER NOT NULL DEFAULT 0,
      itn_2023 INTEGER NOT NULL DEFAULT 0,
      itn_2024 INTEGER NOT NULL DEFAULT 0,
      itn_2025 INTEGER NOT NULL DEFAULT 0,
      jan_cases INTEGER NOT NULL DEFAULT 0,
      feb_cases INTEGER NOT NULL DEFAULT 0,
      mar_cases INTEGER NOT NULL DEFAULT 0,
      apr_cases INTEGER NOT NULL DEFAULT 0,
      may_cases INTEGER NOT NULL DEFAULT 0,
      jun_cases INTEGER NOT NULL DEFAULT 0,
      jul_cases INTEGER NOT NULL DEFAULT 0,
      aug_cases INTEGER NOT NULL DEFAULT 0,
      sep_cases INTEGER NOT NULL DEFAULT 0,
      oct_cases INTEGER NOT NULL DEFAULT 0,
      nov_cases INTEGER NOT NULL DEFAULT 0,
      dec_cases INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(village_id, reporting_year)
    );

    CREATE TABLE IF NOT EXISTS non_local_records (
      id TEXT PRIMARY KEY,
      sk_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reporting_year INTEGER NOT NULL,
      country TEXT NOT NULL DEFAULT 'Bangladesh',
      district_or_state TEXT NOT NULL DEFAULT '',
      upazila_or_township TEXT NOT NULL DEFAULT '',
      union_name TEXT NOT NULL DEFAULT '',
      village_name TEXT NOT NULL DEFAULT '',
      jan_cases INTEGER NOT NULL DEFAULT 0,
      feb_cases INTEGER NOT NULL DEFAULT 0,
      mar_cases INTEGER NOT NULL DEFAULT 0,
      apr_cases INTEGER NOT NULL DEFAULT 0,
      may_cases INTEGER NOT NULL DEFAULT 0,
      jun_cases INTEGER NOT NULL DEFAULT 0,
      jul_cases INTEGER NOT NULL DEFAULT 0,
      aug_cases INTEGER NOT NULL DEFAULT 0,
      sep_cases INTEGER NOT NULL DEFAULT 0,
      oct_cases INTEGER NOT NULL DEFAULT 0,
      nov_cases INTEGER NOT NULL DEFAULT 0,
      dec_cases INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS monthly_approvals (
      id TEXT PRIMARY KEY,
      record_type TEXT NOT NULL CHECK(record_type IN ('local', 'non_local')),
      record_id TEXT NOT NULL,
      reporting_year INTEGER NOT NULL,
      month INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
      status TEXT NOT NULL CHECK(status IN ('PENDING', 'APPROVED')),
      approved_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      approved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(record_type, record_id, reporting_year, month)
    );
  `);
}

function seedDatabase() {
  const passwordHash = bcrypt.hashSync("123456", 10);
  const users = [
    {
      id: "user-admin",
      full_name: "Admin User",
      email: "admin@test.com",
      role: "admin",
    },
    {
      id: "user-sk-1",
      full_name: "SK Worker 1",
      email: "sk1@test.com",
      role: "sk",
    },
    {
      id: "user-sk-2",
      full_name: "SK Hasan Ali",
      email: "sk2@test.com",
      role: "sk",
    },
    {
      id: "user-sk-3",
      full_name: "SK Mizanur Rahman",
      email: "sk3@test.com",
      role: "sk",
    },
  ];

  for (const user of users) {
    db.prepare(`
      INSERT OR IGNORE INTO users (id, full_name, email, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(user.id, user.full_name, user.email, passwordHash, user.role);
  }

  const districtMap = new Map();
  for (const districtName of ["Bandarban", "Rangamati", "Khagrachhari"]) {
    districtMap.set(districtName, ensureNamedRow("districts", { name: districtName }));
  }

  const upazilaMap = new Map();
  const upazilas = {
    Bandarban: ["Bandarban Sadar", "Thanchi", "Ruma"],
    Rangamati: ["Rangamati Sadar", "Kaptai"],
    Khagrachhari: ["Khagrachhari Sadar", "Dighinala"],
  };

  for (const [districtName, upazilaNames] of Object.entries(upazilas)) {
    for (const name of upazilaNames) {
      upazilaMap.set(
        name,
        ensureNamedRow("upazilas", {
          district_id: districtMap.get(districtName),
          name,
        }),
      );
    }
  }

  const unionMap = new Map();
  const unions = {
    "Bandarban Sadar": ["Rajbila", "Kuhalong"],
    Thanchi: ["Thanchi Union"],
    Ruma: ["Ruma Union"],
    "Rangamati Sadar": ["Sapchhari"],
    Kaptai: ["Chitmorom"],
    "Khagrachhari Sadar": ["Khagrachhari Union"],
    Dighinala: ["Dighinala Union"],
  };

  for (const [upazilaName, unionNames] of Object.entries(unions)) {
    for (const name of unionNames) {
      unionMap.set(
        name,
        ensureNamedRow("unions", {
          upazila_id: upazilaMap.get(upazilaName),
          name,
        }),
      );
    }
  }

  const villages = [
    { unionName: "Rajbila", name: "Rajbila Para", ward_no: "1" },
    { unionName: "Rajbila", name: "Headman Para", ward_no: "2" },
    { unionName: "Kuhalong", name: "Kuhalong Para", ward_no: "3" },
    { unionName: "Thanchi Union", name: "Thanchi Mukh", ward_no: "1" },
    { unionName: "Ruma Union", name: "Ruma Bazar", ward_no: "1" },
    { unionName: "Sapchhari", name: "Sapchhari Para", ward_no: null },
    { unionName: "Chitmorom", name: "Chitmorom Para", ward_no: null },
    { unionName: "Khagrachhari Union", name: "Khagra Para", ward_no: null },
  ];

  const villageIds = villages.map((village) =>
    ensureNamedRow("villages", {
      union_id: unionMap.get(village.unionName),
      name: village.name,
      ward_no: village.ward_no,
    }),
  );

  const assignments = [
    { userId: "user-sk-1", villageId: villageIds[0] },
    { userId: "user-sk-1", villageId: villageIds[1] },
    { userId: "user-sk-1", villageId: villageIds[2] },
    { userId: "user-sk-1", villageId: villageIds[3] },
    { userId: "user-sk-1", villageId: villageIds[4] },
    { userId: "user-sk-2", villageId: villageIds[5] },
    { userId: "user-sk-3", villageId: villageIds[6] },
  ];

  for (const assignment of assignments) {
    const existing = db.prepare("SELECT id FROM assignments WHERE village_id = ?").get(assignment.villageId);
    if (existing) {
      db.prepare("UPDATE assignments SET sk_user_id = ? WHERE id = ?").run(assignment.userId, existing.id);
    } else {
      db.prepare(`
        INSERT INTO assignments (id, sk_user_id, village_id)
        VALUES (?, ?, ?)
      `).run(crypto.randomUUID(), assignment.userId, assignment.villageId);
    }

    ensureLocalRecord(assignment.userId, assignment.villageId, getDhakaYear());
  }

  const currentYear = getDhakaYear();
  const currentMonthColumn = monthColumns[getDhakaMonth() - 1];
  const firstVillageId = villageIds[0];
  const firstRecord = db.prepare(`
    SELECT id
    FROM local_records
    WHERE village_id = ? AND reporting_year = ?
  `).get(firstVillageId, currentYear);

  if (firstRecord) {
    db.prepare(`
      UPDATE local_records
      SET hh = 120,
          population = 480,
          ${currentMonthColumn} = 2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(firstRecord.id);
  }

  const secondVillageId = villageIds[1];
  const secondRecord = db.prepare(`
    SELECT id
    FROM local_records
    WHERE village_id = ? AND reporting_year = ?
  `).get(secondVillageId, currentYear);

  if (secondRecord) {
    db.prepare(`
      UPDATE local_records
      SET hh = 95,
          population = 360,
          ${currentMonthColumn} = 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(secondRecord.id);

    db.prepare(`
      INSERT OR IGNORE INTO monthly_approvals (
        id,
        record_type,
        record_id,
        reporting_year,
        month,
        status,
        approved_by,
        approved_at
      ) VALUES (?, 'local', ?, ?, ?, 'APPROVED', 'user-admin', CURRENT_TIMESTAMP)
    `).run(crypto.randomUUID(), secondRecord.id, currentYear, getDhakaMonth());
  }

  const existingNonLocal = db.prepare(`
    SELECT id
    FROM non_local_records
    WHERE sk_user_id = ? AND reporting_year = ? AND village_name = ?
  `).get("user-sk-1", currentYear, "Border Village");

  if (!existingNonLocal) {
    db.prepare(`
      INSERT INTO non_local_records (
        id,
        sk_user_id,
        reporting_year,
        country,
        district_or_state,
        upazila_or_township,
        union_name,
        village_name,
        feb_cases,
        mar_cases
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      "user-sk-1",
      currentYear,
      "Myanmar",
      "Chin State",
      "Paletwa",
      "Paletwa Union",
      "Border Village",
      3,
      1,
    );
  }
}

function ensureNamedRow(tableName, values) {
  const keys = Object.keys(values);
  const whereClause = keys
    .map((key) => {
      if (values[key] == null) {
        return `${key} IS NULL`;
      }
      return `${key} = @${key}`;
    })
    .join(" AND ");

  const existing = db.prepare(`SELECT id FROM ${tableName} WHERE ${whereClause}`).get(values);
  if (existing) {
    return existing.id;
  }

  const id = crypto.randomUUID();
  const insertKeys = ["id", ...keys];
  const placeholders = insertKeys.map((key) => `@${key}`).join(", ");
  db.prepare(`
    INSERT INTO ${tableName} (${insertKeys.join(", ")})
    VALUES (${placeholders})
  `).run({ id, ...values });
  return id;
}

function getUserByEmail(email) {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email);
}

function getUserById(id) {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
}

function getUserByLogin(loginId) {
  const normalizedLogin = normalizeEmail(loginId);
  if (!normalizedLogin) {
    return null;
  }

  const exactMatch = getUserByEmail(normalizedLogin);
  if (exactMatch) {
    return exactMatch;
  }

  if (!normalizedLogin.includes("@")) {
    return db.prepare(`
      SELECT *
      FROM users
      WHERE lower(substr(email, 1, instr(email, '@') - 1)) = ?
      LIMIT 1
    `).get(normalizedLogin);
  }

  return null;
}

function createToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, jwtSecret, { expiresIn: "7d" });
}

function serializeSession(user) {
  const legacyProfile = {
    full_name: user.full_name,
    email: user.email,
    micro_role: user.role === "admin" ? "micro_admin" : "sk",
    organizations: [],
    projects: [],
    forms: [],
  };
  const legacyRole = user.role === "admin" ? 7 : 8;
  const username = user.email.includes("@")
    ? user.email.slice(0, user.email.indexOf("@"))
    : user.email;

  return {
    user: {
      id: user.id,
      email: user.email,
      username,
      role: legacyRole,
      is_staff: user.role === "admin",
      full_name: user.full_name,
      profile: legacyProfile,
    },
    profile: {
      full_name: user.full_name,
      email: user.email,
    },
    role: user.role,
  };
}

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = getAuthTokenFromHeader(authHeader);
  if (!token) {
    return sendError(res, 401, "Authentication required.");
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    const user = getUserById(payload.sub);
    if (!user) {
      return sendError(res, 401, "Authentication required.");
    }

    req.authUser = user;
    return next();
  } catch (_error) {
    return sendError(res, 401, "Authentication required.");
  }
}

function getAuthTokenFromHeader(authHeader) {
  if (!authHeader) {
    return null;
  }

  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  if (authHeader.startsWith("Token ")) {
    return authHeader.slice(6);
  }

  return null;
}

function requireAdmin(req, res, next) {
  if (!req.authUser || req.authUser.role !== "admin") {
    return sendError(res, 403, "Admin access required.");
  }

  return next();
}

function isAdmin(req) {
  return req.authUser?.role === "admin";
}

function sendError(res, statusCode, message) {
  return res.status(statusCode).json({ error: message });
}

function normalizeEmail(value) {
  const email = String(value ?? "").trim().toLowerCase();
  return email;
}

function parseYear(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function getDhakaParts() {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "numeric",
  });
  const parts = formatter.formatToParts(new Date());
  return {
    month: Number(parts.find((part) => part.type === "month")?.value),
    year: Number(parts.find((part) => part.type === "year")?.value),
  };
}

function getDhakaMonth() {
  return getDhakaParts().month;
}

function getDhakaYear() {
  return getDhakaParts().year;
}

function ensureNonNegativeInteger(value, fieldName) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw badRequest(`${fieldName} must be a non-negative integer.`);
  }
  return parsed;
}

function badRequest(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function buildLocalRecordUpdate(existing, body, role) {
  const payload = {};
  const fields = ["hh", "population", "itn_2023", "itn_2024", "itn_2025", ...monthColumns];
  const currentMonth = getDhakaMonth();
  const currentYear = getDhakaYear();
  const isUserAdmin = role === "admin";

  for (const field of fields) {
    if (body[field] == null) {
      continue;
    }

    const nextValue = ensureNonNegativeInteger(body[field], field);
    if (nextValue === existing[field]) {
      continue;
    }

    if (!isUserAdmin && ["itn_2023", "itn_2024", "itn_2025"].includes(field)) {
      throw badRequest("Only admin can update ITN values.", 403);
    }

    if (!isUserAdmin && monthColumns.includes(field)) {
      const monthNumber = monthColumns.indexOf(field) + 1;
      if (existing.reporting_year !== currentYear || monthNumber !== currentMonth) {
        throw badRequest("Only the current month can be updated by SK users.", 403);
      }
    }

    payload[field] = nextValue;
  }

  if (Object.keys(payload).length === 0) {
    throw badRequest("No valid changes were provided.");
  }

  return payload;
}

function buildNonLocalInsert(body, authUser) {
  const reportingYear = parseYear(body.reporting_year);
  if (!reportingYear) {
    throw badRequest("A valid reporting year is required.");
  }

  const skUserId = authUser.role === "admin" && body.sk_user_id ? String(body.sk_user_id) : authUser.id;
  const payload = {
    sk_user_id: skUserId,
    reporting_year: reportingYear,
    country: String(body.country ?? "Bangladesh").trim() || "Bangladesh",
    district_or_state: String(body.district_or_state ?? "").trim(),
    upazila_or_township: String(body.upazila_or_township ?? "").trim(),
    union_name: String(body.union_name ?? "").trim(),
    village_name: String(body.village_name ?? "").trim(),
  };

  for (const column of monthColumns) {
    payload[column] = ensureNonNegativeInteger(body[column] ?? 0, column);
  }

  enforceNonLocalMonthLock(null, payload, authUser.role);
  return payload;
}

function buildNonLocalUpdate(existing, body, role) {
  const payload = {};

  for (const key of [
    "country",
    "district_or_state",
    "upazila_or_township",
    "union_name",
    "village_name",
  ]) {
    if (body[key] != null) {
      payload[key] = String(body[key]).trim();
    }
  }

  if (body.reporting_year != null) {
    const reportingYear = parseYear(body.reporting_year);
    if (!reportingYear) {
      throw badRequest("A valid reporting year is required.");
    }
    payload.reporting_year = reportingYear;
  }

  for (const column of monthColumns) {
    if (body[column] != null) {
      payload[column] = ensureNonNegativeInteger(body[column], column);
    }
  }

  if (Object.keys(payload).length === 0) {
    throw badRequest("No valid changes were provided.");
  }

  enforceNonLocalMonthLock(existing, { ...existing, ...payload }, role);
  return payload;
}

function enforceNonLocalMonthLock(existing, candidate, role) {
  if (role === "admin") {
    return;
  }

  const currentMonth = getDhakaMonth();
  const currentYear = getDhakaYear();
  const baseYear = candidate.reporting_year;

  for (const column of monthColumns) {
    const existingValue = existing ? existing[column] : 0;
    const nextValue = candidate[column];

    if (existingValue === nextValue) {
      continue;
    }

    const monthNumber = monthColumns.indexOf(column) + 1;
    if (baseYear !== currentYear || monthNumber !== currentMonth) {
      throw badRequest("Only the current month can be updated by SK users.", 403);
    }
  }
}

function updateRecord(tableName, id, payload) {
  const assignments = Object.keys(payload).map((field) => `${field} = @${field}`);
  assignments.push("updated_at = CURRENT_TIMESTAMP");

  db.prepare(`
    UPDATE ${tableName}
    SET ${assignments.join(", ")}
    WHERE id = @id
  `).run({ id, ...payload });
}

function ensureLocalRecord(skUserId, villageId, reportingYear) {
  const existing = db.prepare(`
    SELECT id
    FROM local_records
    WHERE village_id = ? AND reporting_year = ?
  `).get(villageId, reportingYear);

  if (existing) {
    db.prepare(`
      UPDATE local_records
      SET sk_user_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(skUserId, existing.id);
    return existing.id;
  }

  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO local_records (id, village_id, sk_user_id, reporting_year)
    VALUES (?, ?, ?, ?)
  `).run(id, villageId, skUserId, reportingYear);
  return id;
}

function getLocalReviewRows(year) {
  return db.prepare(`
    SELECT
      lr.*,
      'local' AS record_type,
      u.full_name AS sk_name,
      d.name || ' / ' || up.name || ' / ' || n.name || ' / ' || v.name ||
        CASE WHEN v.ward_no IS NOT NULL AND v.ward_no <> '' THEN ' (Ward ' || v.ward_no || ')' ELSE '' END
        AS location
    FROM local_records lr
    JOIN users u ON u.id = lr.sk_user_id
    JOIN villages v ON v.id = lr.village_id
    JOIN unions n ON n.id = v.union_id
    JOIN upazilas up ON up.id = n.upazila_id
    JOIN districts d ON d.id = up.district_id
    WHERE lr.reporting_year = ?
    ORDER BY u.full_name, d.name, up.name, n.name, v.name
  `).all(year);
}

function getNonLocalReviewRows(year) {
  return db.prepare(`
    SELECT
      nlr.*,
      'non_local' AS record_type,
      u.full_name AS sk_name,
      nlr.country || ' / ' || nlr.district_or_state || ' / ' || nlr.upazila_or_township || ' / ' || nlr.village_name AS location
    FROM non_local_records nlr
    JOIN users u ON u.id = nlr.sk_user_id
    WHERE nlr.reporting_year = ?
    ORDER BY u.full_name, nlr.country, nlr.district_or_state, nlr.village_name
  `).all(year);
}
