import React from 'react';
import { Player, GameState } from '@/types/game';
import { CHARACTERS } from '@/constants/characters';
import { CharacterAvatar } from '@/components/Common/CharacterAvatar';

interface TopScoreboardProps {
  gameState: GameState;
  onOpenNormas: () => void;
  onTriggerMinigame: () => void;
  onResetGame: () => void;
}

export const TopScoreboard: React.FC<TopScoreboardProps> = ({
  gameState,
  onOpenNormas,
  onTriggerMinigame,
  onResetGame,
}) => {
  const { players, activePlayerIndex, starLeaderId, round, totalRounds, phase } = gameState;

  return (
    <div className="w-full bg-slate-950/90 backdrop-blur-md border-b border-white/10 px-3 md:px-4 py-2 z-20 flex items-center justify-between gap-3 shadow-2xl select-none">
      {/* 1. Left Title / Round Pill Badge */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="px-3 py-1.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-amber-500/20 border border-yellow-400/40 flex items-center gap-2 shadow-sm">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-yellow-500 to-amber-300 flex items-center justify-center text-xs shadow-md">
            ⭐
          </div>
          <div>
            <div className="text-[10px] font-black text-yellow-300 tracking-wider uppercase font-pixel leading-tight">
              SPRINT PARTY • SENDA ARCOÍRIS 3D
            </div>
            <div className="text-[10px] font-bold text-slate-300">
              Ronda {round}/{totalRounds} • Casilla {players[activePlayerIndex]?.spaceIndex ?? 0}/20
            </div>
          </div>
        </div>
      </div>

      {/* 2. Center Players Cards or Waiting Indicator */}
      <div className="flex-1 flex items-center justify-center gap-2 overflow-x-auto py-1 scrollbar-none">
        {players.length === 0 ? (
          <div className="px-4 py-1.5 rounded-2xl bg-slate-900/80 border border-dashed border-yellow-400/30 text-yellow-300 font-bold text-xs flex items-center gap-2 animate-pulse">
            <span>📱</span>
            <span>Esperando a que los jugadores se unan con el móvil • Sala: <strong className="font-mono text-white tracking-widest">{gameState.roomCode}</strong></span>
          </div>
        ) : (
          players.map((player, idx) => {
            const char = CHARACTERS[player.characterId] || CHARACTERS.mario;
            const isActive = phase !== 'lobby' && idx === activePlayerIndex;
            const isLeader = player.id === starLeaderId && player.stars > 0;

            return (
              <div
                key={player.id}
                className={`relative px-2.5 py-1.5 rounded-2xl transition-all duration-300 flex items-center gap-2 min-w-[125px] max-w-[155px] ${
                  isActive
                    ? 'bg-slate-900/95 ring-2 ring-yellow-400 shadow-lg shadow-yellow-500/25 scale-105 z-10'
                    : 'bg-slate-900/60 border border-white/10 opacity-80 hover:opacity-100'
                }`}
              >
                {/* Leader Crown Badge */}
                {isLeader && (
                  <div className="absolute -top-2.5 -right-1 text-xs animate-bounce" title="Líder de Estrellas">
                    👑
                  </div>
                )}

                {/* Character Avatar */}
                <div className="relative shrink-0">
                  <CharacterAvatar characterId={player.characterId} size="sm" showBorder={false} />
                  <div
                    className="absolute -inset-0.5 rounded-xl border"
                    style={{ borderColor: char.neonColor }}
                  />
                </div>

                {/* Player Name and Stars */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-extrabold text-white truncate">
                      {player.name}
                    </span>
                    {player.role && (
                      <span className="text-[9px] text-slate-400 font-semibold truncate">
                        ({player.role})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-yellow-300 font-black mt-0.5">
                    <span className="flex items-center gap-0.5">
                      ★ {player.stars}
                    </span>

                    {/* 3 Medals Unlocked: 🟢 🟡 🔴 */}
                    <div className="flex items-center gap-0.5 text-[9px]" title="Medallas: Seguir, Mejorar, Dejar">
                      <span className={player.medals.seguir ? 'opacity-100 scale-110' : 'opacity-20 grayscale'}>🟢</span>
                      <span className={player.medals.mejorar ? 'opacity-100 scale-110' : 'opacity-20 grayscale'}>🟡</span>
                      <span className={player.medals.dejar ? 'opacity-100 scale-110' : 'opacity-20 grayscale'}>🔴</span>
                    </div>
                  </div>
                </div>

                {/* Active Turn Pill */}
                {isActive && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-yellow-400 text-slate-950 text-[8px] font-black tracking-wider uppercase shadow-md animate-pulse">
                    TURNO
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 3. Right Control Buttons: Minijuego & Normas */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onTriggerMinigame}
          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-extrabold text-[11px] uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-md flex items-center gap-1.5"
          title="Lanzar Minijuego Express"
        >
          <span>🎮</span>
          <span className="hidden sm:inline">Minijuego</span>
        </button>

        <button
          onClick={onOpenNormas}
          className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-white/20 text-slate-300 hover:text-white font-bold text-[11px] hover:bg-slate-800 transition-all flex items-center gap-1"
          title="Ver Reglas y Normas"
        >
          <span>📖</span>
          <span className="hidden sm:inline">Normas</span>
        </button>

        <button
          onClick={onResetGame}
          className="p-1.5 rounded-xl bg-slate-900 border border-white/15 text-slate-400 hover:text-white text-xs hover:bg-slate-800 transition-all"
          title="Reiniciar Partida"
        >
          🔄
        </button>
      </div>
    </div>
  );
};