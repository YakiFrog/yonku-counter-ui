import path from 'path'
import { app, ipcMain, session, BrowserWindow, dialog, protocol, net } from 'electron'
import serve from 'electron-serve'
import { createWindow } from './helpers'
import { setupSerialPortHandlers } from './helpers/serial-port'

// グローバル変数の型定義を拡張
declare global {
  namespace NodeJS {
    interface Global {
      mainWindow: BrowserWindow | null;
    }
  }
}

// グローバル変数の初期化
global.mainWindow = null;

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

// SharedArrayBuffer を有効にするためのセキュリティヘッダを設定
app.on('ready', () => {
  // Cross-Origin-Embedder-Policy と Cross-Origin-Opener-Policy ヘッダを設定
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Cross-Origin-Embedder-Policy': ['require-corp'],
        'Cross-Origin-Opener-Policy': ['same-origin']
      }
    })
  })
})

;(async () => {
  await app.whenReady()

  // ローカル画像読み込み用のカスタムプロトコル
  protocol.handle('local-image', (request) => {
    const url = request.url.replace('local-image://', '');
    try {
      const decodedUrl = decodeURIComponent(url);
      return net.fetch(`file://${decodedUrl}`);
    } catch (e) {
      console.error('Failed to load local-image:', e);
      return new Response('Not Found', { status: 404 });
    }
  });

  // ファイル選択ダイアログのハンドラー
  ipcMain.handle('dialog:openFiles', async () => {
    if (!global.mainWindow) return [];
    try {
      const result = await dialog.showOpenDialog(global.mainWindow, {
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }]
      });
      return result.canceled ? [] : result.filePaths;
    } catch (e) {
      console.error('Failed to open dialog:', e);
      return [];
    }
  });

  // シリアルポートハンドラーを設定
  setupSerialPortHandlers();

  const mainWindow = createWindow('main', {
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // WebAssemblyのストリーミングコンパイルを有効にする
      webSecurity: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // グローバル変数にメインウィンドウを設定
  global.mainWindow = mainWindow;

  if (isProd) {
    await mainWindow.loadURL('app://./home')
  } else {
    const port = process.argv[2]
    await mainWindow.loadURL(`http://localhost:${port}/home`)
    mainWindow.webContents.openDevTools()
  }
})()

app.on('window-all-closed', () => {
  app.quit()
})

ipcMain.on('message', async (event, arg) => {
  event.reply('message', `${arg} World!`)
})
