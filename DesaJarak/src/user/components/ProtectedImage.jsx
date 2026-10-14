import { useEffect, useState } from "react";
import { getStoredAuthSession, privateUploadUrl } from "../../utils/api.js";

export default function ProtectedImage({ src, privateAccess = false, alt = "", className = "" }) {
  const [displaySrc, setDisplaySrc] = useState("");

  useEffect(() => {
    let active = true;
    let objectUrl = "";
    if (!src) {
      setDisplaySrc("");
      return undefined;
    }

    const isPrivateApiUrl = src.startsWith("/api/uploads/");
    const privateUrl = privateAccess && src.startsWith("/uploads/")
      ? privateUploadUrl(src.slice("/uploads/".length))
      : src;
    if (!isPrivateApiUrl && privateUrl === src) {
      setDisplaySrc(src);
      return undefined;
    }

    setDisplaySrc("");
    const token = getStoredAuthSession()?.token;
    fetch(privateUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((response) => {
        if (!response.ok) throw new Error("Gambar tidak tersedia.");
        return response.blob();
      })
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setDisplaySrc(objectUrl);
      })
      .catch(() => {
        if (active) setDisplaySrc("");
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src, privateAccess]);

  return <img src={displaySrc || undefined} alt={alt} className={className} />;
}
