import React, { useState } from 'react';

interface ChineseTextInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    onFinalChange: (val: string) => void;
}

const ChineseTextInput: React.FC<ChineseTextInputProps> = ({ onFinalChange, className = '', ...props }) => {
    const [isComposing, setIsComposing] = useState(false);
    const [localValue, setLocalValue] = useState(props.value || '');

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLocalValue(e.target.value);
        if (!isComposing) {
            onFinalChange(e.target.value);
        }
    };

    const handleCompositionStart = () => {
        setIsComposing(true);
    };

    const handleCompositionEnd = (e: React.CompositionEvent<HTMLTextAreaElement>) => {
        setIsComposing(false);
        // Sync the final confirmed pinyin to parent
        onFinalChange((e.target as HTMLTextAreaElement).value);
    };

    return (
        <textarea
            {...props}
            value={localValue}
            onChange={handleChange}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            className={`lang-zh ${className}`}
        />
    );
};

export default ChineseTextInput;
