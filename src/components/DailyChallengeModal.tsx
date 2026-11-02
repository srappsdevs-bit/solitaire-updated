import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Trophy, Flame, Play, Crown, Globe, User, ChevronLeft, ChevronRight, CheckCircle2, Clock, Move } from 'lucide-react';
import { DailyChallengeConfig, GameId, LeaderboardEntry, PlayerProfile } from '../types/solitaire';
import {
  getDailyChallengeConfig,
  getGlobalLeaderboard,
  getPlayerProfile,
  getTodayDateString,
  savePlayerProfile,
} from '../utils/dailyChallenge';
import { SOLITAIRE_GAMES } from '../utils/cardUtils';

interface DailyChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartDailyChallenge: (dateStr: string) => void;
  currentDailyDate?: string;
}

export const DailyChallengeModal: React.FC<DailyChallengeModalProps> = ({
  isOpen,
  onClose,
  onStartDailyChallenge,
  currentDailyDate,
}) => {
  const [activeTab, setActiveTab] = useState<'challenge' | 'leaderboard' | 'profile'>('challenge');
  const todayStr = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState<string>(currentDailyDate || todayStr);
  const [profile, setProfile] = useState<PlayerProfile>(() => getPlayerProfile());
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);

  // Month navigation for calendar view
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date(selectedDate + 'T00:00:00');
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  // Keep profile and streak freshly synced when opening
  React.useEffect(() => {
    if (isOpen) {
      const fresh = getPlayerProfile();
      setProfile(fresh);
      setNameInput(fresh.name);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const challengeConfig = getDailyChallengeConfig(selectedDate);
  const gameDef = SOLITAIRE_GAMES[challengeConfig.gameId];
  const isCompleted = !!profile.completedDates[selectedDate]?.won;
  const completedStats = profile.completedDates[selectedDate];

  // Leaderboard data for selected date
  const leaderboardData = getGlobalLeaderboard(selectedDate);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  // Calendar calculations
  const daysInMonth = new Date(calendarMonth.year, calendarMonth.month + 1, 0).getDate();
  const firstDayOfWeek = new Date(calendarMonth.year, calendarMonth.month, 1).getDay(); // 0 is Sunday
  const monthName = new Date(calendarMonth.year, calendarMonth.month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const handlePrevMonth = () => {
    setCalendarMonth(prev => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setCalendarMonth(prev => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const handleSaveProfile = () => {
    if (nameInput.trim()) {
      const updated = { ...profile, name: nameInput.trim() };
      setProfile(updated);
      savePlayerProfile(updated);
      setIsEditingName(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-amber-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950/90 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 flex items-center justify-center shadow-md shadow-amber-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-amber-300">
                <Crown className="w-5 h-5 fill-current" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif text-white tracking-wide flex items-center gap-2">
                <span>Daily Challenge</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  Global Rank
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Every player receives the exact same seeded deal daily
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-5 gap-2">
          <button
            onClick={() => setActiveTab('challenge')}
            className={`py-2.5 px-3 font-semibold text-xs border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'challenge'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>Today's Challenge</span>
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`py-2.5 px-3 font-semibold text-xs border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'leaderboard'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Global Leaderboard</span>
            {leaderboardData.playerRank && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px]">
                #{leaderboardData.playerRank}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2.5 px-3 font-semibold text-xs border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'profile'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5 text-emerald-400" />
            <span>Player Badge & Stats</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* TAB 1: CHALLENGE & CALENDAR */}
          {activeTab === 'challenge' && (
            <div className="space-y-4">
              {/* Daily Banner Card */}
              <div className="relative rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border border-amber-500/40 p-4 shadow-xl overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl drop-shadow">{gameDef.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-400">
                          {selectedDate === todayStr ? "TODAY'S SEEDED DEAL" : selectedDate}
                        </span>
                        {isCompleted && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold font-serif text-white">{gameDef.name}</h3>
                      <p className="text-xs text-slate-400">
                        {gameDef.difficulty} • Seed #{challengeConfig.seed.toString().slice(-4)} • Universal Leaderboard
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onStartDailyChallenge(selectedDate);
                      onClose();
                    }}
                    className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all hover:brightness-105"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{isCompleted ? 'Replay Challenge' : 'Play Today’s Challenge'}</span>
                  </button>
                </div>

                {isCompleted && completedStats && (
                  <div className="mt-3 pt-3 border-t border-amber-500/20 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-950/60 p-2 rounded-lg">
                      <div className="text-[10px] text-slate-400">Your Score</div>
                      <div className="font-bold text-amber-300 font-mono">{completedStats.score}</div>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-lg">
                      <div className="text-[10px] text-slate-400">Your Time</div>
                      <div className="font-bold text-white font-mono">{formatTime(completedStats.time)}</div>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-lg">
                      <div className="text-[10px] text-slate-400">Global Rank</div>
                      <div className="font-bold text-emerald-300 font-mono">#{completedStats.rank || 1}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Monthly Crown Calendar */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-amber-400" />
                    <h4 className="text-sm font-bold text-white font-serif">{monthName} Calendar</h4>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handlePrevMonth}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNextMonth}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Day of Week headers */}
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500 uppercase mb-1">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty offsets */}
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-10 rounded-lg opacity-10"></div>
                  ))}

                  {/* Month days */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const dayStr = `${calendarMonth.year}-${String(calendarMonth.month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const isToday = dayStr === todayStr;
                    const isSelected = dayStr === selectedDate;
                    const hasCrown = !!profile.completedDates[dayStr]?.won;
                    const isFuture = new Date(dayStr + 'T00:00:00') > new Date(todayStr + 'T00:00:00');

                    return (
                      <button
                        key={dayNum}
                        disabled={isFuture}
                        onClick={() => setSelectedDate(dayStr)}
                        className={`h-11 sm:h-12 rounded-xl flex flex-col items-center justify-center p-1 relative transition-all border ${
                          isSelected
                            ? 'border-amber-400 bg-amber-950/40 ring-2 ring-amber-400/40 text-amber-200'
                            : isToday
                            ? 'border-cyan-400 bg-cyan-950/20 text-white'
                            : hasCrown
                            ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                            : isFuture
                            ? 'border-transparent opacity-30 cursor-not-allowed text-slate-600'
                            : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <span className="text-xs font-bold leading-none">{dayNum}</span>
                        {hasCrown ? (
                          <Crown className="w-3.5 h-3.5 text-amber-400 fill-current mt-0.5" />
                        ) : isToday ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1"></span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Trophies & Streak summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                    <Crown className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-white font-mono">{profile.totalCrowns}</div>
                    <div className="text-[10px] text-slate-400">Total Crowns</div>
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400">
                    <Flame className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-white font-mono">{profile.currentStreak} Days</div>
                    <div className="text-[10px] text-slate-400">Current Streak</div>
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-400">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-white font-mono">{profile.highestStreak} Days</div>
                    <div className="text-[10px] text-slate-400">Best Streak</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GLOBAL LEADERBOARD */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-4">
              {/* Leaderboard Header with Date */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div>
                  <div className="text-xs text-amber-400 font-bold font-mono">GLOBAL STANDINGS</div>
                  <div className="text-sm font-bold text-white font-serif">
                    {gameDef.name} ({selectedDate})
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">Total Competitors</div>
                  <div className="text-xs font-bold text-slate-200 font-mono">
                    {leaderboardData.totalParticipants.toLocaleString()} Players
                  </div>
                </div>
              </div>

              {/* Player Current Standings Banner */}
              {leaderboardData.playerRank ? (
                <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border-2 border-amber-400/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center font-mono text-xs">
                      #{leaderboardData.playerRank}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{profile.name} (You)</span>
                        <span>{profile.countryFlag}</span>
                      </div>
                      <div className="text-[10px] text-amber-300">
                        Top {((leaderboardData.playerRank / leaderboardData.totalParticipants) * 100).toFixed(1)}% Worldwide!
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono text-xs text-slate-200">
                    <span className="font-bold text-amber-300">{completedStats?.score} pts</span> •{' '}
                    <span>{formatTime(completedStats?.time || 0)}</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-400">
                  Complete this Daily Challenge to record your score on the Global Leaderboard!
                </div>
              )}

              {/* Top 3 Podium */}
              <div className="grid grid-cols-3 gap-2 py-2">
                {leaderboardData.entries.slice(0, 3).map((entry, idx) => (
                  <div
                    key={entry.id}
                    className={`rounded-xl p-3 border flex flex-col items-center text-center relative ${
                      idx === 0
                        ? 'bg-gradient-to-b from-amber-500/20 to-slate-950 border-amber-400 ring-2 ring-amber-400/30'
                        : idx === 1
                        ? 'bg-gradient-to-b from-slate-400/20 to-slate-950 border-slate-400'
                        : 'bg-gradient-to-b from-amber-700/20 to-slate-950 border-amber-700'
                    }`}
                  >
                    <div className="text-xl mb-1">{entry.avatar}</div>
                    <div className="text-xs font-bold text-white truncate max-w-[90px]">{entry.playerName}</div>
                    <div className="text-[10px] text-slate-400">{entry.countryFlag} {entry.country}</div>
                    <div className="mt-2 text-xs font-mono font-bold text-amber-300">{entry.score} pts</div>
                    <div className="text-[10px] font-mono text-slate-400">{formatTime(entry.timeSeconds)}</div>
                    <span className={`absolute -top-2 px-2 py-0.2 rounded-full font-bold text-[9px] ${
                      idx === 0 ? 'bg-amber-400 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-950' : 'bg-amber-700 text-white'
                    }`}>
                      #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>

              {/* Leaderboard Table List */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 divide-y divide-slate-800/80 overflow-hidden text-xs">
                {leaderboardData.entries.slice(3, 25).map(entry => (
                  <div
                    key={entry.id}
                    className={`px-3 py-2 flex items-center justify-between ${
                      entry.isPlayer ? 'bg-amber-400/15 font-bold border-l-4 border-amber-400' : 'hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 font-mono font-bold text-slate-400">#{entry.rank}</span>
                      <span className="text-base">{entry.avatar}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-white font-medium">{entry.playerName}</span>
                        {entry.isPlayer && (
                          <span className="px-1.5 py-0.2 text-[9px] bg-amber-400 text-slate-950 font-bold rounded">YOU</span>
                        )}
                        <span className="text-slate-500">{entry.countryFlag}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 font-mono text-slate-300">
                      <span className="font-bold text-amber-300">{entry.score}</span>
                      <span className="text-slate-400">{formatTime(entry.timeSeconds)}</span>
                      <span className="text-slate-500 hidden sm:inline">{entry.moves}m</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PLAYER BADGE & PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-md flex items-center justify-center text-3xl">
                      <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                        {profile.avatar}
                      </div>
                    </div>
                    <div>
                      {isEditingName ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={nameInput}
                            onChange={e => setNameInput(e.target.value)}
                            maxLength={18}
                            className="bg-slate-900 border border-amber-400 rounded-lg px-2.5 py-1 text-sm text-white focus:outline-none font-bold"
                          />
                          <button
                            onClick={handleSaveProfile}
                            className="py-1 px-3 bg-amber-400 text-slate-950 rounded-lg text-xs font-bold"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-white">{profile.name}</h3>
                          <button
                            onClick={() => setIsEditingName(true)}
                            className="text-xs text-amber-400 hover:underline"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <span>Global Competitor</span>
                        <span>{profile.countryFlag}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-400">Total Crowns</div>
                    <div className="text-2xl font-bold font-mono text-amber-400 flex items-center justify-end gap-1">
                      <Crown className="w-5 h-5 fill-current" />
                      <span>{profile.totalCrowns}</span>
                    </div>
                  </div>
                </div>

                {/* Avatar Selection */}
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">
                    Choose Your Avatar Icon
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['🃏', '👑', '🦁', '🦅', '🐺', '🐉', '⚡', '💎', '🎯', '🔥', '⚔️', '🍀'].map(av => (
                      <button
                        key={av}
                        onClick={() => {
                          const updated = { ...profile, avatar: av };
                          setProfile(updated);
                          savePlayerProfile(updated);
                        }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all border ${
                          profile.avatar === av
                            ? 'border-amber-400 bg-amber-500/20 scale-105'
                            : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
