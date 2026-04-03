import { io, Socket } from 'socket.io-client';

class SocketService {
    private socket: Socket | null = null;
    private connectPromise: Promise<void>| null = null;

    connect(userId: string, userType: 'teacher'| 'student'| 'parent'): Promise<void> {
        if (this.socket?.connected) {
            return Promise.resolve();
        }

        if (this.connectPromise) {
            return this.connectPromise;
        }

        this.connectPromise = new Promise((resolve, reject) => {
            this.socket = io('http://localhost:3000', {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5,
            });

            this.socket.on('connect', () => {
                console.log('Socket connected:', this.socket?.id);
                // Register user
                this.socket?.emit('register', { userId, userType });
                this.connectPromise = null;
                resolve();
            });

            this.socket.on('disconnect', () => {
                console.log('Socket disconnected');
            });

            this.socket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
                this.connectPromise = null;
                reject(error);
            });
        });

        return this.connectPromise;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    joinConversation(conversationId: string) {
        this.socket?.emit('joinConversation', { conversationId });
    }

    leaveConversation(conversationId: string) {
        this.socket?.emit('leaveConversation', { conversationId });
    }

    sendMessage(
        conversationId: string,
        senderId: string,
        senderType: 'teacher'| 'student'| 'parent',
        content: string,
    ) {
        return new Promise((resolve, reject) => {
            this.socket?.emit(
                'sendMessage',
                { conversationId, senderId, senderType, content },
                (response: any) => {
                    if (response.success) {
                        resolve(response.message);
                    } else {
                        reject(new Error(response.error));
                    }
                },
            );
        });
    }

    onNewMessage(callback: (message: any) =>void) {
        this.socket?.on('newMessage', callback);
    }

    onConversationUpdated(callback: (data: any) =>void) {
        this.socket?.on('conversationUpdated', callback);
    }

    onUserTyping(callback: (data: any) =>void) {
        this.socket?.on('userTyping', callback);
    }

    onMessagesRead(callback: (data: any) =>void) {
        this.socket?.on('messagesRead', callback);
    }

    sendTyping(conversationId: string, userId: string, userName: string, isTyping: boolean) {
        this.socket?.emit('typing', { conversationId, userId, userName, isTyping });
    }

    markAsRead(conversationId: string, userId: string) {
        this.socket?.emit('markAsRead', { conversationId, userId });
    }

    off(event: string, callback?: any) {
        this.socket?.off(event, callback);
    }

    getSocket() {
        return this.socket;
    }

    isConnected() {
        return this.socket?.connected || false;
    }
}

export const socketService = new SocketService();
