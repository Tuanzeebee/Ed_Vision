import { useEffect, useState } from 'react';

interface LoginHistoryRecord {
  id: number;
  timestamp: string;
  ipAddress: string;
  device: string;
  browser: string;
  location: string;
  status: 'success'| 'failed';
}

interface LoginHistoryModalProps {
  isOpen: boolean;
  onClose: () =>void;
  accountId: number;
  accountName: string;
  onViewFull: () =>void;
}

export default function LoginHistoryModal({ 
  isOpen, 
  onClose, 
  accountId,
  accountName,
  onViewFull 
}: LoginHistoryModalProps) {
  const [history, setHistory] = useState<LoginHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && accountId) {
      fetchRecentHistory();
    }
  }, [isOpen, accountId]);

  const fetchRecentHistory = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await loginHistoryService.getRecent(accountId, 10);
      
      // Mock data for now
      await new Promise(resolve =>setTimeout(resolve, 500));
      const mockData: LoginHistoryRecord[] = [
        {
          id: 1,
          timestamp: '2025-11-05 10:30:45',
          ipAddress: '192.168.1.100',
          device: 'Windows PC',
          browser: 'Chrome 119',
          location: 'Đà Nẵng, Việt Nam',
          status: 'success'},
        {
          id: 2,
          timestamp: '2025-11-04 15:20:30',
          ipAddress: '192.168.1.100',
          device: 'iPhone 15',
          browser: 'Safari 17',
          location: 'Đà Nẵng, Việt Nam',
          status: 'success'},
        {
          id: 3,
          timestamp: '2025-11-03 09:15:22',
          ipAddress: '192.168.1.105',
          device: 'Windows PC',
          browser: 'Chrome 119',
          location: 'Đà Nẵng, Việt Nam',
          status: 'failed'},
        {
          id: 4,
          timestamp: '2025-11-02 14:45:10',
          ipAddress: '192.168.1.100',
          device: 'Windows PC',
          browser: 'Chrome 119',
          location: 'Đà Nẵng, Việt Nam',
          status: 'success'},
        {
          id: 5,
          timestamp: '2025-11-01 11:20:05',
          ipAddress: '192.168.1.100',
          device: 'MacBook Pro',
          browser: 'Firefox 120',
          location: 'Hồ Chí Minh, Việt Nam',
          status: 'success'}
      ];
      setHistory(mockData);
    } catch (error) {
      console.error('Failed to fetch login history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div 
            className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full"onClick={(e) =>e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Lịch sử đăng nhập gần nhất
                </h3>
                <p className="text-sm text-gray-600 mt-1">Tài khoản: <span className="font-medium">{accountName}</span>
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-sm text-gray-600">Đang tải dữ liệu...</p>
                  </div>
                </div>) : history.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-4xl mb-3 block"></span>
                  <p className="text-gray-600">Chưa có lịch sử đăng nhập</p>
                </div>) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thiết bị
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vị trí
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {history.map((record) =>(
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {record.timestamp}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <div>
                              <div className="font-medium">{record.device}</div>
                              <div className="text-xs text-gray-500">{record.browser}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-mono">
                            {record.ipAddress}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {record.location}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {record.status === 'success'? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>Thành công
                              </span>) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span>Thất bại
                              </span>)}
                          </td>
                        </tr>))}
                    </tbody>
                  </table>
                </div>)}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600">Hiển thị {history.length} lần đăng nhập gần nhất
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Đóng
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onViewFull();
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">Xem đầy đủ →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>);
}
