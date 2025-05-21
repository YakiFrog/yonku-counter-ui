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
  Text
} from '@chakra-ui/react'

import { Container } from '../components/Container'
import { TabNavigation } from '../components/TabNavigation'

export default function RankingPage() {
  // ランキングデータのサンプル
  const rankingData = [
    { position: 1, name: '選手1', vehicle: '車両1', time: '01:23.45', bestLap: '00:16.78' },
    { position: 2, name: '選手2', vehicle: '車両2', time: '01:25.67', bestLap: '00:17.12' },
    { position: 3, name: '選手3', vehicle: '車両3', time: '01:28.90', bestLap: '00:17.45' },
    { position: 4, name: '選手4', vehicle: '車両4', time: '01:30.21', bestLap: '00:18.03' },
  ];

  return (
    <React.Fragment>
      <Head>
        <title>ランキング - 四駆カウンター</title>
      </Head>
      <Container maxWidth="full" px={2} py={4}>
        <VStack spacing={6} align="stretch" width="full">
          {/* タブナビゲーション */}
          <TabNavigation currentTab="ranking" />
          
          <Heading size="lg" mb={4}>レースランキング</Heading>
          
          {/* 最新レース結果 */}
          <Box borderWidth="1px" borderRadius="lg" p={4} shadow="md">
            <Heading size="md" mb={3}>
              最新レース結果 <Badge colorScheme="green" ml={2}>レース #1</Badge>
            </Heading>
            
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>順位</Th>
                  <Th>選手名</Th>
                  <Th>車両</Th>
                  <Th>タイム</Th>
                  <Th>ベストラップ</Th>
                </Tr>
              </Thead>
              <Tbody>
                {rankingData.map((entry) => (
                  <Tr key={entry.position}>
                    <Td fontWeight="bold">{entry.position}</Td>
                    <Td>{entry.name}</Td>
                    <Td>{entry.vehicle}</Td>
                    <Td>{entry.time}</Td>
                    <Td>{entry.bestLap}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
          
          {/* 総合ランキング */}
          <Box borderWidth="1px" borderRadius="lg" p={4} shadow="md">
            <Heading size="md" mb={3}>
              総合ランキング
            </Heading>
            
            <Table variant="simple">
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
                {rankingData.map((entry) => (
                  <Tr key={entry.position}>
                    <Td fontWeight="bold">{entry.position}</Td>
                    <Td>{entry.name}</Td>
                    <Td>{5 - entry.position}</Td>
                    <Td>{entry.time}</Td>
                    <Td>{entry.bestLap}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </VStack>
      </Container>
    </React.Fragment>
  )
}
