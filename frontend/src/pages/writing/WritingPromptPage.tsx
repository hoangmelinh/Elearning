import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { writingService } from '../../services/writingService';
import type { WritingPrompt } from '../../services/writingService';
import NotFoundPage from '../errors/NotFoundPage';
import toast from 'react-hot-toast';

const WritingPromptPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [prompt, setPrompt] = useState<WritingPrompt | null>(null);
    const [text, setText] = useState('');
    const [isComposing, setIsComposing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;
        const fetchPrompt = async () => {
            try {
                const data = await writingService.getPrompt(id);
                setPrompt(data);
            } catch (err: any) {
                setError('Failed to load writing prompt.');
            }
        };
        fetchPrompt();
    }, [id]);

    const handleSubmit = async () => {
        if (!prompt || text.trim().length < 20) {
            toast.error('Please write at least 20 characters.');
            return;
        }
        try {
            setSubmitting(true);
            toast.loading('Submitting your essay...', { id: 'submit-essay' });
            const response = await writingService.submitEssay(prompt.id, text);
            toast.success('Essay submitted successfully!', { id: 'submit-essay' });
            navigate(`/writing/feedback/${response.submission_id}`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to submit essay.', { id: 'submit-essay' });
            setSubmitting(false);
        }
    };

    if (error && !prompt) {
        return <NotFoundPage />;
    }

    if (!prompt) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const isChinese = prompt.language === 'zh';
    const fontClass = isChinese ? 'font-noto-sc' : 'font-sans';

    const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;

    return (
        <main className="h-[100dvh] bg-[#050505] text-[#f5f5f5] flex flex-col lg:h-screen overflow-hidden">
            {/* Split Screen Layout */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
                
                {/* Left Side: Prompt Card */}
                <div className="p-6 lg:p-12 border-b lg:border-b-0 lg:border-r border-white/5 overflow-y-auto bg-[#0a0a0a]">
                    <div className="max-w-xl mx-auto lg:ml-auto lg:mr-0 h-full flex flex-col">
                        <div className="mb-8">
                            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-widest uppercase text-sky-400 mb-4 inline-block">
                                Writing Task
                            </span>
                            <h1 className="text-3xl lg:text-4xl font-bold tracking-tighter leading-tight mb-4 text-white">
                                {prompt.title}
                            </h1>
                            <div className="flex gap-2">
                                <span className="text-[10px] font-bold tracking-widest uppercase bg-white/5 px-2 py-1 rounded text-orange-400">
                                    {prompt.language === 'en' ? 'English' : 'Chinese'}
                                </span>
                                <span className="text-[10px] font-bold tracking-widest uppercase bg-white/5 px-2 py-1 rounded text-gray-400">
                                    Level: {prompt.level || 'Any'}
                                </span>
                            </div>
                        </div>

                        <div className="bg-[#111] border border-white/5 rounded-3xl p-8 flex-1">
                            <h3 className="text-xs font-bold tracking-widest text-indigo-400 uppercase mb-6 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                Question Prompt
                            </h3>
                            <p className={`text-lg lg:text-xl text-gray-300 leading-relaxed ${fontClass} whitespace-pre-wrap`}>
                                {prompt.promptText}
                            </p>
                            
                            <div className="mt-12 p-4 rounded-xl border border-sky-500/20 bg-sky-500/5 text-sky-200/70 text-sm flex items-start gap-3">
                                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <p>You should spend about 40 minutes on this task. Write at least 250 words.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Text Editor */}
                <div className="p-6 lg:p-12 bg-[#050505] flex flex-col h-[60vh] lg:h-full relative overflow-hidden">
                    <div className="max-w-xl mx-auto lg:ml-0 lg:mr-auto w-full h-full flex flex-col">
                        
                        {/* Editor Header */}
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Your Response</span>
                            <div className="flex items-center gap-4">
                                <div className="text-sm font-mono flex gap-3">
                                    <span className="text-gray-500">Chars: <span className="text-gray-300">{text.length}</span></span>
                                    <span className="text-gray-500">Words: <span className={wordCount < 250 ? 'text-red-400' : 'text-green-400'}>{wordCount}</span></span>
                                </div>
                            </div>
                        </div>

                        {/* Textarea */}
                        <div className="flex-1 relative group">
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                onCompositionStart={() => setIsComposing(true)}
                                onCompositionEnd={() => setIsComposing(false)}
                                placeholder="Start writing your essay here..."
                                className={`w-full h-full bg-[#0a0a0a] border border-white/5 group-hover:border-white/10 rounded-3xl p-6 lg:p-8 text-lg lg:text-xl text-white placeholder:text-gray-700 focus:outline-none focus:border-indigo-500/50 focus:bg-[#0c0c0c] transition-all resize-none ${fontClass} custom-scrollbar`}
                            />
                        </div>

                        {/* Action Bar */}
                        <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center">
                            <p className="text-xs text-gray-500 max-w-[200px]">
                                Your essay will be evaluated by an AI IELTS Examiner.
                            </p>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || isComposing || text.trim().length === 0}
                                className="bg-white text-black px-8 py-3.5 rounded-xl font-bold text-base hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:shadow-none flex items-center justify-center min-w-[160px]"
                            >
                                {submitting ? (
                                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    "Submit for Grading"
                                )}
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </main>
    );
};

export default WritingPromptPage;
