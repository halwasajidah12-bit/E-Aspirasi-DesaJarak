import { createReadStream, readFileSync, existsSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { createHash, randomBytes, scryptSync } from "node:crypto";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";
import pg from "pg";
import { GoogleGenAI } from "@google/genai";
import multer from "multer";

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

// Konfigurasi Multer: memory storage (file disimpan di database sebagai base64)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
  fileFilter: (req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".gif"].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Hanya file gambar (.jpg, .png, .gif) yang diperbolehkan."), false);
    }
  },
});

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});
const classifyReportWithGemini = async (description) => {
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


// Inisialisasi pool database dengan dukungan DATABASE_URL dan SSL otomatis
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.DATABASE_URL.includes("localhost") ||
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

    await pool.query(`ALTER TABLE komentar ALTER COLUMN aspirasi_id TYPE TEXT;`);
    await pool.query(`ALTER TABLE komentar ALTER COLUMN user_id TYPE TEXT;`);
  } catch (err) {}

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
          `INSERT INTO users (username, fullname, password_hash, password_salt, nama, email, password, role, poin)
           VALUES ($1, $2, $3, $4, $2, $5, $6, $7, 0)`,
          [username, fullname, credentials.hash, credentials.salt, email, rawPassword, role],
        ); 
      }
    } catch (err) {
      console.error(`Gagal menyuntikkan user ${username}:`, err.message);
    }
  }
};

