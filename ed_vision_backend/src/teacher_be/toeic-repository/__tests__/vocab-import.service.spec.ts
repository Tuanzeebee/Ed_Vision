/**
 * Unit & Backward Compatibility tests
 * Feature: vocab-import pipeline (OCR + Regex, no vision model)
 * Tasks: 9.1, 9.2
 * Requirements: 6.1, 6.2, 9.1–9.5, 14.1–14.5
 */

import * as fs from 'fs';
import * as path from 'path';
import { RegexExtractor } from '../regex-extractor';
import { PreviewBuilder } from '../preview-builder';

// ─── RegexExtractor tests ──────────────────────────────────────────────────────

describe('RegexExtractor', () => {
  let extractor: RegexExtractor;

  beforeEach(() => {
    extractor = new RegexExtractor();
  });

  it('Pattern A chuẩn: "1. abandon (v.) : từ bỏ" → [{word:"abandon", pos:"v.", meaning:"từ bỏ"}]', () => {
    const result = extractor.extract('1. abandon (v.) : từ bỏ');
    expect(result).toHaveLength(1);
    expect(result[0].word).toBe('abandon');
    expect(result[0].pos).toBe('v.');
    expect(result[0].meaning).toBe('từ bỏ');
  });

  it('Pattern B không số thứ tự: "abandon (v.) : từ bỏ" → parse được', () => {
    const result = extractor.extract('abandon (v.) : từ bỏ');
    expect(result).toHaveLength(1);
    expect(result[0].word).toBe('abandon');
  });

  it('Pattern C không pos: "1. abandon : từ bỏ" → parse được', () => {
    const result = extractor.extract('1. abandon : từ bỏ');
    expect(result).toHaveLength(1);
    expect(result[0].word).toBe('abandon');
    expect(result[0].meaning).toBe('từ bỏ');
  });

  it('Pattern E OCR colon→period: "1. abandon (v.) . từ bỏ" → parse được', () => {
    const result = extractor.extract('1. abandon (v.) . từ bỏ');
    expect(result).toHaveLength(1);
    expect(result[0].word).toBe('abandon');
    expect(result[0].meaning).toBe('từ bỏ');
  });

  it('Input rỗng → []', () => {
    expect(extractor.extract('')).toEqual([]);
  });

  it('Nhiều dòng hợp lệ → parse đúng số lượng', () => {
    const input = [
      '1. abandon (v.) : từ bỏ',
      '2. account (n.) : tài khoản',
      '3. achieve (v.) : đạt được',
      'Section header line', // không khớp pattern → bỏ qua
    ].join('\n');

    const result = extractor.extract(input);
    expect(result.map((r) => r.word)).toContain('abandon');
    expect(result.map((r) => r.word)).toContain('account');
    expect(result.map((r) => r.word)).toContain('achieve');
    expect(result.length).toBe(3);
  });

  it('Dedup: 2 dòng cùng word → chỉ giữ lần đầu', () => {
    const input = [
      '1. abandon (v.) : từ bỏ',
      '2. abandon (n.) : sự từ bỏ',
    ].join('\n');

    const result = extractor.extract(input);
    expect(result).toHaveLength(1);
    expect(result[0].pos).toBe('v.');
  });

  it('Đa cột OCR — join bằng \\n\\n → parse đúng', () => {
    const col0 = '1. abandon (v.) : từ bỏ\n2. account (n.) : tài khoản';
    const col1 = '3. achieve (v.) : đạt được\n4. acquire (v.) : có được';
    const merged = col0 + '\n\n' + col1;

    const result = extractor.extract(merged);
    expect(result.length).toBe(4);
    expect(result.map((r) => r.word)).toContain('abandon');
    expect(result.map((r) => r.word)).toContain('achieve');
  });

  it('Pattern F: OCR bỏ mất colon — "18. Accept (v) chấp thuận" → parse được', () => {
    const result = extractor.extract('18. Accept (v) chấp thuận');
    expect(result).toHaveLength(1);
    expect(result[0].word).toBe('accept');
    expect(result[0].meaning).toBe('chấp thuận');
  });

  it('Pattern G: OCR mất POS lẫn colon — "14. Abstract bản tóm tắt" → parse được', () => {
    const result = extractor.extract('14. Abstract bản tóm tắt');
    expect(result).toHaveLength(1);
    expect(result[0].word).toBe('abstract');
    expect(result[0].meaning).toBe('bản tóm tắt');
  });

  it('splitMultiEntry: OCR merge 2 entry liền nhau — tách đúng', () => {
    const input = '22. Accessible (a) : có thể tiếp cận được, tới được.23. Accommodate (v) : thích ứng';
    const result = extractor.extract(input);
    expect(result.length).toBe(2);
    expect(result.map((r) => r.word)).toContain('accessible');
    expect(result.map((r) => r.word)).toContain('accommodate');
  });

  it('mergeLines: continuation tiếng Việt bắt đầu bằng chữ hoa → vẫn merge', () => {
    const input = '19. Acceptable (adj) : có thể chấp\nNhận được';
    const result = extractor.extract(input);
    expect(result).toHaveLength(1);
    expect(result[0].word).toBe('acceptable');
    expect(result[0].meaning).toContain('chấp');
  });

  it('Full TOEIC page simulation — 52 entries → parse ≥ 50 từ', () => {
    const input = [
      'TỪ VỰNG DÀNH CHO PHẦN ĐỌC HIỂU (TOEIC)',
      '1. Abandon (v) : từ bỏ, bỏ',
      '2. Abandonment (n) : sự bỏ rơi, tình trạng ruồng bỏ',
      '3. Abeyance (n) : sự đình chỉ, hoãn lại',
      '4. Abide (v) : tôn trọng, tuân theo',
      '5. Able (adj) : có năng lực, có tư cách',
      '6. Ability (n) : khả năng',
      '7. Aboard (adv) : ở nước ngoài',
      '8. Abrogate (v) : hủy bỏ, bãi bỏ',
      '9. Abrogation (n) : sự bãi bỏ, bãi trừ',
      '10. Absence (n) : sự vắng mặt, sự thiếu',
      '11. Absent (adj) : vắng, thiếu',
      '12. Absorb (v) : nuốt, gộp, tập trung vào',
      '13. Absorption (n) : việc sát nhập, sự nhập chung công ty',
      '14. Abstract (n) : bản tóm tắt',
      '15. Abuse (v & n) : lạm dụng, sự lạm dụng',
      '16. Accede (v) : đồng ý, tán thành',
      '17. Accelerate (v) : thúc mau, giục gấp',
      '18. Accept (v) : chấp thuận',
      '19. Acceptable (adj) : có thể chấp nhận',
      '20. Acceptance (n) : sự tán thành',
      '21. Access (n) : tiếp cận',
      '22. Accessible (a) : có thể tiếp cận được, tới được',
      '23. Accommodate (v) : thích ứng, điều tiết, thích nghi',
      '24. Accommodation (n) : sự hòa giải, dàn xếp, thích nghi',
      '25. Accordingly (adv) : theo đó',
      '26. Accordance (n) : sự phù hợp, sự theo đúng',
      '27. Account (n) : bản quyết toán, kê khai',
      '28. Accumulate (v) : chống chất, tích lũy',
      '29. Accurate (adj) : đúng đắn, chính xác',
      '30. Achive (v) : đạt được',
      '31. Acquire (v) : thu được, giành được',
      '32. Active (adj) : linh lợi, chủ động',
      '33. Adapt (v) : thích hợp, thích nghi',
      '34. Additional (adj) : thêm vào, phụ vào, tăng thêm',
      '35. Adequate (adj) : thỏa đáng, tương xứng',
      '36. Adhere (v) : bám chặt vào, tôn trọng',
      '37. Adjourn (v) : dời lại, hoàn lại',
      '38. Adjust (v) : điều chỉnh, dàn xếp',
      '39. Adjustment (n) : việc điều chỉnh',
      '40. Admit (v) : thừa nhận, thú nhận',
      '41. Adopt (v) : chấp nhận, thông qua',
      '42. Advance (v) : cải tiến',
      '43. Advantage (n) : lợi thế',
      '44. Advertise (v) : quảng cáo',
      '45. Advertisement (n) : mẫu quảng cáo',
      '46. Advice (n) : hướng dẫn, giấy báo',
      '47. Advisable (adj) : thích hợp',
      '48. Advise (v) : khuyên',
      '49. Advocate (v) : biện hộ, tán thành',
      '50. Affiliate (v) : gia nhập, liên kết',
      '51. Affiliation (n) : chi nhánh',
      '52. Affirmative (adj) : khẳng định, quả quyết',
    ].join('\n');

    const result = extractor.extract(input);
    expect(result.length).toBe(52);
  });
});

