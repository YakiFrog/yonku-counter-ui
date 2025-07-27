import { Player, Vehicle } from './types';

// チーム・車両データをCSV形式に変換
export const exportSettingsToCSV = (players: Player[]): string => {
  if (!players || players.length === 0) {
    return '';
  }

  // CSVヘッダー
  const headers = [
    'プレイヤーID',
    'プレイヤー名',
    'チーム名',
    '車両ID',
    '車両名'
  ];

  const csvRows: string[] = [headers.join(',')];

  // 各プレイヤーのデータをCSV行に変換
  players.forEach(player => {
    const row = [
      `"${player.id || ''}"`,
      `"${player.name || ''}"`,
      `"${player.teamName || ''}"`,
      `"${player.vehicle?.id || ''}"`,
      `"${player.vehicle?.name || ''}"`
    ];
    
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
};

// CSVファイルを読み込んでチーム・車両データに変換
export const importSettingsFromCSV = (csvContent: string): Promise<Player[]> => {
  return new Promise((resolve, reject) => {
    try {
      const lines = csvContent.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length <= 1) {
        reject(new Error('CSVファイルにデータが含まれていません。'));
        return;
      }

      // ヘッダー行をスキップ
      const dataLines = lines.slice(1);
      
      const players: Player[] = [];
      
      dataLines.forEach((line, index) => {
        try {
          // CSVパース（簡易版）
          const values = parseCSVLine(line);
          
          if (values.length < 5) {
            console.warn(`行 ${index + 2}: データが不完全です`);
            return;
          }

          const [
            playerId,
            playerName,
            teamName,
            vehicleId,
            vehicleName
          ] = values;

          // プレイヤーデータを作成
          const player: Player = {
            id: playerId || `player-${Date.now()}-${index}`,
            name: playerName || '',
            teamName: teamName || '',
            vehicle: (vehicleId && vehicleName) ? {
              id: vehicleId,
              name: vehicleName
            } : null
          };

          players.push(player);
        } catch (error) {
          console.warn(`行 ${index + 2}のパースエラー:`, error);
        }
      });

      resolve(players);
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

// CSVファイルをダウンロード
export const downloadSettingsCSV = (csvContent: string, filename: string) => {
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

// 現在の日時からファイル名を生成
export const generateSettingsCSVFilename = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  
  return `team_vehicle_settings_${year}${month}${day}_${hour}${minute}.csv`;
};