const handleApi = async (request, response, pathname) => {
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

  if (request.method === "GET" && pathname === "/api/reports") {
    const result = await pool.query("SELECT data_value FROM app_data WHERE data_key = $1", ["reports"]);
    return sendJson(response, 200, result.rows[0]?.data_value || []);
  }
  if (request.method === "POST" && pathname === "/api/reports") {
    return new Promise((resolve, reject) => {
      upload.array("images", 5)(request, response, async (err) => {
        if (err) {
          console.error("Multer upload error:", err);
          return resolve(sendJson(response, 400, { message: "Gagal mengunggah foto laporan." }));
        }

        // Dapatkan body dari request (multipart/form-data otomatis terparse oleh multer)
        const body = request.body || {};

        if (!body.judul || !body.deskripsi || !body.lokasi || !body.ownerId) {
          return resolve(sendJson(response, 400, {
            message: "Judul, lokasi, deskripsi, dan identitas pelapor wajib diisi.",
          }));
        }

        // Handle uploaded image files → konversi ke base64 data URL, simpan di database
        const imagePaths = [];
        if (request.files && Array.isArray(request.files)) {
          request.files.forEach((file) => {
            const mimeType = file.mimetype || "image/jpeg";
            const base64 = file.buffer.toString("base64");
            imagePaths.push(`data:${mimeType};base64,${base64}`);
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
          const newReport = {
            id,
            title: String(body.judul).trim(),
            author: String(body.ownerName || "Warga Desa").trim(),
            ownerId: String(body.ownerId),
            ownerName: String(body.ownerName || "Warga Desa").trim(),
            category: categoryMap[body.kategori] || body.kategori || "Lainnya",
            aiCategory: aiCategory || "Belum diklasifikasi",
            status: "Masuk",
            urgency: detectReportUrgency({ title: body.judul, description: body.deskripsi }) ? "Tinggi" : "Sedang",
            votes: 0,
            comments: 0,
            image: imagePaths[0] || body.image || "",
            images: imagePaths,
            description: String(body.deskripsi).trim(),
            location: String(body.lokasi).trim(),
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

        await recordNotification({
          title: report.urgency === "Tinggi" ? "Laporan baru dengan urgensi tinggi" : "Laporan baru masuk",
          description: `${report.id}: ${report.title}`,
          icon: report.urgency === "Tinggi" ? "fa-triangle-exclamation" : "fa-file-circle-plus",
          color: report.urgency === "Tinggi" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600",
          action: { type: "report", id: report.id },
          eventKey: `report-created-${report.id}`,
        });

        resolve(sendJson(response, 201, report));
      });
    });
  }

  if (request.method === "PUT" && /^\/api\/reports\/[^/]+$/.test(pathname)) {
    const id = decodeURIComponent(pathname.slice("/api/reports/".length));
    const body = await readJson(request);
    const allowedStatuses = ["Masuk", "Diproses", "Selesai", "Ditolak"];

    if (!allowedStatuses.includes(body.status)) {
      return sendJson(response, 400, { message: "Status laporan tidak valid." });
    }

    const updated = await mutateReports((items) => {
      const current = items.find((item) => String(item.id) === id);
      if (!current) return null;

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

    return updated ? sendJson(response, 200, updated) : sendJson(response, 404, { message: "Laporan tidak ditemukan." });
  }

  if (request.method === "POST" && /^\/api\/reports\/[^/]+\/comments$/.test(pathname)) {
    const id = decodeURIComponent(pathname.slice("/api/reports/".length, -"/comments".length));
    const body = await readJson(request);
    const text = String(body.text || "").trim();

    if (!text) {
      return sendJson(response, 400, { message: "Identitas dan isi komentar wajib diisi." });
    }

    const namaPelapor = body.name || "Warga Desa";
    const identifierUser = body.ownerId || body.name || "guest";

    const updated = await mutateReports((items) => {
      const current = items.find((item) => String(item.id) === id);
      if (!current) return null;

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
          [String(id), String(identifierUser), text],
        );
      } catch (err) {}

      if (updated.commentsList?.length) {
        const latestComment = updated.commentsList.at(-1);
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
    return sendJson(response, 200, result.rows[0]?.data_value || []);
  }

  if (request.method === "POST" && pathname === "/api/education") {
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
    return sendJson(response, 200, result.rows[0]?.data_value || []);
  }

  if (request.method === "POST" && pathname === "/api/news") {
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
    const id = decodeURIComponent(pathname.slice("/api/news/".length, -"/comments".length));
    const body = await readJson(request);
    const text = String(body.text || "").trim();

    if (!text) {
      return sendJson(response, 400, { message: "Komentar tidak boleh kosong." });
    }

    const role = body.role === "admin" ? "admin" : "user";
    const name = String(body.name || (role === "admin" ? "Admin Desa Jarak" : "Warga Desa")).trim();

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
          [String(`Berita-${id}`), String(name), text],
        );
      } catch (err) {}

      if (role === "user") {
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
    const result = await pool.query("SELECT data_key, data_value FROM app_data ORDER BY data_key");
    return sendJson(
      response,
      200,
      Object.fromEntries(result.rows.map((row) => [row.data_key, row.data_value])),
    );
  }

  if (request.method === "PUT" && pathname.startsWith("/api/data/")) {
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

  if (request.method === "POST" && (pathname === "/api/auth/login" || pathname === "/api/auth/register")) {
    const body = await readJson(request);
    const identifier = String(body.username || body.email || "").trim();
    const password = String(body.password || "");

    if (!identifier || !password) {
      return sendJson(response, 400, { message: "Username/Email dan password wajib diisi." });
    }

    if (pathname.endsWith("register")) {
      const username = identifier.toLowerCase().replace(/\s+/g, "");
      const fullname = String(body.fullname || body.nama || identifier).trim();
      const email = identifier.includes("@") ? identifier : `${username}@desa.id`;
      const credentials = hashPassword(password);

      try {
      const insertRes = await pool.query(
  `INSERT INTO users (username, fullname, password_hash, password_salt, nama, email, password, role, poin)
   VALUES ($1, $2, $3, $4, $2, $5, $6, 'warga', 0)
   RETURNING *`,
  [username, fullname, credentials.hash, credentials.salt, email, password],
);
        const newUser = insertRes.rows[0];

        return sendJson(response, 201, {
          success: true,
          role: "user",
          name: fullname,
          userId: username,
          user: newUser,
        });
      } catch (error) {
        if (error.code === "23505") {
          return sendJson(response, 409, { message: "Akun/Email sudah terdaftar." });
        }
        throw error;
      }
    }

    const result = await pool.query(
      `SELECT * FROM users 
       WHERE username = $1 OR email = $1 OR nama = $1 OR username = $2`,
      [identifier, identifier.toLowerCase()],
    );

    const user = result.rows[0];
    let isAuthenticated = false;

    if (user) {
      if (user.password_salt && user.password_hash) {
        isAuthenticated = passwordMatches(password, user.password_salt, user.password_hash);
      }
      if (!isAuthenticated && user.password) {
        isAuthenticated = user.password === password;
      }
    }

    if (!user || !isAuthenticated) {
      return sendJson(response, 401, { message: "Username/Email atau password salah." });
    }

    const isAdmin = user.role === "admin" || user.username === "admin";
    return sendJson(response, 200, {
      success: true,
      role: isAdmin ? "admin" : "user",
      name: user.fullname || user.nama,
      userId: user.username || user.email,
      user,
    });
  }

  if (request.method === "GET" && /^\/api\/users\/[^/]+$/.test(pathname)) {
    const id = decodeURIComponent(pathname.slice("/api/users/".length));
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
    const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
    if (pathname.startsWith("/api/")) await handleApi(request, response, pathname);
    else await serveStatic(response, pathname);
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
      console.log(`E-Aspirasi listening on http://localhost:${port}`);
    }),
  )
  .catch((error) => {
    console.error("Database connection failed:", error);
    process.exit(1);
  });
