import React, { useId, useRef } from 'react';
import { Dices, Gamepad2, X, Clock } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { ALL_MINIGAME_TYPES, MINIGAME_CATALOG } from '@/constants/minigames';
import { useDialogFocusTrap } from '@/hooks/useDialogFocusTrap';
import { MinigameType } from '@/types/game';

interface MinigamePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MinigamePickerModal: React.FC<MinigamePickerModalProps> = ({ isOpen, onClose }) => {
  const { triggerMinigame, triggerMinigameRoulette, gameState } = useGame();
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useDialogFocusTrap(dialogRef, isOpen, { restoreFocus: true, onEscape: onClose });

  if (!isOpen) return null;

  const handleLaunchRoulette = () => {
    onClose();
    triggerMinigameRoulette();
  };

  const handleSelectMinigame = (type: MinigameType) => {
    onClose();
    triggerMinigame(type);
  };

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md overflow-y-auto flex flex-col items-center p-4 pb-20 md:p-6 select-none font-game focus:outline-none"
    >
      <div className="my-auto w-full max-w-4xl rounded-3xl border-2 border-purple-400/60 bg-slate-900/95 p-4 sm:p-6 md:p-7 shadow-2xl animate-modal-spring motion-reduce:animate-none">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/50 text-purple-200 text-xs font-black uppercase tracking-wider mb-2">
              <Gamepad2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Catálogo del Facilitador</span>
            </div>
            <h2 id={titleId} className="text-2xl md:text-3xl font-black text-white">
              Elegir Minijuego
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Lanza la ruleta aleatoria o escoge directamente un minijuego (+2 Estrellas en juego).
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar selector de minijuegos"
            className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-500 text-slate-200 flex items-center justify-center cursor-pointer transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Highlighted Roulette Action (High contrast dark ink on amber-yellow gradient) */}
        <button
          type="button"
          onClick={handleLaunchRoulette}
          className="mt-5 w-full min-h-[52px] px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl hover:brightness-105 active:scale-[0.99] transition-all motion-reduce:transition-none motion-reduce:active:scale-100 flex items-center justify-center gap-2.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          <Dices className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>Girar Ruleta Aleatoria</span>
        </button>

        {/* Catalog Grid of all 10 Minigames */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ALL_MINIGAME_TYPES.map((type) => {
            const meta = MINIGAME_CATALOG[type];
            const wasLast = gameState.lastMinigameType === type;
            const durationSec = Math.round(meta.durationMs / 1000);

            return (
              <button
                key={type}
                type="button"
                onClick={() => handleSelectMinigame(type)}
                className="min-h-[112px] p-4 rounded-2xl bg-slate-950/90 hover:bg-slate-800/90 border border-slate-500 hover:border-amber-400 text-left flex flex-col justify-between gap-2.5 transition-all hover:-translate-y-0.5 active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                <div className="flex items-start justify-between gap-2 w-full">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-2xl shrink-0" aria-hidden="true">
                      {meta.emoji}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full border text-xs font-extrabold uppercase ${meta.accentClasses}`}
                    >
                      {meta.category}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-300 shrink-0">
                    <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    {durationSec}s
                  </span>
                </div>

                <div>
                  <div className="text-sm font-black text-white leading-snug">{meta.title}</div>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                    {meta.subtitle}
                  </p>
                </div>

                {wasLast && (
                  <span className="text-xs font-bold text-amber-300">
                    Jugado recientemente
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
