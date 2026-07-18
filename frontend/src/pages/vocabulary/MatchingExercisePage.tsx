import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import httpClient from '../../services/httpClient';

const MatchingExercisePage: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const [searchParams] = useSearchParams();
  const limitParam = searchParams.get('limit');
  // Đối với nối từ, mặc định là 10 cặp từ để vừa vặn màn hình
  const limit = limitParam === 'all' ? 30 : parseInt(limitParam || '10');
  const offset = parseInt(searchParams.get('offset') || '0');
  const mode = searchParams.get('mode') || 'sequential';

  const [pairs, setPairs] = useState<any[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [selectedMeaning, setSelectedMeaning] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [startTime] = useState(Date.now());
  const [score, setScore] = useState(0);

  const [shuffledTerms, setShuffledTerms] = useState<any[]>([]);
  const [shuffledMeanings, setShuffledMeanings] = useState<any[]>([]);

  useEffect(() => {
    if (deckId) fetchMatchingGame();
  }, [deckId]);

  const shuffleArray = (array: any[]) => {
    return [...array].sort(() => Math.random() - 0.5);
  };

  const fetchMatchingGame = async () => {
    try {
      const response = await httpClient.get(`/decks/${deckId}/flashcards`);
      const allCards = response.data.data.cards || [];
      
      let selectedCards = [];
      if (mode === 'random') {
        const shuffled = [...allCards].sort(() => Math.random() - 0.5);
        selectedCards = limit ? shuffled.slice(0, limit) : shuffled;
      } else {
        selectedCards = limit ? allCards.slice(offset, offset + limit) : allCards;
      }
      
      const fetchedPairs = selectedCards.map((card: any) => ({
        card_id: card.id,
        term: card.term,
        meaning_vi: card.meaning_vi
      }));

      setPairs(fetchedPairs);
      setShuffledTerms(shuffleArray(fetchedPairs.map((p: any) => ({ card_id: p.card_id, term: p.term }))));
      setShuffledMeanings(shuffleArray(fetchedPairs.map((p: any) => ({ card_id: p.card_id, meaning_vi: p.meaning_vi }))));
    } catch (error) {
      console.error(error);
    }
  };

  const handleTermClick = (id: string) => setSelectedTerm(id);
  const handleMeaningClick = (id: string) => {
    setSelectedMeaning(id);
    if (selectedTerm === id) {
      setMatchedPairs([...matchedPairs, id]);
      setScore(s => s + 10);
      setSelectedTerm(null);
      setSelectedMeaning(null);
      checkCompletion([...matchedPairs, id]);
    } else {
      setTimeout(() => {
        setSelectedTerm(null);
        setSelectedMeaning(null);
      }, 500);
    }
  };

  const checkCompletion = async (matched: string[]) => {
    if (matched.length === pairs.length && pairs.length > 0) {
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      try {
        await httpClient.post(`/matching/${deckId}/result`, {
          score: score + 10,
          time_taken_seconds: timeTaken
        });
        alert(`Game Complete! Time: ${timeTaken}s, Score: ${score + 10}`);
      } catch (error) {
        console.error(error);
      }
    }
  };

  // Need a randomized list of terms and meanings to display separately
  // For simplicity in this demo, just listing them. In reality they should be shuffled separately.
  
  return (
    <div className="p-6 max-w-4xl mx-auto min-h-[80vh] flex flex-col justify-center">
      <h1 className="text-3xl font-extrabold mb-8 text-center bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
        Matching Game
      </h1>
      
      <div className="flex gap-8 justify-between">
        {/* Left: Terms */}
        <div className="flex-1 space-y-4">
          {shuffledTerms.map(p => {
            const isMatched = matchedPairs.includes(p.card_id);
            const isSelected = selectedTerm === p.card_id;
            return (
              <button
                key={`term-${p.card_id}`}
                disabled={isMatched}
                onClick={() => handleTermClick(p.card_id)}
                className={`w-full p-5 rounded-xl text-left font-medium border transition-all duration-300 ${
                  isMatched 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400/40 cursor-not-allowed scale-[0.98]' 
                    : isSelected 
                      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.25)]' 
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-100 hover:border-indigo-500/50 hover:bg-zinc-800/30'
                }`}
              >
                {p.term}
              </button>
            );
          })}
        </div>

        {/* Right: Meanings */}
        <div className="flex-1 space-y-4">
          {shuffledMeanings.map(p => {
            const isMatched = matchedPairs.includes(p.card_id);
            const isSelected = selectedMeaning === p.card_id;
            return (
              <button
                key={`mean-${p.card_id}`}
                disabled={isMatched}
                onClick={() => handleMeaningClick(p.card_id)}
                className={`w-full p-5 rounded-xl text-left font-medium border transition-all duration-300 ${
                  isMatched 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400/40 cursor-not-allowed scale-[0.98]' 
                    : isSelected 
                      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.25)]' 
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-100 hover:border-indigo-500/50 hover:bg-zinc-800/30'
                }`}
              >
                {p.meaning_vi}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MatchingExercisePage;
