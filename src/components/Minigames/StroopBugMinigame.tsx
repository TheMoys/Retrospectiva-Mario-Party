import React, { useEffect, useId, useRef, useState } from 'react';
import { CheckCircle2, Palette, Type } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { STROOP_COLORS, STROOP_COLOR_MAP } from '@/constants/minigames';
import { useDialogFocusTrap } from '@/hooks/useDialogFocusTrap';
import { StroopColorId } from '@/types/game';
import { sounds } from '@/audio/soundEffects';
import { CharacterAvatar } from '@/components/Common/CharacterAvatar';
import { MinigameResultsOverlay } from './MinigameResultsOverlay';

interface StroopBugProps {
  isController?: boolean;
}

const TOTAL_PROMPTS = 6;

export const StroopBugMinigame: React.FC<StroopBugProps> = ({ isController = false }) => {
  const { gameState, isHost, submitStroopProgress, finishMinigame, myPlayerId } = useGame();
  const { minigame, players } = gameState;
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const prompts = minigame?.stroopPrompts || [];
  const serverEntry = minigame?.stroopEntries?.[myPlayerId];

  const [timeLeft, setTimeLeft] = useState(18);
  const [promptIdx, setPromptIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [finishedLocal, setFinishedLocal] = useState(false);

  const startPerfRef = useRef<number>(0);
  const finishedRef = useRef<boolean>(false);

  const isDialogActive =
    Boolean(minigame) &&
    minigame?.phase !== 'roulette' &&
    minigame?.phase !== 'results' &&
    !(minigame?.phase === 'instructions' && !isController);

  useDialogFocusTrap(dialogRef, isDialogActive);

  // Sync local Stroop session on playing start / Demo player change
  useEffect(() => {
    if (minigame?.phase !== 'playing') return;

    finishedRef.current = false;
    if (startPerfRef.current === 0) {
      startPerfRef.current = performance.now();
    }

    if (serverEntry?.finished) {
      setCorrect(serverEntry.correct);
      setWrong(serverEntry.wrong);
      setPromptIdx(TOTAL_PROMPTS);
      setFinishedLocal(true);
    } else {
      const answeredCount = (serverEntry?.correct || 0) + (serverEntry?.wrong || 0);
      setCorrect(serverEntry?.correct || 0);
      setWrong(serverEntry?.wrong || 0);
      setPromptIdx(Math.min(TOTAL_PROMPTS, answeredCount));
      setFinishedLocal(false);
    }
  }, [minigame?.phase, myPlayerId]);

  useEffect(() => {
    if (minigame?.phase !== 'playing') {
      startPerfRef.current = 0;
    }
  }, [minigame?.phase]);

  // Host timer + all players completed check
  useEffect(() => {
    if (!minigame || minigame.phase !== 'playing') return;

    let finishTimer: ReturnType<typeof setTimeout> | null = null;
    const syncRemaining = () => {
      const rem = Math.max(0, Math.ceil((minigame.endsAt - Date.now()) / 1000));
      setTimeLeft(rem);
      return rem;
    };

    syncRemaining();

    const everyoneFinished =
      players.length > 0 &&
      players.every((p) => Boolean(minigame.stroopEntries?.[p.id]?.finished));

    if (!isController && isHost && everyoneFinished && !finishedRef.current) {
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
      const allDone =
        players.length > 0 &&
        players.every((p) => Boolean(minigame.stroopEntries?.[p.id]?.finished));
      if (rem <= 0 || allDone) {
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
    minigame?.stroopEntries,
    players,
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
            <div className="w-16 h-16 rounded-3xl bg-fuchsia-500/20 border-2 border-fuchsia-400 flex items-center justify-center text-3xl mb-3 animate-bounce-subtle motion-reduce:animate-none">
              <span aria-hidden="true">🎨</span>
            </div>
            <span className="text-xs font-black text-fuchsia-300 uppercase tracking-widest mb-1">
              Test Stroop en Preparación
            </span>
            <h2 id={titleId} className="text-xl font-black text-white">
              ¡No Caigas en la Trampa Visual!
            </h2>
            <p className="text-xs text-slate-300 mt-2 max-w-xs leading-relaxed">
              Lee con atención si cada reto pide el COLOR de tinta o la PALABRA escrita.
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  const totalCount = prompts.length || TOTAL_PROMPTS;
  const activePrompt = prompts[promptIdx];
  const isCompleted = finishedLocal || Boolean(serverEntry?.finished) || promptIdx >= totalCount;

  const handlePickColor = (picked: StroopColorId) => {
    if (isCompleted || !activePrompt || timeLeft <= 0 || minigame.phase !== 'playing') return;

    const expected =
      activePrompt.rule === 'ink' ? activePrompt.inkColor : activePrompt.wordColor;
    const isRight = picked === expected;
    const nextCorrect = correct + (isRight ? 1 : 0);
    const nextWrong = wrong + (isRight ? 0 : 1);
    const nextIdx = promptIdx + 1;
    const nowDone = nextIdx >= totalCount;
    const elapsedMs = Math.max(0, Math.round(performance.now() - startPerfRef.current));

    if (isRight) {
      sounds.playCoin();
    } else {
      sounds.playSlip();
    }

    setCorrect(nextCorrect);
    setWrong(nextWrong);
    setPromptIdx(nextIdx);
    if (nowDone) setFinishedLocal(true);

    submitStroopProgress(myPlayerId, nextCorrect, nextWrong, elapsedMs, nowDone);
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
        <div className="text-center mb-4">
          <div className="text-xs font-game font-black uppercase tracking-widest text-fuchsia-300 mb-1">
            MINIJUEGO DE AGILIDAD • ¡PREMIO: +2 ESTRELLAS!
          </div>
          <h2 id={titleId} className="text-2xl md:text-4xl font-extrabold drop-shadow-md">
            <span aria-hidden="true" className="text-white mr-2">
              🎨
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-pink-300 to-amber-300">
              EL BUG DE COLOR
            </span>
          </h2>
          <div className="mt-2 inline-flex flex-wrap items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-fuchsia-400/50 text-xs font-bold text-slate-100">
            <span>{timeLeft}s restantes</span>
            {isController && (
              <>
                <span>·</span>
                <span className="text-emerald-300 font-black">
                  {correct}/{totalCount} aciertos
                </span>
              </>
            )}
          </div>
        </div>

        {isController ? (
          <div className="w-full max-w-sm">
            {isCompleted ? (
              <div className="p-6 rounded-3xl bg-slate-900/95 border-2 border-emerald-400/70 text-center shadow-2xl">
                <div role="status" aria-live="polite">
                  <CheckCircle2
                    className="w-12 h-12 text-emerald-400 mx-auto mb-2"
                    aria-hidden="true"
                  />
                  <div className="text-sm font-black uppercase text-emerald-300">
                    ¡Retos completados!
                  </div>
                  <div className="mt-2 font-mono text-3xl font-black text-white tabular-nums">
                    {correct}/{totalCount} aciertos
                  </div>
                </div>
                <p className="text-xs text-slate-300 mt-1.5">
                  Esperando resultados ({timeLeft}s)...
                </p>
              </div>
            ) : (
              activePrompt && (
                <>
                  {/* Active Prompt Card */}
                  <div
                    data-stroop-rule={activePrompt.rule}
                    data-stroop-word={activePrompt.wordColor}
                    data-stroop-ink={activePrompt.inkColor}
                    className="p-5 rounded-3xl bg-slate-900/95 border-2 border-white/15 text-center shadow-2xl mb-4"
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-black uppercase tracking-wider mb-3 ${
                        activePrompt.rule === 'ink'
                          ? 'bg-fuchsia-500/20 border-fuchsia-400 text-fuchsia-200'
                          : 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                      }`}
                    >
                      {activePrompt.rule === 'ink' ? (
                        <>
                          <Palette className="w-4 h-4 shrink-0" aria-hidden="true" />
                          <span>PULSA EL COLOR DE LA TINTA</span>
                        </>
                      ) : (
                        <>
                          <Type className="w-4 h-4 shrink-0" aria-hidden="true" />
                          <span>PULSA LA PALABRA ESCRITA</span>
                        </>
                      )}
                    </div>

                    <div className="py-3 px-4 rounded-2xl bg-slate-950 border border-white/10">
                      <span
                        className={`text-4xl sm:text-5xl font-black tracking-wider ${
                          STROOP_COLOR_MAP[activePrompt.inkColor].inkTextClass
                        }`}
                      >
                        {STROOP_COLOR_MAP[activePrompt.wordColor].word}
                      </span>
                    </div>

                    <div className="mt-2.5 text-xs font-bold text-slate-300">
                      Reto {promptIdx + 1} de {totalCount}
                    </div>
                  </div>

                  {/* 2x2 High-Contrast Color Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    {STROOP_COLORS.map((colorDef) => (
                      <button
                        key={colorDef.id}
                        type="button"
                        data-color-id={colorDef.id}
                        aria-label={`Color ${colorDef.word}`}
                        onClick={() => handlePickColor(colorDef.id)}
                        disabled={timeLeft <= 0}
                        className={`min-h-[76px] rounded-2xl border-2 text-base font-black tracking-wider uppercase shadow-xl transition-all active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white ${colorDef.buttonClass}`}
                      >
                        {colorDef.word}
                      </button>
                    ))}
                  </div>
                </>
              )
            )}
          </div>
        ) : (
          /* Host Live Race Progress */
          <div className="w-full bg-slate-900/90 border border-white/15 rounded-2xl p-5 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">
              <span>Progreso Mental en Vivo</span>
              <span className="text-fuchsia-300">Meta: {totalCount} retos</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {players.map((player) => {
                const entry = minigame.stroopEntries?.[player.id];
                const pCorrect = entry?.correct || 0;
                const pWrong = entry?.wrong || 0;
                const done = Boolean(entry?.finished);
                const pct = Math.min(100, Math.round(((pCorrect + pWrong) / totalCount) * 100));

                return (
                  <div
                    key={player.id}
                    className={`p-3 rounded-xl border ${
                      done
                        ? 'bg-emerald-950/60 border-emerald-400/70'
                        : 'bg-slate-800/90 border-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <CharacterAvatar
                          characterId={player.characterId}
                          size="sm"
                          showBorder={false}
                        />
                        <span className="text-xs font-extrabold text-white truncate">
                          {player.name}
                        </span>
                      </div>
                      <span className="text-xs font-black text-yellow-300 shrink-0 tabular-nums">
                        {pCorrect}/{totalCount} {done && entry ? `(${(entry.totalTimeMs / 1000).toFixed(1)}s)` : ''}
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden mb-1">
                      <div
                        className={`h-full transition-all duration-200 motion-reduce:transition-none ${
                          done ? 'bg-emerald-400' : 'bg-fuchsia-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="text-xs font-semibold text-slate-300 inline-flex items-center gap-1">
                      {done ? (
                        <>
                          <span aria-hidden="true">✅</span>
                          <span>Completado</span>
                        </>
                      ) : (
                        `${pCorrect + pWrong}/${totalCount} respondidos`
                      )}
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
