import { createReadStream } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { createHash, randomBytes, scryptSync } from 'node:crypto'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import http from 'node:http'
import pg from 'pg'
import { initialProfilDesa, initialReports, initialNews } from './src/data/initialData.js'
import { initialEducationModules } from './src/data/education.js'
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

const categoryNames = ['Pembangunan Desa', 'Penggunaan Website', 'Pedoman Aspirasi', 'Syarat dan Ketentuan']
const removeEducationIcons = (value) => {
  if (Array.isArray(value)) return value.map(removeEducationIcons)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => key !== 'icon')
    .map(([key, nested]) => [key, removeEducationIcons(nested)]))
}
const seedEducation = removeEducationIcons(initialEducationModules)
const seedData = { profil: initialProfilDesa, reports: initialReports, news: initialNews, edukasi: seedEducation, userBerita: beritaData, userEdukasi: edukasiList, userLaporan: laporanData, userProfil: profilDesa }
const defaultNewsComments = new Set([
  'Semoga segera selesai dan bisa digunakan warga.',
  'Terima kasih informasinya.',
  'Apakah rincian penggunaannya akan dipublikasikan?',
])

const countComments = (comments = []) => comments.reduce(
  (total, comment) => total + 1 + countComments(comment.replies || []),
  0,
)

const normalizeNewsComment = (comment, index, postId) => {
  const text = comment.text || comment.teks || ''
  if (!text || defaultNewsComments.has(text.trim())) return null
  const originalName = comment.name || comment.nama || 'Warga Desa'
  const name = originalName === 'Admin Desa' ? 'Admin Desa Jarak' : originalName
  return {
    id: comment.id || `${postId}-comment-${index}`,
    name,
    role: comment.role || (['Admin Desa', 'Admin Desa Jarak'].includes(originalName) ? 'admin' : 'user'),
    time: comment.time || comment.waktu || '',
    text,
    quotedName: comment.quotedName || '',
    quotedText: comment.quotedText || '',
    replies: (comment.replies || [])
      .map((reply, replyIndex) => normalizeNewsComment(reply, `${index}-${replyIndex}`, postId))
      .filter(Boolean),
  }
}

const migrateNews = (items) => items.map((item) => {
  let image = item.image
  if (item.title === 'Pembangunan Posyandu Baru Dusun Jarak Lor' && image?.startsWith('https://images.unsplash.com/photo-1577495508048-b635879837f1')) image = '/images/posyandu.jpg'
  if (item.title === 'Dana Desa Tahap II Rp 240 Juta Disalurkan' && image?.startsWith('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c')) image = '/images/dana.jpg'
  const commentsList = (item.commentsList || [])
    .map((comment, index) => normalizeNewsComment(comment, index, item.id))
    .filter(Boolean)
  return { ...item, image, commentsList, comments: countComments(commentsList) }
})

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

const mutateNews = async (mutator) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await client.query('SELECT data_value FROM app_data WHERE data_key = $1 FOR UPDATE', ['news'])
    const outcome = mutator(result.rows[0]?.data_value || [])
    if (!outcome) {
      await client.query('ROLLBACK')
      return null
    }
    await client.query('UPDATE app_data SET data_value = $1, updated_at = NOW() WHERE data_key = $2', [JSON.stringify(outcome.news), 'news'])
    await client.query('COMMIT')
    return outcome.value
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

const mutateEducation = async (mutator) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await client.query('SELECT data_value FROM app_data WHERE data_key = $1 FOR UPDATE', ['edukasi'])
    const outcome = mutator(result.rows[0]?.data_value || [])
    if (!outcome) {
      await client.query('ROLLBACK')
      return null
    }
    await client.query('UPDATE app_data SET data_value = $1, updated_at = NOW() WHERE data_key = $2', [JSON.stringify(outcome.education), 'edukasi'])
    await client.query('COMMIT')
    return outcome.value
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

