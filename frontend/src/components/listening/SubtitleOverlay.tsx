import React, { useState } from 'react';

interface SubtitleOverlayProps {
  subtitles: any[];
  currentTimeMs: number;
}

const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({ subtitles, currentTimeMs }) => {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });

  // Find active subtitle
  const activeSubtitle = subtitles.find(
    s => currentTimeMs >= s.start_time_ms && currentTimeMs <= s.end_time_ms
  );

  const handleWordClick = (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    // Clean word
    const cleanWord = word.replace(/[.,!?]/g, '');
    setSelectedWord(cleanWord);
    setPopupPosition({ x: e.clientX, y: e.clientY });
  };

  if (!activeSubtitle) return null;

  const words = activeSubtitle.text.split(' ');

  return (
    <>
      <div className="absolute bottom-16 left-0 w-full text-center pointer-events-none">
        <div className="inline-block bg-black bg-opacity-60 px-4 py-2 rounded pointer-events-auto">
          <p className="text-white text-lg md:text-2xl font-medium tracking-wide">
            {words.map((word: string, i: number) => (
              <span 
                key={i} 
                onClick={(e) => handleWordClick(e, word)}
                className="cursor-pointer hover:text-yellow-400 transition-colors mx-1"
              >
                {word}
              </span>
            ))}
          </p>
        </div>
      </div>

      {selectedWord && (
        <WordLookupPopup 
          word={selectedWord} 
          position={popupPosition} 
          onClose={() => setSelectedWord(null)} 
        />
      )}
    </>
  );
};

const WordLookupPopup: React.FC<{ word: string, position: {x: number, y: number}, onClose: () => void }> = ({ word, position, onClose }) => {
  // In reality, this would fetch from a dictionary API or local database
  return (
    <div 
      className="fixed z-50 bg-white rounded shadow-2xl p-4 w-64 border border-gray-200"
      style={{ left: Math.min(position.x, window.innerWidth - 260), top: position.y - 120 }}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl font-bold text-gray-900">{word}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
      </div>
      <p className="text-sm text-gray-500 mb-2">/pəˈnetɪk/</p>
      <p className="text-gray-800 text-sm border-t pt-2">Simulated meaning for '{word}'. You can add this to your flashcard deck.</p>
      <button className="mt-3 w-full bg-indigo-50 text-indigo-700 py-1 rounded text-sm hover:bg-indigo-100 transition-colors">
        + Add to Deck
      </button>
    </div>
  );
};

export default SubtitleOverlay;
