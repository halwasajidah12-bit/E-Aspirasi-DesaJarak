const NAV_ITEMS = [
  { id: 'beranda', label: 'Beranda', icon: 'fa-house-chimney' },
  { id: 'laporan', label: 'Laporan', icon: 'fa-file-invoice' },
  { id: 'edukasi', label: 'Edukasi', icon: 'fa-graduation-cap' },
  { id: 'berita', label: 'Berita', icon: 'fa-newspaper' },
  { id: 'profil', label: 'Profil Desa', icon: 'fa-building' },
]

export default function SideNav({ activeTab, onSwitchTab, namaDesa }) {
  return (
    <aside className="hidden md:flex md:flex-col md:w-60 lg:w-64 flex-shrink-0 sticky top-[4.5rem] self-start h-[calc(100dvh-5.5rem)]">
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-3 flex-1 flex flex-col overflow-y-auto no-scrollbar">
        <p className="px-2 pt-1 pb-2 text-[10px] font-bold uppercase tracking-wide text-gray-400">Menu Admin</p>
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => onSwitchTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                  active
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                }`}
              >
                <i className={`fa-solid ${item.icon} w-4 text-center`}></i>
                <span className="truncate">{item.label}</span>
              </button>
            )
          })}
        </nav>
        <div className="mt-auto pt-3 border-t border-gray-100">
          <p className="px-2 text-[10px] text-gray-400 leading-relaxed">
            E-Aspirasi Desa {namaDesa || ''} <br /> Panel Admin
          </p>
        </div>
      </div>
    </aside>
  )
}
