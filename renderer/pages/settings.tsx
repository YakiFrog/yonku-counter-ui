import React, { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import {
  Box,
  Button,
  Center,
  Container,
  FormControl,
  FormLabel,
  Select,
  Text,
  useToast,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  HStack,
  Badge,
  useDisclosure,
  Input,
  VStack,
  Switch,
  Flex,
  Heading,
  IconButton,
  SimpleGrid,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Spinner,
  Stack,
} from '@chakra-ui/react';
import { ChakraProvider } from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { useAppSettingsContext } from '../utils/AppSettingsContext';
import { useSerial } from '../utils/SerialContext';
import { Player } from '../utils/types';
import { TabNavigation } from '../components/TabNavigation';

export default function SettingsPage() {
  const { 
    settings, 
    isLoading,
    updateSettings,
    updateCourse,
    addPlayer: addPlayerToContext,
    updatePlayer: updatePlayerInContext,
    removePlayer: removePlayerFromContext,
    clearRaceResults
  } = useAppSettingsContext();
  
  const {
    serialState,
    connect,
    disconnect,
    refreshPorts,
    messages,
    write
  } = useSerial();
  
  const [availablePorts, setAvailablePorts] = useState<string[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>("");
  const [selectedBaudRate, setSelectedBaudRate] = useState<number>(115200);
  const toast = useToast();

  // AlertDialog用のフック
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  
  // チームリスト
  const [playersState, setPlayersState] = useState<Player[]>([]);
  
  // コンテキストからチームデータをロード
  useEffect(() => {
    const loadPlayers = () => {
      if (!isLoading && settings?.players) {
        console.log('チームデータの更新を開始:', {
          currentPlayers: playersState,
          newPlayers: settings.players
        });
        
        setPlayersState(settings.players);
        
        // ローカルストレージの状態確認
        const storageData = localStorage.getItem('yonkuAppSettings');
        const parsedStorage = storageData ? JSON.parse(storageData) : null;
        
        console.log('ローカルストレージの状態:', {
          rawData: storageData,
          parsedData: parsedStorage,
          playerCount: parsedStorage?.players?.length
        });
      }
    };

    loadPlayers();
  }, [settings?.players, isLoading]);
  
  // 新規チーム・車両入力用の状態
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newVehicleName, setNewVehicleName] = useState('');
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingPlayerName, setEditingPlayerName] = useState('');
  
  // 車両名の編集状態の管理
  const [editingVehiclePlayerId, setEditingVehiclePlayerId] = useState<string | null>(null);
  const [editingVehicleName, setEditingVehicleName] = useState('');

  // シリアルコマンド送信用の状態
  const [command, setCommand] = useState<string>('');

  // 設定送信ハンドラ
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: '設定が自動保存されました',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  // 設定値変更ハンドラ
  const handleUpdateSetting = (field: string, value: any) => {
    updateSettings({ [field]: value });
  };

  // コース情報の更新（選手とマシンの割り当て）
  const updateCourseAssignment = async (courseIndex: number, field: string, value: string) => {
    try {
      console.log('コース割り当て試行:', { courseIndex, field, value });
      console.log('現在の設定状態:', settings);
      console.log('利用可能なプレイヤー:', playersState);

      // 重要: プレイヤーIDの更新時の処理
      // この部分は慎重に扱う必要があり、以下の順序で処理を行う
      if (field === 'playerId') {
        const courseId = settings.courses[courseIndex].id;
        if (value === '') {
          // 重要: プレイヤーの割り当てを解除する場合は、
          // プレイヤーIDと車両IDの両方をnullにする必要がある
          await updateCourse(courseId, { playerId: null, vehicleId: null });
        } else {
          // まず、プレイヤーの割り当てを更新
          const player = playersState.find(p => p.id === value);
          if (!player) {
            throw new Error('選択したプレイヤーが見つかりません');
          }

          // 重要: 他のコースに同じプレイヤーが割り当てられていないことを確認
          // これは競合を防ぐための重要なチェック
          const isAlreadyAssigned = settings.courses.some((course, idx) => 
            idx !== courseIndex && course.playerId === value
          );

          if (isAlreadyAssigned) {
            throw new Error('選択したチームは既に他のコースに割り当てられています');
          }

          // 重要: プレイヤーと車両の割り当てを同時に更新
          // この同期処理は一貫性を保つために不可欠
          const vehicleId = player.vehicle?.id || null;
          await updateCourse(courseId, { playerId: value, vehicleId });
        }
      }

      // 同じチームが他のコースに割り当てられていないかチェック - 重要な検証（二重チェック）
      if (field === 'playerId' && value !== '') {
        const isAlreadyAssigned = settings.courses.some((course, idx) => 
          idx !== courseIndex && course.playerId === value
        );
        
        if (isAlreadyAssigned) {
          toast({
            title: 'エラー',
            description: '選択したチームは既に他のコースに割り当てられています',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          return;
        }
      }
      
      const courseId = settings.courses[courseIndex].id;
      const updatedSettings = updateCourse(courseId, { [field]: value === '' ? null : value });
      console.log('コース更新後の設定:', updatedSettings); // デバッグ用
    } catch (error) {
      console.error('コース割り当てエラー:', error);
      toast({
        title: 'エラー',
        description: 'コースの割り当てに失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // 新規選手の追加
  const addPlayer = () => {
    if (newPlayerName.trim() === '') return;
    
    const newPlayer: Player = {
      id: `p${Date.now()}`,
      name: newPlayerName,
      vehicle: null // 初期状態では車両なし
    };
    
    console.log('新しいプレイヤーを追加:', newPlayer); // デバッグ用
    const updatedSettings = addPlayerToContext(newPlayer);
    console.log('追加後の設定:', updatedSettings); // デバッグ用
    setNewPlayerName('');
    
    toast({
      title: 'チームを追加しました',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  // 選手の削除
  const deletePlayer = (playerId: string) => {
    removePlayerFromContext(playerId);
    
    toast({          title: 'チームを削除しました',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  // 選手名の編集モードの開始
  const startEditingPlayer = (player: Player) => {
    setEditingPlayerId(player.id);
    setEditingPlayerName(player.name);
  };

  // 選手名の保存
  const savePlayerEdit = () => {
    if (!editingPlayerId || editingPlayerName.trim() === '') return;
    
    updatePlayerInContext(editingPlayerId, { name: editingPlayerName });
    
    setEditingPlayerId(null);
    setEditingPlayerName('');
    
    toast({
      title: 'チーム名を更新しました',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };
  
  // 車両名編集モードの開始
  const startEditingVehicle = (playerId: string) => {
    const player = playersState.find(p => p.id === playerId);
    if (!player || !player.vehicle) return;
    
    setEditingVehiclePlayerId(playerId);
    setEditingVehicleName(player.vehicle.name);
  };
  
  // 車両名の保存
  const saveVehicleEdit = () => {
    if (!editingVehiclePlayerId || editingVehicleName.trim() === '') return;
    
    const player = playersState.find(p => p.id === editingVehiclePlayerId);
    if (!player || !player.vehicle) return;
    
    const updatedPlayer = {
      ...player,
      vehicle: { ...player.vehicle, name: editingVehicleName }
    };
    
    updatePlayerInContext(editingVehiclePlayerId, { vehicle: updatedPlayer.vehicle });
    
    setEditingVehiclePlayerId(null);
    setEditingVehicleName('');
    
    toast({
      title: '車両名を更新しました',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  // 選手に車両を設定/更新
  const setVehicleToPlayer = (playerId: string) => {
    if (newVehicleName.trim() === '') return;
    
    const newVehicle = {
      id: `v${Date.now()}`,
      name: newVehicleName
    };
    
    const player = playersState.find(p => p.id === playerId);
    if (player) {
      updatePlayerInContext(playerId, { vehicle: newVehicle });
    }
    
    setNewVehicleName('');
    
    toast({
      title: '車両を更新しました',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  // 車両の削除
  const removeVehicle = (playerId: string) => {
    // プレイヤーから車両を削除
    const playerToUpdate = playersState.find(p => p.id === playerId);
    if (!playerToUpdate || !playerToUpdate.vehicle) return;
    
    updatePlayerInContext(playerId, { vehicle: null });
    
    // この車両が割り当てられているコースの車両IDをクリアする処理は
    // updatePlayerInContext内で処理するのが良い
    
    toast({
      title: '車両を削除しました',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  // 特定の選手の車両を取得する関数
  const getVehicleForPlayer = (playerId: string | null) => {
    if (!playerId) return null;
    const player = playersState.find(p => p.id === playerId);
    return player ? player.vehicle : null;
  };

  // シリアルポート接続ハンドラー
  const handleConnect = async () => {
    if (!selectedPort) {
      toast({
        title: "エラー",
        description: "シリアルポートを選択してください",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await connect(selectedPort, selectedBaudRate);
      toast({
        title: "デバイス接続成功",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "デバイス接続エラー",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // シリアルポート切断ハンドラー
  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast({
        title: "デバイス切断成功",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "デバイス切断エラー",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // ポートリストの更新
  const handleRefreshPorts = async () => {
    try {
      const ports = await refreshPorts();
      setAvailablePorts(ports);
      if (ports.length > 0 && !selectedPort) {
        setSelectedPort(ports[0]);
      }
    } catch (error) {
      toast({
        title: "ポートリストの更新エラー",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // シリアルコマンド送信ハンドラー
  const handleSendCommand = async () => {
    if (!command.trim() || !serialState.isConnected) return;

    try {
      await write(command + '\n');
      setCommand(''); // 送信後にクリア
      toast({
        title: "コマンド送信成功",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "コマンド送信エラー",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // コンポーネントマウント時とボタンクリック時にポートリストを更新
  useEffect(() => {
    handleRefreshPorts();
  }, []);
  
  // ローディング中の表示
  if (isLoading || !settings) {
    return (
      <Container maxWidth="1920px" px={4} py={3}>
        <VStack spacing={4} align="stretch" width="full">
          <TabNavigation currentTab="settings" />
          <Center py={10}>
            <Spinner size="xl" color="white" />
          </Center>
        </VStack>
      </Container>
    );
  }

  // シリアルモニター用のref
  const monitorRef = useRef<HTMLDivElement>(null);

  // シリアルメッセージが更新されたら自動スクロール
  useEffect(() => {
    if (monitorRef.current) {
      monitorRef.current.scrollTop = monitorRef.current.scrollHeight;
    }
  }, [serialState.messages]);

  return (
    <Container maxW="1920px" px={4} py={3}>
      <Head>
        <title>設定 - 四駆カウンター</title>
      </Head>

      <TabNavigation currentTab="settings" />

      <Center flexDirection="column" pt={8} pb={16}>
        {/* メイン設定フォーム */}
        <VStack spacing={6} align="stretch" w="full">
          {/* 設定タブ */}
          <Box as="form" onSubmit={handleSubmit} borderWidth="1px" borderRadius="lg" p={6} shadow="md" bg="gray.800" borderColor="gray.700">
            <Tabs variant="enclosed" colorScheme="blue">
              <TabList mb={4} bg="gray.800" borderBottomColor="gray.700">
                <Tab fontWeight="semibold" color="gray.300" bg="gray.900" borderColor="gray.600" _selected={{ color: "white", bg: "gray.700" }}>基本設定</Tab>
                <Tab fontWeight="semibold" color="gray.300" bg="gray.900" borderColor="gray.600" _selected={{ color: "white", bg: "gray.700" }}>チーム/車両登録</Tab>
                <Tab fontWeight="semibold" color="gray.300" bg="gray.900" borderColor="gray.600" _selected={{ color: "white", bg: "gray.700" }}>コース割り当て</Tab>
                <Tab fontWeight="semibold" color="gray.300" bg="gray.900" borderColor="gray.600" _selected={{ color: "white", bg: "gray.700" }}>デバイス接続</Tab>
              </TabList>
              
              <TabPanels>
                {/* タブ1: 基本設定 */}
                <TabPanel>
                  <VStack spacing={6} align="stretch">
                    <Box>
                      <Heading size="md" mb={4} color="white">基本設定</Heading>
                      
                      <FormControl id="totalLaps" mb={4}>
                        <FormLabel color="white">周回数</FormLabel>
                        <NumberInput 
                          value={settings.lapCount} 
                          min={1} 
                          max={20}
                          onChange={(valueString, valueNumber) => handleUpdateSetting('lapCount', valueNumber)}
                        >
                          <NumberInputField bg="gray.900" borderColor="gray.600" color="white" _hover={{ borderColor: "gray.500" }} />
                          <NumberInputStepper>
                            <NumberIncrementStepper color="gray.400" borderColor="gray.600" />
                            <NumberDecrementStepper color="gray.400" borderColor="gray.600" />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>

                      <FormControl mt="4" display="flex" alignItems="center">
                        <FormLabel mb="0" color="white">サウンド</FormLabel>
                        <Switch 
                          isChecked={settings.soundEnabled} 
                          onChange={(e) => handleUpdateSetting('soundEnabled', e.target.checked)} 
                          colorScheme="cyan"
                        />
                      </FormControl>

                      <FormControl mt="4" display="flex" alignItems="center">
                        <FormLabel mb="0" color="white">シリアル入力からのカウントアップ</FormLabel>
                        <Switch 
                          isChecked={settings.serialCountEnabled} 
                          onChange={(e) => handleUpdateSetting('serialCountEnabled', e.target.checked)} 
                          colorScheme="cyan"
                        />
                      </FormControl>
                    </Box>
                    
                    <Button type="submit" colorScheme="blue" size="lg" mt={4}>
                      設定を保存
                    </Button>
                  </VStack>
                </TabPanel>
                
                {/* タブ2: 選手/車両登録 */}
                <TabPanel>
                  <VStack spacing={6} align="stretch">
                    <Box>
                      <Heading size="md" mb={4} color="white">チームリスト</Heading>
                      
                      {/* 新規チームの追加 */}
                      <Flex mb={5}>
                        <Input
                          placeholder="新しいチーム名"
                          value={newPlayerName}
                          onChange={(e) => setNewPlayerName(e.target.value)}
                          mr={2}
                          bg="gray.900"
                          borderColor="gray.600"
                          color="white"
                          _hover={{ borderColor: "gray.500" }}
                          _placeholder={{ color: "gray.400" }}
                        />
                        <Button
                          leftIcon={<AddIcon />}
                          colorScheme="green"
                          onClick={addPlayer}
                        >
                          追加
                        </Button>
                      </Flex>
                      
                      {/* 選手一覧 */}
                      <Box mb={4}>
                        {playersState.map((player) => (
                          <Box 
                            key={player.id}
                            p={4}
                            mb={3}
                            borderWidth="1px"
                            borderRadius="md"
                            bg="gray.900"
                            borderColor="gray.600"
                          >
                            {/* 選手名の表示/編集 */}
                            <Box mb={3}>
                              {editingPlayerId === player.id ? (
                                <Flex>
                                  <Input
                                    value={editingPlayerName}
                                    onChange={(e) => setEditingPlayerName(e.target.value)}
                                    bg="gray.800"
                                    borderColor="gray.600"
                                    color="white"
                                    _hover={{ borderColor: "gray.500" }}
                                    mr={2}
                                  />
                                  <Button size="sm" colorScheme="blue" onClick={savePlayerEdit}>
                                    保存
                                  </Button>
                                </Flex>
                              ) : (
                                <Flex justifyContent="space-between" alignItems="center">
                                  <Text color="white">{player.name}</Text>
                                  <Flex>
                                    <IconButton
                                      aria-label="Edit player"
                                      icon={<EditIcon />}
                                      size="sm"
                                      mr={2}
                                      onClick={() => startEditingPlayer(player)}
                                    />
                                    <IconButton
                                      aria-label="Delete player"
                                      icon={<DeleteIcon />}
                                      colorScheme="red"
                                      size="sm"
                                      onClick={() => deletePlayer(player.id)}
                                    />
                                  </Flex>
                                </Flex>
                              )}
                            </Box>

                            {/* 車両情報 */}
                            <Box>
                              <Text fontSize="sm" color="gray.300" mb={2}>車両情報:</Text>
                              {player.vehicle ? (
                                <Box>
                                  {editingVehiclePlayerId === player.id ? (
                                    <Flex>
                                      <Input
                                        value={editingVehicleName}
                                        onChange={(e) => setEditingVehicleName(e.target.value)}
                                        bg="gray.800"
                                        borderColor="gray.600"
                                        color="white"
                                        _hover={{ borderColor: "gray.500" }}
                                        mr={2}
                                      />
                                      <Button size="sm" colorScheme="blue" onClick={saveVehicleEdit}>
                                        保存
                                      </Button>
                                    </Flex>
                                  ) : (
                                    <Flex justifyContent="space-between" alignItems="center">
                                      <Text color="white">{player.vehicle.name}</Text>
                                      <Flex>
                                        <IconButton
                                          aria-label="Edit vehicle"
                                          icon={<EditIcon />}
                                          size="xs"
                                          mr={2}
                                          onClick={() => startEditingVehicle(player.id)}
                                        />
                                        <IconButton
                                          aria-label="Remove vehicle"
                                          icon={<DeleteIcon />}
                                          colorScheme="red"
                                          size="xs"
                                          onClick={() => removeVehicle(player.id)}
                                        />
                                      </Flex>
                                    </Flex>
                                  )}
                                </Box>
                              ) : (
                                <Text fontSize="sm" color="gray.400">車両が登録されていません</Text>
                              )}
                              
                              {/* 車両の設定/更新 */}
                              {!player.vehicle && (
                                <Flex mt={3}>
                                  <Input
                                    placeholder="車両名"
                                    size="sm"
                                    value={newVehicleName}
                                    onChange={(e) => setNewVehicleName(e.target.value)}
                                    mr={2}
                                    bg="gray.800"
                                    borderColor="gray.600"
                                    color="white"
                                    _hover={{ borderColor: "gray.500" }}
                                    _placeholder={{ color: "gray.400" }}
                                  />
                                  <Button
                                    size="sm"
                                    leftIcon={<AddIcon />}
                                    colorScheme="green"
                                    onClick={() => setVehicleToPlayer(player.id)}
                                  >
                                    追加
                                  </Button>
                                </Flex>
                              )}
                            </Box>
                          </Box>
                        ))}
                        
                        {playersState.length === 0 && (
                          <Box p={4} borderWidth="1px" borderRadius="md" bg="gray.800" borderColor="gray.600">
                            <Text align="center" color="gray.400">選手が登録されていません</Text>
                          </Box>
                        )}
                      </Box>
                      
                      <Button type="submit" colorScheme="blue" size="lg" mt={4}>
                        設定を保存
                      </Button>
                    </Box>
                  </VStack>
                </TabPanel>
                
                {/* タブ3: コース割り当て */}
                <TabPanel>
                  <VStack spacing={6} align="stretch">
                    <Box>
                      <Heading size="md" mb={4} color="white">コース割り当て</Heading>
                      
                      {/* デバッグ情報表示 */}
                      <Text color="gray.400" fontSize="sm" mb={4}>
                        登録チーム数: {playersState.length} | 
                        設定からのチーム数: {settings?.players?.length || 0}
                      </Text>
                      
                      <SimpleGrid columns={[1, 2]} spacing={6}>
                        {settings.courses.map((course, index) => (
                          <Box key={index} p={4} borderWidth="1px" borderRadius="md" bg="gray.900" borderColor="gray.600">
                            <Heading size="sm" mb={3} color="white">コース {index + 1}</Heading>
                            
                            <FormControl mb={3}>
                              <FormLabel color="white">チーム</FormLabel>
                              <Select
                                value={course.playerId || 'none'}
                                onChange={(e) => {
                                  const playerId = e.target.value === 'none' ? '' : e.target.value;
                                  console.log('選択されたプレイヤーID:', playerId);
                                  console.log('コースの現在の状態:', course);
                                  
                                  updateCourseAssignment(index, 'playerId', playerId)
                                    .then(() => {
                                      toast({
                                        title: '成功',
                                        description: playerId ? 'チームを割り当てました' : 'チームの割り当てを解除しました',
                                        status: 'success',
                                        duration: 2000,
                                        isClosable: true,
                                      });
                                    })
                                    .catch((error) => {
                                      console.error('コース割り当てエラー:', error);
                                      toast({
                                        title: 'エラー',
                                        description: error.message || 'コースの割り当てに失敗しました',
                                        status: 'error',
                                        duration: 3000,
                                        isClosable: true,
                                      });
                                    });
                                }}
                                bg="gray.800"
                                borderColor="gray.600"
                                color="white"
                                _hover={{ borderColor: "gray.500" }}
                              >
                                <option value="none" style={{ backgroundColor: "#1A202C" }}>
                                  チームなし
                                </option>
                                {playersState.length > 0 && 
                                  playersState.map((player) => (
                                    <option key={player.id} value={player.id} style={{ backgroundColor: "#1A202C" }}>
                                      {player.name}{player.vehicle ? ` - ${player.vehicle.name}` : ''}
                                    </option>
                                  ))
                                }
                              </Select>
                            </FormControl>
                          </Box>
                        ))}
                      </SimpleGrid>
                    </Box>
                    
                    <Button type="submit" colorScheme="blue" size="lg" mt={4}>
                      設定を保存
                    </Button>
                  </VStack>
                </TabPanel>

                {/* タブ4: デバイス接続設定 */}
                <TabPanel>
                  <VStack spacing={6} align="stretch">
                    <Box>
                      <Heading size="md" mb={4} color="white">XIAO ESP32S3 接続設定</Heading>
                      
                      <FormControl mb={4}>
                        <FormLabel color="white">シリアルポート</FormLabel>
                        <Flex>
                          <Select
                            placeholder="ポートを選択"
                            value={selectedPort}
                            onChange={(e) => setSelectedPort(e.target.value)}
                            bg="gray.900"
                            borderColor="gray.600"
                            color="white"
                            _hover={{ borderColor: "gray.500" }}
                            flex={1}
                            mr={2}
                          >
                            {availablePorts.map((port) => (
                              <option key={port} value={port} style={{ backgroundColor: "#1A202C" }}>
                                {port}
                              </option>
                            ))}
                          </Select>
                          <Button
                            onClick={handleRefreshPorts}
                            colorScheme="blue"
                            variant="outline"
                          >
                            更新
                          </Button>
                        </Flex>
                      </FormControl>

                      <FormControl mb={4}>
                        <FormLabel color="white">ボーレート</FormLabel>
                        <Select
                          value={selectedBaudRate}
                          onChange={(e) => setSelectedBaudRate(parseInt(e.target.value))}
                          bg="gray.900"
                          borderColor="gray.600"
                          color="white"
                          _hover={{ borderColor: "gray.500" }}
                        >
                          <option value="9600" style={{ backgroundColor: "#1A202C" }}>9600</option>
                          <option value="19200" style={{ backgroundColor: "#1A202C" }}>19200</option>
                          <option value="115200" style={{ backgroundColor: "#1A202C" }}>115200</option>
                        </Select>
                      </FormControl>

                      <HStack spacing={4} mt={6}>
                        <Button 
                          colorScheme="green" 
                          size="md"
                          leftIcon={<AddIcon />}
                          flex={1}
                          onClick={handleConnect}
                          isDisabled={!selectedPort || serialState.isConnected}
                        >
                          接続
                        </Button>
                        <Button 
                          colorScheme="red" 
                          size="md"
                          leftIcon={<DeleteIcon />}
                          flex={1}
                          onClick={handleDisconnect}
                          isDisabled={!serialState.isConnected}
                        >
                          切断
                        </Button>
                      </HStack>

                      {/* シリアルモニター */}
                      <Box mt={4} p={4} borderWidth="1px" borderRadius="md" bg="gray.900" borderColor="gray.600">
                        <Heading size="sm" mb={3} color="white">シリアルモニター</Heading>
                        {/* メッセージ表示エリア */}
                        <Box
                          ref={monitorRef}
                          bg="black"
                          p={3}
                          borderRadius="md"
                          height="200px"
                          overflowY="auto"
                          fontFamily="mono"
                          fontSize="sm"
                          color="green.300"
                          borderWidth="1px"
                          mb={3}
                          borderColor="gray.600"
                          css={{
                            '&::-webkit-scrollbar': {
                              width: '8px',
                            },
                            '&::-webkit-scrollbar-track': {
                              background: 'gray.800',
                            },
                            '&::-webkit-scrollbar-thumb': {
                              background: 'gray.600',
                              borderRadius: '4px',
                            },
                          }} // ここでrefを設定
                        >
                          {serialState.messages.map((message, index) => (
                            <Text key={index} mb={1}>{message}</Text>
                          ))}
                        </Box>

                        {/* コマンド送信エリア */}
                        <Flex>
                          <Input
                            placeholder="シリアルコマンドを入力"
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleSendCommand();
                              }
                            }}
                            bg="gray.800"
                            borderColor="gray.600"
                            color="white"
                            _hover={{ borderColor: "gray.500" }}
                            flex={1}
                            mr={2}
                            disabled={!serialState.isConnected}
                          />
                          <Button
                            colorScheme="blue"
                            onClick={handleSendCommand}
                            isDisabled={!serialState.isConnected}
                          >
                            送信
                          </Button>
                        </Flex>
                      </Box>
                    </Box>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
          
          {/* データ管理セクション */}
          <Box borderWidth="1px" borderRadius="lg" p={4} bg="gray.800" borderColor="gray.700">
            <Heading size="md" mb={4} color="white">データ管理</Heading>
            <VStack spacing={4} align="stretch">
              <Box>
                <Button
                  colorScheme="red"
                  variant="outline"
                  onClick={() => {
                    if (window.confirm('全てのチームを削除します。この操作は元に戻せません。よろしいですか？')) {
                      // 全てのチームを削除
                      playersState.forEach(player => {
                        removePlayerFromContext(player.id);
                      });
                      toast({
                        title: '全チームを削除しました',
                        status: 'info',
                        duration: 2000,
                        isClosable: true,
                      });
                    }
                  }}
                  leftIcon={<DeleteIcon />}
                  size="lg"
                  width="full"
                  mb={4}
                >
                  全チームを削除
                </Button>
                <Button
                  colorScheme="red"
                  variant="outline"
                  onClick={onOpen}
                  leftIcon={<DeleteIcon />}
                  size="lg"
                  width="full"
                >
                  レース記録を全て削除
                </Button>
              </Box>
            </VStack>
          </Box>

          {/* 削除確認ダイアログ */}
          <AlertDialog
            isOpen={isOpen}
            leastDestructiveRef={cancelRef}
            onClose={onClose}
          >
            <AlertDialogOverlay>
              <AlertDialogContent bg="gray.800" borderColor="gray.700">
                <AlertDialogHeader fontSize="lg" fontWeight="bold" color="white">
                  レース記録の削除
                </AlertDialogHeader>

                <AlertDialogBody color="white">
                  すべてのレース記録を削除します。この操作は元に戻せません。
                  本当に削除しますか？
                </AlertDialogBody>

                <AlertDialogFooter>
                  <Button ref={cancelRef} onClick={onClose} variant="outline" color="white">
                    キャンセル
                  </Button>
                  <Button colorScheme="red" onClick={() => {
                    clearRaceResults();
                    onClose();
                    toast({
                      title: "レース記録を削除しました",
                      description: "すべてのレース記録が削除されました。",
                      status: "success",
                      duration: 3000,
                      isClosable: true,
                    });
                  }} ml={3}>
                    削除する
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialogOverlay>
          </AlertDialog>
        </VStack>
      </Center>
    </Container>
  );
}
