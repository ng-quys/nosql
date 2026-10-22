import React from 'react';
import { Drink } from '../../types';

interface BeverageIllustrationProps {
  drink: Drink;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
}

export const BeverageIllustration: React.FC<BeverageIllustrationProps> = ({
  drink,
  className = '',
  size = 'md',
}) => {
  const dimensions = {
    sm: 'w-16 h-20',
    md: 'w-32 h-44',
    lg: 'w-48 h-64',
    hero: 'w-64 h-80 md:w-80 md:h-96',
  };

  // Color mapping based on Vietnamese fruit drinks
  const getGradientColors = () => {
    const id = drink.id;
    const name = (drink.name || '').toLowerCase();

    // Check by ID or Name for authentic fruit color
    if (id === 'P001' || id === 'drink_2' || name.includes('mango') || name.includes('xoài')) {
      return {
        start: '#D97706',
        mid: '#F59E0B',
        end: '#FBBF24',
        foam: '#FEF08A',
        accent: '#FDE047',
        garnish: 'mango',
      };
    }
    if (id === 'P003' || id === 'drink_1' || name.includes('avocado') || name.includes('bơ')) {
      return {
        start: '#1B4332',
        mid: '#2D6A4F',
        end: '#52B788',
        foam: '#D8F3DC',
        accent: '#95D5B2',
        garnish: 'avocado',
      };
    }
    if (id === 'P002' || id === 'drink_3' || name.includes('strawberry') || name.includes('dâu')) {
      return {
        start: '#831843',
        mid: '#BE185D',
        end: '#F472B6',
        foam: '#FCE7F3',
        accent: '#FBCFE8',
        garnish: 'strawberry',
      };
    }
    if (id === 'P004' || id === 'drink_6' || name.includes('orange') || name.includes('cam')) {
      return {
        start: '#C2410C',
        mid: '#EA580C',
        end: '#FB923C',
        foam: '#FFEDD5',
        accent: '#FED7AA',
        garnish: 'orange',
      };
    }
    if (id === 'P005' || id === 'drink_7' || name.includes('watermelon') || name.includes('dưa hấu')) {
      return {
        start: '#9F1239',
        mid: '#E11D48',
        end: '#FB7185',
        foam: '#FFE4E6',
        accent: '#FECDD3',
        garnish: 'watermelon',
      };
    }
    if (id === 'P006' || id === 'drink_8' || name.includes('pineapple') || name.includes('thơm') || name.includes('dứa')) {
      return {
        start: '#B45309',
        mid: '#D97706',
        end: '#FBBF24',
        foam: '#FEF9C3',
        accent: '#FEF08A',
        garnish: 'pineapple',
      };
    }
    if (id === 'P007' || id === 'drink_10' || name.includes('passion') || name.includes('chanh dây')) {
      return {
        start: '#B45309',
        mid: '#F59E0B',
        end: '#FCD34D',
        foam: '#FFFBEB',
        accent: '#FEF3C7',
        garnish: 'passionfruit',
      };
    }
    if (id === 'P008' || id === 'P012' || id === 'drink_5' || id === 'drink_12' || name.includes('berry') || name.includes('việt quất')) {
      return {
        start: '#312E81',
        mid: '#4338CA',
        end: '#6366F1',
        foam: '#EEF2FF',
        accent: '#C7D2FE',
        garnish: 'blueberry',
      };
    }
    if (id === 'P009' || id === 'drink_9' || name.includes('guava') || name.includes('ổi')) {
      return {
        start: '#9D174D',
        mid: '#BE185D',
        end: '#F472B6',
        foam: '#FDF2F8',
        accent: '#FCE7F3',
        garnish: 'guava',
      };
    }
    if (id === 'P010' || id === 'drink_4' || name.includes('detox') || name.includes('green')) {
      return {
        start: '#065F46',
        mid: '#059669',
        end: '#34D399',
        foam: '#D1FAE5',
        accent: '#6EE7B7',
        garnish: 'mint',
      };
    }
    if (id === 'P011' || id === 'drink_11' || name.includes('tropical') || name.includes('combo')) {
      return {
        start: '#D97706',
        mid: '#EA580C',
        end: '#FBBF24',
        foam: '#FEF08A',
        accent: '#FDE047',
        garnish: 'mango',
      };
    }

    return {
      start: '#1B4332',
      mid: '#2D6A4F',
      end: '#52B788',
      foam: '#D8F3DC',
      accent: '#95D5B2',
      garnish: 'mint',
    };
  };

  const colors = getGradientColors();

  return (
    <div
      className={`relative flex items-center justify-center select-none ${dimensions[size]} ${className}`}
      aria-label={`${drink.name}`}
    >
      <svg
        viewBox="0 0 200 260"
        className="w-full h-full drop-shadow-md overflow-visible transition-transform duration-300 group-hover:scale-105"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`liquid-${drink.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.end} />
            <stop offset="50%" stopColor={colors.mid} />
            <stop offset="100%" stopColor={colors.start} />
          </linearGradient>

          <linearGradient id={`glass-glare-${drink.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
            <stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.1" />
            <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.0" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.4" />
          </linearGradient>

          <linearGradient id={`ice-cube-${drink.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Ambient shadow underneath */}
        <ellipse cx="100" cy="245" rx="55" ry="10" fill="#000000" fillOpacity="0.08" />

        {/* Straw */}
        <path
          d="M 125 15 L 140 -25"
          stroke="#FAF7F2"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M 125 15 L 140 -25"
          stroke="#2D6A4F"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray="6 6"
        />

        {/* Glass Silhouette */}
        <path
          d="M 52 45 L 64 230 C 65 237, 75 240, 100 240 C 125 240, 135 237, 136 230 L 148 45 Z"
          fill="#FAF9F5"
          fillOpacity="0.45"
          stroke="#E5E0D4"
          strokeWidth="2"
        />

        {/* Liquid Body */}
        <path
          d="M 54 75 Q 100 82 146 75 L 135 228 C 132 235, 120 238, 100 238 C 80 238, 68 235, 65 228 Z"
          fill={`url(#liquid-${drink.id})`}
        />

        {/* Texture specks */}
        <circle cx="85" cy="120" r="2.5" fill="#FFFFFF" fillOpacity="0.35" />
        <circle cx="118" cy="140" r="2" fill="#FFFFFF" fillOpacity="0.3" />
        <circle cx="75" cy="175" r="3" fill="#FFFFFF" fillOpacity="0.25" />
        <circle cx="122" cy="190" r="2.5" fill="#FFFFFF" fillOpacity="0.35" />
        <circle cx="95" cy="210" r="2" fill="#FFFFFF" fillOpacity="0.2" />

        {/* Floating Ice Cubes */}
        <rect
          x="75"
          y="85"
          width="24"
          height="24"
          rx="4"
          transform="rotate(15 75 85)"
          fill={`url(#ice-cube-${drink.id})`}
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeOpacity="0.6"
        />
        <rect
          x="105"
          y="105"
          width="22"
          height="22"
          rx="4"
          transform="rotate(-18 105 105)"
          fill={`url(#ice-cube-${drink.id})`}
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeOpacity="0.5"
        />

        {/* Liquid Top Foam */}
        <ellipse cx="100" cy="75" rx="46" ry="9" fill={colors.foam} fillOpacity="0.9" />
        <ellipse cx="100" cy="74" rx="43" ry="7" fill={colors.accent} fillOpacity="0.3" />

        {/* Glass Rim */}
        <ellipse cx="100" cy="45" rx="48" ry="10" stroke="#FFFFFF" strokeWidth="2.5" fill="none" />
        <ellipse cx="100" cy="45" rx="48" ry="10" stroke="#DED6C3" strokeWidth="1" fill="none" />

        {/* Glass Glare */}
        <path
          d="M 62 60 L 71 225 C 73 227, 77 228, 80 228 L 72 60 Z"
          fill={`url(#glass-glare-${drink.id})`}
        />

        {/* Garnishes */}
        {colors.garnish === 'avocado' && (
          <g transform="translate(130, 36) rotate(20)">
            <ellipse cx="10" cy="8" rx="14" ry="9" fill="#1B4332" />
            <ellipse cx="10" cy="8" rx="12" ry="7.5" fill="#A7D489" />
            <circle cx="10" cy="8" r="4.5" fill="#582A0C" />
          </g>
        )}

        {colors.garnish === 'mango' && (
          <g transform="translate(132, 35) rotate(20)">
            <path d="M 0 0 Q 15 -10 22 5 Q 12 18 0 0 Z" fill="#FBBF24" />
            <path d="M 2 2 Q 13 -6 18 4" stroke="#FEF08A" strokeWidth="1.5" />
          </g>
        )}

        {colors.garnish === 'orange' && (
          <g transform="translate(130, 32) rotate(15)">
            <path d="M 0 15 A 22 22 0 0 1 35 -5 Z" fill="#F97316" />
            <path d="M 3 13 A 18 18 0 0 1 32 -2 Z" fill="#FFEDD5" />
            <path d="M 6 11 A 15 15 0 0 1 29 1 Z" fill="#EA580C" />
            <line x1="18" y1="5" x2="6" y2="11" stroke="#FFEDD5" strokeWidth="1.5" />
            <line x1="18" y1="5" x2="29" y2="1" stroke="#FFEDD5" strokeWidth="1.5" />
            <line x1="18" y1="5" x2="22" y2="15" stroke="#FFEDD5" strokeWidth="1.5" />
          </g>
        )}

        {colors.garnish === 'strawberry' && (
          <g transform="translate(132, 35) rotate(15)">
            <path d="M 0 5 C 2 -5, 16 -5, 18 5 C 18 16, 9 20, 9 20 C 9 20, 0 16, 0 5 Z" fill="#E11D48" />
            <path d="M 4 2 C 7 -4, 11 -4, 14 2" fill="#2D6A4F" />
            <circle cx="6" cy="8" r="0.8" fill="#FCE7F3" />
            <circle cx="12" cy="9" r="0.8" fill="#FCE7F3" />
            <circle cx="9" cy="13" r="0.8" fill="#FCE7F3" />
          </g>
        )}

        {colors.garnish === 'watermelon' && (
          <g transform="translate(130, 32) rotate(20)">
            <path d="M 0 16 A 22 22 0 0 1 32 0 Z" fill="#15803D" />
            <path d="M 2 14 A 20 20 0 0 1 30 2 Z" fill="#DC2626" />
            <circle cx="12" cy="7" r="1" fill="#111827" />
            <circle cx="18" cy="10" r="1" fill="#111827" />
          </g>
        )}

        {colors.garnish === 'mint' && (
          <g transform="translate(132, 38) rotate(25)">
            <path d="M 0 0 C 10 -15, 25 -10, 20 5 C 15 15, 5 10, 0 0 Z" fill="#2D6A4F" />
            <path d="M 0 0 C 15 -5, 25 15, 10 20 C 0 15, -2 5, 0 0 Z" fill="#40916C" />
            <path d="M 0 0 L 14 3" stroke="#D8F3DC" strokeWidth="1.2" strokeLinecap="round" />
          </g>
        )}
      </svg>
    </div>
  );
};
