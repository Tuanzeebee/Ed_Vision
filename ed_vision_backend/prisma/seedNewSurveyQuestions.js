const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding 155 new survey questions from CSV data...');

    // Helper function to create question
    async function createQuestion(data) {
        try {
            // Check if question already exists
            const existing = await prisma.surveyQuestion.findFirst({
                where: { question_text: data.textVi }
            });

            if (existing) {
                console.log(`⏭️  Skipping existing question: ${data.code}`);
                return existing;
            }

            // Map response type to question_type
            const typeMapping = {
                'LIKERT_1_5': 'likert',
                'YES_NO': 'yes-no',
                'NUMERIC': 'numeric',
                'SHORT_TEXT': 'free-text',
                'SINGLE_CHOICE': 'single-choice',
                'MULTI_CHOICE': 'multiple-choice',
                'YES_NO_SHORT_TEXT': 'yes-no',
                'SINGLE_CHOICE_SHORT_TEXT': 'single-choice'
            };

            const questionType = typeMapping[data.responseType] || 'free-text';

            // Create the question
            const question = await prisma.surveyQuestion.create({
                data: {
                    question_text: data.textVi,
                    question_type: questionType,
                    category: data.category || 'General',
                    is_active: true
                }
            });

            console.log(`✅ Created question: ${data.code} - ${question.question_id}`);

            // Create options if they exist
            if (data.options && Array.isArray(data.options)) {
                for (let i = 0; i < data.options.length; i++) {
                    const option = data.options[i];
                    await prisma.surveyOption.create({
                        data: {
                            question_id: question.question_id,
                            option_text: option.textVi || option.text || `Option ${i + 1}`,
                            option_value: option.value !== undefined ? option.value : i + 1
                        }
                    });
                }
                console.log(`   📝 Created ${data.options.length} options`);
            }

            // Create scale options for LIKERT_1_5
            if (data.responseType === 'LIKERT_1_5' && data.scale) {
                const scaleLabels = [
                    data.scale['1'],
                    data.scale['2'],
                    data.scale['3'],
                    data.scale['4'],
                    data.scale['5']
                ];

                for (let i = 0; i < scaleLabels.length; i++) {
                    await prisma.surveyOption.create({
                        data: {
                            question_id: question.question_id,
                            option_text: scaleLabels[i],
                            option_value: i + 1
                        }
                    });
                }
                console.log(`   📊 Created 5-point Likert scale`);
            }

            // Create YES_NO options
            if (data.responseType === 'YES_NO' && data.options) {
                for (const option of data.options) {
                    await prisma.surveyOption.create({
                        data: {
                            question_id: question.question_id,
                            option_text: option.textVi,
                            option_value: option.value
                        }
                    });
                }
                console.log(`   ✓ Created YES/NO options`);
            }

            return question;
        } catch (error) {
            console.error(`❌ Error creating question ${data.code}:`, error.message);
            return null;
        }
    }

    // 97 Survey Questions Data from JSON
    const surveyQuestions = [
        {
            code: "N-001",
            category: "A",
            textVi: "Bạn có đọc trước tài liệu/slide trước khi lên lớp không?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Không bao giờ", "2": "Hiếm khi", "3": "Thỉnh thoảng", "4": "Thường xuyên", "5": "Luôn luôn" }
        },
        {
            code: "N-002",
            category: "A",
            textVi: "Trong 2 tuần gần đây, bạn đi học đầy đủ và đúng giờ ở mức nào?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Không bao giờ", "2": "Hiếm khi", "3": "Thỉnh thoảng", "4": "Thường xuyên", "5": "Luôn luôn" }
        },
        {
            code: "N-003",
            category: "A",
            textVi: "Bạn thường tự đặt mục tiêu điểm số cụ thể cho từng môn ngay từ đầu học kỳ?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Không bao giờ", "2": "Hiếm khi", "3": "Thỉnh thoảng", "4": "Thường xuyên", "5": "Luôn luôn" }
        },
        {
            code: "N-004",
            category: "A",
            textVi: "Sau mỗi buổi học, bạn có ghi lại 3 ý chính mình cần nắm vững không?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Không bao giờ", "2": "Hiếm khi", "3": "Thỉnh thoảng", "4": "Thường xuyên", "5": "Luôn luôn" }
        },
        {
            code: "N-005",
            category: "A",
            textVi: "Bạn có thói quen giải thích lại bài cho bạn khác hoặc tự 'dạy lại' để kiểm tra hiểu?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Không bao giờ", "2": "Hiếm khi", "3": "Thỉnh thoảng", "4": "Thường xuyên", "5": "Luôn luôn" }
        },
        {
            code: "N-006",
            category: "A",
            textVi: "Bạn có thường xuyên dùng flashcards/quiz app để ôn tập kiến thức không?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Không bao giờ", "2": "Hiếm khi", "3": "Thỉnh thoảng", "4": "Thường xuyên", "5": "Luôn luôn" }
        },
        {
            code: "N-007",
            category: "A",
            textVi: "Khi làm bài tập, bạn thường ước lượng thời gian cần thiết trước khi bắt đầu?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Không bao giờ", "2": "Hiếm khi", "3": "Thỉnh thoảng", "4": "Thường xuyên", "5": "Luôn luôn" }
        },
        {
            code: "N-008",
            category: "A",
            textVi: "Mức độ bạn hoàn thành bài tập trước hạn ít nhất 24 giờ?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Không bao giờ", "2": "Hiếm khi", "3": "Thỉnh thoảng", "4": "Thường xuyên", "5": "Luôn luôn" }
        },
        {
            code: "N-009",
            category: "A",
            textVi: "Bạn có thường thử làm đề/mẫu bài theo đúng thời gian quy định?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Không bao giờ", "2": "Hiếm khi", "3": "Thỉnh thoảng", "4": "Thường xuyên", "5": "Luôn luôn" }
        },
        {
            code: "N-010",
            category: "A",
            textVi: "Bạn ưu tiên cách nào khi không hiểu bài trên lớp?",
            responseType: "SINGLE_CHOICE",
            options: [
                { textVi: "Hỏi thầy/cô ngay trên lớp", value: 1 },
                { textVi: "Hỏi sau giờ học", value: 2 },
                { textVi: "Hỏi bạn bè", value: 3 },
                { textVi: "Tự tìm hiểu", value: 4 }
            ]
        },
        {
            code: "N-011",
            category: "A",
            textVi: "Mức độ bạn ghi chú các lỗi khái niệm (không chỉ lỗi tính toán) sau khi làm bài?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Không bao giờ", "2": "Hiếm khi", "3": "Thỉnh thoảng", "4": "Thường xuyên", "5": "Luôn luôn" }
        },
        {
            code: "N-012",
            category: "A",
            textVi: "Bạn có thói quen lập danh sách môn trước khi đăng ký học phần không?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Không bao giờ", "2": "Hiếm khi", "3": "Thỉnh thoảng", "4": "Thường xuyên", "5": "Luôn luôn" }
        },
        {
            code: "N-013",
            category: "A",
            textVi: "Bạn thường học theo hình thức nào hiệu quả nhất?",
            responseType: "SINGLE_CHOICE",
            options: [
                { textVi: "Học nhóm", value: 1 },
                { textVi: "Học một mình", value: 2 },
                { textVi: "Học có giáo viên hướng dẫn", value: 3 },
                { textVi: "Học qua video/online", value: 4 }
            ]
        },
        {
            code: "N-014",
            category: "A",
            textVi: "Bạn có thường tắt thông báo mạng xã hội trong giờ học?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Không bao giờ", "2": "Hiếm khi", "3": "Thỉnh thoảng", "4": "Thường xuyên", "5": "Luôn luôn" }
        },
        {
            code: "N-015",
            category: "A",
            textVi: "Trong tháng qua, bạn đã nộp trễ bao nhiêu bài?",
            responseType: "NUMERIC",
            unit: "Số lượng"
        },
        {
            code: "N-016",
            category: "A",
            textVi: "Theo bạn, 3 rào cản lớn nhất khiến bạn học chưa hiệu quả là gì?",
            responseType: "SHORT_TEXT"
        },
        {
            code: "N-017",
            category: "A",
            textVi: "Trong 2 tuần gần đây, bạn ôn bài trong vòng 24 giờ sau mỗi buổi học ở mức nào?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Không bao giờ", "2": "Hiếm khi", "3": "Thỉnh thoảng", "4": "Thường xuyên", "5": "Luôn luôn" }
        },
        {
            code: "N-018",
            category: "A",
            textVi: "Bạn thường chia nhỏ mục tiêu học thành các nhiệm vụ 30–60 phút?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Không bao giờ", "2": "Hiếm khi", "3": "Thỉnh thoảng", "4": "Thường xuyên", "5": "Luôn luôn" }
        },
        {
            code: "N-019",
            category: "A",
            textVi: "Bạn thường xuyên tự tạo và làm quizz ôn tập thay vì chỉ đọc lại tài liệu?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Không bao giờ", "2": "Hiếm khi", "3": "Thỉnh thoảng", "4": "Thường xuyên", "5": "Luôn luôn" }
        },
        {
            code: "N-020",
            category: "A",
            textVi: "Khi học, bạn thường ghi chú có kế hoạch không?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Không bao giờ", "2": "Hiếm khi", "3": "Thỉnh thoảng", "4": "Thường xuyên", "5": "Luôn luôn" }
        },
        {
            code: "N-021",
            category: "A",
            textVi: "Bạn dành bao nhiêu % thời gian học cho làm bài tập/giải đề thay vì xem/đọc lý thuyết?",
            responseType: "SINGLE_CHOICE",
            options: [
                { textVi: "0-25%", value: 1 },
                { textVi: "26-50%", value: 2 },
                { textVi: "51-75%", value: 3 },
                { textVi: "76-100%", value: 4 }
            ]
        },
        {
            code: "N-022",
            category: "A",
            textVi: "Bạn thường xem lại lỗi sai và ghi chú nguyên nhân sau khi làm bài/quiz?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Không bao giờ", "2": "Hiếm khi", "3": "Thỉnh thoảng", "4": "Thường xuyên", "5": "Luôn luôn" }
        },
        {
            code: "N-023",
            category: "A",
            textVi: "Mức độ bạn tự đánh giá hiểu bài trước khi rời lớp hoặc kết thúc buổi tự học?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Không bao giờ", "2": "Hiếm khi", "3": "Thỉnh thoảng", "4": "Thường xuyên", "5": "Luôn luôn" }
        },
        {
            code: "N-024",
            category: "A",
            textVi: "Khi gặp nội dung khó, bạn ưu tiên cách nào đầu tiên?",
            responseType: "SINGLE_CHOICE",
            options: [
                { textVi: "Hỏi thầy/cô", value: 1 },
                { textVi: "Tìm tài liệu khác", value: 2 },
                { textVi: "Thảo luận nhóm", value: 3 },
                { textVi: "Học lại từ đầu", value: 4 },
                { textVi: "Bỏ qua tạm thời", value: 5 }
            ]
        },
        {
            code: "N-025",
            category: "A",
            textVi: "Bạn có kế hoạch ôn tập theo tuần cho từng môn?",
            responseType: "YES_NO",
            options: [
                { textVi: "Có", value: 1 },
                { textVi: "Không", value: 0 }
            ]
        },
        {
            code: "N-026",
            category: "A",
            textVi: "Mức độ bạn tuân thủ kế hoạch học đã đặt ra trong tuần trước?",
            responseType: "LIKERT_1_5",
            scale: { "1": "0-20%", "2": "21-40%", "3": "41-60%", "4": "61-80%", "5": "81-100%" }
        },
        {
            code: "N-027",
            category: "A",
            textVi: "Bạn thường bắt đầu chuẩn bị cho kiểm tra/đánh giá trước bao lâu?",
            responseType: "SINGLE_CHOICE",
            options: [
                { textVi: "1 ngày", value: 1 },
                { textVi: "2-3 ngày", value: 2 },
                { textVi: "1 tuần", value: 3 },
                { textVi: ">1 tuần", value: 4 }
            ]
        },
        {
            code: "N-028",
            category: "A",
            textVi: "Bạn có xu hướng dồn học vào phút cuối?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Không bao giờ", "2": "Hiếm khi", "3": "Thỉnh thoảng", "4": "Thường xuyên", "5": "Luôn luôn" }
        },
        {
            code: "N-029",
            category: "A",
            textVi: "Khi học online, bạn giữ độ tập trung liên tục trong bao lâu trước khi nghỉ?",
            responseType: "SINGLE_CHOICE",
            options: [
                { textVi: "<15 phút", value: 1 },
                { textVi: "15-30 phút", value: 2 },
                { textVi: "30-60 phút", value: 3 },
                { textVi: ">60 phút", value: 4 }
            ]
        },
        {
            code: "N-030",
            category: "A",
            textVi: "Bạn thường đặt câu hỏi/mục tiêu rõ ràng trước khi đọc một chương/tài liệu?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Không bao giờ", "2": "Hiếm khi", "3": "Thỉnh thoảng", "4": "Thường xuyên", "5": "Luôn luôn" }
        },
        {
            code: "N-031",
            category: "B",
            textVi: "Trong tuần trước, bạn ngủ đủ (≥7 giờ/đêm) bao nhiêu ngày?",
            responseType: "NUMERIC",
            unit: "Số lượng"
        },
        {
            code: "N-032",
            category: "B",
            textVi: "Bạn có thường xuyên ăn sáng đầy đủ trước khi học không?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Không bao giờ", "2": "Hiếm khi", "3": "Thỉnh thoảng", "4": "Thường xuyên", "5": "Luôn luôn" }
        },
        {
            code: "N-033",
            category: "B",
            textVi: "Bạn dành bao nhiêu giờ/tuần cho hoạt động thể chất (tập gym, chạy bộ, yoga, thể thao…)?",
            responseType: "NUMERIC",
            unit: "Giờ/tuần"
        },
        {
            code: "N-034",
            category: "B",
            textVi: "Bạn có thói quen thư giãn/thiền định hàng ngày không?",
            responseType: "YES_NO",
            options: [
                { textVi: "Có", value: 1 },
                { textVi: "Không", value: 0 }
            ]
        },
        {
            code: "N-035",
            category: "B",
            textVi: "Bạn cảm thấy mức độ căng thẳng/áp lực trong 2 tuần qua như thế nào?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Rất thấp", "2": "Thấp", "3": "Trung bình", "4": "Cao", "5": "Rất cao" }
        },
        {
            code: "N-036",
            category: "B",
            textVi: "Trong 14 ngày qua, có bao nhiêu ngày bạn cảm thấy mệt mỏi/buồn chán kéo dài?",
            responseType: "NUMERIC",
            unit: "0–14 ngày"
        },
        {
            code: "N-037",
            category: "B",
            textVi: "Bạn dành trung bình bao nhiêu giờ/tuần cho giải trí (phim, game, mạng xã hội)?",
            responseType: "NUMERIC",
            unit: "Giờ/tuần"
        },
        {
            code: "N-038",
            category: "B",
            textVi: "Bạn có người để chia sẻ khi gặp khó khăn (gia đình, bạn bè, người yêu…) không?",
            responseType: "YES_NO",
            options: [
                { textVi: "Có", value: 1 },
                { textVi: "Không", value: 0 }
            ]
        },
        {
            code: "N-039",
            category: "B",
            textVi: "Bạn có thường xuyên cảm giác cô đơn/bị cô lập không?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Không bao giờ", "2": "Hiếm khi", "3": "Thỉnh thoảng", "4": "Thường xuyên", "5": "Luôn luôn" }
        },
        {
            code: "N-040",
            category: "B",
            textVi: "Bạn sử dụng bao nhiêu giờ/ngày cho điện thoại/mạng xã hội (ngoài mục đích học tập)?",
            responseType: "NUMERIC",
            unit: "Giờ/ngày"
        },
        {
            code: "N-041",
            category: "B",
            textVi: "Những thói quen nào sau đây bạn có? (chọn tất cả phù hợp)",
            responseType: "MULTI_CHOICE",
            options: [
                { textVi: "Uống cafe/trà thường xuyên", value: 1 },
                { textVi: "Ngủ trưa", value: 2 },
                { textVi: "Tập thể dục buổi sáng", value: 3 },
                { textVi: "Đọc sách trước khi ngủ", value: 4 },
                { textVi: "Không có thói quen đặc biệt", value: 5 }
            ]
        },
        {
            code: "N-042",
            category: "B",
            textVi: "Trong 2 tuần qua, có bao nhiêu ngày bạn cảm thấy tràn đầy năng lượng?",
            responseType: "NUMERIC",
            unit: "0–14 ngày"
        },
        {
            code: "N-043",
            category: "C",
            textVi: "Bạn có lo lắng về chi phí học tập/sinh hoạt không?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Không lo lắng", "2": "Ít lo lắng", "3": "Trung bình", "4": "Khá lo lắng", "5": "Rất lo lắng" }
        },
        {
            code: "N-044",
            category: "C",
            textVi: "Bạn có làm thêm để trang trải học phí/sinh hoạt không?",
            responseType: "YES_NO",
            options: [
                { textVi: "Có", value: 1 },
                { textVi: "Không", value: 0 }
            ]
        },
        {
            code: "N-045",
            category: "C",
            textVi: "Nếu có, bạn làm thêm bao nhiêu giờ/tuần?",
            responseType: "NUMERIC",
            unit: "Giờ/tuần"
        },
        {
            code: "N-046",
            category: "C",
            textVi: "Bạn có gặp khó khăn trong việc mua sắm tài liệu học tập không?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Không gặp khó khăn", "2": "Ít khó khăn", "3": "Trung bình", "4": "Khá khó khăn", "5": "Rất khó khăn" }
        },
        {
            code: "N-047",
            category: "C",
            textVi: "Bạn có vay học phí hoặc vay sinh hoạt không?",
            responseType: "YES_NO",
            options: [
                { textVi: "Có", value: 1 },
                { textVi: "Không", value: 0 }
            ]
        },
        {
            code: "N-048",
            category: "C",
            textVi: "Mức độ ảnh hưởng của tài chính đến học tập của bạn?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Không ảnh hưởng", "2": "Ít ảnh hưởng", "3": "Trung bình", "4": "Ảnh hưởng nhiều", "5": "Ảnh hưởng rất nhiều" }
        },
        {
            code: "N-049",
            category: "C",
            textVi: "Trong tháng qua, có bao nhiêu lần bạn không thể tham gia hoạt động do hạn chế tài chính?",
            responseType: "NUMERIC",
            unit: "Số lần"
        },
        {
            code: "N-050",
            category: "C",
            textVi: "Bạn có kế hoạch quản lý tài chính rõ ràng (ghi chép thu chi) không?",
            responseType: "YES_NO",
            options: [
                { textVi: "Có", value: 1 },
                { textVi: "Không", value: 0 }
            ]
        },
        {
            code: "N-051",
            category: "C",
            textVi: "Bạn có cảm thấy áp lực từ việc phải trang trải chi phí không?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Không áp lực", "2": "Ít áp lực", "3": "Trung bình", "4": "Khá áp lực", "5": "Rất áp lực" }
        },
        {
            code: "N-052",
            category: "C",
            textVi: "Bạn có biết về các chương trình hỗ trợ tài chính/học bổng của trường không?",
            responseType: "YES_NO",
            options: [
                { textVi: "Có", value: 1 },
                { textVi: "Không", value: 0 }
            ]
        },
        {
            code: "N-053",
            category: "C",
            textVi: "Nếu có khó khăn tài chính, bạn mong muốn hỗ trợ gì nhất?",
            responseType: "SHORT_TEXT"
        },
        {
            code: "N-054",
            category: "D",
            textVi: "Bạn tham gia CLB/đội/nhóm nào không?",
            responseType: "YES_NO",
            options: [
                { textVi: "Có", value: 1 },
                { textVi: "Không", value: 0 }
            ]
        },
        {
            code: "N-055",
            category: "D",
            textVi: "Nếu có, bạn dành bao nhiêu giờ/tuần cho hoạt động CLB/nhóm?",
            responseType: "NUMERIC",
            unit: "Giờ/tuần"
        },
        {
            code: "N-056",
            category: "D",
            textVi: "Bạn có tham gia tình nguyện/hoạt động xã hội không?",
            responseType: "YES_NO",
            options: [
                { textVi: "Có", value: 1 },
                { textVi: "Không", value: 0 }
            ]
        },
        {
            code: "N-057",
            category: "D",
            textVi: "Nếu có, bạn dành bao nhiêu giờ/tuần?",
            responseType: "NUMERIC",
            unit: "Giờ/tuần"
        },
        {
            code: "N-058",
            category: "D",
            textVi: "Bạn cảm thấy hài lòng với đời sống xã hội/bạn bè ở trường như thế nào?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Rất không hài lòng", "2": "Không hài lòng", "3": "Trung bình", "4": "Hài lòng", "5": "Rất hài lòng" }
        },
        {
            code: "N-059",
            category: "D",
            textVi: "Bạn có bao nhiêu người bạn thân (có thể tâm sự/nhờ giúp đỡ) ở trường?",
            responseType: "NUMERIC",
            unit: "Số người"
        },
        {
            code: "N-060",
            category: "D",
            textVi: "Bạn có tham gia sự kiện/workshop/seminar của trường không?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Không bao giờ", "2": "Hiếm khi", "3": "Thỉnh thoảng", "4": "Thường xuyên", "5": "Luôn luôn" }
        },
        {
            code: "N-061",
            category: "D",
            textVi: "Bạn cảm thấy mình là một phần của cộng đồng trường/lớp ở mức nào?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Không cảm thấy", "2": "Ít cảm thấy", "3": "Trung bình", "4": "Cảm thấy", "5": "Rất cảm thấy" }
        },
        {
            code: "N-062",
            category: "D",
            textVi: "Bạn thường tương tác với bạn bè qua hình thức nào nhiều nhất?",
            responseType: "SINGLE_CHOICE",
            options: [
                { textVi: "Gặp trực tiếp", value: 1 },
                { textVi: "Mạng xã hội", value: 2 },
                { textVi: "Học nhóm", value: 3 },
                { textVi: "Hoạt động ngoại khóa", value: 4 }
            ]
        },
        {
            code: "N-063",
            category: "D",
            textVi: "Bạn có cảm thấy khó hòa nhập với các bạn trong lớp/trường không?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Không khó", "2": "Ít khó", "3": "Trung bình", "4": "Khá khó", "5": "Rất khó" }
        },
        {
            code: "N-064",
            category: "D",
            textVi: "Bạn có muốn tham gia nhiều hoạt động ngoại khóa hơn không?",
            responseType: "YES_NO",
            options: [
                { textVi: "Có", value: 1 },
                { textVi: "Không", value: 0 }
            ]
        },
        {
            code: "N-065",
            category: "E",
            textVi: "Bạn có mục tiêu nghề nghiệp rõ ràng sau khi tốt nghiệp không?",
            responseType: "YES_NO",
            options: [
                { textVi: "Có", value: 1 },
                { textVi: "Không", value: 0 }
            ]
        },
        {
            code: "N-066",
            category: "E",
            textVi: "Bạn cảm thấy ngành học hiện tại phù hợp với bản thân ở mức nào?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Rất không phù hợp", "2": "Không phù hợp", "3": "Trung bình", "4": "Phù hợp", "5": "Rất phù hợp" }
        },
        {
            code: "N-067",
            category: "E",
            textVi: "Bạn có từng tìm hiểu về các cơ hội việc làm sau tốt nghiệp không?",
            responseType: "YES_NO",
            options: [
                { textVi: "Có", value: 1 },
                { textVi: "Không", value: 0 }
            ]
        },
        {
            code: "N-068",
            category: "E",
            textVi: "Bạn có tham gia thực tập/dự án thực tế nào chưa?",
            responseType: "YES_NO",
            options: [
                { textVi: "Có", value: 1 },
                { textVi: "Không", value: 0 }
            ]
        },
        {
            code: "N-069",
            category: "E",
            textVi: "Bạn có kế hoạch học tiếp sau đại học (thạc sĩ, du học…) không?",
            responseType: "YES_NO",
            options: [
                { textVi: "Có", value: 1 },
                { textVi: "Không", value: 0 }
            ]
        },
        {
            code: "N-070",
            category: "E",
            textVi: "Bạn cảm thấy tự tin về khả năng tìm việc sau khi tốt nghiệp ở mức nào?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Rất không tự tin", "2": "Không tự tin", "3": "Trung bình", "4": "Tự tin", "5": "Rất tự tin" }
        },
        {
            code: "N-071",
            category: "E",
            textVi: "Bạn có tham gia khóa học/chứng chỉ ngoại khóa để nâng cao kỹ năng không?",
            responseType: "YES_NO",
            options: [
                { textVi: "Có", value: 1 },
                { textVi: "Không", value: 0 }
            ]
        },
        {
            code: "N-072",
            category: "E",
            textVi: "Bạn có tìm hiểu về các chương trình tư vấn nghề nghiệp của trường không?",
            responseType: "YES_NO",
            options: [
                { textVi: "Có", value: 1 },
                { textVi: "Không", value: 0 }
            ]
        },
        {
            code: "N-073",
            category: "E",
            textVi: "Kỹ năng nào bạn cảm thấy cần cải thiện nhất? (chọn tất cả phù hợp)",
            responseType: "MULTI_CHOICE",
            options: [
                { textVi: "Kỹ năng chuyên môn", value: 1 },
                { textVi: "Tiếng Anh", value: 2 },
                { textVi: "Kỹ năng mềm", value: 3 },
                { textVi: "Công nghệ/IT", value: 4 },
                { textVi: "Quản lý thời gian", value: 5 }
            ]
        },
        {
            code: "N-074",
            category: "E",
            textVi: "Bạn có networking với các anh/chị/mentor trong ngành không?",
            responseType: "YES_NO",
            options: [
                { textVi: "Có", value: 1 },
                { textVi: "Không", value: 0 }
            ]
        },
        {
            code: "N-075",
            category: "F",
            textVi: "Bạn thích học theo phương pháp nào nhất?",
            responseType: "SINGLE_CHOICE",
            options: [
                { textVi: "Nghe giảng", value: 1 },
                { textVi: "Đọc tài liệu", value: 2 },
                { textVi: "Thực hành", value: 3 },
                { textVi: "Thảo luận nhóm", value: 4 }
            ]
        },
        {
            code: "N-076",
            category: "F",
            textVi: "Bạn cảm thấy môi trường học tập (lớp, thư viện, ký túc…) hiện tại như thế nào?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Rất kém", "2": "Kém", "3": "Trung bình", "4": "Tốt", "5": "Rất tốt" }
        },
        {
            code: "N-077",
            category: "F",
            textVi: "Bạn thường sử dụng tài nguyên nào nhiều nhất để học? (chọn tối đa 2)",
            responseType: "MULTI_CHOICE",
            options: [
                { textVi: "Sách giáo khoa", value: 1 },
                { textVi: "Slide của giảng viên", value: 2 },
                { textVi: "Internet/YouTube", value: 3 },
                { textVi: "Thư viện", value: 4 },
                { textVi: "Bạn bè/nhóm học", value: 5 }
            ]
        },
        {
            code: "N-078",
            category: "F",
            textVi: "Bạn có sử dụng công cụ quản lý học tập (app, planner, notion…) không?",
            responseType: "YES_NO",
            options: [
                { textVi: "Có", value: 1 },
                { textVi: "Không", value: 0 }
            ]
        },
        {
            code: "N-079",
            category: "F",
            textVi: "Bạn cảm thấy giảng viên hỗ trợ sinh viên như thế nào?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Rất kém", "2": "Kém", "3": "Trung bình", "4": "Tốt", "5": "Rất tốt" }
        },
        {
            code: "N-080",
            category: "F",
            textVi: "Bạn có thường tham gia giờ tư vấn/office hours của giảng viên không?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Không bao giờ", "2": "Hiếm khi", "3": "Thỉnh thoảng", "4": "Thường xuyên", "5": "Luôn luôn" }
        },
        {
            code: "N-081",
            category: "F",
            textVi: "Bạn cảm thấy áp lực thi cử/đánh giá ở mức nào?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Rất thấp", "2": "Thấp", "3": "Trung bình", "4": "Cao", "5": "Rất cao" }
        },
        {
            code: "N-082",
            category: "F",
            textVi: "Bạn có hiểu rõ tiêu chí đánh giá/chấm điểm của các môn học không?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Rất không rõ", "2": "Không rõ", "3": "Trung bình", "4": "Rõ", "5": "Rất rõ" }
        },
        {
            code: "N-083",
            category: "F",
            textVi: "Bạn có tham gia lớp học phụ đạo/gia sư không?",
            responseType: "YES_NO",
            options: [
                { textVi: "Có", value: 1 },
                { textVi: "Không", value: 0 }
            ]
        },
        {
            code: "N-084",
            category: "F",
            textVi: "Bạn có cảm thấy học quá nhiều môn trong một kỳ không?",
            responseType: "YES_NO",
            options: [
                { textVi: "Có", value: 1 },
                { textVi: "Không", value: 0 }
            ]
        },
        {
            code: "N-085",
            category: "G",
            textVi: "Gia đình bạn có hỗ trợ/động viên bạn trong học tập không?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Không hỗ trợ", "2": "Ít hỗ trợ", "3": "Trung bình", "4": "Hỗ trợ", "5": "Rất hỗ trợ" }
        },
        {
            code: "N-086",
            category: "G",
            textVi: "Bạn có phải chịu áp lực từ kỳ vọng của gia đình không?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Không áp lực", "2": "Ít áp lực", "3": "Trung bình", "4": "Khá áp lực", "5": "Rất áp lực" }
        },
        {
            code: "N-087",
            category: "G",
            textVi: "Bạn có phải hỗ trợ gia đình về tài chính/công việc nhà không?",
            responseType: "YES_NO",
            options: [
                { textVi: "Có", value: 1 },
                { textVi: "Không", value: 0 }
            ]
        },
        {
            code: "N-088",
            category: "G",
            textVi: "Bạn ở cùng gia đình hay ở riêng (thuê trọ/ký túc xá)?",
            responseType: "SINGLE_CHOICE",
            options: [
                { textVi: "Ở cùng gia đình", value: 1 },
                { textVi: "Thuê trọ", value: 2 },
                { textVi: "Ký túc xá", value: 3 }
            ]
        },
        {
            code: "N-089",
            category: "G",
            textVi: "Bạn có người thân/bạn bè ở gần để hỗ trợ khi cần không?",
            responseType: "YES_NO",
            options: [
                { textVi: "Có", value: 1 },
                { textVi: "Không", value: 0 }
            ]
        },
        {
            code: "N-090",
            category: "G",
            textVi: "Trong 2 tuần qua, bạn có gặp vấn đề gia đình ảnh hưởng đến học tập không?",
            responseType: "YES_NO",
            options: [
                { textVi: "Có", value: 1 },
                { textVi: "Không", value: 0 }
            ]
        },
        {
            code: "N-091",
            category: "G",
            textVi: "Bạn thường về thăm gia đình bao nhiêu lần/tháng?",
            responseType: "NUMERIC",
            unit: "Số lần"
        },
        {
            code: "N-092",
            category: "G",
            textVi: "Bạn có cảm thấy nhớ nhà/cô đơn khi ở xa gia đình không?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Không bao giờ", "2": "Hiếm khi", "3": "Thỉnh thoảng", "4": "Thường xuyên", "5": "Luôn luôn" }
        },
        {
            code: "N-093",
            category: "H",
            textVi: "Bạn có điều gì muốn chia sẻ với nhà trường về trải nghiệm học tập của mình?",
            responseType: "SHORT_TEXT"
        },
        {
            code: "N-094",
            category: "H",
            textVi: "Bạn cảm thấy hài lòng với chất lượng giảng dạy ở trường như thế nào?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Rất không hài lòng", "2": "Không hài lòng", "3": "Trung bình", "4": "Hài lòng", "5": "Rất hài lòng" }
        },
        {
            code: "N-095",
            category: "H",
            textVi: "Bạn có đề xuất gì để cải thiện chương trình học không?",
            responseType: "SHORT_TEXT"
        },
        {
            code: "N-096",
            category: "H",
            textVi: "Bạn có muốn được tư vấn học tập/nghề nghiệp không?",
            responseType: "YES_NO",
            options: [
                { textVi: "Có", value: 1 },
                { textVi: "Không", value: 0 }
            ]
        },
        {
            code: "N-097",
            category: "H",
            textVi: "Bạn có cảm thấy nhà trường quan tâm đến ý kiến sinh viên không?",
            responseType: "LIKERT_1_5",
            scale: { "1": "Rất không quan tâm", "2": "Không quan tâm", "3": "Trung bình", "4": "Quan tâm", "5": "Rất quan tâm" }
        }
    ];

    // Insert all questions using the createQuestion helper
    console.log('Creating survey questions...');
    for (const q of surveyQuestions) {
        await createQuestion(q);
    }

    console.log('✅ Successfully seeded 155 survey questions!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding survey questions:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
