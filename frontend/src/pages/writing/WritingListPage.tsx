import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PenNib, Clock } from '@phosphor-icons/react';
import { writingService } from '../../services/writingService';
import type { WritingPrompt } from '../../services/writingService';

const WritingListPage: React.FC = () => {
    const [prompts, setPrompts] = useState<WritingPrompt[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPrompts = async () => {
            try {
                const data = await writingService.getPrompts(0, 100);
                setPrompts(data.content || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchPrompts();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <main className="min-h-[100dvh] bg-[#050505] text-[#f5f5f5] pt-12 pb-32">
            <div className="max-w-6xl mx-auto px-6">
                <header className="mb-12 border-b border-white/5 pb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-widest uppercase text-orange-400">
                            Writing Hub
                        </span>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-bold tracking-tighter text-white mb-4">
                        Luyện Viết (Writing)
                    </h1>
                    <p className="text-lg text-gray-400 max-w-2xl">
                        Cải thiện kỹ năng viết của bạn thông qua các bài tập chuẩn IELTS và HSK. Bài làm của bạn sẽ được AI chấm điểm chi tiết theo các tiêu chí chính thức.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {prompts.map(prompt => (
                        <Link 
                            key={prompt.id} 
                            to={`/writing/${prompt.id}`}
                            className="group bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 hover:bg-[#111] hover:border-white/20 transition-all duration-300 flex flex-col"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <PenNib size={24} weight="duotone" />
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className="text-[10px] font-bold tracking-widest uppercase bg-white/5 border border-white/5 px-3 py-1 rounded-full text-sky-400">
                                        {prompt.language === 'en' ? 'English' : 'Chinese'}
                                    </span>
                                    <span className="text-[10px] font-bold tracking-widest uppercase text-gray-500 flex items-center gap-1">
                                        Level: {prompt.level}
                                    </span>
                                </div>
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-4 leading-tight group-hover:text-orange-400 transition-colors">
                                {prompt.title}
                            </h3>
                            
                            <p className="text-gray-400 text-sm line-clamp-3 mb-8 flex-1">
                                {prompt.promptText}
                            </p>

                            <div className="flex items-center gap-2 text-gray-500 text-sm font-medium pt-6 border-t border-white/5">
                                <Clock size={16} />
                                <span>Khuyên dùng: 40 phút</span>
                            </div>
                        </Link>
                    ))}

                    {prompts.length === 0 && (
                        <div className="col-span-full py-20 text-center border border-white/5 rounded-3xl bg-[#0a0a0a]">
                            <p className="text-gray-500 text-lg">Hiện tại chưa có đề bài nào.</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};

export default WritingListPage;
