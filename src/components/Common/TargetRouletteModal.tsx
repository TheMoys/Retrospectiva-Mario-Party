import React, { useState, useEffect, useId, useRef } from 'react';
import { useGame } from '@/context/GameContext';
import { RetroCategory } from '@/types/game';
import { CHARACTERS } from '@/constants/characters';
import { CharacterAvatar } from './CharacterAvatar';
import { sounds } from '@/audio/soundEffects';

export const TargetRouletteModal: React.FC = () => {
  const { gameState, submitRetroCard, myPlayerId, isHost } = useGame();
  const { targetRoulette, players, activePlayerIndex, phase } = gameState;

  const activePlayer = players[activePlayerIndex];
  const isMyTurn = activePlayer?.id === myPlayerId || isHost;

  const [activeCategory, setActiveCategory] = useState<RetroCategory>('seguir');
  const [content, setContent] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [displayCandidateIndex, setDisplayCandidateIndex] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const textareaId = useId();
  const titleId = useId();

  const teammates = players.filter((p) => p.id !== activePlayer?.id);

  // Sync category from roulette
  useEffect(() => {
    if (targetRoulette) {
      setActiveCategory(targetRoulette.category);
    }
  }, [targetRoulette]);

  // Handle spinning roulette effect (respecting prefers-reduced-motion)
  useEffect(() => {
    if (phase === 'roulette' || phase === 'space_action') {
      dialogRef.current?.focus();
    }
    if (phase === 'roulette' && targetRoulette && teammates.length > 0) {
      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        setIsSpinning(false);
        sounds.playCoin();
        return;
      }

      setIsSpinning(true);
      let step = 0;
      const totalSteps = 24;

      const spinInterval = setInterval(() => {
        step++;
        setDisplayCandidateIndex((prev) => (prev + 1) % teammates.length);
        sounds.playRouletteTick();

        if (step >= totalSteps) {
          clearInterval(spinInterval);
          setIsSpinning(false);
          sounds.playCoin();
        }
      }, 95);

      return () => clearInterval(spinInterval);
    } else {
      setIsSpinning(false);
    }
  }, [phase, targetRoulette?.selectedPlayerId, teammates.length]);

  if (!targetRoulette || (phase !== 'roulette' && phase !== 'space_action')) return null;

  const chosenTeammate = isSpinning
    ? teammates[displayCandidateIndex]
    : players.find((p) => p.id === targetRoulette.selectedPlayerId) || teammates[0];

  const getCategoryTheme = () => {
    switch (activeCategory) {
      case 'seguir':
        return {
          title: '🟢 Seguir Haciendo (Elogio a un Compañero)',
          bgGradient: 'from-emerald-950/90 via-slate-900 to-emerald-950/90',
          borderColor: 'border-emerald-500/60 shadow-emerald-500/20',
          textColor: 'text-emerald-300',
          badgeText: 'Medalla Verde +1 ⭐ para ti y +1 ⭐ para el compañero',
          placeholder: `Ej: ¡Gracias a ${chosenTeammate?.name || 'tu compañero'} por cómo resolvió el bug crítico y mantuvo al equipo con alta energía!`,
        };
      case 'mejorar':
        return {
          title: '🟡 Potenciar / Mejorar (Consejo Constructivo)',
          bgGradient: 'from-amber-950/90 via-slate-900 to-amber-950/90',
          borderColor: 'border-amber-500/60 shadow-amber-500/20',
          textColor: 'text-amber-300',
          badgeText: 'Medalla Amarilla +1 ⭐ para ti',
          placeholder: `Ej: A ${chosenTeammate?.name || 'tu compañero'} le ayudaría mucho liderar los dailies del próximo sprint para brillar aún más...`,
        };
      case 'dejar':
        return {
          title: '🔴 Dejar de Hacer (Al Equipo / Proceso)',
          bgGradient: 'from-rose-950/90 via-slate-900 to-rose-950/90',
          borderColor: 'border-rose-500/60 shadow-rose-500/20',
          textColor: 'text-rose-300',
          badgeText: 'Medalla Roja +1 ⭐ para ti',
          placeholder: 'Ej: Dejar de cambiar requerimientos a mitad del sprint sin re-estimar las historias...',
        };
    }
  };

  const theme = getCategoryTheme();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !activePlayer) return;

    submitRetroCard({
      playerId: activePlayer.id,
      playerName: activePlayer.name,
      characterId: activePlayer.characterId,
      category: activeCategory,
      content: content.trim(),
      recipientId: activeCategory === 'dejar' ? undefined : chosenTeammate?.id,
      recipientName: activeCategory === 'dejar' ? undefined : chosenTeammate?.name,
    });

    setContent('');
  };

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md overflow-y-auto flex items-center justify-center p-3 md:p-6 pb-20 animate-fade-in motion-reduce:animate-none select-none focus:outline-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className={`my-auto w-full max-w-xl max-h-[min(88dvh,100%)] overflow-y-auto rounded-3xl border-2 p-5 md:p-7 shadow-2xl bg-gradient-to-b ${theme.bgGradient} ${theme.borderColor} flex flex-col relative animate-modal-spring motion-reduce:animate-none`}
      >
        {/* Top Header Badge */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-950/85 border border-white/20 text-xs font-bold text-yellow-300 mb-2 shadow-inner">
            <span aria-hidden="true">{targetRoulette.isDoubleKudo ? '🎁' : '🎲'}</span>
            <span>{targetRoulette.isDoubleKudo ? 'KUDO DOBLE (+2 ESTRELLAS)' : 'RULETA DE OBJETIVO'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping motion-reduce:animate-none" aria-hidden="true" />
          </div>
          <h3 id={titleId} className="text-xl md:text-2xl font-extrabold text-white tracking-wide">{theme.title}</h3>
          <p className="text-xs text-slate-200 mt-1">
            {targetRoulette.isDoubleKudo && activeCategory === 'seguir'
              ? 'Medalla Verde +2 ⭐ para ti y +2 ⭐ para el compañero'
              : theme.badgeText}
          </p>
        </div>

        {/* Wildcard Rule prompt if player already has this medal */}
        {targetRoulette.isWildcard && targetRoulette.availableCategories && targetRoulette.availableCategories.length > 0 && (
          <div className="mb-4 p-3 rounded-2xl bg-yellow-500/15 border border-yellow-400/40 text-xs text-yellow-200 text-center">
            <span className="font-bold">✨ ¡REGLA COMODÍN ACTIVA!</span> Ya posees esta medalla. Puedes elegir libremente completar una de tus categorías pendientes:
            <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
              {targetRoulette.availableCategories.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  aria-pressed={activeCategory === cat}
                  disabled={!isMyTurn}
                  onClick={() => setActiveCategory(cat)}
                  className={`min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 ${
                    activeCategory === cat
                      ? 'bg-yellow-400 text-slate-950 scale-105 shadow-md'
                      : 'bg-slate-800 text-slate-200 border border-white/15 hover:bg-slate-700'
                  }`}
                >
                  {cat === 'seguir' && '🟢 Seguir'}
                  {cat === 'mejorar' && '🟡 Mejorar'}
                  {cat === 'dejar' && '🔴 Dejar'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected Teammate Box (Only for Verde & Amarilla) */}
        {activeCategory !== 'dejar' && (
          <div
            aria-live="polite"
            className="mb-5 p-4 rounded-2xl bg-slate-950/90 border border-white/15 flex flex-col items-center justify-center text-center shadow-lg relative"
          >
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              {isSpinning ? '🎰 Girando la Ruleta de Compañeros...' : '🎯 Compañero Seleccionado por la Ruleta:'}
            </div>

            {chosenTeammate && (
              <div className={`flex items-center gap-3.5 transition-all max-w-full ${isSpinning ? 'scale-105' : 'scale-100'}`}>
                <div className="relative shrink-0">
                  <CharacterAvatar characterId={chosenTeammate.characterId} size="lg" />
                  {isSpinning && (
                    <div className="absolute inset-0 rounded-2xl border-2 border-yellow-400 animate-spin motion-reduce:animate-none" />
                  )}
                </div>
                <div className="text-left min-w-0">
                  <div className="text-lg font-black text-white flex items-center gap-2 flex-wrap">
                    <span className="truncate min-w-0">{chosenTeammate.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-white/15 shrink-0">
                      {chosenTeammate.role || CHARACTERS[chosenTeammate.characterId].name}
                    </span>
                  </div>
                  <div className="text-xs text-yellow-300 font-semibold mt-0.5">
                    ⭐ {chosenTeammate.stars} Estrellas
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Card Form (Editable for active player or Host; Spectator view for other phones) */}
        {isMyTurn ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label
                htmlFor={textareaId}
                className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5"
              >
                {activeCategory === 'dejar'
                  ? 'Describe el cuello de botella o mal hábito que debemos eliminar:'
                  : `Tu mensaje sincero para ${chosenTeammate?.name || 'tu compañero'}:`}
              </label>
              <textarea
                id={textareaId}
                required
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={theme.placeholder}
                className="w-full bg-slate-950/90 border border-white/25 rounded-2xl p-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none shadow-inner"
              />
              {!content.trim() && (
                <p className="mt-1 text-xs text-slate-300">
                  Escribe tu aporte para habilitar el botón y ganar tu estrella.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
              <div className="text-xs text-slate-300 font-medium">
                Turno de: <span className="text-white font-bold">{activePlayer?.name}</span>
              </div>

              <button
                type="submit"
                disabled={isSpinning || !content.trim()}
                className="min-h-[44px] px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-extrabold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                <span aria-hidden="true">★</span>
                <span>
                  {targetRoulette.isDoubleKudo ? 'Guardar y Ganar +2 Estrellas' : 'Guardar Tarjeta y Ganar Estrella'}
                </span>
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-950/85 border border-white/15 text-center text-xs text-slate-200 font-semibold">
            ⏳ {activePlayer?.name || 'Tu compañero'} está escribiendo su tarjeta de retrospectiva...
          </div>
        )}
      </div>
    </div>
  );
};