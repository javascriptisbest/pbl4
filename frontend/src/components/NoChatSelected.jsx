import { MessageSquare, Sparkles, Heart } from "lucide-react";

const NoChatSelected = () => {
  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-8 bg-gradient-to-br from-base-100 to-base-200/50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-secondary/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-md text-center space-y-8 relative z-10">
        {/* Animated Icon Display */}
        <div className="flex justify-center gap-4 mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-2xl shadow-primary/25 animate-bounce backdrop-blur-sm border border-primary/20">
              <MessageSquare className="w-10 h-10 text-primary" />
            </div>
            
            {/* Floating decorations */}
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-spin">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <div className="absolute -bottom-2 -left-2 w-5 h-5 bg-pink-400 rounded-full flex items-center justify-center animate-pulse">
              <Heart className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
        </div>

        {/* Welcome Text */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Welcome to Chatty! ✨
          </h2>
          <p className="text-base-content/70 text-lg leading-relaxed">
            Select a conversation from the sidebar to start chatting with friends and groups
          </p>
        </div>

        {/* Additional info */}
        <div className="bg-base-200/50 backdrop-blur-sm rounded-2xl p-6 border border-base-300/30">
          <div className="flex items-center justify-center gap-3 text-base-content/60">
            <MessageSquare className="w-5 h-5" />
            <span className="text-sm font-medium">Start meaningful conversations</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoChatSelected;
