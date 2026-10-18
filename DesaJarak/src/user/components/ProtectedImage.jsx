import { useState, useEffect } from "react";

export default function ProtectedImage({ src, privateAccess = false, alt = "", className = "", ...props }) {
  const [imageSrc, setImageSrc] = useState(src);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
      setError(true);
      return;
    }

    if (!privateAccess) {
      setImageSrc(src);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setImageSrc(src);
      return;
    }

    const fetchImage = async () => {
      try {
        const response = await fetch(`/api/uploads/${src.split("/uploads/")[1]}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const blob = await response.blob();
          setImageSrc(URL.createObjectURL(blob));
        } else {
          setImageSrc(src);
        }
      } catch {
        setImageSrc(src);
      }
    };

    fetchImage();
  }, [src, privateAccess]);

  if (error || !imageSrc) return <div className={`${className} bg-gray-100 rounded-xl flex items-center justify-center`}><i className="fa-solid fa-image text-gray-300 text-2xl" /></div>;

  return <img src={imageSrc} alt={alt} className={className} {...props} />;
}