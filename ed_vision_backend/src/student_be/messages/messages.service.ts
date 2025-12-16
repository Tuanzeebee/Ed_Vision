import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Model } from 'mongoose';
import type { Message, Conversation } from '../../mongodb';
import { PrismaService } from '../../prisma/prisma.service';
import {
    SendMessageDto,
    MarkAsReadDto,
    GetMessagesDto,
    SearchMessagesDto,
    EditMessageDto,
    DeleteMessageDto,
    UpdateConversationDto,
} from './dto/message.dto';

@Injectable()
export class MessagesService {
    constructor(
        @Inject('MESSAGE_MODEL')
        private messageModel: Model<Message>,
        @Inject('CONVERSATION_MODEL')
        private conversationModel: Model<Conversation>,
        private prisma: PrismaService,
    ) { }

    /**
     * Gửi tin nhắn mới
     */
    async sendMessage(studentId: number, dto: SendMessageDto) {
        try {
            // Lấy thông tin sinh viên từ PostgreSQL
            const student = await this.prisma.student.findUnique({
                where: { student_id: studentId },
                include: {
                    account: {
                        include: {
                            profile: true,
                        },
                    },
                },
            });

            if (!student) {
                throw new NotFoundException('Sinh viên không tồn tại');
            }

            const studentIdStr = studentId.toString();
            const recipientIdStr = dto.recipientId;

            // Tìm hoặc tạo conversation
            let conversation = await this.findOrCreateConversation(
                studentIdStr,
                recipientIdStr,
                dto.recipientType,
                student,
            );

            // Tạo tin nhắn mới
            const message = new this.messageModel({
                conversationId: String(conversation._id),
                senderId: studentIdStr,
                senderType: 'student',
                senderName: student.account?.profile?.full_name || 'Student',
                senderAvatar: student.account?.profile?.avatar_url,
                content: dto.content,
                messageType: dto.messageType || 'text',
                attachments: dto.attachments || [],
                isRead: false,
                isEdited: false,
                isDeleted: false,
            });

            await message.save();

            // Cập nhật lastMessage trong conversation
            conversation.lastMessage = {
                content: dto.content,
                senderId: studentIdStr,
                senderName: student.account?.profile?.full_name || 'Student',
                timestamp: new Date(),
            };

            // Tăng unreadCount cho recipient
            if (!conversation.unreadCount) {
                conversation.unreadCount = {};
            }
            conversation.unreadCount[recipientIdStr] =
                (conversation.unreadCount[recipientIdStr] || 0) + 1;

            await conversation.save();

            return {
                success: true,
                message: 'Tin nhắn đã được gửi',
                data: {
                    messageId: message._id,
                    conversationId: conversation._id,
                    message: message.toObject(),
                },
            };
        } catch (error) {
            console.error('Error sending message:', error);
            throw new BadRequestException('Không thể gửi tin nhắn');
        }
    }

    /**
     * Tìm hoặc tạo conversation
     */
    private async findOrCreateConversation(
        studentIdStr: string,
        recipientIdStr: string,
        recipientType: 'teacher' | 'student' | 'parent',
        student: any,
    ): Promise<Conversation> {
        // Tìm conversation hiện có
        let conversation = await this.conversationModel.findOne({
            'participants.userId': { $all: [studentIdStr, recipientIdStr] },
        });

        if (conversation) {
            return conversation;
        }

        // Lấy thông tin recipient
        let recipientInfo: any = {};
        if (recipientType === 'teacher') {
            const teacher = await this.prisma.instructor.findUnique({
                where: { instructor_id: parseInt(recipientIdStr) },
                include: {
                    account: {
                        include: {
                            profile: true,
                        },
                    },
                },
            });
            recipientInfo = {
                name: teacher?.account?.profile?.full_name || 'Teacher',
                avatar: teacher?.account?.profile?.avatar_url,
            };
        } else if (recipientType === 'student') {
            const otherStudent = await this.prisma.student.findUnique({
                where: { student_id: parseInt(recipientIdStr) },
                include: {
                    account: {
                        include: {
                            profile: true,
                        },
                    },
                },
            });
            recipientInfo = {
                name: otherStudent?.account?.profile?.full_name || 'Student',
                avatar: otherStudent?.account?.profile?.avatar_url,
            };
        }

        // Tạo conversation mới
        conversation = new this.conversationModel({
            conversationType: recipientType === 'teacher' ? 'teacher-student' : 'teacher-student',
            participants: [
                {
                    userId: studentIdStr,
                    userType: 'student',
                    userName: student.account?.profile?.full_name || 'Student',
                    userAvatar: student.account?.profile?.avatar_url,
                    role: 'member',
                    isActive: true,
                },
                {
                    userId: recipientIdStr,
                    userType: recipientType,
                    userName: recipientInfo.name,
                    userAvatar: recipientInfo.avatar,
                    role: 'member',
                    isActive: true,
                },
            ],
            unreadCount: {},
            isPinned: false,
            isMuted: false,
            mutedBy: [],
            isArchived: false,
            archivedBy: [],
            metadata: {
                studentInfo: {
                    studentId: student.student_id.toString(),
                    studentCode: student.student_code,
                    studentName: student.account?.profile?.full_name || 'Student',
                    className: student.class_code || 'N/A',
                },
            },
        });

        await conversation.save();
        return conversation;
    }

