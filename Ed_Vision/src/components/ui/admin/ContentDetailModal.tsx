import { useEffect } from 'react';

interface ContentDetail {
  id: number;
  title: string;
  description: string;
  type: string;
  typeColor: string;
  icon: string;
  author: string;
  avatar: string;
  department: string;
  createdDate: string;
  waitingTime: string;
  waitingColor: string;
  priority: string;
  priorityColor: string;
}

interface ContentDetailModalProps {
  isOpen: boolean;
  content: ContentDetail | null;
  onClose: () =>void;
}

export default function ContentDetailModal({
  isOpen,
  content,
  onClose
}: ContentDetailModalProps) {
  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape'&& isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () =>window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !content) return null;

  const getBadgeClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium';
      case 'green':
        return 'px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium';
      case 'purple':
        return 'px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full font-medium';
      case 'orange':
        return 'px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full font-medium';
      case 'red':
        return 'px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full font-medium';
      case 'yellow':
        return 'px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full font-medium';
      case 'gray':
        return 'px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full font-medium';
      default:
        return 'px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full font-medium';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm transition-all"onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative bg-white rounded-lg shadow-2xl w-full max-w-3xl transform transition-all"onClick={(e) =>e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">{content.icon}</span>
              <h3 className="text-xl font-semibold text-gray-900">Chi tiết nội dung</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="h-6 w-6"fill="none"viewBox="0 0 24 24"stroke="currentColor">
                <path strokeLinecap="round"strokeLinejoin="round"strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Title & Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề</label>
              <p className="text-lg font-semibold text-gray-900">{content.title}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
              <p className="text-base text-gray-700">{content.description}</p>
            </div>

            {/* Type & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại nội dung</label>
                <span className={getBadgeClasses(content.typeColor)}>{content.type}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Độ ưu tiên</label>
                <span className={getBadgeClasses(content.priorityColor)}>{content.priority}</span>
              </div>
            </div>

            {/* Author & Department */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Người tạo</label>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {content.author.split('').map(n =>n[0]).join('')}
                    </span>
                  </div>
                  <span className="text-base text-gray-900">{content.author}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Khoa/Bộ môn</label>
                <p className="text-base text-gray-900">{content.department}</p>
              </div>
            </div>

            {/* Date & Waiting Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày tạo</label>
                <p className="text-base text-gray-900">{content.createdDate}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian chờ</label>
                <span className={getBadgeClasses(content.waitingColor)}>{content.waitingTime}</span>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <svg className="w-5 h-5 text-blue-600 mt-0.5"fill="none"viewBox="0 0 24 24"stroke="currentColor">
                  <path strokeLinecap="round"strokeLinejoin="round"strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-900">Thông tin thêm</p>
                  <p className="text-sm text-blue-700 mt-1">Nội dung này đang chờ phê duyệt. Vui lòng kiểm tra kỹ trước khi phê duyệt hoặc từ chối.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">Đóng
            </button>
          </div>
        </div>
      </div>
    </div>);
}
