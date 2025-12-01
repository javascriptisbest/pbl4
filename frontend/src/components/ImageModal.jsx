import { useState, useEffect, useCallback } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
} from "lucide-react";

const ImageModal = ({
  isOpen,
  imageUrl,
  onClose,
  altText = "Image",
  allImages = [],
  currentIndex = 0,
  onNavigate,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Reset zoom and rotation when image changes
  useEffect(() => {
    setZoom(1);
    setRotation(0);
  }, [imageUrl]);

  const handleKeyPress = useCallback(
    (e) => {
      if (!isOpen) return;

      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && currentIndex > 0)
        onNavigate?.(currentIndex - 1);
      if (e.key === "ArrowRight" && currentIndex < allImages.length - 1)
        onNavigate?.(currentIndex + 1);
    },
    [isOpen, currentIndex, allImages.length, onClose, onNavigate]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  if (!isOpen) return null;

  const hasMultiple = allImages.length > 1;
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < allImages.length - 1;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.3, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.3, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = altText || "image";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full hover:bg-black/70"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Controls */}
      <div className="absolute top-4 left-4 flex items-center space-x-2">
        <button
          onClick={handleZoomOut}
          className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <span className="bg-black/50 text-white px-3 py-1 rounded-full text-sm min-w-[60px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={handleRotate}
          className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
        >
          <RotateCw className="w-5 h-5" />
        </button>
        <button
          onClick={handleDownload}
          className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      {hasMultiple && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              canGoPrev && onNavigate?.(currentIndex - 1);
            }}
            disabled={!canGoPrev}
            className={`absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full ${
              canGoPrev
                ? "text-white bg-black/50 hover:bg-black/70"
                : "text-gray-500 bg-black/30"
            }`}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              canGoNext && onNavigate?.(currentIndex + 1);
            }}
            disabled={!canGoNext}
            className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full ${
              canGoNext
                ? "text-white bg-black/50 hover:bg-black/70"
                : "text-gray-500 bg-black/30"
            }`}
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}

      {/* Image */}
      <img
        src={imageUrl}
        alt={altText}
        className="max-w-[90%] max-h-[90%] object-contain select-none"
        style={{
          transform: `scale(${zoom}) rotate(${rotation}deg)`,
          transition: "transform 0.2s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Counter */}
      {hasMultiple && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {allImages.length}
        </div>
      )}
    </div>
  );
};

export default ImageModal;
