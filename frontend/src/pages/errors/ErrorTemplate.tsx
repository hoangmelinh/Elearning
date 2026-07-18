import React, { ReactNode } from 'react';

interface ErrorTemplateProps {
    icon: ReactNode;
    code: string;
    title: string;
    description: ReactNode;
    buttons: ReactNode;
    
    // Full Tailwind class names to avoid PurgeCSS stripping them out
    glowColorClass: string;
    iconContainerClass: string;
    iconBorderClass: string;
    iconTextClass: string;
    badgeContainerClass: string;
    badgeTextClass: string;
}

const ErrorTemplate: React.FC<ErrorTemplateProps> = ({
    icon,
    code,
    title,
    description,
    buttons,
    glowColorClass,
    iconContainerClass,
    iconBorderClass,
    iconTextClass,
    badgeContainerClass,
    badgeTextClass
}) => {
    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient Glow */}
            <div 
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px] pointer-events-none ${glowColorClass}`} 
            />

            <div className="max-w-md w-full text-center relative z-10">
                {/* Icon Container */}
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full border mb-8 relative ${iconContainerClass}`}>
                    <div className={`absolute inset-0 rounded-full border-t animate-[spin_4s_linear_infinite] ${iconBorderClass}`} />
                    <div className={iconTextClass}>
                        {icon}
                    </div>
                </div>

                {/* Error Code Badge */}
                <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-extrabold mb-6 border ${badgeContainerClass} ${badgeTextClass}`}>
                    {code}
                </div>

                {/* Title & Description */}
                <h1 className="text-4xl font-extrabold text-white tracking-tight mb-4">
                    {title}
                </h1>
                
                <div className="text-gray-400 text-sm leading-relaxed mb-10">
                    {description}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    {buttons}
                </div>
            </div>
        </div>
    );
};

export default ErrorTemplate;
