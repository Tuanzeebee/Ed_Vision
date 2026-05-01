/**
 * seed-reading-professional.cjs
 * 12 câu IELTS Academic Reading chuẩn — 4 passages × 3 câu
 * Band: 3.5 → 7.5 (B1 → C1)
 */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// ─── Passages ────────────────────────────────────────────────────────────────
const PASSAGES = [
  {
    skill: 'reading',
    title: 'Community Recycling Programme',
    content: `The city of Greenfield has launched a new recycling programme to reduce household waste. Residents are asked to separate their rubbish into four categories: paper and cardboard, glass bottles, plastic containers, and general waste. Each category has a different coloured bin — blue for paper, green for glass, yellow for plastic, and black for general waste.

Collection takes place every Tuesday morning. Residents must place their bins on the pavement by 7am. Any bins left out after midday will be removed by the local council.

The programme has already shown positive results. In the first three months, the amount of waste sent to landfill decreased by 23%. The council hopes to achieve a 40% reduction by the end of the year. Residents who wish to learn more can visit the council website or attend one of the free information sessions held at the community centre every second Saturday.`,
    band_min: 3.5, band_max: 4.5,
    topic_tags: ['environment', 'housing'],
    section_type: 1,
  },
  {
    skill: 'reading',
    title: 'The Rise of Remote Work',
    content: `The shift towards remote work, accelerated by global events in the early 2020s, has fundamentally altered the relationship between employers and employees. What began as a temporary measure has, for many organisations, become a permanent fixture of working life.

Proponents of remote work argue that it offers significant benefits for both productivity and employee wellbeing. Research conducted by Stanford University found that remote workers were 13% more productive than their office-based counterparts, largely due to fewer interruptions and a quieter working environment. Furthermore, employees reported higher levels of job satisfaction and lower rates of absenteeism.

However, critics point to the potential drawbacks of long-term remote work. The absence of face-to-face interaction can erode workplace culture and make collaboration more difficult. Junior employees, in particular, may miss out on the informal mentoring that naturally occurs in an office setting. There are also concerns about the blurring of boundaries between professional and personal life, with many remote workers reporting difficulty in "switching off" at the end of the working day.

Despite these concerns, surveys consistently show that the majority of employees who have experienced remote work prefer it to a full-time office arrangement. Hybrid models — combining home and office work — have emerged as the most popular solution, allowing organisations to retain the benefits of both approaches while mitigating the disadvantages of each.`,
    band_min: 4.5, band_max: 5.5,
    topic_tags: ['work', 'technology'],
    section_type: 1,
  },
  {
    skill: 'reading',
    title: 'Urban Heat Islands',
    content: `Cities are significantly warmer than the surrounding rural areas — a phenomenon known as the urban heat island (UHI) effect. This temperature difference, which can reach up to 10°C in some metropolitan areas, arises from a combination of factors unique to urban environments.

The primary driver of the UHI effect is the replacement of natural vegetation with impervious surfaces such as asphalt and concrete. Unlike soil and plants, which absorb and release heat gradually, these materials retain heat efficiently during the day and radiate it slowly at night, preventing temperatures from dropping as they would in rural areas. The geometry of cities also plays a role: tall buildings trap reflected solar radiation between their facades, further elevating ambient temperatures.

Human activities contribute substantially to urban warming. The operation of vehicles, air conditioning systems, and industrial processes releases considerable quantities of waste heat directly into the urban atmosphere. Paradoxically, the widespread use of air conditioning — itself a response to urban heat — exacerbates the problem by expelling heat from buildings into already warm streets.

The consequences of the UHI effect extend beyond mere discomfort. Elevated temperatures increase energy consumption, strain public health systems during heatwaves, and degrade air quality by accelerating the formation of ground-level ozone. Vulnerable populations, including the elderly and those without access to cooling, face the greatest risks.

Urban planners are increasingly turning to nature-based solutions to combat the UHI effect. The strategic planting of trees and green roofs can reduce surface temperatures through evapotranspiration and shading. Light-coloured pavements and roofing materials reflect more solar radiation than their darker counterparts, reducing heat absorption. While no single intervention is sufficient, a combination of these strategies can meaningfully reduce urban temperatures and improve the liveability of cities for all residents.`,
    band_min: 5.5, band_max: 6.5,
    topic_tags: ['environment', 'housing', 'science'],
    section_type: 2,
  },
  {
    skill: 'reading',
    title: 'The Paradox of Choice',
    content: `Contemporary consumer culture is built on the premise that more choice is invariably better — that an abundance of options empowers individuals to select precisely what suits their needs and preferences. Yet a growing body of psychological research challenges this assumption, suggesting that an excess of choice can paradoxically lead to diminished satisfaction and impaired decision-making.

Psychologist Barry Schwartz, in his influential work on the subject, distinguishes between two types of decision-makers: "maximisers," who seek the objectively best option available, and "satisficers," who settle for an option that meets a sufficient threshold of acceptability. His research demonstrates that maximisers, despite typically making objectively better choices, consistently report lower levels of satisfaction than satisficers. The explanation lies in the phenomenon of opportunity cost: when numerous alternatives exist, selecting one necessarily means forgoing all others, and awareness of these foregone options diminishes the pleasure derived from the chosen one.

The proliferation of choice also increases the cognitive burden associated with decision-making. When faced with an overwhelming number of options, individuals may experience what researchers call "choice overload" — a state of decision fatigue that can result in either poor choices or a complete avoidance of the decision altogether. A now-classic study by Iyengar and Lepper demonstrated this effect in a supermarket setting: shoppers were more likely to purchase jam when presented with six varieties than when offered twenty-four, despite the larger selection initially attracting more interest.

These findings have significant implications for designers, policymakers, and businesses. Counterintuitively, reducing the number of options available to consumers may enhance their overall experience and increase the likelihood of purchase. This principle, sometimes called "curation," is increasingly employed by retailers and digital platforms seeking to manage the paradox of choice. However, the optimal number of choices varies considerably across contexts and individuals, and the challenge lies in identifying the point at which additional options begin to impede rather than facilitate decision-making.`,
    band_min: 6.5, band_max: 7.5,
    topic_tags: ['science', 'academic', 'economy'],
    section_type: 3,
  },
]

