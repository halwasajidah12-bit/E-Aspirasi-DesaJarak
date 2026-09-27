import { useState, useMemo, useRef, useEffect } from 'react'
import Header from './components/Header.jsx'
import ProfileMenu from './components/ProfileMenu.jsx'
import BottomNav from './components/BottomNav.jsx'
import SideNav from './components/SideNav.jsx'
import Toast from './components/Toast.jsx'
import AiChatWidget from './components/AiChatWidget.jsx'
import NotificationModal from './components/NotificationModal.jsx'
import ReportDetailModal from './components/modals/ReportDetailModal.jsx'
import ProfilEditModal from './components/modals/ProfilEditModal.jsx'
import EdukasiModal from './components/modals/EdukasiModal.jsx'
import NewsModal from './components/modals/NewsModal.jsx'
import Beranda from './pages/Beranda.jsx'
import Laporan from './pages/Laporan.jsx'
import Edukasi from './pages/Edukasi.jsx'
import Berita from './pages/Berita.jsx'
import Profil from './pages/Profil.jsx'
import { initialProfilDesa, initialReports, initialNews, initialEdukasi } from './data/initialData.js'
import { getAppData, saveAppData } from './utils/api.js'

const DEFAULT_NEWS_IMAGE = 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=900&auto=format&fit=crop&q=80'

