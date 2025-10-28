import { X } from "lucide-react";

const ImageViewer = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 btn btn-circle btn-ghost text-white hover:bg-white/10"
      >
        <X className="w-6 h-6" />
      </button>

      <img
        src={imageUrl}
        alt="Full size"
        className="max-w-full max-h-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

export default ImageViewer;
