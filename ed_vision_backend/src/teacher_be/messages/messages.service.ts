import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
    SendMessageDto,
    SendTemplateMessageDto,
    CreateTemplateDto,
} from './dto/message.dto';
import {
    MessageTemplate,
    MessageHistory,
    SendMessageResponse,
} from './models/message.type';

@Injectable()
export class MessagesService {
    constructor(private prisma: PrismaService) { }

    /**
     * Gửi tin nhắn cho sinh viên/phụ huynh
     */
    async sendMessage(
        instructorId: number,
        dto: SendMessageDto,
    ): Promise<SendMessageResponse> {
        try {
            // Verify students belong to instructor's classes
            const students = await this.prisma.student.findMany({
                where: {
                    student_id: { in: dto.studentIds.map((id) => parseInt(id)) },
                },
                include: {
                    classGroup: {
                        include: {
                            adviserAssignments: {
                                where: {
                                    instructor_id: instructorId,
                                    ended_date: null,
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
            });

            let sentCount = 0;
            let failedCount = 0;

            for (const student of students) {
                if (student.classGroup?.adviserAssignments && student.classGroup.adviserAssignments.length > 0) {
                    // TODO: Integrate with actual messaging system
                    // For now, just log the message
                    console.log(`Sending message to ${student.student_code}:`, {
                        title: dto.title,
                        content: dto.content,
                        recipientType: dto.recipientType || 'student',
                    });
                    sentCount++;
                } else {
                    failedCount++;
                }
            } return {
                success: true,
                message: `Đã gửi ${sentCount} tin nhắn`,
                sentCount,
                failedCount,
            };
        } catch (error) {
            return {
                success: false,
                message: 'Lỗi khi gửi tin nhắn',
                sentCount: 0,
                failedCount: dto.studentIds.length,
            };
        }
    }

    /**
     * Gửi tin nhắn bằng template
     */
    async sendTemplateMessage(
        instructorId: number,
        dto: SendTemplateMessageDto,
    ): Promise<SendMessageResponse> {
        const template = await this.getTemplateById(dto.templateId);

        if (!template) {
            return {
                success: false,
                message: 'Template không tồn tại',
                sentCount: 0,
                failedCount: dto.studentIds.length,
            };
        }

        const content = dto.customContent || template.content;

        return this.sendMessage(instructorId, {
            studentIds: dto.studentIds,
            title: template.title,
            content,
            recipientType: 'both',
        });
    }

    /**
     * Lấy danh sách templates
     */
    async getTemplates(): Promise<MessageTemplate[]> {
        // Mock data - trong thực tế sẽ lưu trong DB
        return [
            {
                id: '1',
                title: 'Nhắc nhở về kết quả học tập',
                content:
                    'Em yêu quý,\n\nGiảng viên chủ nhiệm nhận thấy kết quả học tập của em trong thời gian gần đây chưa được tốt. Em hãy liên hệ với giảng viên để được tư vấn và hỗ trợ.\n\nTrân trọng!',
                category: 'low_grades',
                usageCount: 15,
            },
            {
                id: '2',
                title: 'Thông báo về tình trạng vắng mặt',
                content:
                    'Phụ huynh thân mến,\n\nChúng tôi nhận thấy con em có số buổi vắng mặt không phép khá nhiều. Kính mong phụ huynh quan tâm và nhắc nhở con em về việc đi học đầy đủ.\n\nTrân trọng!',
                category: 'absence',
                usageCount: 8,
            },
            {
                id: '3',
                title: 'Khen ngợi tiến bộ học tập',
                content:
                    'Em yêu quý,\n\nGiảng viên rất vui khi thấy em có sự tiến bộ rõ rệt trong học tập. Hãy tiếp tục phát huy và duy trì phong độ này nhé!\n\nChúc em luôn thành công!',
                category: 'performance',
                usageCount: 22,
            },
            {
                id: '4',
                title: 'Lời nhắc về deadline nộp bài',
                content:
                    'Em yêu quý,\n\nGiảng viên xin nhắc nhở em về deadline nộp bài tập sắp tới. Em hãy hoàn thành và nộp bài đúng hạn nhé.\n\nTrân trọng!',
                category: 'general',
                usageCount: 30,
            },
            {
                id: '5',
                title: 'Mời tham gia buổi tư vấn',
                content:
                    'Em yêu quý,\n\nGiảng viên mời em tham gia buổi tư vấn học tập để cùng trao đổi về kế hoạch học tập và định hướng nghề nghiệp.\n\nVui lòng xác nhận tham gia!\n\nTrân trọng!',
                category: 'general',
                usageCount: 12,
            },
        ];
    }

    /**
     * Lấy template theo ID
     */
    async getTemplateById(templateId: string): Promise<MessageTemplate | null> {
        const templates = await this.getTemplates();
        return templates.find((t) => t.id === templateId) || null;
    }

    /**
     * Tạo template mới
     */
    async createTemplate(dto: CreateTemplateDto): Promise<MessageTemplate> {
        // Mock - trong thực tế sẽ lưu vào DB
        return {
            id: Date.now().toString(),
            title: dto.title,
            content: dto.content,
            category: dto.category || 'general',
            usageCount: 0,
        };
    }

    /**
     * Lấy lịch sử tin nhắn
     */
    async getMessageHistory(instructorId: number): Promise<MessageHistory> {
        // Mock data - trong thực tế sẽ query từ DB
        const messages = [
            {
                id: '1',
                title: 'Nhắc nhở về kết quả học tập',
                content: 'Em yêu quý...',
                sentTo: [
                    {
                        studentId: '1',
                        studentCode: 'SV001',
                        studentName: 'Nguyễn Văn A',
                        recipientType: 'both' as const,
                    },
                ],
                sentAt: new Date('2024-01-15T10:00:00'),
                status: 'read' as const,
            },
            {
                id: '2',
                title: 'Thông báo về tình trạng vắng mặt',
                content: 'Phụ huynh thân mến...',
                sentTo: [
                    {
                        studentId: '2',
                        studentCode: 'SV002',
                        studentName: 'Trần Thị B',
                        recipientType: 'parent' as const,
                    },
                ],
                sentAt: new Date('2024-01-14T14:30:00'),
                status: 'delivered' as const,
            },
        ];

        return {
            messages,
            total: messages.length,
        };
    }

    /**
     * Lấy thống kê tin nhắn
     */
    async getMessageStats(instructorId: number) {
        return {
            totalSent: 45,
            thisWeek: 12,
            delivered: 42,
            read: 38,
            mostUsedTemplate: {
                id: '4',
                title: 'Lời nhắc về deadline nộp bài',
                usageCount: 30,
            },
        };
    }
}
