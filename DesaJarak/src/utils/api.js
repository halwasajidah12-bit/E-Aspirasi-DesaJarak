const jsonRequest = async (path, options = {}) => {
  const response = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message || 'Permintaan ke server gagal.')
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

export const getAppData = () => jsonRequest('/data')

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

export const createReport = (report) => jsonRequest('/reports', {
  method: 'POST',
  body: JSON.stringify(report),
})