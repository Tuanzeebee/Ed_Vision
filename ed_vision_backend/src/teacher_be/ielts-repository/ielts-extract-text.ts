/**
 * ielts-extract-text.ts
 * ---------------------
 * Trích xuất text từ nhiều loại file cho IELTS import.
 *
 * Pipeline:
 *  1. PDF text layer  → pdf-parse (v1 + v2 compat)
 *  2. PDF scan ảnh    → pdfjs-dist render → canvas → tesseract.js  (pure Node, no binary)
 *  3. DOCX            → mammoth
 *  4. DOC             → word-extractor
 *  5. Image           → tesseract.js trực tiếp
 *  6. TXT / fallback  → readFile utf8
 *
 * Install (1 lần):
 *   npm install pdfjs-dist canvas tesseract.js mammoth word-extractor
 */

import { Logger } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { extname } from 'path';

const logger = new Logger('IeltsExtractText');

// ─── 1. PDF text layer (pdf-parse v1 + v2 compat) ────────────────────────────

async function extractPdfTextLayer(filePath: string): Promise<string> {
  try {
    const mod = await import('pdf-parse');
    const buf = await readFile(filePath);

    // v2: exports { PDFParse }
    const Ctor = (mod as { PDFParse?: unknown }).PDFParse;
    if (typeof Ctor === 'function') {
      const parser = new (Ctor as new (o: { data: Buffer }) => {
        getText: () => Promise<{ text: string }>;
        destroy?: () => Promise<void>;
      })({ data: buf });
      try {
        return String((await parser.getText())?.text ?? '');
      } finally {
        await parser.destroy?.().catch(() => undefined);
      }
    }

    // v1: exports default function
    const fn = (mod as { default?: unknown }).default;
    if (typeof fn === 'function') {
      return String(
        (await (fn as (b: Buffer) => Promise<{ text: string }>)(buf))?.text ?? '',
      );
    }
  } catch (err) {
    logger.warn(`pdf-parse error: ${String(err)}`);
  }
  return '';
}

// ─── 2. PDF scan OCR (pdfjs-dist + canvas + tesseract.js) ────────────────────
//
//  • pdfjs-dist  — render PDF page to pixel buffer (pure JS, no Ghostscript/Poppler)
//  • canvas      — Node.js Canvas API needed by pdfjs-dist
//  • tesseract.js — WebAssembly Tesseract, no system binary needed

async function extractPdfScanOcr(filePath: string): Promise<string> {
  try {
    // ── Load pdfjs-dist ──────────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

    // pdfjs-dist needs a Canvas factory in Node environment
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createCanvas } = require('canvas');

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createWorker } = require('tesseract.js');

    const fileData = await readFile(filePath);

    // Disable worker threads inside pdfjs (Node compat)
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';

    const pdfDoc = await pdfjsLib.getDocument({
      data: new Uint8Array(fileData),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    }).promise;

    const totalPages: number = pdfDoc.numPages;
    logger.log(`[OCR] pdfjs loaded — ${totalPages} page(s).`);

    // Create tesseract worker once, reuse across all pages
    const worker = await createWorker('eng');
    // PSM 6: assume a uniform block of text — good default for IELTS pages.
    await worker.setParameters({
      tessedit_pageseg_mode: '6',
      preserve_interword_spaces: '1',
    });
    const parts: string[] = [];

    try {
      for (let p = 1; p <= totalPages; p++) {
        logger.log(`[OCR] Rendering page ${p}/${totalPages}...`);
        try {
          const page = await pdfDoc.getPage(p);

          // scale 3.0 ≈ 300 dpi — higher resolution for better OCR accuracy.
          // The previous 2.0 (200 dpi) caused answer key entries to be garbled.
          const viewport = page.getViewport({ scale: 3.0 });
          const W = Math.round(viewport.width);
          const H = Math.round(viewport.height);
          const canvas = createCanvas(W, H);
          const ctx = canvas.getContext('2d');

          // Provide NodeCanvasFactory so pdfjs can create sub-canvases if needed
          await page.render({
            canvasContext: ctx,
            viewport,
            canvasFactory: {
              create(w: number, h: number) {
                const c = createCanvas(w, h);
                return { canvas: c, context: c.getContext('2d') };
              },
              reset(obj: { canvas: unknown; context: unknown }, w: number, h: number) {
                const c = createCanvas(w, h);
                obj.canvas = c;
                obj.context = (c as ReturnType<typeof createCanvas>).getContext('2d');
              },
              destroy() { /* no-op */ },
            },
          }).promise;

          // Single full-page OCR pass — sufficient for IELTS question papers.
          // Column-split OCR removed: it tripled processing time per page and
          // the downstream parser already deduplicates by question number.
          const fullBuf: Buffer = canvas.toBuffer('image/png');
          const { data: fullOcr } = await worker.recognize(fullBuf);
          if (fullOcr?.text?.trim()) parts.push(fullOcr.text);
        } catch (pageErr) {
          logger.warn(`[OCR] Page ${p} failed: ${String(pageErr)}`);
        }
      }
    } finally {
      await worker.terminate();
    }

    return parts.join('\n').trim();
  } catch (err) {
    logger.warn(`PDF OCR pipeline error: ${String(err)}`);
    return '';
  }
}

// ─── Main exported function ───────────────────────────────────────────────────

export async function extractTextFromFile(file: Express.Multer.File): Promise<string> {
  const ext = extname(file.originalname || file.filename || '').toLowerCase();
  const fp = file.path;

  // ── PDF ──────────────────────────────────────────────────────────────────
  if (ext === '.pdf') {
    const layer = await extractPdfTextLayer(fp);
    if (layer.trim().length >= 40) {
      logger.log(`[PDF] Text layer OK — ${layer.length} chars.`);
      return layer;
    }
    logger.log(`[PDF] Text layer too short (${layer.length} chars) — OCR fallback...`);
    const ocr = await extractPdfScanOcr(fp);
    if (ocr.trim().length > 0) {
      logger.log(`[PDF] OCR OK — ${ocr.length} chars.`);
      return ocr;
    }
    logger.warn('[PDF] No text could be extracted from this file.');
    return layer;
  }

  // ── DOCX ─────────────────────────────────────────────────────────────────
  if (ext === '.docx') {
    try {
      const mammoth = await import('mammoth');
      return String((await mammoth.extractRawText({ path: fp }))?.value ?? '');
    } catch (err) {
      logger.warn(`mammoth error: ${String(err)}`);
    }
  }

  // ── DOC ──────────────────────────────────────────────────────────────────
  if (ext === '.doc') {
    try {
      const mod = await import('word-extractor');
      const Ctor = (mod as { default?: unknown }).default ?? mod;
      const ex = new (Ctor as new () => { extract(p: string): Promise<{ getBody(): string }> })();
      return String((await ex.extract(fp)).getBody?.() ?? '');
    } catch (err) {
      logger.warn(`word-extractor error: ${String(err)}`);
    }
  }

  // ── Image ─────────────────────────────────────────────────────────────────
  if (['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tif', '.tiff'].includes(ext)) {
    try {
      const { createWorker } = await import('tesseract.js');
      const w = await createWorker('eng');
      try {
        return String((await w.recognize(fp))?.data?.text ?? '');
      } finally {
        await w.terminate();
      }
    } catch (err) {
      logger.warn(`Image OCR error: ${String(err)}`);
    }
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  return (await readFile(fp)).toString('utf8');
}
