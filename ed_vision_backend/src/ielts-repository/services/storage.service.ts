import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class IeltsStorageService {
  private readonly logger = new Logger(IeltsStorageService.name);

  async saveQuestionFile(
    file: Express.Multer.File,
    skill: string,
  ): Promise<string> {
    const allowedSkills = ['reading', 'listening', 'writing', 'speaking'];
    if (!allowedSkills.includes(skill)) {
      throw new Error('Invalid skill type for storage');
    }

    const uploadDir = path.join(process.cwd(), 'uploads', 'ielts', skill);
    fs.mkdirSync(uploadDir, { recursive: true });

    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${timestamp}_${safeName}`;
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, file.buffer);
    this.logger.log(`File saved to: ${filePath}`);

    // Return relative URL for frontend/DB
    return `/uploads/ielts/${skill}/${filename}`;
  }
}
