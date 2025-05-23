import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

const handler = {
  send(channel: string, value: unknown) {
    ipcRenderer.send(channel, value)
  },
  on(channel: string, callback: (...args: unknown[]) => void) {
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
      callback(...args)
    ipcRenderer.on(channel, subscription)

    return () => {
      ipcRenderer.removeListener(channel, subscription)
    }
  },
}

// シリアルポート通信のAPIを定義
const serialHandler = {
  listPorts: () => ipcRenderer.invoke('serial:list-ports'),
  connect: (port: string, baudRate: number) => ipcRenderer.invoke('serial:connect', port, baudRate),
  disconnect: () => ipcRenderer.invoke('serial:disconnect'),
  write: (data: string) => ipcRenderer.invoke('serial:write', data),
  isConnected: () => ipcRenderer.invoke('serial:is-connected'),
  onData: (callback: (data: string) => void) => {
    const subscription = (_event: IpcRendererEvent, data: string) => callback(data)
    ipcRenderer.on('serial:data', subscription)
    return () => {
      ipcRenderer.removeListener('serial:data', subscription)
    }
  }
}

contextBridge.exposeInMainWorld('ipc', handler)
contextBridge.exposeInMainWorld('serialPort', serialHandler)

export type IpcHandler = typeof handler
export type SerialHandler = typeof serialHandler
