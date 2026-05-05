// ─── RegexExtractor ───────────────────────────────────────────────────────────
// Parse danh sách từ vựng từ raw text (OCR, PDF, TXT).
// Được tối ưu để xử lý noise từ Tesseract OCR tiếng Việt.

export interface ExtractedWord {
  word: string;
  pos: string;
  meaning: string;
}

// ─── POS normalization map ────────────────────────────────────────────────────
export const POS_MAP: Record<string, string> = {
  'n': 'n.',
  'v': 'v.',
  'adj': 'adj.',
  'adv': 'adv.',
  'prep': 'prep.',
  'pron': 'pron.',
  'v & n': 'v./n.',
  'n & v': 'n./v.',
  'a': 'adj.',
  'n.': 'n.',
  'v.': 'v.',
  'adj.': 'adj.',
  'adv.': 'adv.',
  'conj': 'conj.',
  'interj': 'interj.',
};

export function normPos(raw: string): string {
  const k = (raw ?? '').trim().toLowerCase().replace(/\.$/, '').replace(/[^a-z &\/\.]/g, '');
  return POS_MAP[k] ?? (raw.trim() ? raw.trim().slice(0, 6) + '.' : 'n.');
}

// ─── RegexExtractor class ─────────────────────────────────────────────────────
export class RegexExtractor {

  extract(rawText: string): ExtractedWord[] {
    const lines = rawText.split(/\n/).map((l) => l.trim()).filter(Boolean);
    const merged = this.mergeLines(lines);

    const results: ExtractedWord[] = [];
    const seen = new Set<string>();

    for (const line of merged) {
      // Bỏ qua dòng header/footer
      if (/^(từ vựng|toeic|phần|page|\d{3,}$)/i.test(line) && line.length < 80) continue;

      const parsed = this.parseLine(line);
      if (!parsed) continue;

      const { word, pos, meaning } = parsed;
      if (word.length < 2 || word.length > 45 || seen.has(word)) continue;

      // Strip column 2 bleeding:
      // 1. Dừng tại "NN. CapitalWord" (vd: " 2. Word")
      // 2. Dừng tại từ tiếng Anh có dạng " Word (pos)" hoặc " Word (pos):"
      // 3. Xóa các dấu câu thừa ở đầu nghĩa (vd: ": khả năng" -> "khả năng")
      let cleanMeaning = meaning
        .replace(/\s*[^a-z0-9]*\d+[\.\)]\s*[A-Z][a-z].*$/i, '') // " 2. Word" or " Š. 2. Word"
        .replace(/\s*[^a-z0-9]*[A-Z][a-z]{2,}\s*\([a-z.]+\).*$/i, '') // " Š. Able (adj)"
        .replace(/^[:;.,\-\s]+/, '') // Strip leading punctuations
        .trim();

      if (!cleanMeaning || cleanMeaning.length < 2) continue;

      seen.add(word);
      results.push({
        word,
        pos: normPos(pos),
        meaning: cleanMeaning.slice(0, 250),
      });
    }

    return results;
  }

  // ── mergeLines: ghép dòng bị xuống hàng giữa ──────────────────────────────
  // Dòng "mới" = bắt đầu bằng số thứ tự HOẶC chữ Anh hoa đầu từ (không phải tiếng Việt)
  private mergeLines(lines: string[]): string[] {
    const merged: string[] = [];
    for (const line of lines) {
      // isNew nếu: bắt đầu số thứ tự + chữ Anh, HOẶC chữ hoa Anh không phải continuation tiếng Việt
      const isNew =
        /^\d+[\.\)]\s*[A-Za-z]/.test(line) ||   // "1. Word..." hoặc "1) Word..."
        /^[A-Z][a-z]{2,}/.test(line);            // "Abandon..." "Abide..."

      if (!isNew && merged.length > 0) {
        merged[merged.length - 1] += ' ' + line;
      } else {
        merged.push(line);
      }
    }
    return merged;
  }

  // ── parseLine: thử nhiều pattern, kể cả OCR-noisy ─────────────────────────
  private parseLine(line: string): ExtractedWord | null {
    let word = '';
    let pos = '';
    let meaning = '';

    // ── Pattern A: "1. Word (pos) : meaning"  (chuẩn nhất) ────────────────
    const pA = line.match(
      /^\d+[\.\)]\s*([A-Za-z][A-Za-z\s\-']{0,40}?)\s*\(([^)]{1,20})\)\s*[:;–\-]+\s*(.{2,})$/,
    );
    if (pA) { word = pA[1]; pos = pA[2]; meaning = pA[3]; }

    // ── Pattern B: "Word (pos) : meaning"  (không số thứ tự) ──────────────
    if (!word) {
      const pB = line.match(
        /^([A-Za-z][A-Za-z\s\-']{1,40}?)\s*\(([^)]{1,20})\)\s*[:;–\-]+\s*(.{2,})$/,
      );
      if (pB) { word = pB[1]; pos = pB[2]; meaning = pB[3]; }
    }

    // ── Pattern C: "1. Word : meaning"  (không có pos) ────────────────────
    if (!word) {
      const pC = line.match(
        /^\d+[\.\)]\s*([A-Za-z][A-Za-z\s\-']{1,40}?)\s*[:;–\-]+\s*(.{2,})$/,
      );
      if (pC) { word = pC[1]; meaning = pC[2]; }
    }

    // ── Pattern D: OCR-noisy — "1.Word(pos):meaning" (thiếu khoảng trắng) ─
    if (!word) {
      const pD = line.match(
        /^\d+[\.\)]\s*([A-Za-z][A-Za-z\-']{1,30})\s*\(([a-zA-Z\s&\/]{1,15})\)\s*[:\-;]+\s*(.{2,})$/,
      );
      if (pD) { word = pD[1]; pos = pD[2]; meaning = pD[3]; }
    }

    // ── Pattern E: OCR-noisy — ký tự ":" bị OCR thành ";" hoặc "." ───────
    // VD: "3. Abeyance (n) . sự đình chỉ" hoặc "3. Abeyance (n). sự đình chỉ"
    if (!word) {
      const pE = line.match(
        /^\d+[\.\)]\s*([A-Za-z][A-Za-z\s\-']{0,40}?)\s*\(([^)]{1,20})\)\s*[\.]\s+(.{2,})$/,
      );
      if (pE) { word = pE[1]; pos = pE[2]; meaning = pE[3]; }
    }

    if (!word || !meaning) return null;

    // Validate word: chỉ chứa chữ Anh
    const cleanWord = word.trim().replace(/\s+/g, ' ');
    if (!/^[a-zA-Z]/.test(cleanWord)) return null;

    return {
      word: cleanWord.toLowerCase(),
      pos: pos.trim(),
      meaning: meaning.trim(),
    };
  }
}
