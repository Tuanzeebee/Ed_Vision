const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const SKILLS = ['reading', 'listening', 'grammar', 'vocabulary'];

async function getStudentRoleId() {
    const role = await prisma.role.findUnique({ where: { code: 'student' } });
    if (!role) {
        throw new Error('Role student not found. Run base seed first.');
    }
    return role.id;
}

async function upsertTestAccountAndStudent() {
    const roleId = await getStudentRoleId();
    const email = 'student.ielts@test.com';
    const passwordHash = await bcrypt.hash('student123', 10);

    const account = await prisma.account.upsert({
        where: { email },
        update: {
            status: 'active',
            role_id: roleId,
        },
        create: {
            email,
            password_hash: passwordHash,
            status: 'active',
            role_id: roleId,
        },
    });

    let student = await prisma.student.findUnique({
        where: { account_id: account.account_id },
    });

    if (!student) {
        student = await prisma.student.create({
            data: {
                account_id: account.account_id,
                student_code: 'IELTS_TEST_001',
                status: 'active',
            },
        });
    }

    return { account, student };
}

async function upsertEnrollment(studentId) {
    let enrollment = await prisma.certificateEnrollment.findFirst({
        where: {
            student_id: studentId,
            cert_type: 'ielts',
            status: 'active',
        },
        orderBy: { id: 'desc' },
    });

    if (!enrollment) {
        enrollment = await prisma.certificateEnrollment.create({
            data: {
                student_id: studentId,
                cert_type: 'ielts',
                status: 'active',
                learning_status: 'in_progress',
                progress_percent: 0,
                current_score: 400,
                target_score: 450,
                reserve_points: 0,
                toeic_plan_state: {
                    type: 'ielts',
                    currentBand: 4.0,
                    targetBand: 4.5,
                },
            },
        });
    }

    return enrollment;
}

async function upsertRepository({
    title,
    slug,
    contentType,
    skill,
    topicGroup,
    estimatedMinutes,
    passScore,
    metadata,
}) {
    return prisma.learningRepository.upsert({
        where: { slug },
        update: {
            title,
            content_type: contentType,
            skill_area: skill,
            topic_group: topicGroup,
            difficulty_level: 'intermediate',
            target_score_min: 400,
            target_score_max: 450,
            estimated_minutes: estimatedMinutes,
            pass_score: passScore,
            metadata,
            is_published: true,
        },
        create: {
            cert_type: 'ielts',
            title,
            slug,
            description: `${title} for IELTS adaptive module`,
            content_type: contentType,
            skill_area: skill,
            topic_group: topicGroup,
            difficulty_level: 'intermediate',
            target_score_min: 400,
            target_score_max: 450,
            estimated_minutes: estimatedMinutes,
            pass_score: passScore,
            tags: ['ielts', skill, contentType, 'band-4.0-4.5'],
            metadata,
            is_published: true,
        },
    });
}

async function upsertItemWithOptions(repositoryId, itemOrder, stem, explanation) {
    const item = await prisma.learningRepositoryItem.upsert({
        where: {
            repository_id_item_order: {
                repository_id: repositoryId,
                item_order: itemOrder,
            },
        },
        update: {
            item_type: 'single_choice',
            stem,
            explanation,
            difficulty_level: 'intermediate',
            score_weight: 1,
            estimated_seconds: 60,
            metadata: {
                errorType: 'skimming',
                severity: 2,
            },
        },
        create: {
            repository_id: repositoryId,
            item_order: itemOrder,
            item_type: 'single_choice',
            stem,
            explanation,
            difficulty_level: 'intermediate',
            score_weight: 1,
            estimated_seconds: 60,
            metadata: {
                errorType: 'skimming',
                severity: 2,
            },
        },
    });

    const options = [
        { key: 'A', text: 'Option A', isCorrect: true, rationale: 'Correct option.' },
        { key: 'B', text: 'Option B', isCorrect: false, rationale: 'Distractor option.' },
        { key: 'C', text: 'Option C', isCorrect: false, rationale: 'Distractor option.' },
        { key: 'D', text: 'Option D', isCorrect: false, rationale: 'Distractor option.' },
    ];

    for (let i = 0; i < options.length; i += 1) {
        const option = options[i];
        await prisma.learningRepositoryOption.upsert({
            where: {
                item_id_option_key: {
                    item_id: item.id,
                    option_key: option.key,
                },
            },
            update: {
                option_text: `${option.text} - ${stem.slice(0, 30)}`,
                is_correct: option.isCorrect,
                rationale: option.rationale,
                sort_order: i + 1,
            },
            create: {
                item_id: item.id,
                option_key: option.key,
                option_text: `${option.text} - ${stem.slice(0, 30)}`,
                is_correct: option.isCorrect,
                rationale: option.rationale,
                sort_order: i + 1,
            },
        });
    }
}

