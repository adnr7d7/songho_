import React, { useEffect, useState } from 'react';
import { PlayerSide } from '../songoEngine.js';
import { Trophy, Clock, Skull, Tv } from 'lucide-react';

interface HeaderProps {
  scoreNord: number;
  scoreSud: number;
  activePlayer: PlayerSide;
  winner: PlayerSide | 'NUL' | null;
  playerNorthName?: string;
  playerSouthName?: string;
  isOnlineMode?: boolean;
}

export default function Header({
  scoreNord,
  scoreSud,
  activePlayer,
  winner,
  playerNorthName = 'JOUEUR NORD',
  playerSouthName = 'JOUEUR SUD',
  isOnlineMode = false,
}: HeaderProps) {
  // Simple countdown timers for both sides
  const [southTime, setSouthTime] = useState(180); // 3:00 min
  const [northTime, setNorthTime] = useState(180);

  useEffect(() => {
    if (winner) return;
    const timer = setInterval(() => {
      if (activePlayer === 'SUD') {
        setSouthTime((t) => (t > 0 ? t - 1 : 180));
      } else {
        setNorthTime((t) => (t > 0 ? t - 1 : 180));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activePlayer, winner]);

  const formatTime = (secs: number) => {
    const min = Math.floor(secs / 60);
    const sec = secs % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Percentages for beautiful score progress bars (since max capture win target is 40)
  const southPercent = Math.min((scoreSud / 40) * 100, 100);
  const northPercent = Math.min((scoreNord / 40) * 100, 100);

  return (
    <div className="w-full flex flex-col gap-2 shrink-0" id="header-master-shield">
      {/* Top Players Row matching the exact requested image layout! */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 sm:gap-3 items-center px-1" id="header-dashboard-grid">
        
        {/* JOUEUR NORD (Top-Left) */}
        <div 
          className={`col-span-1 sm:col-span-1 lg:col-span-5 rounded-xl border p-2 min-[400px]:p-2.5 sm:p-3 lg:p-2 bg-gradient-to-r from-[#150a04] to-[#2D170B] flex justify-between items-center transition-all ${
            activePlayer === 'NORD' && !winner
              ? 'border-[#00FF9D] shadow-[0_0_15px_rgba(0,255,157,0.15)] ring-1 ring-[#00FF9D]/30'
              : 'border-[#6B3F1D]/40'
          }`}
          id="block-player-north"
        >
          <div className="flex gap-2 sm:gap-3 items-center min-w-0" id="north-info-bundle">
            {/* Avatar Box with 3D profile */}
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-[#fbbf24]/50 bg-neutral-900 overflow-hidden flex items-center justify-center shrink-0">
              <span className="text-base sm:text-2xl filter saturate-100 font-display">🦅</span>
              {/* Online indicator */}
              <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[#00FF9D] border border-stone-900 animate-pulse" />
            </div>

            <div className="flex flex-col min-w-0" id="player-nord-meta">
              <span className="font-sans font-bold text-[11px] sm:text-xs text-stone-100 uppercase tracking-wider leading-none truncate mb-1">
                {playerNorthName}
              </span>
              <div className="flex gap-1.5 items-center mt-0.5" id="player-nord-submeta">
                <span className="text-[7.5px] bg-emerald-950/40 border border-emerald-900/40 px-1 py-0.2 text-[#00FF9D] font-bold rounded shrink-0">
                  EN LIGNE
                </span>
                <span className="text-[8px] sm:text-[9.5px] text-stone-500 font-medium flex items-center gap-0.5 font-mono">
                  <Trophy className="w-2.5 h-2.5 text-stone-600" /> 1250
                </span>
              </div>
            </div>
          </div>

          {/* Slices of score and countdowns */}
          <div className="flex items-center gap-2 sm:gap-3 text-right shrink-0" id="north-scores-bundle">
            <div className="flex flex-col gap-0.5 items-end" id="north-ratio-meter">
              <div className="text-stone-500 text-[8px] sm:text-[9px] font-mono font-bold tracking-wider">SCORE</div>
              <div className="text-sm sm:text-lg font-mono font-bold flex items-baseline gap-0.5 leading-none">
                <span className="text-[#00FF9D] text-base sm:text-xl font-bold emerald-text-glow">{scoreNord}</span>
                <span className="text-[9px] sm:text-[11px] text-stone-600">/ 40</span>
              </div>
            </div>

            {/* Time Timer Chip */}
            <div className="h-7 sm:h-8 px-2 rounded-lg border border-stone-800 bg-[#0d0704] flex items-center gap-1 shrink-0 text-stone-300 font-mono font-bold text-[10px] sm:text-xs" id="north-time-spinner">
              <Clock className="w-3 h-3 text-stone-500" />
              <span>{formatTime(northTime)}</span>
            </div>
          </div>
        </div>

        {/* BRIGHT CENTER BRANDING (SONGO logo visual) */}
        <div className="col-span-2 lg:col-span-2 order-first lg:order-none text-center flex flex-col items-center justify-center p-1" id="central-logo-monolith">
          <h2 className="text-xl sm:text-2xl font-bold font-display tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-[#FFF] via-[#fbbf24] to-[#92400e] leading-none mb-0.5 shadow-sm font-display">
            SONGhO
          </h2>
          <div className="text-[8px] text-[#fbbf24] font-bold tracking-[0.15em] font-sans">
            CHAMPIONSHIP
          </div>
          <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-[#fbbf24]/30 to-transparent mt-1" />
        </div>

        {/* JOUEUR SUD (Top-Right) */}
        <div 
          className={`col-span-1 sm:col-span-1 lg:col-span-5 rounded-xl border p-2 min-[400px]:p-2.5 sm:p-3 lg:p-2 bg-gradient-to-l from-[#150a04] to-[#2D170B] flex justify-between items-center transition-all ${
            activePlayer === 'SUD' && !winner
              ? 'border-[#fbbf24] shadow-[0_0_15px_rgba(255,191,0,0.15)] ring-1 ring-[#fbbf24]/30'
              : 'border-[#6B3F1D]/40'
          }`}
          id="block-player-south"
        >
          {/* Slices of score and countdowns */}
          <div className="flex items-center gap-2 sm:gap-3 text-left shrink-0" id="south-scores-bundle">
            {/* Time Timer Chip */}
            <div className="h-7 sm:h-8 px-2 rounded-lg border border-stone-800 bg-[#0d0704] flex items-center gap-1 shrink-0 text-stone-300 font-mono font-bold text-[10px] sm:text-xs" id="south-time-spinner">
              <Clock className="w-3 h-3 text-stone-500" />
              <span>{formatTime(southTime)}</span>
            </div>

            <div className="flex flex-col gap-0.5 items-start" id="south-ratio-meter">
              <div className="text-stone-500 text-[8px] sm:text-[9px] font-mono font-bold tracking-wider">SCORE</div>
              <div className="text-sm sm:text-lg font-mono font-bold flex items-baseline gap-0.5 leading-none">
                <span className="text-[#fbbf24] text-base sm:text-xl font-bold gold-text-glow">{scoreSud}</span>
                <span className="text-[9px] sm:text-[11px] text-stone-600">/ 40</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 sm:gap-3 items-center min-w-0" id="south-info-bundle">
            <div className="flex flex-col text-right min-w-0" id="player-south-meta">
              <span className="font-sans font-bold text-[11px] sm:text-xs text-stone-100 uppercase tracking-wider leading-none truncate mb-1">
                {playerSouthName}
              </span>
              <div className="flex gap-1.5 items-center mt-0.5 justify-end" id="player-south-submeta">
                <span className="text-[8px] sm:text-[9.5px] text-stone-500 font-medium flex items-center gap-0.5 font-mono">
                  <Trophy className="w-2.5 h-2.5 sm:w-3 h-3 text-[#fbbf24]" /> 1320
                </span>
                <span className="text-[7.5px] bg-emerald-950/40 border border-emerald-900/40 px-1 py-0.2 text-[#00FF9D] font-bold rounded shrink-0">
                  EN LIGNE
                </span>
              </div>
            </div>

            {/* Avatar Box with 3D profile */}
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-[#fbbf24]/50 bg-neutral-900 overflow-hidden flex items-center justify-center shrink-0">
              <span className="text-base sm:text-2xl filter saturate-100 font-display">🦁</span>
              <div className="absolute top-0 left-0 w-2 h-2 rounded-full bg-[#00FF9D] border border-stone-900 animate-pulse" />
            </div>
          </div>
        </div>

      </div>

      {/* Dynamic Active Turn Indicator */}
      <div className="w-full flex justify-center py-1 bg-[#120b06]/85 border-t border-b border-[#6B3F1D]/15" id="header-turn-indicator">
        {winner ? (
          <div className="flex items-center gap-1.5 text-[#fbbf24] font-bold tracking-widest text-[10px] sm:text-xs uppercase" id="winner-banner-active">
            <Skull className="w-3.5 h-3.5 text-red-500 animate-bounce" />
            <span>{winner === 'NUL' ? 'MATCH NUL !' : `VICTOIRE DU JOUEUR ${winner} !`}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold tracking-widest text-stone-100 uppercase" id="turn-banner-active">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00FF9D] animate-ping" />
            <span>TOUR DE : </span>
            <span className={activePlayer === 'SUD' ? 'text-[#fbbf24]' : 'text-[#00FF9D]'}>
              {activePlayer === 'SUD' ? playerSouthName : playerNorthName}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
