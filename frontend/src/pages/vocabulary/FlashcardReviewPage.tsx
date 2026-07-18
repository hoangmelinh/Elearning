import React, { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import httpClient from '../../services/httpClient';
import { ArrowLeft, CheckCircle, Warning, CircleNotch, ArrowCounterClockwise } from '@phosphor-icons/react';

const FlashcardReviewPage: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const [searchParams] = useSearchParams();
  const limitParam = searchParams.get('limit');
  const limit = limitParam === 'all' ? null : parseInt(limitParam || '20');
  const offset = parseInt(searchParams.get('offset') || '0');
  const mode = searchParams.get('mode') || 'sequential';

  const [cards, setCards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (deckId) fetchCards();
  }, [deckId]);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const response = await httpClient.get(`/decks/${deckId}/flashcards`);
      const fetched = response.data.data.cards || [];
      
      let subset = [];
      if (mode === 'random') {
        const shuffled = [...fetched].sort(() => Math.random() - 0.5);
        subset = limit ? shuffled.slice(0, limit) : shuffled;
      } else {
        subset = limit ? fetched.slice(offset, offset + limit) : fetched;
      }
      setCards(subset);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const markProgress = async (status: string) => {
    const currentCard = cards[currentIndex];
    try {
      await httpClient.patch(`/flashcards/${currentCard.id}/progress`, { status });
      handleNext();
    } catch (error) {
      console.error(error);
    }
  };

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Finished all cards in review
      setCurrentIndex(cards.length);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <CircleNotch size={32} className="text-purple-400 animate-spin" />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center gap-4 text-white">
        <p className="text-gray-400">Không tìm thấy thẻ học nào trong bộ này.</p>
        <Link to="/vocabulary" className="text-purple-400 hover:text-purple-300 transition-colors">← Quay lại thư viện</Link>
      </div>
    );
  }

  const isFinished = currentIndex >= cards.length;
  const card = cards[currentIndex];

  return (
    <div className="min-h-screen bg-transparent text-[#f5f5f5] pb-24 relative z-10">
      <div className="max-w-lg mx-auto px-6 pt-12">
        
        {/* Navigation back */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            to={`/vocabulary/decks/${deckId}`}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs font-semibold uppercase tracking-wider"
          >
            <ArrowLeft size={14} />
            Quay lại chi tiết
          </Link>
        </div>

        {isFinished ? (
          /* Finished State Screen (Double-Bezel) */
          <div className="rounded-[2.5rem] bg-white/[0.015] border border-white/[0.05] p-2 text-center shadow-[0_24px_50px_rgba(0,0,0,0.5)]">
            <div className="rounded-[calc(2.5rem-0.5rem)] bg-[#0a0a0a] border border-white/[0.02] py-16 px-6 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/20 flex items-center justify-center text-3xl mb-6">
                🎉
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Hoàn thành ôn tập!</h3>
              <p className="text-gray-500 text-xs max-w-xs mb-8 leading-relaxed">
                Bạn đã hoàn thành việc xem qua toàn bộ {cards.length} thẻ từ vựng trong bộ này.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={handleReset}
                  className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-white/95 text-black py-3.5 rounded-full font-bold text-xs transition-all active:scale-[0.98]"
                >
                  <ArrowCounterClockwise size={14} weight="bold" />
                  Học lại từ đầu
                </button>
                <Link
                  to="/vocabulary"
                  className="flex-1 flex items-center justify-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white py-3.5 rounded-full font-bold text-xs transition-all active:scale-[0.98]"
                >
                  Về thư viện
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Review Flow */
          <div className="flex flex-col items-center">
            
            {/* Header progress tracking */}
            <div className="mb-6 flex flex-col items-center">
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-semibold bg-white/[0.04] border border-white/[0.05] text-gray-400 mb-2">
                Flashcard
              </div>
              <div className="text-xs text-gray-500 font-medium">
                Thẻ {currentIndex + 1} trên {cards.length}
              </div>
            </div>

            {/* 3D Flashcard container with Double Bezel */}
            <div className="rounded-[2.5rem] bg-white/[0.015] border border-white/[0.05] p-2 w-full shadow-[0_24px_50px_rgba(0,0,0,0.4)] mb-8">
              <div 
                className="w-full h-80 card-3d-container cursor-pointer select-none"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div className={`card-3d-inner ${isFlipped ? 'flipped' : ''}`}>
                  
                  {/* Front Side Card (English Term) */}
                  <div className="card-3d-front bg-[#0a0a0a] border border-white/[0.03] flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-bold tracking-[0.2em] text-gray-600 uppercase mb-6">Mặt trước (Gợi ý)</span>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">{card.term}</h2>
                    {card.phonetic && (
                      <p className="text-sm text-gray-500 font-mono mt-3 bg-white/[0.03] px-3 py-1 rounded-full border border-white/[0.04]">
                        {card.phonetic}
                      </p>
                    )}
                    <span className="text-[10px] text-gray-600 mt-10">Click để xem nghĩa</span>
                  </div>
                  
                  {/* Back Side Card (Vietnamese Meaning) */}
                  <div className="card-3d-back bg-[#0c0c0c] border border-white/[0.03] flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-bold tracking-[0.2em] text-gray-600 uppercase mb-6">Mặt sau (Giải nghĩa)</span>
                    <h3 className="text-2xl font-bold text-emerald-400 tracking-tight">{card.meaning_vi}</h3>
                    {card.example_sentence && (
                      <p className="text-xs text-gray-500 italic mt-4 max-w-[85%] leading-relaxed">
                        "{card.example_sentence}"
                      </p>
                    )}
                    <span className="text-[10px] text-gray-600 mt-10">Click để lật lại</span>
                  </div>

                </div>
              </div>
            </div>

            {/* Answer Control Panels (conditional to state) */}
            <div className="w-full min-h-[70px]">
              {isFlipped && (
                <div className="flex gap-4 w-full animate-[scale_0.2s_ease-out]">
                  <button 
                    onClick={(e) => { e.stopPropagation(); markProgress('learning'); }}
                    className="flex-1 flex items-center justify-center gap-2 bg-amber-500/[0.08] hover:bg-amber-500/[0.15] border border-amber-500/25 text-amber-400 py-3.5 rounded-full font-bold text-xs transition-all duration-300 active:scale-[0.97]"
                  >
                    <Warning size={15} />
                    Cần ôn tập
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); markProgress('mastered'); }}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-black hover:bg-emerald-400 py-3.5 rounded-full font-bold text-xs transition-all duration-300 active:scale-[0.97] shadow-lg shadow-emerald-500/10"
                  >
                    <CheckCircle size={15} weight="bold" />
                    Đã thuộc
                  </button>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardReviewPage;
