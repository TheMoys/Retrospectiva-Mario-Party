import React, { useState } from 'react';
import { GameProvider, useGame } from '@/context/GameContext';
import { LobbyScreen } from '@/components/Lobby/LobbyScreen';
import { HostScreen } from '@/components/Host/HostScreen';
import { ControllerScreen } from '@/components/Controller/ControllerScreen';
import { PhoneSimulator } from '@/components/Demo/PhoneSimulator';
import { sounds } from '@/audio/soundEffects';

type ViewMode = 'lobby' | 'host' | 'controller' | 'demo';

function getInitialViewState(): { initialView: ViewMode; lockedControllerFromUrl: boolean } {
  if (typeof window === 'undefined') {
    return { initialView: 'lobby', lockedControllerFromUrl: false };
  }
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  const viewParam = params.get('view');

  if (mode === 'controller') {
    return { initialView: 'controller', lockedControllerFromUrl: true };
  }
  if (mode === 'host' || viewParam === 'host') {
    return { initialView: 'host', lockedControllerFromUrl: false };
  }
  if (mode === 'demo') {
    return { initialView: 'demo', lockedControllerFromUrl: false };
  }
  if (params.get('room')) {
    return { initialView: 'controller', lockedControllerFromUrl: true };
  }
  return { initialView: 'lobby', lockedControllerFromUrl: false };
}

const GameMain: React.FC = () => {
  const { gameState, joinPlayer, setMyPlayerId, setIsHost, startGame, leaveControllerSession } = useGame();
  const [initialRoute] = useState(getInitialViewState);
  const [view, setView] = useState<ViewMode>(initialRoute.initialView);
  const [isMuted, setIsMuted] = useState(false);

  // Handle Demo Launch (Pre-fill 4 team players & start game directly)
  const handleStartDemo = () => {
    sounds.playStarFanfare();
    setIsHost(true);

    // If no players exist, auto-join 4 team members
    if (gameState.players.length === 0) {
      const p1 = joinPlayer('Diego (Lead)', 'mario');
      joinPlayer('Pipe (Dev)', 'luigi');
      joinPlayer('William (Dev)', 'yoshi');
      joinPlayer('Elena (QA)', 'peach');
      setMyPlayerId(p1.id);
    }

    startGame();
    setView('demo');
  };

  const toggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const handleBackFromController = initialRoute.lockedControllerFromUrl
    ? undefined
    : () => {
        leaveControllerSession();
        setIsHost(true);
        setView('lobby');
      };

  return (
    <div className="relative w-screen h-[100dvh] bg-slate-950 text-white overflow-hidden font-game">
      {/* Floating Sound Toggle for Desktop/Host views (Controller renders sound toggle in its top bar to avoid overlapping mobile bottom controls) */}
      {view !== 'controller' && (
        <button
          type="button"
          onClick={toggleSound}
          className="fixed bottom-4 left-4 z-50 w-11 h-11 rounded-2xl bg-slate-900/90 border border-white/25 text-sm hover:bg-slate-800 backdrop-blur-md flex items-center justify-center shadow-xl active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          title={isMuted ? 'Activar Sonido' : 'Silenciar'}
          aria-label={isMuted ? 'Activar Sonido' : 'Silenciar'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      )}

      {/* 1. LOBBY SCREEN */}
      {view === 'lobby' && (
        <LobbyScreen
          onStartHost={() => setView('host')}
          onStartController={() => setView('controller')}
          onStartDemo={handleStartDemo}
        />
      )}

      {/* 2. PANTALLA PRINCIPAL (HOST TV) */}
      {view === 'host' && <HostScreen />}

      {/* 3. MANDO JOY-PHONE REAL */}
      {view === 'controller' && (
        <ControllerScreen
          onBackToLobby={handleBackFromController}
          isMuted={isMuted}
          onToggleSound={toggleSound}
        />
      )}

      {/* 4. MODO LOCAL / DEMO (Split-Screen: 3D Board on Left + Simulated Smartphone on Right) */}
      {view === 'demo' && (
        <div className="w-full h-full flex flex-row overflow-hidden bg-slate-950">
          {/* Left: Host TV 3D Viewport (isolated stacking context keeps fixed Host modals out of PhoneSimulator) */}
          <div
            className="flex-1 h-full min-w-0 relative overflow-hidden"
            style={{ transform: 'translateZ(0)', isolation: 'isolate' }}
          >
            <HostScreen />
          </div>

          {/* Right: Phone Simulator */}
          <div className="w-[410px] max-w-[410px] h-full shrink-0 border-l border-white/10 z-40 bg-slate-900/95 shadow-2xl flex flex-col">
            <PhoneSimulator />
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <GameProvider>
      <GameMain />
    </GameProvider>
  );
}
