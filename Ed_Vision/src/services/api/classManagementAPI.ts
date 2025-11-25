import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const classManagementAPI = {
    // Lấy danh sách lớp
    getClasses: async () => {
        const response = await api.get('/teacher/class-management/classes');
        return response.data;
    },

    // Lấy thống kê
    getStatistics: async () => {
        const response = await api.get('/teacher/class-management/statistics');
        return response.data;
    },

    // Lấy danh sách sinh viên trong lớp
    getStudentsByClass: async (classCode: string) => {
        const response = await api.get(`/teacher/class-management/classes/${classCode}/students`);
        return response.data;
    },
};
