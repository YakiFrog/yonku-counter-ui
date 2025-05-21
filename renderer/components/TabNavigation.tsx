import React from 'react'
import { useRouter } from 'next/router'
import { 
  Tabs, 
  TabList, 
  Tab, 
  Box,
  Flex
} from '@chakra-ui/react'

type TabNavigationProps = {
  currentTab?: 'race' | 'ranking' | 'settings'
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ currentTab = 'race' }) => {
  const router = useRouter();
  
  // タブのインデックスをパスにマッピング
  const tabRoutes = {
    0: '/home',     // レース
    1: '/ranking',  // ランキング
    2: '/settings', // 設定
  };
  
  // 現在のタブインデックスを取得
  const getTabIndex = () => {
    if (currentTab === 'ranking') return 1;
    if (currentTab === 'settings') return 2;
    return 0; // デフォルトはレース
  };
  
  // タブ変更時の処理
  const handleTabChange = (index: number) => {
    router.push(tabRoutes[index]);
  };

  return (
    <Box 
      width="full" 
      borderBottomWidth="1px" 
      borderBottomColor="gray.200" 
      mb={4}
    >
      <Tabs 
        index={getTabIndex()} 
        onChange={handleTabChange}
        variant="enclosed"
        colorScheme="blue"
        size="lg"
      >
        <TabList>
          <Tab fontWeight="semibold">レース</Tab>
          <Tab fontWeight="semibold">ランキング</Tab>
          <Tab fontWeight="semibold">設定</Tab>
        </TabList>
      </Tabs>
    </Box>
  )
}
