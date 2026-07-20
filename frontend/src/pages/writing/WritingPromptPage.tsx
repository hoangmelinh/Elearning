import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { writingService } from '../../services/writingService';
import type { WritingPrompt } from '../../services/writingService';
import NotFoundPage from '../errors/NotFoundPage';
import toast from 'react-hot-toast';

const FONTS = [
    { label: 'Inter', value: 'font-sans' },
    { label: 'Playfair', value: 'font-serif' },
    { label: 'Merriw.', value: 'font-[Merriweather,serif]' },
    { label: 'Lora', value: 'font-[Lora,serif]' },
    { label: 'Mono', value: 'font-mono' }
];

const WritingPromptPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const [prompt, setPrompt] = useState<WritingPrompt | null>(null);
    const [text, setText] = useState('');
    const [isComposing, setIsComposing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    
    // UI State
    const [selectedFont, setSelectedFont] = useState(FONTS[0].value);
    const [fontSize, setFontSize] = useState(16);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);

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

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            editorRef.current?.requestFullscreen().catch(err => {
                toast.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    if (error && !prompt) return <NotFoundPage />;

    if (!prompt) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const isTask1 = prompt.taskType === 'IELTS_TASK_1';
    const minWords = isTask1 ? 150 : 250;
    const suggestedTime = isTask1 ? '20 phút' : '40 phút';
    const taskLabel = isTask1 ? 'Task 1 - Academic Writing' : 'Task 2 - Academic Writing';
    
    const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    const wordCountColor = wordCount < minWords ? 'text-red-500' : 'text-green-600';

    return (
        <main className="h-screen bg-[#0f172a] flex flex-col font-sans relative overflow-hidden">
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:40px_40px]"></div>
            
            {/* Top Navigation */}
            <header className="relative z-10 px-8 py-6 flex justify-between items-center text-white">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold italic tracking-tight">chấm bài</h1>
                    <span className="text-white/50 text-xl">•</span>
                    <span className="text-xs font-bold tracking-[0.2em] uppercase mt-1">The IELTS Dictionary</span>
                </div>
                <div className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold shadow-sm">
                    {isTask1 ? 'Task 1' : 'Task 2'}
                </div>
            </header>

            {/* Split Screen Content */}
            <div className="relative z-10 flex-1 p-6 lg:p-8 pt-0 flex gap-6 min-h-0 flex-col lg:flex-row">
                
                {/* Left Card: Prompt */}
                <div className="bg-white rounded-3xl w-full lg:w-5/12 flex flex-col shadow-2xl overflow-hidden h-full">
                    <div className="p-8 flex-1 overflow-y-auto custom-scrollbar min-h-0">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Đề bài</h2>
                            <span className="text-gray-500 text-sm">{taskLabel}</span>
                        </div>
                        
                        <div className="mb-4 text-xs font-bold tracking-widest text-gray-400 uppercase">
                            Prompt
                        </div>
                        
                        <p className="text-gray-800 text-lg leading-relaxed mb-8 whitespace-pre-wrap font-serif">
                            {prompt.promptText}
                        </p>
                        
                        {prompt.imageUrl && (
                            <div className="mb-8 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 p-4">
                                <img src={prompt.imageUrl} alt="Writing Prompt Chart" className="w-full h-auto object-contain max-h-[300px]" />
                            </div>
                        )}
                    </div>
                    
                    {/* Prompt Footer */}
                    <div className="bg-gray-50 p-6 border-t border-gray-100 flex justify-between items-center text-sm font-medium text-gray-600">
                        <span>{isTask1 ? 'Task 1 - Academic' : 'Task 2 - Academic'}</span>
                        <span>Tối thiểu {minWords} từ</span>
                        <span>Gợi ý {suggestedTime}</span>
                    </div>
                </div>

                {/* Right Card: Editor */}
                <div 
                    ref={editorRef}
                    className={`bg-white rounded-3xl w-full lg:w-7/12 flex flex-col shadow-2xl overflow-hidden transition-all duration-300 ${isFullscreen ? 'fixed inset-4 z-50 lg:w-auto' : 'h-full'}`}
                >
                    {/* Editor Header */}
                    <div className="p-6 pb-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4 bg-white">
                        <h2 className="text-2xl font-bold text-gray-900">Bài làm</h2>
                        
                        <div className="flex items-center gap-4">
                            <span className={`font-bold text-sm ${wordCountColor}`}>
                                {wordCount} / {minWords} từ
                            </span>
                            <button 
                                onClick={toggleFullscreen}
                                className="flex items-center gap-2 bg-[#2a2a2a] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-black transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                                {isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
                            </button>
                        </div>
                    </div>
                    
                    {/* Toolbar */}
                    <div className="px-6 py-3 border-b border-gray-50 bg-gray-50/50 flex flex-wrap items-center gap-6 text-sm text-gray-500 font-medium">
                        <div className="flex items-center gap-3">
                            <span className="uppercase tracking-widest text-[10px] font-bold text-gray-400">Font</span>
                            <div className="flex items-center gap-3">
                                {FONTS.map(f => (
                                    <button 
                                        key={f.value}
                                        onClick={() => setSelectedFont(f.value)}
                                        className={`transition-colors ${selectedFont === f.value ? 'bg-[#2a2a2a] text-white px-3 py-1 rounded-md' : 'hover:text-black'}`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="w-px h-4 bg-gray-300"></div>
                        
                        <div className="flex items-center gap-3">
                            <span className="uppercase tracking-widest text-[10px] font-bold text-gray-400">Cỡ chữ</span>
                            <button onClick={() => setFontSize(Math.max(12, fontSize - 2))} className="hover:text-black font-bold">A-</button>
                            <span>{fontSize}px</span>
                            <button onClick={() => setFontSize(Math.min(24, fontSize + 2))} className="hover:text-black font-bold">A+</button>
                        </div>
                    </div>

                    {/* Textarea */}
                    <div className="flex-1 relative bg-white min-h-0">
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onCompositionStart={() => setIsComposing(true)}
                            onCompositionEnd={() => setIsComposing(false)}
                            placeholder={`Viết bài ${isTask1 ? 'Task 1' : 'Task 2'} của bạn tại đây (tối thiểu ${minWords} từ)...`}
                            className={`w-full h-full p-8 text-gray-900 placeholder:text-gray-300 focus:outline-none resize-none custom-scrollbar bg-transparent ${selectedFont}`}
                            style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
                        />
                    </div>
                    
                    {/* Editor Footer / Submit Action */}
                    <div className="p-6 border-t border-gray-100 bg-white flex justify-end">
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || isComposing || text.trim().length === 0}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold text-base hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[160px] shadow-lg shadow-indigo-600/20"
                        >
                            {submitting ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                "Nộp bài chấm điểm"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default WritingPromptPage;
