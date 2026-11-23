import React, { useState, useEffect } from 'react';
import { AlertCircle, ArrowLeft, Check, Loader2, RefreshCw, Smartphone, Zap } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { CharacterId } from '@/types/game';
import { CHARACTER_LIST, CHARACTERS } from '@/constants/characters';
import { CharacterAvatar } from '@/components/Common/CharacterAvatar';
import { sounds } from '@/audio/soundEffects';
import { getConnectionStatusMeta } from '@/utils/networkUrl';

interface JoyPhoneSetupProps {
  initialRoomCode?: string;
  onJoined?: () => void;
  onBack?: () => void;
  isMuted?: boolean;
  onToggleSound?: () => void;
}

function resolveInitialRoomCode(fallback?: string): string {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const urlRoom = params.get('room');
    if (urlRoom && urlRoom.trim()) {
      return urlRoom.trim().toUpperCase().slice(0, 4);
    }
    if (window.sessionStorage) {
      const savedRoom = window.sessionStorage.getItem('sprint_party_room_code');
      if (savedRoom && savedRoom.trim()) {
        return savedRoom.trim().toUpperCase().slice(0, 4);
      }
    }
  }
  return fallback ? fallback.trim().toUpperCase().slice(0, 4) : '';
}

export const JoyPhoneSetup: React.FC<JoyPhoneSetupProps> = ({
  initialRoomCode,
  onJoined,
  onBack,
  isMuted = false,
  onToggleSound,
}) => {
  const {
    gameState,
    myPlayerId,
    connectionStatus,
    joinStatus,
    joinError,
    setIsHost,
    connectControllerRoom,
    joinRoomAsController,
    leaveControllerSession,
  } = useGame();

  const [roomCode, setRoomCode] = useState<string>(() => resolveInitialRoomCode(initialRoomCode));
  const [name, setName] = useState('');
  const [selectedChar, setSelectedChar] = useState<CharacterId>('mario');
  const [localError, setLocalError] = useState<string | null>(null);

  const normalizedRoom = roomCode.trim().toUpperCase().slice(0, 4);
  const isJoining = joinStatus === 'joining';

  // Ensure URL ?room= updates the field if query changes externally
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const r = params.get('room');
    if (r && r.trim()) {
      setRoomCode(r.trim().toUpperCase().slice(0, 4));
    }
  }, [initialRoomCode]);

  // Connect controller transport as soon as a 4-char room code is ready so taken characters sync live
  useEffect(() => {
    setIsHost(false);
    if (normalizedRoom.length === 4) {
      connectControllerRoom(normalizedRoom);
    }
  }, [normalizedRoom, setIsHost, connectControllerRoom]);

  // Identify characters already claimed by OTHER teammates (exclude optimistic self during handshake)
  const takenCharMap = new Map<CharacterId, string>();
  gameState.players.forEach((p) => {
    if (p.id !== myPlayerId) {
      takenCharMap.set(p.characterId, p.name);
    }
  });

  // Pick first available character automatically when not mid-submit
  useEffect(() => {
    if (isJoining) return;
    if (takenCharMap.has(selectedChar)) {
      const available = CHARACTER_LIST.find((c) => !takenCharMap.has(c.id));
      if (available) {
        setSelectedChar(available.id);
      }
    }
  }, [gameState.players, myPlayerId, isJoining, selectedChar]);

  const allCharactersTaken = takenCharMap.size >= CHARACTER_LIST.length;
  const statusMeta = getConnectionStatusMeta(connectionStatus, normalizedRoom);
  const activeError = localError || (joinStatus === 'error' ? joinError : null);

  const attemptJoin = async () => {
    const trimmedName = name.trim();

    if (normalizedRoom.length !== 4) {
      setLocalError('Introduce el código de 4 letras de la sala (ej. STAR).');
      return;
    }

    if (!trimmedName) {
      setLocalError('Por favor introduce tu nombre o alias.');
      return;
    }

    if (allCharactersTaken) {
      setLocalError('La sala ya alcanzó el máximo de 6 jugadores.');
      return;
    }

    if (takenCharMap.has(selectedChar)) {
      setLocalError(
        `${CHARACTERS[selectedChar].name} ya fue elegido por ${takenCharMap.get(selectedChar)}. Elige otro personaje.`
      );
      return;
    }

    setLocalError(null);
    sounds.playJump();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }

    try {
      await joinRoomAsController({
        roomCode: normalizedRoom,
        name: trimmedName,
        characterId: selectedChar,
      });
      if (onJoined) onJoined();
    } catch {
      // Handled authoritatively via joinStatus === 'error' & joinError in GameContext
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isJoining) return;
    void attemptJoin();
  };

  const handleClearErrors = () => {
    if (localError) setLocalError(null);
    if (joinStatus === 'error') {
      leaveControllerSession();
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-950 text-white flex flex-col items-center px-4 py-3 font-game select-none">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-cyan-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md my-auto flex flex-col gap-3">
        {/* Top Optional Back + Truthful Connection Pill + Sound Toggle */}
        <div className="flex items-center justify-between gap-2 min-h-[44px]">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              disabled={isJoining}
              className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-white active:scale-95 transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Volver</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-400/15 border border-yellow-400/40 text-yellow-200 font-pixel text-[10px] tracking-wider uppercase shrink-0">
              <Smartphone className="w-3.5 h-3.5 text-yellow-300" aria-hidden="true" />
              <span>JOY-PHONE</span>
            </div>
          )}

          <div className="flex items-center gap-2 min-w-0">
            {normalizedRoom.length === 4 ? (
              <div
                role="status"
                aria-live="polite"
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold shadow-sm min-w-0 ${statusMeta.badgeClass}`}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${statusMeta.dotClass} ${
                    statusMeta.isAnimated ? 'animate-pulse motion-reduce:animate-none' : ''
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate">{statusMeta.label}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-white/15 text-slate-300 text-xs font-semibold truncate">
                <span className="truncate">Código de 4 letras</span>
              </div>
            )}

            {onToggleSound && (
              <button
                type="button"
                onClick={onToggleSound}
                className="w-11 h-11 rounded-xl bg-slate-900 border border-white/15 text-sm hover:bg-slate-800 flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                title={isMuted ? 'Activar Sonido' : 'Silenciar'}
                aria-label={isMuted ? 'Activar Sonido' : 'Silenciar'}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-cyan-300 tracking-tight leading-tight">
            Sprint Party • Retrospectiva
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Elige tu personaje y únete a la sala del Host
          </p>
        </div>

        {/* Setup Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-slate-900/95 border border-white/15 rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-md flex flex-col gap-4"
        >
          {/* Room Code Indicator */}
          <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl bg-slate-950/90 border border-white/15">
            <label
              htmlFor="joyphone-room-code"
              className="text-xs font-extrabold text-slate-200 uppercase tracking-wider shrink-0"
            >
              Código de Sala
            </label>
            <input
              id="joyphone-room-code"
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              disabled={isJoining}
              value={roomCode}
              onChange={(e) => {
                const sanitized = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4);
                setRoomCode(sanitized);
                handleClearErrors();
              }}
              maxLength={4}
              placeholder="STAR"
              className="w-28 min-h-[44px] bg-slate-900 border border-yellow-400/50 rounded-xl px-2.5 py-1.5 text-center font-pixel text-yellow-300 text-base tracking-widest uppercase placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-60"
            />
          </div>

          {/* Name / Alias Input */}
          <div>
            <label
              htmlFor="joyphone-player-name"
              className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5"
            >
              Tu Nombre o Alias <span className="text-rose-300">*</span>
            </label>
            <input
              id="joyphone-player-name"
              type="text"
              required
              autoFocus
              disabled={isJoining}
              maxLength={24}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                handleClearErrors();
              }}
              placeholder="Ej. Diego, Pipe, William, Elena..."
              className="w-full min-h-[48px] bg-slate-950 border border-white/20 rounded-2xl px-3.5 py-2.5 text-base text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all font-semibold disabled:opacity-60"
            />
          </div>

          {/* Character Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">
                Elige tu Personaje
              </span>
              <span className="text-xs text-slate-300 font-semibold">
                {takenCharMap.size}/{CHARACTER_LIST.length} Ocupados
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5" role="radiogroup" aria-label="Personajes disponibles">
              {CHARACTER_LIST.map((char) => {
                const isSelected = selectedChar === char.id;
                const isTaken = takenCharMap.has(char.id);
                const takenBy = takenCharMap.get(char.id);

                return (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={`${char.name}${isTaken ? ` ocupado por ${takenBy}` : ''}`}
                    key={char.id}
                    disabled={isTaken || isJoining}
                    onClick={() => {
                      if (!isTaken && !isJoining) {
                        setSelectedChar(char.id);
                        handleClearErrors();
                        sounds.playJump();
                        if (typeof navigator !== 'undefined' && navigator.vibrate) {
                          navigator.vibrate(25);
                        }
                      }
                    }}
                    className={`relative min-h-[82px] p-2 rounded-2xl border transition-all duration-150 flex flex-col items-center justify-center gap-1.5 text-center select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                      isSelected
                        ? 'bg-slate-800 ring-2 shadow-lg z-10 cursor-pointer'
                        : isTaken
                        ? 'bg-slate-950/60 border-white/10 opacity-50 cursor-not-allowed'
                        : 'bg-slate-950/85 border-white/15 hover:border-white/35 hover:bg-slate-800/80 active:scale-95 cursor-pointer'
                    }`}
                    style={{
                      borderColor: isSelected ? char.neonColor : undefined,
                      boxShadow: isSelected ? `0 0 16px ${char.neonColor}40` : undefined,
                    }}
                  >
                    <div className="relative">
                      <CharacterAvatar characterId={char.id} size="md" showBorder={false} />
                      {isSelected && (
                        <span
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center shadow"
                          aria-hidden="true"
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 w-full px-0.5">
                      <div className="text-xs font-black text-white truncate leading-tight">
                        {char.name}
                      </div>
                      <div
                        className={`text-[10px] font-semibold truncate mt-0.5 ${
                          isTaken ? 'text-rose-300' : isSelected ? 'text-cyan-200' : 'text-slate-300'
                        }`}
                      >
                        {isTaken ? `De ${takenBy}` : isSelected ? 'Elegido' : 'Disponible'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Handshake State Banner */}
          {isJoining && (
            <div
              role="status"
              aria-live="polite"
              className="p-3 rounded-2xl bg-cyan-950/80 border border-cyan-400/40 text-cyan-100 text-xs font-bold flex items-center justify-center gap-2.5"
            >
              <Loader2 className="w-4 h-4 text-cyan-300 animate-spin motion-reduce:animate-none shrink-0" aria-hidden="true" />
              <span>Conectando con el Host de la sala {normalizedRoom}...</span>
            </div>
          )}

          {/* Actionable Error Banner + Retry Button */}
          {activeError && !isJoining && (
            <div
              role="alert"
              className="p-3 rounded-2xl bg-rose-950/90 border border-rose-400/50 text-rose-100 text-xs font-semibold flex flex-col gap-2.5"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{activeError}</span>
              </div>
              {joinStatus === 'error' && normalizedRoom.length === 4 && name.trim().length > 0 && !takenCharMap.has(selectedChar) && (
                <button
                  type="button"
                  onClick={() => void attemptJoin()}
                  className="w-full min-h-[44px] py-2 px-3 rounded-xl bg-rose-500/25 hover:bg-rose-500/35 border border-rose-300/50 text-white text-xs font-extrabold uppercase tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                >
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Reintentar conexión</span>
                </button>
              )}
            </div>
          )}

          {/* Primary Connect Button */}
          <button
            type="submit"
            disabled={isJoining || !name.trim() || normalizedRoom.length !== 4 || allCharactersTaken}
            className="w-full min-h-[48px] py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            {isJoining ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                <span>Conectando con el Host...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-current" aria-hidden="true" />
                <span>¡Conectar Joy-Phone!</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer Info */}
      <div className="relative z-10 text-center pt-2 pb-1 text-xs text-slate-300 shrink-0">
        Sprint Party 3D • Joy-Phone Web Controller
      </div>
    </div>
  );
};
