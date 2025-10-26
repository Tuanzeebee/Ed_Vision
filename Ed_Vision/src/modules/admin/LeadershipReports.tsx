import { Card, CardContent } from "@/components/ui/card";
import AdminLayout from "../../components/ui/admin/AdminLayout";
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
  BarElement,
  Filler
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { getScopeStats, saveReportsToStorage, loadReportsFromStorage, type Report } from '@/lib/reportUtils';
import Modal from '@/components/ui/admin/Modal';
import { 
  majorsBySchool, 
  classesBySchoolAndMajor
} from '@/lib/leadershipReportsConstants';
import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { generateReportContentByType, generateCSVContentByType } from '@/lib/reportTemplates';
import { generatePDFReportByType } from '@/lib/pdfReportTemplates';

// Configure pdfMake fonts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(pdfMake as any).vfs = pdfFonts;

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  Filler
);

export default function LeadershipReports() {
  // State for time filter (from GeneralStatistics)
  const [timeFilter, setTimeFilter] = useState('tháng-này');
  
  // State for report form
  const [reportType, setReportType] = useState("Báo cáo điểm số");
  const [dataScope, setDataScope] = useState("Trường Khoa học máy tính");
  const [major, setMajor] = useState("Tất cả ngành");
  const [className, setClassName] = useState("Tất cả lớp");
  const [timeRange, setTimeRange] = useState("Học kỳ hiện tại");
  const [customWeekStart, setCustomWeekStart] = useState("");
  const [customWeekEnd, setCustomWeekEnd] = useState("");
  const [exportFormat, setExportFormat] = useState("PDF");
  
  // Get available majors based on selected school
  const availableMajors = majorsBySchool[dataScope] || [];
  
  // Get available classes based on selected school and major
  const availableClasses = useMemo(() => {
    if (major === "Tất cả ngành") {
      // If "All majors" selected, show all classes from all majors in the school
      const schoolClasses = classesBySchoolAndMajor[dataScope] || {};
      return Object.values(schoolClasses).flat();
    }
    return classesBySchoolAndMajor[dataScope]?.[major] || [];
  }, [dataScope, major]);
  
  // Reset major when school changes
  useEffect(() => {
    setMajor("Tất cả ngành");
    setClassName("Tất cả lớp");
  }, [dataScope]);
  
  // Loading and Modal states
  const [isLoading, setIsLoading] = useState(false);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });
  
  // State for reports list - Load from localStorage on mount
  const [reports, setReports] = useState<Report[]>(() => {
    const stored = loadReportsFromStorage();
    return stored || [
      {
        id: 1,
        name: "Báo cáo điểm cuối kỳ HK1-2024",
        type: "Điểm số",
        creator: "Admin",
        date: "15/12/2024",
        scope: "Toàn trường",
        status: "Đã tải xuống",
        statusColor: "green"
      },
      {
        id: 2,
        name: "Phân tích hiệu suất giảng viên",
        type: "Hiệu suất",
        creator: "Admin",
        date: "14/12/2024",
        scope: "Khoa CNTT",
        status: "Chưa tải xuống",
        statusColor: "yellow"
      },
      {
        id: 3,
        name: "Dự đoán kết quả học tập",
        type: "Dự đoán",
        creator: "Admin",
        date: "13/12/2024",
        scope: "Lớp 12A",
        status: "Đã tải xuống",
        statusColor: "green"
      }
    ];
  });

  // Save reports to localStorage whenever it changes
  useEffect(() => {
    saveReportsToStorage(reports);
  }, [reports]);

  // Get current time filter label
  const getTimeFilterLabel = () => {
    const labels: { [key: string]: string } = {
      'hôm-nay': 'hôm nay',
      'tuần-này': 'tuần này',
      'tháng-này': 'tháng này', 
      'tất-cả': 'tất cả thời gian'
    };
    return labels[timeFilter] || 'tháng này';
  };

  // Get comparison period label
  const getComparisonLabel = () => {
    const labels: { [key: string]: string } = {
      'hôm-nay': 'so với hôm qua',
      'tuần-này': 'so với tuần trước',
      'tháng-này': 'so với tháng trước', 
      'tất-cả': 'so với năm trước'
    };
    return labels[timeFilter] || 'so với kỳ trước';
  };

  // Get formatted time range for display
  const getFormattedTimeRange = useCallback(() => {
    if (timeRange === "Tùy chỉnh" && customWeekStart && customWeekEnd) {
      return `Tuần ${customWeekStart} - Tuần ${customWeekEnd}`;
    }
    return timeRange;
  }, [timeRange, customWeekStart, customWeekEnd]);

  // Calculate dynamic data based on time filter using useMemo
  const dashboardData = useMemo(() => {
    const baseData: { [key: string]: { reports: number; reportsGrowth: number } } = {
      'hôm-nay': { reports: 12, reportsGrowth: 25.0 },
      'tuần-này': { reports: 68, reportsGrowth: 18.5 },
      'tháng-này': { reports: 487, reportsGrowth: 8.3 },
      'tất-cả': { reports: 11847, reportsGrowth: 3.2 }
    };
    
    return baseData[timeFilter] || baseData['tháng-này'];
  }, [timeFilter]);

  // Modal handlers
  const showModal = useCallback((title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setModal({ isOpen: true, title, message, type });
  }, []);

  const closeModal = useCallback(() => {
    setModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Helper function to normalize report type for templates
  const normalizeReportType = (type: string): string => {
    // Remove "Báo cáo " prefix if exists
    const cleanType = type.replace('Báo cáo ', '');
    
    // Map lowercase to proper case for template matching
    const typeMap: { [key: string]: string } = {
      'điểm số': 'Điểm số',
      'hiệu suất': 'Hiệu suất',
      'dự đoán': 'Dự đoán',
      'tổng hợp': 'Tổng hợp'
    };
    
    return typeMap[cleanType.toLowerCase()] || cleanType;
  };

  // Helper function to export file
  const exportReportFile = useCallback(async (reportName: string, type: string, scope: string, format: string) => {
    setIsLoading(true);
    
    // Normalize type to match template expectations
    const normalizedType = normalizeReportType(type);
    
    try {
      const fileName = `${reportName.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}`;
      
      let blob: Blob;
      let fileExtension: string;
      
      if (format === 'PDF') {
        // Export as PDF using pdfMake with type-specific content
        const stats = getScopeStats(scope);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const docDefinition = generatePDFReportByType(reportName, normalizedType, scope, timeRange, stats) as any;
        
        pdfMake.createPdf(docDefinition).download(`${fileName}.pdf`);
        showModal('Thành công', `Đã xuất báo cáo ${fileName}.pdf thành công!`, 'success');
        setIsLoading(false);
        return; // Exit early for PDF
      } else if (format === 'Excel') {
        // Enhanced Excel export with type-specific content
        const stats = getScopeStats(scope);
        const csvContent = generateCSVContentByType(reportName, normalizedType, scope, timeRange, stats);
        
        blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        fileExtension = 'csv';
    } else if (format === 'Word') {
      // Word export as text
      const stats = getScopeStats(scope);
      const content = generateReportContentByType(reportName, normalizedType, scope, timeRange, stats);
      blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      fileExtension = 'txt';
    } else {
      // PowerPoint export as text
      const stats = getScopeStats(scope);
      const content = generateReportContentByType(reportName, normalizedType, scope, timeRange, stats);
      blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      fileExtension = 'txt';
    }
    
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showModal('Thành công', `Đã xuất báo cáo ${fileName}.${fileExtension} thành công!`, 'success');
    } catch (error) {
      console.error('Lỗi khi xuất báo cáo:', error);
      const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      showModal('Lỗi', `Không thể xuất báo cáo: ${errorMsg}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, showModal]);

  // Handler to create new report
  const handleCreateReport = useCallback(() => {
    const formattedTimeRange = getFormattedTimeRange();
    
    const newReport: Report = {
      id: reports.length + 1,
      name: `${reportType} - ${new Date().toLocaleDateString('vi-VN')}`,
      type: reportType.replace('Báo cáo ', ''),
      creator: "Admin",
      date: new Date().toLocaleDateString('vi-VN'),
      scope: dataScope,
      status: "Chưa tải xuống",
      statusColor: "yellow",
      format: exportFormat // Save the selected format
    };
    
    setReports(prev => [newReport, ...prev]);
    
    // Show success message - NO auto download
    showModal(
      'Thành công',
      `Đã tạo báo cáo ${exportFormat} thành công!\n\nTên: ${newReport.name}\nPhạm vi: ${dataScope}\nNgành: ${major}\nLớp: ${className}\nThời gian: ${formattedTimeRange}\n\nNhấn nút "Tải xuống" ở danh sách để tải file.`,
      'success'
    );
    
    // Reset form
    setReportType("Báo cáo điểm số");
    setDataScope("Trường Khoa học máy tính");
    setMajor("Tất cả ngành");
    setClassName("Tất cả lớp");
    setTimeRange("Học kỳ hiện tại");
    setCustomWeekStart("");
    setCustomWeekEnd("");
    setExportFormat("PDF");
  }, [reports, reportType, dataScope, major, className, exportFormat, showModal, getFormattedTimeRange]);

  // Handler for quick create buttons
  const handleQuickCreate = (reportName: string, reportType: string) => {
    const newReport: Report = {
      id: reports.length + 1,
      name: reportName,
      type: reportType,
      creator: "Admin",
      date: new Date().toLocaleDateString('vi-VN'),
      scope: "Toàn trường",
      status: "Chưa tải xuống",
      statusColor: "yellow",
      format: "PDF" // Quick create defaults to PDF
    };
    
    setReports([newReport, ...reports]);
    
    showModal('Thành công', `⚡ Đã tạo nhanh báo cáo thành công!\n\n${reportName}\n\nNhấn nút "Tải xuống" ở danh sách để tải file PDF.`, 'success');
  };

  // Handler to download existing report
  const handleDownloadReport = (report: typeof reports[0]) => {
    // Use the format saved in the report, or default to PDF
    const format = report.format || 'PDF';
    exportReportFile(report.name, report.type, report.scope, format);
    
    // Update status to "Đã tải xuống"
    setReports(prevReports => 
      prevReports.map(r => 
        r.id === report.id 
          ? { ...r, status: 'Đã tải xuống', statusColor: 'green' as const }
          : r
      )
    );
    
    showModal('Thành công', `📥 Đã tải xuống báo cáo định dạng ${format}: ${report.name}`, 'success');
  };

  // Handler to delete report
  const handleDeleteReport = (reportId: number) => {
    if (confirm('⚠️ Bạn có chắc chắn muốn xóa báo cáo này?')) {
      setReports(reports.filter(r => r.id !== reportId));
      showModal('Thành công', '🗑️ Đã xóa báo cáo!', 'success');
    }
  };

  // Chart data configurations
  const dataDistributionData = {
    labels: ['Điểm số', 'Hoạt động học tập', 'Thông tin sinh viên', 'Khảo sát đánh giá', 'Báo cáo hệ thống'],
    datasets: [{
      label: 'Số lượng bản ghi (nghìn)',
      data: [450, 320, 280, 150, 180],
      backgroundColor: [
        '#3b82f6',
        '#10b981',
        '#f59e0b',
        '#8b5cf6',
        '#ef4444'
      ],
      borderRadius: 6
    }]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Số lượng (nghìn bản ghi)'
        }
      }
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 bg-gray-50 overflow-y-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <span className="text-blue-600 text-2xl mr-3">📊</span>
              <h1 className="text-3xl font-bold text-gray-900">Báo cáo Lãnh đạo</h1>
            </div>
            
            {/* Time Filter */}
            <div className="flex items-center space-x-2">
              {/* Navigation Arrows */}
              <div className="flex items-center bg-white border border-gray-200 rounded-md shadow-sm">
                <button className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-l-md transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-r-md transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              {/* Today Button */}
              <button 
                onClick={() => setTimeFilter('hôm-nay')}
                className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                  timeFilter === 'hôm-nay'
                    ? 'bg-green-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                Hôm nay
              </button>
              
              {/* Time Period Buttons */}
              <div className="flex items-center bg-white border border-gray-200 rounded-md shadow-sm">
                {[
                  { value: 'tuần-này', label: 'Tuần' },
                  { value: 'tháng-này', label: 'Tháng' },
                  { value: 'tất-cả', label: 'Tất cả' }
                ].map((period, index) => (
                  <button
                    key={period.value}
                    onClick={() => setTimeFilter(period.value)}
                    className={`px-2 py-1 text-xs font-medium transition-colors ${
                      index === 0 ? 'rounded-l-md' : ''
                    } ${
                      index === 2 ? 'rounded-r-md' : ''
                    } ${
                      timeFilter === period.value
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className="text-gray-600">Hiển thị báo cáo dữ liệu và phân tích ({getTimeFilterLabel()})</p>
        </div>

        {/* Overview Cards */}
        <div className="mb-8">
          {/* Reports Created - Single Card */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 max-w-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Báo cáo đã tạo</p>
                  <p className="text-3xl font-bold text-green-900 mt-2">
                    {dashboardData.reports.toLocaleString('vi-VN')}
                  </p>
                  <div className="flex items-center mt-2">
                    <span className={`text-sm mr-1 ${dashboardData.reportsGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {dashboardData.reportsGrowth >= 0 ? '↗' : '↘'}
                    </span>
                    <span className={`text-sm font-medium ${dashboardData.reportsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {dashboardData.reportsGrowth >= 0 ? '+' : ''}{dashboardData.reportsGrowth}%
                    </span>
                    <span className="text-green-600 text-sm ml-1">{getComparisonLabel()}</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl">📄</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create New Report Section */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Tạo báo cáo mới</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Loại báo cáo</label>
                <select 
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>Báo cáo điểm số</option>
                  <option>Báo cáo hiệu suất</option>
                  <option>Báo cáo dự đoán</option>
                  <option>Báo cáo tổng hợp</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phạm vi dữ liệu</label>
                <select 
                  value={dataScope}
                  onChange={(e) => setDataScope(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>Trường Khoa học máy tính</option>
                  <option>Trường Công nghệ</option>
                  <option>Trường Kinh tế và Kinh doanh</option>
                  <option>Trường Ngôn ngữ và Xã hội nhân văn</option>
                  <option>Trường Du lịch</option>
                  <option>Trường Y-Dược</option>
                  <option>Trường Đào tạo quốc tế</option>
                  <option>Viện Quản lý Nam Khuê</option>
                  <option>Viện Việt-Nhật</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ngành</label>
                <select 
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>Tất cả ngành</option>
                  {availableMajors.map((majorName) => (
                    <option key={majorName} value={majorName}>
                      {majorName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Lớp</label>
                <select 
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>Tất cả lớp</option>
                  {availableClasses.map((classCode) => (
                    <option key={classCode} value={classCode}>
                      {classCode}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Khoảng thời gian</label>
                <select 
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>Học kỳ hiện tại</option>
                  <option>Năm học hiện tại</option>
                  <option>6 tháng gần đây</option>
                  <option>Tùy chỉnh</option>
                </select>
              </div>
              
              {/* Show custom week range inputs when "Tùy chỉnh" is selected */}
              {timeRange === "Tùy chỉnh" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tuần bắt đầu</label>
                    <input 
                      type="number"
                      min="1"
                      max="52"
                      value={customWeekStart}
                      onChange={(e) => setCustomWeekStart(e.target.value)}
                      placeholder="VD: 2" 
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-800 placeholder-gray-500 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tuần kết thúc</label>
                    <input 
                      type="number"
                      min="1"
                      max="52"
                      value={customWeekEnd}
                      onChange={(e) => setCustomWeekEnd(e.target.value)}
                      placeholder="VD: 5" 
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-800 placeholder-gray-500 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Định dạng xuất</label>
                <select 
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="PDF">📄 PDF</option>
                  <option value="Excel">📊 Excel (CSV)</option>
                  <option value="Word">📝 Word (TXT)</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button 
                  onClick={handleCreateReport}
                  className="bg-blue-600 text-white px-4 py-2 text-sm rounded-md hover:bg-blue-700 transition-colors cursor-pointer font-medium"
                >
                  ➕ Tạo báo cáo
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Danh sách báo cáo đã tạo</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên báo cáo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người tạo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phạm vi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{report.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.creator}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.scope}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          report.statusColor === 'green' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {report.statusColor === 'green' ? '✅' : '📝'} {report.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-3">
                          {/* Xem chi tiết */}
                          <button 
                            onClick={() => showModal('Xem báo cáo', `📄 Xem chi tiết báo cáo: ${report.name}\n\nLoại: ${report.type}\nPhạm vi: ${report.scope}\nNgày tạo: ${report.date}\n\nNội dung báo cáo sẽ được hiển thị ở đây...`, 'info')}
                            className="text-blue-600 hover:text-blue-900 cursor-pointer transition-colors" 
                            title="Xem chi tiết"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          
                          {/* Tải xuống */}
                          <button 
                            onClick={() => handleDownloadReport(report)}
                            className="text-green-600 hover:text-green-900 cursor-pointer transition-colors" 
                            title="Tải xuống"
                          >
                            <i className="fas fa-download"></i>
                          </button>
                          
                          {/* Xóa */}
                          <button 
                            onClick={() => handleDeleteReport(report.id)}
                            className="text-red-600 hover:text-red-900 cursor-pointer transition-colors" 
                            title="Xóa"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Data Distribution Chart */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Phân bố dữ liệu theo loại</h3>
            <div className="h-80 w-full">
              <Bar data={dataDistributionData} options={barOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Additional Metrics - removed as requested */}

        {/* Recommended Reports */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Báo cáo được đề xuất</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 cursor-pointer">
                <div className="text-center">
                  <div className="text-3xl mb-3">📊</div>
                  <h3 className="font-semibold mb-2">Dự đoán điểm cuối kỳ</h3>
                  <p className="text-sm opacity-90 mb-4">Phân tích và dự đoán kết quả học tập</p>
                  <button 
                    onClick={() => handleQuickCreate('Dự đoán điểm cuối kỳ', 'Dự đoán')}
                    className="bg-white text-blue-600 px-4 py-1.5 text-xs rounded-md transition-colors cursor-pointer font-semibold hover:bg-gray-100"
                  >
                    ⚡ Tạo nhanh
                  </button>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 cursor-pointer">
                <div className="text-center">
                  <div className="text-3xl mb-3">👨‍🏫</div>
                  <h3 className="font-semibold mb-2">Phân tích hiệu suất giảng viên</h3>
                  <p className="text-sm opacity-90 mb-4">Đánh giá chất lượng giảng dạy</p>
                  <button 
                    onClick={() => handleQuickCreate('Phân tích hiệu suất giảng viên', 'Hiệu suất')}
                    className="bg-white text-green-600 px-4 py-1.5 text-xs rounded-md transition-colors cursor-pointer font-semibold hover:bg-gray-100"
                  >
                    ⚡ Tạo nhanh
                  </button>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 cursor-pointer">
                <div className="text-center">
                  <div className="text-3xl mb-3">⚖️</div>
                  <h3 className="font-semibold mb-2">So sánh kết quả học tập</h3>
                  <p className="text-sm opacity-90 mb-4">Phân tích xu hướng và so sánh</p>
                  <button 
                    onClick={() => handleQuickCreate('So sánh kết quả học tập', 'So sánh')}
                    className="bg-white text-purple-600 px-4 py-1.5 text-xs rounded-md transition-colors cursor-pointer font-semibold hover:bg-gray-100"
                  >
                    ⚡ Tạo nhanh
                  </button>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 transform hover:scale-105 cursor-pointer">
                <div className="text-center">
                  <div className="text-3xl mb-3">⚠️</div>
                  <h3 className="font-semibold mb-2">Cảnh báo học vụ</h3>
                  <p className="text-sm opacity-90 mb-4">Phát hiện rủi ro và cảnh báo sớm</p>
                  <button 
                    onClick={() => handleQuickCreate('Cảnh báo học vụ', 'Cảnh báo')}
                    className="bg-white text-orange-600 px-4 py-1.5 text-xs rounded-md transition-colors cursor-pointer font-semibold hover:bg-gray-100"
                  >
                    ⚡ Tạo nhanh
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-700 font-medium">Đang xử lý...</p>
          </div>
        </div>
      )}
      
      {/* Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </AdminLayout>
  );
}
