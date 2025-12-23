import { X } from "lucide-react";

const formatDuration = (seconds) => {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const MediaPreview = ({ type, preview, onRemove, metadata }) => {
  if (!preview) return null;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-2 -right-2 btn btn-sm btn-circle btn-error z-10"
      >
        <X className="w-4 h-4" />
      </button>

      {type === "image" && (
        <img
          src={preview}
          alt="Preview"
          className="max-w-xs max-h-40 rounded-lg object-cover"
        />
      )}

      {type === "video" && (
        <div>
          <video
            src={preview}
            controls
            className="max-w-xs max-h-40 rounded-lg"
          />
          {metadata && (
            <p className="text-xs text-base-content/60 mt-1">
              {metadata.duration ? formatDuration(metadata.duration) : "0:00"} •{" "}
              {metadata.sizeMB}MB
            </p>
          )}
        </div>
      )}

      {type === "file" && (
        <div className="bg-base-200 rounded-lg p-3 max-w-xs">
          <p className="text-sm font-medium truncate">{metadata?.name}</p>
          <p className="text-xs text-base-content/60">{metadata?.sizeFormatted || metadata?.size}</p>
        </div>
      )}

      {type === "audio" && (
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-4 min-w-[280px] border border-primary/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">🎤</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Voice Message</p>
              {metadata?.duration && (
                <p className="text-xs text-base-content/60">
                  {formatDuration(metadata.duration)}
                </p>
              )}
            </div>
          </div>
          <audio
            src={preview}
            controls
            className="w-full h-8"
            preload="metadata"
          />
        </div>
      )}
    </div>
  );
};

export default MediaPreview;
