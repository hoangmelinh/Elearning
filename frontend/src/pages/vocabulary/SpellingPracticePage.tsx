import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import httpClient from '../../services/httpClient';
import { CheckCircle, XCircle, ArrowLeft, Trophy, ArrowCounterClockwise } from '@phosphor-icons/react';

interface Flashcard {
  id: string;
  term: string;
  phonetic?: string;
  meaning_vi: string;
  example_sentence?: string;
}

type CardStatus = 'idle' | 'typing' | 'correct' | 'wrong';

interface CardState {
  input: string;
  status: CardStatus;
}

/* ── Normalisation ───────────────────────────────────────── */
const normalize = (str: string): string =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[āáǎà]/g, 'a')
    .replace(/[ēéěè]/g, 'e')
    .replace(/[īíǐì]/g, 'i')
    .replace(/[ōóǒò]/g, 'o')
    .replace(/[ūúǔùǖǘǚǜü]/g, 'u')
    .trim();

/* ── UI Color maps for Double-Bezel and text elements ── */
const borderColor: Record<CardStatus, string> = {
  idle:    'border-white/[0.04] hover:border-white/[0.08]',
  typing:  'border-purple-500/[0.25]',
  correct: 'border-emerald-500/[0.3]',
  wrong:   'border-red-500/[0.3]',
};

const rowBg: Record<CardStatus, string> = {
  idle:    'bg-white/[0.01]',
  typing:  'bg-white/[0.01]',
  correct: 'bg-emerald-500/[0.02]',
  wrong:   'bg-red-500/[0.02]',
};

const inputColor: Record<CardStatus, string> = {
  idle:    'text-white border-white/[0.1] focus:border-white/20',
  typing:  'text-white border-purple-500/40 focus:border-purple-400/60',
  correct: 'text-emerald-400 border-emerald-500/20',
  wrong:   'text-red-400 border-red-500/20',
};

