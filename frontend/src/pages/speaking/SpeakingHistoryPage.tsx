import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import httpClient from '../../services/httpClient';
import { speakingService, RecordingResponse } from '../../services/speakingService';
import { 
    Microphone, 
    Plus, 
    ClockCounterClockwise, 
    ArrowRight, 
    Play, 
    CaretDown, 
    CaretUp, 
    Flame, 
    MagnifyingGlass, 
    X, 
    Clock, 
    CheckCircle, 
    WarningCircle,
    GraduationCap,
    BookOpenText,
    CircleNotch
} from '@phosphor-icons/react';

interface Part1Topic {
    id: string;
    title: string;
    questions: string[];
}

interface Part2CueCard {
    id: string;
    title: string;
    promptText: string;
    youShouldSay: string[];
    part3Questions: string[];
}

const part1RequiredTopics: Part1Topic[] = [
    {
        id: 'p1-req-1',
        title: '1. Work or Study (Bắt buộc)',
        questions: [
            'Do you work or are you a student?',
            'What work do you do / what subjects are you studying?',
            'Why did you choose that job / field of study?',
            'Do you enjoy your work / study?'
        ]
    },
    {
        id: 'p1-req-2',
        title: '2. Home & Hometown (Bắt buộc)',
        questions: [
            'Where is your hometown?',
            'What do you like most about your hometown?',
            'Do you live in a house or an apartment?',
            'What is your favourite room in your home?'
        ]
    }
];

const part1GeneralTopics: Part1Topic[] = [
    {
        id: 'p1-gen-1',
        title: '1. Food',
        questions: [
            'What was your favourite food when you were a child?',
            'Has the kind of food you like changed as you\'ve got older?',
            'Do you eat different food at different times of the year?',
            'Do you like to eat with others?',
            'In your country, is it very important to eat with other people?'
        ]
    },
    {
        id: 'p1-gen-2',
        title: '2. Pets and animals',
        questions: [
            'Did you want to have a pet when you were a child?',
            'Would you like to have pets in the future?',
            'Where do you prefer to keep your pet, indoors or outdoors?',
            'Do you see many birds and animals where you live?',
            'What kind of animals is famous in your country?'
        ]
    },
    {
        id: 'p1-gen-3',
        title: '3. Typing',
        questions: [
            'How often do you type on a keyboard?',
            'Did you learn how to type at school when you were younger?',
            'When did you learn how to type on a keyboard?',
            'Which do you find easier: typing on a keyboard or writing by hand?',
            'Do you like to improve your typing skills?'
        ]
    },
    {
        id: 'p1-gen-4',
        title: '4. Stage of life',
        questions: [
            'Do you enjoy your current stage of life?',
            'What was the happiest period of your life so far?',
            'What is the most important stage of a person\'s life?'
        ]
    }
];

const part2CueCards: Part2CueCard[] = [
    {
        id: 'p2-1',
        title: '1. Describe a time when you felt very proud of something a family member did',
        promptText: 'Describe a time when you felt very proud of something a family member did',
        youShouldSay: [
            'Who the family member was',
            'What he/she did',
            'Where and when this happened',
            'Explain why you felt so proud of what your family member did'
        ],
        part3Questions: [
            'What kinds of behaviors of young children can make their parents feel proud?',
            'Why do giving academic prizes or rewards help promote children\'s progress?',
            'Do you think it is good for parents to give children too many prizes or rewards?',
            'Does any job bring people a sense of pride?',
            'Have the things that people are proud of changed compared to the past?',
            'When do adults feel proud of themselves?'
        ]
    },
    {
        id: 'p2-2',
        title: '2. Describe a time when you were not allowed to use your phone',
        promptText: 'Describe a time when you were not allowed to use your phone',
        youShouldSay: [
            'Where you were',
            'Why you couldn\'t use it',
            'Explain how you felt about it'
        ],
        part3Questions: [
            'In your country, which places are not allowed people to use phones?',
            'Do you think it is important to introduce new rules for using mobile phones?',
            'Why do young and old people use mobile phones differently?',
            'When should parents allow their children to have mobile phones?',
            'Do you agree that the social rules in the past were stricter than those of today?'
        ]
    },
    {
        id: 'p2-3',
        title: '3. Describe a perfect job you would like to have in the future',
        promptText: 'Describe a perfect job you would like to have in the future',
        youShouldSay: [
            'What the job is',
            'How you knew it',
            'What skills you need for this job',
            'Explain why it would be the perfect job for you'
        ],
        part3Questions: [
            'What kind of jobs are popular among young people in your country?',
            'Is salary the most important factor when choosing a job?',
            'How do work requirements change over time?'
        ]
    }
];

