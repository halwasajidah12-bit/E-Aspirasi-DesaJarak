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

export const getNotifications = () => jsonRequest('/notifications')

export const markNotificationsRead = () => jsonRequest('/notifications/read', {
  method: 'POST',
})

export const getReports = () => jsonRequest('/reports')

export const updateReport = (id, updates) => jsonRequest(`/reports/${encodeURIComponent(id)}`, {
  method: 'PUT',
  body: JSON.stringify(updates),
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

export const createReport = (report, owner) => jsonRequest('/reports', {
  method: 'POST',
  body: JSON.stringify({ ...report, ...owner }),
})

export const getUserProfile = (id) => jsonRequest(`/users/${encodeURIComponent(id)}`)

export const updateUserProfile = async (id, formData) => {
  const response = await fetch(`/api/users/${encodeURIComponent(id)}`, {
    method: 'PUT',
    // perhtaikan cuy ini Tidak memakai headers Content-Type karena browser akan otomatis 
    // mengatur 'multipart/form-data' beserta 'boundary'-nya dari objek FormData
    body: formData,
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message || 'Gagal menyimpan profil.')
  return body
}
export const getCategories = async () => {
  const res = await fetch("/api/categories");
  if (!res.ok) throw new Error("Failed to fetch categories");
  return await res.json();
};

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/uploads", {
    method: "POST",
    body: formData,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || "Gagal mengunggah foto.");
  return body;
};

export const getEmailPreferences = () => jsonRequest("/user/email-preferences");

export const updateEmailPreferences = (enabled) => jsonRequest("/user/email-preferences", {
  method: "PUT",
  body: JSON.stringify({ enabled }),
});