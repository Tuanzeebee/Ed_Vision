export interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  category: 'low_grades' | 'absence' | 'performance' | 'general';
  usageCount: number;
}

export interface Message {
  id: string;
  title: string;
  content: string;
  sentTo: {
    studentId: string;
    studentCode: string;
    studentName: string;
    recipientType: 'student' | 'parent' | 'both';
  }[];
  sentAt: Date;
  status: 'sent' | 'delivered' | 'read';
}

export interface MessageHistory {
  messages: Message[];
  total: number;
}

export interface SendMessageResponse {
  success: boolean;
  message: string;
  sentCount: number;
  failedCount: number;
}
