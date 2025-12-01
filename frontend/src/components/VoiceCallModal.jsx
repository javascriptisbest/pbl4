import { useState, useRef, useEffect } from "react";
import { Phone, PhoneOff, Mic, MicOff, Volume2 } from "lucide-react";
import toast from "react-hot-toast";

const VoiceCallModal = ({
  isOpen,
  isIncoming,
  callerName,
  offer,
  voiceCallManager,
  onClose,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  const remoteAudioRef = useRef(null);
  const callTimerRef = useRef(null);

  useEffect(() => {
    if (!voiceCallManager || !isOpen) return;

    // Setup event handlers
    voiceCallManager.onCallConnected = () => {
      console.log("Call connected!");
      setIsConnected(true);
      setConnectionStatus("connected");
      toast.success("Voice call connected");

      // Start call timer
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    };

    voiceCallManager.onCallDisconnected = () => {
      console.log("Call disconnected");
      setIsConnected(false);
      setConnectionStatus("disconnected");

      // Clear timer
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }

      // Reset state
      setCallDuration(0);
      setIsMuted(false);

      // Close modal after a delay
      setTimeout(() => {
        onClose();
      }, 1000);
    };

    voiceCallManager.onRemoteStream = (stream) => {
      console.log("Remote stream received", stream);
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;

        // Try to play audio, handle autoplay policy
        remoteAudioRef.current
          .play()
          .then(() => {
            console.log("Remote audio playing successfully");
          })
          .catch((error) => {
            console.error("Error playing remote audio:", error);
            // Retry with user interaction
            toast.error("Click anywhere to enable audio");
          });
      } else {
        console.error("Remote audio ref not available");
      }
    };

    voiceCallManager.onCallRejected = () => {
      toast.error("Call was rejected");
      onClose();
    };

    voiceCallManager.onCallEnded = () => {
      // Call ended - no notification
      onClose();
    };

    // Cleanup on unmount
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [voiceCallManager, isOpen, onClose]);

  const handleAnswer = async () => {
    try {
      setConnectionStatus("connecting");
      // Use the voiceCallManager to answer with the offer passed from parent
      if (!voiceCallManager) throw new Error("Call manager not available");
      if (!voiceCallManager.answerCall)
        throw new Error("answerCall not implemented");
      // `offer` should be provided as prop by parent
      if (!voiceCallManager || !voiceCallManager.callerId) {
        // still attempt using the stored offer prop
      }
      // Expect parent to pass `offer` prop (incoming SDP)
      if (!voiceCallManager || !voiceCallManager.answerCall) {
        throw new Error("Call cannot be answered right now");
      }

      // call answerCall with the offer passed in props
      if (typeof voiceCallManager.answerCall === "function") {
        await voiceCallManager.answerCall(offer);
      }
      toast.success("Answered call");
    } catch (error) {
      console.error("Error answering call:", error);
      toast.error(error.message);
    }
  };

  const handleReject = () => {
    if (voiceCallManager) {
      voiceCallManager.rejectCall();
    }
    onClose();
  };

  const handleEndCall = () => {
    if (voiceCallManager) {
      voiceCallManager.endCall();
    }
    onClose();
  };

  const toggleMute = () => {
    if (voiceCallManager) {
      const newMutedState = !isMuted;
      voiceCallManager.setMuted(newMutedState);
      setIsMuted(newMutedState);
      toast(newMutedState ? "Microphone muted" : "Microphone unmuted");
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="rounded-xl p-6 w-80 shadow-xl"
        style={{ background: "var(--bg-secondary)" }}
      >
        {/* Remote audio element - hidden but functional */}
        <audio ref={remoteAudioRef} autoPlay style={{ display: "none" }} />

        {/* Call Header */}
        <div className="text-center mb-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--accent-primary)" }}
          >
            <Phone className="w-10 h-10 text-white" />
          </div>

          <h2
            className="text-xl font-bold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            {isIncoming
              ? `${callerName || "Unknown"} is calling...`
              : `Calling ${callerName || "User"}...`}
          </h2>

          <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {isConnected ? (
              <span style={{ color: "var(--accent-primary)" }}>
                Connected • {formatTime(callDuration)}
              </span>
            ) : (
              <span style={{ color: "var(--text-muted)" }}>
                {connectionStatus === "connecting"
                  ? "Connecting..."
                  : "Waiting..."}
              </span>
            )}
          </div>
        </div>

        {/* Call Controls */}
        <div className="flex justify-center gap-4">
          {isIncoming && !isConnected ? (
            // Incoming call buttons
            <>
              <button
                onClick={handleAnswer}
                className="w-14 h-14 rounded-full flex items-center justify-center transition-all"
                style={{ background: "var(--accent-primary)" }}
                title="Answer call"
              >
                <Phone className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={handleReject}
                className="w-14 h-14 rounded-full flex items-center justify-center transition-all"
                style={{ background: "var(--message-sent)" }}
                title="Reject call"
              >
                <PhoneOff className="w-6 h-6 text-white" />
              </button>
            </>
          ) : (
            // Active call controls
            <>
              <button
                onClick={toggleMute}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: isMuted
                    ? "var(--message-sent)"
                    : "var(--bg-accent)",
                  color: isMuted ? "#ffffff" : "var(--text-secondary)",
                }}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>

              <button
                onClick={handleEndCall}
                className="w-14 h-14 rounded-full flex items-center justify-center transition-all"
                style={{ background: "var(--message-sent)" }}
                title="End call"
              >
                <PhoneOff className="w-6 h-6 text-white" />
              </button>

              <button
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: "var(--bg-accent)",
                  color: "var(--text-secondary)",
                }}
                title="Speaker"
                disabled
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Connection Status */}
        <div
          className="mt-4 text-center text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          {connectionStatus === "connecting" && (
            <div className="flex items-center justify-center gap-2">
              <div
                className="w-3 h-3 rounded-full animate-spin border-2 border-t-transparent"
                style={{ borderColor: "var(--accent-primary)" }}
              ></div>
              <span>Establishing connection...</span>
            </div>
          )}
          {connectionStatus === "connected" && (
            <span style={{ color: "var(--accent-primary)" }}>
              🟢 Voice call active
            </span>
          )}
          {connectionStatus === "disconnected" && (
            <span style={{ color: "var(--message-sent)" }}>Disconnected</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceCallModal;
