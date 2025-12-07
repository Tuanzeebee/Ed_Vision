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
            category: 'chất_lượng_giảng_dạy',
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
            category: 'chất_lượng_giảng_dạy',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Giảng viên có sử dụng phương pháp giảng dạy phù hợp không?',
            question_type: 'multiple_choice',
            category: 'chất_lượng_giảng_dạy',
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
            category: 'khó_khăn_học_tập',
        },
        {
            question_text: 'Mức độ hài lòng của bạn về tài liệu học tập?',
            question_type: 'rating',
            category: 'tài_liệu_học_tập',
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
            category: 'chất_lượng_giảng_dạy',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn có đủ thời gian để hoàn thành bài tập và đồ án không?',
            question_type: 'multiple_choice',
            category: 'khối_lượng_công_việc',
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
            category: 'độ_khó_môn_học',
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
            category: 'tính_ứng_dụng',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn có góp ý gì để cải thiện chất lượng giảng dạy?',
            question_type: 'free_text',
            category: 'góp_ý_đề_xuất',
        },

        // Cơ sở vật chất (10 câu)
        {
            question_text: 'Phòng học có đủ trang thiết bị và tiện nghi không?',
            question_type: 'multiple_choice',
            category: 'cơ_sở_vật_chất',
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
            category: 'cơ_sở_vật_chất',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Đánh giá về điều kiện phòng học (ánh sáng, nhiệt độ, không gian)?',
            question_type: 'scale',
            category: 'cơ_sở_vật_chất',
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
            category: 'thư_viện',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn có sử dụng phòng thực hành/lab thường xuyên không?',
            question_type: 'multiple_choice',
            category: 'sử_dụng_phòng_lab',
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
            category: 'chất_lượng_phòng_lab',
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
            category: 'hạ_tầng_công_nghệ',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Khu vực ăn uống/căn tin có đảm bảo vệ sinh an toàn thực phẩm?',
            question_type: 'multiple_choice',
            category: 'cơ_sở_vật_chất',
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
            category: 'cơ_sở_vật_chất',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn có góp ý gì về cơ sở vật chất của trường?',
            question_type: 'free_text',
            category: 'góp_ý_đề_xuất',
        },

        // Hỗ trợ sinh viên (10 câu)
        {
            question_text: 'Giảng viên có nhiệt tình hỗ trợ sinh viên không?',
            question_type: 'scale',
            category: 'hỗ_trợ_giảng_viên',
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
            category: 'hỗ_trợ_giảng_viên',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Phòng đào tạo có giải quyết thủ tục nhanh chóng không?',
            question_type: 'multiple_choice',
            category: 'hỗ_trợ_hành_chính',
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
            category: 'hỗ_trợ_học_tập',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn có được hướng dẫn rõ ràng về quy trình học tập?',
            question_type: 'scale',
            category: 'hướng_dẫn_học_tập',
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
            category: 'nhận_thức_dịch_vụ',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Phòng công tác sinh viên có giải quyết vấn đề hiệu quả không?',
            question_type: 'multiple_choice',
            category: 'hỗ_trợ_sinh_viên',
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
            category: 'truyền_thông_thông_tin',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Đánh giá về chất lượng hỗ trợ kỹ thuật (IT support)?',
            question_type: 'scale',
            category: 'hỗ_trợ_kỹ_thuật',
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
            category: 'góp_ý_đề_xuất',
        },

        // Hoạt động ngoại khóa (8 câu)
        {
            question_text: 'Bạn có tham gia các câu lạc bộ/đội nhóm không?',
            question_type: 'yes_no',
            category: 'tham_gia_hoạt_động',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Chất lượng các hoạt động ngoại khóa như thế nào?',
            question_type: 'scale',
            category: 'chất_lượng_hoạt_động_ngoại_khóa',
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
            category: 'phù_hợp_hoạt_động',
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
            category: 'góp_ý_đề_xuất',
        },
        {
            question_text: 'Thời gian tổ chức hoạt động có hợp lý không?',
            question_type: 'yes_no',
            category: 'tổ_chức_hoạt_động',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Đánh giá về sự đa dạng của hoạt động ngoại khóa?',
            question_type: 'scale',
            category: 'đa_dạng_hoạt_động',
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
            category: 'khuyến_khích_tham_gia',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Các hoạt động có giúp phát triển kỹ năng mềm không?',
            question_type: 'multiple_choice',
            category: 'phát_triển_kỹ_năng',
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
            category: 'môi_trường_học_tập',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Đánh giá về mối quan hệ giữa sinh viên với nhau?',
            question_type: 'scale',
            category: 'quan_hệ_bạn_bè',
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
            category: 'văn_hóa_trường_học',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Trường có khuyến khích sự sáng tạo và đổi mới không?',
            question_type: 'multiple_choice',
            category: 'khuyến_khích_sáng_tạo',
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
            category: 'áp_lực_học_tập',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Đánh giá về sự công bằng trong đánh giá kết quả học tập?',
            question_type: 'scale',
            category: 'công_bằng_đánh_giá',
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
            category: 'làm_việc_nhóm',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Trường có tạo cơ hội để sinh viên phát triển toàn diện không?',
            question_type: 'multiple_choice',
            category: 'phát_triển_toàn_diện',
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
            category: 'tư_vấn_nghề_nghiệp',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Chất lượng tư vấn nghề nghiệp như thế nào?',
            question_type: 'scale',
            category: 'chất_lượng_tư_vấn',
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
            category: 'cơ_hội_việc_làm',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn có được hỗ trợ tìm kiếm thực tập không?',
            question_type: 'multiple_choice',
            category: 'hỗ_trợ_thực_tập',
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
            category: 'phù_hợp_thị_trường',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Đánh giá về cơ hội kết nối với doanh nghiệp?',
            question_type: 'scale',
            category: 'kết_nối_doanh_nghiệp',
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
            category: 'trang_bị_kỹ_năng',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Trường có mời chuyên gia từ doanh nghiệp đến chia sẻ không?',
            question_type: 'multiple_choice',
            category: 'chia_sẻ_chuyên_gia',
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
            category: 'chăm_sóc_sức_khỏe',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Đánh giá về phòng y tế/trạm y tế trường?',
            question_type: 'scale',
            category: 'dịch_vụ_y_tế',
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
            category: 'hỗ_trợ_tâm_lý',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Trường có tổ chức các hoạt động thể thao không?',
            question_type: 'multiple_choice',
            category: 'hoạt_động_thể_thao',
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
            category: 'cơ_sở_thể_thao',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Đánh giá về chất lượng bữa ăn tại căn tin?',
            question_type: 'scale',
            category: 'chất_lượng_ăn_uống',
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
            category: 'cân_bằng_cuộc_sống',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Trường có quan tâm đến sức khỏe tinh thần sinh viên không?',
            question_type: 'multiple_choice',
            category: 'quan_tâm_sức_khỏe_tinh_thần',
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
            category: 'học_phí',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Đánh giá về tính minh bạch của các khoản thu?',
            question_type: 'scale',
            category: 'minh_bạch_tài_chính',
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
            category: 'nhận_thức_học_bổng',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Quy trình đóng học phí có thuận tiện không?',
            question_type: 'multiple_choice',
            category: 'quy_trình_thanh_toán',
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
            category: 'hỗ_trợ_tài_chính',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Đánh giá về tính cạnh tranh của mức học phí?',
            question_type: 'scale',
            category: 'cạnh_tranh_học_phí',
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
            category: 'hỗ_trợ_hoàn_cảnh',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Các khoản phí phát sinh có được thông báo rõ ràng không?',
            question_type: 'multiple_choice',
            category: 'thông_báo_phí',
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
            category: 'hoạt_động_ngoại_khóa',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Nếu có, mức độ hài lòng của bạn về các hoạt động ngoại khóa?',
            question_type: 'scale',
            category: 'hoạt_động_ngoại_khóa',
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
            category: 'góp_ý_hoạt_động_ngoại_khóa',
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
            category: 'câu_lạc_bộ',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Môi trường học tập tại trường có thân thiện và hỗ trợ không?',
            question_type: 'scale',
            category: 'môi_trường',
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
            category: 'cộng_đồng',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn có được hỗ trợ tốt từ bạn bè khi gặp khó khăn?',
            question_type: 'multiple_choice',
            category: 'hỗ_trợ_từ_bạn_bè',
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
            category: 'sự_kiện',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Đánh giá về mối quan hệ giữa sinh viên và giảng viên?',
            question_type: 'scale',
            category: 'mối_quan_hệ',
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
            category: 'góp_ý_đời_sống_sinh_viên',
        },

        // Hỗ trợ & Tư vấn (10 câu)
        {
            question_text: 'Bạn có nhận được tư vấn học tập đầy đủ từ giảng viên chủ nhiệm?',
            question_type: 'yes_no',
            category: 'tư_vấn_học_tập',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Mức độ hài lòng về dịch vụ tư vấn học tập?',
            question_type: 'scale',
            category: 'tư_vấn_học_tập',
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
            category: 'sức_khỏe_tâm_lý',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn có biết về các dịch vụ hỗ trợ sinh viên của trường?',
            question_type: 'multiple_choice',
            category: 'nhận_thức_dịch_vụ_hỗ_trợ',
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
            category: 'thủ_tục_hành_chính',
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
            category: 'hỗ_trợ_nhân_viên',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn có được thông báo kịp thời về các thông tin quan trọng?',
            question_type: 'multiple_choice',
            category: 'truyền_thông',
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
            category: 'hệ_thống',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Đánh giá về dịch vụ tư vấn nghề nghiệp của trường?',
            question_type: 'scale',
            category: 'dịch_vụ_tư_vấn_nghề_nghiệp',
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
            category: 'góp_ý_dịch_vụ_hỗ_trợ',
        },

        // TÂM LÝ - MENTAL (15 câu)
        {
            question_text: 'Bạn có cảm thấy căng thẳng, lo âu trong thời gian học tập không?',
            question_type: 'scale',
            category: 'tâm_lý',
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
            category: 'tâm_lý',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Chất lượng giấc ngủ của bạn như thế nào?',
            question_type: 'multiple_choice',
            category: 'tâm_lý',
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
            category: 'tâm_lý',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Mức độ tự tin của bạn trong học tập?',
            question_type: 'scale',
            category: 'tâm_lý',
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
            category: 'tâm_lý',
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
            category: 'tâm_lý',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn đánh giá sức khỏe tinh thần của mình hiện tại?',
            question_type: 'scale',
            category: 'tâm_lý',
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
            category: 'tâm_lý',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn có muốn được tư vấn tâm lý không?',
            question_type: 'multiple_choice',
            category: 'tâm_lý',
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
            category: 'tâm_lý',
        },
        {
            question_text: 'Bạn có thường xuyên lo lắng về tương lai không?',
            question_type: 'scale',
            category: 'tâm_lý',
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
            category: 'tâm_lý',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Động lực học tập của bạn hiện tại?',
            question_type: 'scale',
            category: 'tâm_lý',
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
            category: 'tâm_lý',
        },

        // HỌC TẬP - ACADEMIC (15 câu)
        {
            question_text: 'Bạn dành bao nhiêu giờ mỗi ngày cho việc tự học?',
            question_type: 'multiple_choice',
            category: 'học_tập',
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
            category: 'học_tập',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Điểm trung bình học kỳ trước của bạn?',
            question_type: 'scale',
            category: 'học_tập',
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
            category: 'học_tập',
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
            category: 'học_tập',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Môn học nào bạn gặp khó khăn nhất?',
            question_type: 'free_text',
            category: 'học_tập',
        },
        {
            question_text: 'Bạn có thường xuyên đi học đầy đủ không?',
            question_type: 'scale',
            category: 'học_tập',
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
            category: 'học_tập',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn cảm thấy áp lực về kết quả học tập?',
            question_type: 'scale',
            category: 'học_tập',
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
            category: 'học_tập',
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
            category: 'học_tập',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Mục tiêu học tập của bạn trong học kỳ này?',
            question_type: 'free_text',
            category: 'học_tập',
        },
        {
            question_text: 'Bạn có hỏi giảng viên khi không hiểu bài không?',
            question_type: 'scale',
            category: 'học_tập',
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
            category: 'học_tập',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn cần hỗ trợ gì để cải thiện kết quả học tập?',
            question_type: 'free_text',
            category: 'học_tập',
        },

        // XÃ HỘI - SOCIAL (15 câu)
        {
            question_text: 'Bạn có bao nhiêu bạn thân ở trường?',
            question_type: 'multiple_choice',
            category: 'xã_hội',
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
            category: 'xã_hội',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Mối quan hệ với bạn cùng lớp của bạn?',
            question_type: 'scale',
            category: 'xã_hội',
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
            category: 'xã_hội',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn cảm thấy được chấp nhận trong nhóm bạn bè không?',
            question_type: 'scale',
            category: 'xã_hội',
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
            category: 'xã_hội',
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
            category: 'xã_hội',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn đánh giá kỹ năng giao tiếp của mình?',
            question_type: 'scale',
            category: 'xã_hội',
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
            category: 'xã_hội',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn cảm thấy thuộc về cộng đồng trường không?',
            question_type: 'scale',
            category: 'xã_hội',
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
            category: 'xã_hội',
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
            category: 'xã_hội',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn muốn trường tổ chức thêm hoạt động giao lưu nào?',
            question_type: 'free_text',
            category: 'xã_hội',
        },
        {
            question_text: 'Mối quan hệ với gia đình ảnh hưởng đến học tập?',
            question_type: 'scale',
            category: 'xã_hội',
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
            category: 'xã_hội',
        },

        // Đánh giá tổng quan (10 câu)
        {
            question_text: 'Bạn có hài lòng với quyết định chọn trường này không?',
            question_type: 'yes_no',
            category: 'hài_lòng_chung',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Đánh giá tổng thể về trường?',
            question_type: 'scale',
            category: 'đánh_giá_tổng_thể',
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
            category: 'sẵn_lòng_giới_thiệu',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Uy tín của trường có đáp ứng kỳ vọng của bạn không?',
            question_type: 'multiple_choice',
            category: 'uy_tín_trường',
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
            category: 'chuẩn_bị_tương_lai',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Đánh giá về sự phát triển của trường trong những năm gần đây?',
            question_type: 'scale',
            category: 'phát_triển_trường',
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
            category: 'tự_hào_trường',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Trường có đáp ứng nhu cầu học tập của bạn không?',
            question_type: 'multiple_choice',
            category: 'đáp_ứng_nhu_cầu',
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
            category: 'lựa_chọn_lại',
            options: [
                { text: 'Có', value: 1 },
                { text: 'Không', value: 0 },
            ],
        },
        {
            question_text: 'Bạn có góp ý hoặc đề xuất nào khác cho trường?',
            question_type: 'free_text',
            category: 'góp_ý_đề_xuất',
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
