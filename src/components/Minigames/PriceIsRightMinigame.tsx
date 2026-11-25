import React, { useEffect, useId, useRef, useState } from 'react';
import { Lock, Clock, Minus, Plus, Send } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { useDialogFocusTrap } from '@/hooks/useDialogFocusTrap';
import { CharacterAvatar } from '@/components/Common/CharacterAvatar';
import { MinigameResultsOverlay } from './MinigameResultsOverlay';

interface PriceIsRightProps {
  isController?: boolean;
}

export const PriceIsRightMinigame: React.FC<PriceIsRightProps> = ({ isController = false }) => {
  const { gameState, isHost, submitPriceGuess, finishMinigame, myPlayerId } = useGame();
  const { minigame, players } = gameState;
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const sliderId = useId();

  const question = minigame?.priceQuestion;
  const minVal = question?.min ?? 0;
  const maxVal = question?.max ?? 100;
  const stepVal = question?.step ?? 1;
  const initialMid = minVal + Math.round((maxVal - minVal) / 2 / stepVal) * stepVal;

  const [timeLeft, setTimeLeft] = useState(14);
  const [draftValue, setDraftValue] = useState<number>(initialMid);
  const [localGuesses, setLocalGuesses] = useState<Record<string, number>>({});
  const finishedRef = useRef(false);

  const isDialogActive =
    Boolean(minigame) &&
    minigame?.phase !== 'roulette' &&
    minigame?.phase !== 'results' &&
    !(minigame?.phase === 'instructions' && !isController);

  useDialogFocusTrap(dialogRef, isDialogActive);

  useEffect(() => {
    if (minigame?.phase === 'playing') {
      setLocalGuesses({});
      finishedRef.current = false;
      setDraftValue(initialMid);
    }
  }, [minigame?.phase, initialMid]);

  useEffect(() => {
    if (minigame?.phase === 'playing') {
      setDraftValue(initialMid);
    }
  }, [myPlayerId, initialMid, minigame?.phase]);

  useEffect(() => {
    if (!minigame || minigame.phase !== 'playing') return;

    let finishTimer: ReturnType<typeof setTimeout> | null = null;
    const syncRemaining = () => {
      const rem = Math.max(0, Math.ceil((minigame.endsAt - Date.now()) / 1000));
      setTimeLeft(rem);
      return rem;
    };

    syncRemaining();

    const submittedCount = Object.keys(minigame.priceGuesses || {}).length;
    if (!isController && isHost && players.length > 0 && submittedCount >= players.length && !finishedRef.current) {
      finishTimer = setTimeout(() => {
        if (!finishedRef.current) {
          finishedRef.current = true;
          finishMinigame();
        }
      }, 1200);
      return () => {
        if (finishTimer) clearTimeout(finishTimer);
      };
    }

    const interval = setInterval(() => {
      const rem = syncRemaining();
      const count = Object.keys(minigame.priceGuesses || {}).length;
      if (rem <= 0 || (players.length > 0 && count >= players.length)) {
        clearInterval(interval);
        if (!isController && isHost && !finishTimer && !finishedRef.current) {
          finishTimer = setTimeout(() => {
            if (!finishedRef.current) {
              finishedRef.current = true;
              finishMinigame();
            }
          }, 1200);
        }
      }
    }, 250);

    return () => {
      clearInterval(interval);
      if (finishTimer) clearTimeout(finishTimer);
    };
  }, [
    minigame?.phase,
    minigame?.endsAt,
    minigame?.priceGuesses,
    players.length,
    isController,
    isHost,
    finishMinigame,
  ]);

  if (!minigame || minigame.phase === 'roulette') return null;

  if (minigame.phase === 'results') {
    return <MinigameResultsOverlay isController={isController} />;
  }

  if (minigame.phase === 'instructions') {
    if (isController) {
      return (
        <div
          ref={dialogRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="fixed inset-0 z-50 bg-slate-950/95 overflow-y-auto flex flex-col items-center p-6 pb-20 text-center select-none font-game animate-fade-in motion-reduce:animate-none focus:outline-none"
        >
          <div className="my-auto flex flex-col items-center">
            <div className="w-16 h-16 rounded-3xl bg-indigo-500/20 border-2 border-indigo-400 flex items-center justify-center text-3xl mb-3 animate-bounce-subtle motion-reduce:animate-none">
              <span aria-hidden="true">📏</span>
            </div>
            <span className="text-xs font-black text-indigo-300 uppercase tracking-widest mb-1">
              Estimación en Preparación
            </span>
            <h2 id={titleId} className="text-xl font-black text-white">
              ¡Afinando la Calculadora!
            </h2>
            <p className="text-xs text-slate-300 mt-2 max-w-xs leading-relaxed">
              Gana quien acierte o quede más cerca de la cifra real sin pasarse.
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  const guesses = minigame.priceGuesses || {};
  const mySubmitted = guesses[myPlayerId] ?? localGuesses[myPlayerId];
  const hasSubmitted = mySubmitted !== undefined;
  const unitLabel = question?.unit ? ` ${question.unit}` : '';

  const adjustValue = (delta: number) => {
    setDraftValue((prev) => Math.max(minVal, Math.min(maxVal, prev + delta)));
  };

  const handleSubmit = () => {
    if (hasSubmitted || timeLeft <= 0) return;
    setLocalGuesses((prev) => ({ ...prev, [myPlayerId]: draftValue }));
    submitPriceGuess(myPlayerId, draftValue);
  };

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className={`fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md overflow-y-auto flex flex-col items-center p-4 focus:outline-none ${
        isController ? 'pb-20' : 'pb-20 md:pb-4'
      }`}
    >
      <div className="my-auto flex flex-col items-center w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-4 max-w-xl">
          <div className="text-xs font-game font-black uppercase tracking-widest text-indigo-300 mb-1">
            MINIJUEGO DE ESTIMACIÓN • ¡PREMIO: +2 ESTRELLAS!
          </div>
          <h2 id={titleId} className="text-2xl md:text-4xl font-extrabold drop-shadow-md">
            <span aria-hidden="true" className="text-white mr-2">
              📏
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-sky-300 to-cyan-300">
              EL PRECIO JUSTO DEV
            </span>
          </h2>

          <div className="mt-3 p-4 rounded-2xl bg-slate-900 border border-indigo-400/40 text-sm md:text-xl font-bold text-white shadow-lg">
            {question?.question || '¿Cuál es el valor técnico exacto?'}
          </div>

          <div className="mt-2 inline-flex flex-wrap items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-white/15 text-xs font-bold text-slate-200">
            <span>
              Rango: {minVal} – {maxVal}
              {unitLabel}
            </span>
            <span>·</span>
            <span>{timeLeft}s</span>
          </div>
        </div>

        {isController ? (
          <div className="w-full max-w-sm">
            {hasSubmitted ? (
              <div className="p-6 rounded-3xl bg-slate-900/95 border-2 border-indigo-400/70 text-center shadow-2xl">
                <div role="status" aria-live="polite">
                  <Lock className="w-10 h-10 text-indigo-300 mx-auto mb-2" aria-hidden="true" />
                  <div className="text-sm font-black uppercase text-indigo-200">
                    Estimación enviada
                  </div>
                  <div className="mt-2 font-mono text-3xl font-black text-white tabular-nums">
                    {mySubmitted}
                    {unitLabel}
                  </div>
                </div>
                <p className="text-xs text-slate-300 mt-2">
                  Esperando al resto del equipo ({timeLeft}s)...
                </p>
              </div>
            ) : (
              <div className="p-5 rounded-3xl bg-slate-900/95 border-2 border-indigo-400/50 shadow-2xl space-y-4">
                {/* Numeric Display + Step Controls (>= 3:1 UI border contrast) */}
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    aria-label={`Restar ${stepVal}`}
                    onClick={() => adjustValue(-stepVal)}
                    className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-500 text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300"
                  >
                    <Minus className="w-5 h-5" aria-hidden="true" />
                  </button>

                  <div className="text-center">
                    <div className="font-mono text-3xl font-black text-yellow-300 tabular-nums">
                      {draftValue}
                    </div>
                    {question?.unit && (
                      <div className="text-xs font-bold text-slate-300">{question.unit}</div>
                    )}
                  </div>

                  <button
                    type="button"
                    aria-label={`Sumar ${stepVal}`}
                    onClick={() => adjustValue(stepVal)}
                    className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-500 text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300"
                  >
                    <Plus className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>

                {/* Tactile Range Slider with focus-visible ring & valuetext */}
                <div>
                  <label htmlFor={sliderId} className="sr-only">
                    Selector numérico de estimación
                  </label>
                  <input
                    id={sliderId}
                    type="range"
                    min={minVal}
                    max={maxVal}
                    step={stepVal}
                    value={draftValue}
                    aria-valuetext={question?.unit ? `${draftValue} ${question.unit}` : `${draftValue}`}
                    onChange={(e) => setDraftValue(Number(e.target.value))}
                    className="w-full h-11 accent-amber-400 cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={timeLeft <= 0}
                  className="w-full min-h-[48px] px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl hover:brightness-105 active:scale-95 transition-all motion-reduce:transition-none motion-reduce:active:scale-100 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                  <Send className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Confirmar Estimación</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Host Secret Status Cards */
          <div className="w-full bg-slate-900/90 border border-white/15 rounded-2xl p-5 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">
              <span>Estimaciones secretas (sin pasarse)</span>
              <span className="text-amber-300">
                {Object.keys(guesses).length} / {players.length} listos
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {players.map((player) => {
                const picked = guesses[player.id] !== undefined;
                return (
                  <div
                    key={player.id}
                    className={`rounded-xl p-3 border flex items-center gap-3 ${
                      picked
                        ? 'bg-indigo-500/20 border-indigo-400/70'
                        : 'bg-slate-800/90 border-white/15'
                    }`}
                  >
                    <CharacterAvatar
                      characterId={player.characterId}
                      size="sm"
                      showBorder={false}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-extrabold text-white truncate">
                        {player.name}
                      </div>
                      <div className="text-xs font-bold text-slate-300 inline-flex items-center gap-1 mt-0.5">
                        {picked ? (
                          <>
                            <Lock className="w-3.5 h-3.5 text-indigo-300" aria-hidden="true" />
                            <span className="text-indigo-200">Lista</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                            <span>Calculando...</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