// ─── PreviewBuilder tests ──────────────────────────────────────────────────────

describe('PreviewBuilder', () => {
  let builder: PreviewBuilder;

  beforeEach(() => {
    builder = new PreviewBuilder();
  });

  describe('determineLevel', () => {
    it('"hi" (length 2 ≤ 6) → "Cơ bản"', () => {
      expect(builder.determineLevel('hi')).toBe('Cơ bản');
    });

    it('"office" (length 6 ≤ 6) → "Cơ bản"', () => {
      expect(builder.determineLevel('office')).toBe('Cơ bản');
    });

    it('"abandon" (length 7 ≤ 11) → "Trung bình"', () => {
      expect(builder.determineLevel('abandon')).toBe('Trung bình');
    });

    it('"accommodation" (length 13 > 11) → "Nâng cao"', () => {
      expect(builder.determineLevel('accommodation')).toBe('Nâng cao');
    });
  });

  describe('classifyTopic', () => {
    it('"bank" + "ngân hàng" → "finance-banking"', () => {
      expect(builder.classifyTopic('bank', 'ngân hàng')).toBe('finance-banking');
    });

    it('"xyz" + "xyz" → "general-business" (fallback)', () => {
      expect(builder.classifyTopic('xyz', 'xyz')).toBe('general-business');
    });
  });

  describe('normalizePos', () => {
    it('"n" → "n."', () => {
      expect(builder.normalizePos('n')).toBe('n.');
    });

    it('"verb" → "verb." (không có trong map)', () => {
      expect(builder.normalizePos('verb')).toBe('verb.');
    });
  });

  describe('build', () => {
    it('build([]) → []', () => {
      expect(builder.build([])).toEqual([]);
    });

    it('build với 2 entries cùng word → chỉ 1 entry (dedup)', () => {
      const input = [
        { word: 'abandon', pos: 'v.', meaning: 'từ bỏ' },
        { word: 'abandon', pos: 'n.', meaning: 'sự từ bỏ' },
      ];
      const result = builder.build(input);
      expect(result).toHaveLength(1);
      expect(result[0].definitions[0].pos).toBe('v.');
      expect(result[0].definitions[0].meaning).toBe('từ bỏ');
    });
  });
});

