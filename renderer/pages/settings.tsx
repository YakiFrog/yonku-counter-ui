import React, { useState, useEffect } from 'react'
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
  Text,
  Spinner,
  Center
} from '@chakra-ui/react'
import { AddIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons'

import { Container } from '../components/Container'
import { TabNavigation } from '../components/TabNavigation'
import { useAppSettingsContext } from '../utils/AppSettingsContext'
import { Player, Vehicle } from '../utils/types'

export default function SettingsPage() {
  const { 
    settings, 
    isLoading,
    updateSettings,
    updateCourse,
    addPlayer: addPlayerToContext,
    updatePlayer: updatePlayerInContext,
    removePlayer: removePlayerFromContext
  } = useAppSettingsContext();
  
  const toast = useToast();

  // 選手リスト
  const [playersState, setPlayersState] = useState<Player[]>([]);
  
  // コンテキストから選手データをロード
  useEffect(() => {
    if (!isLoading && settings) {
      setPlayersState(settings.players || []);
    }
  }, [settings, isLoading]);
  
  // 新規選手・車両入力用の状態
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newVehicleName, setNewVehicleName] = useState('');
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingPlayerName, setEditingPlayerName] = useState('');
  
  // 車両名の編集状態の管理
  const [editingVehiclePlayerId, setEditingVehiclePlayerId] = useState<string | null>(null);
  const [editingVehicleName, setEditingVehicleName] = useState('');

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
  const updateCourseAssignment = (courseIndex: number, field: string, value: string) => {
    const courseId = settings.courses[courseIndex].id;
    updateCourse(courseId, { [field]: value === '' ? null : value });
  };

  // 新規選手の追加
  const addPlayer = () => {
    if (newPlayerName.trim() === '') return;
    
    const newPlayer: Player = {
      id: `p${Date.now()}`,
      name: newPlayerName,
      vehicle: null // 初期状態では車両なし
    };
    
    addPlayerToContext(newPlayer);
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
    removePlayerFromContext(playerId);
    
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
    
    updatePlayerInContext(editingPlayerId, { name: editingPlayerName });
    
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

  return (
    <React.Fragment>
      <Head>
        <title>設定 - 四駆カウンター</title>
      </Head>
      <Container maxWidth="1920px" px={4} py={3}>
        <VStack spacing={4} align="stretch" width="full">
          {/* タブナビゲーション */}
          <TabNavigation currentTab="settings" />
          
          <Heading size="lg" mb={4} color="white">レース設定</Heading>
          
          <Box as="form" onSubmit={handleSubmit} borderWidth="1px" borderRadius="lg" p={6} shadow="md" bg="gray.800" borderColor="gray.700">
            <Tabs variant="enclosed" colorScheme="blue">
              <TabList mb={4} bg="gray.800" borderBottomColor="gray.700">
                <Tab fontWeight="semibold" color="gray.300" bg="gray.900" borderColor="gray.600" _selected={{ color: "white", bg: "gray.700" }}>基本設定</Tab>
                <Tab fontWeight="semibold" color="gray.300" bg="gray.900" borderColor="gray.600" _selected={{ color: "white", bg: "gray.700" }}>選手/車両登録</Tab>
                <Tab fontWeight="semibold" color="gray.300" bg="gray.900" borderColor="gray.600" _selected={{ color: "white", bg: "gray.700" }}>コース割り当て</Tab>
              </TabList>
              
              <TabPanels>
                {/* タブ1: 基本設定 */}
                <TabPanel>
                  <VStack spacing={6} align="stretch">
                    <Box>
                      <Heading size="md" mb={4}>基本設定</Heading>
                      
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
                      <Heading size="md" mb={4} color="white">選手リスト</Heading>
                      
                      {/* 新規選手の追加 */}
                      <Flex mb={5}>
                        <Input
                          placeholder="新しい選手名"
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
                      
                      <SimpleGrid columns={[1, 2]} spacing={6}>
                        {settings.courses.map((course, index) => (
                          <Box key={index} p={4} borderWidth="1px" borderRadius="md" bg="gray.900" borderColor="gray.600">
                            <Heading size="sm" mb={3} color="white">コース {index + 1}</Heading>
                            
                            <FormControl mb={3}>
                              <FormLabel color="white">選手</FormLabel>
                              <Select
                                placeholder="選手を選択"
                                value={course.playerId || ''}
                                onChange={(e) => updateCourseAssignment(index, 'playerId', e.target.value)}
                                bg="gray.800"
                                borderColor="gray.600"
                                color="white"
                                _hover={{ borderColor: "gray.500" }}
                              >
                                {playersState.map((player) => (
                                  <option key={player.id} value={player.id} style={{ backgroundColor: "#1A202C" }}>
                                    {player.name}
                                  </option>
                                ))}
                              </Select>
                            </FormControl>
                            
                            <FormControl>
                              <FormLabel color="white">車両</FormLabel>
                              <Select
                                placeholder="車両を選択"
                                value={course.vehicleId || ''}
                                onChange={(e) => updateCourseAssignment(index, 'vehicleId', e.target.value)}
                                isDisabled={!course.playerId}
                                bg="gray.800"
                                borderColor="gray.600"
                                color="white"
                                _hover={{ borderColor: "gray.500" }}
                              >
                                {(() => {
                                  const vehicle = getVehicleForPlayer(course.playerId);
                                  return vehicle ? [
                                    <option key={vehicle.id} value={vehicle.id} style={{ backgroundColor: "#1A202C" }}>
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
