import React, { useEffect, useState } from 'react';
import httpClient from '../../services/httpClient';
import { CircleNotch, Users, Cards, Stack, Student } from '@phosphor-icons/react';

const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await httpClient.get('/admin/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <CircleNotch size={32} className="text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-[#f5f5f5] pb-24 relative z-10">
      <div className="max-w-6xl mx-auto px-6 pt-12">
        
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-semibold bg-indigo-500/[0.08] border border-indigo-500/[0.12] text-indigo-400 mb-3">
            Hệ thống Quản trị
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">Tổng quan nền tảng</h1>
          <p className="text-gray-400 mt-2">Theo dõi các chỉ số hoạt động và dữ liệu cốt lõi của ELearn.</p>
        </div>

        {/* Double-Bezel Bento Grid for Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Total Users */}
          <div className="rounded-3xl bg-white/[0.015] border border-white/[0.05] p-1.5 transition-premium hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
            <div className="h-full rounded-[calc(1.5rem-0.375rem)] bg-[#0a0a0a] border border-white/[0.02] p-6 flex flex-col justify-between">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/[0.08] border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6">
                <Users size={24} weight="duotone" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tổng người dùng</p>
                <div className="text-4xl font-black text-white">{stats?.totalUsers || 0}</div>
              </div>
            </div>
          </div>

          {/* Students */}
          <div className="rounded-3xl bg-white/[0.015] border border-white/[0.05] p-1.5 transition-premium hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
            <div className="h-full rounded-[calc(1.5rem-0.375rem)] bg-[#0a0a0a] border border-white/[0.02] p-6 flex flex-col justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
                <Student size={24} weight="duotone" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Học viên</p>
                <div className="text-4xl font-black text-white">{stats?.totalStudents || 0}</div>
              </div>
            </div>
          </div>

          {/* Total Decks */}
          <div className="rounded-3xl bg-white/[0.015] border border-white/[0.05] p-1.5 transition-premium hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
            <div className="h-full rounded-[calc(1.5rem-0.375rem)] bg-[#0a0a0a] border border-white/[0.02] p-6 flex flex-col justify-between">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/[0.08] border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6">
                <Stack size={24} weight="duotone" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Bộ thẻ (Decks)</p>
                <div className="text-4xl font-black text-white">{stats?.totalDecks || 0}</div>
              </div>
            </div>
          </div>

          {/* Total Flashcards */}
          <div className="rounded-3xl bg-white/[0.015] border border-white/[0.05] p-1.5 transition-premium hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
            <div className="h-full rounded-[calc(1.5rem-0.375rem)] bg-[#0a0a0a] border border-white/[0.02] p-6 flex flex-col justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/[0.08] border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6">
                <Cards size={24} weight="duotone" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tổng thẻ từ</p>
                <div className="text-4xl font-black text-white">{stats?.totalFlashcards || 0}</div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AdminDashboardPage;
