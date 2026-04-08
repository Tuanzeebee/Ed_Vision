/**
 * clear-ai-cache.js
 *
 * Script xóa toàn bộ AI explanation cache (cả DB lẫn file).
 * Dùng khi cần force-regenerate lại giải thích từ Ollama.
 *
 * Usage:
 *   node scripts/clear-ai-cache.js              # Xóa tất cả
 *   node scripts/clear-ai-cache.js --db-only    # Chỉ xóa DB cache
 *   node scripts/clear-ai-cache.js --file-only  # Chỉ xóa file cache
 *   node scripts/clear-ai-cache.js --dry-run    # Xem trước, không xóa thật
 */

'use strict';

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// ─── Parse args ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN   = args.includes('--dry-run');
const DB_ONLY   = args.includes('--db-only');
const FILE_ONLY = args.includes('--file-only');

const CLEAR_DB   = !FILE_ONLY;
const CLEAR_FILE = !DB_ONLY;

// ─── Paths ───────────────────────────────────────────────────────────────────
const AI_CACHE_DIR = path.join(process.cwd(), 'uploads', 'certificate', 'ai-cache');

// ─── Helpers ─────────────────────────────────────────────────────────────────
function log(msg)   { console.log(`  ${msg}`); }
function warn(msg)  { console.warn(`  ⚠  ${msg}`); }
function ok(msg)    { console.log(`  ✅ ${msg}`); }
function info(msg)  { console.log(`\n📋 ${msg}`); }
function sep()      { console.log('─'.repeat(60)); }

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ─── File cache ───────────────────────────────────────────────────────────────
function clearFileCache() {
  info('File cache: ' + AI_CACHE_DIR);

  if (!fs.existsSync(AI_CACHE_DIR)) {
    warn('Thư mục ai-cache không tồn tại — bỏ qua.');
    return { count: 0, bytes: 0 };
  }

  const files = fs.readdirSync(AI_CACHE_DIR).filter((f) => f.endsWith('.json'));
  if (files.length === 0) {
    log('Không có file cache nào.');
    return { count: 0, bytes: 0 };
  }

  let totalBytes = 0;
  let deletedCount = 0;

  for (const file of files) {
    const filePath = path.join(AI_CACHE_DIR, file);
    try {
      const stat = fs.statSync(filePath);
      totalBytes += stat.size;

      if (DRY_RUN) {
        log(`[dry-run] Sẽ xóa: ${file} (${formatBytes(stat.size)})`);
      } else {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    } catch (err) {
      warn(`Không thể xóa ${file}: ${err.message}`);
    }
  }

  if (DRY_RUN) {
    log(`[dry-run] Tổng: ${files.length} file, ${formatBytes(totalBytes)}`);
  } else {
    ok(`Đã xóa ${deletedCount}/${files.length} file cache (${formatBytes(totalBytes)})`);
  }

  return { count: deletedCount, bytes: totalBytes };
}

// ─── DB cache ─────────────────────────────────────────────────────────────────
async function clearDbCache(prisma) {
  info('DB cache:');

  // 1. ToeicNodeQuestionCache (hardcoded question explanations)
  let nodeCount = 0;
  try {
    if (DRY_RUN) {
      nodeCount = await prisma.toeicNodeQuestionCache.count();
      log(`[dry-run] ToeicNodeQuestionCache: ${nodeCount} bản ghi sẽ bị xóa`);
    } else {
      const result = await prisma.toeicNodeQuestionCache.deleteMany({});
      nodeCount = result.count;
      ok(`ToeicNodeQuestionCache: đã xóa ${nodeCount} bản ghi`);
    }
  } catch (err) {
    warn(`ToeicNodeQuestionCache: ${err.message}`);
  }

  // 2. ai_explanation trên LearningRepositoryItem (DB-backed items)
  let itemCount = 0;
  try {
    if (DRY_RUN) {
      itemCount = await prisma.learningRepositoryItem.count({
        where: { ai_explanation: { not: null } },
      });
      log(`[dry-run] LearningRepositoryItem.ai_explanation: ${itemCount} bản ghi sẽ được reset về null`);
    } else {
      const result = await prisma.learningRepositoryItem.updateMany({
        where: { ai_explanation: { not: null } },
        data: { ai_explanation: null },
      });
      itemCount = result.count;
      ok(`LearningRepositoryItem.ai_explanation: đã reset ${itemCount} bản ghi về null`);
    }
  } catch (err) {
    warn(`LearningRepositoryItem.ai_explanation: ${err.message}`);
  }

  return { nodeCount, itemCount };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  sep();
  console.log('🗑️  Ed-Vision AI Cache Cleaner');
  if (DRY_RUN)   console.log('   Mode: DRY RUN (không xóa thật)');
  if (DB_ONLY)   console.log('   Scope: DB only');
  if (FILE_ONLY) console.log('   Scope: File only');
  sep();

  const prisma = CLEAR_DB ? new PrismaClient() : null;

  try {
    // File cache
    let fileResult = { count: 0, bytes: 0 };
    if (CLEAR_FILE) {
      fileResult = clearFileCache();
    }

    // DB cache
    let dbResult = { nodeCount: 0, itemCount: 0 };
    if (CLEAR_DB && prisma) {
      dbResult = await clearDbCache(prisma);
    }

    // Summary
    sep();
    console.log('\n📊 Tóm tắt:');
    if (CLEAR_FILE) {
      log(`File cache: ${DRY_RUN ? '(dry-run) ' : ''}${fileResult.count} file, ${formatBytes(fileResult.bytes)}`);
    }
    if (CLEAR_DB) {
      log(`DB ToeicNodeQuestionCache: ${DRY_RUN ? '(dry-run) ' : ''}${dbResult.nodeCount} bản ghi`);
      log(`DB ai_explanation reset:   ${DRY_RUN ? '(dry-run) ' : ''}${dbResult.itemCount} bản ghi`);
    }

    console.log();
    if (DRY_RUN) {
      console.log('ℹ️  Chạy lại không có --dry-run để thực sự xóa.');
    } else {
      console.log('✅ Xóa cache hoàn tất. Ollama sẽ tự tái sinh khi có request.');
      console.log('   (Prefetch service sẽ chạy lại sau 15 giây kể từ lần restart backend tiếp theo)');
    }
    sep();

  } finally {
    if (prisma) await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('\n❌ Lỗi:', err.message);
  process.exit(1);
});
