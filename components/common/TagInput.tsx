import React, { useState, KeyboardEvent } from 'react';

interface TagInputProps {
    tags: string[];
    setTags: (tags: string[]) => void;
    placeholder?: string;
}

const TagInput: React.FC<TagInputProps> = ({ tags, setTags, placeholder }) => {
    const [inputValue, setInputValue] = useState('');

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && inputValue.trim() !== '') {
            event.preventDefault();
            if (!tags.includes(inputValue.trim())) {
                setTags([...tags, inputValue.trim()]);
            }
            setInputValue('');
        } else if (event.key === 'Backspace' && inputValue === '' && tags.length > 0) {
            event.preventDefault();
            removeTag(tags.length - 1);
        }
    };

    const removeTag = (indexToRemove: number) => {
        setTags(tags.filter((_, index) => index !== indexToRemove));
    };

    return (
        <div>
            <div className="flex flex-wrap gap-2 p-2 border rounded-lg bg-background-light dark:bg-gray-700 dark:border-border-dark focus-within:ring-2 focus-within:ring-ring">
                {tags.map((tag, index) => (
                    <div key={index} className="flex items-center gap-1 bg-primary/20 text-primary-dark dark:text-primary-light text-sm font-semibold px-2 py-1 rounded-md">
                        <span>{tag}</span>
                        <button
                            type="button"
                            onClick={() => removeTag(index)}
                            className="text-primary hover:text-red-500"
                            aria-label={`Rimuovi ${tag}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                ))}
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder || 'Aggiungi e premi Invio...'}
                    className="flex-grow bg-transparent focus:outline-none text-sm p-1"
                />
            </div>
        </div>
    );
};

export default TagInput;
