export type GamePlatform =
  | "PC"
  | "PlayStation 5"
  | "Xbox";

export interface Game {
  id: string;
  _id?: string;
  name: string;
  platform: GamePlatform;
  description: string;
  isActive: boolean;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateGameData {
  name: string;
  platform: GamePlatform;
  description: string;
  isActive: boolean;
  image?: string;
}

export type UpdateGameData =
  Partial<CreateGameData>;