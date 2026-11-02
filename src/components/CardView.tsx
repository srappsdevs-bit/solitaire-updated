import React from 'react';
import { Card, CardBackStyle, CardFaceStyle, CardAnimationStyle, Suit } from '../types/solitaire';
import { getRankSymbol, getSuitColor, getSuitSymbol } from '../utils/cardUtils';

interface CardViewProps {
  card: Card;
  cardBack?: CardBackStyle;
  cardFace?: CardFaceStyle;
  cardAnimation?: CardAnimationStyle;
  fastAnimations?: boolean;
  isSelected?: boolean;
  isHintSource?: boolean;
  isHintTarget?: boolean;
  isValidDropTarget?: boolean;
  isDragging?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  draggable?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  cardBack = 'classic-red',
  cardFace = 'classic',
  cardAnimation = 'slide',
  fastAnimations = false,
  isSelected = false,
  isHintSource = false,
  isHintTarget = false,
  isValidDropTarget = false,
  isDragging = false,
  onClick,
  onDoubleClick,
  onDragStart,
  onDragEnd,
  draggable = false,
  className = '',
  style,
}) => {
  const isRed = getSuitColor(card.suit) === 'red';
  const rankSymbol = getRankSymbol(card.rank);
  const suitSymbol = getSuitSymbol(card.suit);

  // Theme-specific face styles
  const getFaceStyles = () => {
    switch (cardFace) {
      case 'cyber':
        return {
          containerClass: 'bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.2)]',
          rankClass: isRed ? 'text-rose-400 drop-shadow-[0_0_5px_rgba(251,113,133,0.8)] font-mono font-bold' : 'text-cyan-300 drop-shadow-[0_0_5px_rgba(103,232,249,0.8)] font-mono font-bold',
          suitClass: isRed ? 'text-rose-400 drop-shadow-[0_0_5px_rgba(251,113,133,0.8)]' : 'text-cyan-300 drop-shadow-[0_0_5px_rgba(103,232,249,0.8)]',
          centerPipClass: isRed ? 'text-rose-400 drop-shadow-[0_0_10px_rgba(251,113,133,0.9)] opacity-95' : 'text-cyan-300 drop-shadow-[0_0_10px_rgba(103,232,249,0.9)] opacity-95',
          isCyber: true,
          isVintage: false,
        };
      case 'vintage':
        return {
          containerClass: 'bg-[#fcf8ed] border border-[#d6c7a6] shadow-sm',
          rankClass: isRed ? 'text-red-900 font-serif font-black' : 'text-stone-900 font-serif font-black',
          suitClass: isRed ? 'text-red-900' : 'text-stone-900',
          centerPipClass: isRed ? 'text-red-900/90 font-serif' : 'text-stone-900/90 font-serif',
          isCyber: false,
          isVintage: true,
        };
      case 'modern':
        return {
          containerClass: 'bg-white border border-zinc-200/90 shadow-sm ring-1 ring-black/5',
          rankClass: isRed ? 'text-red-500 font-sans font-black tracking-tighter' : 'text-zinc-950 font-sans font-black tracking-tighter',
          suitClass: isRed ? 'text-red-500' : 'text-zinc-950',
          centerPipClass: isRed ? 'text-red-500 font-sans' : 'text-zinc-950 font-sans',
          isCyber: false,
          isVintage: false,
        };
      case 'classic':
      default:
        return {
          containerClass: 'bg-white border border-slate-300/90 shadow-sm',
          rankClass: isRed ? 'text-rose-600 font-sans font-extrabold tracking-tight' : 'text-slate-900 font-sans font-extrabold tracking-tight',
          suitClass: isRed ? 'text-rose-600' : 'text-slate-900',
          centerPipClass: isRed ? 'text-rose-600 font-normal opacity-90' : 'text-slate-800 font-normal opacity-90',
          isCyber: false,
          isVintage: false,
        };
    }
  };

  const faceStyleConfig = getFaceStyles();

  // Render Court Face Card Art (Jack, Queen, King) adapted to Card Face Theme
  const renderCourtArt = () => {
    if (card.rank < 11 || card.rank > 13) return null;

    if (cardFace === 'cyber') {
      const neonColor = isRed ? '#fb7185' : '#38bdf8';
      const glowFilter = isRed ? 'drop-shadow(0 0 4px #f43f5e)' : 'drop-shadow(0 0 4px #06b6d4)';
      return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-0.5 opacity-90">
          <svg viewBox="0 0 60 80" className="w-full h-full max-w-[36px] sm:max-w-[48px] max-h-[50px] sm:max-h-[64px]" style={{ filter: glowFilter }}>
            <rect x="6" y="6" width="48" height="68" rx="2" fill="none" stroke={neonColor} strokeWidth="1" strokeDasharray="3 2" opacity="0.4" />
            {card.rank === 13 && (
              <g>
                <path d="M 16 34 L 20 20 L 30 28 L 40 20 L 44 34 Z" fill="none" stroke={neonColor} strokeWidth="2" />
                <circle cx="30" cy="20" r="3" fill={neonColor} />
                <rect x="22" y="36" width="16" height="22" rx="2" fill="none" stroke={neonColor} strokeWidth="1.5" />
                <text x="30" y="52" textAnchor="middle" fill={neonColor} fontSize="14" fontWeight="bold" fontFamily="monospace">K</text>
              </g>
            )}
            {card.rank === 12 && (
              <g>
                <path d="M 18 34 Q 30 18 42 34 L 38 24 L 30 28 L 22 24 Z" fill="none" stroke={neonColor} strokeWidth="2" />
                <circle cx="30" cy="38" r="8" fill="none" stroke={neonColor} strokeWidth="1.5" />
                <text x="30" y="43" textAnchor="middle" fill={neonColor} fontSize="13" fontWeight="bold" fontFamily="monospace">Q</text>
              </g>
            )}
            {card.rank === 11 && (
              <g>
                <path d="M 22 22 Q 30 14 38 22 L 36 32 L 24 32 Z" fill="none" stroke={neonColor} strokeWidth="2" />
                <rect x="24" y="32" width="12" height="18" rx="2" fill="none" stroke={neonColor} strokeWidth="1.5" />
                <text x="30" y="46" textAnchor="middle" fill={neonColor} fontSize="13" fontWeight="bold" fontFamily="monospace">J</text>
              </g>
            )}
          </svg>
        </div>
      );
    }

    if (cardFace === 'vintage') {
      const sepiaInk = isRed ? '#991b1b' : '#292524';
      const vintageGold = '#b45309';
      return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-0.5 opacity-90">
          <svg viewBox="0 0 60 80" className="w-full h-full max-w-[36px] sm:max-w-[48px] max-h-[50px] sm:max-h-[64px]">
            <rect x="6" y="6" width="48" height="68" rx="2" fill="none" stroke={vintageGold} strokeWidth="1" strokeDasharray="1 1" opacity="0.6" />
            <circle cx="30" cy="40" r="18" fill="none" stroke={vintageGold} strokeWidth="0.75" opacity="0.5" />
            {card.rank === 13 && (
              <g>
                <path d="M 16 34 L 20 20 L 30 27 L 40 20 L 44 34 Z" fill={vintageGold} stroke={sepiaInk} strokeWidth="1.2" />
                <circle cx="30" cy="20" r="2.5" fill="#b91c1c" />
                <circle cx="20" cy="18" r="2" fill={sepiaInk} />
                <circle cx="40" cy="18" r="2" fill={sepiaInk} />
                <rect x="22" y="36" width="16" height="22" rx="2" fill={sepiaInk} opacity="0.85" />
                <text x="30" y="52" textAnchor="middle" fill="#fef3c7" fontSize="15" fontWeight="bold" fontFamily="Cinzel, serif">K</text>
              </g>
            )}
            {card.rank === 12 && (
              <g>
                <path d="M 17 34 Q 30 18 43 34 L 39 24 L 30 28 L 21 24 Z" fill={vintageGold} stroke={sepiaInk} strokeWidth="1.2" />
                <circle cx="30" cy="38" r="8" fill={sepiaInk} opacity="0.85" />
                <text x="30" y="44" textAnchor="middle" fill="#fef3c7" fontSize="13" fontWeight="bold" fontFamily="Cinzel, serif">Q</text>
              </g>
            )}
            {card.rank === 11 && (
              <g>
                <path d="M 22 22 Q 30 14 38 22 L 36 32 L 24 32 Z" fill={vintageGold} stroke={sepiaInk} strokeWidth="1.2" />
                <rect x="24" y="32" width="12" height="18" rx="2" fill={sepiaInk} opacity="0.85" />
                <text x="30" y="46" textAnchor="middle" fill="#fef3c7" fontSize="13" fontWeight="bold" fontFamily="Cinzel, serif">J</text>
              </g>
            )}
          </svg>
        </div>
      );
    }

    if (cardFace === 'modern') {
      const modernColor = isRed ? '#ef4444' : '#18181b';
      return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-0.5 opacity-90">
          <svg viewBox="0 0 60 80" className="w-full h-full max-w-[34px] sm:max-w-[44px] max-h-[46px] sm:max-h-[58px]">
            {card.rank === 13 && (
              <g>
                <path d="M 16 36 L 22 22 L 30 28 L 38 22 L 44 36 Z" fill={modernColor} opacity="0.85" />
                <circle cx="30" cy="20" r="2.5" fill={modernColor} />
                <text x="30" y="54" textAnchor="middle" fill={modernColor} fontSize="16" fontWeight="900" fontFamily="sans-serif">K</text>
              </g>
            )}
            {card.rank === 12 && (
              <g>
                <path d="M 18 36 Q 30 20 42 36 Z" fill={modernColor} opacity="0.85" />
                <circle cx="30" cy="36" r="6" fill="none" stroke={modernColor} strokeWidth="2" />
                <text x="30" y="52" textAnchor="middle" fill={modernColor} fontSize="14" fontWeight="900" fontFamily="sans-serif">Q</text>
              </g>
            )}
            {card.rank === 11 && (
              <g>
                <polygon points="30,18 38,32 22,32" fill={modernColor} opacity="0.85" />
                <text x="30" y="52" textAnchor="middle" fill={modernColor} fontSize="14" fontWeight="900" fontFamily="sans-serif">J</text>
              </g>
            )}
          </svg>
        </div>
      );
    }

    // Classic Regal Court Art
    const accentColor = isRed ? '#e11d48' : '#334155';
    const goldColor = '#f59e0b';

    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-0.5 opacity-90">
        <svg viewBox="0 0 60 80" className="w-full h-full max-w-[36px] sm:max-w-[48px] max-h-[50px] sm:max-h-[64px]">
          <rect x="5" y="5" width="50" height="70" rx="3" fill="none" stroke={goldColor} strokeWidth="1" strokeDasharray="2 2" opacity="0.3" />
          {card.rank === 13 && (
            <g>
              <path d="M 15 35 L 20 20 L 30 28 L 40 20 L 45 35 Z" fill={goldColor} stroke={accentColor} strokeWidth="1.5" />
              <circle cx="30" cy="20" r="3" fill="#ef4444" />
              <circle cx="20" cy="17" r="2.5" fill={accentColor} />
              <circle cx="40" cy="17" r="2.5" fill={accentColor} />
              <rect x="22" y="36" width="16" height="22" rx="3" fill={accentColor} opacity="0.85" />
              <text x="30" y="52" textAnchor="middle" fill="#ffffff" fontSize="15" fontWeight="bold" fontFamily="Cinzel, serif">K</text>
            </g>
          )}
          {card.rank === 12 && (
            <g>
              <path d="M 16 34 Q 30 18 44 34 L 40 24 L 30 28 L 20 24 Z" fill={goldColor} stroke={accentColor} strokeWidth="1.5" />
              <polygon points="30,16 33,21 30,26 27,21" fill="#ef4444" />
              <circle cx="30" cy="38" r="8" fill={accentColor} opacity="0.85" />
              <text x="30" y="44" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold" fontFamily="Cinzel, serif">Q</text>
            </g>
          )}
          {card.rank === 11 && (
            <g>
              <path d="M 22 22 Q 30 14 38 22 L 36 32 L 24 32 Z" fill={goldColor} stroke={accentColor} strokeWidth="1.5" />
              <path d="M 30 14 Q 38 6 42 12 Q 36 16 30 14" fill="#ef4444" />
              <rect x="24" y="32" width="12" height="18" rx="2" fill={accentColor} opacity="0.85" />
              <text x="30" y="46" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold" fontFamily="Cinzel, serif">J</text>
            </g>
          )}
        </svg>
      </div>
    );
  };

  // Render Card Back Designs
  const renderCardBack = () => {
    switch (cardBack) {
      case 'royal-blue':
        return (
          <div className="w-full h-full rounded-md sm:rounded-lg bg-gradient-to-br from-blue-900 via-indigo-950 to-blue-900 border border-amber-300/40 p-0.5 flex items-center justify-center relative overflow-hidden shadow-inner">
            <div className="absolute inset-0.5 border border-amber-400/30 rounded flex items-center justify-center">
              <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border border-amber-300/50 flex items-center justify-center bg-blue-800/40">
                <span className="text-amber-300 text-[10px] sm:text-xs font-serif">✦</span>
              </div>
            </div>
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:5px_5px]"></div>
          </div>
        );
      case 'emerald-dragon':
        return (
          <div className="w-full h-full rounded-md sm:rounded-lg bg-gradient-to-br from-emerald-950 via-teal-900 to-green-950 border border-emerald-400/40 p-0.5 flex items-center justify-center relative overflow-hidden shadow-inner">
            <div className="absolute inset-0.5 border border-emerald-300/30 rounded flex items-center justify-center">
              <span className="text-emerald-300 text-sm sm:text-base">🐉</span>
            </div>
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:5px_5px]"></div>
          </div>
        );
      case 'celestial-gold':
        return (
          <div className="w-full h-full rounded-md sm:rounded-lg bg-gradient-to-br from-slate-950 via-zinc-900 to-black border border-amber-400/80 p-0.5 flex items-center justify-center relative overflow-hidden shadow-inner">
            <div className="absolute inset-0.5 border border-amber-400/50 rounded flex items-center justify-center">
              <span className="text-amber-400 text-sm sm:text-base">⚜</span>
            </div>
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fbbf24_1px,transparent_1px)] [background-size:5px_5px]"></div>
          </div>
        );
      case 'cyber-black':
        return (
          <div className="w-full h-full rounded-md sm:rounded-lg bg-gradient-to-br from-purple-950 via-slate-900 to-cyan-950 border border-cyan-400/50 p-0.5 flex items-center justify-center relative overflow-hidden shadow-inner">
            <div className="absolute inset-0.5 border border-cyan-300/30 rounded flex items-center justify-center">
              <div className="w-4 h-4 sm:w-5 sm:h-5 rotate-45 border border-cyan-400/60 bg-purple-900/30"></div>
            </div>
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:6px_6px]"></div>
          </div>
        );
      case 'classic-red':
      default:
        return (
          <div className="w-full h-full rounded-md sm:rounded-lg bg-gradient-to-br from-rose-900 via-red-950 to-rose-900 border border-amber-300/40 p-0.5 flex items-center justify-center relative overflow-hidden shadow-inner">
            <div className="absolute inset-0.5 border border-amber-400/30 rounded flex items-center justify-center">
              <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border border-amber-300/40 flex items-center justify-center bg-rose-900/30">
                <span className="text-amber-200 text-xs sm:text-sm">♦</span>
              </div>
            </div>
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#f87171_1px,transparent_1px)] [background-size:5px_5px]"></div>
          </div>
        );
    }
  };

  const isInteractable = Boolean(onClick || (draggable && card.faceUp));

  return (
    <div
      data-card-id={card.id}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      draggable={draggable && card.faceUp}
      tabIndex={card.faceUp && isInteractable ? 0 : -1}
      role={isInteractable ? 'button' : undefined}
      aria-label={card.faceUp ? `${rankSymbol} of ${card.suit}` : 'Face-down card'}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      style={style}
      className={`
        relative w-full aspect-[2.5/3.5]
        rounded-md sm:rounded-lg select-none ${
          cardAnimation === 'snap'
            ? 'transition-none'
            : cardAnimation === 'fade'
            ? `transition-[opacity,box-shadow,filter] ${fastAnimations ? 'duration-100' : 'duration-200'} ease-in-out delay-[25ms]`
            : `transition-[transform,box-shadow,filter,opacity] ${fastAnimations ? 'duration-75' : 'duration-150'} ease-out delay-[25ms]`
        } touch-manipulation
        ${draggable && card.faceUp ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
        shadow-sm sm:shadow active:scale-95
        ${isDragging ? 'opacity-40 scale-[0.98] ring-1 ring-amber-300/40 pointer-events-none' : ''}
        ${
          !isSelected && !isHintSource && !isHintTarget && !isDragging && isInteractable
            ? 'hover:-translate-y-1 hover:scale-[1.02] hover:shadow-md focus-visible:outline-none focus-visible:-translate-y-1 focus-visible:scale-[1.02] focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:shadow-lg'
            : ''
        }
        ${isSelected ? 'ring-2 sm:ring-3 ring-amber-400 -translate-y-2 z-40 shadow-amber-500/40 shadow-lg' : ''}
        ${isHintSource ? 'ring-2 sm:ring-3 ring-cyan-400 animate-pulse -translate-y-1.5 z-40 shadow-cyan-400/50' : ''}
        ${isHintTarget ? 'ring-2 sm:ring-3 ring-emerald-400 animate-bounce z-40 shadow-emerald-400/50' : ''}
        ${isValidDropTarget ? 'ring-2 sm:ring-3 ring-emerald-400 shadow-emerald-400/40' : ''}
        ${className}
      `}
    >
      {card.faceUp ? (
        <div className={`w-full h-full rounded-md sm:rounded-lg ${faceStyleConfig.containerClass} p-0.5 sm:p-1 flex flex-col justify-between relative overflow-hidden`}>
          {/* Subtle Vintage inner border */}
          {faceStyleConfig.isVintage && (
            <div className="absolute inset-0.5 border border-[#e2d5bc]/60 rounded pointer-events-none"></div>
          )}

          {/* Top-Left Rank & Mini Suit */}
          <div className="flex flex-col items-center leading-none z-10 w-3 sm:w-4">
            <span className={`text-xs sm:text-sm ${faceStyleConfig.rankClass}`}>
              {rankSymbol}
            </span>
            <span className={`text-[9px] sm:text-xs ${faceStyleConfig.suitClass}`}>
              {suitSymbol}
            </span>
          </div>

          {/* Center Art or Big Suit Pip */}
          {card.rank >= 11 && card.rank <= 13 ? (
            renderCourtArt()
          ) : (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className={`text-lg sm:text-2xl font-normal ${faceStyleConfig.centerPipClass}`}>
                {suitSymbol}
              </span>
            </div>
          )}

          {/* Bottom-Right Rank & Mini Suit (Inverted) */}
          <div className="flex flex-col items-center leading-none self-end rotate-180 z-10 w-3 sm:w-4">
            <span className={`text-xs sm:text-sm ${faceStyleConfig.rankClass}`}>
              {rankSymbol}
            </span>
            <span className={`text-[9px] sm:text-xs ${faceStyleConfig.suitClass}`}>
              {suitSymbol}
            </span>
          </div>
        </div>
      ) : (
        renderCardBack()
      )}
    </div>
  );
};
