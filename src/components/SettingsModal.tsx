import React, { useState } from 'react';
import { X, Volume2, Volume1, VolumeX, Sparkles, Palette, RotateCcw, Check, BarChart3, ChevronRight, Trophy, Play, Music, Clock, Feather, Dices, Zap, ShieldAlert, GraduationCap, Vibrate, TrendingUp, Layers, Sliders, ArrowDownUp, ArrowUpDown, Move } from 'lucide-react';
import { CardBackStyle, CardFaceStyle, CardAnimationStyle, PlayerSettings, TableTheme, AudioPackId, DifficultyLevel, HapticIntensity } from '../types/solitaire';
import { getUserStats, calculateWinRate, formatClockTime } from '../utils/stats';
import { getAchievements } from '../utils/achievements';
import { AUDIO_PACKS, sound } from '../utils/audio';
import { haptics } from '../utils/haptics';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PlayerSettings;
  onUpdateSettings: (newSettings: Partial<PlayerSettings>) => void;
  onResetStats: () => void;
  onOpenStats?: (initialTab?: 'stats' | 'achievements') => void;
  onStartNewDeal?: (difficulty: DifficultyLevel) => void;
  onOpenTutorial?: () => void;
  onSortTableauByRank?: () => void;
  onSortTableauBySuit?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetStats,
  onOpenStats,
  onStartNewDeal,
  onOpenTutorial,
  onSortTableauByRank,
  onSortTableauBySuit,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'cards' | 'audio'>('general');

  if (!isOpen) return null;

  const quickStats = getUserStats();
  const achievements = getAchievements();
  const unlockedBadges = achievements.filter(a => a.unlocked).length;

  const difficultyOptions: {
    id: DifficultyLevel;
    name: string;
    badge: string;
    badgeClass: string;
    description: string;
    tags: string[];
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
    borderActive: string;
  }[] = [
    {
      id: 'easy',
      name: 'Easy (Winnable Guarantee)',
      badge: 'Recommended',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      description: 'Guarantees at least one winnable path with favorable card distribution, accessible low ranks, and multiple opening moves.',
      tags: ['Winnable Deal Guarantee', 'Uncovered Aces & 2s', '3+ Opening Plays'],
      icon: Sparkles,
      iconColor: 'text-emerald-400 bg-emerald-950/80 border-emerald-700/50',
      borderActive: 'border-emerald-400 ring-2 ring-emerald-400/20 bg-slate-800/90 shadow-md',
    },
    {
      id: 'medium',
      name: 'Medium (Balanced Play)',
      badge: 'Standard',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      description: 'Balanced classic Solitaire dealing. Filters deals to guarantee at least 1-2 playable opening moves, avoiding instant deadlocks.',
      tags: ['Balanced Distribution', 'Opening Playability', 'Fair Solitaire'],
      icon: Zap,
      iconColor: 'text-amber-400 bg-amber-950/80 border-amber-700/50',
      borderActive: 'border-amber-400 ring-2 ring-amber-400/20 bg-slate-800/90 shadow-md',
    },
    {
      id: 'hard',
      name: 'Hard (Pure Random)',
      badge: 'Casino & Tournament',
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      description: 'Pure unconstrained random Fisher-Yates shuffle distribution. True casino conditions with no assistance or deal filtering.',
      tags: ['100% Unconstrained Random', 'Tournament Rules', 'Maximum Challenge'],
      icon: ShieldAlert,
      iconColor: 'text-rose-400 bg-rose-950/80 border-rose-700/50',
      borderActive: 'border-rose-400 ring-2 ring-rose-400/20 bg-slate-800/90 shadow-md',
    },
  ];

  const tableThemes: { id: TableTheme; name: string; color: string; border: string }[] = [
    { id: 'emerald', name: 'Casino Emerald', color: 'from-emerald-900 to-green-950', border: 'border-emerald-600' },
    { id: 'burgundy', name: 'Royal Burgundy', color: 'from-rose-950 to-red-950', border: 'border-rose-600' },
    { id: 'sapphire', name: 'Midnight Sapphire', color: 'from-blue-950 to-slate-950', border: 'border-blue-600' },
    { id: 'obsidian', name: 'Dark Obsidian', color: 'from-zinc-900 to-black', border: 'border-zinc-600' },
  ];

  const visualCardSets: {
    id: string;
    name: string;
    tagline: string;
    cardBack: CardBackStyle;
    cardFace: CardFaceStyle;
    badge: string;
    themeClass: string;
  }[] = [
    {
      id: 'classic-heritage',
      name: 'Classic Heritage',
      tagline: 'Casino Crimson & Regal White Face',
      cardBack: 'classic-red',
      cardFace: 'classic',
      badge: 'Classic',
      themeClass: 'from-rose-950 via-slate-900 to-slate-950 border-rose-500/40',
    },
    {
      id: 'modern-minimal',
      name: 'Modern Minimal',
      tagline: 'Sapphire Chevron & Clean Sans Face',
      cardBack: 'royal-blue',
      cardFace: 'modern',
      badge: 'Minimal',
      themeClass: 'from-blue-950 via-slate-900 to-slate-950 border-blue-500/40',
    },
    {
      id: 'vintage-parlor',
      name: 'Vintage Parlor',
      tagline: 'Celestial Gold & Aged Parchment Face',
      cardBack: 'celestial-gold',
      cardFace: 'vintage',
      badge: 'Antique',
      themeClass: 'from-amber-950 via-slate-900 to-slate-950 border-amber-500/40',
    },
    {
      id: 'cyber-neon',
      name: 'Cyber Neon',
      tagline: 'Matrix Circuit & Dark Hologram Face',
      cardBack: 'cyber-black',
      cardFace: 'cyber',
      badge: 'Dark Mode',
      themeClass: 'from-purple-950 via-slate-900 to-cyan-950 border-cyan-400/50',
    },
  ];

  const cardFaceOptions: {
    id: CardFaceStyle;
    name: string;
    subtitle: string;
    badge: string;
    sampleRank: string;
    sampleSuit: string;
    sampleBgClass: string;
    sampleTextClass: string;
  }[] = [
    {
      id: 'classic',
      name: 'Classic Heritage',
      subtitle: 'Crisp white card stock, royal ruby & obsidian serif typography',
      badge: 'Traditional',
      sampleRank: 'A',
      sampleSuit: '♥',
      sampleBgClass: 'bg-white border-slate-300 shadow-sm',
      sampleTextClass: 'text-rose-600',
    },
    {
      id: 'modern',
      name: 'Modern Minimal',
      subtitle: 'Ultra-clean high-contrast white face, bold contemporary sans numerals',
      badge: 'Clean',
      sampleRank: 'K',
      sampleSuit: '♠',
      sampleBgClass: 'bg-white border-zinc-200 ring-1 ring-black/5 shadow-sm',
      sampleTextClass: 'text-zinc-950 font-black',
    },
    {
      id: 'vintage',
      name: 'Vintage Parlor',
      subtitle: 'Warm aged ivory parchment, Didot serif numerals, sepia crimson & charcoal ink',
      badge: 'Parchment',
      sampleRank: 'Q',
      sampleSuit: '♦',
      sampleBgClass: 'bg-[#fcf8ed] border-[#d6c7a6] shadow-sm',
      sampleTextClass: 'text-red-900 font-serif',
    },
    {
      id: 'cyber',
      name: 'Cyber Neon',
      subtitle: 'Dark stealth slate face, glowing electric cyan & magenta suits, monospace typography',
      badge: 'Neon Glow',
      sampleRank: 'J',
      sampleSuit: '♣',
      sampleBgClass: 'bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.2)]',
      sampleTextClass: 'text-cyan-300 drop-shadow-[0_0_4px_rgba(103,232,249,0.8)] font-mono',
    },
  ];

  const cardBacks: { id: CardBackStyle; name: string; previewClass: string }[] = [
    { id: 'classic-red', name: 'Classic Crimson', previewClass: 'bg-gradient-to-br from-rose-800 to-red-950 border-amber-300/60' },
    { id: 'royal-blue', name: 'Royal Sapphire', previewClass: 'bg-gradient-to-br from-blue-900 to-indigo-950 border-amber-300/60' },
    { id: 'celestial-gold', name: 'Celestial Gold', previewClass: 'bg-gradient-to-br from-black to-zinc-900 border-amber-400' },
    { id: 'cyber-black', name: 'Cyber Neon', previewClass: 'bg-gradient-to-br from-purple-950 to-cyan-950 border-cyan-400/60' },
    { id: 'emerald-dragon', name: 'Emerald Dragon', previewClass: 'bg-gradient-to-br from-emerald-900 to-teal-950 border-emerald-400/60' },
  ];

  const hapticOptions: {
    id: HapticIntensity;
    name: string;
    badge: string;
    description: string;
    bars: number;
    strengthTag: string;
    borderActive: string;
    previewLabel: string;
  }[] = [
    {
      id: 'low',
      name: 'Low',
      badge: 'Gentle',
      description: 'Subtle micro-pulses for quiet play and battery efficiency.',
      bars: 1,
      strengthTag: '10–20ms',
      borderActive: 'border-sky-400 ring-2 ring-sky-400/20 bg-slate-800/90 shadow-md',
      previewLabel: 'Light Tap',
    },
    {
      id: 'medium',
      name: 'Medium',
      badge: 'Balanced',
      description: 'Crisp, natural tactile snaps simulating physical playing cards.',
      bars: 2,
      strengthTag: '25–45ms',
      borderActive: 'border-amber-400 ring-2 ring-amber-400/20 bg-slate-800/90 shadow-md',
      previewLabel: 'Crisp Snap',
    },
    {
      id: 'high',
      name: 'High',
      badge: 'Punchy',
      description: 'Firm, pronounced vibrations for high-impact arcade feel.',
      bars: 3,
      strengthTag: '50–85ms',
      borderActive: 'border-rose-400 ring-2 ring-rose-400/20 bg-slate-800/90 shadow-md',
      previewLabel: 'Strong Punch',
    },
  ];

  const animationOptions: {
    id: CardAnimationStyle;
    name: string;
    badge: string;
    badgeClass: string;
    description: string;
    previewBadge: string;
    icon: React.ComponentType<{ className?: string }>;
    borderActive: string;
  }[] = [
    {
      id: 'slide',
      name: 'Slide',
      badge: 'Fluid',
      badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      description: 'Classic physical card gliding with natural momentum and spatial easing curves.',
      previewBadge: 'Smooth Glide',
      icon: Move,
      borderActive: 'border-blue-400 ring-2 ring-blue-400/20 bg-slate-800/90 shadow-md',
    },
    {
      id: 'fade',
      name: 'Fade',
      badge: 'Dissolve',
      badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      description: 'Gentle crossfade dissolve transitions without sweeping motion across the felt.',
      previewBadge: 'Soft Fade',
      icon: Sparkles,
      borderActive: 'border-purple-400 ring-2 ring-purple-400/20 bg-slate-800/90 shadow-md',
    },
    {
      id: 'snap',
      name: 'Snap',
      badge: 'Instant',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      description: 'Zero-latency instantaneous card movement with no flight time or motion delay.',
      previewBadge: 'Speedrun Instant',
      icon: Zap,
      borderActive: 'border-amber-400 ring-2 ring-amber-400/20 bg-slate-800/90 shadow-md',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold font-serif text-white tracking-wide">
              Game Preferences & Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/60 px-4 sm:px-6 pt-2 gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'general'
                ? 'border-amber-400 text-amber-300 bg-slate-800/40 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>General & Game</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cards')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'cards'
                ? 'border-amber-400 text-amber-300 bg-slate-800/40 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Card Styles</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audio')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'audio'
                ? 'border-amber-400 text-amber-300 bg-slate-800/40 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Audio & Haptics</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: GENERAL & GAME */}
          {activeTab === 'general' && (
            <>
              {/* Linked User Game Statistics & Achievements Banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 border border-amber-500/40 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow flex items-center justify-center">
                      <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-amber-300">
                        <BarChart3 className="w-5 h-5" />
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Stats & Achievements</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          {unlockedBadges}/{achievements.length}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Win percentage, milestones, time & fastest wins
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Metrics Snapshot */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-950/70 py-1.5 px-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Win Rate</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {calculateWinRate(quickStats.totalGamesWon, quickStats.totalGamesPlayed)}
                    </span>
                  </div>
                  <div className="bg-slate-950/70 py-1.5 px-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Total Played</span>
                    <span className="font-bold text-white font-mono">{quickStats.totalGamesPlayed}</span>
                  </div>
                  <div className="bg-slate-950/70 py-1.5 px-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Fastest Win</span>
                    <span className="font-bold text-yellow-300 font-mono">
                      {formatClockTime(quickStats.fastestWinTime)}
                    </span>
                  </div>
                </div>

                {/* Buttons for Stats & Achievements */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onOpenStats && onOpenStats('stats')}
                    className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
                    <span>View Statistics</span>
                  </button>
                  <button
                    onClick={() => onOpenStats && onOpenStats('achievements')}
                    className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Achievements ({unlockedBadges})</span>
                  </button>
                </div>
              </div>

              {/* Deal Generation Difficulty Level */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Dices className="w-3.5 h-3.5 text-amber-400" />
                    <span>Deal Generation Difficulty</span>
                  </label>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                    (settings.difficultyLevel || 'easy') === 'easy'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : (settings.difficultyLevel || 'easy') === 'medium'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}>
                    {(settings.difficultyLevel || 'easy').toUpperCase()}
                  </span>
                </div>

                {/* 3 Difficulty Option Cards */}
                <div className="space-y-2.5">
                  {difficultyOptions.map(opt => {
                    const isSelected = (settings.difficultyLevel || 'easy') === opt.id;
                    const IconComponent = opt.icon;

                    return (
                      <div
                        key={opt.id}
                        onClick={() => onUpdateSettings({ difficultyLevel: opt.id })}
                        className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                          isSelected
                            ? opt.borderActive
                            : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 shadow-sm ${opt.iconColor}`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white">{opt.name}</span>
                                <span className={`text-[9px] uppercase font-mono px-1.5 py-0.2 rounded border ${opt.badgeClass}`}>
                                  {opt.badge}
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 leading-snug">{opt.description}</p>
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {opt.tags.map(tag => (
                                  <span
                                    key={tag}
                                    className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center">
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Deal New Hand Button with current difficulty */}
                {onStartNewDeal && (
                  <div className="pt-0.5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onStartNewDeal(settings.difficultyLevel || 'easy')}
                      className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Deal New Hand ({(settings.difficultyLevel || 'easy').toUpperCase()})</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Beginner Tableau Organization */}
              {(onSortTableauByRank || onSortTableauBySuit) && (
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                      <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
                      <span>Beginner Tableau Organization</span>
                    </label>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                      Undo Supported
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-snug">
                    Reorder exposed face-up cards in each column to help beginners spot sequences and suits clearly without affecting face-down cards underneath.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {onSortTableauByRank && (
                      <button
                        type="button"
                        onClick={() => {
                          onSortTableauByRank();
                          if (settings.soundEnabled) sound.playCardFlip();
                        }}
                        className="p-3 rounded-xl border border-slate-700 bg-slate-950/70 hover:bg-slate-800 hover:border-amber-400/60 transition-all flex items-center gap-3 text-left group active:scale-95 cursor-pointer shadow-sm"
                      >
                        <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 group-hover:bg-amber-500/25 transition-colors">
                          <ArrowDownUp className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                            Sort by Rank
                          </div>
                          <div className="text-[11px] text-slate-400 leading-tight">
                            Order face-up cards K → A
                          </div>
                        </div>
                      </button>
                    )}
                    {onSortTableauBySuit && (
                      <button
                        type="button"
                        onClick={() => {
                          onSortTableauBySuit();
                          if (settings.soundEnabled) sound.playCardFlip();
                        }}
                        className="p-3 rounded-xl border border-slate-700 bg-slate-950/70 hover:bg-slate-800 hover:border-blue-400/60 transition-all flex items-center gap-3 text-left group active:scale-95 cursor-pointer shadow-sm"
                      >
                        <div className="w-9 h-9 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-500/25 transition-colors">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                            Sort by Suit
                          </div>
                          <div className="text-[11px] text-slate-400 leading-tight">
                            Group cards by suit (♠ ♥ ♣ ♦)
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Gameplay & Feedback Toggles */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <label className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">
                  Gameplay & Automation
                </label>

                {/* Card Movement Animation Style */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                      <Move className="w-3.5 h-3.5 text-amber-400" />
                      <span>Card Movement Animation</span>
                    </label>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-900 text-amber-300 border border-slate-800">
                      {(settings.cardAnimation || 'slide').toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {animationOptions.map(opt => {
                      const isSelected = (settings.cardAnimation || 'slide') === opt.id;
                      const IconComponent = opt.icon;

                      return (
                        <div
                          key={opt.id}
                          onClick={() => {
                            onUpdateSettings({ cardAnimation: opt.id });
                            if (settings.soundEnabled) sound.playCardFlip();
                          }}
                          className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between text-left ${
                            isSelected
                              ? opt.borderActive
                              : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950/80'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <div className="flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 shadow-sm ${
                                  isSelected ? 'bg-amber-400/20 border-amber-400/40 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                                }`}>
                                  <IconComponent className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-sm font-bold text-white">{opt.name}</span>
                              </div>
                              {isSelected ? (
                                <span className="text-[10px] font-bold text-amber-300 flex items-center gap-0.5">
                                  <Check className="w-3 h-3" />
                                  Active
                                </span>
                              ) : (
                                <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${opt.badgeClass}`}>
                                  {opt.badge}
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-300 leading-snug">
                              {opt.description}
                            </p>
                          </div>

                          <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-center justify-between">
                            <span className="text-[10px] font-medium text-slate-400">
                              {opt.previewBadge}
                            </span>
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                              isSelected ? 'bg-amber-400/20 text-amber-300' : 'text-slate-500'
                            }`}>
                              {opt.id === 'slide' ? 'Smooth Glide' : opt.id === 'fade' ? 'Cross Dissolve' : '0ms Delay'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Fast Mode (Accelerates gameplay across all 26 games) */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.fastAnimations}
                  onClick={() => {
                    const next = !settings.fastAnimations;
                    onUpdateSettings({ fastAnimations: next });
                    if (settings.soundEnabled) sound.playCardFlip();
                  }}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all cursor-pointer text-left ${
                    settings.fastAnimations
                      ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/30'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors shrink-0 ${
                      settings.fastAnimations
                        ? 'bg-amber-400 border-amber-300 text-slate-950 shadow-md shadow-amber-400/30'
                        : 'bg-slate-900 border-slate-700/80 text-slate-400'
                    }`}>
                      <Zap className={`w-4 h-4 ${settings.fastAnimations ? 'fill-slate-950 text-slate-950' : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Fast Mode</span>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          settings.fastAnimations
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {settings.fastAnimations ? '50% Faster' : 'Standard'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 mt-0.5 leading-snug">
                        Accelerates card deals, undo slides, auto-sort sequences, and tap transitions by 50% across all 26 solitaire games
                      </div>
                    </div>
                  </div>

                  {/* Modern tactile switch */}
                  <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                    settings.fastAnimations ? 'bg-amber-400' : 'bg-slate-800'
                  }`}>
                    <div className={`bg-slate-950 w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      settings.fastAnimations ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </div>
                </button>

                {/* Auto Move On Tap */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.autoMoveOnTap}
                  onClick={() => {
                    onUpdateSettings({ autoMoveOnTap: !settings.autoMoveOnTap });
                    if (settings.soundEnabled) sound.playCardFlip();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-white">Single Tap Smart Move</div>
                      <div className="text-xs text-slate-400">Tap card to send to foundation or tableau</div>
                    </div>
                  </div>
                  <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ml-3 ${
                    settings.autoMoveOnTap ? 'bg-amber-400' : 'bg-slate-800'
                  }`}>
                    <div className={`bg-slate-950 w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      settings.autoMoveOnTap ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </div>
                </button>

                {/* Show Hints Highlighting */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.showHintsHighlight}
                  onClick={() => {
                    onUpdateSettings({ showHintsHighlight: !settings.showHintsHighlight });
                    if (settings.soundEnabled) sound.playCardFlip();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs shrink-0">
                      ?
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">Glow Hints Beacon</div>
                      <div className="text-xs text-slate-400">Highlight cards with available moves</div>
                    </div>
                  </div>
                  <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ml-3 ${
                    settings.showHintsHighlight ? 'bg-amber-400' : 'bg-slate-800'
                  }`}>
                    <div className={`bg-slate-950 w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      settings.showHintsHighlight ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </div>
                </button>

                {/* Live Game Info HUD */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.showGameInfoOverlay ?? true}
                  onClick={() => {
                    onUpdateSettings({ showGameInfoOverlay: !(settings.showGameInfoOverlay ?? true) });
                    if (settings.soundEnabled) sound.playCardFlip();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">Live Game Info HUD</div>
                      <div className="text-xs text-slate-400">Floating win probability & move efficiency overlay</div>
                    </div>
                  </div>
                  <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ml-3 ${
                    (settings.showGameInfoOverlay ?? true) ? 'bg-amber-400' : 'bg-slate-800'
                  }`}>
                    <div className={`bg-slate-950 w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      (settings.showGameInfoOverlay ?? true) ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </div>
                </button>
              </div>

              {/* Interactive Tutorial Launcher */}
              {onOpenTutorial && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-500/30 flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 flex items-center justify-center shadow">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Interactive Klondike Tutorial</div>
                      <div className="text-xs text-slate-400">Step-by-step interactive overlay highlighting tableau, stock & foundations</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenTutorial();
                    }}
                    className="py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition-all active:scale-95 shrink-0 ml-2"
                  >
                    Start Guide
                  </button>
                </div>
              )}

              {/* Reset Stats Section */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to reset all game statistics and streaks?')) {
                      onResetStats();
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 hover:bg-rose-900/40 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset All Game Statistics
                </button>
              </div>
            </>
          )}

          {/* TAB 2: CARD STYLES */}
          {activeTab === 'cards' && (
            <>
              {/* Table Felt Theme */}
              <div>
                <label className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">
                  Table Felt Velvet Theme
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {tableThemes.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => onUpdateSettings({ tableTheme: theme.id })}
                      className={`p-3 rounded-xl border-2 flex items-center gap-3 transition-all cursor-pointer ${
                        settings.tableTheme === theme.id
                          ? 'border-amber-400 bg-slate-800/80 shadow-md ring-2 ring-amber-400/20'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${theme.color} border ${theme.border} shadow-inner shrink-0 flex items-center justify-center`}>
                        {settings.tableTheme === theme.id && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <span className="text-xs font-semibold text-white">{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Visual Card Sets & Themes (4 Curated Sets) */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-amber-400" />
                    <span>Curated Visual Card Sets</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Complete Face + Back Themes
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {visualCardSets.map(set => {
                    const isSelected = settings.cardBack === set.cardBack && (settings.cardFace || 'classic') === set.cardFace;

                    return (
                      <div
                        key={set.id}
                        onClick={() => {
                          onUpdateSettings({ cardBack: set.cardBack, cardFace: set.cardFace });
                          if (settings.soundEnabled) sound.playCardFlip();
                        }}
                        className={`p-3 rounded-2xl border-2 transition-all cursor-pointer relative bg-gradient-to-br ${set.themeClass} ${
                          isSelected
                            ? 'ring-2 ring-amber-400/40 border-amber-400 shadow-lg'
                            : 'hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-white">{set.name}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-slate-300 border border-white/10">
                              {set.badge}
                            </span>
                          </div>
                          {isSelected ? (
                            <span className="text-[10px] font-bold text-amber-300 flex items-center gap-0.5 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/40">
                              <Check className="w-3 h-3" />
                              Active
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 hover:text-white">Apply Set</span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Mini Card Face Preview & Back Preview */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Front Face Mini Card */}
                            <div className={`w-8 h-12 rounded-md border flex flex-col justify-between p-1 shadow-sm ${
                              set.cardFace === 'cyber'
                                ? 'bg-slate-950 border-cyan-500/60'
                                : set.cardFace === 'vintage'
                                ? 'bg-[#fcf8ec] border-[#d6c7a6]'
                                : 'bg-white border-slate-300'
                            }`}>
                              <div className={`text-[8px] font-bold leading-none ${
                                set.cardFace === 'cyber'
                                  ? 'text-rose-400 drop-shadow-[0_0_3px_#fb7185] font-mono'
                                  : set.cardFace === 'vintage'
                                  ? 'text-red-900 font-serif'
                                  : 'text-rose-600'
                              }`}>
                                A
                              </div>
                              <div className={`text-[10px] text-center leading-none ${
                                set.cardFace === 'cyber'
                                  ? 'text-rose-400 drop-shadow-[0_0_3px_#fb7185]'
                                  : set.cardFace === 'vintage'
                                  ? 'text-red-900'
                                  : 'text-rose-600'
                              }`}>
                                ♥
                              </div>
                            </div>

                            {/* Back Mini Card */}
                            <div className={`w-8 h-12 rounded-md border flex items-center justify-center shadow-sm ${
                              cardBacks.find(b => b.id === set.cardBack)?.previewClass || 'bg-slate-900'
                            }`}>
                              <span className="text-amber-300 text-[9px] drop-shadow">✦</span>
                            </div>
                          </div>

                          <div className="text-xs text-slate-300 leading-snug">
                            {set.tagline}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Individual Card Face Style Selector */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Card Face Typography & Art</span>
                  </label>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-900 text-amber-300 border border-slate-800">
                    {(settings.cardFace || 'classic').toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {cardFaceOptions.map(face => {
                    const isSelected = (settings.cardFace || 'classic') === face.id;

                    return (
                      <button
                        key={face.id}
                        type="button"
                        onClick={() => {
                          onUpdateSettings({ cardFace: face.id });
                          if (settings.soundEnabled) sound.playCardFlip();
                        }}
                        className={`p-2.5 rounded-xl border-2 flex flex-col items-center gap-2 transition-all cursor-pointer text-left relative ${
                          isSelected
                            ? 'border-amber-400 bg-slate-800/90 ring-2 ring-amber-400/20 shadow-md'
                            : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950/90'
                        }`}
                      >
                        {/* Live Card Face Mini Preview */}
                        <div className={`w-10 h-14 rounded-md border flex flex-col justify-between p-1 shadow-sm relative ${face.sampleBgClass}`}>
                          <div className="flex flex-col items-center leading-none">
                            <span className={`text-[9px] ${face.sampleTextClass}`}>
                              {face.sampleRank}
                            </span>
                            <span className={`text-[7px] ${face.sampleTextClass}`}>
                              {face.sampleSuit}
                            </span>
                          </div>
                          <div className={`text-xs self-center leading-none ${face.sampleTextClass}`}>
                            {face.sampleSuit}
                          </div>
                          <div className="flex flex-col items-center leading-none rotate-180">
                            <span className={`text-[9px] ${face.sampleTextClass}`}>
                              {face.sampleRank}
                            </span>
                          </div>
                        </div>

                        <div className="w-full text-center">
                          <div className="text-xs font-bold text-white flex items-center justify-center gap-1">
                            <span>{face.name}</span>
                            {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                          </div>
                          <span className="text-[9px] text-slate-400 block mt-0.5 font-mono">
                            {face.badge}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Card Back Style */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>Card Back Patterns & Rosettes</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    5 Color Themes
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {cardBacks.map(back => (
                    <button
                      key={back.id}
                      onClick={() => {
                        onUpdateSettings({ cardBack: back.id });
                        if (settings.soundEnabled) sound.playCardFlip();
                      }}
                      className={`p-2 rounded-xl border-2 flex flex-col items-center gap-2 transition-all cursor-pointer ${
                        settings.cardBack === back.id
                          ? 'border-amber-400 bg-slate-800/90 ring-2 ring-amber-400/20'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className={`w-10 h-14 rounded-md ${back.previewClass} border flex items-center justify-center shadow-sm`}>
                        {settings.cardBack === back.id && <Check className="w-4 h-4 text-amber-300 drop-shadow" />}
                      </div>
                      <span className="text-[10px] font-medium text-slate-300 text-center leading-tight">
                        {back.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Movement Animation Style */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Move className="w-3.5 h-3.5 text-amber-400" />
                    <span>Card Movement Animation Style</span>
                  </label>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-900 text-amber-300 border border-slate-800">
                    {(settings.cardAnimation || 'slide').toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {animationOptions.map(opt => {
                    const isSelected = (settings.cardAnimation || 'slide') === opt.id;
                    const IconComponent = opt.icon;

                    return (
                      <div
                        key={opt.id}
                        onClick={() => {
                          onUpdateSettings({ cardAnimation: opt.id });
                          if (settings.soundEnabled) sound.playCardFlip();
                        }}
                        className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between text-left ${
                          isSelected
                            ? opt.borderActive
                            : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950/80'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 shadow-sm ${
                                isSelected ? 'bg-amber-400/20 border-amber-400/40 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                              }`}>
                                <IconComponent className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-sm font-bold text-white">{opt.name}</span>
                            </div>
                            {isSelected ? (
                              <span className="text-[10px] font-bold text-amber-300 flex items-center gap-0.5">
                                <Check className="w-3 h-3" />
                                Active
                              </span>
                            ) : (
                              <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${opt.badgeClass}`}>
                                {opt.badge}
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-300 leading-snug">
                            {opt.description}
                          </p>
                        </div>

                        <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-center justify-between">
                          <span className="text-[10px] font-medium text-slate-400">
                            {opt.previewBadge}
                          </span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                            isSelected ? 'bg-amber-400/20 text-amber-300' : 'text-slate-500'
                          }`}>
                            {opt.id === 'slide' ? 'Smooth Glide' : opt.id === 'fade' ? 'Cross Dissolve' : '0ms Delay'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* TAB 3: AUDIO & HAPTICS */}
          {activeTab === 'audio' && (
            <>
              {/* Master Sound FX Volume Slider */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      {!settings.soundEnabled || (settings.soundVolume ?? 0.8) === 0 ? (
                        <VolumeX className="w-4 h-4 text-rose-400" />
                      ) : (settings.soundVolume ?? 0.8) < 0.5 ? (
                        <Volume1 className="w-4 h-4 text-amber-300" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Sound Effect Volume</span>
                        <span className="text-xs font-mono font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 rounded-full">
                          {Math.round((settings.soundVolume ?? 0.8) * 100)}%
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">Controls audio levels independently of mute</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!settings.soundEnabled) {
                          onUpdateSettings({ soundEnabled: true });
                          sound.setEnabled(true);
                        }
                        sound.playCardFlip();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-medium flex items-center gap-1 transition-all shadow-sm active:scale-95 cursor-pointer"
                      title="Audition current volume"
                    >
                      <Play className="w-3 h-3 fill-amber-300" />
                      <span>Audition</span>
                    </button>
                  </div>
                </div>

                {/* Range Slider */}
                <div className="space-y-1.5 pt-1">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.soundVolume ?? 0.8}
                    onChange={(e) => {
                      const newVol = parseFloat(e.target.value);
                      onUpdateSettings({ soundVolume: newVol });
                      sound.setVolume(newVol);
                    }}
                    className="w-full accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                    aria-label="Sound effect volume slider"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0% (Silent)</span>
                    <span>50%</span>
                    <span>100% (Full)</span>
                  </div>
                </div>
              </div>

              {/* Audio Packs & Sound FX Section */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-amber-400" />
                    <span>Audio Sound Packs & FX</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">
                      {settings.soundEnabled ? 'Enabled' : 'Muted'}
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.soundEnabled}
                      onChange={e => {
                        const enabled = e.target.checked;
                        onUpdateSettings({ soundEnabled: enabled });
                        sound.setEnabled(enabled);
                        if (enabled) {
                          sound.playCardFlip();
                        }
                      }}
                      className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                    />
                  </div>
                </div>

                {/* Audio Pack Selection Cards */}
                <div className="space-y-2.5">
                  {AUDIO_PACKS.map(pack => {
                    const isSelected = (settings.audioPack || 'modern') === pack.id;
                    
                    const packMeta = {
                      modern: {
                        icon: Sparkles,
                        iconColor: 'text-cyan-400 bg-cyan-950/80 border-cyan-700/50',
                        borderActive: 'border-cyan-400 ring-2 ring-cyan-400/20 bg-slate-800/90',
                      },
                      vintage: {
                        icon: Clock,
                        iconColor: 'text-amber-400 bg-amber-950/80 border-amber-700/50',
                        borderActive: 'border-amber-400 ring-2 ring-amber-400/20 bg-slate-800/90',
                      },
                      minimalist: {
                        icon: Feather,
                        iconColor: 'text-emerald-400 bg-emerald-950/80 border-emerald-700/50',
                        borderActive: 'border-emerald-400 ring-2 ring-emerald-400/20 bg-slate-800/90',
                      },
                    }[pack.id];

                    const IconComponent = packMeta?.icon || Volume2;

                    return (
                      <div
                        key={pack.id}
                        onClick={() => {
                          onUpdateSettings({ audioPack: pack.id });
                          sound.setAudioPack(pack.id);
                          if (settings.soundEnabled) {
                            sound.playCardPlace();
                          }
                        }}
                        className={`p-3 rounded-xl border-2 transition-all cursor-pointer relative ${
                          isSelected
                            ? packMeta.borderActive
                            : 'border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-950/80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-sm ${packMeta.iconColor}`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white">{pack.name}</span>
                                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                  {pack.badge}
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 leading-snug">{pack.description}</p>
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {pack.keyCharacteristics.map(tag => (
                                  <span
                                    key={tag}
                                    className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Right controls: Active Indicator & Preview Button */}
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <div className="flex items-center gap-1.5">
                              {isSelected && (
                                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" />
                                  Active
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!settings.soundEnabled) {
                                  onUpdateSettings({ soundEnabled: true });
                                  sound.setEnabled(true);
                                }
                                sound.playPreview(pack.id);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-medium flex items-center gap-1 transition-all shadow-sm active:scale-95 cursor-pointer"
                              title={`Audition ${pack.name} sound effects`}
                            >
                              <Play className="w-3 h-3 fill-amber-300" />
                              <span>Audition</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Haptic Vibration Feedback & Intensity Section */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Vibrate className="w-3.5 h-3.5 text-amber-400" />
                    <span>Haptic Feedback & Vibrations</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">
                      {settings.hapticsEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.hapticsEnabled}
                      onChange={e => {
                        const enabled = e.target.checked;
                        onUpdateSettings({ hapticsEnabled: enabled });
                        haptics.setEnabled(enabled);
                        if (enabled) {
                          haptics.preview(settings.hapticIntensity || 'medium');
                        }
                      }}
                      className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                    />
                  </div>
                </div>

                <p className="text-xs text-slate-300">
                  Customize tactile vibration strength for card snaps, deals, drops, and celebrations on vibration-capable devices.
                </p>

                {/* Intensity Level Options (Low, Medium, High) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {hapticOptions.map(option => {
                    const currentIntensity = settings.hapticIntensity || 'medium';
                    const isSelected = settings.hapticsEnabled && currentIntensity === option.id;

                    return (
                      <div
                        key={option.id}
                        onClick={() => {
                          onUpdateSettings({ hapticIntensity: option.id, hapticsEnabled: true });
                          haptics.configure(true, option.id);
                          haptics.preview(option.id);
                        }}
                        className={`p-3 rounded-xl border-2 transition-all flex flex-col justify-between text-left relative cursor-pointer ${
                          isSelected
                            ? option.borderActive
                            : 'border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-950/80'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <div className="flex items-center gap-1.5">
                              {/* Tactile intensity bars indicator */}
                              <div className="flex items-end gap-0.5 h-3.5 w-4" aria-hidden="true">
                                <span
                                  className={`w-1 rounded-sm transition-colors ${
                                    option.bars >= 1
                                      ? isSelected
                                        ? 'bg-amber-400'
                                        : 'bg-slate-300'
                                      : 'bg-slate-700'
                                  } h-1.5`}
                                />
                                <span
                                  className={`w-1 rounded-sm transition-colors ${
                                    option.bars >= 2
                                      ? isSelected
                                        ? 'bg-amber-400'
                                        : 'bg-slate-300'
                                      : 'bg-slate-700'
                                  } h-2.5`}
                                />
                                <span
                                  className={`w-1 rounded-sm transition-colors ${
                                    option.bars >= 3
                                      ? isSelected
                                        ? 'bg-amber-400'
                                        : 'bg-slate-300'
                                      : 'bg-slate-700'
                                  } h-3.5`}
                                />
                              </div>
                              <span className="text-sm font-bold text-white">{option.name}</span>
                            </div>
                            {isSelected ? (
                              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                                <Check className="w-3 h-3" />
                                Active
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-mono">
                                {option.strengthTag}
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-300 leading-snug mb-2">
                            {option.description}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                          <span className="text-[10px] font-medium text-slate-400">
                            {option.previewLabel}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!settings.hapticsEnabled) {
                                onUpdateSettings({ hapticsEnabled: true, hapticIntensity: option.id });
                                haptics.configure(true, option.id);
                              }
                              haptics.preview(option.id);
                            }}
                            className="text-[10px] font-bold text-amber-300 hover:text-amber-200 bg-slate-800/90 hover:bg-slate-700/90 border border-amber-500/30 px-2 py-0.5 rounded transition-all active:scale-90 flex items-center gap-1 shadow-sm cursor-pointer"
                            title={`Feel ${option.name} vibration test`}
                          >
                            <Vibrate className="w-2.5 h-2.5" />
                            <span>Test</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm shadow transition-colors"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