// ─── Questions keyed by passage title ────────────────────────────────────────
const QUESTIONS_BY_PASSAGE = {
  'Community Recycling Programme': [
    {
      sub_skill_code: 'detail', question_type: 'true_false_ng', question_order: 1,
      question_text: `Read the passage "Community Recycling Programme" and answer:

Statement: Residents must put their bins outside before 7am on Tuesday.`,
      options: JSON.stringify(['True', 'False', 'Not Given']),
      correct_answer: 'True',
      explanation: 'Passage states: "Collection takes place every Tuesday morning. Residents must place their bins on the pavement by 7am." → True.',
      band_min: 3.5, band_max: 4.5, expected_time_sec: 75,
      error_tag: 'detail', topic_tags: ['environment', 'housing'],
      irt_a: 1.0, irt_b: -2.45, irt_c: 0.33,
    },
    {
      sub_skill_code: 'detail', question_type: 'true_false_ng', question_order: 2,
      question_text: `Read the passage "Community Recycling Programme" and answer:

Statement: The recycling programme is the most successful environmental initiative in Greenfield's history.`,
      options: JSON.stringify(['True', 'False', 'Not Given']),
      correct_answer: 'Not Given',
      explanation: 'The passage mentions 23% reduction in landfill waste but makes no comparison to other initiatives → Not Given.',
      band_min: 4.0, band_max: 5.0, expected_time_sec: 75,
      error_tag: 'paraphrase_recognition', topic_tags: ['environment'],
      irt_a: 1.2, irt_b: -1.91, irt_c: 0.33,
    },
    {
      sub_skill_code: 'detail', question_type: 'mcq', question_order: 3,
      question_text: `Read the passage "Community Recycling Programme" and answer:

According to the passage, what is the council's target for waste reduction by the end of the year?`,
      options: JSON.stringify(['A. 23%', 'B. 30%', 'C. 40%', 'D. 50%']),
      correct_answer: 'C',
      explanation: 'Passage: "The council hopes to achieve a 40% reduction by the end of the year."',
      band_min: 3.5, band_max: 4.5, expected_time_sec: 60,
      error_tag: 'detail', topic_tags: ['environment'],
      irt_a: 1.0, irt_b: -2.50, irt_c: 0.25,
    },
  ],
  'The Rise of Remote Work': [
    {
      sub_skill_code: 'main_idea', question_type: 'mcq', question_order: 1,
      question_text: `Read the passage "The Rise of Remote Work" and answer:

What is the main purpose of this passage?`,
      options: JSON.stringify([
        'A. To argue that remote work is superior to office work',
        'B. To present a balanced overview of the advantages and disadvantages of remote work',
        'C. To explain why companies should require employees to work from offices',
        'D. To describe the history of remote work before the 2020s',
      ]),
      correct_answer: 'B',
      explanation: 'The passage presents benefits (productivity, satisfaction) and drawbacks (isolation, mentoring gap) → balanced overview.',
      band_min: 4.5, band_max: 5.5, expected_time_sec: 70,
      error_tag: 'main_idea', topic_tags: ['work', 'technology'],
      irt_a: 1.3, irt_b: -1.36, irt_c: 0.25,
    },
    {
      sub_skill_code: 'inference', question_type: 'mcq', question_order: 2,
      question_text: `Read the passage "The Rise of Remote Work" and answer:

What does the writer imply about junior employees who work remotely?`,
      options: JSON.stringify([
        'A. They are more productive than senior employees',
        'B. They prefer remote work to office work',
        'C. They may develop more slowly professionally without informal guidance',
        'D. They find it easier to separate work and personal life',
      ]),
      correct_answer: 'C',
      explanation: 'Passage: junior employees "may miss out on the informal mentoring that naturally occurs in an office setting" → slower professional development.',
      band_min: 5.0, band_max: 6.0, expected_time_sec: 65,
      error_tag: 'inference', topic_tags: ['work'],
      irt_a: 1.5, irt_b: -0.82, irt_c: 0.25,
    },
    {
      sub_skill_code: 'paraphrase_recognition', question_type: 'true_false_ng', question_order: 3,
      question_text: `Read the passage "The Rise of Remote Work" and answer:

Statement: The Stanford University study found that remote workers took fewer sick days than office workers.`,
      options: JSON.stringify(['True', 'False', 'Not Given']),
      correct_answer: 'Not Given',
      explanation: 'Stanford study cited for productivity (13% more productive). Absenteeism mentioned separately — sick days specifically not stated → Not Given.',
      band_min: 5.0, band_max: 5.5, expected_time_sec: 70,
      error_tag: 'paraphrase_recognition', topic_tags: ['work'],
      irt_a: 1.4, irt_b: -1.09, irt_c: 0.33,
    },
  ],
  'Urban Heat Islands': [
    {
      sub_skill_code: 'inference', question_type: 'mcq', question_order: 1,
      question_text: `Read the passage "Urban Heat Islands" and answer:

According to the passage, why does widespread air conditioning use worsen the urban heat island effect?`,
      options: JSON.stringify([
        'A. It increases the number of vehicles on the road',
        'B. It replaces natural vegetation with concrete',
        'C. It releases heat from buildings into the surrounding air',
        'D. It reduces the reflectivity of urban surfaces',
      ]),
      correct_answer: 'C',
      explanation: 'Passage: air conditioning "exacerbates the problem by expelling heat from buildings into already warm streets" → C.',
      band_min: 5.5, band_max: 6.5, expected_time_sec: 65,
      error_tag: 'inference', topic_tags: ['environment', 'science'],
      irt_a: 1.6, irt_b: -0.27, irt_c: 0.25,
    },
    {
      sub_skill_code: 'writers_opinion', question_type: 'mcq', question_order: 2,
      question_text: `Read the passage "Urban Heat Islands" and answer:

What is the writer's view on nature-based solutions to the urban heat island effect?`,
      options: JSON.stringify([
        'A. They are ineffective compared to technological solutions',
        'B. A single nature-based intervention is sufficient to solve the problem',
        'C. A combination of nature-based strategies can make a meaningful difference',
        'D. They are too expensive for most cities to implement',
      ]),
      correct_answer: 'C',
      explanation: 'Passage: "While no single intervention is sufficient, a combination of these strategies can meaningfully reduce urban temperatures." → C.',
      band_min: 6.0, band_max: 7.0, expected_time_sec: 60,
      error_tag: 'writers_opinion', topic_tags: ['environment'],
      irt_a: 1.7, irt_b: 0.27, irt_c: 0.25,
    },
    {
      sub_skill_code: 'vocab_in_context', question_type: 'mcq', question_order: 3,
      question_text: `Read the passage "Urban Heat Islands" and answer:

In the context of the passage, the word "exacerbates" (paragraph 3) most closely means:`,
      options: JSON.stringify(['A. reduces', 'B. explains', 'C. worsens', 'D. prevents']),
      correct_answer: 'C',
      explanation: '"Exacerbates" = makes a problem worse. Context: air conditioning "exacerbates the problem" of urban heat → worsens.',
      band_min: 5.5, band_max: 6.5, expected_time_sec: 55,
      error_tag: 'vocab_in_context', topic_tags: ['environment', 'academic'],
      irt_a: 1.6, irt_b: -0.27, irt_c: 0.25,
    },
  ],
  'The Paradox of Choice': [
    {
      sub_skill_code: 'inference', question_type: 'mcq', question_order: 1,
      question_text: `Read the passage "The Paradox of Choice" and answer:

What does the research on "maximisers" and "satisficers" suggest about the relationship between objective quality of choice and personal satisfaction?`,
      options: JSON.stringify([
        'A. Better choices always lead to greater satisfaction',
        'B. People who make the best possible choices tend to be less satisfied than those who make merely acceptable ones',
        'C. Satisficers make objectively worse decisions but do not notice the difference',
        'D. The number of choices available does not affect satisfaction levels',
      ]),
      correct_answer: 'B',
      explanation: 'Passage: maximisers "consistently report lower levels of satisfaction than satisficers" despite "typically making objectively better choices" → B.',
      band_min: 6.5, band_max: 7.5, expected_time_sec: 60,
      error_tag: 'inference', topic_tags: ['science', 'academic'],
      irt_a: 1.9, irt_b: 1.36, irt_c: 0.25,
    },
    {
      sub_skill_code: 'writers_opinion', question_type: 'mcq', question_order: 2,
      question_text: `Read the passage "The Paradox of Choice" and answer:

The writer's attitude towards the idea that "more choice is invariably better" is best described as:`,
      options: JSON.stringify([
        'A. Strongly supportive',
        'B. Sceptical, based on psychological evidence',
        'C. Uncertain and inconclusive',
        'D. Dismissive without providing evidence',
      ]),
      correct_answer: 'B',
      explanation: 'The writer challenges the premise with multiple psychological studies. Attitude = sceptical + evidence-based → B.',
      band_min: 7.0, band_max: 7.5, expected_time_sec: 55,
      error_tag: 'writers_opinion', topic_tags: ['science', 'academic'],
      irt_a: 2.0, irt_b: 1.64, irt_c: 0.25,
    },
    {
      sub_skill_code: 'vocab_in_context', question_type: 'mcq', question_order: 3,
      question_text: `Read the passage "The Paradox of Choice" and answer:

In the final paragraph, the word "curation" is used to describe a business strategy. Based on the context, what does this strategy involve?`,
      options: JSON.stringify([
        'A. Increasing the number of products available to consumers',
        'B. Deliberately limiting the range of options offered to consumers',
        'C. Allowing consumers to create their own product ranges',
        'D. Researching consumer preferences before launching products',
      ]),
      correct_answer: 'B',
      explanation: 'Context: "reducing the number of options...may enhance experience" → "This principle, sometimes called curation." → deliberately limiting options → B.',
      band_min: 6.5, band_max: 7.5, expected_time_sec: 55,
      error_tag: 'vocab_in_context', topic_tags: ['economy', 'academic'],
      irt_a: 1.9, irt_b: 1.36, irt_c: 0.25,
    },
  ],
}

