import React from 'react';
import { useGame } from '@/context/GameContext';
import { CHARACTERS } from '@/constants/characters';
import { CharacterAvatar } from '@/components/Common/CharacterAvatar';

interface PodiumModalProps {
  isOpen: boolean;
  onOpenRetroExport: () => void;
  onRestart: () => void;
}

export const PodiumModal: React.FC<PodiumModalProps> = ({ isOpen, onOpenRetroExport, onRestart }) => {
  const { gameState } = useGame();

  if (!isOpen) return null;

  const sortedPlayers = [...gameState.players].sort((a, b) => b.stars - a.stars);
  const first = sortedPlayers[0];
  const second = sortedPlayers[1];
  const third = sortedPlayers[2];
  const rest = sortedPlayers.slice(3);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/92 backdrop-blur-lg flex flex-col items-center justify-center p-4 animate-modal-spring">
      {/* Title */}
      <div className="text-center mb-8">
        <div className="text-sm font-pixel text-yellow-400 uppercase tracking-widest mb-1 animate-pulse">
          FIN DE LA PARTIDA • SENDA ARCOÍRIS
        </div>
        <h2 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-100 drop-shadow-lg">
          🏆 PODIO DE LA RETROSPECTIVA 🏆
        </h2>
        <p className="text-slate-300 text-sm mt-1">
          ¡Felicitaciones a todo el equipo por un sprint legendario!
        </p>
      </div>

      {/* 3D-styled Podium Pedestals */}
      <div className="flex items-end justify-center gap-4 md:gap-8 w-full max-w-3xl mb-10 px-4">
        {/* 2ND PLACE (Left) */}
        {second && (
          <div className="flex flex-col items-center flex-1 max-w-[200px]">
            <div className="mb-2">
              <CharacterAvatar characterId={second.characterId} size="lg" />
            </div>
            <div className="text-sm font-extrabold text-white truncate max-w-[140px] text-center mb-1">
              {second.name}
            </div>
            <div className="text-xs font-bold text-yellow-300 mb-2">⭐ {second.stars} Estrellas</div>

            <div className="w-full h-36 md:h-44 rounded-t-3xl bg-gradient-to-b from-slate-400 via-slate-600 to-slate-800 border-t-4 border-slate-300 shadow-2xl flex flex-col items-center justify-start pt-4">
              <span className="text-3xl md:text-4xl font-extrabold text-white text-stroke-sm">2</span>
              <span className="text-[10px] font-pixel text-slate-300 uppercase mt-1">PLATA</span>
            </div>
          </div>
        )}

        {/* 1ST PLACE (Center - Highest) */}
        {first && (
          <div className="flex flex-col items-center flex-1 max-w-[220px]">
            <div className="text-2xl animate-bounce mb-0.5">👑</div>
            <div className="mb-2 scale-110">
              <CharacterAvatar characterId={first.characterId} size="xl" />
            </div>
            <div className="text-base font-extrabold text-yellow-300 truncate max-w-[160px] text-center mb-1">
              {first.name}
            </div>
            <div className="text-sm font-extrabold text-yellow-400 mb-2 animate-pulse">
              ⭐ {first.stars} Estrellas
            </div>

            <div className="w-full h-48 md:h-60 rounded-t-3xl bg-gradient-to-b from-yellow-300 via-amber-500 to-amber-700 border-t-4 border-yellow-200 shadow-2xl shadow-yellow-500/30 flex flex-col items-center justify-start pt-4 ring-2 ring-yellow-400/50">
              <span className="text-4xl md:text-5xl font-extrabold text-white text-stroke-md">1</span>
              <span className="text-xs font-pixel text-yellow-100 uppercase mt-1">CAMPEÓN</span>
            </div>
          </div>
        )}

        {/* 3RD PLACE (Right) */}
        {third && (
          <div className="flex flex-col items-center flex-1 max-w-[200px]">
            <div className="mb-2">
              <CharacterAvatar characterId={third.characterId} size="lg" />
            </div>
            <div className="text-sm font-extrabold text-white truncate max-w-[140px] text-center mb-1">
              {third.name}
            </div>
            <div className="text-xs font-bold text-yellow-300 mb-2">⭐ {third.stars} Estrellas</div>

            <div className="w-full h-28 md:h-36 rounded-t-3xl bg-gradient-to-b from-amber-700 via-amber-800 to-amber-950 border-t-4 border-amber-600 shadow-2xl flex flex-col items-center justify-start pt-4">
              <span className="text-3xl md:text-4xl font-extrabold text-white text-stroke-sm">3</span>
              <span className="text-[10px] font-pixel text-amber-200 uppercase mt-1">BRONCE</span>
            </div>
          </div>
        )}
      </div>

      {/* 4th, 5th, 6th place runners-up */}
      {rest.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          {rest.map((p, idx) => (
            <div
              key={p.id}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-bold flex items-center gap-2"
            >
              <span>#{idx + 4}</span>
              <CharacterAvatar characterId={p.characterId} size="sm" showBorder={false} />
              <span className="text-white">{p.name}</span>
              <span className="text-yellow-400">⭐ {p.stars}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenRetroExport}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-sm uppercase hover:brightness-110 active:scale-95 transition-all shadow-xl flex items-center gap-2"
        >
          <span>📋</span>
          <span>Ver Acta y Buzones del Equipo</span>
        </button>

        <button
          onClick={onRestart}
          className="px-5 py-3.5 rounded-2xl bg-slate-800 border border-white/20 text-slate-300 hover:text-white text-xs font-bold uppercase hover:bg-slate-750 transition-all"
        >
          Nueva Partida
        </button>
      </div>
    </div>
  );
};
