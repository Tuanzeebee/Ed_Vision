"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const fs_1 = require("fs");
const path_1 = require("path");
const prisma = new client_1.PrismaClient();
async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error('Usage: ts-node sync_diagnostic_media.ts <slug>');
        process.exit(1);
    }
    const slug = args[0];
    console.log(`Syncing media for repository slug: ${slug}`);
    const repository = await prisma.diagnosticRepository.findUnique({
        where: { slug },
    });
    if (!repository) {
        console.error(`Repository not found for slug: ${slug}`);
        process.exit(1);
    }
    const items = await prisma.diagnosticRepositoryItem.findMany({
        where: { repository_id: repository.id },
    });
    const qNumToItemId = new Map();
    for (const item of items) {
        const metadata = item.metadata;
        if (metadata && typeof metadata.question_number === 'number') {
            qNumToItemId.set(metadata.question_number, item.id);
        }
    }
    const audioDir = (0, path_1.join)(process.cwd(), 'uploads', 'certificate', 'TOEIC', 'toeic-listening-survey', slug, 'audio');
    if ((0, fs_1.existsSync)(audioDir)) {
        const audioFiles = (0, fs_1.readdirSync)(audioDir);
        let audioMapped = 0;
        for (const file of audioFiles) {
            if (!file.endsWith('.mp3'))
                continue;
            const match = file.match(/_part\d+_[qt](\d+)\.mp3/);
            if (match) {
                const qNum = parseInt(match[1], 10);
                const itemId = qNumToItemId.get(qNum);
                if (itemId) {
                    const url = `/uploads/certificate/TOEIC/toeic-listening-survey/${slug}/audio/${file}`;
                    await prisma.diagnosticRepositoryItem.update({
                        where: { id: itemId },
                        data: { media_audio_url: url },
                    });
                    audioMapped++;
                }
            }
        }
        console.log(`Mapped ${audioMapped} audio files.`);
    }
    else {
        console.log(`Audio directory not found: ${audioDir}`);
    }
    const imagesDir = (0, path_1.join)(process.cwd(), 'uploads', 'certificate', 'TOEIC', 'toeic-listening-survey', slug, 'images');
    if ((0, fs_1.existsSync)(imagesDir)) {
        const imageFiles = (0, fs_1.readdirSync)(imagesDir).filter(f => f.endsWith('.webp') || f.endsWith('.png') || f.endsWith('.jpg')).sort();
        let imagesMapped = 0;
        for (let i = 0; i < Math.min(imageFiles.length, 6); i++) {
            const qNum = i + 1;
            const itemId = qNumToItemId.get(qNum);
            if (itemId) {
                const url = `certificate/TOEIC/toeic-listening-survey/${slug}/images/${imageFiles[i]}`;
                await prisma.diagnosticRepositoryItem.update({
                    where: { id: itemId },
                    data: { media_image_url: `/uploads/${url}` },
                });
                imagesMapped++;
            }
        }
        console.log(`Mapped ${imagesMapped} image files.`);
    }
    else {
        console.log(`Images directory not found: ${imagesDir}`);
    }
    console.log('Sync complete.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=sync_diagnostic_media.js.map