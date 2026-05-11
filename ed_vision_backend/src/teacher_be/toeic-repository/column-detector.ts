// ─── ColumnDetector ───────────────────────────────────────────────────────────
// Phát hiện cột trong ảnh bằng Vertical Projection Profile.
// Sử dụng `sharp` (industry-standard Node.js image processing) thay vì OpenCV.
// Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 12.5

import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ColumnRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  columnIndex: number;
}

export interface ColumnDetectionResult {
  columns: ColumnRegion[];
  originalWidth: number;
  originalHeight: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Pixel value threshold: pixel < DARK_THRESHOLD được coi là "tối" (có text) */
const DARK_THRESHOLD = 128;

/** Normalized projection threshold: vùng có projection < này được coi là "valley" (khoảng trắng) */
const VALLEY_THRESHOLD = 0.05;

/** Chiều rộng tối thiểu của valley để được coi là ranh giới cột (px) */
const MIN_GAP_WIDTH = 20;

/** Kích thước tối đa cho phép trước khi resize (px) */
const MAX_DIMENSION = 4000;

// ─── ColumnDetector class ─────────────────────────────────────────────────────

export class ColumnDetector {
  /**
   * Phát hiện cột trong ảnh bằng vertical projection profile.
   *
   * Thuật toán:
   * 1. Đọc ảnh → grayscale → lấy raw pixel buffer
   * 2. Tính vertical projection: với mỗi cột x, đếm số pixel "tối" (< DARK_THRESHOLD)
   * 3. Normalize projection về 0-1 (chia cho height)
   * 4. Tìm "valleys": vùng có normalized projection < VALLEY_THRESHOLD với width ≥ MIN_GAP_WIDTH
   * 5. Mỗi valley là ranh giới cột → split thành N+1 cột
   * 6. Nếu không tìm được valley → trả về 1 region bao toàn bộ ảnh
   * 7. Sắp xếp columns theo x tăng dần
   *
   * Nếu sharp không đọc được ảnh → fallback trả về 1 column bao toàn bộ ảnh.
   */
  async detectColumns(imagePath: string): Promise<ColumnDetectionResult> {
    let workingPath = imagePath;

    try {
      // Resize nếu cần trước khi xử lý
      workingPath = await this.resizeIfNeeded(imagePath);

      // Đọc ảnh → grayscale → raw pixel buffer
      const { data, info } = await sharp(workingPath)
        .grayscale()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const { width, height } = info;

      // Tính vertical projection profile
      // projection[x] = số pixel tối trong cột x / height (normalized 0-1)
      const projection = this.computeVerticalProjection(data, width, height);

      // Tìm valleys (ranh giới cột)
      const valleys = this.findValleys(projection, width);

      // Nếu không có valley → 1 cột bao toàn bộ ảnh
      if (valleys.length === 0) {
        return {
          columns: [
            {
              x: 0,
              y: 0,
              width,
              height,
              columnIndex: 0,
            },
          ],
          originalWidth: width,
          originalHeight: height,
        };
      }

      // Split thành N+1 cột dựa trên valleys
      const columns = this.splitIntoColumns(valleys, width, height);

      // Sắp xếp theo x tăng dần (đảm bảo thứ tự trái-phải)
      columns.sort((a, b) => a.x - b.x);

      // Thêm padding cho mỗi cột để không cắt mất chữ ở mép
      const COL_PADDING = 10;
      for (const col of columns) {
        const newX = Math.max(0, col.x - COL_PADDING);
        const newEnd = Math.min(width, col.x + col.width + COL_PADDING);
        col.x = newX;
        col.width = newEnd - newX;
      }

      return {
        columns,
        originalWidth: width,
        originalHeight: height,
      };
    } catch (err) {
      // Fallback: không đọc được ảnh → trả về 1 cột bao toàn bộ ảnh
      console.warn(
        `[ColumnDetector] Failed to process image "${imagePath}", falling back to single column:`,
        (err as Error).message,
      );

      // Cố gắng lấy metadata để biết kích thước thực
      try {
        const meta = await sharp(imagePath).metadata();
        const w = meta.width ?? 800;
        const h = meta.height ?? 600;
        return {
          columns: [{ x: 0, y: 0, width: w, height: h, columnIndex: 0 }],
          originalWidth: w,
          originalHeight: h,
        };
      } catch {
        // Hoàn toàn không đọc được → trả về kích thước mặc định
        return {
          columns: [{ x: 0, y: 0, width: 800, height: 600, columnIndex: 0 }],
          originalWidth: 800,
          originalHeight: 600,
        };
      }
    }
  }

  /**
   * Cắt ảnh gốc thành các ảnh con theo ColumnRegion[].
   * Tên file: `{basename}_col_{index}{ext}` (ví dụ: `vocab_col_0.jpg`)
   * Lưu vào outputDir.
   * Trả về array đường dẫn file đã tạo.
   */
  async cropToColumns(
    imagePath: string,
    regions: ColumnRegion[],
    outputDir: string,
  ): Promise<string[]> {
    const ext = path.extname(imagePath);
    const basename = path.basename(imagePath, ext);
    const outputPaths: string[] = [];

    // Đảm bảo outputDir tồn tại
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const region of regions) {
      const outputFilename = `${basename}_col_${region.columnIndex}${ext}`;
      const outputPath = path.join(outputDir, outputFilename);

      try {
        await sharp(imagePath)
          .extract({
            left: region.x,
            top: region.y,
            width: region.width,
            height: region.height,
          })
          .toFile(outputPath);

        outputPaths.push(outputPath);
      } catch (err) {
        console.warn(
          `[ColumnDetector] Failed to crop column ${region.columnIndex} from "${imagePath}":`,
          (err as Error).message,
        );
        // Bỏ qua cột này, tiếp tục với cột tiếp theo
      }
    }

