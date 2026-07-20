import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { speakingService, RecordingResponse } from '../../services/speakingService';
import { Microphone, Plus, ClockCounterClockwise, ArrowRight } from '@phosphor-icons/react';

const SpeakingHistoryPage: React.FC = () => {
    const [recordings, setRecordings] = useState<RecordingResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await speakingService.getUserRecordings(0, 50);
                setRecordings(res.content);
            } catch (error) {
                console.error("Failed to fetch speaking history", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    return (
        <div className="min-h-screen bg-transparent text-[#f5f5f5] pb-24 relative z-10">
            <div className="max-w-4xl mx-auto px-6 pt-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-semibold bg-white/[0.04] border border-white/[0.05] text-gray-400 mb-3">
                            <Microphone size={14} />
                            IELTS Speaking
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Lịch sử Luyện Nói</h1>
                        <p className="text-gray-500 text-sm">Xem lại các bài Mock Interview và theo dõi sự tiến bộ của bạn.</p>
                    </div>
                    
                    <button 
                        onClick={() => navigate('/speaking/record')}
                        className="group flex items-center gap-3 bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition-all duration-300"
                    >
                        <Plus size={18} weight="bold" />
                        <span>Bắt đầu bài Test mới</span>
                    </button>
                </div>

                {/* History List */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : recordings.length === 0 ? (
                    <div className="text-center py-20 bg-white/[0.02] border border-white/[0.05] rounded-3xl">
                        <Microphone size={48} className="text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">Chưa có bản ghi nào</h3>
                        <p className="text-gray-500 text-sm mb-6">Bạn chưa thực hiện bài luyện nói nào. Hãy bắt đầu ngay!</p>
                        <button 
                            onClick={() => navigate('/speaking/record')}
                            className="inline-flex items-center gap-2 bg-white/[0.05] hover:bg-white/[0.1] text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-colors"
                        >
                            Thử ngay
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {recordings.map((rec) => (
                            <Link 
                                to={`/speaking/analysis/${rec.id}`} 
                                key={rec.id}
                                className="group bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.1] rounded-2xl p-5 flex items-center justify-between transition-all"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-[#4c7c25]/20 text-[#4c7c25] flex items-center justify-center flex-shrink-0 mt-1">
                                        {rec.analysis?.ieltsOverall ? (
                                            <span className="font-bold text-lg">{rec.analysis.ieltsOverall.toFixed(1)}</span>
                                        ) : (
                                            <Microphone size={24} />
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="text-base font-bold text-white mb-1 line-clamp-1">
                                            {rec.promptText ? rec.promptText : "Luyện nói tự do"}
                                        </h4>
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                            <span className="flex items-center gap-1"><ClockCounterClockwise size={12}/> {new Date(rec.createdAt).toLocaleDateString('vi-VN')}</span>
                                            <span className="px-2 py-0.5 rounded-full bg-white/[0.05] uppercase text-[9px] font-bold tracking-wider">
                                                {rec.analysisStatus === 'completed' ? 'Đã chấm điểm' : 'Đang xử lý'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all">
                                    <ArrowRight size={14} />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SpeakingHistoryPage;
