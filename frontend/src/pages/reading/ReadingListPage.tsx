import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import httpClient from '../../services/httpClient';
import { BookOpen, CircleNotch, ArrowRight } from '@phosphor-icons/react';

const ReadingListPage: React.FC = () => {
    const [exercises, setExercises] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        httpClient.get('/exercises?skillType=reading&size=100')
            .then(res => setExercises(res.data.data.data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <CircleNotch size={32} className="text-emerald-400 animate-spin" />
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto px-6 py-12">
            <div className="mb-10">
                <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
                    <BookOpen className="text-emerald-400" />
                    Luyện Đọc (Reading)
                </h1>
                <p className="text-gray-400 mt-2">Chọn một bài tập để bắt đầu luyện kỹ năng đọc hiểu.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exercises.map(ex => (
                    <Link key={ex.id} to={`/reading/${ex.id}`} className="group relative bg-[#111] border border-white/10 rounded-2xl p-6 hover:bg-[#151515] hover:border-emerald-500/30 transition-all flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md">
                                {ex.level || 'B1'}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-gray-500">{ex.language === 'en' ? 'Tiếng Anh' : 'Tiếng Trung'}</span>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors line-clamp-2">
                            {ex.title}
                        </h3>
                        <div className="mt-auto pt-6 flex items-center justify-between">
                            <span className="text-xs text-gray-500 font-medium">Bấm để bắt đầu</span>
                            <ArrowRight className="text-gray-600 group-hover:text-emerald-400 transition-colors" />
                        </div>
                    </Link>
                ))}
                {exercises.length === 0 && (
                    <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-3xl">
                        <BookOpen size={48} className="mx-auto text-gray-600 mb-4" />
                        <h3 className="text-lg font-bold text-white mb-1">Chưa có bài tập nào</h3>
                        <p className="text-sm text-gray-500">Hãy vào trang Quản trị để tạo thêm bài tập Reading.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReadingListPage;
