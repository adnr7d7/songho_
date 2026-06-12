import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { createInitialState, GameState, performMove, getRecommendedMove, PlayerSide } from './src/songoEngine.js';

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Google GenAI
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Songo Multiplayer Room State Definition
interface Player {
  id: string;
  name: string;
  isOnline: boolean;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

interface Room {
  id: string;
  gameState: GameState;
  playerSouth: Player | null; // SUD
  playerNorth: Player | null; // NORD
  spectators: { id: string; name: string }[];
  chat: ChatMessage[];
  lastActivity: Date;
}

// In-Memory Lobby Store
const rooms: Map<string, Room> = new Map();

// Generate room code like "X7K92P"
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No confusing characters like 0, O, 1, I
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Cleanup inactive rooms periodically (1 hour inactivity)
setInterval(() => {
  const now = new Date();
  for (const [id, room] of rooms.entries()) {
    if (now.getTime() - room.lastActivity.getTime() > 3600000) {
      rooms.delete(id);
    }
  }
}, 600000);

// API ROUTES FOR GENERAL HEALTH & DIAGNOSTICS
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// CREATE ROOM
app.post('/api/rooms', (req, res) => {
  const { playerName, playerId } = req.body;
  if (!playerName || !playerId) {
    return res.status(400).json({ error: 'playerName et playerId requis' });
  }

  const roomId = generateRoomCode();
  const newRoom: Room = {
    id: roomId,
    gameState: createInitialState(),
    playerSouth: { id: playerId, name: playerName, isOnline: true },
    playerNorth: null,
    spectators: [],
    chat: [
      {
        id: 'sys-start',
        sender: 'SAGE ÉKANG',
        text: `Bienvenue dans le salon ${roomId}. En attente du second joueur...`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ],
    lastActivity: new Date(),
  };

  rooms.set(roomId, newRoom);
  res.json({ roomId, room: newRoom });
});

// JOIN ROOM
app.post('/api/rooms/:roomId/join', (req, res) => {
  const { roomId } = req.params;
  const { playerName, playerId } = req.body;

  if (!playerName || !playerId) {
    return res.status(400).json({ error: 'playerName et playerId requis' });
  }

  const room = rooms.get(roomId.toUpperCase());
  if (!room) {
    return res.status(404).json({ error: 'Salon introuvable.' });
  }

  room.lastActivity = new Date();

  // If player is already South, reconnect or update status
  if (room.playerSouth?.id === playerId) {
    room.playerSouth.isOnline = true;
    room.playerSouth.name = playerName;
    return res.json({ role: 'SUD', room });
  }

  // If player is already North, reconnect or update status
  if (room.playerNorth?.id === playerId) {
    room.playerNorth.isOnline = true;
    room.playerNorth.name = playerName;
    return res.json({ role: 'NORD', room });
  }

  // Assign to North if empty
  if (!room.playerNorth) {
    room.playerNorth = { id: playerId, name: playerName, isOnline: true };
    room.chat.push({
      id: `sys-join-${playerId}`,
      sender: 'SAGE ÉKANG',
      text: `${playerName} a rejoint le combat en tant que Joueur NORD !`,
      timestamp: new Date().toLocaleTimeString(),
    });
    return res.json({ role: 'NORD', room });
  }

  // Otherwise, join as a Spectator
  const isAlreadySpectator = room.spectators.some((s) => s.id === playerId);
  if (!isAlreadySpectator) {
    room.spectators.push({ id: playerId, name: playerName });
    room.chat.push({
      id: `sys-spec-${playerId}`,
      sender: 'SAGE ÉKANG',
      text: `${playerName} observe la partie en tant que spectateur.`,
      timestamp: new Date().toLocaleTimeString(),
    });
  }

  res.json({ role: 'SPECTATEUR', room });
});

// GET ROOM STATE
app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId.toUpperCase());
  if (!room) {
    return res.status(404).json({ error: 'Salon introuvable' });
  }
  res.json({ room });
});

