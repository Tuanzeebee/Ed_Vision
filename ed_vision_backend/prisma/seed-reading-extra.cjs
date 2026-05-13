/**
 * seed-reading-extra.cjs
 * ------------------------------------------------------------
 * +20 câu IELTS Reading bổ sung — TĂNG CƯỜNG band thấp để fix lỗi
 *   "Pool placement không đủ câu cho theta=-3.00, skills=reading"
 *
 * Phân bố irt_b:
 *   -3.20 → -2.50  (8 câu)  ← band 3.0–4.0  (vùng theta=-3)
 *   -2.40 → -1.50  (4 câu)  ← band 4.0–4.5
 *   -1.40 → -0.50  (4 câu)  ← band 4.5–5.5
 *   -0.40 → +0.80  (2 câu)  ← band 5.5–6.5
 *    +1.00 → +1.80 (2 câu)  ← band 6.5–7.5
 *
 * Tất cả đều standalone (passage được embed trong question_text), không
 * cần row trong ielts_passages.
 *
 * Chạy:  node prisma/seed-reading-extra.cjs
 * ------------------------------------------------------------
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const QUESTIONS = [
    // ── Band 3.0–4.0  (irt_b ≈ -3.2 → -2.5) ──────────────────────
    {
        sub_skill_code: 'detail', question_type: 'mcq',
        question_text: `[PASSAGE] "The shop is open from Monday to Friday, 9am to 6pm. It is closed on Sundays."

Question: When is the shop closed?`,
        options: JSON.stringify(['A. Saturday', 'B. Sunday', 'C. Monday', 'D. Friday']),
        correct_answer: 'B',
        explanation: 'Passage: "It is closed on Sundays."',
        band_min: 3.0, band_max: 4.0, expected_time_sec: 50,
        error_tag: 'detail', topic_tags: ['daily_life'],
        irt_a: 0.9, irt_b: -3.20, irt_c: 0.25,
    },
    {
        sub_skill_code: 'detail', question_type: 'true_false_ng',
        question_text: `[PASSAGE] "Tom has two cats and one dog. He walks his dog every morning."

Statement: Tom has three pets in total.`,
        options: JSON.stringify(['True', 'False', 'Not Given']),
        correct_answer: 'True',
        explanation: '2 cats + 1 dog = 3 pets → True.',
        band_min: 3.0, band_max: 4.0, expected_time_sec: 50,
        error_tag: 'detail', topic_tags: ['daily_life'],
        irt_a: 1.0, irt_b: -3.00, irt_c: 0.33,
    },
    {
        sub_skill_code: 'detail', question_type: 'mcq',
        question_text: `[PASSAGE] "The bus to the airport leaves every 20 minutes. The journey takes about 45 minutes."

Question: How often does the bus leave?`,
        options: JSON.stringify(['A. Every 20 minutes', 'B. Every 45 minutes', 'C. Every hour', 'D. Twice a day']),
        correct_answer: 'A',
        explanation: 'Passage: "leaves every 20 minutes".',
        band_min: 3.0, band_max: 4.0, expected_time_sec: 55,
        error_tag: 'detail', topic_tags: ['travel'],
        irt_a: 1.0, irt_b: -2.90, irt_c: 0.25,
    },
    {
        sub_skill_code: 'detail', question_type: 'mcq',
        question_text: `[PASSAGE] "Anna lives in London. She works as a nurse at a small hospital near her home."

Question: What is Anna's job?`,
        options: JSON.stringify(['A. Doctor', 'B. Teacher', 'C. Nurse', 'D. Student']),
        correct_answer: 'C',
        explanation: 'Passage: "She works as a nurse".',
        band_min: 3.0, band_max: 4.0, expected_time_sec: 50,
        error_tag: 'detail', topic_tags: ['work'],
        irt_a: 0.9, irt_b: -2.80, irt_c: 0.25,
    },
    {
        sub_skill_code: 'detail', question_type: 'true_false_ng',
        question_text: `[PASSAGE] "The library has 50,000 books. Members can borrow up to 5 books at a time for two weeks."

Statement: Members can keep borrowed books for one month.`,
        options: JSON.stringify(['True', 'False', 'Not Given']),
        correct_answer: 'False',
        explanation: 'Passage: "for two weeks", not one month → False.',
        band_min: 3.5, band_max: 4.5, expected_time_sec: 60,
        error_tag: 'detail', topic_tags: ['education'],
        irt_a: 1.0, irt_b: -2.70, irt_c: 0.33,
    },
    {
        sub_skill_code: 'detail', question_type: 'mcq',
        question_text: `[PASSAGE] "Mark cooked dinner for his family last night. He made pasta and salad. Everyone enjoyed the meal."

Question: What did Mark cook?`,
        options: JSON.stringify(['A. Pizza and soup', 'B. Pasta and salad', 'C. Rice and chicken', 'D. Bread and cheese']),
        correct_answer: 'B',
        explanation: 'Passage: "He made pasta and salad."',
        band_min: 3.5, band_max: 4.5, expected_time_sec: 50,
        error_tag: 'detail', topic_tags: ['daily_life'],
        irt_a: 1.0, irt_b: -2.60, irt_c: 0.25,
    },
    {
        sub_skill_code: 'detail', question_type: 'true_false_ng',
        question_text: `[PASSAGE] "The new sports centre opens at 6am on weekdays and 8am at weekends. The swimming pool closes one hour before the centre."

Statement: The swimming pool closes at the same time as the sports centre.`,
        options: JSON.stringify(['True', 'False', 'Not Given']),
        correct_answer: 'False',
        explanation: 'Pool closes "one hour before" the centre → False.',
        band_min: 3.5, band_max: 4.5, expected_time_sec: 60,
        error_tag: 'paraphrase_recognition', topic_tags: ['health'],
        irt_a: 1.1, irt_b: -2.55, irt_c: 0.33,
    },
    {
        sub_skill_code: 'detail', question_type: 'mcq',
        question_text: `[PASSAGE] "Sarah travelled to Paris by train. The trip took three hours and was very comfortable."

Question: How did Sarah travel to Paris?`,
        options: JSON.stringify(['A. By plane', 'B. By car', 'C. By train', 'D. By bus']),
        correct_answer: 'C',
        explanation: 'Passage: "travelled to Paris by train".',
        band_min: 3.5, band_max: 4.5, expected_time_sec: 50,
        error_tag: 'detail', topic_tags: ['travel'],
        irt_a: 1.0, irt_b: -2.50, irt_c: 0.25,
    },

    // ── Band 4.0–4.5  (irt_b ≈ -2.4 → -1.5) ──────────────────────
    {
        sub_skill_code: 'main_idea', question_type: 'mcq',
        question_text: `[PASSAGE] "Bicycles have become a popular form of transport in many cities. They are cheap, do not pollute the air, and help people stay healthy. Many cities now have special lanes for cyclists to make riding safer."

Question: What is the main idea of the passage?`,
        options: JSON.stringify([
            'A. Bicycles are dangerous in cities.',
            'B. Cycling has several benefits and is increasingly supported.',
            'C. Cars are better than bicycles.',
            'D. Special lanes are expensive to build.',
        ]),
        correct_answer: 'B',
        explanation: 'Passage lists benefits + mentions infrastructure support.',
        band_min: 4.0, band_max: 5.0, expected_time_sec: 65,
        error_tag: 'main_idea', topic_tags: ['environment', 'travel'],
        irt_a: 1.1, irt_b: -2.20, irt_c: 0.25,
    },
    {
        sub_skill_code: 'detail', question_type: 'true_false_ng',
        question_text: `[PASSAGE] "The museum is free to enter every Sunday. On other days, adults pay £10 and children under 12 pay £5. Students with a valid ID get a 50% discount."

Statement: Children under 12 pay nothing on Sundays.`,
        options: JSON.stringify(['True', 'False', 'Not Given']),
        correct_answer: 'True',
        explanation: '"Free to enter every Sunday" applies to everyone, including children.',
        band_min: 4.0, band_max: 5.0, expected_time_sec: 65,
        error_tag: 'paraphrase_recognition', topic_tags: ['education'],
        irt_a: 1.2, irt_b: -1.90, irt_c: 0.33,
    },
    {
        sub_skill_code: 'detail', question_type: 'mcq',
        question_text: `[PASSAGE] "Online shopping has changed the way many people buy products. It saves time, offers a wider choice, and is often cheaper than shopping in stores. However, customers cannot see or touch the products before buying."

Question: According to the passage, what is a disadvantage of online shopping?`,
        options: JSON.stringify([
            'A. It is more expensive than shopping in stores.',
            'B. It takes more time than going to a store.',
            'C. Customers cannot examine the products before buying.',
            'D. There is less variety than in physical stores.',
        ]),
        correct_answer: 'C',
        explanation: 'Passage: "customers cannot see or touch the products before buying".',
        band_min: 4.0, band_max: 5.0, expected_time_sec: 70,
        error_tag: 'detail', topic_tags: ['technology', 'economy'],
        irt_a: 1.2, irt_b: -1.70, irt_c: 0.25,
    },
    {
        sub_skill_code: 'paraphrase_recognition', question_type: 'true_false_ng',
        question_text: `[PASSAGE] "The school has decided to extend its summer holiday by one week. Lessons will now restart on the 8th of September instead of the 1st."

Statement: The summer holiday will be longer than usual this year.`,
        options: JSON.stringify(['True', 'False', 'Not Given']),
        correct_answer: 'True',
        explanation: '"Extend by one week" = longer than usual.',
        band_min: 4.5, band_max: 5.5, expected_time_sec: 65,
        error_tag: 'paraphrase_recognition', topic_tags: ['education'],
        irt_a: 1.3, irt_b: -1.55, irt_c: 0.33,
    },

    // ── Band 4.5–5.5  (irt_b ≈ -1.4 → -0.5) ──────────────────────
    {
        sub_skill_code: 'inference', question_type: 'mcq',
        question_text: `[PASSAGE] "Recent studies suggest that drinking coffee in moderation may have several health benefits, including a reduced risk of certain diseases. However, drinking too much coffee can cause sleep problems and increase anxiety."

Question: What can be inferred about coffee?`,
        options: JSON.stringify([
            'A. Coffee should be avoided completely.',
            'B. The effects of coffee depend on how much is consumed.',
            'C. Coffee has no health benefits.',
            'D. Everyone should drink coffee daily.',
        ]),
        correct_answer: 'B',
        explanation: 'Moderate = benefits; too much = harms → effects depend on quantity.',
        band_min: 4.5, band_max: 5.5, expected_time_sec: 70,
        error_tag: 'inference', topic_tags: ['health'],
        irt_a: 1.3, irt_b: -1.20, irt_c: 0.25,
    },
    {
        sub_skill_code: 'vocab_in_context', question_type: 'mcq',
        question_text: `[PASSAGE] "Despite the heavy rain, the outdoor concert proceeded as planned, and the audience remained enthusiastic throughout the performance."

Question: The word "proceeded" most nearly means:`,
        options: JSON.stringify(['A. continued', 'B. cancelled', 'C. delayed', 'D. ended']),
        correct_answer: 'A',
        explanation: '"Proceeded as planned" = continued as planned.',
        band_min: 5.0, band_max: 6.0, expected_time_sec: 60,
        error_tag: 'vocab_in_context', topic_tags: ['daily_life', 'academic'],
        irt_a: 1.4, irt_b: -0.90, irt_c: 0.25,
    },
    {
        sub_skill_code: 'detail', question_type: 'true_false_ng',
        question_text: `[PASSAGE] "Solar panels installed on rooftops can generate enough electricity to power an average household. Although the initial installation cost is high, owners typically recover their investment within seven to ten years through reduced electricity bills."

Statement: Solar panels are expensive to install.`,
        options: JSON.stringify(['True', 'False', 'Not Given']),
        correct_answer: 'True',
        explanation: '"The initial installation cost is high" = expensive.',
        band_min: 4.5, band_max: 5.5, expected_time_sec: 70,
        error_tag: 'paraphrase_recognition', topic_tags: ['environment', 'science'],
        irt_a: 1.3, irt_b: -0.70, irt_c: 0.33,
    },
    {
        sub_skill_code: 'inference', question_type: 'mcq',
        question_text: `[PASSAGE] "The company reported record profits in the third quarter, largely due to increased demand for its products in emerging markets. Nevertheless, executives warned that supply chain disruptions could pose challenges in the coming months."

Question: What is the company's outlook for the near future?`,
        options: JSON.stringify([
            'A. Entirely optimistic — profits will continue to rise.',
            'B. Cautiously optimistic — growth is strong but risks remain.',
            'C. Very pessimistic — the company expects losses.',
            'D. Uncertain because no information is given.',
        ]),
        correct_answer: 'B',
        explanation: 'Record profits + warning about disruptions → cautiously optimistic.',
        band_min: 5.0, band_max: 6.0, expected_time_sec: 70,
        error_tag: 'inference', topic_tags: ['economy', 'work'],
        irt_a: 1.5, irt_b: -0.55, irt_c: 0.25,
    },

    // ── Band 5.5–6.5  (irt_b ≈ -0.4 → +0.8) ──────────────────────
    {
        sub_skill_code: 'writers_opinion', question_type: 'mcq',
        question_text: `[PASSAGE] "While renewable energy is often praised as the answer to climate change, sceptics argue that current technologies cannot yet fully replace fossil fuels at scale. The truth, as with most complex issues, lies somewhere in between: renewables are essential, but a complete transition will require both technological breakthroughs and significant policy support."

Question: What is the writer's view?`,
        options: JSON.stringify([
            'A. Renewable energy is the only solution.',
            'B. Renewable energy will never replace fossil fuels.',
            'C. Renewable energy is necessary but not yet sufficient on its own.',
            'D. Policy support is more important than technology.',
        ]),
        correct_answer: 'C',
        explanation: '"Essential, but a complete transition will require…" = necessary but not sufficient.',
        band_min: 5.5, band_max: 6.5, expected_time_sec: 70,
        error_tag: 'writers_opinion', topic_tags: ['environment', 'science'],
        irt_a: 1.6, irt_b: -0.10, irt_c: 0.25,
    },
    {
        sub_skill_code: 'inference', question_type: 'true_false_ng',
        question_text: `[PASSAGE] "Although the new policy was introduced with the intention of reducing traffic congestion, early data indicates that vehicle numbers in the city centre have only marginally declined. Critics suggest that without complementary measures such as improved public transport, the policy is unlikely to achieve its objectives."

Statement: The policy has completely failed to reduce traffic.`,
        options: JSON.stringify(['True', 'False', 'Not Given']),
        correct_answer: 'False',
        explanation: '"Marginally declined" = some reduction, not a complete failure → False.',
        band_min: 6.0, band_max: 7.0, expected_time_sec: 70,
        error_tag: 'paraphrase_recognition', topic_tags: ['housing', 'travel'],
        irt_a: 1.7, irt_b: 0.55, irt_c: 0.33,
    },

    // ── Band 6.5–7.5  (irt_b ≈ +1.0 → +1.8) ──────────────────────
    {
        sub_skill_code: 'writers_opinion', question_type: 'mcq',
        question_text: `[PASSAGE] "Proponents of artificial intelligence in education contend that adaptive learning systems can personalise instruction at a scale impossible for human teachers. Critics, however, caution that such systems risk reducing pedagogy to data optimisation, neglecting the relational and motivational dimensions of learning that no algorithm can fully replicate."

Question: What is the implied position of the writer?`,
        options: JSON.stringify([
            'A. AI in education is wholly beneficial and should be adopted widely.',
            'B. AI tools and human teachers offer different, complementary strengths.',
            'C. AI in education is fundamentally flawed and should be rejected.',
            'D. The author refuses to take any position on the issue.',
        ]),
        correct_answer: 'B',
        explanation: 'Presenting both sides without endorsing either implies a balanced/complementary view.',
        band_min: 6.5, band_max: 7.5, expected_time_sec: 75,
        error_tag: 'writers_opinion', topic_tags: ['technology', 'education', 'academic'],
        irt_a: 1.8, irt_b: 1.20, irt_c: 0.25,
    },
    {
        sub_skill_code: 'vocab_in_context', question_type: 'mcq',
        question_text: `[PASSAGE] "The minister's response to the journalist's question was decidedly equivocal — neither confirming nor denying the allegations, and leaving observers uncertain as to the government's true position."

Question: The word "equivocal" most nearly means:`,
        options: JSON.stringify(['A. ambiguous', 'B. enthusiastic', 'C. straightforward', 'D. furious']),
        correct_answer: 'A',
        explanation: '"Neither confirming nor denying" = deliberately unclear = ambiguous = equivocal.',
        band_min: 7.0, band_max: 8.0, expected_time_sec: 70,
        error_tag: 'vocab_in_context', topic_tags: ['academic', 'media'],
        irt_a: 1.9, irt_b: 1.75, irt_c: 0.25,
    },
];

async function main() {
    console.log('=== Seeding READING EXTRA — 20 standalone questions ===\n');

    let inserted = 0;
    let skipped = 0;

    for (const q of QUESTIONS) {
        const existing = await prisma.$queryRawUnsafe(
            'SELECT id FROM ielts_questions WHERE question_text = $1 LIMIT 1',
            q.question_text,
        );
        if (existing.length > 0) {
            skipped++;
            continue;
        }

        await prisma.$executeRawUnsafe(
            `
            INSERT INTO ielts_questions (
              skill, sub_skill_code, question_type, question_text,
              options, correct_answer, explanation,
              band_min, band_max, difficulty_weight, expected_time_sec,
              error_tag, topic_tags,
              irt_a, irt_b, irt_c,
              is_placement, status, is_ai_generated
            ) VALUES (
              'reading', $1, $2, $3,
              $4::jsonb, $5, $6,
              $7, $8, 1.0, $9,
              $10, $11::text[],
              $12, $13, $14,
              true, 'approved', false
            )
            `,
            q.sub_skill_code, q.question_type, q.question_text,
            q.options, q.correct_answer, q.explanation,
            q.band_min, q.band_max, q.expected_time_sec,
            q.error_tag,
            `{${q.topic_tags.map((t) => `"${t}"`).join(',')}}`,
            q.irt_a, q.irt_b, q.irt_c,
        );
        console.log(
            `✅ band ${q.band_min}-${q.band_max} | irt_b=${q.irt_b.toFixed(2)} | ${q.question_type} | ${q.question_text.slice(0, 50).replace(/\n/g, ' ')}…`,
        );
        inserted++;
    }

    console.log(`\nInserted: ${inserted} | Skipped (existed): ${skipped}\n`);

    const pool = await prisma.$queryRawUnsafe(`
        SELECT
            COUNT(*) FILTER (WHERE irt_b <= -2.0)::int  AS very_low,
            COUNT(*) FILTER (WHERE irt_b > -2.0 AND irt_b <= -1.0)::int AS low,
            COUNT(*) FILTER (WHERE irt_b > -1.0 AND irt_b <=  0.0)::int AS mid_low,
            COUNT(*) FILTER (WHERE irt_b >  0.0 AND irt_b <=  1.0)::int AS mid_high,
            COUNT(*) FILTER (WHERE irt_b >  1.0)::int                   AS high,
            COUNT(*)::int                                              AS total
        FROM ielts_questions
        WHERE skill = 'reading'
          AND is_placement = true
          AND status = 'approved'
          AND irt_b IS NOT NULL
    `);
    console.log('=== Reading placement pool theo dải irt_b ===');
    console.table(pool);
}

main()
    .catch((e) => {
        console.error('❌', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