// ─── Backward Compatibility tests ─────────────────────────────────────────────

describe('Backward Compatibility', () => {
  it('ParsedVocabWord interface có đủ fields bắt buộc', () => {
    const builder = new PreviewBuilder();
    const result = builder.build([{ word: 'abandon', pos: 'v.', meaning: 'từ bỏ' }]);
    expect(result).toHaveLength(1);
    const item = result[0];

    expect(item).toHaveProperty('word');
    expect(item).toHaveProperty('topic_slug');
    expect(item).toHaveProperty('topic_vi');
    expect(item).toHaveProperty('topic_en');
    expect(item).toHaveProperty('level');
    expect(item).toHaveProperty('freq');
    expect(item).toHaveProperty('definitions');
    expect(Array.isArray(item.definitions)).toBe(true);
  });

  it('definitions[0] có đủ fields: pos, meaning, example_en, example_vi', () => {
    const builder = new PreviewBuilder();
    const result = builder.build([{ word: 'abandon', pos: 'v.', meaning: 'từ bỏ' }]);
    const def = result[0].definitions[0];

    expect(def).toHaveProperty('pos');
    expect(def).toHaveProperty('meaning');
    expect(def).toHaveProperty('example_en');
    expect(def).toHaveProperty('example_vi');
  });

  it('extractWithRegex() hoạt động đúng (delegate sang RegexExtractor)', () => {
    const extractor = new RegexExtractor();
    const result = extractor.extract('1. abandon (v.) : từ bỏ');
    expect(result).toHaveLength(1);
    expect(result[0].word).toBe('abandon');
  });

  // ── Kiểm tra source file ────────────────────────────────────────────────────

  it('vocab-import.service.ts KHÔNG chứa @google/generative-ai (Gemini đã xóa)', () => {
    const content = fs.readFileSync(path.join(__dirname, '../vocab-import.service.ts'), 'utf8');
    expect(content).not.toContain('@google/generative-ai');
  });

  it('vocab-import.service.ts KHÔNG chứa VisionOllamaClient (vision model đã xóa)', () => {
    const content = fs.readFileSync(path.join(__dirname, '../vocab-import.service.ts'), 'utf8');
    expect(content).not.toContain('VisionOllamaClient');
  });

  it('vocab-import.service.ts KHÔNG chứa openrouter (OpenRouter đã xóa)', () => {
    const content = fs.readFileSync(path.join(__dirname, '../vocab-import.service.ts'), 'utf8');
    expect(content).not.toContain('openrouter');
  });

  it('vocab-import.service.ts có parseAndPreview method', () => {
    const content = fs.readFileSync(path.join(__dirname, '../vocab-import.service.ts'), 'utf8');
    expect(content).toContain('parseAndPreview');
  });

  it('vocab-import.service.ts có confirmImport method', () => {
    const content = fs.readFileSync(path.join(__dirname, '../vocab-import.service.ts'), 'utf8');
    expect(content).toContain('confirmImport');
  });

  it('vocab-import.service.ts export ParsedVocabWord interface', () => {
    const content = fs.readFileSync(path.join(__dirname, '../vocab-import.service.ts'), 'utf8');
    expect(content).toContain('export interface ParsedVocabWord');
  });

  it('vocab-import.service.ts có extractWithRegex method', () => {
    const content = fs.readFileSync(path.join(__dirname, '../vocab-import.service.ts'), 'utf8');
    expect(content).toContain('extractWithRegex');
  });

  it('vision-ollama.client.ts KHÔNG tồn tại nữa (đã bị xóa)', () => {
    const visionClientPath = path.join(__dirname, '../vision-ollama.client.ts');
    expect(fs.existsSync(visionClientPath)).toBe(false);
  });
});
