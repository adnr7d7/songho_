import React from 'react';
import { Trophy, Medal, Award, Flame, Star } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  name: string;
  clan: string;
  rating: number;
  winRate: string;
  streak: number;
  avatar: string;
}

export default function LeaderboardScreen() {
  const leaders: LeaderboardEntry[] = [
    { rank: 1, name: 'Anicet Nnanga', clan: 'Ewondo de Mvolyé', rating: 2450, winRate: '78%', streak: 12, avatar: '🦁' },
    { rank: 2, name: 'Beti Warrior', clan: 'Bulu de Kribi', rating: 2320, winRate: '72%', streak: 8, avatar: '🐆' },
    { rank: 3, name: 'Amina Yaoundé', clan: 'Ekang de Mbalmayo', rating: 2280, winRate: '68%', streak: 0, avatar: '🦅' },
    { rank: 4, name: 'Gaston Obama', clan: 'Beti de Tsinga', rating: 2150, winRate: '64%', streak: 4, avatar: '🐘' },
    { rank: 5, name: 'Chantal Ngo', clan: 'Ewondo des collines', rating: 2040, winRate: '60%', streak: 2, avatar: '🦊' },
    { rank: 6, name: 'Mekongo Pro', clan: 'Fang du Ntem', rating: 1980, winRate: '58%', streak: 1, avatar: '🐗' },
    { rank: 7, name: 'Songo Master', clan: 'Cameroun Elite', rating: 1950, winRate: '55%', streak: 0, avatar: '🦉' },
  ];

  return (
    <div className="flex-grow p-6 overflow-y-auto bg-wood-pattern text-stone-100 flex flex-col gap-6 animate-fade-in" id="leaderboard-screen-container">
      {/* Header Banner */}
      <div className="rounded-xl border border-[#fbbf24]/30 bg-gradient-to-r from-[#201006] to-[#0d0704] p-6 shadow-xl relative overflow-hidden" id="leaderboard-banner">
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[#fbbf24]/5 pointer-events-none">
          <Trophy className="w-40 h-40" />
        </div>
        <div className="flex items-center gap-3 mb-2" id="leaderboard-header">
          <Trophy className="w-8 h-8 text-[#fbbf24] gold-text-glow" />
          <h1 className="text-2xl font-bold font-display tracking-wider text-[#fbbf24] gold-text-glow">CLASSEMENT NATIONAL ELITE</h1>
        </div>
        <p className="text-stone-300 max-w-2xl text-sm leading-relaxed">
          Admirez les plus grands guerriers stratèges du Cameroun et d'Afrique Centrale. Leurs noms sont gravés dans le bois de l'arbre sacré des ancêtres Ekang.
        </p>
      </div>

      {/* Leaderboard Table Container */}
      <div className="rounded-xl bg-[#201006]/85 border border-[#6B3F1D]/30 shadow-2xl overflow-hidden" id="leaderboard-table-panel">
        <div className="p-4 bg-[#3A2314]/50 border-b border-[#6B3F1D]/30 flex justify-between items-center" id="leaderboard-table-header">
          <h3 className="text-sm font-semibold tracking-wider text-[#fbbf24]">SOCIÉTÉ DES MAÎTRES DE SONGO</h3>
          <span className="text-[11px] uppercase bg-emerald-950 text-[#00FF9D] font-mono font-bold px-2 py-1 rounded">Saison active : Ekang 2026</span>
        </div>

        <div className="overflow-x-auto" id="leaderboard-list">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#6B3F1D]/20 text-[11px] font-mono tracking-wider text-[#fbbf24]/80 uppercase bg-[#180d06]">
                <th className="p-4 text-center">Rang</th>
                <th className="p-4">Joueur &amp; Clan</th>
                <th className="p-4">Elo</th>
                <th className="p-4">Victoires</th>
                <th className="p-4">Série</th>
                <th className="p-4 text-center">Emblème</th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((player, index) => {
                const isTop3 = index < 3;
                return (
                  <tr
                    key={player.rank}
                    className={`border-b border-[#6B3F1D]/10 hover:bg-[#3A2314]/30 transition-colors ${
                      index === 0 ? 'bg-[#ffeb3b]/5' : ''
                    }`}
                    id={`leader-row-${player.rank}`}
                  >
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center" id={`leader-rank-badge-${player.rank}`}>
                        {index === 0 ? (
                          <Medal className="w-6 h-6 text-[#fbbf24] drop-shadow-[0_0_4px_rgba(255,215,0,0.6)]" />
                        ) : index === 1 ? (
                          <Medal className="w-6 h-6 text-stone-300" />
                        ) : index === 2 ? (
                          <Medal className="w-6 h-6 text-amber-700" />
                        ) : (
                          <span className="font-mono text-sm font-bold text-stone-400">{player.rank}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-white text-sm tracking-wide">{player.name}</span>
                        <span className="text-xs text-[#fbbf24]/60">{player.clan}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-[#fbbf24]" />
                        <span className="font-mono text-sm font-bold text-[#fbbf24]">{player.rating}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-medium text-stone-200">{player.winRate}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        {player.streak > 0 ? (
                          <>
                            <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                            <span className="font-mono text-xs font-bold text-orange-400">+{player.streak}</span>
                          </>
                        ) : (
                          <span className="text-[#6B3F1D] text-xs font-mono">-</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-xl" role="img" aria-label="clan emojy">{player.avatar}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
