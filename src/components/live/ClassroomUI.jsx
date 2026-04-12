import { useTracks, VideoTrack, useRoomContext } from "@livekit/components-react";
import { Track } from "livekit-client";
import ParticipantsPanel from "./ParticipantsPanel";
import ChatPanel from "./ChatPanel";
import TeacherControls from "./TeacherControls";
import RaiseHandButton from "./RaiseHandButton";
import ControlBar from "./ControlBar";
import { useState, useRef, useEffect } from "react";
import "../../styles/live.css";
import useLiveSessionChat from "../../hooks/useLiveSessionChat";
import { MdFullscreen, MdFullscreenExit } from "react-icons/md";
import { IoChatbubblesOutline } from "react-icons/io5";

export default function ClassroomUI({ role, sessionId: sessionIdProp, onLeave }) {
  const isPresenter = role === "PRESENTER";
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [raisedHands, setRaisedHands] = useState({});
  const [raiseHandToasts, setRaiseHandToasts] = useState([]);
  const [sessionStatus, setSessionStatus] = useState(null);
  const containerRef = useRef(null);
  const statusWsRef = useRef(null);
  const room = useRoomContext();
  const sessionId = sessionIdProp || window.location.pathname.split("/").filter(Boolean).pop();
  const { messages: chatMessages, sendMessage } = useLiveSessionChat(sessionId);

  useEffect(() => {
    if (!sessionId) return;
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const wsHost = import.meta.env.VITE_WS_HOST || window.location.host;
    const ws = new WebSocket(proto + "://" + wsHost + "/ws/live-session/" + sessionId + "/");
    statusWsRef.current = ws;
    ws.onmessage = (e) => {
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }
      if (msg.type === "initial_state" || msg.type === "session_update") {
        setSessionStatus(msg.data.status);
      }
    };
    ws.onerror = (e) => console.error("Status WS error", e);
    return () => { ws.close(); statusWsRef.current = null; };
  }, [sessionId]);

  useEffect(() => {
    const handleData = (payload, participant) => {
      try {
        const text = new TextDecoder().decode(payload);
        const msg = JSON.parse(text);
        if (msg.type === "raise-hand") {
          const identity = participant.identity;
          setRaisedHands((prev) => ({ ...prev, [identity]: true }));
          if (isPresenter) {
            const toastId = Date.now() + Math.random();
            setRaiseHandToasts((prev) => [...prev, { id: toastId, identity }]);
            setTimeout(
              () => setRaiseHandToasts((prev) => prev.filter((t) => t.id !== toastId)),
              5000
            );
          }
        }
        if (msg.type === "lower-hand") {
          const identity = participant.identity;
          setRaisedHands((prev) => { const u = { ...prev }; delete u[identity]; return u; });
        }
      } catch {}
    };
    room.on("dataReceived", handleData);
    return () => room.off("dataReceived", handleData);
  }, [room, isPresenter]);

  const toggleFullscreen = () => {
    if (!isFullscreen) containerRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  useEffect(() => {
    const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFSChange);
    return () => document.removeEventListener("fullscreenchange", onFSChange);
  }, []);

  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: false },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);

  const screenTrack = tracks.find((t) => t.source === Track.Source.ScreenShare);
  const cameraTrack = tracks.find((t) => t.source === Track.Source.Camera);
  const mainTrack = screenTrack || cameraTrack;
  const pipTrack = screenTrack ? cameraTrack : null;



  if (!mainTrack) {
    return (
      <div className="waiting-screen">
        <div className="waiting-card">
          <div className="waiting-pulse" />
          <h2>
            {isPresenter
              ? "Enable your camera to start the session"
              : "Waiting for teacher to start..."}
          </h2>
          {!isPresenter && <p>You will be connected as soon as the session begins</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={"classroom-layout" + (isFullscreen ? " fs-mode" : "")} ref={containerRef}>
      {!isPresenter && sessionStatus === "PAUSED" && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, zIndex: 50,
          background: "rgba(0,0,0,0.75)", color: "#e8eaf2",
          padding: "12px 20px", display: "flex", alignItems: "center",
          justifyContent: "center", gap: 10, fontSize: 15, fontWeight: 500,
        }}>
          <span style={{ fontSize: 20 }}>&#9208;</span>
          Session paused by teacher — you can still chat or leave
        </div>
      )}

      {isPresenter && raiseHandToasts.length > 0 && (
        <div className="rh-toasts">
          {raiseHandToasts.map((t) => (
            <div key={t.id} className="rh-toast">
              <strong>{t.identity}</strong> raised their hand
            </div>
          ))}
        </div>
      )}

      <div className={"main-stage" + (!sidebarOpen ? " full-width" : "")}>
        <VideoTrack trackRef={mainTrack} />
        {pipTrack && <div className="pip-camera"><VideoTrack trackRef={pipTrack} /></div>}
        {isPresenter && <TeacherControls sessionId={sessionId} onLeave={onLeave} />}
        <div className="video-overlay-actions">
          <button className="ov-btn" onClick={() => setSidebarOpen((v) => !v)}>
            <IoChatbubblesOutline size={17} />
          </button>
          <button className="ov-btn" onClick={toggleFullscreen}>
            {isFullscreen ? <MdFullscreenExit size={19} /> : <MdFullscreen size={19} />}
          </button>
        </div>
      </div>

      {sidebarOpen && (
        <div className="right-sidebar">
          <ParticipantsPanel raisedHands={raisedHands} />
          <ChatPanel role={role} messages={chatMessages} onSendMessage={sendMessage} />
        </div>
      )}

      <ControlBar onLeave={onLeave} />
      {!isPresenter && <RaiseHandButton />}
    </div>
  );
}
