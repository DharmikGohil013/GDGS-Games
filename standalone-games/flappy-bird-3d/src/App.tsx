import React, { useEffect, useRef, useState } from 'react';
import { FlappyScene, GameStats, CameraViewMode, WorldTheme } from './game/FlappyScene';
import { DifficultyLevel } from './game/rules';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { sound } from './game/audio';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<FlappyScene | null>(null);

  const [stats, setStats] = useState<GameStats>({
    score: 0,
    bestScore: 0,
    combo: 1,
    state: 'title',
    difficulty: 'normal',
    cameraMode: 'classic_3d',
    theme: 'day',
  });

  const [isMuted, setIsMuted] = useState(sound.getMuted());

  // Initialize Three.js scene once on mount
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new FlappyScene(mountRef.current, (newStats) => {
      setStats(newStats);
    });
    sceneRef.current = scene;

    // Check for ?autostart=1
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      setTimeout(() => {
        scene.startGame();
      }, 50);
    }

    return () => {
      scene.destroy();
      sceneRef.current = null;
    };
  }, []);

  const handleStart = () => {
    sceneRef.current?.startGame();
  };

  const handlePause = () => {
    sceneRef.current?.pauseGame();
  };

  const handleResume = () => {
    sceneRef.current?.resumeGame();
  };

  const handleRestart = () => {
    sceneRef.current?.restartGame();
  };

  const handleTitle = () => {
    sceneRef.current?.returnToTitle();
  };

  const handleSelectDifficulty = (d: DifficultyLevel) => {
    sceneRef.current?.setDifficulty(d);
  };

  const handleSelectCameraMode = (c: CameraViewMode) => {
    sceneRef.current?.setCameraMode(c);
  };

  const handleSelectTheme = (t: WorldTheme) => {
    sceneRef.current?.setTheme(t);
  };

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-900 select-none">
      {/* 3D WebGL Canvas Viewport Mount */}
      <div
        ref={mountRef}
        data-testid="flappy-canvas-container"
        className="absolute inset-0 w-full h-full cursor-pointer"
      />

      {/* Title Screen Overlay */}
      {stats.state === 'title' && (
        <TitleScreen
          onStart={handleStart}
          difficulty={stats.difficulty}
          onSelectDifficulty={handleSelectDifficulty}
          cameraMode={stats.cameraMode}
          onSelectCameraMode={handleSelectCameraMode}
          theme={stats.theme}
          onSelectTheme={handleSelectTheme}
          bestScore={stats.bestScore}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* In-Game HUD Overlay */}
      {stats.state === 'playing' && (
        <GameHUD
          score={stats.score}
          bestScore={stats.bestScore}
          difficulty={stats.difficulty}
          cameraMode={stats.cameraMode}
          onToggleCamera={() => {
            const modes: CameraViewMode[] = ['classic_3d', 'action_cam', 'first_person'];
            const nextIdx = (modes.indexOf(stats.cameraMode) + 1) % modes.length;
            handleSelectCameraMode(modes[nextIdx]);
          }}
          onPause={handlePause}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Paused Modal */}
      {stats.state === 'paused' && (
        <PauseModal
          score={stats.score}
          bestScore={stats.bestScore}
          onResume={handleResume}
          onRestart={handleRestart}
          onTitle={handleTitle}
        />
      )}

      {/* Game Over Modal */}
      {stats.state === 'gameover' && (
        <GameOverModal
          score={stats.score}
          bestScore={stats.bestScore}
          onRestart={handleRestart}
          onTitle={handleTitle}
        />
      )}
    </div>
  );
}
