/**
 * WebRTC Voice Call Manager
 * Xử lý peer-to-peer voice communication
 *
 * WebRTC Flow:
 * 1. Caller tạo offer (SDP)
 * 2. Gửi offer qua Signaling Server (WebSocket/TCP) đến Callee
 * 3. Callee tạo answer (SDP) và gửi lại
 * 4. Trao đổi ICE candidates để tìm đường kết nối tốt nhất
 * 5. Establish P2P connection và stream audio
 */

export class VoiceCallManager {
  constructor(socket, userId) {
    this.socket = socket; // WebSocket connection (dùng làm signaling server)
    this.userId = userId; // ID của user hiện tại
    this.peerConnection = null; // RTCPeerConnection object
    this.localStream = null; // MediaStream từ microphone
    this.remoteStream = null; // MediaStream từ peer
    this.isCallActive = false; // Trạng thái cuộc gọi
    this.isIncoming = false; // Cuộc gọi đến hay gọi đi
    this.callerId = null; // ID người gọi
    this.calleeId = null; // ID người nhận

    /**
     * WebRTC Configuration
     * STUN servers: Giúp tìm public IP của client (NAT traversal)
     * TURN servers: Relay traffic nếu P2P connection fail (không dùng ở đây)
     */
    this.config = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
      ],
    };

    this.setupSocketListeners();
  }

  /**
   * Setup WebSocket Event Listeners
   * Lắng nghe các signaling events từ server
   */
  setupSocketListeners() {
    // Listen for socket connection errors
    this.socket.on("connect_error", (error) => {
      console.error("❌ Voice call socket connection error:", error?.message || "server error");
    });

    this.socket.on("connect", () => {
      console.log("🔧 Voice call socket connected");
    });
    /**
     * Event: voice-call-incoming
     * Nhận cuộc gọi đến từ user khác
     * Payload: { callerId, offer }
     */
    this.socket.on("voice-call-incoming", async ({ callerId, offer }) => {
      this.callerId = callerId;
      this.isIncoming = true;

      // Trigger callback để hiển thị incoming call modal
      if (this.onIncomingCall) {
        this.onIncomingCall(callerId, offer);
      }
    });

    /**
     * Event: voice-call-answered
     * Peer đã chấp nhận cuộc gọi và gửi answer (SDP) lại
     */
    this.socket.on("voice-call-answered", async ({ answer, answererId }) => {
      console.log("📞 Call answered by:", answererId);
      
      if (this.peerConnection) {
        // Set remote description = SDP answer từ peer
        await this.peerConnection.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
        console.log("✅ Remote description (answer) set successfully");
      } else {
        console.error("❌ No peer connection when receiving answer");
      }

      if (this.onCallAnswered) {
        this.onCallAnswered(answererId);
      }
    });

    // ICE candidate
    this.socket.on(
      "voice-call-ice-candidate",
      async ({ candidate, senderId }) => {
        console.log("🧊 Received ICE candidate from:", senderId);
        if (this.peerConnection && candidate) {
          try {
            await this.peerConnection.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
            console.log("✅ ICE candidate added successfully");
          } catch (error) {
            console.error("❌ Error adding ICE candidate:", error);
          }
        } else if (!this.peerConnection) {
          console.warn("⚠️ Received ICE candidate but no peer connection");
        }
      }
    );

    this.socket.on("voice-call-rejected", ({ rejecterId }) => {
      this.endCall();

      if (this.onCallRejected) {
        this.onCallRejected(rejecterId);
      }
    });

    this.socket.on("voice-call-ended", ({ enderId }) => {
      this.endCall();

      if (this.onCallEnded) {
        this.onCallEnded(enderId);
      }
    });

    this.socket.on("voice-call-failed", ({ error }) => {
      this.endCall();

      if (this.onCallFailed) {
        this.onCallFailed(error);
      }
    });
  }

  /**
   * Initiate a voice call to another user
   * @param {string} targetUserId
   */
  async initiateCall(targetUserId) {
    try {
      this.calleeId = targetUserId;
      this.isIncoming = false;

      // Get user media (microphone)
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        },
      });
      
      console.log("🎤 Local microphone stream acquired:", 
        this.localStream.getAudioTracks().length, "audio tracks");
      this.localStream.getAudioTracks().forEach((track, index) => {
        console.log(`  Local track ${index}:`, {
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState
        });
      });

      // Create peer connection
      this.peerConnection = new RTCPeerConnection(this.config);
      this.setupPeerConnectionEvents();

      // Add local stream
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      // Create offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      console.log("📤 Offer created and set as local description");

      this.socket.emit("voice-call-initiate", {
        targetUserId: targetUserId,
        offer: offer,
      });
      console.log("📞 Call initiated to:", targetUserId);

      this.isCallActive = true;

      if (this.onCallInitiated) {
        this.onCallInitiated(targetUserId);
      }

      return true;
    } catch (error) {
      console.error("Error initiating call:", error);
      this.endCall();

      if (error.name === "NotAllowedError") {
        throw new Error(
          "Microphone permission denied. Please allow microphone access."
        );
      } else if (error.name === "NotFoundError") {
        throw new Error("No microphone found. Please connect a microphone.");
      } else {
        throw new Error("Failed to start call. Please try again.");
      }
    }
  }

  /**
   * Answer an incoming call
   * @param {Object} offer
   */
  async answerCall(offer) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        },
      });
      
      console.log("🎤 Local microphone stream acquired (answer):", 
        this.localStream.getAudioTracks().length, "audio tracks");
      this.localStream.getAudioTracks().forEach((track, index) => {
        console.log(`  Local track ${index}:`, {
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState
        });
      });

      // Create peer connection
      this.peerConnection = new RTCPeerConnection(this.config);
      this.setupPeerConnectionEvents();

      // Add local stream
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      // Set remote description (offer)
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      // Create answer
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      console.log("📤 Answer created and set as local description");

      // Send answer via Socket.IO
      this.socket.emit("voice-call-answer", {
        callerId: this.callerId,
        answer: answer,
      });
      console.log("📤 Answer sent to caller:", this.callerId);

      this.isCallActive = true;
      
      // Don't call onCallConnected here - wait for connection state to be "connected"
      // onCallConnected will be triggered by onconnectionstatechange event

      return true;
    } catch (error) {
      console.error("Error answering call:", error);
      this.rejectCall();
      throw error;
    }
  }

  /**
   * Reject an incoming call
   */
  rejectCall() {
    this.socket.emit("voice-call-reject", {
      callerId: this.callerId,
    });

    this.endCall();
  }

  /**
   * End the current call
   */
  endCall() {
    if (this.isCallActive && (this.callerId || this.calleeId)) {
      const targetUserId = this.isIncoming ? this.callerId : this.calleeId;

      this.socket.emit("voice-call-end", {
        targetUserId: targetUserId,
      });
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // Reset state
    this.isCallActive = false;
    this.isIncoming = false;
    this.callerId = null;
    this.calleeId = null;
    this.remoteStream = null;

    if (this.onCallDisconnected) {
      this.onCallDisconnected();
    }
  }

  /**
   * Setup WebRTC peer connection event handlers
   */
  setupPeerConnectionEvents() {
    // ICE candidate
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        const targetUserId = this.isIncoming ? this.callerId : this.calleeId;
        console.log("🧊 Sending ICE candidate to:", targetUserId);
        this.socket.emit("voice-call-ice-candidate", {
          targetUserId: targetUserId,
          candidate: event.candidate,
        });
      } else {
        console.log("✅ ICE gathering completed");
      }
    };

    this.peerConnection.ontrack = (event) => {
      console.log("🎵 Received remote track:", event.track.kind, event.track.enabled);
      this.remoteStream = event.streams[0];
      
      // Log audio tracks info
      const audioTracks = this.remoteStream.getAudioTracks();
      console.log("🔊 Remote audio tracks:", audioTracks.length);
      audioTracks.forEach((track, index) => {
        console.log(`  Track ${index}:`, {
          id: track.id,
          kind: track.kind,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState
        });
      });

      if (this.onRemoteStream) {
        this.onRemoteStream(this.remoteStream);
      } else {
        console.warn("⚠️ onRemoteStream callback not set");
      }
    };

    // Connection state
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection.connectionState;
      console.log("🔄 WebRTC Connection state changed:", state);

      if (state === "connected") {
        console.log("✅ WebRTC connection established!");
        if (this.onCallConnected) {
          this.onCallConnected();
        }
      } else if (state === "disconnected" || state === "failed") {
        console.log("❌ WebRTC connection", state);
        this.endCall();
      } else if (state === "connecting") {
        console.log("🔄 WebRTC connecting...");
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      const iceState = this.peerConnection.iceConnectionState;
      console.log("🧊 ICE connection state:", iceState);
      
      if (iceState === "failed" || iceState === "closed") {
        console.error("❌ ICE connection", iceState);
      }
    };
  }

  /**
   * Mute/unmute microphone
   * @param {boolean} muted
   */
  setMuted(muted) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  /**
   * Get call status
   */
  getStatus() {
    return {
      isActive: this.isCallActive,
      isIncoming: this.isIncoming,
      callerId: this.callerId,
      calleeId: this.calleeId,
      connectionState: this.peerConnection?.connectionState || "none",
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.endCall();

    // Remove socket listeners
    this.socket.off("voice-call-incoming");
    this.socket.off("voice-call-answered");
    this.socket.off("voice-call-ice-candidate");
    this.socket.off("voice-call-rejected");
    this.socket.off("voice-call-ended");
    this.socket.off("voice-call-failed");
  }

  // Event callbacks (to be set by UI components)
  onIncomingCall = null; // (callerId, offer) => {}
  onCallInitiated = null; // (targetUserId) => {}
  onCallAnswered = null; // (answererId) => {}
  onCallConnected = null; // () => {}
  onCallRejected = null; // (rejecterId) => {}
  onCallEnded = null; // (enderId) => {}
  onCallDisconnected = null; // () => {}
  onRemoteStream = null; // (stream) => {}
  onCallFailed = null; // (error) => {}
}
