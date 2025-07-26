import { Race, RaceResult, RaceLap } from './types';

// レースデータをCSV形式に変換
export const exportRacesToCSV = (races: Race[]): string => {
  if (!races || races.length === 0) {
    return '';
  }

  // CSVヘッダー
  const headers = [
    'レース名',
    'レース番号',
    'レース種別',
    '総周回数',
    '日付',
    '順位',
    'コースID',
    'プレイヤー名',
    'チーム名',
    '車両名',
    '総合タイム',
    '完走フラグ',
    'ラップタイム詳細'
  ];

  const csvRows: string[] = [headers.join(',')];

  // 各レースの結果をCSV行に変換
  races.forEach(race => {
    race.results.forEach(result => {
      // ラップタイムを文字列として結合（区切り文字を|に変更してコロンとの競合を防ぐ）
      const lapTimesStr = result.laps.map(lap => `${lap.lapNumber}|${lap.time}`).join(';');
      
      const row = [
        `"${race.name || ''}"`,
        `"${race.raceNumber || ''}"`,
        `"${race.raceType || ''}"`,
        `"${race.totalLaps || ''}"`,
        `"${race.date || ''}"`,
        `"${result.position || ''}"`,
        `"${result.courseId || ''}"`,
        `"${result.playerName || ''}"`,
        `"${result.teamName || ''}"`,
        `"${result.vehicleName || ''}"`,
        `"${result.totalTime || ''}"`,
        `"${result.isCompleted ? '完走' : '未完走'}"`,
        `"${lapTimesStr}"`
      ];
      
      csvRows.push(row.join(','));
    });
  });

  return csvRows.join('\n');
};

// CSVファイルをダウンロード
export const downloadCSV = (csvContent: string, filename: string) => {
  // BOMを追加してExcelで文字化けを防ぐ
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// CSVファイルを読み込んでレースデータに変換
export const importRacesFromCSV = (csvContent: string): Promise<Race[]> => {
  return new Promise((resolve, reject) => {
    try {
      const lines = csvContent.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length <= 1) {
        reject(new Error('CSVファイルにデータが含まれていません。'));
        return;
      }

      // ヘッダー行をスキップ
      const dataLines = lines.slice(1);
      
      // レースIDをキーとしてレースデータを集約
      const racesMap = new Map<string, Race>();
      
      dataLines.forEach((line, index) => {
        try {
          // CSVパース（簡易版）
          const values = parseCSVLine(line);
          
          if (values.length < 13) {
            console.warn(`行 ${index + 2}: データが不完全です`);
            return;
          }

          const [
            raceName,
            raceNumberStr,
            raceType,
            totalLapsStr,
            date,
            positionStr,
            courseIdStr,
            playerName,
            teamName,
            vehicleName,
            totalTime,
            isCompletedStr,
            lapTimesStr
          ] = values;

          // レースの基本情報
          const raceNumber = parseInt(raceNumberStr) || 1;
          const raceId = `${raceNumber}_${raceName}_${date}`;

          // 既存のレースがあるかチェック
          if (!racesMap.has(raceId)) {
            racesMap.set(raceId, {
              id: raceId,
              name: raceName,
              raceNumber: raceNumber,
              raceType: raceType,
              totalLaps: parseInt(totalLapsStr) || 0,
              date: date,
              results: []
            });
          }

          // ラップタイムをパース
          const laps: RaceLap[] = [];
          if (lapTimesStr && lapTimesStr.trim() !== '') {
            console.log('パース前のラップタイム文字列:', lapTimesStr); // デバッグログ
            const lapEntries = lapTimesStr.split(';');
            lapEntries.forEach(entry => {
              const [lapNumStr, time] = entry.split('|'); // 区切り文字を|に変更
              console.log('ラップエントリー:', entry, '分割後:', { lapNumStr, time }); // デバッグログ
              if (lapNumStr && time) {
                laps.push({
                  lapNumber: parseInt(lapNumStr) || 1,
                  time: time.trim(),
                  timestamp: Date.now() // 実際のタイムスタンプは復元できないため現在時刻を設定
                });
              }
            });
            console.log('パース後のラップデータ:', laps); // デバッグログ
          }

          // ベストラップを計算
          let bestLap: RaceLap | null = null;
          if (laps.length > 0) {
            bestLap = laps.reduce((best, current) => {
              return current.time < best.time ? current : best;
            });
          }

          // レース結果を作成
          const result: RaceResult = {
            id: `${raceId}_${courseIdStr}_${playerName}`,
            raceId: raceId,
            position: parseInt(positionStr) || 1,
            playerId: playerName, // プレイヤーIDが不明な場合は名前を使用
            playerName: playerName,
            teamName: teamName || undefined,
            vehicleId: vehicleName, // 車両IDが不明な場合は名前を使用
            vehicleName: vehicleName,
            courseId: parseInt(courseIdStr) || 1,
            totalTime: totalTime,
            laps: laps,
            bestLap: bestLap,
            isCompleted: isCompletedStr === '完走'
          };

          // レースに結果を追加
          const race = racesMap.get(raceId)!;
          race.results.push(result);
        } catch (error) {
          console.warn(`行 ${index + 2}のパースエラー:`, error);
        }
      });

      // 結果を配列に変換し、順位でソート
      const races = Array.from(racesMap.values());
      races.forEach(race => {
        race.results.sort((a, b) => a.position - b.position);
      });

      resolve(races);
    } catch (error) {
      reject(new Error('CSVファイルの読み込み中にエラーが発生しました: ' + error.message));
    }
  });
};

// CSV行をパースする関数（引用符を考慮）
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // エスケープされた引用符
        current += '"';
        i++; // 次の文字をスキップ
      } else {
        // 引用符の開始/終了
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // フィールドの区切り
      result.push(current.trim()); // trimを追加してスペースを除去
      current = '';
    } else {
      current += char;
    }
  }
  
  // 最後のフィールドを追加
  result.push(current.trim()); // trimを追加してスペースを除去
  
  return result;
};

// 現在の日時からファイル名を生成
export const generateCSVFilename = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  
  return `race_results_${year}${month}${day}_${hour}${minute}.csv`;
};
