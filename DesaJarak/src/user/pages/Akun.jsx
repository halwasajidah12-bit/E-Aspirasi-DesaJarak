import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, History, FileText, GraduationCap, Camera, Save, X } from "lucide-react";
import { getUserProfile, privateUploadUrl, updateUserProfile } from "../../utils/api.js";
import ProtectedImage from "../components/ProtectedImage.jsx";

const userPhotoUrl = (photo) => {
  if (!photo) return "https://i.pravatar.cc/200?img=12";
  if (photo.startsWith("http")) return photo;
  return privateUploadUrl(photo.replace(/^\/uploads\//, ""));
};

const shortcuts = [
  { to: "/riwayat", icon: History, label: "Riwayat Anda", bg: "bg-amber-50 text-amber-600 border border-amber-100" },
  { to: "/aspirasi", icon: FileText, label: "Mulai Aspirasi", bg: "bg-rose-50 text-rose-600 border border-rose-100" },
  { to: "/edukasi", icon: GraduationCap, label: "Edukasi Anda", bg: "bg-blue-50 text-blue-600 border border-blue-100" },
];

export default function Akun({ session }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Default state form
  const [profile, setProfile] = useState({
    fullname: "Memuat...",
    nik: "Belum diisi", 
    no_telepon: "-",
    alamat: "-",
    foto: "https://i.pravatar.cc/200?img=12",
  });

  const [editData, setEditData] = useState({ ...profile });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (session?.userId && session.role !== 'guest') {
      getUserProfile(session.userId)
        .then((data) => {
          const loadedProfile = {
            fullname: data.fullname || session.name || "Warga Desa",
            nik: data.nik || "Belum diisi",
            no_telepon: data.no_telepon || "-",
            alamat: data.alamat || "-",
            foto: userPhotoUrl(data.foto),
          };
          setProfile(loadedProfile);
          setEditData(loadedProfile);
        })
        .catch(err => console.error("Gagal memuat profil:", err))
        .finally(() => setIsLoading(false));
    } else {
      const guestProfile = { ...profile, fullname: session?.name || "Tamu" };
      setProfile(guestProfile);
      setEditData(guestProfile);
      setIsLoading(false);
    }
  }, [session]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!session?.userId) return;
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('fullname', editData.fullname || '');
      formData.append('nik', editData.nik || ''); 
      formData.append('no_telepon', editData.no_telepon || '');
      formData.append('alamat', editData.alamat || '');
      
      if (selectedFile) {
        formData.append('foto', selectedFile);
      }

      const updated = await updateUserProfile(session.userId, formData);
      const newFotoUrl = updated.foto ? userPhotoUrl(updated.foto) : previewUrl || editData.foto;
      
      setProfile({
        fullname: updated.fullname,
        nik: updated.nik || editData.nik,
        no_telepon: updated.no_telepon,
        alamat: updated.alamat,
        foto: newFotoUrl
      });
      
      setIsEditing(false);
      setSelectedFile(null);
      
      window.dispatchEvent(new CustomEvent('profileUpdated', {
        detail: {
          fullname: updated.fullname,
          foto: updated.foto,
          previewUrl: newFotoUrl
        }
      }));

    } catch (error) {
      alert("Gagal menyimpan profil: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditData(profile);
    setPreviewUrl("");
    setSelectedFile(null);
    setIsEditing(false);
  };

  const fields = [
    { label: "Nama Lengkap", name: "fullname", value: isEditing ? editData.fullname : profile.fullname, disabled: false },
    { label: "NIK", name: "nik", value: isEditing ? editData.nik : profile.nik, disabled: false },
    { label: "No. Telepon", name: "no_telepon", value: isEditing ? editData.no_telepon : profile.no_telepon, disabled: false },
    { label: "Alamat", name: "alamat", value: isEditing ? editData.alamat : profile.alamat, disabled: false },
  ];

  return (
    <div className="px-4 sm:px-6 py-4 pb-8 space-y-3.5">
      <div className="relative bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-2xl shadow-sm px-4 pt-4 pb-5 text-center text-white">
        <button
          onClick={() => navigate(-1)}
          aria-label="Kembali"
          className="absolute left-4 top-4 h-9 w-9 rounded-full bg-white/90 hover:bg-white text-emerald-700 flex items-center justify-center transition active:scale-95"
        >
          <ArrowLeft size={18} />
        </button>
        
        <div className="relative inline-block mt-2">
          <ProtectedImage
            src={previewUrl || profile.foto}
            alt="Foto Profil"
            className="h-20 w-20 rounded-full bg-gray-300 mx-auto border-4 border-white/80 shadow-md object-cover"
          />
          {isEditing && (
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg hover:bg-emerald-400 transition"
            >
              <Camera size={14} />
            </button>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        <p className="font-bold text-base mt-3">{profile.fullname}</p>
        <p className="text-xs text-emerald-100">
          {session?.role === 'guest' ? 'Tamu' : 'Warga Dusun Jarak Lor'}
        </p>

        {!isEditing && session?.role !== 'guest' ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="mt-3 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 text-xs font-bold rounded-xl px-6 py-2 transition active:scale-95"
          >
            Edit Profil
          </button>
        ) : isEditing ? (
          <div className="flex justify-center gap-2 mt-3">
            <button 
              onClick={cancelEdit}
              className="bg-red-500 hover:bg-red-400 text-white text-xs font-bold rounded-xl px-4 py-2 transition active:scale-95 flex items-center gap-1"
            >
              <X size={14} /> Batal
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 text-xs font-bold rounded-xl px-4 py-2 transition active:scale-95 flex items-center gap-1 disabled:opacity-50"
            >
              <Save size={14} /> {isSaving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        ) : <p className="mt-3 text-xs text-emerald-100">Masuk ke akun warga untuk mengubah profil.</p>}
      </div>

      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-4">
        {fields.map((f) => (
          <div key={f.label} className="mb-4 last:mb-0">
            <p className="text-xs font-semibold text-gray-700 mb-1">{f.label}</p>
            {isEditing && !f.disabled ? (
              <input
                type="text"
                name={f.name}
                value={f.value}
                onChange={handleInputChange}
                className="w-full bg-white border border-emerald-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-2.5 text-xs outline-none transition"
              />
            ) : (
              <div className={`bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs min-h-[38px] flex items-center ${f.disabled && isEditing ? "opacity-60 cursor-not-allowed" : ""}`}>
                {isLoading ? "Memuat..." : f.value}
              </div>
            )}
          </div>
        ))}

        <div className="grid grid-cols-3 gap-3 mt-5">
          {shortcuts.map(({ to, icon: Icon, label, bg }) => (
            <Link
              key={label}
              to={to}
              className={`rounded-2xl ${bg} flex flex-col items-center justify-center gap-2 py-4 text-xs font-bold text-center transition active:scale-95`}
            >
              <Icon size={22} />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
