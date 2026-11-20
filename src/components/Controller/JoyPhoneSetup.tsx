import React, { useState, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import { CharacterId } from '@/types/game';
import { CHARACTER_LIST, CHARACTERS } from '@/constants/characters';
import { CharacterAvatar } from '@/components/Common/CharacterAvatar';
import { sounds } from '@/audio/soundEffects';
import { network } from '@/services/network';

interface JoyPhoneSetupProps {
  initialRoomCode?: string;
  onJoined?: () => void;
}

export const JoyPhoneSetup: React.FC<JoyPhoneSetupProps> = ({ initialRoomCode, onJoined }) => {
  const { gameState, joinPlayer, setMyPlayerId, setIsHost } = useGame();

  const [roomCode, setRoomCode] = useState(() => {
    if (initialRoomCode) return initialRoomCode.toUpperCase();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const r = params.get('room');
      if (r) return r.toUpperCase();
    }
    return gameState.roomCode || 'STAR';
  });

  const [name, setName] = useState('');
  const [selectedChar, setSelectedChar] = useState<CharacterId>('mario');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Identify characters already claimed by connected teammates
  const takenCharMap = new Map<CharacterId, string>();
  gameState.players.forEach((p) => {
    takenCharMap.set(p.characterId, p.name);
  });

  // Pick first available character if default is taken
  useEffect(() => {
    if (takenCharMap.has(selectedChar)) {
      const available = CHARACTER_LIST.find((c) => !takenCharMap.has(c.id));
      if (available) {
        setSelectedChar(available.id);
      }
    }
  }, [gameState.players]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Por favor introduce tu nombre o alias');
      return;
    }

    if (takenCharMap.has(selectedChar)) {
      setErrorMessage(`${CHARACTERS[selectedChar].name} ya fue elegido por ${takenCharMap.get(selectedChar)}. Elige otro personaje.`);
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    sounds.playJump();
    if (navigator.vibrate) navigator.vibrate(60);

    const targetRoom = (roomCode.trim() || gameState.roomCode || 'STAR').toUpperCase();
    setIsHost(false);

    // Initialize controller connection to Host
    network.initController(
      targetRoom,
      () => {
        // Connected to Host over WebRTC
        const newPlayer = joinPlayer(trimmedName, selectedChar);
        setMyPlayerId(newPlayer.id);

        if (typeof window !== 'undefined' && window.sessionStorage) {
          window.sessionStorage.setItem('sprint_party_player_id', newPlayer.id);
          window.sessionStorage.setItem('sprint_party_room_code', targetRoom);
        }

        network.sendToHost({
          type: 'JOIN_ROOM',
          player: { name: trimmedName, characterId: selectedChar },
        });

        setIsSubmitting(false);
        if (onJoined) onJoined();
      },
      (err) => {
        console.warn('Network controller fallback joining local session:', err);
        // Fallback local join (for multi-tab or local network)
        const newPlayer = joinPlayer(trimmedName, selectedChar);
        setMyPlayerId(newPlayer.id);

        if (typeof window !== 'undefined' && window.sessionStorage) {
          window.sessionStorage.setItem('sprint_party_player_id', newPlayer.id);
          window.sessionStorage.setItem('sprint_party_room_code', targetRoom);
        }

        setIsSubmitting(false);
        if (onJoined) onJoined();
      }
    );
  };

  return (
    <div className="w-full h-[100dvh] max-h-[100dvh] bg-slate-950 text-white flex flex-col justify-between overflow-y-auto p-4 font-game select-none">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-purple-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto my-auto flex flex-col">
        {/* Header Badge */}
        <div className="text-center mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 font-pixel text-[10px] tracking-wider uppercase mb-2">
            <span>🎮</span>
            <span>MANDO JOY-PHONE 3D</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-rose-400 tracking-tight leading-tight">
            Sprint Party • Retrospectiva
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configura tu personaje antes de entrar a la pista
          </p>
        </div>

        {/* Setup Form */}
        <form onSubmit={handleSubmit} className="bg-slate-900/90 border border-white/10 rounded-3xl p-4 shadow-2xl backdrop-blur-md flex flex-col gap-3.5">
          {/* Room Code Indicator */}
          <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-slate-950/70 border border-white/10">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Código de Sala</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={4}
                className="w-20 bg-slate-900 border border-yellow-400/40 rounded-xl px-2 py-0.5 text-center font-pixel text-yellow-300 text-sm tracking-widest focus:outline-none focus:ring-1 focus:ring-yellow-400"
              />
              <span className="text-xs text-emerald-400 font-bold">● En vivo</span>
            </div>
          </div>

          {/* Name / Alias Input */}
          <div>
            <label className="block text-[11px] font-black text-slate-300 uppercase tracking-wider mb-1.5">
              Tu Nombre o Alias <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              maxLength={24}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Ej. Diego, Pipe, William, Elena..."
              className="w-full bg-slate-950 border border-white/20 rounded-2xl px-3.5 py-2.5 text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all font-semibold"
            />
          </div>

          {/* Character Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-black text-slate-300 uppercase tracking-wider">
                Elige tu Personaje (Mario Party)
              </label>
              <span className="text-[10px] text-slate-400 font-semibold">
                {takenCharMap.size}/6 Ocupados
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {CHARACTER_LIST.map((char) => {
                const isSelected = selectedChar === char.id;
                const isTaken = takenCharMap.has(char.id);
                const takenBy = takenCharMap.get(char.id);

                return (
                  <button
                    type="button"
                    key={char.id}
                    disabled={isTaken}
                    onClick={() => {
                      if (!isTaken) {
                        setSelectedChar(char.id);
                        sounds.playJump();
                        if (navigator.vibrate) navigator.vibrate(30);
                      }
                    }}
                    className={`relative p-2 rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center gap-1 text-center select-none ${
                      isSelected
                        ? 'bg-slate-800/95 ring-2 shadow-lg scale-103 z-10'
                        : isTaken
                        ? 'bg-slate-950/50 border-white/5 opacity-40 cursor-not-allowed'
                        : 'bg-slate-950/80 border-white/10 hover:border-white/30 hover:bg-slate-800/60 active:scale-95'
                    }`}
                    style={{
                      borderColor: isSelected ? char.neonColor : undefined,
                      boxShadow: isSelected ? `0 0 16px ${char.neonColor}40` : undefined,
                    }}
                  >
                    <div className="relative">
                      <CharacterAvatar characterId={char.id} size="md" showBorder={false} />
                      {isSelected && (
                        <div
                          className="absolute -inset-1 rounded-2xl border-2 pointer-events-none animate-pulse"
                          style={{ borderColor: char.neonColor }}
                        />
                      )}
                    </div>

                    <div className="min-w-0 w-full px-1">
                      <div className="text-xs font-black text-white truncate leading-tight">
                        {char.name}
                      </div>
                      <div className="text-[9px] text-slate-400 font-semibold truncate">
                        {isTaken ? `(${takenBy})` : 'Disponible'}
                      </div>
                    </div>

                    {isTaken && (
                      <div className="absolute top-1 right-1 bg-rose-500/80 text-[8px] font-black text-white px-1 rounded">
                        ✗
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold text-center animate-fade-in">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Connect Button */}
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl hover:brightness-110 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
          >
            <span>{isSubmitting ? '⏳' : '⚡'}</span>
            <span>{isSubmitting ? 'CONECTANDO JOY-PHONE...' : '¡CONECTAR JOY-PHONE!'}</span>
          </button>
        </form>
      </div>

      {/* Footer Info */}
      <div className="relative z-10 text-center py-2 text-[10px] text-slate-500">
        Sprint Party 3D • Joy-Phone Web Controller • Sin descargas ni instalaciones
      </div>
    </div>
  );
};
