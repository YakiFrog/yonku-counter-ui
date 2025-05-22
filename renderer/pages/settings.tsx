import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import { 
  Box, 
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading, 
  IconButton,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberDecrementStepper,
  NumberIncrementStepper,
  Select,
  SimpleGrid,
  Switch,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  VStack,
  useToast,
  Text
} from '@chakra-ui/react'
import { AddIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons'

import { Container } from '../components/Container'
import { TabNavigation } from '../components/TabNavigation'

// 選手データの型定義
type Player = {
  id: string;
  name: string;
  vehicle: {
    id: string;
    name: string;
  } | null;
};

// コースデータの型定義
type Course = {
  playerId: string | null;
  vehicleId: string | null;
};

export default function SettingsPage() {
  // 設定データを保持するstate
  const [settings, setSettings] = useState({
    courses: [
      { id: 1, player: null, machine: null },
      { id: 2, player: null, machine: null },
      { id: 3, player: null, machine: null },
      { id: 4, player: null, machine: null }
    ],
    lapCount: 10,
    soundEnabled: true,
    // 他の設定項目があれば追加
  });
  const toast = useToast();

  // コンポーネントマウント時に設定をロード
  useEffect(() => {
    const savedSettings = localStorage.getItem('settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
        console.log('設定をロードしました:', parsedSettings);
      } catch (error) {
        console.error('設定のロードに失敗しました:', error);
        toast({
          title: 'エラー',
          description: '設定データの読み込みに失敗しました',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  }, [toast]);

  // 選手リスト管理
  const [players, setPlayers] = useState<Player[]>([
    { 
      id: 'p1', 
      name: '選手1', 
      vehicle: { id: 'v1-1', name: '車両1' }
    },
    { 
      id: 'p2', 
      name: '選手2', 
      vehicle: { id: 'v2-1', name: '車両2' }
    },
    { 
      id: 'p3', 
      name: '選手3', 
      vehicle: { id: 'v3-1', name: '車両3' }
    },
    { 
      id: 'p4', 
      name: '選手4', 
      vehicle: { id: 'v4-1', name: '車両4' }
    },
  ]);

  // 新規選手・車両入力用の状態
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newVehicleName, setNewVehicleName] = useState('');
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingPlayerName, setEditingPlayerName] = useState('');

  // 設定送信ハンドラ
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 実際のアプリケーションではローカルストレージに保存する
    try {
      localStorage.setItem('settings', JSON.stringify(settings));
      console.log('設定を保存しました:', settings);
      
      toast({
        title: '設定が保存されました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('設定の保存に失敗しました:', error);
      toast({
        title: 'エラー',
        description: '設定の保存に失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // 設定値変更ハンドラ
  const updateSettings = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // コース情報の更新（選手とマシンの割り当て）
  const updateCourseAssignment = (courseIndex: number, field: string, value: string) => {
    const newCourses = [...settings.courses];
    newCourses[courseIndex] = {
      ...newCourses[courseIndex],
      [field]: value === '' ? null : value
    };
    
    setSettings(prev => ({
      ...prev,
      courses: newCourses
    }));
  };

  // 新規選手の追加
  const addPlayer = () => {
    if (newPlayerName.trim() === '') return;
    
    const newPlayer: Player = {
      id: `p${Date.now()}`,
      name: newPlayerName,
      vehicle: null // 初期状態では車両なし
    };
    
    setPlayers(prev => [...prev, newPlayer]);
    setNewPlayerName('');
    
    toast({
      title: '選手を追加しました',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  // 選手の削除
  const deletePlayer = (playerId: string) => {
    setPlayers(prev => prev.filter(player => player.id !== playerId));
    
    // この選手が割り当てられているコースをクリア
    const updatedCourses = settings.courses.map(course => {
      if (course.playerId === playerId) {
        return { playerId: null, vehicleId: null };
      }
      return course;
    });
    
    setSettings(prev => ({
      ...prev,
      courses: updatedCourses
    }));
    
    toast({
      title: '選手を削除しました',
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
    
    setPlayers(prev => 
      prev.map(player => 
        player.id === editingPlayerId 
          ? { ...player, name: editingPlayerName }
          : player
      )
    );
    
    setEditingPlayerId(null);
    setEditingPlayerName('');
    
    toast({
      title: '選手名を更新しました',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };
  
  // 車両名編集モードの開始
  const startEditingVehicle = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player || !player.vehicle) return;
    
    setEditingVehiclePlayerId(playerId);
    setEditingVehicleName(player.vehicle.name);
  };
  
  // 車両名の保存
  const saveVehicleEdit = () => {
    if (!editingVehiclePlayerId || editingVehicleName.trim() === '') return;
    
    const player = players.find(p => p.id === editingVehiclePlayerId);
    if (!player || !player.vehicle) return;
    
    const vehicleId = player.vehicle.id;
    
    setPlayers(prev => 
      prev.map(player => 
        player.id === editingVehiclePlayerId && player.vehicle
          ? { ...player, vehicle: { ...player.vehicle, name: editingVehicleName } }
          : player
      )
    );
    
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
    
    setPlayers(prev => 
      prev.map(player => 
        player.id === playerId
          ? { ...player, vehicle: newVehicle }
          : player
      )
    );
    
    // コース割り当てを更新
    const playerWithUpdatedVehicle = players.find(p => p.id === playerId);
    if (playerWithUpdatedVehicle && playerWithUpdatedVehicle.vehicle) {
      const oldVehicleId = playerWithUpdatedVehicle.vehicle.id;
      
      const updatedCourses = settings.courses.map(course => {
        if (course.playerId === playerId && course.vehicleId === oldVehicleId) {
          return { ...course, vehicleId: newVehicle.id };
        }
        return course;
      });
      
      setSettings(prev => ({
        ...prev,
        courses: updatedCourses
      }));
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
    const playerToUpdate = players.find(p => p.id === playerId);
    if (!playerToUpdate || !playerToUpdate.vehicle) return;
    
    const vehicleId = playerToUpdate.vehicle.id;
    
    setPlayers(prev => 
      prev.map(player => 
        player.id === playerId
          ? { ...player, vehicle: null }
          : player
      )
    );
    
    // この車両が割り当てられているコースの車両IDをクリア
    const updatedCourses = settings.courses.map(course => {
      if (course.vehicleId === vehicleId) {
        return { ...course, vehicleId: null };
      }
      return course;
    });
    
    setSettings(prev => ({
      ...prev,
      courses: updatedCourses
    }));
    
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
    const player = players.find(p => p.id === playerId);
    return player ? player.vehicle : null;
  };
  
  // 車両名の編集状態の管理
  const [editingVehiclePlayerId, setEditingVehiclePlayerId] = useState<string | null>(null);
  const [editingVehicleName, setEditingVehicleName] = useState('');

  return (
    <React.Fragment>
      <Head>
        <title>設定 - 四駆カウンター</title>
      </Head>
      <Container maxWidth="full" px={2} py={4}>
        <VStack spacing={6} align="stretch" width="full">
          {/* タブナビゲーション */}
          <TabNavigation currentTab="settings" />
          
          <Heading size="lg" mb={4}>レース設定</Heading>
          
          <Box as="form" onSubmit={handleSubmit} borderWidth="1px" borderRadius="lg" p={6} shadow="md">
            <Tabs variant="enclosed" colorScheme="blue">
              <TabList mb={4}>
                <Tab fontWeight="semibold">基本設定</Tab>
                <Tab fontWeight="semibold">選手/車両登録</Tab>
                <Tab fontWeight="semibold">コース割り当て</Tab>
              </TabList>
              
              <TabPanels>
                {/* タブ1: 基本設定 */}
                <TabPanel>
                  <VStack spacing={6} align="stretch">
                    <Box>
                      <Heading size="md" mb={4}>基本設定</Heading>
                      
                      <FormControl id="totalLaps" mb={4}>
                        <FormLabel>周回数</FormLabel>
                        <NumberInput 
                          value={settings.lapCount} 
                          min={1} 
                          max={20}
                          onChange={(_, value) => updateSettings('lapCount', value)}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>

                      <FormControl mt={4} display="flex" alignItems="center">
                        <FormLabel mb={0}>サウンド</FormLabel>
                        <Switch 
                          isChecked={settings.soundEnabled} 
                          onChange={(e) => updateSettings('soundEnabled', e.target.checked)} 
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
                      <Heading size="md" mb={4}>選手リスト</Heading>
                      
                      {/* 新規選手の追加 */}
                      <Flex mb={5}>
                        <Input
                          placeholder="新しい選手名"
                          value={newPlayerName}
                          onChange={(e) => setNewPlayerName(e.target.value)}
                          mr={2}
                        />
                        <Button
                          leftIcon={<AddIcon />}
                          colorScheme="green"
                          onClick={addPlayer}
                        >
                          選手を追加
                        </Button>
                      </Flex>
                      
                      {/* 選手リスト */}
                      {players.map((player) => (
                        <Box key={player.id} mb={6} p={4} borderWidth="1px" borderRadius="md" shadow="sm">
                          {/* 選手情報 */}
                          <Flex justifyContent="space-between" alignItems="center" mb={4}>
                            {editingPlayerId === player.id ? (
                              <Flex flex="1">
                                <Input
                                  value={editingPlayerName}
                                  onChange={(e) => setEditingPlayerName(e.target.value)}
                                  mr={2}
                                />
                                <Button colorScheme="blue" size="sm" onClick={savePlayerEdit}>
                                  保存
                                </Button>
                              </Flex>
                            ) : (
                              <>
                                <Heading size="sm">{player.name}</Heading>
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
                              </>
                            )}
                          </Flex>
                          
                          {/* 車両情報 */}
                          <Box ml={4}>
                            <Heading size="xs" mb={2}>車両情報</Heading>
                            {player.vehicle ? (
                              <Box borderWidth="1px" borderRadius="md" p={2}>
                                {editingVehiclePlayerId === player.id ? (
                                  <Flex>
                                    <Input
                                      size="sm"
                                      value={editingVehicleName}
                                      onChange={(e) => setEditingVehicleName(e.target.value)}
                                      mr={2}
                                    />
                                    <Button size="sm" colorScheme="blue" onClick={saveVehicleEdit}>
                                      保存
                                    </Button>
                                  </Flex>
                                ) : (
                                  <Flex justifyContent="space-between" alignItems="center">
                                    <Text>{player.vehicle.name}</Text>
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
                              <Text fontSize="sm" color="gray.500">車両が登録されていません</Text>
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
                      
                      {players.length === 0 && (
                        <Box p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
                          <Text align="center">選手が登録されていません</Text>
                        </Box>
                      )}
                    </Box>
                    
                    <Button type="submit" colorScheme="blue" size="lg" mt={4}>
                      設定を保存
                    </Button>
                  </VStack>
                </TabPanel>
                
                {/* タブ3: コース割り当て */}
                <TabPanel>
                  <VStack spacing={6} align="stretch">
                    <Box>
                      <Heading size="md" mb={4}>コース割り当て</Heading>
                      
                      <SimpleGrid columns={[1, 2]} spacing={6}>
                        {settings.courses.map((course, index) => (
                          <Box key={index} p={4} borderWidth="1px" borderRadius="md">
                            <Heading size="sm" mb={3}>コース {index + 1}</Heading>
                            
                            <FormControl mb={3}>
                              <FormLabel>選手</FormLabel>
                              <Select
                                placeholder="選手を選択"
                                value={course.playerId || ''}
                                onChange={(e) => updateCourseAssignment(index, 'playerId', e.target.value)}
                              >
                                {players.map((player) => (
                                  <option key={player.id} value={player.id}>
                                    {player.name}
                                  </option>
                                ))}
                              </Select>
                            </FormControl>
                            
                            <FormControl>
                              <FormLabel>車両</FormLabel>
                              <Select
                                placeholder="車両を選択"
                                value={course.vehicleId || ''}
                                onChange={(e) => updateCourseAssignment(index, 'vehicleId', e.target.value)}
                                isDisabled={!course.playerId}
                              >
                                {(() => {
                                  const vehicle = getVehicleForPlayer(course.playerId);
                                  return vehicle ? [
                                    <option key={vehicle.id} value={vehicle.id}>
                                      {vehicle.name}
                                    </option>
                                  ] : [];
                                })()}
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
              </TabPanels>
            </Tabs>
          </Box>
        </VStack>
      </Container>
    </React.Fragment>
  )
}
