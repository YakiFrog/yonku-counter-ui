// アプリケーション全体で使用する型定義
export type Vehicle = {
  id: string;
  name: string;
};

export type Player = {
  id: string;
  name: string;
  vehicle: Vehicle | null;
};

export type Course = {
  id: number;
  playerId: string | null;
  vehicleId: string | null;
};

export type RaceLap = {
  lapNumber: number;
  time: string; // "mm:ss.ms" 形式の文字列
  timestamp: number; // ミリ秒単位のタイムスタンプ
};

export type RaceResult = {
  id: string;
  raceId: string;
  position: number;
  playerId: string | null;
  playerName: string;
  vehicleId: string | null;
  vehicleName: string;
  totalTime: string;
  laps: RaceLap[];
  bestLap: RaceLap | null;
};

export type Race = {
  id: string;
  name: string;
  date: string;
  totalLaps: number;
  results: RaceResult[];
};

export type AppSettings = {
  courses: Course[];
  players: Player[];
  lapCount: number;
  soundEnabled: boolean;
  races: Race[];
};
