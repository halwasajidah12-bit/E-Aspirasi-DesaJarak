// Modul logika AI (Gemini) untuk backend E-Aspirasi Desa Jarak.
// Semua fungsi menerima instance GoogleGenAI (ai) sebagai argumen agar mudah diuji,
// dan SELALU mengembalikan fallback (null/string aman) bila AI gagal — submission
// laporan tidak boleh gagal karena AI.

const DEFAULT_TIMEOUT_MS = 15_000;
export const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

export const withTimeout = async (promise, label, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} melebihi batas ${timeoutMs} ms.`)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
};

// Kategori fallback bila tabel kategori_infrastruktur kosong.
// Harus konsisten dengan default di GET /api/categories (server.mjs).
export const fallbackCategories = [
  "Jalan & Fasilitas",
  "Penerangan",
  "Lingkungan",
  "Lainnya",
];

// Klasifikasi laporan ke satu kategori dari daftar yang diberikan (source of
// truth: tabel kategori_infrastruktur). Hasil selalu divalidasi terhadap daftar —
// kategori di luar daftar dibuang agar tidak bocor ke sistem.
export const classifyReportWithGemini = async (
  ai,
  {
    title = "",
    description = "",
    allowedCategories = fallbackCategories,
    model = "gemini-3.5-flash-lite",
  } = {},
) => {
  if (!ai || !String(description).trim()) return null;
  try {
    const result = await withTimeout(
      ai.models.generateContent({
        model,
        contents: `
Klasifikasikan laporan masyarakat berikut ke dalam tepat satu kategori.

Kategori yang tersedia (pilih HANYA dari daftar ini):
${allowedCategories.map((category) => `- \${category}`).join("\n")}

Judul laporan: "${title}"
Deskripsi laporan: "${description}"

Balas HANYA dengan nama kategorinya, tanpa penjelasan dan tanpa tanda kutip.`,
      }),
      "Gemini classification",
    );
    const category = String(result.text || "").trim().replace(/^["']|["']\$/g, "");
    return allowedCategories.includes(category) ? category : null;
  } catch (error) {
    console.error("Gemini classification gagal:", error.message);
    return null;
  }
};

// ==== DETEKSI DUPLIKASI ====
// Level murah (tanpa LLM): kesamaan token deskripsi/judul + lokasi + RT/RW.
// Hasilnya dipakai untuk memfilter kandidat; verifikasi final diberikan ke Gemini.

const DUPLICATE_STOPWORDS = new Set([
  "yang", "dan", "di", "ke", "dari", "untuk", "pada", "ini", "itu", "dengan",
  "ada", "adalah", "sudah", "belum", "tidak", "bukan", "saya", "kami", "warga",
  "agar", "juga", "bisa", "akan", "para", "serta", "karena", "sehingga", "saat",
  "seperti", "masih", "telah", "hanya", "lebih", "apa", "maka", "dimana", "di mana",
]);

export const tokenize = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !DUPLICATE_STOPWORDS.has(token));

export const jaccardSimilarity = (aTokens, bTokens) => {
  const setA = new Set(aTokens);
  const setB = new Set(bTokens);
  if (!setA.size || !setB.size) return 0;
  let intersection = 0;
  for (const token of setA) if (setB.has(token)) intersection += 1;
  return intersection / (setA.size + setB.size - intersection);
};

// Skor kemiripan 0..1: deskripsi (0.5) + judul (0.3) + lokasi (0.2) + bonus RT/RW sama (0.05, dibatasi 1).
export const findDuplicateCandidates = (
  incoming,
  reports,
  { limit = 3, minSimilarity = 0.25 } = {},
) => {
  const incomingTokens = tokenize(`${incoming.title} ${incoming.description}`);
  const incomingLocationTokens = tokenize(incoming.location);
  if (!incomingTokens.length) return [];
  const scored = [];
  for (const report of reports || []) {
    if (!report) continue;
    if (incoming.id && String(report.id) === String(incoming.id)) continue;
    const titleSim = jaccardSimilarity(incomingTokens, tokenize(report.title));
    const descSim = jaccardSimilarity(incomingTokens, tokenize(report.description));
    const locSim = jaccardSimilarity(incomingLocationTokens, tokenize(report.location));
    const sameRtRw =
      incoming.rt && report.rt
        ? String(incoming.rt).trim() === String(report.rt).trim() &&
          String(incoming.rw || "").trim() === String(report.rw || "").trim()
        : false;
    const similarity = Math.min(
      1,
      0.5 * descSim + 0.3 * titleSim + 0.2 * locSim + (sameRtRw ? 0.05 : 0),
    );
    if (similarity >= minSimilarity) scored.push({ report, similarity });
  }
  return scored.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
};

// Level LLM: kandidat hasil filter lokal diperiksa apakah benar-benar masalah yang
// sama di lokasi yang sama. Selalu mendapat fallback [] bila AI gagal/timeout.
export const verifyDuplicatesWithGemini = async (
  ai,
  incoming,
  candidates,
  { model = "gemini-3.5-flash-lite", timeoutMs = DEFAULT_TIMEOUT_MS } = {},
) => {
  if (!ai || !candidates.length) return [];
  try {
    const result = await withTimeout(
      ai.models.generateContent({
        model,
        contents: `
