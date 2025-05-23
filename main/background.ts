import path from 'path'
import { app, ipcMain, session, BrowserWindow } from 'electron'
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
