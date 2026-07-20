import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { speakingService, RecordingResponse } from '../../services/speakingService';
import {
    ArrowLeft, CheckCircle, WarningCircle, Microphone,
    Spinner, CaretDown, Lightbulb
} from '@phosphor-icons/react';

const ScoreRing: React.FC<{ score: number }> = ({ score }) => {
    // Score is out of 9.0
    const clampedScore = Math.max(0, Math.min(9, score));
    const percentage = (clampedScore / 9) * 100;
    const circumference = 2 * Math.PI * 34; // r=34
    const dashOffset = circumference - (percentage / 100) * circumference;

    const color = clampedScore >= 7.0
        ? '#10b981'   // green
        : clampedScore >= 5.5
        ? '#f59e0b'   // yellow
        : '#ef4444';  // red

    return (
        <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="34" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                <circle
                    cx="50" cy="50" r="34" fill="none"
                    stroke={color}
                    strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-800">{score.toFixed(1)}</span>
            </div>
        </div>
    );
};

const SpeakingAnalysisPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [recording, setRecording] = useState<RecordingResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showPrompt, setShowPrompt] = useState(true);

    useEffect(() => {
        if (!id) return;

        let cancelled = false;
        let pollTimer: ReturnType<typeof setTimeout>;

        const fetchRecording = async () => {
            try {
                const data = await speakingService.getRecording(id);
                if (cancelled) return;

                setRecording(data);

                if (data.analysisStatus === 'completed' || data.analysisStatus === 'failed') {
                    setLoading(false);
                } else {
                    pollTimer = setTimeout(fetchRecording, 2000);
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

    if (loading || (recording && recording.analysisStatus !== 'completed' && recording.analysisStatus !== 'failed')) {
        return (
            <div className="min-h-screen bg-[#fafaf9] flex flex-col items-center justify-center gap-6">
                <Spinner size={48} className="text-[#4c7c25] animate-spin" />
                <h2 className="text-xl font-bold text-gray-800">Đang phân tích bài nói...</h2>
                <p className="text-gray-500 text-sm">AI đang chấm điểm chi tiết theo tiêu chí IELTS. Vui lòng đợi.</p>
            </div>
        );
    }

    if (error || !recording) {
        return (
            <div className="min-h-screen bg-[#fafaf9] flex flex-col items-center justify-center">
                <div className="text-red-500">{error || 'Không tìm thấy bản ghi.'}</div>
                <Link to="/speaking" className="mt-4 text-blue-500 hover:underline">Quay lại</Link>
            </div>
        );
    }

    const { analysis } = recording;

    return (
        <div className="min-h-screen bg-[#fcfcfc] text-gray-800 font-sans">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/speaking')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#4c7c25] text-white flex items-center justify-center">
                            <Microphone size={20} weight="fill" />
                        </div>
                        <div>
                            <h1 className="font-bold text-base tracking-wide text-gray-900 uppercase">IELTS MOCK INTERVIEW</h1>
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#4c7c25]">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#4c7c25]" />
                                GIÁM KHẢO IELTS (BAND 9.0) ONLINE
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-5 py-2 text-sm font-semibold border border-gray-200 rounded-full hover:bg-gray-50 transition-colors">
                        Giọng giám khảo: British (Anh-Anh) <CaretDown className="inline ml-1" />
                    </button>
                    <button onClick={() => navigate('/speaking')} className="px-5 py-2 text-sm font-semibold text-red-500 border border-red-200 rounded-full hover:bg-red-50 transition-colors">
                        Kết thúc
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-12 relative">
                {/* Background pattern */}
                <div className="absolute inset-0 pointer-events-none opacity-5" style={{ backgroundImage: 'radial-gradient(#4c7c25 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                
                <div className="relative z-10 flex flex-col gap-10">
                    
                    {/* Prompt Box */}
                    {recording.promptText && (
                        <div className="w-full max-w-2xl mx-auto">
                            <div 
                                className="bg-[#fcf8e3] border-2 border-black rounded-[20px] p-4 cursor-pointer shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all flex justify-between items-center"
                                onClick={() => setShowPrompt(!showPrompt)}
                            >
                                <div className="flex items-center gap-2 font-bold text-gray-800">
                                    <Lightbulb weight="fill" className="text-yellow-500" />
                                    Gợi ý tham khảo
                                </div>
                                <CaretDown className={`transition-transform ${showPrompt ? 'rotate-180' : ''}`} />
                            </div>
                            {showPrompt && (
                                <div className="mt-4 p-5 bg-white border border-gray-200 rounded-2xl shadow-sm text-gray-700 leading-relaxed">
                                    {recording.promptText}
                                </div>
                            )}
                        </div>
                    )}

                    {/* User Speech Bubble */}
                    <div className="flex justify-end w-full max-w-3xl mx-auto">
                        <div className="bg-[#4c7c25] text-white p-5 rounded-3xl rounded-tr-sm shadow-md max-w-lg">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-green-200 mb-2 opacity-80">Bài nói của bạn</div>
                            <p className="text-lg font-medium leading-relaxed">
                                {recording.transcriptText || "Không có dữ liệu văn bản."}
                            </p>
                        </div>
                    </div>

                    {/* Record Again Button */}
                    <div className="flex flex-col items-center justify-center my-8">
                        <button 
                            onClick={() => navigate('/speaking/record')}
                            className="w-16 h-16 bg-[#fbbf24] hover:bg-[#f59e0b] text-black rounded-full flex items-center justify-center shadow-lg transform transition-transform hover:scale-105 mb-3"
                        >
                            <Microphone size={28} weight="fill" />
                        </button>
                        <span className="font-bold text-gray-800 text-sm tracking-widest uppercase">GHI ÂM LẠI</span>
                        <span className="text-xs text-gray-500 mt-1">Hệ thống sẽ tự động chấm điểm lại</span>
                    </div>

                    {/* Score Card */}
                    {analysis && (
                        <div className="w-full max-w-3xl mx-auto bg-[#f0fdf4] border-2 border-black rounded-2xl p-6 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
                            <div className="flex flex-col md:flex-row gap-8 items-center">
                                {/* Left: Circle and Badges */}
                                <div className="flex flex-col items-center flex-shrink-0">
                                    <ScoreRing score={analysis.ieltsOverall || analysis.pronunciationScore / 10} />
                                    <div className="flex gap-2 mt-4">
                                        <div className="px-2 py-1 text-xs font-bold border border-green-500 text-green-700 rounded bg-white">FC {analysis.ieltsFluency || '-'}</div>
                                        <div className="px-2 py-1 text-xs font-bold border border-blue-500 text-blue-700 rounded bg-white">LR {analysis.ieltsLexical || '-'}</div>
                                        <div className="px-2 py-1 text-xs font-bold border border-purple-500 text-purple-700 rounded bg-white">GRA {analysis.ieltsGrammar || '-'}</div>
                                        <div className="px-2 py-1 text-xs font-bold border border-red-400 text-red-600 rounded bg-white">P {analysis.ieltsPronunciation || '-'}</div>
                                    </div>
                                </div>

                                {/* Right: Feedback */}
                                <div className="flex-1 space-y-4 w-full">
                                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
                                        <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" weight="fill" />
                                        <p className="text-green-800 font-medium text-sm">
                                            {analysis.detailedFeedback || 'Bài nói của bạn khá tốt và đáp ứng được các yêu cầu cơ bản.'}
                                        </p>
                                    </div>
                                    
                                    {/* Additional detailed corrections if any */}
                                    {analysis.grammarErrors && analysis.grammarErrors.length > 0 && (
                                        <div className="p-4 bg-white border border-gray-200 rounded-xl">
                                            <p className="text-sm text-gray-700">
                                                Câu trả lời của bạn rõ ràng, tuy nhiên có một vài lỗi cần lưu ý:
                                            </p>
                                            <ul className="mt-2 space-y-2">
                                                {analysis.grammarErrors.map((err, idx) => (
                                                    <li key={idx} className="text-sm">
                                                        <span className="line-through text-red-500 mr-2">{err.original}</span>
                                                        <span className="text-green-600 font-semibold">→ {err.corrected}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-12 text-right">
                    <button className="px-6 py-3 bg-[#4c7c25] hover:bg-[#3f661f] text-white font-bold rounded-xl shadow-md transition-colors">
                        Câu tiếp →
                    </button>
                </div>
            </main>
        </div>
    );
};

export default SpeakingAnalysisPage;
