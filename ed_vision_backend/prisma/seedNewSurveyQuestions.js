require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log(' Seeding 155 new survey questions from CSV data...');

    // Helper function to create options for likert scale
    const createLikertOptions = () => [
        { text: '1 - Không bao giờ', value: 1 },
        { text: '2 - Hiếm khi', value: 2 },
        { text: '3 - Thỉnh thoảng', value: 3 },
        { text: '4 - Thường xuyên', value: 4 },
        { text: '5 - Luôn luôn', value: 5 },
    ];

    // 155 Survey Questions from CSV
    const surveyQuestions = [
        // N-001 to N-010
        {
            question_id: 'N-001',
            question_text: 'Trong 2 tuần gần đây, bạn đi học đầy đủ và đúng giờ ở mức nào?',
            question_type: 'likert',
            category: 'Hỗ trợ học tập',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-002',
            question_text: 'Bạn thường tự đặt mục tiêu điểm số cụ thể cho từng môn ngay từ đầu học kỳ?',
            question_type: 'likert',
            category: 'Hỗ trợ học tập',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-003',
            question_text: 'Sau mỗi buổi học, bạn có ghi lại 3 ý chính mình cần nắm vững không?',
            question_type: 'likert',
            category: 'Hỗ trợ học tập',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-004',
            question_text: 'Bạn có thường xuyên dùng flashcards/quiz app để ôn tập kiến thức không?',
            question_type: 'likert',
            category: 'Hỗ trợ học tập',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-005',
            question_text: 'Bạn có thường thử làm đề/mẫu bài theo đúng thời gian quy định?',
            question_type: 'likert',
            category: 'Hỗ trợ học tập',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-006',
            question_text: 'Mức độ bạn ghi chú các lỗi khái niệm (không chỉ lỗi tính toán) sau khi làm bài?',
            question_type: 'likert',
            category: 'Hỗ trợ học tập',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-007',
            question_text: 'Bạn có thói quen lập danh sách môn trước khi đăng ký học phần không?',
            question_type: 'likert',
            category: 'Hỗ trợ học tập',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-008',
            question_text: 'Bạn thường học theo hình thức nào hiệu quả nhất?',
            question_type: 'single_choice',
            category: 'Hỗ trợ học tập',
            options: [
                { text: 'Một mình', value: 1 },
                { text: 'Nhóm nhỏ 2–4 người', value: 2 },
                { text: 'Lớp', value: 3 },
                { text: 'Học kèm gia sư/mentor', value: 4 },
            ],
        },
        {
            question_id: 'N-009',
            question_text: 'Trong tháng qua, bạn đã nộp trễ bao nhiêu bài?',
            question_type: 'scale',
            category: 'Hỗ trợ học tập',
            options: [],
            unit: 'Số lượng',
        },
        {
            question_id: 'N-010',
            question_text: 'Theo bạn, 3 rào cản lớn nhất khiến bạn học chưa hiệu quả là gì?',
            question_type: 'free_text',
            category: 'Hỗ trợ học tập',
        },

        // N-011 to N-020
        {
            question_id: 'N-011',
            question_text: 'Trong 2 tuần gần đây, bạn ôn bài trong vòng 24 giờ sau mỗi buổi học ở mức nào?',
            question_type: 'likert',
            category: 'Hỗ trợ học tập',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-012',
            question_text: 'Bạn thường chia nhỏ mục tiêu học thành các nhiệm vụ 30–60 phút?',
            question_type: 'likert',
            category: 'Hỗ trợ học tập',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-013',
            question_text: 'Bạn thường xem lại lỗi sai và ghi chú nguyên nhân sau khi làm bài/quiz?',
            question_type: 'likert',
            category: 'Hỗ trợ học tập',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-014',
            question_text: 'Mức độ bạn tự đánh giá hiểu bài trước khi rời lớp hoặc kết thúc buổi tự học?',
            question_type: 'likert',
            category: 'Hỗ trợ học tập',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-015',
            question_text: 'Khi gặp nội dung khó, bạn ưu tiên cách nào đầu tiên?',
            question_type: 'single_choice',
            category: 'Hỗ trợ học tập',
            options: [
                { text: 'Tìm tài liệu khác', value: 1 },
                { text: 'Hỏi bạn', value: 2 },
                { text: 'Hỏi giảng viên/TA', value: 3 },
                { text: 'Tự thử thêm bài tập', value: 4 },
                { text: 'Tạm bỏ qua', value: 5 },
            ],
        },
        {
            question_id: 'N-016',
            question_text: 'Bạn có xu hướng dồn học vào phút cuối?',
            question_type: 'likert',
            category: 'Hỗ trợ học tập',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-017',
            question_text: 'Trong tháng qua, bạn đã hoàn thành bao nhiêu bài luyện tập bổ sung ngoài yêu cầu tối thiểu?',
            question_type: 'scale',
            category: 'Hỗ trợ học tập',
            options: [],
            unit: 'Số lượng',
        },
        {
            question_id: 'N-018',
            question_text: 'Bạn có thói quen tóm tắt 1 trang (one-page summary) sau mỗi chủ đề lớn?',
            question_type: 'likert',
            category: 'Hỗ trợ học tập',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-019',
            question_text: 'Bạn tự đánh giá mức độ nắm vững kiến thức nền cần cho các môn hiện tại?',
            question_type: 'likert',
            category: 'Hỗ trợ học tập',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-020',
            question_text: 'Thời gian di chuyển (đến trường/đi làm) chiếm bao nhiêu giờ mỗi tuần?',
            question_type: 'scale',
            category: 'Hỗ trợ học tập',
            options: [],
            unit: 'Giờ/tuần',
        },

        // N-021 to N-030
        {
            question_id: 'N-021',
            question_text: 'Bạn có thói quen nghỉ giải lao theo chu kỳ rõ ràng khi học dài?',
            question_type: 'likert',
            category: 'Hỗ trợ học tập',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-022',
            question_text: 'Bạn có thường xuyên ăn uống đúng bữa trong các ngày học dày?',
            question_type: 'likert',
            category: 'Hỗ trợ học tập',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-023',
            question_text: 'Vào thời gian rảnh bạn thường làm gì nhiều nhất?',
            question_type: 'free_text',
            category: 'Hỗ trợ học tập',
        },
        {
            question_id: 'N-024',
            question_text: 'Bạn thường học hiệu quả hơn khi có điều kiện nào?',
            question_type: 'single_choice',
            category: 'Hỗ trợ học tập',
            options: [
                { text: 'Deadline rõ', value: 1 },
                { text: 'Bạn học cùng', value: 2 },
                { text: 'Không ai kiểm soát', value: 3 },
                { text: 'Lịch cố định', value: 4 },
            ],
        },
        {
            question_id: 'N-025',
            question_text: 'Bạn dành bao nhiêu giờ/tuần cho giải trí số (game, TikTok, YouTube giải trí)?',
            question_type: 'scale',
            category: 'Hỗ trợ học tập',
            options: [],
            unit: 'Giờ/tuần',
        },
        {
            question_id: 'N-026',
            question_text: 'Mức độ bạn kiểm soát được thời lượng giải trí để không ảnh hưởng học tập?',
            question_type: 'likert',
            category: 'Hỗ trợ học tập',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-027',
            question_text: 'Trung bình 1 tuần, bạn tự học ngoài giờ trên lớp bao nhiêu giờ?',
            question_type: 'scale',
            category: 'Hỗ trợ học tập',
            options: [],
            unit: 'Giờ/tuần',
        },
        {
            question_id: 'N-028',
            question_text: 'Bạn có khung giờ học cố định mỗi ngày không?',
            question_type: 'yes_no',
            category: 'Hỗ trợ học tập',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_id: 'N-029',
            question_text: 'Trong ngày, bạn học hiệu quả nhất vào khung giờ nào?',
            question_type: 'single_choice',
            category: 'Hỗ trợ học tập',
            options: [
                { text: 'Sáng', value: 1 },
                { text: 'Chiều', value: 2 },
                { text: 'Tối', value: 3 },
                { text: 'Khuya', value: 4 },
            ],
        },
        {
            question_id: 'N-030',
            question_text: 'Trung bình mỗi ngày, bạn có bao nhiêu giờ thời gian rảnh thực sự (không học, không làm, không di chuyển)?',
            question_type: 'scale',
            category: 'Hỗ trợ học tập',
            options: [],
            unit: 'Giờ/ngày',
        },

        // N-031 to N-040
        {
            question_id: 'N-031',
            question_text: 'Trong 2 tuần gần đây, số ngày bạn học liên tục >2 giờ/ngày là bao nhiêu?',
            question_type: 'scale',
            category: 'Hỗ trợ học tập',
            options: [],
            unit: '0–14 ngày',
        },
        {
            question_id: 'N-032',
            question_text: 'Bạn cảm thấy tải học kỳ này cao hơn học kỳ trước ở mức nào?',
            question_type: 'likert',
            category: 'Hỗ trợ học tập',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-033',
            question_text: 'Bạn dự đoán mình có thể duy trì nhịp học hiện tại trong 4 tuần tới?',
            question_type: 'likert',
            category: 'Hỗ trợ học tập',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-034',
            question_text: 'Sau những ngày làm nhiều, bạn có xu hướng giảm thời gian học ngày hôm sau?',
            question_type: 'likert',
            category: 'Hỗ trợ học tập',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-035',
            question_text: 'Bạn có từng từ chối ca làm để ưu tiên học không?',
            question_type: 'single_choice',
            category: 'Hỗ trợ học tập',
            options: [
                { text: 'Chưa bao giờ', value: 1 },
                { text: 'Thỉnh thoảng', value: 2 },
                { text: 'Nhiều lần', value: 3 },
            ],
        },
        {
            question_id: 'N-036',
            question_text: 'Điều gì khiến bạn khó cân bằng học–làm nhất hiện nay?',
            question_type: 'free_text',
            category: 'Hỗ trợ học tập',
        },
        {
            question_id: 'N-037',
            question_text: 'Sau ca làm, bạn còn đủ năng lượng để học trong ngày đó?',
            question_type: 'likert',
            category: 'Hỗ trợ học tập',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-038',
            question_text: 'Bạn đã từng bỏ học/giảm tham gia lớp vì trùng lịch làm?',
            question_type: 'single_choice',
            category: 'Hỗ trợ học tập',
            options: [
                { text: 'Chưa bao giờ', value: 1 },
                { text: 'Thỉnh thoảng', value: 2 },
                { text: 'Nhiều lần', value: 3 },
            ],
        },
        {
            question_id: 'N-039',
            question_text: 'Bạn uống bao nhiêu ly nước/ngày trung bình?',
            question_type: 'free_text',
            category: 'Hỗ trợ học tập',
        },
        {
            question_id: 'N-040',
            question_text: 'Trong 2 tuần gần đây, bạn có bao nhiêu ngày tâm trạng xuống thấp ảnh hưởng việc học?',
            question_type: 'scale',
            category: 'Hỗ trợ học tập',
            options: [],
            unit: 'ngày',
        },

        // N-041 to N-052
        {
            question_id: 'N-041',
            question_text: 'Bạn có cảm giác mất hứng thú với môn học từng thích không?',
            question_type: 'yes_no',
            category: 'Hỗ trợ học tập',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_id: 'N-042',
            question_text: 'Khi học kém hiệu quả, bạn thường đổ lỗi cho yếu tố nào?',
            question_type: 'single_choice',
            category: 'Hỗ trợ học tập',
            options: [
                { text: 'Thiếu thời gian', value: 1 },
                { text: 'Thiếu phương pháp', value: 2 },
                { text: 'Áp lực tinh thần', value: 3 },
                { text: 'Môi trường học', value: 4 },
                { text: 'Nội dung môn quá khó', value: 5 },
            ],
        },
        {
            question_id: 'N-043',
            question_text: 'Bạn có thói quen tập thể dục ít nhất 2 lần/tuần?',
            question_type: 'yes_no',
            category: 'Hỗ trợ học tập',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_id: 'N-044',
            question_text: 'Mức độ bạn sử dụng caffeine/đồ uống tăng lực để học?',
            question_type: 'single_choice',
            category: 'Hỗ trợ học tập',
            options: [
                { text: 'Không', value: 1 },
                { text: '1–2 lần/tuần', value: 2 },
                { text: '3–5 lần/tuần', value: 3 },
                { text: 'Hầu như mỗi ngày', value: 4 },
            ],
        },
        {
            question_id: 'N-045',
            question_text: 'Khi điểm/bài làm không tốt, bạn có xu hướng:',
            question_type: 'single_choice',
            category: 'Hỗ trợ học tập',
            options: [
                { text: 'Tìm nguyên nhân và điều chỉnh', value: 1 },
                { text: 'Giữ nguyên cách học', value: 2 },
                { text: 'Trì hoãn/né tránh', value: 3 },
                { text: 'Hỏi hỗ trợ ngay', value: 4 },
            ],
        },
        {
            question_id: 'N-046',
            question_text: 'Bạn thường học ở đâu nhiều nhất?',
            question_type: 'single_choice',
            category: 'Hỗ trợ học tập',
            options: [
                { text: 'Nhà', value: 1 },
                { text: 'Thư viện', value: 2 },
                { text: 'Quán cà phê', value: 3 },
                { text: 'Ký túc xá', value: 4 },
                { text: 'Phòng học trống', value: 5 },
            ],
        },
        {
            question_id: 'N-047',
            question_text: 'Mức độ bạn phụ thuộc vào điện thoại khi học?',
            question_type: 'likert',
            category: 'Hỗ trợ học tập',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-048',
            question_text: 'Mức độ bạn bị điện thoại gây phân tâm?',
            question_type: 'likert',
            category: 'Hỗ trợ học tập',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-049',
            question_text: 'Bạn đánh giá tính rõ ràng của yêu cầu môn học (đầu ra, cách chấm điểm) ở mức nào?',
            question_type: 'likert',
            category: 'Hỗ trợ học tập',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-050',
            question_text: 'Bạn có thường chậm cập nhật thông báo học tập không?',
            question_type: 'likert',
            category: 'Hỗ trợ học tập',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-051',
            question_text: 'Bạn có từng muốn bỏ môn/hoãn học trong học kỳ này không?',
            question_type: 'likert',
            category: 'Hỗ trợ học tập',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-052',
            question_text: 'Bạn được hỗ trợ cải thiện kết quả học tập từ ai nhiều nhất?',
            question_type: 'single_choice',
            category: 'Hỗ trợ học tập',
            options: [
                { text: 'Giảng viên/TA', value: 1 },
                { text: 'Bạn bè', value: 2 },
                { text: 'Gia đình', value: 3 },
                { text: 'Tự đánh giá', value: 4 },
            ],
        },

        // N-053 to N-055
        {
            question_id: 'N-053',
            question_text: 'Trong tháng qua, bạn có chủ động xin tư vấn học tập không?',
            question_type: 'yes_no',
            category: 'Hỗ trợ học tập',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_id: 'N-054',
            question_text: 'Mức độ bạn hiểu rõ lộ trình học và điều kiện tiên quyết của chương trình?',
            question_type: 'likert',
            category: 'Hỗ trợ học tập',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-055',
            question_text: 'Bạn có người hướng dẫn nghề nghiệp và kiến thức môn học ngoài lớp học không?',
            question_type: 'yes_no',
            category: 'Hỗ trợ học tập',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },

        // N-056 to N-072 - Chuẩn bị học tập
        {
            question_id: 'N-056',
            question_text: 'Bạn có đọc trước tài liệu/slide trước khi lên lớp không?',
            question_type: 'likert',
            category: 'Học tập',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-057',
            question_text: 'Khi học, bạn thường ghi chú có kế hoạch không?',
            question_type: 'likert',
            category: 'Học tập',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-058',
            question_text: 'Bạn có kế hoạch ôn tập theo tuần cho từng môn?',
            question_type: 'yes_no',
            category: 'Học tập',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_id: 'N-059',
            question_text: 'Mức độ bạn tuân thủ kế hoạch học đã đặt ra trong tuần trước?',
            question_type: 'likert',
            category: 'Học tập',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-060',
            question_text: 'Bạn thường bắt đầu chuẩn bị cho kiểm tra/đánh giá trước bao lâu?',
            question_type: 'single_choice',
            category: 'Học tập',
            options: [
                { text: '<2 ngày', value: 1 },
                { text: '3–5 ngày', value: 2 },
                { text: '1–2 tuần', value: 3 },
                { text: '>2 tuần', value: 4 },
            ],
        },
        {
            question_id: 'N-061',
            question_text: 'Bạn cảm thấy khối lượng bài tập hiện tại vượt quá khả năng phân bổ thời gian của mình?',
            question_type: 'likert',
            category: 'Học tập',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-062',
            question_text: 'Bạn có lịch học cá nhân theo ngày (to-do/calendar) không?',
            question_type: 'yes_no',
            category: 'Học tập',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_id: 'N-063',
            question_text: 'Bạn phân bổ thời gian học theo môn như thế nào?',
            question_type: 'single_choice',
            category: 'Học tập',
            options: [
                { text: 'Ưu tiên môn khó trước', value: 1 },
                { text: 'Ưu tiên môn sắp kiểm tra', value: 2 },
                { text: 'Chia đều tất cả', value: 3 },
                { text: 'Học theo cảm hứng', value: 4 },
            ],
        },
        {
            question_id: 'N-064',
            question_text: 'Trong 7 ngày gần nhất, bạn có bao nhiêu ngày dành >30 phút để lập kế hoạch ngày hôm sau?',
            question_type: 'scale',
            category: 'Học tập',
            options: [],
            unit: '0–7 ngày',
        },
        {
            question_id: 'N-065',
            question_text: 'Bạn có thường xuyên đổi lịch học vì hoạt động xã hội/giải trí?',
            question_type: 'likert',
            category: 'Học tập',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-066',
            question_text: 'Mức độ bạn thấy lịch học và lịch cá nhân đang cân bằng?',
            question_type: 'likert',
            category: 'Học tập',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-067',
            question_text: 'Bạn có thường xuyên phải đổi lịch học cá nhân do việc đột xuất?',
            question_type: 'likert',
            category: 'Học tập',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-068',
            question_text: 'Mức độ bạn lập kế hoạch học xung quanh lịch làm một cách chủ động?',
            question_type: 'likert',
            category: 'Học tập',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-069',
            question_text: 'Bạn có kế hoạch giảm giờ làm vào giai đoạn thi/đồ án cao điểm?',
            question_type: 'yes_no',
            category: 'Học tập',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_id: 'N-070',
            question_text: 'Bạn có sử dụng công cụ quản lý học tập (Notion/Trello/Google Calendar…) không?',
            question_type: 'yes_no',
            category: 'Học tập',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_id: 'N-071',
            question_text: 'Bạn muốn hệ thống sẽ cá nhân hóa nhắc nhở bạn học ở mức độ nào?',
            question_type: 'likert',
            category: 'Học tập',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-072',
            question_text: 'Bạn có thường xuyên so sánh tiến độ học tập của mình với các bạn cùng lớp để điều chỉnh kế hoạch học tập không?',
            question_type: 'likert',
            category: 'Học tập',
            options: createLikertOptions(),
        },

        // N-073 - Clubs
        {
            question_id: 'N-073',
            question_text: 'Bạn dành bao nhiêu giờ/tuần cho CLB/hoạt động ngoại khóa?',
            question_type: 'scale',
            category: 'Câu lạc bộ ',
            options: [],
            unit: 'Giờ/tuần',
        },

        // N-074 to N-079 - Giao tiếp
        {
            question_id: 'N-074',
            question_text: 'Bạn có thường trao đổi bài với nhóm bạn học không?',
            question_type: 'yes_no',
            category: 'Giao tiếp',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_id: 'N-075',
            question_text: 'Khi có bài nhóm, bạn thường giữ vai trò nào?',
            question_type: 'single_choice',
            category: 'Giao tiếp',
            options: [
                { text: 'Trưởng nhóm/điều phối', value: 1 },
                { text: 'Chuyên môn chính', value: 2 },
                { text: 'Hỗ trợ', value: 3 },
                { text: 'Thực hiện theo phân công', value: 4 },
            ],
        },
        {
            question_id: 'N-076',
            question_text: 'Trong 2 tuần gần đây, bạn có xung đột với nhóm học tập làm ảnh hưởng tiến độ học không?',
            question_type: 'yes_no',
            category: 'Giao tiếp',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_id: 'N-077',
            question_text: 'Bạn có thường đặt câu hỏi trên lớp khi chưa hiểu không?',
            question_type: 'likert',
            category: 'Giao tiếp',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-078',
            question_text: 'Bạn đánh giá mức độ công bằng khi chia việc nhóm ở các môn gần đây?',
            question_type: 'likert',
            category: 'Giao tiếp',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-079',
            question_text: 'Mức độ bạn tham gia thảo luận trong quá trình học trong 2 tuần gần đây?',
            question_type: 'likert',
            category: 'Giao tiếp',
            options: createLikertOptions(),
        },

        // N-080 to N-082 - Cộng đồng xung quanh
        {
            question_id: 'N-080',
            question_text: 'Bạn có trách nhiệm gia đình nào làm giảm thời gian học không?',
            question_type: 'likert',
            category: 'Cộng đồng xung quanh',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-081',
            question_text: 'Mức độ bạn cảm thấy được gia đình và những người xung quanh ủng hộ việc học?',
            question_type: 'likert',
            category: 'Cộng đồng xung quanh',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-082',
            question_text: 'Bạn có một người nào mà bạn có thể nhờ hỗ trợ việc học không?',
            question_type: 'yes_no',
            category: 'Cộng đồng xung quanh',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },

        // N-083 to N-093 - Course Difficulty
        {
            question_id: 'N-083',
            question_text: 'Bạn có thói quen giải thích lại bài cho bạn khác hoặc tự \'dạy lại\' để kiểm tra hiểu?',
            question_type: 'likert',
            category: 'Khó khăn trong việc học',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-084',
            question_text: 'Khi làm bài tập, bạn thường ước lượng thời gian cần thiết trước khi bắt đầu?',
            question_type: 'likert',
            category: 'Khó khăn trong việc học',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-085',
            question_text: 'Mức độ bạn hoàn thành bài tập trước hạn ít nhất 24 giờ?',
            question_type: 'likert',
            category: 'Khó khăn trong việc học',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-086',
            question_text: 'Bạn dành bao nhiêu % thời gian học cho làm bài tập/giải đề thay vì xem/đọc lý thuyết?',
            question_type: 'single_choice',
            category: 'Khó khăn trong việc học',
            options: [
                { text: '<30%', value: 1 },
                { text: '30–50%', value: 2 },
                { text: '50–70%', value: 3 },
                { text: '>70%', value: 4 },
            ],
        },
        {
            question_id: 'N-087',
            question_text: 'Bạn có thường học bù vào cuối tuần cho khối lượng bị thiếu trong tuần?',
            question_type: 'likert',
            category: 'Khó khăn trong việc học',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-088',
            question_text: '1 tuần, bạn dành bao nhiêu giờ cho làm bài tập/đồ án?',
            question_type: 'scale',
            category: 'Khó khăn trong việc học',
            options: [],
            unit: 'Giờ/tuần',
        },
        {
            question_id: 'N-089',
            question_text: 'Trong 2 tuần gần đây, bạn có cảm thấy lo lắng trước các bài kiểm tra không?',
            question_type: 'likert',
            category: 'Khó khăn trong việc học',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-090',
            question_text: 'Chế độ ăn của bạn trong tuần qua có đủ 3 bữa chính không?',
            question_type: 'likert',
            category: 'Khó khăn trong việc học',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-091',
            question_text: 'Bạn có thường bỏ bữa để kịp deadline không?',
            question_type: 'yes_no',
            category: 'Khó khăn trong việc học',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_id: 'N-092',
            question_text: 'Bạn có gặp vấn đề nào về ngôn ngữ của tài liệu làm chậm tiến độ không?',
            question_type: 'likert',
            category: 'Khó khăn trong việc học',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-093',
            question_text: 'Trong 4 tuần tới, bạn nghĩ mình có nguy cơ điểm thấp do quá tải không?',
            question_type: 'likert',
            category: 'Khó khăn trong việc học',
            options: createLikertOptions(),
        },

        // N-094 to N-096 - Environment
        {
            question_id: 'N-094',
            question_text: 'Mức độ bạn cảm thấy được tôn trọng và an toàn trong môi trường lớp học?',
            question_type: 'likert',
            category: 'environment',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-095',
            question_text: 'Tại nơi ở của bạn có bị tiếng ồn ảnh hưởng nhiều đến việc học của bạn không?',
            question_type: 'likert',
            category: 'environment',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-096',
            question_text: 'Bạn có không gian học yên tĩnh tối thiểu 1–2 giờ/ngày không?',
            question_type: 'likert',
            category: 'environment',
            options: createLikertOptions(),
        },

        // N-097 to N-098 - Extracurricular
        {
            question_id: 'N-097',
            question_text: 'Bạn thường sử dụng thời gian rảnh cho hoạt động nào nhiều nhất?',
            question_type: 'multiple_choice',
            category: 'extracurricular',
            options: [
                { text: 'Nghỉ ngơi/ngủ', value: 1 },
                { text: 'Thể thao', value: 2 },
                { text: 'Giải trí số', value: 3 },
                { text: 'Gặp gỡ bạn bè/gia đình', value: 4 },
                { text: 'Hoạt động CLB', value: 5 },
            ],
        },
        {
            question_id: 'N-098',
            question_text: 'Khi căng thẳng, bạn có cách giải tỏa lành mạnh (thể thao, trò chuyện, nghỉ hợp lý)?',
            question_type: 'likert',
            category: 'extracurricular',
            options: createLikertOptions(),
        },

        // N-099 to N-102 - Facilities
        {
            question_id: 'N-099',
            question_text: 'Bạn có đủ thiết bị cần thiết cho môn học không?',
            question_type: 'yes_no',
            category: 'facilities',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_id: 'N-100',
            question_text: 'Địa điểm học chính của bạn có đủ ánh sáng và bàn ghế phù hợp không?',
            question_type: 'likert',
            category: 'facilities',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-101',
            question_text: 'Bạn học chủ yếu bằng thiết bị nào?',
            question_type: 'single_choice',
            category: 'facilities',
            options: [
                { text: 'Laptop/PC', value: 1 },
                { text: 'Tablet', value: 2 },
                { text: 'Điện thoại', value: 3 },
                { text: 'Kết hợp nhiều thiết bị', value: 4 },
            ],
        },
        {
            question_id: 'N-102',
            question_text: 'Theo bạn, một cải thiện nhỏ trong môi trường học có thể giúp bạn tăng hiệu suất học tập là gì?',
            question_type: 'free_text',
            category: 'facilities_suggestions',
        },

        // N-103 to N-121 - Financial
        {
            question_id: 'N-103',
            question_text: 'Bạn làm thêm chủ yếu vì lý do nào?',
            question_type: 'single_choice',
            category: 'financial',
            options: [
                { text: 'Nhu cầu tài chính', value: 1 },
                { text: 'Tích lũy kinh nghiệm', value: 2 },
                { text: 'Mở rộng quan hệ', value: 3 },
                { text: 'Thử định hướng nghề nghiệp', value: 4 },
            ],
        },
        {
            question_id: 'N-104',
            question_text: 'Bạn có phải làm ca tối/ca đêm không?',
            question_type: 'yes_no',
            category: 'financial',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_id: 'N-105',
            question_text: 'Số ngày/tuần bạn làm thêm thường là bao nhiêu?',
            question_type: 'scale',
            category: 'financial',
            options: [],
            unit: 'Số ngày/tuần',
        },
        {
            question_id: 'N-106',
            question_text: 'Công việc làm thêm của bạn có đòi hỏi thể lực cao không?',
            question_type: 'likert',
            category: 'financial',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-107',
            question_text: 'Bạn có cảm thấy áp lực tài chính đang ảnh hưởng đến tinh thần học tập?',
            question_type: 'likert',
            category: 'financial',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-108',
            question_text: 'Nơi làm thêm có linh hoạt cho lịch thi/đồ án của bạn không?',
            question_type: 'likert',
            category: 'financial',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-109',
            question_text: 'Thời gian di chuyển đến chỗ làm thêm chiếm bao nhiêu giờ/tuần?',
            question_type: 'scale',
            category: 'financial',
            options: [],
            unit: 'Giờ/tuần',
        },
        {
            question_id: 'N-110',
            question_text: 'Bạn có lịch làm thêm trùng với giờ học bắt buộc không?',
            question_type: 'single_choice',
            category: 'financial',
            options: [
                { text: 'Không', value: 1 },
                { text: 'Hiếm khi', value: 2 },
                { text: 'Thỉnh thoảng', value: 3 },
                { text: 'Thường xuyên', value: 4 },
            ],
        },
        {
            question_id: 'N-111',
            question_text: 'Trong 4 tuần tới, bạn dự kiến thay đổi giờ làm thêm thế nào?',
            question_type: 'single_choice',
            category: 'financial',
            options: [
                { text: 'Tăng', value: 1 },
                { text: 'Giữ nguyên', value: 2 },
                { text: 'Giảm', value: 3 },
                { text: 'Chưa chắc', value: 4 },
            ],
        },
        {
            question_id: 'N-112',
            question_text: 'Bạn có quỹ dự phòng tài chính để giảm áp lực làm thêm khi cần không?',
            question_type: 'likert',
            category: 'financial',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-113',
            question_text: 'Bạn đánh giá công việc làm thêm giúp ích kỹ năng học tập (kỷ luật, giao tiếp, tư duy) ở mức nào?',
            question_type: 'likert',
            category: 'financial',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-114',
            question_text: 'Bạn đang làm thêm theo hình thức nào?',
            question_type: 'single_choice',
            category: 'financial',
            options: [
                { text: 'Không làm', value: 1 },
                { text: 'Bán thời gian cố định', value: 2 },
                { text: 'Ca linh hoạt', value: 3 },
                { text: 'Freelance/dự án theo đợt', value: 4 },
            ],
        },
        {
            question_id: 'N-115',
            question_text: 'Trung bình 1 tuần, bạn làm thêm bao nhiêu giờ?',
            question_type: 'scale',
            category: 'financial',
            options: [],
            unit: 'Giờ/tuần',
        },
        {
            question_id: 'N-116',
            question_text: 'Lịch làm thêm của bạn ổn định hay biến động theo tuần?',
            question_type: 'likert',
            category: 'financial',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-117',
            question_text: 'Bạn thường làm thêm vào thời điểm nào?',
            question_type: 'single_choice',
            category: 'financial',
            options: [
                { text: 'Ngày thường', value: 1 },
                { text: 'Cuối tuần', value: 2 },
                { text: 'Cả hai', value: 3 },
            ],
        },
        {
            question_id: 'N-118',
            question_text: 'Mức độ công việc làm thêm liên quan chuyên ngành của bạn?',
            question_type: 'likert',
            category: 'financial',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-119',
            question_text: 'Bạn gặp khó khăn về chi phí học tập ở mức nào?',
            question_type: 'likert',
            category: 'financial',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-120',
            question_text: 'Nếu được đề xuất, bạn sẵn sàng giảm giờ làm để đổi lấy hỗ trợ học tập nào?',
            question_type: 'free_text',
            category: 'financial_suggestions',
        },
        {
            question_id: 'N-121',
            question_text: 'Bạn muốn hỗ trợ tinh thần theo hình thức nào?',
            question_type: 'free_text',
            category: 'financial_suggestions',
        },

        // N-122 - Góp ý
        {
            question_id: 'N-122',
            question_text: 'Bạn có thường xin phản hồi và góp ý từ giảng viên về bài làm đồ án không?',
            question_type: 'yes_no',
            category: 'góp_ý',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },

        // N-123 to N-128 - Infrastructure
        {
            question_id: 'N-123',
            question_text: 'Bạn có thường tắt thông báo mạng xã hội trong giờ học?',
            question_type: 'likert',
            category: 'infrastructure',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-124',
            question_text: 'Khi học online, bạn giữ độ tập trung liên tục trong bao lâu trước khi nghỉ?',
            question_type: 'single_choice',
            category: 'infrastructure',
            options: [
                { text: '<20p', value: 1 },
                { text: '20–40p', value: 2 },
                { text: '40–60p', value: 3 },
                { text: '>60p', value: 4 },
            ],
        },
        {
            question_id: 'N-125',
            question_text: 'Bạn có cần hỗ trợ kỹ thuật để học tốt hơn không?',
            question_type: 'yes_no',
            category: 'infrastructure',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_id: 'N-126',
            question_text: 'Mức độ ổn định của internet/thiết bị ảnh hưởng đến học online của bạn?',
            question_type: 'likert',
            category: 'infrastructure',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-127',
            question_text: 'Mức độ bạn dùng công cụ AI một cách có kiểm soát để hỗ trợ học?',
            question_type: 'likert',
            category: 'infrastructure',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-128',
            question_text: 'Bạn muốn hệ thống cảnh báo cho bạn điều gì để giúp bạn rủi ro về điểm?',
            question_type: 'free_text',
            category: 'infrastructure',
        },

        // N-129 - Khó khăn chi tiêu
        {
            question_id: 'N-129',
            question_text: 'Thu nhập từ làm thêm chiếm khoảng bao nhiêu % chi tiêu cá nhân?',
            question_type: 'single_choice',
            category: 'khó_khăn_chi_tiêu',
            options: [
                { text: '<20%', value: 1 },
                { text: '20–50%', value: 2 },
                { text: '50–80%', value: 3 },
                { text: '>80%', value: 4 },
            ],
        },

        // N-130 - Learning Difficulty
        {
            question_id: 'N-130',
            question_text: 'Bạn ưu tiên cách nào khi không hiểu bài trên lớp?',
            question_type: 'single_choice',
            category: 'learning_difficulty',
            options: [
                { text: 'Ghi chú câu hỏi để hỏi lại', value: 1 },
                { text: 'Tìm nguồn khác ngay sau tiết học', value: 2 },
                { text: 'Hỏi bạn cùng lớp', value: 3 },
                { text: 'Đợi đến gần kỳ kiểm tra mới xử lý', value: 4 },
            ],
        },

        // N-131 - Learning Materials
        {
            question_id: 'N-131',
            question_text: 'Bạn thường xuyên tự tạo và làm quizz ôn tập thay vì chỉ đọc lại tài liệu?',
            question_type: 'likert',
            category: 'learning_materials',
            options: createLikertOptions(),
        },

        // N-132 to N-135 - Learning Materials
        {
            question_id: 'N-132',
            question_text: 'Bạn thường đặt câu hỏi/mục tiêu rõ ràng trước khi đọc một chương/tài liệu?',
            question_type: 'likert',
            category: 'learning_materials',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-133',
            question_text: 'Mức độ bạn sử dụng nguồn học bổ trợ (MOOC, YouTube học thuật, sách tham khảo) cho môn chính?',
            question_type: 'likert',
            category: 'learning_materials',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-134',
            question_text: 'Trung bình mỗi tuần, bạn dành bao nhiêu giờ cho đọc tài liệu/giáo trình (không tính làm bài)?',
            question_type: 'scale',
            category: 'learning_materials',
            options: [],
            unit: 'Giờ/tuần',
        },
        {
            question_id: 'N-135',
            question_text: 'Bạn có gặp khó khăn trong việc tiếp cận tài liệu chuẩn cho môn học không?',
            question_type: 'likert',
            category: 'learning_materials',
            options: createLikertOptions(),
        },

        // N-136 - Library
        {
            question_id: 'N-136',
            question_text: 'Bạn có dễ dàng tiếp cận thư viện/phòng tự học không?',
            question_type: 'likert',
            category: 'library',
            options: createLikertOptions(),
        },

        // N-137 to N-155 - Mental Health
        {
            question_id: 'N-137',
            question_text: 'Trong 2 tuần gần đây, bạn có bao nhiêu ngày ngủ sau 1 giờ sáng?',
            question_type: 'scale',
            category: 'mental',
            options: [],
            unit: '0–14 ngày',
        },
        {
            question_id: 'N-138',
            question_text: 'Trong tháng qua, bạn có bao nhiêu lần nghỉ học vì lý do ngoài sức khỏe?',
            question_type: 'scale',
            category: 'mental',
            options: [],
            unit: 'Số lần',
        },
        {
            question_id: 'N-139',
            question_text: 'Bạn có thường mất ngủ do suy nghĩ về học tập/điểm số?',
            question_type: 'likert',
            category: 'mental',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-140',
            question_text: 'Mức độ bạn cảm thấy tự tin vào khả năng cải thiện điểm của mình?',
            question_type: 'likert',
            category: 'mental',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-141',
            question_text: 'Bạn có gặp mệt mỏi mắt/đau đầu do dùng màn hình khi học?',
            question_type: 'likert',
            category: 'mental',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-142',
            question_text: 'Bạn có thực hành thiền/hít thở/giãn cơ để ổn định tinh thần không?',
            question_type: 'likert',
            category: 'mental',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-143',
            question_text: 'Bạn có nhận thấy triệu chứng căng thẳng cơ thể (đau vai gáy, tim đập nhanh…) khi gần hạn nộp bài không?',
            question_type: 'yes_no',
            category: 'mental',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_id: 'N-144',
            question_text: 'Bạn có bệnh lý/điều kiện sức khỏe nào ảnh hưởng học tập dài hạn không?',
            question_type: 'yes_no',
            category: 'mental',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_id: 'N-145',
            question_text: 'Trong tháng qua, bạn đã nghỉ học vì vấn đề sức khỏe bao nhiêu buổi?',
            question_type: 'scale',
            category: 'mental',
            options: [],
            unit: 'Số buổi',
        },
        {
            question_id: 'N-146',
            question_text: 'Bạn có xu hướng tự cô lập khi áp lực học tăng cao?',
            question_type: 'likert',
            category: 'mental',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-147',
            question_text: 'Trong 2 tuần gần đây, bạn cảm thấy căng thẳng học tập ở mức nào?',
            question_type: 'likert',
            category: 'mental',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-148',
            question_text: 'Bạn đã trải qua cảm giác kiệt sức (burnout) do học trong tháng qua?',
            question_type: 'likert',
            category: 'mental',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-149',
            question_text: 'Bạn ngủ trung bình bao nhiêu giờ/đêm trong 2 tuần gần đây?',
            question_type: 'scale',
            category: 'mental',
            options: [],
            unit: 'Giờ',
        },
        {
            question_id: 'N-150',
            question_text: 'Chất lượng giấc ngủ của bạn thế nào?',
            question_type: 'likert',
            category: 'mental',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-151',
            question_text: 'Bạn có thường khó tập trung vì lo âu/căng thẳng?',
            question_type: 'likert',
            category: 'mental',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-152',
            question_text: 'Trong 2 tuần gần đây, bạn có bao nhiêu ngày mệt mỏi kéo dài ảnh hưởng việc học?',
            question_type: 'scale',
            category: 'mental',
            options: [],
            unit: '0–14 ngày',
        },
        {
            question_id: 'N-153',
            question_text: 'Bạn có gặp vấn đề sức khỏe khiến bạn giảm hiệu suất học gần đây?',
            question_type: 'yes_no',
            category: 'mental',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_id: 'N-154',
            question_text: 'Bạn cảm thấy động lực học của mình trong 2 tuần qua như thế nào?',
            question_type: 'likert',
            category: 'mental',
            options: createLikertOptions(),
        },
        {
            question_id: 'N-155',
            question_text: 'Bạn có cảm thấy áp lực so sánh thành tích với bạn bè không?',
            question_type: 'likert',
            category: 'mental',
            options: createLikertOptions(),
        },
    ];

    // Insert all questions
    console.log('Creating survey questions...');
    for (const q of surveyQuestions) {
        const question = await prisma.surveyQuestion.create({
            data: {
                question_text: q.question_text,
                question_type: q.question_type,
                category: q.category,
                is_active: true,
            },
        });

        // Create options if exist
        if (q.options && q.options.length > 0) {
            for (const opt of q.options) {
                await prisma.surveyOption.create({
                    data: {
                        question_id: question.question_id,
                        option_text: opt.text,
                        option_value: opt.value,
                    },
                });
            }
        }

        console.log(` Created question ${q.question_id}: ${q.question_text.substring(0, 50)}...`);
    }

    console.log(' Successfully seeded 155 survey questions!');
}

main()
    .catch((e) => {
        console.error(' Error seeding survey questions:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
