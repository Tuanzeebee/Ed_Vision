import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/ui/admin/AdminLayout";
import LoadingSpinner from "@/components/ui/admin/LoadingSpinner";
import { Card, CardContent } from "@/components/ui/card";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import questionService, { type Question, type QuestionFilterParams } from "@/services/api/questionService";
import { useToast } from "@/lib/useToast";

type QuestionFilter = {
  search: string;
  category: string;
  type: string;
};

const QuestionManagement = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [filters, setFilters] = useState<QuestionFilter>({
    search: '',
    category: 'all',
    type: 'all'
  });

  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const questionsPerPage = 10;

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: 'danger' | 'warning' | 'info';
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'warning'
  });

  // Fetch questions from API
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        
        const params: QuestionFilterParams = {
          page: currentPage,
          limit: questionsPerPage,
        };

        if (filters.search) params.search = filters.search;
        if (filters.category !== 'all') params.category = filters.category;
        if (filters.type !== 'all') params.type = filters.type;

        const response = await questionService.getQuestions(params);
        
        setQuestions(response.data);
        setTotal(response.meta.total);
        setTotalPages(response.meta.totalPages);
      } catch (error) {
        console.error('Failed to fetch questions:', error);
        showToast('Không thể tải danh sách câu hỏi', 'error');
        setQuestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [filters, currentPage, showToast]);

  const handleFilterChange = (filterKey: keyof QuestionFilter, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      category: 'all',
      type: 'all'
    });
    setCurrentPage(1);
  };

  const handleSelectQuestion = (questionId: number) => {
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
        : questions.map(q => q.questionId)
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedQuestions.length === 0) return;

    setConfirmDialog({
      open: true,
      title: 'Xác nhận xóa nhiều câu hỏi',
      message: `Bạn có chắc chắn muốn xóa ${selectedQuestions.length} câu hỏi đã chọn? Hành động này không thể hoàn tác.`,
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        
        try {
          setIsLoading(true);
          const result = await questionService.deleteQuestions(selectedQuestions);
          showToast(`Đã xóa ${result.deletedCount} câu hỏi thành công`, 'success');
          setSelectedQuestions([]);
          
          // Reload questions
          const params: QuestionFilterParams = {
            page: currentPage,
            limit: questionsPerPage,
          };
          if (filters.search) params.search = filters.search;
          if (filters.category !== 'all') params.category = filters.category;
          if (filters.type !== 'all') params.type = filters.type;

          const response = await questionService.getQuestions(params);
          setQuestions(response.data);
          setTotal(response.meta.total);
          setTotalPages(response.meta.totalPages);
        } catch (error) {
          console.error('Failed to delete questions:', error);
          showToast('Không thể xóa câu hỏi', 'error');
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const handleEdit = (questionId: number) => {
    navigate(`/admin/questions/edit/${questionId}`);
  };

  const handleDelete = async (questionId: number) => {
    setConfirmDialog({
      open: true,
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc chắn muốn xóa câu hỏi này? Hành động này không thể hoàn tác.',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        
        try {
          setIsLoading(true);
          await questionService.deleteQuestion(questionId);
          showToast('Đã xóa câu hỏi thành công', 'success');
          
          // Reload questions
          const params: QuestionFilterParams = {
            page: currentPage,
            limit: questionsPerPage,
          };
          if (filters.search) params.search = filters.search;
          if (filters.category !== 'all') params.category = filters.category;
          if (filters.type !== 'all') params.type = filters.type;

          const response = await questionService.getQuestions(params);
          setQuestions(response.data);
          setTotal(response.meta.total);
          setTotalPages(response.meta.totalPages);
        } catch (error) {
          console.error('Failed to delete question:', error);
          showToast('Không thể xóa câu hỏi', 'error');
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.category, filters.type]);

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

                <button 
                  onClick={handleResetFilters}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-1.5 rounded-md font-medium transition-colors flex items-center cursor-pointer text-xs">
                  <i className="fas fa-undo mr-2"></i>
                  Reset
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
                  onClick={handleDeleteSelected}
                >
                  <i className="fas fa-trash mr-2"></i>
                  Xóa đã chọn ({selectedQuestions.length})
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions Table */}
        <Card>
          <CardContent className="p-6">
            <div className="overflow-x-auto relative" style={{ minHeight: isLoading ? '200px' : 'auto' }}>
              {isLoading && (
                <LoadingSpinner 
                  text="Đang tải dữ liệu..." 
                  size="md" 
                  position="top" 
                />
              )}
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-3 text-left">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-white focus:ring-gray-500 accent-white"
                        checked={selectedQuestions.length === questions.length && questions.length > 0}
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
                  {!isLoading && questions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center">
                        <div className="text-gray-500">
                          <span className="text-2xl mb-2 block">🔍</span>
                          <p className="text-sm">Không tìm thấy câu hỏi phù hợp với bộ lọc</p>
                        </div>
                      </td>
                    </tr>
                  ) : !isLoading ? (
                    questions.map((question) => (
                    <tr key={question.questionId} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-3">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-white focus:ring-gray-500 accent-white"
                          checked={selectedQuestions.includes(question.questionId)}
                          onChange={() => handleSelectQuestion(question.questionId)}
                        />
                      </td>
                      <td className="border border-gray-200 px-4 py-3">
                        <div className="max-w-md">
                          <p className="font-medium text-gray-800">{question.content}</p>
                        </div>
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-center">
                        <span className="font-mono text-sm text-gray-600">{question.questionCode}</span>
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
                          <button 
                            onClick={() => handleEdit(question.questionId)}
                            className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer" 
                            title="Chỉnh sửa"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button 
                            onClick={() => handleDelete(question.questionId)}
                            className="text-red-600 hover:text-red-800 transition-colors cursor-pointer" 
                            title="Xóa"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                    ))
                  ) : null}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Hiện <span className="font-medium">{(currentPage - 1) * questionsPerPage + 1}</span> đến <span className="font-medium">{Math.min(currentPage * questionsPerPage, total)}</span> trong tổng số <span className="font-medium">{total}</span> kết quả
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded-lg ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed disabled:opacity-50' : 'text-gray-500 hover:bg-gray-50 cursor-pointer'}`}
                >
                  <i className="fas fa-chevron-left mr-1"></i>
                  Trước
                </button>

                {/* Page numbers */}
                {totalPages > 0 && Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;

                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button 
                      key={i}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer ${currentPage === pageNum ? 'text-white bg-blue-600 border border-blue-600' : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="px-2 text-gray-500">...</span>
                    <button 
                      onClick={() => setCurrentPage(totalPages)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded-lg ${currentPage === totalPages || totalPages === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50 cursor-pointer'}`}
                >
                  Sau
                  <i className="fas fa-chevron-right ml-1"></i>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        confirmText="Xác nhận"
        cancelText="Hủy"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
      />
    </AdminLayout>
  );
};

export default QuestionManagement;