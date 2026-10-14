import { createReadStream, readFileSync, existsSync } from "node:fs";
import { readFile, stat, mkdir } from "node:fs/promises";
import { createHash, randomBytes, scryptSync } from "node:crypto";
import { basename, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";
import pg from "pg";
import { GoogleGenAI } from "@google/genai";
import { OAuth2Client } from "google-auth-library";
import multer from "multer";
import webPush from "web-push";

import {
  initialProfilDesa,
  initialReports,
  initialNews,
} from "./src/data/initialData.js";
import { initialEducationModules } from "./src/data/education.js";
import { beritaData } from "./src/user/data/berita.js";
import { edukasiList } from "./src/user/data/edukasi.js";
import { laporanData } from "./src/user/data/laporan.js";
import { profilDesa } from "./src/user/data/profilDesa.js";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 4173);
const { Pool } = pg;

// Konfigurasi Multer untuk Upload File
const uploadDir = join(root, "uploads");
// Pastikan folder uploads tersedia
mkdir(uploadDir, { recursive: true }).catch(console.error);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    if (["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.mimetype)) callback(null, true);
    else callback(new Error("File harus berupa gambar."));
  },
});

const classifyReportWithGemini = async (description) => {
  if (!ai) return null;
  try {
    const result = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: `
Klasifikasikan laporan masyarakat berikut ke dalam tepat satu kategori:

- Jalan
- Drainase
- Penerangan
- Jembatan
- Fasilitas Umum

Deskripsi laporan:
"${description}"

Balas HANYA dengan nama kategorinya.
`,
    })

    const category = result.text.trim()

    const allowedCategories = [
      "Jalan",
      "Drainase",
      "Penerangan",
      "Jembatan",
      "Fasilitas Umum",
    ]

    return allowedCategories.includes(category)
      ? category
      : null

  } catch (error) {
    console.error("Gemini classification gagal:", error)
    return null
  }
}

const loadEnv = () => {
  const envPaths = [join(process.cwd(), ".env"), join(root, ".env")];
  for (const envPath of envPaths) {
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const [key, ...values] = trimmed.split("=");
          const value = values.join("=").trim().replace(/^["']|["']$/g, "");
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = value;
          }
        }
      }
      break;
    }
  }
};
loadEnv();
const googleAuthClient = new OAuth2Client();
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;


// Inisialisasi pool database dengan dukungan DATABASE_URL dan SSL otomatis
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const hasDatabaseConfig =
  hasDatabaseUrl ||
  (process.env.PGHOST &&
    process.env.PGUSER &&
    process.env.PGPASSWORD &&
    (process.env.PGDATABASE || process.env.POSTGRES_DB));

if (!hasDatabaseConfig) {
  throw new Error(
    "Konfigurasi PostgreSQL belum lengkap. Atur DATABASE_URL atau PGHOST, PGUSER, PGPASSWORD, dan PGDATABASE/POSTGRES_DB pada environment service aplikasi.",
  );
}

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.DATABASE_URL.includes("railway.internal")
          ? false
          : { rejectUnauthorized: false },
    })
  : new Pool({
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT || 5432),
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE || process.env.POSTGRES_DB,
      ssl:
        process.env.PGSSL === "true" || process.env.PGHOST?.includes("railway")
          ? { rejectUnauthorized: false }
          : undefined,
    });
const categoryNames = [
  "Pembangunan Desa",
  "Penggunaan Website",
  "Pedoman Aspirasi",
  "Syarat dan Ketentuan",
];

const removeEducationIcons = (value) => {
  if (Array.isArray(value)) return value.map(removeEducationIcons);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== "icon")
      .map(([key, nested]) => [key, removeEducationIcons(nested)]),
  );
};

const seedEducation = removeEducationIcons(initialEducationModules);

const seedData = {
  profil: initialProfilDesa,
  reports: initialReports,
  news: initialNews,
  edukasi: seedEducation,
  userBerita: beritaData,
  userEdukasi: edukasiList,
  userLaporan: laporanData,
  userProfil: profilDesa,
};

const defaultNewsComments = new Set([
  "Semoga segera selesai dan bisa digunakan warga.",
  "Terima kasih informasinya.",
  "Apakah rincian penggunaannya akan dipublikasikan?",
]);

const countComments = (comments = []) =>
  comments.reduce((total, comment) => total + 1 + countComments(comment.replies || []), 0);

const summarizeReportComments = (comments = []) => {
  if (!comments.length) return "";
  const stopWords = new Set([
    "yang", "dan", "di", "ke", "dari", "untuk", "agar", "pada", "ini", "itu",
    "dengan", "kami", "warga", "saya", "ada", "bisa", "lebih", "sudah",
    "belum", "karena", "agar", "tolong",
  ]);

  const sentences = comments
    .map((comment) => String(comment.text || "").trim())
    .filter(Boolean);

  const frequencies = new Map();
  for (const sentence of sentences) {
    for (const word of sentence.toLowerCase().match(/[a-z0-9]{3,}/g) || []) {
      if (!stopWords.has(word)) frequencies.set(word, (frequencies.get(word) || 0) + 1);
    }
  }

  const ranked = sentences
    .map((text) => {
      const words = text.toLowerCase().match(/[a-z0-9]{3,}/g) || [];
      const score =
        words.reduce((sum, word) => sum + (stopWords.has(word) ? 0 : frequencies.get(word) || 0), 0) /
        Math.max(words.length, 1);
      return { text, score };
    })
    .sort((a, b) => b.score - a.score);

  const selected = [...new Set(ranked.slice(0, Math.min(2, ranked.length)).map((item) => item.text))];
  const normalized = sentences.join(" ").toLowerCase();
  const sentiment = /bahaya|rusak|lambat|kecewa|belum|bocor|macet|mati|sampah/.test(normalized)
    ? "Perlu perhatian pada kendala yang disampaikan warga."
    : "Komentar warga cenderung berupa masukan dan dukungan.";

  return `Rangkuman NLP dari ${comments.length} komentar: ${selected.join(" ")} ${sentiment}`;
};

const normalizeReportComment = (comment, index, reportId) => ({
  id: comment.id || `${reportId}-comment-${index}`,
  ownerId: comment.ownerId || "",
  name: comment.name || "Warga Desa",
  time: comment.time || "",
  text: String(comment.text || "").trim(),
});

const detectReportUrgency = (report) =>
  /\b(darurat|berbahaya|bahaya|roboh|putus|kebakaran|banjir|longsor|ambruk|kecelakaan|parah|mengancam)\b/i.test(
    `${report.title} ${report.description}`,
  );

const recordNotification = async ({ title, description, icon, color, action, eventKey = null }) => {
  const result = await pool.query(
    "INSERT INTO notifications (title, description, icon, color, action, event_key) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (event_key) DO NOTHING RETURNING id, title, description, icon, color, action, created_at, read_at",
    [title, description, icon, color, JSON.stringify(action), eventKey],
  );
  return result.rows[0];
};

const recordUserNotification = async ({ userId, title, description, icon, color, action, eventKey }) => {
  const result = await pool.query(
    `INSERT INTO user_notifications (user_id, title, description, icon, color, action, event_key)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id, event_key) DO NOTHING
     RETURNING id, title, description, icon, color, action, created_at, read_at`,
    [userId, title, description, icon, color, JSON.stringify(action), eventKey],
  );
  return result.rows[0];
};

const pushIsConfigured = () => Boolean(
  process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT,
);

const sendPushToUser = async (userId, { title, body, url = "/riwayat", tag }) => {
  if (!pushIsConfigured()) return;
  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
  const result = await pool.query("SELECT id, subscription FROM push_subscriptions WHERE user_id = $1", [userId]);
  await Promise.all(result.rows.map(async (row) => {
    try {
      await webPush.sendNotification(row.subscription, JSON.stringify({ title, body, url, tag }), { TTL: 86400 });
    } catch (error) {
      if ([404, 410].includes(error.statusCode)) {
        await pool.query("DELETE FROM push_subscriptions WHERE id = $1", [row.id]);
      } else {
        console.error("Pengiriman push ke perangkat warga gagal:", error.statusCode || error.message);
      }
    }
  }));
};

const escapeHtml = (value) => String(value ?? "").replace(/[&<>\"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[char]);

const sendTransactionalEmail = async ({ to, subject, text, html }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return false;
  try {
    const result = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, text, html }),
      signal: AbortSignal.timeout(8000),
    });
    if (!result.ok) console.error("Layanan email menolak permintaan dengan status", result.status);
    return result.ok;
  } catch (error) {
    console.error("Pengiriman email gagal:", error.message);
    return false;
  }
};

const sendEmailVerification = async ({ email, fullname, token }) => {
  const baseUrl = (process.env.APP_BASE_URL || `http://localhost:${port}`).replace(/\/$/, "");
  const link = `${baseUrl}/api/email/verify?token=${encodeURIComponent(token)}`;
  const name = escapeHtml(fullname || "Warga Desa");
  return sendTransactionalEmail({
    to: email,
    subject: "Konfirmasi notifikasi email E-Aspirasi Desa Jarak",
    text: `Halo ${fullname || "Warga Desa"}, buka tautan berikut untuk mengaktifkan notifikasi status aspirasi: ${link}\nTautan berlaku selama 30 menit.`,
    html: `<p>Halo ${name},</p><p>Konfirmasi alamat email Anda untuk mengaktifkan notifikasi status aspirasi E-Aspirasi Desa Jarak.</p><p><a href="${link}">Konfirmasi email</a></p><p>Tautan berlaku selama 30 menit. Jika Anda tidak meminta ini, abaikan email ini.</p>`,
  });
};

const formatNotification = (row) => ({
  id: row.id,
  title: row.title,
  desc: row.description,
  icon: row.icon,
  color: row.color,
  action: row.action,
  createdAt: row.created_at,
  readAt: row.read_at,
});

