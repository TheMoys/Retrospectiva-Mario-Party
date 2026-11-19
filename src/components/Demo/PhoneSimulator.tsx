import React, { useState, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import { CHARACTERS } from '@/constants/characters';
import { CharacterAvatar } from '@/components/Common/CharacterAvatar';
import { ControllerScreen } from '@/components/Controller/ControllerScreen';

export const PhoneSimulator: React.FC = () => {
  const { gameState, setMyPlayerId, myPlayerId, rollDice, triggerMinigame, submitRetroCard } = useGame();
  const [autoFollowTurn, setAutoFollowTurn] = useState<boolean>(true);

  const activePlayer = gameState.players[gameState.activePlayerIndex];

  // Auto-follow current turn if enabled
  useEffect(() => {
    if (autoFollowTurn && activePlayer && activePlayer.id !== myPlayerId) {
      setMyPlayerId(activePlayer.id);
    }
  }, [autoFollowTurn, activePlayer, myPlayerId, setMyPlayerId]);

  return (
    <div className="w-full h-full bg-slate-900/90 flex flex-col p-3 shadow-2xl z-30 select-none overflow-hidden">
      {/* Simulator Control Header */}
      <div className="mb-2 shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-[10px] font-pixel text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>📱</span>
            <span>JOY-PHONE SIMULADOR</span>
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={autoFollowTurn}
              onChange={(e) => setAutoFollowTurn(e.target.checked)}
              className="rounded bg-slate-800 text-yellow-500 focus:ring-0"
            />
            <span className="text-[10px] font-semibold">Seguir Turno</span>
          </label>
        </div>

        {/* Player Switcher Bar */}
        <div className="grid grid-cols-6 gap-1 bg-slate-950 p-1 rounded-xl border border-white/10">
          {gameState.players.map((p) => {
            const char = CHARACTERS[p.characterId];
            const isSelected = p.id === myPlayerId;
            const isTurn = p.id === activePlayer?.id;

            return (
              <button
                key={p.id}
                onClick={() => {
                  setAutoFollowTurn(false);
                  setMyPlayerId(p.id);
                }}
                className={`py-1 rounded-lg flex flex-col items-center justify-center transition-all relative ${
                  isSelected
                    ? 'bg-yellow-400/20 border border-yellow-400 shadow-sm scale-105'
                    : 'hover:bg-slate-800 opacity-60'
                }`}
                title={`${p.name} (${char.name})`}
              >
                <CharacterAvatar characterId={p.characterId} size="sm" showBorder={false} />
                {isTurn && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Realistic Smartphone Frame Mockup */}
      <div className="flex-1 w-full bg-slate-950 rounded-[34px] p-2 border-[5px] border-slate-700 shadow-2xl relative overflow-hidden flex flex-col ring-1 ring-white/10 min-h-0">
        {/* Dynamic Island / Speaker Notch */}
        <div className="w-20 h-3.5 bg-slate-800 rounded-full mx-auto mb-1 shrink-0 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-900 mr-1.5" />
          <div className="w-5 h-1 rounded-full bg-slate-900" />
        </div>

        {/* Smartphone Screen Viewport */}
        <div className="flex-1 w-full rounded-[24px] overflow-hidden bg-slate-950 relative flex flex-col min-h-0">
          <ControllerScreen />
        </div>

        {/* Home Bar */}
        <div className="w-20 h-1 bg-slate-600 rounded-full mx-auto mt-1.5 shrink-0" />
      </div>

      {/* Demo Quick Shortcuts at bottom */}
      <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] font-bold shrink-0">
        <button
          onClick={() => rollDice()}
          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/20 active:scale-95 transition-all text-center flex items-center justify-center gap-1"
        >
          <span>🎲</span>
          <span>Tirar Dado</span>
        </button>
        <button
          onClick={() => {
            if (!myPlayerId) return;
            const me = gameState.players.find((p) => p.id === myPlayerId);
            submitRetroCard({
              playerId: myPlayerId,
              playerName: me?.name || 'Jugador',
              characterId: me?.characterId || 'mario',
              category: 'seguir',
              content: '¡Excelente comunicación y ritmo en este sprint!',
            });
          }}
          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-400/20 active:scale-95 transition-all text-center flex items-center justify-center gap-1"
        >
          <span>⭐</span>
          <span>+1 Tarjeta Rápida</span>
        </button>
      </div>
    </div>
  );
};
