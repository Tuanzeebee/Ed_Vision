import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from './locales/en/common.json';
import viCommon from './locales/vi/common.json';
import enAuth from './locales/en/auth.json';
import viAuth from './locales/vi/auth.json';
import enParent from './locales/en/parent.json';
import viParent from './locales/vi/parent.json';
import enStudent from './locales/en/student.json';
import viStudent from './locales/vi/student.json';
import enStudentAppointments from './locales/en/student/appointments.json';
import viStudentAppointments from './locales/vi/student/appointments.json';
import enStudentBookingSchedules from './locales/en/student/bookingSchedules.json';
import viStudentBookingSchedules from './locales/vi/student/bookingSchedules.json';
import enTeacher from './locales/en/teacher.json';
import viTeacher from './locales/vi/teacher.json';
import enAdmin from './locales/en/admin.json';
import viAdmin from './locales/vi/admin.json';
import enProfile from './locales/en/profile.json';
import viProfile from './locales/vi/profile.json';

// Import modular teacher translations
import enTeacherDashboard from './locales/en/teacher/dashboard.json';
import viTeacherDashboard from './locales/vi/teacher/dashboard.json';
import enTeacherClassManagement from './locales/en/teacher/classManagement.json';
import viTeacherClassManagement from './locales/vi/teacher/classManagement.json';
import enTeacherSurveyManagement from './locales/en/teacher/surveyManagement.json';
import viTeacherSurveyManagement from './locales/vi/teacher/surveyManagement.json';
import enTeacherPrediction from './locales/en/teacher/prediction.json';
import viTeacherPrediction from './locales/vi/teacher/prediction.json';
import enTeacherGradeManagement from './locales/en/teacher/gradeManagement.json';
import viTeacherGradeManagement from './locales/vi/teacher/gradeManagement.json';
import enTeacherSettingGradeTable from './locales/en/teacher/settingGradeTable.json';
import viTeacherSettingGradeTable from './locales/vi/teacher/settingGradeTable.json';
import enTeacherAppointments from './locales/en/teacher/appointments.json';
import viTeacherAppointments from './locales/vi/teacher/appointments.json';
import enTeacherScheduleManagement from './locales/en/teacher/scheduleManagement.json';
import viTeacherScheduleManagement from './locales/vi/teacher/scheduleManagement.json';
import enTeacherMessagesNotifications from './locales/en/teacher/messagesNotifications.json';
import viTeacherMessagesNotifications from './locales/vi/teacher/messagesNotifications.json';

// Configure i18n
i18n
  .use(LanguageDetector) // Tự động phát hiện ngôn ngữ từ browser
  .use(initReactI18next) // Kết nối với React
  .init({
    resources: {
      en: {
        common: enCommon,
        auth: enAuth,
        parent: enParent,
        student: {
          ...enStudent,
          appointments: enStudentAppointments,
          bookingSchedules: enStudentBookingSchedules,
        },
        teacher: {
          ...enTeacher,
          dashboard: enTeacherDashboard,
          classManagement: enTeacherClassManagement,
          surveyManagement: enTeacherSurveyManagement,
          prediction: enTeacherPrediction,
          gradeManagement: enTeacherGradeManagement,
          settingGradeTable: enTeacherSettingGradeTable,
          appointments: enTeacherAppointments,
          scheduleManagement: enTeacherScheduleManagement,
          messagesNotifications: enTeacherMessagesNotifications,
        },
        admin: enAdmin,
        profile: enProfile,
      },
      vi: {
        common: viCommon,
        auth: viAuth,
        parent: viParent,
        student: {
          ...viStudent,
          appointments: viStudentAppointments,
          bookingSchedules: viStudentBookingSchedules,
        },
        teacher: {
          ...viTeacher,
          dashboard: viTeacherDashboard,
          classManagement: viTeacherClassManagement,
          surveyManagement: viTeacherSurveyManagement,
          prediction: viTeacherPrediction,
          gradeManagement: viTeacherGradeManagement,
          scheduleManagement: viTeacherScheduleManagement,
          messagesNotifications: viTeacherMessagesNotifications,
          settingGradeTable: viTeacherSettingGradeTable,
          appointments: viTeacherAppointments,
        },
        admin: viAdmin,
        profile: viProfile,
      },
    },
    fallbackLng: 'en', // Ngôn ngữ mặc định
    defaultNS: 'common', // Namespace mặc định
    
    // Cấu hình phát hiện ngôn ngữ
    detection: {
      order: ['localStorage', 'navigator'], // Ưu tiên localStorage trước
      caches: ['localStorage'], // Lưu lựa chọn vào localStorage
    },
    
    interpolation: {
      escapeValue: false, // React đã tự escape
    },
    
    // Keep i18n logging quiet unless explicitly instrumenting localization issues.
    debug: false,
  });

export default i18n;
