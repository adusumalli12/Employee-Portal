import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth.service';

class SocketService {
    private socket: Socket | null = null;
    private static instance: SocketService;
    private callbacks: ((notification: any) => void)[] = [];

    private constructor() {}

    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    public connect(): void {
        if (this.socket) return;

        const user = AuthService.getUser();
        if (!user || (!user.id && !(user as any)._id)) return;
        
        const userId = user.id || (user as any)._id;

        // In development, the server is on :3000 (specified in .env)
        const serverUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin;

        this.socket = io(serverUrl, {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
            console.log('🔌 Socket connected:', this.socket?.id);
            this.socket?.emit('join', userId);
        });

        this.socket.on('notification', (data: any) => {
            console.log('📡 Real-time notification received:', data.title);
            this.notifyListeners(data);
        });

        this.socket.on('disconnect', () => {
            console.log('🔌 Socket disconnected');
        });
    }

    public disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    public onNotification(callback: (notification: any) => void): () => void {
        this.callbacks.push(callback);
        // Return unsubscribe function
        return () => {
            this.callbacks = this.callbacks.filter(cb => cb !== callback);
        };
    }

    private notifyListeners(notification: any): void {
        this.callbacks.forEach(cb => cb(notification));
    }
}

export default SocketService.getInstance();
