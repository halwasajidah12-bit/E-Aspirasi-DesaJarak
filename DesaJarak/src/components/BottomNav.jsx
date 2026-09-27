const NAV_ITEMS = [
  { id: 'beranda', label: 'Beranda', icon: 'fa-house-chimney' },
  { id: 'laporan', label: 'Laporan', icon: 'fa-file-invoice' },
  { id: 'edukasi', label: 'Edukasi', icon: 'fa-graduation-cap' },
  { id: 'berita', label: 'Berita', icon: 'fa-newspaper' },
  { id: 'profil', label: 'Profil Desa', icon: 'fa-building' },
]

export default function BottomNav({ activeTab, onSwitchTab }) {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-emerald-100 shadow-lg z-30 px-1 py-1 pb-safe flex justify-between items-center max-w-[520px] mx-auto">
      {NAV_ITEMS.map((item) => {
        const active = activeTab === item.id
        return (
          <button
            key={item.id}
            onClick={() => onSwitchTab(item.id)}
            className={`flex-1 flex flex-col items-center py-1.5 px-0.5 transition active:scale-95 ${
              active ? 'text-emerald-600 font-bold' : 'text-gray-400 hover:text-emerald-600 font-medium'
            }`}
          >
            <i className={`fa-solid ${item.icon} text-base`}></i>
            <span className="text-[9px] xs:text-[10px] mt-0.5 truncate max-w-full">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
