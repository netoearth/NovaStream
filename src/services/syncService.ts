import { SyncDevice, SyncRoom } from '../types/media';

const CHANNEL_NAME = 'novastream_sync_bus';
const STORAGE_KEY = 'novastream_sync_room_state';
const DEVICE_KEY = 'novastream_local_device';

export type SyncMessage =
  | { type: 'HEARTBEAT'; device: SyncDevice }
  | { type: 'ROOM_UPDATE'; room: SyncRoom }
  | { type: 'PLAY'; mediaId: string; time: number; timestamp: number }
  | { type: 'PAUSE'; mediaId: string; time: number; timestamp: number }
  | { type: 'SEEK'; mediaId: string; time: number; timestamp: number }
  | { type: 'REMOTE_COMMAND'; targetDeviceId: string; command: 'play' | 'pause' | 'seek' | 'volume' | 'switchMedia'; value?: any };

class SyncService {
  private channel: BroadcastChannel | null = null;
  private currentDevice: SyncDevice;
  private currentRoom: SyncRoom | null = null;
  private listeners: Set<(msg: SyncMessage) => void> = new Set();
  private heartbeatTimer: number | null = null;

  constructor() {
    this.currentDevice = this.initLocalDevice();
    this.initChannel();
    this.startHeartbeat();
  }

  private initLocalDevice(): SyncDevice {
    let saved = null;
    try {
      const item = localStorage.getItem(DEVICE_KEY);
      if (item) saved = JSON.parse(item);
    } catch (e) {}

    const platform = this.detectPlatform();
    const deviceId = saved?.id || 'dev-' + Math.random().toString(36).substring(2, 9);
    const deviceName = saved?.name || `${platform.toUpperCase()} Client (${deviceId.slice(-4)})`;

    const device: SyncDevice = {
      id: deviceId,
      name: deviceName,
      platform,
      ip: '192.168.1.' + Math.floor(Math.random() * 150 + 10),
      status: 'active',
      currentTimeSec: 0,
      isPlaying: false,
      volume: 85,
      lastPing: Date.now(),
      isCurrentDevice: true,
    };

    try {
      localStorage.setItem(DEVICE_KEY, JSON.stringify(device));
    } catch (e) {}

    return device;
  }

  private detectPlatform(): 'macos' | 'windows' | 'linux' | 'ios' | 'android' | 'appletv' {
    if (typeof navigator === 'undefined') return 'windows';
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('mac') && !ua.includes('mobile')) return 'macos';
    if (ua.includes('win')) return 'windows';
    if (ua.includes('linux') && !ua.includes('android')) return 'linux';
    if (ua.includes('iphone') || ua.includes('ipad')) return 'ios';
    if (ua.includes('android')) return 'android';
    return 'macos';
  }

  private initChannel() {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          this.handleIncomingMessage(event.data);
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported, falling back to local events', e);
      }
    }

    // Fallback listening to localStorage changes for older environments
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            this.handleIncomingMessage(data);
          } catch (err) {}
        }
      });
    }
  }

  private startHeartbeat() {
    this.broadcastHeartbeat();
    if (typeof window !== 'undefined') {
      this.heartbeatTimer = window.setInterval(() => {
        this.broadcastHeartbeat();
      }, 3000);
    }
  }

  public getLocalDevice(): SyncDevice {
    return this.currentDevice;
  }

  public setDeviceName(name: string) {
    this.currentDevice.name = name;
    localStorage.setItem(DEVICE_KEY, JSON.stringify(this.currentDevice));
    this.broadcastHeartbeat();
  }

  public subscribe(callback: (msg: SyncMessage) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private handleIncomingMessage(msg: SyncMessage) {
    this.listeners.forEach((listener) => {
      try {
        listener(msg);
      } catch (err) {
        console.error('Error in sync listener', err);
      }
    });
  }

  public broadcast(msg: SyncMessage) {
    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch (e) {}
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(msg));
    } catch (e) {}
    this.handleIncomingMessage(msg);
  }

  public broadcastHeartbeat() {
    this.currentDevice.lastPing = Date.now();
    this.broadcast({
      type: 'HEARTBEAT',
      device: { ...this.currentDevice },
    });
  }

  public broadcastPlay(mediaId: string, time: number) {
    this.currentDevice.isPlaying = true;
    this.currentDevice.currentMediaId = mediaId;
    this.currentDevice.currentTimeSec = time;
    this.broadcast({
      type: 'PLAY',
      mediaId,
      time,
      timestamp: Date.now(),
    });
  }

  public broadcastPause(mediaId: string, time: number) {
    this.currentDevice.isPlaying = false;
    this.currentDevice.currentMediaId = mediaId;
    this.currentDevice.currentTimeSec = time;
    this.broadcast({
      type: 'PAUSE',
      mediaId,
      time,
      timestamp: Date.now(),
    });
  }

  public broadcastSeek(mediaId: string, time: number) {
    this.currentDevice.currentTimeSec = time;
    this.broadcast({
      type: 'SEEK',
      mediaId,
      time,
      timestamp: Date.now(),
    });
  }

  public sendRemoteCommand(targetDeviceId: string, command: 'play' | 'pause' | 'seek' | 'volume' | 'switchMedia', value?: any) {
    this.broadcast({
      type: 'REMOTE_COMMAND',
      targetDeviceId,
      command,
      value,
    });
  }
}

export const syncService = new SyncService();
