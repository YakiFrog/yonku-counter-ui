import { useState, useEffect } from 'react';
import { AppSettings, Player, Course, Race } from './types';

// デフォルトの設定値
const defaultSettings: AppSettings = {
  courses: [
    { id: 1, playerId: null, vehicleId: null },
    { id: 2, playerId: null, vehicleId: null },
    { id: 3, playerId: null, vehicleId: null },
    { id: 4, playerId: null, vehicleId: null }
  ],
  players: [],
  lapCount: 5,
  soundEnabled: false,
  races: []
};

// ローカルストレージのキー
const STORAGE_KEY = 'yonkuAppSettings';

/**
 * アプリケーション設定を管理するカスタムフック
 */
export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // 初期化時にローカルストレージから設定を読み込む
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem(STORAGE_KEY);
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings) as AppSettings;
          setSettings(parsedSettings);
        }
      } catch (error) {
        console.error('設定のロードに失敗しました:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // 設定を更新してローカルストレージに保存する
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('設定の保存に失敗しました:', error);
    }
    
    return updated;
  };

  // 特定のコースを更新する
  const updateCourse = (courseId: number, data: Partial<Course>) => {
    const updatedCourses = settings.courses.map(course => 
      course.id === courseId ? { ...course, ...data } : course
    );
    
    return updateSettings({ courses: updatedCourses });
  };

  // 選手を追加する
  const addPlayer = (player: Player) => {
    const updatedPlayers = [...settings.players, player];
    return updateSettings({ players: updatedPlayers });
  };

  // 選手を更新する
  const updatePlayer = (playerId: string, data: Partial<Player>) => {
    const updatedPlayers = settings.players.map(player =>
      player.id === playerId ? { ...player, ...data } : player
    );
    
    return updateSettings({ players: updatedPlayers });
  };

  // 選手を削除する
  const removePlayer = (playerId: string) => {
    const updatedPlayers = settings.players.filter(player => player.id !== playerId);
    
    // 関連するコースの割り当ても削除
    const updatedCourses = settings.courses.map(course => 
      course.playerId === playerId ? { ...course, playerId: null, vehicleId: null } : course
    );
    
    return updateSettings({ 
      players: updatedPlayers,
      courses: updatedCourses
    });
  };

  // レース結果を保存する
  const saveRaceResult = (race: Race) => {
    const updatedRaces = [...settings.races, race];
    return updateSettings({ races: updatedRaces });
  };

  // 全設定をリセットする
  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem(STORAGE_KEY);
    return defaultSettings;
  };

  return {
    settings,
    isLoading,
    updateSettings,
    updateCourse,
    addPlayer,
    updatePlayer,
    removePlayer,
    saveRaceResult,
    resetSettings
  };
}
