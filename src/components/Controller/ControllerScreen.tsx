import React, { useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { CHARACTERS } from '@/constants/characters';
import { POWER_UPS } from '@/constants/powerUps';
import { CharacterAvatar } from '@/components/Common/CharacterAvatar';
import { BlockSmashMinigame } from '@/components/Minigames/BlockSmashMinigame';
import { QuickVoteMinigame } from '@/components/Minigames/QuickVoteMinigame';
import { TargetRouletteModal } from '@/components/Common/TargetRouletteModal';
import { ChaosEventModal } from '@/components/Common/ChaosEventModal';
import { JoyPhoneSetup } from '@/components/Controller/JoyPhoneSetup';
import { getConnectionStatusMeta } from '@/utils/networkUrl';

interface ControllerScreenProps {
  onBackToLobby?: () => void;
  isMuted?: boolean;
  onToggleSound?: () => void;
}

export const ControllerScreen: React.FC<ControllerScreenProps> = ({
  onBackToLobby,
  isMuted = false,
  onToggleSound,
}) => {
  const {
    gameState,
    myPlayerId,
    setMyPlayerId,
    isHost,
    connectionStatus,
    joinStatus,
    leaveControllerSession,
    rollDice,
    usePowerUp,
  } = useGame();

  // Attempt to restore existing player session from sessionStorage
  useEffect(() => {
    if (!myPlayerId && typeof window !== 'undefined' && window.sessionStorage) {
      const savedId = window.sessionStorage.getItem('sprint_party_player_id');
      if (savedId) {
        setMyPlayerId(savedId);
      }
    }
  }, [myPlayerId, setMyPlayerId]);

  const savedCharId =
    typeof window !== 'undefined' && window.sessionStorage
      ? window.sessionStorage.getItem('sprint_party_character_id')
      : null;

  const me =
    gameState.players.find((p) => p.id === myPlayerId) ||
    (myPlayerId && savedCharId
      ? gameState.players.find((p) => p.characterId === savedCharId)
      : undefined);

  // Keep myPlayerId in sync with the Host if matched via characterId
  useEffect(() => {
    if (me && me.id !== myPlayerId) {
      setMyPlayerId(me.id);
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem('sprint_party_player_id', me.id);
      }
    }
  }, [me, myPlayerId, setMyPlayerId]);

  // If Host resets the game after this controller was confirmed, clear stale controller session
  useEffect(() => {
    if (!isHost && joinStatus === 'confirmed' && !me) {
      leaveControllerSession();
    }
  }, [isHost, joinStatus, me, leaveControllerSession]);

  // Show JoyPhoneSetup until Host confirms player presence (keeps form state during handshake/errors)
  if (!me || (!isHost && (joinStatus === 'joining' || joinStatus === 'error'))) {
    const hasExplicitRoom =
      typeof window !== 'undefined' &&
      (Boolean(new URLSearchParams(window.location.search).get('room')) ||
        Boolean(window.sessionStorage?.getItem('sprint_party_room_code')));

    return (
      <JoyPhoneSetup
        initialRoomCode={hasExplicitRoom ? gameState.roomCode : undefined}
        onBack={onBackToLobby}
        isMuted={isMuted}
        onToggleSound={onToggleSound}
      />
    );
  }

  const isGameStarted = gameState.phase !== 'lobby';
  const activePlayer = gameState.players[gameState.activePlayerIndex];
  const isMyTurn = isGameStarted && activePlayer?.id === myPlayerId;
  const isRolling = gameState.phase === 'rolling' || gameState.phase === 'moving';

  const char = CHARACTERS[me.characterId] || CHARACTERS.mario;
  const receivedCardsCount = gameState.retroCards.filter((c) => c.recipientId === me.id).length;
  const statusMeta = getConnectionStatusMeta(connectionStatus, gameState.roomCode);

  const handleRoll = () => {
    if (!isGameStarted || !isMyTurn || isRolling) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([20, 30, 20, 30, 50, 40, 90]);
    }
    rollDice(me.id);
  };

  const handleSwitchPlayer = () => {
    leaveControllerSession();
  };

  return (
    <div className="w-full h-full max-h-full bg-slate-950 text-white flex flex-col justify-between overflow-hidden p-2.5 sm:p-3 select-none font-game gap-2">
      {/* 0. LIVE CONNECTION STATUS, SOUND TOGGLE & SWITCH PLAYER BAR (Mobile Controller only) */}
      {!isHost && (
        <div className="flex items-center justify-between gap-2 shrink-0">
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

          <div className="flex items-center gap-1.5 shrink-0">
            {onToggleSound && (
              <button
                type="button"
                onClick={onToggleSound}
                className="w-11 h-11 rounded-xl bg-slate-900 border border-white/15 hover:bg-slate-800 hover:border-white/30 text-sm flex items-center justify-center cursor-pointer active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                title={isMuted ? 'Activar Sonido' : 'Silenciar'}
                aria-label={isMuted ? 'Activar Sonido' : 'Silenciar'}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>
            )}

            <button
              type="button"
              onClick={handleSwitchPlayer}
              aria-label="Cambiar jugador o personaje"
              className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-900 border border-white/15 hover:bg-slate-800 hover:border-white/30 text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-300" aria-hidden="true" />
              <span>Cambiar</span>
            </button>
          </div>
        </div>
      )}

      {/* 1. COMPACT TOP HUD: Player Info & Medals */}
      <div
        className="px-3 py-2 rounded-2xl border border-white/15 flex items-center justify-between shadow-lg shrink-0"
        style={{
          background: `linear-gradient(135deg, ${char.color}25 0%, rgba(15, 23, 42, 0.96) 100%)`,
          boxShadow: `0 4px 20px ${char.neonColor}18`,
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <CharacterAvatar characterId={me.characterId} size="md" />
          <div className="min-w-0">
            <div className="text-sm font-black text-white flex items-center gap-1.5 truncate">
              <span className="truncate">{me.name}</span>
              {me.role && (
                <span className="text-[11px] text-slate-300 font-bold shrink-0">({me.role})</span>
              )}
              {gameState.starLeaderId === me.id && (
                <span className="shrink-0" title="Líder de estrellas">
                  👑
                </span>
              )}
            </div>
            <div className="text-[11px] text-yellow-300 font-bold flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span>★ {me.stars}</span>
              <span className="text-slate-400" aria-hidden="true">•</span>
              <span className="text-slate-200">{receivedCardsCount} recibidos</span>
              <span className="text-slate-400" aria-hidden="true">•</span>
              <span className="text-cyan-200 font-mono font-bold">Sala {gameState.roomCode}</span>
            </div>
          </div>
        </div>

        {/* 3 Retro Medals: 🟢 Seguir, 🟡 Mejorar, 🔴 Dejar */}
        <div
          className="flex items-center gap-1.5 bg-slate-950/90 px-2.5 py-1.5 rounded-xl border border-white/15 shrink-0"
          aria-label="Medallas de retrospectiva"
        >
          <span
            className={`text-sm ${me.medals.seguir ? 'opacity-100 scale-110 drop-shadow' : 'opacity-25 grayscale'}`}
            title="Medalla Seguir"
          >
            🟢
          </span>
          <span
            className={`text-sm ${me.medals.mejorar ? 'opacity-100 scale-110 drop-shadow' : 'opacity-25 grayscale'}`}
            title="Medalla Mejorar"
          >
            🟡
          </span>
          <span
            className={`text-sm ${me.medals.dejar ? 'opacity-100 scale-110 drop-shadow' : 'opacity-25 grayscale'}`}
            title="Medalla Dejar"
          >
            🔴
          </span>
        </div>
      </div>

      {/* 2. CENTER STAGE: Game State Banner + Tactile Dice Action Button */}
      <div className="flex-1 flex flex-col items-center justify-center py-1 px-1 min-h-0">
        {/* Dynamic Context Status Banner */}
        <div className="mb-3 text-center w-full max-w-xs">
          {!isGameStarted ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-yellow-400/40 text-yellow-200 font-bold text-xs uppercase tracking-wider shadow-md">
              <span aria-hidden="true">⏳</span>
              <span>SALA DE ESPERA • ESPERANDO AL HOST</span>
            </div>
          ) : isMyTurn ? (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl animate-bounce motion-reduce:animate-none">
              <span aria-hidden="true">⚡</span>
              <span>¡TU TURNO! (CASILLA {me.spaceIndex}/20)</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 border border-white/15 text-slate-200 font-bold text-xs uppercase tracking-wider">
              <span aria-hidden="true">⏳</span>
              <span>
                Turno de {activePlayer?.name || 'Compañero'} (R{gameState.round}/{gameState.totalRounds})
              </span>
            </div>
          )}
        </div>

        {/* Tactile Big Die Button */}
        <button
          type="button"
          onClick={handleRoll}
          disabled={!isGameStarted || !isMyTurn || isRolling}
          className={`relative w-32 h-32 sm:w-36 sm:h-36 rounded-3xl transition-all duration-150 flex flex-col items-center justify-center select-none active:scale-95 shadow-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300 ${
            isRolling
              ? 'animate-haptic-shake motion-reduce:animate-none bg-gradient-to-tr from-amber-500 to-yellow-400 border-4 border-amber-800 text-slate-950 cursor-wait'
              : isMyTurn
              ? 'bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 border-4 border-amber-900 text-slate-950 hover:scale-[1.03] ring-4 ring-yellow-400/50 cursor-pointer'
              : !isGameStarted
              ? 'bg-slate-900/90 border-2 border-dashed border-white/25 text-slate-300 cursor-not-allowed opacity-75'
              : 'bg-slate-800/90 border-4 border-slate-700 opacity-70 cursor-not-allowed text-slate-200'
          }`}
          style={
            isMyTurn && !isRolling
              ? {
                  boxShadow: '0 12px 30px rgba(245, 158, 11, 0.45), inset 0 -6px 0 #78350F',
                }
              : {}
          }
        >
          <span className="text-5xl sm:text-6xl mb-1 filter drop-shadow" aria-hidden="true">
            {!isGameStarted ? '⏳' : '🎲'}
          </span>
          <span className="text-xs font-black uppercase tracking-wider text-center px-2 leading-tight">
            {!isGameStarted
              ? 'ESPERANDO INICIO...'
              : isRolling
              ? 'TIRANDO...'
              : isMyTurn
              ? '¡TIRAR DADO!'
              : `TURNO DE ${activePlayer?.name?.toUpperCase() || 'RIVAL'}`}
          </span>
        </button>

        {!isGameStarted && (
          <p className="text-xs text-slate-300 font-semibold text-center mt-3 max-w-xs">
            ¡Conectado como <span className="text-white font-bold">{me.name}</span> ({char.name})! El Host iniciará la partida pronto.
          </p>
        )}
      </div>

      {/* 3. BOTTOM SECTION: Mochila de Power-Ups */}
      <div className="p-2.5 rounded-2xl bg-slate-900/95 border border-white/15 shadow-xl shrink-0 backdrop-blur-md">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider mb-1.5">
          <span className="flex items-center gap-1.5 text-slate-100">
            <span aria-hidden="true">🎒</span>
            <span className="font-black">MOCHILA POWER-UPS ({me.powerUps.length}/2)</span>
          </span>
          <span className="text-yellow-300 font-bold">Meta = +1 ⭐</span>
        </div>

        {me.powerUps.length === 0 ? (
          <div className="py-2 px-3 rounded-xl bg-slate-950/80 border border-white/10 text-center text-xs text-slate-300 flex items-center justify-center gap-2">
            <span aria-hidden="true">✨</span>
            <span>Mochila vacía. Cae en casillas 🟣 Caos para ganar objetos.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {me.powerUps.map((pupType, idx) => {
              const pupInfo = POWER_UPS[pupType];
              return (
                <div
                  key={`${pupType}-${idx}`}
                  className="p-1.5 px-2.5 rounded-xl bg-slate-950/90 border border-white/15 flex items-center justify-between gap-2 shadow-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xl shrink-0" aria-hidden="true">
                      {pupInfo.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-white truncate">{pupInfo.name}</div>
                      <div className="text-[11px] text-slate-300 truncate">{pupInfo.description}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const others = gameState.players
                        .filter((p) => p.id !== me.id)
                        .sort((a, b) => b.stars - a.stars);
                      usePowerUp(me.id, pupType, others[0]?.id);
                    }}
                    disabled={!isGameStarted || !isMyTurn}
                    className={`min-h-[44px] min-w-[60px] px-3 py-2 rounded-xl text-xs font-black uppercase shrink-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 ${
                      isGameStarted && isMyTurn
                        ? 'bg-yellow-400 hover:bg-yellow-300 text-slate-950 shadow-md active:scale-95 cursor-pointer'
                        : 'bg-slate-800 text-slate-300 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    USAR
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Minigames Overlay on Joy-Phone */}
      {gameState.phase === 'minigame' && gameState.minigame?.type === 'block_smash' && (
        <BlockSmashMinigame isController={true} />
      )}
      {gameState.phase === 'minigame' && gameState.minigame?.type === 'quick_vote' && (
        <QuickVoteMinigame isController={true} />
      )}

      {/* Target Roulette Modal */}
      <TargetRouletteModal />

      {/* Chaos Event Modal */}
      <ChaosEventModal />
    </div>
  );
};
