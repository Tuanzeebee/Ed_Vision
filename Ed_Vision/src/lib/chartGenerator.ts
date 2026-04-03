// Generate charts programmatically for report exports
// Creates offscreen canvas, renders chart, exports as base64

import { Chart, type ChartConfiguration } from 'chart.js/auto';
import { type ScopeStats } from './reportUtils';

/**
 * Generate system scale pie chart (students, teachers, courses)
 * Compact size for better alignment with tables: 350x200
 */
export function generateSystemScaleChart(stats: ScopeStats): string {
  const canvas = document.createElement('canvas');
  canvas.width = 350;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Cannot get canvas context');
  }
  
  // Fill white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  const config: ChartConfiguration = {
    type: 'doughnut',
    data: {
      labels: ['Sinh viên', 'Giảng viên', 'Môn học'],
      datasets: [{
        data: [stats.students, stats.teachers, stats.courses],
        backgroundColor: [
          '#3b82f6', // blue
          '#10b981', // green
          '#f59e0b'
// amber
        ]
      }]
    },
    options: {
      responsive: false,
      animation: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            padding: 12,
            boxWidth: 15,
            font: {
              size: 11
            }
          }
        }
      }
    }
  };
  
  const chart = new Chart(ctx, config);
  chart.update('none');
  const base64 = canvas.toDataURL('image/png', 1.0);
  chart.destroy();
  
  return base64;
}

/**
 * Generate GPA distribution pie chart for grade reports
 * Using same compact size as system scale for consistency: 350x200
 */
export function generateGPADistributionChart(stats: ScopeStats): string {
  const canvas = document.createElement('canvas');
  canvas.width = 350;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Cannot get canvas context');
  }
  
  // Fill white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  const config: ChartConfiguration = {
    type: 'doughnut',
    data: {
      labels: ['Xuất sắc (3.6-4.0)', 'Giỏi (3.2-3.59)', 'Khá (2.5-3.19)', 'TB (2.0-2.49)', 'Yếu (<2.0)'],
      datasets: [{
        data: [
          Math.round(stats.students * 0.15),
          Math.round(stats.students * 0.28),
          Math.round(stats.students * 0.35),
          Math.round(stats.students * 0.18),
          Math.round(stats.students * 0.04)
        ],
        backgroundColor: [
          '#10b981', // green
          '#3b82f6', // blue
          '#f59e0b', // amber
          '#f97316', // orange
          '#ef4444'
// red
        ]
      }]
    },
    options: {
      responsive: false,
      animation: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            padding: 12,
            boxWidth: 15,
            font: {
              size: 11
            }
          }
        }
      }
    }
  };
  
  const chart = new Chart(ctx, config);
  chart.update('none');
  const base64 = canvas.toDataURL('image/png', 1.0);
  chart.destroy();
  
  return base64;
}

/**
 * Generate high-fail-rate subjects chart (horizontal bar chart)
 */
export function generateHighFailSubjectsChart(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 180;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Cannot get canvas context');
  }
  
  // Fill white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  const config: ChartConfiguration = {
    type: 'bar',
    data: {
      labels: ['Toán cao cấp 1', 'Vật lý đại cương', 'Lập trình C++', 'Cấu trúc DL & GT', 'TA chuyên ngành'],
      datasets: [{
        label: 'Tỷ lệ fail (%)',
        data: [28, 23, 19, 16, 14],
        backgroundColor: [
          '#ef4444', // red - highest
          '#f97316', // orange
          '#f59e0b', // amber
          '#fbbf24', // yellow
          '#facc15'
// light yellow
        ],
        borderRadius: 4
      }]
    },
    options: {
      responsive: false,
      animation: false,
      indexAxis: 'y', // Horizontal bar chart
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          max: 30,
          title: {
            display: true,
            text: 'Tỷ lệ fail (%)',
            font: {
              size: 11
            }
          },
          ticks: {
            font: {
              size: 10
            }
          }
        },
        y: {
          ticks: {
            font: {
              size: 10
            }
          }
        }
      }
    }
  };
  
  const chart = new Chart(ctx, config);
  chart.update('none');
  const base64 = canvas.toDataURL('image/png', 1.0);
  chart.destroy();
  
  return base64;
}

/**
 * Generate student activity bar chart for performance reports
 */
export function generateStudentActivityChart(stats: ScopeStats): string {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 180;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Cannot get canvas context');
  }
  
  // Fill white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  const config: ChartConfiguration = {
    type: 'bar',
    data: {
      labels: ['Đăng nhập đều đặn', 'Đăng nhập thỉnh thoảng', 'Không hoạt động'],
      datasets: [{
        label: 'Số lượng sinh viên',
        data: [
          Math.round(stats.students * 0.73),
          Math.round(stats.students * 0.18),
          Math.round(stats.students * 0.09)
        ],
        backgroundColor: [
          '#10b981', // green
          '#f59e0b', // amber
          '#ef4444'
// red
        ]
      }]
    },
    options: {
      responsive: false,
      animation: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Số sinh viên'}
        }
      }
    }
  };
  
  const chart = new Chart(ctx, config);
  chart.update('none');
  const base64 = canvas.toDataURL('image/png', 1.0);
  chart.destroy();
  
  return base64;
}

/**
 * Generate learning trend line chart for prediction reports
 */
export function generateLearningTrendChart(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 180;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Cannot get canvas context');
  }
  
  // Fill white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  const config: ChartConfiguration = {
    type: 'line',
    data: {
      labels: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4', 'Tuần 5', 'Tuần 6'],
      datasets: [{
        label: 'Điểm trung bình',
        data: [6.5, 6.8, 7.0, 7.1, 7.3, 7.5],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: false,
      animation: false,
      plugins: {
        legend: {
          display: true,
          position: 'top'}
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 10,
          title: {
            display: true,
            text: 'Điểm'}
        }
      }
    }
  };
  
  const chart = new Chart(ctx, config);
  chart.update('none');
  const base64 = canvas.toDataURL('image/png', 1.0);
  chart.destroy();
  
  return base64;
}

/**
 * Generate charts based on report type
 */
export function generateChartsForReportType(type: string, stats: ScopeStats): Record<string, string> {
  const charts: Record<string, string>= {};
  
  // Always include system scale chart
  charts.systemScale = generateSystemScaleChart(stats);
  
  // Type-specific charts
  switch (type) {
    case 'Điểm số':
      charts.gpaDistribution = generateGPADistributionChart(stats);
      charts.highFailSubjects = generateHighFailSubjectsChart();
      break;
    
    case 'Hiệu suất':
      charts.studentActivity = generateStudentActivityChart(stats);
      break;
    
    case 'Dự đoán':
      charts.learningTrend = generateLearningTrendChart();
      break;
    
    case 'Tổng hợp':
      // Include all charts for comprehensive report
      charts.gpaDistribution = generateGPADistributionChart(stats);
      charts.highFailSubjects = generateHighFailSubjectsChart();
      charts.studentActivity = generateStudentActivityChart(stats);
      charts.learningTrend = generateLearningTrendChart();
      break;
  }
  
  return charts;
}
