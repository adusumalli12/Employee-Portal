import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketIOServer;

/**
 * Initialize Socket.io Server
 * @param server HTTP Server instance
 */
export const initSocket = (server: HttpServer) => {
    io = new SocketIOServer(server, {
        cors: {
            origin: '*', // Adjust based on your environment
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 New client connected: ${socket.id}`);

        // Join a room based on user ID
        socket.on('join', (userId: string) => {
            if (userId) {
                socket.join(userId);
                console.log(`👤 User joined room: ${userId}`);
            }
        });

        socket.on('disconnect', () => {
            console.log(`🔌 Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

/**
 * Get the Socket.io instance
 */
export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

/**
 * Emit a notification to a specific user
 * @param recipientId Recipient User ID
 * @param data Notification payload
 */
export const emitNotification = (recipientId: string, data: any) => {
    if (io) {
        io.to(recipientId).emit('notification', data);
        console.log(`📡 Notification emitted to ${recipientId}:`, data.title);
    }
};

export default {
    initSocket,
    getIO,
    emitNotification
};
