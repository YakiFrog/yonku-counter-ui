import { ipcMain, BrowserWindow } from 'electron';
import { SerialPort } from 'serialport';
import { DelimiterParser } from '@serialport/parser-delimiter';

// グローバル変数の型定義
declare global {
  namespace NodeJS {
    interface Global {
      mainWindow: BrowserWindow | null;
    }
  }
}

// シリアルポートの一覧を取得する関数
export async function listSerialPorts() {
  try {
    const ports = await SerialPort.list();
    return ports.map(port => port.path);
  } catch (err) {
    console.error('Failed to list serial ports:', err);
    return [];
  }
}

// シリアルポート接続を管理するクラス
class SerialPortManager {
  private port: SerialPort | null = null;
  private parser: DelimiterParser | null = null;
  private isInitialized: boolean = false;

  async connect(path: string, baudRate: number) {
    try {
      if (this.port) {
        await this.disconnect();
      }

      this.port = new SerialPort({
        path: path,
        baudRate: baudRate,
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
        autoOpen: true
      });

      this.parser = this.port.pipe(new DelimiterParser({ delimiter: '\n' }));

      this.port.on('error', (err) => {
        console.error('Serial port error:', err);
      });

      this.parser.on('data', (data: Buffer) => {
        const message = data.toString().trim();
        // メインウィンドウにデータを送信
        global.mainWindow?.webContents.send('serial:data', message);
      });

      return true;
    } catch (err) {
      console.error('Failed to connect to serial port:', err);
      throw err;
    }
  }

  async disconnect() {
    return new Promise<void>((resolve, reject) => {
      if (!this.port) {
        resolve();
        return;
      }

      this.port.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        this.port = null;
        this.parser = null;
        resolve();
      });
    });
  }

  isConnected() {
    return this.port?.isOpen || false;
  }

  // シリアルポートにデータを送信
  async write(data: string) {
    return new Promise((resolve, reject) => {
      if (!this.port) {
        reject(new Error('Serial port is not connected'));
        return;
      }

      this.port.write(data, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(true);
      });
    });
  }
}

// シリアルポートマネージャーのインスタンスを作成
const serialPortManager = new SerialPortManager();

// IPCイベントハンドラーの設定
export function setupSerialPortHandlers() {
  // 既存のハンドラーを削除（重複登録を防ぐため）
  ipcMain.removeHandler('serial:list-ports');
  ipcMain.removeHandler('serial:connect');
  ipcMain.removeHandler('serial:disconnect');
  ipcMain.removeHandler('serial:write');
  ipcMain.removeHandler('serial:is-connected');

  // 利用可能なポートの一覧を取得
  ipcMain.handle('serial:list-ports', async () => {
    return await listSerialPorts();
  });

  // シリアルポートに接続
  ipcMain.handle('serial:connect', async (_, path: string, baudRate: number) => {
    try {
      return await serialPortManager.connect(path, baudRate);
    } catch (err) {
      console.error('Failed to connect to serial port:', err);
      throw err;
    }
  });

  // シリアルポートから切断
  ipcMain.handle('serial:disconnect', async () => {
    try {
      return await serialPortManager.disconnect();
    } catch (err) {
      console.error('Failed to disconnect from serial port:', err);
      throw err;
    }
  });

  // シリアルポートにデータを送信
  ipcMain.handle('serial:write', async (_, data: string) => {
    try {
      return await serialPortManager.write(data);
    } catch (err) {
      console.error('Failed to write to serial port:', err);
      throw err;
    }
  });

  // 接続状態を確認
  ipcMain.handle('serial:is-connected', () => {
    return serialPortManager.isConnected();
  });
}
