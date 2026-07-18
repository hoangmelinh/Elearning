import React, { useEffect, useState } from 'react';
import httpClient from '../../services/httpClient';
import { Link } from 'react-router-dom';
import { Trash, BookOpen, ArrowsLeftRight, PenNib, Eye, Plus, ArrowRight, CircleNotch } from '@phosphor-icons/react';

interface Deck {
  id: string;
  name: string;
  language: string;
  created_at: string;
  public: boolean;
}

const DeckListPage: React.FC = () => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // States cho Modal chọn số lượng và khoảng từ ôn tập
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [activePracticeType, setActivePracticeType] = useState<'review' | 'match' | 'spelling' | null>(null);
  const [selectedLimit, setSelectedLimit] = useState<number | null>(null);
  const [loadingCards, setLoadingCards] = useState(false);
  const [deckCardsCount, setDeckCardsCount] = useState(0);

  useEffect(() => {
    fetchDecks();
  }, []);

  const closeModal = () => {
    setActiveDeckId(null);
    setActivePracticeType(null);
    setSelectedLimit(null);
    setDeckCardsCount(0);
  };

  const handlePracticeClick = async (deckId: string, type: 'review' | 'match' | 'spelling') => {
    try {
      setLoadingCards(true);
      setActiveDeckId(deckId);
      setActivePracticeType(type);
      
      const response = await httpClient.get(`/decks/${deckId}/flashcards`);
      const fetchedCards = response.data.data.cards || [];
      setDeckCardsCount(fetchedCards.length);
    } catch (error) {
      console.error('Error fetching cards count:', error);
      closeModal();
    } finally {
      setLoadingCards(false);
    }
  };

  const fetchDecks = async () => {
    try {
      const response = await httpClient.get('/decks?visibility=own&size=50');
      setDecks(response.data.data.data || []);
    } catch (error) {
      console.error('Error fetching decks:', error);
    }
  };

  const handleDeleteDeck = async (deckId: string) => {
    setDeletingId(deckId);
    try {
      await httpClient.delete(`/decks/${deckId}`);
      setDecks(prev => prev.filter(d => d.id !== deckId));
      setConfirmDeleteId(null);
    } catch (error) {
      console.error('Error deleting deck:', error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-[#f5f5f5] pb-24 relative z-10">
      <div className="max-w-6xl mx-auto px-6 pt-12">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-semibold bg-white/[0.04] border border-white/[0.05] text-gray-400 mb-3">
              Hệ thống từ vựng
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white leading-tight">Bộ từ vựng của bạn</h1>
            <p className="text-gray-500 text-sm mt-1.5">{decks.length} bộ thẻ được lưu trữ</p>
          </div>

          {/* Island Button with trailing circle icon */}
          <Link
            to="/vocabulary/import"
            className="group flex items-center justify-between gap-4 bg-white hover:bg-white/95 text-black pl-6 pr-2.5 py-2.5 rounded-full font-bold text-sm transition-all duration-300 shadow-[0_4px_20px_rgba(255,255,255,0.08)] hover:shadow-[0_4px_25px_rgba(255,255,255,0.15)] active:scale-[0.98] w-fit"
          >
            <span>Import Tài liệu AI</span>
            <div className="w-8 h-8 rounded-full bg-[#0a0a0a] text-white flex items-center justify-center transition-transform duration-500 group-hover:rotate-90">
              <Plus size={16} weight="bold" />
            </div>
          </Link>
        </div>

        {/* Empty state */}
        {decks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-36 rounded-[2.5rem] bg-white/[0.01] border border-white/[0.05] backdrop-blur-3xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
            <div className="text-5xl mb-6 select-none opacity-80 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">📚</div>
            <h3 className="text-xl font-bold text-white mb-2">Chưa có bộ từ vựng nào</h3>
            <p className="text-gray-500 text-sm mb-8 text-center max-w-sm px-6">
              Tải lên tài liệu giảng dạy hoặc tài liệu cá nhân để AI phân tích và tạo bộ flashcard cho riêng bạn.
            </p>
            <Link
              to="/vocabulary/import"
              className="group flex items-center justify-between gap-4 bg-white hover:bg-white/95 text-black pl-6 pr-2.5 py-2.5 rounded-full font-bold text-sm transition-all duration-300 active:scale-[0.98]"
            >
              <span>Tạo bộ thẻ đầu tiên</span>
              <div className="w-8 h-8 rounded-full bg-[#0a0a0a] text-white flex items-center justify-center transition-transform duration-500 group-hover:translate-x-1">
                <ArrowRight size={14} weight="bold" />
              </div>
            </Link>
          </div>
        )}

        {/* Deck grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map(deck => (
            /* Double-Bezel Card Archetype (Machined Hardware Vibe) */
            <div
              key={deck.id}
              className="rounded-[2rem] bg-white/[0.015] border border-white/[0.05] p-2 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/[0.03] hover:border-white/[0.09] hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.4)] group"
            >
              <div className="rounded-[calc(2rem-0.5rem)] bg-[#0a0a0a] border border-white/[0.02] p-6 flex flex-col justify-between h-full min-h-[220px]">
                
                {/* Top deck info */}
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-white/[0.04] border border-white/[0.05] text-gray-400">
                      {deck.language === 'zh' ? '🇨🇳 Tiếng Trung' : '🇬🇧 Tiếng Anh'}
                    </span>
                    
                    {/* Tiny delete button */}
                    <button
                      onClick={() => setConfirmDeleteId(deck.id)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      title="Xóa bộ thẻ"
                    >
                      <Trash size={15} />
                    </button>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mt-4 leading-tight tracking-tight group-hover:text-purple-300 transition-colors duration-300 line-clamp-2">
                    {deck.name}
                  </h3>
                </div>

                {/* Grid of Action buttons */}
                <div className="grid grid-cols-2 gap-2 mt-8">
                  <Link
                    to={`/vocabulary/decks/${deck.id}`}
                    className="flex items-center justify-center gap-1.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] text-gray-300 hover:text-white px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300"
                  >
                    <Eye size={14} />
                    Xem thẻ
                  </Link>
                  <button
                    onClick={() => handlePracticeClick(deck.id, 'review')}
                    className="flex items-center justify-center gap-1.5 bg-emerald-500/[0.05] hover:bg-emerald-500/[0.12] border border-emerald-500/[0.12] text-emerald-400 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300"
                  >
                    <BookOpen size={14} />
                    Học bài
                  </button>
                  <button
                    onClick={() => handlePracticeClick(deck.id, 'match')}
                    className="flex items-center justify-center gap-1.5 bg-indigo-500/[0.05] hover:bg-indigo-500/[0.12] border border-indigo-500/[0.12] text-indigo-400 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300"
                  >
                    <ArrowsLeftRight size={14} />
                    Nối từ
                  </button>
                  <button
                    onClick={() => handlePracticeClick(deck.id, 'spelling')}
                    className="flex items-center justify-center gap-1.5 bg-amber-500/[0.05] hover:bg-amber-500/[0.12] border border-amber-500/[0.12] text-amber-400 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300"
                  >
                    <PenNib size={14} />
                    Luyện viết
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirm delete modal (Glassmorphism & Double-Bezel) */}
      {confirmDeleteId && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all duration-300"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="rounded-[2rem] bg-white/[0.02] border border-white/[0.08] p-2 max-w-sm w-full shadow-[0_24px_50px_rgba(0,0,0,0.8)] animate-[scale_0.2s_ease-out]"
            onClick={e => e.stopPropagation()}
          >
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#0d0d0d] border border-white/[0.03] p-8 text-center">
              <div className="text-4xl mb-4 select-none">🗑️</div>
              <h3 className="text-xl font-bold text-white mb-2">Xóa bộ thẻ?</h3>
              <p className="text-gray-400 text-xs leading-relaxed mb-8">
                Hành động này sẽ xóa toàn bộ thẻ từ vựng trong bộ này và không thể hoàn tác. Bạn chắc chắn chứ?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 py-3 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-white rounded-full font-bold text-xs transition-all duration-300 active:scale-[0.97]"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleDeleteDeck(confirmDeleteId)}
                  disabled={deletingId === confirmDeleteId}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-full font-bold text-xs transition-all duration-300 active:scale-[0.97] shadow-lg shadow-red-600/20"
                >
                  {deletingId === confirmDeleteId ? 'Đang xóa...' : 'Xóa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Loading cards modal */}
      {loadingCards && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]">
          <div className="p-6 rounded-[2rem] bg-zinc-900/90 border border-white/5 flex flex-col items-center gap-3">
            <CircleNotch size={32} className="text-purple-400 animate-spin" />
            <span className="text-xs text-gray-400 font-semibold tracking-wide uppercase">Đang tải thông tin từ vựng...</span>
          </div>
        </div>
      )}

      {/* Practice Limit Selection Modal */}
      {activePracticeType && activeDeckId && !loadingCards && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-md rounded-[2.5rem] bg-white/[0.015] border border-white/[0.06] p-1.5 shadow-[0_24px_50px_rgba(0,0,0,0.6)]">
            <div className="rounded-[calc(2.5rem-0.375rem)] bg-[#0a0a0a] border border-white/[0.01] p-6">
              
              {selectedLimit === null ? (
                /* ── STEP 1: Select Size ── */
                <div className="text-center">
                  <h3 className="text-lg font-bold text-white mb-1">Số lượng từ ôn tập</h3>
                  <p className="text-xs text-gray-500 mb-6">Chọn số lượng từ vựng bạn muốn luyện tập</p>
                  
                  <div className="grid grid-cols-2 gap-2.5 mb-6">
                    {[10, 20, 30, 50].map((num) => (
                      <button
                        key={num}
                        onClick={() => setSelectedLimit(num)}
                        className="py-3 px-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] hover:border-white/[0.12] text-xs font-bold text-gray-300 hover:text-white transition-all flex flex-col items-center gap-0.5"
                      >
                        <span className="text-base text-purple-400 font-extrabold">{num}</span>
                        <span className="text-[10px] text-gray-500 font-normal">Từ vựng</span>
                      </button>
                    ))}
                    
                    <Link
                      to={`/vocabulary/decks/${activeDeckId}/${activePracticeType}?limit=all`}
                      onClick={closeModal}
                      className="col-span-2 py-3 px-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] text-xs font-bold text-gray-200 hover:text-white transition-all flex flex-col items-center"
                    >
                      <span className="text-sm font-extrabold">Tất cả ({deckCardsCount} từ)</span>
                    </Link>
                  </div>

                  <button
                    onClick={closeModal}
                    className="w-full py-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] text-xs font-bold text-gray-400 hover:text-white rounded-full transition-all"
                  >
                    Hủy bỏ
                  </button>
                </div>
              ) : (
                /* ── STEP 2: Select Mode & Range ── */
                <div>
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-bold text-white mb-1">Chế độ ôn tập ({selectedLimit} từ)</h3>
                    <p className="text-xs text-gray-500">Chọn khoảng từ cụ thể hoặc trộn ngẫu nhiên</p>
                  </div>

                  <div className="space-y-4 mb-6">
                    {/* Random option */}
                    <Link
                      to={`/vocabulary/decks/${activeDeckId}/${activePracticeType}?limit=${selectedLimit}&mode=random`}
                      onClick={closeModal}
                      className="w-full py-3 px-4 rounded-2xl bg-purple-500/[0.06] hover:bg-purple-500/[0.12] border border-purple-500/[0.15] hover:border-purple-500/[0.25] text-xs font-bold text-purple-300 hover:text-purple-200 transition-all flex items-center justify-between"
                    >
                      <span>🎲 Trộn ngẫu nhiên {selectedLimit} từ</span>
                      <span className="text-[10px] font-normal text-purple-400/80">Xáo trộn</span>
                    </Link>

                    {/* Ranges option */}
                    <div className="border-t border-white/[0.05] pt-4">
                      <div className="text-[10px] font-bold tracking-[0.1em] text-gray-500 uppercase mb-2">Học theo thứ tự:</div>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                        {[...Array(Math.ceil(deckCardsCount / selectedLimit))].map((_, i) => {
                          const start = i * selectedLimit + 1;
                          const end = Math.min((i + 1) * selectedLimit, deckCardsCount);
                          return (
                            <Link
                              key={i}
                              to={`/vocabulary/decks/${activeDeckId}/${activePracticeType}?limit=${selectedLimit}&offset=${i * selectedLimit}&mode=sequential`}
                              onClick={closeModal}
                              className="py-2.5 px-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] text-[11px] font-medium text-gray-300 hover:text-white transition-all text-center"
                            >
                              Từ {start} - {end}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedLimit(null)}
                      className="flex-1 py-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] text-xs font-bold text-gray-400 hover:text-white rounded-full transition-all"
                    >
                      Quay lại
                    </button>
                    <button
                      onClick={closeModal}
                      className="flex-1 py-3 bg-white/[0.02] hover:bg-white/[0.04] border border-transparent text-xs font-bold text-gray-600 hover:text-gray-400 rounded-full transition-all"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeckListPage;
