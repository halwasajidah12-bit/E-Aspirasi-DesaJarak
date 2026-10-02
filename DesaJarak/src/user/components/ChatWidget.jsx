import { useNavigate, useLocation } from "react-router-dom";
import { Bot } from "lucide-react";

export default function ChatWidget() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (pathname === "/ai-asisten") return null;

  return (
    <button
      onClick={() => navigate("/ai-asisten")}
      aria-label="Buka AI Asisten"
      className="fixed bottom-20 right-3.5 lg:bottom-6 lg:right-6 z-30 w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xl ai-float-glow active:scale-90 transition"
    >
      <Bot size={22} />
    </button>
  );
}