const SpeakingHistoryPage: React.FC = () => {
    const navigate = useNavigate();
    const [recordings, setRecordings] = useState<RecordingResponse[]>([]);
    const [loading, setLoading] = useState(true);

    // Active Tab: 'part1-req' | 'part1-topics' | 'part23' | 'history'
    const [activeTab, setActiveTab] = useState<'part1-req' | 'part1-topics' | 'part23' | 'history'>('part1-topics');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state for Exam Simulation
    const [showExamModal, setShowExamModal] = useState(false);
    const [examModeTab, setExamModeTab] = useState<'random' | 'simulation' | 'custom'>('simulation');

    // Accordion state
    const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
        'p1-gen-1': true,
        'p2-1': true
    });

    // Dynamic speaking topics from backend database
    const [dbPart1Topics, setDbPart1Topics] = useState<Part1Topic[]>([]);
    const [dbPart2CueCards, setDbPart2CueCards] = useState<Part2CueCard[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [recRes, exRes] = await Promise.all([
                    speakingService.getUserRecordings(0, 50).catch(() => ({ content: [] })),
                    httpClient.get('/exercises?skillType=speaking&size=100').catch(() => ({ data: { data: { data: [] } } }))
                ]);
                
                setRecordings(recRes.content || []);

                const speakingList: any[] = exRes?.data?.data?.data || [];
                if (speakingList.length > 0) {
                    const p1List: Part1Topic[] = [];
                    const p2List: Part2CueCard[] = [];

                    speakingList.forEach((ex, idx) => {
                        if (ex.level?.toUpperCase().includes('PART 2') || ex.title.toUpperCase().includes('DESCRIBE')) {
                            p2List.push({
                                id: ex.id,
                                title: `${idx + 1}. ${ex.title}`,
                                promptText: ex.passageText || ex.title,
                                youShouldSay: ex.passageText ? ex.passageText.split('\n').filter(Boolean) : ['Who / What it was', 'Where and when', 'Explain why'],
                                part3Questions: []
                            });
                        } else {
                            p1List.push({
                                id: ex.id,
                                title: `${idx + 1}. ${ex.title}`,
                                questions: ex.passageText ? ex.passageText.split('\n').filter(Boolean) : [ex.title]
                            });
                        }
                    });

                    if (p1List.length > 0) setDbPart1Topics(p1List);
                    if (p2List.length > 0) setDbPart2CueCards(p2List);
                }
            } catch (error) {
                console.error("Failed to fetch speaking data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Combine static defaults with DB-created topics
    const allPart1Topics = useMemo(() => {
        return [...dbPart1Topics, ...part1GeneralTopics];
    }, [dbPart1Topics]);

    const allPart2CueCards = useMemo(() => {
        return [...dbPart2CueCards, ...part2CueCards];
    }, [dbPart2CueCards]);

    const toggleAccordion = (id: string) => {
        setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleStartPracticePart1 = (topic: Part1Topic) => {
        // Pass Part 1 questions as sequential list
        navigate('/speaking/record', { 
            state: { 
                partType: 'part1',
                topicTitle: topic.title,
                questions: topic.questions,
                assignedPrompt: topic.title
            } 
        });
    };

    const handleStartPracticePart2 = (card: Part2CueCard) => {
        // Pass Part 2 Cue Card with optional hints
        navigate('/speaking/record', { 
            state: { 
                partType: 'part2',
                topicTitle: card.title,
                youShouldSay: card.youShouldSay,
                part3Questions: card.part3Questions,
                assignedPrompt: card.title
            } 
        });
    };

    const handleStartExamSimulation = () => {
        const randomCueCard = part2CueCards[Math.floor(Math.random() * part2CueCards.length)];
        navigate('/speaking/record', { 
            state: { 
                partType: 'part2',
                isExamMode: true,
                topicTitle: randomCueCard.title,
                youShouldSay: randomCueCard.youShouldSay,
                part3Questions: randomCueCard.part3Questions,
                assignedPrompt: randomCueCard.title
            } 
        });
    };

    // Modal state for Admin Quick Create Speaking Topic
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newPart, setNewPart] = useState<'Part 1' | 'Part 2'>('Part 1');
    const [newQuestionsText, setNewQuestionsText] = useState('');
    const [creatingTopic, setCreatingTopic] = useState(false);

    const handleCreateSpeakingTopic = async () => {
        if (!newTitle.trim()) {
            alert('Vui lòng nhập tên chủ đề Speaking!');
            return;
        }

        try {
            setCreatingTopic(true);
            const payload = {
                title: newTitle.trim(),
                language: 'en',
                level: newPart,
                skillType: 'speaking',
                passageText: newQuestionsText.trim(),
                questions: [
                    {
                        questionText: newTitle.trim(),
                        questionType: 'multiple_choice',
                        correctAnswerText: '',
                        orderIndex: 1,
                        options: []
                    }
                ]
            };

            await httpClient.post('/exercises/full', payload);
            alert('Tạo bài thi Speaking mới thành công!');
            setShowCreateModal(false);
            setNewTitle('');
            setNewQuestionsText('');
            window.location.reload();
        } catch (err: any) {
            console.error('Error creating speaking topic:', err);
            alert('Lỗi tạo đề thi: ' + (err.message || err));
        } finally {
            setCreatingTopic(false);
        }
    };

    return (
        <div className="min-h-[100dvh] bg-transparent text-[#f5f5f5] pt-6 pb-28 px-4 md:px-8 max-w-[1400px] mx-auto font-sans">
            
            {/* Soft, Clean Header Container */}
            <div className="bg-[#0a0a0e] border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden mb-8">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold text-xs">
                            IELTS SPEAKING • QUÝ 2 • 2026
                        </span>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-3.5 py-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs transition-all flex items-center gap-1.5"
                        >
                            <Plus size={14} weight="bold" />
                            Admin: Tạo Đề Speaking Mới
                        </button>
                    </div>
                    <div className="relative w-full md:w-72">
                        <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm chủ đề speaking..."
                            className="w-full bg-[#121318] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>
                </div>

                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight mb-2">
                    Bộ Dự Đoán Đề Thi IELTS Speaking
                </h1>
                <p className="text-xs text-gray-400 max-w-3xl">
                    Luyện tập trả lời tuần tự các câu hỏi Part 1 hoặc dàn bài Part 2 kèm gợi ý ý nói. Chọn một chủ đề bên dưới để bắt đầu.
                </p>
            </div>

            {/* Subtle Pill Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-3 mb-8">
                <button
                    onClick={() => setActiveTab('part1-req')}
                    className={`px-4 py-2 rounded-xl font-semibold text-xs transition-all border ${activeTab === 'part1-req' ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' : 'bg-[#0a0a0e] border-white/5 text-gray-400 hover:text-white'}`}
                >
                    PART 1 BẮT BUỘC ({part1RequiredTopics.length})
                </button>

                <button
                    onClick={() => setActiveTab('part1-topics')}
                    className={`px-4 py-2 rounded-xl font-semibold text-xs transition-all border ${activeTab === 'part1-topics' ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' : 'bg-[#0a0a0e] border-white/5 text-gray-400 hover:text-white'}`}
                >
                    PART 1 CHỦ ĐỀ ({allPart1Topics.length})
                </button>

                <button
                    onClick={() => setActiveTab('part23')}
                    className={`px-4 py-2 rounded-xl font-semibold text-xs transition-all border ${activeTab === 'part23' ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' : 'bg-[#0a0a0e] border-white/5 text-gray-400 hover:text-white'}`}
                >
                    PART 2 + 3 ({allPart2CueCards.length})
                </button>

                <button
                    onClick={() => setShowExamModal(true)}
                    className="px-4 py-2 rounded-xl font-bold text-xs transition-all bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/30 flex items-center gap-2"
                >
                    <Flame size={15} className="text-red-400" />
                    Thi thật cực căng (Exam Mock)
                </button>

                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2 rounded-xl font-semibold text-xs transition-all border ml-auto ${activeTab === 'history' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-[#0a0a0e] border-white/5 text-gray-400 hover:text-white'}`}
                >
                    Lịch sử bài làm ({recordings.length})
                </button>
            </div>

            {/* TAB 1: Part 1 Required Topics */}
            {activeTab === 'part1-req' && (
                <div className="space-y-4">
                    {part1RequiredTopics.map((topic) => (
                        <div key={topic.id} className="bg-[#0a0a0e] border border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-bold text-white">
                                    {topic.title}
                                </h3>
                                <button
                                    onClick={() => handleStartPracticePart1(topic)}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
                                >
                                    <Play size={12} weight="fill" />
                                    Luyện tập theo tuần tự
                                </button>
                            </div>
                            <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5 space-y-2">
                                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                                    Các câu hỏi sẽ trả lời lần lượt ({topic.questions.length} câu):
                                </span>
                                <ul className="space-y-1.5 text-xs text-gray-300">
                                    {topic.questions.map((q, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <span className="text-indigo-400 font-bold">{idx + 1}.</span>
                                            <span>{q}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* TAB 2: Part 1 General Topics */}
            {activeTab === 'part1-topics' && (
                <div className="space-y-4">
                    {allPart1Topics.map((topic) => {
                        const isExpanded = expandedIds[topic.id] !== false;

                        return (
                            <div key={topic.id} className="bg-[#0a0a0e] border border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-base font-bold text-white">
                                        {topic.title}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleStartPracticePart1(topic)}
                                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
                                        >
                                            <Play size={12} weight="fill" />
                                            Luyện tập theo tuần tự
                                        </button>
                                        <button 
                                            onClick={() => toggleAccordion(topic.id)}
                                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400"
                                        >
                                            {isExpanded ? <CaretUp size={14} /> : <CaretDown size={14} />}
                                        </button>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5 space-y-2">
                                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                                            Danh sách câu hỏi trả lời theo tuần tự ({topic.questions.length} câu):
                                        </span>
                                        <ul className="space-y-1.5 text-xs text-gray-300">
                                            {topic.questions.map((q, idx) => (
                                                <li key={idx} className="flex items-start gap-2">
                                                    <span className="text-indigo-400 font-bold">{idx + 1}.</span>
                                                    <span>{q}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* TAB 3: Part 2 + Part 3 Cue Cards */}
            {activeTab === 'part23' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {allPart2CueCards.map((card) => {
                        const isExpanded = expandedIds[card.id] !== false;

                        return (
                            <div key={card.id} className="bg-[#0a0a0e] border border-white/5 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <h3 className="text-base font-bold text-white leading-snug">
                                            {card.title}
                                        </h3>
                                        <button
                                            onClick={() => handleStartPracticePart2(card)}
                                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shrink-0 transition-all shadow-sm"
                                        >
                                            <Play size={12} weight="fill" />
                                            Luyện tập Cue Card
                                        </button>
                                    </div>

                                    {/* Optional Hints Box */}
                                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-2">
                                        <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider block">
                                            Gợi ý ý nói (Optional Hints):
                                        </span>
                                        <ul className="text-xs text-gray-300 space-y-1.5 pl-1">
                                            {card.youShouldSay.map((sayItem, idx) => (
                                                <li key={idx} className="flex items-start gap-2">
                                                    <span className="text-gray-500">•</span>
                                                    <span>{sayItem}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Part 3 Discussion */}
                                    <div className="pt-2">
                                        <button
                                            onClick={() => toggleAccordion(card.id)}
                                            className="w-full flex items-center justify-between text-xs font-semibold text-gray-400 hover:text-white py-1.5 border-t border-white/5"
                                        >
                                            <span>Part 3 Questions ({card.part3Questions.length})</span>
                                            {isExpanded ? <CaretUp size={14} /> : <CaretDown size={14} />}
                                        </button>

                                        {isExpanded && (
                                            <ul className="space-y-2 pt-2 text-xs text-gray-300 font-medium">
                                                {card.part3Questions.map((q3, idx) => (
                                                    <li key={idx} className="flex items-start gap-2">
                                                        <span className="text-indigo-400 font-bold">{idx + 1}.</span>
                                                        <span>{q3}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* TAB 4: History List */}
            {activeTab === 'history' && (
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <CircleNotch size={32} className="text-indigo-400 animate-spin" />
                        </div>
                    ) : recordings.length === 0 ? (
                        <div className="text-center py-20 bg-[#0a0a0e] border border-dashed border-white/5 rounded-3xl">
                            <Microphone size={44} className="text-gray-600 mx-auto mb-3" />
                            <h3 className="text-base font-bold text-white mb-1">Chưa có bài làm nào</h3>
                            <p className="text-xs text-gray-400 mb-6">Bạn chưa thực hiện bài luyện nói nào. Hãy chọn một chủ đề ở trên để bắt đầu!</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {recordings.map((rec) => (
                                <Link 
                                    to={`/speaking/analysis/${rec.id}`} 
                                    key={rec.id}
                                    className="bg-[#0a0a0e] border border-white/5 hover:border-indigo-500/40 rounded-2xl p-5 flex items-center justify-between transition-all group"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                                            {rec.analysis?.ieltsOverall ? (
                                                <span className="font-extrabold text-base">{rec.analysis.ieltsOverall.toFixed(1)}</span>
                                            ) : (
                                                <Microphone size={22} />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white mb-1 line-clamp-1">
                                                {rec.promptText ? rec.promptText : "Luyện nói theo đề"}
                                            </h4>
                                            <div className="flex items-center gap-3 text-xs text-gray-400">
                                                <span className="flex items-center gap-1"><Clock size={12}/> {new Date(rec.createdAt).toLocaleDateString('vi-VN')}</span>
                                                <span className="px-2 py-0.5 rounded bg-white/5 uppercase text-[10px] font-bold">
                                                    {rec.analysisStatus === 'completed' ? 'Đã chấm điểm' : 'Đang xử lý'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <ArrowRight size={16} className="text-gray-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modal Exam Simulation */}
            {showExamModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#0a0a0e] border border-white/10 rounded-3xl w-full max-w-xl p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden">
                        
                        <button 
                            onClick={() => setShowExamModal(false)}
                            className="absolute right-6 top-6 text-gray-400 hover:text-white"
                        >
                            <X size={20} />
                        </button>

                        <div className="text-center space-y-1">
                            <h2 className="text-xl font-bold text-white uppercase tracking-tight">
                                Chế Độ Thi Thật (Exam Simulation)
                            </h2>
                            <p className="text-xs text-gray-400">
                                Giám khảo AI sẽ hỏi lần lượt qua 3 Parts như bài thi IELTS thực tế
                            </p>
                        </div>

                        {/* Mode Config Parameters Table */}
                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 space-y-3 text-xs">
                            <div className="flex items-center justify-between pb-2 border-b border-red-500/10">
                                <span className="text-gray-400 font-medium">Thời lượng:</span>
                                <strong className="text-white">11–14 phút (Full 3 Parts)</strong>
                            </div>
                            <div className="flex items-center justify-between pb-2 border-b border-red-500/10">
                                <span className="text-gray-400 font-medium">Quy trình:</span>
                                <strong className="text-white">Hỏi lần lượt từng câu hỏi</strong>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400 font-medium">Đánh giá:</span>
                                <strong className="text-emerald-400">4 Tiêu chí IELTS Band Official</strong>
                            </div>
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={handleStartExamSimulation}
                            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-xl text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
                        >
                            <Flame size={18} />
                            Bắt đầu thi ngay →
                        </button>

                    </div>
                </div>
            )}

            {/* Admin Quick Create Speaking Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#0a0a0e] border border-white/10 rounded-3xl w-full max-w-xl p-6 shadow-2xl space-y-4 relative">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                🎙️ Admin: Tạo Đề Luyện Nói Speaking Mới
                            </h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4 text-xs">
                            <div>
                                <label className="block text-gray-400 font-bold uppercase mb-1">Tên chủ đề Speaking:</label>
                                <input
                                    type="text"
                                    value={newTitle}
                                    onChange={e => setNewTitle(e.target.value)}
                                    placeholder="VD: Part 1 – Travelling & Transportation"
                                    className="w-full bg-[#121318] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 font-bold uppercase mb-1">Phần thi (Part):</label>
                                <select
                                    value={newPart}
                                    onChange={e => setNewPart(e.target.value as any)}
                                    className="w-full bg-[#121318] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none"
                                >
                                    <option value="Part 1">Part 1 (Câu hỏi trả lời theo tuần tự)</option>
                                    <option value="Part 2">Part 2 (Cue Card dàn bài mở)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-400 font-bold uppercase mb-1">
                                    {newPart === 'Part 1' ? 'Danh sách câu hỏi (Mỗi dòng 1 câu):' : 'Các gợi ý ý nói Cue Card (Mỗi dòng 1 gợi ý):'}
                                </label>
                                <textarea
                                    value={newQuestionsText}
                                    onChange={e => setNewQuestionsText(e.target.value)}
                                    placeholder={newPart === 'Part 1'
                                        ? 'Do you like travelling?\nWhat is your favourite vehicle?\nWhere did you travel last summer?'
                                        : 'Who you travelled with\nWhere you went\nExplain why it was memorable'
                                    }
                                    className="w-full h-36 bg-[#121318] border border-white/10 rounded-xl p-4 text-white font-mono outline-none focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs"
                            >
                                Hủy
                            </button>
                            <button
                                disabled={creatingTopic}
                                onClick={handleCreateSpeakingTopic}
                                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/20"
                            >
                                {creatingTopic ? 'Đang tạo...' : 'Xác Nhận Tạo Đề'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default SpeakingHistoryPage;
