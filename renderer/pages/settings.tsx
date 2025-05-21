import React, { useState } from 'react'
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
  vehicles: {
    id: string;
    name: string;
  }[];
};

// コースデータの型定義
type Course = {
  playerId: string | null;
  vehicleId: string | null;
};

export default function SettingsPage() {
  const toast = useToast();
  
  // 選手リスト管理
  const [players, setPlayers] = useState<Player[]>([
    { 
      id: 'p1', 
      name: '選手1', 
      vehicles: [
        { id: 'v1-1', name: '車両1' },
        { id: 'v1-2', name: '車両1-改' }
      ] 
    },
    { 
      id: 'p2', 
      name: '選手2', 
      vehicles: [
        { id: 'v2-1', name: '車両2' }
      ] 
    },
    { 
      id: 'p3', 
      name: '選手3', 
      vehicles: [
        { id: 'v3-1', name: '車両3' }
      ] 
    },
    { 
      id: 'p4', 
      name: '選手4', 
      vehicles: [
        { id: 'v4-1', name: '車両4' }
      ] 
    },
  ]);

  // 設定のステート
  const [settings, setSettings] = useState({
    totalLaps: 5,
    courses: [
      { playerId: 'p1', vehicleId: 'v1-1' },
      { playerId: 'p2', vehicleId: 'v2-1' },
      { playerId: 'p3', vehicleId: 'v3-1' },
      { playerId: 'p4', vehicleId: 'v4-1' },
    ] as Course[]
  });

  // 新規選手・車両入力用の状態
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newVehicleName, setNewVehicleName] = useState('');
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingPlayerName, setEditingPlayerName] = useState('');

  // フォーム送信ハンドラ
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 設定を保存する処理をここに実装
    // 実際のアプリケーションではローカルストレージやデータベースに保存する
    
    toast({
      title: '設定が保存されました',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
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
      vehicles: []
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

  // 選手に車両を追加
  const addVehicleToPlayer = (playerId: string) => {
    if (newVehicleName.trim() === '') return;
    
    const newVehicle = {
      id: `v${Date.now()}`,
      name: newVehicleName
    };
    
    setPlayers(prev => 
      prev.map(player => 
        player.id === playerId
          ? { ...player, vehicles: [...player.vehicles, newVehicle] }
          : player
      )
    );
    
    setNewVehicleName('');
    
    toast({
      title: '車両を追加しました',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  // 車両の削除
  const deleteVehicle = (playerId: string, vehicleId: string) => {
    // プレイヤーから車両を削除
    setPlayers(prev => 
      prev.map(player => 
        player.id === playerId
          ? { ...player, vehicles: player.vehicles.filter(v => v.id !== vehicleId) }
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

  // 特定の選手の車両リストを取得する関数
  const getVehiclesForPlayer = (playerId: string | null) => {
    if (!playerId) return [];
    const player = players.find(p => p.id === playerId);
    return player ? player.vehicles : [];
  };

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
                          value={settings.totalLaps} 
                          min={1} 
                          max={20}
                          onChange={(_, value) => updateSettings('totalLaps', value)}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
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
                          
                          {/* 車両リスト */}
                          <Box ml={4}>
                            <Heading size="xs" mb={2}>車両一覧</Heading>
                            {player.vehicles.length > 0 ? (
                              player.vehicles.map((vehicle) => (
                                <Flex key={vehicle.id} mb={1} alignItems="center">
                                  <Text flex="1">{vehicle.name}</Text>
                                  <IconButton
                                    aria-label="Delete vehicle"
                                    icon={<DeleteIcon />}
                                    colorScheme="red"
                                    size="xs"
                                    onClick={() => deleteVehicle(player.id, vehicle.id)}
                                  />
                                </Flex>
                              ))
                            ) : (
                              <Text fontSize="sm" color="gray.500">車両がありません</Text>
                            )}
                            
                            {/* 新規車両の追加 */}
                            <Flex mt={3}>
                              <Input
                                placeholder="新しい車両名"
                                size="sm"
                                value={newVehicleName}
                                onChange={(e) => setNewVehicleName(e.target.value)}
                                mr={2}
                              />
                              <Button
                                size="sm"
                                leftIcon={<AddIcon />}
                                colorScheme="green"
                                onClick={() => addVehicleToPlayer(player.id)}
                              >
                                追加
                              </Button>
                            </Flex>
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
                                {getVehiclesForPlayer(course.playerId).map((vehicle) => (
                                  <option key={vehicle.id} value={vehicle.id}>
                                    {vehicle.name}
                                  </option>
                                ))}
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
