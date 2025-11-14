import { useState, useCallback } from 'react';
import * as surveyService from '../services/teacher/api/surveyService';
import type {
    Survey,
    SurveyDashboard,
} from '../services/teacher/api/surveyService';

export const useSurveys = () => {
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [dashboard, setDashboard] = useState<SurveyDashboard | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch dashboard data
    const fetchDashboard = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await surveyService.getSurveyDashboard();
            setDashboard(data);
        } catch (err: any) {
            console.error('Error fetching dashboard:', err);
            setError(err.response?.data?.message || 'Không thể tải dữ liệu dashboard');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch surveys list
    const fetchSurveys = useCallback(
        async (filters?: { status?: string; type?: string }) => {
            try {
                setLoading(true);
                setError(null);
                const data = await surveyService.getSurveys(filters);
                setSurveys(data.surveys);
                return data;
            } catch (err: any) {
                console.error('Error fetching surveys:', err);
                setError(err.response?.data?.message || 'Không thể tải danh sách khảo sát');
                return { surveys: [], total: 0 };
            } finally {
                setLoading(false);
            }
        },
        []
    );

    // Create survey
    const createSurvey = useCallback(
        async (data: surveyService.CreateSurveyDto) => {
            try {
                setLoading(true);
                setError(null);
                const newSurvey = await surveyService.createSurvey(data);
                setSurveys((prev) => [newSurvey, ...prev]);
                return newSurvey;
            } catch (err: any) {
                console.error('Error creating survey:', err);
                setError(err.response?.data?.message || 'Không thể tạo khảo sát');
                throw err;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    // Create survey from questions
    const createSurveyFromQuestions = useCallback(
        async (data: surveyService.CreateSurveyFromQuestionsDto) => {
            try {
                setLoading(true);
                setError(null);
                const newSurvey = await surveyService.createSurveyFromQuestions(data);
                setSurveys((prev) => [newSurvey, ...prev]);
                return newSurvey;
            } catch (err: any) {
                console.error('Error creating survey from questions:', err);
                setError(
                    err.response?.data?.message || 'Không thể tạo khảo sát từ câu hỏi có sẵn'
                );
                throw err;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    // Update survey
    const updateSurvey = useCallback(
        async (id: string, data: Partial<surveyService.CreateSurveyDto>) => {
            try {
                setLoading(true);
                setError(null);
                const updated = await surveyService.updateSurvey(id, data);
                setSurveys((prev) => prev.map((s) => (s.id === id ? updated : s)));
                return updated;
            } catch (err: any) {
                console.error('Error updating survey:', err);
                setError(err.response?.data?.message || 'Không thể cập nhật khảo sát');
                throw err;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    // Delete survey
    const deleteSurvey = useCallback(async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            await surveyService.deleteSurvey(id);
            setSurveys((prev) => prev.filter((s) => s.id !== id));
            return true;
        } catch (err: any) {
            console.error('Error deleting survey:', err);
            setError(err.response?.data?.message || 'Không thể xóa khảo sát');
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    // Get survey detail
    const getSurveyDetail = useCallback(async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            const survey = await surveyService.getSurveyDetail(id);
            return survey;
        } catch (err: any) {
            console.error('Error fetching survey detail:', err);
            setError(err.response?.data?.message || 'Không thể tải chi tiết khảo sát');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Get survey analytics
    const getSurveyAnalytics = useCallback(async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            const analytics = await surveyService.getSurveyAnalytics(id);
            return analytics;
        } catch (err: any) {
            console.error('Error fetching survey analytics:', err);
            setError(err.response?.data?.message || 'Không thể tải phân tích khảo sát');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Get available questions
    const getAvailableQuestions = useCallback(async (category?: string) => {
        try {
            setLoading(true);
            setError(null);
            const questions = await surveyService.getAvailableQuestions(category);
            return questions;
        } catch (err: any) {
            console.error('Error fetching available questions:', err);
            setError(err.response?.data?.message || 'Không thể tải danh sách câu hỏi');
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Send reminder
    const sendReminder = useCallback(
        async (surveyId: string, message: string, studentIds?: string[]) => {
            try {
                setLoading(true);
                setError(null);
                await surveyService.sendReminder({ surveyId, message, studentIds });
                return true;
            } catch (err: any) {
                console.error('Error sending reminder:', err);
                setError(err.response?.data?.message || 'Không thể gửi nhắc nhở');
                return false;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    // Export responses
    const exportResponses = useCallback(async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            const blob = await surveyService.exportSurveyResponses(id);

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `survey_${id}_responses.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            return true;
        } catch (err: any) {
            console.error('Error exporting responses:', err);
            setError(err.response?.data?.message || 'Không thể xuất dữ liệu');
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        surveys,
        dashboard,
        loading,
        error,
        fetchDashboard,
        fetchSurveys,
        createSurvey,
        createSurveyFromQuestions,
        updateSurvey,
        deleteSurvey,
        getSurveyDetail,
        getSurveyAnalytics,
        getAvailableQuestions,
        sendReminder,
        exportResponses,
    };
};

export default useSurveys;