    /**
     * Lấy danh sách conversations của sinh viên
     */
    async getConversations(studentId: number) {
        try {
            const studentIdStr = studentId.toString();

            const conversations = await this.conversationModel
                .find({
                    'participants.userId': studentIdStr,
                    'participants.isActive': true,
                })
                .sort({ 'lastMessage.timestamp': -1, isPinned: -1 })
                .lean();

            return {
                success: true,
                data: conversations,
            };
        } catch (error) {
            console.error('Error getting conversations:', error);
            throw new BadRequestException('Không thể lấy danh sách hội thoại');
        }
    }

    /**
     * Lấy tin nhắn trong conversation (có pagination)
     */
    async getMessages(studentId: number, dto: GetMessagesDto) {
        try {
            const page = dto.page || 1;
            const limit = dto.limit || 50;
            const skip = (page - 1) * limit;

            // Verify student is in conversation
            const conversation = await this.conversationModel.findById(dto.conversationId);
            if (!conversation) {
                throw new NotFoundException('Cuộc hội thoại không tồn tại');
            }

            const isParticipant = conversation.participants.some(
                (p) => p.userId === studentId.toString() && p.isActive,
            );

            if (!isParticipant) {
                throw new BadRequestException('Bạn không có quyền xem cuộc hội thoại này');
            }

            // Build query
            const query: any = {
                conversationId: dto.conversationId,
                isDeleted: false,
            };

            if (dto.before) {
                const beforeMessage = await this.messageModel.findById(dto.before);
                if (beforeMessage) {
                    query.createdAt = { $lt: beforeMessage.createdAt };
                }
            }

            const messages = await this.messageModel
                .find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            const total = await this.messageModel.countDocuments(query);

            return {
                success: true,
                data: {
                    messages: messages.reverse(), // Reverse để hiển thị từ cũ đến mới
                    pagination: {
                        page,
                        limit,
                        total,
                        hasMore: skip + messages.length < total,
                    },
                },
            };
        } catch (error) {
            console.error('Error getting messages:', error);
            throw new BadRequestException('Không thể lấy tin nhắn');
        }
    }

    /**
     * Đánh dấu tin nhắn đã đọc
     */
    async markAsRead(studentId: number, dto: MarkAsReadDto) {
        try {
            const studentIdStr = studentId.toString();

            // Verify student is in conversation
            const conversation = await this.conversationModel.findById(dto.conversationId);
            if (!conversation) {
                throw new NotFoundException('Cuộc hội thoại không tồn tại');
            }

            const isParticipant = conversation.participants.some(
                (p) => p.userId === studentIdStr && p.isActive,
            );

            if (!isParticipant) {
                throw new BadRequestException('Bạn không có quyền');
            }

            // Update messages
            const query: any = {
                conversationId: dto.conversationId,
                senderId: { $ne: studentIdStr }, // Không phải tin nhắn của mình
                isRead: false,
            };

            if (dto.messageIds && dto.messageIds.length > 0) {
                query._id = { $in: dto.messageIds };
            }

            const result = await this.messageModel.updateMany(query, {
                $set: {
                    isRead: true,
                    readAt: new Date(),
                },
            });

            // Reset unreadCount
            conversation.unreadCount[studentIdStr] = 0;
            await conversation.save();

            return {
                success: true,
                message: 'Đã đánh dấu tin nhắn đã đọc',
                data: {
                    updatedCount: result.modifiedCount,
                },
            };
        } catch (error) {
            console.error('Error marking as read:', error);
            throw new BadRequestException('Không thể đánh dấu tin nhắn đã đọc');
        }
    }

    /**
     * Chỉnh sửa tin nhắn
     */
    async editMessage(studentId: number, dto: EditMessageDto) {
        try {
            const message = await this.messageModel.findById(dto.messageId);

            if (!message) {
                throw new NotFoundException('Tin nhắn không tồn tại');
            }

            if (message.senderId !== studentId.toString()) {
                throw new BadRequestException('Bạn không có quyền chỉnh sửa tin nhắn này');
            }

            message.content = dto.content;
            message.isEdited = true;
            message.editedAt = new Date();

            await message.save();

            return {
                success: true,
                message: 'Tin nhắn đã được chỉnh sửa',
                data: message,
            };
        } catch (error) {
            console.error('Error editing message:', error);
            throw new BadRequestException('Không thể chỉnh sửa tin nhắn');
        }
    }

