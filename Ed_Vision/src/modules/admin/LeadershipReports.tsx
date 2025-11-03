import { Card, CardContent } from "@/components/ui/card";
import AdminLayout from "../../components/ui/admin/AdminLayout";
import TimeFilter from "../../components/ui/admin/TimeFilter";
import CourseYearSelector from "../../lib/courseYearSelector";
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
import { useState, useCallback, useMemo, useEffect } from 'react';
import { getScopeStats, saveReportsToStorage, loadReportsFromStorage, type Report } from '@/lib/reportUtils';
import Modal from '@/components/ui/admin/Modal';
import ConfirmDialog from '@/components/ui/admin/ConfirmDialog';
import { useConfirm } from '@/hooks/useConfirm';
import { 
  majorsBySchool, 
  classesBySchoolAndMajor
} from '@/lib/leadershipReportsConstants';
import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { generateReportContentByType } from '@/lib/reportTemplates';
import { generatePDFReportByType } from '@/lib/pdfReportTemplates';
import { exportToExcel, exportToWord, exportToPowerPoint } from '@/lib/exportHelpers';
import { generateChartsForReportType } from '@/lib/chartGenerator';

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
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Confirm dialog hook
  const { confirm, confirmState } = useConfirm();
  
  // State for report form
  const [reportType, setReportType] = useState("Báo cáo điểm số");
  const [dataScope, setDataScope] = useState("Trường Khoa học máy tính");
  const [courseYear, setCourseYear] = useState("Tất cả khóa");
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
    setCourseYear("Tất cả khóa");
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
    
    // Normalize all report types to have consistent capitalization
    const normalizeReportType = (type: string): string => {
      // Map of expected types
      const typeMap: { [key: string]: string } = {
        'điểm số': 'Điểm số',
        'Điểm số': 'Điểm số',
        'hiệu suất': 'Hiệu suất',
        'Hiệu suất': 'Hiệu suất',
        'dự đoán': 'Dự đoán',
        'Dự đoán': 'Dự đoán',
        'tổng hợp': 'Tổng hợp',
        'Tổng hợp': 'Tổng hợp',
        'so sánh': 'So sánh',
        'So sánh': 'So sánh',
        'cảnh báo': 'Cảnh báo',
        'Cảnh báo': 'Cảnh báo'
      };
      
      return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
    };
    
    // Normalize stored data
    const normalizedStored = stored?.map(report => ({
      ...report,
      type: normalizeReportType(report.type)
    }));
    
    return normalizedStored || [
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const reportsPerPage = 10;

  // Filter states
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCreator, setFilterCreator] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterScope, setFilterScope] = useState<string>('all');

  // Selection states
  const [selectedReports, setSelectedReports] = useState<number[]>([]);

  // Save reports to localStorage whenever it changes
  useEffect(() => {
    saveReportsToStorage(reports);
  }, [reports]);

  // Apply filters to reports
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      // Filter by type
      if (filterType !== 'all' && report.type !== filterType) return false;
      
      // Filter by creator
      if (filterCreator !== 'all' && report.creator !== filterCreator) return false;
      
      // Filter by scope
      if (filterScope !== 'all' && report.scope !== filterScope) return false;
      
      // Filter by date range
      if (filterDateFrom || filterDateTo) {
        const reportDate = new Date(report.date.split('/').reverse().join('-'));
        
        if (filterDateFrom) {
          const fromDate = new Date(filterDateFrom);
          if (reportDate < fromDate) return false;
        }
        
        if (filterDateTo) {
          const toDate = new Date(filterDateTo);
          if (reportDate > toDate) return false;
        }
      }
      
      return true;
    });
  }, [reports, filterType, filterCreator, filterDateFrom, filterDateTo, filterScope]);

  // Calculate pagination based on filtered reports
  const totalPages = Math.ceil(filteredReports.length / reportsPerPage);
  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = filteredReports.slice(indexOfFirstReport, indexOfLastReport);

  // Get unique values for filters
  const uniqueTypes = useMemo(() => {
    return Array.from(new Set(reports.map(r => r.type)));
  }, [reports]);

  const uniqueCreators = useMemo(() => {
    return Array.from(new Set(reports.map(r => r.creator)));
  }, [reports]);

  const uniqueScopes = useMemo(() => {
    return Array.from(new Set(reports.map(r => r.scope)));
  }, [reports]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterCreator, filterDateFrom, filterDateTo, filterScope]);

  // Reset to page 1 when reports change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredReports.length, currentPage, totalPages]);

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReports(currentReports.map(r => r.id));
    } else {
      setSelectedReports([]);
    }
  };

  // Handle individual selection
  const handleSelectReport = (reportId: number, checked: boolean) => {
    if (checked) {
      setSelectedReports(prev => [...prev, reportId]);
    } else {
      setSelectedReports(prev => prev.filter(id => id !== reportId));
    }
  };

  // Handle delete selected
  const handleDeleteSelected = async () => {
    if (selectedReports.length === 0) return;

    const confirmed = await confirm({
      title: 'Xác nhận xóa báo cáo',
      message: `Bạn có chắc chắn muốn xóa ${selectedReports.length} báo cáo đã chọn không?\n\nHành động này không thể hoàn tác.`,
      confirmText: 'Xóa báo cáo',
      cancelText: 'Hủy bỏ',
      type: 'danger'
    });

    if (confirmed) {
      setReports(prev => prev.filter(report => !selectedReports.includes(report.id)));
      setSelectedReports([]);
      showModal('Thành công', `🗑️ Đã xóa ${selectedReports.length} báo cáo thành công!`, 'success');
    }
  };

  // Check if all current page reports are selected
  const isAllSelected = currentReports.length > 0 && currentReports.every(r => selectedReports.includes(r.id));

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

  // Get formatted time range for display
  const getFormattedTimeRange = useCallback(() => {
    if (timeRange === "Tùy chỉnh" && customWeekStart && customWeekEnd) {
      return `Tuần ${customWeekStart} - Tuần ${customWeekEnd}`;
    }
    return timeRange;
  }, [timeRange, customWeekStart, customWeekEnd]);

  // Calculate dynamic data based on time filter using useMemo
  const dashboardData = useMemo(() => {
    // Get actual counts from reports
    const totalReports = reports.length;
    const scoreReports = reports.filter(r => r.type === 'Điểm số').length;
    const performanceReports = reports.filter(r => r.type === 'Hiệu suất').length;
    const predictionReports = reports.filter(r => r.type === 'Dự đoán').length;
    const summaryReports = reports.filter(r => r.type === 'Tổng hợp').length;
    
    // Sample growth data based on time filter (these would come from API in real app)
    const growthData: { [key: string]: { 
      reportsGrowth: number;
      scoreGrowth: number;
      performanceGrowth: number;
      predictionGrowth: number;
      summaryGrowth: number;
      comparisonText: string;
    } } = {
      'hôm-nay': { 
        reportsGrowth: 3,
        scoreGrowth: 2,
        performanceGrowth: 1,
        predictionGrowth: 1,
        summaryGrowth: 1,
        comparisonText: 'so với hôm qua'
      },
      'tuần-này': { 
        reportsGrowth: 15,
        scoreGrowth: 8,
        performanceGrowth: 4,
        predictionGrowth: 2,
        summaryGrowth: 1,
        comparisonText: 'so với tuần trước'
      },
      'tháng-này': { 
        reportsGrowth: 45,
        scoreGrowth: 22,
        performanceGrowth: 15,
        predictionGrowth: 5,
        summaryGrowth: 3,
        comparisonText: 'so với tháng trước'
      },
      'tất-cả': { 
        reportsGrowth: 1205,
        scoreGrowth: 520,
        performanceGrowth: 380,
        predictionGrowth: 210,
        summaryGrowth: 95,
        comparisonText: 'so với năm trước'
      }
    };
    
    const growth = growthData[timeFilter] || growthData['tháng-này'];
    
    return {
      reports: totalReports,
      scoreReports,
      performanceReports,
      predictionReports,
      summaryReports,
      ...growth
    };
  }, [timeFilter, reports]);

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
      const stats = getScopeStats(scope);
      
      // Generate charts programmatically based on report type and data
      console.log('� Generating charts for report type:', normalizedType);
      const charts = generateChartsForReportType(normalizedType, stats);
      console.log('✅ Generated charts:', Object.keys(charts));
      
      let blob: Blob;
      let fileExtension: string;
      
      if (format === 'PDF') {
        // Export as PDF using pdfMake with type-specific content and charts
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const docDefinition = generatePDFReportByType(reportName, normalizedType, scope, timeRange, stats, charts) as any;
        pdfMake.createPdf(docDefinition).download(`${fileName}.pdf`);
        showModal('Thành công', `Đã xuất báo cáo ${fileName}.pdf thành công!`, 'success');
        setIsLoading(false);
        return; // Exit early for PDF
      } else if (format === 'Excel') {
        // Export Excel (.xlsx) with all generated charts
        blob = await exportToExcel(reportName, normalizedType, scope, timeRange, stats, charts);
        fileExtension = 'xlsx';
      } else if (format === 'Word') {
        // Export Word (.docx) with all generated charts
        blob = await exportToWord(reportName, normalizedType, scope, timeRange, stats, charts);
        fileExtension = 'docx';
      } else if (format === 'PowerPoint') {
        // Export PowerPoint (.pptx) with chart image using pptxgenjs
        const chartBase64 = charts.systemScale || null;
        blob = await exportToPowerPoint(reportName, normalizedType, scope, timeRange, stats, chartBase64);
        fileExtension = 'pptx';
      } else {
        // Fallback: plain text
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
  const handleCreateReport = useCallback(async () => {
    const formattedTimeRange = getFormattedTimeRange();
    
    // Extract type and capitalize first letter
    const extractedType = reportType.replace('Báo cáo ', '');
    const normalizedType = extractedType.charAt(0).toUpperCase() + extractedType.slice(1);
    
    // Show confirmation dialog
    const confirmed = await confirm({
      title: 'Xác nhận tạo báo cáo',
      message: `Bạn có chắc chắn muốn tạo báo cáo sau không?\n\nLoại: ${reportType}\nPhạm vi: ${dataScope}\nKhóa: ${courseYear}\nNgành: ${major}\nLớp: ${className}\nĐịnh dạng: ${exportFormat}\nThời gian: ${formattedTimeRange}`,
      confirmText: 'Tạo báo cáo',
      cancelText: 'Hủy bỏ',
      type: 'info'
    });

    if (!confirmed) return;
    
    // Generate unique ID using timestamp + random number
    const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
    
    const newReport: Report = {
      id: uniqueId,
      name: `${reportType} - ${new Date().toLocaleDateString('vi-VN')}`,
      type: normalizedType,
      creator: "Admin",
      date: new Date().toLocaleDateString('vi-VN'),
      scope: dataScope,
      status: "Chưa tải xuống",
      statusColor: "yellow",
      format: exportFormat // Save the selected format
    };
    
    // Create completely new array to ensure React detects change
    setReports(prev => {
      const newReports = [newReport, ...prev];
      console.log('🆕 Created new report:', newReport);
      console.log('📋 New reports list:', newReports);
      return newReports;
    });
    
    // Show success message - NO auto download
    showModal(
      'Thành công',
      `Đã tạo báo cáo ${exportFormat} thành công!\n\nTên: ${newReport.name}\nPhạm vi: ${dataScope}\nKhóa: ${courseYear}\nNgành: ${major}\nLớp: ${className}\nThời gian: ${formattedTimeRange}\n\nNhấn nút "Tải xuống" ở danh sách để tải file.`,
      'success'
    );
    
    // Reset form
    setReportType("Báo cáo điểm số");
    setDataScope("Trường Khoa học máy tính");
    setCourseYear("Tất cả khóa");
    setMajor("Tất cả ngành");
    setClassName("Tất cả lớp");
    setTimeRange("Học kỳ hiện tại");
    setCustomWeekStart("");
    setCustomWeekEnd("");
    setExportFormat("PDF");
  }, [reportType, dataScope, courseYear, major, className, exportFormat, showModal, getFormattedTimeRange, confirm]);

  // Handler to download existing report
  const handleDownloadReport = async (report: typeof reports[0]) => {
    // Use the format saved in the report, or default to PDF
    const format = report.format || 'PDF';
    
    // Show confirmation dialog
    const confirmed = await confirm({
      title: 'Xác nhận tải xuống',
      message: `Bạn có muốn tải xuống báo cáo sau không?\n\nTên: ${report.name}\nLoại: ${report.type}\nĐịnh dạng: ${format}\nPhạm vi: ${report.scope}\nNgày tạo: ${report.date}`,
      confirmText: 'Tải xuống',
      cancelText: 'Hủy bỏ',
      type: 'info'
    });

    if (!confirmed) return;
    
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
  const handleDeleteReport = async (reportId: number, reportName: string) => {
    const confirmed = await confirm({
      title: 'Xác nhận xóa báo cáo',
      message: `Bạn có chắc chắn muốn xóa báo cáo:\n\n"${reportName}"\n\nHành động này không thể hoàn tác.`,
      confirmText: 'Xóa báo cáo',
      cancelText: 'Hủy bỏ',
      type: 'danger'
    });

    if (confirmed) {
      setReports(prev => {
        const newReports = prev.filter(r => r.id !== reportId);
        console.log('🗑️ Deleted report ID:', reportId);
        console.log('📋 Remaining reports:', newReports);
        return newReports;
      });
      showModal('Thành công', '🗑️ Đã xóa báo cáo thành công!', 'success');
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
            <TimeFilter 
              value={timeFilter}
              onChange={setTimeFilter}
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
            />
          </div>
          <p className="text-gray-600">Hiển thị báo cáo dữ liệu và phân tích ({getTimeFilterLabel()})</p>
        </div>

        {/* Overview Cards */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Tổng báo cáo đã tạo */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Báo cáo đã tạo</p>
                    <p className="text-3xl font-bold text-green-900 mt-2">
                      {dashboardData.reports}
                    </p>
                    <div className="flex items-center mt-2">
                      <span className={`text-xs ${dashboardData.reportsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {dashboardData.reportsGrowth >= 0 ? '+' : ''}{dashboardData.reportsGrowth} báo cáo đã tạo {dashboardData.comparisonText}
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-white text-2xl">📄</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Báo cáo điểm số */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Báo cáo điểm số</p>
                    <p className="text-3xl font-bold text-blue-900 mt-2">
                      {dashboardData.scoreReports}
                    </p>
                    <div className="flex items-center mt-2">
                      <span className={`text-xs ${dashboardData.scoreGrowth >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {dashboardData.scoreGrowth >= 0 ? '+' : ''}{dashboardData.scoreGrowth} báo cáo đã tạo {dashboardData.comparisonText}
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-white text-2xl">📊</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Báo cáo hiệu suất */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700">Báo cáo hiệu suất</p>
                    <p className="text-3xl font-bold text-purple-900 mt-2">
                      {dashboardData.performanceReports}
                    </p>
                    <div className="flex items-center mt-2">
                      <span className={`text-xs ${dashboardData.performanceGrowth >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                        {dashboardData.performanceGrowth >= 0 ? '+' : ''}{dashboardData.performanceGrowth} báo cáo đã tạo {dashboardData.comparisonText}
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-white text-2xl">📈</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Báo cáo dự đoán */}
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700">Báo cáo dự đoán</p>
                    <p className="text-3xl font-bold text-orange-900 mt-2">
                      {dashboardData.predictionReports}
                    </p>
                    <div className="flex items-center mt-2">
                      <span className={`text-xs ${dashboardData.predictionGrowth >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
                        {dashboardData.predictionGrowth >= 0 ? '+' : ''}{dashboardData.predictionGrowth} báo cáo đã tạo {dashboardData.comparisonText}
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-white text-2xl">🔮</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Báo cáo tổng hợp */}
            <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-indigo-700">Báo cáo tổng hợp</p>
                    <p className="text-3xl font-bold text-indigo-900 mt-2">
                      {dashboardData.summaryReports}
                    </p>
                    <div className="flex items-center mt-2">
                      <span className={`text-xs ${dashboardData.summaryGrowth >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                        {dashboardData.summaryGrowth >= 0 ? '+' : ''}{dashboardData.summaryGrowth} báo cáo đã tạo {dashboardData.comparisonText}
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-white text-2xl">📋</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
                <label className="block text-xs font-medium text-gray-600 mb-1">Khóa</label>
                <CourseYearSelector
                  value={courseYear}
                  onChange={setCourseYear}
                />
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
                  <option value="Excel">📊 Excel (.xlsx)</option>
                  <option value="Word">📝 Word (.docx)</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button 
                  onClick={handleCreateReport}
                  className="bg-blue-600 text-white px-3 py-1.5 text-xs rounded-md hover:bg-blue-700 transition-colors cursor-pointer font-medium"
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
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Danh sách báo cáo đã tạo</h2>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              {/* Type filter */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Loại báo cáo</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tất cả loại</option>
                  {uniqueTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Creator filter */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Người tạo</label>
                <select
                  value={filterCreator}
                  onChange={(e) => setFilterCreator(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tất cả người tạo</option>
                  {uniqueCreators.map(creator => (
                    <option key={creator} value={creator}>{creator}</option>
                  ))}
                </select>
              </div>

              {/* Date from filter */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Từ ngày</label>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Date to filter */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Đến ngày</label>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Scope filter */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phạm vi</label>
                <select
                  value={filterScope}
                  onChange={(e) => setFilterScope(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tất cả phạm vi</option>
                  {uniqueScopes.map(scope => (
                    <option key={scope} value={scope}>{scope}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results info */}
            {(filterType !== 'all' || filterCreator !== 'all' || filterScope !== 'all' || filterDateFrom || filterDateTo) && (
              <div className="mb-4 text-sm text-gray-600">
                Tìm thấy <span className="font-semibold text-gray-900">{filteredReports.length}</span> báo cáo
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-4 h-4 bg-white border-2 border-gray-300 rounded focus:ring-2 focus:ring-gray-500 checked:bg-white checked:border-gray-800 cursor-pointer appearance-none checked:after:content-['✓'] checked:after:text-gray-900 checked:after:text-xs checked:after:flex checked:after:items-center checked:after:justify-center"
                        style={{
                          backgroundImage: 'none'
                        }}
                      />
                    </th>
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
                  {currentReports.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                        <i className="fas fa-inbox text-4xl mb-2 block text-gray-300"></i>
                        Không tìm thấy báo cáo nào
                      </td>
                    </tr>
                  ) : (
                    currentReports.map((report, index) => (
                      <tr key={`${report.id}-${index}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedReports.includes(report.id)}
                            onChange={(e) => handleSelectReport(report.id, e.target.checked)}
                            className="w-4 h-4 bg-white border-2 border-gray-300 rounded focus:ring-2 focus:ring-gray-500 checked:bg-white checked:border-gray-800 cursor-pointer appearance-none checked:after:content-['✓'] checked:after:text-gray-900 checked:after:text-xs checked:after:flex checked:after:items-center checked:after:justify-center"
                            style={{
                              backgroundImage: 'none'
                            }}
                          />
                        </td>
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
                            onClick={() => handleDeleteReport(report.id, report.name)}
                            className="text-red-600 hover:text-red-900 cursor-pointer transition-colors" 
                            title="Xóa"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination and Delete Button Section */}
            <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
              <div className="flex items-center text-sm text-gray-700">
                {totalPages > 1 ? (
                  <span>
                    Hiển thị <span className="font-medium">{indexOfFirstReport + 1}</span> đến{' '}
                    <span className="font-medium">{Math.min(indexOfLastReport, filteredReports.length)}</span> trong tổng số{' '}
                    <span className="font-medium">{filteredReports.length}</span> báo cáo
                  </span>
                ) : (
                  <span>
                    Tổng số: <span className="font-medium">{filteredReports.length}</span> báo cáo
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                {/* Delete selected button */}
                {selectedReports.length > 0 && (
                  <button
                    onClick={handleDeleteSelected}
                    className="bg-red-600 text-white px-4 py-2 text-sm rounded-md hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
                  >
                    <i className="fas fa-trash"></i>
                    Xóa đã chọn ({selectedReports.length})
                  </button>
                )}
                
                {/* Pagination controls */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    {/* Previous button */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      <i className="fas fa-chevron-left mr-1"></i>
                      Trước
                    </button>
                    
                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                        // Show first page, last page, current page, and pages around current
                        const showPage = 
                          page === 1 || 
                          page === totalPages || 
                          (page >= currentPage - 1 && page <= currentPage + 1);
                        
                        // Show ellipsis
                        const showEllipsisBefore = page === currentPage - 2 && currentPage > 3;
                        const showEllipsisAfter = page === currentPage + 2 && currentPage < totalPages - 2;
                        
                        if (showEllipsisBefore || showEllipsisAfter) {
                          return (
                            <span key={page} className="px-2 text-gray-400">
                              ...
                            </span>
                          );
                        }
                        
                        if (!showPage) return null;
                        
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                              currentPage === page
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Next button */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      Sau
                      <i className="fas fa-chevron-right ml-1"></i>
                    </button>
                  </div>
                )}
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
      
      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        type={confirmState.type}
        onConfirm={confirmState.onConfirm}
        onCancel={confirmState.onCancel}
      />
    </AdminLayout>
  );
}
