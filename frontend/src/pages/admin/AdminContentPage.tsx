import React, { useEffect, useState } from 'react';
import httpClient from '../../services/httpClient';
import { CircleNotch, Stack, Trash, MagnifyingGlass, GlobeHemisphereWest, Lock } from '@phosphor-icons/react';

interface AdminDeck {
  id: string;
  name: string;
  isPublic: boolean;
  ownerName: string;
  ownerEmail: string;
  cardCount: number;
  createdAt: string;
}

const AdminContentPage: React.FC = () => {
  const [decks, setDecks] = useState<AdminDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchDecks = async () => {
    try {
      setLoading(true);
      const res = await httpClient.get('/admin/decks');
      setDecks(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteDeck = async (deckId: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa bộ thẻ này?')) return;
    try {
      setDeletingId(deckId);
      await httpClient.delete(`/admin/decks/${deckId}`);
      setDecks(prev => prev.filter(d => d.id !== deckId));
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = decks.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.ownerName.toLowerCase().includes(search.toLowerCase()) ||
    d.ownerEmail.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-transparent flex items-center justify-center">
      <CircleNotch size={32} className="text-emerald-400 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent text-[#f5f5f5] pb-24 relative z-10">
      <div className="max-w-6xl mx-auto px-6 pt-12">

        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-semibold bg-emerald-500/[0.08] border border-emerald-500/[0.12] text-emerald-400 mb-3">
            Quản trị
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Quản lý Nội dung</h1>
          <p className="text-gray-400 mt-2">{decks.length} bộ thẻ từ vựng trên toàn hệ thống</p>
        </div>

        {/* Summary mini bento */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Tổng bộ thẻ', value: decks.length, color: 'text-white' },
            { label: 'Công khai', value: decks.filter(d => d.isPublic).length, color: 'text-emerald-400' },
            { label: 'Riêng tư', value: decks.filter(d => !d.isPublic).length, color: 'text-gray-400' },
          ].map(item => (
            <div key={item.label} className="rounded-2xl bg-white/[0.015] border border-white/[0.05] p-1.5">
              <div className="bg-[#0a0a0a] border border-white/[0.02] rounded-[calc(1rem-0.375rem)] px-4 py-4">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{item.label}</p>
                <p className={`text-3xl font-black ${item.color}`}>{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-1.5 mb-6">
          <div className="bg-[#0a0a0a] border border-white/[0.02] rounded-[calc(1rem-0.375rem)] px-4 py-3 flex items-center gap-3">
            <MagnifyingGlass size={16} className="text-gray-500" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên bộ thẻ, tên hoặc email người dùng..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-white text-sm placeholder-gray-600 outline-none"
            />
          </div>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-[2fr_1.5fr_auto_auto_auto] gap-4 px-5 py-2 text-[10px] font-bold tracking-[0.2em] text-gray-600 uppercase mb-2">
          <div>Tên bộ thẻ</div>
          <div>Chủ sở hữu</div>
          <div>Số thẻ</div>
          <div>Trạng thái</div>
          <div></div>
        </div>

        {/* Deck Rows */}
        <div className="space-y-2">
          {filtered.map(deck => (
            <div
              key={deck.id}
              className="rounded-2xl bg-white/[0.01] border border-white/[0.04] p-1.5 transition-all group hover:bg-white/[0.025] hover:border-white/[0.08]"
            >
              <div className="bg-[#090909] border border-white/[0.01] rounded-[calc(1rem-0.375rem)] px-4 py-3.5 grid grid-cols-[2fr_1.5fr_auto_auto_auto] gap-4 items-center">

                {/* Deck Name */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.04] flex items-center justify-center shrink-0">
                    <Stack size={16} className="text-gray-500" />
                  </div>
                  <span className="font-semibold text-white text-sm truncate">{deck.name}</span>
                </div>

                {/* Owner */}
                <div>
                  <div className="text-gray-300 text-xs font-medium">{deck.ownerName}</div>
                  <div className="text-gray-600 text-[10px]">{deck.ownerEmail}</div>
                </div>

                {/* Card count */}
                <div className="text-gray-400 text-xs font-mono font-bold text-center w-12">
                  {deck.cardCount}
                </div>

                {/* Public / Private badge */}
                <div>
                  {deck.isPublic ? (
                    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold tracking-wider text-emerald-400 bg-emerald-500/[0.08] border border-emerald-500/[0.15] px-2 py-0.5 rounded-full">
                      <GlobeHemisphereWest size={9} weight="bold" /> Công khai
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold tracking-wider text-gray-500 bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded-full">
                      <Lock size={9} weight="bold" /> Riêng tư
                    </span>
                  )}
                </div>

                {/* Delete */}
                <button
                  onClick={() => deleteDeck(deck.id)}
                  disabled={deletingId === deck.id}
                  className="p-2 rounded-xl text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                >
                  {deletingId === deck.id
                    ? <CircleNotch size={14} className="animate-spin" />
                    : <Trash size={14} />}
                </button>

              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="py-16 text-center text-gray-600 text-sm">
              Không tìm thấy bộ thẻ nào.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminContentPage;
