export interface Appointment {
    id: string;
    student: {
        id: string;
        code: string;
        name: string;
        class: string;
        avatar?: string;
    };
    date: string;
    timeSlot: string;
    purpose: string;
    status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';
    location?: string;
    notes?: string;
    requestedAt: Date;
    confirmedAt?: Date;
    completedAt?: Date;
}

export interface AppointmentListResponse {
    appointments: Appointment[];
    total: number;
    summary: {
        pending: number;
        confirmed: number;
        completed: number;
        rejected: number;
        cancelled: number;
    };
}

export interface AppointmentDashboard {
    summary: {
        todayAppointments: number;
        weekAppointments: number;
        pendingRequests: number;
        completedThisWeek: number;
    };
    todaySchedule: Appointment[];
    upcomingAppointments: Appointment[];
    recentRequests: Appointment[];
    weeklyChart: {
        labels: string[];
        datasets: Array<{
            label: string;
            data: number[];
            backgroundColor: string;
        }>;
    };
}

export interface InstructorAvailability {
    id: string;
    date: string;
    timeSlots: string[];
    bookedSlots: string[];
    location?: string;
    maxAppointments: number;
    currentAppointments: number;
}

export interface AvailabilityCalendar {
    month: string;
    year: number;
    days: Array<{
        date: string;
        isAvailable: boolean;
        slots: number;
        bookedSlots: number;
        appointments: Appointment[];
    }>;
}

export interface MeetingDetail {
    id: string;
    appointment: Appointment;
    agenda: string[];
    discussionPoints: string[];
    actionItems: Array<{
        id: string;
        description: string;
        assignedTo: string;
        dueDate: string;
        status: 'pending' | 'in-progress' | 'completed';
    }>;
    meetingNotes: string;
    attachments: Array<{
        id: string;
        name: string;
        type: string;
        url: string;
    }>;
    followUp?: {
        date: string;
        notes: string;
    };
}
