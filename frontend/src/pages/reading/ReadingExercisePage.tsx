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

interface Exercise {
    id: string;
    title: string;
    passageText: string;
    language: 'en' | 'zh';
}

const ReadingExercisePage: React.FC = () => {
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
        // Advanced GSAP Scroll Pinning for the passage text
        if (!loading && pinRef.current && containerRef.current && window.innerWidth >= 1024) {
            const pinContext = gsap.context(() => {
                ScrollTrigger.create({
                    trigger: containerRef.current,
                    start: "top 100px", // leave space for nav
                    end: "bottom bottom",
                    pin: pinRef.current,
                    pinSpacing: false,
                });
            }, containerRef);
            return () => pinContext.revert();
        }
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

    return (
        <main className="min-h-[100dvh] bg-[#050505] text-[#f5f5f5] overflow-x-hidden pt-12 pb-32">
            <div className="max-w-6xl mx-auto px-6">
                
                {/* 1. Header */}
                <header className="mb-10 flex flex-col items-start relative w-full border-b border-white/5 pb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-widest uppercase text-gray-400">
                            Reading Comprehension
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

                {/* 2. Content Split with GSAP Pinning */}
                <div ref={containerRef} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative items-start">
                    
                    {/* Left Side: Pinned Passage */}
                    <div className="lg:col-span-6 w-full" ref={pinRef}>
                        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 lg:p-8 shadow-xl max-h-[80vh] overflow-y-auto custom-scrollbar">
                            <h3 className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase mb-6 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                Source Material
                            </h3>
                            <div className={`text-base leading-relaxed text-gray-300 ${fontClass}`}>
                                {exercise.passageText.split('\n').map((paragraph, i) => (
                                    <p key={i} className="mb-5 last:mb-0">
                                        {paragraph}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Scrolling Questions */}
                    <div className="lg:col-span-6 w-full space-y-6 pb-32">
                        {questions.map((qData, index) => (
                            <div key={qData.question.id} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
                                <h4 className={`text-lg font-medium tracking-tight mb-5 text-white ${fontClass}`}>
                                    <span className="text-indigo-400 font-bold mr-3">{index + 1}.</span>
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
                                                buttonClass = 'bg-indigo-500/10 text-indigo-300 border-indigo-500/50';
                                                indicator = <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0 ml-3" />;
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
                                            className={`w-full bg-[#141414] border rounded-xl px-5 py-3.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all ${fontClass} ${score !== null ? (answers[qData.question.id]?.answerText?.trim()?.toLowerCase() === qData.question.correctAnswerText?.toLowerCase() ? 'border-emerald-500/50 text-emerald-300' : 'border-red-500/50 text-red-300') : 'border-white/10'}`}
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
                                    className="w-full bg-white text-black px-8 py-4 rounded-xl font-bold text-base hover:bg-gray-200 transition-colors disabled:opacity-50 flex justify-center items-center"
                                >
                                    {submitting ? (
                                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        "Nộp Bài (Submit)"
                                    )}
                                </button>
                            ) : (
                                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 text-center">
                                    <h3 className="text-xl font-bold text-white mb-2">Đã hoàn thành!</h3>
                                    <p className="text-sm text-gray-400 mb-6">Kết quả của bạn đã được ghi nhận vào hệ thống.</p>
                                    <Link to="/reading" className="inline-block bg-white text-black px-6 py-2.5 rounded-full font-bold text-sm hover:bg-gray-200 transition-colors">
                                        Quay lại danh sách
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

export default ReadingExercisePage;
