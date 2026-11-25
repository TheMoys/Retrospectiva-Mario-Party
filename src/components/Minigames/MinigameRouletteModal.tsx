import React, { useEffect, useId, useRef, useState } from 'react';
import { Dices, Play, Sparkles } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { ALL_MINIGAME_TYPES, MINIGAME_CATALOG } from '@/constants/minigames';
import { useDialogFocusTrap } from '@/hooks/useDialogFocusTrap';
import { sounds } from '@/audio/soundEffects';

interface MinigameRouletteModalProps {
  isController?: boolean;
}

export const MinigameRouletteModal: React.FC<MinigameRouletteModalProps> = ({
  isController = false,
}) => {
  const { gameState, isHost, finishMinigameRoulette } = useGame();
  const { phase, minigame } = gameState;
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const isDialogActive = phase === 'minigame' && minigame?.phase === 'roulette';
  useDialogFocusTrap(dialogRef, isDialogActive);

  const targetType = minigame?.type || 'block_smash';
  const targetIndex = Math.max(0, ALL_MINIGAME_TYPES.indexOf(targetType));

  const [highlightIndex, setHighlightIndex] = useState<number>(targetIndex);
  const [landed, setLanded] = useState<boolean>(false);

  useEffect(() => {
    if (!isDialogActive) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setHighlightIndex(targetIndex);
      setLanded(true);
      sounds.playStarFanfare();
      return;
    }

    setLanded(false);

    // Build an 18-step decelerating spin that deterministically lands on targetIndex
    const totalSteps = 18;
    const totalCount = ALL_MINIGAME_TYPES.length;
    const startIdx = (targetIndex - (totalSteps % totalCount) + totalCount) % totalCount;

    const timers: ReturnType<typeof setTimeout>[] = [];
    let accumulatedMs = 0;

    for (let step = 1; step <= totalSteps; step++) {
      const progress = step / totalSteps;
      const delayMs = progress < 0.55 ? 60 : progress < 0.85 ? 110 : 185;
      accumulatedMs += delayMs;
      const idx = (startIdx + step) % totalCount;
      const isFinalStep = step === totalSteps;

      const t = setTimeout(() => {
        setHighlightIndex(idx);
        if (isFinalStep) {
          setLanded(true);
          sounds.playStarFanfare();
        } else {
          sounds.playRouletteTick();
        }
      }, accumulatedMs);
      timers.push(t);
    }

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [phase, minigame?.phase, targetIndex]);

  // Host automatically transitions from roulette landing -> instructions after 2.0s
  useEffect(() => {
    if (!isHost || !landed || phase !== 'minigame' || minigame?.phase !== 'roulette') return;
    const autoTimer = setTimeout(() => {
      finishMinigameRoulette();
    }, 2000);
    return () => clearTimeout(autoTimer);
  }, [isHost, landed, phase, minigame?.phase, finishMinigameRoulette]);

  if (phase !== 'minigame' || minigame?.phase !== 'roulette') return null;

  const activeMeta = MINIGAME_CATALOG[ALL_MINIGAME_TYPES[highlightIndex] || targetType];
  const selectedMeta = MINIGAME_CATALOG[targetType];

  if (isController) {
    return (
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl overflow-y-auto flex flex-col items-center p-4 pb-20 text-center select-none font-game focus:outline-none"
      >
        <div className="my-auto w-full max-w-sm rounded-3xl border-2 border-purple-400/60 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-5 shadow-2xl animate-modal-spring motion-reduce:animate-none">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/50 text-purple-200 text-xs font-extrabold uppercase tracking-wider mb-3">
            <Dices className="w-3.5 h-3.5 text-yellow-300" aria-hidden="true" />
            <span>Ruleta de Minijuego</span>
          </div>

          <h2 id={titleId} className="text-xl font-black text-white">
            {landed ? '¡Minijuego Elegido!' : 'Sorteando Minijuego...'}
          </h2>

          <div
            className={`mt-4 p-4 rounded-2xl border-2 transition-all duration-150 motion-reduce:transition-none motion-reduce:scale-100 ${
              landed
                ? 'bg-amber-500/20 border-yellow-400 shadow-lg scale-[1.02]'
                : 'bg-slate-900 border-white/15'
            }`}
          >
            <div className="text-5xl mb-2" aria-hidden="true">
              {activeMeta.emoji}
            </div>
            <div className="text-xs font-black uppercase tracking-wider text-yellow-300 mb-1">
              {activeMeta.category}
            </div>
            <div className="text-base font-black text-white leading-snug">
              {activeMeta.title}
            </div>
          </div>

          <p role="status" aria-live="polite" className="mt-4 text-xs text-slate-300 font-semibold">
            {landed
              ? `¡Minijuego elegido: ${selectedMeta.title}! Preparando reglas de ${selectedMeta.shortName}...`
              : 'Sorteando minijuego. ¡Mira la pantalla principal para ver cuál toca!'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl overflow-y-auto flex flex-col items-center p-4 pb-20 md:p-6 select-none font-game focus:outline-none"
    >
      <div className="my-auto w-full max-w-3xl rounded-3xl border-2 border-purple-400/70 bg-gradient-to-b from-slate-900/95 via-slate-950 to-slate-900/95 p-5 sm:p-6 md:p-8 shadow-2xl text-center animate-modal-spring motion-reduce:animate-none">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/50 text-purple-200 text-xs font-black uppercase tracking-widest mb-3 shadow">
          <Dices className="w-4 h-4 text-yellow-300" aria-hidden="true" />
          <span>Ruleta de Minijuegos</span>
        </div>

        <h2 id={titleId} className="text-2xl md:text-4xl font-black drop-shadow-md">
          <span aria-hidden="true" className="text-white mr-2">
            {landed ? '🎯' : '🎰'}
          </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-pink-400">
            {landed ? `¡TOCA ${selectedMeta.title}!` : 'GIRANDO LA RULETA...'}
          </span>
        </h2>
        <p className="text-xs md:text-sm text-slate-300 mt-1 font-medium">
          {landed ? selectedMeta.subtitle : 'El destino elegirá el próximo reto de +2 Estrellas'}
        </p>

        {/* All 10 Minigames Roulette Grid (5 columns desktop, 2 columns mobile = symmetric 2x5 / 5x2) */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {ALL_MINIGAME_TYPES.map((type, idx) => {
            const meta = MINIGAME_CATALOG[type];
            const isHighlighted = idx === highlightIndex;
            const isWinnerLocked = landed && isHighlighted;
            const hasOddOrphanOnMobile =
              ALL_MINIGAME_TYPES.length % 2 === 1 && idx === ALL_MINIGAME_TYPES.length - 1;

            return (
              <div
                key={type}
                data-minigame-card={type}
                data-highlighted={isHighlighted ? 'true' : 'false'}
                className={`rounded-2xl border-2 p-2.5 sm:p-3 flex flex-col items-center justify-center text-center transition-all duration-150 motion-reduce:transition-none motion-reduce:scale-100 ${
                  hasOddOrphanOnMobile ? 'col-span-2 sm:col-span-1' : ''
                } ${
                  isWinnerLocked
                    ? 'bg-gradient-to-b from-amber-500/30 to-yellow-500/20 border-yellow-300 ring-4 ring-yellow-400/50 scale-105 shadow-2xl'
                    : isHighlighted
                    ? 'bg-slate-800 border-cyan-300 ring-2 ring-cyan-400/60 scale-[1.03] shadow-xl'
                    : 'bg-slate-900/95 border-white/15 text-slate-300'
                }`}
              >
                <span className="text-2xl sm:text-3xl mb-1.5" aria-hidden="true">
                  {meta.emoji}
                </span>
                <span className="text-xs font-extrabold text-yellow-300 uppercase tracking-wider">
                  {meta.category}
                </span>
                <span className="text-xs font-black text-white mt-0.5 leading-tight">
                  {meta.shortName}
                </span>
              </div>
            );
          })}
        </div>

        {/* Landed Summary & Host Fast-Forward CTA */}
        <div role="status" aria-live="polite" className="mt-6 flex flex-col items-center gap-3">
          {landed ? (
            <>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/20 border border-amber-400/60 text-amber-200 text-xs font-bold">
                <Sparkles className="w-4 h-4 text-yellow-300 shrink-0" aria-hidden="true" />
                <span>{selectedMeta.reward}</span>
              </div>

              {isHost && (
                <button
                  type="button"
                  onClick={finishMinigameRoulette}
                  className="min-h-[44px] px-7 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl hover:brightness-105 active:scale-95 transition-all motion-reduce:transition-none motion-reduce:active:scale-100 inline-flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                  <Play className="w-4 h-4 fill-current shrink-0" aria-hidden="true" />
                  <span>¡A Jugar!</span>
                </button>
              )}
            </>
          ) : (
            <div className="text-xs font-bold text-slate-300 uppercase tracking-widest">
              Seleccionando reto aleatorio sin repetir el anterior...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
