import { MessageCircle } from "lucide-react";

const NoChatSelected = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-w-0 -mt-16 pt-16">
      <div className="text-center max-w-md">
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg transition-all duration-300"
          style={{ 
            background: 'var(--accent-primary)'
          }}
        >
          <MessageCircle className="w-10 h-10 text-white" />
        </div>

        <h1 
          className="text-2xl font-bold mb-4"
          style={{ color: 'var(--accent-primary)' }}
        >
          Chào mừng đến TalkSpace
        </h1>

        <p 
          className="text-sm leading-relaxed mb-6"
          style={{ color: 'var(--text-secondary)' }}
        >
          Chọn một cuộc trò chuyện từ sidebar để bắt đầu nhắn tin với bạn bè.
        </p>

        <div 
          className="rounded-xl p-6 shadow-sm"
          style={{ 
            background: 'var(--bg-accent)'
          }}
        >
          <div 
            className="flex items-center justify-center space-x-4 text-xs font-medium mb-4"
            style={{ color: 'var(--accent-primary)' }}
          >
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ background: 'var(--accent-primary)' }}
              ></div>
              <span>Bảo mật</span>
            </div>
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ background: 'var(--accent-secondary)' }}
              ></div>
              <span>Nhanh chóng</span>
            </div>
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ background: 'var(--accent-hover)' }}
              ></div>
              <span>Tiện lợi</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoChatSelected;
