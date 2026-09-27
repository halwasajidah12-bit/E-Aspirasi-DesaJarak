import { useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import Sidebar from "./components/Sidebar";
import ChatWidget from "./components/ChatWidget";

import Home from "./pages/Home";
import Aspirasi from "./pages/Aspirasi";
import DetailAspirasi from "./pages/DetailAspirasi";
import LacakLaporan from "./pages/LacakLaporan";
import DetailLaporan from "./pages/DetailLaporan";
import VotePrioritas from "./pages/VotePrioritas";
import BeritaDesa from "./pages/BeritaDesa";
import BeritaDetail from "./pages/BeritaDetail";
import InfoDesa from "./pages/InfoDesa";
import Riwayat from "./pages/Riwayat";
import Akun from "./pages/Akun";
import Edukasi from "./pages/Edukasi";
import EdukasiDetail from "./pages/EdukasiDetail";
import DetailReward from "./pages/DetailReward";
import Pengaturan from "./pages/Pengaturan";
import AiAsisten from "./pages/AiAsisten";


export default function App({ session, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false); 
  const [collapsed, setCollapsed] = useState(false); 
  const { pathname } = useLocation();
  const isChatPage = pathname === "/ai-asisten";


  const handleMenuClick = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      setCollapsed((c) => !c);
    } else {
      setSidebarOpen(true);
    }
  };

  return (
    <div className="min-h-dvh bg-mint-50">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />

      <div
        className={`flex flex-col min-h-dvh transition-[padding] duration-300 ${
          collapsed ? "lg:pl-[76px]" : "lg:pl-[270px]"
        }`}
      >
        {!isChatPage && (
          <Header onMenuClick={handleMenuClick} collapsed={collapsed} />
        )}

        <main className="flex-1 relative w-full">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/aspirasi" element={<Aspirasi session={session} />} />
            <Route path="/aspirasi/detail" element={<DetailAspirasi />} />
            <Route path="/lacak" element={<LacakLaporan />} />
            <Route path="/lacak/:id" element={<DetailLaporan session={session} />} />
            <Route path="/vote" element={<VotePrioritas />} />
            <Route path="/berita" element={<BeritaDesa />} />
            <Route path="/berita/:id" element={<BeritaDetail session={session} />} />
            <Route path="/info-desa" element={<InfoDesa />} />
            <Route path="/riwayat" element={<Riwayat session={session} />} />
            <Route path="/akun" element={<Akun />} />
            <Route path="/edukasi" element={<Edukasi />} />
            <Route path="/edukasi/:slug" element={<EdukasiDetail />} />
            <Route path="/reward" element={<DetailReward />} />
            <Route path="/pengaturan" element={<Pengaturan session={session} onLogout={onLogout} />} />
            <Route path="/ai-asisten" element={<AiAsisten />} />
          </Routes>

          {!isChatPage && <ChatWidget />}
        </main>

        {!isChatPage && <BottomNav />}
      </div>
    </div>
  );
}
