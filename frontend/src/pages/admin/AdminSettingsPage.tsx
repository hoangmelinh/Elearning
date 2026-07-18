import React from 'react';
import { Bell, Lock, Database, Palette, ShieldCheck, Code } from '@phosphor-icons/react';

const settingsSections = [
  {
    icon: ShieldCheck,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/[0.08] border-indigo-500/20',
    title: 'Tài khoản Admin',
    description: 'Thông tin quản trị viên và mật khẩu đăng nhập.',
    items: [
      { label: 'Email Admin mặc định', value: 'admin@elearn.com' },
      { label: 'Mật khẩu mặc định', value: '••••••••' },
    ],
  },
  {
    icon: Database,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/[0.08] border-emerald-500/20',
    title: 'Cơ sở dữ liệu',
    description: 'Cấu hình kết nối PostgreSQL và thông tin môi trường.',
    items: [
      { label: 'Database', value: 'elearning_db (PostgreSQL)' },
      { label: 'Port', value: '5432' },
      { label: 'Backend Port', value: '8081' },
    ],
  },
  {
    icon: Code,
    color: 'text-amber-400',
    bg: 'bg-amber-500/[0.08] border-amber-500/20',
    title: 'AI & Dịch vụ ngoài',
    description: 'API key và cấu hình dịch vụ AI trích xuất từ vựng.',
    items: [
      { label: 'AI Provider', value: 'NVIDIA NIM API' },
      { label: 'Model', value: 'meta/llama-3.3-70b-instruct' },
      { label: 'Max Tokens', value: '4096' },
    ],
  },
  {
    icon: Bell,
    color: 'text-purple-400',
    bg: 'bg-purple-500/[0.08] border-purple-500/20',
    title: 'Thông báo',
    description: 'Cấu hình thông báo hệ thống cho quản trị viên.',
    items: [
      { label: 'Trạng thái', value: 'Chưa cấu hình' },
    ],
  },
];

const AdminSettingsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-transparent text-[#f5f5f5] pb-24 relative z-10">
      <div className="max-w-4xl mx-auto px-6 pt-12">

        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-semibold bg-gray-500/[0.08] border border-gray-500/[0.12] text-gray-400 mb-3">
            Quản trị
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Cài đặt Hệ thống</h1>
          <p className="text-gray-400 mt-2">Thông tin cấu hình và tổng quan hệ thống ELearn.</p>
        </div>

        <div className="space-y-4">
          {settingsSections.map(section => {
            const Icon = section.icon;
            return (
              <div
                key={section.title}
                className="rounded-3xl bg-white/[0.015] border border-white/[0.05] p-2"
              >
                <div className="rounded-[calc(1.5rem-0.5rem)] bg-[#0a0a0a] border border-white/[0.02] p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div className={`w-12 h-12 rounded-2xl ${section.bg} border flex items-center justify-center shrink-0 ${section.color}`}>
                      <Icon size={22} weight="duotone" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">{section.title}</h3>
                      <p className="text-gray-500 text-xs mt-0.5">{section.description}</p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {section.items.map(item => (
                      <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-white/[0.03] last:border-0">
                        <span className="text-gray-500 text-xs">{item.label}</span>
                        <span className="text-white text-xs font-mono font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info note */}
        <div className="mt-8 rounded-2xl bg-indigo-500/[0.04] border border-indigo-500/[0.10] p-4 text-xs text-indigo-300/70 leading-relaxed">
          💡 Để thay đổi cấu hình, vui lòng chỉnh sửa file <code className="bg-white/[0.05] px-1.5 py-0.5 rounded text-indigo-200">.env</code> trong thư mục gốc của dự án, sau đó khởi động lại Backend.
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
