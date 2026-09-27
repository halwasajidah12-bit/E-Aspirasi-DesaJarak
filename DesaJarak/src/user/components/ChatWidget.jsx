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
      className="absolute right-4 bottom-20 h-12 w-12 rounded-full bg-brand-700 text-white shadow-lg flex items-center justify-center z-30"
    >
      <Bot size={24} />
    </button>
  );
}
