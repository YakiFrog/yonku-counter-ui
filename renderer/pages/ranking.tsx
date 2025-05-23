import React, { useState } from 'react'
import Head from 'next/head'
import { 
  Box, 
  Button,
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
  Flex,
  Spinner,
  Center,
  Select,
  HStack
} from '@chakra-ui/react'

import { Container } from '../components/Container'
import { TabNavigation } from '../components/TabNavigation'
import { useAppSettingsContext } from '../utils/AppSettingsContext'
import { Race, RaceResult } from '../utils/types'

interface PlayerStats {
    playerId: string;
    playerName: string;
    teamName?: string;
    wins: number;
    races: number;
    bestTime: string | null;
    position?: number;
  }

export default function RankingPage() {
  // グローバル設定コンテキスト
  const { settings, isLoading } = useAppSettingsContext();

  // ユーティリティ関数: 文字列形式の時間（mm:ss.ms）を比較して小さい方（速い方）を返す
  const findBestLap = (laps: string[]): { value: string | null, index: number } => {
    if (!laps || laps.length === 0) {
      return { value: null, index: -1 };
    }
    
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
  
  // すべてのレース結果を表示用に変換
  const allRacesData = settings?.races ? [...settings.races].reverse().map(race => ({
    name: race.name || `第${race.raceNumber}レース`,
    results: race.results.map((result) => ({
      position: result.position,
      courseId: result.courseId,  // インデックスではなく、保存されたコースIDを使用
      name: result.teamName || result.playerName, // チーム名を優先、なければplayerNameを使用
      vehicle: result.vehicleName,
      time: result.totalTime,
      laps: result.laps?.map(lap => lap.time) || [],
      wins: 0,
      isCompleted: result.isCompleted || false
    }))
  })) : [];

  // 総合ランキングの計算
  const calculateOverallRankings = (): PlayerStats[] => {
    if (!settings?.races || settings.races.length === 0) return [];
    
    const playerStats: Record<string, PlayerStats> = {};
    
    // すべてのレースを集計
    settings.races.forEach(race => {
      race.results.forEach(result => {
        const playerId = result.playerId || result.playerName;
        
        if (!playerStats[playerId]) {
          playerStats[playerId] = {
            playerId,
            playerName: result.playerName,
            teamName: result.teamName, // teamNameを追加
            wins: 0,
            races: 0,
            bestTime: null
          };
        }
        
        // 1位だったらWin数を増やす
        if (result.position === 1) {
          playerStats[playerId].wins += 1;
        }
        
        // レース数を増やす
        playerStats[playerId].races += 1;
        
        // ベストタイムを更新
        if (result.bestLap && (!playerStats[playerId].bestTime || 
            result.bestLap.time < playerStats[playerId].bestTime)) {
          playerStats[playerId].bestTime = result.bestLap.time;
        }
      });
    });
    
    // オブジェクトを配列に変換してwin数でソート
    return Object.values(playerStats)
      .sort((a, b) => b.wins - a.wins)
      .map((player, index) => ({
        ...player,
        position: index + 1
      }));
  };
  
  const overallRankings = calculateOverallRankings();

  return (
    <React.Fragment>
      <Head>
        <title>ランキング</title>
      </Head>
      <Container maxWidth="1920px" px={4} py={3} height="100vh">
        <VStack spacing={4} align="stretch" width="full" height="full">
          {/* タブナビゲーション */}
          <TabNavigation currentTab="ranking" />
          {/* スクロール可能なエリア */}
          <Box flex="1" overflowY="auto" minHeight="0">
            <VStack spacing={6} align="stretch" width="full">
              {/* 各レース結果の表示 */}
              {allRacesData.map((race, raceIndex) => (
                <Box 
                  key={raceIndex} 
                  borderWidth="1px" 
                  borderRadius="lg" 
                  p={4} 
                  shadow="md" 
                  bg="gray.800" 
                  borderColor="gray.600"
                >
                  <Heading 
                    size="lg" 
                    mb={3} 
                    color="white"
                    letterSpacing={5}
                  >
                    {race.name}
                  </Heading>
                  
                  <Table variant="simple" size="sm" colorScheme="whiteAlpha">
                    <Thead>
                      <Tr>
                        <Th color="gray.100">順位</Th>
                        <Th color="gray.100" width="10%">チーム名</Th>
                        <Th color="gray.100" width="25%">車両</Th>
                        <Th color="gray.100" width="15%">総合タイム</Th>
                        <Th color="gray.100" width="40%">各周回ラップタイム</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {race.results.length > 0 ? (
                        race.results.map((entry) => (
                          <Tr 
                            key={entry.position}
                            bg={
                              entry.position === 1 ? "rgba(255, 215, 0, 0.20)" :
                              entry.position === 2 ? "rgba(192, 192, 192, 0.20)" :
                              entry.position === 3 ? "rgba(205, 127, 50, 0.20)" :
                              entry.position === 4 ? "rgba(255, 0, 0, 0.20)" :
                              "transparent"
                            }
                          >
                            <Td>
                              <Flex gap={2} alignItems="center">
                                <Box 
                                  px={3} 
                                  py={1} 
                                  borderRadius="full"
                                  bg={
                                    entry.position === 1 ? "rgba(255, 215, 0, 0.2)" :
                                    entry.position === 2 ? "rgba(192, 192, 192, 0.2)" :
                                    entry.position === 3 ? "rgba(205, 127, 50, 0.2)" :
                                    entry.position === 4 ? "rgba(255, 0, 0, 0.2)" :
                                    "transparent"
                                  }
                                  borderWidth="1px"
                                  borderColor={
                                    entry.position === 1 ? "yellow.400" :
                                    entry.position === 2 ? "gray.400" :
                                    entry.position === 3 ? "orange.400" :
                                    entry.position === 4 ? "red.400" :
                                    "gray.500"
                                  }
                                >
                                  <Text 
                                    fontWeight="bold" 
                                    fontSize="lg" 
                                    color="white"
                                  >
                                    {entry.position}位
                                  </Text>
                                </Box>
                                <Badge 
                                  colorScheme={
                                    entry.courseId === 1 ? "yellow" :
                                    entry.courseId === 2 ? "green" :
                                    entry.courseId === 3 ? "blue" :
                                    entry.courseId === 4 ? "red" :
                                    "gray"
                                  } 
                                  variant="solid" 
                                  ml={3}
                                >
                                  {entry.courseId}コース
                                </Badge>
                              </Flex>
                            </Td>
                            <Td>
                              <Text color="white" fontSize="lg" fontWeight="semibold">{entry.name}</Text>
                            </Td>
                            <Td color="white">{entry.vehicle}</Td>
                            <Td>
                              <Flex alignItems="center" gap={2}>
                                <Text color="white" fontSize="lg">{entry.time}</Text>
                                {entry.isCompleted && (
                                  <Badge colorScheme="green" size="sm" px={2} py={1} borderRadius="md" variant="solid">完走</Badge>
                                )}
                              </Flex>
                            </Td>
                            <Td>
                              <Flex wrap="wrap" gap={2}>
                                {(() => {
                                  const bestLap = findBestLap(entry.laps);
                                  return entry.laps.map((lap, index) => (
                                    <Box 
                                      key={index} 
                                      borderWidth="1px"
                                      borderRadius="md"
                                      borderColor={index === bestLap.index ? "green.400" : "gray.600"}
                                      bg={index === bestLap.index ? "green.900" : "#111827"}
                                      px={2}
                                      py={1}
                                      boxShadow="md"
                                    >
                                      <Tooltip label={`ベストタイム: ${bestLap.value}`} isDisabled={index !== bestLap.index}>
                                        <Flex alignItems="center" gap={1}>
                                          <Text fontSize="md" fontWeight="medium" color="gray.200">
                                            {index + 1}:
                                          </Text>
                                          <Text fontSize="md" fontWeight={index === bestLap.index ? "bold" : "normal"} color={index === bestLap.index ? "green.200" : "white"}>
                                            {lap}
                                          </Text>
                                          {index === bestLap.index && (
                                            <Badge colorScheme="green" fontSize="2xs" variant="solid">
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
                        ))
                      ) : (
                        <Tr>
                          <Td colSpan={5} textAlign="center" py={4} color="gray.300">
                            レース結果がありません
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                </Box>
              ))}
            </VStack>
          </Box>
        </VStack>
      </Container>
    </React.Fragment>
  )
}
