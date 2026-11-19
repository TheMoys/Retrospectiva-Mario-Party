import React, { useState, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import { CHARACTERS } from '@/constants/characters';
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
    <div className="w-[380px] h-full bg-slate-900 border-l border-white/10 flex flex-col p-4 shadow-2xl shrink-0 z-30 select-none">
      {/* Simulator Control Header */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] font-pixel text-yellow-400 uppercase">
            📱 JOY-PHONE SIMULADOR
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={autoFollowTurn}
              onChange={(e) => setAutoFollowTurn(e.target.checked)}
              className="rounded bg-slate-800 text-yellow-500 focus:ring-0"
            />
            <span className="text-[11px]">Seguir Turno</span>
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
                className={`py-1 rounded-lg text-sm flex flex-col items-center justify-center transition-all relative ${
                  isSelected
                    ? 'bg-yellow-400/20 border border-yellow-400 shadow-sm scale-105'
                    : 'hover:bg-slate-800 opacity-60'
                }`}
                title={`${p.name} (${char.name})`}
              >
                <span>{char.avatar}</span>
                {isTurn && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Realistic Smartphone Frame Mockup */}
      <div className="flex-1 w-full bg-slate-950 rounded-[38px] p-2.5 border-[6px] border-slate-700 shadow-2xl relative overflow-hidden flex flex-col ring-1 ring-white/10">
        {/* Dynamic Island / Speaker Notch */}
        <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-1 shrink-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-slate-900 mr-2" />
          <div className="w-6 h-1 rounded-full bg-slate-900" />
        </div>

        {/* Smartphone Screen Viewport */}
        <div className="flex-1 w-full rounded-[28px] overflow-hidden bg-slate-950 relative flex flex-col">
          <ControllerScreen />
        </div>

        {/* Home Bar */}
        <div className="w-24 h-1 bg-slate-600 rounded-full mx-auto mt-2 shrink-0" />
      </div>

      {/* Demo Quick Shortcuts at bottom */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-bold">
        <button
          onClick={() => rollDice()}
          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-400/20"
        >
          🎲 Tirar Dado
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
          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-emerald-300 border border-emerald-400/20"
        >
          ⭐ +1 Tarjeta Rápida
        </button>
      </div>
    </div>
  );
};
