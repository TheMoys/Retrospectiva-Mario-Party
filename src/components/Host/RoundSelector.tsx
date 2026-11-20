import React from 'react';
import { Clock, Flag, Users } from 'lucide-react';
import { sounds } from '@/audio/soundEffects';

export interface RoundOption {
  rounds: number;
  label: string;
  durationMin: number;
  description: string;
}

export const ROUND_OPTIONS: RoundOption[] = [
  { rounds: 2, label: 'Express', durationMin: 15, description: 'Check-in rápido de sprint' },
  { rounds: 3, label: 'Dinámica', durationMin: 25, description: 'Ritmo ágil y directo' },
  { rounds: 4, label: 'Estándar', durationMin: 35, description: 'Equilibrio perfecto de retro' },
  { rounds: 5, label: 'Profunda', durationMin: 45, description: 'Análisis exhaustivo del equipo' },
  { rounds: 6, label: 'Épica', durationMin: 60, description: 'Retro de fin de trimestre' },
];

interface RoundSelectorProps {
  selectedRounds: number;
  playerCount: number;
  onChange: (rounds: number) => void;
  disabled?: boolean;
}

export const RoundSelector: React.FC<RoundSelectorProps> = ({
  selectedRounds,
  playerCount,
  onChange,
  disabled = false,
}) => {
  const activeOption = ROUND_OPTIONS.find((o) => o.rounds === selectedRounds) || ROUND_OPTIONS[2];
  const effectivePlayers = Math.max(playerCount, 1);
  const totalTurns = effectivePlayers * selectedRounds;

  const handleSelect = (rounds: number) => {
    if (disabled || rounds === selectedRounds) return;
    sounds.playCoin();
    onChange(rounds);
  };

  return (
    <div className="w-full bg-slate-900/90 border border-white/10 rounded-3xl p-4 md:p-5 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
            <Flag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-extrabold text-white tracking-wide font-game">
              Duración de la Retrospectiva
            </h3>
            <p className="text-[11px] text-slate-400">
              Selecciona el número de rondas del circuito antes de iniciar
            </p>
          </div>
        </div>

        {/* Dynamic Estimated Time Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/90 border border-white/15 text-xs font-bold text-amber-300 shadow-inner">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>~{activeOption.durationMin} min estimados</span>
        </div>
      </div>

      {/* Segmented Pill Selector (WCAG AAA) */}
      <div
        role="radiogroup"
        aria-label="Seleccionar número de rondas"
        className="grid grid-cols-5 gap-2 p-1.5 bg-slate-950/80 rounded-2xl border border-white/5"
      >
        {ROUND_OPTIONS.map((opt) => {
          const isSelected = opt.rounds === selectedRounds;
          return (
            <button
              key={opt.rounds}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => handleSelect(opt.rounds)}
              className={`relative group flex flex-col items-center justify-center py-2.5 px-1.5 rounded-xl transition-all duration-200 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                isSelected
                  ? 'bg-gradient-to-b from-amber-400 to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/30 scale-102 border-2 border-yellow-200 font-extrabold'
                  : 'bg-slate-900/60 hover:bg-slate-800/80 text-slate-200 hover:text-white border border-white/10 active:scale-98'
              }`}
            >
              {/* Star Badge for recommended */}
              {opt.rounds === 4 && (
                <span
                  className={`absolute -top-2.5 px-1.5 py-0.2 rounded-full text-[8px] font-bold font-pixel tracking-wider shadow ${
                    isSelected
                      ? 'bg-slate-950 text-amber-300 border border-amber-400'
                      : 'bg-amber-500 text-slate-950'
                  }`}
                >
                  POPULAR
                </span>
              )}

              {/* Number */}
              <span
                className={`text-xl md:text-2xl font-black font-pixel leading-none ${
                  isSelected ? 'text-slate-950' : 'text-white'
                }`}
              >
                {opt.rounds}
              </span>

              {/* Label */}
              <span
                className={`text-[10px] md:text-[11px] font-bold mt-1 tracking-tight truncate w-full text-center ${
                  isSelected ? 'text-slate-950' : 'text-slate-300'
                }`}
              >
                {opt.label}
              </span>

              {/* Minutes tag */}
              <span
                className={`text-[9px] mt-0.5 ${
                  isSelected ? 'text-amber-950 font-semibold' : 'text-slate-400'
                }`}
              >
                {opt.durationMin}m
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer Calculation Info */}
      <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 px-1">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            <strong className="text-white">{playerCount}</strong> jugadores ×{' '}
            <strong className="text-white">{selectedRounds}</strong> rondas
          </span>
        </div>
        <div className="font-pixel text-[10px] text-amber-300">
          TOTAL: {totalTurns} TURNOS
        </div>
      </div>
    </div>
  );
};
