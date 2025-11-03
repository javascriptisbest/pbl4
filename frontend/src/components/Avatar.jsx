import { useState } from "react";

/**
 * Avatar Component - Hiển thị ảnh đại diện hoặc chữ cái đầu
 *
 * Tính năng:
 * - Tự động tạo avatar từ chữ cái đầu tên nếu không có ảnh
 * - Màu nền deterministic (cùng tên = cùng màu)
 * - Lazy loading cho ảnh
 * - Auto fallback nếu ảnh lỗi
 * - NHANH: Không cần gọi API bên ngoài như avatar.iran.liara.run
 */
const Avatar = ({
  src,
  alt,
  className = "",
  size = "md",
  loading = "lazy",
}) => {
  const [imageError, setImageError] = useState(false);

  // Tạo avatar từ chữ cái đầu
  const getInitials = (name) => {
    if (!name || !name.trim()) return "?";
    const parts = name
      .trim()
      .split(" ")
      .filter((p) => p);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.trim()[0].toUpperCase();
  };

  // Tạo màu từ tên (deterministic - cùng tên luôn cùng màu)
  const getColorFromName = (name) => {
    if (!name) return "hsl(0, 0%, 50%)";
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 65%, 55%)`;
  };

  const sizeClasses = {
    sm: "size-8 text-xs",
    md: "size-10 text-sm",
    lg: "size-12 text-base",
    xl: "size-32 text-4xl",
  };

  // Nếu không có src hoặc load lỗi → hiển thị avatar chữ cái
  if (!src || imageError) {
    return (
      <div
        className={`${sizeClasses[size]} ${className} rounded-full flex items-center justify-center font-semibold text-white`}
        style={{ backgroundColor: getColorFromName(alt) }}
      >
        {getInitials(alt)}
      </div>
    );
  }

  // Có src → hiển thị ảnh
  return (
    <img
      src={src}
      alt={alt}
      className={`${sizeClasses[size]} ${className} rounded-full object-cover`}
      loading={loading}
      onError={() => setImageError(true)}
    />
  );
};

export default Avatar;
