import React, { createContext, useContext, ReactNode } from 'react';
import { useAppSettings } from './settings';
import { AppSettings, Player, Course, Race } from './types';

// コンテキストの型定義
interface AppSettingsContextType {
  settings: AppSettings;
  isLoading: boolean;
  updateSettings: (newSettings: Partial<AppSettings>) => AppSettings;
  updateCourse: (courseId: number, data: Partial<Course>) => AppSettings;
  addPlayer: (player: Player) => AppSettings;
  updatePlayer: (playerId: string, data: Partial<Player>) => AppSettings;
  removePlayer: (playerId: string) => AppSettings;
  saveRaceResult: (race: Race) => AppSettings;
  resetSettings: () => AppSettings;
}

// コンテキストの作成
const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

// プロバイダーコンポーネント
export const AppSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const settingsUtils = useAppSettings();
  
  return (
    <AppSettingsContext.Provider value={settingsUtils}>
      {children}
    </AppSettingsContext.Provider>
  );
};

// カスタムフックでコンテキストを使用
export const useAppSettingsContext = () => {
  const context = useContext(AppSettingsContext);
  
  if (context === undefined) {
    throw new Error('useAppSettingsContext must be used within a AppSettingsProvider');
  }
  
  return context;
};
