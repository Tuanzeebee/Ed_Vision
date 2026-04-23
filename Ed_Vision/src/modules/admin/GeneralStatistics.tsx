import { Card, CardContent } from "@/components/ui/card";
import AdminLayout from "../../components/ui/admin/AdminLayout";
import TimeFilter from "../../components/ui/admin/TimeFilter";
import { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

export default function GeneralStatistics() {
  // State for time filter
  const [timeFilter, setTimeFilter] = useState('tháng-này');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Function to get data based on time filter
  const getFilteredData = (baseData: number[]) => {
    const multipliers: { [key: string]: number } = {
      'hôm-nay': 0.05,
      'tuần-này': 0.1,
      'tháng-này': 1,
      'tất-cả': 24
    };
    
    const multiplier = multipliers[timeFilter] || 1;
    return baseData.map((value: number) =>Math.round(value * multiplier));
  };

  // Get current time filter label
  const getTimeFilterLabel = () => {
    const labels: { [key: string]: string } = {
      'hôm-nay': 'hôm nay',
      'tuần-này': 'tuần này',
      'tháng-này': 'tháng này', 
      'tất-cả': 'tất cả thời gian'};
    return labels[timeFilter] || 'tháng này';
  };

  // Chart data configurations with Vietnamese labels


  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'as const
      }
    },
    cutout: '60%'};


  return (
    <AdminLayout>
      <div className="p-6 bg-gray-50 overflow-y-auto">
        {/* Page Header with Time Filter */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <span className="text-blue-600 text-2xl mr-3"></span>
              <h1 className="text-3xl font-bold text-gray-900">Thống kê Tổng quát</h1>
            </div>
            
            {/* Enhanced Time Filter */}
            <TimeFilter 
              viewMode={timeFilter as 'day'| 'month'| 'year'| 'all'}
              selectedDate={new Date(selectedYear, 0, 1)}
              onViewModeChange={(mode) =>setTimeFilter(mode)}
              onDateChange={(date) =>setSelectedYear(date.getFullYear())}
            />
          </div>
          <p className="text-gray-600">Tổng quan hoạt động học tập và hiệu suất hệ thống AI giáo dục đại học ({getTimeFilterLabel()})</p>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Warning Risk Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Sinh viên có cảnh báo</p>
                  <p className="text-3xl font-bold text-blue-900">{getFilteredData([324])[0].toLocaleString()}</p>
                  <p className="text-sm text-green-600 flex items-center mt-1">+7 sinh viên so với kỳ trước
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl"></span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Prediction Accuracy */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Độ chính xác AI dự đoán</p>
                  <p className="text-3xl font-bold text-green-900">94.2%</p>
                  <p className="text-sm text-green-600 flex items-center mt-1">+2.0% so với kỳ trước
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl"></span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Average Study Progress */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Tiến độ học tập trung bình</p>
                  <p className="text-3xl font-bold text-purple-900">78.3%</p>
                  <p className="text-sm text-green-600 flex items-center mt-1">+4.5% so với kỳ trước
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl"></span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completion Rate */}
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">Tỉ lệ hoàn thành bài tập</p>
                  <p className="text-3xl font-bold text-red-900">89.1%</p>
                  <p className="text-sm text-green-600 flex items-center mt-1">+3.0% so với kỳ trước
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl"></span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Peak Hours Analysis Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Phân tích hoạt động chính</h2>
          
          {/* Peak Access Hours Table */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Bảng khung giờ cao điểm truy cập</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Khung giờ</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Số lượt truy cập TB</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">So với tuần trước</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Nhận định / Khuyến nghị</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">08h – 11h</td>
                      <td className="py-3 px-4 text-center text-sm text-gray-700">820 phiên/giờ</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center text-sm font-medium text-green-600">
                          <i className="fas fa-arrow-up mr-1"></i>+12%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">Truy cập buổi sáng tăng, cần đảm bảo hệ thống đăng nhập ổn định</td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">14h – 17h</td>
                      <td className="py-3 px-4 text-center text-sm text-gray-700">1,050 phiên/giờ</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center text-sm font-medium text-red-600">
                          <i className="fas fa-arrow-down mr-1"></i>-5%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">Giảm nhẹ, nhưng vẫn là khung giờ nhiều bài tập được nộp</td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors bg-blue-50/30">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">20h – 23h</td>
                      <td className="py-3 px-4 text-center text-sm text-gray-700 font-bold">1,480 phiên/giờ</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center text-sm font-medium text-green-600">
                          <i className="fas fa-arrow-up mr-1"></i>+18%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 font-medium">Cao điểm nhất, kỹ thuật nên trực sẵn để xử lý sự cố nếu có</td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">06h – 08h</td>
                      <td className="py-3 px-4 text-center text-sm text-gray-700">340 phiên/giờ</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center text-sm font-medium text-green-600">
                          <i className="fas fa-arrow-up mr-1"></i>+8%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">Khung giờ sáng sớm, chủ yếu ôn tập trước giờ học</td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">23h – 01h</td>
                      <td className="py-3 px-4 text-center text-sm text-gray-700">680 phiên/giờ</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center text-sm font-medium text-green-600">
                          <i className="fas fa-arrow-up mr-1"></i>+25%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">Tăng mạnh do gần kỳ thi, cần theo dõi hiệu suất server</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Activity Types by Time Period Table */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Bảng loại hoạt động phổ biến theo khung giờ</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Khung giờ</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Hoạt động chính</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Tỷ trọng</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">14h – 17h</td>
                      <td className="py-3 px-4 text-sm text-gray-700">Nộp bài tập / Quiz</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">55%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">Deadline thường rơi vào buổi chiều</td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors bg-purple-50/30">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">20h – 23h</td>
                      <td className="py-3 px-4 text-sm text-gray-700">Study Room + Hỏi AI</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">60%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 font-medium">Thói quen học buổi tối, cần theo dõi băng thông video</td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">21h – 24h</td>
                      <td className="py-3 px-4 text-sm text-gray-700">Hỏi AI Assistant</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">35%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">Đột biến tăng khi cận kỳ thi</td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">08h – 11h</td>
                      <td className="py-3 px-4 text-sm text-gray-700">Xem tài liệu / Video bài giảng</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">40%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">Chuẩn bị cho lớp học buổi sáng</td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">23h – 01h</td>
                      <td className="py-3 px-4 text-sm text-gray-700">Ôn tập / Làm đề mẫu</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">45%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">Học đêm trước kỳ thi, cần hỗ trợ kỹ thuật</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Summary */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Thông báo phân tích đi kèm</h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                  <p className="text-sm text-gray-800">
                    <span className="font-semibold text-blue-800">Khung giờ cao điểm:</span>Trong {getTimeFilterLabel()}, hệ thống ghi nhận khung giờ cao điểm nhất là 
                    <span className="font-bold text-blue-600">20h–23h với trung bình 1,480 phiên/giờ</span>, tăng 18% so với tuần trước. 
                    Đây là thời điểm sinh viên tham gia Study Room và ôn tập nhiều nhất, do đó đội kỹ thuật nên trực sẵn.
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
                  <p className="text-sm text-gray-800">
                    <span className="font-semibold text-green-800">Thói quen nộp bài:</span>Hoạt động nộp bài tập tập trung nhiều vào 
                    <span className="font-bold text-green-600">14h–17h</span>, phù hợp với lịch deadline. 
                    <span className="font-medium text-green-700">Gợi ý:</span>hệ thống nên có cảnh báo tải trước khung giờ này.
                  </p>
                </div>
                
                <div className="p-4 bg-orange-50 border-l-4 border-orange-400 rounded-r-lg">
                  <p className="text-sm text-gray-800">
                    <span className="font-semibold text-orange-800">Xu hướng học đêm:</span>Khung giờ 
                    <span className="font-bold text-orange-600">23h–01h tăng 25%</span>do gần kỳ thi. 
                    Cần tăng cường giám sát hiệu suất server và đảm bảo độ ổn định của hệ thống AI Assistant.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advisor Statistics Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Thống kê cố vấn học tập</h2>
          <p className="text-gray-600 mb-6">Theo dõi hoạt động tư vấn và hiệu quả hỗ trợ sinh viên</p>
          
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Hiệu quả cố vấn học tập</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Cố vấn</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Số SV phụ trách</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Warning</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">At-risk</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Can thiệp (7 ngày)</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">% SV cải thiện</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors bg-green-50/30">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">Thầy A</td>
                      <td className="py-3 px-4 text-center text-sm text-gray-700">40</td>
                      <td className="py-3 px-4 text-center text-sm text-yellow-600 font-medium">8</td>
                      <td className="py-3 px-4 text-center text-sm text-red-600 font-medium">5</td>
                      <td className="py-3 px-4 text-center text-sm text-blue-600 font-medium">22</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">52%
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">Cô B</td>
                      <td className="py-3 px-4 text-center text-sm text-gray-700">35</td>
                      <td className="py-3 px-4 text-center text-sm text-yellow-600 font-medium">6</td>
                      <td className="py-3 px-4 text-center text-sm text-red-600 font-medium">2</td>
                      <td className="py-3 px-4 text-center text-sm text-blue-600 font-medium">18</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">47%
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors bg-red-50/30">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">Thầy C</td>
                      <td className="py-3 px-4 text-center text-sm text-gray-700">45</td>
                      <td className="py-3 px-4 text-center text-sm text-yellow-600 font-medium">11</td>
                      <td className="py-3 px-4 text-center text-sm text-red-600 font-medium">8</td>
                      <td className="py-3 px-4 text-center text-sm text-blue-600 font-medium">55</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">39%
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Advisor Analysis */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Phân tích hiệu quả cố vấn</h3>
              <div className="space-y-3">
                <div className="p-3 bg-green-100 border border-green-300 rounded-lg">
                  <p className="text-sm font-medium text-green-800">Hiệu quả cao nhất</p>
                  <p className="text-xs text-green-700">Cô vấn A có hiệu quả tư vấn cao nhất (52% SV cải thiện).</p>
                </div>
                
                <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                  <p className="text-sm font-medium text-red-800">Cần hỗ trợ</p>
                  <p className="text-xs text-red-700">Cố vấn C đang phụ trách nhiều SV at-risk (8 SV), cần thêm hỗ trợ.</p>
                </div>
                
                <div className="p-3 bg-blue-100 border border-blue-300 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Tổng quan</p>
                  <p className="text-xs text-blue-700">Trung bình {getFilteredData([120])[0]} sinh viên được phụ trách, với {getFilteredData([25])[0]} ca can thiệp trong tuần qua.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Parent Engagement Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Thống kê sự tham gia phụ huynh</h2>
          <p className="text-gray-600 mb-6">Theo dõi mức độ gắn kết của phụ huynh trong việc đồng hành học tập</p>
          
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Hoạt động của phụ huynh</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Hoạt động phụ huynh</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Số lượt</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Tỷ lệ</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Nhận định</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors bg-blue-50/30">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">Xem điểm số</td>
                      <td className="py-3 px-4 text-center text-sm text-gray-700 font-bold">{getFilteredData([1280])[0].toLocaleString()}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">54%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 font-medium">Quan tâm nhiều nhất</td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">Xem tiến độ học tập</td>
                      <td className="py-3 px-4 text-center text-sm text-gray-700">{getFilteredData([780])[0].toLocaleString()}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">33%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">Tăng +12% so với tháng trước</td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors bg-yellow-50/30">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">Xem cảnh báo at-risk</td>
                      <td className="py-3 px-4 text-center text-sm text-gray-700">{getFilteredData([190])[0].toLocaleString()}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">8%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">Còn thấp, cần cải thiện thông báo</td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors bg-red-50/30">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">Gửi phản hồi</td>
                      <td className="py-3 px-4 text-center text-sm text-gray-700">{getFilteredData([100])[0].toLocaleString()}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">5%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">Tương tác chưa cao</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Parent Engagement Analysis */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Phân tích sự tham gia phụ huynh</h3>
              <div className="space-y-3">
                <div className="p-3 bg-blue-100 border border-blue-300 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Quan tâm chính</p>
                  <p className="text-xs text-blue-700">Phụ huynh chủ yếu quan tâm đến điểm số (54% lượt truy cập).</p>
                </div>
                
                <div className="p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800">Cần cải thiện</p>
                  <p className="text-xs text-yellow-700">Chỉ 8% phụ huynh xem cảnh báo at-risk, cho thấy cần tăng nhắc nhở.</p>
                </div>
                
                <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                  <p className="text-sm font-medium text-red-800">Khuyến nghị</p>
                  <p className="text-xs text-red-700">Tỷ lệ phản hồi thấp (5%), có thể thêm khảo sát nhanh để tăng tương tác.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Risk & Behavior Analysis Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Phân tích rủi ro & hành vi học tập</h2>

          {/* Risk Analysis Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* High Risk Alerts */}
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold text-red-800 mb-4">Cảnh báo rủi ro cao</h4>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-lg border border-red-200">
                    <p className="text-sm text-gray-800 font-medium">Ít tham gia phòng học</p>
                    <p className="text-xs text-red-600">→ Nguy cơ nộp bài muộn cao hơn 2.3 lần</p>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg border border-red-200">
                    <p className="text-sm text-gray-800 font-medium">Hỏi AI nhiều nhưng ít tham gia lớp</p>
                    <p className="text-xs text-red-600">→ Nguy cơ điểm TB &lt; 6.0</p>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg border border-red-200">
                    <p className="text-sm text-gray-800 font-medium">Không đăng nhập &gt; 5 ngày</p>
                    <p className="text-xs text-red-600">→ 80% rơi vào nhóm có rủi ro</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Notifications */}
            <Card>
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">� Thông báo hệ thống</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                    <p className="text-sm font-medium text-red-800">Cảnh báo</p>
                    <p className="text-xs text-red-700">Sinh viên có rủi ro chiếm 12% (tăng +3.5%)</p>
                  </div>
                  
                  <div className="p-3 bg-blue-100 border border-blue-300 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">Xu hướng</p>
                    <p className="text-xs text-blue-700">40% hoạt động sau 21h, tăng 10% so với kỳ trước</p>
                  </div>
                  
                  <div className="p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800">Khuyến nghị</p>
                    <p className="text-xs text-yellow-700">Tỷ lệ giải quyết &lt; 25% cần kiểm tra biện pháp can thiệp</p>
                  </div>
                  
                  <div className="p-3 bg-green-100 border border-green-300 rounded-lg">
                    <p className="text-sm font-medium text-green-800">Tích cực</p>
                    <p className="text-xs text-green-700">Tỷ lệ can thiệp thành công tăng 5.3%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* High-Risk Students Table - Standalone Section */}
          <Card className="border-l-4 border-red-500">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <span className="text-red-500 text-2xl mr-3"></span>Sinh viên có rủi ro cao nhất ({getTimeFilterLabel()})
                </h3>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">Tìm thấy {getFilteredData([20])[0]} sinh viên có rủi ro</span>
                  <button className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors">Xuất danh sách
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">STT</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Họ và tên</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Mã sinh viên</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Lớp</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Điểm rủi ro</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Bài quá hạn</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Điểm TB</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Lần cuối đăng nhập</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { rank: 1, name: 'Nguyễn Văn A', id: 'SV001', class: 'CNTT01', risk: 9.2, overdue: 5, avg: 4.8, lastLogin: '7 ngày', color: 'red'},
                      { rank: 2, name: 'Trần Thị B', id: 'SV045', class: 'CNTT02', risk: 8.7, overdue: 3, avg: 5.2, lastLogin: '4 ngày', color: 'red'},
                      { rank: 3, name: 'Lê Minh C', id: 'SV089', class: 'CNTT01', risk: 7.9, overdue: 2, avg: 5.8, lastLogin: '3 ngày', color: 'orange'},
                      { rank: 4, name: 'Phạm Văn D', id: 'SV123', class: 'CNTT03', risk: 7.3, overdue: 1, avg: 6.1, lastLogin: '2 ngày', color: 'yellow'},
                      { rank: 5, name: 'Hoàng Thị E', id: 'SV167', class: 'CNTT02', risk: 6.8, overdue: 2, avg: 6.3, lastLogin: '1 ngày', color: 'yellow'},
                      { rank: 6, name: 'Võ Minh F', id: 'SV203', class: 'CNTT01', risk: 6.5, overdue: 1, avg: 6.5, lastLogin: '3 ngày', color: 'yellow'},
                      { rank: 7, name: 'Đặng Thị G', id: 'SV298', class: 'CNTT03', risk: 6.2, overdue: 0, avg: 6.8, lastLogin: '2 ngày', color: 'yellow'},
                      { rank: 8, name: 'Bùi Văn H', id: 'SV334', class: 'CNTT02', risk: 5.9, overdue: 1, avg: 7.0, lastLogin: '1 ngày', color: 'yellow'}
                    ].map((student) =>(
                      <tr key={student.rank} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors border-l-4 ${
                        student.color === 'red'? 'border-l-red-500 bg-red-50/30':
                        student.color === 'orange'? 'border-l-orange-500 bg-orange-50/30':
                        'border-l-yellow-500 bg-yellow-50/30'}`}>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">#{student.rank}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-3 ${
                              student.color === 'red'? 'bg-red-500':
                              student.color === 'orange'? 'bg-orange-500':
                              'bg-yellow-500'}`}></div>
                            <span className="text-sm font-medium text-gray-900">{student.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700 font-mono">{student.id}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{student.class}</td>
                        <td className={`py-3 px-4 text-center text-sm font-bold ${
                          student.color === 'red'? 'text-red-700':
                          student.color === 'orange'? 'text-orange-700':
                          'text-yellow-700'}`}>{student.risk}</td>
                        <td className="py-3 px-4 text-center text-sm text-gray-700">{student.overdue} bài</td>
                        <td className="py-3 px-4 text-center text-sm text-gray-700">{student.avg}</td>
                        <td className="py-3 px-4 text-center text-sm text-gray-700">{student.lastLogin}</td>
                        <td className="py-3 px-4 text-center">
                          <button className="px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded hover:bg-blue-600 transition-colors">Can thiệp
                          </button>
                        </td>
                      </tr>))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-700">Hiển thị 1-8 trong tổng số {getFilteredData([20])[0]} sinh viên có rủi ro
                </div>
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Trước
                  </button>
                  <span className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg">1</span>
                  <span className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer">2</span>
                  <span className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer">3</span>
                  <button className="px-3 py-1 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Sau
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI System Performance */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Hiệu suất hệ thống AI</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Thống kê hệ thống AI</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-800">Câu hỏi AI đã trả lời</span>
                      <p className="text-xs text-gray-600">{getTimeFilterLabel()}</p>
                    </div>
                    <span className="font-semibold text-green-600">{getFilteredData([8756])[0].toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-800">Gợi ý bài tập tự động</span>
                      <p className="text-xs text-gray-600">{getTimeFilterLabel()}</p>
                    </div>
                    <span className="font-semibold text-blue-600">{getFilteredData([2341])[0].toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-800">Phân tích lỗ hổng học tập</span>
                      <p className="text-xs text-gray-600">{getTimeFilterLabel()}</p>
                    </div>
                    <span className="font-semibold text-purple-600">{getFilteredData([567])[0].toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-800">Dự đoán kết quả kỳ thi</span>
                      <p className="text-xs text-gray-600">{getTimeFilterLabel()}</p>
                    </div>
                    <span className="font-semibold text-orange-600">{getFilteredData([1890])[0].toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Time Usage Distribution */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Phân bố thời gian sử dụng hệ thống</h3>
                <div className="h-64 w-full">
                  <Doughnut data={{
                    labels: ['Phòng học (40%)', 'Làm bài tập (35%)', 'Tra cứu tài liệu (15%)', 'Hỏi AI (10%)'],
                    datasets: [{
                      data: [40, 35, 15, 10],
                      backgroundColor: [
                        '#10b981',
                        '#3b82f6',
                        '#f59e0b',
                        '#8b5cf6'],
                      borderWidth: 2,
                      borderColor: '#ffffff'}]
                  }} options={doughnutOptions} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>);
}