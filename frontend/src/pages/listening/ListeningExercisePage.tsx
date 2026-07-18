import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import httpClient from '../../services/httpClient';

gsap.registerPlugin(ScrollTrigger);

interface Question {
    id: string;
    questionText: string;
    questionType: 'multiple_choice' | 'fill_blank';
    correctAnswerText?: string;
}

interface AnswerOption {
    id: string;
    optionText: string;
    correct?: boolean;
    isCorrect?: boolean;
}

interface QuestionData {
    question: Question;
    options?: AnswerOption[];
}

interface Video {
    id: string;
    title: string;
    videoUrl: string;
}

interface Exercise {
    id: string;
    title: string;
    language: 'en' | 'zh';
    video?: Video;
}

const extractVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const ListeningExercisePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [exercise, setExercise] = useState<Exercise | null>(null);
    const [questions, setQuestions] = useState<QuestionData[]>([]);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [score, setScore] = useState<number | null>(null);

    const pinRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchExercise = async () => {
            try {
                const response = await httpClient.get(`/exercises/${id}`);
                setExercise(response.data.data.exercise);
                setQuestions(response.data.data.questions);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchExercise();
    }, [id]);

    useEffect(() => {
        // Removed GSAP pinning for a cleaner Top/Bottom layout
    }, [loading]);

    const handleOptionSelect = (questionId: string, optionId: string) => {
        if (score !== null) return;
        setAnswers(prev => ({
            ...prev,
            [questionId]: { selectedOptionId: optionId }
        }));
    };

    const handleTextChange = (questionId: string, text: string) => {
        if (score !== null) return;
        setAnswers(prev => ({
            ...prev,
            [questionId]: { answerText: text }
        }));
    };

    const handleSubmit = async () => {
        try {
            setSubmitting(true);
            const payload = {
                answers: Object.entries(answers).map(([qId, val]) => ({
                    questionId: qId,
                    ...val
                }))
            };
            const response = await httpClient.post(`/exercises/${id}/attempts`, payload);
            setScore(response.data.data.score);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!exercise) return <div className="text-white">Exercise not found.</div>;

    const isChinese = exercise.language === 'zh';
    const fontClass = isChinese ? 'font-noto-sc' : 'font-sans';
    const videoId = exercise.video?.videoUrl ? extractVideoId(exercise.video.videoUrl) : null;

    return (
        <main className="min-h-[100dvh] bg-[#050505] text-[#f5f5f5] pt-12 pb-32">
            <div className="max-w-6xl mx-auto px-6">
                
                {/* 1. Header */}
                <header className="mb-10 flex flex-col items-start relative w-full border-b border-white/5 pb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-widest uppercase text-sky-400">
                            Listening Comprehension
                        </span>
                        {score !== null && (
                            <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold tracking-widest uppercase">
                                Score: {score} / {questions.length * 10}
                            </span>
                        )}
                    </div>
                    
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white max-w-3xl">
                        {exercise.title}
                    </h1>
                </header>

                {/* 2. Content Split Layout with CSS Sticky */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 relative">
                    
                    {/* Left Side: Sticky Video Container */}
                    <div className="lg:col-span-7 xl:col-span-8 w-full h-full">
                        <div className="sticky top-24 z-10 bg-[#111] border border-white/10 rounded-2xl p-2 lg:p-3 shadow-2xl">
                            <div className="flex items-center justify-between px-2 pb-3 mb-2 border-b border-white/5">
                                <h3 className="text-[10px] font-bold tracking-widest text-sky-400 uppercase flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
                                    Source
                                </h3>
                            </div>
                            {videoId ? (
                                <div className="w-full rounded-xl overflow-hidden shadow-inner aspect-video bg-black relative">
                                    <iframe 
                                        width="100%" 
                                        height="100%" 
                                        src={`https://www.youtube.com/embed/${videoId}`} 
                                        title="YouTube video player" 
                                        frameBorder="0" 
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                        allowFullScreen
                                        className="absolute inset-0"
                                    ></iframe>
                                </div>
                            ) : (
                                <div className="w-full aspect-video bg-black/50 border border-white/5 rounded-xl flex items-center justify-center text-gray-500 text-sm">
                                    No video source available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Side: Scrolling Questions */}
                    <div className="lg:col-span-5 xl:col-span-4 w-full space-y-6 pb-32 mt-8 lg:mt-0">
                        {/* Progress Header */}
                        <div className="bg-[#0a0a0a] rounded-2xl p-5 border border-white/5 mb-2 shadow-lg">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Tiến độ làm bài</span>
                                <span className="text-sm font-bold text-sky-400">
                                    {Object.keys(answers).length} / {questions.length}
                                </span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-sky-500 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
                                />
                            </div>
                        </div>

                        {questions.map((qData, index) => (
                            <div key={qData.question.id} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
                                <h4 className={`text-lg font-medium tracking-tight mb-5 text-white ${fontClass}`}>
                                    <span className="text-sky-400 font-bold mr-3">{index + 1}.</span>
                                    {qData.question.questionText}
                                </h4>

                                {qData.question.questionType === 'multiple_choice' && qData.options && (
                                    <div className="grid grid-cols-1 gap-3">
                                        {qData.options.map(opt => {
                                            const isSelected = answers[qData.question.id]?.selectedOptionId === opt.id;
                                            const isFinished = score !== null;
                                            const isCorrectOption = opt.correct || opt.isCorrect;
                                            const isWrongSelection = isFinished && isSelected && !isCorrectOption;
                                            
                                            let buttonClass = 'bg-[#141414] text-gray-400 border-white/5 hover:border-white/20 hover:text-gray-200';
                                            let indicator = null;

                                            if (isFinished) {
                                                if (isCorrectOption) {
                                                    buttonClass = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/50';
                                                    indicator = <div className="text-emerald-400 text-xs font-bold tracking-widest uppercase ml-3">Correct</div>;
                                                } else if (isWrongSelection) {
                                                    buttonClass = 'bg-red-500/10 text-red-300 border-red-500/50';
                                                    indicator = <div className="text-red-400 text-xs font-bold tracking-widest uppercase ml-3">Wrong</div>;
                                                }
                                            } else if (isSelected) {
                                                buttonClass = 'bg-sky-500/10 text-sky-300 border-sky-500/50';
                                                indicator = <div className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0 ml-3" />;
                                            }

                                            return (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => handleOptionSelect(qData.question.id, opt.id)}
                                                    disabled={score !== null}
                                                    className={`w-full text-left px-5 py-3.5 rounded-xl border transition-all flex items-center justify-between ${buttonClass}`}
                                                >
                                                    <span className={`text-sm ${fontClass}`}>{opt.optionText}</span>
                                                    {indicator}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {qData.question.questionType === 'fill_blank' && (
                                    <div className="mt-2">
                                        <input
                                            type="text"
                                            disabled={score !== null}
                                            value={answers[qData.question.id]?.answerText || ''}
                                            onChange={(e) => handleTextChange(qData.question.id, e.target.value)}
                                            placeholder="Gõ câu trả lời..."
                                            className={`w-full bg-[#141414] border rounded-xl px-5 py-3.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all ${fontClass} ${score !== null ? (answers[qData.question.id]?.answerText?.trim()?.toLowerCase() === qData.question.correctAnswerText?.toLowerCase() ? 'border-emerald-500/50 text-emerald-300' : 'border-red-500/50 text-red-300') : 'border-white/10'}`}
                                        />
                                        {score !== null && (
                                            <div className="mt-3 text-sm flex items-center gap-2">
                                                <span className="text-gray-500">Đáp án đúng:</span>
                                                <span className="text-emerald-400 font-bold">{qData.question.correctAnswerText}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Submit Action */}
                        <div className="pt-8">
                            {score === null ? (
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="w-full bg-white text-black px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex justify-center items-center shadow-lg"
                                >
                                    {submitting ? (
                                        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        "Nộp Bài (Submit)"
                                    )}
                                </button>
                            ) : (
                                <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-8 text-center shadow-xl">
                                    <h3 className="text-2xl font-bold text-white mb-3">Đã hoàn thành!</h3>
                                    <p className="text-base text-gray-400 mb-8">Kết quả đã được lưu.</p>
                                    <Link to="/listening" className="inline-block bg-white text-black px-8 py-3 rounded-full font-bold text-base hover:bg-gray-200 transition-colors shadow-lg">
                                        Quay lại
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default ListeningExercisePage;