// MAKE ONLINE MOVE
app.post('/api/rooms/:roomId/move', (req, res) => {
  const { roomId } = req.params;
  const { playerId, pitIndex } = req.body;

  const room = rooms.get(roomId.toUpperCase());
  if (!room) {
    return res.status(404).json({ error: 'Salon introuvable' });
  }

  room.lastActivity = new Date();

  // Determine which side player is playing
  let side: PlayerSide | null = null;
  if (room.playerSouth?.id === playerId) {
    side = 'SUD';
  } else if (room.playerNorth?.id === playerId) {
    side = 'NORD';
  }

  if (!side) {
    return res.status(403).json({ error: 'Vous ne jouez pas dans ce salon' });
  }

  // Check turn
  if (room.gameState.activePlayer !== side) {
    return res.status(400).json({ error: 'Ce ne pas votre tour !' });
  }

  if (room.gameState.winner) {
    return res.status(400).json({ error: 'La partie est déjà terminée' });
  }

  // Perform move using the local Songo game rules
  const result = performMove(room.gameState, pitIndex);
  if (!result.success) {
    return res.status(400).json({ error: 'Coup non valide. Solidarité ou case vide ?' });
  }

  room.gameState = result.nextState;

  // Append a system chat notification for large captures
  if (result.capturedSeedsCount > 0) {
    room.chat.push({
      id: `sys-capture-${Date.now()}`,
      sender: 'SAGE ÉKANG',
      text: `Magnifique ! ${side} capture ${result.capturedSeedsCount} graines !`,
      timestamp: new Date().toLocaleTimeString(),
    });
  }

  res.json({ room, sowingPath: result.sowingPath, capturedPits: result.capturedPits });
});

// CHAT MESSAGE
app.post('/api/rooms/:roomId/chat', (req, res) => {
  const { roomId } = req.params;
  const { sender, text } = req.body;

  const room = rooms.get(roomId.toUpperCase());
  if (!room) {
    return res.status(404).json({ error: 'Salon introuvable' });
  }

  room.lastActivity = new Date();

  const newMessage: ChatMessage = {
    id: `msg-${Date.now()}`,
    sender,
    text,
    timestamp: new Date().toLocaleTimeString(),
  };

  room.chat.push(newMessage);
  // Keep last 100 messages
  if (room.chat.length > 100) {
    room.chat.shift();
  }

  res.json({ chat: room.chat });
});

// ABANDON / QUIT ROOM
app.post('/api/rooms/:roomId/leave', (req, res) => {
  const { roomId } = req.params;
  const { playerId } = req.body;

  const room = rooms.get(roomId.toUpperCase());
  if (!room) {
    return res.status(404).json({ error: 'Salon introuvable' });
  }

  room.lastActivity = new Date();

  if (room.playerSouth?.id === playerId) {
    room.playerSouth.isOnline = false;
    room.gameState.winner = 'NORD';
    room.gameState.statusMessage = 'Le joueur SUD a quitté. Victoire du joueur NORD !';
    room.chat.push({
      id: `sys-leave-${playerId}`,
      sender: 'SAGE ÉKANG',
      text: `${room.playerSouth.name} (SUD) a déclaré forfait !`,
      timestamp: new Date().toLocaleTimeString(),
    });
  } else if (room.playerNorth?.id === playerId) {
    room.playerNorth.isOnline = false;
    room.gameState.winner = 'SUD';
    room.gameState.statusMessage = 'Le joueur NORD a quitté. Victoire du joueur SUD !';
    room.chat.push({
      id: `sys-leave-${playerId}`,
      sender: 'SAGE ÉKANG',
      text: `${room.playerNorth.name} (NORD) a déclaré forfait !`,
      timestamp: new Date().toLocaleTimeString(),
    });
  }

  res.json({ room });
});

// REMATCH / PLAY AGAIN
app.post('/api/rooms/:roomId/reset', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId.toUpperCase());
  if (!room) {
    return res.status(404).json({ error: 'Salon introuvable' });
  }

  room.lastActivity = new Date();
  room.gameState = createInitialState();
  room.chat.push({
    id: `sys-reset-${Date.now()}`,
    sender: 'SAGE ÉKANG',
    text: "Une nouvelle bataille commence ! Que l'esprit des Ekang vous guide !",
    timestamp: new Date().toLocaleTimeString(),
  });

  res.json({ room });
});