async function seedRepositories() {
    for (const skill of SKILLS) {
        const capitalized = `${skill.charAt(0).toUpperCase()}${skill.slice(1)}`;

        const lessonRepo = await upsertRepository({
            title: `${capitalized} - Skimming Basics`,
            slug: `ielts-${skill}-skimming-basics-band-4`,
            contentType: 'lesson',
            skill,
            topicGroup: 'skimming',
            estimatedMinutes: 15,
            passScore: 70,
            metadata: {
                bandMin: 4.0,
                bandMax: 4.5,
                flashcards: [
                    { front: 'Skimming la gi?', back: 'Doc luot de nam y chinh cua doan.' },
                    { front: 'Scanning la gi?', back: 'Doc quet de tim thong tin cu the.' },
                ],
            },
        });

        const practiceRepo = await upsertRepository({
            title: `${capitalized} - Practice Set`,
            slug: `ielts-${skill}-practice-set-band-4`,
            contentType: 'practice_set',
            skill,
            topicGroup: 'foundation',
            estimatedMinutes: 12,
            passScore: 70,
            metadata: { bandMin: 4.0, bandMax: 4.5 },
        });

        const miniTestRepo = await upsertRepository({
            title: `${capitalized} - Mini Test`,
            slug: `ielts-${skill}-mini-test-band-4`,
            contentType: 'mini_test',
            skill,
            topicGroup: 'assessment',
            estimatedMinutes: 15,
            passScore: 70,
            metadata: { bandMin: 4.0, bandMax: 4.5 },
        });

        for (let i = 1; i <= 2; i += 1) {
            await upsertItemWithOptions(
                lessonRepo.id,
                i,
                `${capitalized} concept question ${i}`,
                `Explanation for ${skill} lesson item ${i}`,
            );
        }

        for (let i = 1; i <= 3; i += 1) {
            await upsertItemWithOptions(
                practiceRepo.id,
                i,
                `${capitalized} practice question ${i}`,
                `Explanation for ${skill} practice item ${i}`,
            );
        }

        for (let i = 1; i <= 5; i += 1) {
            await upsertItemWithOptions(
                miniTestRepo.id,
                i,
                `${capitalized} mini-test question ${i}`,
                `Explanation for ${skill} mini-test item ${i}`,
            );
        }

        await prisma.learningRepository.updateMany({
            where: { id: { in: [lessonRepo.id, practiceRepo.id, miniTestRepo.id] } },
            data: { total_items: 5 },
        });

        await prisma.learningRepository.update({
            where: { id: lessonRepo.id },
            data: { total_items: 2 },
        });

        await prisma.learningRepository.update({
            where: { id: practiceRepo.id },
            data: { total_items: 3 },
        });

        await prisma.learningRepository.update({
            where: { id: miniTestRepo.id },
            data: { total_items: 5 },
        });
    }
}

function buildQuestion(skill, idx) {
    return {
        skill,
        subSkillCode: 'skimming',
        questionType: 'single_choice',
        questionText: `${skill.toUpperCase()} adaptive question ${idx}`,
        options: [
            { key: 'A', text: 'Correct option' },
            { key: 'B', text: 'Distractor 1' },
            { key: 'C', text: 'Distractor 2' },
            { key: 'D', text: 'Distractor 3' },
        ],
        correctAnswer: 'A',
        explanation: `Explanation for ${skill} question ${idx}`,
        bandMin: 3.5,
        bandMax: 4.5,
        difficultyWeight: 1.0,
        expectedTimeSec: 60,
        errorTag: '2',
        topicTags: ['skimming'],
        status: 'active',
    };
}

async function upsertIeltsQuestion(data) {
    const existing = await prisma.ieltsQuestion.findFirst({
        where: {
            skill: data.skill,
            questionText: data.questionText,
        },
    });

    if (existing) {
        await prisma.ieltsQuestion.update({
            where: { id: existing.id },
            data,
        });
        return;
    }

    await prisma.ieltsQuestion.create({ data });
}

async function seedIeltsQuestions() {
    const rows = [
        ...Array.from({ length: 6 }, (_, i) => buildQuestion('reading', i + 1)),
        ...Array.from({ length: 6 }, (_, i) => buildQuestion('listening', i + 1)),
        ...Array.from({ length: 4 }, (_, i) => buildQuestion('grammar', i + 1)),
        ...Array.from({ length: 4 }, (_, i) => buildQuestion('vocabulary', i + 1)),
    ];

    for (const row of rows) {
        await upsertIeltsQuestion(row);
    }
}

async function main() {
    console.log('Seeding IELTS Adaptive data...');

    const { account, student } = await upsertTestAccountAndStudent();
    const enrollment = await upsertEnrollment(student.student_id);
    await seedRepositories();
    await seedIeltsQuestions();

    console.log('Done seeding IELTS Adaptive data.');
    console.log(`Account: ${account.email} (account_id=${account.account_id})`);
    console.log(`Student ID: ${student.student_id}`);
    console.log(`Enrollment ID: ${enrollment.id}`);
}

main()
    .catch((error) => {
        console.error('IELTS seed failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
