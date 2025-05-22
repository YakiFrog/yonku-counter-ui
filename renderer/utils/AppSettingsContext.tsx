import React, { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
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
  clearRaceResults: () => AppSettings;  // 追加: レース記録をクリアする関数
  resetSettings: () => AppSettings;
}

// コンテキストの作成
const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

// プロバイダーコンポーネント
export const AppSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const settingsUtils = useAppSettings();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // settingsUtilsの値が変更されたら、ローカルのステートを更新
  useEffect(() => {
    if (!settingsUtils.isLoading) {
      setSettings(settingsUtils.settings);
      setIsLoading(false);
    }
  }, [settingsUtils.settings, settingsUtils.isLoading]);

  const clearRaceResults = useCallback(() => {
    if (!settings) return settings;
    const updatedSettings = {
      ...settings,
      races: [] // レース記録を空配列にする
    };
    const savedSettings = settingsUtils.updateSettings(updatedSettings);
    setSettings(savedSettings);
    return savedSettings;
  }, [settings]);

  return (
    <AppSettingsContext.Provider value={{ 
      ...settingsUtils,
      settings: settings || settingsUtils.settings,  // nullの場合はsettingsUtilsの値を使用
      isLoading, 
      clearRaceResults
    }}>
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
