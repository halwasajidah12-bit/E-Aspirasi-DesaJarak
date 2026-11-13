import { useState, useMemo, useRef, useEffect } from 'react'
import Header from './components/Header.jsx'
import ProfileMenu from './components/ProfileMenu.jsx'
import BottomNav from './components/BottomNav.jsx'
import SideNav from './components/SideNav.jsx'
import Toast from './components/Toast.jsx'
import AiChatWidget from './components/AiChatWidget.jsx'
import AiPriorityPanel from './components/AiPriorityPanel.jsx'
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
import { initialProfilDesa, initialReports, initialNews } from './data/initialData.js'
import { initialEducationModules, sortEducationModules } from './data/education.js'
import { getAppData, saveAppData, getReports, updateReport, getNews, createNews, updateNews, deleteNewsItem, addNewsComment, getEducation, createEducation, updateEducation, deleteEducationItem, getNotifications, markNotificationsRead } from './utils/api.js'

const DEFAULT_NEWS_IMAGE = 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=900&auto=format&fit=crop&q=80'

export default function AdminDashboard({ adminName, onLogout }) {
  // Navigation
  const [activeTab, setActiveTab] = useState('beranda')
  const bodyRef = useRef(null)

  // Core data
  const [profil, setProfil] = useState(initialProfilDesa)
  const [reports, setReports] = useState(initialReports)
  const [newsData, setNewsData] = useState(initialNews)
  const [edukasiData, setEdukasiData] = useState(() => sortEducationModules(initialEducationModules))
  const [notifications, setNotifications] = useState([])
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)

  useEffect(() => {
    getAppData()
      .then((data) => {
        if (data.profil) setProfil(data.profil)
        if (data.reports) setReports(data.reports)
        if (data.news) setNewsData(data.news)
        if (data.edukasi) setEdukasiData(sortEducationModules(data.edukasi))
      })
      .catch((error) => showToast(`Database belum tersedia: ${error.message}`))
  }, [])

  useEffect(() => {
    const refreshSharedData = () => {
      getReports().then(setReports).catch(() => {})
      getNews().then(setNewsData).catch(() => {})
      getEducation().then((items) => setEdukasiData(sortEducationModules(items))).catch(() => {})
      getNotifications()
        .then((data) => {
          setNotifications(data.items || [])
          setUnreadNotificationCount(data.unreadCount || 0)
        })
        .catch(() => {})
      }
      refreshSharedData()
      const interval = setInterval(refreshSharedData, 3000)
    return () => clearInterval(interval)
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
    const prioritas = reports.filter((r) => r.urgency === 'Tinggi').length
    const handled = selesai + proses
    const responseRate = total > 0 ? Math.round((handled / total) * 100) : 100
    return { total, masuk, proses, selesai, ditolak, prioritas, responseRate }
  }, [reports])

  // --- Report actions ---
  const updateReportStatus = async (reportId, newStatus) => {
    try {
      const updated = await updateReport(reportId, { status: newStatus })
      setReports((current) => current.map((report) => report.id === reportId ? updated : report))
      showToast(`Status laporan ${reportId} diubah menjadi "${newStatus}"`)
    } catch (error) {
      showToast(`Gagal mengubah status laporan: ${error.message}`)
    }
  }

  const openReportDetail = (reportId) => setActiveReportId(reportId)
  const closeReportDetail = () => setActiveReportId(null)
  const activeReport = reports.find((r) => r.id === activeReportId) || null
  console.log("DATA PRIORITAS AI:", activeReport?.priorityReason);

  const openNotifications = () => {
    setNotifOpen(true)
    markNotificationsRead()
      .then(({ readAt }) => {
        setUnreadNotificationCount(0)
        setNotifications((current) => current.map((notification) => ({ ...notification, readAt: notification.readAt || readAt })))
      })
      .catch(() => showToast('Gagal menyimpan status notifikasi dibaca.'))
  }

  const saveReportDetail = async (reportId, status, reply) => {
    try {
      const updated = await updateReport(reportId, { status, officialReply: reply })
      setReports((current) => current.map((report) => report.id === reportId ? updated : report))
      showToast(`Laporan ${reportId} berhasil diperbarui!`)
      closeReportDetail()
    } catch (error) {
      showToast(`Gagal memperbarui laporan: ${error.message}`)
    }
  }

  // Sinkronkan hasil analisis AI ke daftar laporan di state seketika
  // agar modal tidak menampilkan data basi saat dibuka ulang.
  const applyAnalysisToReport = (reportId, analysis) => {
    setReports((current) =>
      current.map((report) =>
        report.id === reportId
          ? {
              ...report,
              aiSentiment: analysis.sentiment,
              aiKeyPoints: analysis.keyPoints || [],
              aiAttentionPoints: analysis.attentionPoints || [],
              aiAnalysisAt: analysis.at || new Date().toISOString(),
            }
          : report,
      ),
    )
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

  const saveEducation = async (form, editId) => {
    try {
      if (editId) {
        const updated = await updateEducation(editId, form)
        setEdukasiData((current) => sortEducationModules(current.map((item) => String(item.id) === String(editId) ? updated : item)))
        showToast('Modul edukasi berhasil diperbarui.')
      } else {
        const created = await createEducation(form)
        setEdukasiData((current) => sortEducationModules([created, ...current]))
        showToast('Modul edukasi berhasil ditambahkan.')
      }
      setEdukasiModalOpen(false)
    } catch (error) {
      showToast(`Gagal menyimpan edukasi: ${error.message}`)
    }
  }

  const setEducationStatus = async (id, status) => {
    try {
      const updated = await updateEducation(id, { status })
      setEdukasiData((current) => sortEducationModules(current.map((item) => String(item.id) === String(id) ? updated : item)))
      showToast(status === 'Publish' ? 'Modul berhasil dipublish.' : 'Modul dipindahkan ke draft.')
    } catch (error) {
      showToast(`Gagal mengubah status edukasi: ${error.message}`)
    }
  }

  const deleteEdukasiModule = async (id) => {
    try {
      await deleteEducationItem(id)
      setEdukasiData((current) => current.filter((item) => String(item.id) !== String(id)))
      showToast('Modul edukasi telah dihapus.')
    } catch (error) {
      showToast(`Gagal menghapus edukasi: ${error.message}`)
    }
  }

  // --- Berita actions ---
  const generateAiNewsScript = ({ topic, category, image }) => {
    showToast('Sedang menyusun draf berita AI...')
    setTimeout(() => {
      createNews({
        title: topic,
        category,
        date: 'Hari ini',
        image: image || DEFAULT_NEWS_IMAGE,
        content: `Draf berita AI mengenai ${topic}. Silakan edit isi berita sebelum dipublikasikan.`,
      })
        .then((created) => {
          setNewsData((current) => [created, ...current])
          showToast('Draf berita AI berhasil dibuat. Silakan edit atau publish.')
        })
        .catch((error) => showToast(`Gagal membuat draf berita: ${error.message}`))
    }, image ? 0 : 500)
  }

  const openNewsModal = (id) => setActiveNewsId(id)
  const closeNewsModal = () => setActiveNewsId(null)
  const activeNews = newsData.find((n) => n.id === activeNewsId) || null

  const saveNewsEdit = async (form) => {
    try {
      const updated = await updateNews(form.id, form)
      setNewsData((current) => current.map((item) => String(item.id) === String(updated.id) ? updated : item))
      showToast('Berita berhasil diperbarui.')
      closeNewsModal()
    } catch (error) {
      showToast(`Gagal memperbarui berita: ${error.message}`)
    }
  }

  const setNewsStatus = async (id, status) => {
    try {
      const updated = await updateNews(id, { status })
      setNewsData((current) => current.map((item) => String(item.id) === String(id) ? updated : item))
      showToast(status === 'Tayang' ? 'Berita berhasil dipublish.' : 'Berita dipindahkan ke draft.')
    } catch (error) {
      showToast(`Gagal mengubah status berita: ${error.message}`)
    }
  }

  const deleteNews = async (id) => {
    try {
      await deleteNewsItem(id)
      setNewsData((current) => current.filter((item) => String(item.id) !== String(id)))
      showToast('Berita telah dihapus.')
      closeNewsModal()
    } catch (error) {
      showToast(`Gagal menghapus berita: ${error.message}`)
    }
  }

  const replyToNewsComment = async (id, text, replyToId = null) => {
    try {
      const updated = await addNewsComment(id, { name: 'Admin Desa Jarak', role: 'admin', text, replyToId })
      setNewsData((current) => current.map((item) => String(item.id) === String(id) ? updated : item))
      showToast(replyToId ? 'Balasan admin berhasil ditambahkan.' : 'Komentar admin berhasil ditambahkan.')
    } catch (error) {
      showToast(`Gagal mengirim komentar: ${error.message}`)
    }
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
        notificationCount={unreadNotificationCount}
        onGoHome={() => switchTab('beranda')}
        onOpenNotifications={openNotifications}
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
        {activeTab === 'beranda' && <AiPriorityPanel onOpenReportDetail={openReportDetail} />}
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

      <ReportDetailModal
  report={activeReport}
  onClose={closeReportDetail}
  onSave={saveReportDetail}
  isAdmin={true}
  onAnalysisPersisted={applyAnalysisToReport}
/>
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

      <NotificationModal visible={notifOpen} notifications={notifications} onClose={() => setNotifOpen(false)} onAction={handleNotificationAction} />
    </div>
  )
}
