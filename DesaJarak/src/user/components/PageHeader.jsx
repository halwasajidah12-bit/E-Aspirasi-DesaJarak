import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PageHeader({ title, subtitle, extraBottom }) {
  const navigate = useNavigate();
  return (
    <div className="px-4 sm:px-6 pt-4">
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Kembali"
            className="h-9 w-9 rounded-full bg-white/90 hover:bg-white text-emerald-700 flex items-center justify-center shrink-0 transition active:scale-95"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 space-y-1">
            <h1 className="text-base font-bold leading-tight">{title}</h1>
            {subtitle && <p className="text-xs text-emerald-100">{subtitle}</p>}
          </div>
        </div>
        {extraBottom}
      </div>
      
    </div>
  );
}
