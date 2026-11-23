import React, { useEffect } from 'react';
import { LogOut, Zap } from 'lucide-react';
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

  const activeBuffs: string[] = [];
  if (isMyTurn && gameState.diceRoll.length === 2) activeBuffs.push('🍄 Dado x2');
  if (me.goldenDieActive) activeBuffs.push('🎲 Dado Dorado 4–6');
  if (me.shieldActive) activeBuffs.push('🛡️ Escudo activo');

  return (
    <div
      className="w-full h-full max-h-full bg-slate-950 text-white flex flex-col overflow-y-auto p-2.5 sm:p-3 pb-22 select-none font-game gap-2.5"
      style={{ paddingBottom: 'max(5.5rem, env(safe-area-inset-bottom))' }}
    >
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
                <span className="text-xs text-slate-300 font-bold shrink-0">({me.role})</span>
              )}
              {gameState.starLeaderId === me.id && (
                <span className="shrink-0" title="Líder de estrellas">
                  👑
                </span>
              )}
            </div>
            <div className="text-xs text-yellow-300 font-bold flex items-center gap-1.5 mt-0.5 flex-wrap">
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
          className="flex items-center gap-1.5 bg-slate-950/90 px-2 py-1.5 rounded-xl border border-white/15 shrink-0"
          aria-label="Medallas de retrospectiva"
        >
          <span
            aria-label={`Medalla Seguir: ${me.medals.seguir ? 'conseguida' : 'pendiente'}`}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
              me.medals.seguir
                ? 'bg-emerald-500/25 border border-emerald-400 text-emerald-200 shadow-sm'
                : 'border border-dashed border-slate-500 bg-slate-900/90 text-slate-300'
            }`}
            title={me.medals.seguir ? 'Medalla Seguir conseguida' : 'Medalla Seguir pendiente'}
          >
            S
          </span>
          <span
            aria-label={`Medalla Mejorar: ${me.medals.mejorar ? 'conseguida' : 'pendiente'}`}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
              me.medals.mejorar
                ? 'bg-amber-500/25 border border-amber-400 text-amber-200 shadow-sm'
                : 'border border-dashed border-slate-500 bg-slate-900/90 text-slate-300'
            }`}
            title={me.medals.mejorar ? 'Medalla Mejorar conseguida' : 'Medalla Mejorar pendiente'}
          >
            M
          </span>
          <span
            aria-label={`Medalla Dejar: ${me.medals.dejar ? 'conseguida' : 'pendiente'}`}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
              me.medals.dejar
                ? 'bg-rose-500/25 border border-rose-400 text-rose-200 shadow-sm'
                : 'border border-dashed border-slate-500 bg-slate-900/90 text-slate-300'
            }`}
            title={me.medals.dejar ? 'Medalla Dejar conseguida' : 'Medalla Dejar pendiente'}
          >
            D
          </span>
        </div>
      </div>

      {/* 2. UPPER-HALF SECTION: Comodines / Power-Ups Shelf (Well clear of bottom-right Netlify badge) */}
      <section
        aria-label="Mochila de Comodines"
        className="p-2.5 rounded-2xl bg-slate-900/95 border border-white/15 shadow-xl shrink-0 backdrop-blur-md"
      >
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2">
          <span className="flex items-center gap-1.5 text-slate-100">
            <span aria-hidden="true">🎒</span>
            <span className="font-black">COMODINES ({me.powerUps.length}/2)</span>
          </span>
          <span className="text-yellow-300 font-bold text-xs">Meta = +1 ★</span>
        </div>

        {me.powerUps.length === 0 ? (
          <div className="py-2 px-3 rounded-xl bg-slate-950/80 border border-white/10 text-center text-xs text-slate-300 flex items-center justify-center gap-2">
            <span aria-hidden="true">✨</span>
            <span>Mochila vacía. Cae en casillas 🟣 Caos para ganar comodines.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {me.powerUps.map((pupType, idx) => {
              const pupInfo = POWER_UPS[pupType];
              const canUseNow = isGameStarted && isMyTurn && !isRolling;
              const sortedOthers = gameState.players
                .filter((p) => p.id !== me.id)
                .sort((a, b) => b.stars - a.stars);
              const booTarget = sortedOthers[0];
              const displayDesc =
                pupType === 'boo' && booTarget
                  ? `Envía a Boo para robarle 1 ★ al líder (${booTarget.name}).`
                  : pupInfo.description;

              return (
                <div
                  key={`${pupType}-${idx}`}
                  className="p-2 px-2.5 rounded-xl bg-slate-950/90 border border-white/15 flex items-center justify-between gap-2 shadow-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xl shrink-0" aria-hidden="true">
                      {pupInfo.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-white truncate">{pupInfo.name}</div>
                      <div className="text-xs text-slate-300 line-clamp-2 leading-snug">
                        {displayDesc}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label={`Usar comodín ${pupInfo.name}`}
                    onClick={() => {
                      usePowerUp(me.id, pupType, booTarget?.id);
                    }}
                    disabled={!canUseNow}
                    className={`min-h-[44px] min-w-[68px] px-3 py-2 rounded-xl text-xs font-black uppercase shrink-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 ${
                      canUseNow
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
      </section>

      {/* 3. CENTER/LOWER STAGE: Active Buffs + Turn Banner + Tactile Dice Action Button */}
      <div className="flex-1 flex flex-col items-center justify-center py-2 px-1 min-h-[210px]">
        {/* Active Power-Up Buffs Indicator */}
        {activeBuffs.length > 0 && (
          <div className="mb-2 flex flex-wrap items-center justify-center gap-1.5">
            {activeBuffs.map((buff) => (
              <span
                key={buff}
                className="px-2.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 text-xs font-extrabold shadow-sm"
              >
                {buff}
              </span>
            ))}
          </div>
        )}

        {/* Dynamic Context Status Banner */}
        <div className="mb-3 text-center w-full max-w-xs">
          {!isGameStarted ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-yellow-400/40 text-yellow-200 font-bold text-xs uppercase tracking-wider shadow-md max-w-full">
              <span aria-hidden="true">⏳</span>
              <span>SALA DE ESPERA • ESPERANDO AL HOST</span>
            </div>
          ) : isMyTurn ? (
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl animate-bounce-subtle motion-reduce:animate-none max-w-full">
              <Zap className="w-3.5 h-3.5 fill-current shrink-0" aria-hidden="true" />
              <span className="truncate">¡TU TURNO! (CASILLA {me.spaceIndex}/20)</span>
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
