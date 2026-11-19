import React, { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { POWER_UPS } from '@/constants/powerUps';
import { PowerUpType } from '@/types/game';
import { CHARACTERS } from '@/constants/characters';

interface BackpackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackpackModal: React.FC<BackpackModalProps> = ({ isOpen, onClose }) => {
  const { gameState, usePowerUp, myPlayerId } = useGame();
  const [selectedPowerUp, setSelectedPowerUp] = useState<PowerUpType | null>(null);
  const [targetPlayerId, setTargetPlayerId] = useState<string>('');

  if (!isOpen) return null;

  const me = gameState.players.find((p) => p.id === myPlayerId);
  const powerUps = me?.powerUps || [];
  const rivals = gameState.players.filter((p) => p.id !== myPlayerId);

  const handleUse = (pUp: PowerUpType) => {
    if (pUp === 'boo') {
      setSelectedPowerUp('boo');
      return;
    }

    usePowerUp(myPlayerId, pUp);
    onClose();
  };

  const confirmBooUse = () => {
    if (!targetPlayerId) return;
    usePowerUp(myPlayerId, 'boo', targetPlayerId);
    setSelectedPowerUp(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border-2 border-amber-400/50 rounded-3xl p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎒</span>
            <h3 className="text-lg font-bold text-white">Mochila de Power-Ups</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Boo Target Selection Mode */}
        {selectedPowerUp === 'boo' ? (
          <div className="py-4">
            <div className="text-center mb-4">
              <span className="text-4xl animate-bounce inline-block">👻</span>
              <h4 className="text-base font-bold text-white mt-1">Elige a qué rival robar</h4>
              <p className="text-xs text-slate-400">Boo le arrebatará 1 Estrella para dártela a ti.</p>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {rivals.map((rival) => {
                const char = CHARACTERS[rival.characterId];
                const isSelected = targetPlayerId === rival.id;

                return (
                  <button
                    key={rival.id}
                    onClick={() => setTargetPlayerId(rival.id)}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      isSelected
                        ? 'bg-purple-900/60 border-purple-400 ring-2 ring-purple-400'
                        : 'bg-slate-800/80 border-white/10 hover:bg-slate-750'
                    }`}
                  >
                    <span className="text-xl">{char.avatar}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{rival.name}</div>
                      <div className="text-[10px] text-yellow-300">⭐ {rival.stars}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedPowerUp(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700"
              >
                Volver
              </button>
              <button
                onClick={confirmBooUse}
                disabled={!targetPlayerId}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-xs font-bold text-white disabled:opacity-40 hover:brightness-110"
              >
                ¡Robar Estrella!
              </button>
            </div>
          </div>
        ) : (
          /* Normal Backpack Items List */
          <div className="py-4">
            {powerUps.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Tu mochila está vacía. Cae en casillas moradas de 🟣 Caos para ganar objetos.
              </div>
            ) : (
              <div className="space-y-3">
                {powerUps.map((pUp, idx) => {
                  const info = POWER_UPS[pUp];

                  return (
                    <div
                      key={`${pUp}-${idx}`}
                      className="p-3.5 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 border"
                          style={{ backgroundColor: `${info.color}22`, borderColor: info.color }}
                        >
                          {info.icon}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{info.name}</div>
                          <div className="text-xs text-slate-400 max-w-[200px] leading-tight mt-0.5">
                            {info.description}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleUse(pUp)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-extrabold uppercase hover:brightness-110 active:scale-95 shadow-md shrink-0"
                      >
                        Usar
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
