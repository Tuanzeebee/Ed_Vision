// ============================================================
// SCRIPT: Generate Audio for Listening Passages
// Sử dụng Edge TTS để tạo audio cho placement test
// Run: npx ts-node scripts/generate-listening-audio.ts
// ============================================================

import { PrismaClient } from '@prisma/client';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';

const execFileAsync = promisify(execFile);
const prisma = new PrismaClient();

// Voice mapping cho các nhân vật
const VOICE_MAP: Record<string, string> = {
  RECEPTIONIST: 'en-GB-SoniaNeural', // Female British
  CALLER: 'en-GB-RyanNeural', // Male British
  LIBRARIAN: 'en-GB-SoniaNeural', // Female British
  STUDENT: 'en-US-GuyNeural', // Male American (international student)
  GUIDE: 'en-GB-RyanNeural', // Male British (narrator)
  TUTOR: 'en-GB-SoniaNeural', // Female British
  TOM: 'en-GB-RyanNeural', // Male British
  PRIYA: 'en-IN-NeerjaNeural', // Female Indian
};

const DEFAULT_VOICE = 'en-GB-RyanNeural';

interface DialogueLine {
  speaker: string;
  text: string;
}

/**
 * Parse dialogue từ content
 */
function parseDialogue(content: string): DialogueLine[] {
  const lines: DialogueLine[] = [];
  const paragraphs = content.split('\n\n');

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // Check if it's a dialogue line (SPEAKER: text)
    const match = trimmed.match(/^([A-Z\s]+):\s*(.+)$/s);
    if (match) {
      const speaker = match[1].trim();
      const text = match[2].trim();
      lines.push({ speaker, text });
    } else {
      // Narrator (no speaker label)
      lines.push({ speaker: 'NARRATOR', text: trimmed });
    }
  }

  return lines;
}

/**
 * Generate audio cho một dialogue line
 */
async function generateLineAudio(
  line: DialogueLine,
  outputPath: string,
): Promise<void> {
  const voice = VOICE_MAP[line.speaker] || DEFAULT_VOICE;

  try {
    await execFileAsync(
      'edge-tts',
      ['--voice', voice, '--text', line.text, '--write-media', outputPath],
      { timeout: 30000 },
    );
    console.log(`   ✅ Generated: ${line.speaker} (${voice})`);
  } catch (err) {
    console.error(`   ❌ Failed to generate audio for ${line.speaker}:`, err);
    throw err;
  }
}

/**
 * Merge audio files using ffmpeg
 */
async function mergeAudioFiles(
  inputFiles: string[],
  outputPath: string,
): Promise<void> {
  // Create concat file list
  const concatListPath = path.join(
    path.dirname(outputPath),
    'concat_list.txt',
  );
  const concatContent = inputFiles
    .map((f) => `file '${path.basename(f)}'`)
    .join('\n');
  await fs.writeFile(concatListPath, concatContent);

  try {
    await execFileAsync(
      'ffmpeg',
      [
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        concatListPath,
        '-c',
        'copy',
        outputPath,
      ],
      { timeout: 60000, cwd: path.dirname(outputPath) },
    );
    console.log(`   ✅ Merged ${inputFiles.length} audio files`);
  } catch (err) {
    console.error('   ❌ Failed to merge audio files:', err);
    throw err;
  } finally {
    await fs.unlink(concatListPath).catch(() => undefined);
  }
}

/**
 * Generate audio cho một passage
 */