const normalizeNewsComment = (comment, index, postId) => {
  const text = comment.text || comment.teks || "";
  if (!text || defaultNewsComments.has(text.trim())) return null;
  const originalName = comment.name || comment.nama || "Warga Desa";
  const name = originalName === "Admin Desa" ? "Admin Desa Jarak" : originalName;

  return {
    id: comment.id || `${postId}-comment-${index}`,
    name,
    role: comment.role || (["Admin Desa", "Admin Desa Jarak"].includes(originalName) ? "admin" : "user"),
    time: comment.time || comment.waktu || "",
    text,
    quotedName: comment.quotedName || "",
    quotedText: comment.quotedText || "",
    replies: (comment.replies || [])
      .map((reply, replyIndex) => normalizeNewsComment(reply, `${index}-${replyIndex}`, postId))
      .filter(Boolean),
  };
};

const migrateNews = (items) =>
  items.map((item) => {
    let image = item.image;
    if (
      item.title === "Pembangunan Posyandu Baru Dusun Jarak Lor" &&
      image?.startsWith("https://images.unsplash.com/photo-1577495508048-b635879837f1")
    )
      image = "/images/posyandu.jpg";

    if (
      item.title === "Dana Desa Tahap II Rp 240 Juta Disalurkan" &&
      image?.startsWith("https://images.unsplash.com/photo-1554224155-8d04cb21cd6c")
    )
      image = "/images/dana.jpg";

    const commentsList = (item.commentsList || [])
      .map((comment, index) => normalizeNewsComment(comment, index, item.id))
      .filter(Boolean);

    return {
      ...item,
      image,
      commentsList,
      comments: countComments(commentsList),
    };
  });

const sendJson = (response, status, payload) => {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
};

const readJson = async (request) => {
  let body = "";
  for await (const chunk of request) body += chunk;
  return body ? JSON.parse(body) : {};
};

const hashPassword = (password, salt = randomBytes(16).toString("hex")) => ({
  salt,
  hash: scryptSync(password, salt, 64).toString("hex"),
});

const passwordMatches = (password, salt, expected) =>
  createHash("sha256")
    .update(hashPassword(password, salt).hash)
    .digest("hex") === createHash("sha256").update(expected).digest("hex");

const safeUser = (user) => ({
  userId: user.username,
  username: user.username,
  name: user.fullname || user.nama || user.username,
  email: user.email || "",
  role: user.role === "admin" ? "admin" : "user",
});

const createSession = async (user) => {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await pool.query(
    "INSERT INTO user_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)",
    [createHash("sha256").update(token).digest("hex"), user.id, expiresAt],
  );
  return { ...safeUser(user), token, expiresAt: expiresAt.toISOString() };
};

const getAuthenticatedUser = async (request) => {
  const authorization = request.headers.authorization || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) return null;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const result = await pool.query(
    `SELECT u.id, u.username, u.fullname, u.nama, u.email, u.role
     FROM user_sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > NOW()`,
    [tokenHash],
  );
  return result.rows[0] || null;
};

const isAdmin = (user) => user?.role === "admin" || user?.username === "admin";

const uploadMimeType = (filename) => ({
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
}[extname(filename).toLowerCase()] || "application/octet-stream");

const verifyGoogleCredential = async (credential) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    const error = new Error("Login Google belum dikonfigurasi. Atur GOOGLE_CLIENT_ID pada environment backend.");
    error.status = 503;
    throw error;
  }
  if (!credential || typeof credential !== "string" || credential.length > 10000) {
    const error = new Error("Kredensial Google tidak valid.");
    error.status = 400;
    throw error;
  }

  let ticket;
  try {
    ticket = await googleAuthClient.verifyIdToken({ idToken: credential, audience: clientId });
  } catch (verificationError) {
    const networkErrorCodes = new Set(["ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED"]);
    const verificationCode = verificationError.code || verificationError.cause?.code;
    const certificatesUnavailable = verificationError.message?.startsWith("Failed to retrieve verification certificates") ||
      networkErrorCodes.has(verificationCode) || verificationError.response?.status >= 500;
    const error = new Error(certificatesUnavailable
      ? "Server tidak dapat menghubungi layanan verifikasi Google. Coba lagi beberapa saat."
      : "Verifikasi akun Google gagal. Pastikan Client ID sesuai lalu coba lagi.");
    error.status = certificatesUnavailable ? 503 : 401;
    throw error;
  }

  const claims = ticket.getPayload();
  if (!claims?.sub || !claims.email || claims.email_verified !== true) {
    const error = new Error("Akun Google tidak dapat diverifikasi untuk aplikasi ini.");
    error.status = 401;
    throw error;
  }
  return claims;
};

const mutateNews = async (mutator) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query("SELECT data_value FROM app_data WHERE data_key = $1 FOR UPDATE", ["news"]);
    const outcome = mutator(result.rows[0]?.data_value || []);
    if (!outcome) {
      await client.query("ROLLBACK");
      return null;
    }
    await client.query("UPDATE app_data SET data_value = $1, updated_at = NOW() WHERE data_key = $2", [
      JSON.stringify(outcome.news),
      "news",
    ]);
    await client.query("COMMIT");
    return outcome.value;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const mutateEducation = async (mutator) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query("SELECT data_value FROM app_data WHERE data_key = $1 FOR UPDATE", ["edukasi"]);
    const outcome = mutator(result.rows[0]?.data_value || []);
    if (!outcome) {
      await client.query("ROLLBACK");
      return null;
    }
    await client.query("UPDATE app_data SET data_value = $1, updated_at = NOW() WHERE data_key = $2", [
      JSON.stringify(outcome.education),
      "edukasi",
    ]);
    await client.query("COMMIT");
    return outcome.value;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const mutateReports = async (mutator) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query("SELECT data_value FROM app_data WHERE data_key = $1 FOR UPDATE", ["reports"]);
    const outcome = mutator(result.rows[0]?.data_value || []);
    if (!outcome) {
      await client.query("ROLLBACK");
      return null;
    }
    await client.query("UPDATE app_data SET data_value = $1, updated_at = NOW() WHERE data_key = $2", [
      JSON.stringify(outcome.reports),
      "reports",
    ]);
    await client.query("COMMIT");
    return outcome.value;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const awardPoints = async (userId, activityType, referenceId, description, points) => {
  const result = await pool.query(
    `WITH new_activity AS (
       INSERT INTO reward_activities (user_id, activity_type, reference_id, description, points)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, activity_type, reference_id) DO NOTHING
       RETURNING user_id, points
     )
     UPDATE users
     SET poin = COALESCE(users.poin, 0) + new_activity.points
     FROM new_activity
     WHERE users.id = new_activity.user_id
     RETURNING users.poin`,
    [userId, activityType, String(referenceId), description, points],
  );
  return result.rows[0]?.poin ?? null;
};