    /**
     * Xóa tin nhắn (soft delete)
     */
    async deleteMessage(studentId: number, dto: DeleteMessageDto) {
        try {
            const message = await this.messageModel.findById(dto.messageId);

            if (!message) {
                throw new NotFoundException('Tin nhắn không tồn tại');
            }

            if (message.senderId !== studentId.toString()) {
                throw new BadRequestException('Bạn không có quyền xóa tin nhắn này');
            }

            message.isDeleted = true;
            message.deletedAt = new Date();
            message.content = 'Tin nhắn đã bị xóa';

            await message.save();

            return {
                success: true,
                message: 'Tin nhắn đã được xóa',
            };
        } catch (error) {
            console.error('Error deleting message:', error);
            throw new BadRequestException('Không thể xóa tin nhắn');
        }
    }

    /**
     * Tìm kiếm tin nhắn
     */
    async searchMessages(studentId: number, dto: SearchMessagesDto) {
        try {
            const studentIdStr = studentId.toString();
            const page = dto.page || 1;
            const limit = dto.limit || 20;
            const skip = (page - 1) * limit;

            // Build query
            const query: any = {
                content: { $regex: dto.query, $options: 'i' },
                isDeleted: false,
            };

            if (dto.conversationId) {
                query.conversationId = dto.conversationId;
            } else {
                // Lấy tất cả conversations của student
                const conversations = await this.conversationModel
                    .find({ 'participants.userId': studentIdStr })
                    .select('_id')
                    .lean();

                const conversationIds = conversations.map((c) => c._id.toString());
                query.conversationId = { $in: conversationIds };
            }

            const messages = await this.messageModel
                .find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            const total = await this.messageModel.countDocuments(query);

            return {
                success: true,
                data: {
                    messages,
                    pagination: {
                        page,
                        limit,
                        total,
                        hasMore: skip + messages.length < total,
                    },
                },
            };
        } catch (error) {
            console.error('Error searching messages:', error);
            throw new BadRequestException('Không thể tìm kiếm tin nhắn');
        }
    }

    /**
     * Cập nhật conversation settings
     */
    async updateConversation(studentId: number, dto: UpdateConversationDto) {
        try {
            const studentIdStr = studentId.toString();

            const conversation = await this.conversationModel.findById(dto.conversationId);
            if (!conversation) {
                throw new NotFoundException('Cuộc hội thoại không tồn tại');
            }

            const isParticipant = conversation.participants.some(
                (p) => p.userId === studentIdStr && p.isActive,
            );

            if (!isParticipant) {
                throw new BadRequestException('Bạn không có quyền');
            }

            if (dto.isPinned !== undefined) {
                conversation.isPinned = dto.isPinned;
            }

            if (dto.isMuted !== undefined) {
                conversation.isMuted = dto.isMuted;
                if (dto.isMuted) {
                    if (!conversation.mutedBy.includes(studentIdStr)) {
                        conversation.mutedBy.push(studentIdStr);
                    }
                } else {
                    conversation.mutedBy = conversation.mutedBy.filter((id) => id !== studentIdStr);
                }
            }

            if (dto.isArchived !== undefined) {
                conversation.isArchived = dto.isArchived;
                if (dto.isArchived) {
                    if (!conversation.archivedBy.includes(studentIdStr)) {
                        conversation.archivedBy.push(studentIdStr);
                    }
                } else {
                    conversation.archivedBy = conversation.archivedBy.filter(
                        (id) => id !== studentIdStr,
                    );
                }
            }

            await conversation.save();

            return {
                success: true,
                message: 'Cập nhật cuộc hội thoại thành công',
                data: conversation,
            };
        } catch (error) {
            console.error('Error updating conversation:', error);
            throw new BadRequestException('Không thể cập nhật cuộc hội thoại');
        }
    }

    /**
     * Lấy số lượng tin nhắn chưa đọc
     */
    async getUnreadCount(studentId: number) {
        try {
            const studentIdStr = studentId.toString();

            const conversations = await this.conversationModel
                .find({
                    'participants.userId': studentIdStr,
                    'participants.isActive': true,
                })
                .lean();

            let totalUnread = 0;
            const unreadByConversation: any = {};

            conversations.forEach((conv) => {
                const unread = conv.unreadCount?.[studentIdStr] || 0;
                totalUnread += unread;
                unreadByConversation[conv._id.toString()] = unread;
            });

            return {
                success: true,
                data: {
                    total: totalUnread,
                    byConversation: unreadByConversation,
                },
            };
        } catch (error) {
            console.error('Error getting unread count:', error);
            throw new BadRequestException('Không thể lấy số tin nhắn chưa đọc');
        }
    }
}
