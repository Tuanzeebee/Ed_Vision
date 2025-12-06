import { useEffect } from 'react';

interface NotificationDetail {
  id: number;
  title: string;
  content: string;
  type: string;
  target: string;
  priority: string;
  createdDate: string;
  attachments?: Array<{
    name: string;
    size: number;
    type: string;
    url: string;
  }>;
}

interface NotificationDetailModalProps {
  isOpen: boolean;
  notification: NotificationDetail | null;
  onClose: () => void;
}

export default function NotificationDetailModal({
  isOpen,
  notification,
  onClose
}: NotificationDetailModalProps) {
  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
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

  if (!isOpen || !notification) return null;

  const getPriorityBadgeClasses = (priority: string) => {
    switch (priority) {
      case 'Cao':
        return 'px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full font-medium';
      case 'Trung bình':
        return 'px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full font-medium';
      case 'Thấp':
        return 'px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full font-medium';
      default:
        return 'px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full font-medium';
    }
  };

  const getTargetBadgeClasses = (target: string) => {
    switch (target) {
      case 'Sinh viên':
        return 'px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium';
      case 'Giảng viên':
        return 'px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium';
      case 'Tất cả':
        return 'px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full font-medium';
      default:
        return 'px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full font-medium';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop - mờ nhẹ thay vì đen hoàn toàn */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 border-b border-blue-800">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center">
                <span className="text-2xl mr-3">🔔</span>
                Chi tiết thông báo
              </h2>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors p-1 rounded-lg hover:bg-blue-800"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tiêu đề thông báo
                </label>
                <p className="text-lg font-bold text-gray-900">{notification.title}</p>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nội dung thông báo
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                    {notification.content}
                  </p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Loại thông báo
                  </label>
                  <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full font-medium">
                    {notification.type}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Đối tượng nhận
                  </label>
                  <span className={getTargetBadgeClasses(notification.target)}>
                    {notification.target}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mức độ ưu tiên
                  </label>
                  <span className={getPriorityBadgeClasses(notification.priority)}>
                    {notification.priority}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ngày tạo
                  </label>
                  <p className="text-sm text-gray-900 font-medium">{notification.createdDate}</p>
                </div>
              </div>

              {/* Attachments Section */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  📄 File đính kèm
                </label>
                {notification.attachments && notification.attachments.length > 0 ? (
                  <div className="space-y-2">
                    {notification.attachments.map((file, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 hover:bg-blue-100 transition-colors"
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <span className="text-2xl">📄</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <a
                          href={file.url}
                          download={file.name}
                          className="ml-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                          title="Tải xuống"
                        >
                          ⬇ Tải xuống
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">Không có file đính kèm</p>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
