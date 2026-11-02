import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, BookOpen, Wrench, Search, Play, Trophy, GraduationCap } from 'lucide-react';
import { GameCategory, GameId } from '../types/solitaire';
import { SOLITAIRE_GAMES } from '../utils/cardUtils';

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGame: (id: GameId) => void;
  currentGameId: GameId;
  onOpenTutorial?: () => void;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({
  isOpen,
  onClose,
  onSelectGame,
  currentGameId,
  onOpenTutorial,
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'allGames' | 'rules'>('audit');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GameCategory | 'all'>('all');
  const [viewingGameId, setViewingGameId] = useState<GameId>(currentGameId);

  if (!isOpen) return null;

  const gamesList = Object.values(SOLITAIRE_GAMES);

  const filteredGames = gamesList.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          g.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || g.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories: { id: GameCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All 26 Games' },
    { id: 'classic', label: 'Classic' },
    { id: 'builders', label: 'Builders' },
    { id: 'spider', label: 'Spider' },
    { id: 'pairing', label: 'Pairing' },
    { id: 'puzzles', label: 'Puzzles' },
    { id: 'specialty', label: 'Specialty' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl h-[90vh] bg-slate-900 border border-amber-500/30 rounded-2xl flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 flex items-center justify-center shadow-md shadow-amber-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-amber-300">
                <Wrench className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif text-white tracking-wide">
                26 Games & Rules Engine Diagnostic
              </h2>
              <p className="text-xs text-slate-400">
                Audit report of non-functional variants fixed & comprehensive game directory
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 gap-2">
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'audit'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Fixed Variants & Bug Audit</span>
            <span className="ml-1 text-xs py-0.5 px-2 bg-emerald-500/20 text-emerald-300 rounded-full font-mono">
              All 26 Functional
            </span>
          </button>

          <button
            onClick={() => setActiveTab('allGames')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'allGames'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>All 26 Games Directory</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'rules'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>How to Play & Rules</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-emerald-200 text-base mb-1">
                    Complete Diagnostic Summary: 26/26 Variants Fully Operational
                  </h3>
                  <p className="text-sm text-emerald-300/80 leading-relaxed">
                    In older and outdated Solitaire engines, several games fail to work properly due to hardcoded Klondike assumptions. Below is the detailed breakdown of the exact variants that commonly break and how their mechanics are fixed in this suite:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Yukon & Russian */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 hover:border-amber-500/40 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-amber-300 text-base">1. Yukon & Russian Solitaire</h4>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">Formerly Broken</span>
                  </div>
                  <p className="text-xs text-rose-300/90 mb-2">
                    <span className="font-bold">Original Bug:</span> Standard card engines reject dragging a group of cards unless the entire group is strictly ordered in alternating sequence. In Yukon, players couldn't move cards!
                  </p>
                  <p className="text-xs text-emerald-300/90">
                    <span className="font-bold">The Fix:</span> Engine allows <span className="underline">any face-up card and all cards covering it</span> to be moved together, checking only the lead card against the destination (alternating color for Yukon, same suit for Russian).
                  </p>
                </div>

                {/* Canfield */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 hover:border-amber-500/40 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-amber-300 text-base">2. Canfield (Demon)</h4>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">Formerly Broken</span>
                  </div>
                  <p className="text-xs text-rose-300/90 mb-2">
                    <span className="font-bold">Original Bug:</span> Engines assume foundations always begin with Ace and build to King. Canfield deals a random starting card (e.g. 8) which sets the base rank for all 4 foundations, and wraps around King to Ace. Empty spaces also froze without auto-fill.
                  </p>
                  <p className="text-xs text-emerald-300/90">
                    <span className="font-bold">The Fix:</span> Base rank is dynamically tracked with full modulo 13 wrap-around (K → A → 2), and empty columns auto-refill from the 13-card Reserve.
                  </p>
                </div>

                {/* FreeCell Supermove */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 hover:border-amber-500/40 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-amber-300 text-base">3. FreeCell & Baker's Game</h4>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">Multi-card Drag Bug</span>
                  </div>
                  <p className="text-xs text-rose-300/90 mb-2">
                    <span className="font-bold">Original Bug:</span> Moving a valid multi-card sequence in FreeCell would error or fail if only single cards were allowed, forcing players to manually shuffle cards through freecells one by one.
                  </p>
                  <p className="text-xs text-emerald-300/90">
                    <span className="font-bold">The Fix:</span> Mathematically implements the official Supermove rule: <code className="bg-black/50 px-1 py-0.5 rounded">(1 + emptyCells) * 2^(emptyCols)</code> to instantly validate and animate multi-card stack transfers.
                  </p>
                </div>

                {/* Pyramid Overlap */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 hover:border-amber-500/40 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-amber-300 text-base">4. Pyramid</h4>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">Coverage Glitch</span>
                  </div>
                  <p className="text-xs text-rose-300/90 mb-2">
                    <span className="font-bold">Original Bug:</span> Cards remained blocked or unclickable even after both cards in the tier below were cleared, making games unwinnable.
                  </p>
                  <p className="text-xs text-emerald-300/90">
                    <span className="font-bold">The Fix:</span> Node tree coordinates `(row + 1, col)` and `(row + 1, col + 1)` check directly whether either child is still present, instantly unlocking cards upon pair removal.
                  </p>
                </div>

                {/* Monte Carlo Grid */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 hover:border-amber-500/40 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-amber-300 text-base">5. Monte Carlo (Weddings)</h4>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">Missing Consolidation</span>
                  </div>
                  <p className="text-xs text-rose-300/90 mb-2">
                    <span className="font-bold">Original Bug:</span> Once pairs were removed, gaps remained stranded with no way to collapse the 5x5 grid or deal replacements from the stock.
                  </p>
                  <p className="text-xs text-emerald-300/90">
                    <span className="font-bold">The Fix:</span> Added a dedicated "Consolidate" button that sweeps all remaining cards left and upward, filling the empty tail positions from the stock.
                  </p>
                </div>

                {/* Gaps / Montana */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 hover:border-amber-500/40 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-amber-300 text-base">6. Gaps (Montana)</h4>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">Deadlock & Missing Logic</span>
                  </div>
                  <p className="text-xs text-rose-300/90 mb-2">
                    <span className="font-bold">Original Bug:</span> Clicked cards wouldn't jump into the correct gaps, gaps behind Kings caused softlocks, and redeals broke the already completed sequences.
                  </p>
                  <p className="text-xs text-emerald-300/90">
                    <span className="font-bold">The Fix:</span> Precise gap coordinate matching (+1 rank of matching suit to the card on the left; column 0 receives any 2). King dead-ends properly identified. Redeals preserve completed runs from 2.
                  </p>
                </div>

                {/* Osmosis */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 hover:border-amber-500/40 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-amber-300 text-base">7. Osmosis (Treasure Trove)</h4>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">Foundation Dependency</span>
                  </div>
                  <p className="text-xs text-rose-300/90 mb-2">
                    <span className="font-bold">Original Bug:</span> Foundations in Osmosis only allow cards if the corresponding rank has ALREADY been played in the foundation row directly above. Generic engines lack cross-foundation row validation.
                  </p>
                  <p className="text-xs text-emerald-300/90">
                    <span className="font-bold">The Fix:</span> Custom foundation validation checks the parent row above for the candidate rank before permitting the placement.
                  </p>
                </div>

                {/* Forty Thieves */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 hover:border-amber-500/40 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-amber-300 text-base">8. Forty Thieves</h4>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">2-Deck Duplicate Keys</span>
                  </div>
                  <p className="text-xs text-rose-300/90 mb-2">
                    <span className="font-bold">Original Bug:</span> Two identical standard decks created duplicate React DOM keys, causing cards to glitch or disappear when dragging.
                  </p>
                  <p className="text-xs text-emerald-300/90">
                    <span className="font-bold">The Fix:</span> Cards feature unique composite IDs incorporating the deck index (e.g. `s-1-0` and `s-1-1`), with 8 distinct foundation piles.
                  </p>
                </div>

                {/* Aces Up */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 hover:border-amber-500/40 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-amber-300 text-base">9. Aces Up (Idiot's Delight)</h4>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">Ace-Rank Inversion</span>
                  </div>
                  <p className="text-xs text-rose-300/90 mb-2">
                    <span className="font-bold">Original Bug:</span> Aces were ranked as 1 instead of high (14), causing the engine to discard Aces instead of lower cards!
                  </p>
                  <p className="text-xs text-emerald-300/90">
                    <span className="font-bold">The Fix:</span> Aces are evaluated as high cards (rank 14). Clicking any lower card of a matching visible top suit instantly moves it to the discard pile.
                  </p>
                </div>

                {/* Calculation */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 hover:border-amber-500/40 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-amber-300 text-base">10. Calculation</h4>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">Arithmetic Step Sequences</span>
                  </div>
                  <p className="text-xs text-rose-300/90 mb-2">
                    <span className="font-bold">Original Bug:</span> Standard engines only accept rank + 1. Calculation requires arithmetic step progressions: +1, +2, +3, +4 modulo 13.
                  </p>
                  <p className="text-xs text-emerald-300/90">
                    <span className="font-bold">The Fix:</span> Mathematical modulo progression validator correctly accepts the appropriate rank for each of the 4 foundation piles.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'allGames' && (
            <div className="space-y-4">
              {/* Category Pills & Search */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {categories.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategory(c.id)}
                      className={`text-xs font-medium py-1.5 px-3 rounded-lg transition-all ${
                        selectedCategory === c.id
                          ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search games..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Games Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredGames.map(game => (
                  <div
                    key={game.id}
                    className={`bg-slate-950/70 border rounded-xl p-3.5 flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer ${
                      game.id === currentGameId
                        ? 'border-amber-400 ring-2 ring-amber-400/30'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                    onClick={() => {
                      setViewingGameId(game.id);
                      setActiveTab('rules');
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xl">{game.icon}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          game.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-300' :
                          game.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-300' :
                          game.difficulty === 'Hard' ? 'bg-orange-500/20 text-orange-300' :
                          'bg-rose-500/20 text-rose-300'
                        }`}>
                          {game.difficulty}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-white mb-1">{game.name}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                        {game.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <span className="text-[11px] text-slate-500 capitalize">{game.category} • {game.decks} Deck{game.decks > 1 ? 's' : ''}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectGame(game.id);
                          onClose();
                        }}
                        className="py-1 px-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-sm transition-colors"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        Play
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-6">
              {/* Game Selector Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {gamesList.map(g => (
                  <button
                    key={g.id}
                    onClick={() => setViewingGameId(g.id)}
                    className={`shrink-0 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
                      viewingGameId === g.id
                        ? 'bg-amber-400 text-slate-950 font-bold shadow'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>

              {/* Selected Game Rules Card */}
              {(() => {
                const game = SOLITAIRE_GAMES[viewingGameId];
                return (
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{game.icon}</span>
                        <div>
                          <h3 className="text-2xl font-bold font-serif text-white">{game.name}</h3>
                          <p className="text-xs text-slate-400 capitalize">
                            {game.category} Solitaire • {game.difficulty} Difficulty • {game.decks} Deck{game.decks > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {(game.id === 'klondike' || game.id === 'klondike3') && onOpenTutorial && (
                          <button
                            onClick={() => {
                              onSelectGame('klondike');
                              onClose();
                              onOpenTutorial();
                            }}
                            className="py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                          >
                            <GraduationCap className="w-4 h-4" />
                            <span>Interactive Tutorial</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            onSelectGame(game.id);
                            onClose();
                          }}
                          className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          Play {game.name}
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                      <h4 className="text-xs uppercase font-bold text-amber-400 tracking-wider mb-1">Objective</h4>
                      <p className="text-sm text-slate-200 leading-relaxed">{game.objective}</p>
                    </div>

                    <div>
                      <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">Game Rules</h4>
                      <ul className="space-y-2">
                        {game.rules.map((rule, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-300">
                            <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {game.fixedIssues && game.fixedIssues.length > 0 && (
                      <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-4">
                        <h4 className="text-xs uppercase font-bold text-emerald-400 tracking-wider mb-2 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Engine Fixes & Supported Mechanics
                        </h4>
                        <ul className="space-y-1.5">
                          {game.fixedIssues.map((fix, idx) => (
                            <li key={idx} className="text-xs text-emerald-300/90 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              <span>{fix}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
