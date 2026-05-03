"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const crypto_util_1 = require("./src/common/crypto.util");
const prisma = new client_1.PrismaClient();
async function main() {
    const q = await prisma.$queryRaw `SELECT * FROM "ToeicPracticeQuestion" WHERE part = 5 ORDER BY id DESC LIMIT 2`;
    console.log(q);
    const decrypted = q.map(row => ({
        id: row.id,
        stem: (0, crypto_util_1.tryDecryptString)(row.stem),
        reading_passage: (0, crypto_util_1.tryDecryptString)(row.reading_passage),
    }));
    console.log(decrypted);
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=test-decrypt.js.map