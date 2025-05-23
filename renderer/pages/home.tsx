import React, { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
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
import { TabNavigation } from '../components/TabNavigation'
import { useAppSettingsContext } from '../utils/AppSettingsContext'
import { useSerial } from '../utils/SerialContext'
import { Race, RaceResult, RaceLap } from '../utils/types'

export default function HomePage() {
  const { settings, isLoading, saveRaceResult } = useAppSettingsContext();
  const toast = useToast();
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef();
  
  // すべてのステート hooks を先に宣言
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const { currentRaceNumber, updateRaceNumber } = useAppSettingsContext();
  const [raceType, setRaceType] = useState('');
  const [courseData, setCourseData] = useState([
    { 
      id: 1, 
      name: '', 
      vehicle: '', 
      teamName: '', // チーム名を追加
      color: 'yellow.500', 
      currentLap: 0, 
      totalLaps: 0, 
      time: 0, 
      bestLap: null, 
      lapTimes: [], 
      lastLapTime: 0, 
      finishTime: null,
    },
    { 
      id: 2, 
      name: '', 
      vehicle: '', 
      teamName: '', // チーム名を追加
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
      id: 3, 
      name: '', 
      vehicle: '', 
      teamName: '', // チーム名を追加
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
      id: 4, 
      name: '', 
      vehicle: '', 
      teamName: '', // チーム名を追加
      color: 'red.500', 
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

  // キーボードイベントハンドラ
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // 1-4のキーが押された場合、対応するコースの周回数を増やす
      const courseId = parseInt(event.key);
      if (courseId >= 1 && courseId <= 4) {
        incrementLap(courseId);
      }
    };

    // イベントリスナーの登録
    window.addEventListener('keypress', handleKeyPress);

    // クリーンアップ
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
    };
  }, []);  // 空の依存配列で一度だけ実行

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
      }, 30); // 100msごとに更新
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
          1: 'yellow.500',
          2: 'green.500',
          3: 'blue.500',
          4: 'red.500'
        };
        
        return {
          id: course.id,
          name: player?.name || '',
          teamName: player?.teamName || '',  // チーム名を追加
          vehicle: vehicle?.name || '',
          color: colorMap[course.id] || 'gray.500',
          currentLap: 0,
          totalLaps: settings.lapCount || 0,
          time: 0,
          bestLap: null,
          lapTimes: [], // 周回ごとの記録時間
          lastLapTime: 0, // 前回のラップ完了時の時間
          finishTime: null, // 全周回完了時の時間
        };
      });
      
      setCourseData(updatedCourseData);
    }
  }, [settings, isLoading]);

  // settingsがロード中または未定義の場合はローディング表示
  if (isLoading || !settings) {
    return (
      <Container maxWidth="1920px" px={4} py={3}>
        <VStack spacing={4} align="stretch" width="full">
          <TabNavigation currentTab="race" />
          <Center py={10}>
            <Spinner size="xl" color="white" />
          </Center>
        </VStack>
      </Container>
    );
  }

  const { write: serialWrite } = useSerial();

  // ゲート準備コマンド送信
  const handleGatePrep = async () => {
    try {
      await serialWrite('q');
    } catch (error) {
      console.error('Failed to send gate prep command:', error);
      toast({
        title: 'エラー',
        description: 'ゲート準備コマンドの送信に失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // ゲート自動コマンド送信
  const handleGateAuto = async () => {
    try {
      await serialWrite('e');
    } catch (error) {
      console.error('Failed to send gate auto command:', error);
      toast({
        title: 'エラー',
        description: 'ゲート自動コマンドの送信に失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // スタート/ストップ切り替え
  const toggleTimer = async () => {
    if (!isRunning) {
      // スタート
      setStartTime(Date.now() - elapsedTime);
      setIsRunning(true);
      // スタートコマンド送信
      try {
        await serialWrite('w');
      } catch (error) {
        console.error('Failed to send start command:', error);
        toast({
          title: 'エラー',
          description: 'スタートコマンドの送信に失敗しました',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } else {
      // ストップ
      setIsRunning(false);
    }
  };

  // タイマーのリセット
  const resetTimer = () => {
    setIsRunning(false);
    setElapsedTime(0);
    setRaceType('');   // レースタイプをリセット
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
    
    // デバッグ: 保存前のローカルストレージの内容を確認
    console.log('保存前のローカルストレージ:', localStorage.getItem('yonkuAppSettings'));
    
    // レース結果を作成（チームなしのコースは除外）
    const results: RaceResult[] = courseData
      .filter(course => course.name) // チーム名があるコースのみを対象とする
      .map((course) => {
      // ラップタイムをRaceLap配列に変換
      const laps = [...course.lapTimes];
      
      // 最後の周回完了時の時間を計算
      const finishTime = course.finishTime || course.time;
      
      // ベストラップ
      const bestLap = course.bestLap;
      
      return {
        id: `result-${Date.now()}-${course.id}`,
        raceId: `race-${Date.now()}`,
        position: 1, // 仮の順位（後でソート）
        playerId: course.name ? `player-${course.id}` : null,
        playerName: course.name || `コース${course.id}`,
        teamName: course.teamName,
        vehicleId: course.vehicle ? `vehicle-${course.id}` : null,
        vehicleName: course.vehicle || '',
        courseId: course.id,
        totalTime: formatTime(finishTime), // 修正: 完了時の時間を使用
        laps,
        bestLap,
        isCompleted: course.currentLap >= settings.lapCount
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
      name: raceType || `第${currentRaceNumber}レース`,
      date: new Date().toISOString(),
      raceNumber: currentRaceNumber,
      raceType: raceType,
      totalLaps: settings.lapCount,
      results
    };
    
    console.log('保存するレースデータ:', race); // 保存するデータの確認
    
    // レース結果を保存
    saveRaceResult(race);
    
    // デバッグ: 保存後のローカルストレージの内容を確認
    console.log('保存後のローカルストレージ:', localStorage.getItem('yonkuAppSettings'));
    
    // 通常レースの場合のみレース番号をインクリメント
    if (!raceType) {
      updateRaceNumber(currentRaceNumber + 1);
    }
    
    toast({
      title: 'レース終了',
      description: `第${currentRaceNumber}レースの結果が保存されました。`,
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
      <Container maxHeight="100vh" maxWidth="1920px" px={4} py={3}>
        <VStack spacing={3} align="stretch" width="full">
          {/* タブナビゲーション */}
          <TabNavigation currentTab="race" />
          {/* レイアウト: 左側にコース情報、右側に大きな経過時間表示 */}
          <Grid templateColumns="5fr 3fr" gap={4}>
            {/* 左側：4コース分のレース情報と周回表示 */}
            <Box pl={"7%"}> {/* 左右の余白を縮小 */}
              <VStack spacing={3} align="stretch"> {/* 間隔を狭くする */}
                {[...courseData].reverse().map((course) => (                    <Box 
                    key={course.id}
                    p={4} 
                    pl={5}
                    borderWidth="1px" 
                    borderRadius="md"
                    borderLeftWidth="0"
                    shadow="lg"
                    position="relative"
                    bg="gray.800"
                    borderColor="gray.700"
                    transition="all 0.2s"
                    _hover={{
                      transform: "translateX(2px)",
                      boxShadow: "xl"
                    }}
                  >
                    {/* コース番号を左側に横長の背景色付きで表示 - 常に「4,3,2,1」の順で表示 */}
                    <Box
                      position="absolute"
                      left="-80px"
                      top="0"
                      fontSize="5xl"
                      fontWeight="black"
                      color="white"
                      w="80px"
                      h="100%"
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                      bg={course.color}
                      boxShadow="dark-lg"
                      zIndex={2}
                      borderLeftRadius="md"
                      sx={{
                        textShadow: "2px 2px 4px rgba(0,0,0,0.3)"
                      }}
                    >
                      {course.id}
                    </Box>
                    <Flex justifyContent="space-between" alignItems="center">
                      <Box maxW="60%">
                        <Flex align="center" gap={2} overflow="hidden" whiteSpace="nowrap">
                          <Text fontWeight="bold" fontSize={["xl", "2xl", "3xl"]} color="#FFFFFF" overflow="hidden" textOverflow="ellipsis">{course.name}</Text>
                          <Text fontSize="md" color="rgba(255, 255, 255, 0.8)" overflow="hidden" textOverflow="ellipsis">/ {course.vehicle}</Text>
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
                          <Text fontWeight="bold" fontSize="xl" mx={1} color="white">
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
                        <Text fontSize="xs" mt={0} color="white">周回数</Text>
                      </Flex>
                    </Flex>
                    
                    {/* 周回時間の表示 */}
                    <Box mt={2} height="100px">
                      <Text fontSize="xs" fontWeight="semibold" mb={1} color="white">周回タイム:</Text>
                      {course.lapTimes.length > 0 ? (
                        <Box 
                          overflowY="auto" 
                          maxHeight="80px"
                          borderWidth="1px" 
                          borderRadius="md" 
                          borderColor="gray.600" 
                          bg="gray.900"
                          p={2}
                        >
                          <Flex flexWrap="wrap" gap={2}>
                            {course.lapTimes.map((lap, index) => (
                              <Badge
                                key={index}
                                colorScheme={
                                  course.bestLap && lap.timestamp === course.bestLap.timestamp 
                                    ? `${course.color.split('.')[0]}` 
                                    : "gray"
                                }
                                p={2}
                                fontSize="md"
                                borderRadius="md"
                                variant={
                                  course.bestLap && lap.timestamp === course.bestLap.timestamp 
                                    ? "solid" 
                                    : "outline"
                                }
                                color="white"
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
                    borderColor="gray.600"
                    bg="gray.900"
                    display="flex" 
                    justifyContent="center" 
                    alignItems="center"
                  >
                    <Text color="gray.400" fontSize="sm">周回データがありません</Text>
                  </Box>
                      )}
                    </Box>
                    
                    {course.totalLaps > 0 && (
                      <Flex gap={1} w="100%" h="20px" position="relative" overflow="hidden" borderRadius="full">
                        {[...Array(course.totalLaps)].map((_, index) => (
                          <Box
                            key={index}
                            flex={1}
                            bg={index < course.currentLap ? course.color : 'gray.600'}
                            transition="background-color 0.3s"
                            _first={{ borderLeftRadius: 'full' }}
                            _last={{ borderRightRadius: 'full' }}
                          />
                        ))}
                      </Flex>
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
              justifyContent="flex-start"
              alignItems="stretch"
              h="100%"
              w="100%"
              bg="gray.800"
              borderColor="gray.700"
            >
              <VStack spacing={3} width="100%" align="stretch">
                <VStack spacing={4} width="100%" align="stretch">
                  {/* レース番号表示 */}
                  <Box width="100%">
                    <HStack alignItems="center" gap={2} mb={2} width="100%">
                      <Text fontSize="lg" fontWeight="medium" color="white" minW="auto">レース番号</Text>
                      <Button
                        onClick={() => updateRaceNumber(Math.max(1, currentRaceNumber - 1))}
                        colorScheme="red"
                        variant="outline"
                        size="sm"
                      >
                        -
                      </Button>
                      <Button
                        onClick={() => updateRaceNumber(currentRaceNumber + 1)}
                        colorScheme="blue"
                        variant="outline"
                        size="sm"
                      >
                        +
                      </Button>
                      {/* ここに隙間 */}
                      <div style={{ flexGrow: 1 }}></div>
                      <Button
                        colorScheme="cyan"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setRaceType('');  // レースタイプをクリア
                        }}
                      >
                        通常レース
                      </Button>
                      <Button
                        colorScheme="yellow"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          updateRaceNumber(0);
                          setRaceType('敗者復活戦');
                        }}
                      >
                        敗者復活戦
                      </Button>
                      <Button
                        colorScheme="orange"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          updateRaceNumber(0);
                          setRaceType('準決勝');
                        }}
                      >
                        準決勝
                      </Button>
                      <Button
                        colorScheme="red"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          updateRaceNumber(0);
                          setRaceType('決勝');
                        }}
                      >
                        決勝
                      </Button>
                    </HStack>
                    <Box 
                      fontSize={["4xl", "5xl", "6xl", "7xl"]}
                      fontWeight="bold"
                      color="cyan.400"
                      p={3}
                      py={10} // パディングを増やして高さを調整
                      borderRadius="lg"
                      bg="gray.900"
                      border="1px solid"
                      borderColor="gray.700"
                      boxShadow="dark-lg"
                      textAlign="center"
                      width="100%"
                      display="flex"
                      flexDirection="column"
                      justifyContent="center"
                      alignItems="center"
                      fontFamily="RocknRoll One"
                    >
                      <Text color={
                        raceType === '敗者復活戦' ? 'yellow.400' :
                        raceType === '準決勝' ? 'orange.400' :
                        raceType === '決勝' ? 'red.400' :
                        '#FFFFFF'
                      }>
                        {raceType ? raceType : `第${currentRaceNumber}レース`}
                      </Text>
                    </Box>
                  </Box>

                  {/* 経過時間表示 */}
                  <Box width="100%">
                    <Text fontSize="lg" fontWeight="medium" color="white">総経過時間</Text>
                    <Box 
                      fontSize={["3xl", "4xl", "5xl", "8xl"]} // フォントサイズを大きく
                      fontWeight="bold"
                      color="cyan.400"
                      p={3}
                      py={12} // パディングを増やしてさらに高さを調整
                      borderRadius="lg"
                      bg="gray.900"
                      border="1px solid"
                      borderColor="gray.700"
                      boxShadow="dark-lg"
                      textAlign="center"
                      width="100%"
                      display="flex"
                      flexDirection="column"
                      justifyContent="center"
                      alignItems="center"
                      fontFamily="mono"
                    >
                      <Text as="span" display="flex" gap={0.1} color="#FFFFFF">
                      <Text as="span" w="2ch" color="#FFFFFF">{formatTime(elapsedTime).substring(0, 2)}</Text>
                      <Text as="span" color="rgba(255, 255, 255, 0.7)">:</Text>
                      <Text as="span" w="2ch" color="#FFFFFF">{formatTime(elapsedTime).substring(3, 5)}</Text>
                      <Text as="span" color="rgba(255, 255, 255, 0.7)">.</Text>
                      <Text as="span" w="2ch" color="#FFFFFF">{formatTime(elapsedTime).substring(6, 8)}</Text>
                      </Text>
                    </Box>
                  </Box>

                  {/* ここにでか文字 */}
                  <Box width="100%" mt={"10px"}></Box>
                    <Text fontSize="3xl" fontWeight="medium" color="white" textAlign="center">↓↓↓このカウンター画面の製作者↓↓↓</Text>
                    <Box 
                      fontSize={["3xl", "4xl", "5xl", "6xl"]}
                      fontWeight="bold"
                      color="cyan.400"
                      p={3}
                      py={12}
                      borderRadius="lg"
                      bg="gray.900"
                      border="1px solid"
                      borderColor="gray.700"
                      boxShadow="dark-lg"
                      textAlign="center"
                      width="100%"
                      display="flex"
                      flexDirection="column"
                      justifyContent="center"
                      alignItems="center"
                      fontFamily="mono"
                    >
                      <Text color="#FFFFFF">KOTANI RYOTA</Text>
                    </Box>
                </VStack>
              </VStack>
            </Box>
          </Grid>
          
          {/* コントロールボタン */}
          <Flex justifyContent="center" gap={3} mt={5} width="100%">
            <Button 
              colorScheme="yellow" 
              size="md" 
              py={6}
              px={8}
              fontSize="lg"
              fontWeight="bold"
              flex={1}
              boxShadow="lg"
              _hover={{ transform: "translateY(-2px)", boxShadow: "xl" }}
              _active={{ transform: "translateY(0px)" }}
              transition="all 0.2s"
              onClick={handleGatePrep}
            >
              ゲート準備
            </Button>
            <Button 
              colorScheme={isRunning ? "orange" : "cyan"} 
              size="md" 
              onClick={toggleTimer}
              py={6}
              px={8}
              fontSize="lg"
              fontWeight="bold"
              flex={1}
              boxShadow="lg"
              _hover={{ transform: "translateY(-2px)", boxShadow: "xl" }}
              _active={{ transform: "translateY(0px)" }}
              transition="all 0.2s"
            >
              {isRunning ? "一時停止" : "スタート"}
            </Button>
            <Button 
              colorScheme="blue" 
              size="md" 
              py={6}
              px={8}
              fontSize="lg"
              fontWeight="bold"
              flex={1}
              boxShadow="lg"
              _hover={{ transform: "translateY(-2px)", boxShadow: "xl" }}
              _active={{ transform: "translateY(0px)" }}
              transition="all 0.2s"
              onClick={handleGateAuto}
            >
              ゲート自動
            </Button>
            <Button 
              colorScheme="red" 
              size="md" 
              onClick={resetTimer}
              py={6}
              px={8}
              fontSize="lg"
              fontWeight="bold"
              flex={1}
              boxShadow="lg"
              _hover={{ transform: "translateY(-2px)", boxShadow: "xl" }}
              _active={{ transform: "translateY(0px)" }}
              transition="all 0.2s"
            >
              リセット
            </Button>
            <Button 
              colorScheme="purple" 
              size="md"
              py={6}
              px={8}
              fontSize="lg"
              fontWeight="bold"
              flex={1}
              onClick={onOpen}
              isDisabled={!isRunning && elapsedTime === 0}
              boxShadow="lg"
              _hover={{ transform: "translateY(-2px)", boxShadow: "xl" }}
              _active={{ transform: "translateY(0px)" }}
              transition="all 0.2s"
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
              <AlertDialogContent bg="gray.800" borderColor="gray.700">
                <AlertDialogHeader fontSize="lg" fontWeight="bold" color="white">
                  レースを終了する
                </AlertDialogHeader>

                <AlertDialogBody color="white">
                  レースを終了し、結果を保存しますか？この操作は元に戻せません。
                </AlertDialogBody>

                <AlertDialogFooter>
                  <Button 
                    ref={cancelRef} 
                    onClick={onClose} 
                    variant="outline"
                    color="white"
                    borderColor="gray.400"
                    _hover={{
                      bg: "gray.700",
                      borderColor: "white"
                    }}
                  >
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
        </VStack>
      </Container>
    </React.Fragment>
  )
}
