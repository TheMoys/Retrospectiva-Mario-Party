import React, { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { RetroCategory, CharacterId } from '@/types/game';
import { CHARACTERS } from '@/constants/characters';
import { CharacterAvatar } from '@/components/Common/CharacterAvatar';
import { sounds } from '@/audio/soundEffects';

export const PeajeModal: React.FC = () => {
  const { gameState, submitPeajeCard } = useGame();
  const { players, phase } = gameState;

  // Find players with missing medals
  const pendingPlayers = players.filter((p) => !p.medals.seguir || !p.medals.mejorar || !p.medals.dejar);
  const currentPendingPlayer = pendingPlayers[0];

  const [selectedCategory, setSelectedCategory] = useState<RetroCategory>(() => {
    if (!currentPendingPlayer) return 'seguir';
    if (!currentPendingPlayer.medals.seguir) return 'seguir';
    if (!currentPendingPlayer.medals.mejorar) return 'mejorar';
    return 'dejar';
  });

  const [content, setContent] = useState('');
  const [targetId, setTargetId] = useState('');

  if (phase !== 'peaje' || !currentPendingPlayer) return null;

  const teammates = players.filter((p) => p.id !== currentPendingPlayer.id);

  const missingMedalsList: RetroCategory[] = [];
  if (!currentPendingPlayer.medals.seguir) missingMedalsList.push('seguir');
  if (!currentPendingPlayer.medals.mejorar) missingMedalsList.push('mejorar');
  if (!currentPendingPlayer.medals.dejar) missingMedalsList.push('dejar');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const chosenPartner = teammates.find((t) => t.id === targetId) || teammates[0];

    submitPeajeCard({
      playerId: currentPendingPlayer.id,
      playerName: currentPendingPlayer.name,
      characterId: currentPendingPlayer.characterId,
      category: selectedCategory,
      content: content.trim(),
      recipientId: selectedCategory === 'dejar' ? undefined : chosenPartner?.id,
      recipientName: selectedCategory === 'dejar' ? undefined : chosenPartner?.name,
    });

    setContent('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="w-full max-w-xl rounded-3xl border-2 border-amber-500/80 p-6 md:p-8 shadow-2xl bg-gradient-to-b from-amber-950 via-slate-900 to-slate-950 flex flex-col animate-modal-spring">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-950/80 border border-amber-400/40 text-xs font-bold text-amber-300 mb-2">
            <span>🚧</span>
            <span>FASE DE EQUILIBRIO: EL PEAJE</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-black text-white">
            Nadie se va sin aportar
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Han terminado las 4 rondas. Para optar al podio y a las Bonus Stars, cada participante debe completar sus 3 medallas.
          </p>
        </div>

        {/* Current Pending Player Banner */}
        <div className="p-4 rounded-2xl bg-slate-950/90 border border-white/10 flex items-center gap-3.5 mb-4">
          <CharacterAvatar characterId={currentPendingPlayer.characterId} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-extrabold text-white flex items-center gap-2">
              <span>{currentPendingPlayer.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {currentPendingPlayer.role || CHARACTERS[currentPendingPlayer.characterId].name}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Medallas pendientes: {missingMedalsList.map((m) => (m === 'seguir' ? '🟢 Seguir ' : m === 'mejorar' ? '🟡 Mejorar ' : '🔴 Dejar '))}
            </div>
          </div>
        </div>

        {/* Select which missing category to fill */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
            Completa tu tarjeta pendiente:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {missingMedalsList.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  selectedCategory === cat
                    ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                    : 'bg-slate-800 text-slate-300 border-white/10 hover:bg-slate-750'
                }`}
              >
                {cat === 'seguir' && '🟢 Seguir'}
                {cat === 'mejorar' && '🟡 Mejorar'}
                {cat === 'dejar' && '🔴 Dejar'}
              </button>
            ))}
          </div>
        </div>

        {/* Teammate recipient if Seguir or Mejorar */}
        {selectedCategory !== 'dejar' && (
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
              Dirigido al compañero:
            </label>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-1.5">
              {teammates.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setTargetId(t.id)}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                    targetId === t.id
                      ? 'bg-amber-400/20 border-amber-400 shadow-sm'
                      : 'bg-slate-950 border-white/10 hover:bg-slate-800'
                  }`}
                >
                  <CharacterAvatar characterId={t.characterId} size="sm" showBorder={false} />
                  <span className="text-[10px] font-bold text-white truncate w-full text-center">{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Text Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <textarea
            required
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escribe tu aporte para completar tu álbum de medallas..."
            className="w-full bg-slate-950/90 border border-white/20 rounded-2xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none shadow-inner"
          />

          <button
            type="submit"
            disabled={!content.trim()}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-extrabold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-xl disabled:opacity-50"
          >
            Aportar al Peaje y Desbloquear Medalla (+1 ⭐)
          </button>
        </form>
      </div>
    </div>
  );
};