const initDatabase = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_data (data_key TEXT PRIMARY KEY, data_value JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS users (id BIGSERIAL PRIMARY KEY, username TEXT UNIQUE NOT NULL, fullname TEXT NOT NULL, password_hash TEXT NOT NULL, password_salt TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
  `)
  for (const [key, value] of Object.entries(seedData)) {
    await pool.query('INSERT INTO app_data (data_key, data_value) VALUES ($1, $2) ON CONFLICT (data_key) DO NOTHING', [key, JSON.stringify(value)])
  }
  const storedEducation = await pool.query('SELECT data_value FROM app_data WHERE data_key = $1', ['edukasi'])
  const currentEducation = storedEducation.rows[0]?.data_value || []
  if (!currentEducation.length || !currentEducation.some((item) => item.slug && item.sections)) {
    const migratedEducation = seedEducation.map((item) => ({ ...item, updatedAt: item.updatedAt || new Date().toISOString() }))
    await pool.query('UPDATE app_data SET data_value = $1, updated_at = NOW() WHERE data_key = $2', [JSON.stringify(migratedEducation), 'edukasi'])
  } else {
    const normalizedEducation = removeEducationIcons(currentEducation).map((item) => ({ ...item, updatedAt: item.updatedAt || new Date().toISOString() }))
    await pool.query('UPDATE app_data SET data_value = $1 WHERE data_key = $2', [JSON.stringify(normalizedEducation), 'edukasi'])
  }
  const storedNews = await pool.query('SELECT data_value FROM app_data WHERE data_key = $1', ['news'])
  const normalizedNews = migrateNews(storedNews.rows[0]?.data_value || [])
  await pool.query('UPDATE app_data SET data_value = $1, updated_at = NOW() WHERE data_key = $2', [JSON.stringify(normalizedNews), 'news'])
  const storedUserNews = await pool.query('SELECT data_value FROM app_data WHERE data_key = $1', ['userBerita'])
  const userNews = (storedUserNews.rows[0]?.data_value || []).map((item) => {
    let image = item.image
    if (image?.startsWith('https://images.unsplash.com/photo-1577495508048-b635879837f1')) image = '/images/posyandu.jpg'
    if (image?.startsWith('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c')) image = '/images/dana.jpg'
    return { ...item, image, komentar: (item.komentar || []).filter((comment) => !defaultNewsComments.has(String(comment.teks || comment.text || '').trim())) }
  })
  await pool.query('UPDATE app_data SET data_value = $1, updated_at = NOW() WHERE data_key = $2', [JSON.stringify(userNews), 'userBerita'])
  for (const [username, fullname, password] of [['admin', 'Admin Desa', process.env.ADMIN_PASSWORD || 'admin'], ['warga', 'Warga Desa', 'warga']]) {
    const credentials = hashPassword(password)
    await pool.query('INSERT INTO users (username, fullname, password_hash, password_salt) VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO NOTHING', [username, fullname, credentials.hash, credentials.salt])
  }
}

const handleApi = async (request, response, pathname) => {
  if (request.method === 'GET' && pathname === '/api/health') return sendJson(response, 200, { ok: true })
  if (request.method === 'GET' && pathname === '/api/education') {
    const result = await pool.query('SELECT data_value FROM app_data WHERE data_key = $1', ['edukasi'])
    return sendJson(response, 200, result.rows[0]?.data_value || [])
  }
  if (request.method === 'POST' && pathname === '/api/education') {
    const body = await readJson(request)
    if (!body.title || !body.desc || !body.content) return sendJson(response, 400, { message: 'Judul, ringkasan, dan isi edukasi wajib diisi.' })
    const created = await mutateEducation((items) => {
      const id = String(Date.now())
      const slugBase = String(body.category || body.title).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      const item = {
        id,
        slug: `${slugBase}-${id}`,
        category: categoryNames.includes(body.category) ? body.category : 'Pembangunan Desa',
        title: String(body.title).trim(),
        desc: String(body.desc).trim(),
        subtitle: String(body.subtitle || '').trim(),
        content: String(body.content).trim(),
        sections: [],
        iconName: body.iconName || 'file-check',
        image: body.image || '',
        status: body.status === 'Publish' ? 'Publish' : 'Draft',
        updatedAt: new Date().toISOString(),
      }
      return { education: [item, ...items], value: item }
    })
    return sendJson(response, 201, created)
  }
  if (request.method === 'PUT' && /^\/api\/education\/[^/]+$/.test(pathname)) {
    const id = decodeURIComponent(pathname.slice('/api/education/'.length))
    const updates = await readJson(request)
    const allowed = ['category', 'title', 'desc', 'subtitle', 'content', 'status', 'image', 'iconName']
    const updated = await mutateEducation((items) => {
      const current = items.find((item) => String(item.id) === id || item.slug === id)
      if (!current) return null
      const nextItem = {
        ...current,
        ...Object.fromEntries(allowed.filter((key) => Object.hasOwn(updates, key)).map((key) => [key, updates[key]])),
        updatedAt: new Date().toISOString(),
      }
      if (Object.hasOwn(updates, 'content')) nextItem.sections = []
      if (Object.hasOwn(updates, 'category') && nextItem.category !== current.category) {
        const base = String(nextItem.category).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        nextItem.slug = `${base}-${nextItem.id}`
      }
      return { education: items.map((item) => item === current ? nextItem : item), value: nextItem }
    })
    return updated ? sendJson(response, 200, updated) : sendJson(response, 404, { message: 'Modul edukasi tidak ditemukan.' })
  }
  if (request.method === 'DELETE' && /^\/api\/education\/[^/]+$/.test(pathname)) {
    const id = decodeURIComponent(pathname.slice('/api/education/'.length))
    const deleted = await mutateEducation((items) => {
      if (!items.some((item) => String(item.id) === id || item.slug === id)) return null
      return { education: items.filter((item) => String(item.id) !== id && item.slug !== id), value: { id } }
    })
    return deleted ? sendJson(response, 200, deleted) : sendJson(response, 404, { message: 'Modul edukasi tidak ditemukan.' })
  }
  if (request.method === 'GET' && pathname === '/api/news') {
    const result = await pool.query('SELECT data_value FROM app_data WHERE data_key = $1', ['news'])
    return sendJson(response, 200, result.rows[0]?.data_value || [])
  }
  if (request.method === 'POST' && pathname === '/api/news') {
    const body = await readJson(request)
    if (!body.title || !body.content) return sendJson(response, 400, { message: 'Judul dan isi berita wajib diisi.' })
    const created = await mutateNews((items) => {
      const news = {
        id: Date.now(),
        title: String(body.title).trim(),
        category: body.category || 'Pengumuman',
        date: body.date || 'Hari ini',
        status: 'Draft',
        image: body.image || '',
        content: String(body.content).trim(),
        commentsList: [],
        comments: 0,
      }
      return { news: [news, ...items], value: news }
    })
    return sendJson(response, 201, created)
  }
  if (request.method === 'PUT' && /^\/api\/news\/[^/]+$/.test(pathname)) {
    const id = decodeURIComponent(pathname.slice('/api/news/'.length))
    const updates = await readJson(request)
    const allowed = ['title', 'category', 'date', 'status', 'image', 'content']
    const updated = await mutateNews((items) => {
      const current = items.find((item) => String(item.id) === id)
      if (!current) return null
      const nextItem = { ...current, ...Object.fromEntries(allowed.filter((key) => Object.hasOwn(updates, key)).map((key) => [key, updates[key]])) }
      nextItem.comments = countComments(nextItem.commentsList || [])
      return { news: items.map((item) => String(item.id) === id ? nextItem : item), value: nextItem }
    })
    return updated ? sendJson(response, 200, updated) : sendJson(response, 404, { message: 'Berita tidak ditemukan.' })
  }
  if (request.method === 'DELETE' && /^\/api\/news\/[^/]+$/.test(pathname)) {
    const id = decodeURIComponent(pathname.slice('/api/news/'.length))
    const deleted = await mutateNews((items) => {
      if (!items.some((item) => String(item.id) === id)) return null
      return { news: items.filter((item) => String(item.id) !== id), value: { id } }
    })
    return deleted ? sendJson(response, 200, deleted) : sendJson(response, 404, { message: 'Berita tidak ditemukan.' })
  }
  if (request.method === 'POST' && /^\/api\/news\/[^/]+\/comments$/.test(pathname)) {
    const id = decodeURIComponent(pathname.slice('/api/news/'.length, -'/comments'.length))
    const body = await readJson(request)
    const text = String(body.text || '').trim()
    if (!text) return sendJson(response, 400, { message: 'Komentar tidak boleh kosong.' })
    const role = body.role === 'admin' ? 'admin' : 'user'
    const comment = {
      id: randomBytes(8).toString('hex'),
      name: String(body.name || (role === 'admin' ? 'Admin Desa Jarak' : 'Warga Desa')).trim(),
      role,
      time: new Date().toLocaleString('id-ID'),
      text,
      quotedName: '',
      quotedText: '',
      replies: [],
    }
    const updated = await mutateNews((items) => {
      const current = items.find((item) => String(item.id) === id)
      if (!current || (role === 'user' && !['Tayang', 'Publish'].includes(current.status))) return null
      const commentsList = [...(current.commentsList || [])]
      if (role === 'admin' && body.replyToId) {
        const parent = commentsList.find((entry) => String(entry.id) === String(body.replyToId))
        if (!parent) return null
        comment.quotedName = parent.name
        comment.quotedText = parent.text
        parent.replies = [...(parent.replies || []), comment]
      } else {
        commentsList.push(comment)
      }
      const nextItem = { ...current, commentsList, comments: countComments(commentsList) }
      return { news: items.map((item) => String(item.id) === id ? nextItem : item), value: nextItem }
    })
    return updated ? sendJson(response, 201, updated) : sendJson(response, 404, { message: 'Berita tidak ditemukan atau tidak dapat dikomentari.' })
  }
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
