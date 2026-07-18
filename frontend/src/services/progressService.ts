import httpClient from './httpClient';

export interface LearningProgress {
    id: string;
    totalFlashcardsMastered: number;
    totalExercisesCompleted: number;
    streakDays: number;
    lastActivityDate: string | null;
}

export interface ActivityHistory {
    id: string;
    title: string;
    type: string;
    score?: number;
    status?: string;
    date: string;
}

export interface AggregatedHistory {
    exercises: ActivityHistory[];
    writings: ActivityHistory[];
}

export const progressService = {
    getProgress: async () => {
        const response = await httpClient.get<{ data: LearningProgress }>('/progress');
        return response.data.data;
    },

    getHistory: async () => {
        const response = await httpClient.get<{ data: AggregatedHistory }>('/progress/history');
        return response.data.data;
    }
};
