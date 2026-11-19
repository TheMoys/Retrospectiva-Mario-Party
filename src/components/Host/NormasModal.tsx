import React from 'react';

interface NormasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NormasModal: React.FC<NormasModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="w-full max-w-2xl max-h-[85vh] bg-slate-900 border-2 border-yellow-400/50 rounded-3xl p-6 shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📖</span>
            <div>
              <h3 className="text-xl font-black text-white">Normas y Reglas del Juego</h3>
              <p className="text-xs text-slate-400">Sprint Party 3D: Senda Arcoíris</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 rounded-full bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center text-base font-bold active:scale-95 transition-all shadow-md"
            aria-label="Cerrar Normas"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1 text-xs text-slate-300">
          {/* 1. Preparación */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10">
            <h4 className="font-bold text-yellow-300 text-sm mb-1.5 flex items-center gap-2">
              <span>🏁</span> 1. Preparación y Turnos
            </h4>
            <p className="leading-relaxed">
              • 6 jugadores conectados desde su móvil (Joy-Phone) y el tablero proyectado para el equipo.<br />
              • El juego consta de <strong>4 rondas completas</strong> (cada participante tira el dado 4 veces en total).<br />
              • En tu turno, pulsas el botón táctil para lanzar un dado del 1 al 6 y avanzar saltando por el tablero.
            </p>
          </div>

          {/* 2. Las Casillas y la Ruleta */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10">
            <h4 className="font-bold text-yellow-300 text-sm mb-1.5 flex items-center gap-2">
              <span>🎯</span> 2. Casillas y la "Ruleta de Objetivo"
            </h4>
            <p className="leading-relaxed mb-2">
              Al caer en una casilla, la <strong>Ruleta de Jugadores</strong> selecciona al azar a quién va dirigido tu mensaje (equilibrando para que todos reciban feedback por igual):
            </p>
            <ul className="space-y-1.5">
              <li><strong className="text-emerald-400">🟢 Verde (Seguir haciendo — A un compañero):</strong> Ruleta selecciona a un compañero. Escríbele un elogio sincero. <strong>Suma +1 ⭐ para ti y +1 ⭐ para el compañero elegido</strong>.</li>
              <li><strong className="text-amber-400">🟡 Amarilla (Potenciar / Mejorar — A un compañero):</strong> Ruleta selecciona a un compañero. Dale un consejo constructivo o idea para brillar. <strong>Suma +1 ⭐ para ti</strong>.</li>
              <li><strong className="text-rose-400">🔴 Roja (Dejar de hacer — Al equipo / proceso):</strong> No señala a nadie. Señala un cuello de botella, freno técnico o mal hábito del flujo de trabajo. <strong>Suma +1 ⭐ para ti</strong>.</li>
              <li><strong className="text-purple-400">❓ Casilla de Evento (Caos y Kudos):</strong> Evento sorpresa (Kudo Doble, intercambiar casillas, robar estrella o caja de power-up).</li>
              <li><strong className="text-yellow-400">✨ Regla Comodín:</strong> Si caes en un color cuya medalla ya tienes, el sistema te deja elegir libremente cualquiera de las categorías que aún te falten.</li>
            </ul>
          </div>

          {/* 3. Power-Ups */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10">
            <h4 className="font-bold text-yellow-300 text-sm mb-1.5 flex items-center gap-2">
              <span>🎒</span> 3. Los 5 Power-Ups Tácticos
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>🍄 <strong>Champiñón Turbo:</strong> Lanza 2 dados 3D simultáneos (2 a 12).</div>
              <div>🎲 <strong>Dado Dorado:</strong> Dado cargado alto (4, 5 o 6).</div>
              <div>👻 <strong>Boo:</strong> Fantasma que vuela a robar 1 estrella a un rival.</div>
              <div>🍌 <strong>Plátano:</strong> Trampa en tu casilla que hace resbalar y frena en seco al siguiente.</div>
              <div className="col-span-2">🛡️ <strong>Estrella Escudo:</strong> Invencible frente a Boo y plátanos durante toda la vuelta.</div>
            </div>
          </div>

          {/* 4. El Peaje y Bonus Stars */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10">
            <h4 className="font-bold text-yellow-300 text-sm mb-1.5 flex items-center gap-2">
              <span>🌟</span> 4. Fase de El Peaje y Ruleta de Bonus Stars
            </h4>
            <p className="leading-relaxed">
              • <strong>El Peaje:</strong> Al finalizar las 4 rondas, quien no haya completado sus 3 medallas escribe las tarjetas pendientes en vivo antes de la premiación.<br />
              • <strong>Bonus Stars:</strong> Quienes terminan con sus 3 medallas completas desbloquean una tirada final: Estrella del Crítico (+2 ⭐), Estrella del Robo (-1 / +1 ⭐) o Estrella del Reconocimiento (+2 ⭐ para un compañero).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs uppercase hover:brightness-110 active:scale-95"
          >
            Entendido, ¡a jugar!
          </button>
        </div>
      </div>
    </div>
  );
};