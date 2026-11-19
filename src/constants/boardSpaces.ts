import { BoardSpace, BoardSpaceType } from '@/types/game';

export const BOARD_SPACE_CONFIG: Array<{ type: BoardSpaceType; title: string; label: string; desc: string }> = [
  { type: 'start', title: 'Salida', label: '🏁 SALIDA', desc: '¡Meta Rainbow! Cruzar otorga bonificación de vuelta.' },
  { type: 'green', title: 'Seguir Haciendo', label: '🟢 SEGUIR', desc: 'Escribe un elogio sincero a un compañero de equipo. (+1 ⭐ y Medalla Verde)' },
  { type: 'yellow', title: 'Mejorar / Potenciar', label: '🟡 MEJORAR', desc: 'Propón una optimización técnica o de proceso. (+1 ⭐ y Medalla Amarilla)' },
  { type: 'purple', title: 'Evento Caos', label: '🟣 CAOS', desc: '¡Ruleta de la Fortuna! Recibe un Power-Up aleatorio para tu mochila.' },
  { type: 'red', title: 'Dejar de Hacer', label: '🔴 DEJAR', desc: 'Señala un freno, deuda técnica o mal hábito a erradicar. (+1 ⭐ y Medalla Roja)' },
  
  { type: 'green', title: 'Seguir Haciendo', label: '🟢 SEGUIR', desc: 'Reconoce un hito o buena práctica del sprint. (+1 ⭐ y Medalla Verde)' },
  { type: 'yellow', title: 'Mejorar / Potenciar', label: '🟡 MEJORAR', desc: 'Idea para agilizar la entrega de valor al usuario. (+1 ⭐ y Medalla Amarilla)' },
  { type: 'purple', title: 'Evento Caos', label: '🟣 CAOS', desc: '¡Caja Sorpresa! Roba o intercambia un objeto especial.' },
  { type: 'red', title: 'Dejar de Hacer', label: '🔴 DEJAR', desc: '¿Qué nos retrasó en este sprint? Sácalo a la luz. (+1 ⭐ y Medalla Roja)' },
  { type: 'green', title: 'Seguir Haciendo', label: '🟢 SEGUIR', desc: 'Felicita a un compañero por su apoyo y proactividad. (+1 ⭐ y Medalla Verde)' },

  { type: 'yellow', title: 'Mejorar / Potenciar', label: '🟡 MEJORAR', desc: 'Consejo constructivo para mejorar la comunicación interna. (+1 ⭐ y Medalla Amarilla)' },
  { type: 'purple', title: 'Evento Caos', label: '🟣 CAOS', desc: '¡Tubería de la Suerte! Sorteo de estrellas o Power-Ups.' },
  { type: 'red', title: 'Dejar de Hacer', label: '🔴 DEJAR', desc: 'Identifica distracciones o reuniones improductivas. (+1 ⭐ y Medalla Roja)' },
  { type: 'green', title: 'Seguir Haciendo', label: '🟢 SEGUIR', desc: 'Agradece una solución creativa o rescate de sprint. (+1 ⭐ y Medalla Verde)' },
  { type: 'yellow', title: 'Mejorar / Potenciar', label: '🟡 MEJORAR', desc: 'Propuesta de refactorización o mejora de arquitectura. (+1 ⭐ y Medalla Amarilla)' },

  { type: 'purple', title: 'Evento Caos', label: '🟣 CAOS', desc: '¡Ruleta Boo! Elige un rival para disputar una estrella.' },
  { type: 'red', title: 'Dejar de Hacer', label: '🔴 DEJAR', desc: '¿Qué proceso nos causa fricción constante? (+1 ⭐ y Medalla Roja)' },
  { type: 'green', title: 'Seguir Haciendo', label: '🟢 SEGUIR', desc: 'Elogio por el rigor y calidad técnica demostrada. (+1 ⭐ y Medalla Verde)' },
  { type: 'yellow', title: 'Mejorar / Potenciar', label: '🟡 MEJORAR', desc: '¿Cómo podemos testear o desplegar con más confianza? (+1 ⭐ y Medalla Amarilla)' },
  { type: 'purple', title: 'Evento Caos', label: '🟣 CAOS', desc: '¡Estrella Fugaz! Oportunidad dorada antes de cruzar la meta.' },
];

export const BOARD_SPACES: BoardSpace[] = BOARD_SPACE_CONFIG.map((cfg, index) => {
  let colorHex = '#22c55e';
  let neonHex = '#00ff66';

  if (cfg.type === 'start') {
    colorHex = '#facc15';
    neonHex = '#ffee00';
  } else if (cfg.type === 'yellow') {
    colorHex = '#eab308';
    neonHex = '#ffee00';
  } else if (cfg.type === 'red') {
    colorHex = '#ef4444';
    neonHex = '#ff0033';
  } else if (cfg.type === 'purple') {
    colorHex = '#a855f7';
    neonHex = '#9900ff';
  }

  return {
    index,
    type: cfg.type,
    title: cfg.title,
    label: cfg.label,
    description: cfg.desc,
    colorHex,
    neonHex,
  };
});
