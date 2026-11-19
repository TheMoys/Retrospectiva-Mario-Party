import React from 'react';
import { useGame } from '@/context/GameContext';
import { sounds } from '@/audio/soundEffects';

interface DicePadProps {
  isMyTurn: boolean;
  onOpenBackpack: () => void;
  hasPowerUps: boolean;
}

export const DicePad: React.FC<DicePadProps> = ({ isMyTurn, onOpenBackpack, hasPowerUps }) => {
  const { rollDice, gameState, myPlayerId } = useGame();
  const isRolling = gameState.phase === 'rolling';

  const handleRoll = () => {
    if (!isMyTurn || isRolling) return;
    if (navigator.vibrate) navigator.vibrate(50); // Haptic feedback
    rollDice(myPlayerId);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center gap-6 py-4">
      {/* Turn Status Banner */}
      <div className="text-center">
        {isMyTurn ? (
          <div className="animate-pulse">
            <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 font-pixel text-xs tracking-wider">
              ¡ES TU TURNO!
            </span>
            <h3 className="text-2xl font-extrabold text-white mt-2">
              Lanza el Dado 3D
            </h3>
          </div>
        ) : (
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-slate-800 border border-white/10 text-slate-400 font-pixel text-xs tracking-wider">
              TURNO EN CURSO
            </span>
            <p className="text-xs text-slate-400 mt-2">
              Observa la pantalla principal mientras juegan tus compañeros.
            </p>
          </div>
        )}
      </div>

      {/* Giant 3D-styled Tactile Roll Button */}
      <button
        onClick={handleRoll}
        disabled={!isMyTurn || isRolling}
        className={`relative w-48 h-48 md:w-56 md:h-56 rounded-3xl transition-all duration-150 flex flex-col items-center justify-center select-none active:scale-95 cursor-pointer ${
          isMyTurn && !isRolling
            ? 'bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 border-4 border-amber-900 shadow-2xl hover:scale-102 ring-4 ring-yellow-400/50'
            : 'bg-slate-800 border-4 border-slate-700 opacity-50 cursor-not-allowed shadow-none'
        }`}
        style={
          isMyTurn && !isRolling
            ? {
                boxShadow: '0 18px 40px rgba(245, 158, 11, 0.45), inset 0 -10px 0 #78350F',
              }
            : {}
        }
      >
        <span className="text-6xl md:text-7xl mb-1 filter drop-shadow">
          🎲
        </span>
        <span className="text-sm md:text-base font-extrabold text-amber-950 font-pixel uppercase tracking-wide">
          {isRolling ? 'TIRANDO...' : '¡TIRAR DADO!'}
        </span>
      </button>

      {/* Backpack Shortcut Button */}
      <button
        onClick={onOpenBackpack}
        className={`px-5 py-2.5 rounded-2xl border flex items-center gap-2 text-xs font-bold transition-all ${
          hasPowerUps
            ? 'bg-slate-800 border-amber-400/60 text-amber-300 hover:bg-slate-750 shadow-lg'
            : 'bg-slate-900 border-white/10 text-slate-500'
        }`}
      >
        <span>🎒</span>
        <span>Abrir Mochila de Objetos</span>
        {hasPowerUps && (
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        )}
      </button>
    </div>
  );
};