Anda pemeriksa duplikasi laporan masyarakat. Tentukan kandidat LAMA mana yang
sebenarnya melaporkan MASALAH FISIK YANG SAMA di LOKASI YANG SAMA kasusnya
(bukan sekadar tema serupa seperti "jalan rusak" yang berbeda titik).

Laporan BARU dari warga:
Judul: "${incoming.title}"
Lokasi: "${incoming.location}"
Deskripsi: "${incoming.description}"

Kandidat laporan LAMA:
${JSON.stringify(candidates)}

Balas HANYA JSON array, tanpa penjelasan:
[{"reportId": "<id>", "confidence": <0 sampai 1>, "reason": "<alasan singkat satu kalimat>"}]
Sertakan HANYA kandidat yang benar-benar duplikat. Jika tidak ada yang duplikat, balas []`,
      }),
      "Gemini duplicate verification",
      timeoutMs,
    );
    const text = String(result.text || "").trim().replace(/^```(?:json)?/i, "").replace(/```\$/, "").trim();
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start === -1 || end === -1 || end <= start) return [];
    const parsed = JSON.parse(text.slice(start, end + 1));
    if (!Array.isArray(parsed)) return [];
    const candidateIds = new Set(candidates.map((candidate) => String(candidate.reportId)));
    return parsed
      .filter((item) => candidateIds.has(String(item?.reportId)))
      .map((item) => ({
        reportId: String(item.reportId),
        confidence: Math.max(0, Math.min(1, Number(item.confidence) || 0.5)),
        reason: String(item.reason || "").trim(),
      }));
  } catch (error) {
    console.error("Gemini duplicate verification gagal:", error.message);
    return [];
  }
};

// ==== ANALISIS SENTIMEN KOMENTAR (ADMIN) ====

const NEGATIVE_SENTIMENT_WORDS = [
  "rusak", "parah", "lambat", "kecewa", "bahaya", "bocor", "macet", "mati",
  "banjir", "roboh", "ambruk", "kotor", "bau", "buruk", "seret",
  "buruk", "tertunda", "mengancam", "kritis", "gelap", "sempit", "tersumbat",
];

// Analisis heuristik lokal (fallback saat Gemini gagal/tanpa API key).
export const analyzeCommentsLocally = (comments = []) => {
  const texts = comments
    .map((comment) => String(comment?.text || "").trim())
    .filter(Boolean);
  if (!texts.length) return null;
  const joined = texts.join(" ").toLowerCase();
  const negativeHits = NEGATIVE_SENTIMENT_WORDS.filter((word) => joined.includes(word));
  const sentiment = negativeHits.length >= 2 ? "Negatif" : negativeHits.length === 1 ? "Netral" : "Positif";
  const clip = (text) => (text.length > 140 ? `${text.slice(0, 137)}...` : text);
  const keyPoints = [...new Set(texts)].slice(0, 2).map(clip);
  return { sentiment, keyPoints, attentionPoints: [], mode: "lokal" };
};

// Analisis penuh via Gemini: sentimen + poin utama + hal yang perlu direspons admin.
export const analyzeCommentsWithGemini = async (
  ai,
  { title = "", description = "", comments = [] },
  { model = "gemini-3.5-flash-lite", timeoutMs = DEFAULT_TIMEOUT_MS } = {},
) => {
  if (!ai || !comments.length) return null;
  try {
    const result = await withTimeout(
      ai.models.generateContent({
        model,
        contents: `
Kamu analis opini publik untuk ADMIN Desa Jarak.

Laporan: "${title}"
Deskripsi: "${description}"

Komentar warga:
${JSON.stringify(comments)}

Analisis komentar tersebut lalu balas HANYA JSON, tanpa penjelasan:
{"sentiment": "Positif" | "Netral" | "Negatif",
 "keyPoints": ["maksimal 5 poin utama dari warga, satu kalimat per poin"],
 "attentionPoints": ["hal yang perlu segera direspons admin; boleh array kosong"]}`,
      }),
      "Gemini comment analysis",
      timeoutMs,
    );
    const text = String(result.text || "").trim().replace(/^```(?:json)?/i, "").replace(/```\$/, "").trim();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;
    const parsed = JSON.parse(text.slice(start, end + 1));
    const sentiment = ["Positif", "Netral", "Negatif"].includes(parsed.sentiment) ? parsed.sentiment : null;
    if (!sentiment) return null;
    const cleanList = (value) =>
      Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];
    return {
      sentiment,
      keyPoints: cleanList(parsed.keyPoints).slice(0, 5),
      attentionPoints: cleanList(parsed.attentionPoints).slice(0, 5),
      mode: "ai",
    };
  } catch (error) {
    console.error("Gemini comment analysis gagal:", error.message);
    return null;
  }
};

// ==== PRIORITAS & RINGKASAN (ADMIN) ====
// Skor prioritas dihitung DETERMINISTIK (bukan oleh LLM) agar transparan dan
// konsisten; LLM hanya menulis ringkasan naratif per laporan.
export const computePriorityScore = (report, { now = Date.now() } = {}) => {
  const comments = report?.commentsList || [];
  const analysis =
    (report?.aiSentiment && { sentiment: report.aiSentiment }) ||
    analyzeCommentsLocally(comments) ||
    { sentiment: "Netral" };
  const sentimentLabel = analysis.sentiment || "Netral";
  const sentimentWeight = sentimentLabel === "Negatif" ? 1 : sentimentLabel === "Positif" ? 0 : 0.4;
  const urgencyWeight = report?.urgency === "Tinggi" ? 1 : report?.urgency === "Rendah" ? 0.1 : 0.4;
  const ageDays = report?.submittedAt
    ? Math.max(0, Math.min(7, (now - new Date(report.submittedAt).getTime()) / 86_400_000))
    : 0;
  const votes = Math.max(0, Number(report?.votes) || 0);
  const votesNorm = Math.min(20, votes) / 20;
  const commentsNorm = Math.min(10, comments.length) / 10;
  const breakdown = {
    votes: Math.round(35 * votesNorm),
    urgency: Math.round(25 * urgencyWeight),
    comments: Math.round(20 * commentsNorm),
    sentiment: Math.round(15 * sentimentWeight),
    age: Math.round(5 * (ageDays / 7)),
  };
  const duplicateBonus = report?.aiDuplicateOf ? 3 : 0;
  const score = Math.min(
    100,
    breakdown.votes + breakdown.urgency + breakdown.comments + breakdown.sentiment + breakdown.age + duplicateBonus,
  );
  return { score, breakdown, sentiment: sentimentLabel, votes, commentCount: comments.length };
};

export const summarizePrioritiesWithGemini = async (
  ai,
  items,
  { model = "gemini-3.5-flash-lite", timeoutMs = DEFAULT_TIMEOUT_MS } = {},
) => {
  if (!ai || !items.length) return [];
  try {
    const result = await withTimeout(
      ai.models.generateContent({
        model,
        contents: `
Kamu asisten admin Desa Jarak. Untuk tiap laporan berikut (sudah diurutkan prioritas
oleh sistem secara deterministik), tulis ringkasan penanganan singkat (maksimal 2
kalimat): kondisi masalah sesuai data, tingkat kepulihan, dan saran langkah konkret.

Data laporan (score & breakdown jangan diubah, hanya dibaca):
${JSON.stringify(items)}

Balas HANYA JSON array, tanpa penjelasan:
[{"reportId": "<id>", "ringkasan": "<maksimal 2 kalimat>"}]`,
      }),
      "Gemini priorities summary",
      timeoutMs,
    );
    const text = String(result.text || "").trim().replace(/^```(?:json)?/i, "").replace(/```\$/, "").trim();
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start === -1 || end === -1 || end <= start) return [];
    const parsed = JSON.parse(text.slice(start, end + 1));
    if (!Array.isArray(parsed)) return [];
    const itemIds = new Set(items.map((item) => String(item.reportId)));
    return parsed
      .filter((item) => itemIds.has(String(item?.reportId)))
      .map((item) => ({ reportId: String(item.reportId), ringkasan: String(item.ringkasan || "").trim().slice(0, 320) }))
      .filter((item) => item.ringkasan);
  } catch (error) {
    console.error("Gemini priorities summary gagal:", error.message);
    return [];
  }
};
