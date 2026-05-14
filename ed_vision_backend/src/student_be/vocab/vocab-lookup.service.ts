import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { LookupWordDto, SaveFromReadingDto } from './dto/vocab.dto';

@Injectable()
export class VocabLookupService {
  private readonly logger = new Logger(VocabLookupService.name);
  private readonly GROQ_API_URL =
    'https://api.groq.com/openai/v1/chat/completions';
  private readonly GROQ_MODEL = 'llama-3.1-8b-instant';

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async lookupWord(enrollmentId: number, dto: LookupWordDto) {
    const word = dto.word.trim().toLowerCase();

    // 1. Kiểm tra trong DB (VocabWord)
    const existingWord = await this.prisma.vocabWord.findFirst({
      where: { word: { equals: word, mode: 'insensitive' } },
      include: {
        topic: true,
        definitions: { orderBy: { sort_order: 'asc' } },
      },
    });

    if (existingWord) {
      // Đã có từ này trong database. Kiểm tra xem user đã thêm vào kho chưa.
      const progress = await this.prisma.userVocabProgress.findUnique({
        where: {
          enrollment_id_word_id: {
            enrollment_id: enrollmentId,
            word_id: existingWord.id,
          },
        },
      });
      const isPrivateHighlight = existingWord.source === 'user_highlight';

      if (!isPrivateHighlight || progress) {
        return {
          status: 'exists',
          wordId: existingWord.id,
          word: existingWord.word,
          topicId: existingWord.topic_id,
          topicSlug: existingWord.topic.slug,
          topicTitleVI: existingWord.topic.title_vi,
          alreadyInBank: !!progress,
          definitions: existingWord.definitions.map((d) => ({
            pos: d.pos,
            meaning: d.meaning,
            example_en: d.example_en,
            example_vi: d.example_vi,
          })),
        };
      }
    }

    // 2. Chưa có trong DB -> Kiểm tra Redis Cache
    const cacheKey = `vocab:lookup:${enrollmentId}:${word}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) {
      return { status: 'new', word, ...cached };
    }

    // 3. Gọi AI (Groq) để tra từ
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    const contextStr = dto.context ? `\n"${dto.context}"` : '';
    const prompt = `You are a TOEIC/IELTS vocabulary assistant. Analyze the word "${word}" in this context:${contextStr}

  Classify:
  - level: basic | intermediate | advanced (based on TOEIC/IELTS usage difficulty and typical learner exposure)
  - freq: 1 (low) | 2 (medium) | 3 (high) based on how often the word appears in TOEIC/IELTS-like materials.

Return ONLY valid JSON (no markdown, no explanation):
{
  "definitions": [
    {
      "pos": "noun|verb|adjective|adverb|preposition",
      "meaning": "<Vietnamese meaning, concise>",
      "example_en": "<natural English example sentence>",
      "example_vi": "<Vietnamese translation of example>"
    }
  ],
  "topic_slug": "<one of: business_english|office_environment|finance_accounting|human_resources|marketing_sales|travel_transportation|health_medical|technology|food_dining|general>",
  "level": "<basic|intermediate|advanced>",
  "freq": <1|2|3>
}`;

    try {
      const res = await fetch(this.GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.GROQ_MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          response_format: { type: 'json_object' },
        }),
      });

      if (!res.ok) {
        throw new Error(`Groq API Error: ${res.statusText}`);
      }

      const data = (await res.json()) as any;
      const rawContent = data.choices[0]?.message?.content;

      if (!rawContent) {
        throw new Error('Empty response from Groq');
      }

      const parsed = JSON.parse(rawContent);

      // Lấy title tiếng Việt của topic (nếu có map sẵn)
      const topicMap: Record<string, string> = {
        business_english: 'Tiếng Anh Thương mại',
        office_environment: 'Môi trường Văn phòng',
        finance_accounting: 'Tài chính - Kế toán',
        human_resources: 'Nhân sự',
        marketing_sales: 'Marketing - Bán hàng',
        travel_transportation: 'Du lịch - Vận tải',
        health_medical: 'Y tế - Sức khỏe',
        technology: 'Công nghệ',
        food_dining: 'Ẩm thực - Nhà hàng',
        general: 'Từ vựng chung',
      };

      const result = {
        definitions: parsed.definitions || [],
        suggestedTopicSlug: parsed.topic_slug || 'general',
        suggestedTopicTitleVI: topicMap[parsed.topic_slug] || 'Từ vựng chung',
        level: parsed.level || 'intermediate',
        freq: parsed.freq || 2,
      };

      // 4. Lưu Cache (7 ngày)
      await this.redis.setJson(cacheKey, result, 7 * 24 * 60 * 60);

      return {
        status: 'new',
        word,
        ...result,
      };
    } catch (error) {
      this.logger.error(`Lookup failed for word "${word}":`, error);
      throw error;
    }
  }

  async saveFromReading(enrollmentId: number, dto: SaveFromReadingDto) {
    const word = dto.word.trim().toLowerCase();

    // Tìm hoặc tạo Topic
    let topic = await this.prisma.vocabTopic.findUnique({
      where: { slug: dto.topic_slug },
    });

    if (!topic) {
      // Nếu không tìm thấy, gán vào một topic mặc định hoặc tạo mới
      topic = await this.prisma.vocabTopic.upsert({
        where: { slug: 'general' },
        create: {
          slug: 'general',
          title_vi: 'Từ vựng chung',
          title_en: 'General',
          emoji: '📚',
          cert_type: 'toeic',
        },
        update: {},
      });
    }

    // Upsert Word
    const savedWord = await this.prisma.vocabWord.upsert({
      where: {
        topic_id_word: {
          topic_id: topic.id,
          word: word,
        },
      },
      create: {
        topic_id: topic.id,
        word: word,
        level: 'intermediate',
        freq: 2, // Mặc định freq
        source: 'user_highlight',
      },
      update: {},
    });

    // Xóa definitions cũ nếu có (để đơn giản hóa)
    await this.prisma.vocabDefinition.deleteMany({
      where: { word_id: savedWord.id },
    });

    // Thêm definitions mới
    if (dto.definitions && dto.definitions.length > 0) {
      await this.prisma.vocabDefinition.createMany({
        data: dto.definitions.map((d, index) => ({
          word_id: savedWord.id,
          pos: d.pos,
          meaning: d.meaning,
          example_en: d.example_en,
          example_vi: d.example_vi,
          sort_order: index,
        })),
      });
    }

    // Upsert UserVocabProgress
    await this.prisma.userVocabProgress.upsert({
      where: {
        enrollment_id_word_id: {
          enrollment_id: enrollmentId,
          word_id: savedWord.id,
        },
      },
      create: {
        enrollment_id: enrollmentId,
        word_id: savedWord.id,
        is_known: false,
      },
      update: {}, // Nếu đã có, giữ nguyên trạng thái
    });

    return {
      wordId: savedWord.id,
      added: true,
      message: `Đã thêm "${word}" vào kho từ vựng ${topic.title_vi} ${topic.emoji}`,
    };
  }
}