async function generatePassageAudio(
  passage: any,
  outputDir: string,
): Promise<string> {
  console.log(`\n📝 Processing: "${passage.title}"`);

  const lines = parseDialogue(passage.content);
  console.log(`   Found ${lines.length} dialogue lines`);

  // Create temp directory for individual lines
  const tempDir = path.join(outputDir, 'temp', passage.id);
  await fs.mkdir(tempDir, { recursive: true });

  const lineFiles: string[] = [];

  // Generate audio for each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineFile = path.join(tempDir, `line_${i.toString().padStart(3, '0')}.mp3`);
    await generateLineAudio(line, lineFile);
    lineFiles.push(lineFile);

    // Add pause between lines (0.5s silence)
    if (i < lines.length - 1) {
      const pauseFile = path.join(tempDir, `pause_${i.toString().padStart(3, '0')}.mp3`);
      await execFileAsync(
        'ffmpeg',
        [
          '-f',
          'lavfi',
          '-i',
          'anullsrc=r=44100:cl=stereo',
          '-t',
          '0.5',
          '-q:a',
          '9',
          '-acodec',
          'libmp3lame',
          pauseFile,
        ],
        { timeout: 10000 },
      );
      lineFiles.push(pauseFile);
    }
  }

  // Merge all lines into final audio
  const finalAudioPath = path.join(
    outputDir,
    `${passage.id}_${passage.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`,
  );
  await mergeAudioFiles(lineFiles, finalAudioPath);

  // Cleanup temp files
  for (const file of lineFiles) {
    await fs.unlink(file).catch(() => undefined);
  }
  await fs.rmdir(tempDir).catch(() => undefined);

  console.log(`   ✅ Final audio: ${path.basename(finalAudioPath)}`);
  return finalAudioPath;
}

/**
 * Upload audio to public folder and return URL
 */
async function saveAudioToPublic(
  audioPath: string,
  passageId: string,
): Promise<string> {
  const publicDir = path.join(process.cwd(), 'public', 'audio', 'listening');
  await fs.mkdir(publicDir, { recursive: true });

  const fileName = `${passageId}.mp3`;
  const destPath = path.join(publicDir, fileName);

  await fs.copyFile(audioPath, destPath);
  console.log(`   ✅ Saved to public: /audio/listening/${fileName}`);

  return `/audio/listening/${fileName}`;
}

/**
 * Main function
 */
async function main() {
  console.log('🎙️  Starting Listening Audio Generation...\n');

  // Check dependencies
  try {
    await execFileAsync('edge-tts', ['--version']);
    console.log('✅ edge-tts is installed\n');
  } catch {
    console.error('❌ edge-tts not found. Install: pip install edge-tts');
    process.exit(1);
  }

  try {
    await execFileAsync('ffmpeg', ['-version']);
    console.log('✅ ffmpeg is installed\n');
  } catch {
    console.error('❌ ffmpeg not found. Install ffmpeg first.');
    process.exit(1);
  }

  // Get all listening passages for placement test
  const passages = await prisma.ieltsPassage.findMany({
    where: {
      skill: 'listening',
      status: 'approved',
    },
    orderBy: { band_min: 'asc' },
  });

  console.log(`Found ${passages.length} listening passages\n`);

  const outputDir = path.join(process.cwd(), 'temp_audio');
  await fs.mkdir(outputDir, { recursive: true });

  let successCount = 0;
  let failCount = 0;

  for (const passage of passages) {
    try {
      // Generate audio
      const audioPath = await generatePassageAudio(passage, outputDir);

      // Save to public folder
      const audioUrl = await saveAudioToPublic(audioPath, passage.id);

      // Update database
      await prisma.ieltsPassage.update({
        where: { id: passage.id },
        data: {
          audio_url: audioUrl,
          tts_generated: true,
        },
      });

      console.log(`   ✅ Updated database with audio URL\n`);
      successCount++;

      // Cleanup temp file
      await fs.unlink(audioPath).catch(() => undefined);
    } catch (err) {
      console.error(`   ❌ Failed to process "${passage.title}":`, err);
      failCount++;
    }
  }

  // Cleanup temp directory
  await fs.rmdir(path.join(outputDir, 'temp'), { recursive: true }).catch(() => undefined);
  await fs.rmdir(outputDir).catch(() => undefined);

  console.log('\n═══════════════════════════════════════════════════');
  console.log('🎉 Audio Generation Complete!');
  console.log('═══════════════════════════════════════════════════');
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('═══════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
