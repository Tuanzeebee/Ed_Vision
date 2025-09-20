import { useState } from "react";
import AdminLayout from "@/components/ui/admin/AdminLayout";
import { Card, CardContent } from "../../components/ui/card";
import TeacherProfileHeader from "@/components/ui/admin/TeacherProfileHeader";
import TeacherTabNavigation from "@/components/ui/admin/TeacherTabNavigation";

type Review = {
  id: string;
  studentName: string;
  studentAvatar: string;
  subject: string;
  semester: string;
  date: string;
  rating: number;
  comment: string;
  hasTeacherReply?: boolean;
  teacherReply?: string;
  helpfulCount: number;
  hasImages?: boolean;
  images?: string[];
  isAnonymous?: boolean;
};

type RatingFilter = {
  stars: string;
  subject: string;
  semester: string;
  hasComments: boolean;
  hasImages: boolean;
  keyword: string;
};

export default function TeacherRatings() {
  const [filters, setFilters] = useState<RatingFilter>({
    stars: 'all',
    subject: 'all',
    semester: 'all',
    hasComments: false,
    hasImages: false,
    keyword: ''
  });

  // Mock data for reviews
  const reviews: Review[] = [
    {
      id: "1",
      studentName: "Sinh viên ẩn danh",
      studentAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50&h=50&fit=crop&crop=face",
      subject: "Lập trình Java",
      semester: "HK1 2024",
      date: "15/11/2024",
      rating: 5,
      comment: "Giảng viên rất tận tâm và nhiệt tình. Phương pháp giảng dạy dễ hiểu, luôn sẵn sàng hỗ trợ sinh viên khi gặp khó khăn. Nội dung bài giảng được chuẩn bị kỹ lưỡng và cập nhật.",
      hasTeacherReply: true,
      teacherReply: "Cảm ơn bạn đã đánh giá tích cực! Tôi sẽ tiếp tục cố gắng để mang đến những bài học chất lượng nhất cho các bạn sinh viên.",
      helpfulCount: 24,
      isAnonymous: true
    },
    {
      id: "2",
      studentName: "Nguyễn Văn A",
      studentAvatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=50&h=50&fit=crop&crop=face",
      subject: "Cơ sở dữ liệu",
      semester: "HK1 2024",
      date: "12/11/2024",
      rating: 4,
      comment: "Môn học rất thú vị và bổ ích. Thầy giảng dạy rất hay, có nhiều ví dụ thực tế. Tuy nhiên, bài tập hơi khó một chút.",
      helpfulCount: 18,
      hasImages: true,
      images: [
        "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=100&h=80&fit=crop",
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=100&h=80&fit=crop"
      ]
    },
    {
      id: "3",
      studentName: "Trần Thị B",
      studentAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face",
      subject: "Mạng máy tính",
      semester: "HK1 2024",
      date: "10/11/2024",
      rating: 5,
      comment: "Thầy dạy rất hay và dễ hiểu. Phương pháp giảng dạy hiện đại, kết hợp lý thuyết và thực hành một cách hiệu quả. Rất hài lòng với môn học này.",
      helpfulCount: 31
    },
    {
      id: "4",
      studentName: "Lê Văn C",
      studentAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face",
      subject: "Trí tuệ nhân tạo",
      semester: "HK1 2024",
      date: "08/11/2024",
      rating: 4,
      comment: "Môn học có nội dung phong phú và cập nhật. Thầy có kiến thức sâu rộng và truyền đạt một cách logic, dễ hiểu. Các bài tập thực hành rất bổ ích cho việc áp dụng kiến thức.",
      helpfulCount: 15
    },
    {
      id: "5",
      studentName: "Phạm Thị D",
      studentAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face",
      subject: "Lập trình Java",
      semester: "HK1 2024",
      date: "05/11/2024",
      rating: 4,
      comment: "Thầy dạy rất tốt, luôn kiên nhẫn giải đáp thắc mắc của sinh viên. Môn học được thiết kế hợp lý từ cơ bản đến nâng cao.",
      helpfulCount: 12
    }
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <i 
        key={index}
        className={`fas fa-star ${index < rating ? 'text-yellow-400' : 'far fa-star text-yellow-400'}`}
      />
    ));
  };

  const handleFilterChange = (key: keyof RatingFilter, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Teacher Profile Header */}
        <TeacherProfileHeader />

        {/* Tab Navigation */}
        <TeacherTabNavigation activeTab="Đánh giá giảng dạy" />

        {/* Rating Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Star Distribution */}
          <Card className="p-6">
            <CardContent>
              <h3 className="text-xl font-bold text-gray-800 mb-6">Phân bố đánh giá theo sao</h3>
              <div className="space-y-4">
                {[
                  { stars: 5, percentage: 68, color: 'bg-green-500' },
                  { stars: 4, percentage: 22, color: 'bg-blue-500' },
                  { stars: 3, percentage: 3, color: 'bg-yellow-500' },
                  { stars: 2, percentage: 2, color: 'bg-orange-500' },
                  { stars: 1, percentage: 5, color: 'bg-red-500' }
                ].map(({ stars, percentage, color }) => (
                  <div key={stars} className="flex items-center">
                    <div className="flex items-center w-16">
                      <span className="text-sm font-medium text-gray-700 mr-2">{stars}</span>
                      <i className="fas fa-star text-yellow-400"></i>
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`${color} h-3 rounded-full`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-12 text-right">{percentage}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Criteria */}
          <Card className="p-6">
            <CardContent>
              <h3 className="text-xl font-bold text-gray-800 mb-6">Tiêu chí đánh giá chi tiết</h3>
              <div className="space-y-6">
                {[
                  { name: "Nội dung giảng dạy", score: 4.75, percentage: 95, color: 'bg-blue-500' },
                  { name: "Phương pháp giảng dạy", score: 4.82, percentage: 96.4, color: 'bg-green-500' },
                  { name: "Thái độ", score: 4.91, percentage: 98.2, color: 'bg-emerald-500' },
                  { name: "Hỗ trợ sinh viên", score: 4.68, percentage: 93.6, color: 'bg-purple-500' }
                ].map(({ name, score, percentage, color }) => (
                  <div key={name}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">{name}</span>
                      <span className="text-sm font-bold text-gray-800">{score}/5</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`${color} h-3 rounded-full`} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <CardContent>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Bộ lọc đánh giá</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Số sao</label>
                <select 
                  value={filters.stars}
                  onChange={(e) => handleFilterChange('stars', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 cursor-pointer"
                >
                  <option value="all">Tất cả</option>
                  <option value="5">5 sao</option>
                  <option value="4">4 sao</option>
                  <option value="3">3 sao</option>
                  <option value="2">2 sao</option>
                  <option value="1">1 sao</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Môn học</label>
                <select 
                  value={filters.subject}
                  onChange={(e) => handleFilterChange('subject', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 cursor-pointer"
                >
                  <option value="all">Tất cả môn học</option>
                  <option value="java">Lập trình Java</option>
                  <option value="database">Cơ sở dữ liệu</option>
                  <option value="network">Mạng máy tính</option>
                  <option value="ai">Trí tuệ nhân tạo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Học kỳ</label>
                <select 
                  value={filters.semester}
                  onChange={(e) => handleFilterChange('semester', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 cursor-pointer"
                >
                  <option value="all">Tất cả học kỳ</option>
                  <option value="hk1-2024">HK1 2024</option>
                  <option value="hk2-2023">HK2 2023</option>
                  <option value="hk1-2023">HK1 2023</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Tùy chọn</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={filters.hasComments}
                      onChange={(e) => handleFilterChange('hasComments', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Có bình luận</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={filters.hasImages}
                      onChange={(e) => handleFilterChange('hasImages', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Có hình ảnh</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Tìm kiếm</label>
                <input 
                  type="text" 
                  placeholder="Nhập từ khóa..." 
                  value={filters.keyword}
                  onChange={(e) => handleFilterChange('keyword', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reviews List */}
        <Card className="p-6">
          <CardContent>
            <h3 className="text-xl font-bold text-gray-800 mb-6">Danh sách đánh giá chi tiết</h3>
            
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <img 
                      src={review.studentAvatar} 
                      alt={review.studentName} 
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-800">{review.studentName}</h4>
                          <p className="text-sm text-gray-600">
                            {review.subject} • {review.semester} • {review.date}
                          </p>
                        </div>
                        <div className="flex text-yellow-400">
                          {renderStars(review.rating)}
                        </div>
                      </div>
                      <p className="text-gray-700 mb-4">{review.comment}</p>
                      
                      {/* Teacher Reply */}
                      {review.hasTeacherReply && review.teacherReply && (
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                          <div className="flex items-center mb-2">
                            <i className="fas fa-reply text-blue-600 mr-2"></i>
                            <span className="font-medium text-blue-800">Phản hồi từ giảng viên</span>
                          </div>
                          <p className="text-blue-700">{review.teacherReply}</p>
                        </div>
                      )}
                      
                      {/* Images */}
                      {review.hasImages && review.images && (
                        <div className="flex gap-2 mb-4">
                          {review.images.map((image, index) => (
                            <img 
                              key={index}
                              src={image} 
                              alt={`Class photo ${index + 1}`} 
                              className="w-20 h-16 rounded-lg object-cover"
                            />
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4">
                        <button className="flex items-center text-gray-600 hover:text-blue-600 cursor-pointer">
                          <i className="fas fa-thumbs-up mr-1"></i>
                          <span className="text-sm">Hữu ích ({review.helpfulCount})</span>
                        </button>
                        <button className="flex items-center text-gray-600 hover:text-blue-600 cursor-pointer">
                          <i className="fas fa-reply mr-1"></i>
                          <span className="text-sm">Phản hồi</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Hiển thị <span className="font-medium">1–5</span> trong tổng số <span className="font-medium">245</span> đánh giá
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 cursor-pointer" 
                  disabled
                >
                  <i className="fas fa-chevron-left mr-1"></i>
                  Trước
                </button>
                <button className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg cursor-pointer">1</button>
                <button className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">2</button>
                <button className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">3</button>
                <span className="px-3 py-2 text-sm font-medium text-gray-500">...</span>
                <button className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">49</button>
                <button className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                  Sau
                  <i className="fas fa-chevron-right ml-1"></i>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}