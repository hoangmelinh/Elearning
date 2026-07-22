import React, { useEffect, useState } from 'react';
import httpClient from '../../services/httpClient';
import { CircleNotch, Plus, Trash, BookOpen, MagnifyingGlass, X, List, WarningCircle } from '@phosphor-icons/react';

interface OptionPayload {
    optionText: string;
    isCorrect: boolean;
}

interface QuestionPayload {
    questionText: string;
    questionType: 'multiple_choice' | 'fill_blank';
    correctAnswerText: string;
    orderIndex: number;
    options: OptionPayload[];
}

interface FullExerciseRequest {
    title: string;
    language: 'en' | 'zh';
    level: string;
    skillType: 'reading' | 'listening' | 'speaking';
    passageText: string;
    youtubeUrl?: string;
    questions: QuestionPayload[];
}

const AdminExercisePage: React.FC = () => {
    const [exercises, setExercises] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);

    // AI Generation state
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [aiGenerating, setAiGenerating] = useState(false);
    const [aiTopic, setAiTopic] = useState('');
    const [aiLevel, setAiLevel] = useState('B1');
    const [aiLanguage, setAiLanguage] = useState('en');

    // JSON Import state
    const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
    const [jsonString, setJsonString] = useState('');
    const [jsonImporting, setJsonImporting] = useState(false);

    // Form state
    const [formData, setFormData] = useState<FullExerciseRequest>({
        title: '',
        language: 'en',
        level: 'B1',
        skillType: 'reading',
        passageText: '',
        questions: []
    });

    useEffect(() => {
        fetchExercises();
    }, []);

    const fetchExercises = async () => {
        try {
            setLoading(true);
            const res = await httpClient.get('/exercises?size=100');
            setExercises(res.data.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const deleteExercise = async (id: string) => {
        if (!window.confirm('Bạn có chắc muốn xóa bài tập này? Mọi câu hỏi và kết quả của người dùng sẽ bị xóa.')) return;
        try {
            setDeletingId(id);
            await httpClient.delete(`/exercises/${id}`);
            setExercises(prev => prev.filter(e => e.id !== id));
        } catch (err) {
            console.error(err);
            alert('Lỗi khi xóa bài tập');
        } finally {
            setDeletingId(null);
        }
    };

    const handleEdit = async (id: string) => {
        try {
            setLoading(true);
            const res = await httpClient.get(`/exercises/${id}`);
            const data = res.data.data;
            const ex = data.exercise;
            
            // Map the questions
            const mappedQuestions: QuestionPayload[] = data.questions.map((qData: any) => {
                const q = qData.question;
                const opts = qData.options || [];
                return {
                    questionText: q.questionText,
                    questionType: q.questionType,
                    correctAnswerText: q.correctAnswerText || '',
                    orderIndex: q.orderIndex,
                    options: opts.map((o: any) => ({
                        optionText: o.optionText,
                        isCorrect: o.correct || o.isCorrect || false
                    }))
                };
            });

            setFormData({
                title: ex.title,
                language: ex.language,
                level: ex.level,
                skillType: ex.skillType || 'reading',
                passageText: ex.passageText || '',
                youtubeUrl: ex.video?.videoUrl || '',
                questions: mappedQuestions
            });
            setEditingId(id);
            setIsFormOpen(true);
        } catch (err) {
            console.error(err);
            alert('Lỗi khi tải chi tiết bài tập');
        } finally {
            setLoading(false);
        }
    };

    const addQuestion = () => {
        setFormData(prev => ({
            ...prev,
            questions: [
                ...prev.questions,
                {
                    questionText: '',
                    questionType: 'multiple_choice',
                    correctAnswerText: '',
                    orderIndex: prev.questions.length + 1,
                    options: [
                        { optionText: '', isCorrect: true },
                        { optionText: '', isCorrect: false },
                        { optionText: '', isCorrect: false },
                        { optionText: '', isCorrect: false }
                    ]
                }
            ]
        }));
    };

    const updateQuestion = (index: number, field: keyof QuestionPayload, value: any) => {
        const newQs = [...formData.questions];
        newQs[index] = { ...newQs[index], [field]: value };
        setFormData(prev => ({ ...prev, questions: newQs }));
    };

    const updateOption = (qIndex: number, optIndex: number, field: keyof OptionPayload, value: any) => {
        const newQs = [...formData.questions];
        const newOpts = [...newQs[qIndex].options];
        
        if (field === 'isCorrect' && value === true) {
            // Only one correct option allowed
            newOpts.forEach(o => o.isCorrect = false);
        }
        
        newOpts[optIndex] = { ...newOpts[optIndex], [field]: value };
        newQs[qIndex].options = newOpts;
        setFormData(prev => ({ ...prev, questions: newQs }));
    };

    const removeQuestion = (index: number) => {
        const newQs = formData.questions.filter((_, i) => i !== index);
        // Reindex
        newQs.forEach((q, i) => q.orderIndex = i + 1);
        setFormData(prev => ({ ...prev, questions: newQs }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Basic validation per skillType
        if (!formData.title?.trim()) {
            alert('Vui lòng nhập tiêu đề bài thi!');
            return;
        }
        if (formData.skillType === 'reading' && !formData.passageText?.trim()) {
            alert('Vui lòng nhập nội dung đoạn văn bài đọc!');
            return;
        }
        if (formData.skillType === 'listening' && !formData.youtubeUrl?.trim()) {
            alert('Vui lòng nhập link video YouTube!');
            return;
        }
        if (formData.skillType === 'speaking' && !formData.passageText?.trim()) {
            alert('Vui lòng nhập danh sách câu hỏi / gợi ý bài nói Speaking!');
            return;
        }

        try {
            setSubmitting(true);
            if (editingId) {
                await httpClient.put(`/exercises/full/${editingId}`, formData);
            } else {
                await httpClient.post('/exercises/full', formData);
            }
            setIsFormOpen(false);
            setEditingId(null);
            setFormData({
                title: '', language: 'en', level: 'B1', skillType: 'reading', passageText: '', youtubeUrl: '', questions: []
            });
            fetchExercises();
        } catch (err) {
            console.error(err);
            alert('Lỗi khi lưu bài tập');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAiGenerate = async () => {
        if (!aiTopic) {
            alert('Vui lòng nhập chủ đề!');
            return;
        }
        try {
            setAiGenerating(true);
            const res = await httpClient.post(`/exercises/generate?topic=${encodeURIComponent(aiTopic)}&level=${encodeURIComponent(aiLevel)}&language=${encodeURIComponent(aiLanguage)}`);
            const generatedData = res.data.data;
            setFormData({
                title: generatedData.title || '',
                language: generatedData.language || aiLanguage,
                level: generatedData.level || aiLevel,
                skillType: generatedData.skillType || 'reading',
                passageText: generatedData.passageText || '',
                youtubeUrl: generatedData.youtubeUrl || '',
                questions: generatedData.questions || []
            });
            setIsAiModalOpen(false);
        } catch (err) {
            console.error(err);
            alert('Lỗi khi tạo bằng AI, vui lòng thử lại.');
        } finally {
            setAiGenerating(false);
        }
    };

    const filtered = exercises.filter(e =>
        e.title.toLowerCase().includes(search.toLowerCase())
    );

    const handleJsonImport = async () => {
        if (!jsonString.trim()) {
            alert('Vui lòng nhập dữ liệu JSON bài thi!');
            return;
        }

        try {
            setJsonImporting(true);
            const parsedPayload = JSON.parse(jsonString);
            const res = await httpClient.post('/exercises/import-json', parsedPayload);
            alert('Import bài thi từ JSON thành công!');
            setIsJsonModalOpen(false);
            setJsonString('');
            fetchExercises();
        } catch (err: any) {
            console.error('Import error:', err);
            alert('Lỗi cú pháp JSON hoặc lỗi hệ thống: ' + (err.message || err));
        } finally {
            setJsonImporting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-transparent flex items-center justify-center">
            <CircleNotch size={32} className="text-purple-400 animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-transparent text-[#f5f5f5] pb-24 relative z-10">
            <div className="max-w-6xl mx-auto px-6 pt-12">
                
                {/* Header */}
                <div className="flex items-end justify-between mb-10">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-semibold bg-purple-500/[0.08] border border-purple-500/[0.12] text-purple-400 mb-3">
                            Quản trị
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-white">Quản lý Bài tập</h1>
                        <p className="text-gray-400 mt-2">{exercises.length} bài tập đọc/nghe trên hệ thống</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => {
                                setFormData({
                                    title: '',
                                    language: 'en',
                                    level: 'IELTS Part 1',
                                    skillType: 'speaking',
                                    passageText: '',
                                    youtubeUrl: '',
                                    questions: [{ questionText: 'Chủ đề Luyện nói mới', questionType: 'multiple_choice', correctAnswerText: '', orderIndex: 1, options: [] }]
                                });
                                setIsFormOpen(true);
                            }}
                            className="flex items-center gap-2 bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 px-5 py-2.5 rounded-full font-bold text-sm transition-all"
                        >
                            🎙️ Tạo Đề Speaking Mới
                        </button>
                        <button
                            onClick={() => setIsJsonModalOpen(true)}
                            className="flex items-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 px-5 py-2.5 rounded-full font-bold text-sm transition-all"
                        >
                            📥 Import Đề Thi Từ JSON
                        </button>
                        <button
                            onClick={() => setIsFormOpen(true)}
                            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-full font-bold text-sm transition-all"
                        >
                            <Plus size={16} weight="bold" />
                            Tạo bài tập mới
                        </button>
                    </div>
                </div>

                {/* JSON Import Modal */}
                {isJsonModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsJsonModalOpen(false)} />
                        <div className="relative bg-[#0a0a0a] border border-white/[0.1] rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-4">
                            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    📥 Import Đề Thi IELTS / TOEIC / HSK Từ File JSON
                                </h3>
                                <button onClick={() => setIsJsonModalOpen(false)} className="text-gray-500 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>
                            <p className="text-xs text-gray-400">
                                Dán nội dung JSON chứa bài thi (Passage, Questions, Options, TRUE/FALSE/NOT GIVEN) vào ô bên dưới:
                            </p>
                            <textarea
                                value={jsonString}
                                onChange={e => setJsonString(e.target.value)}
                                placeholder='{\n  "title": "IELTS Academic Reading – The kākāpō",\n  "category": "IELTS",\n  "level": "Band 7.0",\n  "language": "en",\n  "skillType": "reading",\n  "passageText": "...",\n  "questions": [...]\n}'
                                className="w-full h-64 bg-[#111] border border-white/10 rounded-xl p-4 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                            />
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setIsJsonModalOpen(false)}
                                    className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs"
                                >
                                    Hủy
                                </button>
                                <button
                                    disabled={jsonImporting}
                                    onClick={handleJsonImport}
                                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/20"
                                >
                                    {jsonImporting ? 'Đang Import...' : 'Xác Nhận Import'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Form Modal */}
                {isFormOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { setIsFormOpen(false); setEditingId(null); setFormData({title: '', language: 'en', level: 'B1', skillType: 'reading', passageText: '', questions: []}); }} />
                        
                        <div className="relative bg-[#0a0a0a] border border-white/[0.05] rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
                            <div className="flex items-center justify-between p-6 border-b border-white/5">
                                <h2 className="text-xl font-bold flex items-center gap-3">
                                    {editingId ? 'Sửa Bài tập' : 'Thêm Bài tập mới (IELTS / TOEIC / HSK)'}
                                    {!editingId && (
                                        <button
                                            onClick={() => setIsAiModalOpen(true)}
                                            className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-full hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-1"
                                        >
                                            ✨ Tạo tự động bằng AI
                                        </button>
                                    )}
                                </h2>
                                <button onClick={() => { setIsFormOpen(false); setEditingId(null); setFormData({title: '', language: 'en', level: 'B1', skillType: 'reading', passageText: '', youtubeUrl: '', questions: []}); }} className="text-gray-500 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>
                            
                            <div className="p-6 overflow-y-auto flex-1 space-y-6">

                                {/* Quick Certificate Preset Buttons */}
                                {!editingId && (
                                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-2">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                                            ⚡ Mẫu Đề Nhanh Theo Chứng Chỉ:
                                        </span>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setFormData(p => ({
                                                    ...p,
                                                    title: 'IELTS Academic Reading – Test 1 Passage 1',
                                                    language: 'en',
                                                    level: 'Band 6.5',
                                                    skillType: 'reading',
                                                    passageText: 'The impact of climate change on coastal agriculture is one of the most pressing environmental issues of the 21st century...',
                                                    questions: p.questions.length > 0 ? p.questions : [{ questionText: 'What is the main topic of the passage?', questionType: 'multiple_choice', correctAnswerText: '', orderIndex: 1, options: [{ optionText: 'Climate change impact on coastal farming', isCorrect: true }, { optionText: 'The history of tea production', isCorrect: false }] }]
                                                }))}
                                                className="px-3.5 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-bold transition-all"
                                            >
                                                📘 Tạo Đề IELTS (Band 6.5)
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setFormData(p => ({
                                                    ...p,
                                                    title: 'Reading TOEIC ETS 2026 – Đề 1 Part 5 (Incomplete Sentences)',
                                                    language: 'en',
                                                    level: 'Target 650+',
                                                    skillType: 'reading',
                                                    passageText: 'Part 5 Directions: A word or phrase is missing in each of the sentences below. Select the best answer.',
                                                    questions: p.questions.length > 0 ? p.questions : [{ questionText: 'Former Sendai Company CEO Ken Nakata spoke about ------ career experiences.', questionType: 'multiple_choice', correctAnswerText: '', orderIndex: 1, options: [{ optionText: 'he', isCorrect: false }, { optionText: 'his', isCorrect: true }, { optionText: 'him', isCorrect: false }, { optionText: 'himself', isCorrect: false }] }]
                                                }))}
                                                className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all"
                                            >
                                                🎓 Tạo Đề TOEIC (ETS 2026)
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setFormData(p => ({
                                                    ...p,
                                                    title: 'IELTS Speaking Part 1 – Food & Dining Preferences',
                                                    language: 'en',
                                                    level: 'IELTS Part 1',
                                                    skillType: 'speaking',
                                                    passageText: 'What was your favourite food when you were a child?\nHas the kind of food you like changed as you\'ve got older?\nDo you eat different food at different times of the year?\nDo you like to eat with others?',
                                                    questions: [{ questionText: 'Food & Dining Preferences', questionType: 'multiple_choice', correctAnswerText: '', orderIndex: 1, options: [] }]
                                                }))}
                                                className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-bold transition-all"
                                            >
                                                🎙️ Tạo Đề IELTS Speaking
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setFormData(p => ({
                                                    ...p,
                                                    title: 'HSK 4 Reading Test – 汉语水平考试第四级',
                                                    language: 'zh',
                                                    level: 'HSK 4',
                                                    skillType: 'reading',
                                                    passageText: '真正的朋友，是在你需要帮助的时候，愿意伸出援助之手的人...',
                                                    questions: p.questions.length > 0 ? p.questions : [{ questionText: '根据这段话，真正的朋友是什么样的？', questionType: 'multiple_choice', correctAnswerText: '', orderIndex: 1, options: [{ optionText: '愿意提供帮助', isCorrect: true }, { optionText: '喜欢开玩笑', isCorrect: false }, { optionText: '天天在一起', isCorrect: false }] }]
                                                }))}
                                                className="px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition-all"
                                            >
                                                🏮 Tạo Đề HSK Tiếng Trung
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Tiêu đề bài thi</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                                            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
                                            placeholder="VD: IELTS Reading Band 7.0 / TOEIC Đề 1 / HSK 4..."
                                        />
                                    </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Loại kỹ năng</label>
                                            <select
                                                value={formData.skillType}
                                                onChange={e => setFormData(p => ({ ...p, skillType: e.target.value as any }))}
                                                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                                            >
                                                <option value="reading">Luyện Đọc (Reading)</option>
                                                <option value="listening">Luyện Nghe (Listening)</option>
                                                <option value="speaking">Luyện Nói (Speaking)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Ngôn ngữ</label>
                                            <select
                                                value={formData.language}
                                                onChange={e => setFormData(p => ({ ...p, language: e.target.value as any }))}
                                                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                                            >
                                                <option value="en">Tiếng Anh (IELTS / TOEIC)</option>
                                                <option value="zh">Tiếng Trung (HSK)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Cấp độ (Band / Target / HSK Level)</label>
                                            <input
                                                type="text"
                                                value={formData.level}
                                                onChange={e => setFormData(p => ({ ...p, level: e.target.value }))}
                                                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                                                placeholder="Band 6.5, Target 650+, HSK 4..."
                                            />
                                        </div>
                                    </div>

                                <div>
                                    {formData.skillType === 'reading' && (
                                        <>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Đoạn văn bài đọc (Passage)</label>
                                            <textarea
                                                value={formData.passageText}
                                                onChange={e => setFormData(p => ({ ...p, passageText: e.target.value }))}
                                                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white min-h-[150px] outline-none font-mono text-sm"
                                                placeholder="Nhập nội dung bài đọc..."
                                            />
                                        </>
                                    )}

                                    {formData.skillType === 'listening' && (
                                        <>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Link Video / Audio YouTube</label>
                                            <input
                                                type="text"
                                                value={formData.youtubeUrl || ''}
                                                onChange={e => setFormData(p => ({ ...p, youtubeUrl: e.target.value }))}
                                                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                                                placeholder="https://www.youtube.com/watch?v=..."
                                            />
                                        </>
                                    )}

                                    {formData.skillType === 'speaking' && (
                                        <>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                                                Danh sách câu hỏi / Gợi ý dàn bài Speaking (Mỗi dòng 1 câu hỏi/ý)
                                            </label>
                                            <textarea
                                                value={formData.passageText}
                                                onChange={e => setFormData(p => ({ ...p, passageText: e.target.value }))}
                                                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white min-h-[150px] outline-none font-mono text-sm"
                                                placeholder={formData.level?.includes('Part 2')
                                                    ? 'Who the family member was\nWhat he/she did\nWhere and when this happened\nExplain why you felt so proud'
                                                    : 'What was your favourite food when you were a child?\nHas the kind of food you like changed as you\'ve got older?\nDo you eat different food at different times of the year?'
                                                }
                                            />
                                        </>
                                    )}
                                </div>

                                {formData.skillType !== 'speaking' && (
                                    <div className="border-t border-white/5 pt-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-bold">Danh sách Câu hỏi Trắc nghiệm / Điền từ ({formData.questions.length})</h3>
                                            <button
                                                type="button"
                                                onClick={addQuestion}
                                                className="text-purple-400 hover:text-purple-300 text-sm font-bold flex items-center gap-1"
                                            >
                                                <Plus weight="bold" /> Thêm câu hỏi
                                            </button>
                                        </div>

                                    <div className="space-y-6">
                                        {formData.questions.map((q, qIndex) => (
                                            <div key={qIndex} className="bg-[#111] border border-white/10 rounded-2xl p-5 relative">
                                                <button 
                                                    onClick={() => removeQuestion(qIndex)}
                                                    className="absolute top-4 right-4 text-gray-500 hover:text-red-400"
                                                >
                                                    <Trash size={18} />
                                                </button>
                                                
                                                <div className="flex gap-4 mb-4 pr-8">
                                                    <div className="w-16">
                                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">STT</label>
                                                        <input disabled value={q.orderIndex} className="w-full bg-black/50 border border-white/5 rounded-lg px-3 py-2 text-center text-white" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nội dung câu hỏi</label>
                                                        <input 
                                                            value={q.questionText} 
                                                            onChange={e => updateQuestion(qIndex, 'questionText', e.target.value)}
                                                            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-purple-500"
                                                            placeholder="What is the main idea?"
                                                        />
                                                    </div>
                                                    <div className="w-40">
                                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Loại</label>
                                                        <select
                                                            value={q.questionType}
                                                            onChange={e => updateQuestion(qIndex, 'questionType', e.target.value)}
                                                            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white outline-none"
                                                        >
                                                            <option value="multiple_choice">Trắc nghiệm</option>
                                                            <option value="fill_blank">Điền từ</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {q.questionType === 'multiple_choice' ? (
                                                    <div className="grid grid-cols-2 gap-3 pl-20">
                                                        {q.options.map((opt, optIndex) => (
                                                            <div key={optIndex} className="flex items-center gap-2">
                                                                <input
                                                                    type="radio"
                                                                    name={`q_${qIndex}_correct`}
                                                                    checked={opt.isCorrect}
                                                                    onChange={() => updateOption(qIndex, optIndex, 'isCorrect', true)}
                                                                    className="w-4 h-4 accent-purple-500"
                                                                />
                                                                <input
                                                                    value={opt.optionText}
                                                                    onChange={e => updateOption(qIndex, optIndex, 'optionText', e.target.value)}
                                                                    className={`flex-1 bg-black/30 border rounded-lg px-3 py-1.5 text-sm outline-none ${opt.isCorrect ? 'border-purple-500/50 text-purple-100' : 'border-white/5 text-gray-400'}`}
                                                                    placeholder={`Option ${optIndex + 1}`}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="pl-20">
                                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Đáp án đúng (chính xác)</label>
                                                        <input 
                                                            value={q.correctAnswerText} 
                                                            onChange={e => updateQuestion(qIndex, 'correctAnswerText', e.target.value)}
                                                            className="w-full bg-black/50 border border-emerald-500/30 rounded-lg px-3 py-2 text-emerald-400 outline-none"
                                                            placeholder="Đáp án..."
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {formData.questions.length === 0 && (
                                            <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-white/10 rounded-2xl">
                                                Chưa có câu hỏi nào.
                                            </div>
                                        )}
                                    </div>
                                </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-[#0a0a0a] rounded-b-3xl">
                                <button
                                    type="button"
                                    onClick={() => { setIsFormOpen(false); setEditingId(null); setFormData({title: '', language: 'en', level: 'B1', skillType: 'reading', passageText: '', questions: []}); }}
                                    className="px-6 py-2.5 rounded-full font-bold text-sm text-gray-400 hover:text-white"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="bg-white hover:bg-gray-200 text-black px-8 py-2.5 rounded-full font-bold text-sm flex items-center gap-2"
                                >
                                    {submitting ? <CircleNotch className="animate-spin" /> : null}
                                    Lưu Bài Tập
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* AI Generate Modal */}
                {isAiModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsAiModalOpen(false)} />
                        
                        <div className="relative bg-[#0a0a0a] border border-white/[0.05] rounded-3xl w-full max-w-md flex flex-col shadow-2xl">
                            <div className="p-6 border-b border-white/5">
                                <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-400">
                                    ✨ Tự động tạo Đề (Study4 style)
                                </h2>
                            </div>
                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Chủ đề (Topic)</label>
                                    <input
                                        type="text"
                                        value={aiTopic}
                                        onChange={e => setAiTopic(e.target.value)}
                                        className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none"
                                        placeholder="Ví dụ: Space Exploration, AI, Climate Change..."
                                        disabled={aiGenerating}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Ngôn ngữ</label>
                                        <select
                                            value={aiLanguage}
                                            onChange={e => setAiLanguage(e.target.value)}
                                            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                                            disabled={aiGenerating}
                                        >
                                            <option value="en">Tiếng Anh (EN)</option>
                                            <option value="zh">Tiếng Trung (ZH)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Cấp độ (Level)</label>
                                        <input
                                            type="text"
                                            value={aiLevel}
                                            onChange={e => setAiLevel(e.target.value)}
                                            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                                            placeholder="B2, IELTS 6.0..."
                                            disabled={aiGenerating}
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 italic">
                                    * AI sẽ tự động viết 1 đoạn văn (passage) dựa trên cấp độ và chủ đề, kèm theo 5 câu hỏi (Trắc nghiệm + Điền từ) và đáp án hoàn chỉnh. Có thể mất 10-20 giây.
                                </p>
                            </div>
                            <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-[#0a0a0a] rounded-b-3xl">
                                <button
                                    type="button"
                                    onClick={() => setIsAiModalOpen(false)}
                                    disabled={aiGenerating}
                                    className="px-6 py-2.5 rounded-full font-bold text-sm text-gray-400 hover:text-white"
                                >
                                    Đóng
                                </button>
                                <button
                                    onClick={handleAiGenerate}
                                    disabled={aiGenerating}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-2.5 rounded-full font-bold text-sm flex items-center gap-2"
                                >
                                    {aiGenerating ? <CircleNotch className="animate-spin" /> : <span className="mr-1">✨</span>}
                                    {aiGenerating ? 'Đang tạo bằng AI...' : 'Tạo Đề Ngay'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Search */}
                <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-1.5 mb-6">
                    <div className="bg-[#0a0a0a] border border-white/[0.02] rounded-[calc(1rem-0.375rem)] px-4 py-3 flex items-center gap-3">
                        <MagnifyingGlass size={16} className="text-gray-500" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm bài tập..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="flex-1 bg-transparent text-white text-sm placeholder-gray-600 outline-none"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="grid grid-cols-[3fr_1fr_1fr_auto] gap-4 px-5 py-2 text-[10px] font-bold tracking-[0.2em] text-gray-600 uppercase mb-2">
                    <div>Tiêu đề</div>
                    <div>Loại</div>
                    <div>Cấp độ</div>
                    <div></div>
                </div>

                <div className="space-y-2">
                    {filtered.map(ex => (
                        <div key={ex.id} className="rounded-2xl bg-white/[0.01] border border-white/[0.04] p-1.5 transition-all group hover:bg-white/[0.025] hover:border-white/[0.08]">
                            <div className="bg-[#090909] border border-white/[0.01] rounded-[calc(1rem-0.375rem)] px-4 py-3.5 grid grid-cols-[3fr_1fr_1fr_auto] gap-4 items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.04] flex items-center justify-center shrink-0">
                                        <BookOpen size={16} className="text-purple-400" />
                                    </div>
                                    <span className="font-semibold text-white text-sm truncate">{ex.title}</span>
                                </div>
                                <div className="text-gray-400 text-xs flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ex.language === 'en' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
                                        {ex.language.toUpperCase()}
                                    </span>
                                    {ex.skillType}
                                </div>
                                <div className="text-gray-300 text-xs font-mono">{ex.level}</div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button
                                        onClick={() => handleEdit(ex.id)}
                                        className="p-2 rounded-xl text-gray-600 hover:text-emerald-400 hover:bg-emerald-400/10 transition-all"
                                    >
                                        <BookOpen size={14} />
                                    </button>
                                    <button
                                        onClick={() => deleteExercise(ex.id)}
                                        disabled={deletingId === ex.id}
                                        className="p-2 rounded-xl text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
                                    >
                                        {deletingId === ex.id ? <CircleNotch size={14} className="animate-spin" /> : <Trash size={14} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="py-16 text-center text-gray-600 text-sm">
                            Không tìm thấy bài tập nào.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminExercisePage;
