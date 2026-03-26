const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding survey questions (Vietnamese categories)...');

    // Danh sách 97 câu hỏi khảo sát mẫu - với category tiếng Việt
    const surveyQuestions = [
        // Học tập & Kiến thức (10 câu)
        {
            question_text: 'Bạn đánh giá thế nào về chất lượng giảng dạy của giảng viên?',
            question_type: 'scale',
            category: 'Chất Lượng Giảng Dạy',
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
            category: 'Chất Lượng Giảng Dạy',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Giảng viên có sử dụng phương pháp giảng dạy phù hợp không?',
            question_type: 'multiple_choice',
            category: 'Chất Lượng Giảng Dạy',
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
            category: 'Khó Khăn Học Tập',
        },
        {
            question_text: 'Mức độ hài lòng của bạn về tài liệu học tập?',
            question_type: 'rating',
            category: 'Tài Liệu Học Tập',
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
            category: 'Chất Lượng Giảng Dạy',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn có đủ thời gian để hoàn thành bài tập và đồ án không?',
            question_type: 'multiple_choice',
            category: 'Khối Lượng Công Việc',
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
            category: 'Độ Khó Môn Học',
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
            category: 'Tính Ứng Dụng',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn có góp ý gì để cải thiện chất lượng giảng dạy?',
            question_type: 'free_text',
            category: 'Góp Ý Đề Xuất',
        },

        // Cơ sở vật chất (10 câu)
        {
            question_text: 'Phòng học có đủ trang thiết bị và tiện nghi không?',
            question_type: 'multiple_choice',
            category: 'Cơ Sở Vật Chất',
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
            category: 'Cơ Sở Vật Chất',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Đánh giá về điều kiện phòng học (ánh sáng, nhiệt độ, không gian)?',
            question_type: 'scale',
            category: 'Cơ Sở Vật Chất',
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
            category: 'Thư Viện',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn có sử dụng phòng thực hành/lab thường xuyên không?',
            question_type: 'multiple_choice',
            category: 'Sử Dụng Phòng Lab',
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
            category: 'Chất Lượng Phòng Lab',
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
            category: 'Hạ Tầng Công Nghệ',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Khu vực ăn uống/căn tin có đảm bảo vệ sinh an toàn thực phẩm?',
            question_type: 'multiple_choice',
            category: 'Cơ Sở Vật Chất',
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
            category: 'Cơ Sở Vật Chất',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn có góp ý gì về cơ sở vật chất của trường?',
            question_type: 'free_text',
            category: 'Góp Ý Đề Xuất',
        },

        // Hỗ trợ sinh viên (10 câu)
        {
            question_text: 'Giảng viên có nhiệt tình hỗ trợ sinh viên không?',
            question_type: 'scale',
            category: 'Hỗ Trợ Giảng Viên',
            options: [
                { text: '1 - Không nhiệt tình', value: 1 },
                { text: '2 - Ít nhiệt tình', value: 2 },
                { text: '3 - Bình thường', value: 3 },
                { text: '4 - Nhiệt tình', value: 4 },
                { text: '5 - Rất nhiệt tình', value: 5 },
            ],
        },
        {
            question_text: 'Giảng viên có dễ tiếp cận khi bạn cần hỗ trợ không?',
            question_type: 'yes_no',
            category: 'Hỗ Trợ Giảng Viên',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Phòng đào tạo có giải quyết thủ tục nhanh chóng không?',
            question_type: 'multiple_choice',
            category: 'Hỗ Trợ Hành Chính',
            options: [
                { text: 'Rất nhanh', value: 1 },
                { text: 'Nhanh', value: 2 },
                { text: 'Chậm', value: 3 },
                { text: 'Rất chậm', value: 4 },
            ],
        },
        {
            question_text: 'Trung tâm tư vấn học tập có hữu ích không?',
            question_type: 'yes_no',
            category: 'Hỗ Trợ Học Tập',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn có được hướng dẫn rõ ràng về quy trình học tập?',
            question_type: 'scale',
            category: 'Hướng Dẫn Học Tập',
            options: [
                { text: '1 - Không rõ ràng', value: 1 },
                { text: '2 - Ít rõ ràng', value: 2 },
                { text: '3 - Khá rõ ràng', value: 3 },
                { text: '4 - Rõ ràng', value: 4 },
                { text: '5 - Rất rõ ràng', value: 5 },
            ],
        },
        {
            question_text: 'Bạn có biết về các dịch vụ hỗ trợ sinh viên không?',
            question_type: 'yes_no',
            category: 'Nhận Thức Dịch Vụ',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Phòng công tác sinh viên có giải quyết vấn đề hiệu quả không?',
            question_type: 'multiple_choice',
            category: 'Hỗ Trợ Sinh Viên',
            options: [
                { text: 'Rất hiệu quả', value: 1 },
                { text: 'Hiệu quả', value: 2 },
                { text: 'Kém hiệu quả', value: 3 },
                { text: 'Không hiệu quả', value: 4 },
            ],
        },
        {
            question_text: 'Bạn có nhận được thông báo kịp thời về các hoạt động?',
            question_type: 'yes_no',
            category: 'Truyền Thông Thông Tin',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Đánh giá về chất lượng hỗ trợ kỹ thuật (IT support)?',
            question_type: 'scale',
            category: 'Hỗ Trợ Kỹ Thuật',
            options: [
                { text: '1 - Rất kém', value: 1 },
                { text: '2 - Kém', value: 2 },
                { text: '3 - Trung bình', value: 3 },
                { text: '4 - Tốt', value: 4 },
                { text: '5 - Rất tốt', value: 5 },
            ],
        },
        {
            question_text: 'Bạn cần hỗ trợ thêm về lĩnh vực nào?',
            question_type: 'free_text',
            category: 'Góp Ý Đề Xuất',
        },

        // Hoạt động ngoại khóa (8 câu)
        {
            question_text: 'Bạn có tham gia các câu lạc bộ/đội nhóm không?',
            question_type: 'yes_no',
            category: 'Tham Gia Hoạt Động',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Chất lượng các hoạt động ngoại khóa như thế nào?',
            question_type: 'scale',
            category: 'Chất Lượng Hoạt Động Ngoại Khóa',
            options: [
                { text: '1 - Rất kém', value: 1 },
                { text: '2 - Kém', value: 2 },
                { text: '3 - Trung bình', value: 3 },
                { text: '4 - Tốt', value: 4 },
                { text: '5 - Rất tốt', value: 5 },
            ],
        },
        {
            question_text: 'Các hoạt động có phù hợp với nhu cầu sinh viên không?',
            question_type: 'multiple_choice',
            category: 'Phù Hợp Hoạt Động',
            options: [
                { text: 'Rất phù hợp', value: 1 },
                { text: 'Phù hợp', value: 2 },
                { text: 'Chưa phù hợp', value: 3 },
                { text: 'Không phù hợp', value: 4 },
            ],
        },
        {
            question_text: 'Bạn có muốn có thêm hoạt động nào không?',
            question_type: 'free_text',
            category: 'Góp Ý Đề Xuất',
        },
        {
            question_text: 'Thời gian tổ chức hoạt động có hợp lý không?',
            question_type: 'yes_no',
            category: 'Tổ Chức Hoạt Động',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Đánh giá về sự đa dạng của hoạt động ngoại khóa?',
            question_type: 'scale',
            category: 'Đa Dạng Hoạt Động',
            options: [
                { text: '1 - Rất ít', value: 1 },
                { text: '2 - Ít', value: 2 },
                { text: '3 - Trung bình', value: 3 },
                { text: '4 - Đa dạng', value: 4 },
                { text: '5 - Rất đa dạng', value: 5 },
            ],
        },
        {
            question_text: 'Bạn có được khuyến khích tham gia hoạt động ngoại khóa?',
            question_type: 'yes_no',
            category: 'Khuyến Khích Tham Gia',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Các hoạt động có giúp phát triển kỹ năng mềm không?',
            question_type: 'multiple_choice',
            category: 'Phát Triển Kỹ Năng',
            options: [
                { text: 'Rất nhiều', value: 1 },
                { text: 'Nhiều', value: 2 },
                { text: 'Ít', value: 3 },
                { text: 'Không', value: 4 },
            ],
        },

        // Môi trường học tập (8 câu)
        {
            question_text: 'Môi trường học tập có thân thiện và an toàn không?',
            question_type: 'yes_no',
            category: 'Môi Trường Học Tập',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Đánh giá về mối quan hệ giữa sinh viên với nhau?',
            question_type: 'scale',
            category: 'Quan Hệ Bạn Bè',
            options: [
                { text: '1 - Rất kém', value: 1 },
                { text: '2 - Kém', value: 2 },
                { text: '3 - Trung bình', value: 3 },
                { text: '4 - Tốt', value: 4 },
                { text: '5 - Rất tốt', value: 5 },
            ],
        },
        {
            question_text: 'Bạn có cảm thấy được tôn trọng tại trường không?',
            question_type: 'yes_no',
            category: 'Văn Hóa Trường Học',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Trường có khuyến khích sự sáng tạo và đổi mới không?',
            question_type: 'multiple_choice',
            category: 'Khuyến Khích Sáng Tạo',
            options: [
                { text: 'Rất khuyến khích', value: 1 },
                { text: 'Khuyến khích', value: 2 },
                { text: 'Ít khuyến khích', value: 3 },
                { text: 'Không khuyến khích', value: 4 },
            ],
        },
        {
            question_text: 'Bạn có cảm thấy áp lực quá mức trong học tập không?',
            question_type: 'yes_no',
            category: 'Áp Lực Học Tập',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Đánh giá về sự công bằng trong đánh giá kết quả học tập?',
            question_type: 'scale',
            category: 'Công Bằng Đánh Giá',
            options: [
                { text: '1 - Rất không công bằng', value: 1 },
                { text: '2 - Không công bằng', value: 2 },
                { text: '3 - Trung bình', value: 3 },
                { text: '4 - Công bằng', value: 4 },
                { text: '5 - Rất công bằng', value: 5 },
            ],
        },
        {
            question_text: 'Bạn có được khuyến khích làm việc nhóm không?',
            question_type: 'yes_no',
            category: 'Làm Việc Nhóm',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Trường có tạo cơ hội để sinh viên phát triển toàn diện không?',
            question_type: 'multiple_choice',
            category: 'Phát Triển Toàn Diện',
            options: [
                { text: 'Rất nhiều cơ hội', value: 1 },
                { text: 'Nhiều cơ hội', value: 2 },
                { text: 'Ít cơ hội', value: 3 },
                { text: 'Không có cơ hội', value: 4 },
            ],
        },

        // Định hướng nghề nghiệp (8 câu)
        {
            question_text: 'Bạn có nhận được tư vấn về định hướng nghề nghiệp không?',
            question_type: 'yes_no',
            category: 'Tư Vấn Nghề Nghiệp',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Chất lượng tư vấn nghề nghiệp như thế nào?',
            question_type: 'scale',
            category: 'Chất Lượng Tư Vấn',
            options: [
                { text: '1 - Rất kém', value: 1 },
                { text: '2 - Kém', value: 2 },
                { text: '3 - Trung bình', value: 3 },
                { text: '4 - Tốt', value: 4 },
                { text: '5 - Rất tốt', value: 5 },
            ],
        },
        {
            question_text: 'Trường có tổ chức các buổi job fair không?',
            question_type: 'yes_no',
            category: 'Cơ Hội Việc Làm',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn có được hỗ trợ tìm kiếm thực tập không?',
            question_type: 'multiple_choice',
            category: 'Hỗ Trợ Thực Tập',
            options: [
                { text: 'Rất nhiều', value: 1 },
                { text: 'Có hỗ trợ', value: 2 },
                { text: 'Ít hỗ trợ', value: 3 },
                { text: 'Không hỗ trợ', value: 4 },
            ],
        },
        {
            question_text: 'Chương trình học có phù hợp với yêu cầu thị trường không?',
            question_type: 'yes_no',
            category: 'Phù Hợp Thị Trường',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Đánh giá về cơ hội kết nối với doanh nghiệp?',
            question_type: 'scale',
            category: 'Kết Nối Doanh Nghiệp',
            options: [
                { text: '1 - Rất ít', value: 1 },
                { text: '2 - Ít', value: 2 },
                { text: '3 - Trung bình', value: 3 },
                { text: '4 - Nhiều', value: 4 },
                { text: '5 - Rất nhiều', value: 5 },
            ],
        },
        {
            question_text: 'Bạn có được trang bị kỹ năng cần thiết cho nghề nghiệp?',
            question_type: 'yes_no',
            category: 'Trang Bị Kỹ Năng',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Trường có mời chuyên gia từ doanh nghiệp đến chia sẻ không?',
            question_type: 'multiple_choice',
            category: 'Chia Sẻ Chuyên Gia',
            options: [
                { text: 'Thường xuyên', value: 1 },
                { text: 'Thỉnh thoảng', value: 2 },
                { text: 'Hiếm khi', value: 3 },
                { text: 'Không bao giờ', value: 4 },
            ],
        },

        // Sức khỏe và đời sống (8 câu)
        {
            question_text: 'Bạn có được chăm sóc sức khỏe tốt tại trường không?',
            question_type: 'yes_no',
            category: 'Chăm Sóc Sức Khỏe',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Đánh giá về phòng y tế/trạm y tế trường?',
            question_type: 'scale',
            category: 'Dịch Vụ Y Tế',
            options: [
                { text: '1 - Rất kém', value: 1 },
                { text: '2 - Kém', value: 2 },
                { text: '3 - Trung bình', value: 3 },
                { text: '4 - Tốt', value: 4 },
                { text: '5 - Rất tốt', value: 5 },
            ],
        },
        {
            question_text: 'Bạn có được tư vấn tâm lý khi cần không?',
            question_type: 'yes_no',
            category: 'Hỗ Trợ Tâm Lý',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Trường có tổ chức các hoạt động thể thao không?',
            question_type: 'multiple_choice',
            category: 'Hoạt Động Thể Thao',
            options: [
                { text: 'Rất nhiều', value: 1 },
                { text: 'Có tổ chức', value: 2 },
                { text: 'Ít', value: 3 },
                { text: 'Không có', value: 4 },
            ],
        },
        {
            question_text: 'Cơ sở vật chất thể thao có đầy đủ không?',
            question_type: 'yes_no',
            category: 'Cơ Sở Thể Thao',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Đánh giá về chất lượng bữa ăn tại căn tin?',
            question_type: 'scale',
            category: 'Chất Lượng Ăn Uống',
            options: [
                { text: '1 - Rất kém', value: 1 },
                { text: '2 - Kém', value: 2 },
                { text: '3 - Trung bình', value: 3 },
                { text: '4 - Tốt', value: 4 },
                { text: '5 - Rất tốt', value: 5 },
            ],
        },
        {
            question_text: 'Bạn có cảm thấy cân bằng giữa học tập và cuộc sống không?',
            question_type: 'yes_no',
            category: 'Cân Bằng Cuộc Sống',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Trường có quan tâm đến sức khỏe tinh thần sinh viên không?',
            question_type: 'multiple_choice',
            category: 'Quan Tâm Sức Khỏe Tinh Thần',
            options: [
                { text: 'Rất quan tâm', value: 1 },
                { text: 'Quan tâm', value: 2 },
                { text: 'Ít quan tâm', value: 3 },
                { text: 'Không quan tâm', value: 4 },
            ],
        },

        // Tài chính và học phí (8 câu)
        {
            question_text: 'Học phí có hợp lý so với chất lượng đào tạo không?',
            question_type: 'yes_no',
            category: 'Học Phí',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Đánh giá về tính minh bạch của các khoản thu?',
            question_type: 'scale',
            category: 'Minh Bạch Tài Chính',
            options: [
                { text: '1 - Không minh bạch', value: 1 },
                { text: '2 - Ít minh bạch', value: 2 },
                { text: '3 - Khá minh bạch', value: 3 },
                { text: '4 - Minh bạch', value: 4 },
                { text: '5 - Rất minh bạch', value: 5 },
            ],
        },
        {
            question_text: 'Bạn có biết về các chương trình học bổng không?',
            question_type: 'yes_no',
            category: 'Nhận Thức Học Bổng',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Quy trình đóng học phí có thuận tiện không?',
            question_type: 'multiple_choice',
            category: 'Quy Trình Thanh Toán',
            options: [
                { text: 'Rất thuận tiện', value: 1 },
                { text: 'Thuận tiện', value: 2 },
                { text: 'Không thuận tiện', value: 3 },
                { text: 'Rất khó khăn', value: 4 },
            ],
        },
        {
            question_text: 'Bạn có nhận được hỗ trợ tài chính khi cần không?',
            question_type: 'yes_no',
            category: 'Hỗ Trợ Tài Chính',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Đánh giá về tính cạnh tranh của mức học phí?',
            question_type: 'scale',
            category: 'Cạnh Tranh Học Phí',
            options: [
                { text: '1 - Rất cao', value: 1 },
                { text: '2 - Cao', value: 2 },
                { text: '3 - Hợp lý', value: 3 },
                { text: '4 - Thấp', value: 4 },
                { text: '5 - Rất thấp', value: 5 },
            ],
        },
        {
            question_text: 'Trường có hỗ trợ sinh viên có hoàn cảnh khó khăn không?',
            question_type: 'yes_no',
            category: 'Hỗ Trợ Hoàn Cảnh',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Các khoản phí phát sinh có được thông báo rõ ràng không?',
            question_type: 'multiple_choice',
            category: 'Thông Báo Phí',
            options: [
                { text: 'Rất rõ ràng', value: 1 },
                { text: 'Rõ ràng', value: 2 },
                { text: 'Không rõ ràng', value: 3 },
                { text: 'Rất mơ hồ', value: 4 },
            ],
        },

        // Sinh hoạt & Hoạt động ngoại khóa (10 câu)
        {
            question_text: 'Bạn có tham gia các hoạt động ngoại khóa của trường không?',
            question_type: 'yes_no',
            category: 'Hoạt Động Ngoại Khóa',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Nếu có, mức độ hài lòng của bạn về các hoạt động ngoại khóa?',
            question_type: 'scale',
            category: 'Hoạt Động Ngoại Khóa',
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
            category: 'Góp Ý Hoạt Động Ngoại Khóa',
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
            category: 'Câu Lạc Bộ',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Môi trường học tập tại trường có thân thiện và hỗ trợ không?',
            question_type: 'scale',
            category: 'Môi Trường',
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
            category: 'Cộng Đồng',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn có được hỗ trợ tốt từ bạn bè khi gặp khó khăn?',
            question_type: 'multiple_choice',
            category: 'Hỗ Trợ Từ Bạn Bè',
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
            category: 'Sự Kiện',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Đánh giá về mối quan hệ giữa sinh viên và giảng viên?',
            question_type: 'scale',
            category: 'Mối Quan Hệ',
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
            category: 'Góp Ý Đời Sống Sinh Viên',
        },

        // Hỗ trợ & Tư vấn (10 câu)
        {
            question_text: 'Bạn có nhận được tư vấn học tập đầy đủ từ giảng viên chủ nhiệm?',
            question_type: 'yes_no',
            category: 'Tư Vấn Học Tập',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Mức độ hài lòng về dịch vụ tư vấn học tập?',
            question_type: 'scale',
            category: 'Tư Vấn Học Tập',
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
            category: 'Sức Khỏe Tâm Lý',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn có biết về các dịch vụ hỗ trợ sinh viên của trường?',
            question_type: 'multiple_choice',
            category: 'Nhận Thức Dịch Vụ Hỗ Trợ',
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
            category: 'Thủ Tục Hành Chính',
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
            category: 'Hỗ Trợ Nhân Viên',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn có được thông báo kịp thời về các thông tin quan trọng?',
            question_type: 'multiple_choice',
            category: 'Truyền Thông',
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
            category: 'Hệ Thống',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Đánh giá về dịch vụ tư vấn nghề nghiệp của trường?',
            question_type: 'scale',
            category: 'Dịch Vụ Tư Vấn Nghề Nghiệp',
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
            category: 'Góp Ý Dịch Vụ Hỗ Trợ',
        },

        // TÂM LÝ - MENTAL (15 câu)
        {
            question_text: 'Bạn có cảm thấy căng thẳng, lo âu trong thời gian học tập không?',
            question_type: 'scale',
            category: 'Tâm Lý',
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
            category: 'Tâm Lý',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Chất lượng giấc ngủ của bạn như thế nào?',
            question_type: 'multiple_choice',
            category: 'Tâm Lý',
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
            category: 'Tâm Lý',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Mức độ tự tin của bạn trong học tập?',
            question_type: 'scale',
            category: 'Tâm Lý',
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
            category: 'Tâm Lý',
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
            category: 'Tâm Lý',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn đánh giá sức khỏe tinh thần của mình hiện tại?',
            question_type: 'scale',
            category: 'Tâm Lý',
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
            category: 'Tâm Lý',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn có muốn được tư vấn tâm lý không?',
            question_type: 'multiple_choice',
            category: 'Tâm Lý',
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
            category: 'Tâm Lý',
        },
        {
            question_text: 'Bạn có thường xuyên lo lắng về tương lai không?',
            question_type: 'scale',
            category: 'Tâm Lý',
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
            category: 'Tâm Lý',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Động lực học tập của bạn hiện tại?',
            question_type: 'scale',
            category: 'Tâm Lý',
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
            category: 'Tâm Lý',
        },

        // HỌC TẬP - ACADEMIC (15 câu)
        {
            question_text: 'Bạn dành bao nhiêu giờ mỗi ngày cho việc tự học?',
            question_type: 'multiple_choice',
            category: 'Học Tập',
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
            category: 'Học Tập',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Điểm trung bình học kỳ trước của bạn?',
            question_type: 'scale',
            category: 'Học Tập',
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
            category: 'Học Tập',
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
            category: 'Học Tập',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Môn học nào bạn gặp khó khăn nhất?',
            question_type: 'free_text',
            category: 'Học Tập',
        },
        {
            question_text: 'Bạn có thường xuyên đi học đầy đủ không?',
            question_type: 'scale',
            category: 'Học Tập',
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
            category: 'Học Tập',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn cảm thấy áp lực về kết quả học tập?',
            question_type: 'scale',
            category: 'Học Tập',
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
            category: 'Học Tập',
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
            category: 'Học Tập',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Mục tiêu học tập của bạn trong học kỳ này?',
            question_type: 'free_text',
            category: 'Học Tập',
        },
        {
            question_text: 'Bạn có hỏi giảng viên khi không hiểu bài không?',
            question_type: 'scale',
            category: 'Học Tập',
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
            category: 'Học Tập',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn cần hỗ trợ gì để cải thiện kết quả học tập?',
            question_type: 'free_text',
            category: 'Học Tập',
        },

        // XÃ HỘI - SOCIAL (15 câu)
        {
            question_text: 'Bạn có bao nhiêu bạn thân ở trường?',
            question_type: 'multiple_choice',
            category: 'Xã Hội',
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
            category: 'Xã Hội',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Mối quan hệ với bạn cùng lớp của bạn?',
            question_type: 'scale',
            category: 'Xã Hội',
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
            category: 'Xã Hội',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn cảm thấy được chấp nhận trong nhóm bạn bè không?',
            question_type: 'scale',
            category: 'Xã Hội',
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
            category: 'Xã Hội',
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
            category: 'Xã Hội',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn đánh giá kỹ năng giao tiếp của mình?',
            question_type: 'scale',
            category: 'Xã Hội',
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
            category: 'Xã Hội',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn cảm thấy thuộc về cộng đồng trường không?',
            question_type: 'scale',
            category: 'Xã Hội',
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
            category: 'Xã Hội',
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
            category: 'Xã Hội',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn muốn trường tổ chức thêm hoạt động giao lưu nào?',
            question_type: 'free_text',
            category: 'Xã Hội',
        },
        {
            question_text: 'Mối quan hệ với gia đình ảnh hưởng đến học tập?',
            question_type: 'scale',
            category: 'Xã Hội',
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
            category: 'Xã Hội',
        },

        // Đánh giá tổng quan (10 câu)
        {
            question_text: 'Bạn có hài lòng với quyết định chọn trường này không?',
            question_type: 'yes_no',
            category: 'Hài Lòng Chung',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Đánh giá tổng thể về trường?',
            question_type: 'scale',
            category: 'Đánh Giá Tổng Thể',
            options: [
                { text: '1 - Rất kém', value: 1 },
                { text: '2 - Kém', value: 2 },
                { text: '3 - Trung bình', value: 3 },
                { text: '4 - Tốt', value: 4 },
                { text: '5 - Rất tốt', value: 5 },
            ],
        },
        {
            question_text: 'Bạn có giới thiệu trường cho người khác không?',
            question_type: 'yes_no',
            category: 'Sẵn Lòng Giới Thiệu',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Uy tín của trường có đáp ứng kỳ vọng của bạn không?',
            question_type: 'multiple_choice',
            category: 'Uy Tín Trường',
            options: [
                { text: 'Vượt kỳ vọng', value: 1 },
                { text: 'Đáp ứng kỳ vọng', value: 2 },
                { text: 'Dưới kỳ vọng', value: 3 },
                { text: 'Rất dưới kỳ vọng', value: 4 },
            ],
        },
        {
            question_text: 'Trường có chuẩn bị tốt cho tương lai của bạn không?',
            question_type: 'yes_no',
            category: 'Chuẩn Bị Tương Lai',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Đánh giá về sự phát triển của trường trong những năm gần đây?',
            question_type: 'scale',
            category: 'Phát Triển Trường',
            options: [
                { text: '1 - Giảm sút', value: 1 },
                { text: '2 - Ít phát triển', value: 2 },
                { text: '3 - Giữ nguyên', value: 3 },
                { text: '4 - Phát triển', value: 4 },
                { text: '5 - Phát triển mạnh', value: 5 },
            ],
        },
        {
            question_text: 'Bạn có tự hào là sinh viên của trường không?',
            question_type: 'yes_no',
            category: 'Tự Hào Trường',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Trường có đáp ứng nhu cầu học tập của bạn không?',
            question_type: 'multiple_choice',
            category: 'Đáp Ứng Nhu Cầu',
            options: [
                { text: 'Hoàn toàn đáp ứng', value: 1 },
                { text: 'Đáp ứng', value: 2 },
                { text: 'Đáp ứng một phần', value: 3 },
                { text: 'Không đáp ứng', value: 4 },
            ],
        },
        {
            question_text: 'Nếu được chọn lại, bạn có chọn trường này không?',
            question_type: 'yes_no',
            category: 'Lựa Chọn Lại',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn có góp ý hoặc đề xuất nào khác cho trường?',
            question_type: 'free_text',
            category: 'Góp Ý Đề Xuất',
        },
        // Tài chính & Tinh thần (9 câu mới)
        {
            question_text: 'Gia đình bạn hỗ trợ tài chính cho việc học tập và sinh hoạt ở mức độ nào?',
            question_type: 'multiple_choice',
            category: 'Tài Chính Gia Đình',
            options: [
                { text: 'Không hỗ trợ', value: 0 },
                { text: 'Hỗ trợ rất ít, không đủ chi phí cơ bản', value: 1 },
                { text: 'Hỗ trợ đủ chi phí sinh hoạt tối thiểu', value: 2 },
                { text: 'Hỗ trợ tương đối đầy đủ', value: 3 },
                { text: 'Hỗ trợ hoàn toàn, không cần lo tài chính', value: 4 },
            ],
        },
        {
            question_text: 'Vấn đề tài chính có làm giảm thời gian bạn dành cho việc học không?',
            question_type: 'multiple_choice',
            category: 'Tác Động Tài Chính Đến Học Tập',
            options: [
                { text: 'Giảm rất nhiều', value: 0 },
                { text: 'Giảm đáng kể', value: 1 },
                { text: 'Giảm một phần', value: 2 },
                { text: 'Hầu như không ảnh hưởng', value: 3 },
                { text: 'Không ảnh hưởng', value: 4 },
            ],
        },
        {
            question_text: 'Bạn có thường xuyên lo lắng về tài chính trong khi học hoặc làm bài tập không?',
            question_type: 'multiple_choice',
            category: 'Lo Lắng Tài Chính',
            options: [
                { text: 'Gần như luôn luôn', value: 0 },
                { text: 'Thường xuyên', value: 1 },
                { text: 'Thỉnh thoảng', value: 2 },
                { text: 'Hiếm khi', value: 3 },
                { text: 'Không bao giờ', value: 4 },
            ],
        },
        {
            question_text: 'Căng thẳng tinh thần có ảnh hưởng đến khả năng tiếp thu bài học của bạn không?',
            question_type: 'multiple_choice',
            category: 'Sức Khỏe Tinh Thần',
            options: [
                { text: 'Ảnh hưởng rất nghiêm trọng', value: 0 },
                { text: 'Ảnh hưởng nhiều', value: 1 },
                { text: 'Ảnh hưởng vừa', value: 2 },
                { text: 'Ảnh hưởng ít', value: 3 },
                { text: 'Không ảnh hưởng', value: 4 },
            ],
        },
        {
            question_text: 'Bạn có cảm thấy kiệt sức hoặc mất động lực học tập trong thời gian gần đây không?',
            question_type: 'multiple_choice',
            category: 'Kiệt Sức Học Tập',
            options: [
                { text: 'Rất thường xuyên', value: 0 },
                { text: 'Thường xuyên', value: 1 },
                { text: 'Thỉnh thoảng', value: 2 },
                { text: 'Hiếm khi', value: 3 },
                { text: 'Không bao giờ', value: 4 },
            ],
        },
        {
            question_text: 'Chất lượng giấc ngủ của bạn có ảnh hưởng đến việc học và làm bài không?',
            question_type: 'multiple_choice',
            category: 'Giấc Ngủ Và Học Tập',
            options: [
                { text: 'Ảnh hưởng rất tiêu cực', value: 0 },
                { text: 'Ảnh hưởng tiêu cực', value: 1 },
                { text: 'Ảnh hưởng nhẹ', value: 2 },
                { text: 'Hầu như không ảnh hưởng', value: 3 },
                { text: 'Không ảnh hưởng', value: 4 },
            ],
        },
        {
            question_text: 'Kỳ vọng học tập từ gia đình có gây áp lực tinh thần cho bạn không?',
            question_type: 'multiple_choice',
            category: 'Áp Lực Gia Đình',
            options: [
                { text: 'Áp lực rất lớn', value: 0 },
                { text: 'Áp lực lớn', value: 1 },
                { text: 'Áp lực vừa', value: 2 },
                { text: 'Áp lực nhẹ', value: 3 },
                { text: 'Không áp lực', value: 4 },
            ],
        },
        {
            question_text: 'Khi kết quả học tập không tốt, gia đình bạn phản ứng như thế nào?',
            question_type: 'multiple_choice',
            category: 'Hỗ Trợ Gia Đình',
            options: [
                { text: 'Chỉ trích, gây áp lực', value: 0 },
                { text: 'Ít chia sẻ, không hỗ trợ', value: 1 },
                { text: 'Trung lập', value: 2 },
                { text: 'Động viên, khuyến khích', value: 3 },
                { text: 'Hỗ trợ tích cực, cùng tìm giải pháp', value: 4 },
            ],
        },
        {
            question_text: 'Tài chính và tinh thần hiện tại ảnh hưởng đến việc học của bạn như thế nào?',
            question_type: 'free_text',
            category: 'Tổng Hợp Tài Chính Tinh Thần',
        },
        // Cân bằng học tập & Trạng thái tinh thần (10 câu mới)
        {
            question_text: 'Trong thời gian gần đây, lịch sinh hoạt của bạn có thay đổi nhiều để cân bằng giữa học tập và các nhu cầu khác không?',
            question_type: 'multiple_choice',
            category: 'Cân Bằng Học Tập',
            options: [
                { text: 'Thay đổi rất nhiều, khó kiểm soát', value: 0 },
                { text: 'Thay đổi khá nhiều', value: 1 },
                { text: 'Có thay đổi ở mức vừa phải', value: 2 },
                { text: 'Ít thay đổi', value: 3 },
                { text: 'Hầu như không thay đổi', value: 4 },
            ],
        },
        {
            question_text: 'Bạn cảm thấy mức độ tập trung khi học trong thời gian gần đây như thế nào?',
            question_type: 'multiple_choice',
            category: 'Mức Độ Tập Trung',
            options: [
                { text: 'Rất khó tập trung', value: 0 },
                { text: 'Khó tập trung', value: 1 },
                { text: 'Bình thường', value: 2 },
                { text: 'Khá tập trung', value: 3 },
                { text: 'Rất tập trung', value: 4 },
            ],
        },
        {
            question_text: 'Trong các hoạt động hằng ngày, bạn có thường phải suy nghĩ nhiều về các vấn đề ngoài học tập không?',
            question_type: 'multiple_choice',
            category: 'Xao Nhãng Ngoài Học Tập',
            options: [
                { text: 'Gần như luôn luôn', value: 0 },
                { text: 'Thường xuyên', value: 1 },
                { text: 'Thỉnh thoảng', value: 2 },
                { text: 'Hiếm khi', value: 3 },
                { text: 'Hầu như không', value: 4 },
            ],
        },
        {
            question_text: 'Bạn đánh giá mức năng lượng của mình khi tham gia các buổi học hoặc tự học như thế nào?',
            question_type: 'multiple_choice',
            category: 'Năng Lượng Học Tập',
            options: [
                { text: 'Rất thấp', value: 0 },
                { text: 'Thấp', value: 1 },
                { text: 'Bình thường', value: 2 },
                { text: 'Khá tốt', value: 3 },
                { text: 'Rất tốt', value: 4 },
            ],
        },
        {
            question_text: 'Khi có thời gian rảnh, bạn thường ưu tiên hoạt động nào hơn?',
            question_type: 'multiple_choice',
            category: 'Ưu Tiên Thời Gian',
            options: [
                { text: 'Giải quyết các việc cá nhân bắt buộc', value: 0 },
                { text: 'Nghỉ ngơi để hồi phục', value: 1 },
                { text: 'Kết hợp nghỉ ngơi và học tập', value: 2 },
                { text: 'Ôn tập hoặc chuẩn bị bài', value: 3 },
                { text: 'Chủ động học thêm, mở rộng kiến thức', value: 4 },
            ],
        },
        {
            question_text: 'Trong những tuần gần đây, cảm nhận chung của bạn về việc học là gì?',
            question_type: 'multiple_choice',
            category: 'Cảm Nhận Về Học Tập',
            options: [
                { text: 'Khá nặng nề và áp lực', value: 0 },
                { text: 'Hơi căng thẳng', value: 1 },
                { text: 'Bình thường', value: 2 },
                { text: 'Khá thoải mái', value: 3 },
                { text: 'Thoải mái và có động lực', value: 4 },
            ],
        },
        {
            question_text: 'Khi gặp bài khó hoặc kết quả chưa như mong muốn, bạn thường phản ứng như thế nào?',
            question_type: 'multiple_choice',
            category: 'Phản Ứng Khi Gặp Khó Khăn',
            options: [
                { text: 'Dễ nản và muốn bỏ qua', value: 0 },
                { text: 'Cố gắng nhưng khá mệt mỏi', value: 1 },
                { text: 'Giữ bình tĩnh và xử lý từng bước', value: 2 },
                { text: 'Chủ động tìm cách cải thiện', value: 3 },
                { text: 'Xem đó là cơ hội để học tốt hơn', value: 4 },
            ],
        },
        {
            question_text: 'Bạn cảm nhận sự ổn định trong sinh hoạt và học tập hiện tại như thế nào?',
            question_type: 'multiple_choice',
            category: 'Ổn Định Sinh Hoạt',
            options: [
                { text: 'Rất thiếu ổn định', value: 0 },
                { text: 'Thiếu ổn định', value: 1 },
                { text: 'Tương đối ổn định', value: 2 },
                { text: 'Khá ổn định', value: 3 },
                { text: 'Rất ổn định', value: 4 },
            ],
        },
        {
            question_text: 'Trong thời gian gần đây, bạn có cảm thấy việc học diễn ra đúng với kỳ vọng của bản thân không?',
            question_type: 'multiple_choice',
            category: 'Kỳ Vọng Học Tập',
            options: [
                { text: 'Hoàn toàn không', value: 0 },
                { text: 'Chưa đạt kỳ vọng', value: 1 },
                { text: 'Đạt ở mức trung bình', value: 2 },
                { text: 'Khá đúng kỳ vọng', value: 3 },
                { text: 'Rất đúng kỳ vọng', value: 4 },
            ],
        },
        {
            question_text: 'Theo bạn, điều gì đang ảnh hưởng nhiều nhất đến trải nghiệm học tập của bạn hiện tại?',
            question_type: 'free_text',
            category: 'Trải Nghiệm Học Tập Tổng Quát',
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
    console.log('\n📂 Categories created (Vietnamese):');
    categories.forEach((cat) => {
        const count = surveyQuestions.filter((q) => q.category === cat).length;
        console.log(`  - ${cat}: ${count} questions`);
    });

    console.log('\n✅ Survey questions seeding completed (Vietnamese categories)!');
    console.log('\n💡 Bạn có thể sử dụng các câu hỏi này để tạo khảo sát mới.');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

