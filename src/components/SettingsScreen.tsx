import React, { useState } from 'react';
import { Settings, Volume2, Music, Check, Shield, Circle, User } from 'lucide-react';
import { soundEngine } from './AudioEngine.js';

interface SettingsScreenProps {
  soundVol: number;
  setSoundVol: (v: number) => void;
  musicVol: number;
  setMusicVol: (v: number) => void;
  playerName: string;
  setPlayerName: (n: string) => void;
}

export default function SettingsScreen({
  soundVol,
  setSoundVol,
  musicVol,
  setMusicVol,
  playerName,
  setPlayerName,
}: SettingsScreenProps) {
  const [copied, setCopied] = useState(false);

  const handleSoundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setSoundVol(val);
    soundEngine.setSoundVolume(val);
    soundEngine.playSow(3);
  };

  const handleMusicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setMusicVol(val);
    soundEngine.setMusicVolume(val);
    if (val > 0) {
      soundEngine.startAmbientMusic();
    } else {
      soundEngine.stopAmbientMusic();
    }
  };

  const handleNameSave = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-grow p-6 overflow-y-auto bg-wood-pattern text-stone-100 flex flex-col gap-6 animate-fade-in" id="settings-screen-container">
      {/* Header */}
      <div className="rounded-xl border border-[#fbbf24]/30 bg-gradient-to-r from-[#201006] to-[#0d0704] p-6 shadow-xl relative overflow-hidden" id="settings-banner">
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[#fbbf24]/5 pointer-events-none">
          <Settings className="w-40 h-40" />
        </div>
        <div className="flex items-center gap-3 mb-2" id="settings-header">
          <Settings className="w-8 h-8 text-[#fbbf24] gold-text-glow" />
          <h1 className="text-2xl font-bold font-display tracking-wider text-[#fbbf24] gold-text-glow">CONFIGURATION GÉNÉRALE</h1>
        </div>
        <p className="text-stone-300 max-w-2xl text-sm leading-relaxed">
          Affinez vos contrôles, configurez votre identité de chef de guerre et paramétrez l'immersion acoustique de SONGhO Championship.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="settings-grid">
        {/* Identité du joueur */}
        <div className="rounded-lg bg-[#201006]/80 border border-[#6B3F1D]/30 p-5 shadow-lg flex flex-col gap-4" id="settings-sec-identity">
          <div className="flex items-center gap-2 text-[#fbbf24] font-semibold border-b border-[#6B3F1D]/20 pb-2">
            <User className="w-5 h-5 text-[#6B3F1D]" />
            <span className="text-sm font-sans uppercase">Identité du Chef</span>
          </div>
          <form onSubmit={handleNameSave} className="flex flex-col gap-3">
            <label className="text-xs text-stone-300 font-medium">Votre nom de combat (affiché en ligne et localement)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
                className="flex-grow rounded bg-stone-900 border border-[#6B3F1D]/40 px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-[#fbbf24]"
                placeholder="Entrez votre nom..."
                id="playerNameInput"
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-[#b45309] to-[#78350f] hover:from-[#d97706] hover:to-[#92400e] text-amber-100 font-bold px-4 py-2 text-xs rounded border border-[#fbbf24]/40"
              >
                {copied ? 'ENREGISTRÉ !' : 'SAUVER'}
              </button>
            </div>
          </form>
        </div>

        {/* Paramètres Sonores */}
        <div className="rounded-lg bg-[#201006]/80 border border-[#6B3F1D]/30 p-5 shadow-lg flex flex-col gap-4" id="settings-sec-sound">
          <div className="flex items-center gap-2 text-[#fbbf24] font-semibold border-b border-[#6B3F1D]/20 pb-2">
            <Volume2 className="w-5 h-5 text-[#6B3F1D]" />
            <span className="text-sm font-sans uppercase">Acoustique &amp; Ambiance</span>
          </div>

          <div className="flex flex-col gap-4">
            {/* Effets Sonores */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 font-medium text-stone-200">
                  <Volume2 className="w-4 h-4 text-[#fbbf24]" /> Effets sonores (Sema, Captures)
                </span>
                <span className="font-mono text-[#fbbf24] font-bold">{Math.round(soundVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={soundVol}
                onChange={handleSoundChange}
                className="w-full accent-[#fbbf24] h-1.5 bg-stone-900 rounded-lg cursor-pointer"
              />
            </div>

            {/* Musique Sacrée */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 font-medium text-stone-200">
                  <Music className="w-4 h-4 text-[#fbbf24]" /> Chants Ambiants (Synthesizer Drone)
                </span>
                <span className="font-mono text-[#fbbf24] font-bold">{Math.round(musicVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={musicVol}
                onChange={handleMusicChange}
                className="w-full accent-[#fbbf24] h-1.5 bg-stone-900 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Certificat de Qualité */}
        <div className="rounded-lg bg-[#201006]/80 border border-[#6B3F1D]/30 p-5 shadow-lg flex flex-col gap-3 md:col-span-2 text-center" id="settings-sec-about">
          <div className="flex justify-center mb-1 text-[#fbbf24]" id="about-shield-icon">
            <Shield className="w-10 h-10 drop-shadow-[0_0_8px_rgba(255,215,0,0.4)]" />
          </div>
          <h3 className="font-display text-sm tracking-widest text-[#fbbf24] uppercase">SONGhO CHAMPIONSHIP - PREMIUM AAA</h3>
          <p className="text-xs text-stone-400 max-w-xl mx-auto leading-relaxed">
            Cette édition numérique premium respecte l'héritage sacré des Ekang. Développé en React fluide avec moteur hybride Express.js pour une compatibilité totale sur ordinateurs d'élite et smartphones d'Afrique.
          </p>
          <span className="text-[10px] font-mono text-stone-500 mt-2">v2.6.0 - Élevé avec fierté par Directeur Artistique Songo</span>
        </div>
      </div>
    </div>
  );
}
