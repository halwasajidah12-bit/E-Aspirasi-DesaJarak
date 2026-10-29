// Test AI modul — jalankan dari root repo: npm run test:ai
// Butuh Node >= 20 (namespace node:test). Tidak butuh DB maupun GEMINI_API_KEY:
// semua panggilan Gemini menggunakan stub client, plus jalur fallback diuji
// dengan client null. Endpoint yang butuh database diuji manual (lihat
// STRATEGI-AI-SYAWAL.md bagian Fase 5).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  tokenize,
  jaccardSimilarity,
  findDuplicateCandidates,
  analyzeCommentsLocally,
  computePriorityScore,
  classifyReportWithGemini,
  verifyDuplicatesWithGemini,
  summarizePrioritiesWithGemini,
  fallbackCategories,
} from "../DesaJarak/server/ai.mjs";

// Stub client Gemini yang selalu membalas teks tertentu.
const stubAI = (respond) => ({
  models: {
    generateContent: async () => ({ text: respond() }),
  },
});

// ==== TOKENIZE & SIMILARITY ====

test("tokenize membuang stopword, tanda baca, dan token pendek", () => {
  const tokens = tokenize("Jalan di depan SDN, maka, rusak berlubang!");
  assert.ok(tokens.includes("jalan"));
  assert.ok(tokens.includes("rusak"));
  assert.ok(tokens.includes("berlubang"));
  assert.ok(!tokens.includes("di"));
  assert.ok(!tokens.includes("maka"));
});

test("jaccardSimilarity: teks identik = 1, tidak beririsan = 0", () => {
  assert.equal(jaccardSimilarity(tokenize("jalan rusak parah"), tokenize("jalan rusak parah")), 1);
  assert.equal(jaccardSimilarity(tokenize("jalan rusak"), tokenize("lampu penerangan mati")), 0);
  assert.equal(jaccardSimilarity(tokenize(""), tokenize("jalan rusak")), 0);
});

// ==== DETEKSI DUPLIKASI ====

test("findDuplicateCandidates menemukan laporan serupa dan mengurutkannya", () => {
  const reports = [
    { id: "JR-1", title: "Jalan berlubang di depan SDN 2", description: "Jalan berlubang besar depan sekolah sering diperbaiki setengah", location: "Jl Pendidikan no 5", rt: "05", rw: "04" },
    { id: "JR-2", title: "Penerangan jalan mati", description: "Lampu penerangan jalan padam berhari-hari", location: "Jl Pendidikan no 5", rt: "05", rw: "04" },
  ];
  const incoming = {
    title: "Jalan berlubang",
    description: "Jalan berlubang besar depan sekolah perlu segera diperbaiki",
    location: "Jl Pendidikan no 5",
    rt: "05",
    rw: "04",
  };
  const result = findDuplicateCandidates(incoming, reports, { limit: 2 });
  assert.ok(result.length >= 2);
  assert.equal(result[0].report.id, "JR-1");
  assert.ok(result[0].similarity > result[1].similarity);
  assert.ok(result[0].similarity > 0.25);
});

test("findDuplicateCandidates menolak topik berbeda meski RT/RW sama", () => {
  const reports = [
    { id: "JR-2", title: "Penerangan jalan mati", description: "Lampu penerangan padam tiga hari", location: "Jl Anggrek no 2", rt: "05", rw: "04" },
  ];
  const incoming = {
    title: "Sampah menumpuk",
    description: "Sampah rumah tangga menumpuk di TPS dan membusuk",
    location: "Jl Melati no 7",
    rt: "05",
    rw: "04",
  };
  const result = findDuplicateCandidates(incoming, reports, { limit: 2, minSimilarity: 0.25 });
  assert.equal(result.length, 0);
});

test("verifyDuplicatesWithGemini dengan client null selalu fallback aman", async () => {
  assert.deepEqual(await verifyDuplicatesWithGemini(null, {}, [{ reportId: "JR-1" }]), []);
});

test("verifyDuplicatesWithGemini memparse JSON dan hanya menerima kandidat dikenal", async () => {
  const candidates = [
    { reportId: "JR-1", title: "Jalan berlubang", status: "Masuk", similarity: 0.65 },
    { reportId: "JR-2", title: "Lampu mati", status: "Masuk", similarity: 0.3 },
  ];
  const ai = stubAI(() =>
    '```json\n[{"reportId": "JR-1", "confidence": 0.9, "reason": "masalah sama"}, {"reportId": "JR-99", "confidence": 0.8, "reason": "tidak dikenal"}]\n```',
  );
  const verified = await verifyDuplicatesWithGemini(ai, { title: "x", description: "y", location: "z" }, candidates);
  assert.equal(verified.length, 1);
  assert.equal(verified[0].reportId, "JR-1");
  assert.equal(verified[0].confidence, 0.9);
});

test("verifyDuplicatesWithGemini dengan balasan rusak jatuh ke array kosong", async () => {
  const ai = stubAI(() => "bukan json sama sekali");
  const verified = await verifyDuplicatesWithGemini(ai, { title: "x", description: "y" }, [
    { reportId: "JR-1" },
  ]);
  assert.deepEqual(verified, []);
});

