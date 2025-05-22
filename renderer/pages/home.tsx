import React, { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import { 
  Box, 
  Button, 
  Flex, 
  Grid, 
  Heading, 
  HStack, 
  Link as ChakraLink, 
  Progress, 
  Text, 
  VStack,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatGroup,
  SimpleGrid,
  Spinner,
  Center,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure
} from '@chakra-ui/react'
import { useRouter } from 'next/router'

import { Container } from '../components/Container'
import { Footer } from '../components/Footer'
import { Hero } from '../components/Hero'
import { TabNavigation } from '../components/TabNavigation'
import { useAppSettingsContext } from '../utils/AppSettingsContext'
import { Race, RaceResult, RaceLap } from '../utils/types'

export default function HomePage() {
  // グローバルな設定コンテキストを使用
  const { settings, isLoading, saveRaceResult } = useAppSettingsContext();
  const toast = useToast();
  const router = useRouter();
  
  // レース終了確認ダイアログの状態
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef();

  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // 各コースのデータを管理する状態
  const [courseData, setCourseData] = useState([
    { 
      id: 1, 
      name: '', 
      vehicle: '', 
      color: 'red.500', 
      currentLap: 0, 
      totalLaps: 0, 
      time: 0, 
      bestLap: null, 
      lapTimes: [], // 各周回のタイム記録
      lastLapTime: 0, // 前の周回が完了した時間
      finishTime: null, // 全周回完了時の時間
    },
    { 
      id: 2, 
      name: '', 
      vehicle: '', 
      color: 'blue.500', 
      currentLap: 0, 
      totalLaps: 0, 
      time: 0,
      bestLap: null,
      lapTimes: [],
      lastLapTime: 0,
      finishTime: null,
    },
    { 
      id: 3, 
      name: '', 
      vehicle: '', 
      color: 'green.500', 
      currentLap: 0, 
      totalLaps: 0, 
      time: 0,
      bestLap: null,
      lapTimes: [],
      lastLapTime: 0,
      finishTime: null,
    },
    { 
      id: 4, 
      name: '', 
      vehicle: '', 
      color: 'purple.500', 
      currentLap: 0, 
      totalLaps: 0, 
      time: 0,
      bestLap: null,
      lapTimes: [],
      lastLapTime: 0,
      finishTime: null,
    },
  ]);
  
  // タイマーのID保持用
  const timerRef = useRef(null);

  // ストップウォッチの更新
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = now - startTime;
        setElapsedTime(elapsed);
        
        // 各コースの時間も更新
        setCourseData(prev => 
          prev.map(course => ({
            ...course,
            time: elapsed
          }))
        );
      }, 100); // 100msごとに更新
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, startTime]);

  // 設定の変更を検知してコースデータを更新
  useEffect(() => {
    if (!isLoading && settings) {
      // 設定から必要なデータを取得
      const updatedCourseData = settings.courses.map(course => {
        // コースに関連付けられた選手と車両を検索
        const player = settings.players.find(p => p.id === course.playerId);
        const vehicle = player?.vehicle;
        
        // 色のマッピング - コースIDに基づいて決定
        const colorMap = {
          1: 'red.500',
          2: 'blue.500',
          3: 'green.500',
          4: 'purple.500'
        };
        
        return {
          id: course.id,
          name: player?.name || '',
          vehicle: vehicle?.name || '',
          color: colorMap[course.id] || 'gray.500',
          currentLap: 0, // レース開始時は0から
          totalLaps: settings.lapCount || 0,
          time: 0,
          bestLap: null,
          lapTimes: [], // 周回ごとの記録時間
          lastLapTime: 0, // 前回のラップ完了時間
          finishTime: null, // 全周回完了時の時間
        };
      });
      
      setCourseData(updatedCourseData);
    }
  }, [settings, isLoading]);

  // スタート/ストップ切り替え
  const toggleTimer = () => {
    if (!isRunning) {
      // スタート
      setStartTime(Date.now() - elapsedTime);
      setIsRunning(true);
    } else {
      // ストップ
      setIsRunning(false);
    }
  };

  // タイマーのリセット
  const resetTimer = () => {
    setIsRunning(false);
    setElapsedTime(0);
    setCourseData(prev => 
      prev.map(course => ({
        ...course,
        time: 0,
        currentLap: 0,
        lapTimes: [],
        lastLapTime: 0,
        bestLap: null,
        finishTime: null
      }))
    );
  };
  
  // レース終了処理
  const finishRace = () => {
    // レースを一時停止
    setIsRunning(false);
    
    // レース結果を作成
    const results: RaceResult[] = courseData.map((course, index) => {
      // ラップタイムをRaceLap配列に変換
      const laps = [...course.lapTimes];
      
      // ベストラップ
      const bestLap = course.bestLap;
      
      return {
        id: `result-${Date.now()}-${index}`,
        raceId: `race-${Date.now()}`,
        position: index + 1, // 仮の順位（後でソート）
        playerId: course.name ? `player-${index}` : null, // 仮のID
        playerName: course.name || `未登録プレイヤー${index + 1}`,
        vehicleId: course.vehicle ? `vehicle-${index}` : null, // 仮のID
        vehicleName: course.vehicle || `未登録車両${index + 1}`,
        totalTime: course.finishTime ? formatTime(course.finishTime) : formatTime(course.time),
        laps,
        bestLap,
        isCompleted: course.finishTime !== null
      };
    });
    
    // 結果をソート - 周回数が多い順、同じ場合は時間が短い順
    results.sort((a, b) => {
      const aLaps = a.laps.length;
      const bLaps = b.laps.length;
      if (aLaps !== bLaps) return bLaps - aLaps; // 周回数降順
      
      const aTime = parseTime(a.totalTime);
      const bTime = parseTime(b.totalTime);
      return aTime - bTime; // 時間昇順
    });
    
    // 正しい順位を設定
    results.forEach((result, idx) => {
      result.position = idx + 1;
    });
    
    // レース情報を作成
    const race: Race = {
      id: `race-${Date.now()}`,
      name: `レース ${new Date().toLocaleString('ja-JP')}`,
      date: new Date().toISOString(),
      totalLaps: settings.lapCount,
      results
    };
    
    // レース結果を保存
    saveRaceResult(race);
    
    toast({
      title: 'レース終了',
      description: 'レース結果が保存されました。',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    
    // レース結果ページへ遷移
    router.push('/ranking');
  };
  
  // 文字列形式の時間をミリ秒に変換
  const parseTime = (timeStr: string): number => {
    const [minutesSeconds, ms] = timeStr.split('.');
    const [minutes, seconds] = minutesSeconds.split(':');
    
    return (
      parseInt(minutes) * 60 * 1000 +
      parseInt(seconds) * 1000 +
      parseInt(ms) * 10
    );
  };
  
  // 特定コースの周回数を増やす
  const incrementLap = (courseId) => {
    setCourseData(prev => 
      prev.map(course => {
        if (course.id === courseId && 
            (course.totalLaps === 0 || course.currentLap < course.totalLaps)) {
          
          // 現在のタイムスタンプ
          const currentTime = course.time;
          
          // 周回のラップタイム計算（今の時間 - 前回の周回完了時間）
          const lapTime = currentTime - course.lastLapTime;
          
          // 新しいラップタイム記録を追加
          const newLapTime = {
            lapNumber: course.currentLap + 1, // 新しい周回番号
            time: formatTime(lapTime), // 表示用フォーマット時間
            timestamp: lapTime // ミリ秒単位の生データ
          };
          
          // ベストラップの更新
          let bestLap = course.bestLap;
          if (!bestLap || (lapTime < bestLap.timestamp && lapTime > 0)) {
            bestLap = newLapTime;
          }
          
          // 周回時間の配列に追加
          const newLapTimes = [...course.lapTimes, newLapTime];
          
          // 全周回完了したかチェック
          const newLapCount = course.currentLap + 1;
          const isFinished = course.totalLaps > 0 && newLapCount >= course.totalLaps;
          
          return {
            ...course, 
            currentLap: newLapCount,
            lapTimes: newLapTimes,
            lastLapTime: currentTime, // 現在の時間を最後のラップタイムとして記録
            bestLap,
            // 目標周回数に達した場合、完了時間を記録
            finishTime: isFinished && course.finishTime === null ? currentTime : course.finishTime
          };
        }
        return course;
      })
    );
  };
  
  // 特定コースの周回数を減らす
  const decrementLap = (courseId) => {
    setCourseData(prev => 
      prev.map(course => {
        if (course.id === courseId && course.currentLap > 0) {
          // 最後のラップタイム記録を削除
          const newLapTimes = [...course.lapTimes];
          newLapTimes.pop();
          
          // 新しいbestLapを計算
          let bestLap = null;
          if (newLapTimes.length > 0) {
            bestLap = newLapTimes.reduce((best, current) => 
              best.timestamp < current.timestamp ? best : current
            );
          }
          
          // 前の周回の完了時間を計算
          const lastLapTime = course.currentLap > 1 
            ? course.lastLapTime - (course.lapTimes[course.lapTimes.length - 1]?.timestamp || 0)
            : 0;
          
          return {
            ...course, 
            currentLap: course.currentLap - 1,
            lapTimes: newLapTimes,
            lastLapTime,
            bestLap
          };
        }
        return course;
      })
    );
  };
  
  // 時間のフォーマット (mm:ss.ms)
  const formatTime = (time) => {
    const totalSeconds = Math.floor(time / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((time % 1000) / 10); // 2桁の表示にする
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  // 周回の進捗を計算する関数
  const calculateProgress = (current, total) => (current / total) * 100;

  return (
    <React.Fragment>
      <Head>
        <title>レース管理システム</title>
      </Head>
      <Container maxHeight="100vh" maxWidth="full" px={2} py={4}>
        <VStack spacing={4} align="stretch" width="full">
          {/* タブナビゲーション */}
          <TabNavigation currentTab="race" />
          
          <Flex justifyContent="space-between" alignItems="center" pb={1}>
            <Heading size="lg">レース管理</Heading>
            <Badge colorScheme={isRunning ? "green" : "gray"} fontSize="xl" p={2} borderRadius="md">
              {isRunning ? "レース中" : "準備中"}
            </Badge>
          </Flex>
          
          {/* レイアウト: 左側にコース情報、右側に大きな経過時間表示 */}
          <Grid templateColumns="5fr 3fr" gap={4}>
            {/* 左側：4コース分のレース情報と周回表示 */}
            <Box pl={"6.3%"}> {/* 左右の余白を縮小 */}
              <VStack spacing={3} align="stretch"> {/* 間隔を狭くする */}
                {[...courseData].reverse().map((course) => (
                  <Box 
                    key={course.id}
                    p={3} 
                    pl={5}  // 左側の余白を少し縮小
                    borderWidth="1px" 
                    borderRadius="md" // より小さい角丸
                    borderLeftWidth="6px" // 左ボーダーも細く
                    borderLeftColor={course.color} 
                    shadow="sm" // 影も控えめに
                    position="relative"  // 絶対配置の基準点
                  >
                    {/* 大きなコース番号を左側に表示（枠外に） - 常に「4,3,2,1」の順で表示 */}
                    <Box
                      position="absolute"
                      left="-80px"
                      top="50%"
                      transform="translateY(-50%)"
                      fontSize="5xl"
                      fontWeight="black"
                      color={course.color}
                      w="60px"
                      h="60px"
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                      borderRadius="full"
                      bg="white"
                      _dark={{ bg: "gray.800" }}
                      boxShadow="md"
                      border="3px solid"
                      borderColor={course.color}
                      zIndex={2}
                    >
                      {course.id}
                    </Box>
                    <Flex justifyContent="space-between" alignItems="center">
                      <Box>
                        <Text fontWeight="bold" fontSize="md">{course.name}</Text>
                        <Flex alignItems="center" gap={2} flexWrap="wrap">
                          <Text fontSize="xs">車両: {course.vehicle}</Text>
                          {course.bestLap && (
                            <Badge size="sm" colorScheme={`${course.color.split('.')[0]}`} variant="subtle">
                              ベスト: {course.bestLap.time}
                            </Badge>
                          )}
                          {course.finishTime && (
                            <Badge size="sm" colorScheme="green" variant="solid">
                              完走: {formatTime(course.finishTime)}
                            </Badge>
                          )}
                        </Flex>
                      </Box>
                      <Flex direction="column" alignItems="center">
                        <Flex alignItems="center">
                          <Button 
                            size="xs" 
                            onClick={() => decrementLap(course.id)}
                            isDisabled={course.currentLap <= 0}
                            colorScheme={course.color.split('.')[0]}
                            variant="outline"
                            mr={1}
                            h="24px"
                            minW="24px"
                            p={0}
                          >
                            -
                          </Button>
                          <Text fontWeight="bold" fontSize="xl" mx={1}>
                            {course.currentLap}{course.totalLaps > 0 ? ` / ${course.totalLaps}` : ''}
                          </Text>
                          <Button 
                            size="xs" 
                            onClick={() => incrementLap(course.id)}
                            isDisabled={course.totalLaps > 0 && course.currentLap >= course.totalLaps}
                            colorScheme={course.color.split('.')[0]}
                            variant="outline"
                            ml={1}
                            h="24px"
                            minW="24px"
                            p={0}
                          >
                            +
                          </Button>
                        </Flex>
                        <Text fontSize="xs" mt={0}>周回数</Text>
                      </Flex>
                    </Flex>
                    
                    {/* 周回時間の表示 */}
                    <Box mt={2} height="80px"> {/* 高さを縮小 */}
                      <Text fontSize="xs" fontWeight="semibold" mb={1}>周回タイム:</Text>
                      {course.lapTimes.length > 0 ? (
                        <Box 
                          overflowY="auto" 
                          maxHeight="60px" 
                          borderWidth="1px" 
                          borderRadius="md" 
                          borderColor="gray.200" 
                          p={1}
                        >
                          <Flex flexWrap="wrap" gap={1}>
                            {course.lapTimes.map((lap, index) => (
                              <Badge
                                key={index}
                                colorScheme={
                                  course.bestLap && lap.timestamp === course.bestLap.timestamp 
                                    ? `${course.color.split('.')[0]}` 
                                    : "gray"
                                }
                                p={1}
                                fontSize="xs"
                                borderRadius="md"
                                variant={
                                  course.bestLap && lap.timestamp === course.bestLap.timestamp 
                                    ? "solid" 
                                    : "subtle"
                                }
                              >
                                {lap.lapNumber}周目: {lap.time}
                              </Badge>
                            ))}
                          </Flex>
                        </Box>
                      ) : (
                        <Box 
                          height="60px" 
                          borderWidth="1px" 
                          borderRadius="md" 
                          borderColor="gray.200"
                          display="flex" 
                          justifyContent="center" 
                          alignItems="center"
                        >
                          <Text color="gray.500" fontSize="xs">周回データがありません</Text>
                        </Box>
                      )}
                    </Box>
                    
                    {course.totalLaps > 0 && (
                      <Progress 
                        mt={3} 
                        value={calculateProgress(course.currentLap, course.totalLaps)} 
                        colorScheme={course.color.split('.')[0]} 
                        height="8px"
                        borderRadius="full"
                      />
                    )}
                  </Box>
                ))}
              </VStack>
            </Box>
            
            {/* 右側：大きな経過時間表示 */}
            <Box 
              p={4} 
              borderWidth="1px" 
              borderRadius="lg" 
              shadow="md"
              display="flex"
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
              h="100%"
              w="full"
            >
              <VStack spacing={3} w="full">
                <Text fontSize="lg" fontWeight="medium">総経過時間</Text>
                <Box 
                  fontSize={["3xl", "4xl", "5xl", "6xl"]}
                  fontWeight="bold"
                  color="blue.500"
                  p={3}
                  py={6}
                  borderRadius="lg"
                  bg="gray.50"
                  _dark={{ bg: "gray.700" }}
                  boxShadow="md"
                  textAlign="center"
                  w="full"
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                >
                  {formatTime(elapsedTime)}
                </Box>                  <Flex justifyContent="space-between" w="full" px={2}>
                  <Badge 
                    colorScheme={isRunning ? "green" : "gray"} 
                    fontSize="lg" 
                    p={2} 
                    borderRadius="md"
                  >
                    {isRunning ? "レース中" : "停止中"}
                  </Badge>
                </Flex>
              </VStack>
            </Box>
          </Grid>
          
          {/* コントロールボタン */}
          <Flex justifyContent="center" gap={2} mt={2}>
            <Button 
              colorScheme={isRunning ? "orange" : "green"} 
              size="md" 
              onClick={toggleTimer}
              py={5}
              fontSize="lg"
              flex={1}
            >
              {isRunning ? "一時停止" : "スタート"}
            </Button>
            <Button 
              colorScheme="red" 
              size="md" 
              onClick={resetTimer}
              py={5}
              fontSize="lg"
              flex={1}
            >
              リセット
            </Button>
            <Button 
              colorScheme="purple" 
              size="md"
              py={5}
              fontSize="lg"
              flex={1}
              onClick={onOpen}
              isDisabled={!isRunning && elapsedTime === 0}
            >
              レース終了
            </Button>
          </Flex>
          
          {/* レース終了確認ダイアログ */}
          <AlertDialog
            isOpen={isOpen}
            leastDestructiveRef={cancelRef}
            onClose={onClose}
          >
            <AlertDialogOverlay>
              <AlertDialogContent>
                <AlertDialogHeader fontSize="lg" fontWeight="bold">
                  レースを終了する
                </AlertDialogHeader>

                <AlertDialogBody>
                  レースを終了し、結果を保存しますか？この操作は元に戻せません。
                </AlertDialogBody>

                <AlertDialogFooter>
                  <Button ref={cancelRef} onClick={onClose}>
                    キャンセル
                  </Button>
                  <Button 
                    colorScheme="purple" 
                    onClick={() => {
                      finishRace();
                      onClose();
                    }} 
                    ml={3}
                  >
                    終了して保存
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialogOverlay>
          </AlertDialog>
          
          <Footer pt={0}>
            <Button
              as={ChakraLink}
              href="/ranking"
              variant="outline"
              colorScheme="teal"
              rounded="button"
              size="sm"
              width="auto"
              mb={1}
            >
              ランキングへ
            </Button>
          </Footer>
        </VStack>
      </Container>
    </React.Fragment>
  )
}
