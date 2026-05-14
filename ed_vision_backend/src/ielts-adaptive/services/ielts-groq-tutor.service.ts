import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

import { IeltsChatGroqDto } from '../dto/ielts-adaptive.dto';

export interface IeltsChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class IeltsGroqTutorService {
  constructor(private readonly prisma: PrismaService) {}

  async chatIeltsGroqTutor(dto: IeltsChatGroqDto) {
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY is missing in environment variables');
    }

    const skillTone = this.resolveSkillTone(dto.skill);
    const bandContext = dto.band_target ? `Mục tiêu của học sinh là Band ${dto.band_target}. Hãy đưa ra lời khuyên phù hợp với trình độ này.` : '';

    const sysPrompt = `ROLE:
Bạn là một chuyên gia IELTS Tutor thông minh, tận tâm và chuyên nghiệp. Bạn đang hỗ trợ học sinh học tập trên hệ thống Ed_Vision.

STRICT SCOPE — Chỉ trả lời các chủ đề sau:
✅ IELTS 4 kỹ năng: Listening, Reading, Writing, Speaking (tips, chiến lược làm bài, phân tích band descriptor).
✅ Vocabulary: giải thích nghĩa, ví dụ, collocations, word family, synonym/antonym.
✅ Grammar: cấu trúc ngữ pháp, ví dụ minh họa, các lỗi thường gặp trong IELTS.
✅ Pronunciation: hỗ trợ phát âm liên quan đến Speaking/Listening.

LƯU Ý QUAN TRỌNG:
- Vẫn trả lời các câu hỏi tính toán đơn giản hoặc chào hỏi xã giao.
- Nếu người dùng hỏi về các chủ đề ngoài Tiếng Anh / IELTS (ví dụ: nấu ăn, code, tâm sự đời tư, kiến thức phổ thông khác...), hãy phản hồi chính xác câu sau: "Mình chỉ hỗ trợ liên quan đến tiếng anh thôi nhé! 😊"
- Tự động nhận diện ngôn ngữ: Nếu học sinh nhắn tiếng Việt, trả lời bằng tiếng Việt. Nếu nhắn tiếng Anh, trả lời bằng tiếng Anh.

CONTEXT:
Kỹ năng đang luyện tập: ${dto.skill} (Tone: ${skillTone})
Ngữ cảnh/Đoạn văn học sinh đang xem: ${dto.context_text}
${bandContext}

INSTRUCTIONS:
- Giải thích rõ ràng, súc tích, đi thẳng vào vấn đề.
- Tone giọng: ${dto.skill === 'writing' ? 'Học thuật, trang trọng' : 'Thân thiện, khích lệ'}.
- Không sử dụng markdown quá phức tạp (tránh dùng nhiều dấu sao * hoặc tag đậm nhạt).
- Nếu học sinh có vẻ chưa hiểu, hãy lấy ví dụ ngắn gọn.`;

    const messages: any[] = [
      { role: 'system', content: sysPrompt },
    ];

    if (dto.chat_history && dto.chat_history.length > 0) {
      const recentHistory = dto.chat_history.slice(-6).map(m => ({
        role: m.role,
        content: m.content,
      }));
      messages.push(...recentHistory);
    }

    messages.push({ role: 'user', content: dto.user_message });

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages,
          temperature: 0.4,
          max_tokens: 800,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Groq API error: ${res.status} - ${errText}`);
      }

      const data = (await res.json()) as any;
      return {
        answer: data.choices?.[0]?.message?.content || '',
      };
    } catch (error) {
      console.error(`IELTS Groq Chat error: ${error}`);
      throw new BadRequestException('Lỗi kết nối đến trợ lý AI IELTS. Vui lòng thử lại sau.');
    }
  }

  private resolveSkillTone(skill: string): string {
    switch (skill) {
      case 'writing':
        return 'Academic, formal, precise';
      case 'speaking':
        return 'Friendly, encouraging, conversational';
      default:
        return 'Clear, educational, helpful';
    }
  }
}
