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
  Flex,
  Spinner,
  Center
} from '@chakra-ui/react'

import { Container } from '../components/Container'
import { TabNavigation } from '../components/TabNavigation'
import { useAppSettingsContext } from '../utils/AppSettingsContext'

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
  
  // レース結果の取得（最新のレースを取得）
  const latestRace = settings?.races && settings.races.length > 0 
    ? settings.races[settings.races.length - 1] 
    : null;
    
  // レース結果データをランキングデータ形式に変換
  const rankingData = latestRace ? latestRace.results.map(result => ({
    position: result.position,
    name: result.playerName,
    vehicle: result.vehicleName,
    time: result.totalTime,
    laps: result.laps?.map(lap => lap.time) || [],
    wins: 0
  })) : [];
    
  // 総合ランキングの計算
  // プレイヤーごとにレース結果を集計
  const calculateOverallRankings = () => {
    if (!settings.races || settings.races.length === 0) return [];
    
    const playerStats = {};
    
    // すべてのレースを集計
    settings.races.forEach(race => {
      race.results.forEach(result => {
        const playerId = result.playerId || result.playerName;
        
        if (!playerStats[playerId]) {
          playerStats[playerId] = {
            playerId,
            playerName: result.playerName,
            wins: 0,
            races: 0,
            bestTime: null,
            totalTime: 0
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
    const rankings = Object.values(playerStats)
      .sort((a, b) => b.wins - a.wins);
      
    // 順位を付ける
    return rankings.map((player, index) => ({
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
      <Container maxWidth="full" px={2} py={4}>
        <VStack spacing={6} align="stretch" width="full">
          {/* タブナビゲーション */}
          <TabNavigation currentTab="ranking" />
          
          <Heading size="lg" mb={4}>レースランキング</Heading>
          
          {/* 最新レース結果 */}
          <Box borderWidth="1px" borderRadius="lg" p={4} shadow="md">
            <Heading size="md" mb={3}>
              最新レース結果
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
                {rankingData.length > 0 ? (
                  rankingData.map((entry) => (
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
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={5} textAlign="center" py={4}>
                      レース結果がありません
                    </Td>
                  </Tr>
                )}
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
                {rankingData.length > 0 ? (
                  rankingData.map((entry) => {
                    const bestLap = findBestLap(entry.laps || []);
                    return (
                      <Tr key={entry.position}>
                        <Td fontWeight="bold">{entry.position}</Td>
                        <Td>{entry.name}</Td>
                        <Td>{entry.wins || 0}</Td>
                        <Td>{entry.time}</Td>
                        <Td>
                          {bestLap.value && (
                            <Badge colorScheme="green" variant="subtle" px={2} py={1}>
                              {bestLap.value}
                            </Badge>
                          )}
                        </Td>
                      </Tr>
                    );
                  })
                ) : (
                  <Tr>
                    <Td colSpan={5} textAlign="center" py={4}>
                      ランキングデータがありません
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </Box>
        </VStack>
      </Container>
    </React.Fragment>
  )
}
