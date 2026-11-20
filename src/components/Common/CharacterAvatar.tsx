import React from 'react';
import { CharacterId } from '@/types/game';

interface CharacterAvatarProps {
  characterId: CharacterId;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
}

export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({
  characterId,
  size = 'md',
  className = '',
  showBorder = true,
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
  };

  const borderColors: Record<CharacterId, string> = {
    mario: '#38bdf8', // Boo (Cian Fantasmal)
    luigi: '#22c55e', // Luigi (Verde)
    peach: '#00f0ff', // Rosalina (Azul Estelar)
    yoshi: '#10b981', // Yoshi (Esmeralda)
    bowser: '#2dd4bf', // Huesitos (Turquesa Hueso)
    toad: '#fb7185', // ShyGuy (Rosa Rubí)
  };

  // High-fidelity vector SVG portraits for authentic Mario Party look
  const renderSvgAvatar = () => {
    switch (characterId) {
      case 'mario':
        // Boo (Fantasma Icónico)
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow">
            <circle cx="50" cy="50" r="38" fill="#E0F2FE" opacity="0.3" />
            <path d="M 22 52 Q 10 44 15 36 Q 24 42 26 50 Z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />
            <path d="M 78 52 Q 90 44 85 36 Q 76 42 74 50 Z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />
            <circle cx="50" cy="50" r="33" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
            <path d="M 32 38 Q 42 37 45 42" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M 68 38 Q 58 37 55 42" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <ellipse cx="38" cy="45" rx="3.5" ry="5.5" fill="#0F172A" />
            <ellipse cx="62" cy="45" rx="3.5" ry="5.5" fill="#0F172A" />
            <path d="M 30 55 C 32 78, 68 78, 70 55 Q 50 62 30 55 Z" fill="#881337" stroke="#4C0519" strokeWidth="1" />
            <path d="M 40 67 C 45 61, 55 61, 60 67 C 55 76, 45 76, 40 67 Z" fill="#F43F5E" />
            <polygon points="36,56 40,64 44,56" fill="#FFFFFF" />
            <polygon points="56,56 60,64 64,56" fill="#FFFFFF" />
          </svg>
        );

      case 'luigi':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow">
            {/* Green Cap */}
            <path d="M18 46 C18 20, 82 20, 82 46 C82 50, 68 50, 50 50 C32 50, 18 50, 18 46 Z" fill="#43B047" />
            <ellipse cx="50" cy="48" rx="34" ry="9" fill="#2E8B32" />
            {/* White 'L' Emblem */}
            <circle cx="50" cy="32" r="13" fill="#FFFFFF" stroke="#2E8B32" strokeWidth="1.5" />
            <text x="50" y="39" fontSize="16" fontWeight="900" fill="#43B047" textAnchor="middle" fontFamily="Arial, sans-serif">L</text>
            {/* Slender Face */}
            <ellipse cx="50" cy="64" rx="23" ry="24" fill="#FFDBAC" />
            {/* Big Nose */}
            <ellipse cx="50" cy="60" rx="9.5" ry="8" fill="#F1C27D" />
            {/* Blue Eyes */}
            <ellipse cx="41" cy="54" rx="3.5" ry="5.5" fill="#002688" />
            <circle cx="40" cy="52" r="1.2" fill="#FFFFFF" />
            <ellipse cx="59" cy="54" rx="3.5" ry="5.5" fill="#002688" />
            <circle cx="58" cy="52" r="1.2" fill="#FFFFFF" />
            {/* Luigi Mustache */}
            <path d="M28 67 C36 61, 48 70, 50 67 C52 70, 64 61, 72 67 C66 75, 56 73, 50 71 C44 73, 34 75, 28 67 Z" fill="#1C1917" />
          </svg>
        );

      case 'peach':
        // Rosalina (Princesa Cósmica)
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow">
            <circle cx="50" cy="52" r="34" fill="#FDE047" />
            <path d="M 18 54 Q 12 78 28 84 Q 34 68 36 60 Z" fill="#FACC15" />
            <path d="M 82 54 Q 88 78 72 84 Q 66 68 64 60 Z" fill="#FACC15" />
            <ellipse cx="50" cy="58" rx="22" ry="23" fill="#FFF1F2" />
            <path d="M 32 26 L 41 34 L 50 18 L 59 34 L 68 26 L 65 37 L 35 37 Z" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />
            <circle cx="50" cy="28" r="3.5" fill="#00F0FF" />
            <path d="M 28 40 C 35 32, 60 30, 68 45 C 72 58, 66 70, 60 76 C 56 62, 54 50, 48 44 C 42 40, 32 40, 28 40 Z" fill="#FEF08A" />
            <ellipse cx="40" cy="54" rx="4" ry="5.5" fill="#0284C7" />
            <circle cx="39" cy="52" r="1.5" fill="#FFFFFF" />
            <path d="M 34 49 Q 40 45 46 49" stroke="#0369A1" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M 44 70 Q 48 73 52 70" stroke="#FB7185" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M 38 82 L 50 78 L 62 82 L 50 86 Z" fill="#06B6D4" stroke="#0891B2" strokeWidth="1" />
            <polygon points="50,79 51.5,82 54,82 52,83.5 53,86 50,84 47,86 48,83.5 46,82 48.5,82" fill="#FDE047" />
          </svg>
        );

      case 'yoshi':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow">
            {/* Green Head Base */}
            <circle cx="50" cy="50" r="30" fill="#22C55E" />
            {/* White Rounded Cheek/Jaw */}
            <ellipse cx="50" cy="65" rx="26" ry="18" fill="#FFFFFF" />
            {/* Big Rounded Snout */}
            <ellipse cx="50" cy="46" rx="20" ry="17" fill="#22C55E" />
            {/* Nostrils */}
            <circle cx="45" cy="40" r="2" fill="#15803D" />
            <circle cx="55" cy="40" r="2" fill="#15803D" />
            {/* Big Friendly Eyes on top */}
            <ellipse cx="42" cy="28" rx="7" ry="11" fill="#FFFFFF" stroke="#15803D" strokeWidth="1.5" />
            <ellipse cx="43" cy="29" rx="3.5" ry="6.5" fill="#1E293B" />
            <circle cx="42" cy="26" r="1.5" fill="#FFFFFF" />
            <ellipse cx="58" cy="28" rx="7" ry="11" fill="#FFFFFF" stroke="#15803D" strokeWidth="1.5" />
            <ellipse cx="57" cy="29" rx="3.5" ry="6.5" fill="#1E293B" />
            <circle cx="56" cy="26" r="1.5" fill="#FFFFFF" />
            {/* Orange Crest on side */}
            <path d="M72 40 Q82 46 75 54 Z" fill="#F97316" />
          </svg>
        );

      case 'bowser':
        // Huesitos (Dry Bones)
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow">
            <circle cx="50" cy="52" r="34" fill="#0F766E" />
            <circle cx="50" cy="52" r="31" fill="#134E4A" />
            <polygon points="50,14 46,24 54,24" fill="#E2E8F0" />
            <polygon points="20,40 28,45 25,35" fill="#E2E8F0" />
            <polygon points="80,40 72,45 75,35" fill="#E2E8F0" />
            <ellipse cx="50" cy="52" rx="26" ry="24" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="2" />
            <ellipse cx="38" cy="48" rx="8" ry="9" fill="#0F172A" />
            <ellipse cx="62" cy="48" rx="8" ry="9" fill="#0F172A" />
            <circle cx="39" cy="47" r="2.8" fill="#2DD4BF" />
            <circle cx="38.5" cy="46.5" r="1.0" fill="#FFFFFF" />
            <circle cx="61" cy="47" r="2.8" fill="#2DD4BF" />
            <circle cx="60.5" cy="46.5" r="1.0" fill="#FFFFFF" />
            <path d="M 34 62 Q 50 58 66 62 L 64 74 Q 50 78 36 74 Z" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />
            <line x1="42" y1="62" x2="42" y2="74" stroke="#64748B" strokeWidth="1.5" />
            <line x1="50" y1="61" x2="50" y2="76" stroke="#64748B" strokeWidth="1.5" />
            <line x1="58" y1="62" x2="58" y2="74" stroke="#64748B" strokeWidth="1.5" />
          </svg>
        );

      case 'toad':
        // ShyGuy
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow">
            <path d="M 20 54 C 18 20, 82 20, 80 54 C 80 82, 20 82, 20 54 Z" fill="#E11D48" stroke="#9F1239" strokeWidth="2" />
            <ellipse cx="50" cy="54" rx="27" ry="29" fill="#881337" />
            <ellipse cx="50" cy="54" rx="23" ry="26" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
            <ellipse cx="40" cy="48" rx="4.5" ry="7.5" fill="#0F172A" />
            <ellipse cx="60" cy="48" rx="4.5" ry="7.5" fill="#0F172A" />
            <circle cx="50" cy="65" r="4.5" fill="#0F172A" />
            <path d="M 27 54 L 32 54" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
            <path d="M 68 54 L 73 54" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
            <circle cx="50" cy="27" r="3.5" fill="#FBBF24" stroke="#B45309" strokeWidth="1" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`rounded-2xl flex items-center justify-center p-1 bg-slate-900/90 shadow-md shrink-0 transition-transform ${sizeClasses[size]} ${className}`}
      style={
        showBorder
          ? {
              borderWidth: '2.5px',
              borderColor: borderColors[characterId] || '#facc15',
              boxShadow: `0 0 12px ${borderColors[characterId]}55`,
            }
          : {}
      }
    >
      {renderSvgAvatar()}
    </div>
  );
};
