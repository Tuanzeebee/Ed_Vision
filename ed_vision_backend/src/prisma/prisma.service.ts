import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { tryEncryptString, tryDecryptString } from '../common/crypto.util';

const ENCRYPTED_MODELS = [
  'LearningRepositoryItem',
  'LearningRepositoryOption',
  'ToeicPracticeQuestion',
  'ToeicPracticeOption',
  'IeltsPracticeQuestion',
  'IeltsPracticeOption',
];

const ENCRYPTED_FIELDS = [
  'stem',
  'reading_passage',
  'context_audio',
  'explanation',
  'ai_explanation',
  'option_text',
  'rationale',
];

function processObject(obj: any, encrypt: boolean) {
  if (!obj || typeof obj !== 'object') return;
  
  if (Array.isArray(obj)) {
    obj.forEach(item => processObject(item, encrypt));
    return;
  }

  for (const key of Object.keys(obj)) {
    if (ENCRYPTED_FIELDS.includes(key) && typeof obj[key] === 'string') {
      obj[key] = encrypt ? tryEncryptString(obj[key]) : tryDecryptString(obj[key]);
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      processObject(obj[key], encrypt);
    }
  }
}

function processResult(result: any, encrypt: boolean) {
  processObject(result, encrypt);
}

/**
 * PrismaService manages database connections using Prisma Client.
 * Implements OnModuleInit to connect on startup.
 * Implements OnModuleDestroy to disconnect on shutdown.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super();

    // Data-at-rest transparent encryption/decryption extension (replaces deprecated $use)
    const extended = this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            // 1. Encrypt before writing to DB
            if (model && ENCRYPTED_MODELS.includes(model)) {
              const anyArgs = args as any;
              if (['create', 'update'].includes(operation) && anyArgs?.data) {
                processObject(anyArgs.data, true);
              } else if (['createMany', 'updateMany'].includes(operation) && anyArgs?.data) {
                if (Array.isArray(anyArgs.data)) {
                  anyArgs.data.forEach((d: any) => processObject(d, true));
                } else {
                  processObject(anyArgs.data, true);
                }
              }
            }

            // Execute query
            const result = await query(args);

            // 2. Decrypt after reading from DB
            if (result) {
              // We run decrypt on ANY result that might contain these fields due to includes
              processResult(result, false);
            }

            return result;
          },
        },
      },
    });

    return new Proxy(this, {
      get: (target, prop) => {
        if (prop in extended) {
          return (extended as any)[prop];
        }
        return (target as any)[prop];
      },
    });
  }

  /**
   * Connect to database when module initializes
   */
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * Disconnect from database when module destroys
   */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
