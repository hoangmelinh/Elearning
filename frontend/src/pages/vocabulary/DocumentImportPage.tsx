import React, { useState } from 'react';
import httpClient from '../../services/httpClient';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, ClipboardText, CheckCircle, WarningCircle, ArrowRight } from '@phosphor-icons/react';

type ImportMode = 'file' | 'paste';

interface ParsedRow {
  term: string;
  phonetic: string;
  meaning: string;
}

function parsePastedText(raw: string): ParsedRow[] {
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const rows: ParsedRow[] = [];

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.startsWith('từ vựng') || lower.startsWith('word') || lower.startsWith('term') || lower.startsWith('vocabulary')) continue;

    let cols: string[] = [];

    if (line.includes('\t')) {
      cols = line.split('\t').map(c => c.trim());
    } else if (line.includes(';')) {
      cols = line.split(';').map(c => c.trim());
    } else if (line.includes(',') && line.split(',').length >= 2) {
      cols = line.split(',').map(c => c.trim());
    } else if (line.includes(' - ')) {
      cols = line.split(' - ').map(c => c.trim());
    } else {
      cols = [line];
    }

    if (cols.length === 0 || !cols[0]) continue;

    let startIdx = 0;
    if (cols.length >= 3) {
      const firstColClean = cols[0].toLowerCase().replace(/[\.\s:]/g, '');
      const isIndexCol = /^\d+$/.test(firstColClean) || ['stt', 'no', 'id', 'index'].includes(firstColClean);
      if (isIndexCol) {
        startIdx = 1;
      }
    }

    const activeLength = cols.length - startIdx;
    if (activeLength <= 0) continue;

    const term = cols[startIdx];
    let phonetic = '';
    let meaning = '';

    if (activeLength === 1) {
      meaning = term;
    } else if (activeLength === 2) {
      if (cols[startIdx + 1].startsWith('/') || cols[startIdx + 1].startsWith('[')) {
        phonetic = cols[startIdx + 1];
      } else {
        meaning = cols[startIdx + 1];
      }
    } else {
      phonetic = cols[startIdx + 1];
      meaning = cols[startIdx + 2];
    }

    rows.push({ term, phonetic, meaning: meaning || term });
  }

  return rows;
}

