import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { writingService } from '../../services/writingService';
import type { SubmissionWithFeedback } from '../../services/writingService';
import NotFoundPage from '../errors/NotFoundPage';

const BandScoreCard: React.FC<{ score: number; label: string; highlight?: boolean }> = ({ score, label, highlight }) => {
    return (
        <div className={`flex flex-col items-center justify-center p-6 lg:p-8 bg-[#111] border ${highlight ? 'border-sky-500/50 shadow-[0_0_30px_rgba(14,165,233,0.15)] bg-gradient-to-b from-[#111] to-sky-950/20' : 'border-white/5'} rounded-3xl group hover:border-white/20 transition-all duration-300`}>
            <div className={`text-5xl lg:text-6xl font-black tracking-tighter mb-3 ${highlight ? 'text-sky-400' : 'text-white'}`}>
                {Number(score).toFixed(1)}
            </div>
            <span className={`text-[10px] lg:text-xs font-bold tracking-widest uppercase text-center ${highlight ? 'text-sky-400' : 'text-gray-500'}`}>
                {label}
            </span>
        </div>
    );
};

const WritingFeedbackPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<SubmissionWithFeedback | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;
        
        const fetchData = async () => {
            try {
                const res = await writingService.getSubmission(id);
                setData(res);
                
                // If feedback is null, it's still processing (status === 'pending')
                if (!res.feedback && res.submission.status === 'pending') {
                    setTimeout(fetchData, 2000); // poll every 2 seconds
                } else {
                    setLoading(false);
                }
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to fetch submission.');
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                <p className="text-gray-400 font-medium tracking-wide">AI is analyzing your essay...</p>
            </div>
        );
    }

    if (error || !data) {
        return <NotFoundPage />;
    }

    const { submission, feedback } = data;
    const isChinese = submission.prompt.language === 'zh';
    const fontClass = isChinese ? 'font-noto-sc' : 'font-sans';

    return (
        <main className="min-h-[100dvh] bg-[#050505] text-[#f5f5f5] overflow-x-hidden pt-24 pb-32">
            <div className="max-w-[1200px] mx-auto px-6">
                
                <header className="mb-16 flex items-center justify-between border-b border-white/10 pb-8">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tighter mb-2">Writing Analysis</h1>
                        <p className="text-gray-400">Prompt: {submission.prompt.title}</p>
                    </div>
                    <Link to="/dashboard" className="px-6 py-3 rounded-full border border-white/20 text-sm font-bold hover:bg-white/10 transition-colors">
                        Back to Dashboard
                    </Link>
                </header>

                {!feedback ? (
                    <div className="bg-[#111] border border-white/10 rounded-3xl p-12 text-center">
                        <p className="text-gray-400">Feedback is not available yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        
                        {/* Scores & Essay */}
                        <div className="lg:col-span-4 flex flex-col gap-6">
                            
                            <BandScoreCard score={feedback.overallScore} label="Overall Band Score" highlight />
                            
                            <div className="grid grid-cols-2 gap-4">
                                <BandScoreCard score={feedback.taskResponseScore} label="Task Response" />
                                <BandScoreCard score={feedback.coherenceScore} label="Coherence" />
                                <BandScoreCard score={feedback.lexicalScore} label="Lexical Resource" />
                                <BandScoreCard score={feedback.grammarScore} label="Grammar (GRA)" />
                            </div>
                            
                            <div className="bg-[#111] border border-white/10 rounded-3xl p-8">
                                <h3 className="text-sm font-bold tracking-widest text-indigo-400 uppercase mb-6">Original Submission</h3>
                                <p className={`text-lg leading-relaxed text-gray-300 ${fontClass} whitespace-pre-wrap`}>
                                    {submission.submissionText}
                                </p>
                            </div>
                        </div>

                        {/* Detailed Feedback */}
                        <div className="lg:col-span-8 space-y-8">
                            <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 lg:p-10">
                                <h2 className="text-2xl font-bold tracking-tighter mb-4 text-indigo-300">General Comment</h2>
                                <p className="text-gray-300 leading-relaxed text-lg">{feedback.detailedFeedback.general_comment}</p>
                            </div>

                            <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 lg:p-10">
                                <h2 className="text-2xl font-bold tracking-tighter mb-8 text-red-400">Grammar & Syntax</h2>
                                {feedback.detailedFeedback.grammar_errors?.length === 0 ? (
                                    <p className="text-green-500 font-medium">Perfect grammar! No errors found.</p>
                                ) : (
                                    <div className="space-y-6">
                                        {feedback.detailedFeedback.grammar_errors?.map((err, i) => (
                                            <div key={i} className="p-6 bg-[#111] border border-red-500/20 rounded-2xl">
                                                <div className={`text-xl mb-3 flex flex-col gap-2 ${fontClass}`}>
                                                    <span className="line-through text-red-400 opacity-80">{err.original}</span>
                                                    <span className="text-green-400">{err.corrected}</span>
                                                </div>
                                                <p className="text-gray-400 text-sm mt-4 pt-4 border-t border-white/5">
                                                    <span className="font-bold text-white mr-2">Why:</span>
                                                    {err.explanation}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 lg:p-10">
                                <h2 className="text-2xl font-bold tracking-tighter mb-8 text-yellow-500">Vocabulary Suggestions</h2>
                                {feedback.detailedFeedback.vocabulary_suggestions?.length === 0 ? (
                                    <p className="text-gray-400">No specific vocabulary suggestions.</p>
                                ) : (
                                    <div className="space-y-6">
                                        {feedback.detailedFeedback.vocabulary_suggestions?.map((sug, i) => (
                                            <div key={i} className="p-6 bg-[#111] border border-yellow-500/20 rounded-2xl">
                                                <div className={`text-xl mb-3 flex items-center gap-4 ${fontClass}`}>
                                                    <span className="text-gray-400">{sug.original}</span>
                                                    <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                                    <span className="text-yellow-400 font-bold">{sug.suggestion}</span>
                                                </div>
                                                <p className="text-gray-400 text-sm mt-4 pt-4 border-t border-white/5">
                                                    <span className="font-bold text-white mr-2">Tip:</span>
                                                    {sug.explanation}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </main>
    );
};

export default WritingFeedbackPage;
