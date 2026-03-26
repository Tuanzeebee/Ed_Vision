import { Schema, Document } from 'mongoose';

/**
 * Message Interface - Tin nhắn đơn lẻ
 */
export interface Message extends Document {
  conversationId: string; // ID của cuộc hội thoại
  senderId: string; // ID người gửi (instructor_id hoặc student_id)
  senderType: 'teacher' | 'student' | 'parent'; // Loại người gửi
  senderName: string; // Tên người gửi
  senderAvatar?: string; // Avatar người gửi
  content: string; // Nội dung tin nhắn
  messageType: 'text' | 'file' | 'image' | 'system'; // Loại tin nhắn
  attachments?: MessageAttachment[]; // File đính kèm
  isRead: boolean; // Đã đọc chưa
  readAt?: Date; // Thời gian đọc
  isEdited: boolean; // Đã chỉnh sửa chưa
  editedAt?: Date; // Thời gian chỉnh sửa
  isDeleted: boolean; // Đã xóa chưa
  deletedAt?: Date; // Thời gian xóa
  metadata?: Record<string, any>; // Metadata bổ sung
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Attachment Interface - File đính kèm
 */
export interface MessageAttachment {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
}

/**
 * Conversation Interface - Cuộc hội thoại
 */
export interface Conversation extends Document {
  conversationType: 'teacher-student' | 'teacher-parent' | 'group'; // Loại cuộc hội thoại
  participants: ConversationParticipant[]; // Danh sách người tham gia
  lastMessage?: {
    content: string;
    senderId: string;
    senderName: string;
    timestamp: Date;
  };
  unreadCount: Record<string, number>; // Số tin nhắn chưa đọc cho mỗi người
  isPinned: boolean; // Ghim cuộc hội thoại
  isMuted: boolean; // Tắt thông báo
  mutedBy: string[]; // Danh sách người tắt thông báo
  isArchived: boolean; // Lưu trữ
  archivedBy: string[]; // Danh sách người lưu trữ
  metadata?: {
    studentInfo?: {
      studentId: string;
      studentCode: string;
      studentName: string;
      className: string;
      riskLevel?: 'high' | 'medium' | 'low';
    };
    parentInfo?: {
      parentId: string;
      parentName: string;
      relationship: string;
    };
    groupInfo?: {
      groupName: string;
      groupType: string;
      memberCount: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Participant Interface - Người tham gia
 */
export interface ConversationParticipant {
  userId: string; // ID người dùng
  userType: 'teacher' | 'student' | 'parent'; // Loại người dùng
  userName: string; // Tên người dùng
  userAvatar?: string; // Avatar
  role?: 'admin' | 'member'; // Vai trò trong nhóm
  joinedAt: Date; // Thời gian tham gia
  leftAt?: Date; // Thời gian rời khỏi
  isActive: boolean; // Còn hoạt động không
}

/**
 * Message Schema
 */
export const MessageSchema = new Schema<Message>(
  {
    conversationId: { type: String, required: true, index: true },
    senderId: { type: String, required: true, index: true },
    senderType: {
      type: String,
      enum: ['teacher', 'student', 'parent'],
      required: true,
    },
    senderName: { type: String, required: true },
    senderAvatar: { type: String },
    content: { type: String, required: true },
    messageType: {
      type: String,
      enum: ['text', 'file', 'image', 'system'],
      default: 'text',
    },
    attachments: [
      {
        fileName: { type: String, required: true },
        fileUrl: { type: String, required: true },
        fileType: { type: String, required: true },
        fileSize: { type: Number, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    collection: 'messages',
  },
);

/**
 * Conversation Schema
 */
export const ConversationSchema = new Schema<Conversation>(
  {
    conversationType: {
      type: String,
      enum: ['teacher-student', 'teacher-parent', 'group'],
      required: true,
      index: true,
    },
    participants: [
      {
        userId: { type: String, required: true },
        userType: {
          type: String,
          enum: ['teacher', 'student', 'parent'],
          required: true,
        },
        userName: { type: String, required: true },
        userAvatar: { type: String },
        role: { type: String, enum: ['admin', 'member'], default: 'member' },
        joinedAt: { type: Date, default: Date.now },
        leftAt: { type: Date },
        isActive: { type: Boolean, default: true },
      },
    ],
    lastMessage: {
      content: { type: String },
      senderId: { type: String },
      senderName: { type: String },
      timestamp: { type: Date },
    },
    unreadCount: { type: Schema.Types.Mixed, default: {} },
    isPinned: { type: Boolean, default: false },
    isMuted: { type: Boolean, default: false },
    mutedBy: [{ type: String }],
    isArchived: { type: Boolean, default: false },
    archivedBy: [{ type: String }],
    metadata: {
      studentInfo: {
        studentId: { type: String },
        studentCode: { type: String },
        studentName: { type: String },
        className: { type: String },
        riskLevel: { type: String, enum: ['high', 'medium', 'low'] },
      },
      parentInfo: {
        parentId: { type: String },
        parentName: { type: String },
        relationship: { type: String },
      },
      groupInfo: {
        groupName: { type: String },
        groupType: { type: String },
        memberCount: { type: Number },
      },
    },
  },
  {
    timestamps: true,
    collection: 'conversations',
  },
);

// Indexes for Messages
MessageSchema.index({ conversationId: 1, createdAt: -1 }); // Lấy tin nhắn theo conversation
MessageSchema.index({ senderId: 1, createdAt: -1 }); // Lấy tin nhắn theo người gửi
MessageSchema.index({ isRead: 1, conversationId: 1 }); // Đếm tin nhắn chưa đọc

// Indexes for Conversations
ConversationSchema.index({ 'participants.userId': 1 }); // Tìm conversation theo user
ConversationSchema.index({ conversationType: 1, 'lastMessage.timestamp': -1 }); // Sắp xếp conversations
ConversationSchema.index({ 'metadata.studentInfo.studentId': 1 }); // Tìm theo student
ConversationSchema.index({ isPinned: -1, 'lastMessage.timestamp': -1 }); // Conversations ghim lên đầu
