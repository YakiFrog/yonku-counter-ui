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
import { keyframes } from '@emotion/react'
import { useRouter } from 'next/router'

import { Container } from '../components/Container'
import { Footer } from '../components/Footer'
import { TabNavigation } from '../components/TabNavigation'
import { useAppSettingsContext } from '../utils/AppSettingsContext'
import { useSerial } from '../utils/SerialContext'
import { Race, RaceResult, RaceLap } from '../utils/types'

// 光るアニメーション
const glowAnimation = keyframes`
  0% { 
    box-shadow: 0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor, 0 0 20px currentColor; 
  }
  50% { 
    box-shadow: 0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor, 0 0 40px currentColor; 
  }
  100% { 
    box-shadow: 0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor, 0 0 20px currentColor; 
  }
`;

export default function HomePage() {
  const { settings, isLoading, saveRaceResult } = useAppSettingsContext();
  const toast = useToast();
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef();
  
  // スライドショー関連のstate
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [slideshowImages, setSlideshowImages] = useState([]);
  const [slideDirection, setSlideDirection] = useState('left');
  const [isSliding, setIsSliding] = useState(false);
  
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
  
  // 完走コースIDを管理
  const [finishedCourseIds, setFinishedCourseIds] = useState([]);
  
  // 最後に押されたボタンを追跡
  const [lastPressedButton, setLastPressedButton] = useState(null);

  // タイマーのID保持用
  const timerRef = useRef(null);
  const slideshowTimerRef = useRef(null);
  const buttonGlowTimerRef = useRef(null);
  
  // 光るボタンエフェクトを一定時間後に消去
  useEffect(() => {
    if (lastPressedButton) {
      // 既存のタイマーをクリア
      if (buttonGlowTimerRef.current) {
        clearTimeout(buttonGlowTimerRef.current);
      }
      
      // 3秒後に光るエフェクトを停止
      buttonGlowTimerRef.current = setTimeout(() => {
        setLastPressedButton(null);
      }, 3000);
    }
    
    return () => {
      if (buttonGlowTimerRef.current) {
        clearTimeout(buttonGlowTimerRef.current);
      }
    };
  }, [lastPressedButton]);

  const { write: serialWrite, messages, clearMessages } = useSerial();

  // スライドショーの初期化
  useEffect(() => {
    // slideshowフォルダの画像リストを設定
    const images = [
      '/slideshow/oit.png',
      '/slideshow/thecrafters.png',
      '/slideshow/miniyonku.png',
      '/slideshow/qr.png',
      '/slideshow/sirius.png',
    ];
    setSlideshowImages(images);
  }, []);

  // レースタイプの復元
  useEffect(() => {
    // ローカルストレージからレースタイプを復元
    const savedRaceType = localStorage.getItem('currentRaceType');
    if (savedRaceType !== null) { // null以外の場合は復元（空文字列も含む）
      setRaceType(savedRaceType);
    }
  }, []);

  // スライドショーの自動切り替え
  useEffect(() => {
    if (slideshowImages.length > 1) {
      slideshowTimerRef.current = setInterval(() => {
        setIsSliding(true);
        setCurrentSlideIndex((prevIndex) => 
          (prevIndex + 1) % slideshowImages.length
        );
        setTimeout(() => setIsSliding(false), 500);
      }, 6000); // 6秒ごとに切り替え
    }

    return () => {
      if (slideshowTimerRef.current) {
        clearInterval(slideshowTimerRef.current);
      }
    };
  }, [slideshowImages]);

  // シリアルポートからのデータを監視するeffect
  useEffect(() => {
    // messagesに変更があった場合、最新のメッセージを処理
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      
      // 受信したデータを数値に変換
      const courseNumber = parseInt(latestMessage);
      
      // タイマーが実行中、シリアル入力が有効、そして1から4の数値であれば対応するコースの周回数をインクリメント
      if (isRunning && settings.serialCountEnabled && courseNumber >= 1 && courseNumber <= 4) {
        if (raceType === 'タイムアタック') {
          // タイムアタックモードでは2,3,4コース目のセンサーデータのみでラップタイムを計算
          if (courseNumber >= 2 && courseNumber <= 4) {
            incrementLap(1); // 常に1コース目のデータを更新
          }
        } else {
          // 通常レースモードでは各コースのセンサーデータでそのコースの周回数を更新
          incrementLap(courseNumber);
        }
      }
    }
  }, [messages, isRunning, settings.serialCountEnabled, raceType]);  // raceTypeを依存配列に追加

  // キーボードイベントハンドラ
  // 修正履歴: 2025/05/24 - キーボード操作でカウントアップできない問題を修正
  // 問題: useEffectの依存配列が空[]だったため、isRunningの状態変更が反映されない
  // 修正: 依存配列に[isRunning]を追加してキーボードイベントハンドラーが適切に更新されるように変更
  // 追加履歴: 2025/05/24 - 5,6,7,8キーでRevert機能（直前の周回数増加を戻す）を追加
  // 追加履歴: 2025/07/26 - a,s,d,fキーでシリアル送信機能を追加
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const keyPressed = parseInt(event.key);
      const keyChar = event.key.toLowerCase();
      
      // a,s,d,fキーの処理（シリアル送信）
      if (['a', 's', 'd', 'f'].includes(keyChar)) {
        serialWrite(keyChar).catch(error => {
          console.error(`Failed to send ${keyChar} command:`, error);
          toast({
            title: 'エラー',
            description: `${keyChar}コマンドの送信に失敗しました`,
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        });
        return;
      }
      
      if (isRunning) {
        if (raceType === 'タイムアタック') {
          // タイムアタックモードでは2,3,4キーでラップタイムを計算
          if (keyPressed >= 2 && keyPressed <= 4) {
            incrementLap(1); // 常に1コース目のデータを更新
          }
          // 7,8,9キーでRevert機能（2,3,4コース目に対応）
          else if (keyPressed >= 7 && keyPressed <= 9) {
            decrementLap(1); // 常に1コース目のデータを更新
          }
        } else {
          // 通常レースモードでは1-4のキーが押された場合、対応するコースの周回数を増やす
          if (keyPressed >= 1 && keyPressed <= 4) {
            incrementLap(keyPressed);
          }
          // 6-9のキーが押された場合、対応するコース（1-4）の周回数を減らす（Revert機能）
          else if (keyPressed >= 6 && keyPressed <= 9) {
            const courseId = keyPressed - 5; // 6は1、7は2、8は3、9は4にマッピング
            decrementLap(courseId);
          }
        }
      }
    };

    // イベントリスナーの登録
    window.addEventListener('keypress', handleKeyPress);

    // クリーンアップ
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
    };
  }, [isRunning, raceType, serialWrite, toast]);  // serialWriteとtoastを依存配列に追加

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
          totalLaps: raceType === 'タイムアタック' ? 3 : (settings.lapCount || 0), // タイムアタックの場合は3回
          time: 0,
          bestLap: null,
          lapTimes: [], // 周回ごとの記録時間
          lastLapTime: 0, // 前回のラップ完了時の時間
          finishTime: null, // 全周回完了時の時間
        };
      });
      
      setCourseData(updatedCourseData);
    }
  }, [settings, isLoading, raceType]); // raceTypeを依存配列に追加

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

  // ゲート準備コマンド送信
  const handleGatePrep = async () => {
    setLastPressedButton('gatePrep');
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
    setLastPressedButton('gateAuto');
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
    setLastPressedButton('startStop');
    if (!isRunning) {
      // スタート
      clearMessages(); // シリアル入力メッセージをクリア
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

  // レースタイプを変更し、ローカルストレージに保存するヘルパー関数
  const updateRaceType = (newRaceType) => {
    setRaceType(newRaceType);
    localStorage.setItem('currentRaceType', newRaceType);
  };

  // タイマーのリセット
  const resetTimer = () => {
    setLastPressedButton('reset');
    setIsRunning(false);
    setElapsedTime(0);
    // レースタイプはリセットしない（現在の状態を維持）
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
    setLastPressedButton('finish');
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
        position: 1, // 仮の順位（タイムアタックの場合は後でランキング画面で計算）
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
    
    // 通常レースの場合のみ順位を計算（タイムアタックは表示時に計算）
    if (raceType !== 'タイムアタック') {
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
    }
    
    // レース情報を作成
    const race: Race = {
      id: `race-${Date.now()}`,
      name: raceType === '決勝' ? '決勝' : 
            raceType ? `${raceType} 第${currentRaceNumber}レース` : `第${currentRaceNumber}レース`,
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
    
    // レースタイプに応じて次のレースの準備
    if (raceType === 'タイムアタック') {
      // タイムアタックの場合は番号をインクリメントして、レースタイプを維持
      updateRaceNumber(currentRaceNumber + 1);
      // レースタイプはそのまま維持（ローカルストレージは既に保存済み）
    } else if (raceType === '決勝') {
      // 決勝の場合は番号を変更せず、レースタイプをリセット
      updateRaceType('');
    } else if (raceType === '敗者復活戦' || raceType === '準決勝') {
      // 敗者復活戦・準決勝の場合は番号をインクリメントして同じレースタイプを維持
      updateRaceNumber(currentRaceNumber + 1);
      // レースタイプはそのまま維持（ローカルストレージは既に保存済み）
    } else {
      // 通常レースの場合は番号をインクリメントしてレースタイプをリセット
      updateRaceNumber(currentRaceNumber + 1);
      updateRaceType('');
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
  
  // タイムアタックの暫定上位を取得する関数
  const getTimeAttackRanking = () => {
    if (!settings?.races || settings.races.length === 0) return [];
    
    // 全てのタイムアタック結果を取得
    const allTimeAttackResults = settings.races
      .filter(r => r.raceType === 'タイムアタック')
      .flatMap(r => r.results)
      .map(result => ({
        ...result,
        timeForSort: parseTime(result.totalTime)
      }))
      .sort((a, b) => {
        const aLaps = a.laps?.length || 0;
        const bLaps = b.laps?.length || 0;
        if (aLaps !== bLaps) return bLaps - aLaps;
        return a.timeForSort - b.timeForSort;
      });
    
    // 上位3位まで返す
    return allTimeAttackResults.slice(0, 3);
  };

  // 現在走行中の選手を取得する関数
  const getCurrentRunner = () => {
    if (raceType !== 'タイムアタック' || !isRunning) return null;
    
    // タイムアタック時の現在の走者情報を取得（1コース目のデータ）
    const currentCourse = courseData[0];
    if (!currentCourse || !currentCourse.name) return null;
    
    return {
      name: currentCourse.name,
      teamName: currentCourse.teamName,
      vehicleName: currentCourse.vehicle,
      currentLap: currentCourse.currentLap,
      totalLaps: currentCourse.totalLaps,
      lapTimes: currentCourse.lapTimes,
      bestLap: currentCourse.bestLap,
      time: currentCourse.time
    };
  };

  // 特定コースの周回数を増やす
  const incrementLap = (courseId) => {
    setCourseData(prev => {
      let finished = false;
      const updated = prev.map(course => {
        if (course.id === courseId && (course.totalLaps === 0 || course.currentLap < course.totalLaps)) {
          const currentTime = course.time;
          const lapTime = currentTime - course.lastLapTime;
          const newLapTime = {
            lapNumber: course.currentLap + 1,
            time: formatTime(lapTime),
            timestamp: lapTime
          };
          let bestLap = course.bestLap;
          if (!bestLap || (lapTime < bestLap.timestamp && lapTime > 0)) {
            bestLap = newLapTime;
          }
          const newLapTimes = [...course.lapTimes, newLapTime];
          const newLapCount = course.currentLap + 1;
          const isFinished = course.totalLaps > 0 && newLapCount >= course.totalLaps;
          if (isFinished && course.finishTime === null) finished = true;
          return {
            ...course,
            currentLap: newLapCount,
            lapTimes: newLapTimes,
            lastLapTime: currentTime,
            bestLap,
            finishTime: isFinished && course.finishTime === null ? currentTime : course.finishTime
          };
        }
        return course;
      });
      if (finished) setFinishedCourseIds(ids => [...ids, courseId]);
      return updated;
    });
  };
  
  // 特定コースの周回数を減らす
  const decrementLap = (courseId) => {
    setCourseData(prev => {
      let wasFinished = false;
      const updated = prev.map(course => {
        if (course.id === courseId && course.currentLap > 0) {
          const newLapTimes = [...course.lapTimes];
          newLapTimes.pop();
          let bestLap = null;
          if (newLapTimes.length > 0) {
            bestLap = newLapTimes.reduce((best, current) => best.timestamp < current.timestamp ? best : current);
          }
          const lastLapTime = course.currentLap > 1 
            ? course.lastLapTime - (course.lapTimes[course.lapTimes.length - 1]?.timestamp || 0)
            : 0;
          // 完走状態から解除されたか判定
          const wasCourseFinished = (course.totalLaps > 0 && course.currentLap >= course.totalLaps) || course.finishTime !== null;
          const nowCourseFinished = (course.totalLaps > 0 && (course.currentLap - 1) >= course.totalLaps) || ((course.finishTime !== null) && ((course.currentLap - 1) >= course.totalLaps));
          if (wasCourseFinished && !nowCourseFinished) wasFinished = true;
          return {
            ...course,
            currentLap: course.currentLap - 1,
            lapTimes: newLapTimes,
            lastLapTime,
            bestLap,
            finishTime: nowCourseFinished ? course.finishTime : null
          };
        }
        return course;
      });
      if (wasFinished) setFinishedCourseIds(ids => ids.filter(id => id !== courseId));
      return updated;
    });
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
      <Container maxHeight="100vh" maxWidth="1920px" px={4} py={3} height="100vh" overflow="hidden">
        <VStack spacing={3} align="stretch" width="full" pb={32} flex={1} height="100%">
          {/* タブナビゲーション */}
          <TabNavigation currentTab="race" />
          {/* レイアウト: 左側にコース情報、右側に大きな経過時間表示 */}
          <Grid templateColumns="5fr 3fr" gap={4} flex={1} height="100%">
            {/* 左側：4コース分のレース情報と周回表示 */}
            <Box pl={"7%"} minHeight="100%"> {/* 左右の余白を縮小 */}
              <VStack spacing={4} align="stretch" minHeight="100%" justify="center"> {/* 縦方向中央揃え */}
                {(raceType === 'タイムアタック' 
                  ? [courseData[0]] // タイムアタックの場合は1コースのみ表示
                  : [...courseData].reverse() // 通常レースの場合は4,3,2,1の順で表示
                ).map((course) => {
                  // 完走判定
                  const isFinished = (course.totalLaps > 0 && course.currentLap >= course.totalLaps) || course.finishTime !== null;
                  
                  return (
                    <Box 
                      key={course.id}
                      p={4} 
                      pl={5}
                      borderWidth="0" 
                      borderRadius="md"
                      shadow="lg"
                      position="relative"
                      bg={isFinished ? "gray.950" : "gray.800"}
                      opacity={isFinished ? 0.5 : 1}
                      transition="all 0.2s"
                      _hover={{
                        transform: "translateX(2px)",
                        boxShadow: "xl"
                      }}
                    >
                    {/* コース番号を左側に横長の背景色付きで表示 */}
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
                      flexDirection="column"
                      bg={raceType === 'タイムアタック' ? 
                        `repeating-linear-gradient(
                          45deg,
                          var(--chakra-colors-yellow-500) -20px,
                          var(--chakra-colors-yellow-500) 40px,
                          var(--chakra-colors-green-500) 40px,
                          var(--chakra-colors-green-500) 100px,
                          var(--chakra-colors-blue-500) 100px,
                          var(--chakra-colors-blue-500) 160px,
                          var(--chakra-colors-red-500) 160px,
                          var(--chakra-colors-red-500) 220px
                        )` : 
                        course.color
                      }
                      boxShadow="dark-lg"
                      zIndex={2}
                      borderLeftRadius="md"
                      borderWidth="3px"
                      borderColor={raceType === 'タイムアタック' ? "gray.400" : course.color}
                      sx={{
                        textShadow: "2px 2px 4px rgba(0,0,0,0.3)"
                      }}
                    >
                      {raceType === 'タイムアタック' ? (
                        <>
                          <Text fontSize="3xl" fontWeight="black" letterSpacing="wider">1~4</Text>
                          <Text fontSize="lg" mt="-2">コース</Text>
                        </>
                      ) : (
                        <>
                          {course.id}
                          <Text fontSize="lg" mt="-2">コース</Text>
                        </>
                      )}
                    </Box>

                    {/* 内側の枠 */}
                    <Box
                      position="absolute"
                      top={0}
                      right={0}
                      bottom={0}
                      left={-35}
                      borderRadius="xl"
                      opacity="0.8"
                      pointerEvents="none"
                      borderWidth={raceType === 'タイムアタック' ? "0" : "5px"}
                      borderColor={raceType !== 'タイムアタック' ? course.color : 'transparent'}
                      sx={raceType === 'タイムアタック' ? {
                        background: `repeating-linear-gradient(
                          45deg,
                          var(--chakra-colors-yellow-500) -20px,
                          var(--chakra-colors-yellow-500) 40px,
                          var(--chakra-colors-green-500) 40px,
                          var(--chakra-colors-green-500) 100px,
                          var(--chakra-colors-blue-500) 100px,
                          var(--chakra-colors-blue-500) 160px,
                          var(--chakra-colors-red-500) 160px,
                          var(--chakra-colors-red-500) 220px
                        )`,
                        padding: '5px',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: '5px',
                          left: '5px',
                          right: '5px',
                          bottom: '5px',
                          borderRadius: 'calc(1rem - 5px)',
                          background: 'var(--chakra-colors-gray-800)',
                          zIndex: -1
                        }
                      } : {}}
                    />

                    <Flex justifyContent="space-between" alignItems="center" position="relative" zIndex={1}>
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
                          <Text fontWeight="bold" fontSize="xl" mx={2} color="white">
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
                            p={1}
                          >
                            +
                          </Button>
                        </Flex>
                        <Text fontSize="xs" mt={0} color="white">周回数</Text>
                      </Flex>
                    </Flex>
                    
                    {/* 周回時間の表示 */}
                    <Box mt={2} height="100px" position="relative" zIndex={10}>
                      <Text fontSize="lg" fontWeight="semibold" mb={1} color="white" position="relative" zIndex={10}>周回タイム:</Text>
                      {course.lapTimes.length > 0 ? (
                        <Box 
                          overflowY="auto" 
                          maxHeight="80px"
                          borderWidth="1px" 
                          borderRadius="md" 
                          borderColor="gray.600" 
                          bg="gray.900"
                          p={2}
                          position="relative"
                          zIndex={10}
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
                                position="relative"
                                zIndex={10}
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
                    position="relative"
                    zIndex={10}
                  >
                    <Text color="gray.400" fontSize="sm" position="relative" zIndex={10}>周回データがありません</Text>
                  </Box>
                      )}
                    </Box>
                    
                    {course.totalLaps > 0 && (
                      <Flex gap={1} w="100%" h="20px" position="relative" overflow="hidden" borderRadius="full">
                        {[...Array(course.totalLaps)].map((_, index) => {
                          // タイムアタックの場合のプログレスバーの色を順番に設定（緑、青、赤）
                          const getProgressColor = (lapIndex) => {
                            if (raceType === 'タイムアタック') {
                              switch (lapIndex) {
                                case 0: return "green.400";
                                case 1: return "blue.400";
                                case 2: return "red.400";
                                default: return "gray.600";
                              }
                            }
                            return course.color; // 通常レースの場合は元の色
                          };
                          
                          return (
                            <Box
                              key={index}
                              flex={1}
                              bg={index < course.currentLap ? getProgressColor(index) : 'gray.600'}
                              transition="background-color 0.3s"
                              _first={{ borderLeftRadius: 'full' }}
                              _last={{ borderRightRadius: 'full' }}
                            />
                          );
                        })}
                      </Flex>
                    )}
                  </Box>
                )})}

                {/* タイムアタック時の暫定順位表示 */}
                {raceType === 'タイムアタック' && (() => {
                  const ranking = getTimeAttackRanking();
                  if (ranking.length === 0) return null;
                  
                  return ranking.map((ranker, index) => {
                    const position = index + 1;
                    const completedLaps = ranker.laps?.length || 0;
                    const totalLaps = 3; // タイムアタックは3周回
                    
                    // 順位に応じた色とラベル設定
                    const getPositionStyle = (pos) => {
                      switch (pos) {
                        case 1: return { 
                          bg: "yellow.500", 
                          borderColor: "yellow.500", 
                          label: "暫定", 
                          rank: "1位",
                          badgeColor: "yellow"
                        };
                        case 2: return { 
                          bg: "gray.500", 
                          borderColor: "gray.500", 
                          label: "暫定", 
                          rank: "2位",
                          badgeColor: "gray"
                        };
                        case 3: return { 
                          bg: "orange.600", 
                          borderColor: "orange.600", 
                          label: "暫定", 
                          rank: "3位",
                          badgeColor: "orange"
                        };
                        default: return { 
                          bg: "blue.500", 
                          borderColor: "blue.500", 
                          label: "暫定", 
                          rank: `${pos}位`,
                          badgeColor: "blue"
                        };
                      }
                    };
                    
                    const positionStyle = getPositionStyle(position);
                    
                    return (
                      <Box 
                        key={`ranking-${index}`}
                        p={4} 
                        pl={5}
                        borderWidth="0" 
                        borderRadius="md"
                        shadow="lg"
                        position="relative"
                        bg="gray.800"
                        transition="all 0.2s"
                        _hover={{
                          transform: "translateX(2px)",
                          boxShadow: "xl"
                        }}
                      >
                        {/* 暫定順位ラベル */}
                        <Box
                          position="absolute"
                          left="-80px"
                          top="0"
                          fontSize="3xl"
                          fontWeight="black"
                          color="white"
                          w="80px"
                          h="100%"
                          display="flex"
                          justifyContent="center"
                          alignItems="center"
                          flexDirection="column"
                          bg={positionStyle.bg}
                          boxShadow="dark-lg"
                          zIndex={2}
                          borderLeftRadius="md"
                          borderWidth="3px"
                          borderColor={positionStyle.borderColor}
                          sx={{
                            textShadow: "2px 2px 4px rgba(0,0,0,0.3)"
                          }}
                        >
                          <Text fontSize="lg" fontWeight="black">{positionStyle.label}</Text>
                          <Text fontSize="4xl" mt="-1">{positionStyle.rank}</Text>
                        </Box>

                        {/* 内側の枠 */}
                        <Box
                          position="absolute"
                          top={0}
                          right={0}
                          bottom={0}
                          left={-35}
                          borderWidth="5px"
                          borderRadius="xl"
                          borderColor={positionStyle.borderColor}
                          opacity="0.8"
                          pointerEvents="none"
                        />

                        <Flex justifyContent="space-between" alignItems="center" position="relative" zIndex={1}>
                          <Box maxW="60%">
                            <Flex align="center" gap={2} overflow="hidden" whiteSpace="nowrap">
                              <Text fontWeight="bold" fontSize={["xl", "2xl", "3xl"]} color="#FFFFFF" overflow="hidden" textOverflow="ellipsis">
                                {ranker.teamName || ranker.playerName}
                              </Text>
                              <Text fontSize="md" color="rgba(255, 255, 255, 0.8)" overflow="hidden" textOverflow="ellipsis">
                                / {ranker.vehicleName}
                              </Text>
                              {ranker.bestLap && (
                                <Badge size="sm" colorScheme={positionStyle.badgeColor} variant="subtle">
                                  ベスト: {ranker.bestLap.time}
                                </Badge>
                              )}
                              <Badge size="sm" colorScheme="green" variant="solid">
                                記録: {ranker.totalTime}
                              </Badge>
                            </Flex>
                          </Box>
                          <Flex direction="column" alignItems="center">
                            <Text fontSize="xl" fontWeight="bold" color="white">
                              {completedLaps} / {totalLaps}
                            </Text>
                            <Text fontSize="xs" mt={0} color="white">周回数</Text>
                          </Flex>
                        </Flex>
                        
                        {/* ラップタイム表示 */}
                        <Box mt={2} height="100px">
                          <Text fontSize="lg" fontWeight="semibold" mb={1} color="white">周回タイム:</Text>
                          {ranker.laps && ranker.laps.length > 0 ? (
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
                                {ranker.laps.map((lap, lapIndex) => (
                                  <Badge
                                    key={lapIndex}
                                    colorScheme={
                                      ranker.bestLap && lap.time === ranker.bestLap.time 
                                        ? positionStyle.badgeColor 
                                        : "gray"
                                    }
                                    p={2}
                                    fontSize="md"
                                    borderRadius="md"
                                    variant={
                                      ranker.bestLap && lap.time === ranker.bestLap.time 
                                        ? "solid" 
                                        : "outline"
                                    }
                                    color="white"
                                  >
                                    {lapIndex + 1}周目: {lap.time}
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
                      </Box>
                    );
                  });
                })()}
              </VStack>
            </Box>
            
            {/* 完走時の順位表示オーバーレイ - 親要素の透明度の影響を受けないように独立配置 */}
            {(() => {
              // 完走したコースのみを取得し、順位を計算
              const finishedCourses = courseData
                .filter(course => {
                  const isFinished = (course.totalLaps > 0 && course.currentLap >= course.totalLaps) || course.finishTime !== null;
                  return isFinished && course.name && finishedCourseIds.includes(course.id);
                })
                .map(course => ({
                  ...course,
                  finalTime: course.finishTime || course.time
                }))
                .sort((a, b) => {
                  if (a.currentLap !== b.currentLap) {
                    return b.currentLap - a.currentLap;
                  }
                  return a.finalTime - b.finalTime;
                });

              return finishedCourses.map((course, index) => {
                const position = index + 1;
                const courseIndex = courseData.length - course.id; // reverse()されているため調整
                // タイムアタック時は1コースのみ表示なので高さを固定
                const topOffset = (raceType === 'タイムアタック')
                  ? 135 // タイムアタック時は1コース目のBoxの高さに合わせて固定
                  : 135 + (courseIndex * 225);
                
                // 順位に応じた色を設定（ランキングタブと統一）
                const getPositionColor = (pos) => {
                  switch (pos) {
                    case 1: return { bg: "rgba(255, 215, 0, 0.95)", border: "yellow.400", shadow: "255, 215, 0" }; // 1位: 金色
                    case 2: return { bg: "rgba(192, 192, 192, 0.95)", border: "gray.400", shadow: "192, 192, 192" }; // 2位: 銀色
                    case 3: return { bg: "rgba(205, 127, 50, 0.95)", border: "orange.400", shadow: "205, 127, 50" }; // 3位: 銅色
                    case 4: return { bg: "rgba(255, 0, 0, 0.95)", border: "red.400", shadow: "255, 0, 0" }; // 4位: 赤色
                    default: return { bg: "rgba(0, 0, 0, 0.95)", border: "green.300", shadow: "72, 187, 120" }; // その他: 緑色
                  }
                };

                const colorScheme = getPositionColor(position);
                
                return (
                  <Box
                    key={`position-overlay-${course.id}`}
                    position="fixed"
                    top={`${topOffset}px`}
                    left="50%"
                    transform="translateX(-50%)"
                    zIndex={1000}
                    bg={colorScheme.bg}
                    borderRadius="full"
                    px={14}
                    py={4}
                    border="4px solid"
                    borderColor={colorScheme.border}
                    boxShadow={`0 0 40px rgba(${colorScheme.shadow}, 1), 0 0 80px rgba(${colorScheme.shadow}, 0.6)`}
                    pointerEvents="none"
                  >
                    <Text
                      fontSize="5xl"
                      fontWeight="black"
                      color="white"
                      textAlign="center"
                      fontFamily="RocknRoll One"
                      textShadow="2px 2px 4px rgba(0,0,0,0.8)"
                    >
                      {(raceType === 'タイムアタック') ? 'ゴール' : `${position}位`}
                    </Text>
                  </Box>
                );
              });
            })()}
            
            
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
              minHeight="750px"
              w="100%"
              bg="gray.800"
              borderColor="gray.700"
            >
              <VStack spacing={3} width="100%" align="stretch" flex={1}>
                <VStack spacing={4} width="100%" align="stretch" flex={1}>
                  {/* レース番号表示 */}
                  <Box width="100%">
                    <HStack alignItems="center" gap={2} mb={2} width="100%">
                      <Text fontSize="md" fontWeight="medium" color="white" minW="auto">レース番号</Text>
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
                        colorScheme="purple"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          updateRaceNumber(0);
                          updateRaceType('タイムアタック');
                        }}
                      >
                        タイムアタック
                      </Button>
                      <Button
                        colorScheme="cyan"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          updateRaceType('');  // レースタイプをクリア
                        }}
                      >
                        通常レース
                      </Button>
                      <Button
                        colorScheme="yellow"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          updateRaceType('敗者復活戦');
                        }}
                      >
                        敗者復活戦
                      </Button>
                      <Button
                        colorScheme="orange"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          updateRaceType('準決勝');
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
                          updateRaceType('決勝');
                        }}
                      >
                        決勝
                      </Button>
                    </HStack>
                    <Box 
                      fontWeight="bold"
                      p={3}
                      py={10} // パディングを増やして高さを調整
                      borderRadius="lg"
                      bg="gray.900"
                      border="1px solid"
                      borderColor="gray.700"
                      boxShadow="dark-lg"
                      textAlign="center"
                      width="100%"
                      height="160px" // 固定の高さを設定
                      display="flex"
                      flexDirection="column"
                      justifyContent="center"
                      alignItems="center"
                      fontFamily="RocknRoll One"
                      letterSpacing={5}
                    >
                      <Box 
                        width="100%"
                        height="100%"
                        display="flex"
                        flexDirection="column"
                        justifyContent="center"
                        alignItems="center"
                        fontSize={["4xl", "5xl", "6xl", "7xl"]}
                        color={
                          raceType === 'タイムアタック' ? 'purple.400' :
                          raceType === '敗者復活戦' ? 'yellow.400' :
                          raceType === '準決勝' ? 'orange.400' :
                          raceType === '決勝' ? 'red.400' :
                          '#FFFFFF'
                        }
                      >
                        {raceType === '決勝' ? (
                          <Text fontSize="1em" lineHeight="1" color="red.400">決勝</Text>
                        ) : raceType ? (
                          <>
                            <Text fontSize="0.8em" lineHeight="1.1" color={
                              raceType === 'タイムアタック' ? 'purple.400' :
                              raceType === '敗者復活戦' ? 'yellow.400' :
                              raceType === '準決勝' ? 'orange.400' :
                              '#FFFFFF'
                            }>{raceType}</Text>
                            <Text fontSize="0.5em" lineHeight="1" mt={1} color={
                              raceType === 'タイムアタック' ? 'purple.400' :
                              raceType === '敗者復活戦' ? 'yellow.400' :
                              raceType === '準決勝' ? 'orange.400' :
                              '#FFFFFF'
                            }>第{currentRaceNumber}レース</Text>
                          </>
                        ) : (
                          <Text fontSize="1em" lineHeight="1" color="#FFFFFF">第{currentRaceNumber}レース</Text>
                        )}
                      </Box>
                    </Box>
                  </Box>

                  {/* 経過時間表示 */}
                  <Box width="100%">
                    <Text fontSize="lg" fontWeight="medium" color="white">ストップウォッチ</Text>
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

                  {/* スライドショー */}
                  <Box width="100%" mt={"10px"} flex={1} minHeight="335px">
                    <Box 
                      px={4}
                      py={4}
                      borderRadius="lg"
                      bg="gray.900"
                      border="1px solid"
                      borderColor="gray.700"
                      boxShadow="dark-lg"
                      textAlign="center"
                      width="100%"
                      height="100%"
                      minHeight="335px"
                      display="flex"
                      flexDirection="column"
                      justifyContent="center"
                      alignItems="center"
                      position="relative"
                      overflow="hidden"
                    >
                      {/* スライドショー画像表示エリア */}
                      <Box
                        width="100%"
                        flex={1}
                        minHeight="300px"
                        position="relative"
                        borderRadius="md"
                        overflow="hidden"
                        bg="gray.200"
                      >
                        {slideshowImages.length > 0 && (
                          <>
                            {slideshowImages.map((image, index) => (
                              <Box
                                key={index}
                                position="absolute"
                                top={0}
                                left={0}
                                width="100%"
                                height="100%"
                                opacity={index === currentSlideIndex ? 1 : 0}
                                transform={`translateX(${
                                  index === currentSlideIndex ? "0" :
                                  index > currentSlideIndex ? "100%" : "-100%"
                                })`}
                                transition="all 0.5s ease-in-out"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                style={{
                                  transformOrigin: "center center"
                                }}
                              >
                                <img
                                  src={image}
                                  alt={`Slideshow ${index + 1}`}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "contain",
                                    borderRadius: "8px"
                                  }}
                                />
                              </Box>
                            ))}
                          </>
                        )}

                        {/* ローディング表示 */}
                        {slideshowImages.length === 0 && (
                          <Text color="gray.400" fontSize="lg">
                            画像を読み込み中...
                          </Text>
                        )}
                        
                        {/* スライドインジケーター */}
                        {slideshowImages.length > 1 && (
                          <HStack
                            position="absolute"
                            bottom="10px"
                            left="50%"
                            transform="translateX(-50%)"
                            spacing={2}
                            zIndex={2}
                          >
                            {slideshowImages.map((_, index) => (
                              <Box
                                key={index}
                                width="8px"
                                height="8px"
                                borderRadius="full"
                                bg={index === currentSlideIndex ? "white" : "rgba(255,255,255,0.4)"}
                                transition="background-color 0.3s"
                                cursor="pointer"
                                onClick={() => setCurrentSlideIndex(index)}
                              />
                            ))}
                          </HStack>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </VStack>
              </VStack>
            </Box>
          </Grid>
          
          {/* コントロールボタン */}
          {/* コントロールボタンを画面下部に固定 */}
          <Flex
            justifyContent="center"
            gap={3}
            width="100%"
            position="fixed"
            left={0}
            bottom={0}
            zIndex={2000}
            bg="rgba(30,30,30,0.98)"
            py={3}
            px={4}
            boxShadow="0 -4px 24px rgba(0,0,0,0.3)"
            style={{ backdropFilter: 'blur(6px)' }}
          >
            <Button 
              colorScheme="yellow" 
              size="md" 
              py={8}
              px={8}
              fontSize="lg"
              fontWeight="bold"
              flex={1}
              boxShadow="lg"
              _hover={{ transform: "translateY(-2px)", boxShadow: "xl" }}
              _active={{ transform: "translateY(0px)" }}
              transition="all 0.2s"
              onClick={handleGatePrep}
              color="white"
              sx={{
                textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                ...(lastPressedButton === 'gatePrep' && {
                  animation: `${glowAnimation} 1.5s ease-in-out infinite`
                })
              }}
            >
              ゲート準備
            </Button>
            <Button 
              colorScheme={isRunning ? "orange" : "cyan"} 
              size="md" 
              onClick={toggleTimer}
              py={8}
              px={8}
              fontSize="lg"
              fontWeight="bold"
              flex={1}
              boxShadow="lg"
              _hover={{ transform: "translateY(-2px)", boxShadow: "xl" }}
              _active={{ transform: "translateY(0px)" }}
              transition="all 0.2s"
              color="white"
              sx={{
                textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                ...(lastPressedButton === 'startStop' && {
                  animation: `${glowAnimation} 1.5s ease-in-out infinite`
                })
              }}
            >
              {isRunning ? "一時停止" : "スタート"}
            </Button>
            <Button 
              colorScheme="blue" 
              size="md" 
              py={8}
              px={8}
              fontSize="lg"
              fontWeight="bold"
              flex={1}
              boxShadow="lg"
              _hover={{ transform: "translateY(-2px)", boxShadow: "xl" }}
              _active={{ transform: "translateY(0px)" }}
              transition="all 0.2s"
              onClick={handleGateAuto}
              color="white"
              sx={{
                textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                ...(lastPressedButton === 'gateAuto' && {
                  animation: `${glowAnimation} 1.5s ease-in-out infinite`
                })
              }}
            >
              ゲート自動
            </Button>
            <Button 
              colorScheme="red" 
              size="md" 
              onClick={resetTimer}
              py={8}
              px={8}
              fontSize="lg"
              fontWeight="bold"
              flex={1}
              boxShadow="lg"
              _hover={{ transform: "translateY(-2px)", boxShadow: "xl" }}
              _active={{ transform: "translateY(0px)" }}
              transition="all 0.2s"
              color="white"
              sx={{
                textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                ...(lastPressedButton === 'reset' && {
                  animation: `${glowAnimation} 1.5s ease-in-out infinite`
                })
              }}
            >
              リセット
            </Button>
            <Button 
              colorScheme="purple" 
              size="md"
              py={8}
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
              color="white"
              sx={{
                textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                ...(lastPressedButton === 'finish' && {
                  animation: `${glowAnimation} 1.5s ease-in-out infinite`
                })
              }}
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
