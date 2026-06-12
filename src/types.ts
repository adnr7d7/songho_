export type ActiveTab = 'ACCUEIL' | 'JOUER' | 'REGLES' | 'CLASSEMENT' | 'PARAMETRES';
export type GameMode = 'IA' | 'LOCAL' | 'EN_LIGNE';
export type AIDifficulty = 'FACILE' | 'MOYEN' | 'DIFFICILE' | 'EXPERT';

export interface RoomState {
  id: string;
  gameState: {
    board: number[];
    scoreNord: number;
    scoreSud: number;
    activePlayer: 'SUD' | 'NORD';
    history: string[];
    winner: 'SUD' | 'NORD' | 'NUL' | null;
    statusMessage: string;
  };
  playerSouth: { id: string; name: string; isOnline: boolean } | null;
  playerNorth: { id: string; name: string; isOnline: boolean } | null;
  spectators: { id: string; name: string }[];
  chat: { id: string; sender: string; text: string; timestamp: string }[];
}
