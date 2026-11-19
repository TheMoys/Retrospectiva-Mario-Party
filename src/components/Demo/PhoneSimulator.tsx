import React, { useState, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import { CHARACTERS } from '@/constants/characters';
import { CharacterAvatar } from '@/components/Common/CharacterAvatar';
import { ControllerScreen } from '@/components/Controller/ControllerScreen';

export const PhoneSimulator: React.FC = () => {
  const { gameState, setMyPlayerId, myPlayerId, rollDice, submitRetroCard } = useGame();
  const [autoFollowTurn, setAutoFollowTurn] = useState<boolean>(true);

  const activePlayer = gameState.players[gameState.activePlayerIndex];

  // Auto-follow current turn if enabled
  useEffect(() => {
    if (autoFollowTurn && activePlayer && activePlayer.id !== myPlayerId) {
      setMyPlayerId(activePlayer.id);
    }
  }, [autoFollowTurn, activePlayer, myPlayerId, setMyPlayerId]);

  return (
    <div className="w-full h-full bg-slate-900/95 flex flex-col p-3 shadow-2xl z-30 select-none overflow-hidden font-game">
      {/* 1. Simulator Control Header (Matching Reference Screen) */}
      <div className="mb-2 shrink-0">
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider font-pixel flex items-center gap-1">
              <span>📱</span>
              <span>MANDO JOY-PHONE</span>
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>EN VIVO</span>
            </span>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-300 hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={autoFollowTurn}
              onChange={(e) => setAutoFollowTurn(e.target.checked)}
              className="rounded bg-slate-800 text-yellow-500 focus:ring-0 cursor-pointer"
            />
            <span className="text-[10px] font-bold text-yellow-400 flex items-center gap-0.5">
              <span>Auto</span>
            </span>
          </label>
        </div>

        {/* 2. Dynamic Players Switcher Bar */}
        <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-2xl border border-white/10 shadow-inner w-full">
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
                className={`flex-1 min-w-0 py-1.5 px-1 rounded-xl flex flex-col items-center justify-center transition-all relative ${
                  isSelected
                    ? 'bg-yellow-400/25 border-2 border-yellow-400 shadow-md scale-105'
                    : 'hover:bg-slate-800/80 opacity-70 hover:opacity-100'
                }`}
                title={`${p.name} (${char.name})`}
              >
                <CharacterAvatar characterId={p.characterId} size="sm" showBorder={false} />
                <span className="text-[9px] font-black text-white truncate w-full text-center mt-0.5">
                  {p.name.split(' ')[0]}
                </span>
                {isTurn && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Realistic Smartphone Frame Mockup */}
      <div className="flex-1 w-full bg-slate-950 rounded-[34px] p-2 border-[5px] border-slate-700 shadow-2xl relative overflow-hidden flex flex-col ring-1 ring-white/10 min-h-0">
        {/* Dynamic Island / Speaker Notch */}
        <div className="w-20 h-3.5 bg-slate-800 rounded-full mx-auto mb-1 shrink-0 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-900 mr-1.5" />
          <div className="w-5 h-1 rounded-full bg-slate-900" />
        </div>

        {/* Smartphone Screen Viewport with strict isolation */}
        <div
          className="flex-1 w-full rounded-[24px] overflow-hidden bg-slate-950 relative flex flex-col min-h-0 shadow-inner"
          style={{ transform: 'translateZ(0)', isolation: 'isolate' }}
        >
          <ControllerScreen />
        </div>

        {/* Home Bar */}
        <div className="w-20 h-1 bg-slate-600 rounded-full mx-auto mt-1.5 shrink-0" />
      </div>

      {/* 4. Demo Quick Actions */}
      <div className="mt-2 shrink-0">
        <button
          onClick={() => {
            if (!myPlayerId) return;
            const me = gameState.players.find((p) => p.id === myPlayerId);
            const others = gameState.players.filter((p) => p.id !== myPlayerId);
            submitRetroCard({
              playerId: myPlayerId,
              playerName: me?.name || 'Alex',
              characterId: me?.characterId || 'mario',
              category: 'seguir',
              content: '¡Excelente coordinación y foco de entrega en este sprint!',
              recipientId: others[0]?.id,
              recipientName: others[0]?.name,
            });
          }}
          className="w-full py-2 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-emerald-300 border border-emerald-400/25 active:scale-95 transition-all text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm min-h-[38px]"
        >
          <span>⭐</span>
          <span>Simular Tarjeta de Sprint (+1 Estrella)</span>
        </button>
      </div>
    </div>
  );
};