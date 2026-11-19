import React, { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { RetroCategory } from '@/types/game';
import { CHARACTERS } from '@/constants/characters';

interface RetroCardModalProps {
  isOpen: boolean;
  category: RetroCategory;
  onClose: () => void;
}

export const RetroCardModal: React.FC<RetroCardModalProps> = ({ isOpen, category, onClose }) => {
  const { gameState, submitRetroCard, nextTurn, myPlayerId } = useGame();
  const [content, setContent] = useState('');
  const [recipientId, setRecipientId] = useState('');

  if (!isOpen) return null;

  const me = gameState.players.find((p) => p.id === myPlayerId);
  const teammates = gameState.players.filter((p) => p.id !== myPlayerId);

  const getCategoryInfo = () => {
    switch (category) {
      case 'seguir':
        return {
          title: '🟢 Seguir Haciendo (Elogio)',
          subtitle: 'Reconoce el trabajo, apoyo o logro de un compañero de equipo.',
          color: 'border-emerald-500 bg-emerald-950/40 text-emerald-300',
          badge: 'Medalla Verde',
          placeholder: 'Ej: Gracias a Pipe por optimizar las queries y desbloquear el release...',
        };
      case 'mejorar':
        return {
          title: '🟡 Mejorar / Potenciar',
          subtitle: 'Propón una optimización técnica o de proceso para el próximo sprint.',
          color: 'border-amber-500 bg-amber-950/40 text-amber-300',
          badge: 'Medalla Amarilla',
          placeholder: 'Ej: Deberíamos acordar los contratos de API antes de codificar el frontend...',
        };
      case 'dejar':
        return {
          title: '🔴 Dejar de Hacer (Freno)',
          subtitle: 'Señala un blocker, deuda técnica o mal hábito que nos resta velocidad.',
          color: 'border-rose-500 bg-rose-950/40 text-rose-300',
          badge: 'Medalla Roja',
          placeholder: 'Ej: Dejar de aceptar requerimientos imprecisos a mitad del sprint...',
        };
    }
  };

  const info = getCategoryInfo();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !me) return;

    const recipient = teammates.find((t) => t.id === recipientId);

    submitRetroCard({
      playerId: me.id,
      playerName: me.name,
      characterId: me.characterId,
      category,
      content: content.trim(),
      recipientId: recipient?.id,
      recipientName: recipient?.name,
    });

    setContent('');
    setRecipientId('');
    onClose();
    setTimeout(() => {
      nextTurn();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className={`w-full max-w-lg rounded-3xl border-2 p-6 shadow-2xl bg-slate-900 ${info.color}`}>
        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border border-current">
            ⭐ RECOMPENSA: +1 ESTRELLA Y {info.badge}
          </div>
          <h3 className="text-xl md:text-2xl font-extrabold text-white">{info.title}</h3>
          <p className="text-xs text-slate-300 mt-1">{info.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* If 'seguir', select which teammate receives praise */}
          {category === 'seguir' && teammates.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
                ¿A quién va dirigido este elogio? (Opcional)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {teammates.map((tm) => {
                  const char = CHARACTERS[tm.characterId];
                  const isSelected = recipientId === tm.id;

                  return (
                    <button
                      type="button"
                      key={tm.id}
                      onClick={() => setRecipientId(isSelected ? '' : tm.id)}
                      className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                        isSelected
                          ? 'bg-emerald-500/30 border-emerald-400 ring-2 ring-emerald-400 text-white'
                          : 'bg-slate-800 border-white/10 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      <span>{char.avatar}</span>
                      <span className="truncate">{tm.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Card Content Textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
              Tu Aporte para la Retrospectiva:
            </label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={info.placeholder}
              className="w-full bg-slate-950 border border-white/20 rounded-2xl p-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={!content.trim()}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-extrabold text-sm uppercase hover:brightness-110 active:scale-98 transition-all shadow-xl disabled:opacity-50"
            >
              ¡Publicar Tarjeta y Ganar +1 ⭐!
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
