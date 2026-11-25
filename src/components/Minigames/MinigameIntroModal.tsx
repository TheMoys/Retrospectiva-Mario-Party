import React, { useEffect, useId, useRef, useState } from 'react';
import { MinigameType } from '@/types/game';
import { MINIGAME_CATALOG } from '@/constants/minigames';
import { sounds } from '@/audio/soundEffects';

const PHONE_PREVIEWS: Record<MinigameType, React.ReactNode> = {
  block_smash: (
    <div className="relative w-28 h-44 rounded-2xl border-4 border-slate-700 bg-slate-950 p-2 flex flex-col items-center justify-center shadow-2xl">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 border-2 border-amber-800 flex items-center justify-center text-slate-950 font-black text-2xl animate-bounce-subtle motion-reduce:animate-none shadow-lg">
        ?
      </div>
      <span className="text-xs font-black text-yellow-300 mt-2.5 text-center">¡TAP! ¡TAP!</span>
    </div>
  ),
  quick_vote: (
    <div className="relative w-28 h-44 rounded-2xl border-4 border-slate-700 bg-slate-950 p-2 flex flex-col items-center justify-center shadow-2xl">
      <div className="grid grid-cols-2 gap-1.5 w-full">
        <div className="h-8 rounded-lg bg-slate-800 border border-white/20 flex items-center justify-center text-xs">
          👻
        </div>
        <div className="h-8 rounded-lg bg-cyan-500/30 border-2 border-cyan-400 flex items-center justify-center text-xs shadow-md">
          👑
        </div>
        <div className="h-8 rounded-lg bg-slate-800 border border-white/20 flex items-center justify-center text-xs">
          🦖
        </div>
        <div className="h-8 rounded-lg bg-slate-800 border border-white/20 flex items-center justify-center text-xs">
          ⭐
        </div>
      </div>
      <span className="text-xs font-black text-cyan-300 mt-2 text-center">ELIGE</span>
    </div>
  ),
  blind_timer: (
    <div className="relative w-28 h-44 rounded-2xl border-4 border-slate-700 bg-slate-950 p-2 flex flex-col items-center justify-center gap-2 shadow-2xl">
      <div className="px-2.5 py-1 rounded-lg bg-slate-800 border border-violet-400/50 font-mono text-sm font-black text-violet-200">
        ??.?? s
      </div>
      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-500 border-2 border-white/40 flex items-center justify-center text-xl shadow-lg">
        🚀
      </div>
      <span className="text-xs font-black text-violet-300 text-center">DEPLOY</span>
    </div>
  ),
  planning_poker: (
    <div className="relative w-28 h-44 rounded-2xl border-4 border-slate-700 bg-slate-950 p-2 flex flex-col items-center justify-center shadow-2xl">
      <div className="grid grid-cols-3 gap-1 w-full">
        {[1, 2, 3, 5, 8, 13].map((val) => (
          <div
            key={val}
            className={`h-8 rounded-md flex items-center justify-center text-xs font-black border ${
              val === 8
                ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200'
                : 'bg-slate-800 border-white/20 text-slate-200'
            }`}
          >
            {val}
          </div>
        ))}
      </div>
      <span className="text-xs font-black text-emerald-300 mt-2.5 text-center">SECRETA</span>
    </div>
  ),
  simon_pipeline: (
    <div className="relative w-28 h-44 rounded-2xl border-4 border-slate-700 bg-slate-950 p-2 flex flex-col items-center justify-center shadow-2xl">
      <div className="grid grid-cols-2 gap-1.5 w-full">
        <div className="h-9 rounded-lg bg-sky-500/40 border border-sky-400 flex items-center justify-center text-sm">
          💻
        </div>
        <div className="h-9 rounded-lg bg-emerald-500/40 border border-emerald-400 flex items-center justify-center text-sm">
          🧪
        </div>
        <div className="h-9 rounded-lg bg-amber-400 border-2 border-white flex items-center justify-center text-sm shadow">
          🚀
        </div>
        <div className="h-9 rounded-lg bg-rose-500/40 border border-rose-400 flex items-center justify-center text-sm">
          🔥
        </div>
      </div>
      <span className="text-xs font-black text-pink-300 mt-2 text-center">REPITE</span>
    </div>
  ),
  defuse_p0: (
    <div className="relative w-28 h-44 rounded-2xl border-4 border-slate-700 bg-slate-950 p-2 flex flex-col items-center justify-center shadow-2xl">
      <div className="grid grid-cols-2 gap-1.5 w-full">
        <div className="h-9 rounded-lg bg-rose-950 border border-rose-400 flex items-center justify-center text-xs font-black text-rose-100">
          🔴
        </div>
        <div className="h-9 rounded-lg bg-sky-950 border border-sky-400 flex items-center justify-center text-xs font-black text-sky-100">
          🔵
        </div>
        <div className="h-9 rounded-lg bg-emerald-950 border-2 border-emerald-300 flex items-center justify-center text-xs font-black text-emerald-100">
          🟢
        </div>
        <div className="h-9 rounded-lg bg-amber-950 border border-amber-400 flex items-center justify-center text-xs font-black text-amber-100">
          🟡
        </div>
      </div>
      <span className="text-xs font-black text-rose-300 mt-2 text-center">CORTA</span>
    </div>
  ),
  chicken_meeting: (
    <div className="relative w-28 h-44 rounded-2xl border-4 border-slate-700 bg-slate-950 p-2 flex flex-col items-center justify-center gap-2 shadow-2xl">
      <div className="px-2 py-1 rounded-lg bg-slate-900 border border-teal-400/50 font-mono text-xs font-black text-yellow-300">
        +180 pts
      </div>
      <div className="w-16 h-12 rounded-xl bg-emerald-700 border-2 border-emerald-300 flex items-center justify-center text-lg shadow-lg">
        🚪
      </div>
      <span className="text-xs font-black text-teal-300 text-center">¡SALIR!</span>
    </div>
  ),
  dev_price_is_right: (
    <div className="relative w-28 h-44 rounded-2xl border-4 border-slate-700 bg-slate-950 p-2 flex flex-col items-center justify-center gap-2 shadow-2xl">
      <div className="font-mono text-base font-black text-yellow-300">2005</div>
      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
        <div className="w-2/3 h-full bg-amber-400" />
      </div>
      <div className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 text-xs font-black">
        ENVIAR
      </div>
    </div>
  ),
  sprint_rhythm: (
    <div className="relative w-28 h-44 rounded-2xl border-4 border-slate-700 bg-slate-950 p-2 flex flex-col items-center justify-between py-3 shadow-2xl">
      <div className="grid grid-cols-3 gap-1 w-full flex-1 items-center">
        <div className="h-3 rounded-full bg-cyan-400" />
        <div className="h-3 rounded-full bg-transparent" />
        <div className="h-3 rounded-full bg-amber-400" />
      </div>
      <div className="w-full h-0.5 bg-yellow-300 my-1" />
      <div className="grid grid-cols-3 gap-1 w-full text-xs font-black text-white text-center">
        <span className="py-1 rounded bg-cyan-900 border border-cyan-400">◀</span>
        <span className="py-1 rounded bg-emerald-900 border border-emerald-400">●</span>
        <span className="py-1 rounded bg-amber-900 border border-amber-400">▶</span>
      </div>
    </div>
  ),
  stroop_bug: (
    <div className="relative w-28 h-44 rounded-2xl border-4 border-slate-700 bg-slate-950 p-2 flex flex-col items-center justify-center gap-2 shadow-2xl">
      <div className="px-2 py-1 rounded bg-slate-900 border border-white/15 text-xs font-black text-sky-400">
        ROJO
      </div>
      <div className="grid grid-cols-2 gap-1 w-full">
        <div className="h-7 rounded bg-rose-700 border border-rose-300" />
        <div className="h-7 rounded bg-blue-700 border border-sky-300" />
        <div className="h-7 rounded bg-emerald-700 border border-emerald-300" />
        <div className="h-7 rounded bg-yellow-400 border border-yellow-100" />
      </div>
    </div>
  ),
};

