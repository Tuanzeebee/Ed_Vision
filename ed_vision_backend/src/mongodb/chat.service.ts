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
     * Map account_id → parent_id
     */
    async getParentByAccountId(accountId: number) {
        return this.prisma.parent.findUnique({
            where: { account_id: accountId },
            select: { parent_id: true },
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
     * Lấy thông tin parent từ PostgreSQL và tạo conversation metadata
     */
    private async getParentMetadata(parentId: number) {
        const parent = await this.prisma.parent.findUnique({
            where: { parent_id: parentId },
            include: {
                account: {
                    include: {
                        profile: true,
                    },
                },
                parentStudentLinks: {
                    include: {
                        student: {
                            include: {
                                account: {
                                    include: {
                                        profile: true,
                                    },
                                },
                                classGroup: true,
                            },
                        },
                    },
                },
            },
        });

        if (!parent) {
            throw new NotFoundException('Parent not found');
        }

        // Lấy danh sách students của parent
        const students = parent.parentStudentLinks.map(link => ({
            studentId: link.student.student_id.toString(),
            studentCode: link.student.student_code,
            studentName: link.student.account?.profile?.full_name || 'Unknown',
            className: link.student.classGroup?.class_code || 'Unknown',
        }));

        return {
            parentInfo: {
                parentId: parent.parent_id.toString(),
                parentName: parent.account?.profile?.full_name || 'Unknown',
                relationshipType: parent.relationship_type || 'Unknown',
                students,
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
     * Lấy danh sách parents của teacher (parents của students mình advise)
     */
    async getTeacherParents(instructorId: number) {
        // Get students của teacher
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
                parentStudentLinks: {
                    include: {
                        parent: {
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
                account: {
                    include: {
                        profile: true,
                    },
                },
                classGroup: true,
            },
        });

        // Collect unique parents
        const parentsMap = new Map();
        
        for (const student of students) {
            if (student.parentStudentLinks) {
                for (const link of student.parentStudentLinks) {
                    if (link.parent) {
                        const parentId = link.parent.parent_id.toString();
                        if (!parentsMap.has(parentId)) {
                            parentsMap.set(parentId, {
                                id: parentId,
                                name: link.parent.account?.profile?.full_name || 'Unknown',
                                avatar: link.parent.account?.profile?.avatar_url || undefined,
                                relationshipType: link.parent.relationship_type,
                                students: [],
                            });
                        }
                        // Add student info to parent
                        parentsMap.get(parentId).students.push({
                            studentId: student.student_id.toString(),
                            studentName: student.account?.profile?.full_name || 'Unknown',
                            studentCode: student.student_code,
                            className: student.classGroup?.class_code || 'Unknown',
                        });
                    }
                }
            }
        }

        return Array.from(parentsMap.values());
    }

    /**
     * Get list of classes for a teacher from PostgreSQL
     */
    async getTeacherClasses(instructorId: number) {
        // Get all students this teacher advises via their classes
        const assignments = await this.prisma.adviserAssignment.findMany({
            where: {
                instructor_id: instructorId,
                ended_date: null, // Only active assignments
            },
            include: {
                classGroup: true,
            },
        });

        // Extract unique classes and count students
        const classMap = new Map();
        for (const assignment of assignments) {
            const classGroup = assignment.classGroup;
            if (classGroup && !classMap.has(classGroup.class_id)) {
                // Count students in this class
                const studentCount = await this.prisma.student.count({
                    where: {
                        class_id: classGroup.class_id,
                        status: 'active',
                    },
                });

                classMap.set(classGroup.class_id, {
                    id: classGroup.class_id,
                    code: classGroup.class_code,
                    name: classGroup.class_code, // Using code as name since class_name might not exist
                    studentCount,
                });
            }
        }

        return Array.from(classMap.values());
    }

    /**
     * Send bulk message to multiple students/parents
     */
    async sendBulkMessage(params: {
        instructorId: number;
        recipientType: 'students' | 'parents' | 'both';
        classIds?: number[];
        riskLevels?: string[];
        message: string;
        title?: string;
    }) {
        const { instructorId, recipientType, classIds, message, title } = params;

        // Get teacher info
        const instructor = await this.prisma.instructor.findUnique({
            where: { instructor_id: instructorId },
            include: {
                account: {
                    include: { profile: true },
                },
            },
        });

        if (!instructor || !instructor.account.profile) {
            throw new NotFoundException('Instructor not found');
        }

        const teacherId = instructorId.toString();
        const teacherName = instructor.account.profile.full_name;

        // Get students based on filters (via AdviserAssignment)
        const whereClause: any = {
            instructor_id: instructorId,
            ended_date: null,
        };

        if (classIds && classIds.length > 0) {
            whereClause.class_id = { in: classIds };
        }

        const assignments = await this.prisma.adviserAssignment.findMany({
            where: whereClause,
            include: {
                classGroup: {
                    include: {
                        students: {
                            where: {
                                status: 'active',
                            },
                            include: {
                                account: {
                                    include: { profile: true },
                                },
                                classGroup: true,
                                parentStudentLinks: {
                                    include: {
                                        parent: {
                                            include: {
                                                account: {
                                                    include: { profile: true },
                                                },
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

        // Flatten students from all classes
        const students = assignments.flatMap((a) => a.classGroup.students);

        const results = {
            sentToStudents: 0,
            sentToParents: 0,
            failed: 0,
            conversations: [] as any[],
        };

        // Send to students
        if (recipientType === 'students' || recipientType === 'both') {
            for (const student of students) {
                try {
                    if (!student.account.profile) continue;

                    const studentId = student.student_id.toString();

                    // Create or get conversation
                    const conversation = await this.findOrCreateConversation(
                        teacherId,
                        studentId,
                        'teacher-student',
                    );

                    // Send message
                    const fullMessage = title ? `**${title}**\n\n${message}` : message;
                    await this.sendMessage(
                        (conversation as any)._id.toString(),
                        teacherId,
                        'teacher',
                        fullMessage,
                    );

                    results.sentToStudents++;
                    results.conversations.push({
                        conversationId: (conversation as any)._id.toString(),
                        recipientName: student.account.profile.full_name,
                        recipientType: 'student',
                    });
                } catch (error) {
                    console.error(`Failed to send to student ${student.student_id}:`, error);
                    results.failed++;
                }
            }
        }

        // Send to parents
        if (recipientType === 'parents' || recipientType === 'both') {
            const parentMap = new Map();
            students.forEach((student) => {
                student.parentStudentLinks.forEach((link) => {
                    const parent = link.parent;
                    if (parent && !parentMap.has(parent.parent_id)) {
                        parentMap.set(parent.parent_id, {
                            parent,
                            student,
                        });
                    }
                });
            });

            for (const [parentId, data] of parentMap.entries()) {
                try {
                    const { parent } = data;
                    if (!parent.account.profile) continue;

                    const parentIdStr = parentId.toString();

                    // Create or get conversation
                    const conversation = await this.findOrCreateConversation(
                        teacherId,
                        parentIdStr,
                        'teacher-parent',
                    );

                    // Send message
                    const fullMessage = title ? `**${title}**\n\n${message}` : message;
                    await this.sendMessage(
                        (conversation as any)._id.toString(),
                        teacherId,
                        'teacher',
                        fullMessage,
                    );

                    results.sentToParents++;
                    results.conversations.push({
                        conversationId: (conversation as any)._id.toString(),
                        recipientName: parent.account.profile.full_name,
                        recipientType: 'parent',
                    });
                } catch (error) {
                    console.error(`Failed to send to parent ${parentId}:`, error);
                    results.failed++;
                }
            }
        }

        return {
            success: true,
            message: `Sent ${results.sentToStudents} to students, ${results.sentToParents} to parents`,
            ...results,
        };
    }

    /**
     * Send quick message with template
     */
    async sendQuickMessage(params: {
        instructorId: number;
        recipientIds: string[];
        recipientType: 'student' | 'parent';
        template: 'reminder' | 'encouragement' | 'concern' | 'custom';
        customMessage?: string;
        subject?: string;
    }) {
        const templates = {
            reminder: 'Nhắc nhở: Bạn cần hoàn thành bài tập và tham gia đầy đủ các buổi học.',
            encouragement: 'Cố lên! Thầy/Cô tin tưởng vào khả năng của em. Hãy tiếp tục nỗ lực!',
            concern: 'Thầy/Cô nhận thấy em đang gặp khó khăn. Hãy liên hệ để được hỗ trợ.',
        };

        const messageContent = params.template === 'custom'
            ? params.customMessage || ''
            : templates[params.template];

        const instructor = await this.prisma.instructor.findUnique({
            where: { instructor_id: params.instructorId },
            include: {
                account: {
                    include: { profile: true },
                },
            },
        });

        if (!instructor || !instructor.account.profile) {
            throw new NotFoundException('Instructor not found');
        }

        const teacherId = params.instructorId.toString();

        const results = {
            sent: 0,
            failed: 0,
            conversations: [] as any[],
        };

        for (const recipientId of params.recipientIds) {
            try {
                const conversationType = params.recipientType === 'student' 
                    ? 'teacher-student' as const
                    : 'teacher-parent' as const;

                // Create or get conversation
                const conversation = await this.findOrCreateConversation(
                    teacherId,
                    recipientId,
                    conversationType,
                );

                // Get recipient name from conversation
                const recipient = conversation.participants.find(p => p.userId === recipientId);
                const recipientName = recipient?.userName || 'Unknown';

                // Send message
                const fullMessage = params.subject 
                    ? `**${params.subject}**\n\n${messageContent}` 
                    : messageContent;

                await this.sendMessage(
                    (conversation as any)._id.toString(),
                    teacherId,
                    'teacher',
                    fullMessage,
                );

                results.sent++;
                results.conversations.push({
                    conversationId: (conversation as any)._id.toString(),
                    recipientName,
                    recipientType: params.recipientType,
                });
            } catch (error) {
                console.error(`Failed to send to ${recipientId}:`, error);
                results.failed++;
            }
        }

        return {
            success: true,
            message: `Sent ${results.sent} messages`,
            ...results,
        };
    }

    /**
     * Send urgent alert
     */
    async sendUrgentAlert(params: {
        instructorId: number;
        studentIds: string[];
        alertType: 'academic' | 'attendance' | 'behavior' | 'other';
        severity: 'high' | 'medium';
        message: string;
        requireConfirmation: boolean;
        notifyParents: boolean;
    }) {
        const instructor = await this.prisma.instructor.findUnique({
            where: { instructor_id: params.instructorId },
            include: {
                account: {
                    include: { profile: true },
                },
            },
        });

        if (!instructor || !instructor.account.profile) {
            throw new NotFoundException('Instructor not found');
        }

        const teacherId = params.instructorId.toString();

        const alertTypeLabels = {
            academic: '🎓 Cảnh báo học tập',
            attendance: '📅 Cảnh báo điểm danh',
            behavior: '⚠️ Cảnh báo hành vi',
            other: '❗ Cảnh báo',
        };

        const severityPrefix = params.severity === 'high' ? '🚨 KHẨN CẤP - ' : '⚠️ ';

        const results = {
            sentToStudents: 0,
            sentToParents: 0,
            failed: 0,
            conversations: [] as any[],
        };

        for (const studentId of params.studentIds) {
            try {
                const student = await this.prisma.student.findUnique({
                    where: { student_id: parseInt(studentId) },
                    include: {
                        account: {
                            include: { profile: true },
                        },
                        classGroup: true,
                        parentStudentLinks: {
                            include: {
                                parent: {
                                    include: {
                                        account: {
                                            include: { profile: true },
                                        },
                                    },
                                },
                            },
                        },
                    },
                });

                if (!student || !student.account.profile) {
                    console.error(`Student ${studentId} not found`);
                    results.failed++;
                    continue;
                }

                // Send to student
                const studentConversation = await this.findOrCreateConversation(
                    teacherId,
                    studentId,
                    'teacher-student',
                );

                const studentMessage = `${severityPrefix}${alertTypeLabels[params.alertType]}\n\n${params.message}${params.requireConfirmation ? '\n\n⚠️ Vui lòng xác nhận đã đọc tin nhắn này.' : ''}`;

                await this.sendMessage(
                    (studentConversation as any)._id.toString(),
                    teacherId,
                    'teacher',
                    studentMessage,
                );

                results.sentToStudents++;
                results.conversations.push({
                    conversationId: (studentConversation as any)._id.toString(),
                    recipientName: student.account.profile.full_name,
                    recipientType: 'student',
                });

                // Send to parents if requested
                if (params.notifyParents && student.parentStudentLinks) {
                    for (const link of student.parentStudentLinks) {
                        try {
                            const parent = link.parent;
                            if (!parent || !parent.account.profile) continue;

                            const parentConversation = await this.findOrCreateConversation(
                                teacherId,
                                parent.parent_id.toString(),
                                'teacher-parent',
                            );

                            const parentMessage = `${severityPrefix}${alertTypeLabels[params.alertType]} - Con của quý phụ huynh: ${student.account.profile.full_name}\n\n${params.message}`;

                            await this.sendMessage(
                                (parentConversation as any)._id.toString(),
                                teacherId,
                                'teacher',
                                parentMessage,
                            );

                            results.sentToParents++;
                            results.conversations.push({
                                conversationId: (parentConversation as any)._id.toString(),
                                recipientName: parent.account.profile.full_name,
                                recipientType: 'parent',
                            });
                        } catch (error) {
                            console.error(`Failed to send to parent ${link.parent?.parent_id}:`, error);
                            results.failed++;
                        }
                    }
                }
            } catch (error) {
                console.error(`Failed to send urgent alert to student ${studentId}:`, error);
                results.failed++;
            }
        }

        return {
            success: true,
            message: `Sent ${results.sentToStudents} alerts to students, ${results.sentToParents} to parents`,
            ...results,
        };
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
     * Lấy danh sách teachers của parent (teachers của students con)
     */
    async getParentTeachers(parentId: number) {
        // Lấy students của parent qua ParentStudentLink
        const parentLinks = await this.prisma.parentStudentLink.findMany({
            where: {
                parent_id: parentId,
            },
            include: {
                student: {
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
                        account: {
                            include: {
                                profile: true,
                            },
                        },
                    },
                },
            },
        });

        // Tập hợp tất cả teachers (unique)
        const teachersMap = new Map();
        
        for (const link of parentLinks) {
            if (link.student?.classGroup?.adviserAssignments) {
                for (const assignment of link.student.classGroup.adviserAssignments) {
                    const teacherId = assignment.instructor.instructor_id.toString();
                    if (!teachersMap.has(teacherId)) {
                        teachersMap.set(teacherId, {
                            id: teacherId,
                            name: assignment.instructor.account?.profile?.full_name || 'Unknown',
                            avatar: assignment.instructor.account?.profile?.avatar_url || undefined,
                            students: [],
                        });
                    }
                    // Thêm student vào danh sách của teacher
                    teachersMap.get(teacherId).students.push({
                        studentId: link.student.student_id.toString(),
                        studentName: link.student.account?.profile?.full_name || 'Unknown',
                        studentCode: link.student.student_code,
                        className: link.student.classGroup?.class_code || 'Unknown',
                    });
                }
            }
        }

        return Array.from(teachersMap.values());
    }

    /**
     * Tìm hoặc tạo cuộc hội thoại giữa teacher và student/parent
     */
    async findOrCreateConversation(
        teacherId: string,
        participantId: string, // studentId or parentId
        conversationType: 'teacher-student' | 'teacher-parent',
    ): Promise<Conversation> {
        // Lấy thông tin từ PostgreSQL
        const teacherIdNum = parseInt(teacherId);
        const participantIdNum = parseInt(participantId);

        const teacherInfo = await this.getTeacherInfo(teacherIdNum);
        
        // Lấy metadata dựa trên loại conversation
        let metadata;
        let participantUserType: 'student' | 'parent';
        let participantName: string;
        
        if (conversationType === 'teacher-student') {
            metadata = await this.getStudentMetadata(participantIdNum);
            participantUserType = 'student';
            participantName = metadata.studentInfo.studentName;
        } else {
            metadata = await this.getParentMetadata(participantIdNum);
            participantUserType = 'parent';
            participantName = metadata.parentInfo.parentName;
        }

        // Tìm cuộc hội thoại đã tồn tại trong MongoDB
        let conversation = await this.conversationModel.findOne({
            conversationType,
            participants: {
                $all: [
                    { $elemMatch: { userId: teacherId, isActive: true } },
                    { $elemMatch: { userId: participantId, isActive: true } }
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
                        userId: participantId,
                        userType: participantUserType,
                        userName: participantName,
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

