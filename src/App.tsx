import React, { useState } from 'react';
import { GameProvider, useGame } from '@/context/GameContext';
import { LobbyScreen } from '@/components/Lobby/LobbyScreen';
import { HostScreen } from '@/components/Host/HostScreen';
import { ControllerScreen } from '@/components/Controller/ControllerScreen';
import { PhoneSimulator } from '@/components/Demo/PhoneSimulator';
import { sounds } from '@/audio/soundEffects';

type ViewMode = 'lobby' | 'host' | 'controller' | 'demo';

const GameMain: React.FC = () => {
  const { gameState, joinPlayer, setMyPlayerId } = useGame();
  const [view, setView] = useState<ViewMode>(() => {
    // If URL contains mode=controller, default to controller view
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'controller') return 'controller';
    }
    return 'lobby';
  });

  const [isMuted, setIsMuted] = useState(false);

  // Handle Demo Launch (Pre-fill 4 team players if needed)
  const handleStartDemo = () => {
    sounds.playStarFanfare();

    // If no players exist, auto-join 4 team members
    if (gameState.players.length === 0) {
      const p1 = joinPlayer('Diego (Lead)', 'mario');
      joinPlayer('Pipe (Dev)', 'luigi');
      joinPlayer('William (Dev)', 'yoshi');
      joinPlayer('Elena (QA)', 'peach');
      setMyPlayerId(p1.id);
    }

    setView('demo');
  };

  const toggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="relative w-screen h-screen bg-slate-950 text-white overflow-hidden font-game">
      {/* Sound Toggle Button (Floating) */}
      <button
        onClick={toggleSound}
        className="fixed top-2.5 right-3 z-50 p-2 rounded-xl bg-slate-900/80 border border-white/20 text-xs hover:bg-slate-800 backdrop-blur-sm"
        title={isMuted ? 'Activar Sonido' : 'Silenciar'}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>

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
      {view === 'controller' && <ControllerScreen />}

      {/* 4. MODO LOCAL / DEMO (Split-Screen: 3D Board on Left + Simulated Smartphone on Right) */}
      {view === 'demo' && (
        <div className="w-full h-full flex overflow-hidden">
          {/* Left: Host TV 3D Viewport */}
          <div className="flex-1 h-full relative">
            <HostScreen />
          </div>

          {/* Right: Phone Simulator */}
          <PhoneSimulator />
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
