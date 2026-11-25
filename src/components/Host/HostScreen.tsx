import React, { useState, useEffect, useRef } from 'react';
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
import { ActiveMinigameRenderer } from '@/components/Minigames/ActiveMinigameRenderer';
import { MinigameIntroModal } from '@/components/Minigames/MinigameIntroModal';
import { MinigameRouletteModal } from '@/components/Minigames/MinigameRouletteModal';
import { MinigamePickerModal } from '@/components/Minigames/MinigamePickerModal';
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
    triggerMinigameRoulette,
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
  const [minigamePickerOpen, setMinigamePickerOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const [tunnelUrl, setTunnelUrl] = useState<string | null>(null);
  const [networkMode, setNetworkMode] = useState<'tunnel' | 'wifi'>('wifi');
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const [stageWidth, setStageWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );

  // Measure actual 3D stage width (fixes split-screen Demo ~870px vs full Host 1280px+)
  useEffect(() => {
    const el = stageContainerRef.current;
    if (!el) return;
    const updateWidth = () => setStageWidth(el.clientWidth || window.innerWidth);
    updateWidth();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(updateWidth);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

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
  const isWideStage = stageWidth >= 1220;
  const isTabletStage = stageWidth >= 720 && stageWidth < 1220;

  const hostBarPositionClass = isWideStage
    ? 'bottom-4 left-1/2 -translate-x-1/2'
    : isTabletStage
      ? 'bottom-4 left-20 right-20 mx-auto w-fit'
      : 'bottom-20 left-1/2 -translate-x-1/2';

  const backgroundLayerRef = useRef<HTMLDivElement>(null);
  const hasBlockingOverlay =
    exportModalOpen ||
    normasOpen ||
    minigamePickerOpen ||
    gameState.phase === 'rolling' ||
    gameState.phase === 'roulette' ||
    gameState.phase === 'chaos_event' ||
    gameState.phase === 'minigame' ||
    gameState.phase === 'peaje' ||
    gameState.phase === 'bonus_stars' ||
    gameState.phase === 'podium';

  useEffect(() => {
    const el = backgroundLayerRef.current;
    if (!el) return;
    (el as HTMLDivElement & { inert: boolean }).inert = hasBlockingOverlay;
  }, [hasBlockingOverlay]);

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
      <div ref={backgroundLayerRef} className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* 1. Top TV HUD Scoreboard */}
        <TopScoreboard
          gameState={gameState}
          onOpenNormas={() => setNormasOpen(true)}
          onTriggerMinigame={() => triggerMinigameRoulette()}
          onResetGame={resetGame}
        />

        {/* 2. Fullscreen 3D WebGL Stage */}
        <div ref={stageContainerRef} className="flex-1 relative w-full min-h-0 overflow-hidden">
          <GameBoard3D gameState={gameState} />

          {/* Live Active Turn / Status Toast */}
          {gameState.activeMessage && (
            <div className="absolute top-14 md:top-4 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none max-w-lg w-full px-4 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 border border-yellow-400/40 text-yellow-200 font-bold text-xs md:text-sm shadow-2xl backdrop-blur-md animate-fade-in motion-reduce:animate-none">
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

          {/* LOBBY FLOATING QR CARD + ROUND SELECTOR (Responsive without overlap) */}
          {gameState.phase === 'lobby' && (
            <div className="absolute inset-x-3 top-3 md:inset-x-6 md:top-6 z-30 max-h-[calc(100%-8.5rem)] md:max-h-none overflow-y-auto md:overflow-visible flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pointer-events-none">
              <div className="pointer-events-auto p-4 rounded-3xl bg-slate-900/95 border-2 border-yellow-400/50 shadow-2xl backdrop-blur-md flex flex-col items-center gap-2.5 w-full max-w-[240px] mx-auto sm:mx-0 shrink-0 animate-fade-in motion-reduce:animate-none">
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
                  <div className="text-xs uppercase font-bold text-slate-300">Escanea con tu móvil</div>
                  <div className="text-2xl font-black text-yellow-300 tracking-wider font-pixel my-1">
                    {gameState.roomCode}
                  </div>

                  {/* Local Dev Tunnel Switcher (ONLY when localhost + /api/tunnel active:true) */}
                  {hasActiveTunnel ? (
                    <div className="flex flex-col gap-1.5 my-1.5">
                      <div className="flex items-center justify-center bg-slate-950/90 p-1 rounded-xl border border-white/15 text-xs shadow gap-2">
                        <button
                          type="button"
                          onClick={() => setNetworkMode('tunnel')}
                          aria-pressed={networkMode === 'tunnel'}
                          className={`flex-1 min-h-[44px] px-2 py-1 rounded-lg font-extrabold transition-all motion-reduce:transition-none flex items-center justify-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                            networkMode === 'tunnel' ? 'bg-blue-700 text-white shadow' : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          <Globe className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>Túnel</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNetworkMode('wifi')}
                          aria-pressed={networkMode === 'wifi'}
                          className={`flex-1 min-h-[44px] px-2 py-1 rounded-lg font-extrabold transition-all motion-reduce:transition-none flex items-center justify-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                            networkMode === 'wifi' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          <Wifi className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>Wi-Fi</span>
                        </button>
                      </div>
                    </div>
                  ) : isCloudHttps ? (
                    <div className="text-xs text-emerald-200 font-semibold bg-emerald-950/90 border border-emerald-400/45 px-2.5 py-1.5 rounded-xl mt-1 leading-snug">
                      <span aria-hidden="true" className="mr-1">🌐</span>
                      Conectado en la nube · Funciona con cualquier Wi-Fi o datos móviles
                    </div>
                  ) : (
                    <div className="text-xs text-cyan-100 font-semibold bg-slate-950/85 border border-cyan-400/35 px-2.5 py-1.5 rounded-xl mt-1 leading-snug">
                      <span aria-hidden="true" className="mr-1">📶</span>
                      Red local · Comparte este enlace en tu red o navegador
                    </div>
                  )}

                  <div className="text-xs font-bold text-cyan-200 bg-slate-950/90 px-2.5 py-1 rounded-xl border border-white/15 mt-2">
                    {gameState.players.length}/6 Jugadores
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleCopyLink()}
                    className={`mt-2 w-full min-h-[44px] py-2 px-3 rounded-xl text-xs border transition-all motion-reduce:transition-none motion-reduce:active:scale-100 font-extrabold cursor-pointer shadow flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
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

              <div className="pointer-events-auto w-full sm:flex-1 sm:max-w-md mx-auto sm:mx-0 animate-fade-in motion-reduce:animate-none">
                <RoundSelector
                  selectedRounds={gameState.totalRounds}
                  playerCount={gameState.players.length}
                  onChange={setTotalRounds}
                />
              </div>
            </div>
          )}

          {/* Bottom Left Legend for Spaces (Visible cleanly on wide 1220px+ stage, aligned at 44px height) */}
          {isWideStage && (
            <div className="absolute bottom-4 left-[72px] z-20 flex select-none pointer-events-none">
              <div className="min-h-[44px] flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-slate-900/90 border border-white/15 text-xs font-bold backdrop-blur-md shadow-xl">
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
          )}

          {/* Floating Host Controls Bar (Bottom, responsive wrap + >= 8px gap) */}
          <div
            role="group"
            aria-label="Controles del anfitrión"
            className={`absolute ${hostBarPositionClass} z-20 flex flex-wrap items-center justify-center gap-2 bg-slate-900/90 backdrop-blur-md border border-white/15 p-1.5 rounded-2xl shadow-2xl max-w-[calc(100vw-2rem)]`}
          >
            {gameState.phase === 'lobby' ? (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={startGame}
                  disabled={gameState.players.length === 0}
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all motion-reduce:transition-none motion-reduce:active:scale-100 shadow-xl flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 ${
                    gameState.players.length > 0
                      ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 hover:brightness-105 active:scale-95 animate-pulse motion-reduce:animate-none cursor-pointer'
                      : 'bg-slate-800 border border-white/15 text-slate-300 cursor-not-allowed opacity-65'
                  }`}
                >
                  <span aria-hidden="true">▶</span>
                  <span>¡EMPEZAR A JUGAR! ({gameState.players.length})</span>
                </button>

                {gameState.players.length === 0 && (
                  <button
                    type="button"
                    onClick={handleAddTestBots}
                    className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-yellow-400/40 text-yellow-200 text-xs font-bold transition-all active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 shadow-md flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300"
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
                  className="min-h-[44px] px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 text-xs font-black uppercase hover:brightness-105 active:scale-95 transition-all motion-reduce:transition-none motion-reduce:active:scale-100 shadow-md flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-200"
                >
                  <span aria-hidden="true">🎲</span>
                  <span>Turno</span>
                </button>

                {/* Trigger Minigames via Roulette or Catalog */}
                <button
                  type="button"
                  onClick={() => triggerMinigameRoulette()}
                  className="min-h-[44px] px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-700 to-fuchsia-600 hover:brightness-110 active:scale-95 transition-all motion-reduce:transition-none motion-reduce:active:scale-100 text-white border border-purple-300/40 text-xs font-extrabold flex items-center gap-1 shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
                >
                  <span aria-hidden="true">🎰</span>
                  <span>Ruleta</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMinigamePickerOpen(true)}
                  className="min-h-[44px] px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all motion-reduce:transition-none motion-reduce:active:scale-100 text-cyan-200 border border-cyan-400/40 text-xs font-bold flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                  <span aria-hidden="true">🎮</span>
                  <span>Elegir</span>
                </button>

                {/* Peaje & Podium */}
                <button
                  type="button"
                  onClick={() => enterPeaje()}
                  className="min-h-[44px] px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all motion-reduce:transition-none motion-reduce:active:scale-100 text-purple-200 border border-purple-400/40 text-xs font-bold flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
                >
                  <span aria-hidden="true">🚧</span>
                  <span>Peaje</span>
                </button>

                <button
                  type="button"
                  onClick={() => enterPodium()}
                  className="min-h-[44px] px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 text-xs font-black flex items-center gap-1 shadow-md hover:brightness-105 active:scale-95 transition-all motion-reduce:transition-none motion-reduce:active:scale-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-200"
                >
                  <span aria-hidden="true">🏆</span>
                  <span>Podio</span>
                </button>

                <button
                  type="button"
                  onClick={() => setExportModalOpen(true)}
                  className="min-h-[44px] px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all motion-reduce:transition-none motion-reduce:active:scale-100 text-slate-100 text-xs font-bold border border-white/15 flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                  <span aria-hidden="true">📋</span>
                  <span>Acta ({gameState.retroCards.length})</span>
                </button>
              </>
            )}
          </div>
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

      {/* Minigame Roulette Modal */}
      {gameState.phase === 'minigame' && gameState.minigame?.phase === 'roulette' && (
        <MinigameRouletteModal isController={false} />
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
      <ActiveMinigameRenderer isController={false} />

      {/* Facilitator Minigame Picker */}
      <MinigamePickerModal
        isOpen={minigamePickerOpen}
        onClose={() => setMinigamePickerOpen(false)}
      />

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