// ORACLE SAGE ÉKANG ADVISOR ENDPOINT (Gemini-powered)
app.post('/api/sage-advice', async (req, res) => {
  const { board, scoreNord, scoreSud, activePlayer, difficulty } = req.body;

  if (!board || !activePlayer) {
    return res.status(400).json({ error: 'board et activePlayer requis' });
  }

  // 1. Compute the MATHEMATICALLY best move first
  // Reconstruct minimal game state for computation
  const tempGameState: GameState = {
    board,
    scoreNord: scoreNord || 0,
    scoreSud: scoreSud || 0,
    activePlayer,
    history: [],
    winner: null,
    statusMessage: '',
  };

  const bestMoveIdx = getRecommendedMove(tempGameState, difficulty || 'DIFFICILE');
  if (bestMoveIdx === -1) {
    return res.json({
      bestMove: null,
      pitLabel: null,
      advice: 'Aucun coup disponible. Tu dois passer la main.',
    });
  }

  // Label the pit: 0..6 is S7..S1, 7..13 is N1..N7
  const isSouth = activePlayer === 'SUD';
  const pitLabel = isSouth ? `S${7 - bestMoveIdx}` : `N${bestMoveIdx - 6}`;

  // Analyze possible capture
  const outcome = performMove(tempGameState, bestMoveIdx);
  const captureSeeds = outcome.capturedSeedsCount;

  // 2. Call Gemini to draft a wonderful wise Songo proverb and tip in French
  let adviceText = `Le Sage Ékang te conseille de jouer la case ${pitLabel}. C'est une stratégie subtile qui renforce tes lignes.`;

  if (ai) {
    try {
      const prompt = `Tu es le "Sage Ékang", un grand maitre de Songo traditionnel camerounais et gardien de la sagesse des peuples de la forêt (Beti, Bulu, Ewondo). 
Un joueur te demande conseil pendant une partie de Songo Championship intense.
Voici les informations sur le plateau de jeu Songo actuel :
- Joueur actif : ${activePlayer}
- État du plateau (14 cases, 5 graines par case au départ, indices 0-6 SUD, indices 7-13 NORD) : [${board.join(', ')}]
- Score Nord : ${scoreNord || 0} / 40
- Score Sud : ${scoreSud || 0} / 40
- Le coup que tu recommandes (et qui est mathématiquement excellent) est l'indice : ${bestMoveIdx} (qui s'appelle "${pitLabel}" pour le joueur ${activePlayer}).
- Si le joueur joue ce coup, il va capturer : ${captureSeeds} graines.

Rédige une recommandation en français de style "Directeur Artistique AAA / Légende de la stratégie". Elle doit :
1. Être courte, inspirante et remplie de sagesse africaine et de métaphores (sur le semeur, la forêt, le léopard, les ancêtres ou les arbres géants du Cameroun).
2. Expliquer brièvement mais de façon poétique pourquoi la case ${pitLabel} est le meilleur choix (ex: bloquer l'ennemi, préparer une capture en chaîne, nourrir l'adversaire ou sécuriser la case 7).
3. Utiliser un langage chaleureux, théâtral et sage ("Mon enfant", "Guerrier", "L'oeil de la forêt...").
4. Ne pas dépasser 2 courtes phrases ou 35 mots pour rester lisible dans la bulle d'aide.

Donne uniquement le texte du conseil du Sage, pas de métadonnées, pas de code markdown d'introduction.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          temperature: 0.85,
        },
      });

      if (response.text) {
        adviceText = response.text.trim();
      }
    } catch (err: any) {
      console.error('Gemini error generating Sage advice:', err);
      // Fallback response with wisdom if API fails or isn't set up
      if (captureSeeds > 0) {
        adviceText = `« Le léopard ne bondit que lorsqu'il a calculé ses pas. » Joue la case ${pitLabel} pour capturer ${captureSeeds} graines et affamer ton adversaire avec grâce !`;
      } else {
        adviceText = `« Même la plus petite graine de l'arbre s'élance vers le ciel. » Repositionne tes forces avec la pit ${pitLabel} pour préparer de formidables attaques au prochain cycle, mon enfant.`;
      }
    }
  } else {
    // If no API key, use rich default presets
    if (captureSeeds > 0) {
      adviceText = `« Le léopard ne bondit que lorsqu'il a calculé ses pas. » Joue la case ${pitLabel} pour capturer ${captureSeeds} graines et affamer la ligne adverse avec force !`;
    } else {
      adviceText = `« Même la plus petite graine de l'arbre s'élance vers le ciel. » Repositionne tes forces avec la case ${pitLabel} pour préparer de formidables captures au prochain tour.`;
    }
  }

  res.json({
    bestMove: bestMoveIdx,
    pitLabel,
    advice: adviceText,
    possibleCapture: captureSeeds,
  });
});

// START EXPRESS/VITE HYBRID PIPELINE
async function startServer() {
  // Vite Integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite loaded in development middleware mode.');
  } else {
    // Production serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production builds from dist/');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SONGhO Championship server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
