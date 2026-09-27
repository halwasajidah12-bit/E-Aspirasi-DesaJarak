export default function Toast({ message, visible }) {
  return (
    <div
      className={`fixed top-14 left-3 right-3 md:left-auto md:right-6 md:top-6 md:w-80 z-50 bg-gray-900/90 text-white text-xs px-3.5 py-2.5 rounded-xl shadow-2xl flex items-center justify-between transition-all border border-gray-700 ${
        visible ? '' : 'hidden'
      }`}
    >
      <span>{message}</span>
      <i className="fa-solid fa-circle-check text-emerald-400 text-sm"></i>
    </div>
  )
}
