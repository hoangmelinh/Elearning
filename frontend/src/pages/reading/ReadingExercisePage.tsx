import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import httpClient from '../../services/httpClient';
import { 
    Clock, 
    CircleNotch, 
    WarningCircle,
    Trophy,
    ArrowClockwise,
    CaretLeft,
    CaretRight,
    TextT,
    CornersOut,
    CornersIn,
    WifiHigh,
    Bell,
    List,
    CheckCircle,
    XCircle,
    ArrowsLeftRight
} from '@phosphor-icons/react';

interface Question {
    id: string;
    questionText: string;
    questionType: string;
    correctAnswerText?: string;
    orderIndex?: number;
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
    cognitiveLevel?: string;
}

interface Exercise {
    id: string;
    title: string;
    passageText: string;
    language: 'en' | 'zh';
    level?: string;
}

const ReadingExercisePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [exercise, setExercise] = useState<Exercise | null>(null);
    const [questionsData, setQuestionsData] = useState<QuestionData[]>([]);
    
    // User answers: questionId -> { selectedOptionId, answerText }
    const [answers, setAnswers] = useState<Record<string, any>>({});
    
    // Resizer pane ratio state (percentage of left pane width, e.g. 50%)
    const [leftWidthPercent, setLeftWidthPercent] = useState<number>(50);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    // Font size scale multiplier
    const [fontSizeScale, setFontSizeScale] = useState<'normal' | 'large' | 'xlarge'>('normal');
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

    // Elapsed timer seconds
    const [elapsedSeconds, setElapsedSeconds] = useState<number>(71); // 1:11
    const [timerActive, setTimerActive] = useState<boolean>(true);

    // Active Part Tab (Part 1, Part 2, Part 3)
    const [activePartTab, setActivePartTab] = useState<number>(1);

    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
    const [scoreResult, setScoreResult] = useState<{ score: number; total: number } | null>(null);

    const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const fetchExercise = async () => {
            try {
                const response = await httpClient.get(`/exercises/${id}`);
                const exData = response.data.data.exercise;
                const qList: QuestionData[] = response.data.data.questions || [];

                setExercise(exData);
                setQuestionsData(qList);
            } catch (err) {
                console.error('Error fetching exercise details:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchExercise();
    }, [id]);

    // Timer counting UP
    useEffect(() => {
        if (!timerActive || loading || scoreResult !== null) return;

        const interval = setInterval(() => {
            setElapsedSeconds(prev => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [timerActive, loading, scoreResult]);

    // Split Pane Resizer Dragging logic
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging || !containerRef.current) return;
            const containerRect = containerRef.current.getBoundingClientRect();
            const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
            if (newLeftWidth >= 20 && newLeftWidth <= 80) {
                setLeftWidthPercent(newLeftWidth);
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    const formatElapsedTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleOptionSelect = (questionId: string, optionId: string, optionText?: string) => {
        if (scoreResult !== null) return;
        setAnswers(prev => ({
            ...prev,
            [questionId]: { selectedOptionId: optionId, answerText: optionText }
        }));
    };

    const scrollToQuestion = (questionId: string) => {
        const el = questionRefs.current[questionId];
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(console.error);
            setIsFullscreen(true);
        } else {
            document.exitFullscreen().catch(console.error);
            setIsFullscreen(false);
        }
    };

    const handleSubmitAttempt = async () => {
        try {
            setSubmitting(true);
            setShowConfirmModal(false);
            setTimerActive(false);

            const payload = {
                answers: Object.entries(answers).map(([qId, val]) => ({
                    questionId: qId,
                    ...val
                }))
            };

            const response = await httpClient.post(`/exercises/${id}/attempts`, payload);
            const score = response.data.data.score || 0;
            const total = questionsData.length * 10;

            setScoreResult({ score, total });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error('Error submitting attempt:', err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <CircleNotch size={36} className="text-blue-600 animate-spin" />
                    <span className="text-xs font-semibold text-gray-600 tracking-wider">ĐANG TẢI ĐỀ THI IELTS...</span>
                </div>
            </div>
        );
    }

    if (!exercise) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="bg-white border p-8 rounded-2xl text-center max-w-md shadow-lg">
                    <WarningCircle size={48} className="text-red-500 mx-auto mb-3" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Không tìm thấy bài thi</h2>
                    <p className="text-sm text-gray-500 mb-6">Bài thi này có thể không tồn tại hoặc đã bị xóa.</p>
                    <Link to="/reading" className="bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm inline-block">
                        Quay lại danh sách đề
                    </Link>
                </div>
            </div>
        );
    }

    const totalQuestions = questionsData.length;
    const answeredCount = Object.keys(answers).length;
    const fontClass = fontSizeScale === 'large' ? 'text-base' : fontSizeScale === 'xlarge' ? 'text-lg' : 'text-sm';
    const isSubmitted = scoreResult !== null;

    return (
        <div className="min-h-screen bg-[#f4f5f7] text-gray-900 flex flex-col font-sans select-none overflow-x-hidden">
            
            {/* Top Bar */}
            <header className="bg-[#1e293b] text-white px-6 py-3 shadow-md flex items-center justify-between shrink-0 z-30">
                <div className="flex items-center gap-4">
                    <div className="w-7 h-7 rounded bg-teal-500 flex items-center justify-center font-black text-white text-xs">
                        D
                    </div>
                    <div>
                        <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                            {exercise.title}
                        </h1>
                        <div className="text-[11px] text-gray-300 font-medium">
                            {formatElapsedTime(elapsedSeconds)} đã qua
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-gray-300">
                    {!isSubmitted && (
                        <button 
                            onClick={() => setShowConfirmModal(true)}
                            className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs px-5 py-2 rounded shadow transition-colors"
                        >
                            Kiểm Tra / Nộp Bài
                        </button>
                    )}
                    
                    <button 
                        onClick={() => setFontSizeScale(prev => prev === 'normal' ? 'large' : prev === 'large' ? 'xlarge' : 'normal')}
                        className="hover:text-white transition-colors" 
                        title="Chỉnh cỡ chữ"
                    >
                        <TextT size={20} weight="bold" />
                    </button>

                    <button 
                        onClick={toggleFullscreen} 
                        className="hover:text-white transition-colors"
                        title="Toàn màn hình"
                    >
                        {isFullscreen ? <CornersIn size={20} /> : <CornersOut size={20} />}
                    </button>

                    <WifiHigh size={20} className="text-emerald-400" />
                    <Bell size={20} className="hover:text-white cursor-pointer" />
                    <List size={20} className="hover:text-white cursor-pointer" />
                </div>
            </header>

            {/* Score Result Banner if Submitted */}
            {isSubmitted && (
                <div className="bg-emerald-600 text-white px-8 py-4 shadow-md flex items-center justify-between z-20">
                    <div className="flex items-center gap-3">
                        <Trophy size={28} weight="fill" />
                        <div>
                            <h3 className="font-extrabold text-lg">Kết quả bài làm IELTS: {scoreResult.score} / {scoreResult.total} điểm</h3>
                            <p className="text-xs text-emerald-100">Đã kiểm tra và đối chiếu chi tiết đáp án đúng / sai bên dưới.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => window.location.reload()} className="bg-white text-emerald-800 font-bold text-xs px-4 py-2 rounded-lg hover:bg-emerald-50 shadow">
                            Làm lại bài
                        </button>
                        <Link to="/reading" className="bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-emerald-700">
                            Danh sách đề
                        </Link>
                    </div>
                </div>
            )}

            {/* Main Interactive Split-Pane View */}
            <div ref={containerRef} className="flex-1 flex min-h-0 relative overflow-hidden bg-white">
                
                {/* LEFT PANE: Reading Passage */}
                <div 
                    style={{ width: `${leftWidthPercent}%` }} 
                    className="h-[calc(100vh-120px)] overflow-y-auto p-6 md:p-8 border-r border-gray-200 bg-white"
                >
                    <div className="bg-gray-100 px-4 py-2.5 rounded-lg mb-6 text-xs text-gray-700 font-medium">
                        <strong className="block text-sm text-gray-900 font-bold mb-1">Part 1</strong>
                        Read the text and answer questions 1–{totalQuestions}
                    </div>

                    <h2 className="text-xl font-bold text-slate-900 mb-2">
                        {exercise.title}
                    </h2>

                    <div className={`leading-relaxed text-gray-800 whitespace-pre-line font-serif ${fontClass}`}>
                        {exercise.passageText}
                    </div>
                </div>

                {/* RESIZER DIVIDER BAR (<-> Drag handle) */}
                <div 
                    onMouseDown={handleMouseDown}
                    className="w-3 bg-gray-100 hover:bg-blue-500/20 cursor-col-resize border-x border-gray-200 flex items-center justify-center shrink-0 transition-colors z-20 group"
                    title="Kéo sang trái/phải để tùy chỉnh độ rộng màn hình"
                >
                    <div className="w-5 h-8 bg-white border border-gray-300 rounded shadow-xs flex items-center justify-center text-gray-500 group-hover:border-blue-500 group-hover:text-blue-600">
                        <ArrowsLeftRight size={12} weight="bold" />
                    </div>
                </div>

                {/* RIGHT PANE: Questions & Correct/Incorrect Answers Highlight */}
                <div 
                    style={{ width: `${100 - leftWidthPercent}%` }} 
                    className="h-[calc(100vh-120px)] overflow-y-auto p-6 md:p-8 bg-gray-50/50"
                >
                    <div className="mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                        <h3 className="font-extrabold text-sm text-gray-900 mb-1">
                            Questions 1–{totalQuestions}
                        </h3>
                        <p className="text-xs text-gray-600 leading-normal">
                            Do the following statements agree with the information given in the Reading Passage?<br />
                            In boxes 1–{totalQuestions} on your answer sheet, write:<br />
                            <strong className="text-gray-800">TRUE</strong> if the statement agrees with the information<br />
                            <strong className="text-gray-800">FALSE</strong> if the statement contradicts the information<br />
                            <strong className="text-gray-800">NOT GIVEN</strong> if there is no information on this
                        </p>
                    </div>

                    {/* Question Cards */}
                    <div className="space-y-6 pb-20">
                        {questionsData.map((qData, index) => {
                            const qId = qData.question.id;
                            const isTFNG = qData.question.questionType === 'true_false_not_given' || !qData.options || qData.options.length === 0;

                            const tfngOptions = ['TRUE', 'FALSE', 'NOT GIVEN'];
                            const correctTFNGVal = (qData.question.correctAnswerText || 'TRUE').toUpperCase();

                            const userAnswerObj = answers[qId];

                            // Check correctness for True/False/Not Given
                            const isUserCorrectTFNG = userAnswerObj?.answerText === correctTFNGVal;

                            return (
                                <div 
                                    key={qId}
                                    ref={el => { questionRefs.current[qId] = el; }}
                                    className={`bg-white rounded-xl p-5 border shadow-2xs space-y-3 transition-all ${isSubmitted ? (isUserCorrectTFNG || qData.options?.some(o => (o.isCorrect || o.correct) && answers[qId]?.selectedOptionId === o.id) ? 'border-emerald-300 bg-emerald-50/20' : 'border-rose-300 bg-rose-50/20') : 'border-gray-200'}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                            <span className="w-6 h-6 rounded bg-gray-100 text-gray-800 font-bold text-xs flex items-center justify-center shrink-0 border border-gray-300 mt-0.5">
                                                {index + 1}
                                            </span>
                                            <p className={`text-gray-800 font-medium ${fontClass}`}>
                                                {qData.question.questionText}
                                            </p>
                                        </div>

                                        {/* Status badge when submitted */}
                                        {isSubmitted && (
                                            <span className="shrink-0 font-bold text-xs">
                                                {isTFNG ? (
                                                    isUserCorrectTFNG ? (
                                                        <span className="text-emerald-600 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-md flex items-center gap-1">
                                                            <CheckCircle size={14} weight="fill" /> Đúng (+10p)
                                                        </span>
                                                    ) : (
                                                        <span className="text-rose-600 bg-rose-100 border border-rose-300 px-2.5 py-1 rounded-md flex items-center gap-1">
                                                            <XCircle size={14} weight="fill" /> Sai (0p)
                                                        </span>
                                                    )
                                                ) : (
                                                    qData.options?.some(o => (o.isCorrect || o.correct) && answers[qId]?.selectedOptionId === o.id) ? (
                                                        <span className="text-emerald-600 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-md flex items-center gap-1">
                                                            <CheckCircle size={14} weight="fill" /> Đúng (+10p)
                                                        </span>
                                                    ) : (
                                                        <span className="text-rose-600 bg-rose-100 border border-rose-300 px-2.5 py-1 rounded-md flex items-center gap-1">
                                                            <XCircle size={14} weight="fill" /> Sai (0p)
                                                        </span>
                                                    )
                                                )}
                                            </span>
                                        )}
                                    </div>

                                    {/* TRUE / FALSE / NOT GIVEN options format */}
                                    {isTFNG && (
                                        <div className="space-y-2 pl-9 pt-1">
                                            {tfngOptions.map((optText) => {
                                                const isSelected = answers[qId]?.answerText === optText;
                                                const isCorrectOption = optText === correctTFNGVal;

                                                let styleClasses = 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50';
                                                
                                                if (isSubmitted) {
                                                    if (isCorrectOption) {
                                                        styleClasses = 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-xs';
                                                    } else if (isSelected && !isCorrectOption) {
                                                        styleClasses = 'bg-rose-50 border-rose-500 text-rose-800 font-bold shadow-xs';
                                                    } else {
                                                        styleClasses = 'bg-gray-50 border-gray-200 text-gray-400 opacity-60';
                                                    }
                                                } else if (isSelected) {
                                                    styleClasses = 'bg-blue-50 border-blue-500 text-blue-700 shadow-2xs';
                                                }

                                                return (
                                                    <label 
                                                        key={optText}
                                                        onClick={() => handleOptionSelect(qId, optText, optText)}
                                                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer text-xs transition-all ${styleClasses}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSubmitted ? (isCorrectOption ? 'border-emerald-600 bg-emerald-600 text-white' : isSelected ? 'border-rose-600 bg-rose-600 text-white' : 'border-gray-300') : isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>
                                                                {(isSelected || (isSubmitted && isCorrectOption)) && <span className="text-[10px]">✓</span>}
                                                            </div>
                                                            <span>{optText}</span>
                                                        </div>

                                                        {isSubmitted && (
                                                            <span>
                                                                {isCorrectOption && <span className="text-emerald-700 font-extrabold text-[11px]">✓ Đáp án đúng</span>}
                                                                {isSelected && !isCorrectOption && <span className="text-rose-700 font-bold text-[11px]">✗ Bạn đã chọn câu này</span>}
                                                            </span>
                                                        )}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Standard Multiple Choice Options */}
                                    {!isTFNG && qData.options && (
                                        <div className="space-y-2 pl-9 pt-1">
                                            {qData.options.map((opt, optIdx) => {
                                                const letter = String.fromCharCode(65 + optIdx);
                                                const isSelected = answers[qId]?.selectedOptionId === opt.id;
                                                const isCorrectOption = opt.isCorrect || opt.correct;

                                                let styleClasses = 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50';

                                                if (isSubmitted) {
                                                    if (isCorrectOption) {
                                                        styleClasses = 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-xs';
                                                    } else if (isSelected && !isCorrectOption) {
                                                        styleClasses = 'bg-rose-50 border-rose-500 text-rose-800 font-bold shadow-xs';
                                                    } else {
                                                        styleClasses = 'bg-gray-50 border-gray-200 text-gray-400 opacity-60';
                                                    }
                                                } else if (isSelected) {
                                                    styleClasses = 'bg-blue-50 border-blue-500 text-blue-700 shadow-2xs';
                                                }

                                                return (
                                                    <label
                                                        key={opt.id}
                                                        onClick={() => handleOptionSelect(qId, opt.id)}
                                                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer text-xs transition-all ${styleClasses}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSubmitted ? (isCorrectOption ? 'border-emerald-600 bg-emerald-600 text-white' : isSelected ? 'border-rose-600 bg-rose-600 text-white' : 'border-gray-300') : isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>
                                                                {(isSelected || (isSubmitted && isCorrectOption)) && <span className="text-[10px]">✓</span>}
                                                            </div>
                                                            <span><strong>{letter}.</strong> {opt.optionText}</span>
                                                        </div>

                                                        {isSubmitted && (
                                                            <span>
                                                                {isCorrectOption && <span className="text-emerald-700 font-extrabold text-[11px]">✓ Đáp án đúng</span>}
                                                                {isSelected && !isCorrectOption && <span className="text-rose-700 font-bold text-[11px]">✗ Bạn đã chọn câu này</span>}
                                                            </span>
                                                        )}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}

                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>

            {/* Bottom IELTS Navigation Bar */}
            <footer className="bg-white border-t border-gray-200 px-6 py-3 shadow-lg flex items-center justify-between shrink-0 z-30">
                
                {/* Part Tabs */}
                <div className="flex items-center gap-6 text-xs font-bold">
                    <button 
                        onClick={() => setActivePartTab(1)}
                        className={`py-1 px-3 rounded-md transition-colors flex items-center gap-2 ${activePartTab === 1 ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        <span>Part 1</span>
                        <span className="text-[10px] font-normal text-gray-500">1-{totalQuestions}</span>
                    </button>
                    <button 
                        onClick={() => setActivePartTab(2)}
                        className="py-1 px-3 rounded-md text-gray-400 hover:text-gray-600 flex items-center gap-2"
                    >
                        <span>Part 2</span>
                        <span className="text-[10px] text-gray-400">0 of 13</span>
                    </button>
                    <button 
                        onClick={() => setActivePartTab(3)}
                        className="py-1 px-3 rounded-md text-gray-400 hover:text-gray-600 flex items-center gap-2"
                    >
                        <span>Part 3</span>
                        <span className="text-[10px] text-gray-400">0 of 14</span>
                    </button>
                </div>

                {/* Horizontal Question Numbers Matrix */}
                <div className="flex items-center gap-1.5 overflow-x-auto max-w-md px-2 custom-scrollbar">
                    {questionsData.map((qData, index) => {
                        const qId = qData.question.id;
                        const isAnswered = !!answers[qId];

                        const isTFNG = qData.question.questionType === 'true_false_not_given' || !qData.options || qData.options.length === 0;
                        const correctTFNGVal = (qData.question.correctAnswerText || 'TRUE').toUpperCase();
                        const isUserCorrect = isTFNG 
                            ? answers[qId]?.answerText === correctTFNGVal 
                            : qData.options?.some(o => (o.isCorrect || o.correct) && answers[qId]?.selectedOptionId === o.id);

                        let pillStyle = 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200';
                        if (isSubmitted) {
                            if (isUserCorrect) {
                                pillStyle = 'bg-emerald-600 text-white border-emerald-600 font-bold';
                            } else if (isAnswered) {
                                pillStyle = 'bg-rose-600 text-white border-rose-600 font-bold';
                            } else {
                                pillStyle = 'bg-gray-300 text-gray-600 border-gray-400';
                            }
                        } else if (isAnswered) {
                            pillStyle = 'bg-blue-600 text-white border-blue-600';
                        }

                        return (
                            <button
                                key={qId}
                                onClick={() => scrollToQuestion(qId)}
                                className={`w-7 h-7 rounded text-xs font-bold transition-all shrink-0 border ${pillStyle}`}
                            >
                                {index + 1}
                            </button>
                        );
                    })}
                </div>

                {/* Right Bottom Actions */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <button className="p-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors">
                            <CaretLeft size={16} weight="bold" />
                        </button>
                        <button className="p-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors">
                            <CaretRight size={16} weight="bold" />
                        </button>
                    </div>

                    {!isSubmitted && (
                        <button 
                            onClick={() => setShowConfirmModal(true)}
                            className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs px-5 py-2 rounded shadow transition-colors"
                        >
                            Kiểm Tra
                        </button>
                    )}
                </div>

            </footer>

            {/* Submit Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle size={28} weight="fill" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">
                            Nộp bài thi IELTS?
                        </h3>
                        <p className="text-xs text-gray-600">
                            Bạn đã hoàn thành <strong className="text-blue-600">{answeredCount}/{totalQuestions}</strong> câu hỏi. Bạn có chắc muốn chấm điểm nộp bài?
                        </p>
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs"
                            >
                                Tiếp tục làm
                            </button>
                            <button
                                onClick={handleSubmitAttempt}
                                className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 rounded-xl text-xs shadow"
                            >
                                Nộp Bài
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ReadingExercisePage;
