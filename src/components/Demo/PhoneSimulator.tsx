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
      {/* 1. Simulator Control Header & Quick Demo Action */}
      <div className="mb-2 shrink-0">
        <div className="flex items-center justify-between mb-1.5 px-0.5 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-black text-slate-200 uppercase tracking-wider font-game flex items-center gap-1 truncate">
              <span aria-hidden="true">📱</span>
              <span>JOY-PHONE</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-bold border border-emerald-400/35 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping motion-reduce:animate-none" aria-hidden="true" />
              <span>EN VIVO</span>
            </span>
          </div>

          <label className="min-h-[44px] px-2 rounded-xl flex items-center gap-2 cursor-pointer text-xs text-slate-200 hover:text-white transition-colors shrink-0">
            <input
              type="checkbox"
              checked={autoFollowTurn}
              onChange={(e) => setAutoFollowTurn(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-800 border-white/30 text-yellow-400 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300"
            />
            <span className="text-xs font-bold text-yellow-300">Auto</span>
          </label>
        </div>

        {/* 2. Dynamic Players Switcher Bar (>= 8px gaps) */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-white/10 shadow-inner w-full">
          {gameState.players.map((p) => {
            const char = CHARACTERS[p.characterId];
            const isSelected = p.id === myPlayerId;
            const isTurn = p.id === activePlayer?.id;

            return (
              <button
                type="button"
                key={p.id}
                onClick={() => {
                  setAutoFollowTurn(false);
                  setMyPlayerId(p.id);
                }}
                className={`min-h-[44px] flex-1 min-w-0 py-1.5 px-1 rounded-xl flex flex-col items-center justify-center transition-all relative cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 ${
                  isSelected
                    ? 'bg-yellow-400/25 border-2 border-yellow-400 shadow-md scale-105'
                    : 'hover:bg-slate-800/80 opacity-80 hover:opacity-100'
                }`}
                title={`${p.name} (${char.name})`}
              >
                <CharacterAvatar characterId={p.characterId} size="sm" showBorder={false} />
                <span className="text-xs font-black text-white truncate w-full text-center mt-0.5">
                  {p.name.split(' ')[0]}
                </span>
                {isTurn && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping motion-reduce:animate-none" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>

        {/* 3. Quick Demo Action (Above phone frame, clear of bottom-right Netlify badge) */}
        <button
          type="button"
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
          className="mt-2 w-full min-h-[44px] py-2 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-emerald-300 border border-emerald-400/25 active:scale-95 transition-all text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          <span aria-hidden="true">⭐</span>
          <span>Simular Tarjeta de Sprint (+1 Estrella)</span>
        </button>
      </div>

      {/* 4. Realistic Smartphone Frame Mockup (Bottom >= 76px clearance over Netlify corner) */}
      <div className="flex-1 w-full mb-16 bg-slate-950 rounded-[34px] p-2 border-[5px] border-slate-700 shadow-2xl relative overflow-hidden flex flex-col ring-1 ring-white/10 min-h-0">
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
    </div>
  );
};