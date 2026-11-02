import React, { useState } from 'react';
import { X, Search, Play, Trophy, Sparkles } from 'lucide-react';
import { GameCategory, GameId } from '../types/solitaire';
import { SOLITAIRE_GAMES } from '../utils/cardUtils';

interface GameSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGameId: GameId;
  onSelectGame: (id: GameId) => void;
  onOpenDailyChallenge?: () => void;
}

export const GameSelectorModal: React.FC<GameSelectorModalProps> = ({
  isOpen,
  onClose,
  currentGameId,
  onSelectGame,
  onOpenDailyChallenge,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<GameCategory | 'all'>('all');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const games = Object.values(SOLITAIRE_GAMES);

  const categories: { id: GameCategory | 'all'; label: string; count: number }[] = [
    { id: 'all', label: 'All Games', count: games.length },
    { id: 'classic', label: 'Classic', count: games.filter(g => g.category === 'classic').length },
    { id: 'builders', label: 'Builders', count: games.filter(g => g.category === 'builders').length },
    { id: 'spider', label: 'Spider', count: games.filter(g => g.category === 'spider').length },
    { id: 'pairing', label: 'Pairing', count: games.filter(g => g.category === 'pairing').length },
    { id: 'puzzles', label: 'Puzzles', count: games.filter(g => g.category === 'puzzles').length },
    { id: 'specialty', label: 'Specialty', count: games.filter(g => g.category === 'specialty').length },
  ];

  const filteredGames = games.filter(g => {
    const matchesCategory = selectedCategory === 'all' || g.category === selectedCategory;
    const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase()) ||
                          g.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl h-[88vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-xl font-bold font-serif text-white tracking-wide">
                Select from 26 Solitaire Games
              </h2>
              <p className="text-xs text-slate-400">
                Play any classic, builder, spider, or specialty variant
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

        {/* Filters and Search Bar */}
        <div className="p-4 sm:px-6 bg-slate-950/40 border-b border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`py-1.5 px-3 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedCategory === c.id
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>{c.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedCategory === c.id ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-900 text-slate-400'
                }`}>
                  {c.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Field */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by game name..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>
        </div>

        {/* Games Grid List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {onOpenDailyChallenge && (
            <div
              onClick={() => {
                onClose();
                onOpenDailyChallenge();
              }}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/20 border-2 border-amber-400/70 hover:border-amber-400 flex items-center justify-between cursor-pointer transition-all shadow-md group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 flex items-center justify-center shadow">
                  <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-amber-300">
                    <Trophy className="w-5 h-5 fill-current" />
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5 font-mono">
                    <span>👑 TODAY'S SEEDED DAILY CHALLENGE</span>
                  </div>
                  <div className="text-sm font-bold text-white font-serif">
                    Compete for Global Leaderboard Rank
                  </div>
                </div>
              </div>

              <span className="py-1.5 px-3 rounded-lg bg-amber-400 group-hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1 shadow transition-colors">
                Play Challenge →
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredGames.map(game => {
            const isCurrent = game.id === currentGameId;

            return (
              <div
                key={game.id}
                onClick={() => {
                  onSelectGame(game.id);
                  onClose();
                }}
                className={`p-4 rounded-2xl border flex flex-col justify-between transition-all cursor-pointer hover:scale-[1.02] shadow-sm ${
                  isCurrent
                    ? 'border-amber-400 bg-gradient-to-b from-slate-900 to-amber-950/30 ring-2 ring-amber-400/30 shadow-amber-500/10'
                    : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-900/90'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl drop-shadow">{game.icon}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        game.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-300' :
                        game.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-300' :
                        game.difficulty === 'Hard' ? 'bg-orange-500/20 text-orange-300' :
                        'bg-rose-500/20 text-rose-300'
                      }`}>
                        {game.difficulty}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-white font-serif mb-1 group-hover:text-amber-300">
                    {game.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                    {game.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-[11px] text-slate-500">
                  <span className="capitalize">{game.category} • {game.decks} Deck{game.decks > 1 ? 's' : ''}</span>
                  <div className="flex items-center gap-1 font-bold text-amber-400">
                    {isCurrent ? (
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        Current
                      </span>
                    ) : (
                      <span className="text-xs flex items-center gap-1 hover:underline">
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Play
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </div>
    </div>
  );
};
