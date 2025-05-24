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
  currentRaceNumber: number;
  updateRaceNumber: (newNumber: number) => void;
  deleteRace: (raceId: string) => AppSettings; // 追加: 個別のレースを削除する関数
}

// コンテキストの作成
const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

// プロバイダーコンポーネント
export const AppSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const settingsUtils = useAppSettings();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // レース番号を更新する関数
  const updateRaceNumber = useCallback((newNumber: number) => {
    if (!settings) return;
    // 現在の設定の全ての値を保持したまま、レース番号だけを更新
    const result = settingsUtils.updateSettings({ currentRaceNumber: newNumber });
    setSettings(result);
  }, [settings, settingsUtils]);

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

  // プレイヤー操作のラッパー関数
  const addPlayerWrapper = useCallback((player) => {
    const result = settingsUtils.addPlayer(player);
    setSettings(result); // 即座にローカル状態を更新
    return result;
  }, [settingsUtils]);

  const updatePlayerWrapper = useCallback((playerId, data) => {
    const result = settingsUtils.updatePlayer(playerId, data);
    setSettings(result); // 即座にローカル状態を更新
    return result;
  }, [settingsUtils]);

  const removePlayerWrapper = useCallback((playerId) => {
    const result = settingsUtils.removePlayer(playerId);
    setSettings(result); // 即座にローカル状態を更新
    return result;
  }, [settingsUtils]);

  const updateCourseWrapper = useCallback((courseId, data) => {
    const result = settingsUtils.updateCourse(courseId, data);
    setSettings(result); // 即座にローカル状態を更新
    return result;
  }, [settingsUtils]);

  // レース削除のラッパー関数
  const deleteRaceWrapper = useCallback((raceId: string) => {
    if (!settings) return settings;
    const updatedSettings = {
      ...settings,
      races: settings.races.filter(race => race.id !== raceId)
    };
    const savedSettings = settingsUtils.updateSettings(updatedSettings);
    setSettings(savedSettings);
    return savedSettings;
  }, [settings, settingsUtils]);

  return (
    <AppSettingsContext.Provider value={{ 
      ...settingsUtils,
      settings: settings || settingsUtils.settings,
      isLoading, 
      clearRaceResults,
      addPlayer: addPlayerWrapper,
      updatePlayer: updatePlayerWrapper,
      removePlayer: removePlayerWrapper,
      updateCourse: updateCourseWrapper,
      currentRaceNumber: (settings || settingsUtils.settings)?.currentRaceNumber || 1,
      updateRaceNumber,
      deleteRace: deleteRaceWrapper // 追加：レース削除関数
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
