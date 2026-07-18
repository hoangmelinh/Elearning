import React, { useState } from 'react';
import httpClient from '../../services/httpClient';

interface FlashcardEditModalProps {
  card: any;
  onClose: () => void;
  onSaved: () => void;
}

const FlashcardEditModal: React.FC<FlashcardEditModalProps> = ({ card, onClose, onSaved }) => {
  const [formData, setFormData] = useState({
    term: card.term,
    phonetic: card.phonetic || '',
    meaning_vi: card.meaning_vi,
    example_sentence: card.example_sentence || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await httpClient.patch(`/flashcards/${card.id}`, formData);
      onSaved();
    } catch (error) {
      console.error(error);
      alert('Failed to update card');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Edit Flashcard</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Term</label>
            <input 
              name="term" value={formData.term} onChange={handleChange} required
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phonetic</label>
            <input 
              name="phonetic" value={formData.phonetic} onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Meaning (VI)</label>
            <input 
              name="meaning_vi" value={formData.meaning_vi} onChange={handleChange} required
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Example Sentence</label>
            <textarea 
              name="example_sentence" value={formData.example_sentence} onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded p-2" rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-white bg-indigo-600 rounded hover:bg-indigo-700">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FlashcardEditModal;
