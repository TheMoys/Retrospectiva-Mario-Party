import React, { useState, useEffect } from 'react';
import { Check, Copy, Globe, Wifi } from 'lucide-react';
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
import {
  copyTextToClipboard,
  fetchLocalTunnelUrl,
  getConnectionStatusMeta,
  getMobileJoinUrl,
  getQrCodeImageUrl,
  isPublicHttpsOrigin,
} from '@/utils/networkUrl';
import { CharacterId } from '@/types/game';

export const HostScreen: React.FC = () => {
  const {
    gameState,
    connectionStatus,
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

  const [tunnelUrl, setTunnelUrl] = useState<string | null>(null);
  const [networkMode, setNetworkMode] = useState<'tunnel' | 'wifi'>('wifi');

  // Ensure Host mode is active on mount (GameContext manages transport idempotently)
  useEffect(() => {
    setIsHost(true);
  }, [setIsHost]);

  // Only discover local dev tunnel when running Vite dev server on localhost/127.0.0.1
  useEffect(() => {
    let active = true;
    fetchLocalTunnelUrl().then((url) => {
      if (active && url) {
        setTunnelUrl(url);
        setNetworkMode('tunnel');
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const hasActiveTunnel = Boolean(tunnelUrl);
  const activeBaseUrl = hasActiveTunnel && networkMode === 'tunnel' ? tunnelUrl! : undefined;
  const mobileJoinUrl = getMobileJoinUrl(gameState.roomCode, activeBaseUrl);
  const qrCodeImageUrl = getQrCodeImageUrl(mobileJoinUrl, 200);
  const isCloudHttps = isPublicHttpsOrigin();
  const statusMeta = getConnectionStatusMeta(connectionStatus, gameState.roomCode);

  const handleCopyLink = async () => {
    const ok = await copyTextToClipboard(mobileJoinUrl);
    if (ok) {
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
      {/* 1. Top TV HUD Scoreboard */}
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 border border-yellow-400/40 text-yellow-200 font-bold text-xs md:text-sm shadow-2xl backdrop-blur-md animate-fade-in">
              <span className="text-sm" aria-hidden="true">📢</span>
              <span>{gameState.activeMessage}</span>
            </div>
          </div>
        )}

        {/* Compact Live Connection Pill during gameplay */}
        {gameState.phase !== 'lobby' && (
          <div
            role="status"
            aria-live="polite"
            className={`absolute top-4 right-4 z-20 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold shadow-xl backdrop-blur-md ${statusMeta.badgeClass}`}
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${statusMeta.dotClass} ${
                statusMeta.isAnimated ? 'animate-pulse motion-reduce:animate-none' : ''
              }`}
              aria-hidden="true"
            />
            <span>{statusMeta.label}</span>
          </div>
        )}

        {/* LOBBY FLOATING QR CARD (Visible during lobby phase) */}
        {gameState.phase === 'lobby' && (
          <div className="absolute top-20 left-6 z-30 p-4 rounded-3xl bg-slate-900/95 border-2 border-yellow-400/50 shadow-2xl backdrop-blur-md flex flex-col items-center gap-2.5 w-[240px] animate-fade-in">
            {/* Truthful Live Connection Pill */}
            <div
              role="status"
              aria-live="polite"
              className={`w-full justify-center inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold shadow-sm ${statusMeta.badgeClass}`}
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${statusMeta.dotClass} ${
                  statusMeta.isAnimated ? 'animate-pulse motion-reduce:animate-none' : ''
                }`}
                aria-hidden="true"
              />
              <span className="truncate">{statusMeta.label}</span>
            </div>

            <div className="bg-white p-2 rounded-2xl shadow-inner">
              <img
                src={qrCodeImageUrl}
                alt={`Código QR para unirse a la sala ${gameState.roomCode}`}
                width={144}
                height={144}
                className="w-36 h-36 rounded-lg object-contain"
              />
            </div>

            <div className="text-center w-full">
              <div className="text-[11px] uppercase font-bold text-slate-300">Escanea con tu móvil</div>
              <div className="text-2xl font-black text-yellow-300 tracking-wider font-pixel my-1">
                {gameState.roomCode}
              </div>

              {/* Local Dev Tunnel Switcher (ONLY when localhost + /api/tunnel active:true) */}
              {hasActiveTunnel ? (
                <div className="flex flex-col gap-1.5 my-1.5">
                  <div className="flex items-center justify-center bg-slate-950/90 p-1 rounded-xl border border-white/15 text-[11px] shadow gap-1">
                    <button
                      type="button"
                      onClick={() => setNetworkMode('tunnel')}
                      className={`flex-1 min-h-[36px] px-2 py-1 rounded-lg font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        networkMode === 'tunnel' ? 'bg-blue-700 text-white shadow' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Globe className="w-3 h-3 shrink-0" aria-hidden="true" />
                      <span>Túnel</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNetworkMode('wifi')}
                      className={`flex-1 min-h-[36px] px-2 py-1 rounded-lg font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        networkMode === 'wifi' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Wifi className="w-3 h-3 shrink-0" aria-hidden="true" />
                      <span>Wi-Fi</span>
                    </button>
                  </div>
                </div>
              ) : isCloudHttps ? (
                <div className="text-[11px] text-emerald-200 font-semibold bg-emerald-950/90 border border-emerald-400/45 px-2.5 py-1.5 rounded-xl mt-1 leading-snug">
                  🌐 Conectado en la nube · Funciona con cualquier Wi-Fi o datos móviles
                </div>
              ) : (
                <div className="text-[11px] text-cyan-100 font-semibold bg-slate-950/85 border border-cyan-400/35 px-2.5 py-1.5 rounded-xl mt-1 leading-snug">
                  📶 Red local · Comparte este enlace en tu red o navegador
                </div>
              )}

              <div className="text-xs font-bold text-cyan-200 bg-slate-950/90 px-2.5 py-1 rounded-xl border border-white/15 mt-2">
                {gameState.players.length}/6 Jugadores
              </div>

              <button
                type="button"
                onClick={() => void handleCopyLink()}
                className={`mt-2 w-full min-h-[44px] py-2 px-3 rounded-xl text-xs border transition-all font-extrabold cursor-pointer shadow flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                  copied
                    ? 'bg-emerald-700 text-white border-emerald-300 ring-1 ring-emerald-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border-white/20 active:scale-95'
                }`}
              >
                {copied ? (
                  <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                ) : (
                  <Copy className="w-4 h-4 shrink-0" aria-hidden="true" />
                )}
                <span>{copied ? '¡Enlace copiado!' : 'Copiar Enlace'}</span>
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

        {/* Bottom Left Legend for Spaces (Positioned clear of Sound Toggle button) */}
        <div className="absolute bottom-4 left-16 z-20 hidden sm:flex select-none pointer-events-none">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-white/15 text-[11px] font-bold backdrop-blur-md shadow-xl">
            <span className="flex items-center gap-1 text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" /> Seguir
            </span>
            <span className="flex items-center gap-1 text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400" aria-hidden="true" /> Mejorar
            </span>
            <span className="flex items-center gap-1 text-rose-300">
              <span className="w-2 h-2 rounded-full bg-rose-400" aria-hidden="true" /> Dejar
            </span>
            <span className="flex items-center gap-1 text-purple-300">
              <span className="w-2 h-2 rounded-full bg-purple-400" aria-hidden="true" /> Evento
            </span>
          </div>
        </div>

        {/* Floating Host Controls Bar (Bottom Center) */}
        <div className="absolute bottom-4 right-4 sm:left-1/2 sm:transform sm:-translate-x-1/2 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-white/15 px-3.5 py-2 rounded-2xl shadow-2xl">
          {gameState.phase === 'lobby' ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={startGame}
                disabled={gameState.players.length === 0}
                className={`min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xl flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 ${
                  gameState.players.length > 0
                    ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 hover:brightness-105 active:scale-95 animate-pulse motion-reduce:animate-none cursor-pointer'
                    : 'bg-slate-800 border border-white/15 text-slate-300 cursor-not-allowed opacity-65'
                }`}
              >
                <span aria-hidden="true">▶</span>
                <span>¡EMPEZAR A JUGAR! ({gameState.players.length} JUGADORES)</span>
              </button>

              {gameState.players.length === 0 && (
                <button
                  type="button"
                  onClick={handleAddTestBots}
                  className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-yellow-400/40 text-yellow-200 text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300"
                  title="Añadir 4 compañeros de prueba para probar sin móviles"
                >
                  <span aria-hidden="true">🤖</span>
                  <span>Añadir Bots (4)</span>
                </button>
              )}
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => nextTurn()}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 text-xs font-black uppercase hover:brightness-105 active:scale-95 transition-all shadow-md flex items-center gap-1 cursor-pointer"
              >
                <span aria-hidden="true">🎲</span>
                <span>Avanzar Turno</span>
              </button>

              <div className="h-4 w-[1px] bg-white/20 mx-1" />

              {/* Trigger Minigames */}
              <button
                type="button"
                onClick={() => triggerMinigame('block_smash')}
                className="min-h-[44px] px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-200 border border-amber-400/40 text-xs font-bold cursor-pointer"
              >
                ⚡ Machaca ?
              </button>

              <button
                type="button"
                onClick={() => triggerMinigame('quick_vote')}
                className="min-h-[44px] px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-200 border border-cyan-400/40 text-xs font-bold cursor-pointer"
              >
                🗳️ Votación
              </button>

              <div className="h-4 w-[1px] bg-white/20 mx-1" />

              {/* Peaje & Podium */}
              <button
                type="button"
                onClick={() => enterPeaje()}
                className="min-h-[44px] px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-200 border border-purple-400/40 text-xs font-bold cursor-pointer"
              >
                🚧 El Peaje
              </button>

              <button
                type="button"
                onClick={() => enterPodium()}
                className="min-h-[44px] px-3 py-2 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 text-xs font-black flex items-center gap-1 shadow-md hover:brightness-105 cursor-pointer"
              >
                <span aria-hidden="true">🏆</span>
                <span>Podio</span>
              </button>

              <button
                type="button"
                onClick={() => setExportModalOpen(true)}
                className="min-h-[44px] px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/15 cursor-pointer"
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
