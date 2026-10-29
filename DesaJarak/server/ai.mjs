// Modul logika AI (Gemini) untuk backend E-Aspirasi Desa Jarak.
// Semua fungsi menerima instance GoogleGenAI (ai) sebagai argumen agar mudah diuji,
// dan SELALU mengembalikan fallback (null/string aman) bila AI gagal — submission
// laporan tidak boleh gagal karena AI.

const DEFAULT_TIMEOUT_MS = 15_000;

const withTimeout = async (promise, label, timeoutMs = DEFAULT_TIMEOUT_MS) => {
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
${allowedCategories.map((category) => `- ${category}`).join("\n")}

Judul laporan: "${title}"
Deskripsi laporan: "${description}"

Balas HANYA dengan nama kategorinya, tanpa penjelasan dan tanpa tanda kutip.`,
      }),
      "Gemini classification",
    );
    const category = String(result.text || "").trim().replace(/^["']|["']$/g, "");
    return allowedCategories.includes(category) ? category : null;
  } catch (error) {
    console.error("Gemini classification gagal:", error.message);
    return null;
  }
};
