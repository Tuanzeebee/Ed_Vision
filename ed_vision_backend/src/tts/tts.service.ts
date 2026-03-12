import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as crypto from 'crypto';

const execFileAsync = promisify(execFile);

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);
  private readonly cache = new Map<string, Buffer>();
  private readonly MAX_CACHE_ENTRIES = 200;

  async synthesize(text: string, voice = 'en-US-JennyNeural'): Promise<Buffer> {
    const cacheKey = crypto.createHash('sha1').update(`::`).digest('hex');
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey) as Buffer;
    const audioBuffer = await this.generateWithEdgeTts(text, voice);
    if (this.cache.size >= this.MAX_CACHE_ENTRIES) {
      const firstKey = Array.from(this.cache.keys())[0];
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(cacheKey, audioBuffer);
    return audioBuffer;
  }

  private async generateWithEdgeTts(text: string, voice: string): Promise<Buffer> {
    const tmpFile = path.join(os.tmpdir(), `edvision_tts_.mp3`);
    try {
      await execFileAsync('edge-tts', ['--voice', voice, '--text', text, '--write-media', tmpFile], { timeout: 20000 });
      return await fs.readFile(tmpFile);
    } catch (err) {
      this.logger.error('edge-tts failed:', err);
      throw new InternalServerErrorException('TTS generation failed. Run: pip install edge-tts');
    } finally {
      fs.unlink(tmpFile).catch(() => undefined);
    }
  }
}
