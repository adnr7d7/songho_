import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Copy, Check, Send, Sparkles, Brain, Trophy, Volume2, Music, 
  HelpCircle, AlertCircle, RefreshCw, LogOut, Swords, UserPlus, 
  ChevronRight, Circle, Play, ShieldAlert, Wifi, Info
} from 'lucide-react';

import { ActiveTab, GameMode, AIDifficulty, RoomState } from './types.js';
import { 
  createInitialState, GameState, getValidMoves, performMove, 
  getRecommendedMove, isCampEmpty, PlayerSide 
} from './songoEngine.js';

import MenuRail from './components/MenuRail.js';
import Board from './components/Board.js';
import Header from './components/Header.js';
import SageEkangPanel from './components/SageEkangPanel.js';
import RuleScreen from './components/RuleScreen.js';
import LeaderboardScreen from './components/LeaderboardScreen.js';
import SettingsScreen from './components/SettingsScreen.js';

import { soundEngine } from './components/AudioEngine.js';

export default function App() {
  // Navigation & Preferences
  const [activeTab, setActiveTab] = useState<ActiveTab>('ACCUEIL');
  const [playerName, setPlayerName] = useState<string>('Chef Guerrier');
  const [soundVol, setSoundVol] = useState<number>(0.6);
  const [musicVol, setMusicVol] = useState<number>(0.2);

  // Dropdown Menu & Modal States
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(true); // open by default for a friendly setup
  const [dropdownTab, setDropdownTab] = useState<'COMBAT' | 'CHAT' | 'OPTIONS'>('COMBAT');
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState<boolean>(false);

  // local game status (for IA & LOCAL modes)
  const [localGameState, setLocalGameState] = useState<GameState>(createInitialState());
  const [gameMode, setGameMode] = useState<GameMode>('IA');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('DIFFICILE');

  // Online Multiplayer values
  const [onlineRoomCode, setOnlineRoomCode] = useState<string>(''); // invitation room
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [myRole, setMyRole] = useState<'SUD' | 'NORD' | 'SPECTATEUR' | null>(null);
  const [isJoinInput, setIsJoinInput] = useState<string>('');
  const [chatMessageInput, setChatMessageInput] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Animation States
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [animatingPit, setAnimatingPit] = useState<number | null>(null);
  const [capturedPitsList, setCapturedPitsList] = useState<number[]>([]);
  const [lastSelectedPit, setLastSelectedPit] = useState<number | null>(null);
  const [glowingRecommendation, setGlowingRecommendation] = useState<number | null>(null);

  // References
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Generate unique Player ID once
  useEffect(() => {
    let pid = localStorage.getItem('songo_player_id');
    if (!pid) {
      pid = 'player_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('songo_player_id', pid);
    }
    setMyPlayerId(pid);

    let savedName = localStorage.getItem('songo_player_name');
    if (savedName) {
      setPlayerName(savedName);
    }

    // Audio initial preferences
    soundEngine.setSoundVolume(0.6);
    soundEngine.setMusicVolume(0.2);
    soundEngine.startAmbientMusic();

    return () => {
      soundEngine.stopAmbientMusic();
    };
  }, []);

  // Save Name preferences
  const handleNameUpdate = (name: string) => {
    setPlayerName(name);
    localStorage.setItem('songo_player_name', name);
  };

  // Scroll Chat to bottom when new messages land
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [roomState?.chat, localGameState.history]);

  // Periodic polling for online multiplayer lobbies (frequency 1.5 seconds)
  useEffect(() => {
    if (gameMode !== 'EN_LIGNE' || !roomState?.id) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/rooms/${roomState.id}`);
        if (response.ok) {
          const data = await response.json();
          // Update room state from server (only if we are not actively animating local movements)
          if (!isAnimating) {
            setRoomState(data.room);
          }
        }
      } catch (err) {
        console.error('Lobby polling error:', err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [gameMode, roomState?.id, isAnimating]);

  /**
   * Premium Interactive step-by-step Sowing Animation (Sema)
   * Animates index-by-index with 220s spacing to make game look commercial-grade
   */
  const animateSowingTransition = async (
    startPit: number,
    sowingPath: number[],
    capturedList: number[],
    onCompleteState: GameState,
    isOnline: boolean = false
  ) => {
    setIsAnimating(true);
    setLastSelectedPit(startPit);
    soundEngine.playScoop();

    // Reconstruct temporary board to demonstrate incremental seeding
    const tempBoard = isOnline 
      ? [...(roomState?.gameState.board || [])]
      : [...localGameState.board];
    
    // Scoop seeds of selected pit
    tempBoard[startPit] = 0;

    // Sowing loop
    for (let step = 0; step < sowingPath.length; step++) {
      const idx = sowingPath[step];
      tempBoard[idx]++;

      setAnimatingPit(idx);
      // Update intermediate board visually
      if (isOnline) {
        setRoomState(prev => prev ? {
          ...prev,
          gameState: { ...prev.gameState, board: [...tempBoard] }
        } : null);
      } else {
        setLocalGameState(prev => ({ ...prev, board: [...tempBoard] }));
      }

      // Play click sound
      soundEngine.playSow(step);
      await new Promise(resolve => setTimeout(resolve, 220));
    }

    // Post-Sowing: If captures exist, flash them and play capture fanfare
    if (capturedList.length > 0) {
      setCapturedPitsList(capturedList);
      soundEngine.playCapture();
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Perform final subtraction
      capturedList.forEach(cIdx => {
        tempBoard[cIdx] = 0;
      });
      setCapturedPitsList([]);
    }

    // Write final game engine state
    if (isOnline) {
      setRoomState(prev => prev ? {
        ...prev,
        gameState: onCompleteState
      } : null);
    } else {
      setLocalGameState(onCompleteState);
      
      // If against AI, and it is now North's turn, trigger computer play
      if (gameMode === 'IA' && onCompleteState.activePlayer === 'NORD' && !onCompleteState.winner) {
        setTimeout(() => triggerAILogic(onCompleteState), 900);
      }
    }

    setIsAnimating(false);
    setAnimatingPit(null);
    setLastSelectedPit(null);
    setGlowingRecommendation(null);

    // Play victory fanfare if somebody won
    if (onCompleteState.winner && onCompleteState.winner !== 'NUL') {
      soundEngine.playVictory();
    }
  };

  /**
   * AI Opponent Move computation
   */
  const triggerAILogic = (currentState: GameState) => {
    if (currentState.winner) return;
    const aiMove = getRecommendedMove(currentState, aiDifficulty);
    if (aiMove === -1) return;

    // Simulate clicking AI move
    const outcome = performMove(currentState, aiMove);
    if (outcome.success) {
      animateSowingTransition(
        aiMove,
        outcome.sowingPath,
        outcome.capturedPits,
        outcome.nextState,
        false
      );
    }
  };

  /**
   * Action: Playing a move (either local play or online play)
   */
  const handlePitSelection = async (pitIdx: number) => {
    if (isAnimating) return;

    if (gameMode === 'EN_LIGNE') {
      if (!roomState) return;
      // Make sure it is my turn online
      if (roomState.gameState.activePlayer !== myRole) return;

      try {
        const response = await fetch(`/api/rooms/${roomState.id}/move`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            playerId: myPlayerId,
            pitIndex: pitIdx,
          }),
        });

        const data = await response.json();
        if (response.ok) {
          // Play animation locally using computed parameters
          animateSowingTransition(
            pitIdx,
            data.sowingPath,
            data.capturedPits,
            data.room.gameState,
            true
          );
        } else {
          alert(data.error || 'Coup non autorisé.');
        }
      } catch (err) {
        console.error('Error playing online move:', err);
      }
    } else {
      // Local or IA Play
      const outcome = performMove(localGameState, pitIdx);
      if (outcome.success) {
        animateSowingTransition(
          pitIdx,
          outcome.sowingPath,
          outcome.capturedPits,
          outcome.nextState,
          false
        );
      }
    }
  };

  /**
   * Online lobby creation
   */
  const handleCreateOnlineRoom = async () => {
    soundEngine.playClick();
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, playerId: myPlayerId }),
      });

      const data = await response.json();
      if (response.ok) {
        setRoomState(data.room);
        setMyRole('SUD'); // Creator is assigned South
        setOnlineRoomCode(data.roomId);
        soundEngine.playVictory();
      }
    } catch (e) {
      console.error('Room creation failure:', e);
    }
  };

  /**
   * Online lobby joining
   */
  const handleJoinOnlineRoom = async (code: string = isJoinInput) => {
    soundEngine.playClick();
    if (!code || code.trim() === '') return;

    try {
      const response = await fetch(`/api/rooms/${code.toUpperCase()}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, playerId: myPlayerId }),
      });

      const data = await response.json();
      if (response.ok) {
        setRoomState(data.room);
        setMyRole(data.role);
        setOnlineRoomCode(code.toUpperCase());
        setIsJoinInput('');
        soundEngine.playVictory();
      } else {
        alert(data.error || 'Salon inexistant ou complet.');
      }
    } catch (e) {
      console.error('Room join error:', e);
    }
  };

  /**
   * Resigns / Quits current lobby
   */
  const handleLeaveRoom = async () => {
    soundEngine.playClick();
    if (gameMode === 'EN_LIGNE' && roomState) {
      try {
        await fetch(`/api/rooms/${roomState.id}/leave`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId: myPlayerId }),
        });
      } catch (e) {}
    }
    setRoomState(null);
    setMyRole(null);
    setOnlineRoomCode('');
    setLocalGameState(createInitialState());
  };

  /**
   * Sending online chats
   */
  const handleSendChatMessage = async (customMessage?: string) => {
    const textToSend = customMessage || chatMessageInput;
    if (!textToSend || textToSend.trim() === '') return;

    soundEngine.playSow(1);

    if (gameMode === 'EN_LIGNE' && roomState) {
      try {
        const response = await fetch(`/api/rooms/${roomState.id}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sender: playerName, text: textToSend }),
        });
        const data = await response.json();
        if (response.ok) {
          setRoomState(prev => prev ? { ...prev, chat: data.chat } : null);
        }
      } catch (e) {}
      if (!customMessage) setChatMessageInput('');
    } else {
      // Local chat log simulation
      const formattedLog = `Messagerie: [${playerName}] : "${textToSend}"`;
      setLocalGameState(prev => ({
        ...prev,
        history: [...prev.history, formattedLog],
      }));
      if (!customMessage) setChatMessageInput('');
    }
  };

  /**
   * Clipboard code copy
   */
  const copyLobbyCode = () => {
    soundEngine.playClick();
    navigator.clipboard.writeText(onlineRoomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Helper values
  const activeBoard = gameMode === 'EN_LIGNE' && roomState 
    ? roomState.gameState.board 
    : localGameState.board;

  const currentScoreNord = gameMode === 'EN_LIGNE' && roomState 
    ? roomState.gameState.scoreNord 
    : localGameState.scoreNord;

  const currentScoreSud = gameMode === 'EN_LIGNE' && roomState 
    ? roomState.gameState.scoreSud 
    : localGameState.scoreSud;

  const activeTurn = gameMode === 'EN_LIGNE' && roomState 
    ? roomState.gameState.activePlayer 
    : localGameState.activePlayer;

  const activeWinner = gameMode === 'EN_LIGNE' && roomState 
    ? roomState.gameState.winner 
    : localGameState.winner;

  const activeStatus = gameMode === 'EN_LIGNE' && roomState 
    ? roomState.gameState.statusMessage 
    : localGameState.statusMessage;

  const validMovesList = getValidMoves(activeBoard, activeTurn);

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden bg-[#060609] bg-wood-pattern relative" id="root-app-wrapper">
      
      {/* UNIFIED LUXURY TOP HEADER BAR */}
      <div className="w-full bg-[#0d0704] border-b border-[#6B3F1D]/45 px-3 sm:px-5 py-2 flex items-center justify-between shrink-0 z-40 select-none shadow-[0_4px_25px_rgba(0,0,0,0.7)]" id="unified-top-app-header">
        
        {/* Brand Emblem & Logo */}
        <div 
          className="flex items-center gap-2 cursor-pointer group" 
          onClick={() => { 
            soundEngine.playClick(); 
            setActiveTab('ACCUEIL'); 
            setIsMenuOpen(false); 
          }} 
          id="top-bar-branding"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#92400e] to-[#fbbf24] border border-[#fff]/30 flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform">
            <span className="text-sm font-bold text-stone-900">❖</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-bold font-display tracking-widest text-[#fbbf24] uppercase leading-none gold-text-glow">SONGhO</span>
            <span className="text-[7.5px] font-mono tracking-widest text-stone-500 uppercase leading-none mt-0.5">CHAMPIONSHIP</span>
          </div>
        </div>

        {/* Current Match Pill */}
        <div className="hidden sm:flex items-center gap-2" id="top-bar-middle-status">
          <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-[#201006] border border-[#6B3F1D]/40 text-[#fbbf24] font-semibold">
            {gameMode === 'IA' ? `SAGE IA - ${aiDifficulty}` : gameMode === 'LOCAL' ? ' Salon Local' : ' Salon En Ligne'}
          </span>
          {gameMode === 'EN_LIGNE' && roomState && (
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-950/45 border border-[#00FF9D]/30 text-[#00FF9D] font-bold animate-pulse">
              CODE: {onlineRoomCode}
            </span>
          )}
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3" id="top-bar-right-controls">
          <div className="hidden min-[400px]:flex items-center gap-1 bg-[#201006]/55 border border-[#6B3F1D]/25 px-2.5 py-1 rounded-lg text-[10px] sm:text-xs">
            <span className="text-stone-400 font-medium">Guerrier :</span>
            <span className="font-bold text-[#fbbf24] uppercase font-mono truncate max-w-[85px]">{playerName}</span>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              setIsMenuOpen(!isMenuOpen);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10.5px] sm:text-xs font-bold tracking-wider uppercase transition-all border active:scale-95 ${
              isMenuOpen
                ? 'bg-[#fbbf24] text-[#120b06] border-[#78350f] shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                : 'bg-gradient-to-r from-[#b45309] to-[#78350f] text-amber-100 border-[#fbbf24]/30 hover:border-[#fbbf24]/60'
            }`}
            id="top-bar-menu-toggle-btn"
          >
            <span>☰</span>
            <span>Menu &amp; Modes</span>
          </button>
        </div>
      </div>

      {/* CENTRAL APP STAGE */}
      <div className="flex-grow flex flex-col h-full overflow-hidden min-w-0 relative" id="main-content-flow">

        {/* ABSOLUTE DROPDOWN MENU / CONTROL CENTER OVERLAY */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="absolute top-0 left-0 right-0 max-w-5xl mx-auto z-45 bg-[#0a0503]/98 border-x border-b border-[#6B3F1D]/55 rounded-b-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden"
              id="main-app-menu-dropdown"
            >
              {/* Dropdown Tabs Header */}
              <div className="flex border-b border-[#6B3F1D]/20 bg-[#120b06]/70 px-4 pt-2 shrink-0 scrollbar-none overflow-x-auto" id="dropdown-tabbar">
                {(['COMBAT', 'CHAT', 'OPTIONS'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      soundEngine.playClick();
                      setDropdownTab(tab);
                    }}
                    className={`px-3 sm:px-6 py-2.5 text-[10.5px] sm:text-xs font-bold tracking-widest border-t-2 border-x rounded-t-lg transition-all whitespace-nowrap ${
                      dropdownTab === tab
                        ? 'bg-[#0a0503] text-[#fbbf24] border-t-[#fbbf24] border-x-[#6B3F1D]/30 border-b-[#0a0503]'
                        : 'bg-transparent text-stone-400 border-t-transparent border-x-transparent hover:text-stone-200'
                    }`}
                  >
                    {tab === 'COMBAT' ? '🎮 MODES DE COMBAT' : tab === 'CHAT' ? `💬 MESSAGERIE / LOBBY` : '⚙️ PARAMÈTRES & INFO'}
                  </button>
                ))}
              </div>

              {/* Dropdown Scrollable Viewer */}
              <div className="p-4 sm:p-5 text-stone-100 max-h-[65vh] overflow-y-auto" id="dropdown-tab-content-panel">
                
                {/* TAB 1: MODES */}
                {dropdownTab === 'COMBAT' && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5" id="tabbox-combats">
                    <div className="md:col-span-5 flex flex-col justify-center gap-2" id="col-combat-meta">
                      <span className="text-[10px] font-mono text-[#fbbf24] font-semibold tracking-wider uppercase">L'ARÈNE DES REINES</span>
                      <h4 className="text-base sm:text-lg font-bold font-display text-stone-100 leading-tight">CHOISISSEZ VOTRE CHAMP DE BATAILLE</h4>
                      <p className="text-[11px] text-stone-450 leading-relaxed italic">
                        Le Songo est une stratégie de patience et de calcul mental. Sélectionnez une formule, configurez vos options, puis lancez le combat sur le plateau !
                      </p>
                      
                      <div className="mt-2.5" id="ready-combat-trigger">
                        <button
                          onClick={() => {
                            soundEngine.playClick();
                            setIsMenuOpen(false);
                            setActiveTab('JOUER');
                          }}
                          className="w-full flex items-center justify-center py-2.5 rounded-lg border border-[#fbbf24]/55 bg-gradient-to-r from-[#b45309] to-[#fbbf24] font-extrabold text-[#120b06] text-xs tracking-widest uppercase shadow-md active:scale-95 transition-transform"
                        >
                          ⚔️ REJOINDRE LE PLATEAU DE JEU
                        </button>
                      </div>
                    </div>

                    <div className="md:col-span-7 rounded-xl bg-[#201006]/55 border border-[#6B3F1D]/30 p-4" id="col-combat-selector">
                      <div className="grid grid-cols-3 gap-2 mb-4" id="playmode-badge-links">
                        {(['IA', 'LOCAL', 'EN_LIGNE'] as GameMode[]).map((mode) => (
                          <button
                            key={mode}
                            onClick={() => {
                              soundEngine.playClick();
                              setGameMode(mode);
                              handleLeaveRoom();
                            }}
                            className={`text-[9.5px] py-3 font-extrabold tracking-widest rounded-lg border transition-all flex flex-col items-center justify-center gap-1 ${
                              gameMode === mode
                                ? 'bg-[#fbbf24] text-[#120b06] border-[#78350f] shadow-md'
                                : 'bg-stone-900 text-stone-400 border-stone-850 hover:text-stone-250 hover:border-stone-700'
                            }`}
                          >
                            <span className="text-sm">
                              {mode === 'IA' ? '🧠' : mode === 'LOCAL' ? '⚔️' : '🌐'}
                            </span>
                            <span className="uppercase text-[8.5px] tracking-wider">
                              {mode === 'IA' ? 'Contre IA' : mode === 'LOCAL' ? 'Local Salon' : 'En Ligne'}
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Mode Context Configs */}
                      {gameMode === 'IA' && (
                        <div className="flex flex-col gap-2 rounded-lg bg-black/40 p-3 border border-[#6B3F1D]/15" id="ai-levels-config">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono text-stone-400">Intensité du Sage IA :</span>
                            <span className="text-[9px] bg-red-950 px-1.5 py-0.5 text-rose-300 font-bold rounded uppercase">ORACLE CONSEILLER</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1.5">
                            {(['FACILE', 'MOYEN', 'DIFFICILE', 'EXPERT'] as AIDifficulty[]).map((diff) => (
                              <button
                                key={diff}
                                onClick={() => {
                                  soundEngine.playClick();
                                  setAiDifficulty(diff);
                                }}
                                className={`text-[9.5px] py-1.5 font-bold rounded transition-all ${
                                  aiDifficulty === diff
                                    ? 'bg-[#00FF9D] text-stone-950 font-extrabold shadow-sm scale-102'
                                    : 'bg-stone-850 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                                }`}
                              >
                                {diff}
                              </button>
                            ))}
                          </div>
                          <p className="text-[10.5px] text-stone-450 italic">
                            Astuce : Dès le niveau DIFFICILE, le Sage Ékang utilise d'extraordinaires calculs d'anticipation pour simuler de multiples coups à l'avance !
                          </p>
                        </div>
                      )}

                      {gameMode === 'LOCAL' && (
                        <div className="rounded-lg bg-black/40 p-4 border border-[#6B3F1D]/15 text-center flex flex-col items-center gap-1" id="local-config-panel">
                          <span className="text-[10px] font-mono text-[#fbbf24] font-bold tracking-widest uppercase">SALON MULTI-PIECE LOCAL</span>
                          <p className="text-[11px] text-stone-300 max-w-sm mt-1 leading-relaxed">
                            Ce mode simule un véritable tablier de bois posé entre vous. Jouez l'un en face de l'autre alternativement.
                          </p>
                        </div>
                      )}

                      {gameMode === 'EN_LIGNE' && (
                        <div className="rounded-lg bg-black/40 p-3 border border-[#6B3F1D]/15 flex flex-col gap-3" id="online-config-panel">
                          {roomState ? (
                            <div className="flex flex-col gap-2" id="lobby-online-room">
                              <div className="flex gap-2.5 items-center justify-between bg-[#120b06] p-2 rounded border border-[#6B3F1D]/30" id="lobby-code-row">
                                <span className="text-xs text-stone-450 font-semibold uppercase">CODE INVITATION :</span>
                                <span className="font-mono text-base font-bold text-[#fbbf24] uppercase tracking-widest">{onlineRoomCode}</span>
                                <button
                                  onClick={copyLobbyCode}
                                  className="px-2.5 py-1 rounded bg-[#fbbf24] text-stone-950 hover:bg-amber-400 text-[9.5px] font-bold tracking-wider flex items-center gap-1"
                                >
                                  {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                  {copiedCode ? 'COPIÉ' : 'COPIER'}
                                </button>
                              </div>

                              <div className="text-[10px] font-mono text-stone-400 flex justify-between items-center mt-1">
                                <span>REJOINT PAR SPECTATEURS ({roomState.spectators.length}) :</span>
                                <span className="text-[#00FF9D] font-bold">● ARENE CONSTITUEE</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row gap-3 items-stretch" id="online-prelobby-actions">
                              <div className="flex-1 flex flex-col gap-1">
                                <span className="text-[10px] font-mono text-stone-400 uppercase">A. Ouvrir un défi</span>
                                <button
                                  onClick={handleCreateOnlineRoom}
                                  className="w-full bg-[#fbbf24] hover:bg-yellow-500 text-[#120b06] font-bold text-[10.5px] py-1.5 rounded uppercase tracking-wider transition-colors border border-[#78350f]"
                                >
                                  CREER SALON EN LIGNE
                                </button>
                              </div>

                              <div className="hidden sm:block w-px bg-[#6B3F1D]/25" />

                              <div className="flex-1 flex flex-col gap-1">
                                <span className="text-[10px] font-mono text-stone-400 uppercase">B. Saisir code invitation</span>
                                <div className="flex gap-1">
                                  <input
                                    type="text"
                                    maxLength={6}
                                    value={isJoinInput}
                                    onChange={(e) => setIsJoinInput(e.target.value.toUpperCase())}
                                    placeholder="CODE SALON"
                                    className="bg-stone-900 border border-[#6B3F1D]/45 px-2 py-1 text-center font-mono uppercase text-xs rounded text-stone-100 placeholder-stone-600 focus:outline-none focus:border-[#fbbf24] flex-grow w-16"
                                  />
                                  <button
                                    onClick={() => handleJoinOnlineRoom()}
                                    className="bg-emerald-950 border border-emerald-800 text-[#00FF9D] text-[10px] px-2 rounded-lg font-bold uppercase tracking-wider"
                                  >
                                    Rejoindre
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: MESSAGERIE & CHATS */}
                {dropdownTab === 'CHAT' && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5" id="tabbox-chat">
                    <div className="md:col-span-4 flex flex-col justify-center gap-2" id="chat-tab-meta">
                      <span className="text-[10px] font-mono text-[#00FF9D] font-bold tracking-widest uppercase">CANAL DU REPTILE</span>
                      <h4 className="text-base sm:text-lg font-bold font-display text-stone-100 leading-tight">MESSAGERIE INSTANTANÉE</h4>
                      <p className="text-[11px] text-stone-400 leading-relaxed italic">
                        Envoyez des messages de félicitation ou de taquinerie. Les phrases prêtes à l'emploi partent instantanément pour accélérer le combat !
                      </p>
                      
                      <div className="flex flex-wrap gap-1 mt-2.5" id="quick-replies-list-pane">
                        {(['Bonne chance !', 'Bien joué !', 'Joli coup !', 'Merci !'] as string[]).map((msg) => (
                          <button
                            key={msg}
                            onClick={() => handleSendChatMessage(msg)}
                            className="text-[9.5px] font-mono font-bold px-2 py-1.5 rounded bg-stone-900 text-stone-300 hover:text-white border border-stone-800 active:scale-95 transition"
                          >
                            {msg}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-8 flex flex-col bg-black/45 rounded-xl border border-[#6B3F1D]/30 p-3 h-52 sm:h-60" id="chat-tab-feedbox">
                      {gameMode === 'EN_LIGNE' && roomState ? (
                        <>
                          <div className="flex-grow overflow-y-auto flex flex-col gap-1.5 p-1 text-xs pr-1" id="scrolling-chat-flow">
                            {roomState.chat.length === 0 ? (
                              <div className="h-full flex flex-col justify-center items-center text-center text-stone-600 italic">
                                <span>Aucun message. Ouvrez le dialogue avec votre adversaire !</span>
                              </div>
                            ) : (
                              roomState.chat.map((m) => {
                                const isMe = m.sender === playerName;
                                const isSage = m.sender === 'SAGE ÉKANG';
                                return (
                                  <div
                                    key={m.id}
                                    className={`flex flex-col rounded p-1.5 max-w-[85%] ${
                                      isSage
                                        ? 'bg-gradient-to-r from-[#201006] to-[#0A0503] border-l-2 border-[#fbbf24] self-start'
                                        : isMe
                                        ? 'bg-amber-950/20 text-right border border-[#fbbf24]/10 self-end'
                                        : 'bg-stone-900 border border-stone-850 self-start'
                                    }`}
                                  >
                                    <span className="text-[9.5px] font-bold text-stone-450 flex justify-between gap-2.5">
                                      <span>{m.sender}</span>
                                      <span className="text-[8px] opacity-40 font-mono">{m.timestamp}</span>
                                    </span>
                                    <span className="text-stone-200 mt-1 leading-snug">{m.text}</span>
                                  </div>
                                );
                              })
                            )}
                            <div ref={chatBottomRef} />
                          </div>

                          <div className="mt-2.5 flex gap-2 pt-2 border-t border-[#6B3F1D]/15 shrink-0" id="chat-input-bar">
                            <input
                              type="text"
                              value={chatMessageInput}
                              onChange={(e) => setChatMessageInput(e.target.value)}
                              placeholder="Votre message personnalisé..."
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSendChatMessage();
                              }}
                              className="flex-grow bg-[#050302] rounded border border-[#6B3F1D]/45 px-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-[#fbbf24]"
                            />
                            <button
                              onClick={() => handleSendChatMessage()}
                              className="p-1.5 px-3 bg-gradient-to-r from-[#b45309] to-[#78350f] rounded flex items-center justify-center text-[#ffedd5] active:scale-95 transition-transform"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex-grow flex flex-col h-full min-h-0" id="histories-and-logs-tab">
                          <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest pl-1 mb-1 block shrink-0">Historique des coups :</span>
                          <div className="flex-grow overflow-y-auto flex flex-col gap-1 bg-black/35 p-2 rounded-lg border border-[#6B3F1D]/15 text-xs text-stone-300 pr-1" id="logs-list">
                            {localGameState.history.length === 0 ? (
                              <div className="h-full flex flex-col justify-center items-center text-stone-600 italic">
                                Sifflet des ancêtres : Aucun coup enregistré. Semez une première graine !
                              </div>
                            ) : (
                              localGameState.history.map((hist, hi) => (
                                <div key={hi} className="font-mono py-1 border-b border-[#3A2314]/20 flex items-start gap-1 leading-normal">
                                  <span className="text-[#fbbf24]">⬦</span>
                                  <span>{hist}</span>
                                </div>
                              ))
                            )}
                          </div>
                          <p className="text-[9.5px] text-stone-500 italic mt-1.5 shrink-0 pl-1">
                            Note : La messagerie instantanée en ligne est optimisée pour le mode EN LIGNE.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: SETTINGS & PARAMETERS */}
                {dropdownTab === 'OPTIONS' && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5" id="tabbox-options">
                    <div className="md:col-span-6 flex flex-col gap-3.5" id="options-sliders">
                      {/* Identity update */}
                      <div className="rounded-xl bg-[#201006]/55 border border-[#6B3F1D]/20 p-3 flex flex-col gap-2" id="embedded-profile-edit">
                        <span className="text-[10px] font-mono text-[#fbbf24] uppercase tracking-wider font-semibold">Nom du Chef Guerrier :</span>
                        <div className="flex gap-2 items-center">
                          <span className="text-xl shrink-0">🦁</span>
                          <input
                            type="text"
                            value={playerName}
                            onChange={(e) => handleNameUpdate(e.target.value)}
                            placeholder="Entrez votre nom..."
                            className="flex-grow bg-black/40 border border-[#6B3F1D]/45 px-3 py-1.5 text-xs rounded text-stone-100 font-bold tracking-wide focus:outline-none focus:border-[#fbbf24]"
                          />
                        </div>
                      </div>

                      {/* Sound systems editing */}
                      <div className="rounded-xl bg-[#201006]/55 border border-[#6B3F1D]/20 p-4 flex flex-col gap-2.5" id="embedded-volume-edit">
                        <span className="text-[10px] font-mono text-stone-450 uppercase tracking-wider block mb-1">Ambiance acoustique</span>
                        
                        <div className="flex items-center gap-3">
                          <Volume2 className="w-4 h-4 text-stone-400 shrink-0" />
                          <span className="text-[10.5px] font-mono w-16 text-stone-300">Bruitages:</span>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={soundVol}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setSoundVol(val);
                              soundEngine.setSoundVolume(val);
                              soundEngine.playSow(3);
                            }}
                            className="accent-[#fbbf24] flex-grow h-1 bg-stone-800 rounded-lg cursor-pointer"
                          />
                          <span className="text-[10px] font-mono font-bold text-[#fbbf24] w-6 text-right">{Math.round(soundVol * 100)}%</span>
                        </div>

                        <div className="flex items-center gap-3 mt-1.5">
                          <Music className="w-4 h-4 text-stone-400 shrink-0" />
                          <span className="text-[10.5px] font-mono w-16 text-stone-300">Musique:</span>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={musicVol}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setMusicVol(val);
                              soundEngine.setMusicVolume(val);
                              if (val > 0) {
                                soundEngine.startAmbientMusic();
                              } else {
                                soundEngine.stopAmbientMusic();
                              }
                            }}
                            className="accent-[#fbbf24] flex-grow h-1 bg-stone-800 rounded-lg cursor-pointer"
                          />
                          <span className="text-[10px] font-mono font-bold text-[#fbbf24] w-6 text-right">{Math.round(musicVol * 100)}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-6 flex flex-col justify-center gap-3" id="options-navs">
                      <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block font-bold">Héritage culturel &amp; Livrets</span>
                      
                      <div className="grid grid-cols-2 gap-3" id="extra-mods-shortcuts">
                        <button
                          onClick={() => {
                            soundEngine.playClick();
                            setIsRulesModalOpen(true);
                          }}
                          className="flex flex-col items-center justify-center p-3 py-3.5 rounded-xl border border-[#6B3F1D]/45 bg-[#1a0c04]/80 text-stone-200 hover:text-white hover:bg-[#2c160a]/80 transition-all font-bold gap-1 text-center"
                        >
                          <span className="text-xl">📜</span>
                          <span className="text-[10px] font-bold font-sans tracking-wide">RÈGLES DÉTAILLÉES</span>
                        </button>

                        <button
                          onClick={() => {
                            soundEngine.playClick();
                            setIsLeaderboardModalOpen(true);
                          }}
                          className="flex flex-col items-center justify-center p-3 py-3.5 rounded-xl border border-[#6B3F1D]/45 bg-[#1a0c04]/80 text-stone-200 hover:text-white hover:bg-[#2c160a]/80 transition-all font-bold gap-1 text-center"
                        >
                          <span className="text-xl">🏆</span>
                          <span className="text-[10px] font-bold font-sans tracking-wide">GUERRIERS ÉLITES</span>
                        </button>
                      </div>

                      <div className="p-2 sm:p-2.5 rounded-lg bg-[#110703]/60 text-center border border-[#6B3F1D]/15">
                        <span className="text-[8px] sm:text-[9.5px] text-stone-500 block leading-tight">
                          Propulsé par le Sceau d'Ékang. Conforme aux règles d'Afrique centrale.
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Close trigger anchor */}
              <div className="bg-[#120b06]/60 p-2 sm:p-2.5 border-t border-[#6B3F1D]/15 text-center flex justify-center shrink-0" id="dropdown-foot-tap">
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    setIsMenuOpen(false);
                  }}
                  className="text-[10px] font-sans font-bold text-[#fbbf24]/85 hover:text-[#fbbf24] tracking-[0.2em] uppercase py-1 px-4 border border-[#fbbf24]/20 rounded transition-all active:scale-95"
                >
                  ▲ FERMER ET MASQUER LE MENU
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TAB 1: ACCUEIL / PORTAL SCREEN */}
        {activeTab === 'ACCUEIL' && (
          <div className="flex-grow flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto" id="portal-screen">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="max-w-xl text-center flex flex-col items-center gap-4 sm:gap-6"
              id="portal-centerpiece"
            >
              {/* Premium African Sculpted shield */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-[#92400e] to-[#fbbf24] border-2 border-[#fff]/60 flex items-center justify-center shadow-[0_0_30px_rgba(255,191,0,0.25)] animate-pulse" id="portal-shield-decor">
                <span className="text-3xl sm:text-4xl">❖</span>
              </div>

              <div id="portal-branding">
                <h1 className="text-2xl sm:text-4xl font-bold font-display tracking-widest text-[#fbbf24] gold-text-glow leading-tight mb-2 uppercase">
                  SONGhO CHAMPIONSHIP
                </h1>
                <p className="text-[9px] sm:text-xs uppercase font-sans tracking-[0.25em] text-cyan-400 font-semibold mb-3 sm:mb-4">
                  L'HÉRITAGE STRATÉGIQUE AFRICAIN
                </p>
                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-lg mx-auto">
                  Entrez dans le cercle des souverains d'Afrique Centrale. Mesurez-vous à l'intelligence artificielle supérieure du Sage Ékang ou défiez vos amis en ligne et en local.
                </p>
              </div>

              {/* Quick Profile display in Home Portal */}
              <div className="w-full bg-[#201006]/80 rounded-xl border border-[#6B3F1D]/30 p-3 sm:p-4 flex items-center justify-between shadow-lg" id="portal-profile-dock">
                <div className="flex flex-col text-left">
                  <span className="text-[10px] text-stone-400 font-medium">Guerrier Actif :</span>
                  <div className="flex gap-1.5 items-center mt-0.5">
                    <span className="text-base">🦁</span>
                    <span className="font-mono text-xs sm:text-sm font-bold text-[#fbbf24] uppercase">{playerName}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    setIsMenuOpen(true);
                    setDropdownTab('OPTIONS');
                  }}
                  className="px-2.5 sm:px-3 py-1 bg-stone-900 border border-stone-700 hover:border-[#fbbf24]/50 text-[10px] font-bold tracking-widest text-stone-300 hover:text-white rounded transition-colors"
                >
                  RÉGLAGES NOM / SON
                </button>
              </div>

              {/* Portal Launching Anchors */}
              <div className="flex flex-col gap-2.5 w-full animate-fade-in" id="portal-selection-anchors">
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    setGameMode('IA');
                    setLocalGameState(createInitialState());
                    setActiveTab('JOUER');
                    setIsMenuOpen(false); // directly dive into play focus!
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[#fbbf24]/30 bg-gradient-to-r from-[#b45309] to-[#78350f] hover:from-[#d97706] hover:to-[#92400e] text-amber-50 font-bold tracking-wide shadow-lg group transition-all"
                >
                  <span className="flex items-center gap-2 text-xs sm:text-sm"><Brain className="w-4 h-4 sm:w-5 sm:h-5 text-[#fbbf24]" /> COMBATTRE LE SAGE ÉKANG IA</span>
                  <ChevronRight className="w-4 h-4 text-[#fbbf24] group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="grid grid-cols-2 gap-2.5" id="portal-subchoices">
                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      setGameMode('LOCAL');
                      setLocalGameState(createInitialState());
                      setActiveTab('JOUER');
                      setIsMenuOpen(false); // close dropdown to play instantly!
                    }}
                    className="flex flex-col items-center gap-1.5 p-3.5 rounded-xl border border-[#6B3F1D]/40 bg-[#201006]/90 text-stone-250 hover:text-white hover:bg-[#3A2314]/80 transition-all shadow-md group"
                  >
                    <Swords className="w-5 h-5 text-[#fbbf24] group-hover:scale-105 transition-transform" />
                    <span className="text-[10px] sm:text-xs font-bold font-sans">DÉFI MULTI-LOCAL</span>
                  </button>

                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      setGameMode('EN_LIGNE');
                      setActiveTab('JOUER');
                      setIsMenuOpen(true); // Open drawer so they can create/join room code!
                      setDropdownTab('COMBAT');
                    }}
                    className="flex flex-col items-center gap-1.5 p-3.5 rounded-xl border border-[#6B3F1D]/40 bg-[#201006]/90 text-stone-250 hover:text-white hover:bg-[#3A2314]/80 transition-all shadow-md group"
                  >
                    <UserPlus className="w-5 h-5 text-[#00FF9D] group-hover:scale-105 transition-transform" />
                    <span className="text-[10px] sm:text-xs font-bold font-sans">SALON EN LIGNE</span>
                  </button>
                </div>
              </div>

              {/* Cultural quote card */}
              <div className="rounded-xl border border-[#6B3F1D]/15 bg-[#120b06]/40 p-3 max-w-sm mt-1" id="home-cultural-card">
                <p className="text-[10.5px] text-stone-400 italic">
                  « Le Songo n'est pas un simple amusement de graines, c'est l'intelligence de la forêt décimée pour la royauté. »
                </p>
              </div>

              <span className="text-[9px] font-mono text-stone-600">
                © SONGhO Championship™ 2026 Cameroun-Beti S.A. Partages autorisés.
              </span>
            </motion.div>
          </div>
        )}

        {/* TAB 2: GAME BOARD VIEW OR INPLAY HUD */}
        {activeTab === 'JOUER' && (
          <div className="flex-grow flex flex-col items-center justify-start p-2 sm:p-4 max-w-4xl mx-auto w-full overflow-y-auto z-10" id="combat-theater">
            
            {/* CENTRAL THEATER: SINGLE WELL-ORGANIZED COLUMN */}
            <div className="w-full flex flex-col gap-2 min-w-0" id="theater-left-girdle">
              
              {/* Score Dashboard & Player Meta */}
              <Header
                scoreNord={currentScoreNord}
                scoreSud={currentScoreSud}
                activePlayer={activeTurn}
                winner={activeWinner}
                playerNorthName={
                  gameMode === 'IA' 
                    ? `SAGE IA (${aiDifficulty})` 
                    : gameMode === 'EN_LIGNE' && roomState 
                    ? roomState.playerNorth?.name || 'En attente...' 
                    : 'JOUEUR NORD'
                }
                playerSouthName={
                  gameMode === 'EN_LIGNE' && roomState 
                    ? roomState.playerSouth?.name || 'En attente...' 
                    : playerName
                }
                isOnlineMode={gameMode === 'EN_LIGNE'}
              />

              {/* Status Banner */}
              <div 
                className="w-full rounded-md bg-black/45 border border-[#6B3F1D]/15 py-1 px-3 text-center text-[10px] sm:text-[11px] text-stone-300 font-sans tracking-wide my-1"
                id="turn-status-bar"
              >
                {activeStatus}
              </div>

              {/* Center Game Board Container */}
              <div className="w-full flex justify-center py-2" id="board-center-container">
                <Board
                  board={activeBoard}
                  activePlayer={activeTurn}
                  onPitClick={handlePitSelection}
                  validMoves={isAnimating ? [] : validMovesList}
                  animatingPit={animatingPit}
                  capturedPits={capturedPitsList}
                  lastSelectedPit={lastSelectedPit}
                  playerSide={gameMode === 'EN_LIGNE' ? (myRole === 'SPECTATEUR' ? undefined : (myRole as PlayerSide)) : undefined}
                  recommendedPitIdx={glowingRecommendation}
                />
              </div>

              {/* Sage Ekang Advisor Frame */}
              <div className="w-full mt-2 shrink-0" id="ekang-advisor-frame">
                <SageEkangPanel
                  board={activeBoard}
                  scoreNord={currentScoreNord}
                  scoreSud={currentScoreSud}
                  activePlayer={activeTurn}
                  onShowRecommendedPit={setGlowingRecommendation}
                  difficulty={aiDifficulty}
                />
              </div>

              {/* Dynamic Sage's blessing indicator */}
              {glowingRecommendation !== null && (
                <div className="mt-1 pb-1 text-center text-[10px] sm:text-[11px] text-[#fbbf24] font-semibold flex items-center justify-center gap-1.5 animate-pulse shrink-0" id="glowing-recs-indicatortext">
                  <span className="w-2 h-2 rounded-full bg-[#fbbf24] animate-ping" />
                  <span>Le Sage a béni une case ! Elle brille sur votre plateau d'un halo mystique.</span>
                </div>
              )}

              {/* Floating Abandon Button at the bottom of the column */}
              {((gameMode === 'EN_LIGNE' && roomState) || gameMode === 'LOCAL' || (gameMode === 'IA' && localGameState.board.some(s => s > 0))) ? (
                <div className="w-full flex justify-center mt-2" id="abandon-btn-dock">
                  <button
                    onClick={handleLeaveRoom}
                    className="flex items-center justify-center gap-1.5 bg-red-950/20 hover:bg-red-900 border border-red-800/60 text-red-200 font-bold uppercase py-1 px-4 rounded-lg text-[9px] sm:text-[10px] tracking-widest transition-all"
                  >
                    ABANDONNER LA PARTIE EN COURS
                  </button>
                </div>
              ) : null}

            </div>
          </div>
        )}

        {/* TAB 3: RULES SCREEN LAYER */}
        {activeTab === 'REGLES' && <RuleScreen />}

        {/* TAB 4: LEADERBOARD SCREEN LAYER */}
        {activeTab === 'CLASSEMENT' && <LeaderboardScreen />}

        {/* TAB 5: SETTINGS CONFIG SCREEN LAYER */}
        {activeTab === 'PARAMETRES' && (
          <SettingsScreen
            soundVol={soundVol}
            setSoundVol={setSoundVol}
            musicVol={musicVol}
            setMusicVol={setMusicVol}
            playerName={playerName}
            setPlayerName={handleNameUpdate}
          />
        )}

      </div>

      {/* DETACHED IMMERSIVE RULE OVERLAY MODAL */}
      <AnimatePresence>
        {isRulesModalOpen && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md" id="rules-modal-backdrop">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl h-[85vh] bg-[#0A0503] border border-[#6B3F1D]/75 rounded-2xl shadow-2xl flex flex-col overflow-hidden relative"
              id="rules-modal-panel"
            >
              <div className="p-3 bg-[#201006] border-b border-[#6B3F1D]/30 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-yellow-500 text-sm">❖</span>
                  <span className="text-xs sm:text-sm font-bold tracking-widest text-[#fbbf24] font-sans">LIVRET GENERAL DES REGLES</span>
                </div>
                <button
                  onClick={() => { soundEngine.playClick(); setIsRulesModalOpen(false); }}
                  className="px-2.5 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-stone-900 border border-stone-750 hover:bg-red-950/50 hover:border-red-850 hover:text-red-100 rounded transition-all"
                >
                  Fermer X
                </button>
              </div>
              <div className="flex-grow overflow-hidden relative" id="rules-modal-content-stage">
                <RuleScreen />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETACHED IMMERSIVE LEADERBOARD OVERLAY MODAL */}
      <AnimatePresence>
        {isLeaderboardModalOpen && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-2 sm:p-4 bg-[#010102]/85 backdrop-blur-md" id="leaderboard-modal-backdrop">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl h-[85vh] bg-[#0A0503] border border-[#6B3F1D]/75 rounded-2xl shadow-2xl flex flex-col overflow-hidden relative"
              id="leaderboard-modal-panel"
            >
              <div className="p-3 bg-[#201006] border-b border-[#6B3F1D]/30 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-yellow-500 text-sm">❖</span>
                  <span className="text-xs sm:text-sm font-bold tracking-widest text-[#fbbf24] font-sans">CLASSEMENT HISTORIQUE DE LEGENDE</span>
                </div>
                <button
                  onClick={() => { soundEngine.playClick(); setIsLeaderboardModalOpen(false); }}
                  className="px-2.5 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-stone-900 border border-stone-750 hover:bg-red-950/50 hover:border-red-850 hover:text-red-100 rounded transition-all"
                >
                  Fermer X
                </button>
              </div>
              <div className="flex-grow overflow-hidden relative" id="leaderboard-modal-content-stage">
                <LeaderboardScreen />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
