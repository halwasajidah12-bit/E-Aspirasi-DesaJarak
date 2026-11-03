const AUTH_KEY = 'e-aspirasi-session'

export const getStoredAuthSession = () => {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null')
  } catch {
    return null
  }
}

export const clearStoredAuthSession = () => localStorage.removeItem(AUTH_KEY)

const storeAuthSession = (session) => {
  if (session?.token) {
    localStorage.setItem(AUTH_KEY, JSON.stringify({
      token: session.token,
      userId: session.userId,
      name: session.name,
      email: session.email || '',
      role: session.role,
      expiresAt: session.expiresAt,
    }))
  }
}

const jsonRequest = async (path, options = {}) => {
  const token = getStoredAuthSession()?.token
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(body.message || 'Permintaan ke server gagal.')
    error.status = response.status
    error.data = body
    throw error
  }
  storeAuthSession(body)
  return body
}

export const login = (credentials) => jsonRequest('/auth/login', {
  method: 'POST',
  body: JSON.stringify(credentials),
})

export const register = (user) => jsonRequest('/auth/register', {
  method: 'POST',
  body: JSON.stringify(user),
})

export const authenticateWithGoogle = (credential) => jsonRequest('/auth/google', {
  method: 'POST',
  body: JSON.stringify({ credential }),
})

export const getAuthConfig = () => jsonRequest('/auth/config')
export const getAuthSession = () => jsonRequest('/auth/session')
export const logout = () => jsonRequest('/auth/session', { method: 'DELETE' })

export const getAppData = () => jsonRequest('/data')
export const getVillageProfile = () => jsonRequest('/profile')

export const getNotifications = () => jsonRequest('/notifications')
export const getUserNotifications = () => jsonRequest('/user/notifications')
export const markUserNotificationsRead = () => jsonRequest('/user/notifications/read', {
  method: 'POST',
})
export const getPushConfig = (endpoint = '') => jsonRequest(`/user/push-config${endpoint ? `?endpoint=${encodeURIComponent(endpoint)}` : ''}`)
export const savePushSubscription = (subscription) => jsonRequest('/user/push-subscriptions', {
  method: 'POST',
  body: JSON.stringify({ subscription }),
})
export const removePushSubscription = (endpoint) => jsonRequest('/user/push-subscriptions', {
  method: 'DELETE',
  body: JSON.stringify({ endpoint }),
})
export const getRewards = ({ allActivities = false } = {}) => jsonRequest(`/rewards${allActivities ? '?activities=all' : ''}`)
export const getEmailPreferences = () => jsonRequest('/user/email-preferences')
export const updateEmailPreferences = (enabled) => jsonRequest('/user/email-preferences', {
  method: 'PUT',
  body: JSON.stringify({ enabled }),
})
export const askAssistant = (message) => jsonRequest('/assistant', {
  method: 'POST',
  body: JSON.stringify({ message }),
})

export const markNotificationsRead = () => jsonRequest('/notifications/read', {
  method: 'POST',
})

export const getReports = (scope) => jsonRequest(`/reports${scope ? `?scope=${encodeURIComponent(scope)}` : ''}`)
export const toggleReportVote = (id) => jsonRequest(`/reports/${encodeURIComponent(id)}/vote`, { method: 'POST' })

export const updateReport = (id, updates) => jsonRequest(`/reports/${encodeURIComponent(id)}`, {
  method: 'PUT',
  body: JSON.stringify(updates),
})

export const withdrawReport = (id) => jsonRequest(`/reports/${encodeURIComponent(id)}`, {
  method: 'DELETE',
})

export const addReportComment = (id, comment) => jsonRequest(`/reports/${encodeURIComponent(id)}/comments`, {
  method: 'POST',
  body: JSON.stringify(comment),
})

export const getEducation = () => jsonRequest('/education')

export const createEducation = (education) => jsonRequest('/education', {
  method: 'POST',
  body: JSON.stringify(education),
})

export const updateEducation = (id, updates) => jsonRequest(`/education/${encodeURIComponent(id)}`, {
  method: 'PUT',
  body: JSON.stringify(updates),
})

export const deleteEducationItem = (id) => jsonRequest(`/education/${encodeURIComponent(id)}`, {
  method: 'DELETE',
})

export const getNews = () => jsonRequest('/news')

export const createNews = (news) => jsonRequest('/news', {
  method: 'POST',
  body: JSON.stringify(news),
})

export const updateNews = (id, updates) => jsonRequest(`/news/${encodeURIComponent(id)}`, {
  method: 'PUT',
  body: JSON.stringify(updates),
})

export const deleteNewsItem = (id) => jsonRequest(`/news/${encodeURIComponent(id)}`, {
  method: 'DELETE',
})

export const addNewsComment = (id, comment) => jsonRequest(`/news/${encodeURIComponent(id)}/comments`, {
  method: 'POST',
  body: JSON.stringify(comment),
})

export const saveAppData = (key, value) => jsonRequest(`/data/${key}`, {
  method: 'PUT',
  body: JSON.stringify({ value }),
})

export const createReport = async (report, owner) => {
  const created = await jsonRequest('/reports', {
    method: 'POST',
    body: JSON.stringify({ ...report, ...owner }),
  })
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('user-notifications-updated'))
  return created
}

export const getReportQuota = () => jsonRequest('/reports/quota')

export const uploadImage = async (file) => {
  const token = getStoredAuthSession()?.token
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch('/api/uploads', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message || 'Gagal mengunggah foto.')
  return body
}

export const privateUploadUrl = (filename) => `/api/uploads/${encodeURIComponent(filename)}`

export const getUserProfile = (id) => jsonRequest(`/users/${encodeURIComponent(id)}`)

export const updateUserProfile = async (id, formData) => {
  const token = getStoredAuthSession()?.token
  const response = await fetch(`/api/users/${encodeURIComponent(id)}`, {
    method: 'PUT',
    // Jangan memakai Content-Type karena browser akan mengatur
    // multipart/form-data beserta boundary secara otomatis.
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message || 'Gagal menyimpan profil.')
  return body
}

export const getCategories = async () => {
  const token = getStoredAuthSession()?.token
  const res = await fetch("/api/categories", {
    headers: {
      Authorization: `Bearer ${token || ''}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch categories");
  return await res.json();
};

// Deteksi duplikasi: bandingkan draf laporan dengan laporan yang sudah ada
export const checkDuplicates = (draft) => jsonRequest('/ai/duplicate-check', {
  method: 'POST',
  body: JSON.stringify(draft),
});

// (Admin) Analisis sentimen + poin utama komentar laporan
export const analyzeReportComments = (reportId) => jsonRequest('/ai/analyze-comments', {
  method: 'POST',
  body: JSON.stringify({ reportId }),
});

// (Admin) Daftar laporan terurut prioritas + ringkasan AI
export const getPriorities = () => jsonRequest('/ai/priorities');
