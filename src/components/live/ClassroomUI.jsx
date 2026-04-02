import { useTracks, VideoTrack } from "@livekit/components-react";
import { Track } from "livekit-client";
import ParticipantsPanel from "./ParticipantsPanel";
import ChatPanel from "./ChatPanel";
import RaiseHandButton from "./RaiseHandButton";
import ControlBar from "./ControlBar";
import { useState, useRef, useEffect } from "react";
import { MdFullscreen, MdFullscreenExit } from "react-icons/md";

export default function ClassroomUI({ role }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: false },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);

  // Students can't publish — all video tracks in the room are the teacher's
  const screenTrack = tracks.find((t) => t.source === Track.Source.ScreenShare);
  const cameraTrack = tracks.find((t) => t.source === Track.Source.Camera);

  // Prioritize screen share as main view; fall back to camera
  const mainTrack = screenTrack || cameraTrack;
  // Show camera as PiP only when screen sharing is active
  const pipTrack = screenTrack ? cameraTrack : null;

  // ✅ FULLSCREEN TOGGLE
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  // ✅ LISTEN FULLSCREEN CHANGE
  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  if (!mainTrack) {
    return (
      <div className="waiting-screen">
        <div className="waiting-card">
          <div className="waiting-pulse" />
          <h2>Waiting for teacher to start…</h2>
          <p>You'll be connected as soon as the session begins</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`classroom-layout ${isFullscreen ? "fs-mode" : ""}`}
    >
      {/* MAIN VIDEO */}
      <div className={`main-stage ${sidebarOpen ? "" : "full-width"}`}>
        
        {/* FULLSCREEN BUTTON */}
        <button
          className="fullscreen-btn"
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <MdFullscreenExit size={20} /> : <MdFullscreen size={20} />}
        </button>

        {/* SIDEBAR TOGGLE */}
        <button
          className="toggle-sidebar-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          ⇄
        </button>

        <VideoTrack trackRef={mainTrack} />

        {/* Picture-in-picture camera when screen sharing */}
        {pipTrack && (
          <div className="pip-camera">
            <VideoTrack trackRef={pipTrack} />
          </div>
        )}
      </div>

      {/* SIDEBAR */}
      {sidebarOpen && (
        <div className="right-sidebar">
          <ParticipantsPanel />
          <ChatPanel role={role} />
        </div>
      )}


      <ControlBar />
      <RaiseHandButton />
    </div>
  );
}
