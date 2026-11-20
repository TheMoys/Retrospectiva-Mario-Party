import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface CinematicDiceOverlayProps {
  rolls: number[]; // [4] or [3, 5]
  playerName: string;
  isRolling: boolean;
}

export const CinematicDiceOverlay: React.FC<CinematicDiceOverlayProps> = ({
  rolls,
  playerName,
  isRolling,
}) => {
  const total = rolls.reduce((a, b) => a + b, 0);

  // Trigger golden star sparkles when dice lands
  useEffect(() => {
    if (!isRolling && rolls.length > 0 && total > 0) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.55 },
        colors: ['#FFD700', '#FFA500', '#FFFFFF', '#38BDF8'],
        disableForReducedMotion: true,
      });
    }
  }, [isRolling, rolls, total]);

  if (!isRolling && rolls.length === 0) return null;

  return (
    <div className="fixed inset-0 z-40 pointer-events-none flex flex-col items-center justify-center select-none">
      <div className="flex flex-col items-center bg-slate-950/85 backdrop-blur-md px-8 py-6 rounded-3xl border-2 border-yellow-400/50 shadow-[0_0_50px_rgba(255,215,0,0.3)] animate-modal-spring pointer-events-auto">
        <span className="text-xs font-pixel text-yellow-300 uppercase tracking-widest mb-3">
          TIRADA DE {playerName}
        </span>

        {/* Dice visual container */}
        <div className="flex items-center gap-6 my-2">
          {rolls.map((val, idx) => (
            <div
              key={idx}
              className={`w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 border-4 border-amber-900 shadow-2xl flex items-center justify-center text-5xl font-black text-amber-950 font-pixel text-stroke-sm ${
                isRolling ? 'dice-rolling' : 'dice-landed'
              }`}
              style={{
                boxShadow: '0 16px 32px rgba(245, 158, 11, 0.4), inset 0 -6px 0 #78350F',
                animationDelay: `${idx * 120}ms`,
              }}
            >
              {isRolling ? '?' : val}
            </div>
          ))}
        </div>

        {/* Result text */}
        {!isRolling && (
          <div className="mt-4 text-center">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Avanza</span>
            <div className="text-4xl font-black text-yellow-300 font-game text-stroke-sm mt-0.5">
              {total} CASILLAS
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
