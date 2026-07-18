import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { speakingService } from '../../services/speakingService';
import {
    Microphone, Stop, ArrowLeft, ArrowRight,
    CheckCircle, WarningCircle, WaveformSlash,
    SpeakerHigh, TextT
} from '@phosphor-icons/react';

const MAX_TIME = 120; // 2 minutes

const SpeakingRecorderPage: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [language, setLanguage] = useState<'en' | 'zh'>('en');
    const [promptText, setPromptText] = useState('');
    const [error, setError] = useState('');
    const [liveTranscript, setLiveTranscript] = useState('');
    const [sttAvailable, setSttAvailable] = useState(true);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const recognitionRef = useRef<any>(null);
    const navigate = useNavigate();

    // Detect Web Speech API availability
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        setSttAvailable(!!SpeechRecognition);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (mediaRecorderRef.current?.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
            try { recognitionRef.current?.stop(); } catch (_) {}
        };
    }, []);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const startRecording = async () => {
        try {
            setError('');
            setLiveTranscript('');
            setAudioBlob(null);
            setAudioUrl(null);

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // ── MediaRecorder ──────────────────────────────
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : 'audio/webm';
            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
                stream.getTracks().forEach(track => track.stop());
            };

            // ── Web Speech API (live preview only) ────────
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const rec = new SpeechRecognition();
                rec.lang = language === 'en' ? 'en-US' : 'zh-CN';
                rec.continuous = true;
                rec.interimResults = true;

                rec.onresult = (event: any) => {
                    let interim = '';
                    let final = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            final += event.results[i][0].transcript + ' ';
                        } else {
                            interim += event.results[i][0].transcript;
                        }
                    }
                    setLiveTranscript(prev => prev + final + (interim ? `[${interim}]` : ''));
                };

                rec.onerror = (e: any) => {
                    if (e.error !== 'aborted') {
                        console.warn('Web Speech API error:', e.error);
                    }
                };

                rec.start();
                recognitionRef.current = rec;
            }

            mediaRecorder.start(250); // collect chunks every 250 ms
            setIsRecording(true);
            setTimeElapsed(0);

            timerRef.current = setInterval(() => {
                setTimeElapsed(prev => {
                    if (prev >= MAX_TIME - 1) {
                        stopRecording();
                        return MAX_TIME;
                    }
                    return prev + 1;
                });
            }, 1000);

        } catch (err: any) {
            if (err.name === 'NotAllowedError') {
                setError('Trình duyệt chặn quyền truy cập microphone. Hãy cấp quyền và thử lại.');
            } else {
                setError('Không thể kết nối microphone. Kiểm tra thiết bị và thử lại.');
            }
        }
    };

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        try { recognitionRef.current?.stop(); } catch (_) {}
        if (timerRef.current) clearInterval(timerRef.current);
        setIsRecording(false);
    }, []);

    const handleSubmit = async () => {
        if (!audioBlob) return;

        try {
            setIsUploading(true);
            setError('');

            const { recordingId } = await speakingService.submitRecording({
                audioBlob,
                language,
                promptText: promptText.trim() || undefined,
            });

            navigate(`/speaking/analysis/${recordingId}`);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể gửi bản ghi. Hãy thử lại.');
            setIsUploading(false);
        }
    };

    const progress = (timeElapsed / MAX_TIME) * 100;

    return (
        <div className="min-h-screen bg-transparent text-[#f5f5f5] pb-24 relative z-10">
            <div className="max-w-2xl mx-auto px-6 pt-12">

                {/* Back header */}
                <div className="mb-8">
                    <Link
                        to="/speaking"
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs font-semibold uppercase tracking-wider"
                    >
                        <ArrowLeft size={14} />
                        Quay lại
                    </Link>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-semibold bg-white/[0.04] border border-white/[0.05] text-gray-400 mb-3">
                    Luyện nói
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">AI Speaking Practice</h1>
                <p className="text-gray-500 text-sm mb-10 leading-relaxed">
                    Ghi âm giọng nói, AI sẽ phân tích phát âm và ngữ pháp qua Nvidia Whisper.
                </p>

                {/* Settings Card */}
                <div className="rounded-[2rem] bg-white/[0.015] border border-white/[0.05] p-2 mb-6">
                    <div className="rounded-[calc(2rem-0.5rem)] bg-[#0a0a0a] border border-white/[0.02] p-6 space-y-5">
                        {/* Language picker */}
                        <div>
                            <label className="block text-[10px] font-bold tracking-[0.15em] text-gray-500 uppercase mb-2">
                                Ngôn ngữ luyện tập
                            </label>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value as 'en' | 'zh')}
                                disabled={isRecording || isUploading}
                                className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3 text-white focus:border-white/20 outline-none text-sm font-medium cursor-pointer transition-all"
                            >
                                <option value="en" className="bg-[#0c0c0c]">🇬🇧 Tiếng Anh (English)</option>
                                <option value="zh" className="bg-[#0c0c0c]">🇨🇳 Tiếng Trung (Mandarin)</option>
                            </select>
                        </div>

                        {/* Prompt */}
                        <div>
                            <label className="block text-[10px] font-bold tracking-[0.15em] text-gray-500 uppercase mb-2">
                                Chủ đề / Bài đọc <span className="normal-case text-gray-700">(Không bắt buộc)</span>
                            </label>
                            <textarea
                                value={promptText}
                                onChange={(e) => setPromptText(e.target.value)}
                                placeholder={language === 'zh'
                                    ? '例如：请介绍一下你自己...'
                                    : 'E.g., Introduce yourself, or paste a paragraph to read aloud...'
                                }
                                disabled={isRecording || isUploading}
                                className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3 text-white placeholder-gray-700 focus:border-white/20 outline-none text-sm resize-none h-24 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Recorder card */}
                <div className={`rounded-[2rem] border p-2 mb-6 transition-all duration-500 ${
                    isRecording
                        ? 'bg-red-500/[0.03] border-red-500/30'
                        : 'bg-white/[0.015] border-white/[0.05]'
                }`}>
                    <div className={`rounded-[calc(2rem-0.5rem)] bg-[#0a0a0a] border p-8 flex flex-col items-center transition-all duration-500 ${
                        isRecording ? 'border-red-500/10' : 'border-white/[0.02]'
                    }`}>
                        {/* Timer + progress ring */}
                        <div className="relative mb-6">
                            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />
                                <circle
                                    cx="50" cy="50" r="44" fill="none"
                                    stroke={isRecording ? 'rgba(239,68,68,0.7)' : 'rgba(255,255,255,0.1)'}
                                    strokeWidth="3"
                                    strokeDasharray={`${progress * 2.764} 276.4`}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-2xl font-mono font-bold tracking-tight ${isRecording ? 'text-red-400' : 'text-white'}`}>
                                    {formatTime(timeElapsed)}
                                </span>
                                <span className="text-[10px] text-gray-600">{formatTime(MAX_TIME)}</span>
                            </div>
                        </div>

                        {/* Record / Stop button */}
                        {!isRecording ? (
                            <button
                                onClick={startRecording}
                                disabled={isUploading}
                                className="group w-20 h-20 rounded-full bg-white/[0.05] border border-white/10 hover:bg-white/10 hover:border-white/20 flex items-center justify-center transition-all duration-300 disabled:opacity-30 mb-4"
                                title="Bắt đầu ghi âm"
                            >
                                <Microphone size={32} className="text-white group-hover:scale-110 transition-transform" />
                            </button>
                        ) : (
                            <button
                                onClick={stopRecording}
                                className="group w-20 h-20 rounded-full bg-red-500/10 border border-red-500/40 hover:bg-red-500/20 flex items-center justify-center transition-all duration-300 animate-pulse mb-4"
                                title="Dừng ghi âm"
                            >
                                <Stop size={32} className="text-red-400" />
                            </button>
                        )}

                        <p className={`text-xs font-semibold uppercase tracking-widest transition-colors ${
                            isRecording ? 'text-red-400' : 'text-gray-600'
                        }`}>
                            {isRecording ? 'Đang ghi âm...' : 'Nhấn để ghi âm'}
                        </p>

                        {/* Live transcript preview */}
                        {isRecording && (
                            <div className="mt-6 w-full p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] min-h-[60px]">
                                <div className="flex items-center gap-2 mb-2">
                                    <TextT size={12} className="text-gray-600" />
                                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                                        Văn bản nhận dạng (xem trước)
                                    </span>
                                </div>
                                {liveTranscript ? (
                                    <p className="text-sm text-gray-300 leading-relaxed font-mono">
                                        {liveTranscript}
                                    </p>
                                ) : (
                                    <p className="text-xs text-gray-700 italic">
                                        {sttAvailable ? 'Đang lắng nghe...' : 'Trình duyệt không hỗ trợ xem trước — AI sẽ transcribe sau.'}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Playback + Submit */}
                {audioBlob && !isRecording && (
                    <div className="space-y-4 mb-6">
                        <div className="rounded-2xl bg-white/[0.015] border border-white/[0.05] p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <SpeakerHigh size={14} className="text-gray-500" />
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nghe lại bản ghi</span>
                            </div>
                            <audio src={audioUrl!} controls className="w-full opacity-80 hover:opacity-100 transition-opacity" />
                        </div>

                        {/* STT note */}
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-500/[0.04] border border-indigo-500/[0.12] text-xs text-indigo-300/80">
                            <WaveformSlash size={16} className="flex-shrink-0 mt-0.5 text-indigo-400" />
                            <span>
                                AI <strong className="text-indigo-300">Nvidia Whisper</strong> sẽ tự động chuyển giọng nói thành văn bản sau khi bạn gửi. 
                                Quá trình này mất khoảng 10–30 giây.
                            </span>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={isUploading}
                            className="group w-full flex items-center justify-between bg-white hover:bg-white/95 disabled:opacity-30 disabled:pointer-events-none text-black pl-6 pr-2.5 py-3.5 rounded-full font-bold text-sm transition-all duration-300 active:scale-[0.98]"
                        >
                            <span>
                                {isUploading ? 'Đang gửi & phân tích...' : 'Gửi để AI phân tích'}
                            </span>
                            {isUploading ? (
                                <div className="w-8 h-8 rounded-full bg-[#0a0a0a] flex items-center justify-center">
                                    <div className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
                                </div>
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-[#0a0a0a] text-white flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1">
                                    <ArrowRight size={14} weight="bold" />
                                </div>
                            )}
                        </button>
                    </div>
                )}

                {/* Error banner */}
                {error && (
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/[0.05] border border-red-500/20 text-red-400 text-xs font-semibold">
                        <WarningCircle size={18} className="flex-shrink-0" />
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SpeakingRecorderPage;
