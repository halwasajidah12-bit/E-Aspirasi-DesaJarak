import { createReadStream } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { createHash, randomBytes, scryptSync } from 'node:crypto'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import http from 'node:http'
import pg from 'pg'
import { initialProfilDesa, initialReports, initialNews, initialEdukasi } from './src/data/initialData.js'
import { beritaData } from './src/user/data/berita.js'
import { edukasiList } from './src/user/data/edukasi.js'
import { laporanData } from './src/user/data/laporan.js'
import { profilDesa } from './src/user/data/profilDesa.js'

const { Pool } = pg
const root = fileURLToPath(new URL('.', import.meta.url))
const port = Number(process.env.PORT || 4173)
const pool = new Pool(process.env.DATABASE_URL ? {
  connectionString: process.env.DATABASE_URL,
} : {
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE || process.env.POSTGRES_DB,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
})

const seedData = { profil: initialProfilDesa, reports: initialReports, news: initialNews, edukasi: initialEdukasi, userBerita: beritaData, userEdukasi: edukasiList, userLaporan: laporanData, userProfil: profilDesa }

const sendJson = (response, status, payload) => {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  response.end(JSON.stringify(payload))
}

const readJson = async (request) => {
  let body = ''
  for await (const chunk of request) body += chunk
  return body ? JSON.parse(body) : {}
}

const hashPassword = (password, salt = randomBytes(16).toString('hex')) => ({ salt, hash: scryptSync(password, salt, 64).toString('hex') })
const passwordMatches = (password, salt, expected) => createHash('sha256').update(hashPassword(password, salt).hash).digest('hex') === createHash('sha256').update(expected).digest('hex')

const initDatabase = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_data (data_key TEXT PRIMARY KEY, data_value JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS users (id BIGSERIAL PRIMARY KEY, username TEXT UNIQUE NOT NULL, fullname TEXT NOT NULL, password_hash TEXT NOT NULL, password_salt TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
  `)
  for (const [key, value] of Object.entries(seedData)) {
    await pool.query('INSERT INTO app_data (data_key, data_value) VALUES ($1, $2) ON CONFLICT (data_key) DO NOTHING', [key, JSON.stringify(value)])
  }
  for (const [username, fullname, password] of [['admin', 'Admin Desa', process.env.ADMIN_PASSWORD || 'admin'], ['warga', 'Warga Desa', 'warga']]) {
    const credentials = hashPassword(password)
    await pool.query('INSERT INTO users (username, fullname, password_hash, password_salt) VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO NOTHING', [username, fullname, credentials.hash, credentials.salt])
  }
}

const handleApi = async (request, response, pathname) => {
  if (request.method === 'GET' && pathname === '/api/health') return sendJson(response, 200, { ok: true })
  if (request.method === 'GET' && pathname === '/api/data') {
    const result = await pool.query('SELECT data_key, data_value FROM app_data ORDER BY data_key')
    return sendJson(response, 200, Object.fromEntries(result.rows.map((row) => [row.data_key, row.data_value])))
  }
  if (request.method === 'PUT' && pathname.startsWith('/api/data/')) {
    const key = pathname.slice('/api/data/'.length)
    if (!Object.hasOwn(seedData, key)) return sendJson(response, 404, { message: 'Dataset tidak ditemukan.' })
    const { value } = await readJson(request)
    await pool.query('UPDATE app_data SET data_value = $1, updated_at = NOW() WHERE data_key = $2', [JSON.stringify(value), key])
    return sendJson(response, 200, { ok: true, key, value })
  }
  if (request.method === 'POST' && pathname === '/api/reports') {
    const body = await readJson(request)
    if (!body.judul || !body.deskripsi || !body.lokasi) return sendJson(response, 400, { message: 'Judul, lokasi, dan deskripsi wajib diisi.' })
    const result = await pool.query('SELECT data_value FROM app_data WHERE data_key = $1', ['reports'])
    const reports = result.rows[0]?.data_value || []
    const report = {
      id: `JR-${String(Date.now()).slice(-6)}`,
      title: body.judul,
      author: body.author || 'Warga Desa',
      category: body.kategori || 'Lainnya',
      status: 'Masuk',
      urgency: 'Sedang',
      votes: 0,
      comments: 0,
      image: '',
      description: `${body.deskripsi} Lokasi: ${body.lokasi}. RT ${body.rt || '-'} / RW ${body.rw || '-'}.`,
      aiSuggestion: '',
      officialReply: '',
      submittedAt: new Date().toISOString(),
      commentsList: [],
    }
    const next = [report, ...reports]
    await pool.query('UPDATE app_data SET data_value = $1, updated_at = NOW() WHERE data_key = $2', [JSON.stringify(next), 'reports'])
    return sendJson(response, 201, report)
  }
  if (request.method === 'POST' && (pathname === '/api/auth/login' || pathname === '/api/auth/register')) {
    const body = await readJson(request)
    const username = String(body.username || '').trim().toLowerCase()
    const password = String(body.password || '')
    if (!username || !password) return sendJson(response, 400, { message: 'Username dan password wajib diisi.' })
    if (pathname.endsWith('register')) {
      const fullname = String(body.fullname || username).trim()
      const credentials = hashPassword(password)
      try {
        await pool.query('INSERT INTO users (username, fullname, password_hash, password_salt) VALUES ($1, $2, $3, $4)', [username, fullname, credentials.hash, credentials.salt])
        return sendJson(response, 201, { success: true, role: 'user', name: fullname })
      } catch (error) {
        if (error.code === '23505') return sendJson(response, 409, { message: 'Username sudah digunakan.' })
        throw error
      }
    }
    const result = await pool.query('SELECT username, fullname, password_hash, password_salt FROM users WHERE username = $1', [username])
    const user = result.rows[0]
    if (!user || !passwordMatches(password, user.password_salt, user.password_hash)) return sendJson(response, 401, { message: 'Username atau password salah.' })
    return sendJson(response, 200, { success: true, role: user.username === 'admin' ? 'admin' : 'user', name: user.fullname })
  }
  return sendJson(response, 404, { message: 'Endpoint tidak ditemukan.' })
}

const serveStatic = async (response, pathname) => {
  const requested = pathname === '/' ? '/index.html' : pathname
  const filePath = normalize(join(root, 'dist', requested))
  try {
    const fileStat = await stat(filePath)
    if (!fileStat.isFile()) throw new Error('not-file')
    const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' }[extname(filePath)] || 'application/octet-stream'
    response.writeHead(200, { 'Content-Type': mime })
    createReadStream(filePath).pipe(response)
  } catch {
    const index = await readFile(join(root, 'dist', 'index.html'))
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    response.end(index)
  }
}

const server = http.createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, `http://${request.headers.host}`).pathname
    if (pathname.startsWith('/api/')) await handleApi(request, response, pathname)
    else await serveStatic(response, pathname)
  } catch (error) {
    console.error(error)
    sendJson(response, 500, { message: 'Kesalahan server.' })
  }
})

initDatabase()
  .then(() => server.listen(port, '0.0.0.0', () => console.log(`E-Aspirasi listening on port ${port}`)))
  .catch((error) => { console.error('Database connection failed:', error); process.exit(1) })
