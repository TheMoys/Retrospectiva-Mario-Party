import React, { useState, useEffect } from 'react';
import { MinigameType } from '@/types/game';
import { sounds } from '@/audio/soundEffects';

interface MinigameConfig {
  title: string;
  subtitle: string;
  reward: string;
  rules: string[];
  controllerHint: string;
  phonePreviewSvg: React.ReactNode;
}

const MINIGAME_CONFIGS: Record<MinigameType, MinigameConfig> = {
  block_smash: {
    title: '¡MACHACA EL BLOQUE ?!',
    subtitle: 'Destreza y velocidad extrema individual',
    reward: '+2 ESTRELLAS para el más rápido',
    rules: [
      'Toca repetidamente el bloque amarillo en tu Joy-Phone.',
      'Tienes exactamente 8 segundos antes de que expire el cronómetro.',
      'El jugador con el mayor número de golpes gana las 2 Estrellas.',
    ],
    controllerHint: 'PULSA EL BLOQUE REPETIDAMENTE',
    phonePreviewSvg: (
      <div className="relative w-28 h-44 rounded-2xl border-4 border-slate-700 bg-slate-950 p-2 flex flex-col items-center justify-center shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 border-2 border-amber-800 flex items-center justify-center text-slate-950 font-black text-2xl animate-bounce-subtle shadow-lg">
          ?
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-18 h-18 rounded-full border-2 border-yellow-400/60 animate-ping" />
        </div>
        <span className="text-[9px] font-pixel text-yellow-400 mt-2.5 text-center">¡TAP! ¡TAP!</span>
      </div>
    ),
  },
  quick_vote: {
    title: '¿QUIÉN DEL EQUIPO...?',
    subtitle: 'Votación secreta y sincera del Sprint',
    reward: '+2 ESTRELLAS para la persona más votada',
    rules: [
      'Lee la pregunta ágil proyectada en la pantalla grande.',
      'Toca el avatar de tu compañero en tu Joy-Phone antes de que acabe el tiempo.',
      '¡Tu voto es 100% secreto hasta el recuento final!',
    ],
    controllerHint: 'TOCA UN AVATAR PARA VOTAR',
    phonePreviewSvg: (
      <div className="relative w-28 h-44 rounded-2xl border-4 border-slate-700 bg-slate-950 p-2 flex flex-col items-center justify-center shadow-2xl">
        <div className="grid grid-cols-2 gap-1.5 w-full">
          <div className="h-7 rounded-lg bg-slate-800 border border-white/20 flex items-center justify-center text-xs">👻</div>
          <div className="h-7 rounded-lg bg-cyan-500/30 border-2 border-cyan-400 flex items-center justify-center text-xs shadow-md">👑</div>
          <div className="h-7 rounded-lg bg-slate-800 border border-white/20 flex items-center justify-center text-xs">🦖</div>
          <div className="h-7 rounded-lg bg-slate-800 border border-white/20 flex items-center justify-center text-xs">⭐</div>
        </div>
        <span className="text-[9px] font-pixel text-cyan-300 mt-2 text-center">SELECCIONA</span>
      </div>
    ),
  },
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
  const config = MINIGAME_CONFIGS[type];
  const storageKey = `sprint_party_seen_${type}`;
  const alreadySeen = typeof window !== 'undefined' && window.sessionStorage?.getItem(storageKey) === 'true';

  const [stage, setStage] = useState<'rules' | 'countdown'>(alreadySeen ? 'countdown' : 'rules');
  const [countdownValue, setCountdownValue] = useState<number | '¡YA!'>(3);

  // Auto transition from rules to countdown after 6 seconds (if host doesn't click skip)
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
        setTimeout(onFinishCountdown, 600);
      }
    }, 850);

    return () => clearInterval(interval);
  }, [stage, onFinishCountdown]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/92 backdrop-blur-2xl flex items-center justify-center p-4 select-none">
      {stage === 'rules' ? (
        /* STAGE 1: Rules & Joy-Phone Preview */
        <div className="w-full max-w-3xl bg-slate-900/95 border-2 border-amber-400/60 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden animate-modal-spring">
          {/* Top Decorative Arc Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

          {/* Reward Pill */}
          <div className="flex items-center justify-between mb-4">
            <span className="px-3.5 py-1 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 font-pixel text-xs tracking-wider uppercase shadow">
              ⭐ {config.reward} ⭐
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Instrucciones Previas
            </span>
          </div>

          {/* Main Title */}
          <h2 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 text-stroke-sm font-game">
            {config.title}
          </h2>
          <p className="text-sm md:text-base text-slate-300 mt-1 font-medium">
            {config.subtitle}
          </p>

          {/* Content Split: Rules + Joy-Phone Preview */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Rules list */}
            <div className="md:col-span-2 space-y-3">
              {config.rules.map((rule, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-950/70 border border-white/10"
                >
                  <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black font-pixel text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed font-medium">
                    {rule}
                  </p>
                </div>
              ))}
            </div>

            {/* Controller Diagram Preview */}
            <div className="flex flex-col items-center justify-center bg-slate-950/90 rounded-2xl p-4 border border-white/10">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Tu Joy-Phone
              </span>
              {config.phonePreviewSvg}
              <span className="text-[11px] font-bold text-amber-300 text-center mt-3 font-game">
                {config.controllerHint}
              </span>
            </div>
          </div>

          {/* Host Fast Forward Action Button */}
          {isHost && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleStartCountdown}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>¡LISTOS PARA EMPEZAR!</span>
                <span>▶</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* STAGE 2: Cinematic 3.. 2.. 1.. ¡YA! */
        <div className="flex flex-col items-center justify-center text-center">
          <div className="text-sm font-pixel text-slate-300 uppercase tracking-widest mb-4">
            {config.title}
          </div>
          <div
            key={String(countdownValue)}
            className={`font-black font-game text-8xl md:text-9xl text-stroke-md drop-shadow-2xl animate-countdown-pop ${
              countdownValue === 3
                ? 'text-cyan-400'
                : countdownValue === 2
                ? 'text-yellow-300'
                : countdownValue === 1
                ? 'text-orange-400'
                : 'text-emerald-400 scale-125'
            }`}
          >
            {countdownValue}
          </div>
        </div>
      )}
    </div>
  );
};
