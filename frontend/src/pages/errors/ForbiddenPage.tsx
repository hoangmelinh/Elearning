import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldWarning, ArrowLeft } from '@phosphor-icons/react';
import ErrorTemplate from './ErrorTemplate';

const ForbiddenPage: React.FC = () => {
    return (
        <ErrorTemplate
            icon={<ShieldWarning size={48} weight="fill" />}
            code="Mã lỗi 403"
            title="Truy cập bị từ chối"
            description="Bạn không có đủ quyền hạn để xem nội dung của trang này. Nếu bạn cho rằng đây là một sự nhầm lẫn, vui lòng liên hệ Quản trị viên hệ thống."
            glowColorClass="bg-red-500/[0.03]"
            iconContainerClass="bg-red-500/10 border-red-500/20"
            iconBorderClass="border-red-500/30"
            iconTextClass="text-red-500"
            badgeContainerClass="bg-red-500/[0.05] border-red-500/[0.1]"
            badgeTextClass="text-red-400"
            buttons={
                <Link 
                    to="/dashboard"
                    className="inline-flex items-center justify-center gap-2 bg-white text-black px-8 py-3.5 rounded-full font-bold text-sm hover:bg-white/90 hover:scale-[1.02] transition-all duration-300 active:scale-[0.98]"
                >
                    <ArrowLeft size={16} weight="bold" />
                    Quay lại Bảng điều khiển
                </Link>
            }
        />
    );
};

export default ForbiddenPage;