const DocumentImportPage: React.FC = () => {
  const [mode, setMode] = useState<ImportMode>('paste'); 
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [language, setLanguage] = useState('en');
  const [deckName, setDeckName] = useState('');
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (selected.size > 5 * 1024 * 1024) {
        setStatus({ type: 'error', message: 'File vượt quá giới hạn 5MB' });
        return;
      }
      setFile(selected);
      setStatus({ type: 'idle', message: '' });
    }
  };

  const handlePasteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setPastedText(val);
    if (val.trim()) {
      const parsed = parsePastedText(val);
      setPreview(parsed.slice(0, 5));
    } else {
      setPreview([]);
    }
  };

  const handleSubmitFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setStatus({ type: 'loading', message: 'Đang upload và phân tích tài liệu...' });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);
    formData.append('deck_name', deckName);

    try {
      const resp = await httpClient.post('/documents/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const mode = resp.data.data?.mode;
      if (mode === 'table_parser') {
        setStatus({ type: 'success', message: 'Phát hiện bảng trong file! Đang tạo flashcard...' });
      } else {
        setStatus({ type: 'success', message: 'AI đang trích xuất từ vựng của bạn...' });
      }
      setTimeout(() => navigate('/vocabulary'), 2000);
    } catch {
      setStatus({ type: 'error', message: 'Lỗi: Không thể import tài liệu.' });
    }
  };

  const handleSubmitPaste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedText.trim()) return;

    const rows = parsePastedText(pastedText);
    if (rows.length === 0) {
      setStatus({ type: 'error', message: 'Không nhận ra định dạng. Hãy kiểm tra các cột phân tách.' });
      return;
    }

    setStatus({ type: 'loading', message: `Đang khởi tạo bộ thẻ ${rows.length} từ...` });

    try {
      const tsvContent = 'TABLE_TSV:\n' + rows.map(r => `${r.term}\t${r.phonetic}\t${r.meaning}`).join('\n');

      const formData = new FormData();
      formData.append('text_content', tsvContent);
      formData.append('language', language);
      formData.append('deck_name', deckName || 'Từ vựng mới');

      await httpClient.post('/documents/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setStatus({ type: 'success', message: `Tạo bộ thẻ ${rows.length} từ vựng thành công!` });
      setTimeout(() => navigate('/vocabulary'), 1500);
    } catch {
      setStatus({ type: 'error', message: 'Lỗi trong quá trình tạo flashcard.' });
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-[#f5f5f5] pb-24 relative z-10">
      <div className="max-w-2xl mx-auto px-6 pt-12">

        {/* Back header */}
        <div className="mb-8">
          <Link to="/vocabulary" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs font-semibold uppercase tracking-wider">
            <ArrowLeft size={14} />
            Quay lại
          </Link>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-semibold bg-white/[0.04] border border-white/[0.05] text-gray-400 mb-3">
          Nhập dữ liệu
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Nhập từ vựng</h1>
        <p className="text-gray-500 text-sm mb-10 leading-relaxed">Tạo mới bộ thẻ học bằng cách dán văn bản hoặc tải lên tài liệu sẵn có.</p>

        {/* Toggle Mode Controller (Apple Pill Vibe) */}
        <div className="inline-flex p-1 bg-white/[0.02] border border-white/[0.05] rounded-full mb-8">
          <button
            onClick={() => setMode('paste')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold transition-all duration-300 ${
              mode === 'paste' ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-gray-400 hover:text-white'
            }`}
          >
            <ClipboardText size={15} />
            Paste text
            <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-extrabold ml-1">FAST</span>
          </button>
          <button
            onClick={() => setMode('file')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold transition-all duration-300 ${
              mode === 'file' ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Upload size={15} />
            Upload file
          </button>
        </div>

        {/* Common Form Enclosure with Double-Bezel */}
        <div className="rounded-[2rem] bg-white/[0.015] border border-white/[0.05] p-2 mb-6">
          <div className="rounded-[calc(2rem-0.5rem)] bg-[#0a0a0a] border border-white/[0.02] p-6 space-y-6">
            <div>
              <label className="block text-[10px] font-bold tracking-[0.15em] text-gray-500 uppercase mb-2">Tên bộ từ vựng *</label>
              <input
                type="text"
                value={deckName}
                onChange={e => setDeckName(e.target.value)}
                placeholder="VD: Từ vựng HSK 3, IELTS Topic Work..."
                required
                className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3.5 text-white placeholder-gray-700 focus:border-white/20 outline-none transition-all text-sm font-medium focus:shadow-[0_0_15px_rgba(255,255,255,0.02)]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-[0.15em] text-gray-500 uppercase mb-2">Ngôn ngữ chính</label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3.5 text-white focus:border-white/20 outline-none transition-all text-sm font-medium cursor-pointer"
              >
                <option value="en" className="bg-[#0c0c0c]">🇬🇧 Tiếng Anh (English)</option>
                <option value="zh" className="bg-[#0c0c0c]">🇨🇳 Tiếng Trung (Mandarin)</option>
              </select>
            </div>
          </div>
        </div>

        {/* PASTE MODE FORM */}
        {mode === 'paste' && (
          <form onSubmit={handleSubmitPaste} className="space-y-6">
            <div className="rounded-[2rem] bg-white/[0.015] border border-white/[0.05] p-2">
              <div className="rounded-[calc(2rem-0.5rem)] bg-[#0a0a0a] border border-white/[0.02] p-6">
                <label className="block text-[10px] font-bold tracking-[0.15em] text-gray-500 uppercase mb-3">
                  Nội dung từ vựng
                </label>
                
                {/* Visual guidelines instead of plain text */}
                {/* Visual guidelines instead of plain text */}
                <div className="space-y-2 mb-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs text-gray-400">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Cấu trúc các cột gợi ý (Ngăn cách bằng Tab, Dấu phẩy hoặc Gạch ngang):</div>
                  {language === 'zh' ? (
                    <ul className="list-disc pl-4 space-y-1 text-[11px] text-gray-400">
                      <li>Dạng 4 cột: <code className="text-indigo-400 bg-white/[0.03] px-1 py-0.5 rounded font-mono">STT | Chữ Hán | Pinyin | Giải nghĩa</code> (VD: <code className="text-gray-300 font-mono">1  我  wǒ  Tôi</code>)</li>
                      <li>Dạng 3 cột: <code className="text-indigo-400 bg-white/[0.03] px-1 py-0.5 rounded font-mono">Chữ Hán | Pinyin | Giải nghĩa</code> (VD: <code className="text-gray-300 font-mono">我  wǒ  Tôi</code>)</li>
                      <li>Dạng 2 cột: <code className="text-indigo-400 bg-white/[0.03] px-1 py-0.5 rounded font-mono">Chữ Hán | Giải nghĩa</code> (VD: <code className="text-gray-300 font-mono">我 - Tôi</code>)</li>
                    </ul>
                  ) : (
                    <ul className="list-disc pl-4 space-y-1 text-[11px] text-gray-400">
                      <li>Dạng 4 cột: <code className="text-indigo-400 bg-white/[0.03] px-1 py-0.5 rounded font-mono">STT | Từ vựng | Phiên âm IPA | Giải nghĩa</code> (VD: <code className="text-gray-300 font-mono">1  Apple  /ˈæp.əl/  Quả táo</code>)</li>
                      <li>Dạng 3 cột: <code className="text-indigo-400 bg-white/[0.03] px-1 py-0.5 rounded font-mono">Từ vựng | Phiên âm IPA | Giải nghĩa</code> (VD: <code className="text-gray-300 font-mono">Apple  /ˈæp.əl/  Quả táo</code>)</li>
                      <li>Dạng 2 cột: <code className="text-indigo-400 bg-white/[0.03] px-1 py-0.5 rounded font-mono">Từ vựng | Giải nghĩa</code> (VD: <code className="text-gray-300 font-mono">Apple - Quả táo</code>)</li>
                    </ul>
                  )}
                </div>

                <textarea
                  value={pastedText}
                  onChange={handlePasteChange}
                  rows={8}
                  placeholder={
                    language === 'zh'
                      ? "我\twǒ\tTôi\n你好\tnǐ hǎo\tXin chào"
                      : "Apple\t/ˈæp.əl/\tQuả táo\nBanana\t/bəˈnɑː.nə/\tQuả chuối"
                  }
                  className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 text-white placeholder-gray-800 focus:border-white/20 outline-none transition-all text-xs font-mono resize-y"
                />
              </div>
            </div>

            {/* Preview Panel with Bezel styling */}
            {preview.length > 0 && (
              <div className="rounded-2xl bg-emerald-500/[0.02] border border-emerald-500/[0.15] p-5">
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-4">
                  ✓ Phát hiện {parsePastedText(pastedText).length} từ vựng (Xem trước 5 từ):
                </p>
                <div className="space-y-2.5">
                  {preview.map((row, i) => (
                    <div key={i} className="flex gap-4 items-center text-xs text-gray-400">
                      <span className="font-bold text-white min-w-[90px]">{row.term}</span>
                      {row.phonetic && <span className="text-gray-600 font-mono text-[11px]">{row.phonetic}</span>}
                      <span className="text-gray-500 flex-1">{row.meaning}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={status.type === 'loading' || !pastedText.trim() || !deckName.trim()}
              className="group w-full flex items-center justify-between bg-white hover:bg-white/95 disabled:opacity-30 disabled:pointer-events-none text-black pl-6 pr-2.5 py-3.5 rounded-full font-bold text-sm transition-all duration-300 active:scale-[0.98]"
            >
              <span>{status.type === 'loading' ? 'Đang khởi tạo bộ thẻ...' : 'Khởi tạo Flashcards ngay'}</span>
              <div className="w-8 h-8 rounded-full bg-[#0a0a0a] text-white flex items-center justify-center transition-transform duration-500 group-hover:translate-x-1">
                <ArrowRight size={14} weight="bold" />
              </div>
            </button>
          </form>
        )}

        {/* FILE UPLOAD MODE */}
        {mode === 'file' && (
          <form onSubmit={handleSubmitFile} className="space-y-6">
            <div className="rounded-[2rem] bg-white/[0.015] border border-white/[0.05] p-2">
              <div className="rounded-[calc(2rem-0.5rem)] bg-[#0a0a0a] border border-white/[0.02] p-6 space-y-6">
                <div>
                  <label className="block text-[10px] font-bold tracking-[0.15em] text-gray-500 uppercase mb-3">
                    Chọn tệp tài liệu
                  </label>
                  
                  {/* Styled Drag & Drop Area feel */}
                  <div className="relative border border-dashed border-white/10 hover:border-white/20 rounded-2xl p-8 flex flex-col items-center justify-center transition-all bg-white/[0.01]">
                    <Upload size={32} className="text-gray-600 mb-3" />
                    <span className="text-xs text-gray-400 font-medium mb-1">Click để duyệt tệp tin</span>
                    <span className="text-[10px] text-gray-600">Hỗ trợ .txt, .csv, .docx, .pdf (Max 5MB)</span>
                    
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".txt,.csv,.docx,.pdf"
                      required
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>

                  {file && (
                    <div className="mt-3 flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-xs">
                      <span className="text-gray-300 font-mono line-clamp-1">{file.name}</span>
                      <span className="text-gray-600 flex-shrink-0">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  )}
                </div>

                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-[11px] leading-relaxed text-gray-500 space-y-2">
                  <div className="font-bold text-gray-400">📌 Quy chuẩn cấu trúc bảng trong tài liệu:</div>
                  <p>
                    Để hệ thống trích xuất tự động ngay lập tức (không qua AI), tài liệu Word (<code className="text-gray-300">.docx</code>) nên chứa bảng từ 2 đến 4 cột với cấu trúc:
                  </p>
                  {language === 'zh' ? (
                    <ul className="list-disc pl-4 space-y-1">
                      <li><strong className="text-gray-400">Cột 1:</strong> Số thứ tự (STT) - <span className="italic">Không bắt buộc</span>.</li>
                      <li><strong className="text-gray-400">Cột 2:</strong> Chữ Hán (Từ vựng chính).</li>
                      <li><strong className="text-gray-400">Cột 3:</strong> Phiên âm Pinyin - <span className="italic">Không bắt buộc</span>.</li>
                      <li><strong className="text-gray-400">Cột 4:</strong> Giải nghĩa sang tiếng Việt.</li>
                    </ul>
                  ) : (
                    <ul className="list-disc pl-4 space-y-1">
                      <li><strong className="text-gray-400">Cột 1:</strong> Số thứ tự (STT) - <span className="italic">Không bắt buộc</span>.</li>
                      <li><strong className="text-gray-400">Cột 2:</strong> Từ vựng / Thuật ngữ chính.</li>
                      <li><strong className="text-gray-400">Cột 3:</strong> Phiên âm quốc tế IPA - <span className="italic">Không bắt buộc</span>.</li>
                      <li><strong className="text-gray-400">Cột 4:</strong> Giải nghĩa sang tiếng Việt.</li>
                    </ul>
                  )}
                  <p className="text-[10px] text-gray-600 mt-2">
                    * Lưu ý: Nếu tài liệu không chứa bảng hoặc định dạng khác, hệ thống sẽ sử dụng AI để tự động đọc hiểu và trích xuất từ vựng phù hợp.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={status.type === 'loading' || !file || !deckName.trim()}
              className="group w-full flex items-center justify-between bg-white hover:bg-white/95 disabled:opacity-30 disabled:pointer-events-none text-black pl-6 pr-2.5 py-3.5 rounded-full font-bold text-sm transition-all duration-300 active:scale-[0.98]"
            >
              <span>{status.type === 'loading' ? 'Đang trích xuất dữ liệu...' : 'Tải lên & Trích xuất bằng AI'}</span>
              <div className="w-8 h-8 rounded-full bg-[#0a0a0a] text-white flex items-center justify-center transition-transform duration-500 group-hover:translate-x-1">
                <ArrowRight size={14} weight="bold" />
              </div>
            </button>
          </form>
        )}

        {/* Status message banner */}
        {status.type !== 'idle' && (
          <div className={`mt-6 flex items-center gap-3 p-4 rounded-2xl border text-xs font-semibold ${
            status.type === 'success'
              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
              : status.type === 'error'
              ? 'bg-red-500/5 border-red-500/20 text-red-400'
              : 'bg-purple-500/5 border-purple-500/20 text-purple-400'
          }`}>
            {status.type === 'success' && <CheckCircle size={18} className="flex-shrink-0" />}
            {status.type === 'error' && <WarningCircle size={18} className="flex-shrink-0" />}
            {status.type === 'loading' && <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />}
            {status.message}
          </div>
        )}

      </div>
    </div>
  );
};

export default DocumentImportPage;
