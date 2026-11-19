import React, { useState, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import { ChaosEventType } from '@/types/game';
import { sounds } from '@/audio/soundEffects';

export const ChaosEventModal: React.FC = () => {
  const { gameState, resolveChaosEvent, triggerMinigame } = useGame();
  const { chaosEvent, players, activePlayerIndex, phase } = gameState;

  const [isSpinning, setIsSpinning] = useState(false);
  const [displayIndex, setDisplayIndex] = useState(0);

  const activePlayer = players[activePlayerIndex];

  const EVENT_LIST: Array<{ type: ChaosEventType; title: string; desc: string; icon: string }> = [
    { type: 'item_box', title: 'Caja de Power-Up', desc: '¡Recibes un objeto especial sorpresa para tu mochila!', icon: '🎒' },
    { type: 'steal_star', title: 'Robo de la Suerte', desc: '¡Le robas 1 Estrella al rival con más estrellas del tablero!', icon: '🦹' },
    { type: 'swap_pos', title: 'Intercambio de Lugares', desc: '¡Intercambias tu posición en la pista con otro jugador al azar!', icon: '🌪️' },
    { type: 'double_kudo', title: 'Kudo Doble', desc: '¡Tu próximo aporte otorgará +2 Estrellas dobles!', icon: '🎁' },
    { type: 'speed_challenge', title: 'Reto Express', desc: '¡Minijuego sorpresa inmediato para disputar 2 estrellas!', icon: '⚡' },
  ];

  useEffect(() => {
    if (phase === 'chaos_event' && chaosEvent) {
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
    if (!chaosEvent.eventType) return;
    if (chaosEvent.eventType === 'speed_challenge') {
      triggerMinigame('block_smash');
    } else {
      resolveChaosEvent(chaosEvent.eventType);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="w-full max-w-lg rounded-3xl border-2 border-purple-500/70 p-6 md:p-8 shadow-2xl bg-gradient-to-b from-purple-950 via-slate-900 to-purple-950 text-center flex flex-col items-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-950/80 border border-purple-400/40 text-xs font-bold text-purple-300 mb-3 shadow-inner">
          <span>🟣</span>
          <span>CASILLA DE EVENTO SORPRESA</span>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
        </div>

        <h3 className="text-2xl md:text-3xl font-black text-white tracking-wide">
          ¡EVENTO CAOS Y KUDOS!
        </h3>
        <p className="text-xs text-slate-300 mt-1 mb-5">
          Para: <span className="font-bold text-yellow-300">{activePlayer?.name}</span>
        </p>

        {/* Animated Mystery Wheel Box */}
        <div className="w-full p-6 rounded-2xl bg-slate-950/90 border-2 border-purple-400/30 flex flex-col items-center justify-center mb-6 shadow-xl relative overflow-hidden">
          <div className="text-6xl mb-3 animate-bounce">
            {currentDisplayEvent.icon}
          </div>
          <div className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-yellow-300">
            {currentDisplayEvent.title}
          </div>
          <p className="text-xs text-slate-300 mt-2 max-w-sm">
            {currentDisplayEvent.desc}
          </p>
        </div>

        {/* Claim Button */}
        <button
          onClick={handleClaim}
          disabled={isSpinning}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 text-white font-extrabold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <span>✨</span>
          <span>{isSpinning ? 'Sorteando...' : '¡Aceptar y Continuar!'}</span>
        </button>
      </div>
    </div>
  );
};