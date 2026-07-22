import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { speakingService } from '../../services/speakingService';
import {
    Microphone, Stop, ArrowLeft, ArrowRight,
    CheckCircle, WarningCircle, Clock,
    Trophy, Flame, Play, ArrowsClockwise,
    CircleNotch, CaretRight, CaretLeft
} from '@phosphor-icons/react';

const MAX_TIME = 120; // 2 minutes per question/part

const SpeakingRecorderPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Receive state
    const locationState = (location.state as any) || {};
    const partType: 'part1' | 'part2' = locationState.partType || 'part1';
    const topicTitle: string = locationState.topicTitle || 'IELTS Speaking Topic';
    const questionsList: string[] = locationState.questions || [];
    const youShouldSayHints: string[] = locationState.youShouldSay || [];
    const isExamMode: boolean = locationState.isExamMode || false;

    // Active Part 1 Question Index (0-based)
    const [currentQIndex, setCurrentQIndex] = useState<number>(0);

    // Store recordings/transcripts per question: { [qIndex]: { blob, url, duration } }
    const [recordedAnswers, setRecordedAnswers] = useState<Record<number, { blob: Blob; url: string; duration: number }>>({});

    const [isRecording, setIsRecording] = useState(false);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [language, setLanguage] = useState<'en' | 'zh'>('en');
    const [error, setError] = useState('');
    const [liveTranscript, setLiveTranscript] = useState('');

    // 1-minute Prep Timer state for Part 2 / Exam Mode
    const [prepTimeLeft, setPrepTimeLeft] = useState<number>(isExamMode || partType === 'part2' ? 60 : 0);
    const [isPrepActive, setIsPrepActive] = useState<boolean>(isExamMode || partType === 'part2');

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const prepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const recognitionRef = useRef<any>(null);

    // Active question prompt text
    const activeQuestionText = useMemo(() => {
        if (partType === 'part1' && questionsList.length > 0) {
            return questionsList[currentQIndex] || questionsList[0];
        }
        return topicTitle;
    }, [partType, questionsList, currentQIndex, topicTitle]);

    // When switching active question, load its existing recording if present
    useEffect(() => {
        const existing = recordedAnswers[currentQIndex];
        if (existing) {
            setAudioBlob(existing.blob);
            setAudioUrl(existing.url);
            setTimeElapsed(existing.duration);
        } else {
            setAudioBlob(null);
            setAudioUrl(null);
            setTimeElapsed(0);
        }
    }, [currentQIndex, recordedAnswers]);

    // Prep Countdown Timer for Part 2
    useEffect(() => {
        if (!isPrepActive) return;

        prepTimerRef.current = setInterval(() => {
            setPrepTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(prepTimerRef.current!);
                    setIsPrepActive(false);
                    startRecording(); // Auto start recording when prep timer ends
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (prepTimerRef.current) clearInterval(prepTimerRef.current);
        };
    }, [isPrepActive]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (prepTimerRef.current) clearInterval(prepTimerRef.current);
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
            setIsPrepActive(false);

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : 'audio/webm';
            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            let capturedDuration = 0;

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType });
                const url = URL.createObjectURL(blob);
                setAudioBlob(blob);
                setAudioUrl(url);

                // Save recording for current question index
                setRecordedAnswers(prev => ({
                    ...prev,
                    [currentQIndex]: { blob, url, duration: capturedDuration }
                }));

                stream.getTracks().forEach(track => track.stop());
            };

            // Live Web Speech API preview
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

                rec.onerror = () => {};

                rec.start();
                recognitionRef.current = rec;
            }

            mediaRecorder.start(250);
            setIsRecording(true);
            setTimeElapsed(0);

            timerRef.current = setInterval(() => {
                setTimeElapsed(prev => {
                    capturedDuration = prev + 1;
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

    const handleNextQuestion = () => {
        if (isRecording) stopRecording();
        if (currentQIndex < questionsList.length - 1) {
            setCurrentQIndex(prev => prev + 1);
        }
    };

    const handlePrevQuestion = () => {
        if (isRecording) stopRecording();
        if (currentQIndex > 0) {
            setCurrentQIndex(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        const activeBlob = audioBlob || recordedAnswers[currentQIndex]?.blob;
        if (!activeBlob) {
            alert('Vui lòng thu âm ít nhất 1 câu hỏi trước khi gửi chấm điểm!');
            return;
        }

        try {
            setIsUploading(true);
            setError('');

            // Build detailed prompt mapping so AI evaluator evaluates each question cleanly
            let fullPromptText = `${topicTitle}\n\n`;
            if (partType === 'part1' && questionsList.length > 0) {
                fullPromptText += `Part 1 Questions:\n` + questionsList.map((q, idx) => {
                    const hasAns = !!recordedAnswers[idx];
                    return `Question ${idx + 1}: ${q} [Status: ${hasAns ? 'Recorded' : 'Skipped'}]`;
                }).join('\n');
            } else {
                fullPromptText += `Cue Card Topic: ${topicTitle}`;
            }

            const { recordingId } = await speakingService.submitRecording({
                audioBlob: activeBlob,
                language,
                promptText: fullPromptText,
            });

            navigate(`/speaking/analysis/${recordingId}`);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể gửi bản ghi. Hãy thử lại.');
            setIsUploading(false);
        }
    };

    const recordedCount = Object.keys(recordedAnswers).length;
    const totalQuestionsCount = questionsList.length || 1;
    const progress = (timeElapsed / MAX_TIME) * 100;

    return (
        <div className="min-h-[100dvh] bg-[#050505] text-[#f5f5f5] pt-6 pb-28 px-4 md:px-8 max-w-[1200px] mx-auto font-sans">
            
            {/* Back Navigation Header */}
            <div className="mb-6 flex items-center justify-between">
                <Link
                    to="/speaking"
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-xs font-semibold bg-[#0a0a0e] border border-white/5 px-4 py-2 rounded-xl"
                >
                    <ArrowLeft size={14} />
                    Quay lại Bộ đề Speaking
                </Link>
                {isExamMode && (
                    <span className="px-3 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-bold uppercase flex items-center gap-1.5">
                        <Flame size={14} />
                        Chế độ thi thật
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Side: Active Sequential Question or Cue Card Details */}
                <div className="lg:col-span-6 space-y-6">
                    <div className="bg-[#0a0a0e] border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl space-y-5">
                        
                        {/* Header Badge & Title */}
                        <div className="flex items-center justify-between pb-3 border-b border-white/5">
                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                                <Microphone size={16} />
                                {partType === 'part1' ? `PART 1: CÂU HỎI ${currentQIndex + 1} / ${totalQuestionsCount}` : 'PART 2: CUE CARD'}
                            </span>
                            <span className="text-xs text-gray-400">
                                {topicTitle}
                            </span>
                        </div>

                        {/* PART 1 Sequential Question Box */}
                        {partType === 'part1' && questionsList.length > 0 && (
                            <div className="space-y-4">
                                <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5 space-y-2">
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                                        Câu hỏi {currentQIndex + 1}:
                                    </span>
                                    <h2 className="text-lg font-bold text-white leading-relaxed">
                                        {activeQuestionText}
                                    </h2>
                                </div>

                                {/* Part 1 Question Step Pills */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                                        <span>Danh sách câu hỏi lần lượt:</span>
                                        <span className="text-indigo-400">Đã thu âm {recordedCount}/{totalQuestionsCount} câu</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {questionsList.map((q, idx) => {
                                            const isDone = !!recordedAnswers[idx];
                                            const isCurrent = idx === currentQIndex;

                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => {
                                                        if (isRecording) stopRecording();
                                                        setCurrentQIndex(idx);
                                                    }}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${isCurrent ? 'bg-indigo-600 border-indigo-500 text-white font-bold' : isDone ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'}`}
                                                >
                                                    Câu {idx + 1} {isDone ? '✓' : ''}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PART 2 Cue Card & Optional Hints Box */}
                        {partType === 'part2' && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-bold text-white leading-snug">
                                    {topicTitle}
                                </h2>

                                {youShouldSayHints.length > 0 && (
                                    <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5 space-y-2">
                                        <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block">
                                            💡 Gợi ý dàn bài (Optional Hints to cover in 2 minutes):
                                        </span>
                                        <ul className="text-xs text-gray-300 space-y-1.5 pl-1 font-medium">
                                            {youShouldSayHints.map((hint, idx) => (
                                                <li key={idx} className="flex items-start gap-2">
                                                    <span className="text-gray-500">•</span>
                                                    <span>{hint}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="text-xs text-gray-400 pt-2 border-t border-white/5">
                            <p>💡 Thu âm xong mỗi câu, hệ thống sẽ lưu bản ghi của câu đó để AI phân tích chính xác từng câu hỏi.</p>
                        </div>
                    </div>
                </div>

                {/* Right Side: Microphone & Audio Recorder */}
                <div className="lg:col-span-6 space-y-6">
                    <div className="bg-[#0a0a0e] border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl text-center space-y-6">
                        
                        {/* 1-Minute Prep Countdown for Part 2 */}
                        {isPrepActive && (
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 space-y-2">
                                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                                    ⏳ Thời gian chuẩn bị Part 2 (1 Phút):
                                </span>
                                <span className="text-3xl font-bold text-white block">
                                    00:{prepTimeLeft.toString().padStart(2, '0')}
                                </span>
                                <button
                                    onClick={() => { setIsPrepActive(false); startRecording(); }}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-1.5 rounded-lg text-xs transition-colors"
                                >
                                    Bỏ qua chuẩn bị & Thu âm ngay
                                </button>
                            </div>
                        )}

                        {/* Speaking Timer Display */}
                        <div className="space-y-2">
                            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">
                                {partType === 'part1' ? `Thời gian thu âm Câu ${currentQIndex + 1}` : 'Thời gian thu âm Part 2'}
                            </span>
                            <span className={`text-4xl font-black block tracking-tight ${isRecording ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                                {formatTime(timeElapsed)}
                            </span>

                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 mt-3">
                                <div 
                                    className="h-full bg-indigo-500 transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center justify-center gap-2">
                                <WarningCircle size={16} />
                                {error}
                            </div>
                        )}

                        {/* Record Button */}
                        <div className="py-4">
                            {!isRecording ? (
                                <button
                                    onClick={startRecording}
                                    disabled={isUploading || isPrepActive}
                                    className="w-20 h-20 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/30 hover:scale-105 transition-all disabled:opacity-50"
                                >
                                    <Microphone size={36} weight="fill" />
                                </button>
                            ) : (
                                <button
                                    onClick={stopRecording}
                                    className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-red-600/30 animate-pulse transition-all"
                                >
                                    <Stop size={36} weight="fill" />
                                </button>
                            )}
                            <span className="text-xs text-gray-400 font-medium block mt-3">
                                {isRecording ? 'Nhấn để dừng ghi âm câu này' : recordedAnswers[currentQIndex] ? 'Nhấn nút để thu âm lại câu này' : 'Nhấn nút để bắt đầu nói câu này'}
                            </span>
                        </div>

                        {/* Audio Controls & Next Question Action */}
                        {audioUrl && !isRecording && (
                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <div className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
                                    <CheckCircle size={16} /> Đã lưu bản ghi cho Câu {currentQIndex + 1}
                                </div>
                                <audio src={audioUrl} controls className="w-full rounded-xl" />

                                <div className="flex items-center gap-3">
                                    {partType === 'part1' && currentQIndex < totalQuestionsCount - 1 && (
                                        <button
                                            onClick={handleNextQuestion}
                                            className="flex-1 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                                        >
                                            <span>Chuyển sang Câu {currentQIndex + 2}</span>
                                            <CaretRight size={14} />
                                        </button>
                                    )}

                                    <button
                                        onClick={handleSubmit}
                                        disabled={isUploading}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        {isUploading ? (
                                            <>
                                                <CircleNotch size={16} className="animate-spin" />
                                                <span>AI đang chấm điểm...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle size={16} />
                                                <span>Gửi AI Chấm Điểm</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

            </div>

        </div>
    );
};

export default SpeakingRecorderPage;
