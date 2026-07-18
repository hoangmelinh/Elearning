import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { speakingService } from '../../services/speakingService';
import type { RecordingResponse } from '../../services/speakingService';
import {
    ArrowLeft, CheckCircle, WarningCircle, Lightbulb,
    MicrophoneSlash, Spinner
} from '@phosphor-icons/react';

const ScoreRing: React.FC<{ score: number }> = ({ score }) => {
    const clampedScore = Math.max(0, Math.min(100, score));
    const circumference = 2 * Math.PI * 44;
    const dashOffset = circumference - (clampedScore / 100) * circumference;

    const color = clampedScore >= 80
        ? '#10b981'   // emerald
        : clampedScore >= 60
        ? '#f59e0b'   // amber
        : '#ef4444';  // red

    return (
        <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="4" />
                <circle
                    cx="50" cy="50" r="44" fill="none"
                    stroke={color}
                    strokeWidth="4"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-white">{Math.round(clampedScore)}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">/100</span>
            </div>
        </div>
    );
};

const SpeakingAnalysisPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [recording, setRecording] = useState<RecordingResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;

        let cancelled = false;
        let pollTimer: ReturnType<typeof setTimeout>;

        const fetchRecording = async () => {
            try {
                const data = await speakingService.getRecording(id);
                if (cancelled) return;

                setRecording(data);

                // Stop polling when completed or failed
                if (data.analysisStatus === 'completed' || data.analysisStatus === 'failed') {
                    setLoading(false);
                } else {
                    // Still processing — poll every 3 seconds
                    pollTimer = setTimeout(fetchRecording, 3000);
                }
            } catch (err: any) {
                if (!cancelled) {
                    setError(err.response?.data?.message || 'Không thể tải kết quả phân tích.');
                    setLoading(false);
                }
            }
        };

        fetchRecording();
        return () => {
            cancelled = true;
            clearTimeout(pollTimer);
        };
    }, [id]);

    // ── Step-by-step progress indicator ──────────────────────────
    const STEPS: { key: RecordingResponse['analysisStatus']; label: string; sublabel: string }[] = [
        { key: 'pending',      label: 'Đang chuẩn bị',      sublabel: 'Nhận file âm thanh từ trình duyệt...' },
        { key: 'transcribing', label: 'Nvidia Whisper STT',  sublabel: 'Chuyển giọng nói thành văn bản... (10–30s)' },
        { key: 'analyzing',    label: 'AI phân tích',        sublabel: 'Llama đang chấm điểm phát âm & ngữ pháp...' },
        { key: 'completed',    label: 'Hoàn tất',            sublabel: '' },
    ];

    const stepOrder = ['pending', 'transcribing', 'analyzing', 'completed'];
    const currentStepIndex = recording
        ? stepOrder.indexOf(recording.analysisStatus)
        : 0;

    if (loading || (recording && recording.analysisStatus !== 'completed' && recording.analysisStatus !== 'failed')) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col items-center justify-center gap-8 relative z-10 px-6">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-semibold bg-white/[0.04] border border-white/[0.05] text-gray-400 mb-4">
                        Đang xử lý
                    </div>
                    <h2 className="text-2xl font-extrabold text-white text-center mb-2">Phân tích giọng nói</h2>
                    <p className="text-gray-500 text-sm text-center">Trang này tự động cập nhật mỗi 3 giây</p>
                </div>

                {/* Step list */}
                <div className="w-full max-w-sm space-y-2">
                    {STEPS.filter(s => s.key !== 'completed').map((step, i) => {
                        const isDone = currentStepIndex > i;
                        const isActive = currentStepIndex === i;
                        return (
                            <div key={step.key} className={`flex items-start gap-4 p-4 rounded-2xl border transition-all duration-500 ${
                                isActive
                                    ? 'bg-indigo-500/[0.06] border-indigo-500/30'
                                    : isDone
                                    ? 'bg-emerald-500/[0.04] border-emerald-500/20 opacity-60'
                                    : 'bg-white/[0.015] border-white/[0.05] opacity-30'
                            }`}>
                                <div className="flex-shrink-0 mt-0.5">
                                    {isDone ? (
                                        <CheckCircle size={18} className="text-emerald-400" weight="fill" />
                                    ) : isActive ? (
                                        <div className="w-[18px] h-[18px] rounded-full border-2 border-t-indigo-400 border-white/10 animate-spin" />
                                    ) : (
                                        <div className="w-[18px] h-[18px] rounded-full border-2 border-white/10" />
                                    )}
                                </div>
                                <div>
                                    <p className={`text-sm font-semibold ${isActive ? 'text-white' : isDone ? 'text-emerald-400' : 'text-gray-600'}`}>
                                        {step.label}
                                    </p>
                                    {isActive && step.sublabel && (
                                        <p className="text-xs text-indigo-300/70 mt-0.5">{step.sublabel}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Show transcript as soon as it's ready */}
                {recording?.transcriptText && (
                    <div className="w-full max-w-sm rounded-2xl bg-white/[0.015] border border-white/[0.05] p-4">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Transcript đã nhận dạng</p>
                        <p className="text-gray-300 text-sm leading-relaxed font-mono">{recording.transcriptText}</p>
                    </div>
                )}
            </div>
        );
    }

    if (error || !recording) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col items-center justify-center relative z-10 px-6">
                <div className="flex items-center gap-3 p-5 rounded-2xl bg-red-500/[0.05] border border-red-500/20 text-red-400 text-sm max-w-md">
                    <WarningCircle size={20} className="flex-shrink-0" />
                    {error || 'Không tìm thấy bản ghi.'}
                </div>
                <Link to="/speaking" className="mt-6 text-gray-500 hover:text-white text-sm transition-colors">
                    ← Quay lại trang luyện nói
                </Link>
            </div>
        );
    }

    if (recording.isDeleted) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col items-center justify-center relative z-10 px-6">
                <div className="max-w-md w-full text-center">
                    <MicrophoneSlash size={48} className="text-gray-600 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">File âm thanh đã hết hạn</h2>
                    <p className="text-gray-500 text-sm mb-6">File ghi âm tự động xoá sau 15 ngày để bảo vệ bộ nhớ.</p>
                    {recording.analysis && (
                        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-5 text-left">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Lịch sử phân tích</p>
                            <ScoreRing score={recording.analysis.pronunciationScore} />
                            <p className="text-gray-400 text-sm mt-4 italic">"{recording.transcriptText}"</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const { analysis } = recording;

    return (
        <div className="min-h-screen bg-transparent text-[#f5f5f5] pb-24 relative z-10">
            <div className="max-w-3xl mx-auto px-6 pt-12">

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
                    Kết quả phân tích
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white mb-8">AI Speaking Analysis</h1>

                {/* Score + transcript */}
                <div className="rounded-[2rem] bg-white/[0.015] border border-white/[0.05] p-2 mb-6">
                    <div className="rounded-[calc(2rem-0.5rem)] bg-[#0a0a0a] border border-white/[0.02] p-6">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                            {analysis ? (
                                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                                    <ScoreRing score={analysis.pronunciationScore} />
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Điểm phát âm</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                                    <div className="w-36 h-36 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center">
                                        <Spinner size={32} className="text-gray-600 animate-spin" />
                                    </div>
                                    <span className="text-[10px] text-gray-600 uppercase tracking-wider">Đang phân tích...</span>
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Transcript</p>
                                {recording.transcriptText ? (
                                    <p className="text-white/90 text-sm leading-relaxed font-mono bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
                                        {recording.transcriptText}
                                    </p>
                                ) : (
                                    <p className="text-gray-700 text-sm italic">Nvidia Whisper đang transcribe...</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {analysis && (
                    <>
                        {/* Grammar errors */}
                        <div className="rounded-[2rem] bg-white/[0.015] border border-white/[0.05] p-2 mb-6">
                            <div className="rounded-[calc(2rem-0.5rem)] bg-[#0a0a0a] border border-white/[0.02] p-6">
                                <div className="flex items-center gap-2 mb-5">
                                    <WarningCircle size={16} className="text-red-400" weight="fill" />
                                    <h2 className="text-sm font-bold text-white">Lỗi ngữ pháp &amp; Giọng điệu</h2>
                                </div>

                                {analysis.grammarErrors.length === 0 ? (
                                    <div className="flex items-center gap-3 text-emerald-400 text-sm">
                                        <CheckCircle size={18} weight="fill" />
                                        <span>Hoàn hảo! Không phát hiện lỗi ngữ pháp.</span>
                                    </div>
                                ) : (
                                    <ul className="space-y-3">
                                        {analysis.grammarErrors.map((err: any, idx: number) => (
                                            <li key={idx} className="rounded-xl bg-red-500/[0.04] border border-red-500/[0.12] p-4">
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    <span className="line-through text-red-400 font-medium font-mono text-sm">{err.original}</span>
                                                    <span className="text-gray-500">→</span>
                                                    <span className="text-emerald-400 font-bold font-mono text-sm">{err.corrected}</span>
                                                    <span className="ml-auto text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                                                        {err.error_type}
                                                    </span>
                                                </div>
                                                <p className="text-gray-400 text-xs leading-relaxed">{err.explanation}</p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {/* Suggestions */}
                        {analysis.suggestions.length > 0 && (
                            <div className="rounded-[2rem] bg-white/[0.015] border border-white/[0.05] p-2">
                                <div className="rounded-[calc(2rem-0.5rem)] bg-[#0a0a0a] border border-white/[0.02] p-6">
                                    <div className="flex items-center gap-2 mb-5">
                                        <Lightbulb size={16} className="text-amber-400" weight="fill" />
                                        <h2 className="text-sm font-bold text-white">Gợi ý cải thiện</h2>
                                    </div>
                                    <ul className="space-y-3">
                                        {analysis.suggestions.map((s: any, idx: number) => (
                                            <li key={idx} className="flex gap-3 text-sm text-gray-400">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60 flex-shrink-0 mt-2" />
                                                <span>
                                                    <strong className="text-gray-300 capitalize">{s.type}:</strong> {s.text}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default SpeakingAnalysisPage;
