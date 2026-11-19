import React, { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { GameBoard3D } from '@/Three/GameBoard3D';
import { TopScoreboard } from './TopScoreboard';
import { PodiumModal } from './PodiumModal';
import { RetroExportModal } from './RetroExportModal';
import { BlockSmashMinigame } from '@/components/Minigames/BlockSmashMinigame';
import { QuickVoteMinigame } from '@/components/Minigames/QuickVoteMinigame';

export const HostScreen: React.FC = () => {
  const { gameState, triggerMinigame, enterPeaje, enterPodium, nextTurn, resetGame } = useGame();
  const [exportModalOpen, setExportModalOpen] = useState(false);

  return (
    <div className="relative w-screen h-screen bg-slate-950 overflow-hidden select-none flex flex-col">
      {/* 1. Top TV HUD Scoreboard */}
      <TopScoreboard gameState={gameState} />

      {/* 2. Fullscreen 3D WebGL Rainbow Road Stage */}
      <div className="flex-1 relative w-full h-full">
        <GameBoard3D gameState={gameState} />

        {/* Live Active Turn / Status Message Toast */}
        {gameState.activeMessage && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none">
            <div className="px-5 py-2.5 rounded-full bg-slate-900/90 border border-yellow-400/40 text-yellow-300 font-bold text-xs md:text-sm shadow-2xl backdrop-blur-md animate-fade-in flex items-center gap-2">
              <span className="text-base">📢</span>
              <span>{gameState.activeMessage}</span>
            </div>
          </div>
        )}

        {/* Floating Host Controls Bar (Bottom) */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-2 bg-slate-900/85 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-2xl shadow-2xl">
          <button
            onClick={() => nextTurn()}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-extrabold uppercase hover:brightness-110 active:scale-95 transition-all shadow-md flex items-center gap-1.5"
          >
            <span>🎲</span>
            <span>Avanzar Turno</span>
          </button>

          <div className="h-4 w-[1px] bg-white/20 mx-1" />

          {/* Trigger Minigames */}
          <button
            onClick={() => triggerMinigame('block_smash')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/30 text-xs font-bold flex items-center gap-1"
          >
            <span>⚡</span>
            <span>Machaca ?</span>
          </button>

          <button
            onClick={() => triggerMinigame('quick_vote')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-400/30 text-xs font-bold flex items-center gap-1"
          >
            <span>🗳️</span>
            <span>Votación</span>
          </button>

          <div className="h-4 w-[1px] bg-white/20 mx-1" />

          {/* Peaje & Podium */}
          <button
            onClick={() => enterPeaje()}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-400/30 text-xs font-bold"
          >
            🏁 El Peaje
          </button>

          <button
            onClick={() => enterPodium()}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 text-xs font-extrabold flex items-center gap-1 shadow-md hover:brightness-110"
          >
            <span>🏆</span>
            <span>Podio</span>
          </button>

          <button
            onClick={() => setExportModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-white/10"
          >
            📋 Ver Acta ({gameState.retroCards.length})
          </button>
        </div>
      </div>

      {/* Minigames Overlay */}
      {gameState.phase === 'minigame' && gameState.minigame?.type === 'block_smash' && (
        <BlockSmashMinigame isController={false} />
      )}
      {gameState.phase === 'minigame' && gameState.minigame?.type === 'quick_vote' && (
        <QuickVoteMinigame isController={false} />
      )}

      {/* Final Podium Ceremony */}
      <PodiumModal
        isOpen={gameState.phase === 'podium'}
        onOpenRetroExport={() => setExportModalOpen(true)}
        onRestart={resetGame}
      />

      {/* Full Retrospective Export & Mailbox Modal */}
      <RetroExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
      />
    </div>
  );
};
