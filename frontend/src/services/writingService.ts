import httpClient from './httpClient';

export interface WritingPrompt {
    id: string;
    title: string;
    promptText: string;
    language: 'en' | 'zh';
    level: string;
    taskType: 'IELTS_TASK_1' | 'IELTS_TASK_2';
    imageUrl?: string;
    aiReferenceData?: string;
}

export interface WritingSubmission {
    id: string;
    prompt: WritingPrompt;
    submissionText: string;
    status: string;
    submittedAt: string;
}

export interface WritingFeedback {
    id: string;
    taskResponseScore: number;
    coherenceScore: number;
    lexicalScore: number;
    grammarScore: number;
    overallScore: number;
    detailedFeedback: {
        grammar_errors: { original: string; corrected: string; explanation: string; }[];
        vocabulary_suggestions: { original: string; suggestion: string; explanation: string; }[];
        data_inaccuracies?: { student_statement: string; actual_data: string; explanation: string; }[];
        general_comment: string;
    };
}

export interface SubmissionWithFeedback {
    submission: WritingSubmission;
    feedback?: WritingFeedback;
}

export const writingService = {
    getPrompts: async (page = 0, size = 20) => {
        const response = await httpClient.get<{ data: { content: WritingPrompt[], totalElements: number } }>(`/writing/prompts?page=${page}&size=${size}`);
        return response.data.data;
    },

    getPrompt: async (id: string) => {
        const response = await httpClient.get<{ data: WritingPrompt }>(`/writing/prompts/${id}`);
        return response.data.data;
    },

    createPrompt: async (data: Omit<WritingPrompt, 'id'>) => {
        const response = await httpClient.post<{ data: WritingPrompt }>('/writing/prompts', data);
        return response.data.data;
    },

    updatePrompt: async (id: string, data: Omit<WritingPrompt, 'id'>) => {
        const response = await httpClient.put<{ data: WritingPrompt }>(`/writing/prompts/${id}`, data);
        return response.data.data;
    },

    deletePrompt: async (id: string) => {
        await httpClient.delete(`/writing/prompts/${id}`);
    },

    submitEssay: async (promptId: string, submissionText: string) => {
        const response = await httpClient.post<{ data: { submission_id: string; status: string } }>('/writing/submissions', { promptId, submissionText });
        return response.data.data;
    },

    getSubmission: async (submissionId: string) => {
        const response = await httpClient.get<{ data: SubmissionWithFeedback }>(`/writing/submissions/${submissionId}`);
        return response.data.data;
    },

    getUserSubmissions: async (page = 0, size = 20) => {
        const response = await httpClient.get<{ data: { content: WritingSubmission[], totalElements: number } }>(`/writing/submissions?page=${page}&size=${size}`);
        return response.data.data;
    },

    uploadImage: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await httpClient.post<{ url: string }>('/upload/image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data.url;
    }
};
