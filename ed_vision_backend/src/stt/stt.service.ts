import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';
import * as os from 'os';

const execFileAsync = promisify(execFile);

@Injectable()
export class SttService {
  private readonly logger = new Logger(SttService.name);

  /**
   * Transcribe raw Float32 PCM audio (16 kHz mono) using Whisper.
   * @param pcmBuffer  ArrayBuffer of float32 samples from the browser Web Audio API
   */
  async transcribe(pcmBuffer: Buffer): Promise<string> {
    const tmpFile = path.join(os.tmpdir(), `edvision_stt_${Date.now()}.f32`);
    const scriptPath = path.join(
      __dirname,
      '../../../ml_service/stt_service.py',
    );

    // Use the project venv Python (has whisper installed), fall back to system python
    const venvPython = path.join(__dirname, '../../../.venv/Scripts/python.exe');
    const pythonExe = existsSync(venvPython) ? venvPython : 'python';

    try {
      await fs.writeFile(tmpFile, pcmBuffer);

      const { stdout } = await execFileAsync(pythonExe, [scriptPath, tmpFile], {
        timeout: 120_000, // 2 min – first run downloads ~75 MB model
        maxBuffer: 1024 * 1024,
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result: { text?: string; error?: string } = JSON.parse(
        stdout.trim(),
      );

      if (result.error) {
        this.logger.error('Whisper error:', result.error);
        throw new InternalServerErrorException(result.error);
      }

      return result.text ?? '';
    } catch (err: unknown) {
      if (err instanceof InternalServerErrorException) throw err;

      const message = err instanceof Error ? err.message : String(err);

      // If python command not found, give a helpful hint
      if (message.includes('ENOENT')) {
        throw new InternalServerErrorException(
          'python not found in PATH. Make sure Python is installed and accessible.',
        );
      }
      this.logger.error('STT failed:', message);
      throw new InternalServerErrorException(
        'Speech-to-text failed: ' + message,
      );
    } finally {
      fs.unlink(tmpFile).catch(() => undefined);
    }
  }
}
