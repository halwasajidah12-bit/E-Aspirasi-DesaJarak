export const apiConfig = {
  token: () => localStorage.getItem('token'),
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
  },
};

export const jsonRequest = async (path, options = {}) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
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

export const createReport = async (report, owner, files = []) => {
  const formData = new FormData();
  formData.append('judul', report.judul || '');
  formData.append('deskripsi', report.deskripsi || '');
  formData.append('lokasi', report.lokasi || '');
  formData.append('rt', report.rt || '');
  formData.append('rw', report.rw || '');
  formData.append('waktu', report.waktu || '');
  formData.append('tanggal', report.tanggal || '');
  formData.append('kategori', report.kategori || '');
  formData.append('ownerId', owner?.ownerId || '');
  formData.append('ownerName', owner?.ownerName || 'Warga Desa');

  // Kirim file foto (maks 5)
  files.forEach((file, i) => formData.append(`images`, file));

  const token = localStorage.getItem('token');
  const response = await fetch('/api/reports', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token || ''}`,
    },
    body: formData,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || 'Permintaan ke server gagal.');
  return body;
};

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