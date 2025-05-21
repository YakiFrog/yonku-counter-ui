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
  StatGroup
} from '@chakra-ui/react'

import { Container } from '../components/Container'
import { Footer } from '../components/Footer'
import { Hero } from '../components/Hero'
import { TabNavigation } from '../components/TabNavigation'

export default function HomePage() {
  // ストップウォッチの状態
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // 各コースのデータを管理する状態
  const [courseData, setCourseData] = useState([
    { id: 1, name: '選手1', vehicle: '車両1', color: 'red.500', currentLap: 2, totalLaps: 5, time: 0, bestLap: null },
    { id: 2, name: '選手2', vehicle: '車両2', color: 'blue.500', currentLap: 3, totalLaps: 5, time: 0, bestLap: null },
    { id: 3, name: '選手3', vehicle: '車両3', color: 'green.500', currentLap: 1, totalLaps: 5, time: 0, bestLap: null },
    { id: 4, name: '選手4', vehicle: '車両4', color: 'purple.500', currentLap: 4, totalLaps: 5, time: 0, bestLap: null },
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

  // リセット
  const resetTimer = () => {
    setIsRunning(false);
    setElapsedTime(0);
    setCourseData(prev => 
      prev.map(course => ({
        ...course,
        time: 0,
        currentLap: 0
      }))
    );
  };
  
  // 特定コースの周回数を増やす
  const incrementLap = (courseId) => {
    setCourseData(prev => 
      prev.map(course => 
        course.id === courseId && course.currentLap < course.totalLaps
          ? { ...course, currentLap: course.currentLap + 1 }
          : course
      )
    );
  };
  
  // 特定コースの周回数を減らす
  const decrementLap = (courseId) => {
    setCourseData(prev => 
      prev.map(course => 
        course.id === courseId && course.currentLap > 0
          ? { ...course, currentLap: course.currentLap - 1 }
          : course
      )
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
        <title>四駆カウンター - レース管理システム</title>
      </Head>
      <Container maxHeight="100vh" maxWidth="full" px={2} py={4}>
        <VStack spacing={6} align="stretch" width="full">
          {/* タブナビゲーション */}
          <TabNavigation currentTab="race" />
          
          <Flex justifyContent="space-between" alignItems="center" pb={2}>
            <Heading size="lg">レース管理</Heading>
            <Badge colorScheme={isRunning ? "green" : "gray"} fontSize="xl" p={2} borderRadius="md">
              {isRunning ? "レース中" : "準備中"}
            </Badge>
          </Flex>
          
          {/* レイアウト: 左側にコース情報、右側に大きな経過時間表示 */}
          <Grid templateColumns="2fr 1fr" gap={6}>
            {/* 左側：4コース分のレース情報と周回表示 */}
            <Box pl={100} pr={2}> {/* 左右の余白を調整 */}
              <VStack spacing={6} align="stretch"> {/* 間隔を広げる */}
                {[...courseData].reverse().map((course) => (
                  <Box 
                    key={course.id}
                    p={4} 
                    pl={6}  // 左側に余白を追加して数字のスペースを確保
                    borderWidth="1px" 
                    borderRadius="lg" 
                    borderLeftWidth="8px" 
                    borderLeftColor={course.color} 
                    shadow="md"
                    position="relative"  // 絶対配置の基準点
                  >
                    {/* 大きなコース番号を左側に表示（枠外に） - 常に「4,3,2,1」の順で表示 */}
                    <Box
                      position="absolute"
                      left="-100px"
                      top="50%"
                      transform="translateY(-50%)"
                      fontSize="6xl"
                      fontWeight="black"
                      color={course.color}
                      w="80px"
                      h="80px"
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                      borderRadius="full"
                      bg="white"
                      _dark={{ bg: "gray.800" }}
                      boxShadow="lg"
                      border="4px solid"
                      borderColor={course.color}
                      zIndex={2}
                    >
                      {course.id}
                    </Box>
                    <Flex justifyContent="space-between" alignItems="center">
                      <Box>
                        <Text fontWeight="bold" fontSize="lg">{course.name}</Text>
                        <Text fontSize="sm">車両: {course.vehicle}</Text>
                      </Box>
                      <Flex direction="column" alignItems="center">
                        <Flex alignItems="center">
                          <Button 
                            size="sm" 
                            onClick={() => decrementLap(course.id)}
                            isDisabled={course.currentLap <= 0}
                            colorScheme={course.color.split('.')[0]}
                            variant="outline"
                            mr={2}
                          >
                            -
                          </Button>
                          <Text fontWeight="bold" fontSize="2xl">{course.currentLap} / {course.totalLaps}</Text>
                          <Button 
                            size="sm" 
                            onClick={() => incrementLap(course.id)}
                            isDisabled={course.currentLap >= course.totalLaps}
                            colorScheme={course.color.split('.')[0]}
                            variant="outline"
                            ml={2}
                          >
                            +
                          </Button>
                        </Flex>
                        <Text fontSize="sm" mt={1}>周回数</Text>
                      </Flex>
                    </Flex>
                    <Progress 
                      mt={3} 
                      value={calculateProgress(course.currentLap, course.totalLaps)} 
                      colorScheme={course.color.split('.')[0]} 
                      height="8px"
                      borderRadius="full"
                    />
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
              <VStack spacing={5} w="full">
                <Text fontSize="2xl" fontWeight="medium">総経過時間</Text>
                <Box 
                  fontSize={["4xl", "5xl", "6xl", "7xl"]}
                  fontWeight="bold"
                  color="blue.500"
                  p={4}
                  py={8}
                  borderRadius="xl"
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
                </Box>
                <Flex justifyContent="space-between" w="full" px={2}>
                  <Badge 
                    colorScheme={isRunning ? "green" : "gray"} 
                    fontSize="lg" 
                    p={2} 
                    borderRadius="md"
                  >
                    {isRunning ? "レース中" : "停止中"}
                  </Badge>
                  <Text fontSize="md" color="gray.500">
                    レース: 1
                  </Text>
                </Flex>
              </VStack>
            </Box>
          </Grid>
          
          {/* コントロールボタン */}
          <Flex justifyContent="center" gap={3} mt={2}>
            <Button 
              colorScheme={isRunning ? "orange" : "green"} 
              size="lg" 
              onClick={toggleTimer}
              py={7}
              fontSize="xl"
              flex={1}
            >
              {isRunning ? "一時停止" : "スタート"}
            </Button>
            <Button 
              colorScheme="red" 
              size="lg" 
              onClick={resetTimer}
              py={7}
              fontSize="xl"
              flex={1}
            >
              リセット
            </Button>
            <Button 
              colorScheme="blue" 
              size="lg"
              py={7}
              fontSize="xl"
              flex={1}
            >
              設定
            </Button>
          </Flex>
          
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
