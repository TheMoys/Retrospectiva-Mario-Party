import React from 'react';
import { Player, GameState } from '@/types/game';
import { CHARACTERS } from '@/constants/characters';
import { CharacterAvatar } from '@/components/Common/CharacterAvatar';

interface TopScoreboardProps {
  gameState: GameState;
}

export const TopScoreboard: React.FC<TopScoreboardProps> = ({ gameState }) => {
  const { players, activePlayerIndex, starLeaderId } = gameState;

  return (
    <div className="w-full bg-slate-950/80 backdrop-blur-md border-b border-white/10 px-4 py-2 z-20 flex items-center justify-between gap-2 shadow-2xl">
      {/* Title / Turn Counter */}
      <div className="flex items-center gap-3 pr-2 border-r border-white/10 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-yellow-500 to-amber-300 flex items-center justify-center text-xl shadow-md animate-pulse">
          ⭐
        </div>
        <div>
          <div className="text-[11px] font-bold text-yellow-400 tracking-wider uppercase font-pixel">
            SPRINT PARTY 3D
          </div>
          <div className="text-xs text-slate-300 font-semibold">
            Senda Arcoíris • Casilla {players[activePlayerIndex]?.spaceIndex ?? 0}/20
          </div>
        </div>
      </div>

      {/* 6 Players Scorecards */}
      <div className="flex-1 flex items-center justify-center gap-2 overflow-x-auto py-1 scrollbar-none">
        {players.map((player, idx) => {
          const char = CHARACTERS[player.characterId];
          const isActive = idx === activePlayerIndex;
          const isLeader = player.id === starLeaderId && player.stars > 0;

          return (
            <div
              key={player.id}
              className={`relative px-3 py-1.5 rounded-xl transition-all duration-300 flex items-center gap-2.5 min-w-[140px] max-w-[170px] ${
                isActive
                  ? 'bg-slate-800/95 ring-2 ring-yellow-400 scale-105 shadow-lg shadow-yellow-500/20'
                  : 'bg-slate-900/70 border border-white/10 hover:bg-slate-800/60'
              }`}
            >
              {/* Leader Crown Badge */}
              {isLeader && (
                <div className="absolute -top-2.5 -right-1 text-sm animate-bounce" title="Líder de Estrellas">
                  👑
                </div>
              )}

              {/* Character Avatar */}
              <CharacterAvatar characterId={player.characterId} size="md" />

              {/* Player Name and Stars */}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                  <span>{player.name}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-yellow-300 font-bold">
                  <span>⭐ {player.stars}</span>

                  {/* 3 Medals Unlocked: 🟢 🟡 🔴 */}
                  <div className="flex items-center gap-0.5 ml-auto text-[10px]" title="Medallas: Seguir, Mejorar, Dejar">
                    <span className={player.medals.seguir ? 'opacity-100 scale-110' : 'opacity-25 grayscale'}>🟢</span>
                    <span className={player.medals.mejorar ? 'opacity-100 scale-110' : 'opacity-25 grayscale'}>🟡</span>
                    <span className={player.medals.dejar ? 'opacity-100 scale-110' : 'opacity-25 grayscale'}>🔴</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty slots placeholders if fewer than 6 players */}
        {Array.from({ length: Math.max(0, 6 - players.length) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="px-3 py-2 rounded-xl border border-dashed border-white/10 text-slate-500 text-xs flex items-center gap-2 min-w-[120px] justify-center"
          >
            <span className="text-sm opacity-40">🎮</span>
            <span className="text-[11px] italic">Esperando...</span>
          </div>
        ))}
      </div>
    </div>
  );
};
