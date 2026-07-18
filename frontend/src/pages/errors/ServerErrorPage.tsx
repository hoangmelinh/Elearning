import React from 'react';
import { ArrowClockwise, WarningCircle } from '@phosphor-icons/react';
import ErrorTemplate from './ErrorTemplate';

interface ServerErrorPageProps {
    error?: Error;
    resetErrorBoundary?: () => void;
}

const ServerErrorPage: React.FC<ServerErrorPageProps> = ({ error, resetErrorBoundary }) => {
    return (
        <ErrorTemplate
            icon={<WarningCircle size={48} weight="fill" />}
            code="Lỗi hệ thống (500)"
            title="Đã xảy ra sự cố"
            description={
                <>
                    Giao diện gặp lỗi trong quá trình hiển thị. Chúng tôi đã ghi nhận sự cố và sẽ khắc phục sớm nhất có thể.
                    {error && (
                        <div className="mt-6 text-left p-4 rounded-2xl bg-black/40 border border-white/5 overflow-x-auto">
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-2">Chi tiết lỗi (Dành cho Dev):</p>
                            <p className="text-xs font-mono text-amber-200/80">{error.toString()}</p>
                        </div>
                    )}
                </>
            }
            glowColorClass="bg-amber-500/[0.03]"
            iconContainerClass="bg-amber-500/10 border-amber-500/20"
            iconBorderClass="border-amber-500/30"
            iconTextClass="text-amber-500"
            badgeContainerClass="bg-amber-500/[0.05] border-amber-500/[0.1]"
            badgeTextClass="text-amber-400"
            buttons={
                <>
                    {resetErrorBoundary && (
                        <button 
                            onClick={resetErrorBoundary}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-black px-8 py-3.5 rounded-full font-bold text-sm hover:bg-white/90 transition-all"
                        >
                            <ArrowClockwise size={16} weight="bold" />
                            Thử tải lại UI
                        </button>
                    )}
                    <button 
                        onClick={() => window.location.href = '/dashboard'}
                        className="w-full sm:w-auto px-8 py-3.5 rounded-full font-bold text-sm bg-white/[0.05] border border-white/[0.1] text-white hover:bg-white/[0.1] transition-all"
                    >
                        Về Bảng điều khiển
                    </button>
                </>
            }
        />
    );
};

export default ServerErrorPage;
