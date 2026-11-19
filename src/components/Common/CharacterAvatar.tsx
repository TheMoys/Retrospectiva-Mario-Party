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
    mario: '#ef4444',
    luigi: '#22c55e',
    peach: '#ec4899',
    yoshi: '#06b6d4',
    bowser: '#f97316',
    toad: '#eab308',
  };

  // High-fidelity vector SVG portraits for authentic Mario Party look
  const renderSvgAvatar = () => {
    switch (characterId) {
      case 'mario':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow">
            {/* Red Cap */}
            <path d="M15 48 C15 22, 85 22, 85 48 C85 52, 70 52, 50 52 C30 52, 15 52, 15 48 Z" fill="#E52521" />
            <ellipse cx="50" cy="50" rx="36" ry="10" fill="#C41E1A" />
            {/* White 'M' Emblem */}
            <circle cx="50" cy="34" r="13" fill="#FFFFFF" stroke="#C41E1A" strokeWidth="1.5" />
            <text x="50" y="40" fontSize="16" fontWeight="900" fill="#E52521" textAnchor="middle" fontFamily="Arial, sans-serif">M</text>
            {/* Face */}
            <ellipse cx="50" cy="64" rx="26" ry="22" fill="#FFDBAC" />
            {/* Nose */}
            <ellipse cx="50" cy="62" rx="9" ry="7" fill="#F1C27D" />
            {/* Blue Eyes */}
            <ellipse cx="40" cy="56" rx="4" ry="6" fill="#002688" />
            <circle cx="39" cy="54" r="1.5" fill="#FFFFFF" />
            <ellipse cx="60" cy="56" rx="4" ry="6" fill="#002688" />
            <circle cx="59" cy="54" r="1.5" fill="#FFFFFF" />
            {/* Iconic Mustache */}
            <path d="M26 68 C35 60, 48 72, 50 68 C52 72, 65 60, 74 68 C68 76, 56 74, 50 72 C44 74, 32 76, 26 68 Z" fill="#1C1917" />
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
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow">
            {/* Blonde Hair */}
            <circle cx="50" cy="52" r="32" fill="#FACC15" />
            <path d="M20 54 Q15 78 30 84 Q34 68 36 60 Z" fill="#EAB308" />
            <path d="M80 54 Q85 78 70 84 Q66 68 64 60 Z" fill="#EAB308" />
            {/* Face */}
            <ellipse cx="50" cy="58" rx="22" ry="23" fill="#FFE4E6" />
            {/* Golden Crown */}
            <path d="M34 26 L42 34 L50 20 L58 34 L66 26 L64 38 L36 38 Z" fill="#FFD700" stroke="#B45309" strokeWidth="1.5" />
            <circle cx="50" cy="30" r="3" fill="#E11D48" /> {/* Ruby */}
            <circle cx="40" cy="33" r="2" fill="#0284C7" /> {/* Sapphire */}
            <circle cx="60" cy="33" r="2" fill="#0284C7" />
            {/* Blue Eyes & Lashes */}
            <ellipse cx="42" cy="54" rx="3.5" ry="5" fill="#0284C7" />
            <circle cx="41" cy="52" r="1.5" fill="#FFFFFF" />
            <ellipse cx="58" cy="54" rx="3.5" ry="5" fill="#0284C7" />
            <circle cx="57" cy="52" r="1.5" fill="#FFFFFF" />
            {/* Pink Lips */}
            <path d="M46 70 Q50 74 54 70 Q50 71 46 70 Z" fill="#FB7185" />
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
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow">
            {/* Green Shell Back */}
            <circle cx="50" cy="52" r="33" fill="#166534" />
            {/* Red Fiery Hair */}
            <path d="M35 22 Q50 6 65 22 Q58 14 50 10 Q42 14 35 22 Z" fill="#DC2626" />
            {/* Yellow Horns */}
            <path d="M22 34 Q10 20 28 22 Z" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1.5" />
            <path d="M78 34 Q90 20 72 22 Z" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1.5" />
            {/* Yellow Head */}
            <ellipse cx="50" cy="56" rx="26" ry="24" fill="#FBBF24" />
            {/* Heavy Brow */}
            <path d="M30 44 Q50 38 70 44 Q50 48 30 44 Z" fill="#B45309" />
            {/* Fiery Eyes */}
            <ellipse cx="40" cy="48" rx="4" ry="5" fill="#DC2626" />
            <circle cx="40" cy="48" r="1.5" fill="#000000" />
            <ellipse cx="60" cy="48" rx="4" ry="5" fill="#DC2626" />
            <circle cx="60" cy="48" r="1.5" fill="#000000" />
            {/* Big Green Snout with Fangs */}
            <ellipse cx="50" cy="68" rx="20" ry="14" fill="#15803D" />
            <polygon points="40,64 43,74 37,74" fill="#FFFFFF" />
            <polygon points="60,64 63,74 57,74" fill="#FFFFFF" />
          </svg>
        );

      case 'toad':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow">
            {/* Big Mushroom Cap */}
            <path d="M16 48 C16 16, 84 16, 84 48 C84 54, 72 56, 50 56 C28 56, 16 54, 16 48 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
            {/* Red Polka Dots */}
            <circle cx="50" cy="30" r="11" fill="#E11D48" />
            <ellipse cx="24" cy="42" rx="6" ry="9" fill="#E11D48" />
            <ellipse cx="76" cy="42" rx="6" ry="9" fill="#E11D48" />
            {/* Face */}
            <ellipse cx="50" cy="68" rx="20" ry="18" fill="#FFDBAC" />
            {/* Black Oval Eyes with White Sparkle */}
            <ellipse cx="43" cy="64" rx="3" ry="6" fill="#1E293B" />
            <circle cx="42" cy="62" r="1.2" fill="#FFFFFF" />
            <ellipse cx="57" cy="64" rx="3" ry="6" fill="#1E293B" />
            <circle cx="56" cy="62" r="1.2" fill="#FFFFFF" />
            {/* Happy Smile */}
            <path d="M46 74 Q50 78 54 74" fill="none" stroke="#9A3412" strokeWidth="2" strokeLinecap="round" />
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
