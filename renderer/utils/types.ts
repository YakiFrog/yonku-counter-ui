// アプリケーション全体で使用する型定義
export type Vehicle = {
  id: string;
  name: string;
};

export type Player = {
  id: string;
  name: string;
  teamName?: string; // チーム名を追加（オプショナル）
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
  teamName?: string; // チーム名を追加（オプショナル）
  vehicleId: string | null;
  vehicleName: string;
  totalTime: string;
  laps: RaceLap[];
  bestLap: RaceLap | null;
  isCompleted?: boolean; // 全周回を完了したかどうか
};

export type Race = {
  id: string;
  name: string;
  date: string;
  raceNumber: number;  // レース番号を追加
  raceType?: string;   // レースタイプを追加（通常/敗者復活戦/準決勝/決勝）
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
