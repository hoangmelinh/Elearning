import React from 'react';
import { Microphone, Wrench } from '@phosphor-icons/react';

const SpeakingHistoryPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-transparent text-[#f5f5f5] pb-24 relative z-10">
            <div className="max-w-3xl mx-auto px-6 pt-24 text-center flex flex-col items-center">
                <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs uppercase tracking-[0.2em] font-bold bg-amber-500/[0.1] border border-amber-500/[0.2] text-amber-400 mb-8">
                    <Wrench size={14} weight="fill" />
                    Bảo trì & Nâng cấp
                </div>
                
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-6">
                    AI Speaking Practice
                </h1>
                
                <p className="text-gray-400 text-base max-w-lg mx-auto leading-relaxed mb-12">
                    Tính năng Luyện nói AI đang được đội ngũ kỹ thuật bảo trì và nâng cấp thuật toán nhận diện. Chúng tôi sẽ sớm mở lại với tốc độ và độ chính xác cao hơn. Xin lỗi bạn vì sự bất tiện này!
                </p>

                <div className="relative inline-flex items-center justify-center p-10 rounded-full bg-white/[0.02] border border-white/[0.05]">
                    <div className="absolute inset-0 rounded-full border border-dashed border-white/10 animate-[spin_10s_linear_infinite]" />
                    <Microphone size={56} className="text-gray-700" />
                </div>
            </div>
        </div>
    );
};

export default SpeakingHistoryPage;
