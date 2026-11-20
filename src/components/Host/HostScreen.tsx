import React, { useState, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import { GameBoard3D } from '@/Three/GameBoard3D';
import { TopScoreboard } from './TopScoreboard';
import { PodiumModal } from './PodiumModal';
import { RetroExportModal } from './RetroExportModal';
import { NormasModal } from './NormasModal';
import { PeajeModal } from './PeajeModal';
import { BonusStarsModal } from './BonusStarsModal';
import { TargetRouletteModal } from '@/components/Common/TargetRouletteModal';
import { ChaosEventModal } from '@/components/Common/ChaosEventModal';
import { BlockSmashMinigame } from '@/components/Minigames/BlockSmashMinigame';
import { QuickVoteMinigame } from '@/components/Minigames/QuickVoteMinigame';
import { MinigameIntroModal } from '@/components/Minigames/MinigameIntroModal';
import { CinematicDiceOverlay } from '@/components/Common/CinematicDiceOverlay';
import { RoundSelector } from './RoundSelector';
import { getMobileJoinUrl, getQrCodeImageUrl, DEFAULT_TUNNEL_URL } from '@/utils/networkUrl';
import { network } from '@/services/network';
import { CharacterId } from '@/types/game';

export const HostScreen: React.FC = () => {
  const {
    gameState,
    triggerMinigame,
    startMinigamePlay,
    enterPeaje,
    enterPodium,
    nextTurn,
    resetGame,
    startGame,
    joinPlayer,
    setIsHost,
    setTotalRounds,
  } = useGame();
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [normasOpen, setNormasOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Ensure Host initializes WebRTC PeerJS on mount so phones can connect
  useEffect(() => {
    setIsHost(true);
    network.initHost(gameState.roomCode, (peerId) => {
      console.log('Host WebRTC active with Peer ID:', peerId);
    });
  }, [gameState.roomCode, setIsHost]);

  const [tunnelUrl, setTunnelUrl] = useState<string>(DEFAULT_TUNNEL_URL);
  const [networkMode, setNetworkMode] = useState<'tunnel' | 'wifi'>('tunnel');

  useEffect(() => {
    fetch('/api/tunnel')
      .then((res) => res.json())
      .then((data) => {
        if (data.active && data.url) {
          setTunnelUrl(data.url);
        }
      })
      .catch(() => {});
  }, []);

  const activeBaseUrl = networkMode === 'tunnel' && tunnelUrl ? tunnelUrl : undefined;
  const mobileJoinUrl = getMobileJoinUrl(gameState.roomCode, activeBaseUrl);
  const qrCodeImageUrl = getQrCodeImageUrl(mobileJoinUrl, 200);

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(mobileJoinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddTestBots = () => {
    if (gameState.players.length >= 6) return;
    const remainingSlots = 6 - gameState.players.length;
    const candidates = [
      { name: 'Alex', role: 'Front', char: 'mario' as CharacterId },
      { name: 'Sofía', role: 'Back', char: 'luigi' as CharacterId },
      { name: 'Mateo', role: 'QA', char: 'peach' as CharacterId },
      { name: 'Lucía', role: 'UX', char: 'yoshi' as CharacterId },
      { name: 'Carlos', role: 'DevOps', char: 'bowser' as CharacterId },
      { name: 'Elena', role: 'PO', char: 'toad' as CharacterId },
    ];
    const takenChars = new Set(gameState.players.map((p) => p.characterId));
    const available = candidates.filter((c) => !takenChars.has(c.char));
    available.slice(0, Math.min(4, remainingSlots)).forEach((bot) => {
      joinPlayer(bot.name, bot.char, bot.role);
    });
  };

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden select-none flex flex-col font-game">
      {/* 1. Top TV HUD Scoreboard (Matching Reference) */}
      <TopScoreboard
        gameState={gameState}
        onOpenNormas={() => setNormasOpen(true)}
        onTriggerMinigame={() => triggerMinigame('block_smash')}
        onResetGame={resetGame}
      />

      {/* 2. Fullscreen 3D WebGL Stage */}
      <div className="flex-1 relative w-full h-full">
        <GameBoard3D gameState={gameState} />

        {/* Live Active Turn / Status Toast */}
        {gameState.activeMessage && (
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none max-w-lg w-full px-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 border border-yellow-400/40 text-yellow-300 font-bold text-xs md:text-sm shadow-2xl backdrop-blur-md animate-fade-in">
              <span className="text-sm">📢</span>
              <span>{gameState.activeMessage}</span>
            </div>
          </div>
        )}

        {/* LOBBY FLOATING QR CARD (Visible during lobby phase) */}
        {gameState.phase === 'lobby' && (
          <div className="absolute top-20 left-6 z-30 p-3.5 rounded-3xl bg-slate-900/95 border-2 border-yellow-400/50 shadow-2xl backdrop-blur-md flex flex-col items-center gap-2 max-w-[220px] animate-fade-in">
            <div className="bg-white p-2 rounded-2xl shadow-inner">
              <img
                src={qrCodeImageUrl}
                alt="Código QR para unirse"
                className="w-36 h-36 rounded-lg object-contain"
              />
            </div>
            <div className="text-center w-full">
              <div className="text-[10px] uppercase font-bold text-slate-400">Escanea con tu móvil</div>
              <div className="text-2xl font-black text-yellow-300 tracking-wider font-pixel my-0.5">{gameState.roomCode}</div>

              {/* Mode switch between Public Tunnel (Univ / 4G / 5G) and Local Wi-Fi */}
              <div className="flex items-center justify-center bg-slate-950/90 p-0.5 rounded-lg border border-white/15 text-[9px] my-1 shadow">
                <button
                  type="button"
                  onClick={() => setNetworkMode('tunnel')}
                  className={`px-2 py-0.5 rounded font-extrabold transition-all ${
                    networkMode === 'tunnel' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🌐 Univ / 4G
                </button>
                <button
                  type="button"
                  onClick={() => setNetworkMode('wifi')}
                  className={`px-2 py-0.5 rounded font-extrabold transition-all ${
                    networkMode === 'wifi' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📶 Wi-Fi Local
                </button>
              </div>

              <div className="text-[11px] font-bold text-cyan-300 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-white/10 mt-1">
                {gameState.players.length}/6 Jugadores
              </div>

              <div className="text-[9px] text-slate-300 font-medium mt-1">
                {networkMode === 'tunnel' ? '🌐 Cualquier Wi-Fi o 4G/5G' : '📶 Misma Wi-Fi requerida'}
              </div>

              <button
                onClick={handleCopyLink}
                className={`mt-1.5 w-full py-1.5 px-2 rounded-lg text-[10px] border border-white/10 transition-all font-bold cursor-pointer shadow ${
                  copied
                    ? 'bg-emerald-600 text-white ring-1 ring-emerald-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                {copied ? '✓ ¡Copiado!' : '📋 Copiar Enlace'}
              </button>
            </div>
          </div>
        )}

        {/* LOBBY ROUND SELECTOR CARD (Floating on top right during lobby phase) */}
        {gameState.phase === 'lobby' && (
          <div className="absolute top-20 right-6 z-30 max-w-sm sm:max-w-md w-full animate-fade-in hidden sm:block">
            <RoundSelector
              selectedRounds={gameState.totalRounds}
              playerCount={gameState.players.length}
              onChange={setTotalRounds}
            />
          </div>
        )}

        {/* Bottom Left Legend for Spaces (Compact & Clean) */}
        <div className="absolute bottom-4 left-4 z-20 hidden sm:flex select-none pointer-events-none">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-900/85 border border-white/10 text-[10px] font-bold backdrop-blur-md shadow-xl">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Seguir
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Mejorar
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-400" /> Dejar
            </span>
            <span className="flex items-center gap-1 text-purple-400">
              <span className="w-2 h-2 rounded-full bg-purple-400" /> Evento
            </span>
          </div>
        </div>

        {/* Floating Host Controls Bar (Bottom Center) */}
        <div className="absolute bottom-4 right-4 sm:left-1/2 sm:transform sm:-translate-x-1/2 z-20 flex items-center gap-2 bg-slate-900/85 backdrop-blur-md border border-white/10 px-3.5 py-2 rounded-2xl shadow-2xl">
          {gameState.phase === 'lobby' ? (
            <div className="flex items-center gap-2">
              <button
                onClick={startGame}
                disabled={gameState.players.length === 0}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xl flex items-center gap-2 ${
                  gameState.players.length > 0
                    ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 hover:brightness-110 active:scale-95 animate-pulse cursor-pointer'
                    : 'bg-slate-800 border border-white/10 text-slate-500 cursor-not-allowed opacity-60'
                }`}
              >
                <span>▶</span>
                <span>¡EMPEZAR A JUGAR! ({gameState.players.length} JUGADORES)</span>
              </button>

              {gameState.players.length === 0 && (
                <button
                  onClick={handleAddTestBots}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-yellow-400/30 text-yellow-300 text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                  title="Añadir 4 compañeros de prueba para probar sin móviles"
                >
                  <span>🤖</span>
                  <span>Añadir Bots (4)</span>
                </button>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={() => nextTurn()}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-black uppercase hover:brightness-110 active:scale-95 transition-all shadow-md flex items-center gap-1"
              >
                <span>🎲</span>
                <span>Avanzar Turno</span>
              </button>

              <div className="h-4 w-[1px] bg-white/20 mx-1" />

              {/* Trigger Minigames */}
              <button
                onClick={() => triggerMinigame('block_smash')}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/30 text-xs font-bold"
              >
                ⚡ Machaca ?
              </button>

              <button
                onClick={() => triggerMinigame('quick_vote')}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-400/30 text-xs font-bold"
              >
                🗳️ Votación
              </button>

              <div className="h-4 w-[1px] bg-white/20 mx-1" />

              {/* Peaje & Podium */}
              <button
                onClick={() => enterPeaje()}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-400/30 text-xs font-bold"
              >
                🚧 El Peaje
              </button>

              <button
                onClick={() => enterPodium()}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 text-xs font-black flex items-center gap-1 shadow-md hover:brightness-110"
              >
                <span>🏆</span>
                <span>Podio</span>
              </button>

              <button
                onClick={() => setExportModalOpen(true)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-white/10"
              >
                📋 Acta ({gameState.retroCards.length})
              </button>
            </>
          )}
        </div>
      </div>

      {/* Ruleta de Objetivo Modal */}
      <TargetRouletteModal />

      {/* Casilla de Evento Caos Modal */}
      <ChaosEventModal />

      {/* El Peaje Modal */}
      <PeajeModal />

      {/* Bonus Stars Modal */}
      <BonusStarsModal />

      {/* Normas y Reglas Modal */}
      <NormasModal
        isOpen={normasOpen}
        onClose={() => setNormasOpen(false)}
      />

      {/* Cinematic 3D Dice Tumbling Overlay */}
      {gameState.phase === 'rolling' && (
        <CinematicDiceOverlay
          rolls={gameState.diceRoll}
          playerName={gameState.players[gameState.activePlayerIndex]?.name || 'Jugador'}
          isRolling={true}
        />
      )}

      {/* Minigame Cinematic Instructions Modal */}
      {gameState.phase === 'minigame' && gameState.minigame?.phase === 'instructions' && (
        <MinigameIntroModal
          type={gameState.minigame.type}
          onFinishCountdown={startMinigamePlay}
          isHost={true}
        />
      )}

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