import apiClient from '../api/apiClient';

export interface MessageAttachment {
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
}

export interface SendMessageRequest {
    recipientId: string;
    recipientType: 'teacher' | 'student' | 'parent';
    content: string;
    messageType?: 'text' | 'file' | 'image';
    attachments?: MessageAttachment[];
    conversationId?: string;
}

export interface Message {
    _id: string;
    conversationId: string;
    senderId: string;
    senderType: 'teacher' | 'student' | 'parent';
    senderName: string;
    senderAvatar?: string;
    content: string;
    messageType: 'text' | 'file' | 'image' | 'system';
    attachments?: MessageAttachment[];
    isRead: boolean;
    readAt?: Date;
    isEdited: boolean;
    editedAt?: Date;
    isDeleted: boolean;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface ConversationParticipant {
    userId: string;
    userType: 'teacher' | 'student' | 'parent';
    userName: string;
    userAvatar?: string;
    role: 'owner' | 'admin' | 'member';
    isActive: boolean;
    joinedAt: Date;
}

export interface Conversation {
    _id: string;
    conversationType: 'teacher-student' | 'teacher-parent' | 'group';
    participants: ConversationParticipant[];
    lastMessage?: {
        content: string;
        senderId: string;
        senderName: string;
        timestamp: Date;
    };
    unreadCount: Record<string, number>;
    isPinned: boolean;
    isMuted: boolean;
    mutedBy: string[];
    isArchived: boolean;
    archivedBy: string[];
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
}

export interface GetMessagesResponse {
    success: boolean;
    data: {
        messages: Message[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            hasMore: boolean;
        };
    };
}

export interface ConversationsResponse {
    success: boolean;
    data: Conversation[];
}

export interface UnreadCountResponse {
    success: boolean;
    data: {
        total: number;
        byConversation: Record<string, number>;
    };
}

/**
 * Gửi tin nhắn mới
 */
export const sendMessage = async (data: SendMessageRequest) => {
    const response = await apiClient.post('/student/messages/send', data);
    return response.data;
};

/**
 * Lấy danh sách hội thoại
 */
export const getConversations = async (): Promise<ConversationsResponse> => {
    const response = await apiClient.get('/student/messages/conversations');
    return response.data;
};

/**
 * Lấy tin nhắn trong hội thoại
 */
export const getMessages = async (
    conversationId: string,
    page: number = 1,
    limit: number = 50,
    before?: string
): Promise<GetMessagesResponse> => {
    const params: any = { page, limit };
    if (before) params.before = before;

    const response = await apiClient.get(
        `/student/messages/conversations/${conversationId}`,
        { params }
    );
    return response.data;
};

/**
 * Đánh dấu tin nhắn đã đọc
 */
export const markAsRead = async (
    conversationId: string,
    messageIds?: string[]
) => {
    const response = await apiClient.post('/student/messages/mark-read', {
        conversationId,
        messageIds,
    });
    return response.data;
};

/**
 * Tìm kiếm tin nhắn
 */
export const searchMessages = async (
    query: string,
    conversationId?: string,
    page: number = 1,
    limit: number = 20
) => {
    const params: any = { query, page, limit };
    if (conversationId) params.conversationId = conversationId;

    const response = await apiClient.get('/student/messages/search', { params });
    return response.data;
};

/**
 * Chỉnh sửa tin nhắn
 */
export const editMessage = async (messageId: string, content: string) => {
    const response = await apiClient.put(`/student/messages/${messageId}`, {
        content,
    });
    return response.data;
};

/**
 * Xóa tin nhắn
 */
export const deleteMessage = async (messageId: string) => {
    const response = await apiClient.delete(`/student/messages/${messageId}`);
    return response.data;
};

/**
 * Cập nhật cài đặt hội thoại
 */
export const updateConversation = async (
    conversationId: string,
    settings: {
        isPinned?: boolean;
        isMuted?: boolean;
        isArchived?: boolean;
    }
) => {
    const response = await apiClient.patch(
        `/student/messages/conversations/${conversationId}`,
        settings
    );
    return response.data;
};

/**
 * Lấy số tin nhắn chưa đọc
 */
export const getUnreadCount = async (): Promise<UnreadCountResponse> => {
    const response = await apiClient.get('/student/messages/unread-count');
    return response.data;
};
