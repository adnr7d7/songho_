import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayerSide } from '../songoEngine.js';
import { soundEngine } from './AudioEngine.js';

interface BoardProps {
  board: number[];
  activePlayer: PlayerSide;
  onPitClick: (pitIdx: number) => void;
  validMoves: number[];
  animatingPit: number | null;
  capturedPits: number[];
  lastSelectedPit: number | null;
  opponentView?: boolean; // Flip board if player is playing from top (e.g. North in online play)
  playerSide?: PlayerSide; // Player's side ('SUD', 'NORD', or undefined for local/spectator)
  recommendedPitIdx?: number | null;
}

export default function Board({
  board,
  activePlayer,
  onPitClick,
  validMoves,
  animatingPit,
  capturedPits,
  lastSelectedPit,
  opponentView = false,
  playerSide,
  recommendedPitIdx = null,
}: BoardProps) {
  
  // Mapping of indices to visualize top row (North) and bottom row (South)
  // South camp: index 0 (S7) to index 6 (S1)
  // North camp: index 7 (N1) to index 13 (N7)
  const southIndices = [0, 1, 2, 3, 4, 5, 6]; // S7, S6, S5, S4, S3, S2, S1 (left to right)
  const northIndices = [13, 12, 11, 10, 9, 8, 7]; // N7, N6, N5, N4, N3, N2, N1 (rendered left to right)

  /**
   * Helper to positions of beads inside a standard 64px width hole
   * This gives an incredibly authentic 3D piled marbles feel!
   */
  const renderBeadsInPit = (count: number, isCaptured: boolean, isSowing: boolean) => {
    if (count === 0) return null;

    // Limit visible beads to 12 max to prevent cluttering, but show stacked count
    const visibleCount = Math.min(count, 12);
    const beads = [];

    // Predefined positions inside the relative wood-pit basin
    const positions = [
      { top: '42%', left: '42%', delay: 0 },
      { top: '22%', left: '26%', delay: 0.05 },
      { top: '24%', left: '58%', delay: 0.1 },
      { top: '56%', left: '24%', delay: 0.08 },
      { top: '58%', left: '56%', delay: 0.12 },
      { top: '38%', left: '16%', delay: 0.15 },
      { top: '40%', left: '68%', delay: 0.18 },
      { top: '16%', left: '44%', delay: 0.2 },
      { top: '64%', left: '40%', delay: 0.22 },
      { top: '28%', left: '42%', delay: 0.25 },
      { top: '50%', left: '30%', delay: 0.28 },
      { top: '48%', left: '52%', delay: 0.3 },
    ];

    for (let i = 0; i < visibleCount; i++) {
      const pos = positions[i] || positions[0];
      beads.push(
        <motion.div
          key={i}
          initial={{ scale: 0, y: -20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 10, delay: isSowing ? 0 : pos.delay }}
          className={`absolute w-1.5 h-1.5 min-[400px]:w-2 min-[400px]:h-2 sm:w-2.5 sm:h-2.5 lg:w-2 lg:h-2 xl:w-2.5 xl:h-2.5 2xl:w-3 2xl:h-3 rounded-full ${
            isCaptured 
              ? 'glass-bead-captured' 
              : isSowing 
              ? 'glass-bead-selected' 
              : 'glass-bead'
          }`}
          style={{ top: pos.top, left: pos.left }}
        />
      );
    }

    return <div className="absolute inset-0 w-full h-full pointer-events-none">{beads}</div>;
  };

  const renderPit = (idx: number, isNorth: boolean) => {
    const isPlayable = validMoves.includes(idx);
    const count = board[idx];
    const isAnimTarget = animatingPit === idx;
    const isCapTarget = capturedPits.includes(idx);
    const isSelected = lastSelectedPit === idx;
    const isRecommended = recommendedPitIdx === idx;

    // Label determination
    const label = isNorth ? `N${idx - 6}` : `S${7 - idx}`;

    // Click handler checking active turn boundaries
    const handleClick = () => {
      // If player is assigned a side in online play, check they don't play other side's pits
      if (playerSide && playerSide !== activePlayer) return;
      if (playerSide === 'SUD' && idx > 6) return;
      if (playerSide === 'NORD' && idx <= 6) return;

      if (isPlayable) {
        onPitClick(idx);
      }
    };

    return (
      <div 
        key={idx} 
        className="flex flex-col items-center gap-1.5" 
        id={`pit-col-${idx}`}
      >
        {/* Label on Outside */}
        <span 
          className={`font-mono text-[8px] sm:text-[10px] font-bold tracking-widest ${
            count > 0 ? 'text-[#fbbf24]' : 'text-stone-500'
          }`}
          id={`label-${idx}`}
        >
          {label}
        </span>

        {/* The Carved Hole Basin */}
        <button
          onClick={handleClick}
          disabled={!isPlayable}
          className={`relative w-10 h-10 min-[400px]:w-11 min-[400px]:h-11 min-[480px]:w-12 min-[480px]:h-12 sm:w-14 sm:h-14 md:w-14 md:h-14 lg:w-12 lg:h-12 xl:w-16 xl:h-16 2xl:w-20 2xl:h-20 rounded-full wood-pit flex items-center justify-center transition-all ${
            count === 0 ? 'empty-pit' : ''
          } ${
            isPlayable 
              ? 'cursor-pointer active:scale-95 border-2 border-[#6B3F1D]/50 hover:border-[#fbbf24]/60' 
              : 'cursor-default border border-[#3A2314]'
          } ${
            isAnimTarget 
              ? 'border-2 border-[#00FF9D] active-pit-highlight ring-4 ring-[#00FF9D]/20 shadow-[0_0_15px_rgba(0,255,157,0.4)]' 
              : ''
          } ${
            isCapTarget 
              ? 'border-2 border-red-500 ring-4 ring-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.55)]' 
              : ''
          } ${
            isSelected 
              ? 'ring-2 ring-[#fbbf24]/50 border-[#fbbf24]' 
              : ''
          } ${
            isRecommended
              ? 'ring-4 ring-[#fbbf24] border-[#fbbf24] shadow-[0_0_20px_rgba(251,191,36,0.7)] animate-pulse'
              : ''
          }`}
          id={`pit-button-${idx}`}
        >
          {/* Glowing ring if active player choice */}
          {isPlayable && activePlayer === (isNorth ? 'NORD' : 'SUD') && (
            <div className="absolute inset-0 rounded-full border border-dashed border-[#fbbf24]/40 animate-spin" style={{ animationDuration: '10s' }} />
          )}

          {isRecommended && (
            <div className="absolute inset-0 rounded-full border-2 border-[#fbbf24] animate-ping" style={{ animationDuration: '2s' }} />
          )}

          {/* Seeds Render */}
          {renderBeadsInPit(count, isCapTarget, isAnimTarget)}

          {/* Golden pit badge label indicating sum */}
          <div 
            className={`absolute -bottom-1.5 text-[8px] sm:text-[10px] md:text-[10px] lg:text-[8px] xl:text-[10px] 2xl:text-[11px] font-bold font-mono px-1 sm:px-2 py-0.2 sm:py-0.5 rounded-full flex items-center justify-center border ${
              count > 0 
                ? 'bg-[#fbbf24] text-[#120b06] border-[#78350f]' 
                : 'bg-stone-900/90 text-stone-500 border-stone-800'
            }`}
            id={`count-badge-${idx}`}
          >
            {count}
          </div>
        </button>
      </div>
    );
  };

  // Switch structure if opponent perspective (Flipped Board)
  const renderRow = (indicesList: number[], isNorth: boolean) => {
    return (
      <div className="flex justify-between items-center w-full px-1 min-[400px]:px-2.5 sm:px-4 gap-0.5 min-[400px]:gap-1 min-[480px]:gap-1.5 sm:gap-2.5 md:gap-3 lg:gap-2 xl:gap-3.5 2xl:gap-5" id={`row-${isNorth ? 'north' : 'south'}`}>
        {indicesList.map(idx => renderPit(idx, isNorth))}
      </div>
    );
  };

  return (
    <div className="w-full overflow-x-auto pb-2 scrollbar-none flex justify-center py-2 sm:py-4" id="board-master-container">
      {/* Visual Carved Board Wrapper */}
      <div className="w-full min-w-[300px] max-w-4xl relative rounded-2xl p-2 min-[400px]:p-3 sm:p-4 md:p-6 lg:p-4 xl:p-6 2xl:p-8 wood-board border-2 md:border-3 border-[#6B3F1D] flex flex-col gap-3 sm:gap-4 md:gap-6 lg:gap-4 xl:gap-6 2xl:gap-8 overflow-hidden shrink-0" id="board-carved-chassis">
        {/* Background tribal lines ornamentations */}
        <div className="absolute top-0 right-1 w-full h-full opacity-5 pointer-events-none select-none border-t-8 border-b-8 border-dashed border-[#fbbf24]" />
        
        {/* Board Division Line */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-[#3A2314]/60 border-t border-b border-[#6B3F1D]/20 z-0" />

        <div className="flex flex-col gap-3 sm:gap-4 md:gap-6 lg:gap-4 xl:gap-6 2xl:gap-8 relative z-10" id="board-mesh-pitrows">
          {/* Top Row: North (Opponent View might swap bottom representation) */}
          {renderRow(northIndices, true)}

          {/* Bottom Row: South */}
          {renderRow(southIndices, false)}
        </div>

        {/* Left carved ornament pillars */}
        <div className="absolute left-1.5 top-0 bottom-0 w-2 flex flex-col justify-around text-center select-none font-display text-stone-400 opacity-20 text-[10px]">
          <div>◆</div>
          <div>◈</div>
          <div>◆</div>
          <div>◈</div>
          <div>◆</div>
        </div>
        
        {/* Right carved ornament pillars */}
        <div className="absolute right-1.5 top-0 bottom-0 w-2 flex flex-col justify-around text-center select-none font-display text-stone-400 opacity-20 text-[10px]">
          <div>◆</div>
          <div>◈</div>
          <div>◆</div>
          <div>◈</div>
          <div>◆</div>
        </div>
      </div>
    </div>
  );
}