// ==== KLASIFIKASI ====

test("fallbackCategories konsisten dengan default GET /api/categories", () => {
  assert.deepEqual(fallbackCategories, ["Jalan & Fasilitas", "Penerangan", "Lingkungan", "Lainnya"]);
});

test("classifyReportWithGemini dengan client null mengembalikan null (fallback manual)", async () => {
  assert.equal(await classifyReportWithGemini(null, { description: "jalan rusak" }), null);
});

test("classifyReportWithGemini menerima kategori dari daftar, menolak hasil liar", async () => {
  const allowed = ["Jalan & Fasilitas", "Penerangan", "Lingkungan", "Lainnya"];
  assert.equal(
    await classifyReportWithGemini(stubAI(() => "Jalan & Fasilitas"), {
      title: "Jalan berlubang",
      description: "jalan rusak",
      allowedCategories: allowed,
    }),
    "Jalan & Fasilitas",
  );
  assert.equal(
    await classifyReportWithGemini(stubAI(() => '"Kategori Ngarang"'), {
      description: "jalan rusak",
      allowedCategories: allowed,
    }),
    null,
  );
});

// ==== ANALISIS SENTIMEN (FALLBACK LOKAL) ====

test("analyzeCommentsLocally: dua kata negatif => Negatif, tanpa kata negatif => Positif", () => {
  assert.equal(
    analyzeCommentsLocally([
      { text: "Kondisinya rusak parah sekali" },
      { text: "Semoga tidak banjir lagi di sini" },
    ]).sentiment,
    "Negatif",
  );
  assert.equal(analyzeCommentsLocally([{ text: "Terima kasih semua, semangat!" }]).sentiment, "Positif");
});

test("analyzeCommentsLocally: komentar kosong => null, keyPoints terpotong 2", () => {
  assert.equal(analyzeCommentsLocally([]), null);
  const result = analyzeCommentsLocally([
    { text: "a".repeat(200) },
    { text: "b" },
    { text: "c" },
    { text: "d" },
  ]);
  assert.equal(result.keyPoints.length, 2);
  assert.ok(result.keyPoints[0].length <= 140);
});

// ==== SKOR PRIORITAS ====

test("computePriorityScore menaikkan laporan mendesak dan tetap dalam rentang 0-100", () => {
  const now = new Date("2026-10-29T00:00:00Z").getTime();
  const urgent = computePriorityScore(
    {
      id: "JR-1",
      title: "Jembatan ambrol",
      urgency: "Tinggi",
      votes: 25,
      submittedAt: new Date(now - 6 * 86_400_000).toISOString(),
      commentsList: [
        { text: "Berbahaya sekali saat hujan" },
        { text: "Sudah kirim laporan kemarin, lambat ditindaklanjuti" },
      ],
    },
    { now },
  );
  const tenang = computePriorityScore(
    {
      id: "JR-2",
      title: "Papan nama kantor kurang rapi",
      urgency: "Rendah",
      votes: 1,
      submittedAt: new Date(now).toISOString(),
      commentsList: [{ text: "Terima kasih sudah masukkan" }],
    },
    { now },
  );
  assert.ok(urgent.score > tenang.score);
  assert.ok(urgent.score > 60 && urgent.score <= 100);
  assert.ok(tenang.score < 40);
  const total = Object.values(urgent.breakdown).reduce((sum, value) => sum + value, 0);
  assert.ok(Math.abs(total - urgent.score) <= 1, "breakdown harus konsisten dengan skor");
});

test("computePriorityScore memakai sentimen tersimpan bila ada", () => {
  const withStored = computePriorityScore({
    id: "JR-3",
    urgency: "Sedang",
    votes: 0,
    submittedAt: new Date().toISOString(),
    commentsList: [],
    aiSentiment: "Negatif",
  });
  assert.equal(withStored.sentiment, "Negatif");
  assert.equal(withStored.breakdown.sentiment, 15);
});

// ==== RINGKASAN PRIORITAS ====

test("summarizePrioritiesWithGemini dengan client null fallback array kosong", async () => {
  assert.deepEqual(await summarizePrioritiesWithGemini(null, [{ reportId: "JR-1" }]), []);
});

test("summarizePrioritiesWithGemini memetakan ringkasan per laporan dan membuang id asing", async () => {
  const items = [
    { reportId: "JR-1", title: "Jembatan ambrol" },
    { reportId: "JR-2", title: "Lampu mati" },
  ];
  const ai = stubAI(() =>
    '[{"reportId": "JR-1", "ringkasan": "Prioritaskan perbaikan jembatan."}, {"reportId": "JR-42", "ringkasan": "Proyek lain."}]',
  );
  const mapped = await summarizePrioritiesWithGemini(ai, items);
  assert.equal(mapped.length, 1);
  assert.equal(mapped[0].reportId, "JR-1");
  assert.match(mapped[0].ringkasan, /jembatan/i);
});
