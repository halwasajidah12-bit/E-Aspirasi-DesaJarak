import { useState, useEffect } from "react";

export default function ProtectedImage({ src, alt = "", className = "", ...props }) {
  const [imageSrc, setImageSrc] = useState(src);
  const [error, setError] = useState(false);

  useEffect(() => {
    setImageSrc(src);
    setError(false);
  }, [src]);

  if (error || !imageSrc)
    return (
      <div className={`${className} bg-gray-100 rounded-xl flex items-center justify-center`}>
        <i className="fa-solid fa-image text-gray-300 text-2xl"></i>
      </div>
    );

  return <img src={imageSrc} alt={alt} className={className} onError={() => setError(true)} {...props} />;
}
