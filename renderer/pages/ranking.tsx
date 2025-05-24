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
  HStack,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';

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
  const { settings, isLoading, deleteRace } = useAppSettingsContext();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedRaceId, setSelectedRaceId] = React.useState<string>("");
  const cancelRef = React.useRef<HTMLButtonElement>(null);

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
  // すべてのレース結果を表示用に変換
  const allRacesData = settings?.races ? [...settings.races].reverse().map(race => ({
    id: race.id,
    name: race.name || `第${race.raceNumber}レース`,
    raceNumber: race.raceNumber,
    results: race.results.map((result) => ({
      position: result.position,
      courseId: result.courseId,
      name: result.teamName || result.playerName,
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

  // レース削除の確認を開始
  const handleDeleteClick = (raceId: string) => {
    setSelectedRaceId(raceId);
    onOpen();
  };

  // レースを削除
  const confirmDelete = () => {
    if (selectedRaceId) {
      deleteRace(selectedRaceId);
      toast({
        title: "レースを削除しました",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose();
    }
  };

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
                  <Flex justify="space-between" align="center" mb={3}>
                    <Heading 
                      size="lg" 
                      color="white"
                      letterSpacing={5}
                    >
                      {race.name}
                    </Heading>
                    <Button
                      leftIcon={<DeleteIcon />}
                      colorScheme="red"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        handleDeleteClick(race.id);
                      }}
                    >
                      削除
                    </Button>
                  </Flex>
                  
                  <Table variant="simple" size="sm" colorScheme="whiteAlpha">
                    <Thead>
                      <Tr>
                        <Th color="gray.100">順位</Th>
                        <Th color="gray.100" width="13%">チーム名</Th>
                        <Th color="gray.100" width="22%">車両</Th>
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
                                    fontSize="20px" 
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
                                  fontSize="sm"
                                  px={2}
                                  py={1}
                                  borderRadius="md"
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
                                <Text color="white" fontSize="xl" fontWeight="bold" letterSpacing={1}>{entry.time}</Text>
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

      {/* 削除確認ダイアログ */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg="gray.800" borderColor="gray.700">
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="white">
              レースを削除
            </AlertDialogHeader>

            <AlertDialogBody color="white">
              このレースの記録を削除します。この操作は元に戻せません。
              本当に削除しますか？
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose} variant="outline" color="white">
                キャンセル
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                削除する
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </React.Fragment>
  )
}
