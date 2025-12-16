import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { useSocket } from "@/hooks/use-socket";

// Minimal WebRTC hook — creates a peer connection and uses socket signaling.
export const useWebRTC = (chatId: string | null) => {
  const socket = useSocket((s) => s.socket) as Socket | null;
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCalling, setIsCalling] = useState(false);

  useEffect(() => {
    if (!socket) return;

  const handleOffer = async ({ offer, from }: { offer: RTCSessionDescriptionInit; from?: string }) => {
      if (!chatId) return;
      await ensurePeerConnection();
      if (!pcRef.current) return;
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      socket.emit("webrtc:answer", { chatId, answer, toSocketId: from });
    };

  const handleAnswer = async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      if (!pcRef.current) return;
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    };

  const handleIce = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      if (!pcRef.current) return;
      try {
        await pcRef.current.addIceCandidate(candidate);
      } catch (err) {
        console.warn("Failed to add ICE candidate", err);
      }
    };

    socket.on("webrtc:offer", handleOffer);
    socket.on("webrtc:answer", handleAnswer);
    socket.on("webrtc:ice", handleIce);

    return () => {
      socket.off("webrtc:offer", handleOffer);
      socket.off("webrtc:answer", handleAnswer);
      socket.off("webrtc:ice", handleIce);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, chatId]);

  const ensurePeerConnection = async () => {
    if (pcRef.current) return pcRef.current;
    const pc = new RTCPeerConnection();

    pc.onicecandidate = (event) => {
      if (event.candidate && socket && chatId) {
        socket.emit("webrtc:ice", { chatId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams?.[0] || null);
    };

    // create local stream
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      for (const track of stream.getTracks()) {
        pc.addTrack(track, stream);
      }
    } catch (err) {
      console.warn("Could not get user media", err);
    }

    pcRef.current = pc;
    return pcRef.current;
  };

  const startCall = async () => {
    if (!socket || !chatId) return;
    setIsCalling(true);
    await ensurePeerConnection();
    if (!pcRef.current) return;

    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);
    // ensure presence in webrtc room
    socket.emit("webrtc:join", chatId, (err?: string) => {
      if (err) console.warn(err);
      socket.emit("webrtc:offer", { chatId, offer });
    });
  };

  const stopCall = () => {
    setIsCalling(false);
    // stop local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch (e) {
        console.warn("Error closing peer connection", e);
      }
      pcRef.current = null;
    }
    setRemoteStream(null);
  };

  return {
    startCall,
    stopCall,
    isCalling,
    remoteStream,
    localStream: localStreamRef.current,
  };
};

export default useWebRTC;
