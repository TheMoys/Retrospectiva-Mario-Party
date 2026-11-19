import React, { useState, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import { CHARACTER_LIST, CHARACTERS } from '@/constants/characters';
import { CharacterId } from '@/types/game';
import { network } from '@/services/network';
import { sounds } from '@/audio/soundEffects';

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
  const { gameState, createRoom, joinPlayer, setMyPlayerId, setIsHost } = useGame();
  const [mode, setMode] = useState<'select' | 'host' | 'controller'>('select');

  // Controller Form State
  const [roomInput, setRoomInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>('mario');
  const [isConnecting, setIsConnecting] = useState(false);

  // Check URL query parameters (e.g. ?room=STAR&mode=controller)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    const modeParam = params.get('mode');

    if (roomParam) {
      setRoomInput(roomParam.toUpperCase());
    }
    if (modeParam === 'controller' || roomParam) {
      setMode('controller');
    }
  }, []);

  // Handle Host TV Setup
  const handleHostStart = () => {
    sounds.playCoin();
    const code = createRoom();
    setIsHost(true);
    network.initHost(code, () => {
      setMode('host');
    });
  };

  // Handle Controller Join
  const handleControllerJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomInput.trim() || !nameInput.trim()) return;

    sounds.playJump();
    setIsConnecting(true);
    setIsHost(false);

    const roomCode = roomInput.trim().toUpperCase();

    network.initController(
      roomCode,
      () => {
        setIsConnecting(false);
        const player = joinPlayer(nameInput.trim(), selectedCharacter);
        setMyPlayerId(player.id);
        // Inform host
        network.sendToHost({
          type: 'JOIN_ROOM',
          player: { name: nameInput.trim(), characterId: selectedCharacter },
        });
        onStartController();
      },
      (err) => {
        console.warn('Network connection warning, joining local session:', err);
        setIsConnecting(false);
        const player = joinPlayer(nameInput.trim(), selectedCharacter);
        setMyPlayerId(player.id);
        onStartController();
      }
    );
  };

  // QR Code URL pointing to player controller with auto-filled room code
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const mobileJoinUrl = `${currentOrigin}${currentPath}?room=${gameState.roomCode}&mode=controller`;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    mobileJoinUrl
  )}`;

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Neon Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Title Banner */}
      <div className="text-center mb-8 z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-400/40 text-yellow-300 font-pixel text-xs tracking-widest uppercase mb-3 shadow-lg">
          ⭐ EDICIÓN RETROSPECTIVA SPRINT ⭐
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 via-green-400 to-purple-500 drop-shadow-md text-stroke-sm">
          SPRINT PARTY 3D
        </h1>
        <p className="text-lg md:text-xl font-bold text-slate-200 mt-1">
          Senda Arcoíris • Juego de Mesa Ágil
        </p>
      </div>

      {/* MODE 1: Initial Selection Menu */}
      {mode === 'select' && (
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 z-10">
          {/* Card 1: Host TV */}
          <div
            onClick={handleHostStart}
            className="p-6 rounded-3xl bg-slate-900/90 border-2 border-yellow-400/50 hover:border-yellow-400 hover:scale-103 transition-all duration-200 cursor-pointer shadow-2xl flex flex-col justify-between group"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-3xl shadow-lg mb-4 group-hover:rotate-6 transition-transform">
                📺
              </div>
              <h3 className="text-xl font-extrabold text-white mb-2">Pantalla Host TV</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Abre el tablero 3D panorámico en la pantalla grande de la sala o proyector. Genera el código QR para los móviles.
              </p>
            </div>
            <button className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg group-hover:brightness-110">
              Crear Sala TV
            </button>
          </div>

          {/* Card 2: Joy-Phone Controller */}
          <div
            onClick={() => setMode('controller')}
            className="p-6 rounded-3xl bg-slate-900/90 border-2 border-cyan-400/50 hover:border-cyan-400 hover:scale-103 transition-all duration-200 cursor-pointer shadow-2xl flex flex-col justify-between group"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-400 flex items-center justify-center text-3xl shadow-lg mb-4 group-hover:-rotate-6 transition-transform">
                📱
              </div>
              <h3 className="text-xl font-extrabold text-white mb-2">Mando Joy-Phone</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Conéctate desde tu smartphone con el código de 4 letras para lanzar dados, usar Power-Ups y escribir tarjetas secretas.
              </p>
            </div>
            <button className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg group-hover:brightness-110">
              Unirse con Móvil
            </button>
          </div>

          {/* Card 3: Local / Demo Mode */}
          <div
            onClick={onStartDemo}
            className="p-6 rounded-3xl bg-slate-900/90 border-2 border-purple-400/50 hover:border-purple-400 hover:scale-103 transition-all duration-200 cursor-pointer shadow-2xl flex flex-col justify-between group"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-400 flex items-center justify-center text-3xl shadow-lg mb-4 group-hover:scale-110 transition-transform">
                💻
              </div>
              <h3 className="text-xl font-extrabold text-white mb-2">Modo Local / Demo</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Ensaya o juega la retrospectiva completa en un único monitor con el escenario 3D y un smartphone simulado a la derecha.
              </p>
            </div>
            <button className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-purple-400 to-pink-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg group-hover:brightness-110">
              Lanzar Demo Local
            </button>
          </div>
        </div>
      )}

      {/* MODE 2: Host TV Waiting Lobby */}
      {mode === 'host' && (
        <div className="w-full max-w-3xl bg-slate-900/95 border-2 border-yellow-400/50 rounded-3xl p-6 md:p-8 shadow-2xl z-10 flex flex-col items-center">
          <div className="flex flex-col md:flex-row items-center gap-8 w-full justify-between pb-6 border-b border-white/10">
            {/* QR Code Container */}
            <div className="flex flex-col items-center bg-white p-3 rounded-2xl shadow-xl shrink-0">
              <img
                src={qrCodeImageUrl}
                alt="Código QR para unirse"
                className="w-40 h-40 rounded-lg object-contain"
              />
              <span className="text-[11px] font-bold text-slate-800 mt-2">
                Escanea con tu cámara
              </span>
            </div>

            {/* Room Code & URL */}
            <div className="flex-1 text-center md:text-left">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Código de la Sala
              </div>
              <div className="text-5xl md:text-6xl font-extrabold text-yellow-300 font-pixel tracking-widest my-2 text-stroke-sm">
                {gameState.roomCode}
              </div>
              <p className="text-xs text-slate-300">
                O entra en el navegador móvil e ingresa este código de 4 letras.
              </p>
              <div className="mt-3 text-[11px] text-cyan-300 break-all bg-slate-950/70 p-2 rounded-xl border border-white/10 font-mono">
                {mobileJoinUrl}
              </div>
            </div>
          </div>

          {/* Connected Players Grid */}
          <div className="w-full py-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-center md:text-left">
              Jugadores Conectados ({gameState.players.length}/6)
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {gameState.players.map((p) => {
                const char = CHARACTERS[p.characterId];
                return (
                  <div
                    key={p.id}
                    className="p-3 rounded-2xl bg-slate-800 border border-white/10 flex items-center gap-3 animate-fade-in"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 font-bold border-2"
                      style={{ backgroundColor: `${char.color}22`, borderColor: char.neonColor }}
                    >
                      {char.avatar}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white truncate">{p.name}</div>
                      <div className="text-xs text-slate-400">{char.name}</div>
                    </div>
                  </div>
                );
              })}

              {/* Empty slot indicators */}
              {Array.from({ length: Math.max(0, 6 - gameState.players.length) }).map((_, i) => (
                <div
                  key={`wait-${i}`}
                  className="p-3 rounded-2xl border border-dashed border-white/10 flex items-center justify-center text-xs text-slate-500 gap-2"
                >
                  <span>Esperando jugador...</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 w-full">
            <button
              onClick={() => setMode('select')}
              className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
            >
              Volver
            </button>
            <button
              onClick={onStartHost}
              className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-extrabold text-sm uppercase tracking-wide hover:brightness-110 active:scale-98 shadow-xl"
            >
              ¡Iniciar Partida en Senda Arcoíris!
            </button>
          </div>
        </div>
      )}

      {/* MODE 3: Mobile Controller Join Form */}
      {mode === 'controller' && (
        <form
          onSubmit={handleControllerJoin}
          className="w-full max-w-md bg-slate-900 border-2 border-cyan-400/50 rounded-3xl p-6 shadow-2xl z-10 flex flex-col gap-4"
        >
          <div className="text-center">
            <span className="text-4xl mb-1 inline-block">📱</span>
            <h3 className="text-2xl font-extrabold text-white">Unirse a la Retrospectiva</h3>
            <p className="text-xs text-slate-400 mt-1">Configura tu mando Joy-Phone</p>
          </div>

          {/* Room Code Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Código de Sala (4 Letras)
            </label>
            <input
              type="text"
              required
              maxLength={4}
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
              placeholder="STAR"
              className="w-full bg-slate-950 border border-white/20 rounded-xl p-3 text-center text-2xl font-pixel text-yellow-300 uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Tu Nombre o Alias
            </label>
            <input
              type="text"
              required
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Diego, Pipe, William..."
              className="w-full bg-slate-950 border border-white/20 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          {/* Character Choice */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
              Elige tu Personaje (Mario Party)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CHARACTER_LIST.map((char) => {
                const isSelected = selectedCharacter === char.id;
                return (
                  <button
                    type="button"
                    key={char.id}
                    onClick={() => setSelectedCharacter(char.id)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-cyan-500/30 border-cyan-400 ring-2 ring-cyan-400 scale-105'
                        : 'bg-slate-950 border-white/10 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-2xl">{char.avatar}</span>
                    <span className="text-[11px] font-bold text-white">{char.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setMode('select')}
              className="py-3 px-4 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700"
            >
              Atrás
            </button>
            <button
              type="submit"
              disabled={isConnecting}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-extrabold text-xs uppercase tracking-wide hover:brightness-110 active:scale-98 shadow-xl disabled:opacity-50"
            >
              {isConnecting ? 'Conectando...' : '¡Entrar a la Pista!'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