const initDatabase = async () => {
  try {
    await pool.query(`ALTER TABLE komentar ALTER COLUMN aspirasi_id TYPE TEXT;`);
    await pool.query(`ALTER TABLE komentar ALTER COLUMN user_id TYPE TEXT;`);
  } catch (e) {}

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_data (
      data_key TEXT PRIMARY KEY,
      data_value JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      username TEXT UNIQUE,
      fullname TEXT,
      password_hash TEXT,
      password_salt TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      endpoint TEXT NOT NULL UNIQUE,
      subscription JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS user_sessions (
      token_hash TEXT PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS report_votes (
      report_id TEXT NOT NULL,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (report_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS reward_activities (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      activity_type TEXT NOT NULL,
      reference_id TEXT NOT NULL,
      description TEXT NOT NULL,
      points INT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, activity_type, reference_id)
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id BIGSERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      action JSONB NOT NULL,
      event_key TEXT UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      read_at TIMESTAMPTZ
    );
    CREATE TABLE IF NOT EXISTS user_notifications (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      action JSONB NOT NULL,
      event_key TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      read_at TIMESTAMPTZ,
      UNIQUE (user_id, event_key)
    );
    CREATE TABLE IF NOT EXISTS komentar (
      id BIGSERIAL PRIMARY KEY,
      aspirasi_id TEXT,
      user_id TEXT,
      isi_komentar TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS kategori_infrastruktur (
      id BIGSERIAL PRIMARY KEY,
      nama_kategori TEXT NOT NULL,
      deskripsi TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS nama TEXT;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'warga';`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS poin INT DEFAULT 0;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS no_telepon TEXT;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS alamat TEXT;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS foto TEXT;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS nik TEXT;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub TEXT;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token_hash TEXT;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMPTZ;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_sent_at TIMESTAMPTZ;`);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS users_google_sub_unique ON users (google_sub) WHERE google_sub IS NOT NULL;`);

    await pool.query(`ALTER TABLE komentar ALTER COLUMN aspirasi_id TYPE TEXT;`);
    await pool.query(`ALTER TABLE komentar ALTER COLUMN user_id TYPE TEXT;`);
  } catch (err) {}

  try {
    await pool.query("CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_lower ON users (LOWER(email)) WHERE email IS NOT NULL");
  } catch (error) {
    console.warn("Index email unik tidak dibuat; periksa email pengguna duplikat.", error.message);
  }

  const legacyPasswords = await pool.query("SELECT id, password FROM users WHERE password IS NOT NULL AND password <> ''");
  for (const user of legacyPasswords.rows) {
    const credentials = hashPassword(user.password);
    await pool.query(
      "UPDATE users SET password_hash = $1, password_salt = $2, password = NULL WHERE id = $3",
      [credentials.hash, credentials.salt, user.id],
    );
  }

  for (const [key, value] of Object.entries(seedData)) {
    await pool.query(
      "INSERT INTO app_data (data_key, data_value) VALUES ($1, $2) ON CONFLICT (data_key) DO NOTHING",
      [key, JSON.stringify(value)],
    );
  }

  const storedEducation = await pool.query("SELECT data_value FROM app_data WHERE data_key = $1", ["edukasi"]);
  const currentEducation = storedEducation.rows[0]?.data_value || [];
  if (!currentEducation.length || !currentEducation.some((item) => item.slug && item.sections)) {
    const migratedEducation = seedEducation.map((item) => ({
      ...item,
      updatedAt: item.updatedAt || new Date().toISOString(),
    }));
    await pool.query("UPDATE app_data SET data_value = $1, updated_at = NOW() WHERE data_key = $2", [
      JSON.stringify(migratedEducation),
      "edukasi",
    ]);
  } else {
    const normalizedEducation = removeEducationIcons(currentEducation).map((item) => ({
      ...item,
      updatedAt: item.updatedAt || new Date().toISOString(),
    }));
    await pool.query("UPDATE app_data SET data_value = $1 WHERE data_key = $2", [
      JSON.stringify(normalizedEducation),
      "edukasi",
    ]);
  }

  const storedNews = await pool.query("SELECT data_value FROM app_data WHERE data_key = $1", ["news"]);
  const normalizedNews = migrateNews(storedNews.rows[0]?.data_value || []);
  await pool.query("UPDATE app_data SET data_value = $1, updated_at = NOW() WHERE data_key = $2", [
    JSON.stringify(normalizedNews),
    "news",
  ]);

  const storedReports = await pool.query("SELECT data_value FROM app_data WHERE data_key = $1", ["reports"]);
  for (const report of storedReports.rows[0]?.data_value || []) {
    if (report.urgency === "Tinggi") {
      await recordNotification({
        title: "Laporan berurgensi tinggi perlu perhatian",
        description: `${report.id}: ${report.title}`,
        icon: "fa-triangle-exclamation",
        color: "bg-rose-50 text-rose-600",
        action: { type: "report", id: report.id },
        eventKey: `high-urgency-${report.id}`,
      });
    }
  }

  const storedUserNews = await pool.query("SELECT data_value FROM app_data WHERE data_key = $1", ["userBerita"]);
  const userNews = (storedUserNews.rows[0]?.data_value || []).map((item) => {
    let image = item.image;
    if (image?.startsWith("https://images.unsplash.com/photo-1577495508048-b635879837f1")) image = "/images/posyandu.jpg";
    if (image?.startsWith("https://images.unsplash.com/photo-1554224155-8d04cb21cd6c")) image = "/images/dana.jpg";

    return {
      ...item,
      image,
      komentar: (item.komentar || []).filter(
        (comment) => !defaultNewsComments.has(String(comment.teks || comment.text || "").trim()),
      ),
    };
  });
  await pool.query("UPDATE app_data SET data_value = $1, updated_at = NOW() WHERE data_key = $2", [
    JSON.stringify(userNews),
    "userBerita",
  ]);

  for (const [username, fullname, rawPassword, role] of [
    ["admin", "Admin Desa", process.env.ADMIN_PASSWORD || "admin", "admin"],
    ["warga", "Warga Desa", "warga", "warga"],
  ]) {
    const credentials = hashPassword(rawPassword);
    const email = `${username}@desa.id`;
    
    // PERBAIKAN ERROR CRASH SEEDING: Cek keberadaan email dan username sebelum melakukan insert
    try {
      const existingUser = await pool.query("SELECT id FROM users WHERE username = $1 OR email = $2", [username, email]);
      if (existingUser.rows.length === 0) {
        await pool.query(
          `INSERT INTO users (username, fullname, password_hash, password_salt, nama, email, role, poin)
           VALUES ($1, $2, $3, $4, $2, $5, $6, 0)`,
          [username, fullname, credentials.hash, credentials.salt, email, role],
        ); 
      }
    } catch (err) {
      console.error(`Gagal menyuntikkan user ${username}:`, err.message);
    }
  }
};

const handleApi = async (request, response, url) => {
  const { pathname, searchParams } = url;
  const principal = await getAuthenticatedUser(request);

  if (request.method === "GET" && pathname === "/api/auth/config") {
    return sendJson(response, 200, { googleClientId: process.env.GOOGLE_CLIENT_ID || "" });
  }

  if (request.method === "GET" && pathname === "/api/auth/session") {
    if (!principal) return sendJson(response, 401, { message: "Sesi tidak berlaku." });
    return sendJson(response, 200, safeUser(principal));
  }

  if (request.method === "GET" && pathname === "/api/user/push-config") {
    if (!principal || isAdmin(principal)) return sendJson(response, 401, { message: "Masuk sebagai warga untuk mengatur notifikasi HP." });
    const endpoint = searchParams.get("endpoint") || "";
    const subscribed = endpoint
      ? await pool.query("SELECT 1 FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2", [principal.id, endpoint])
      : { rows: [] };
    return sendJson(response, 200, {
      configured: pushIsConfigured(),
      publicKey: process.env.VAPID_PUBLIC_KEY || "",
      subscribed: subscribed.rows.length > 0,
    });
  }

  if (request.method === "POST" && pathname === "/api/user/push-subscriptions") {
    if (!principal || isAdmin(principal)) return sendJson(response, 401, { message: "Masuk sebagai warga untuk mengaktifkan notifikasi HP." });
    if (!pushIsConfigured()) return sendJson(response, 503, { message: "Notifikasi HP belum dikonfigurasi pengelola website." });
    const body = await readJson(request);
    const subscription = body.subscription;
    const endpoint = typeof subscription?.endpoint === "string" ? subscription.endpoint : "";
    if (!endpoint.startsWith("https://") || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return sendJson(response, 400, { message: "Data langganan notifikasi browser tidak valid." });
    }
    await pool.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, subscription)
       VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (endpoint) DO UPDATE SET user_id = EXCLUDED.user_id, subscription = EXCLUDED.subscription, updated_at = NOW()`,
      [principal.id, endpoint, JSON.stringify(subscription)],
    );
    return sendJson(response, 200, { subscribed: true });
  }

  if (request.method === "DELETE" && pathname === "/api/user/push-subscriptions") {
    if (!principal || isAdmin(principal)) return sendJson(response, 401, { message: "Masuk sebagai warga untuk mengatur notifikasi HP." });
    const body = await readJson(request);
    if (typeof body.endpoint !== "string" || !body.endpoint.startsWith("https://")) {
      return sendJson(response, 400, { message: "Alamat langganan notifikasi tidak valid." });
    }
    await pool.query("DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2", [principal.id, body.endpoint]);
    return sendJson(response, 200, { subscribed: false });
  }

  if (request.method === "GET" && pathname === "/api/user/notifications") {
    if (!principal || isAdmin(principal)) return sendJson(response, 401, { message: "Masuk sebagai warga untuk melihat notifikasi." });
    const [items, unread] = await Promise.all([
      pool.query(
        "SELECT id, title, description, icon, color, action, created_at, read_at FROM user_notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100",
        [principal.id],
      ),
      pool.query("SELECT COUNT(*)::int AS count FROM user_notifications WHERE user_id = $1 AND read_at IS NULL", [principal.id]),
    ]);
    return sendJson(response, 200, {
      items: items.rows.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        icon: item.icon,
        color: item.color,
        action: item.action,
        createdAt: item.created_at,
        readAt: item.read_at,
      })),
      unreadCount: unread.rows[0]?.count || 0,
    });
  }

  if (request.method === "POST" && pathname === "/api/user/notifications/read") {
    if (!principal || isAdmin(principal)) return sendJson(response, 401, { message: "Masuk sebagai warga untuk memperbarui notifikasi." });
    const readAt = new Date().toISOString();
    await pool.query("UPDATE user_notifications SET read_at = $1 WHERE user_id = $2 AND read_at IS NULL", [readAt, principal.id]);
    return sendJson(response, 200, { ok: true, readAt });
  }

  if (request.method === "GET" && pathname === "/api/user/email-preferences") {
    if (!principal || isAdmin(principal)) return sendJson(response, 401, { message: "Masuk sebagai warga untuk mengatur notifikasi email." });
    const result = await pool.query("SELECT email, email_verified, email_notifications_enabled FROM users WHERE id = $1", [principal.id]);
    const user = result.rows[0];
    return sendJson(response, 200, {
      email: user?.email || "",
      emailVerified: Boolean(user?.email_verified),
      enabled: Boolean(user?.email_notifications_enabled),
      configured: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
    });
  }

  if (request.method === "PUT" && pathname === "/api/user/email-preferences") {
    if (!principal || isAdmin(principal)) return sendJson(response, 401, { message: "Masuk sebagai warga untuk mengatur notifikasi email." });
    const body = await readJson(request);
    const enabled = Boolean(body.enabled);
    const result = await pool.query("SELECT email, fullname, email_verified, email_notifications_enabled, email_verification_sent_at FROM users WHERE id = $1", [principal.id]);
    const user = result.rows[0];
    if (!user?.email) return sendJson(response, 400, { message: "Tambahkan alamat email pada akun Anda terlebih dahulu." });
    if (!enabled) {
      await pool.query("UPDATE users SET email_notifications_enabled = FALSE, email_verification_token_hash = NULL, email_verification_expires_at = NULL, email_verification_sent_at = NULL WHERE id = $1", [principal.id]);
      return sendJson(response, 200, { enabled: false, emailVerified: Boolean(user.email_verified), email: user.email });
    }
    if (user.email_verified) {
      await pool.query("UPDATE users SET email_notifications_enabled = TRUE WHERE id = $1", [principal.id]);
      return sendJson(response, 200, { enabled: true, emailVerified: true, email: user.email });
    }
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
      return sendJson(response, 503, { message: "Pengiriman email belum dikonfigurasi oleh pengelola website." });
    }
    if (user.email_verification_sent_at && Date.now() - new Date(user.email_verification_sent_at).getTime() < 60_000) {
      return sendJson(response, 429, { message: "Email konfirmasi baru saja dikirim. Tunggu satu menit sebelum meminta lagi." });
    }
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await pool.query("UPDATE users SET email_verification_token_hash = $1, email_verification_expires_at = NOW() + INTERVAL '30 minutes', email_verification_sent_at = NOW() WHERE id = $2", [tokenHash, principal.id]);
    const sent = await sendEmailVerification({ email: user.email, fullname: user.fullname || principal.nama, token });
    if (!sent) {
      await pool.query("UPDATE users SET email_verification_token_hash = NULL, email_verification_expires_at = NULL, email_verification_sent_at = NULL WHERE id = $1", [principal.id]);
      return sendJson(response, 502, { message: "Email konfirmasi gagal dikirim. Periksa konfigurasi layanan email." });
    }
    return sendJson(response, 200, { enabled: false, emailVerified: false, verificationSent: true, email: user.email });
  }

  if (request.method === "GET" && pathname === "/api/email/verify") {
    const token = searchParams.get("token") || "";
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const verified = await pool.query("UPDATE users SET email_verified = TRUE, email_notifications_enabled = TRUE, email_verification_token_hash = NULL, email_verification_expires_at = NULL, email_verification_sent_at = NULL WHERE email_verification_token_hash = $1 AND email_verification_expires_at > NOW() RETURNING id", [tokenHash]);
    const success = verified.rowCount > 0;
    response.writeHead(success ? 200 : 400, { "Content-Type": "text/html; charset=utf-8" });
    response.end(success
      ? "<!doctype html><html lang='id'><meta charset='utf-8'><title>Email dikonfirmasi</title><body style='font:16px sans-serif;max-width:560px;margin:15vh auto;padding:24px'><h1>Email berhasil dikonfirmasi</h1><p>Notifikasi status aspirasi sekarang aktif. Anda dapat kembali ke dashboard E-Aspirasi Desa Jarak.</p></body></html>"
      : "<!doctype html><html lang='id'><meta charset='utf-8'><title>Tautan tidak berlaku</title><body style='font:16px sans-serif;max-width:560px;margin:15vh auto;padding:24px'><h1>Tautan konfirmasi tidak berlaku</h1><p>Silakan masuk kembali dan minta email konfirmasi baru dari halaman Pengaturan.</p></body></html>");
    return;
  }

  if (request.method === "DELETE" && pathname === "/api/auth/session") {
    const token = (request.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
    if (token) {
      await pool.query("DELETE FROM user_sessions WHERE token_hash = $1", [createHash("sha256").update(token).digest("hex")]);
    }
    return sendJson(response, 200, { success: true });
  }

  if (request.method === "POST" && pathname === "/api/auth/google") {
    const body = await readJson(request);
    try {
      const claims = await verifyGoogleCredential(body.credential);
      const existing = await pool.query(
        "SELECT * FROM users WHERE google_sub = $1 OR LOWER(email) = LOWER($2) ORDER BY CASE WHEN google_sub = $1 THEN 0 ELSE 1 END LIMIT 1",
        [claims.sub, claims.email],
      );
      let user = existing.rows[0];
      const displayName = String(claims.name || claims.given_name || claims.email.split("@")[0]).trim();
      if (user && isAdmin(user)) {
        return sendJson(response, 403, { message: "Akun admin harus masuk menggunakan password admin." });
      }

      if (user) {
        const linked = await pool.query(
          "UPDATE users SET google_sub = COALESCE(google_sub, $1), email_verified = TRUE, foto = COALESCE(foto, $2), fullname = COALESCE(NULLIF(fullname, ''), $3), nama = COALESCE(NULLIF(nama, ''), $3) WHERE id = $4 RETURNING *",
          [claims.sub, claims.picture || null, displayName, user.id],
        );
        user = linked.rows[0];
      } else {
        const username = `google-${claims.sub}`;
        const created = await pool.query(
          `INSERT INTO users (username, fullname, nama, email, google_sub, foto, role, poin, email_verified)
           VALUES ($1, $2, $2, $3, $4, $5, 'warga', 0, TRUE) RETURNING *`,
          [username, displayName, claims.email, claims.sub, claims.picture || null],
        );
        user = created.rows[0];
      }

      return sendJson(response, 200, { success: true, ...await createSession(user) });
    } catch (error) {
      if (error.status) return sendJson(response, error.status, { message: error.message });
      if (error.code === "23505") return sendJson(response, 409, { message: "Akun Google sudah terhubung ke pengguna lain." });
      throw error;
    }
  }

  // --- API GET DAFTAR KATEGORI INFRASTRUKTUR ---
  if (request.method === "GET" && pathname === "/api/categories") {
    try {
      const result = await pool.query("SELECT id, nama_kategori FROM kategori_infrastruktur ORDER BY id ASC");
      if (result.rows.length === 0) {
        const defaultCategories = ["Jalan & Fasilitas", "Penerangan", "Lingkungan", "Lainnya"];
        return sendJson(response, 200, defaultCategories.map((name, index) => ({
          id: index + 1,
          nama_kategori: name
        })));
      }
      return sendJson(response, 200, result.rows);
    } catch (error) {
      console.error("Database error during fetching categories:", error);
      return sendJson(response, 500, { message: "Gagal memuat kategori." });
    }
  }

  // --- API POST TAMBAH KATEGORI ---
  if (request.method === "POST" && pathname === "/api/categories") {
    if (!isAdmin(principal)) return sendJson(response, 403, { message: "Akses admin diperlukan." });
    const body = await readJson(request);
   
    if (!body.nama_kategori) return sendJson(response, 400, { message: "Nama kategori wajib diisi" });
    try {
      // Menyisipkan "-" ke kolom deskripsi untuk menghindari error NOT NULL
      const result = await pool.query(
        "INSERT INTO kategori_infrastruktur (nama_kategori, deskripsi) VALUES ($1, $2) RETURNING *",
        [body.nama_kategori, "-"]
      );

      return sendJson(response, 201, result.rows[0]);
    } catch (error) {
      console.error("==> ERROR DATABASE SIMPAN KATEGORI:", error);
      return sendJson(response, 500, { message: "Database Error: " + error.message });
    }
  }

  // --- API DELETE KATEGORI ---
  if (request.method === "DELETE" && pathname.startsWith("/api/categories/")) {
    if (!isAdmin(principal)) return sendJson(response, 403, { message: "Akses admin diperlukan." });
    const id = pathname.split("/").pop();
    try {
      await pool.query("DELETE FROM kategori_infrastruktur WHERE id = $1", [id]);
      return sendJson(response, 200, { message: "Kategori terhapus" });
    } catch (error) {
      console.error(error);
      return sendJson(response, 500, { message: "Gagal menghapus kategori" });
    }
  }

  if (request.method === "GET" && pathname === "/api/notifications") {
    if (!isAdmin(principal)) return sendJson(response, 403, { message: "Akses admin diperlukan." });
    const result = await pool.query(
      "SELECT id, title, description, icon, color, action, created_at, read_at FROM notifications ORDER BY created_at DESC LIMIT 100",
    );
    const unread = await pool.query("SELECT COUNT(*)::int AS count FROM notifications WHERE read_at IS NULL");
    return sendJson(response, 200, {
      items: result.rows.map(formatNotification),
      unreadCount: unread.rows[0]?.count || 0,
    });
  }
  if (request.method === "POST" && pathname === "/api/notifications/read") {
    if (!isAdmin(principal)) return sendJson(response, 403, { message: "Akses admin diperlukan." });
    const readAt = new Date().toISOString();
    await pool.query("UPDATE notifications SET read_at = $1 WHERE read_at IS NULL", [readAt]);
    return sendJson(response, 200, { ok: true, readAt });
  }
if (request.method === "GET" && pathname === "/api/ai/classify-test") {
  const description = "Toilet umum di balai desa rusak dan tidak dapat digunakan.";

  const category = await classifyReportWithGemini(description);

  return sendJson(response, 200, {
    success: true,
    description,
    category: category || "Belum diklasifikasi",
  });
}

  if (request.method === "POST" && pathname === "/api/assistant") {
    const body = await readJson(request);
    const message = String(body.message || "").trim().slice(0, 1000);
    if (!message) return sendJson(response, 400, { message: "Tulis pertanyaan terlebih dahulu." });
    const reportResult = await pool.query("SELECT data_value FROM app_data WHERE data_key = 'reports'");
    const availableReports = (reportResult.rows[0]?.data_value || []).filter((report) =>
      report.visibility !== "private" || (principal && String(report.ownerId) === principal.username),
    );
    const reportContext = availableReports.map(({ id, title, status, category }) => ({ id, title, status, category }));
    if (ai) {
      try {
        const result = await ai.models.generateContent({
          model: "gemini-3.5-flash-lite",
          contents: `Kamu asisten layanan warga Desa Jarak. Jawab singkat, sopan, dalam Bahasa Indonesia. Jangan mengarang kebijakan/nomor kontak. Jika data tidak tersedia, katakan demikian. Data aspirasi yang boleh diketahui pengguna ini: ${JSON.stringify(reportContext)}\n\nPertanyaan warga: ${message}`,
        });
        if (result.text?.trim()) return sendJson(response, 200, { reply: result.text.trim(), mode: "ai" });
      } catch (error) {
        console.error("Asisten AI gagal menjawab:", error.message);
      }
    }
    const normalized = message.toLowerCase();
    const idMatch = message.match(/\bJR-[\w-]+\b/i);
    const matchedReport = idMatch && availableReports.find((report) => String(report.id).toLowerCase() === idMatch[0].toLowerCase());
    let reply;
    if (matchedReport) reply = `Laporan ${matchedReport.id} (${matchedReport.title}) berstatus ${matchedReport.status}.`;
    else if (normalized.includes("privasi") || normalized.includes("rahasia") || normalized.includes("pribadi")) reply = "Aspirasi dengan pilihan privat hanya dapat dilihat oleh akun Anda dan petugas admin. Pilih opsi Privat saat mengirim aspirasi.";
    else if (normalized.includes("lapor") || normalized.includes("aspirasi")) reply = "Buka menu Aspirasi, isi judul, lokasi, dan deskripsi dengan jelas. Anda dapat memilih laporan privat atau publik sebelum mengirim.";
    else if (normalized.includes("status") || normalized.includes("lacak")) reply = "Untuk melihat tindak lanjut, buka menu Lacak atau Riwayat. Masukkan kode laporan seperti JR-123456 agar saya dapat membantu mengecek statusnya.";
    else if (normalized.includes("berapa hari") || normalized.includes("ditindaklanjuti")) reply = "Waktu tindak lanjut bergantung pada jenis masalah dan proses pemeriksaan desa. Pantau status terbaru melalui menu Riwayat atau Lacak Laporan.";
    else reply = "Saya dapat membantu menjelaskan cara membuat aspirasi, privasi laporan, dan cara melacak status. Sertakan kode laporan jika ingin mengecek status tertentu.";
    return sendJson(response, 200, { reply, mode: "guide" });
  }

  if (request.method === "GET" && pathname === "/api/rewards") {
    if (!principal || isAdmin(principal)) return sendJson(response, 401, { message: "Masuk sebagai warga untuk melihat poin reward." });
    const [userResult, rankResult, leaderboardResult, activityResult, reportResult] = await Promise.all([
      pool.query("SELECT COALESCE(poin, 0)::int AS points FROM users WHERE id = $1", [principal.id]),
      pool.query("SELECT rank::int FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY COALESCE(poin, 0) DESC, created_at ASC, id ASC) AS rank FROM users WHERE role <> 'admin') ranked WHERE id = $1", [principal.id]),
      pool.query("SELECT id, COALESCE(poin, 0)::int AS points FROM users WHERE role <> 'admin' ORDER BY COALESCE(poin, 0) DESC, created_at ASC, id ASC LIMIT 10"),
      pool.query("SELECT activity_type, reference_id, description, points, created_at FROM reward_activities WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20", [principal.id]),
      pool.query("SELECT data_value FROM app_data WHERE data_key = 'reports'"),
    ]);
    const userReports = (reportResult.rows[0]?.data_value || []).filter((report) => String(report.ownerId) === principal.username).length;
    const totalsResult = await pool.query("SELECT activity_type, COUNT(*)::int AS count FROM reward_activities WHERE user_id = $1 GROUP BY activity_type", [principal.id]);
    const totals = Object.fromEntries(totalsResult.rows.map((row) => [row.activity_type, row.count]));
    const citizens = await pool.query("SELECT COUNT(*)::int AS count FROM users WHERE role <> 'admin'");
    return sendJson(response, 200, {
      points: userResult.rows[0]?.points || 0,
      rank: Number(rankResult.rows[0]?.rank || 1),
      citizenCount: citizens.rows[0]?.count || 0,
      counts: { reports: userReports, votes: totals.vote || 0, comments: (totals.report_comment || 0) + (totals.news_comment || 0) },
      leaderboard: leaderboardResult.rows.map((row, index) => ({ name: `Warga #${index + 1}`, points: row.points })),
      activities: activityResult.rows.map((row) => ({ type: row.activity_type, referenceId: row.reference_id, description: row.description, points: row.points, createdAt: row.created_at })),
    });
  }

  if (request.method === "GET" && pathname === "/api/reports") {
    const scope = searchParams.get("scope") || (isAdmin(principal) ? "all" : "public");
    if (!["public", "accessible", "mine", "all"].includes(scope)) {
      return sendJson(response, 400, { message: "Pilihan daftar laporan tidak valid." });
    }
    if (["mine", "all"].includes(scope) && !principal) {
      return sendJson(response, 401, { message: "Masuk ke akun warga untuk melihat riwayat pribadi." });
    }
    if (scope === "all" && !isAdmin(principal)) {
      return sendJson(response, 403, { message: "Akses admin diperlukan." });
    }
    const result = await pool.query("SELECT data_value FROM app_data WHERE data_key = $1", ["reports"]);
    const stored = result.rows[0]?.data_value || [];
    const votesResult = await pool.query("SELECT report_id, COUNT(*)::int AS count FROM report_votes GROUP BY report_id");
    const voteCounts = new Map(votesResult.rows.map((row) => [String(row.report_id), row.count]));
    const myVotes = principal
      ? await pool.query("SELECT report_id FROM report_votes WHERE user_id = $1", [principal.id])
      : { rows: [] };
    const myVoteIds = new Set(myVotes.rows.map((row) => String(row.report_id)));
    const reports = stored
      .filter((report) => {
        const isPrivate = report.visibility === "private";
        if (scope === "mine") return String(report.ownerId) === principal?.username;
        if (scope === "accessible") return !isPrivate || String(report.ownerId) === principal?.username || isAdmin(principal);
        if (scope === "public") return !isPrivate;
        return true;
      })
      .map((report) => ({
        ...report,
        votes: report.votesManaged ? (voteCounts.get(String(report.id)) || 0) : (voteCounts.get(String(report.id)) || report.votes || 0),
        votedByMe: myVoteIds.has(String(report.id)),
      }));
    return sendJson(response, 200, reports);
  }
  if (request.method === "POST" && pathname === "/api/reports") {
    if (!principal || isAdmin(principal)) return sendJson(response, 401, { message: "Masuk sebagai warga untuk mengirim aspirasi." });
    const body = await readJson(request);
    if (!body.judul || !body.deskripsi || !body.lokasi) {
      return sendJson(response, 400, {
        message: "Judul, lokasi, deskripsi, dan identitas pelapor wajib diisi.",
      });
    }
const aiCategory = await classifyReportWithGemini(body.deskripsi);
    const now = new Date();
    const categoryMap = {
      Jalan: "Jalan & Fasilitas",
      Jembatan: "Jalan & Fasilitas",
      Drainase: "Jalan & Fasilitas",
      Listrik: "Penerangan",
      Air: "Lingkungan",
      Lainya: "Lainnya",
      Lainnya: "Lainnya",
    };

    const report = await mutateReports((items) => {
      const id = `JR-${String(Date.now()).slice(-6)}`;
      const latitude = Number(body.latitude);
      const longitude = Number(body.longitude);
      const hasCoordinates = body.latitude !== undefined && body.latitude !== null && body.latitude !== "" && body.longitude !== undefined && body.longitude !== null && body.longitude !== "";
      const validCoordinates = hasCoordinates && Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
      const newReport = {
        id,
        title: String(body.judul).trim(),
        author: principal.fullname || principal.nama || "Warga Desa",
        ownerId: principal.username,
        ownerName: principal.fullname || principal.nama || "Warga Desa",
        visibility: body.visibility === "public" ? "public" : "private",
        category: categoryMap[body.kategori] || body.kategori || "Lainnya",
        aiCategory: aiCategory || "Belum diklasifikasi" ,
        status: "Masuk",
        urgency: detectReportUrgency({ title: body.judul, description: body.deskripsi }) ? "Tinggi" : "Sedang",
        votes: 0,
        comments: 0,
        image: body.image || "",
        description: String(body.deskripsi).trim(),
        location: String(body.lokasi).trim(),
        infrastructureId: String(body.infrastructureId || "").trim(),
        coordinates: validCoordinates ? { latitude, longitude } : null,
        locationAccuracy: validCoordinates && body.locationAccuracy !== "" && Number.isFinite(Number(body.locationAccuracy))
          ? Math.max(0, Math.round(Number(body.locationAccuracy)))
          : null,
        locationSource: validCoordinates && ["gps", "qr-gps"].includes(body.locationSource)
          ? body.locationSource
          : null,
        rt: body.rt || "-",
        rw: body.rw || "-",
        time: body.waktu || now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        reportDate: body.tanggal || now.toLocaleDateString("id-ID"),
        aiSuggestion: "Belum ada komentar warga. Ringkasan akan dibuat setelah warga memberikan masukan.",
        officialReply: "",
        submittedAt: now.toISOString(),
        commentsList: [],
        statusHistory: [{ status: "Masuk", time: now.toISOString(), reply: "" }],
      };
      return { reports: [newReport, ...items], value: newReport };
    });

    await awardPoints(principal.id, "report", report.id, `Mengirim aspirasi ${report.id}`, 20);

    await recordNotification({
      title: report.urgency === "Tinggi" ? "Laporan baru dengan urgensi tinggi" : "Laporan baru masuk",
      description: `${report.id}: ${report.title}`,
      icon: report.urgency === "Tinggi" ? "fa-triangle-exclamation" : "fa-file-circle-plus",
      color: report.urgency === "Tinggi" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600",
      action: { type: "report", id: report.id },
      eventKey: `report-created-${report.id}`,
    });

    try {
      await recordUserNotification({
        userId: principal.id,
        title: "Terima kasih sudah mengirim laporan",
        description: `Laporan ${report.id} berhasil dikirim dan menunggu tindak lanjut admin.`,
        icon: "fa-circle-check",
        color: "bg-emerald-50 text-emerald-600",
        action: { type: "report", id: report.id },
        eventKey: `report-submitted-${report.id}`,
      });
    } catch (error) {
      console.error("Gagal menyimpan konfirmasi laporan warga:", error.message);
    }
    void sendPushToUser(principal.id, {
      title: "Laporan berhasil dikirim",
      body: "Terima kasih sudah menyampaikan laporan. Admin desa akan menindaklanjutinya.",
      url: "/riwayat",
      tag: `report-${report.id}`,
    }).catch((error) => console.error("Gagal mengirim konfirmasi laporan kepada warga:", error.message));

    return sendJson(response, 201, report);
  }

  if (request.method === "GET" && /^\/api\/uploads\/[^/]+$/.test(pathname)) {
    if (!principal) return sendJson(response, 401, { message: "Masuk untuk membuka gambar pribadi." });
    const filename = decodeURIComponent(pathname.slice("/api/uploads/".length));
    if (basename(filename) !== filename) return sendJson(response, 404, { message: "File tidak ditemukan." });
    const [profileOwner, reportsResult] = await Promise.all([
      pool.query("SELECT username FROM users WHERE foto = $1", [filename]),
      pool.query("SELECT data_value FROM app_data WHERE data_key = $1", ["reports"]),
    ]);
    const reportOwners = (reportsResult.rows[0]?.data_value || [])
      .filter((report) => report.visibility === "private" && report.image === `/uploads/${filename}`)
      .map((report) => String(report.ownerId));
    const allowed = isAdmin(principal) ||
      profileOwner.rows.some((row) => row.username === principal.username) ||
      reportOwners.includes(principal.username);
    if (!allowed) return sendJson(response, 404, { message: "File tidak ditemukan." });
    try {
      const filePath = join(uploadDir, filename);
      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) throw new Error("not-file");
      response.writeHead(200, { "Content-Type": uploadMimeType(filename), "Cache-Control": "private, max-age=300" });
      return createReadStream(filePath).pipe(response);
    } catch {
      return sendJson(response, 404, { message: "File tidak ditemukan." });
    }
  }

  if (request.method === "POST" && pathname === "/api/uploads") {
    if (!principal || isAdmin(principal)) return sendJson(response, 401, { message: "Masuk sebagai warga untuk mengunggah foto." });
    return new Promise((resolve) => {
      upload.single("file")(request, response, (error) => {
        if (error) {
          sendJson(response, 400, { message: error.message || "Gagal mengunggah foto." });
        } else if (!request.file) {
          sendJson(response, 400, { message: "Pilih foto terlebih dahulu." });
        } else {
          sendJson(response, 201, { image: `/uploads/${request.file.filename}` });
        }
        resolve();
      });
    });
  }

  if (request.method === "POST" && /^\/api\/reports\/[^/]+\/vote$/.test(pathname)) {
    if (!principal || isAdmin(principal)) return sendJson(response, 401, { message: "Masuk sebagai warga untuk mendukung laporan." });
    const id = decodeURIComponent(pathname.slice("/api/reports/".length, -"/vote".length));
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query("SELECT data_value FROM app_data WHERE data_key = $1 FOR UPDATE", ["reports"]);
      const reports = result.rows[0]?.data_value || [];
      const current = reports.find((item) => String(item.id) === id);
      if (!current || (current.visibility === "private" && String(current.ownerId) !== principal.username)) {
        await client.query("ROLLBACK");
        return sendJson(response, 404, { message: "Laporan tidak ditemukan." });
      }

      const added = await client.query(
        "INSERT INTO report_votes (report_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING report_id",
        [id, principal.id],
      );
      const votedByMe = added.rowCount > 0;
      if (!votedByMe) await client.query("DELETE FROM report_votes WHERE report_id = $1 AND user_id = $2", [id, principal.id]);
      const count = await client.query("SELECT COUNT(*)::int AS count FROM report_votes WHERE report_id = $1", [id]);
      const next = { ...current, votes: count.rows[0].count, votesManaged: true };
      await client.query(
        "UPDATE app_data SET data_value = $1, updated_at = NOW() WHERE data_key = $2",
        [JSON.stringify(reports.map((report) => String(report.id) === id ? next : report)), "reports"],
      );
      await client.query("COMMIT");
      if (votedByMe) await awardPoints(principal.id, "vote", id, `Mendukung laporan ${id}`, 50);
      return sendJson(response, 200, { ...next, votedByMe });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  if (request.method === "PUT" && /^\/api\/reports\/[^/]+$/.test(pathname)) {
    if (!isAdmin(principal)) return sendJson(response, 403, { message: "Akses admin diperlukan." });
    const id = decodeURIComponent(pathname.slice("/api/reports/".length));
    const body = await readJson(request);
    const allowedStatuses = ["Masuk", "Diproses", "Selesai", "Ditolak"];

    if (!allowedStatuses.includes(body.status)) {
      return sendJson(response, 400, { message: "Status laporan tidak valid." });
    }

    let previousReport = null;
    const updated = await mutateReports((items) => {
      const current = items.find((item) => String(item.id) === id);
      if (!current) return null;
      previousReport = current;

      const time = new Date().toISOString();
      const officialReply = String(body.officialReply ?? current.officialReply ?? "").trim();
      const statusHistory = [...(current.statusHistory || [])];

      if (current.status !== body.status || officialReply !== (current.officialReply || "")) {
        statusHistory.push({ status: body.status, time, reply: officialReply });
      }

      const next = { ...current, status: body.status, officialReply, statusHistory };
      return {
        reports: items.map((item) => (String(item.id) === id ? next : item)),
        value: next,
      };
    });

    if (updated && previousReport && (updated.status !== previousReport.status || updated.officialReply !== previousReport.officialReply)) {
      const recipient = await pool.query(
        "SELECT id, email, fullname, email_verified, email_notifications_enabled FROM users WHERE username = $1",
        [updated.ownerId],
      );
      const user = recipient.rows[0];
      const statusChanged = updated.status !== previousReport.status;
      const replyChanged = updated.officialReply !== previousReport.officialReply;
      if (user?.id) {
        const eventTime = updated.statusHistory.at(-1)?.time || new Date().toISOString();
        try {
          await recordUserNotification({
            userId: user.id,
            title: statusChanged ? "Status laporan diperbarui" : "Admin memberi tanggapan",
            description: statusChanged
              ? `Laporan ${updated.id} sekarang berstatus ${updated.status}.${updated.officialReply ? ` Tanggapan admin: ${updated.officialReply}` : ""}`
              : `Ada tanggapan baru untuk laporan ${updated.id}.${updated.officialReply ? ` Tanggapan admin: ${updated.officialReply}` : ""}`,
            icon: statusChanged ? "fa-arrows-rotate" : "fa-comment-dots",
            color: statusChanged ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600",
            action: { type: "report", id: updated.id },
            eventKey: `report-update-${updated.id}-${eventTime}`,
          });
        } catch (error) {
          console.error("Gagal menyimpan notifikasi pembaruan laporan warga:", error.message);
        }
        void sendPushToUser(user.id, {
          title: statusChanged ? "Progres laporan diperbarui" : "Ada tanggapan untuk laporan Anda",
          body: statusChanged
            ? `Laporan ${updated.id} sekarang berstatus ${updated.status}. Buka E-Aspirasi untuk melihat detail.`
            : `Admin memberi tanggapan pada laporan ${updated.id}. Buka E-Aspirasi untuk melihat detail.`,
          url: "/riwayat",
          tag: `report-${updated.id}`,
        }).catch((error) => console.error("Gagal mengirim notifikasi pembaruan laporan kepada warga:", error.message));
      }
      if (user?.email && user.email_verified && user.email_notifications_enabled) {
        const title = escapeHtml(updated.title);
        const status = escapeHtml(updated.status);
        const reply = escapeHtml(updated.officialReply || "Belum ada tanggapan tambahan.");
        await sendTransactionalEmail({
          to: user.email,
          subject: `Pembaruan aspirasi ${updated.id}: ${updated.status}`,
          text: `Halo ${user.fullname || "Warga Desa"}, status aspirasi ${updated.id} (${updated.title}) sekarang ${updated.status}. Tanggapan admin: ${updated.officialReply || "Belum ada tanggapan tambahan."}`,
          html: `<p>Halo ${escapeHtml(user.fullname || "Warga Desa")},</p><p>Ada pembaruan pada aspirasi <strong>${escapeHtml(updated.id)}</strong>: ${title}.</p><p>Status terbaru: <strong>${status}</strong></p><p>Tanggapan admin: ${reply}</p>`,
        });
      }
    }

    return updated ? sendJson(response, 200, updated) : sendJson(response, 404, { message: "Laporan tidak ditemukan." });
  }

  if (request.method === "POST" && /^\/api\/reports\/[^/]+\/comments$/.test(pathname)) {
    if (!principal) return sendJson(response, 401, { message: "Masuk ke akun untuk memberi komentar." });
    const id = decodeURIComponent(pathname.slice("/api/reports/".length, -"/comments".length));
    const body = await readJson(request);
    const text = String(body.text || "").trim();

    if (!text) {
      return sendJson(response, 400, { message: "Identitas dan isi komentar wajib diisi." });
    }

    const namaPelapor = principal.fullname || principal.nama || "Warga Desa";
    const identifierUser = principal.username;

    const updated = await mutateReports((items) => {
      const current = items.find((item) => String(item.id) === id);
      if (!current) return null;
      if (current.visibility === "private" && String(current.ownerId) !== principal.username && !isAdmin(principal)) return null;

      const commentsList = [...(current.commentsList || [])];
      commentsList.push(
        normalizeReportComment(
          {
            id: randomBytes(8).toString("hex"),
            ownerId: identifierUser,
            name: namaPelapor,
            time: new Date().toLocaleString("id-ID"),
            text,
          },
          commentsList.length,
          id,
        ),
      );

      const aiSuggestion = summarizeReportComments(commentsList);
      const next = { ...current, commentsList, comments: commentsList.length, aiSuggestion };

      return {
        reports: items.map((item) => (String(item.id) === id ? next : item)),
        value: next,
      };
    });

    if (updated) {
      try {
        await pool.query(
          "INSERT INTO komentar (aspirasi_id, user_id, isi_komentar) VALUES ($1, $2, $3)",
          [String(id), String(principal.id), text],
        );
      } catch (err) {}

      if (updated.commentsList?.length) {
        const latestComment = updated.commentsList.at(-1);
        if (!isAdmin(principal)) await awardPoints(principal.id, "report_comment", latestComment.id, `Komentar pada laporan ${updated.id}`, 50);
        await recordNotification({
          title: "Komentar baru pada laporan",
          description: `${latestComment.name} mengomentari ${updated.id}: ${updated.title}`,
          icon: "fa-comment",
          color: "bg-emerald-50 text-emerald-600",
          action: { type: "report", id: updated.id },
          eventKey: `report-comment-${latestComment.id}`,
        });
      }
      return sendJson(response, 201, updated);
    }

    return sendJson(response, 404, { message: "Laporan tidak ditemukan." });
  }

  if (request.method === "GET" && pathname === "/api/education") {
    const result = await pool.query("SELECT data_value FROM app_data WHERE data_key = $1", ["edukasi"]);
    const items = result.rows[0]?.data_value || [];
    return sendJson(response, 200, isAdmin(principal) ? items : items.filter((item) => item.status === "Publish"));
  }

  if (request.method === "POST" && pathname === "/api/education") {
    if (!isAdmin(principal)) return sendJson(response, 403, { message: "Akses admin diperlukan." });
    const body = await readJson(request);
    if (!body.title || !body.desc || !body.content) {
      return sendJson(response, 400, { message: "Judul, ringkasan, dan isi edukasi wajib diisi." });
    }

    const created = await mutateEducation((items) => {
      const id = String(Date.now());
      const slugBase = String(body.category || body.title)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const item = {
        id,
        slug: `${slugBase}-${id}`,
        category: categoryNames.includes(body.category) ? body.category : "Pembangunan Desa",
        title: String(body.title).trim(),
        desc: String(body.desc).trim(),
        subtitle: String(body.subtitle || "").trim(),
        content: String(body.content).trim(),
        sections: [],
        iconName: body.iconName || "file-check",
        image: body.image || "",
        status: body.status === "Publish" ? "Publish" : "Draft",
        updatedAt: new Date().toISOString(),
      };
      return { education: [item, ...items], value: item };
    });

    return sendJson(response, 201, created);
  }

  if (request.method === "PUT" && /^\/api\/education\/[^/]+$/.test(pathname)) {
    if (!isAdmin(principal)) return sendJson(response, 403, { message: "Akses admin diperlukan." });
    const id = decodeURIComponent(pathname.slice("/api/education/".length));
    const updates = await readJson(request);
    const allowed = ["category", "title", "desc", "subtitle", "content", "status", "image", "iconName"];

    const updated = await mutateEducation((items) => {
      const current = items.find((item) => String(item.id) === id || item.slug === id);
      if (!current) return null;

      const nextItem = {
        ...current,
        ...Object.fromEntries(allowed.filter((key) => Object.hasOwn(updates, key)).map((key) => [key, updates[key]])),
        updatedAt: new Date().toISOString(),
      };

      if (Object.hasOwn(updates, "content")) nextItem.sections = [];
      if (Object.hasOwn(updates, "category") && nextItem.category !== current.category) {
        const base = String(nextItem.category)
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        nextItem.slug = `${base}-${nextItem.id}`;
      }

      return {
        education: items.map((item) => (item === current ? nextItem : item)),
        value: nextItem,
      };
    });

    return updated ? sendJson(response, 200, updated) : sendJson(response, 404, { message: "Modul edukasi tidak ditemukan." });
  }

  if (request.method === "DELETE" && /^\/api\/education\/[^/]+$/.test(pathname)) {
    if (!isAdmin(principal)) return sendJson(response, 403, { message: "Akses admin diperlukan." });
    const id = decodeURIComponent(pathname.slice("/api/education/".length));
    const deleted = await mutateEducation((items) => {
      if (!items.some((item) => String(item.id) === id || item.slug === id)) return null;
      return {
        education: items.filter((item) => String(item.id) !== id && item.slug !== id),
        value: { id },
      };
    });

    return deleted ? sendJson(response, 200, deleted) : sendJson(response, 404, { message: "Modul edukasi tidak ditemukan." });
  }

  if (request.method === "GET" && pathname === "/api/news") {
    const result = await pool.query("SELECT data_value FROM app_data WHERE data_key = $1", ["news"]);
    const items = result.rows[0]?.data_value || [];
    return sendJson(response, 200, isAdmin(principal) ? items : items.filter((item) => ["Tayang", "Publish"].includes(item.status)));
  }

  if (request.method === "POST" && pathname === "/api/news") {
    if (!isAdmin(principal)) return sendJson(response, 403, { message: "Akses admin diperlukan." });
    const body = await readJson(request);
    if (!body.title || !body.content) {
      return sendJson(response, 400, { message: "Judul dan isi berita wajib diisi." });
    }

    const created = await mutateNews((items) => {
      const news = {
        id: Date.now(),
        createdAt: new Date().toISOString(),
        title: String(body.title).trim(),
        category: body.category || "Pengumuman",
        date: body.date || "Hari ini",
        status: "Draft",
        image: body.image || "",
        content: String(body.content).trim(),
        commentsList: [],
        comments: 0,
      };
      return { news: [news, ...items], value: news };
    });

    if (created.status === "Draft") {
      await recordNotification({
        title: "Berita menunggu review",
        description: `Draf "${created.title}" dibuat dan menunggu dipublikasikan.`,
        icon: "fa-newspaper",
        color: "bg-blue-50 text-blue-600",
        action: { type: "tab", tab: "berita" },
        eventKey: `news-draft-${created.id}`,
      });
    }

    return sendJson(response, 201, created);
  }

  if (request.method === "PUT" && /^\/api\/news\/[^/]+$/.test(pathname)) {
    if (!isAdmin(principal)) return sendJson(response, 403, { message: "Akses admin diperlukan." });
    const id = decodeURIComponent(pathname.slice("/api/news/".length));
    const updates = await readJson(request);
    const allowed = ["title", "category", "date", "status", "image", "content"];

    const updated = await mutateNews((items) => {
      const current = items.find((item) => String(item.id) === id);
      if (!current) return null;

      const nextItem = {
        ...current,
        ...Object.fromEntries(allowed.filter((key) => Object.hasOwn(updates, key)).map((key) => [key, updates[key]])),
      };
      nextItem.comments = countComments(nextItem.commentsList || []);

      return {
        news: items.map((item) => (String(item.id) === id ? nextItem : item)),
        value: nextItem,
      };
    });

    return updated ? sendJson(response, 200, updated) : sendJson(response, 404, { message: "Berita tidak ditemukan." });
  }

  if (request.method === "DELETE" && /^\/api\/news\/[^/]+$/.test(pathname)) {
    if (!isAdmin(principal)) return sendJson(response, 403, { message: "Akses admin diperlukan." });
    const id = decodeURIComponent(pathname.slice("/api/news/".length));
    const deleted = await mutateNews((items) => {
      if (!items.some((item) => String(item.id) === id)) return null;
      return {
        news: items.filter((item) => String(item.id) !== id),
        value: { id },
      };
    });

    return deleted ? sendJson(response, 200, deleted) : sendJson(response, 404, { message: "Berita tidak ditemukan." });
  }

  if (request.method === "POST" && /^\/api\/news\/[^/]+\/comments$/.test(pathname)) {
    if (!principal) return sendJson(response, 401, { message: "Masuk ke akun untuk memberi komentar." });
    const id = decodeURIComponent(pathname.slice("/api/news/".length, -"/comments".length));
    const body = await readJson(request);
    const text = String(body.text || "").trim();

    if (!text) {
      return sendJson(response, 400, { message: "Komentar tidak boleh kosong." });
    }

    const role = isAdmin(principal) ? "admin" : "user";
    if (body.replyToId && role !== "admin") return sendJson(response, 403, { message: "Hanya admin yang dapat membalas komentar." });
    const name = role === "admin" ? "Admin Desa Jarak" : String(principal.fullname || principal.nama || "Warga Desa").trim();

    const comment = {
      id: randomBytes(8).toString("hex"),
      name,
      role,
      time: new Date().toLocaleString("id-ID"),
      text,
      quotedName: "",
      quotedText: "",
      replies: [],
    };

    const updated = await mutateNews((items) => {
      const current = items.find((item) => String(item.id) === id);
      if (!current || (role === "user" && !["Tayang", "Publish"].includes(current.status))) return null;

      const commentsList = [...(current.commentsList || [])];
      if (role === "admin" && body.replyToId) {
        const parent = commentsList.find((entry) => String(entry.id) === String(body.replyToId));
        if (!parent) return null;
        comment.quotedName = parent.name;
        comment.quotedText = parent.text;
        parent.replies = [...(parent.replies || []), comment];
      } else {
        commentsList.push(comment);
      }

      const nextItem = { ...current, commentsList, comments: countComments(commentsList) };
      return {
        news: items.map((item) => (String(item.id) === id ? nextItem : item)),
        value: nextItem,
      };
    });

    if (updated) {
      try {
        await pool.query(
          "INSERT INTO komentar (aspirasi_id, user_id, isi_komentar) VALUES ($1, $2, $3)",
          [String(`Berita-${id}`), String(principal.id), text],
        );
      } catch (err) {}

      if (role === "user") {
        await awardPoints(principal.id, "news_comment", comment.id, `Komentar pada berita ${updated.title}`, 50);
        await recordNotification({
          title: "Komentar baru pada berita desa",
          description: `${comment.name} mengomentari "${updated.title}".`,
          icon: "fa-comment",
          color: "bg-emerald-50 text-emerald-600",
          action: { type: "tab", tab: "berita" },
          eventKey: `news-comment-${comment.id}`,
        });
      }
      return sendJson(response, 201, updated);
    }

    return sendJson(response, 404, {
      message: "Berita tidak ditemukan atau tidak dapat dikomentari.",
    });
  }

  if (request.method === "GET" && pathname === "/api/data") {
    if (!isAdmin(principal)) return sendJson(response, 403, { message: "Akses admin diperlukan." });
    const result = await pool.query("SELECT data_key, data_value FROM app_data ORDER BY data_key");
    return sendJson(
      response,
      200,
      Object.fromEntries(result.rows.map((row) => [row.data_key, row.data_value])),
    );
  }

  if (request.method === "PUT" && pathname.startsWith("/api/data/")) {
    if (!isAdmin(principal)) return sendJson(response, 403, { message: "Akses admin diperlukan." });
    const key = pathname.slice("/api/data/".length);
    if (!Object.hasOwn(seedData, key)) {
      return sendJson(response, 404, { message: "Dataset tidak ditemukan." });
    }

    const { value } = await readJson(request);
    await pool.query("UPDATE app_data SET data_value = $1, updated_at = NOW() WHERE data_key = $2", [
      JSON.stringify(value),
      key,
    ]);
    return sendJson(response, 200, { ok: true, key, value });
  }

  if (request.method === "GET" && pathname === "/api/profile") {
    const result = await pool.query("SELECT data_value FROM app_data WHERE data_key = $1", ["profil"]);
    return sendJson(response, 200, result.rows[0]?.data_value || initialProfilDesa);
  }

  if (request.method === "POST" && (pathname === "/api/auth/login" || pathname === "/api/auth/register")) {
    const body = await readJson(request);
    const identifier = String(body.username || body.email || "").trim();
    const password = String(body.password || "");

    if (!identifier || !password) {
      return sendJson(response, 400, { message: "Username/Email dan password wajib diisi." });
    }

    if (pathname.endsWith("register")) {
      const username = identifier.toLowerCase().replace(/\s+/g, "");
      const fullname = String(body.fullname || body.nama || "").trim();
      const email = String(body.email || (identifier.includes("@") ? identifier : `${username}@desa.id`)).trim().toLowerCase();
      if (!fullname || username.length < 3) {
        return sendJson(response, 400, { message: "Nama lengkap dan username minimal 3 karakter wajib diisi." });
      }
      if (username === "admin") return sendJson(response, 409, { message: "Username tersebut tidak dapat digunakan." });
      const credentials = hashPassword(password);

      try {
        const duplicate = await pool.query("SELECT id FROM users WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($2)", [email, username]);
        if (duplicate.rows.length) return sendJson(response, 409, { message: "Username atau email sudah terdaftar." });
        const insertRes = await pool.query(
          `INSERT INTO users (username, fullname, password_hash, password_salt, nama, email, role, poin)
           VALUES ($1, $2, $3, $4, $2, $5, 'warga', 0) RETURNING *`,
          [username, fullname, credentials.hash, credentials.salt, email],
        );
        return sendJson(response, 201, { success: true, ...await createSession(insertRes.rows[0]) });
      } catch (error) {
        if (error.code === "23505") {
          return sendJson(response, 409, { message: "Akun/Email sudah terdaftar." });
        }
        throw error;
      }
    }

    const normalizedIdentifier = identifier.toLowerCase();
    const result = await pool.query(
      `SELECT * FROM users
       WHERE LOWER(username) = $1 OR LOWER(email) = $1 OR LOWER(nama) = $1
       ORDER BY CASE WHEN LOWER(username) = $1 OR LOWER(email) = $1 THEN 0 ELSE 1 END LIMIT 1`,
      [normalizedIdentifier],
    );

    const user = result.rows[0];
    let isAuthenticated = false;

    if (user) {
      if (user.password_salt && user.password_hash) {
        isAuthenticated = passwordMatches(password, user.password_salt, user.password_hash);
      }
    }

    if (!user || !isAuthenticated) {
      return sendJson(response, 401, { message: "Username/Email atau password salah." });
    }

    return sendJson(response, 200, { success: true, ...await createSession(user) });
  }

  if (request.method === "GET" && /^\/api\/users\/[^/]+$/.test(pathname)) {
    const id = decodeURIComponent(pathname.slice("/api/users/".length));
    if (!principal) return sendJson(response, 401, { message: "Masuk untuk membuka profil." });
    if (id !== principal.username && id !== principal.email) return sendJson(response, 403, { message: "Anda hanya dapat membuka profil sendiri." });
    try {
      const result = await pool.query(
        "SELECT id, username, fullname, nama, email, no_telepon, alamat, foto, nik FROM users WHERE username = $1 OR email = $1",
        [id]
      );
      if (result.rows.length === 0) {
        return sendJson(response, 404, { message: "User tidak ditemukan" });
      }
      return sendJson(response, 200, result.rows[0]);
    } catch (error) {
      console.error(error);
      return sendJson(response, 500, { message: "Kesalahan server saat memuat profil." });
    }
  }


  if (request.method === "PUT" && /^\/api\/users\/[^/]+$/.test(pathname)) {
    const id = decodeURIComponent(pathname.slice("/api/users/".length));
    if (!principal) return sendJson(response, 401, { message: "Masuk untuk memperbarui profil." });
    if (id !== principal.username && id !== principal.email) return sendJson(response, 403, { message: "Anda hanya dapat memperbarui profil sendiri." });
    
    return new Promise((resolve, reject) => {
      upload.single("foto")(request, response, async (err) => {
        if (err) {
          console.error("Multer error:", err);
          sendJson(response, 400, { message: "Gagal mengunggah foto." });
          return resolve();
        }

        try {
          const { fullname, no_telepon, alamat, nik } = request.body;
          let fotoFilename = null;
          
          if (request.file) {
            fotoFilename = request.file.filename;
          }

          let query = "UPDATE users SET fullname = $1, nama = $1, no_telepon = $2, alamat = $3, nik = $4";
          let values = [fullname || '', no_telepon || '', alamat || '', nik || ''];
          let paramIndex = 5;

          if (fotoFilename) {
            query += `, foto = $${paramIndex}`;
            values.push(fotoFilename);
            paramIndex++;
          }

          query += ` WHERE username = $${paramIndex} OR email = $${paramIndex} RETURNING id, username, fullname, no_telepon, alamat, foto, nik`;
          values.push(id);

          const result = await pool.query(query, values);

          if (result.rows.length === 0) {
            sendJson(response, 404, { message: "User tidak ditemukan" });
          } else {
            sendJson(response, 200, result.rows[0]);
          }
        } catch (error) {
          console.error("Database error during profile update:", error);
          sendJson(response, 500, { message: "Gagal memperbarui profil di database." });
        }
        resolve();
      });
    });
  }

  return sendJson(response, 404, { message: "Endpoint tidak ditemukan." });
};

