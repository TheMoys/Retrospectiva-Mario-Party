import React, { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { CHARACTERS } from '@/constants/characters';
import { BOARD_SPACES } from '@/constants/boardSpaces';
import { DicePad } from './DicePad';
import { BackpackModal } from './BackpackModal';
import { RetroCardModal } from './RetroCardModal';
import { BlockSmashMinigame } from '@/components/Minigames/BlockSmashMinigame';
import { QuickVoteMinigame } from '@/components/Minigames/QuickVoteMinigame';
import { RetroCategory } from '@/types/game';

export const ControllerScreen: React.FC = () => {
  const { gameState, myPlayerId } = useGame();
  const [backpackOpen, setBackpackOpen] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardCategory, setCardCategory] = useState<RetroCategory>('seguir');

  const me = gameState.players.find((p) => p.id === myPlayerId);
  const activePlayer = gameState.players[gameState.activePlayerIndex];
  const isMyTurn = activePlayer?.id === myPlayerId;

  // Detect if landed on a retro space
  const currentSpace = BOARD_SPACES[me?.spaceIndex || 0];

  // Open modal if action is required on turn
  React.useEffect(() => {
    if (isMyTurn && gameState.phase === 'space_action') {
      if (currentSpace.type === 'green') {
        setCardCategory('seguir');
        setCardModalOpen(true);
      } else if (currentSpace.type === 'yellow') {
        setCardCategory('mejorar');
        setCardModalOpen(true);
      } else if (currentSpace.type === 'red') {
        setCardCategory('dejar');
        setCardModalOpen(true);
      }
    }
  }, [isMyTurn, gameState.phase, currentSpace.type]);

  if (!me) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
        <span className="text-5xl animate-bounce mb-3">🎮</span>
        <h2 className="text-xl font-bold">Conectando Joy-Phone...</h2>
        <p className="text-xs text-slate-400 mt-1">Sala: {gameState.roomCode}</p>
      </div>
    );
  }

  const char = CHARACTERS[me.characterId];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col select-none overflow-x-hidden">
      {/* Top Mobile Joy-Phone Header */}
      <div
        className="p-4 border-b border-white/10 flex items-center justify-between"
        style={{ backgroundColor: `${char.color}22` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-bold border-2 shadow-md"
            style={{ backgroundColor: `${char.color}44`, borderColor: char.neonColor }}
          >
            {char.avatar}
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Joy-Phone</div>
            <div className="text-base font-extrabold text-white flex items-center gap-1.5">
              <span>{me.name}</span>
              {gameState.starLeaderId === me.id && <span>👑</span>}
            </div>
          </div>
        </div>

        {/* Stars and Medals */}
        <div className="text-right">
          <div className="text-sm font-extrabold text-yellow-300 flex items-center justify-end gap-1">
            <span>⭐ {me.stars}</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs">
            <span className={me.medals.seguir ? 'opacity-100' : 'opacity-25 grayscale'}>🟢</span>
            <span className={me.medals.mejorar ? 'opacity-100' : 'opacity-25 grayscale'}>🟡</span>
            <span className={me.medals.dejar ? 'opacity-100' : 'opacity-25 grayscale'}>🔴</span>
          </div>
        </div>
      </div>

      {/* Main Gamepad Action Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <DicePad
          isMyTurn={isMyTurn}
          onOpenBackpack={() => setBackpackOpen(true)}
          hasPowerUps={me.powerUps.length > 0}
        />
      </div>

      {/* Quick Action Button: Redactar Tarjeta Manualmente (if needed) */}
      <div className="p-4 border-t border-white/10 flex gap-2">
        <button
          onClick={() => {
            setCardCategory('seguir');
            setCardModalOpen(true);
          }}
          className="flex-1 py-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold hover:bg-emerald-900/60"
        >
          🟢 Elogio
        </button>
        <button
          onClick={() => {
            setCardCategory('mejorar');
            setCardModalOpen(true);
          }}
          className="flex-1 py-2.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-amber-900/60"
        >
          🟡 Mejorar
        </button>
        <button
          onClick={() => {
            setCardCategory('dejar');
            setCardModalOpen(true);
          }}
          className="flex-1 py-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-bold hover:bg-rose-900/60"
        >
          🔴 Dejar
        </button>
      </div>

      {/* Minigames Overlay on Phone */}
      {gameState.phase === 'minigame' && gameState.minigame?.type === 'block_smash' && (
        <BlockSmashMinigame isController={true} />
      )}
      {gameState.phase === 'minigame' && gameState.minigame?.type === 'quick_vote' && (
        <QuickVoteMinigame isController={true} />
      )}

      {/* Backpack Drawer Modal */}
      <BackpackModal isOpen={backpackOpen} onClose={() => setBackpackOpen(false)} />

      {/* Retro Card Form Modal */}
      <RetroCardModal
        isOpen={cardModalOpen}
        category={cardCategory}
        onClose={() => setCardModalOpen(false)}
      />
    </div>
  );
};
