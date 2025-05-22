import { ChakraProvider } from '@chakra-ui/react';
import { AppProps } from 'next/app';
import { useState, useEffect, createContext } from 'react';

import theme from '../lib/theme';

// 設定コンテキストの作成
export const SettingsContext = createContext<{
  settings: any;
  updateSettings: (newSettings: any) => void;
}>({
  settings: {},
  updateSettings: () => {},
});

function MyApp({ Component, pageProps }: AppProps) {
  const [settings, setSettings] = useState({});

  // 初回ロード時に設定を読み込む
  useEffect(() => {
    const savedSettings = localStorage.getItem('settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
        console.log('アプリ全体で設定をロードしました:', parsedSettings);
      } catch (error) {
        console.error('設定のロードに失敗しました:', error);
      }
    }
  }, []);

  // 設定を更新する関数
  const updateSettings = (newSettings: any) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('settings', JSON.stringify(newSettings));
      console.log('アプリ全体で設定を更新しました:', newSettings);
    } catch (error) {
      console.error('設定の保存に失敗しました:', error);
    }
  };

  return (
    <ChakraProvider theme={theme}>
      <SettingsContext.Provider value={{ settings, updateSettings }}>
        <Component {...pageProps} />
      </SettingsContext.Provider>
    </ChakraProvider>
  );
}

export default MyApp;