const serveStatic = async (response, pathname) => {
  if (pathname.startsWith("/uploads/")) {
    const filename = decodeURIComponent(pathname.slice("/uploads/".length));
    if (!filename || basename(filename) !== filename) {
      response.writeHead(404, { "Content-Type": "text/plain" });
      return response.end("File tidak ditemukan.");
    }
    try {
      const [profileOwner, reportsResult] = await Promise.all([
        pool.query("SELECT id FROM users WHERE foto = $1", [filename]),
        pool.query("SELECT data_value FROM app_data WHERE data_key = $1", ["reports"]),
      ]);
      const privateReportImage = (reportsResult.rows[0]?.data_value || []).some(
        (report) => report.visibility === "private" && report.image === `/uploads/${filename}`,
      );
      if (profileOwner.rows.length || privateReportImage) throw new Error("private-file");

      const filePath = join(uploadDir, filename);
      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) throw new Error("not-file");

      response.writeHead(200, { "Content-Type": uploadMimeType(filePath) });
      return createReadStream(filePath).pipe(response);
    } catch (e) {
      response.writeHead(404, { "Content-Type": "text/plain" });
      return response.end("File tidak ditemukan.");
    }
  }

  const requested = pathname === "/" ? "/index.html" : pathname;
  const filePath = normalize(join(root, "dist", requested));

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) throw new Error("not-file");

    const mime =
      {
        ".html": "text/html",
        ".js": "text/javascript",
        ".css": "text/css",
        ".webmanifest": "application/manifest+json",
        ".svg": "image/svg+xml",
        ".png": "image/png",
        ".jpg": "image/jpeg",
      }[extname(filePath)] || "application/octet-stream";

    response.writeHead(200, { "Content-Type": mime });
    createReadStream(filePath).pipe(response);
  } catch {
    try {
      const index = await readFile(join(root, "dist", "index.html"));
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.end(index);
    } catch {
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.end(
        "<h1>Backend E-Aspirasi is running</h1><p>Frontend dist directory belum di-build. Jalankan <code>npm run build</code> atau mode dev.</p>",
      );
    }
  }
};

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (url.pathname.startsWith("/api/")) await handleApi(request, response, url);
    else await serveStatic(response, url.pathname);
  } catch (error) {
    console.error(error);
    if (!response.headersSent) {
      sendJson(response, 500, { message: "Kesalahan server." });
    }
  }
});

initDatabase()
  .then(() =>
    server.listen(port, "0.0.0.0", () => {
      console.log(`Berhasil terhubung ke database PostgreSQL!`);
      console.log(`E-Aspirasi listening on port ${port}`);
    }),
  )
  .catch((error) => {
    console.error("Database connection failed:", error);
    process.exit(1);
  });
