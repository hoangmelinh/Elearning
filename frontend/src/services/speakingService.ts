import httpClient from './httpClient';

export interface RecordingUploadRequest {
    language: 'en' | 'zh';
    promptText?: string;
    transcriptText?: string;
    fileSizeBytes: number;
    durationSeconds: number;
}

export interface RecordingUploadResponse {
    recordingId: string;
    uploadUrl: string;
    expiresIn: number;
}

export interface GrammarError {
    error_type: string;
    original: string;
    corrected: string;
    explanation: string;
}

export interface Suggestion {
    type: string;
    text: string;
}

export interface AnalysisDto {
    ieltsOverall?: number;
    ieltsFluency?: number;
    ieltsLexical?: number;
    ieltsGrammar?: number;
    ieltsPronunciation?: number;
    detailedFeedback?: string;
    pronunciationScore: number;
    grammarErrors: GrammarError[];
    suggestions: Suggestion[];
}

export interface RecordingResponse {
    id: string;
    language: 'en' | 'zh';
    promptText?: string;
    audioUrl?: string;
    transcriptText?: string;
    createdAt: string;
    expiresAt: string;
    isDeleted: boolean;
    analysisStatus: 'pending' | 'transcribing' | 'analyzing' | 'completed' | 'failed';
    analysis?: AnalysisDto;
}

export const speakingService = {
    getUploadUrl: async (request: RecordingUploadRequest) => {
        const payload = {
            language: request.language,
            prompt_text: request.promptText,
            transcript_text: request.transcriptText,
            file_size_bytes: request.fileSizeBytes,
            duration_seconds: request.durationSeconds
        };
        const response = await httpClient.post<{ data: any }>('/recordings/upload-url', payload);
        const data = response.data.data;
        return {
            recordingId: data.recording_id,
            uploadUrl: data.upload_url,
            expiresIn: data.expires_in
        };
    },

    uploadToS3: async (uploadUrl: string, file: Blob) => {
        // Direct PUT to S3 bypassing our backend
        await fetch(uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': 'audio/webm'
            }
        });
    },

    analyzeRecording: async (recordingId: string) => {
        const response = await httpClient.post<{ data: { status: string } }>(`/recordings/${recordingId}/analyze`);
        return response.data.data;
    },

    getRecording: async (recordingId: string) => {
        const response = await httpClient.get<{ data: any }>(`/recordings/${recordingId}`);
        const data = response.data.data;
        return {
            id: data.id,
            language: data.language,
            promptText: data.promptText || data.prompt_text,
            audioUrl: data.audioUrl || data.audio_url,
            transcriptText: data.transcriptText || data.transcript_text,
            createdAt: data.createdAt || data.created_at,
            expiresAt: data.expiresAt || data.expires_at,
            isDeleted: data.isDeleted ?? data.is_deleted,
            analysisStatus: data.analysisStatus || data.analysis_status || 'pending',
            analysis: data.analysis ? {
                ieltsOverall: data.analysis.ieltsOverall,
                ieltsFluency: data.analysis.ieltsFluency,
                ieltsLexical: data.analysis.ieltsLexical,
                ieltsGrammar: data.analysis.ieltsGrammar,
                ieltsPronunciation: data.analysis.ieltsPronunciation,
                detailedFeedback: data.analysis.detailedFeedback,
                pronunciationScore: data.analysis.pronunciationScore,
                grammarErrors: data.analysis.grammarErrors || [],
                suggestions: data.analysis.suggestions || []
            } : undefined
        };
    },

    getUserRecordings: async (page = 0, size = 20) => {
        const response = await httpClient.get<{ data: any }>(`/recordings?page=${page}&size=${size}`);
        const data = response.data.data;
        return {
            content: (data.content || []).map((recording: any) => ({
                id: recording.id,
                language: recording.language,
                promptText: recording.promptText || recording.prompt_text,
                audioUrl: recording.audioUrl || recording.audio_url,
                transcriptText: recording.transcriptText || recording.transcript_text,
                createdAt: recording.createdAt || recording.created_at,
                expiresAt: recording.expiresAt || recording.expires_at,
                isDeleted: recording.isDeleted ?? recording.is_deleted,
                analysisStatus: recording.analysisStatus || recording.analysis_status || 'pending',
                analysis: recording.analysis ? {
                    ieltsOverall: recording.analysis.ieltsOverall,
                    ieltsFluency: recording.analysis.ieltsFluency,
                    ieltsLexical: recording.analysis.ieltsLexical,
                    ieltsGrammar: recording.analysis.ieltsGrammar,
                    ieltsPronunciation: recording.analysis.ieltsPronunciation,
                    detailedFeedback: recording.analysis.detailedFeedback,
                    pronunciationScore: recording.analysis.pronunciationScore,
                    grammarErrors: recording.analysis.grammarErrors || [],
                    suggestions: recording.analysis.suggestions || []
                } : undefined
            })),
            totalElements: data.total_elements
        };
    },

    /**
     * New simplified flow: send audio blob directly to backend.
     * Backend runs Nvidia Whisper STT then AI analysis.
     */
    submitRecording: async (params: {
        audioBlob: Blob;
        language: 'en' | 'zh';
        promptText?: string;
    }): Promise<{ recordingId: string }> => {
        const formData = new FormData();
        formData.append('audio', params.audioBlob, 'recording.webm');
        formData.append('language', params.language);
        if (params.promptText) {
            formData.append('prompt_text', params.promptText);
        }

        const response = await httpClient.post<{ data: any }>(
            '/recordings/submit',
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return { recordingId: response.data.data.recording_id };
    },
};