    return outputPaths;
  }

  /**
   * Resize ảnh nếu max(width, height) > MAX_DIMENSION (4000px).
   * Giữ aspect ratio. Lưu file resize vào cùng thư mục với suffix `_resized`.
   * Trả về path của file đã resize (hoặc path gốc nếu không cần resize).
   */
  private async resizeIfNeeded(imagePath: string): Promise<string> {
    const meta = await sharp(imagePath).metadata();
    const { width = 0, height = 0 } = meta;

    if (Math.max(width, height) <= MAX_DIMENSION) {
      return imagePath;
    }

    const ext = path.extname(imagePath);
    const basename = path.basename(imagePath, ext);
    const dir = path.dirname(imagePath);
    const resizedPath = path.join(dir, `${basename}_resized${ext}`);

    // Resize xuống max MAX_DIMENSION px, giữ aspect ratio
    await sharp(imagePath)
      .resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toFile(resizedPath);

    console.log(
      `[ColumnDetector] Resized image from ${width}x${height} to fit within ${MAX_DIMENSION}px: "${resizedPath}"`,
    );

    return resizedPath;
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  /**
   * Tính vertical projection profile từ raw grayscale pixel buffer.
   * Trả về mảng normalized [0-1] với length = width.
   * projection[x] = (số pixel tối trong cột x) / height
   */
  private computeVerticalProjection(
    data: Buffer,
    width: number,
    height: number,
  ): number[] {
    const projection = new Array<number>(width).fill(0);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelIndex = y * width + x;
        const pixelValue = data[pixelIndex];
        if (pixelValue < DARK_THRESHOLD) {
          projection[x]++;
        }
      }
    }

    // Normalize về 0-1
    return projection.map((count) => (height > 0 ? count / height : 0));
  }

  /**
   * Tìm "valleys" trong projection profile.
   * Valley là vùng liên tục có normalized projection < VALLEY_THRESHOLD
   * với chiều rộng ≥ MIN_GAP_WIDTH.
   *
   * Trả về array các { start, end } (inclusive) của mỗi valley.
   */
  private findValleys(
    projection: number[],
    width: number,
  ): Array<{ start: number; end: number }> {
    const valleys: Array<{ start: number; end: number }> = [];
    let valleyStart: number | null = null;

    for (let x = 0; x < width; x++) {
      const isLow = projection[x] < VALLEY_THRESHOLD;

      if (isLow && valleyStart === null) {
        valleyStart = x;
      } else if (!isLow && valleyStart !== null) {
        const valleyWidth = x - valleyStart;
        if (valleyWidth >= MIN_GAP_WIDTH) {
          valleys.push({ start: valleyStart, end: x - 1 });
        }
        valleyStart = null;
      }
    }

    // Xử lý valley kéo dài đến cuối ảnh
    if (valleyStart !== null) {
      const valleyWidth = width - valleyStart;
      if (valleyWidth >= MIN_GAP_WIDTH) {
        valleys.push({ start: valleyStart, end: width - 1 });
      }
    }

    return valleys;
  }

  /**
   * Tạo ColumnRegion[] từ danh sách valleys.
   * Mỗi valley là ranh giới → N valleys tạo ra N+1 cột.
   * Cột i nằm giữa valley[i-1].end và valley[i].start.
   */
  private splitIntoColumns(
    valleys: Array<{ start: number; end: number }>,
    width: number,
    height: number,
  ): ColumnRegion[] {
    const columns: ColumnRegion[] = [];
    let columnIndex = 0;

    // Cột đầu tiên: từ x=0 đến trước valley đầu tiên
    const firstColEnd = valleys[0].start - 1;
    if (firstColEnd > 0) {
      columns.push({
        x: 0,
        y: 0,
        width: firstColEnd + 1,
        height,
        columnIndex: columnIndex++,
      });
    }

    // Các cột giữa: giữa valley[i].end và valley[i+1].start
    for (let i = 0; i < valleys.length - 1; i++) {
      const colStart = valleys[i].end + 1;
      const colEnd = valleys[i + 1].start - 1;
      const colWidth = colEnd - colStart + 1;

      if (colWidth > 0) {
        columns.push({
          x: colStart,
          y: 0,
          width: colWidth,
          height,
          columnIndex: columnIndex++,
        });
      }
    }

    // Cột cuối cùng: từ sau valley cuối đến hết ảnh
    const lastColStart = valleys[valleys.length - 1].end + 1;
    const lastColWidth = width - lastColStart;
    if (lastColWidth > 0) {
      columns.push({
        x: lastColStart,
        y: 0,
        width: lastColWidth,
        height,
        columnIndex: columnIndex++,
      });
    }

    // Nếu không tạo được cột nào (edge case) → fallback 1 cột toàn ảnh
    if (columns.length === 0) {
      columns.push({ x: 0, y: 0, width, height, columnIndex: 0 });
    }

    return columns;
  }
}