const SpellingPracticePage: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const [searchParams] = useSearchParams();
  const limitParam = searchParams.get('limit');
  const limit = limitParam === 'all' ? null : parseInt(limitParam || '20');
  const offset = parseInt(searchParams.get('offset') || '0');
  const mode = searchParams.get('mode') || 'sequential';

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [states, setStates] = useState<CardState[]>([]);
  const [loading, setLoading] = useState(true);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (deckId) fetchCards();
  }, [deckId]);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const res = await httpClient.get(`/decks/${deckId}/flashcards`);
      const fetchedRaw: any[] = res.data.data.cards ?? [];
      
      const fetched: Flashcard[] = fetchedRaw.map(c => ({
        ...c,
        meaning_vi: c.meaning_vi || c.meaningVi || '',
        example_sentence: c.example_sentence || c.exampleSentence || ''
      }));

      let subset: Flashcard[] = [];
      if (mode === 'random') {
        const shuffled = [...fetched].sort(() => Math.random() - 0.5);
        subset = limit ? shuffled.slice(0, limit) : shuffled;
      } else {
        // Sequential mode with offset
        subset = limit ? fetched.slice(offset, offset + limit) : fetched;
      }
      
      setCards(subset);
      setStates(subset.map(() => ({ input: '', status: 'idle' })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStates(cards.map(() => ({ input: '', status: 'idle' })));
    setCorrectCount(0);
    setFinished(false);
    setTimeout(() => inputRefs.current[0]?.focus(), 50);
  };

  const focusNext = useCallback((fromIndex: number) => {
    for (let i = fromIndex + 1; i < cards.length; i++) {
      const s = states[i]?.status;
      if (s !== 'correct' && s !== 'wrong') {
        setTimeout(() => inputRefs.current[i]?.focus(), 100);
        return;
      }
    }
    
    setTimeout(() => {
      setStates(currentStates => {
        const allDone = currentStates.every(s => s.status === 'correct' || s.status === 'wrong');
        if (allDone) {
          setFinished(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return currentStates;
      });
    }, 200);
  }, [cards.length, states]);

  const handleChange = (index: number, value: string) => {
    setStates(prev => {
      if (prev[index].status === 'correct' || prev[index].status === 'wrong') return prev;
      const next = [...prev];
      next[index] = {
        input: value,
        status: value ? 'typing' : 'idle',
      };
      return next;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const state = states[index];
      if (state.status === 'correct' || state.status === 'wrong') {
        focusNext(index);
        return;
      }

      const card = cards[index];
      const isCorrect = normalize(state.input) === normalize(card.term);

      setStates(prev => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          status: isCorrect ? 'correct' : 'wrong'
        };
        return next;
      });

      if (isCorrect) {
        setCorrectCount(c => c + 1);
        setTimeout(() => focusNext(index), 250);
      } else {
        setTimeout(() => focusNext(index), 600);
      }
    }
  };

  const answered = states.filter(s => s.status === 'correct' || s.status === 'wrong').length;
  const progress = cards.length > 0 ? Math.round((answered / cards.length) * 100) : 0;
  const percentage = cards.length > 0 ? Math.round((correctCount / cards.length) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4 text-white">
        <p className="text-gray-400">Bộ thẻ này chưa có từ vựng nào.</p>
        <Link to="/vocabulary" className="text-purple-400 hover:text-purple-300 transition-colors">← Quay lại</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-[#f5f5f5] pb-32 relative z-10">
      <div className="max-w-4xl mx-auto px-6 pt-12">

        {/* Back and restart actions */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/vocabulary" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs font-semibold uppercase tracking-wider">
            <ArrowLeft size={14} />
            Quay lại
          </Link>
          <button 
            onClick={handleReset} 
            className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors text-xs font-semibold uppercase tracking-wider"
          >
            <ArrowCounterClockwise size={14} />
            Làm lại
          </button>
        </div>

        {/* Header Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-semibold bg-white/[0.04] border border-white/[0.05] text-gray-400 mb-3">
            Luyện trí nhớ
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Luyện viết chính tả</h1>
          <p className="text-gray-500 text-xs">Gõ từ tương ứng với nghĩa và ấn Enter để kiểm tra đáp án.</p>
        </div>

        {/* Live progress details */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Đã gõ {answered} / {cards.length} từ</span>
            <span className="text-emerald-400 font-bold">{correctCount} chính xác</span>
          </div>
          <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-emerald-500 rounded-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Score banner on finish with Double-Bezel Architecture */}
        {finished && (
          <div className="rounded-[2.5rem] bg-white/[0.015] border border-white/[0.05] p-2 mb-10 shadow-[0_24px_50px_rgba(0,0,0,0.5)]">
            <div className={`rounded-[calc(2.5rem-0.5rem)] border border-white/[0.02] p-8 flex flex-col md:flex-row items-center justify-between gap-6 ${
              percentage >= 80 ? 'bg-emerald-500/[0.02]' :
              percentage >= 50 ? 'bg-amber-500/[0.02]' :
                                 'bg-red-500/[0.02]'
            }`}>
              <div className="flex items-center gap-5 text-center md:text-left">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-3xl">
                  {percentage >= 80 ? '🏆' : percentage >= 50 ? '🥈' : '⚡'}
                </div>
                <div>
                  <div className="text-2xl font-bold tracking-tight text-white">
                    Kết quả: {correctCount}/{cards.length} từ đúng
                  </div>
                  <p className="text-gray-500 text-xs mt-1 max-w-sm">
                    {percentage >= 80 ? 'Tuyệt vời! Kỹ năng ghi nhớ của bạn đạt chuẩn Awwwards.' : percentage >= 50 ? 'Rất tốt! Luyện tập thêm để đạt độ hoàn hảo nhé.' : 'Tiếp tục luyện tập để cải thiện phản xạ từ vựng.'}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleReset}
                className="flex items-center gap-2 bg-white hover:bg-white/95 text-black px-6 py-3 rounded-full font-bold text-xs transition-all active:scale-[0.98]"
              >
                <ArrowCounterClockwise size={14} weight="bold" />
                Luyện lại ngay
              </button>
            </div>
          </div>
        )}

        {/* Headers */}
        <div className="grid grid-cols-[1fr_1fr] gap-6 mb-3 px-6 text-[10px] font-bold tracking-[0.2em] text-gray-600 uppercase">
          <div>Ý nghĩa / Phiên âm</div>
          <div>Nhập từ vựng</div>
        </div>

        {/* Card rows (Double-Bezel Row Archetype) */}
        <div className="space-y-3">
          {cards.map((card, index) => {
            const state = states[index] ?? { input: '', status: 'idle' };
            const st = state.status;
            const isDone = st === 'correct' || st === 'wrong';

            return (
              <div
                key={card.id}
                className={`rounded-2xl border p-1.5 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${borderColor[st]} ${rowBg[st]}`}
              >
                <div className="rounded-[calc(1rem)] bg-[#090909] border border-white/[0.01] px-5 py-4 grid grid-cols-[1fr_1fr] gap-6 items-center">
                  
                  {/* Left Column: Meaning & Phonetic */}
                  <div className="border-r border-white/5 pr-4">
                    <div className="text-white font-semibold text-sm tracking-tight">{card.meaning_vi}</div>
                    {card.phonetic && (
                      <div className="text-xs text-gray-500 font-mono mt-1">{card.phonetic}</div>
                    )}
                  </div>

                  {/* Right Column: Input Box */}
                  <div className="flex items-center gap-4">
                    <input
                      ref={el => { inputRefs.current[index] = el; }}
                      id={`spell-${index}`}
                      type="text"
                      value={state.input}
                      onChange={e => handleChange(index, e.target.value)}
                      onKeyDown={e => handleKeyDown(e, index)}
                      disabled={isDone}
                      placeholder={isDone ? '' : 'Nhập từ vựng...'}
                      autoComplete="off"
                      spellCheck={false}
                      className={`
                        flex-1 bg-transparent outline-none font-bold placeholder-gray-800
                        border-b pb-1 transition-all duration-300 text-sm
                        ${inputColor[st]}
                        ${isDone ? 'cursor-default' : ''}
                      `}
                    />

                    {/* Interactive States */}
                    {st === 'correct' && (
                      <CheckCircle size={20} weight="duotone" className="text-emerald-400 flex-shrink-0 animate-[scale_0.15s_ease-out]" />
                    )}
                    
                    {st === 'wrong' && (
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <XCircle size={20} weight="duotone" className="text-red-400" />
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/[0.06] border border-emerald-500/10 px-2.5 py-1 rounded-lg">
                          {card.term}
                        </span>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* Hint text footer */}
        {!finished && (
          <p className="text-center text-xs text-gray-600 mt-10">
            Gõ đáp án và nhấn <kbd className="px-1.5 py-0.5 bg-white/[0.04] border border-white/[0.08] rounded text-gray-500">Enter</kbd> &nbsp;•&nbsp; Bỏ trống & Enter để xem luôn đáp án.
          </p>
        )}
      </div>
    </div>
  );
};

export default SpellingPracticePage;
