import React from 'react';

interface LevelSelectorProps {
    language: 'en' | 'zh';
    value: string;
    onChange: (level: string) => void;
    className?: string;
    disabled?: boolean;
}

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const HSK_LEVELS = ['HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5', 'HSK 6'];

const LevelSelector: React.FC<LevelSelectorProps> = ({ language, value, onChange, className = '', disabled = false }) => {
    const levels = language === 'zh' ? HSK_LEVELS : CEFR_LEVELS;

    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={`w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 ${className}`}
        >
            <option value="">Select Level</option>
            {levels.map((lvl) => (
                <option key={lvl} value={lvl}>{lvl}</option>
            ))}
        </select>
    );
};

export default LevelSelector;
