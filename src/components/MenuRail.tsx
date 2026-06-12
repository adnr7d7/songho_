import React from 'react';
import { Home, PlayCircle, BookOpen, Trophy, Settings, HelpCircle } from 'lucide-react';
import { ActiveTab } from '../types.js';
import { soundEngine } from './AudioEngine.js';

interface MenuRailProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export default function MenuRail({ activeTab, setActiveTab }: MenuRailProps) {
  const menuItems = [
    { id: 'ACCUEIL' as ActiveTab, label: 'ACCUEIL', icon: Home },
    { id: 'JOUER' as ActiveTab, label: 'JOUER', icon: PlayCircle },
    { id: 'REGLES' as ActiveTab, label: 'RÈGLES', icon: BookOpen },
    { id: 'CLASSEMENT' as ActiveTab, label: 'CLASSEMENT', icon: Trophy },
    { id: 'PARAMETRES' as ActiveTab, label: 'PARAMÈTRES', icon: Settings },
  ];

  const handleSelect = (tab: ActiveTab) => {
    soundEngine.playClick();
    setActiveTab(tab);
  };

  return (
    <div className="w-full md:w-56 lg:w-60 h-14 md:h-full flex flex-row md:flex-col shrink-0 bg-[#120b06]/95 border-t md:border-t-0 md:border-r border-[#6B3F1D]/30 p-1 md:p-3 lg:p-4 order-last md:order-first z-50" id="menu-rail-container">
      <div className="hidden md:block text-center py-3 md:py-4 mb-2 md:mb-3 border-b border-[#6B3F1D]/30" id="menu-title-section">
        <span className="text-xs md:text-sm font-semibold tracking-widest text-[#fbbf24] font-sans">MENU PRINCIPAL</span>
      </div>

      <nav className="flex flex-row md:flex-col gap-1 md:gap-1.5 lg:gap-2 flex-grow w-full md:w-auto items-center md:items-stretch justify-around md:justify-start" id="menu-nav-links">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`flex flex-col md:flex-row items-center gap-0.5 md:gap-2 lg:gap-3 px-2 md:px-3 lg:px-4 py-1 md:py-2.5 lg:py-3 rounded-lg text-xs md:text-sm font-medium tracking-wide transition-all duration-200 text-center md:text-left border flex-1 md:flex-none ${
                isActive
                  ? 'bg-gradient-to-r from-[#6B3F1D] to-[#3A2314] text-white border-[#fbbf24] shadow-[0_0_12px_rgba(255,191,0,0.15)] glow-gold'
                  : 'text-stone-300 hover:text-white bg-transparent border-transparent hover:bg-stone-800/20 hover:border-stone-700/30'
              }`}
              id={`menu-item-${item.id.toLowerCase()}`}
            >
              <Icon className={`w-4 h-4 md:w-4 md:h-4 lg:w-5 lg:h-5 ${isActive ? 'text-[#fbbf24]' : 'text-[#6B3F1D]'}`} id={`menu-icon-${item.id.toLowerCase()}`} />
              <span className="font-sans text-[8px] min-[400px]:text-[10px] md:text-xs lg:text-sm" id={`menu-label-${item.id.toLowerCase()}`}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Decorative Traditional Symbol Card */}
      <div className="hidden md:block rounded-lg bg-[#201006]/80 p-4 border border-[#6B3F1D]/20 text-center relative overflow-hidden" id="traditional-symbol-card">
        <div className="absolute -right-3 -bottom-3 text-[#fbbf24]/5 opacity-20 pointer-events-none">
          <HelpCircle className="w-24 h-24" />
        </div>
        <div className="flex justify-center mb-1 text-[#fbbf24]" id="ekang-decor-svg">
          {/* Simulated Cameroonian Cameroonian pattern or traditional emblem */}
          <span className="font-display text-lg">❖ EKANG ❖</span>
        </div>
        <p className="text-[11px] text-stone-400 italic">
          « L'intelligence est comme un fleuve : elle trouve toujours son chemin. »
        </p>
      </div>
    </div>
  );
}