export default function AdminDashboard({ adminName, onLogout }) {
  // Navigation
  const [activeTab, setActiveTab] = useState('beranda')
  const bodyRef = useRef(null)

  // Core data
  const [profil, setProfil] = useState(initialProfilDesa)
  const [reports, setReports] = useState(initialReports)
  const [newsData, setNewsData] = useState(initialNews)
  const [edukasiData, setEdukasiData] = useState(initialEdukasi)

  useEffect(() => {
    getAppData()
      .then((data) => {
        if (data.profil) setProfil(data.profil)
        if (data.reports) setReports(data.reports)
        if (data.news) setNewsData(data.news)
        if (data.edukasi) setEdukasiData(data.edukasi)
      })
      .catch((error) => showToast(`Database belum tersedia: ${error.message}`))
  }, [])

  const persist = (key, value) => {
    saveAppData(key, value).catch((error) => showToast(`Gagal menyimpan ke database: ${error.message}`))
  }

  // Header / account
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  // Modals & overlays
  const [notifOpen, setNotifOpen] = useState(false)
  const [activeReportId, setActiveReportId] = useState(null)
  const [profilEditOpen, setProfilEditOpen] = useState(false)
  const [edukasiModalOpen, setEdukasiModalOpen] = useState(false)
  const [edukasiEditingId, setEdukasiEditingId] = useState(null)
  const [activeNewsId, setActiveNewsId] = useState(null)

  // Toast
  const [toast, setToast] = useState({ visible: false, message: '' })
  const toastTimer = useRef(null)

  const showToast = (message) => {
    setToast({ visible: true, message })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2800)
  }

  const switchTab = (tabId) => {
    setActiveTab(tabId)
    if (bodyRef.current) bodyRef.current.scrollTop = 0
  }

  // Stats
  const stats = useMemo(() => {
    const total = reports.length
    const masuk = reports.filter((r) => r.status === 'Masuk').length
    const proses = reports.filter((r) => r.status === 'Diproses').length
    const selesai = reports.filter((r) => r.status === 'Selesai').length
    const ditolak = reports.filter((r) => r.status === 'Ditolak').length
    const prioritas = reports.filter((r) => r.urgency === 'Tinggi' && r.status !== 'Selesai').length
    const handled = selesai + proses
    const responseRate = total > 0 ? Math.round((handled / total) * 100) : 100
    return { total, masuk, proses, selesai, ditolak, prioritas, responseRate }
  }, [reports])

  // --- Report actions ---
  const updateReportStatus = (reportId, newStatus) => {
    const next = reports.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
    setReports(next)
    persist('reports', next)
    showToast(`Status laporan ${reportId} diubah menjadi "${newStatus}"`)
  }

  const openReportDetail = (reportId) => setActiveReportId(reportId)
  const closeReportDetail = () => setActiveReportId(null)
  const activeReport = reports.find((r) => r.id === activeReportId) || null

  const saveReportDetail = (reportId, status, reply) => {
    const next = reports.map((r) => (r.id === reportId ? { ...r, status, officialReply: reply } : r))
    setReports(next)
    persist('reports', next)
    showToast(`Laporan ${reportId} berhasil diperbarui!`)
    closeReportDetail()
  }

  // --- Profil actions ---
  const saveProfil = (form) => {
    setProfil(form)
    persist('profil', form)
    setProfilEditOpen(false)
    showToast('Profil dan Data Desa berhasil diperbarui!')
  }

  // --- Edukasi actions ---
  const openEducationNew = () => {
    setEdukasiEditingId(null)
    setEdukasiModalOpen(true)
  }
  const openEducationEdit = (id) => {
    setEdukasiEditingId(id)
    setEdukasiModalOpen(true)
  }
  const editingEdukasiItem = edukasiData.find((e) => e.id === edukasiEditingId) || null

  const saveEducation = (form, editId) => {
    if (editId) {
      const next = edukasiData.map((e) => (e.id === editId ? { ...e, ...form } : e))
      setEdukasiData(next)
      persist('edukasi', next)
      showToast('Modul edukasi berhasil diperbarui.')
    } else {
      const next = [{ id: Date.now(), date: 'Baru saja', ...form }, ...edukasiData]
      setEdukasiData(next)
      persist('edukasi', next)
      showToast('Modul edukasi berhasil ditambahkan.')
    }
    setEdukasiModalOpen(false)
  }

  const setEducationStatus = (id, status) => {
    const next = edukasiData.map((e) => (e.id === id ? { ...e, status } : e))
    setEdukasiData(next)
    persist('edukasi', next)
    showToast(status === 'Publish' ? 'Modul berhasil dipublish.' : 'Modul dipindahkan ke draft.')
  }

  const deleteEdukasiModule = (id) => {
    const next = edukasiData.filter((e) => e.id !== id)
    setEdukasiData(next)
    persist('edukasi', next)
    showToast('Modul edukasi telah dihapus.')
  }

  // --- Berita actions ---
  const generateAiNewsScript = ({ topic, category, image }) => {
    showToast('Sedang menyusun draf berita AI...')
    setTimeout(() => {
      const next = [
        {
          id: Date.now(),
          title: topic,
          category,
          date: 'Hari ini',
          comments: 0,
          status: 'Draft',
          image: image || DEFAULT_NEWS_IMAGE,
          content: `Draf berita AI mengenai ${topic}. Silakan edit isi berita sebelum dipublikasikan.`,
          commentsList: [],
        },
          ...newsData,
      ]
      setNewsData(next)
      persist('news', next)
      showToast('Draf berita AI berhasil dibuat. Silakan edit atau publish.')
    }, image ? 0 : 500)
  }

  const openNewsModal = (id) => setActiveNewsId(id)
  const closeNewsModal = () => setActiveNewsId(null)
  const activeNews = newsData.find((n) => n.id === activeNewsId) || null

  const saveNewsEdit = (form) => {
    const next = newsData.map((n) => (n.id === form.id ? { ...n, ...form } : n))
    setNewsData(next)
    persist('news', next)
    showToast('Berita berhasil diperbarui.')
    closeNewsModal()
  }

  const setNewsStatus = (id, status) => {
    const next = newsData.map((n) => (n.id === id ? { ...n, status } : n))
    setNewsData(next)
    persist('news', next)
    showToast(status === 'Tayang' ? 'Berita berhasil dipublish.' : 'Berita dipindahkan ke draft.')
  }

  const deleteNews = (id) => {
    const next = newsData.filter((n) => n.id !== id)
    setNewsData(next)
    persist('news', next)
    showToast('Berita berhasil dihapus.')
    closeNewsModal()
  }

  const replyToNewsComment = (id, text) => {
    const next = newsData.map((n) => {
      if (n.id !== id) return n
      const commentsList = [...(n.commentsList || []), { name: 'Admin Desa', time: new Date().toLocaleString('id-ID'), text }]
      return { ...n, commentsList, comments: commentsList.length }
    })
    setNewsData(next)
    persist('news', next)
    showToast('Tanggapan admin berhasil ditambahkan.')
  }

  // --- Notification action ---
  const handleNotificationAction = (action) => {
    setNotifOpen(false)
    if (action.type === 'report') {
      openReportDetail(action.id)
    } else if (action.type === 'tab') {
      switchTab(action.tab)
    }
  }

  // --- Account actions ---
  const logout = () => {
    setProfileMenuOpen(false)
    onLogout()
  }

  return (
    <div className="app-shell">
      <Header
        namaDesa={profil.namaDesa}
        onGoHome={() => switchTab('beranda')}
        onOpenNotifications={() => setNotifOpen(true)}
        onToggleProfileMenu={() => setProfileMenuOpen((v) => !v)}
      />

      <ProfileMenu
        visible={profileMenuOpen}
        adminName={adminName}
        onGoProfil={() => {
          switchTab('profil')
          setProfileMenuOpen(false)
        }}
        onLogout={logout}
      />

      <div className="flex-1 w-full max-w-7xl mx-auto md:flex md:gap-5 md:px-5 md:py-5 min-h-0">
        <SideNav activeTab={activeTab} onSwitchTab={switchTab} namaDesa={profil.namaDesa} />

        <main
          ref={bodyRef}
          className="flex-1 min-w-0 no-scrollbar p-3 xs:p-4 md:p-0 space-y-3.5 pb-24 md:pb-4"
        >
        {activeTab === 'beranda' && (
          <Beranda
            profil={profil}
            reports={reports}
            news={newsData}
            stats={stats}
            onSwitchTab={switchTab}
            onOpenReportDetail={openReportDetail}
            onUpdateReportStatus={updateReportStatus}
          />
        )}
        {activeTab === 'laporan' && (
          <Laporan reports={reports} onOpenReportDetail={openReportDetail} onUpdateReportStatus={updateReportStatus} />
        )}
        {activeTab === 'edukasi' && (
          <Edukasi
            edukasiData={edukasiData}
            onAddNew={openEducationNew}
            onEdit={openEducationEdit}
            onSetStatus={setEducationStatus}
            onDelete={deleteEdukasiModule}
          />
        )}
        {activeTab === 'berita' && (
          <Berita
            namaDesa={profil.namaDesa}
            newsData={newsData}
            onGenerateDraft={generateAiNewsScript}
            onOpenNewsModal={openNewsModal}
            onSetNewsStatus={setNewsStatus}
          />
        )}
        {activeTab === 'profil' && <Profil profil={profil} onOpenEdit={() => setProfilEditOpen(true)} />}
        </main>
      </div>

      <AiChatWidget namaDesa={profil.namaDesa} />

      <BottomNav activeTab={activeTab} onSwitchTab={switchTab} />

      <Toast message={toast.message} visible={toast.visible} />

      <ProfilEditModal visible={profilEditOpen} profil={profil} onClose={() => setProfilEditOpen(false)} onSave={saveProfil} />

      <ReportDetailModal report={activeReport} onClose={closeReportDetail} onSave={saveReportDetail} />

      <EdukasiModal
        visible={edukasiModalOpen}
        editingItem={editingEdukasiItem}
        onClose={() => setEdukasiModalOpen(false)}
        onSave={saveEducation}
      />

      <NewsModal
        item={activeNews}
        onClose={closeNewsModal}
        onSave={saveNewsEdit}
        onDelete={deleteNews}
        onReply={replyToNewsComment}
      />

      <NotificationModal visible={notifOpen} onClose={() => setNotifOpen(false)} onAction={handleNotificationAction} />
    </div>
  )
}
