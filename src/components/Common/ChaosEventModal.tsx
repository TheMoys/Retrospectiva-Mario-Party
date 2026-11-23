import React, { useState, useEffect, useId, useRef } from 'react';
import { useGame } from '@/context/GameContext';
import { ChaosEventType } from '@/types/game';
import { sounds } from '@/audio/soundEffects';

export const ChaosEventModal: React.FC = () => {
  const { gameState, resolveChaosEvent, triggerMinigame, isHost, myPlayerId } = useGame();
  const { chaosEvent, players, activePlayerIndex, phase } = gameState;

  const [isSpinning, setIsSpinning] = useState(false);
  const [displayIndex, setDisplayIndex] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const activePlayer = players[activePlayerIndex];
  const canAct = isHost || activePlayer?.id === myPlayerId;

  const EVENT_LIST: Array<{ type: ChaosEventType; title: string; desc: string; icon: string }> = [
    { type: 'item_box', title: 'Caja de Power-Up', desc: '¡Recibes un objeto especial sorpresa para tu mochila!', icon: '🎒' },
    { type: 'steal_star', title: 'Robo de la Suerte', desc: '¡Le robas 1 Estrella al rival con más estrellas del tablero!', icon: '🦹' },
    { type: 'swap_pos', title: 'Intercambio de Lugares', desc: '¡Intercambias tu posición en la pista con otro jugador al azar!', icon: '🌪️' },
    { type: 'double_kudo', title: 'Kudo Doble', desc: '¡Tu próximo aporte otorgará +2 Estrellas dobles!', icon: '🎁' },
    { type: 'speed_challenge', title: 'Reto Express', desc: '¡Minijuego sorpresa inmediato para disputar 2 estrellas!', icon: '⚡' },
  ];

  useEffect(() => {
    if (phase === 'chaos_event' && chaosEvent) {
      dialogRef.current?.focus();
      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        setIsSpinning(false);
        sounds.playStarFanfare();
        return;
      }

      setIsSpinning(true);
      let step = 0;
      const totalSteps = 20;

      const spinInterval = setInterval(() => {
        step++;
        setDisplayIndex((prev) => (prev + 1) % EVENT_LIST.length);
        sounds.playRouletteTick();

        if (step >= totalSteps) {
          clearInterval(spinInterval);
          setIsSpinning(false);
          sounds.playStarFanfare();
        }
      }, 100);

      return () => clearInterval(spinInterval);
    }
  }, [phase, chaosEvent]);

  if (phase !== 'chaos_event' || !chaosEvent) return null;

  const currentDisplayEvent = isSpinning
    ? EVENT_LIST[displayIndex]
    : EVENT_LIST.find((e) => e.type === chaosEvent.eventType) || EVENT_LIST[0];

  const handleClaim = () => {
    if (!chaosEvent.eventType || !canAct || isSpinning) return;
    if (chaosEvent.eventType === 'speed_challenge') {
      triggerMinigame('block_smash', { advanceTurnOnClose: true });
    } else {
      resolveChaosEvent(chaosEvent.eventType);
    }
  };

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md overflow-y-auto flex items-center justify-center p-4 pb-20 animate-fade-in motion-reduce:animate-none select-none focus:outline-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="my-auto w-full max-w-lg max-h-[min(88dvh,100%)] overflow-y-auto rounded-3xl border-2 border-purple-500/70 p-6 md:p-8 shadow-2xl bg-gradient-to-b from-purple-950 via-slate-900 to-purple-950 text-center flex flex-col items-center animate-modal-spring motion-reduce:animate-none">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-950/80 border border-purple-400/40 text-xs font-bold text-purple-200 mb-3 shadow-inner">
          <span aria-hidden="true">🟣</span>
          <span>CASILLA DE EVENTO SORPRESA</span>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping motion-reduce:animate-none" aria-hidden="true" />
        </div>

        <h3 id={titleId} className="text-2xl md:text-3xl font-black text-white tracking-wide">
          ¡EVENTO CAOS Y KUDOS!
        </h3>
        <p className="text-xs text-slate-200 mt-1 mb-5">
          Para: <span className="font-bold text-yellow-300">{activePlayer?.name}</span>
        </p>

        {/* Animated Mystery Wheel Box */}
        <div
          aria-live="polite"
          className="w-full p-6 rounded-2xl bg-slate-950/90 border-2 border-purple-400/30 flex flex-col items-center justify-center mb-6 shadow-xl relative overflow-hidden"
        >
          <div className="text-6xl mb-3 animate-bounce motion-reduce:animate-none" aria-hidden="true">
            {currentDisplayEvent.icon}
          </div>
          <div className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-300 to-yellow-300">
            {currentDisplayEvent.title}
          </div>
          <p className="text-xs text-slate-200 mt-2 max-w-sm leading-relaxed">
            {currentDisplayEvent.desc}
          </p>
        </div>

        {canAct ? (
          <button
            type="button"
            onClick={handleClaim}
            disabled={isSpinning}
            className="w-full py-3.5 min-h-[44px] rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <span aria-hidden="true">✨</span>
            <span>{isSpinning ? 'Sorteando...' : '¡Aceptar y Continuar!'}</span>
          </button>
        ) : (
          <div className="w-full py-3 min-h-[44px] rounded-2xl bg-slate-900/90 border border-white/15 text-xs font-bold text-slate-200 flex items-center justify-center gap-2">
            <span aria-hidden="true">⏳</span>
            <span>Esperando a {activePlayer?.name || 'compañero'}...</span>
          </div>
        )}
      </div>
    </div>
  );
};