import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { Camera, Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";

type CallType = "audio" | "video";
type CallState = "receiving" | "calling" | "connected" | "error";

interface WebRTCCallProps {
  socket: Socket;
  roomId: string;
  isIncoming: boolean;
  initialCallType: CallType;
  callerName: string;
  onEnd: () => void;
}

export default function WebRTCCall({
  socket,
  roomId,
  isIncoming,
  initialCallType,
  callerName,
  onEnd,
}: WebRTCCallProps) {
  const [callState, setCallState] = useState<CallState>(
    isIncoming ? "receiving" : "calling",
  );
  const [callError, setCallError] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  const releaseResources = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    remoteStreamRef.current = null;
    pendingCandidatesRef.current = [];
  }, []);

  const closeCall = useCallback(() => {
    socket.emit("end_call", { roomId });
    releaseResources();
    onEndRef.current();
  }, [releaseResources, roomId, socket]);

  const failCall = useCallback((message: string) => {
    setCallError(message);
    setCallState("error");
    releaseResources();
  }, [releaseResources]);

  const getMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: initialCallType === "video",
      });
      localStreamRef.current = stream;
      return true;
    } catch (error) {
      console.error("Unable to access call media:", error);
      failCall(
        initialCallType === "video"
          ? "Camera or microphone access was denied or unavailable. Check browser permissions and try again."
          : "Microphone access was denied or unavailable. Check browser permissions and try again.",
      );
      return false;
    }
  }, [failCall, initialCallType]);

  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) return peerConnectionRef.current;

    const connection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    peerConnectionRef.current = connection;

    localStreamRef.current?.getTracks().forEach((track) => {
      connection.addTrack(track, localStreamRef.current!);
    });

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc_ice_candidate", {
          roomId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    connection.ontrack = (event) => {
      const [stream] = event.streams;
      if (!stream) return;
      remoteStreamRef.current = stream;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = stream;
    };

    connection.oniceconnectionstatechange = () => {
      if (connection.iceConnectionState === "failed") {
        failCall("The call could not connect. Check the network and try again.");
      }
    };

    return connection;
  }, [failCall, roomId, socket]);

  const applyRemoteDescription = useCallback(async (
    connection: RTCPeerConnection,
    description: RTCSessionDescriptionInit,
  ) => {
    await connection.setRemoteDescription(description);
    const pendingCandidates = pendingCandidatesRef.current.splice(0);
    for (const candidate of pendingCandidates) {
      await connection.addIceCandidate(candidate);
    }
  }, []);

  const startCall = useCallback(async () => {
    if (!(await getMedia())) return;

    socket.emit(
      "start_call",
      { roomId, callType: initialCallType },
      (result: { error?: string } = {}) => {
        if (result.error) failCall(result.error);
      },
    );
  }, [failCall, getMedia, initialCallType, roomId, socket]);

  const acceptCall = async () => {
    if (!(await getMedia())) return;
    setCallState("connected");
    socket.emit("accept_call", { roomId });
  };

  const rejectCall = () => {
    socket.emit("reject_call", { roomId });
    releaseResources();
    onEndRef.current();
  };

  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsMuted(!track.enabled);
  };

  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsVideoOff(!track.enabled);
  };

  useEffect(() => {
    if (callState !== "connected") return;
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
    if (remoteVideoRef.current && remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
    }
    if (remoteAudioRef.current && remoteStreamRef.current) {
      remoteAudioRef.current.srcObject = remoteStreamRef.current;
    }
  }, [callState]);

  useEffect(() => {
    const handleCallAccepted = async () => {
      try {
        const connection = createPeerConnection();
        const offer = await connection.createOffer();
        await connection.setLocalDescription(offer);
        setCallState("connected");
        socket.emit("webrtc_offer", { roomId, sdp: offer });
      } catch (error) {
        console.error("Unable to create call offer:", error);
        failCall("Unable to start the call. Please try again.");
      }
    };

    const handleCallRejected = () => {
      failCall("The call was declined.");
    };

    const handleCallEnded = () => {
      releaseResources();
      onEndRef.current();
    };

    const handleOffer = async (offer: RTCSessionDescriptionInit) => {
      try {
        const connection = createPeerConnection();
        await applyRemoteDescription(connection, offer);
        const answer = await connection.createAnswer();
        await connection.setLocalDescription(answer);
        socket.emit("webrtc_answer", { roomId, sdp: answer });
      } catch (error) {
        console.error("Unable to process call offer:", error);
        failCall("Unable to establish the call. Please try again.");
      }
    };

    const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
      try {
        const connection = peerConnectionRef.current;
        if (!connection) throw new Error("Call connection is not ready.");
        await applyRemoteDescription(connection, answer);
      } catch (error) {
        console.error("Unable to process call answer:", error);
        failCall("Unable to establish the call. Please try again.");
      }
    };

    const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
      const connection = peerConnectionRef.current;
      if (!connection?.remoteDescription) {
        pendingCandidatesRef.current.push(candidate);
        return;
      }

      try {
        await connection.addIceCandidate(candidate);
      } catch (error) {
        console.error("Unable to add remote ICE candidate:", error);
        failCall("The call network connection failed. Check the network and try again.");
      }
    };

    socket.on("call_accepted", handleCallAccepted);
    socket.on("call_rejected", handleCallRejected);
    socket.on("call_ended", handleCallEnded);
    socket.on("webrtc_offer", handleOffer);
    socket.on("webrtc_answer", handleAnswer);
    socket.on("webrtc_ice_candidate", handleIceCandidate);

    if (!isIncoming) void startCall();

    return () => {
      socket.off("call_accepted", handleCallAccepted);
      socket.off("call_rejected", handleCallRejected);
      socket.off("call_ended", handleCallEnded);
      socket.off("webrtc_offer", handleOffer);
      socket.off("webrtc_answer", handleAnswer);
      socket.off("webrtc_ice_candidate", handleIceCandidate);
      releaseResources();
    };
  }, [
    applyRemoteDescription,
    createPeerConnection,
    failCall,
    isIncoming,
    releaseResources,
    roomId,
    socket,
    startCall,
  ]);

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-900/95 p-4 text-white backdrop-blur-sm">
      {callState === "receiving" && (
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 animate-bounce items-center justify-center rounded-full bg-indigo-600 text-4xl font-bold shadow-xl shadow-indigo-600/30">
            {callerName.charAt(0).toUpperCase()}
          </div>
          <h2 className="mb-2 text-3xl font-bold">{callerName}</h2>
          <p className="mb-12 text-indigo-300">Incoming {initialCallType} call...</p>
          <div className="flex justify-center gap-8">
            <button
              type="button"
              aria-label="Decline call"
              onClick={rejectCall}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 shadow-lg shadow-red-500/30 transition-all hover:scale-110 hover:bg-red-600"
            >
              <PhoneOff size={28} />
            </button>
            <button
              type="button"
              aria-label="Accept call"
              onClick={() => void acceptCall()}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 shadow-lg transition-all hover:scale-110 hover:bg-green-600"
            >
              {initialCallType === "video" ? <Video size={28} /> : <Mic size={28} />}
            </button>
          </div>
        </div>
      )}

      {callState === "calling" && (
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 animate-pulse items-center justify-center rounded-full bg-indigo-600/50 text-4xl font-bold shadow-xl shadow-indigo-600/20">
            {callerName.charAt(0).toUpperCase() || "?"}
          </div>
          <h2 className="mb-2 text-3xl font-bold">Calling {callerName}...</h2>
          <p className="mb-12 text-indigo-300">Waiting for answer</p>
          <button
            type="button"
            aria-label="Cancel call"
            onClick={closeCall}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500 shadow-lg shadow-red-500/30 transition-all hover:scale-110 hover:bg-red-600"
          >
            <PhoneOff size={28} />
          </button>
        </div>
      )}

      {callState === "connected" && (
        <div className="relative flex h-full w-full flex-col p-2 sm:p-4 md:p-8">
          <div className="relative flex-1 overflow-hidden rounded-2xl border border-slate-700/50 bg-black shadow-2xl">
            <audio ref={remoteAudioRef} autoPlay />
            {initialCallType === "video" ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-slate-800">
                <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-indigo-600 text-5xl font-bold shadow-xl shadow-indigo-600/20">
                  {callerName.charAt(0).toUpperCase() || "?"}
                </div>
                <h3 className="text-2xl font-bold">{callerName}</h3>
                <p className="mt-2 text-indigo-400">Audio call connected</p>
              </div>
            )}

            {initialCallType === "video" && (
              <div className="absolute right-4 top-4 h-36 w-24 overflow-hidden rounded-xl border-2 border-slate-600 bg-slate-800 shadow-2xl md:h-48 md:w-32">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-center gap-6">
            <button
              type="button"
              aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
              onClick={toggleMute}
              className={`flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-all ${isMuted ? "bg-slate-600" : "bg-slate-700 hover:bg-slate-600"}`}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
            {initialCallType === "video" && (
              <button
                type="button"
                aria-label={isVideoOff ? "Turn camera on" : "Turn camera off"}
                onClick={toggleVideo}
                className={`flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-all ${isVideoOff ? "bg-slate-600" : "bg-slate-700 hover:bg-slate-600"}`}
              >
                {isVideoOff ? <VideoOff size={24} /> : <Camera size={24} />}
              </button>
            )}
            <button
              type="button"
              aria-label="End call"
              onClick={closeCall}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30 transition-all hover:bg-red-600"
            >
              <PhoneOff size={24} />
            </button>
          </div>
        </div>
      )}

      {callState === "error" && (
        <div role="alert" className="max-w-md text-center">
          <PhoneOff size={36} className="mx-auto mb-4 text-rose-400" />
          <p className="mb-6 text-slate-200">{callError}</p>
          <button
            type="button"
            onClick={() => {
              releaseResources();
              onEndRef.current();
            }}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white transition hover:bg-indigo-500"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
