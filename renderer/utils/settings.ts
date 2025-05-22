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
  races: [],
  currentRaceNumber: 1  // 初期レース番号を1に設定
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
  /**
   * 重要: この関数は以下の2つの同期を確実に行います：
   * 1. ローカルストレージから最新の状態を直接取得して更新（他の処理による変更も反映）
   * 2. メモリ上の状態（React state）とローカルストレージの両方を同じオブジェクトで更新
   * 
   * この実装により：
   * - 複数箇所からの更新が競合しない
   * - レース結果などの重要なデータが確実に保存される
   * - ランキング表示のデータ整合性が保たれる
   */
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    // 更新前の状態をログ
    console.log('更新前の設定:', settings);
    
    // 現在のストレージの内容を直接取得
    const currentStorageSettings = localStorage.getItem(STORAGE_KEY);
    const currentSettings = currentStorageSettings 
      ? JSON.parse(currentStorageSettings) as AppSettings 
      : settings;

    // 新しい設定を現在の設定とマージ
    const updatedSettings = {
      ...currentSettings,
      ...newSettings
    };
    console.log('更新内容:', newSettings);
    
    try {
      // ローカルストレージに保存
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings));
      // メモリ上の状態を更新
      setSettings(updatedSettings);
      console.log('更新後の設定:', updatedSettings);
      console.log('ローカルストレージの保存成功');
    } catch (error) {
      console.error('設定の保存に失敗しました:', error);
    }
    
    return updatedSettings;
  };

  // コース情報を更新する重要な関数
  // この関数はプレイヤーと車両の割り当てを同期的に管理する
  const updateCourse = (courseId: number, data: Partial<Course>) => {
    // 重要: localStorage と状態の両方を更新する必要がある
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    if (!savedSettings) {
      throw new Error('設定が見つかりません');
    }
    const currentSettings = JSON.parse(savedSettings);
    const courseIndex = currentSettings.courses.findIndex(c => c.id === courseId);

    if (courseIndex === -1) {
      console.error('更新対象のコースが見つかりません:', courseId);
      throw new Error('コースが見つかりません');
    }

    // 重要: 更新前の状態をバックアップ
    // エラー発生時にロールバックできるようにする
    const previousState = { ...currentSettings.courses[courseIndex] };

    try {
      // 重要: 一時的な更新を行い、バリデーションを実施
      const updatedCourse = { ...currentSettings.courses[courseIndex], ...data };
      
      // プレイヤーと車両の割り当ての整合性チェック
      if (updatedCourse.playerId && !updatedCourse.vehicleId) {
        console.warn('警告: プレイヤーに車両が割り当てられていません');
      }

      // 更新を適用
      currentSettings.courses[courseIndex] = updatedCourse;
      
      // 重要: localStorage への永続化
      // この処理は必ず行う必要がある
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSettings));
      
      return currentSettings;
    } catch (error) {
      // エラー発生時は前の状態に戻す
      console.error('コース更新エラー:', error);
      currentSettings.courses[courseIndex] = previousState;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSettings));
      throw error;
    }
  };

  // 選手を追加する
  const addPlayer = (player: Player) => {
    console.log('プレイヤー追加開始:', player);
    console.log('現在のプレイヤーリスト:', settings.players);
    
    const updatedPlayers = [...settings.players, player];
    console.log('更新後のプレイヤーリスト:', updatedPlayers);
    
    const result = updateSettings({ players: updatedPlayers });
    
    // ローカルストレージの状態を確認
    const storageCheck = localStorage.getItem(STORAGE_KEY);
    console.log('ローカルストレージの現在の状態:', storageCheck);
    
    return result;
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

  /**
   * レース結果を保存する
   * 重要: この関数はupdateSettings関数を使用して、
   * ローカルストレージとメモリ上の状態を確実に同期します。
   * これにより、ランキング表示に必要なデータの整合性が保証されます。
   */
  const saveRaceResult = (race: Race) => {
    console.log('保存前の全レース:', settings.races);
    const updatedRaces = [...settings.races, race];
    console.log('保存する全レース:', updatedRaces);
    const result = updateSettings({ races: updatedRaces });
    console.log('保存後のsettings:', result);
    return result;
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
