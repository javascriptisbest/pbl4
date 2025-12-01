const AuthImagePattern = ({ title, subtitle }) => {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-white/10 rounded-full blur-xl animate-pulse delay-700"></div>
        <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse delay-1000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center text-white max-w-md">
        <div className="mb-8">
          <div className="flex justify-center space-x-4 mb-8">
            {/* Chat bubbles illustration */}
            <div className="w-16 h-12 bg-white/20 rounded-2xl rounded-br-sm flex items-center justify-center backdrop-blur-sm">
              <div className="w-2 h-2 bg-white/60 rounded-full"></div>
            </div>
            <div className="w-16 h-12 bg-white/30 rounded-2xl rounded-bl-sm flex items-center justify-center backdrop-blur-sm">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-white/60 rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-white/60 rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-white/60 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-4">{title}</h1>
        <p className="text-lg text-white/80 leading-relaxed">{subtitle}</p>
      </div>
    </div>
  );
};

export default AuthImagePattern;
