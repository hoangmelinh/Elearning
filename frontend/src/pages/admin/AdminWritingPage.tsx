import React, { useEffect, useState } from 'react';
import { Plus, Trash, PenNib, X } from '@phosphor-icons/react';
import { writingService } from '../../services/writingService';
import type { WritingPrompt } from '../../services/writingService';

const AdminWritingPage: React.FC = () => {
    const [prompts, setPrompts] = useState<WritingPrompt[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        language: 'en' as 'en' | 'zh',
        level: 'IELTS',
        taskType: 'IELTS_TASK_2' as 'IELTS_TASK_1' | 'IELTS_TASK_2',
        imageUrl: '',
        promptText: '',
        aiReferenceData: ''
    });

    useEffect(() => {
        fetchPrompts();
    }, []);

    const fetchPrompts = async () => {
        try {
            setLoading(true);
            const data = await writingService.getPrompts(0, 100);
            setPrompts(data.content || []);
        } catch (err) {
            console.error('Failed to load prompts', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this prompt? All submissions will also be deleted.')) return;
        try {
            await writingService.deletePrompt(id);
            setPrompts(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            console.error('Failed to delete prompt', err);
            alert('Lỗi khi xóa đề bài');
        }
    };

    const openEditForm = (prompt: WritingPrompt) => {
        setEditingId(prompt.id);
        setFormData({
            title: prompt.title,
            language: prompt.language,
            level: prompt.level,
            taskType: prompt.taskType || 'IELTS_TASK_2',
            imageUrl: prompt.imageUrl || '',
            promptText: prompt.promptText,
            aiReferenceData: prompt.aiReferenceData || ''
        });
        setIsFormOpen(true);
    };

    const openCreateForm = () => {
        setEditingId(null);
        setFormData({
            title: '',
            language: 'en',
            level: 'IELTS',
            taskType: 'IELTS_TASK_2',
            imageUrl: '',
            promptText: '',
            aiReferenceData: ''
        });
        setIsFormOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            if (editingId) {
                await writingService.updatePrompt(editingId, formData);
            } else {
                await writingService.createPrompt(formData);
            }
            await fetchPrompts();
            setIsFormOpen(false);
        } catch (err) {
            console.error('Submit failed', err);
            alert('Có lỗi xảy ra khi lưu đề bài');
        } finally {
            setSubmitting(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploadingImage(true);
            const url = await writingService.uploadImage(file);
            setFormData(prev => ({ ...prev, imageUrl: url }));
        } catch (err) {
            console.error('Image upload failed', err);
            alert('Upload ảnh thất bại. Vui lòng thử lại.');
        } finally {
            setUploadingImage(false);
            // Reset input
            e.target.value = '';
        }
    };

    return (
        <div className="p-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Quản lý Đề Writing</h1>
                    <p className="text-gray-400">Tạo và chỉnh sửa các bài luyện viết cho học viên.</p>
                </div>
                <button
                    onClick={openCreateForm}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold transition-colors shadow-lg shadow-indigo-500/20"
                >
                    <Plus weight="bold" />
                    Thêm đề mới
                </button>
            </header>

            {loading ? (
                <div className="text-center text-gray-500 py-12">Đang tải dữ liệu...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {prompts.map(prompt => (
                        <div key={prompt.id} className="bg-[#111] border border-white/5 hover:border-white/10 transition-colors rounded-2xl p-6 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2 leading-tight">{prompt.title}</h3>
                                    <div className="flex gap-2">
                                        <span className="text-[10px] font-bold tracking-widest uppercase bg-white/5 px-2 py-1 rounded text-sky-400">{prompt.language}</span>
                                        <span className="text-[10px] font-bold tracking-widest uppercase bg-white/5 px-2 py-1 rounded text-indigo-400">Level: {prompt.level}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => openEditForm(prompt)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-indigo-500/20 text-gray-400 hover:text-indigo-400 transition-colors">
                                        <PenNib size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(prompt.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors">
                                        <Trash size={16} />
                                    </button>
                                </div>
                            </div>
                            <p className="text-gray-400 text-sm line-clamp-4 flex-1">
                                {prompt.promptText}
                            </p>
                        </div>
                    ))}
                    {prompts.length === 0 && (
                        <div className="col-span-full text-center text-gray-500 py-12 bg-[#111] rounded-2xl border border-white/5">
                            Chưa có đề bài nào. Hãy tạo mới!
                        </div>
                    )}
                </div>
            )}

            {/* Modal Form */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#0a0a0a]">
                            <h2 className="text-xl font-bold text-white">{editingId ? 'Chỉnh sửa đề' : 'Thêm đề mới'}</h2>
                            <button onClick={() => setIsFormOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">Tiêu đề (Title)</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">Ngôn ngữ</label>
                                    <select
                                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                        value={formData.language}
                                        onChange={e => setFormData({ ...formData, language: e.target.value as any })}
                                    >
                                        <option value="en">English</option>
                                        <option value="zh">Chinese</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">Độ khó (Level)</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g. IELTS, HSK4"
                                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                        value={formData.level}
                                        onChange={e => setFormData({ ...formData, level: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">Loại bài (Task Type)</label>
                                    <select
                                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                        value={formData.taskType}
                                        onChange={e => setFormData({ ...formData, taskType: e.target.value as any })}
                                    >
                                        <option value="IELTS_TASK_1">Task 1</option>
                                        <option value="IELTS_TASK_2">Task 2</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">Ảnh Biểu Đồ (Cho Task 1)</label>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="URL hoặc tải ảnh lên"
                                                className="flex-1 min-w-0 bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                                value={formData.imageUrl}
                                                onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                            />
                                            <label className="cursor-pointer shrink-0 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-center transition-colors">
                                                <input 
                                                    type="file" 
                                                    className="hidden" 
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    disabled={uploadingImage}
                                                />
                                                {uploadingImage ? (
                                                    <div className="w-5 h-5 border-2 border-gray-400 border-t-indigo-500 rounded-full animate-spin"></div>
                                                ) : (
                                                    <span className="text-gray-300 font-bold whitespace-nowrap">Tải ảnh</span>
                                                )}
                                            </label>
                                        </div>
                                        {formData.imageUrl && (
                                            <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-[#0a0a0a] flex items-center justify-center h-32">
                                                <img src={formData.imageUrl} alt="Preview" className="max-h-full object-contain" />
                                                <button 
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, imageUrl: '' })}
                                                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500/80 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <X size={16} weight="bold" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">
                                    Nội dung đề cho Học sinh (Prompt Text)
                                </label>
                                <textarea
                                    required
                                    rows={6}
                                    placeholder="Ví dụ: The chart below shows the proportion of the population..."
                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                                    value={formData.promptText}
                                    onChange={e => setFormData({ ...formData, promptText: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">
                                    Dữ liệu ẩn cho AI chấm (AI Reference Data)
                                    <span className="block text-xs font-normal text-gray-500 mt-1">
                                        Mẹo (Task 1): Nếu biểu đồ phức tạp, hãy tóm tắt các con số quan trọng vào đây. Học sinh sẽ không nhìn thấy ô này, nhưng AI sẽ lấy số liệu ở đây để so sánh và bắt lỗi học sinh.
                                    </span>
                                </label>
                                <textarea
                                    rows={4}
                                    placeholder="Ví dụ: Năm 2000 USA 50%, UK 30%. Dân số già tăng nhanh nhất ở Nhật..."
                                    className="w-full bg-indigo-950/20 border border-indigo-500/30 rounded-xl px-4 py-3 text-indigo-100 placeholder-indigo-900/50 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                                    value={formData.aiReferenceData}
                                    onChange={e => setFormData({ ...formData, aiReferenceData: e.target.value })}
                                />
                            </div>
                        </form>
                        <div className="px-6 py-4 border-t border-white/5 bg-[#0a0a0a] flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsFormOpen(false)}
                                className="px-5 py-2.5 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                            >
                                {submitting ? 'Đang lưu...' : 'Lưu Đề Bài'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminWritingPage;
