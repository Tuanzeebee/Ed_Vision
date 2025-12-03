const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding surveys...');

  // Try to attach to an admin account if present
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@dtu.edu.vn';
  const admin = await prisma.account.findUnique({ where: { email: adminEmail } }).catch(() => null);
  const createdBy = admin ? admin.account_id : null;

  // Helper: create question if not exists
  async function upsertQuestion(text, type = 'single-choice', category = null, isRequired = true) {
    const existing = await prisma.surveyQuestion.findFirst({ where: { question_text: text } });
    if (existing) return existing;
    return prisma.surveyQuestion.create({ data: { question_text: text, question_type: type, category, is_active: true } });
  }

  // Helper: create option if not exists
  async function upsertOption(questionId, text, value = null) {
    const existing = await prisma.surveyOption.findFirst({ where: { question_id: questionId, option_text: text } });
    if (existing) return existing;
    return prisma.surveyOption.create({ data: { question_id: questionId, option_text: text, option_value: value } });
  }

  // Helper: create survey if not exists
  async function upsertSurvey(title, description, type, target_role = 'student') {
    const existing = await prisma.survey.findFirst({ where: { title } });
    if (existing) return existing;
    return prisma.survey.create({ data: { title, description, type, target_role, created_by: createdBy } });
  }

  // Create Input (one-time) survey
  const inputTitle = 'Khảo sát đầu vào - Student Intake';
  const inputDesc = 'Khảo sát đầu vào dành cho sinh viên mới để thu thập thông tin baseline.';
  const inputSurvey = await upsertSurvey(inputTitle, inputDesc, 'input', 'student');

  // Create questions for input survey
  const qA1 = await upsertQuestion('Bạn cảm thấy thế nào về mức độ chuẩn bị học tập của mình?', 'likert', 'chuẩn bị học tập');
  const qA2 = await upsertQuestion('Bạn có gặp khó khăn về tài chính ảnh hưởng đến học tập không?', 'yes-no', 'khó khăn chi tiêu');
  const qA3 = await upsertQuestion('Bạn muốn được hỗ trợ những lĩnh vực nào? (chọn nhiều)', 'multiple-choice', 'nhu cầu hỗ trợ');
  const qA4 = await upsertQuestion('Bạn có lưu ý gì thêm cho nhà trường không?', 'free-text', 'góp ý', false);

  // Options for likert (1-5 scale)
  await upsertOption(qA1.question_id, 'Rất không sẵn sàng', 1);
  await upsertOption(qA1.question_id, 'Không sẵn sàng', 2);
  await upsertOption(qA1.question_id, 'Bình thường', 3);
  await upsertOption(qA1.question_id, 'Sẵn sàng', 4);
  await upsertOption(qA1.question_id, 'Rất sẵn sàng', 5);

  // Options for yes-no
  await upsertOption(qA2.question_id, 'Có', 1);
  await upsertOption(qA2.question_id, 'Không', 0);

  // Options for multiple-choice support areas
  await upsertOption(qA3.question_id, 'Học thuật', 1);
  await upsertOption(qA3.question_id, 'Tài chính', 2);
  await upsertOption(qA3.question_id, 'Tư vấn nghề nghiệp', 3);
  await upsertOption(qA3.question_id, 'Sức khỏe tinh thần', 4);

  // Link questions to input survey (order)
  async function linkQuestion(surveyId, questionId, index) {
    const existing = await prisma.surveyQuestionLink.findFirst({ where: { survey_id: surveyId, question_id: questionId } });
    if (existing) return existing;
    return prisma.surveyQuestionLink.create({ data: { survey_id: surveyId, question_id: questionId, order_index: index } });
  }

  await linkQuestion(inputSurvey.survey_id, qA1.question_id, 1);
  await linkQuestion(inputSurvey.survey_id, qA2.question_id, 2);
  await linkQuestion(inputSurvey.survey_id, qA3.question_id, 3);
  await linkQuestion(inputSurvey.survey_id, qA4.question_id, 4);

  console.log(`✓ Input survey created (id=${inputSurvey.survey_id}) with ${4} questions`);

  // Create Periodic survey
  const periodicTitle = 'Khảo sát định kỳ - Termly Check-in';
  const periodicDesc = 'Khảo sát định kỳ nhằm nắm bắt tình hình học tập hàng kỳ.';
  const periodicSurvey = await upsertSurvey(periodicTitle, periodicDesc, 'periodic', 'student');

  // Questions for periodic survey
  const qP1 = await upsertQuestion('Bạn đánh giá tiến độ học tập của mình trong kỳ này như thế nào?', 'slider', 'tiến độ học tập');
  const qP2 = await upsertQuestion('Bạn có tham gia các buổi hướng dẫn/office hours không?', 'yes-no', 'tham gia hướng dẫn');
  const qP3 = await upsertQuestion('Bạn muốn nhận hỗ trợ thêm về môn nào?', 'single-choice', 'môn cần hỗ trợ');

  // Options
  await upsertOption(qP2.question_id, 'Có', 1);
  await upsertOption(qP2.question_id, 'Không', 0);

  await upsertOption(qP3.question_id, 'Toán', 1);
  await upsertOption(qP3.question_id, 'Lập trình', 2);
  await upsertOption(qP3.question_id, 'CSDL', 3);

  // Link periodic questions
  await linkQuestion(periodicSurvey.survey_id, qP1.question_id, 1);
  await linkQuestion(periodicSurvey.survey_id, qP2.question_id, 2);
  await linkQuestion(periodicSurvey.survey_id, qP3.question_id, 3);

  console.log(`✓ Periodic survey created (id=${periodicSurvey.survey_id}) with ${3} questions`);

  console.log('Seeding surveys finished.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
