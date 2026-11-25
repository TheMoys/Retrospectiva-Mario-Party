import React, { useEffect, useId, useRef, useState } from 'react';
import { Music } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { RHYTHM_LANES } from '@/constants/minigames';
import { useDialogFocusTrap } from '@/hooks/useDialogFocusTrap';
import { RhythmLane, RhythmNote } from '@/types/game';
import { sounds } from '@/audio/soundEffects';
import { CharacterAvatar } from '@/components/Common/CharacterAvatar';
import { MinigameResultsOverlay } from './MinigameResultsOverlay';

interface SprintRhythmProps {
  isController?: boolean;
}

interface VisibleNote extends RhythmNote {
  progress: number; // 0 = top, 0.84 = hit zone, >1 = past bottom
}

const FALL_WINDOW_MS = 1400;
const HIT_LINE_RATIO = 0.84;
const GOOD_WINDOW_MS = 380;
const PERFECT_WINDOW_MS = 180;

export const SprintRhythmMinigame: React.FC<SprintRhythmProps> = ({ isController = false }) => {
  const { gameState, isHost, submitRhythmScore, finishMinigame, myPlayerId } = useGame();
  const { minigame, players } = gameState;
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const notes = minigame?.rhythmNotes || [];

  const [timeLeft, setTimeLeft] = useState(14);
  const [visibleNotes, setVisibleNotes] = useState<VisibleNote[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [feedback, setFeedback] = useState<{ icon: string; text: string }>({
    icon: '🎧',
    text: '¡Sigue el ritmo!',
  });
  const [flashedLane, setFlashedLane] = useState<RhythmLane | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() =>
    typeof window !== 'undefined' &&
    Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  );

  const startPerfRef = useRef<number>(0);
  const hitIdsRef = useRef<Set<number>>(new Set());
  const missedIdsRef = useRef<Set<number>>(new Set());
  const scoreRef = useRef(0);
  const hitsRef = useRef(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const missesRef = useRef(0);
  const finishedRef = useRef(false);

  const isDialogActive =
    Boolean(minigame) &&
    minigame?.phase !== 'roulette' &&
    minigame?.phase !== 'results' &&
    !(minigame?.phase === 'instructions' && !isController);

  useDialogFocusTrap(dialogRef, isDialogActive);

  // Track OS prefers-reduced-motion preference dynamically
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setPrefersReducedMotion(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  // Reset on enter playing / switch player
  useEffect(() => {
    if (minigame?.phase !== 'playing') return;

    startPerfRef.current = performance.now();
    hitIdsRef.current = new Set();
    missedIdsRef.current = new Set();
    scoreRef.current = 0;
    hitsRef.current = 0;
    comboRef.current = 0;
    maxComboRef.current = 0;
    missesRef.current = 0;
    finishedRef.current = false;
    setScore(0);
    setCombo(0);
    setFeedback({ icon: '🎧', text: '¡Prepárate!' });
  }, [minigame?.phase, myPlayerId]);

  // Controller falling note animation loop (stationary hit-zone cues under prefers-reduced-motion)
  useEffect(() => {
    if (!isController || minigame?.phase !== 'playing') return;

    const computeNotes = () => {
      const elapsed = performance.now() - startPerfRef.current;
      const nextVisible: VisibleNote[] = [];

      for (const note of notes) {
        if (hitIdsRef.current.has(note.id) || missedIdsRef.current.has(note.id)) continue;

        const dtToHit = note.timeMs - elapsed;
        if (dtToHit < -GOOD_WINDOW_MS) {
          missedIdsRef.current.add(note.id);
          missesRef.current += 1;
          comboRef.current = 0;
          setCombo(0);
          continue;
        }

        if (prefersReducedMotion) {
          if (Math.abs(dtToHit) <= GOOD_WINDOW_MS) {
            nextVisible.push({ ...note, progress: HIT_LINE_RATIO });
          }
        } else if (dtToHit <= FALL_WINDOW_MS) {
          const progress = HIT_LINE_RATIO * (1 - dtToHit / FALL_WINDOW_MS);
          nextVisible.push({ ...note, progress });
        }
      }

      setVisibleNotes(nextVisible);
    };

    if (prefersReducedMotion) {
      computeNotes();
      const staticInterval = setInterval(computeNotes, 120);
      return () => clearInterval(staticInterval);
    }

    let rafId = 0;
    const stepFrame = () => {
      computeNotes();
      rafId = requestAnimationFrame(stepFrame);
    };

    rafId = requestAnimationFrame(stepFrame);
    return () => cancelAnimationFrame(rafId);
  }, [isController, minigame?.phase, notes, prefersReducedMotion]);

  // Host timer & final sync finish
  useEffect(() => {
    if (!minigame || minigame.phase !== 'playing') return;

    let finishTimer: ReturnType<typeof setTimeout> | null = null;
    const syncRemaining = () => {
      const rem = Math.max(0, Math.ceil((minigame.endsAt - Date.now()) / 1000));
      setTimeLeft(rem);
      return rem;
    };

    syncRemaining();

    const interval = setInterval(() => {
      const rem = syncRemaining();
      if (rem <= 0) {
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
    }, 200);

    return () => {
      clearInterval(interval);
      if (finishTimer) clearTimeout(finishTimer);
    };
  }, [minigame?.phase, minigame?.endsAt, isController, isHost, finishMinigame]);

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
            <div className="w-16 h-16 rounded-3xl bg-orange-500/20 border-2 border-orange-400 flex items-center justify-center text-3xl mb-3 animate-bounce-subtle motion-reduce:animate-none">
              <span aria-hidden="true">🎵</span>
            </div>
            <span className="text-xs font-black text-orange-300 uppercase tracking-widest mb-1">
              Escenario Listo
            </span>
            <h2 id={titleId} className="text-xl font-black text-white">
              ¡Afina los Dedos!
            </h2>
            <p className="text-xs text-slate-300 mt-2 max-w-xs leading-relaxed">
              Pulsa <span aria-hidden="true">◀</span> CODE, <span aria-hidden="true">●</span>{' '}
              TEST o <span aria-hidden="true">▶</span> DEPLOY cuando cada nota cruce la línea
              inferior.
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  const handleLaneTap = (lane: RhythmLane) => {
    if (minigame.phase !== 'playing' || timeLeft <= 0) return;
    const elapsed = performance.now() - startPerfRef.current;

    setFlashedLane(lane);
    setTimeout(() => setFlashedLane((curr) => (curr === lane ? null : curr)), 140);

    // Find closest note on tapped lane inside hit window
    let bestMatch: RhythmNote | null = null;
    let bestDelta = Infinity;
    for (const note of notes) {
      if (note.lane !== lane) continue;
      if (hitIdsRef.current.has(note.id) || missedIdsRef.current.has(note.id)) continue;
      const delta = Math.abs(note.timeMs - elapsed);
      if (delta <= GOOD_WINDOW_MS && delta < bestDelta) {
        bestDelta = delta;
        bestMatch = note;
      }
    }

    if (bestMatch) {
      hitIdsRef.current.add(bestMatch.id);
      hitsRef.current += 1;
      comboRef.current += 1;
      if (comboRef.current > maxComboRef.current) {
        maxComboRef.current = comboRef.current;
      }
      const isPerfect = bestDelta <= PERFECT_WINDOW_MS;
      const gained = isPerfect ? 100 + comboRef.current * 15 : 60 + comboRef.current * 10;
      scoreRef.current += gained;
      sounds.playTone(bestMatch.freq, 0.18);
      setScore(scoreRef.current);
      setCombo(comboRef.current);
      setFeedback({
        icon: isPerfect ? '✨' : '👍',
        text: isPerfect ? `¡PERFECTO! +${gained}` : `¡BIEN! +${gained}`,
      });
      submitRhythmScore(
        myPlayerId,
        scoreRef.current,
        hitsRef.current,
        maxComboRef.current,
        missesRef.current
      );
    } else {
      missesRef.current += 1;
      comboRef.current = 0;
      sounds.playSlip();
      setCombo(0);
      setFeedback({ icon: '💥', text: '¡A destiempo!' });
      submitRhythmScore(
        myPlayerId,
        scoreRef.current,
        hitsRef.current,
        maxComboRef.current,
        missesRef.current
      );
    }
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
          <div className="text-xs font-game font-black uppercase tracking-widest text-orange-300 mb-1">
            MINIJUEGO MUSICAL • ¡PREMIO: +2 ESTRELLAS!
          </div>
          <h2 id={titleId} className="text-2xl md:text-4xl font-extrabold drop-shadow-md">
            <span aria-hidden="true" className="text-white mr-2">
              🎵
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-amber-300 to-cyan-300">
              RITMO DEL SPRINT
            </span>
          </h2>
          <div className="mt-2 inline-flex flex-wrap items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-orange-400/50 text-xs font-bold text-slate-100">
            <Music className="w-3.5 h-3.5 text-orange-300" aria-hidden="true" />
            <span>{timeLeft}s restantes</span>
            {isController && (
              <>
                <span>·</span>
                <span className="text-yellow-300 font-black">{score} pts</span>
                <span>·</span>
                <span className="text-cyan-300 font-black">Combo x{combo}</span>
              </>
            )}
          </div>
        </div>

        {isController ? (
          <div className="w-full max-w-sm flex flex-col items-center">
            {/* Falling Notes Highway (accessible lane dividers >= 3:1 UI contrast) */}
            <div className="w-full h-56 rounded-2xl bg-slate-900/95 border-2 border-white/25 relative overflow-hidden mb-3 shadow-2xl">
              {/* 3 Vertical Lanes */}
              <div className="absolute inset-0 grid grid-cols-3 divide-x divide-slate-500">
                <div className="h-full" />
                <div className="h-full" />
                <div className="h-full" />
              </div>

              {/* Target Hit Line at 84% */}
              <div
                className="absolute inset-x-0 h-1 bg-yellow-300/80 shadow-[0_0_12px_rgba(253,224,71,0.85)]"
                style={{ top: `${HIT_LINE_RATIO * 100}%` }}
                aria-hidden="true"
              />

              {/* Rendered Notes */}
              {visibleNotes.map((note) => {
                const laneMeta = RHYTHM_LANES[note.lane];
                return (
                  <div
                    key={note.id}
                    data-rhythm-note-id={note.id}
                    className={`absolute w-10 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 flex items-center justify-center text-xs font-black ${laneMeta.noteBgClass}`}
                    style={{
                      left: `${(note.lane + 0.5) * 33.333}%`,
                      top: `${Math.min(98, Math.max(4, note.progress * 100))}%`,
                    }}
                    aria-hidden="true"
                  >
                    {laneMeta.symbol}
                  </div>
                );
              })}

              {/* Feedback Banner inside top of track */}
              <div className="absolute top-2 inset-x-0 text-center pointer-events-none">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-950/90 border border-white/20 text-xs font-black text-amber-200">
                  <span aria-hidden="true">{feedback.icon}</span>
                  <span>{feedback.text}</span>
                </span>
              </div>
            </div>

            {/* 3 Tactile Lane Buttons */}
            <div className="w-full grid grid-cols-3 gap-2.5">
              {RHYTHM_LANES.map((laneDef) => {
                const isFlashed = flashedLane === laneDef.lane;
                return (
                  <button
                    key={laneDef.lane}
                    type="button"
                    data-rhythm-lane={laneDef.lane}
                    aria-label={`Carril ${laneDef.label}`}
                    onClick={() => handleLaneTap(laneDef.lane)}
                    disabled={timeLeft <= 0}
                    className={`min-h-[68px] rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all duration-75 motion-reduce:transition-none motion-reduce:active:scale-100 cursor-pointer active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300 ${
                      isFlashed ? laneDef.activeBgClass : laneDef.buttonClass
                    }`}
                  >
                    <span className="text-lg font-black" aria-hidden="true">
                      {laneDef.symbol}
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider">
                      {laneDef.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Host Live Combo Leaderboard */
          <div className="w-full bg-slate-900/90 border border-white/15 rounded-2xl p-5 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">
              <span>Marcador de Ritmo en Vivo</span>
              <span className="text-orange-300">Combo & Precisión</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {players.map((player) => {
                const entry = minigame.rhythmEntries?.[player.id];
                const pScore = entry?.score || 0;
                const pCombo = entry?.maxCombo || 0;
                const pHits = entry?.hits || 0;

                return (
                  <div
                    key={player.id}
                    className="p-3 rounded-xl bg-slate-800/90 border border-white/15 flex items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CharacterAvatar
                        characterId={player.characterId}
                        size="sm"
                        showBorder={false}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-white truncate">
                          {player.name}
                        </div>
                        <div className="text-xs text-slate-300 font-semibold">
                          {pHits} notas · Max Combo x{pCombo}
                        </div>
                      </div>
                    </div>

                    <div className="text-sm font-black text-yellow-300 shrink-0 tabular-nums">
                      {pScore} pts
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
