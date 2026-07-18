import React, { useEffect, useState } from 'react';
import httpClient from '../../services/httpClient';
import { CircleNotch, UserCircle, LockKey, LockKeyOpen, Trash, MagnifyingGlass, ShieldCheck } from '@phosphor-icons/react';

interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await httpClient.get(`/admin/users?search=${search}&size=1000`);
      setUsers(res.data.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'locked' : 'active';
    try {
      await httpClient.patch(`/admin/users/${userId}`, { status: newStatus });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa người dùng này?')) return;
    try {
      setDeletingId(userId);
      await httpClient.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = users.filter(u =>
    (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-transparent flex items-center justify-center">
      <CircleNotch size={32} className="text-blue-400 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent text-[#f5f5f5] pb-24 relative z-10">
      <div className="max-w-6xl mx-auto px-6 pt-12">

        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-semibold bg-blue-500/[0.08] border border-blue-500/[0.12] text-blue-400 mb-3">
            Quản trị
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Quản lý Người dùng</h1>
          <p className="text-gray-400 mt-2">{users.length} tài khoản đã đăng ký trên hệ thống</p>
        </div>

        {/* Search */}
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-1.5 mb-6">
          <div className="bg-[#0a0a0a] border border-white/[0.02] rounded-[calc(1rem-0.375rem)] px-4 py-3 flex items-center gap-3">
            <MagnifyingGlass size={16} className="text-gray-500" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-white text-sm placeholder-gray-600 outline-none"
            />
          </div>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-[1.5fr_2fr_120px_120px_100px] gap-4 px-6 py-2 text-[10px] font-bold tracking-[0.2em] text-gray-600 uppercase mb-2">
          <div>Họ tên</div>
          <div>Email</div>
          <div className="text-center">Vai trò</div>
          <div className="text-center">Trạng thái</div>
          <div className="text-right">Hành động</div>
        </div>

        {/* User Rows */}
        <div className="space-y-2">
          {filtered.map(user => (
            <div
              key={user.id}
              className="rounded-2xl bg-white/[0.01] border border-white/[0.04] p-1.5 transition-all group hover:bg-white/[0.025] hover:border-white/[0.08]"
            >
              <div className="bg-[#090909] border border-white/[0.01] rounded-[calc(1rem-0.375rem)] px-4 py-3.5 grid grid-cols-[1.5fr_2fr_120px_120px_100px] gap-4 items-center">

                {/* Name */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.04] flex items-center justify-center shrink-0">
                    <UserCircle size={18} className="text-gray-500" />
                  </div>
                  <span className={`font-semibold text-sm truncate ${user.full_name ? 'text-white' : 'text-gray-500 italic'}`}>
                    {user.full_name || 'Chưa cập nhật'}
                  </span>
                </div>

                {/* Email */}
                <div className="text-gray-400 text-xs truncate">{user.email}</div>

                {/* Role Badge */}
                <div className="flex justify-center">
                  {user.role === 'admin' ? (
                    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold tracking-wider text-indigo-300 bg-indigo-500/[0.08] border border-indigo-500/[0.15] px-2 py-0.5 rounded-full">
                      <ShieldCheck size={9} weight="bold" /> Admin
                    </span>
                  ) : (
                    <span className="text-[9px] font-extrabold tracking-wider text-gray-500 bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded-full">
                      Student
                    </span>
                  )}
                </div>

                {/* Status Badge */}
                <div className="flex justify-center">
                  <span className={`text-[9px] font-extrabold tracking-wider px-2 py-0.5 rounded-full ${
                    user.status === 'active'
                      ? 'text-emerald-400 bg-emerald-500/[0.08] border border-emerald-500/[0.15]'
                      : 'text-red-400 bg-red-500/[0.08] border border-red-500/[0.15]'
                  }`}>
                    {user.status === 'active' ? 'Hoạt động' : 'Bị khóa'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => toggleStatus(user.id, user.status)}
                    title={user.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa'}
                    className={`p-2 rounded-xl transition-all ${
                      user.status === 'active'
                        ? 'text-amber-400 hover:bg-amber-400/10'
                        : 'text-emerald-400 hover:bg-emerald-400/10'
                    }`}
                  >
                    {user.status === 'active' ? <LockKey size={15} /> : <LockKeyOpen size={15} />}
                  </button>
                  {user.role !== 'admin' && (
                    <button
                      onClick={() => deleteUser(user.id)}
                      disabled={deletingId === user.id}
                      className="p-2 rounded-xl text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
                    >
                      {deletingId === user.id
                        ? <CircleNotch size={15} className="animate-spin" />
                        : <Trash size={15} />}
                    </button>
                  )}
                </div>

              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="py-16 text-center text-gray-600 text-sm">
              Không tìm thấy người dùng nào.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;
