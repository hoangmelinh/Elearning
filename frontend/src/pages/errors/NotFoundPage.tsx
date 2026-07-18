import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, House } from '@phosphor-icons/react';
import ErrorTemplate from './ErrorTemplate';

const NotFoundPage: React.FC = () => {
    return (
        <ErrorTemplate
            icon={<Compass size={48} />}
            code="Mã lỗi 404"
            title="Lạc đường rồi!"
            description="Trang bạn đang tìm kiếm không tồn tại, đã bị xóa hoặc đường dẫn bị sai. Hãy kiểm tra lại địa chỉ URL nhé."
            glowColorClass="bg-indigo-500/[0.03]"
            iconContainerClass="bg-indigo-500/10 border-indigo-500/20"
            iconBorderClass="border-indigo-500/30"
            iconTextClass="text-indigo-400"
            badgeContainerClass="bg-indigo-500/[0.05] border-indigo-500/[0.1]"
            badgeTextClass="text-indigo-300"
            buttons={
                <>
                    <button 
                        onClick={() => window.history.back()}
                        className="w-full sm:w-auto px-8 py-3.5 rounded-full font-bold text-sm bg-white/[0.05] border border-white/[0.1] text-white hover:bg-white/[0.1] transition-all"
                    >
                        Quay lại trang trước
                    </button>
                    <Link 
                        to="/"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-black px-8 py-3.5 rounded-full font-bold text-sm hover:bg-white/90 transition-all"
                    >
                        <House size={16} weight="bold" />
                        Về Trang chủ
                    </Link>
                </>
            }
        />
    );
};

export default NotFoundPage;
