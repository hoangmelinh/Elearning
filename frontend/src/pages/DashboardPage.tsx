import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { progressService } from '../services/progressService';
import type { LearningProgress, AggregatedHistory } from '../services/progressService';
import { Fire, Cards, CheckCircle, ClockCounterClockwise, ArrowRight, Microphone, BookOpenText, PenNib } from '@phosphor-icons/react';

const DashboardPage: React.FC = () => {
    const [progress, setProgress] = useState<LearningProgress | null>(null);
    const [history, setHistory] = useState<AggregatedHistory | null>(null);
    const [loading, setLoading] = useState(true);

    const bentoRef = useRef<HTMLDivElement>(null);
    const historyRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [progRes, histRes] = await Promise.all([
                    progressService.getProgress(),
                    progressService.getHistory()
                ]);
                setProgress(progRes);
                setHistory(histRes);
            } catch (err) {
                console.error("Failed to load dashboard data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (!loading && bentoRef.current && historyRef.current) {
            // Bento Grid Stagger with elegant curve
            const bentoItems = bentoRef.current.children;
            gsap.fromTo(bentoItems,
                { y: 30, opacity: 0, scale: 0.98 },
                { y: 0, opacity: 1, scale: 1, stagger: 0.08, duration: 0.8, ease: 'power3.out' }
            );

            // History List Stagger (Card Stacking effect)
            const historyItems = historyRef.current.children;
            gsap.fromTo(historyItems,
                { x: 30, opacity: 0 },
                { x: 0, opacity: 1, stagger: 0.06, duration: 0.6, ease: 'power2.out', delay: 0.3 }
            );
        }
    }, [loading]);

    if (loading) {
        return (
            <div className="min-h-screen bg-transparent flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!progress || !history) return <div className="text-white text-center mt-20">Không thể tải dữ liệu tổng quan.</div>;

    return (
        <main className="min-h-[100dvh] bg-transparent text-[#f5f5f5] overflow-x-hidden pt-12 pb-32 relative z-10">
            <div className="max-w-[1400px] mx-auto px-6">
                
                {/* Header: Artistic Asymmetry */}
                <header className="mb-16 flex flex-col items-start relative w-full">
                    <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-semibold bg-white/[0.04] border border-white/[0.05] text-gray-400 mb-4">
                        Học viên trung tâm
                    </div>
                    <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] font-extrabold tracking-tighter leading-[1.1] text-white">
                        Chào mừng trở lại,<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                            Học viên của ELearn.
                        </span>
                    </h1>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    {/* Left: Gapless Bento Grid */}
                    <div className="lg:col-span-7 flex flex-col gap-12">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-semibold bg-white/[0.04] border border-white/[0.05] text-gray-500 mb-6">
                                Báo cáo hoạt động
                            </div>
                            
                            {/* Bento Grid with exact column locking */}
                            <div ref={bentoRef} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            
                                {/* Streak Cell (Tall Double-Bezel Card) */}
                                <div className="sm:row-span-2 rounded-[2rem] bg-white/[0.015] border border-white/[0.05] p-2 transition-premium hover:bg-white/[0.03] hover:border-white/[0.09] hover:shadow-[0_12px_30px_rgba(0,0,0,0.4)] group relative overflow-hidden">
                                    <div className="rounded-[calc(2rem-0.5rem)] bg-gradient-to-b from-[#160d0d] to-[#0a0a0a] border border-red-500/[0.08] p-8 flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/[0.03] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                                        <div className="w-16 h-16 rounded-2xl bg-orange-500/[0.08] border border-orange-500/20 flex items-center justify-center mb-6 group-hover:scale-115 transition-all duration-500">
                                            <Fire size={32} className="text-orange-500" weight="duotone" />
                                        </div>
                                        <div className="text-7xl font-extrabold tracking-tighter text-white mb-2">{progress.streakDays}</div>
                                        <div className="text-[10px] font-bold tracking-[0.15em] text-orange-400 uppercase">Ngày Học Liên Tiếp</div>
                                    </div>
                                </div>

                                {/* Flashcards Cell (Double-Bezel Card) */}
                                <div className="rounded-[2rem] bg-white/[0.015] border border-white/[0.05] p-2 transition-premium hover:bg-white/[0.03] hover:border-white/[0.09] group">
                                    <div className="rounded-[calc(2rem-0.5rem)] bg-[#0a0a0a] border border-white/[0.02] p-8 flex flex-col justify-center h-full">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
                                                <Cards size={18} className="text-indigo-400" />
                                            </div>
                                            <span className="text-[10px] font-bold tracking-[0.15em] text-gray-500 uppercase">Từ vựng đã thuộc</span>
                                        </div>
                                        <div className="text-5xl font-extrabold tracking-tighter text-white">{progress.totalFlashcardsMastered}</div>
                                    </div>
                                </div>

                                {/* Exercises Cell (Double-Bezel Card) */}
                                <div className="rounded-[2rem] bg-white/[0.015] border border-white/[0.05] p-2 transition-premium hover:bg-white/[0.03] hover:border-white/[0.09] group">
                                    <div className="rounded-[calc(2rem-0.5rem)] bg-[#0a0a0a] border border-white/[0.02] p-8 flex flex-col justify-center h-full">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
                                                <CheckCircle size={18} className="text-emerald-400" />
                                            </div>
                                            <span className="text-[10px] font-bold tracking-[0.15em] text-gray-500 uppercase">Bài tập hoàn thành</span>
                                        </div>
                                        <div className="text-5xl font-extrabold tracking-tighter text-white">{progress.totalExercisesCompleted}</div>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-semibold bg-white/[0.04] border border-white/[0.05] text-gray-500 mb-6">
                                Phân hệ đa nhiệm
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                
                                <Link to="/vocabulary" className="group rounded-2xl bg-white/[0.01] border border-white/[0.04] p-1.5 transition-premium hover:bg-white/[0.02] hover:border-white/[0.08] sm:col-span-2">
                                    <div className="rounded-xl bg-[#090909] border border-white/[0.01] p-5 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-purple-500/[0.08] border border-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center"><Cards size={20} weight="duotone" /></div>
                                            <div className="font-bold tracking-tight text-white text-sm">Học Từ Vựng (Flashcards)</div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white/[0.03] hover:bg-white/[0.08] flex items-center justify-center text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-300">
                                            <ArrowRight size={14} />
                                        </div>
                                    </div>
                                </Link>

                                <Link to="/speaking" className="group rounded-2xl bg-white/[0.01] border border-white/[0.04] p-1.5 transition-premium hover:bg-white/[0.02] hover:border-white/[0.08]">
                                    <div className="rounded-xl bg-[#090909] border border-white/[0.01] p-5 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-indigo-500/[0.08] border border-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center"><Microphone size={20} weight="duotone" /></div>
                                            <div className="font-bold tracking-tight text-white text-sm">Luyện Nói AI</div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white/[0.03] hover:bg-white/[0.08] flex items-center justify-center text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-300">
                                            <ArrowRight size={14} />
                                        </div>
                                    </div>
                                </Link>
                                
                                <Link to="/reading" className="group rounded-2xl bg-white/[0.01] border border-white/[0.04] p-1.5 transition-premium hover:bg-white/[0.02] hover:border-white/[0.08]">
                                    <div className="rounded-xl bg-[#090909] border border-white/[0.01] p-5 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-emerald-500/[0.08] border border-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center"><BookOpenText size={20} weight="duotone" /></div>
                                            <div className="font-bold tracking-tight text-white text-sm">Luyện Đọc AI</div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white/[0.03] hover:bg-white/[0.08] flex items-center justify-center text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-300">
                                            <ArrowRight size={14} />
                                        </div>
                                    </div>
                                </Link>

                                <Link to="/writing/12345678-1234-1234-1234-123456789012" className="group rounded-2xl bg-white/[0.01] border border-white/[0.04] p-1.5 transition-premium hover:bg-white/[0.02] hover:border-white/[0.08] sm:col-span-2">
                                    <div className="rounded-xl bg-[#090909] border border-white/[0.01] p-5 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-orange-500/[0.08] border border-orange-500/10 text-orange-400 rounded-xl flex items-center justify-center"><PenNib size={20} weight="duotone" /></div>
                                            <div className="font-bold tracking-tight text-white text-sm">Luyện Viết Chấm Điểm AI</div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white/[0.03] hover:bg-white/[0.08] flex items-center justify-center text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-300">
                                            <ArrowRight size={14} />
                                        </div>
                                    </div>
                                </Link>

                            </div>
                        </div>
                    </div>

                    {/* Right: History List (Stacking cards feel) */}
                    <div className="lg:col-span-5">
                        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-semibold bg-white/[0.04] border border-white/[0.05] text-gray-500 mb-6">
                            Lịch sử học tập
                        </div>
                        
                        <div ref={historyRef} className="space-y-4">
                            {history.exercises.length === 0 && history.writings.length === 0 ? (
                                <div className="p-16 border border-dashed border-white/10 rounded-[2rem] text-center text-gray-500 text-xs">
                                    Chưa ghi nhận hoạt động nào. Hãy bắt đầu học tập ngay!
                                </div>
                            ) : null}

                            {/* Exercises History */}
                            {history.exercises.slice(0, 4).map((item, i) => (
                                <Link
                                    to={`/${item.type}/${item.id}`}
                                    key={`ex-${item.id}-${i}`}
                                    className="group block rounded-2xl bg-white/[0.01] border border-white/[0.04] p-1.5 transition-premium hover:bg-white/[0.03] hover:border-white/[0.08]"
                                >
                                    <div className="rounded-xl bg-[#090909] border border-white/[0.01] p-6 flex justify-between items-center">
                                        <div>
                                            <span className="inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-white/[0.04] border border-white/[0.05] text-gray-400 mb-2">
                                                {item.type}
                                            </span>
                                            <h4 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors leading-tight">{item.title}</h4>
                                            <div className="text-[11px] text-gray-500 mt-1">
                                                {new Date(item.date).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 flex-shrink-0">
                                            <div className="text-right">
                                                <div className="text-xl font-extrabold text-white">{item.score}</div>
                                                <div className="text-[9px] text-gray-500 font-medium uppercase tracking-widest">điểm</div>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-white/[0.02] flex items-center justify-center text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition-all">
                                                <ArrowRight size={12} />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}

                            {/* Writings History */}
                            {history.writings.slice(0, 3).map((item, i) => (
                                <Link
                                    to={`/writing/feedback/${item.id}`}
                                    key={`wr-${item.id}-${i}`}
                                    className="group block rounded-2xl bg-white/[0.01] border border-white/[0.04] p-1.5 transition-premium hover:bg-white/[0.03] hover:border-indigo-500/20"
                                >
                                    <div className="rounded-xl bg-[#090909] border border-white/[0.01] p-6 flex justify-between items-center">
                                        <div>
                                            <span className="inline-block rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/10 text-indigo-400 mb-2">
                                                Luyện Viết
                                            </span>
                                            <h4 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors leading-tight">{item.title}</h4>
                                            <div className="text-[11px] text-gray-500 mt-1">
                                                Trạng thái: <span className={item.status === 'graded' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>{item.status === 'graded' ? 'Đã chấm điểm' : 'Đang xử lý'}</span>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white/[0.02] flex items-center justify-center text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition-all">
                                            <ArrowRight size={12} />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </main>
    );
};

export default DashboardPage;
