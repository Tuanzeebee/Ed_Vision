// ─── PreviewBuilder ───────────────────────────────────────────────────────────
// Tách logic buildPreview, classifyTopic, determineLevel, normalizePos từ
// VocabImportService ra thành class riêng để dễ test và tái sử dụng.
// Requirements: 10.1, 10.2, 10.3, 10.4, 10.5

import { ExtractedWord, normPos } from './regex-extractor';
import { ParsedVocabWord } from './vocab-import.service';

// ─── 10 TOEIC topics cố định ─────────────────────────────────────────────────
export const TOEIC_TOPICS = [
  { slug: 'office-work', vi: 'Văn phòng & Công việc', en: 'Office & Work', emoji: '🏢' },
  { slug: 'finance-banking', vi: 'Tài chính & Ngân hàng', en: 'Finance & Banking', emoji: '💰' },
  { slug: 'human-resources', vi: 'Nhân sự', en: 'Human Resources', emoji: '👥' },
  { slug: 'marketing-sales', vi: 'Marketing & Bán hàng', en: 'Marketing & Sales', emoji: '📢' },
  { slug: 'travel-transport', vi: 'Du lịch & Giao thông', en: 'Travel & Transport', emoji: '✈️' },
  { slug: 'healthcare', vi: 'Y tế & Sức khỏe', en: 'Healthcare', emoji: '🏥' },
  { slug: 'technology', vi: 'Công nghệ', en: 'Technology', emoji: '💻' },
  { slug: 'legal-contracts', vi: 'Pháp lý & Hợp đồng', en: 'Legal & Contracts', emoji: '⚖️' },
  { slug: 'customer-service', vi: 'Dịch vụ khách hàng', en: 'Customer Service', emoji: '🤝' },
  { slug: 'general-business', vi: 'Kinh doanh chung', en: 'General Business', emoji: '📊' },
];

// ─── Keyword topic classify (instant, no API) ─────────────────────────────────
const TOPIC_KEYWORDS: Record<string, string[]> = {
  'finance-banking': ['account', 'bank', 'finance', 'budget', 'invoice', 'payment', 'credit', 'debit', 'loan', 'interest', 'currency', 'fund', 'revenue', 'profit', 'asset', 'tax', 'deposit', 'bond', 'stock', 'invest'],
  'office-work': ['office', 'document', 'report', 'meeting', 'schedule', 'deadline', 'project', 'email', 'memo', 'agenda', 'policy', 'department', 'staff', 'workload', 'assignment', 'presentation', 'proposal'],
  'human-resources': ['recruit', 'hire', 'interview', 'resume', 'candidate', 'position', 'salary', 'wage', 'benefit', 'pension', 'overtime', 'bonus', 'promotion', 'performance', 'appraisal', 'training', 'personnel'],
  'marketing-sales': ['market', 'advertise', 'brand', 'campaign', 'customer', 'client', 'product', 'price', 'discount', 'promotion', 'sale', 'target', 'segment', 'strategy', 'competitor', 'launch', 'survey', 'sponsor'],
  'travel-transport': ['flight', 'airport', 'airline', 'ticket', 'passport', 'visa', 'customs', 'luggage', 'hotel', 'reservation', 'accommodation', 'check-in', 'itinerary', 'destination', 'departure', 'arrival', 'transit'],
  'healthcare': ['health', 'medical', 'patient', 'doctor', 'hospital', 'clinic', 'treatment', 'diagnos', 'prescription', 'medicine', 'symptom', 'disease', 'surgery', 'nurse', 'pharmacy', 'therapy'],
  'technology': ['computer', 'software', 'hardware', 'internet', 'network', 'database', 'server', 'application', 'program', 'system', 'digital', 'website', 'upgrade', 'install', 'download', 'security', 'data', 'cloud'],
  'legal-contracts': ['legal', 'law', 'contract', 'agreement', 'clause', 'terms', 'condition', 'sign', 'signature', 'comply', 'regulation', 'liability', 'penalty', 'dispute', 'property', 'copyright', 'license'],
  'customer-service': ['customer', 'complaint', 'feedback', 'resolve', 'satisfy', 'support', 'assist', 'inquire', 'respond', 'refund', 'return', 'exchange', 'warranty', 'representative', 'courtesy', 'apologize'],
};

// ─── PreviewBuilder class ─────────────────────────────────────────────────────

export class PreviewBuilder {
  /**
   * Xây dựng danh sách ParsedVocabWord từ ExtractedWord[].
   * Thực hiện deduplication: giữ lại occurrence đầu tiên của mỗi `word`.
   * Lọc bỏ các từ có độ dài < 2 hoặc > 45 ký tự.
   */
  build(extracted: ExtractedWord[], topicId?: number): ParsedVocabWord[] {
    // Deduplication: giữ lại occurrence đầu tiên của mỗi word
    const seen = new Set<string>();
    const deduped = extracted.filter((e) => {
      if (seen.has(e.word) || e.word.length < 2 || e.word.length > 45) return false;
      seen.add(e.word);
      return true;
    });

    return deduped.map((e) => {
      const topicSlug = topicId ? 'general-business' : this.classifyTopic(e.word, e.meaning);
      const topic = this.getTopic(topicSlug);
      return {
        word: e.word,
        topic_slug: topicSlug,
        topic_vi: topic.vi,
        topic_en: topic.en,
        level: this.determineLevel(e.word),
        freq: 2,
        definitions: [{ pos: e.pos, meaning: e.meaning, example_en: '', example_vi: '' }],
      } as ParsedVocabWord;
    });
  }

  /**
   * Phân loại topic dựa trên keyword matching với 10 TOEIC topics.
   * Trả về slug của topic có nhiều keyword match nhất.
   * Fallback về 'general-business' nếu không có keyword nào khớp.
   */
  classifyTopic(word: string, meaning: string): string {
    const text = (word + ' ' + meaning).toLowerCase();
    let best = 'general-business';
    let score = 0;
    for (const [slug, kws] of Object.entries(TOPIC_KEYWORDS)) {
      const s = kws.filter((k) => text.includes(k)).length;
      if (s > score) {
        score = s;
        best = slug;
      }
    }
    return best;
  }

  /**
   * Xác định level dựa trên độ dài từ:
   * - ≤6 chars  → "Cơ bản"
   * - ≤11 chars → "Trung bình"
   * - >11 chars → "Nâng cao"
   */
  determineLevel(word: string): string {
    if (word.length <= 6) return 'Cơ bản';
    if (word.length <= 11) return 'Trung bình';
    return 'Nâng cao';
  }

  /**
   * Chuẩn hóa part-of-speech string.
   * Delegate sang normPos từ regex-extractor.
   */
  normalizePos(raw: string): string {
    return normPos(raw);
  }

  /**
   * Lấy thông tin topic theo slug.
   * Fallback về 'general-business' (index 9) nếu không tìm thấy.
   */
  private getTopic(slug: string) {
    return TOEIC_TOPICS.find((t) => t.slug === slug) ?? TOEIC_TOPICS[9];
  }
}
