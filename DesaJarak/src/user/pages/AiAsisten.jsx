import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  Send,
  CheckCheck,
} from "lucide-react";
import { askAssistant } from "../../utils/api.js";

const quickQuestions = [
  "Bagaimana caranya melapor?",
  "Berapa hari aspirasi ditindaklanjuti?",
  "Siapa yang dapat melihat laporan saya?",
];

function formatTime(date) {
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export default function AiAsisten() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Halo! Saya asisten virtual Desa Jarak. Ada yang bisa saya bantu? 😊",
      time: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const send = async (text) => {
    const value = (text ?? input).trim();
    if (!value) return;

    setMessages((m) => [...m, { from: "user", text: value, time: new Date() }]);
    setInput("");
    setIsTyping(true);
    try {
      const result = await askAssistant(value);
      setIsTyping(false);
      setMessages((m) => [
        ...m,
        {
          from: "bot",
          text: result.reply,
          time: new Date(),
        },
      ]);
    } catch (error) {
      setIsTyping(false);
      setMessages((m) => [...m, { from: "bot", text: error.message || "Asisten sedang tidak dapat dihubungi. Coba lagi sebentar lagi.", time: new Date() }]);
    }
  };

  return (
    <div className="pb-4 flex flex-col h-dvh lg:h-[85dvh] max-w-2xl mx-auto lg:my-4 lg:rounded-2xl lg:overflow-hidden lg:shadow-sm lg:border lg:border-emerald-200 bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 px-3 pt-3 pb-3 flex items-center gap-3 text-white shrink-0">
        <button
          onClick={() => navigate(-1)}
          aria-label="Kembali"
          className="h-9 w-9 -ml-1 rounded-full flex items-center justify-center shrink-0 active:bg-white/10"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 overflow-hidden">
          <img
            src="https://api.dicebear.com/7.x/bottts/svg?seed=eAspirasi"
            alt="Asisten E-Aspirasi"
            className="h-full w-full object-cover"
          />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-medium leading-tight truncate">Asisten E-Aspirasi</p>
          <p className="text-[11px] text-emerald-100 leading-tight">
            {isTyping ? "sedang mengetik…" : "online"}
          </p>
        </div>
        <button aria-label="Menu" className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 active:bg-white/10">
          <MoreVertical size={19} />
        </button>
      </div>

      {/* Area chat */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-3 space-y-1.5 bg-white">
        {messages.map((m, i) => {
          const isUser = m.from === "user";
          const prevSameSender = i > 0 && messages[i - 1].from === m.from;
          return (
            <div
              key={i}
              className={`flex ${isUser ? "justify-end" : "justify-start"} ${
                prevSameSender ? "mt-0.5" : "mt-2"
              }`}
            >
              <div
                className={`relative max-w-[78%] px-3 py-2 text-xs shadow-sm ${
                  isUser
                    ? "bg-emerald-600 text-white rounded-2xl rounded-tr-none"
                    : "bg-emerald-50 text-emerald-950 border border-emerald-100 rounded-2xl rounded-tl-none"
                }`}
              >
                <p className="leading-snug pr-10">{m.text}</p>
                <span className={`absolute bottom-1 right-2.5 flex items-center gap-0.5 text-[10px] ${isUser ? "text-emerald-100" : "text-gray-400"}`}>
                  {formatTime(m.time)}
                  {isUser && <CheckCheck size={13} className="text-emerald-100" />}
                </span>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex justify-start mt-2">
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" />
            </div>
          </div>
        )}

        <div ref={endRef} />

        {messages.length === 1 && !isTyping && (
          <div className="pt-3">
            <p className="text-xs font-medium text-gray-500 mb-2 px-1">Pertanyaan Cepat</p>
            <div className="space-y-1.5">
              {quickQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="w-full text-left text-xs bg-white border border-emerald-300 rounded-xl px-3.5 py-2.5 text-emerald-800 font-medium hover:bg-emerald-50 active:bg-emerald-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-center gap-2 px-2.5 py-2 bg-white border-t border-gray-100 shrink-0"
      >
        <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl pl-3.5 pr-1.5 py-1.5 focus-within:border-emerald-500">
          <Smile size={20} className="text-gray-400 shrink-0" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ketik pesan"
            className="flex-1 text-xs outline-none bg-transparent placeholder:text-gray-400 min-w-0"
          />
          <button type="button" aria-label="Lampiran" className="h-8 w-8 rounded-full flex items-center justify-center text-gray-400 shrink-0">
            <Paperclip size={18} />
          </button>
        </div>
        <button
          type="submit"
          aria-label={input.trim() ? "Kirim" : "Rekam suara"}
          className="h-11 w-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shrink-0"
        >
          {input.trim() ? <Send size={18} /> : <Mic size={19} />}
        </button>
      </form>
    </div>
  );
}

