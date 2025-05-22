import React from 'react'
import Head from 'next/head'
import { 
  Box, 
  Heading, 
  Table, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td, 
  VStack,
  Badge,
  Text,
  Tooltip,
  Flex
} from '@chakra-ui/react'

import { Container } from '../components/Container'
import { TabNavigation } from '../components/TabNavigation'

export default function RankingPage() {
  // ユーティリティ関数: 文字列形式の時間（mm:ss.ms）を比較して小さい方（速い方）を返す
  const findBestLap = (laps: string[]): { value: string, index: number } => {
    let bestValue = laps[0];
    let bestIndex = 0;
    
    laps.forEach((lap, index) => {
      if (lap < bestValue) {
        bestValue = lap;
        bestIndex = index;
      }
    });
    
    return { value: bestValue, index: bestIndex };
  };

  // ランキングデータのサンプル
  const rankingData = [
    { 
      position: 1, 
      name: '選手1', 
      vehicle: '車両1', 
      time: '01:23.45', 
      laps: ['00:16.78', '00:17.32', '00:17.11', '00:16.89', '00:16.78'] 
    },
    { 
      position: 2, 
      name: '選手2', 
      vehicle: '車両2', 
      time: '01:25.67', 
      laps: ['00:17.12', '00:17.80', '00:17.59', '00:17.34', '00:17.12'] 
    },
    { 
      position: 3, 
      name: '選手3', 
      vehicle: '車両3', 
      time: '01:28.90', 
      laps: ['00:17.45', '00:18.23', '00:18.15', '00:17.95', '00:17.45'] 
    },
    { 
      position: 4, 
      name: '選手4', 
      vehicle: '車両4', 
      time: '01:30.21', 
      laps: ['00:18.03', '00:18.65', '00:18.32', '00:18.25', '00:18.03'] 
    },
  ];

  return (
    <React.Fragment>
      <Head>
        <title>ランキング - 四駆カウンター</title>
      </Head>
      <Container maxWidth="full" px={2} py={4}>
        <VStack spacing={6} align="stretch" width="full">
          {/* タブナビゲーション */}
          <TabNavigation currentTab="ranking" />
          
          <Heading size="lg" mb={4}>レースランキング</Heading>
          
          {/* 最新レース結果 */}
          <Box borderWidth="1px" borderRadius="lg" p={4} shadow="md">
            <Heading size="md" mb={3}>
              最新レース結果 <Badge colorScheme="green" ml={2}>レース #1</Badge>
            </Heading>
            
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>順位</Th>
                  <Th>選手名</Th>
                  <Th>車両</Th>
                  <Th>総合タイム</Th>
                  <Th width="40%">各周回ラップタイム</Th>
                </Tr>
              </Thead>
              <Tbody>
                {rankingData.map((entry) => (
                  <Tr key={entry.position}>
                    <Td fontWeight="bold">{entry.position}</Td>
                    <Td>{entry.name}</Td>
                    <Td>{entry.vehicle}</Td>
                    <Td>{entry.time}</Td>
                    <Td>
                      <Flex wrap="wrap" gap={2}>
                        {(() => {
                          const bestLap = findBestLap(entry.laps);
                          return entry.laps.map((lap, index) => (
                            <Box 
                              key={index} 
                              borderWidth="1px"
                              borderRadius="md"
                              borderColor={index === bestLap.index ? "green.400" : "gray.200"}
                              bg={index === bestLap.index ? "green.50" : "gray.50"}
                              px={2}
                              py={1}
                            >
                              <Tooltip label={`ベストタイム: ${bestLap.value}`} isDisabled={index !== bestLap.index}>
                                <Flex alignItems="center" gap={1}>
                                  <Text fontSize="sm" fontWeight="medium" color="gray.600">
                                    {index + 1}:
                                  </Text>
                                  <Text fontSize="sm" fontWeight={index === bestLap.index ? "bold" : "normal"}>
                                    {lap}
                                  </Text>
                                  {index === bestLap.index && (
                                    <Badge colorScheme="green" fontSize="2xs" variant="subtle">
                                      ベスト
                                    </Badge>
                                  )}
                                </Flex>
                              </Tooltip>
                            </Box>
                          ));
                        })()}
                      </Flex>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
          
          {/* 総合ランキング */}
          <Box borderWidth="1px" borderRadius="lg" p={4} shadow="md">
            <Heading size="md" mb={3}>
              総合ランキング
            </Heading>
            
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>順位</Th>
                  <Th>選手名</Th>
                  <Th>勝利数</Th>
                  <Th>平均タイム</Th>
                  <Th>ベストタイム</Th>
                </Tr>
              </Thead>
              <Tbody>
                {rankingData.map((entry) => {
                  const bestLap = findBestLap(entry.laps);
                  return (
                    <Tr key={entry.position}>
                      <Td fontWeight="bold">{entry.position}</Td>
                      <Td>{entry.name}</Td>
                      <Td>{5 - entry.position}</Td>
                      <Td>{entry.time}</Td>
                      <Td>
                        <Badge colorScheme="green" variant="subtle" px={2} py={1}>
                          {bestLap.value}
                        </Badge>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Box>
        </VStack>
      </Container>
    </React.Fragment>
  )
}
