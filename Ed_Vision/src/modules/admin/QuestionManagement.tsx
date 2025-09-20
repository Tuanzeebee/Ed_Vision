import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/ui/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";

type Question = {
  id: string;
  questionId: string;
  content: string;
  category: 'psychology' | 'finance' | 'general' | 'academic' | 'health';
  type: 'single-choice' | 'multiple-choice' | 'text' | 'scale';
  optionsCount: number | string;
  createdDate: string;
};

type QuestionFilter = {
  search: string;
  category: string;
  type: string;
};

const QuestionManagement = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<QuestionFilter>({
    search: '',
    category: 'all',
    type: 'all'
  });

  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  // Mock data
  const questions: Question[] = [
    {
      id: "1",
      questionId: "Q001",
      content: "Bạn đánh giá sức khỏe tâm lý tổng thể của mình như thế nào?",
      category: "psychology",
      type: "single-choice",
      optionsCount: 4,
      createdDate: "2024-01-15"
    },
    {
      id: "2", 
      questionId: "Q002",
      content: "Những thách thức tài chính nào bạn hiện đang gặp phải?",
      category: "finance",
      type: "multiple-choice",
      optionsCount: 6,
      createdDate: "2024-01-14"
    },
    {
      id: "3",
      questionId: "Q003", 
      content: "Bạn có hài lòng với chất lượng giảng dạy của giảng viên không?",
      category: "academic",
      type: "scale",
      optionsCount: "5 điểm",
      createdDate: "2024-01-13"
    },
    {
      id: "4",
      questionId: "Q004",
      content: "Mô tả tình trạng sức khỏe thể chất hiện tại của bạn",
      category: "health",
      type: "text",
      optionsCount: "Tự do",
      createdDate: "2024-01-12"
    },
    {
      id: "5",
      questionId: "Q005",
      content: "Bạn thường sử dụng những phương tiện giao thông nào để đến trường?",
      category: "general",
      type: "multiple-choice",
      optionsCount: 5,
      createdDate: "2024-01-11"
    },
    {
      id: "6",
      questionId: "Q006",
      content: "Đánh giá mức độ hài lòng với cơ sở vật chất của trường",
      category: "general",
      type: "single-choice", 
      optionsCount: 5,
      createdDate: "2024-01-10"
    }
  ];

  const handleFilterChange = (filterKey: keyof QuestionFilter, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  const handleSelectQuestion = (questionId: string) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleSelectAll = () => {
    setSelectedQuestions(
      selectedQuestions.length === questions.length 
        ? [] 
        : questions.map(q => q.id)
    );
  };

  const getCategoryBadge = (category: string) => {
    const badges = {
      'psychology': 'bg-purple-100 text-purple-800',
      'finance': 'bg-green-100 text-green-800',
      'academic': 'bg-blue-100 text-blue-800',
      'health': 'bg-red-100 text-red-800',
      'general': 'bg-indigo-100 text-indigo-800'
    };
    const labels = {
      'psychology': 'Tâm lý',
      'finance': 'Tài chính',
      'academic': 'Học tập',
      'health': 'Sức khỏe',
      'general': 'Tổng quát'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[category as keyof typeof badges]}`}>
        {labels[category as keyof typeof labels]}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const badges = {
      'single-choice': 'bg-blue-100 text-blue-800',
      'multiple-choice': 'bg-orange-100 text-orange-800',
      'scale': 'bg-yellow-100 text-yellow-800',
      'text': 'bg-gray-100 text-gray-800'
    };
    const labels = {
      'single-choice': 'Một lựa chọn',
      'multiple-choice': 'Nhiều lựa chọn',
      'scale': 'Thang điểm',
      'text': 'Văn bản'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[type as keyof typeof badges]}`}>
        {labels[type as keyof typeof labels]}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Khảo sát</h1>
          <p className="text-gray-600">Xem và quản lý tất cả các câu hỏi khảo sát trong hệ thống</p>
        </div>

        {/* Toolbar */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4 items-center w-full lg:w-auto">
                {/* Search */}
                <div className="flex-1 min-w-[300px]">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Tìm kiếm câu hỏi..." 
                      className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs text-gray-700"
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                    <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  </div>
                </div>
                
                {/* Category Filter */}
                <div>
                  <select 
                    className="border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs text-gray-700 cursor-pointer"
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  >
                    <option value="all" className="text-gray-600">Tất cả Danh mục</option>
                    <option value="psychology" className="text-gray-600">Tâm lý</option>
                    <option value="finance" className="text-gray-600">Tài chính</option>
                    <option value="general" className="text-gray-600">Tổng quát</option>
                    <option value="academic" className="text-gray-600">Học tập</option>
                    <option value="health" className="text-gray-600">Sức khỏe</option>
                  </select>
                </div>

                {/* Type Filter */}
                <div>
                  <select 
                    className="border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs text-gray-700 cursor-pointer"
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                  >
                    <option value="all" className="text-gray-600">Tất cả Loại</option>
                    <option value="single-choice" className="text-gray-600">Một lựa chọn</option>
                    <option value="multiple-choice" className="text-gray-600">Nhiều lựa chọn</option>
                    <option value="text" className="text-gray-600">Văn bản</option>
                    <option value="scale" className="text-gray-600">Thang điểm</option>
                  </select>
                </div>

                <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-1.5 rounded-md font-medium transition-colors flex items-center cursor-pointer text-xs">
                  <i className="fas fa-filter mr-2"></i>
                  Lọc
                </button>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <button 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md font-medium transition-colors flex items-center whitespace-nowrap cursor-pointer text-xs"
                  onClick={() => navigate('/admin/questions/add')}
                >
                  <i className="fas fa-plus mr-2"></i>
                  Thêm Câu hỏi
                </button>
                <button 
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-md font-medium transition-colors flex items-center cursor-pointer text-xs"
                  disabled={selectedQuestions.length === 0}
                >
                  <i className="fas fa-trash mr-2"></i>
                  Xóa đã chọn
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions Table */}
        <Card>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-3 text-left">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedQuestions.length === questions.length}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">Nội dung câu hỏi</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">ID</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Danh mục</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Loại</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Số tùy chọn</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Ngày tạo</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((question) => (
                    <tr key={question.id} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-3">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={selectedQuestions.includes(question.id)}
                          onChange={() => handleSelectQuestion(question.id)}
                        />
                      </td>
                      <td className="border border-gray-200 px-4 py-3">
                        <div className="max-w-md">
                          <p className="font-medium text-gray-800">{question.content}</p>
                        </div>
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-center">
                        <span className="font-mono text-sm text-gray-600">{question.questionId}</span>
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-center">
                        {getCategoryBadge(question.category)}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-center">
                        {getTypeBadge(question.type)}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-center">
                        <span className="text-sm font-medium text-gray-800">
                          {typeof question.optionsCount === 'number' ? `${question.optionsCount} tùy chọn` : question.optionsCount}
                        </span>
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-center">
                        <span className="text-sm text-gray-600">{question.createdDate}</span>
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer" title="Chỉnh sửa">
                            <i className="fas fa-edit"></i>
                          </button>
                          <button className="text-green-600 hover:text-green-800 transition-colors cursor-pointer" title="Sao chép">
                            <i className="fas fa-copy"></i>
                          </button>
                          <button className="text-red-600 hover:text-red-800 transition-colors cursor-pointer" title="Xóa">
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Hiện <span className="font-medium">1</span> đến <span className="font-medium">6</span> trong tổng số <span className="font-medium">24</span> kết quả
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 cursor-pointer" disabled>
                  <i className="fas fa-chevron-left mr-1"></i>
                  Trước
                </button>
                <button className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg cursor-pointer">1</button>
                <button className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">2</button>
                <button className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">3</button>
                <button className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">4</button>
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
};

export default QuestionManagement;