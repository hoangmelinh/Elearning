import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import httpClient from '../../services/httpClient';
import {
  ArrowLeft, Cards, Trash, BookOpen,
  ArrowsLeftRight, PenNib, CircleNotch, Plus,
  CaretLeft, CaretRight
} from '@phosphor-icons/react';

interface Flashcard {
  id: string;
  term: string;
  phonetic?: string;
  meaning_vi: string;
  example_sentence?: string;
  is_ai_generated: boolean;
}

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 120_000; // stop polling after 2 minutes
const ITEMS_PER_PAGE = 20;

const DeckDetailPage: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deckName, setDeckName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activePracticeType, setActivePracticeType] = useState<'review' | 'match' | 'spelling' | null>(null);
  const [selectedLimit, setSelectedLimit] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollStartRef = useRef<number>(0);

  const closeModal = () => {
    setActivePracticeType(null);
    setSelectedLimit(null);
  };

  useEffect(() => {
    if (deckId) {
      fetchDeckInfo();
      fetchCards(true);
    }
    return () => stopPolling();
  }, [deckId]);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const fetchDeckInfo = async () => {
    try {
      const response = await httpClient.get(`/decks/${deckId}`);
      if (response.data?.data) {
        setDeckName(response.data.data.name);
      }
    } catch (error) {
      console.error('Error fetching deck info:', error);
    }
  };

  const fetchCards = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const response = await httpClient.get(`/decks/${deckId}/flashcards`);
      const fetched: Flashcard[] = response.data.data.cards || [];
      setCards(fetched);

      if (fetched.length === 0) {
        if (!pollRef.current) {
          setIsProcessing(true);
          pollStartRef.current = Date.now();
          pollRef.current = setInterval(async () => {
            if (Date.now() - pollStartRef.current > POLL_TIMEOUT_MS) {
              stopPolling();
              setIsProcessing(false);
              return;
            }
            try {
              const r = await httpClient.get(`/decks/${deckId}/flashcards`);
              const updated: Flashcard[] = r.data.data.cards || [];
              setCards(updated);
              if (updated.length > 0) {
                stopPolling();
                setIsProcessing(false);
              }
            } catch { /* ignore poll errors */ }
          }, POLL_INTERVAL_MS);
        }
      } else {
        stopPolling();
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error fetching cards:', error);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      await httpClient.delete(`/flashcards/${cardId}`);
      setCards(prev => prev.filter(c => c.id !== cardId));
      
      // Auto adjust page if last item on current page is deleted
      const totalPagesAfterDelete = Math.ceil((cards.length - 1) / ITEMS_PER_PAGE);
      if (currentPage > totalPagesAfterDelete && totalPagesAfterDelete > 0) {
        setCurrentPage(totalPagesAfterDelete);
      }
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  };

  const totalPages = Math.ceil(cards.length / ITEMS_PER_PAGE);
  const paginatedCards = cards.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <CircleNotch size={36} className="text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-[#f5f5f5] pb-24 relative z-10">
      <div className="max-w-4xl mx-auto px-6 pt-12">

        {/* Back navigation */}
        <div className="mb-8">
          <Link
            to="/vocabulary"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs font-semibold uppercase tracking-wider"
          >
            <ArrowLeft size={14} />
            Quay lại thư viện
          </Link>
        </div>

        {/* Title and stats */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pb-8 border-b border-white/[0.05]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-semibold bg-white/[0.04] border border-white/[0.05] text-gray-400 mb-3">
              Chi tiết bộ thẻ
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
              {deckName || 'Danh sách từ vựng'}
            </h1>
            <p className="text-gray-500 text-sm mt-1.5">{cards.length} thẻ từ đang hoạt động</p>
          </div>

          {/* Premium Practice Quick Buttons */}
          {cards.length > 0 && (
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => setActivePracticeType('review')}
                className="flex items-center gap-2 px-4.5 py-2.5 bg-emerald-500/[0.06] hover:bg-emerald-500/[0.12] border border-emerald-500/[0.15] text-emerald-400 rounded-full text-xs font-bold transition-all active:scale-[0.98]"
              >
                <BookOpen size={15} />
                Học bài
              </button>
              <button
                onClick={() => setActivePracticeType('match')}
                className="flex items-center gap-2 px-4.5 py-2.5 bg-indigo-500/[0.06] hover:bg-indigo-500/[0.12] border border-indigo-500/[0.15] text-indigo-400 rounded-full text-xs font-bold transition-all active:scale-[0.98]"
              >
                <ArrowsLeftRight size={15} />
                Nối từ
              </button>
              <button
                onClick={() => setActivePracticeType('spelling')}
                className="flex items-center gap-2 px-4.5 py-2.5 bg-amber-500/[0.06] hover:bg-amber-500/[0.12] border border-amber-500/[0.15] text-amber-400 rounded-full text-xs font-bold transition-all active:scale-[0.98]"
              >
                <PenNib size={15} />
                Luyện viết
              </button>
            </div>
          )}
        </div>

        {/* Processing / Empty state with Double-Bezel and soft gradients */}
        {cards.length === 0 && (
          <div
            className="rounded-[2.5rem] bg-white/[0.01] border p-2 backdrop-blur-3xl transition-all duration-500"
            style={{ borderColor: isProcessing ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.05)' }}
          >
            <div className="rounded-[calc(2.5rem-0.5rem)] bg-[#0a0a0a] border border-white/[0.02] py-24 px-6 flex flex-col items-center justify-center text-center">
              {isProcessing ? (
                <>
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-purple-500/10 blur-xl rounded-full" />
                    <CircleNotch size={48} className="text-purple-400 animate-spin relative z-10" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 tracking-tight">AI đang xử lý tài liệu của bạn...</h3>
                  <p className="text-gray-500 text-sm max-w-sm mb-6 leading-relaxed">
                    Hệ thống đang trích xuất từ vựng, phiên âm và ví dụ thực tế. Danh sách sẽ tự động hiển thị khi hoàn thành.
                  </p>
                  
                  {/* Subtle kinetic bar indicator */}
                  <div className="flex gap-2">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-purple-400/80"
                        style={{ animation: `pulse-slow 1.2s ease-in-out ${i * 0.2}s infinite` }}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <Cards size={48} className="text-gray-600 mb-6" weight="duotone" />
                  <h3 className="text-xl font-bold text-gray-400 mb-2">Chưa có thẻ từ vựng nào</h3>
                  <p className="text-gray-600 text-xs max-w-xs mb-8 leading-relaxed">
                    Có vẻ như bộ thẻ này đang trống hoặc quá trình trích xuất tài liệu đã dừng lại.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => fetchCards(true)}
                      className="px-5 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white rounded-full text-xs font-bold transition-all active:scale-[0.98]"
                    >
                      Tải lại
                    </button>
                    <Link
                      to="/vocabulary/import"
                      className="group flex items-center gap-2 bg-white hover:bg-white/95 text-black px-5 py-2.5 rounded-full font-bold text-xs transition-all active:scale-[0.98]"
                    >
                      <span>Import tài liệu mới</span>
                      <Plus size={14} weight="bold" />
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Card list - Custom Double-Bezel list rows */}
        {cards.length > 0 && (
          <div className="space-y-3">
            {/* Headers */}
            <div className="grid grid-cols-[1.5fr_2fr_auto] gap-6 px-6 py-2 text-[10px] font-bold tracking-[0.2em] text-gray-600 uppercase">
              <div>Từ vựng / Phiên âm</div>
              <div>Giải nghĩa & Ví dụ</div>
              <div></div>
            </div>

            {paginatedCards.map((card) => (
              <div
                key={card.id}
                className="rounded-2xl bg-white/[0.01] border border-white/[0.04] p-1.5 transition-all duration-300 hover:bg-white/[0.025] hover:border-white/[0.08] group"
              >
                <div className="rounded-[calc(1rem)] bg-[#090909] border border-white/[0.01] px-5 py-4 grid grid-cols-[1.5fr_2fr_auto] gap-6 items-center">
                  
                  {/* Word Column */}
                  <div>
                    <div className="font-bold text-white tracking-tight">{card.term}</div>
                    {card.phonetic && (
                      <div className="text-xs text-gray-500 font-mono mt-1">{card.phonetic}</div>
                    )}
                  </div>

                  {/* Meaning & Example Column */}
                  <div className="space-y-1">
                    <div className="text-gray-300 text-sm leading-relaxed">{card.meaning_vi}</div>
                    {card.example_sentence && (
                      <div className="text-xs text-gray-600 italic">
                        "{card.example_sentence}"
                      </div>
                    )}
                  </div>

                  {/* Badges / Delete Actions */}
                  <div className="flex items-center gap-3">
                    {card.is_ai_generated && (
                      <span className="text-[9px] font-extrabold tracking-wider text-purple-400 bg-purple-500/[0.08] border border-purple-500/[0.12] px-2 py-0.5 rounded-full select-none">
                        AI
                      </span>
                    )}
                    <button
                      onClick={() => handleDeleteCard(card.id)}
                      className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      title="Xóa từ này"
                    >
                      <Trash size={14} />
                    </button>
                  </div>

                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between border-t border-white/[0.05] pt-6">
                <div className="text-xs text-gray-500 font-medium">
                  Hiển thị <span className="text-white">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="text-white">{Math.min(currentPage * ITEMS_PER_PAGE, cards.length)}</span> trên tổng <span className="text-white">{cards.length}</span> từ vựng
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-10 h-10 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-gray-400 hover:bg-white/[0.05] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
                  >
                    <CaretLeft size={16} weight="bold" />
                  </button>
                  <div className="px-4 text-sm font-bold text-gray-300">
                    {currentPage} / {totalPages}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-10 h-10 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-gray-400 hover:bg-white/[0.05] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
                  >
                    <CaretRight size={16} weight="bold" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Practice Limit Selection Modal */}
        {activePracticeType && (
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
                        to={`/vocabulary/decks/${deckId}/${activePracticeType}?limit=all`}
                        onClick={closeModal}
                        className="col-span-2 py-3 px-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] text-xs font-bold text-gray-200 hover:text-white transition-all flex flex-col items-center"
                      >
                        <span className="text-sm font-extrabold">Tất cả ({cards.length} từ)</span>
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
                        to={`/vocabulary/decks/${deckId}/${activePracticeType}?limit=${selectedLimit}&mode=random`}
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
                          {[...Array(Math.ceil(cards.length / selectedLimit))].map((_, i) => {
                            const start = i * selectedLimit + 1;
                            const end = Math.min((i + 1) * selectedLimit, cards.length);
                            return (
                              <Link
                                key={i}
                                to={`/vocabulary/decks/${deckId}/${activePracticeType}?limit=${selectedLimit}&offset=${i * selectedLimit}&mode=sequential`}
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
    </div>
  );
};

export default DeckDetailPage;
