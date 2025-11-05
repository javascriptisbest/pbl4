const FastSkeleton = ({ className = "", width = "100%", height = "20px" }) => (
  <div
    className={`animate-pulse bg-gray-300 rounded ${className}`}
    style={{ width, height }}
  />
);

const OptimizedSidebarSkeleton = () => {
  return (
    <div className="w-full p-4 space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center space-x-3 mb-6">
        <FastSkeleton className="rounded-full" width="40px" height="40px" />
        <FastSkeleton width="120px" height="16px" />
      </div>

      {/* Tab buttons skeleton */}
      <div className="flex space-x-2 mb-4">
        <FastSkeleton width="80px" height="32px" className="rounded-lg" />
        <FastSkeleton width="80px" height="32px" className="rounded-lg" />
      </div>

      {/* Search bar skeleton */}
      <FastSkeleton width="100%" height="40px" className="rounded-lg mb-4" />

      {/* Users list skeleton */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 rounded-lg">
          <FastSkeleton className="rounded-full" width="48px" height="48px" />
          <div className="flex-1 space-y-2">
            <FastSkeleton width="60%" height="14px" />
            <FastSkeleton width="40%" height="12px" />
          </div>
          <FastSkeleton width="24px" height="12px" />
        </div>
      ))}
    </div>
  );
};

export default OptimizedSidebarSkeleton;
