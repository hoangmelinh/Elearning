import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import httpClient from '../../services/httpClient';
import { 
    BookOpenText, 
    CircleNotch, 
    CaretDown, 
    CaretUp, 
    Clock, 
    Headphones, 
    ArrowRight,
    MagnifyingGlass,
    CheckCircle,
    SlidersHorizontal
} from '@phosphor-icons/react';

interface Exercise {
    id: string;
    title: string;
    level: string;
    language: string;
    skillType?: 'reading' | 'listening';
    passageText?: string;
    createdAt?: string;
}

const ReadingListPage: React.FC = () => {
    const navigate = useNavigate();
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Filters state: Category (IELTS, TOEIC, HSK), Mode (Reading/Listening), Level
    const [selectedCategory, setSelectedCategory] = useState<'all' | 'IELTS' | 'TOEIC' | 'HSK'>('all');
    const [selectedMode, setSelectedMode] = useState<'all' | 'reading' | 'listening'>('all');
    const [selectedLevel, setSelectedLevel] = useState<string>('all');

    useEffect(() => {
        // Fetch real exercises from backend API
        Promise.all([
            httpClient.get('/exercises?skillType=reading&size=100').catch(() => ({ data: { data: { data: [] } } })),
            httpClient.get('/exercises?skillType=listening&size=100').catch(() => ({ data: { data: { data: [] } } }))
        ]).then(([readingRes, listeningRes]) => {
            const rList = readingRes?.data?.data?.data || [];
            const lList = listeningRes?.data?.data?.data || [];
            
            const taggedReading = rList.map((e: any) => ({ ...e, skillType: 'reading' }));
            const taggedListening = lList.map((e: any) => ({ ...e, skillType: 'listening' }));
            
            const combined = [...taggedReading, ...taggedListening];
            setExercises(combined);
        }).finally(() => setLoading(false));
    }, []);

    // Filter exercises dynamically based on Category, Mode, Level & Search Query
    const filteredExercises = useMemo(() => {
        return exercises.filter(ex => {
            const titleUpper = (ex.title || '').toUpperCase();
            const levelUpper = (ex.level || '').toUpperCase();
            const lang = (ex.language || '').toLowerCase();

            // Search query filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                if (!ex.title.toLowerCase().includes(q) && !ex.level?.toLowerCase().includes(q)) return false;
            }

            // 1. Certificate Category Filter (IELTS, TOEIC, HSK)
            if (selectedCategory === 'IELTS') {
                if (!titleUpper.includes('IELTS') && !levelUpper.includes('BAND') && lang !== 'en') return false;
            } else if (selectedCategory === 'TOEIC') {
                if (!titleUpper.includes('TOEIC') && !titleUpper.includes('ETS') && !levelUpper.includes('TARGET')) return false;
            } else if (selectedCategory === 'HSK') {
                if (!titleUpper.includes('HSK') && !levelUpper.includes('HSK') && lang !== 'zh') return false;
            }

            // 2. Mode Filter (Reading vs Listening)
            if (selectedMode === 'reading' && ex.skillType !== 'reading') return false;
            if (selectedMode === 'listening' && ex.skillType !== 'listening') return false;
            
            // 3. Level Filter
            if (selectedLevel !== 'all') {
                if (!levelUpper.includes(selectedLevel.toUpperCase()) && !titleUpper.includes(selectedLevel.toUpperCase())) return false;
            }

            return true;
        });
    }, [exercises, searchQuery, selectedCategory, selectedMode, selectedLevel]);

    const handleSelectTest = (ex: Exercise) => {
        if (ex.skillType === 'listening') {
            navigate(`/listening/${ex.id}`);
        } else {
            navigate(`/reading/${ex.id}`);
        }
    };

    if (loading) return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <CircleNotch size={32} className="text-emerald-400 animate-spin" />
                <span className="text-xs font-semibold text-gray-400 tracking-wider">ĐANG TẢI DANH SÁCH ĐỀ THI...</span>
            </div>
        </div>
    );

    return (
        <div className="min-h-[100dvh] bg-transparent text-[#f5f5f5] pt-6 pb-28 px-4 md:px-8 max-w-[1400px] mx-auto">
            
            {/* Header Hero Section */}
            <div className="bg-[#0b0c10] border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden mb-8">
                <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-xs">
                        Hệ thống Đề thi
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                        Tổng cộng {exercises.length} đề thi sẵn có
                    </span>
                </div>

                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-snug mb-3">
                    Thư viện Đề thi – IELTS, TOEIC & HSK
                </h1>

                <p className="text-sm text-gray-400 leading-relaxed max-w-3xl mb-6">
                    Chọn chứng chỉ mục tiêu và bấm vào bài thi bạn muốn làm. Đề thi được thiết kế chuẩn cấu trúc thực tế với đếm thời gian và chấm điểm tự động.
                </p>

                {/* Search Bar & Filter Tabs */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                    
                    {/* Search Input */}
                    <div className="relative max-w-md">
                        <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm tên bài thi (VD: The kākāpō, ETS 2026, HSK 4)..."
                            className="w-full bg-[#121318] border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                    </div>

                    {/* Primary Certificate Filters */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs md:text-sm">
                        <span className="font-bold text-gray-400 mr-2 min-w-[70px]">Chứng chỉ:</span>
                        <button 
                            onClick={() => setSelectedCategory('all')}
                            className={`px-4 py-2 rounded-xl font-bold transition-all ${selectedCategory === 'all' ? 'bg-emerald-500 text-black shadow-md' : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'}`}
                        >
                            Tất cả ({exercises.length})
                        </button>
                        <button 
                            onClick={() => setSelectedCategory('IELTS')}
                            className={`px-4 py-2 rounded-xl font-bold transition-all ${selectedCategory === 'IELTS' ? 'bg-emerald-500 text-black shadow-md' : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'}`}
                        >
                            IELTS Academic & General
                        </button>
                        <button 
                            onClick={() => setSelectedCategory('TOEIC')}
                            className={`px-4 py-2 rounded-xl font-bold transition-all ${selectedCategory === 'TOEIC' ? 'bg-emerald-500 text-black shadow-md' : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'}`}
                        >
                            TOEIC Standard (ETS)
                        </button>
                        <button 
                            onClick={() => setSelectedCategory('HSK')}
                            className={`px-4 py-2 rounded-xl font-bold transition-all ${selectedCategory === 'HSK' ? 'bg-emerald-500 text-black shadow-md' : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'}`}
                        >
                            HSK Tiếng Trung
                        </button>
                    </div>

                    {/* Skill Mode Filters */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        <span className="font-bold text-gray-400 mr-2 min-w-[70px]">Kỹ năng:</span>
                        <button 
                            onClick={() => setSelectedMode('all')}
                            className={`px-3.5 py-1.5 rounded-lg border transition-all ${selectedMode === 'all' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'}`}
                        >
                            Tất cả
                        </button>
                        <button 
                            onClick={() => setSelectedMode('reading')}
                            className={`px-3.5 py-1.5 rounded-lg border transition-all ${selectedMode === 'reading' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'}`}
                        >
                            Reading (Đọc hiểu)
                        </button>
                        <button 
                            onClick={() => setSelectedMode('listening')}
                            className={`px-3.5 py-1.5 rounded-lg border transition-all ${selectedMode === 'listening' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'}`}
                        >
                            Listening (Nghe hiểu)
                        </button>
                    </div>

                </div>
            </div>

            {/* Section Header */}
            <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <BookOpenText size={22} className="text-emerald-400" />
                    Danh sách Bài thi ({filteredExercises.length} bài)
                </h2>
                <span className="text-xs text-gray-400">
                    Bấm trực tiếp vào ô bài thi để bắt đầu làm bài
                </span>
            </div>

            {/* Dynamic Selectable Exam Cards Grid */}
            {filteredExercises.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredExercises.map((ex) => {
                        const isZh = ex.language === 'zh';
                        const isIelts = ex.title.toUpperCase().includes('IELTS') || ex.level?.toUpperCase().includes('BAND');
                        const isToeic = ex.title.toUpperCase().includes('TOEIC') || ex.title.toUpperCase().includes('ETS');

                        const categoryLabel = isZh ? 'HSK' : isIelts ? 'IELTS' : isToeic ? 'TOEIC' : 'Luyện Đề';
                        const skillLabel = ex.skillType === 'listening' ? 'Listening' : 'Reading';

                        return (
                            <div
                                key={ex.id}
                                onClick={() => handleSelectTest(ex)}
                                className="bg-[#0b0c10] border border-white/10 rounded-2xl p-6 hover:border-emerald-500/50 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                            >
                                <div className="space-y-3">
                                    {/* Top Metadata Badges */}
                                    <div className="flex items-center justify-between">
                                        <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-xs">
                                            {categoryLabel} • {ex.level || 'B1'}
                                        </span>
                                        <span className="text-xs text-gray-400 font-medium">
                                            {skillLabel}
                                        </span>
                                    </div>

                                    {/* Test Title */}
                                    <h3 className="font-bold text-white text-base leading-snug group-hover:text-emerald-300 transition-colors line-clamp-2">
                                        {ex.title}
                                    </h3>
                                </div>

                                {/* Bottom Action Selection Button */}
                                <div className="pt-6 mt-4 border-t border-white/5 flex items-center justify-between text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
                                    <span>Chọn bài thi này</span>
                                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Empty state */
                <div className="py-16 text-center border border-dashed border-white/10 rounded-3xl bg-[#0b0c10]">
                    <BookOpenText size={44} className="mx-auto text-gray-600 mb-3" />
                    <h3 className="text-base font-bold text-white mb-1">Chưa có bài thi nào phù hợp với tìm kiếm</h3>
                    <p className="text-xs text-gray-400 mb-6">Hãy thử xóa từ khóa tìm kiếm hoặc chọn lại chứng chỉ.</p>
                    <button 
                        onClick={() => { setSelectedCategory('all'); setSelectedMode('all'); setSearchQuery(''); }} 
                        className="bg-emerald-500 text-black font-bold px-5 py-2 rounded-xl text-xs inline-block"
                    >
                        Xóa bộ lọc
                    </button>
                </div>
            )}

        </div>
    );
};

export default ReadingListPage;
