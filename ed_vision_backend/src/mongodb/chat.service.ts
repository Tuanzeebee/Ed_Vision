import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { Message, Conversation } from './schemas/message.schema';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
    constructor(
        @Inject('MESSAGE_MODEL')
        private messageModel: Model<Message>,
        @Inject('CONVERSATION_MODEL')
        private conversationModel: Model<Conversation>,
        private prisma: PrismaService, // Thêm Prisma để lấy dữ liệu từ PostgreSQL
    ) { }

    /**
     * Map account_id → instructor_id
     */
    async getInstructorByAccountId(accountId: number) {
        return this.prisma.instructor.findUnique({
            where: { account_id: accountId },
            select: { instructor_id: true },
        });
    }

    /**
     * Map account_id → student_id
     */
    async getStudentByAccountId(accountId: number) {
        return this.prisma.student.findUnique({
            where: { account_id: accountId },
            select: { student_id: true },
        });
    }

    /**
     * Lấy thông tin student từ PostgreSQL và tạo conversation metadata
     */
    private async getStudentMetadata(studentId: number) {
        const student = await this.prisma.student.findUnique({
            where: { student_id: studentId },
            include: {
                account: {
                    include: {
                        profile: true,
                    },
                },
                classGroup: true,
            },
        });

        if (!student) {
            throw new NotFoundException('Student not found');
        }

        return {
            studentInfo: {
                studentId: student.student_id.toString(),
                studentCode: student.student_code,
                studentName: student.account?.profile?.full_name || 'Unknown',
                className: student.classGroup?.class_code || 'Unknown',
                riskLevel: undefined, // Có thể thêm logic tính risk level
            },
        };
    }

    /**
     * Lấy thông tin teacher từ PostgreSQL
     */
    private async getTeacherInfo(instructorId: number) {
        const instructor = await this.prisma.instructor.findUnique({
            where: { instructor_id: instructorId },
            include: {
                account: {
                    include: {
                        profile: true,
                    },
                },
            },
        });

        if (!instructor) {
            throw new NotFoundException('Instructor not found');
        }

        return {
            id: instructor.instructor_id.toString(),
            name: instructor.account?.profile?.full_name || 'Unknown',
            avatar: instructor.account?.profile?.avatar_url || undefined,
        };
    }

    /**
     * Lấy danh sách students của teacher từ PostgreSQL
     */
    async getTeacherStudents(instructorId: number) {
        const students = await this.prisma.student.findMany({
            where: {
                classGroup: {
                    adviserAssignments: {
                        some: {
                            instructor_id: instructorId,
                            ended_date: null,
                        },
                    },
                },
            },
            include: {
                account: {
                    include: {
                        profile: true,
                    },
                },
                classGroup: true,
            },
            orderBy: {
                student_code: 'asc',
            },
        });

        return students.map((student) => ({
            id: student.student_id.toString(),
            name: student.account?.profile?.full_name || 'Unknown',
            avatar: student.account?.profile?.avatar_url || undefined,
            studentCode: student.student_code,
            className: student.classGroup?.class_code || 'Unknown',
        }));
    }

    /**
     * Lấy danh sách advisors (teachers) của student từ PostgreSQL
     */
    async getStudentAdvisors(studentId: number) {
        const student = await this.prisma.student.findUnique({
            where: { student_id: studentId },
            include: {
                classGroup: {
                    include: {
                        adviserAssignments: {
                            where: {
                                ended_date: null,
                            },
                            include: {
                                instructor: {
                                    include: {
                                        account: {
                                            include: {
                                                profile: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!student || !student.classGroup) {
            return [];
        }

        return student.classGroup.adviserAssignments.map((assignment) => ({
            id: assignment.instructor.instructor_id.toString(),
            name: assignment.instructor.account?.profile?.full_name || 'Unknown',
            avatar: assignment.instructor.account?.profile?.avatar_url || undefined,
            email: assignment.instructor.account?.email || undefined,
            department: undefined, // TODO: Add department info
        }));
    }

    /**
     * Tìm hoặc tạo cuộc hội thoại giữa teacher và student
     */
    async findOrCreateConversation(
        teacherId: string,
        studentId: string,
        conversationType: 'teacher-student' | 'teacher-parent',
    ): Promise<Conversation> {
        // Lấy thông tin từ PostgreSQL
        const teacherIdNum = parseInt(teacherId);
        const studentIdNum = parseInt(studentId);

        const teacherInfo = await this.getTeacherInfo(teacherIdNum);
        const metadata = await this.getStudentMetadata(studentIdNum);

        // Tìm cuộc hội thoại đã tồn tại trong MongoDB
        let conversation = await this.conversationModel.findOne({
            conversationType,
            participants: {
                $all: [
                    { $elemMatch: { userId: teacherId, isActive: true } },
                    { $elemMatch: { userId: studentId, isActive: true } }
                ]
            }
        });

        if (!conversation) {
            // Tạo cuộc hội thoại mới trong MongoDB
            conversation = await this.conversationModel.create({
                conversationType,
                participants: [
                    {
                        userId: teacherId,
                        userType: 'teacher',
                        userName: teacherInfo.name,
                        userAvatar: teacherInfo.avatar,
                        role: 'admin',
                        joinedAt: new Date(),
                        isActive: true,
                    },
                    {
                        userId: studentId,
                        userType: conversationType === 'teacher-student' ? 'student' : 'parent',
                        userName: metadata.studentInfo.studentName,
                        role: 'member',
                        joinedAt: new Date(),
                        isActive: true,
                    },
                ],
                unreadCount: {},
                isPinned: false,
                isMuted: false,
                mutedBy: [],
                isArchived: false,
                archivedBy: [],
                metadata,
            });
        }

        return conversation;
    }

    /**
     * Lấy conversation theo ID
     */
    async getConversationById(conversationId: string): Promise<Conversation> {
        const conversation = await this.conversationModel.findById(conversationId);
        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }
        return conversation;
    }

    /**
     * Lấy danh sách cuộc hội thoại của user
     */
    async getConversations(
        userId: string,
        userType: 'teacher' | 'student' | 'parent',
    ): Promise<any[]> {
        const conversations = await this.conversationModel
            .find({
                participants: {
                    $elemMatch: {
                        userId: userId,
                        userType: userType,
                        isActive: true,
                    }
                }
            })
            .sort({ 'lastMessage.timestamp': -1, updatedAt: -1 })
            .exec();

        // Enrich với dữ liệu từ PostgreSQL nếu cần
        return conversations.map((conv) => ({
            _id: conv._id,
            conversationType: conv.conversationType,
            participants: conv.participants,
            lastMessage: conv.lastMessage,
            unreadCount: conv.unreadCount[userId] || 0,
            metadata: conv.metadata,
            createdAt: conv.createdAt,
            updatedAt: conv.updatedAt,
        }));
    }

    /**
     * Gửi tin nhắn
     */
    async sendMessage(
        conversationId: string,
        senderId: string,
        senderType: 'teacher' | 'student' | 'parent',
        content: string,
    ): Promise<Message> {
        // Kiểm tra conversation tồn tại
        const conversation = await this.conversationModel.findById(conversationId);
        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        // Lấy thông tin sender
        const senderParticipant = conversation.participants.find(
            (p) => p.userId === senderId && p.isActive,
        );

        if (!senderParticipant) {
            throw new NotFoundException('Sender not found in conversation');
        }

        // Tạo message mới
        const message = await this.messageModel.create({
            conversationId,
            senderId,
            senderType,
            senderName: senderParticipant.userName,
            senderAvatar: senderParticipant.userAvatar,
            content,
            messageType: 'text',
            isRead: false,
            isEdited: false,
            isDeleted: false,
        });

        // Cập nhật lastMessage trong conversation
        const otherParticipants = conversation.participants.filter(
            (p) => p.userId !== senderId && p.isActive,
        );

        const newUnreadCount = { ...conversation.unreadCount };
        otherParticipants.forEach((p) => {
            newUnreadCount[p.userId] = (newUnreadCount[p.userId] || 0) + 1;
        });

        await this.conversationModel.findByIdAndUpdate(conversationId, {
            lastMessage: {
                content,
                senderId,
                senderName: senderParticipant.userName,
                timestamp: new Date(),
            },
            unreadCount: newUnreadCount,
            updatedAt: new Date(),
        });

        return message;
    }

    /**
     * Lấy tin nhắn của cuộc hội thoại
     */
    async getMessages(
        conversationId: string,
        limit: number = 50,
        skip: number = 0,
    ): Promise<Message[]> {
        return this.messageModel
            .find({
                conversationId,
                isDeleted: false,
            })
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .exec();
    }

    /**
     * Đánh dấu tin nhắn đã đọc
     */
    async markAsRead(
        conversationId: string,
        userId: string,
    ): Promise<void> {
        // Đánh dấu tất cả tin nhắn trong conversation là đã đọc
        await this.messageModel.updateMany(
            {
                conversationId,
                senderId: { $ne: userId },
                isRead: false,
            },
            {
                isRead: true,
                readAt: new Date(),
            },
        );

        // Reset unread count trong conversation
        const conversation = await this.conversationModel.findById(conversationId);
        if (conversation) {
            const newUnreadCount = { ...conversation.unreadCount };
            newUnreadCount[userId] = 0;
            await this.conversationModel.findByIdAndUpdate(conversationId, {
                unreadCount: newUnreadCount,
            });
        }
    }

    /**
     * Lấy số tin nhắn chưa đọc
     */
    async getUnreadCount(userId: string): Promise<number> {
        const conversations = await this.conversationModel.find({
            'participants.userId': userId,
            'participants.isActive': true,
        });

        let totalUnread = 0;
        conversations.forEach((conv) => {
            totalUnread += conv.unreadCount[userId] || 0;
        });

        return totalUnread;
    }

    /**
     * Tìm conversation theo ID
     */
    async findConversationById(conversationId: string): Promise<Conversation> {
        const conversation = await this.conversationModel.findById(conversationId);
        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }
        return conversation;
    }

    /**
     * Xóa tin nhắn (soft delete)
     */
    async deleteMessage(messageId: string, userId: string): Promise<void> {
        const message = await this.messageModel.findById(messageId);
        if (!message) {
            throw new NotFoundException('Message not found');
        }

        if (message.senderId !== userId) {
            throw new Error('You can only delete your own messages');
        }

        await this.messageModel.findByIdAndUpdate(messageId, {
            isDeleted: true,
            deletedAt: new Date(),
        });
    }

    /**
     * Chỉnh sửa tin nhắn
     */
    async editMessage(
        messageId: string,
        userId: string,
        newContent: string,
    ): Promise<Message | null> {
        const message = await this.messageModel.findById(messageId);
        if (!message) {
            throw new NotFoundException('Message not found');
        }

        if (message.senderId !== userId) {
            throw new Error('You can only edit your own messages');
        }

        return this.messageModel.findByIdAndUpdate(
            messageId,
            {
                content: newContent,
                isEdited: true,
                editedAt: new Date(),
            },
            { new: true },
        );
    }
}
