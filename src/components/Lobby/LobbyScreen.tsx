import React, { useState, useEffect } from 'react';
import { Check, Copy, Globe, Laptop, Play, Smartphone, Tv, Wifi } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { CHARACTERS } from '@/constants/characters';
import { sounds } from '@/audio/soundEffects';
import { CharacterAvatar } from '@/components/Common/CharacterAvatar';
import {
  copyTextToClipboard,
  fetchLocalTunnelUrl,
  getConnectionStatusMeta,
  getMobileJoinUrl,
  getQrCodeImageUrl,
  isPublicHttpsOrigin,
} from '@/utils/networkUrl';
import { RoundSelector } from '@/components/Host/RoundSelector';

interface LobbyScreenProps {
  onStartHost: () => void;
  onStartController: () => void;
  onStartDemo: () => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  onStartHost,
  onStartController,
  onStartDemo,
}) => {
  const {
    gameState,
    isHost,
    connectionStatus,
    createRoom,
    joinPlayer,
    setIsHost,
    startGame,
    setTotalRounds,
  } = useGame();
  const [mode, setMode] = useState<'select' | 'host'>('select');

  const [tunnelUrl, setTunnelUrl] = useState<string | null>(null);
  const [networkMode, setNetworkMode] = useState<'tunnel' | 'wifi'>('wifi');
  const [copied, setCopied] = useState<boolean>(false);

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

  // If in 'select' mode as Host and a player connects via mobile Joy-Phone, show Host lobby view
  useEffect(() => {
    if (isHost && gameState.players.length > 0 && mode === 'select') {
      setMode('host');
    }
  }, [isHost, gameState.players.length, mode]);

  const handleHostStart = () => {
    sounds.playCoin();
    setIsHost(true);
    createRoom();
    setMode('host');
  };

  const handleOpenController = () => {
    sounds.playCoin();
    setIsHost(false);
    onStartController();
  };

  const hasActiveTunnel = Boolean(tunnelUrl);
  const activeBaseUrl = hasActiveTunnel && networkMode === 'tunnel' ? tunnelUrl! : undefined;
  const mobileJoinUrl = getMobileJoinUrl(gameState.roomCode, activeBaseUrl);
  const qrCodeImageUrl = getQrCodeImageUrl(mobileJoinUrl, 200);
  const isCloudHttps = isPublicHttpsOrigin();
  const statusMeta = getConnectionStatusMeta(connectionStatus, gameState.roomCode);

  const handleCopyUrl = async () => {
    const ok = await copyTextToClipboard(mobileJoinUrl);
    if (ok) {
      setCopied(true);
      sounds.playCoin();
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-950 text-white px-4 py-4 pb-16 sm:pb-6 relative flex flex-col items-center select-none">
      {/* Background Neon Glow Orbs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl my-auto flex flex-col items-center z-10">
        {/* Main Title Banner (Compact in Host Lobby so full lobby fits comfortably at 1280x800) */}
        {mode === 'select' ? (
          <div className="text-center mb-6 md:mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-400/50 text-yellow-200 font-pixel text-xs tracking-widest uppercase mb-3 shadow-lg">
              <span aria-hidden="true">⭐</span>
              <span>EDICIÓN RETROSPECTIVA SPRINT</span>
              <span aria-hidden="true">⭐</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-yellow-300 via-green-300 to-cyan-300 drop-shadow-md text-stroke-sm">
              SPRINT PARTY 3D
            </h1>
            <p className="text-lg md:text-xl font-bold text-slate-200 mt-1">
              Senda Arcoíris • Juego de Mesa Ágil
            </p>
          </div>
        ) : (
          <div className="text-center mb-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-yellow-300 via-green-300 to-cyan-300 drop-shadow-md text-stroke-sm leading-tight">
              SPRINT PARTY 3D
            </h1>
            <p className="text-xs md:text-sm font-bold text-slate-300">
              Senda Arcoíris • Sala de Espera Host TV
            </p>
          </div>
        )}

        {/* MODE 1: Initial Selection Menu */}
        {mode === 'select' && (
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Host TV */}
            <button
              type="button"
              onClick={handleHostStart}
              className="p-6 rounded-3xl bg-slate-900/95 border-2 border-yellow-400/50 hover:border-yellow-300 hover:scale-[1.02] transition-all duration-200 cursor-pointer shadow-2xl flex flex-col justify-between text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center shadow-lg mb-4 group-hover:rotate-6 transition-transform">
                  <Tv className="w-7 h-7" aria-hidden="true" />
                </div>
                <h2 className="text-xl font-extrabold text-white mb-2">Pantalla Host TV</h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Abre el tablero 3D panorámico en la pantalla grande de la sala o proyector. Genera el código QR para los móviles.
                </p>
              </div>
              <span className="mt-6 w-full min-h-[44px] py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg group-hover:brightness-105 flex items-center justify-center">
                Crear Sala TV
              </span>
            </button>

            {/* Card 2: Joy-Phone Controller */}
            <button
              type="button"
              onClick={handleOpenController}
              className="p-6 rounded-3xl bg-slate-900/95 border-2 border-cyan-400/50 hover:border-cyan-300 hover:scale-[1.02] transition-all duration-200 cursor-pointer shadow-2xl flex flex-col justify-between text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-400 text-slate-950 flex items-center justify-center shadow-lg mb-4 group-hover:-rotate-6 transition-transform">
                  <Smartphone className="w-7 h-7" aria-hidden="true" />
                </div>
                <h2 className="text-xl font-extrabold text-white mb-2">Mando Joy-Phone</h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Conéctate desde tu smartphone con el código de 4 letras para lanzar dados, usar Power-Ups y escribir tarjetas secretas.
                </p>
              </div>
              <span className="mt-6 w-full min-h-[44px] py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-300 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg group-hover:brightness-105 flex items-center justify-center">
                Unirse con Móvil
              </span>
            </button>

            {/* Card 3: Local / Demo Mode */}
            <button
              type="button"
              onClick={onStartDemo}
              className="p-6 rounded-3xl bg-slate-900/95 border-2 border-purple-400/50 hover:border-purple-300 hover:scale-[1.02] transition-all duration-200 cursor-pointer shadow-2xl flex flex-col justify-between text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-fuchsia-500 text-white flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform">
                  <Laptop className="w-7 h-7" aria-hidden="true" />
                </div>
                <h2 className="text-xl font-extrabold text-white mb-2">Modo Local / Demo</h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Ensaya o juega la retrospectiva completa en un único monitor con el escenario 3D y un smartphone simulado a la derecha.
                </p>
              </div>
              <span className="mt-6 w-full min-h-[44px] py-3 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-fuchsia-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg group-hover:brightness-110 flex items-center justify-center">
                Lanzar Demo Local
              </span>
            </button>
          </div>
        )}

        {/* MODE 2: Host TV Waiting Lobby */}
        {mode === 'host' && (
          <div className="w-full max-w-3xl bg-slate-900/95 border-2 border-yellow-400/50 rounded-3xl p-4 sm:p-5 md:p-6 shadow-2xl flex flex-col items-center">
            <div className="flex flex-col md:flex-row items-center gap-5 md:gap-6 w-full justify-between pb-4 border-b border-white/15">
              {/* QR Code Container */}
              <div className="flex flex-col items-center bg-white p-2.5 rounded-2xl shadow-xl shrink-0">
                <img
                  src={qrCodeImageUrl}
                  alt={`Código QR para unirse a la sala ${gameState.roomCode}`}
                  width={144}
                  height={144}
                  className="w-36 h-36 rounded-lg object-contain"
                />
                <span className="text-[11px] font-bold text-slate-900 mt-1.5">
                  Escanea con tu cámara
                </span>
              </div>

              {/* Room Code & URL */}
              <div className="flex-1 w-full text-center md:text-left min-w-0">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Código de la Sala
                  </div>

                  {/* Live Truthful Connection Pill */}
                  <div
                    role="status"
                    aria-live="polite"
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold shadow-sm ${statusMeta.badgeClass}`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${statusMeta.dotClass} ${
                        statusMeta.isAnimated ? 'animate-pulse motion-reduce:animate-none' : ''
                      }`}
                      aria-hidden="true"
                    />
                    <span>{statusMeta.label}</span>
                  </div>
                </div>

                <div className="text-4xl md:text-5xl font-extrabold text-yellow-300 font-pixel tracking-widest my-1.5 text-stroke-sm">
                  {gameState.roomCode}
                </div>
                <p className="text-xs text-slate-300">
                  Escanea el código QR con la cámara del móvil o comparte este enlace directo:
                </p>

                {/* Copyable URL Bar */}
                <div className="mt-2.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={mobileJoinUrl}
                    onClick={() => void handleCopyUrl()}
                    aria-label="Enlace para unirse con móvil"
                    title="Haz clic para copiar el enlace"
                    className="flex-1 min-w-0 min-h-[44px] text-xs text-cyan-200 bg-slate-950/95 px-3 py-2 rounded-xl border border-cyan-400/40 font-mono hover:border-cyan-300 cursor-pointer transition-all select-all shadow-inner focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => void handleCopyUrl()}
                    className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                      copied
                        ? 'bg-emerald-700 text-white ring-2 ring-emerald-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-white border border-white/25 active:scale-95'
                    }`}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                    ) : (
                      <Copy className="w-4 h-4 shrink-0" aria-hidden="true" />
                    )}
                    <span>{copied ? '¡Copiado!' : 'Copiar Enlace'}</span>
                  </button>
                </div>

                {/* Local Dev Tunnel Switcher (ONLY when localhost + /api/tunnel active:true) vs Cloud Badge */}
                {hasActiveTunnel ? (
                  <div className="mt-2.5 flex flex-col gap-1.5">
                    <div className="inline-flex items-center bg-slate-950/90 p-1 rounded-xl border border-white/15 text-xs shadow-md self-start">
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playCoin();
                          setNetworkMode('tunnel');
                        }}
                        className={`min-h-[44px] px-3 py-2 rounded-lg font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                          networkMode === 'tunnel'
                            ? 'bg-blue-700 text-white shadow-lg ring-1 ring-blue-300/50'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Cualquier Red (Túnel)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playCoin();
                          setNetworkMode('wifi');
                        }}
                        className={`min-h-[44px] px-3 py-2 rounded-lg font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                          networkMode === 'wifi'
                            ? 'bg-amber-500 text-slate-950 shadow-lg ring-1 ring-amber-200/60'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        <Wifi className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Misma Wi-Fi</span>
                      </button>
                    </div>
                    <div className="text-xs text-slate-200 font-semibold flex items-center gap-2 bg-slate-950/75 border border-white/15 px-3 py-1.5 rounded-xl">
                      <span>
                        {networkMode === 'tunnel'
                          ? '🌐 Túnel local activo: funciona con cualquier red Wi-Fi o datos móviles.'
                          : '📶 Modo Wi-Fi local: el móvil debe estar en la misma red que este equipo.'}
                      </span>
                    </div>
                  </div>
                ) : isCloudHttps ? (
                  <div className="mt-2.5 text-xs text-emerald-200 font-semibold flex items-center gap-2 bg-emerald-950/90 border border-emerald-400/45 px-3 py-2 rounded-xl">
                    <span>🌐 Conectado en la nube · Funciona con cualquier Wi-Fi o datos móviles</span>
                  </div>
                ) : (
                  <div className="mt-2.5 text-xs text-cyan-100 font-semibold flex items-center gap-2 bg-slate-950/85 border border-cyan-400/35 px-3 py-2 rounded-xl">
                    <Wifi className="w-4 h-4 text-cyan-300 shrink-0" aria-hidden="true" />
                    <span>Red local activa · Comparte este enlace desde el navegador o la misma red Wi-Fi.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Round Duration Selector */}
            <div className="w-full mt-3">
              <RoundSelector
                selectedRounds={gameState.totalRounds}
                playerCount={gameState.players.length}
                onChange={setTotalRounds}
              />
            </div>

            {/* Connected Players Grid */}
            <div className="w-full py-3.5">
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 text-center md:text-left">
                Jugadores Conectados ({gameState.players.length}/6)
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                {gameState.players.map((p) => {
                  const char = CHARACTERS[p.characterId];
                  return (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-2xl bg-slate-800 border border-white/15 flex items-center gap-2.5 animate-fade-in min-h-[54px]"
                    >
                      <CharacterAvatar characterId={p.characterId} size="sm" />
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate">{p.name}</div>
                        <div className="text-xs text-slate-300">{char.name}</div>
                      </div>
                    </div>
                  );
                })}

                {/* Empty slot indicators */}
                {Array.from({ length: Math.max(0, 6 - gameState.players.length) }).map((_, i) => (
                  <div
                    key={`wait-${i}`}
                    className="p-2.5 rounded-2xl border border-dashed border-white/15 flex items-center justify-center text-xs text-slate-300 gap-2 min-h-[54px]"
                  >
                    <span>Esperando jugador...</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 w-full">
              <button
                type="button"
                onClick={() => setMode('select')}
                className="min-h-[44px] py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-white/15 transition-all shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={onStartHost}
                className="min-h-[44px] py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-yellow-400/40 text-yellow-200 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300"
                title="Abre la proyección 3D mientras los jugadores escanean el QR"
              >
                <Tv className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Proyectar Tablero 3D</span>
              </button>

              {gameState.players.length === 0 && (
                <button
                  type="button"
                  onClick={() => {
                    joinPlayer('Alex', 'mario', 'Front');
                    joinPlayer('Sofía', 'luigi', 'Back');
                    joinPlayer('Mateo', 'peach', 'QA');
                    joinPlayer('Lucía', 'yoshi', 'UX');
                  }}
                  className="min-h-[44px] py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-yellow-400/40 text-yellow-200 text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300"
                  title="Añadir 4 compañeros de prueba"
                >
                  <span aria-hidden="true">🤖</span>
                  <span>Añadir Bots (4)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (gameState.players.length > 0) {
                    startGame();
                    onStartHost();
                  }
                }}
                disabled={gameState.players.length === 0}
                className={`flex-1 min-h-[44px] py-2.5 px-4 rounded-xl text-sm font-extrabold uppercase tracking-wide transition-all shadow-xl flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 ${
                  gameState.players.length > 0
                    ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 hover:brightness-105 active:scale-[0.98] cursor-pointer'
                    : 'bg-slate-800 border border-white/15 text-slate-300 cursor-not-allowed opacity-65'
                }`}
              >
                <Play className="w-4 h-4 fill-current shrink-0" aria-hidden="true" />
                <span>
                  {gameState.players.length > 0
                    ? `¡Iniciar Partida! (${gameState.players.length} Jugadores)`
                    : 'Esperando Jugadores (0/6)'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
