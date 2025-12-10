import axios from 'axios';

const API_URL = 'http://localhost:5173/api'; // ✅ Go through Vite proxy

export interface ChatMessage {
    _id: string;
    conversationId: string;
    senderId: string;
    senderType: 'teacher' | 'student' | 'parent';
    senderName: string;
    senderAvatar?: string;
    content: string;
    messageType: 'text' | 'file' | 'image' | 'system';
    isRead: boolean;
    readAt?: Date;
    createdAt: Date;
    updatedAt: Date;
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
    unreadCount: number; // Backend returns number for current user
    metadata?: {
        studentInfo?: {
            studentId: string;
            studentCode: string;
            studentName: string;
            className: string;
            riskLevel?: 'high' | 'medium' | 'low';
        };
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface ConversationParticipant {
    userId: string;
    userType: 'teacher' | 'student' | 'parent';
    userName: string;
    userAvatar?: string;
    isActive: boolean;
}

class ChatServiceClass {
    private getAuthHeader() {
        const token = localStorage.getItem('token');
        return {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        };
    }

    // Teacher APIs
    async getTeacherStudents(): Promise<any[]> {
        const response = await axios.get(`${API_URL}/teacher/chat/students`, this.getAuthHeader());
        return response.data;
    }

    async getTeacherParents(): Promise<any[]> {
        const response = await axios.get(`${API_URL}/teacher/chat/parents`, this.getAuthHeader());
        return response.data;
    }

    async getTeacherConversations(): Promise<Conversation[]> {
        const response = await axios.get(`${API_URL}/teacher/chat/conversations`, this.getAuthHeader());
        return response.data;
    }

    // Get teacher's classes for filtering
    getTeacherClasses = async () => {
        const response = await axios.get(`${API_URL}/teacher/chat/classes`, this.getAuthHeader())
        return response.data
    }

    // Send bulk message
    sendBulkMessage = async (data: {
        recipientType: 'students' | 'parents' | 'both'
        classIds?: number[]
        riskLevels?: string[]
        message: string
        title?: string
    }) => {
        const response = await axios.post(`${API_URL}/teacher/chat/bulk-message`, data, this.getAuthHeader())
        return response.data
    }

    // Send quick message with template
    sendQuickMessage = async (data: {
        recipientIds: string[]
        recipientType: 'student' | 'parent'
        template: 'reminder' | 'encouragement' | 'concern' | 'custom'
        customMessage?: string
        subject?: string
    }) => {
        const response = await axios.post(`${API_URL}/teacher/chat/quick-message`, data, this.getAuthHeader())
        return response.data
    }

    // Send urgent alert
    sendUrgentAlert = async (data: {
        studentIds: string[]
        alertType: 'academic' | 'attendance' | 'behavior' | 'other'
        severity: 'high' | 'medium'
        message: string
        requireConfirmation: boolean
        notifyParents: boolean
    }) => {
        const response = await axios.post(`${API_URL}/teacher/chat/urgent-alert`, data, this.getAuthHeader())
        return response.data
    }

    async createTeacherConversation(
        studentId: string,
        studentName: string,
        conversationType: 'teacher-student' | 'teacher-parent',
        metadata?: any
    ): Promise<Conversation> {
        const response = await axios.post(
            `${API_URL}/teacher/chat/conversations`,
            { studentId, studentName, conversationType, metadata },
            this.getAuthHeader()
        );
        return response.data;
    }

    async getConversationMessages(conversationId: string, limit = 50, skip = 0): Promise<ChatMessage[]> {
        const response = await axios.get(
            `${API_URL}/teacher/chat/conversations/${conversationId}/messages`,
            {
                params: { limit, skip },
                ...this.getAuthHeader(),
            }
        );
        return response.data;
    }

    async sendMessage(conversationId: string, content: string): Promise<ChatMessage> {
        const response = await axios.post(
            `${API_URL}/teacher/chat/messages`,
            { conversationId, content },
            this.getAuthHeader()
        );
        return response.data;
    }

    async markAsRead(conversationId: string): Promise<void> {
        await axios.put(
            `${API_URL}/teacher/chat/messages/read`,
            { conversationId },
            this.getAuthHeader()
        );
    }

    async getUnreadCount(): Promise<number> {
        const response = await axios.get(`${API_URL}/teacher/chat/unread-count`, this.getAuthHeader());
        return response.data.count;
    }

    async editMessage(messageId: string, content: string): Promise<ChatMessage> {
        const response = await axios.put(
            `${API_URL}/teacher/chat/messages/${messageId}`,
            { content },
            this.getAuthHeader()
        );
        return response.data;
    }

    async deleteMessage(messageId: string): Promise<void> {
        await axios.delete(`${API_URL}/teacher/chat/messages/${messageId}`, this.getAuthHeader());
    }

    // Student APIs
    async getStudentConversations(): Promise<Conversation[]> {
        const response = await axios.get(`${API_URL}/student/chat/conversations`, this.getAuthHeader());
        return response.data;
    }

    async getStudentAdvisors(): Promise<any[]> {
        const response = await axios.get(`${API_URL}/student/chat/advisors`, this.getAuthHeader());
        return response.data;
    }

    async createStudentConversation(
        teacherId: string,
        teacherName: string,
        metadata?: any
    ): Promise<Conversation> {
        const response = await axios.post(
            `${API_URL}/student/chat/conversations`,
            { studentId: teacherId, studentName: teacherName, conversationType: 'teacher-student', metadata },
            this.getAuthHeader()
        );
        return response.data;
    }

    async sendStudentMessage(conversationId: string, content: string): Promise<ChatMessage> {
        const response = await axios.post(
            `${API_URL}/student/chat/messages`,
            { conversationId, content },
            this.getAuthHeader()
        );
        return response.data;
    }

    async markStudentAsRead(conversationId: string): Promise<void> {
        await axios.put(
            `${API_URL}/student/chat/messages/read`,
            { conversationId },
            this.getAuthHeader()
        );
    }

    async getStudentUnreadCount(): Promise<number> {
        const response = await axios.get(`${API_URL}/student/chat/unread-count`, this.getAuthHeader());
        return response.data.count;
    }

    async getStudentConversationMessages(conversationId: string, limit = 50, skip = 0): Promise<ChatMessage[]> {
        const response = await axios.get(
            `${API_URL}/student/chat/conversations/${conversationId}/messages`,
            {
                params: { limit, skip },
                ...this.getAuthHeader(),
            }
        );
        return response.data;
    }

    async editStudentMessage(messageId: string, content: string): Promise<ChatMessage> {
        const response = await axios.put(
            `${API_URL}/student/chat/messages/${messageId}`,
            { content },
            this.getAuthHeader()
        );
        return response.data;
    }

    async deleteStudentMessage(messageId: string): Promise<void> {
        await axios.delete(`${API_URL}/student/chat/messages/${messageId}`, this.getAuthHeader());
    }

    // Parent APIs
    async getParentConversations(): Promise<Conversation[]> {
        const response = await axios.get(`${API_URL}/parent/chat/conversations`, this.getAuthHeader());
        return response.data;
    }

    async getParentTeachers(): Promise<any[]> {
        const response = await axios.get(`${API_URL}/parent/chat/teachers`, this.getAuthHeader());
        return response.data;
    }

    async createParentConversation(teacherId: string): Promise<Conversation> {
        const response = await axios.post(
            `${API_URL}/parent/chat/conversation`,
            { teacherId },
            this.getAuthHeader()
        );
        return response.data;
    }

    async sendParentMessage(conversationId: string, content: string): Promise<ChatMessage> {
        const response = await axios.post(
            `${API_URL}/parent/chat/send`,
            { conversationId, content },
            this.getAuthHeader()
        );
        return response.data;
    }

    async markParentAsRead(conversationId: string): Promise<void> {
        await axios.put(
            `${API_URL}/parent/chat/mark-read`,
            { conversationId },
            this.getAuthHeader()
        );
    }

    async getParentUnreadCount(): Promise<number> {
        const response = await axios.get(`${API_URL}/parent/chat/unread-count`, this.getAuthHeader());
        return response.data.count;
    }

    async getParentConversationMessages(conversationId: string, limit = 50, skip = 0): Promise<ChatMessage[]> {
        const response = await axios.get(
            `${API_URL}/parent/chat/messages/${conversationId}`,
            {
                params: { limit, skip },
                ...this.getAuthHeader(),
            }
        );
        return response.data;
    }
}

export const chatService = new ChatServiceClass();
