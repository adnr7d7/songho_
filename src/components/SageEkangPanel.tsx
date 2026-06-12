import React, { useState } from 'react';
import { Sparkles, Brain } from 'lucide-react';
import { soundEngine } from './AudioEngine.js';

interface SageEkangPanelProps {
  board: number[];
  scoreNord: number;
  scoreSud: number;
  activePlayer: 'SUD' | 'NORD';
  onShowRecommendedPit: (pitIdx: number | null) => void;
  difficulty: 'FACILE' | 'MOYEN' | 'DIFFICILE' | 'EXPERT';
}

export default function SageEkangPanel({
  board,
  scoreNord,
  scoreSud,
  activePlayer,
  onShowRecommendedPit,
  difficulty,
}: SageEkangPanelProps) {
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<string | null>(
    'Prêt à vous guider, Guerrier. Chosissez une case ou demandez conseil.'
  );
  const [recommendedPit, setRecommendedPit] = useState<string | null>(null);
  const [capturePossible, setCapturePossible] = useState<number | null>(null);

  const fetchAdvice = async () => {
    soundEngine.playClick();
    setLoading(true);
    setAdvice(null);
    onShowRecommendedPit(null);

    try {
      const response = await fetch('/api/sage-advice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          board,
          scoreNord,
          scoreSud,
          activePlayer,
          difficulty,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setAdvice(data.advice);
        setRecommendedPit(data.pitLabel);
        setCapturePossible(data.possibleCapture);
        if (data.bestMove !== null) {
          onShowRecommendedPit(data.bestMove);
        }
      } else {
        setAdvice('Les ancêtres sont silencieux. Écoute ton propre esprit !');
      }
    } catch (e) {
      console.error('Error fetching sage advice:', e);
      setAdvice('Les esprits sont silencieux. Fais confiance à ton instinct.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="p-2 sm:p-2.5 rounded-xl border border-[#6B3F1D]/40 bg-gradient-to-r from-[#1c0f06] to-[#0A0503] flex flex-col sm:flex-row gap-2.5 items-center relative overflow-hidden shadow-xl" 
      id="sage-panel-shield"
    >
      {/* Side gold trim */}
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#fbbf24] to-[#92400e]" />

      {/* Profile & Mobile Trigger Row */}
      <div className="flex items-center justify-between w-full sm:w-auto gap-3 shrink-0" id="sage-profile-badge">
        <div className="flex items-center gap-2">
          {/* Small Oracle Avatar */}
          <div className="relative w-8 h-8 rounded-lg border border-[#fbbf24]/35 overflow-hidden shrink-0 bg-[#0d0704] flex items-center justify-center text-xl select-none">
            👴🏾
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-[11px] text-[#fbbf24] tracking-wider leading-none">
              SAGE ÉKANG
            </span>
            <span className="text-[7.5px] font-mono font-bold text-[#00FF9D]/85 uppercase mt-0.5 tracking-widest">
              CONSEIL IA
            </span>
          </div>
        </div>

        {/* Mobile/Tablet Inline advice button */}
        <button
          onClick={fetchAdvice}
          disabled={loading}
          className="sm:hidden flex items-center gap-1 bg-gradient-to-r from-[#b45309] to-[#78350f] hover:from-[#d97706] border border-[#fbbf24]/30 text-[9px] font-bold text-amber-100 tracking-wider px-2 py-1 rounded-lg transition-all active:scale-95"
        >
          <Sparkles className="w-2.5 h-2.5 text-[#fbbf24] animate-pulse" />
          {loading ? 'CALCUL...' : 'CONSEIL'}
        </button>
      </div>

      {/* Oracle Advice Speech Bubble Content */}
      <div className="flex-grow w-full sm:w-auto" id="sage-advice-speech-wrapper">
        <div className="px-2.5 py-1 bg-[#090402] rounded-lg border border-[#6B3F1D]/15 min-h-[32px] flex items-center w-full" id="sage-speech-balloon">
          {loading ? (
            <div className="flex items-center gap-1.5 py-0.5" id="sage-advisor-loader">
              <div className="w-1.5 h-1.5 rounded-full bg-[#fbbf24] animate-bounce" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#fbbf24] animate-bounce" style={{ animationDelay: '0.15s' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-[#fbbf24] animate-bounce" style={{ animationDelay: '0.3s' }} />
              <span className="text-[10px] text-stone-500 font-medium font-sans">Le Sage consulte les esprits...</span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 w-full py-0.5">
              <p className="text-[11px] text-stone-300 italic leading-tight flex-grow">
                {advice}
              </p>
              
              {recommendedPit && (
                <div className="flex items-center gap-1 bg-[#fbbf24]/10 border border-[#fbbf24]/30 px-1.5 py-0.5 rounded text-[10px] shrink-0 self-start sm:self-center" id="mini-recs-tag">
                  <span className="text-[#fbbf24] font-bold font-mono">Case {recommendedPit}</span>
                  {capturePossible !== null && capturePossible > 0 && (
                    <span className="text-[#00FF9D] font-medium font-sans border-l border-stone-800/80 pl-1">
                      +{capturePossible} billes
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* PC Version Trigger Button */}
      <button
        onClick={fetchAdvice}
        disabled={loading}
        className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-[#b45309] to-[#78350f] hover:from-[#d97706] hover:to-[#fbbf24] hover:text-[#120b06] border border-[#fbbf24]/30 text-[10px] sm:text-[11px] font-bold text-amber-100 tracking-wider px-3 py-1.5 rounded-lg transition-all shadow-md shrink-0 uppercase whitespace-nowrap active:scale-95"
        id="sageAdviceButtonDesktop"
      >
        <Sparkles className="w-3 h-3 text-[#fbbf24]" />
        {loading ? 'Calcul...' : 'Demander Conseil'}
      </button>
    </div>
  );
}
