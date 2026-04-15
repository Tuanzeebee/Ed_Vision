import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/ui/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import questionService, { type CreateQuestionData } from "@/services/api/questionService";
import { useToast } from "@/lib/useToast";

type QuestionType = 'single-choice'| 'multiple-choice'| 'text'| 'scale';
type Category = 'psychology'| 'finance'| 'general'| 'academic'| 'health';

type QuestionFormData = {
  content: string;
  category: Category | '';
  answerType: QuestionType | '';
  options: string[];
};

type ExistingQuestion = {
  id: string;
  content: string;
  category: Category;
  type: QuestionType;
  optionsCount: number | string;
  createdDate: string;
};

const AddQuestion = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<QuestionFormData>({
    content: '',
    category: '',
    answerType: '',
    options: ['', '']
  });

  // Mock data for existing questions
  const existingQuestions: ExistingQuestion[] = [
    {
      id: "1",
      content: "Bạn đánh giá sức khỏe tâm lý tổng thể của mình như thế nào?",
      category: "psychology",
      type: "single-choice",
      optionsCount: 4,
      createdDate: "15/08/2023"},
    {
      id: "2",
      content: "Những thách thức tài chính nào bạn hiện đang gặp phải?",
      category: "finance",
      type: "multiple-choice",
      optionsCount: 6,
      createdDate: "12/08/2023"},
    {
      id: "3",
      content: "Bạn hài lòng như thế nào với cơ sở vật chất của trường?",
      category: "general",
      type: "single-choice",
      optionsCount: 5,
      createdDate: "10/08/2023"},
    {
      id: "4",
      content: "Bạn quản lý lịch học của mình như thế nào?",
      category: "academic",
      type: "multiple-choice",
      optionsCount: 4,
      createdDate: "08/08/2023"},
    {
      id: "5",
      content: "Bạn tham gia các hoạt động xã hội với tần suất như thế nào?",
      category: "health",
      type: "single-choice",
      optionsCount: 5,
      createdDate: "05/08/2023"}
  ];

  const handleInputChange = (field: keyof QuestionFormData, value: string) => {
    setFormData(prev =>({
      ...prev,
      [field]: value
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData(prev =>({
      ...prev,
      options: newOptions
    }));
  };

  const addOption = () => {
    setFormData(prev =>({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const removeOption = (index: number) => {
    if (formData.options.length >2) {
      const newOptions = formData.options.filter((_, i) =>i !== index);
      setFormData(prev =>({
        ...prev,
        options: newOptions
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.content.trim()) {
      showToast('Vui lòng nhập nội dung câu hỏi', 'error');
      return;
    }
    
    if (!formData.category) {
      showToast('Vui lòng chọn danh mục', 'error');
      return;
    }
    
    if (!formData.answerType) {
      showToast('Vui lòng chọn loại câu trả lời', 'error');
      return;
    }

    // Validate options for choice types
    if ((formData.answerType === 'single-choice'|| formData.answerType === 'multiple-choice') && 
        formData.options.filter(opt =>opt.trim()).length < 2) {
      showToast('Vui lòng nhập ít nhất 2 tùy chọn', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const questionData: CreateQuestionData = {
        question_text: formData.content,
        category: formData.category,
        question_type: formData.answerType,
        is_active: true,
      };

      // Add options for choice types
      if (formData.answerType === 'single-choice'|| formData.answerType === 'multiple-choice') {
        questionData.options = formData.options
          .filter(opt =>opt.trim())
          .map((opt, index) =>({
            option_text: opt,
            option_value: index + 1
          }));
      }

      // Add max_value for scale type
      if (formData.answerType === 'scale') {
        questionData.max_value = 5; // Default 5-point scale
        questionData.min_value = 1;
      }

      await questionService.createQuestion(questionData);
      
      showToast('Đã thêm câu hỏi thành công', 'success');
      navigate('/admin/questions');
    } catch (error: any) {
      console.error('Failed to create question:', error);
      showToast(error.response?.data?.message || 'Không thể thêm câu hỏi', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryBadge = (category: Category) => {
    const badges = {
      'psychology': 'bg-purple-100 text-purple-800',
      'finance': 'bg-green-100 text-green-800',
      'academic': 'bg-blue-100 text-blue-800',
      'health': 'bg-red-100 text-red-800',
      'general': 'bg-indigo-100 text-indigo-800'};
    const labels = {
      'psychology': 'Tâm lý',
      'finance': 'Tài chính',
      'academic': 'Học tập',
      'health': 'Sức khỏe',
      'general': 'Tổng quát'};
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[category]}`}>
        {labels[category]}
      </span>);
  };

  const getTypeBadge = (type: QuestionType) => {
    const badges = {
      'single-choice': 'bg-blue-100 text-blue-800',
      'multiple-choice': 'bg-orange-100 text-orange-800',
      'scale': 'bg-yellow-100 text-yellow-800',
      'text': 'bg-gray-100 text-gray-800'};
    const labels = {
      'single-choice': 'Một lựa chọn',
      'multiple-choice': 'Nhiều lựa chọn',
      'scale': 'Thang điểm',
      'text': 'Văn bản'};
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[type]}`}>
        {labels[type]}
      </span>);
  };

  const showOptions = (formData.answerType === 'single-choice'|| formData.answerType === 'multiple-choice');

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Thêm câu hỏi</h1>
          <p className="text-gray-600">Tạo và quản lý các câu hỏi khảo sát trong hệ thống</p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Add New Question */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Thêm câu hỏi khảo sát mới</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Question Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung câu hỏi</label>
                  <textarea 
                    rows={3} 
                    placeholder="Nhập nội dung câu hỏi..."className="w-full border border-gray-300 rounded-md px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-xs text-gray-700"value={formData.content}
                    onChange={(e) =>handleInputChange('content', e.target.value)}
                  />
                </div>
                
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chọn danh mục</label>
                  <select 
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs text-gray-700 cursor-pointer"value={formData.category}
                    onChange={(e) =>handleInputChange('category', e.target.value)}
                  >
                    <option value=""className="text-gray-600">Chọn danh mục</option>
                    <option value="psychology"className="text-gray-600">Tâm lý</option>
                    <option value="finance"className="text-gray-600">Tài chính</option>
                    <option value="general"className="text-gray-600">Tổng quát</option>
                    <option value="academic"className="text-gray-600">Học tập</option>
                    <option value="health"className="text-gray-600">Sức khỏe</option>
                  </select>
                </div>
                
                {/* Answer Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chọn loại câu trả lời</label>
                  <select 
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs text-gray-700 cursor-pointer"value={formData.answerType}
                    onChange={(e) =>handleInputChange('answerType', e.target.value)}
                  >
                    <option value=""className="text-gray-600">Chọn loại câu trả lời</option>
                    <option value="single-choice"className="text-gray-600">Một lựa chọn</option>
                    <option value="multiple-choice"className="text-gray-600">Nhiều lựa chọn</option>
                    <option value="text"className="text-gray-600">Văn bản</option>
                    <option value="scale"className="text-gray-600">Thang điểm</option>
                  </select>
                </div>
                
                {/* Answer Options */}
                {showOptions && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Danh sách tùy chọn trả lời</label>
                    <div className="space-y-2">
                      {formData.options.map((option, index) =>(
                        <div key={index} className="flex items-center space-x-2">
                          <input 
                            type="text"placeholder={`Tùy chọn ${index + 1}`} 
                            className="flex-1 border border-gray-300 rounded-md px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs text-gray-700"value={option}
                            onChange={(e) =>handleOptionChange(index, e.target.value)}
                          />
                          <button 
                            type="button"className="text-red-600 hover:text-red-800 transition-colors cursor-pointer"onClick={() =>removeOption(index)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>))}
                    </div>
                    <button 
                      type="button"className="mt-3 text-blue-600 hover:text-blue-800 font-medium flex items-center cursor-pointer text-xs"onClick={addOption}
                    >
                      <i className="fas fa-plus mr-2"></i>Thêm tùy chọn
                    </button>
                  </div>)}
                
                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button 
                    type="submit"disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md font-medium transition-colors flex items-center cursor-pointer text-xs disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-4 w-4 mr-2"xmlns="http://www.w3.org/2000/svg"fill="none"viewBox="0 0 24 24">
                          <circle className="opacity-25"cx="12"cy="12"r="10"stroke="currentColor"strokeWidth="4"></circle>
                          <path className="opacity-75"fill="currentColor"d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>Đang lưu...
                      </>) : (
                      <>
                        <i className="fas fa-save mr-2"></i>Lưu câu hỏi
                      </>)}
                  </button>
                  <button 
                    type="button"className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-1.5 rounded-md font-medium transition-colors cursor-pointer text-xs"onClick={() =>navigate('/admin/questions')}
                  >Hủy
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          {/* Right Column: Existing Questions */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Danh sách câu hỏi có sẵn</h2>
                <button 
                  onClick={() =>navigate('/admin/questions')}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center cursor-pointer">Xem tất cả câu hỏi
                  <i className="fas fa-arrow-right ml-1"></i>
                </button>
              </div>
              
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {existingQuestions.map((question) =>(
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <p className="font-medium text-gray-800 mb-3">{question.content}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {getCategoryBadge(question.category)}
                      {getTypeBadge(question.type)}
                      <span className="text-xs text-gray-500">
                        {typeof question.optionsCount === 'number'? `${question.optionsCount} tùy chọn` 
                          : question.optionsCount
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{question.createdDate}</span>
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"title="Chỉnh sửa">
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="text-red-600 hover:text-red-800 transition-colors cursor-pointer"title="Xóa">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>);
};

export default AddQuestion;