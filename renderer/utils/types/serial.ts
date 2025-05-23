export interface SerialConfig {
  port: string | null;
  baudRate: number;
  isConnected: boolean;
}

export interface SerialState extends SerialConfig {
  availablePorts: string[];
}

export interface SerialContextType {
  serialState: SerialState;
  connect: (port: string, baudRate: number) => Promise<void>;
  disconnect: () => Promise<void>;
  refreshPorts: () => Promise<void>;
}
