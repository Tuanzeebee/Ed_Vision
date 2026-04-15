import { useState, useEffect, useCallback } from 'react';
import {
    getConversations,
    getMessages,
    sendMessage,
    markAsRead,
    searchMessages,
    editMessage,
    deleteMessage,
    updateConversation,
    getUnreadCount,
} from '../services/student/messageService';
import type {
    Conversation,
    Message,
    SendMessageRequest,
} from '../services/student/messageService';

export const useMessages = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        total: 0,
        hasMore: false,
    });

    /**
     * Load danh sách conversations
     */
    const loadConversations = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getConversations();
            if (response.success) {
                setConversations(response.data);
            }
        } catch (error) {
            console.error('Failed to load conversations:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Load messages trong conversation
     */
    const loadMessages = useCallback(
        async (conversationId: string, page: number = 1, append: boolean = false) => {
            try {
                setLoading(true);
                const response = await getMessages(conversationId, page);
                if (response.success) {
                    if (append) {
                        setMessages((prev) =>[...prev, ...response.data.messages]);
                    } else {
                        setMessages(response.data.messages);
                    }
                    setPagination(response.data.pagination);

                    // Mark as read
                    await markAsRead(conversationId);
                    await loadUnreadCount();
                }
            } catch (error) {
                console.error('Failed to load messages:', error);
            } finally {
                setLoading(false);
            }
        },
        []
    );

    /**
     * Gửi tin nhắn
     */
    const handleSendMessage = useCallback(
        async (data: SendMessageRequest) => {
            try {
                setSending(true);
                const response = await sendMessage(data);
                if (response.success) {
                    // Refresh messages if in conversation
                    if (selectedConversation) {
                        await loadMessages(selectedConversation._id);
                    }
                    // Refresh conversations list
                    await loadConversations();
                    return response;
                }
            } catch (error) {
                console.error('Failed to send message:', error);
                throw error;
            } finally {
                setSending(false);
            }
        },
        [selectedConversation, loadMessages, loadConversations]
    );

    /**
     * Chọn conversation
     */
    const selectConversation = useCallback(
        async (conversation: Conversation) => {
            setSelectedConversation(conversation);
            await loadMessages(conversation._id);
        },
        [loadMessages]
    );

    /**
     * Load more messages (pagination)
     */
    const loadMoreMessages = useCallback(async () => {
        if (selectedConversation && pagination.hasMore) {
            await loadMessages(selectedConversation._id, pagination.page + 1, true);
        }
    }, [selectedConversation, pagination, loadMessages]);

    /**
     * Tìm kiếm tin nhắn
     */
    const handleSearchMessages = useCallback(
        async (query: string, conversationId?: string) => {
            try {
                setLoading(true);
                const response = await searchMessages(query, conversationId);
                return response;
            } catch (error) {
                console.error('Failed to search messages:', error);
                throw error;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    /**
     * Chỉnh sửa tin nhắn
     */
    const handleEditMessage = useCallback(
        async (messageId: string, content: string) => {
            try {
                const response = await editMessage(messageId, content);
                if (response.success && selectedConversation) {
                    // Refresh messages
                    await loadMessages(selectedConversation._id);
                }
                return response;
            } catch (error) {
                console.error('Failed to edit message:', error);
                throw error;
            }
        },
        [selectedConversation, loadMessages]
    );

    /**
     * Xóa tin nhắn
     */
    const handleDeleteMessage = useCallback(
        async (messageId: string) => {
            try {
                const response = await deleteMessage(messageId);
                if (response.success && selectedConversation) {
                    // Refresh messages
                    await loadMessages(selectedConversation._id);
                }
                return response;
            } catch (error) {
                console.error('Failed to delete message:', error);
                throw error;
            }
        },
        [selectedConversation, loadMessages]
    );

    /**
     * Pin/Unpin conversation
     */
    const togglePin = useCallback(
        async (conversationId: string, isPinned: boolean) => {
            try {
                await updateConversation(conversationId, { isPinned });
                await loadConversations();
            } catch (error) {
                console.error('Failed to toggle pin:', error);
                throw error;
            }
        },
        [loadConversations]
    );

    /**
     * Mute/Unmute conversation
     */
    const toggleMute = useCallback(
        async (conversationId: string, isMuted: boolean) => {
            try {
                await updateConversation(conversationId, { isMuted });
                await loadConversations();
            } catch (error) {
                console.error('Failed to toggle mute:', error);
                throw error;
            }
        },
        [loadConversations]
    );

    /**
     * Archive/Unarchive conversation
     */
    const toggleArchive = useCallback(
        async (conversationId: string, isArchived: boolean) => {
            try {
                await updateConversation(conversationId, { isArchived });
                await loadConversations();
            } catch (error) {
                console.error('Failed to toggle archive:', error);
                throw error;
            }
        },
        [loadConversations]
    );

    /**
     * Load unread count
     */
    const loadUnreadCount = useCallback(async () => {
        try {
            const response = await getUnreadCount();
            if (response.success) {
                setUnreadCount(response.data.total);
            }
        } catch (error) {
            console.error('Failed to load unread count:', error);
        }
    }, []);

    /**
     * Initial load
     */
    useEffect(() => {
        loadConversations();
        loadUnreadCount();

        // Poll unread count every 30 seconds
        const interval = setInterval(loadUnreadCount, 30000);

        return () =>clearInterval(interval);
    }, [loadConversations, loadUnreadCount]);

    return {
        // State
        conversations,
        selectedConversation,
        messages,
        loading,
        sending,
        unreadCount,
        pagination,

        // Actions
        loadConversations,
        loadMessages,
        selectConversation,
        loadMoreMessages,
        handleSendMessage,
        handleSearchMessages,
        handleEditMessage,
        handleDeleteMessage,
        togglePin,
        toggleMute,
        toggleArchive,
        loadUnreadCount,
    };
};
