import React from 'react';
import { BookOpen, AlertCircle, Award, RefreshCw, HelpCircle } from 'lucide-react';

export default function RuleScreen() {
  return (
    <div className="flex-grow p-6 overflow-y-auto bg-wood-pattern text-stone-100 flex flex-col gap-6" id="rules-screen-container">
      {/* Banner */}
      <div className="rounded-xl border border-[#fbbf24]/30 bg-gradient-to-r from-[#201006] to-[#0d0704] p-6 shadow-xl relative overflow-hidden" id="rules-banner">
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[#fbbf24]/5 pointer-events-none">
          <BookOpen className="w-40 h-40" />
        </div>
        <div className="flex items-center gap-3 mb-2" id="rules-header">
          <BookOpen className="w-8 h-8 text-[#fbbf24] gold-text-glow" />
          <h1 className="text-2xl font-bold font-display tracking-wider text-[#fbbf24] gold-text-glow">RÈGLES OFFICIELLES DU SONGO</h1>
        </div>
        <p className="text-stone-300 max-w-2xl text-sm leading-relaxed">
          Le Songo est un jeu de société traditionnel de stratégie de la famille des Mancalas, cher aux peuples de la grande forêt d'Afrique Centrale (Beti, Bulu, Ewondo, Ekang). C'est un test d'anticipation mentale et de générosité calculée.
        </p>
      </div>

      {/* Grid Rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="rules-grid">
        {/* Le Plateau et les Graines */}
        <div className="rounded-lg bg-[#201006]/70 border border-[#6B3F1D]/30 p-5 flex flex-col gap-3 shadow-lg" id="rules-sec-board">
          <div className="flex items-center gap-2 text-[#fbbf24] font-semibold border-b border-[#6B3F1D]/30 pb-2">
            <RefreshCw className="w-5 h-5" />
            <h2 className="text-base tracking-wide uppercase font-sans">Le Plateau &amp; Les Graines</h2>
          </div>
          <ul className="text-stone-300 space-y-2 text-xs leading-relaxed list-disc list-inside">
            <li>Le plateau comporte <strong className="text-white">14 cases</strong> réparties en deux rangées de 7 cases (7 au Nord, 7 au Sud).</li>
            <li>Au départ, chaque case contient exactement <strong className="text-[#00FF9D]">5 graines</strong>, pour un total de 70 graines.</li>
            <li>Le sens de distribution générale s'effectue dans le <strong className="text-white">sens inverse des aiguilles d'une montre</strong> (anti-horaire).</li>
            <li>Le camp SUD sème de gauche à droite, puis remonte au Nord qui sème de droite à gauche.</li>
          </ul>
        </div>

        {/* La Distribution (Sema) */}
        <div className="rounded-lg bg-[#201006]/70 border border-[#6B3F1D]/30 p-5 flex flex-col gap-3 shadow-lg" id="rules-sec-sow">
          <div className="flex items-center gap-2 text-[#fbbf24] font-semibold border-b border-[#6B3F1D]/30 pb-2">
            <HelpCircle className="w-5 h-5" />
            <h2 className="text-base tracking-wide uppercase font-sans">La Distribution (Sema)</h2>
          </div>
          <ul className="text-stone-300 space-y-2 text-xs leading-relaxed list-disc list-inside">
            <li>Le joueur choisit une de ses cases contenant au moins une graine et prend toutes les graines.</li>
            <li>Il sème les graines une par une dans les cases suivantes de la boucle.</li>
            <li><strong className="text-white">Règle de la boucle complète</strong> : Si le nombre de graines est supérieur à 13, on saute la case de départ pour la laisser vide et on poursuit s'il reste des graines.</li>
          </ul>
        </div>

        {/* Les Captures */}
        <div className="rounded-lg bg-[#201006]/70 border border-[#6B3F1D]/30 p-5 flex flex-col gap-3 shadow-lg" id="rules-sec-capture">
          <div className="flex items-center gap-2 text-[#fbbf24] font-semibold border-b border-[#6B3F1D]/30 pb-2">
            <Award className="w-5 h-5" />
            <h2 className="text-base tracking-wide uppercase font-sans">Mécanique de Capture</h2>
          </div>
          <ul className="text-stone-300 space-y-2 text-xs leading-relaxed list-disc list-inside">
            <li>On ne peut capturer que dans le <strong className="text-white">camp adverse</strong>.</li>
            <li>Une capture se produit si la dernière graine semée tombe dans un trou adverse contenant dorénavant <strong className="text-[#00FF9D]">2, 3 ou 4 graines</strong>.</li>
            <li><strong className="text-[#fbbf24]">Capture en chaîne (Rétrograde)</strong> : On regarde la case précédente sowed. Si elle respecte aussi les critères (camp adverse et 2, 3 ou 4 graines), elle est également capturée, et ainsi de suite.</li>
            <li><strong className="text-rose-400">Exception de la Case 1</strong> : On ne peut pas capturer le premier trou adverse (N1 pour Sud, S1 pour Nord) s'il est le seul capturé. La capture exclusive de la première case adverse est interdite.</li>
            <li><strong className="text-[#fbbf24]">Préservation des Frontières (Case 7)</strong> : La case 7 adverse (N7 pour Sud, S7 pour Nord) est sous surveillance gardée et ne peut être capturée.</li>
          </ul>
        </div>

        {/* Solidarité et Famine */}
        <div className="rounded-lg bg-[#201006]/70 border border-[#6B3F1D]/30 p-5 flex flex-col gap-3 shadow-lg" id="rules-sec-solidarity">
          <div className="flex items-center gap-2 text-[#fbbf24] font-semibold border-b border-[#6B3F1D]/30 pb-2">
            <AlertCircle className="w-5 h-5" />
            <h2 className="text-base tracking-wide uppercase font-sans">Lois Sacrées d'Afrique</h2>
          </div>
          <ul className="text-stone-300 space-y-2 text-xs leading-relaxed list-disc list-inside">
            <li><strong className="text-[#00FF9D]">Solidarité (Nourrir)</strong> : Si l'adversaire n'a plus aucune graine dans son camp, le joueur actif a l'obligation de jouer un coup qui sème au moins une graine chez lui, si possible.</li>
            <li><strong className="text-rose-400">Anti-Famine (Non-Dépouillement)</strong> : Il est interdit d'effectuer une capture qui viderait complètement le camp adverse. Si une capture prend toutes les graines adverses, elle est annulée.</li>
            <li><strong className="text-[#fbbf24]">Fin de partie</strong> : La partie s'arrête lorsqu'un joueur atteint <strong className="text-white">40 graines</strong> capturées, ou s'il reste moins de 10 graines, ou si nourrir l'adversaire devient impossible.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
