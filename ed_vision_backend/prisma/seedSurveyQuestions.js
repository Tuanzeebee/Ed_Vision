const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding survey questions...');

    // Danh sách 80+ câu hỏi khảo sát mẫu - mở rộng cho tất cả danh mục
    const surveyQuestions = [
        // Học tập & Kiến thức (10 câu)
        {
            question_text: 'Bạn đánh giá thế nào về chất lượng giảng dạy của giảng viên?',
            question_type: 'scale',
            category: 'teaching_quality',
            options: [
                { text: '1 - Rất không hài lòng', value: 1 },
                { text: '2 - Không hài lòng', value: 2 },
                { text: '3 - Trung bình', value: 3 },
                { text: '4 - Hài lòng', value: 4 },
                { text: '5 - Rất hài lòng', value: 5 },
            ],
        },
        {
            question_text: 'Nội dung bài giảng có dễ hiểu và rõ ràng không?',
            question_type: 'yes_no',
            category: 'teaching_quality',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Giảng viên có sử dụng phương pháp giảng dạy phù hợp không?',
            question_type: 'multiple_choice',
            category: 'teaching_quality',
            options: [
                { text: 'Rất phù hợp', value: 1 },
                { text: 'Phù hợp', value: 2 },
                { text: 'Bình thường', value: 3 },
                { text: 'Chưa phù hợp', value: 4 },
            ],
        },
        {
            question_text: 'Bạn có gặp khó khăn gì trong việc tiếp thu kiến thức?',
            question_type: 'free_text',
            category: 'learning_difficulty',
        },
        {
            question_text: 'Mức độ hài lòng của bạn về tài liệu học tập?',
            question_type: 'rating',
            category: 'learning_materials',
            options: [
                { text: '1 sao', value: 1 },
                { text: '2 sao', value: 2 },
                { text: '3 sao', value: 3 },
                { text: '4 sao', value: 4 },
                { text: '5 sao', value: 5 },
            ],
        },
        {
            question_text: 'Thời lượng bài giảng có phù hợp với nội dung không?',
            question_type: 'yes_no',
            category: 'teaching_quality',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn có đủ thời gian để hoàn thành bài tập và đồ án không?',
            question_type: 'multiple_choice',
            category: 'workload',
            options: [
                { text: 'Có, thời gian dư giả', value: 1 },
                { text: 'Vừa đủ', value: 2 },
                { text: 'Hơi gấp', value: 3 },
                { text: 'Rất gấp, không đủ thời gian', value: 4 },
            ],
        },
        {
            question_text: 'Bạn đánh giá mức độ khó của môn học này?',
            question_type: 'scale',
            category: 'course_difficulty',
            options: [
                { text: '1 - Rất dễ', value: 1 },
                { text: '2 - Dễ', value: 2 },
                { text: '3 - Trung bình', value: 3 },
                { text: '4 - Khó', value: 4 },
                { text: '5 - Rất khó', value: 5 },
            ],
        },
        {
            question_text: 'Kiến thức học được có hữu ích cho tương lai không?',
            question_type: 'yes_no',
            category: 'course_relevance',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn có góp ý gì để cải thiện chất lượng giảng dạy?',
            question_type: 'free_text',
            category: 'suggestions',
        },

        // Cơ sở vật chất (10 câu)
        {
            question_text: 'Phòng học có đủ trang thiết bị và tiện nghi không?',
            question_type: 'multiple_choice',
            category: 'facilities',
            options: [
                { text: 'Rất đầy đủ', value: 1 },
                { text: 'Đầy đủ', value: 2 },
                { text: 'Chưa đầy đủ', value: 3 },
                { text: 'Thiếu nhiều', value: 4 },
            ],
        },
        {
            question_text: 'Chất lượng máy chiếu, âm thanh có tốt không?',
            question_type: 'yes_no',
            category: 'facilities',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Đánh giá về điều kiện phòng học (ánh sáng, nhiệt độ, không gian)?',
            question_type: 'scale',
            category: 'facilities',
            options: [
                { text: '1 - Rất tồi', value: 1 },
                { text: '2 - Tồi', value: 2 },
                { text: '3 - Bình thường', value: 3 },
                { text: '4 - Tốt', value: 4 },
                { text: '5 - Rất tốt', value: 5 },
            ],
        },
        {
            question_text: 'Thư viện có đủ tài liệu tham khảo cho môn học không?',
            question_type: 'yes_no',
            category: 'library',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn có sử dụng phòng thực hành/lab thường xuyên không?',
            question_type: 'multiple_choice',
            category: 'lab_usage',
            options: [
                { text: 'Rất thường xuyên', value: 1 },
                { text: 'Thường xuyên', value: 2 },
                { text: 'Thỉnh thoảng', value: 3 },
                { text: 'Không bao giờ', value: 4 },
            ],
        },
        {
            question_text: 'Chất lượng máy tính và thiết bị lab có đáp ứng nhu cầu học tập?',
            question_type: 'scale',
            category: 'lab_quality',
            options: [
                { text: '1 - Không đáp ứng', value: 1 },
                { text: '2 - Đáp ứng kém', value: 2 },
                { text: '3 - Đáp ứng khá', value: 3 },
                { text: '4 - Đáp ứng tốt', value: 4 },
                { text: '5 - Đáp ứng rất tốt', value: 5 },
            ],
        },
        {
            question_text: 'Wifi/Internet tại trường có ổn định không?',
            question_type: 'yes_no',
            category: 'infrastructure',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Khu vực ăn uống/căn tin có đảm bảo vệ sinh an toàn thực phẩm?',
            question_type: 'multiple_choice',
            category: 'facilities',
            options: [
                { text: 'Rất đảm bảo', value: 1 },
                { text: 'Đảm bảo', value: 2 },
                { text: 'Chưa đảm bảo', value: 3 },
                { text: 'Không đảm bảo', value: 4 },
            ],
        },
        {
            question_text: 'Bãi giữ xe có an toàn và đầy đủ chỗ không?',
            question_type: 'yes_no',
            category: 'facilities',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn có góp ý gì về cơ sở vật chất của trường?',
            question_type: 'free_text',
            category: 'facilities_suggestions',
        },

        // Sinh hoạt & Hoạt động ngoại khóa (10 câu)
        {
            question_text: 'Bạn có tham gia các hoạt động ngoại khóa của trường không?',
            question_type: 'yes_no',
            category: 'extracurricular',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Nếu có, mức độ hài lòng của bạn về các hoạt động ngoại khóa?',
            question_type: 'scale',
            category: 'extracurricular',
            options: [
                { text: '1 - Rất không hài lòng', value: 1 },
                { text: '2 - Không hài lòng', value: 2 },
                { text: '3 - Trung bình', value: 3 },
                { text: '4 - Hài lòng', value: 4 },
                { text: '5 - Rất hài lòng', value: 5 },
            ],
        },
        {
            question_text: 'Bạn muốn trường tổ chức thêm hoạt động nào?',
            question_type: 'multiple_choice',
            category: 'extracurricular_suggestions',
            options: [
                { text: 'Thể thao', value: 1 },
                { text: 'Nghệ thuật/Văn hóa', value: 2 },
                { text: 'Tình nguyện/Cộng đồng', value: 3 },
                { text: 'Học thuật/Hội thảo', value: 4 },
                { text: 'Du lịch/Dã ngoại', value: 5 },
            ],
        },
        {
            question_text: 'Bạn có tham gia các câu lạc bộ/đội nhóm nào không?',
            question_type: 'yes_no',
            category: 'clubs',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Môi trường học tập tại trường có thân thiện và hỗ trợ không?',
            question_type: 'scale',
            category: 'environment',
            options: [
                { text: '1 - Rất không thân thiện', value: 1 },
                { text: '2 - Không thân thiện', value: 2 },
                { text: '3 - Trung bình', value: 3 },
                { text: '4 - Thân thiện', value: 4 },
                { text: '5 - Rất thân thiện', value: 5 },
            ],
        },
        {
            question_text: 'Bạn có cảm thấy gắn kết với cộng đồng sinh viên không?',
            question_type: 'yes_no',
            category: 'community',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn có được hỗ trợ tốt từ bạn bè khi gặp khó khăn?',
            question_type: 'multiple_choice',
            category: 'peer_support',
            options: [
                { text: 'Luôn được hỗ trợ', value: 1 },
                { text: 'Thường xuyên', value: 2 },
                { text: 'Thỉnh thoảng', value: 3 },
                { text: 'Hiếm khi', value: 4 },
                { text: 'Không bao giờ', value: 5 },
            ],
        },
        {
            question_text: 'Bạn có tham gia các cuộc thi/sự kiện của trường không?',
            question_type: 'yes_no',
            category: 'events',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Đánh giá về mối quan hệ giữa sinh viên và giảng viên?',
            question_type: 'scale',
            category: 'relationships',
            options: [
                { text: '1 - Rất xa cách', value: 1 },
                { text: '2 - Xa cách', value: 2 },
                { text: '3 - Bình thường', value: 3 },
                { text: '4 - Thân thiết', value: 4 },
                { text: '5 - Rất thân thiết', value: 5 },
            ],
        },
        {
            question_text: 'Bạn có góp ý gì để cải thiện đời sống sinh viên?',
            question_type: 'free_text',
            category: 'student_life_suggestions',
        },

        // Hỗ trợ & Tư vấn (10 câu)
        {
            question_text: 'Bạn có nhận được tư vấn học tập đầy đủ từ giảng viên chủ nhiệm?',
            question_type: 'yes_no',
            category: 'academic_advising',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Mức độ hài lòng về dịch vụ tư vấn học tập?',
            question_type: 'scale',
            category: 'academic_advising',
            options: [
                { text: '1 - Rất không hài lòng', value: 1 },
                { text: '2 - Không hài lòng', value: 2 },
                { text: '3 - Trung bình', value: 3 },
                { text: '4 - Hài lòng', value: 4 },
                { text: '5 - Rất hài lòng', value: 5 },
            ],
        },
        {
            question_text: 'Bạn có được hỗ trợ về tâm lý khi cần thiết không?',
            question_type: 'yes_no',
            category: 'mental_health',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn có biết về các dịch vụ hỗ trợ sinh viên của trường?',
            question_type: 'multiple_choice',
            category: 'support_awareness',
            options: [
                { text: 'Biết rõ và đã sử dụng', value: 1 },
                { text: 'Biết nhưng chưa sử dụng', value: 2 },
                { text: 'Biết sơ sơ', value: 3 },
                { text: 'Không biết', value: 4 },
            ],
        },
        {
            question_text: 'Thủ tục hành chính (đăng ký môn, xin giấy tờ) có đơn giản không?',
            question_type: 'scale',
            category: 'administrative',
            options: [
                { text: '1 - Rất phức tạp', value: 1 },
                { text: '2 - Phức tạp', value: 2 },
                { text: '3 - Bình thường', value: 3 },
                { text: '4 - Đơn giản', value: 4 },
                { text: '5 - Rất đơn giản', value: 5 },
            ],
        },
        {
            question_text: 'Nhân viên văn phòng có nhiệt tình hỗ trợ sinh viên không?',
            question_type: 'yes_no',
            category: 'staff_support',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn có được thông báo kịp thời về các thông tin quan trọng?',
            question_type: 'multiple_choice',
            category: 'communication',
            options: [
                { text: 'Luôn kịp thời', value: 1 },
                { text: 'Thường xuyên', value: 2 },
                { text: 'Thỉnh thoảng', value: 3 },
                { text: 'Hiếm khi', value: 4 },
            ],
        },
        {
            question_text: 'Hệ thống quản lý sinh viên (portal) có dễ sử dụng không?',
            question_type: 'yes_no',
            category: 'systems',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Đánh giá về dịch vụ tư vấn nghề nghiệp của trường?',
            question_type: 'scale',
            category: 'career_services',
            options: [
                { text: '1 - Rất kém', value: 1 },
                { text: '2 - Kém', value: 2 },
                { text: '3 - Trung bình', value: 3 },
                { text: '4 - Tốt', value: 4 },
                { text: '5 - Rất tốt', value: 5 },
            ],
        },
        {
            question_text: 'Bạn có góp ý gì về các dịch vụ hỗ trợ sinh viên?',
            question_type: 'free_text',
            category: 'support_suggestions',
        },

        // Tài chính & Học bổng (10 câu)
        {
            question_text: 'Bạn có gặp khó khăn về tài chính trong học tập không?',
            question_type: 'yes_no',
            category: 'financial',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Mức độ khó khăn về tài chính của bạn?',
            question_type: 'scale',
            category: 'financial',
            options: [
                { text: '1 - Không khó khăn', value: 1 },
                { text: '2 - Hơi khó khăn', value: 2 },
                { text: '3 - Khó khăn', value: 3 },
                { text: '4 - Rất khó khăn', value: 4 },
                { text: '5 - Cực kỳ khó khăn', value: 5 },
            ],
        },
        {
            question_text: 'Bạn có đang nhận học bổng không?',
            question_type: 'yes_no',
            category: 'scholarship',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn có biết về các chương trình học bổng của trường?',
            question_type: 'multiple_choice',
            category: 'scholarship_awareness',
            options: [
                { text: 'Biết rõ và đã đăng ký', value: 1 },
                { text: 'Biết nhưng chưa đăng ký', value: 2 },
                { text: 'Biết sơ sơ', value: 3 },
                { text: 'Không biết', value: 4 },
            ],
        },
        {
            question_text: 'Học phí có hợp lý với chất lượng đào tạo không?',
            question_type: 'yes_no',
            category: 'tuition',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn có phải làm thêm để trang trải học phí không?',
            question_type: 'multiple_choice',
            category: 'part_time_work',
            options: [
                { text: 'Không cần làm thêm', value: 1 },
                { text: 'Làm thêm thỉnh thoảng', value: 2 },
                { text: 'Làm thêm thường xuyên', value: 3 },
                { text: 'Phải làm thêm toàn thời gian', value: 4 },
            ],
        },
        {
            question_text: 'Nếu làm thêm, bạn làm bao nhiêu giờ/tuần?',
            question_type: 'scale',
            category: 'work_hours',
            options: [
                { text: 'Không làm', value: 0 },
                { text: '1-10 giờ', value: 1 },
                { text: '11-20 giờ', value: 2 },
                { text: '21-30 giờ', value: 3 },
                { text: 'Trên 30 giờ', value: 4 },
            ],
        },
        {
            question_text: 'Công việc làm thêm có ảnh hưởng đến học tập không?',
            question_type: 'yes_no',
            category: 'work_impact',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn mong muốn được hỗ trợ tài chính như thế nào?',
            question_type: 'multiple_choice',
            category: 'financial_support_needs',
            options: [
                { text: 'Học bổng toàn phần', value: 1 },
                { text: 'Học bổng một phần', value: 2 },
                { text: 'Vay vốn ưu đãi', value: 3 },
                { text: 'Giảm học phí', value: 4 },
                { text: 'Hỗ trợ việc làm thêm', value: 5 },
            ],
        },
        {
            question_text: 'Bạn có góp ý gì về chính sách học phí và học bổng?',
            question_type: 'free_text',
            category: 'financial_suggestions',
        },

        // TÂM LÝ - MENTAL (15 câu mới)
        {
            question_text: 'Bạn có cảm thấy căng thẳng, lo âu trong thời gian học tập không?',
            question_type: 'scale',
            category: 'mental',
            options: [
                { text: '1 - Không bao giờ', value: 1 },
                { text: '2 - Hiếm khi', value: 2 },
                { text: '3 - Thỉnh thoảng', value: 3 },
                { text: '4 - Thường xuyên', value: 4 },
                { text: '5 - Rất thường xuyên', value: 5 },
            ],
        },
        {
            question_text: 'Bạn có đủ thời gian nghỉ ngơi và giải trí không?',
            question_type: 'yes_no',
            category: 'mental',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Chất lượng giấc ngủ của bạn như thế nào?',
            question_type: 'multiple_choice',
            category: 'mental',
            options: [
                { text: 'Rất tốt, ngủ đủ giấc', value: 1 },
                { text: 'Tốt, đôi khi thức khuya', value: 2 },
                { text: 'Trung bình, thường xuyên thiếu ngủ', value: 3 },
                { text: 'Kém, luôn mất ngủ', value: 4 },
            ],
        },
        {
            question_text: 'Bạn có cảm thấy cô đơn hoặc bị cô lập không?',
            question_type: 'yes_no',
            category: 'mental',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Mức độ tự tin của bạn trong học tập?',
            question_type: 'scale',
            category: 'mental',
            options: [
                { text: '1 - Rất không tự tin', value: 1 },
                { text: '2 - Không tự tin', value: 2 },
                { text: '3 - Trung bình', value: 3 },
                { text: '4 - Tự tin', value: 4 },
                { text: '5 - Rất tự tin', value: 5 },
            ],
        },
        {
            question_text: 'Bạn có người để chia sẻ khi gặp khó khăn không?',
            question_type: 'multiple_choice',
            category: 'mental',
            options: [
                { text: 'Có nhiều người', value: 1 },
                { text: 'Có vài người', value: 2 },
                { text: 'Chỉ có 1 người', value: 3 },
                { text: 'Không có ai', value: 4 },
            ],
        },
        {
            question_text: 'Bạn có thường xuyên cảm thấy mệt mỏi, kiệt sức không?',
            question_type: 'yes_no',
            category: 'mental',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn đánh giá sức khỏe tinh thần của mình hiện tại?',
            question_type: 'scale',
            category: 'mental',
            options: [
                { text: '1 - Rất kém', value: 1 },
                { text: '2 - Kém', value: 2 },
                { text: '3 - Trung bình', value: 3 },
                { text: '4 - Tốt', value: 4 },
                { text: '5 - Rất tốt', value: 5 },
            ],
        },
        {
            question_text: 'Bạn có biết cách quản lý căng thẳng không?',
            question_type: 'yes_no',
            category: 'mental',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn có muốn được tư vấn tâm lý không?',
            question_type: 'multiple_choice',
            category: 'mental',
            options: [
                { text: 'Rất muốn', value: 1 },
                { text: 'Có thể cần', value: 2 },
                { text: 'Không cần thiết', value: 3 },
                { text: 'Không muốn', value: 4 },
            ],
        },
        {
            question_text: 'Áp lực học tập ảnh hưởng đến sức khỏe của bạn như thế nào?',
            question_type: 'free_text',
            category: 'mental',
        },
        {
            question_text: 'Bạn có thường xuyên lo lắng về tương lai không?',
            question_type: 'scale',
            category: 'mental',
            options: [
                { text: '1 - Không bao giờ', value: 1 },
                { text: '2 - Hiếm khi', value: 2 },
                { text: '3 - Thỉnh thoảng', value: 3 },
                { text: '4 - Thường xuyên', value: 4 },
                { text: '5 - Luôn luôn', value: 5 },
            ],
        },
        {
            question_text: 'Bạn có duy trì thói quen tập thể dục không?',
            question_type: 'yes_no',
            category: 'mental',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Động lực học tập của bạn hiện tại?',
            question_type: 'scale',
            category: 'mental',
            options: [
                { text: '1 - Rất thấp', value: 1 },
                { text: '2 - Thấp', value: 2 },
                { text: '3 - Trung bình', value: 3 },
                { text: '4 - Cao', value: 4 },
                { text: '5 - Rất cao', value: 5 },
            ],
        },
        {
            question_text: 'Bạn có góp ý gì để cải thiện sức khỏe tinh thần sinh viên?',
            question_type: 'free_text',
            category: 'mental',
        },

        // HỌC TẬP - ACADEMIC (15 câu mới)
        {
            question_text: 'Bạn dành bao nhiêu giờ mỗi ngày cho việc tự học?',
            question_type: 'multiple_choice',
            category: 'academic',
            options: [
                { text: 'Dưới 1 giờ', value: 1 },
                { text: '1-2 giờ', value: 2 },
                { text: '2-4 giờ', value: 3 },
                { text: 'Trên 4 giờ', value: 4 },
            ],
        },
        {
            question_text: 'Bạn có kế hoạch học tập rõ ràng không?',
            question_type: 'yes_no',
            category: 'academic',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Điểm trung bình học kỳ trước của bạn?',
            question_type: 'scale',
            category: 'academic',
            options: [
                { text: 'Dưới 2.0', value: 1 },
                { text: '2.0 - 2.5', value: 2 },
                { text: '2.5 - 3.0', value: 3 },
                { text: '3.0 - 3.5', value: 4 },
                { text: 'Trên 3.5', value: 5 },
            ],
        },
        {
            question_text: 'Bạn có tham gia học nhóm với bạn bè không?',
            question_type: 'multiple_choice',
            category: 'academic',
            options: [
                { text: 'Thường xuyên', value: 1 },
                { text: 'Thỉnh thoảng', value: 2 },
                { text: 'Hiếm khi', value: 3 },
                { text: 'Không bao giờ', value: 4 },
            ],
        },
        {
            question_text: 'Bạn có hiểu bài giảng ngay trên lớp không?',
            question_type: 'yes_no',
            category: 'academic',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Môn học nào bạn gặp khó khăn nhất?',
            question_type: 'free_text',
            category: 'academic',
        },
        {
            question_text: 'Bạn có thường xuyên đi học đầy đủ không?',
            question_type: 'scale',
            category: 'academic',
            options: [
                { text: '1 - Hiếm khi đi học', value: 1 },
                { text: '2 - Thỉnh thoảng nghỉ', value: 2 },
                { text: '3 - Đi đủ', value: 3 },
                { text: '4 - Đi đều', value: 4 },
                { text: '5 - Không bao giờ nghỉ', value: 5 },
            ],
        },
        {
            question_text: 'Bạn có sử dụng thư viện để học tập không?',
            question_type: 'yes_no',
            category: 'academic',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn cảm thấy áp lực về kết quả học tập?',
            question_type: 'scale',
            category: 'academic',
            options: [
                { text: '1 - Không áp lực', value: 1 },
                { text: '2 - Hơi áp lực', value: 2 },
                { text: '3 - Áp lực vừa phải', value: 3 },
                { text: '4 - Rất áp lực', value: 4 },
                { text: '5 - Cực kỳ áp lực', value: 5 },
            ],
        },
        {
            question_text: 'Bạn có sử dụng tài liệu học online không?',
            question_type: 'multiple_choice',
            category: 'academic',
            options: [
                { text: 'Rất thường xuyên', value: 1 },
                { text: 'Thường xuyên', value: 2 },
                { text: 'Thỉnh thoảng', value: 3 },
                { text: 'Không bao giờ', value: 4 },
            ],
        },
        {
            question_text: 'Bạn có tham gia lớp học thêm/gia sư không?',
            question_type: 'yes_no',
            category: 'academic',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Mục tiêu học tập của bạn trong học kỳ này?',
            question_type: 'free_text',
            category: 'academic',
        },
        {
            question_text: 'Bạn có hỏi giảng viên khi không hiểu bài không?',
            question_type: 'scale',
            category: 'academic',
            options: [
                { text: '1 - Không bao giờ', value: 1 },
                { text: '2 - Hiếm khi', value: 2 },
                { text: '3 - Thỉnh thoảng', value: 3 },
                { text: '4 - Thường xuyên', value: 4 },
                { text: '5 - Luôn luôn', value: 5 },
            ],
        },
        {
            question_text: 'Bạn có nộp bài tập đúng hạn không?',
            question_type: 'yes_no',
            category: 'academic',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn cần hỗ trợ gì để cải thiện kết quả học tập?',
            question_type: 'free_text',
            category: 'academic',
        },

        // XÃ HỘI - SOCIAL (15 câu mới)
        {
            question_text: 'Bạn có bao nhiêu bạn thân ở trường?',
            question_type: 'multiple_choice',
            category: 'social',
            options: [
                { text: 'Không có', value: 1 },
                { text: '1-2 người', value: 2 },
                { text: '3-5 người', value: 3 },
                { text: 'Trên 5 người', value: 4 },
            ],
        },
        {
            question_text: 'Bạn có dễ dàng kết bạn với người mới không?',
            question_type: 'yes_no',
            category: 'social',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Mối quan hệ với bạn cùng lớp của bạn?',
            question_type: 'scale',
            category: 'social',
            options: [
                { text: '1 - Rất xa cách', value: 1 },
                { text: '2 - Xa cách', value: 2 },
                { text: '3 - Bình thường', value: 3 },
                { text: '4 - Thân thiết', value: 4 },
                { text: '5 - Rất thân thiết', value: 5 },
            ],
        },
        {
            question_text: 'Bạn có tham gia hoạt động nhóm/câu lạc bộ nào không?',
            question_type: 'yes_no',
            category: 'social',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn cảm thấy được chấp nhận trong nhóm bạn bè không?',
            question_type: 'scale',
            category: 'social',
            options: [
                { text: '1 - Hoàn toàn không', value: 1 },
                { text: '2 - Không nhiều', value: 2 },
                { text: '3 - Bình thường', value: 3 },
                { text: '4 - Được chấp nhận', value: 4 },
                { text: '5 - Hoàn toàn được chấp nhận', value: 5 },
            ],
        },
        {
            question_text: 'Bạn có thường xuyên giao tiếp với giảng viên không?',
            question_type: 'multiple_choice',
            category: 'social',
            options: [
                { text: 'Rất thường xuyên', value: 1 },
                { text: 'Thường xuyên', value: 2 },
                { text: 'Thỉnh thoảng', value: 3 },
                { text: 'Không bao giờ', value: 4 },
            ],
        },
        {
            question_text: 'Bạn có bị bắt nạt hoặc phân biệt đối xử không?',
            question_type: 'yes_no',
            category: 'social',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn đánh giá kỹ năng giao tiếp của mình?',
            question_type: 'scale',
            category: 'social',
            options: [
                { text: '1 - Rất kém', value: 1 },
                { text: '2 - Kém', value: 2 },
                { text: '3 - Trung bình', value: 3 },
                { text: '4 - Tốt', value: 4 },
                { text: '5 - Rất tốt', value: 5 },
            ],
        },
        {
            question_text: 'Bạn có tham gia các sự kiện xã hội của trường không?',
            question_type: 'yes_no',
            category: 'social',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn cảm thấy thuộc về cộng đồng trường không?',
            question_type: 'scale',
            category: 'social',
            options: [
                { text: '1 - Hoàn toàn không', value: 1 },
                { text: '2 - Không nhiều', value: 2 },
                { text: '3 - Bình thường', value: 3 },
                { text: '4 - Có', value: 4 },
                { text: '5 - Rất có', value: 5 },
            ],
        },
        {
            question_text: 'Bạn có tham gia hoạt động tình nguyện không?',
            question_type: 'multiple_choice',
            category: 'social',
            options: [
                { text: 'Thường xuyên', value: 1 },
                { text: 'Thỉnh thoảng', value: 2 },
                { text: 'Hiếm khi', value: 3 },
                { text: 'Không bao giờ', value: 4 },
            ],
        },
        {
            question_text: 'Bạn có gặp khó khăn trong việc hòa nhập không?',
            question_type: 'yes_no',
            category: 'social',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn muốn trường tổ chức thêm hoạt động giao lưu nào?',
            question_type: 'free_text',
            category: 'social',
        },
        {
            question_text: 'Mối quan hệ với gia đình ảnh hưởng đến học tập?',
            question_type: 'scale',
            category: 'social',
            options: [
                { text: '1 - Ảnh hưởng rất tiêu cực', value: 1 },
                { text: '2 - Ảnh hưởng tiêu cực', value: 2 },
                { text: '3 - Không ảnh hưởng', value: 3 },
                { text: '4 - Ảnh hưởng tích cực', value: 4 },
                { text: '5 - Ảnh hưởng rất tích cực', value: 5 },
            ],
        },
        {
            question_text: 'Bạn có góp ý gì để cải thiện môi trường xã hội ở trường?',
            question_type: 'free_text',
            category: 'social',
        },
    ];

    console.log(`📝 Creating ${surveyQuestions.length} survey questions...`);

    let createdCount = 0;
    let skippedCount = 0;

    for (const qData of surveyQuestions) {
        try {
            // Check if question already exists
            const existing = await prisma.surveyQuestion.findFirst({
                where: {
                    question_text: qData.question_text,
                },
            });

            if (existing) {
                console.log(`⏭️  Skipping: "${qData.question_text.substring(0, 50)}..." (already exists)`);
                skippedCount++;
                continue;
            }

            // Create question
            const question = await prisma.surveyQuestion.create({
                data: {
                    question_text: qData.question_text,
                    question_type: qData.question_type,
                    category: qData.category,
                    is_active: true,
                },
            });

            // Create options if provided
            if (qData.options && qData.options.length > 0) {
                await prisma.surveyOption.createMany({
                    data: qData.options.map((opt) => ({
                        question_id: question.question_id,
                        option_text: opt.text,
                        option_value: opt.value,
                    })),
                });
            }

            createdCount++;
            console.log(`✅ Created: "${qData.question_text.substring(0, 60)}..."`);
        } catch (error) {
            console.error(
                `❌ Error creating question: "${qData.question_text.substring(0, 50)}..."`,
                error.message,
            );
        }
    }

    console.log('\n📊 Summary:');
    console.log(`  ✅ Created: ${createdCount} questions`);
    console.log(`  ⏭️  Skipped: ${skippedCount} questions (already exist)`);
    console.log(`  📝 Total: ${surveyQuestions.length} questions`);

    // Show categories
    const categories = [...new Set(surveyQuestions.map((q) => q.category))];
    console.log('\n📂 Categories created:');
    categories.forEach((cat) => {
        const count = surveyQuestions.filter((q) => q.category === cat).length;
        console.log(`  - ${cat}: ${count} questions`);
    });

    console.log('\n✅ Survey questions seeding completed!');
    console.log('\n💡 Bạn có thể sử dụng các câu hỏi này để tạo khảo sát mới.');
    console.log('💡 Các categories: teaching_quality, facilities, extracurricular, academic_advising, financial');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