interface MinigameIntroModalProps {
  type: MinigameType;
  onFinishCountdown: () => void;
  isHost?: boolean;
}

export const MinigameIntroModal: React.FC<MinigameIntroModalProps> = ({
  type,
  onFinishCountdown,
  isHost = true,
}) => {
  const config = MINIGAME_CATALOG[type];
  const storageKey = `sprint_party_seen_${type}`;
  const alreadySeen =
    typeof window !== 'undefined' && window.sessionStorage?.getItem(storageKey) === 'true';

  const [stage, setStage] = useState<'rules' | 'countdown'>(alreadySeen ? 'countdown' : 'rules');
  const [countdownValue, setCountdownValue] = useState<number | '¡YA!'>(3);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    dialogRef.current?.focus();
  }, [stage]);

  // Auto transition from rules to countdown after 6.5 seconds (if host doesn't click skip)
  useEffect(() => {
    if (stage === 'rules') {
      const timer = setTimeout(() => {
        handleStartCountdown();
      }, 6500);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  const handleStartCountdown = () => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(storageKey, 'true');
    }
    setStage('countdown');
    sounds.playJump();
  };

  // 3.. 2.. 1.. ¡YA! Sequence
  useEffect(() => {
    if (stage !== 'countdown') return;

    let step = 3;
    let finishTimer: ReturnType<typeof setTimeout> | null = null;
    setCountdownValue(3);
    sounds.playCoin();

    const interval = setInterval(() => {
      step -= 1;
      if (step === 2) {
        setCountdownValue(2);
        sounds.playCoin();
      } else if (step === 1) {
        setCountdownValue(1);
        sounds.playCoin();
      } else if (step === 0) {
        setCountdownValue('¡YA!');
        sounds.playStarFanfare();
      } else {
        clearInterval(interval);
        finishTimer = setTimeout(onFinishCountdown, 550);
      }
    }, 800);

    return () => {
      clearInterval(interval);
      if (finishTimer) clearTimeout(finishTimer);
    };
  }, [stage, onFinishCountdown]);

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl overflow-y-auto flex flex-col items-center p-4 pb-20 md:p-6 select-none focus:outline-none"
    >
      {stage === 'rules' ? (
        /* STAGE 1: Rules & Joy-Phone Preview */
        <div className="my-auto w-full max-w-3xl bg-slate-900/95 border-2 border-amber-400/60 rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl relative overflow-hidden animate-modal-spring motion-reduce:animate-none">
          {/* Top Decorative Arc Glow */}
          <div
            aria-hidden="true"
            className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent"
          />

          {/* Reward Pill */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <span className="px-3.5 py-1 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-200 font-pixel text-xs tracking-wider uppercase shadow">
              ⭐ {config.reward} ⭐
            </span>
            <span className="text-xs text-slate-300 font-mono">
              {config.category} · Reglas
            </span>
          </div>

          {/* Main Title */}
          <h2 id={titleId} className="text-3xl md:text-5xl font-black font-game drop-shadow-md">
            <span aria-hidden="true" className="text-white mr-2">
              {config.emoji}
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400">
              {config.title}
            </span>
          </h2>
          <p className="text-sm md:text-base text-slate-200 mt-1 font-medium">
            {config.subtitle}
          </p>

          {/* Content Split: Rules + Joy-Phone Preview */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Rules list */}
            <div className="md:col-span-2 space-y-3">
              {config.rules.map((rule, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-950/80 border border-white/10"
                >
                  <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black font-pixel text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <p className="text-sm text-slate-100 leading-relaxed font-medium">{rule}</p>
                </div>
              ))}
            </div>

            {/* Controller Diagram Preview */}
            <div className="flex flex-col items-center justify-center bg-slate-950/90 rounded-2xl p-4 border border-white/10">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Tu Joy-Phone
              </span>
              <div aria-hidden="true">{PHONE_PREVIEWS[type]}</div>
              <span className="text-xs font-bold text-amber-300 text-center mt-3 font-game">
                {config.controllerHint}
              </span>
            </div>
          </div>

          {/* Host Fast Forward Action Button */}
          {isHost && (
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleStartCountdown}
                className="w-full sm:w-auto justify-center min-h-[44px] px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all motion-reduce:transition-none motion-reduce:active:scale-100 flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                <span>¡LISTOS PARA EMPEZAR!</span>
                <span aria-hidden="true">▶</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* STAGE 2: Cinematic 3.. 2.. 1.. ¡YA! */
        <div className="my-auto flex flex-col items-center justify-center text-center">
          <h2 id={titleId} className="text-sm font-pixel text-slate-200 uppercase tracking-widest mb-4">
            <span aria-hidden="true" className="mr-1.5">
              {config.emoji}
            </span>
            <span>{config.title}</span>
          </h2>
          <div aria-live="assertive" aria-atomic="true">
            <span
              key={String(countdownValue)}
              className={`inline-block font-black font-game text-7xl sm:text-8xl md:text-9xl text-stroke-md drop-shadow-2xl animate-countdown-pop motion-reduce:animate-none ${
                countdownValue === 3
                  ? 'text-cyan-400'
                  : countdownValue === 2
                  ? 'text-yellow-300'
                  : countdownValue === 1
                  ? 'text-orange-400'
                  : 'text-emerald-400 scale-110 sm:scale-125 motion-reduce:scale-100'
              }`}
            >
              {countdownValue}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
