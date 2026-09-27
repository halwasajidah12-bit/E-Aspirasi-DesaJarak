import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PageHeader({ title, subtitle, extraBottom }) {
  const navigate = useNavigate();
  return (
    <div className="bg-gradient-to-b from-brand-700 via-brand-500 to-mint-50 px-5 pt-3 pb-[160px] text-center text-white">
      <button
        onClick={() => navigate(-1)}
        aria-label="Kembali"
        className="h-9 w-9 rounded-full bg-white/90 text-brand-700 flex items-center justify-center mb-3 shrink-0"
      >
        <ArrowLeft size={18} />
      </button>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-bold">{title}</h1>
        {subtitle && <p className="text-white/80 text-lg mt-1">{subtitle}</p>}
      </div>
      {extraBottom}
    </div>
  );
}