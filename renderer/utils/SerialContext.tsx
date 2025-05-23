import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// シリアル通信の状態を表す型
interface SerialState {
  isConnected: boolean;
  port: string | null;
  baudRate: number | null;
  error: string | null;
  messages: string[];
}

// コンテキストの型定義
interface SerialContextType {
  serialState: SerialState;
  connect: (port: string, baudRate: number) => Promise<void>;
  disconnect: () => Promise<void>;
  write: (data: string) => Promise<void>;
  refreshPorts: () => Promise<string[]>;
  messages: string[];
  clearMessages?: () => void;
}

// コンテキストの作成
const SerialContext = createContext<SerialContextType | undefined>(undefined);

// プロバイダーコンポーネント
export function SerialProvider({ children }: { children: React.ReactNode }) {
  // シリアル通信の状態
  const [serialState, setSerialState] = useState<SerialState>({
    isConnected: false,
    port: null,
    baudRate: null,
    error: null,
    messages: [],
  });

  // シリアルポートに接続
  const connect = useCallback(async (port: string, baudRate: number) => {
    try {
      await window.serialPort.connect(port, baudRate);
      setSerialState(prev => ({
        isConnected: true,
        port,
        baudRate,
        error: null,
        messages: prev.messages,
      }));
    } catch (error) {
      setSerialState(prev => ({
        ...prev,
        error: error.message || '接続に失敗しました',
      }));
      throw error;
    }
  }, []);

  // シリアルポートから切断
  const disconnect = useCallback(async () => {
    try {
      await window.serialPort.disconnect();
      setSerialState(prev => ({
        isConnected: false,
        port: null,
        baudRate: null,
        error: null,
        messages: [],
      }));
    } catch (error) {
      setSerialState(prev => ({
        ...prev,
        error: error.message || '切断に失敗しました',
      }));
      throw error;
    }
  }, []);

  // データを書き込み
  const write = useCallback(async (data: string) => {
    try {
      await window.serialPort.write(data);
    } catch (error) {
      setSerialState(prev => ({
        ...prev,
        error: error.message || 'データの送信に失敗しました',
      }));
      throw error;
    }
  }, []);

  // 利用可能なポートを取得
  const refreshPorts = useCallback(async () => {
    try {
      return await window.serialPort.listPorts();
    } catch (error) {
      setSerialState(prev => ({
        ...prev,
        error: error.message || 'ポートの取得に失敗しました',
      }));
      throw error;
    }
  }, []);

  // データ受信時のハンドラーを設定
  useEffect(() => {
    const unsubscribe = window.serialPort.onData((data: string) => {
      // 受信したデータを処理
      console.log('受信データ:', data);
      setSerialState(prev => ({
        ...prev,
        messages: [...prev.messages, data],
      }));
      // ここで必要な処理を追加
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // 接続状態の監視
  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await window.serialPort.isConnected();
      setSerialState(prev => ({
        ...prev,
        isConnected,
      }));
    };

    checkConnection();
  }, []);

  // メッセージをクリアする関数
  const clearMessages = useCallback(() => {
    setSerialState(prev => ({
      ...prev,
      messages: []
    }));
  }, []);

  return (
    <SerialContext.Provider value={{
      serialState,
      connect,
      disconnect,
      write,
      refreshPorts,
      messages: serialState.messages,
      clearMessages,
    }}>
      {children}
    </SerialContext.Provider>
  );
}

// カスタムフック
export function useSerial() {
  const context = useContext(SerialContext);
  if (!context) {
    throw new Error('useSerial must be used within a SerialProvider');
  }
  return context;
}