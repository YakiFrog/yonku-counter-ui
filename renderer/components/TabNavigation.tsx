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
      borderBottomColor="gray.700" 
      mb={4}
    >
      <Tabs 
        index={getTabIndex()} 
        onChange={handleTabChange}
        variant="enclosed"
        colorScheme="cyan"
        size="lg"
      >
        <TabList
          bg="gray.800"
          borderBottomColor="gray.700"
        >
          <Tab 
            fontWeight="semibold"
            color="gray.300"
            bg="gray.900"
            borderColor="gray.600"
            _selected={{ 
              color: "white", 
              bg: "gray.700",
              borderColor: "cyan.400",
              borderBottomColor: "transparent"
            }}
            _hover={{
              color: "white",
              bg: "gray.700"
            }}
          >
            レース
          </Tab>
          <Tab 
            fontWeight="semibold"
            color="gray.300"
            bg="gray.900"
            borderColor="gray.600"
            _selected={{ 
              color: "white", 
              bg: "gray.700",
              borderColor: "cyan.400",
              borderBottomColor: "transparent"
            }}
            _hover={{
              color: "white",
              bg: "gray.700"
            }}
          >
            レース結果
          </Tab>
          <Tab 
            fontWeight="semibold"
            color="gray.300"
            bg="gray.900"
            borderColor="gray.600"
            _selected={{ 
              color: "white", 
              bg: "gray.700",
              borderColor: "cyan.400",
              borderBottomColor: "transparent"
            }}
            _hover={{
              color: "white",
              bg: "gray.700"
            }}
          >
            設定
          </Tab>
        </TabList>
      </Tabs>
    </Box>
  )
}
