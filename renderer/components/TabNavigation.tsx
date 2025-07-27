import React from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { 
  Tabs, 
  TabList, 
  Tab, 
  Box,
  Flex,
  Center
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
      position="relative"
    >
      {/* ロゴを追加 */}
      <Box 
        position="absolute"
        top="-137px"
        left="50%"
        transform="translate(-50%, 0)"
        width="10%"
        minWidth="570px"
        height="205px"
        zIndex={1}
        borderRadius="35px"
        overflow="hidden"
        boxShadow="0px 0px 25px rgba(255, 255, 255, 1)"  // Cyan glow effect
        _hover={{
          transform: "translate(-50%, -2px)",
          boxShadow: "0 0 40px rgba(103, 232, 249, 0.8), 0 0 20px rgba(103, 232, 249, 0.4)",  // Enhanced cyan glow on hover
          transition: "all 0.3s ease"
        }}
        transition="all 0.3s ease"
      >
        <Image
          src="/images/logo.png"
          alt="Logo"
          layout="fill"
          objectFit="cover"
          objectPosition="center top"
          priority
        />
      </Box>

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