// ─── Runner ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== Seeding READING — 4 Passages × 3 Questions ===\\n')

  let passagesInserted = 0, questionsInserted = 0, skipped = 0

  for (const passage of PASSAGES) {
    // Idempotent: skip if passage already exists
    const existing = await prisma.$queryRawUnsafe(
      `SELECT id FROM ielts_passages WHERE title = $1 LIMIT 1`,
      passage.title
    )

    let passageId
    if (existing.length > 0) {
      passageId = existing[0].id
      console.log(`  PASSAGE SKIP (exists): "${passage.title}"`)
      skipped++
    } else {
      const inserted = await prisma.$queryRawUnsafe(`
        INSERT INTO ielts_passages (
          skill, title, content, band_min, band_max,
          topic_tags, section_type, is_ai_generated, is_paraphrased, status
        ) VALUES ($1, $2, $3, $4, $5, $6::text[], $7, false, false, 'approved')
        RETURNING id
      `,
        passage.skill,
        passage.title,
        passage.content,
        passage.band_min,
        passage.band_max,
        `{${passage.topic_tags.map(t => `"${t}"`).join(',')}}`,
        passage.section_type,
      )
      passageId = inserted[0].id
      console.log(`  PASSAGE INSERT: "${passage.title}" (band ${passage.band_min}–${passage.band_max}) → id=${passageId}`)
      passagesInserted++
    }

    // Insert questions for this passage
    const questions = QUESTIONS_BY_PASSAGE[passage.title] || []
    for (const q of questions) {
      const qExisting = await prisma.$queryRawUnsafe(
        `SELECT id FROM ielts_questions WHERE question_text = $1 LIMIT 1`,
        q.question_text
      )
      if (qExisting.length > 0) {
        console.log(`    Q SKIP: order ${q.question_order} (exists)`)
        skipped++
        continue
      }

      await prisma.$executeRawUnsafe(`
        INSERT INTO ielts_questions (
          skill, sub_skill_code, question_type, question_text,
          options, correct_answer, explanation,
          passage_id, question_order, context_type,
          band_min, band_max, difficulty_weight, expected_time_sec,
          error_tag, topic_tags,
          irt_a, irt_b, irt_c,
          is_placement, status, is_ai_generated
        ) VALUES (
          'reading', $1, $2, $3,
          $4::jsonb, $5, $6,
          $7::uuid, $8, 'passage',
          $9, $10, 1.0, $11,
          $12, $13::text[],
          $14, $15, $16,
          true, 'approved', false
        )
      `,
        q.sub_skill_code, q.question_type, q.question_text,
        q.options, q.correct_answer, q.explanation,
        passageId, q.question_order,
        q.band_min, q.band_max, q.expected_time_sec,
        q.error_tag,
        `{${q.topic_tags.map(t => `"${t}"`).join(',')}}`,
        q.irt_a, q.irt_b, q.irt_c,
      )
      console.log(`    Q INSERT: band ${q.band_min}–${q.band_max} [${q.question_type}] order=${q.question_order}`)
      questionsInserted++
    }
    console.log()
  }

  // ── Summary ──
  console.log(`Done! Passages: +${passagesInserted} | Questions: +${questionsInserted} | Skipped: ${skipped}`)

  const pool = await prisma.$queryRawUnsafe(`
    SELECT
      q.skill,
      LEFT(p.title, 35) AS passage,
      q.question_type,
      q.band_min,
      q.band_max,
      ROUND(q.irt_b::numeric, 2) AS irt_b
    FROM ielts_questions q
    LEFT JOIN ielts_passages p ON q.passage_id = p.id
    WHERE q.skill = 'reading' AND q.is_placement = true AND q.status = 'approved'
    ORDER BY q.irt_b ASC
  `)
  console.log('\\n=== Reading placement pool ===')
  console.table(pool)
}

main().catch(console.error).finally(() => prisma.$disconnect())
