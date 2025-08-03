import React from 'react';

interface ImagePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string | null;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ isOpen, onClose, imageUrl }) => {
    if (!isOpen || !imageUrl) return null;

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[1300] p-4 animate-scale-in"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div 
                className="relative max-w-4xl max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                <img 
                    src={imageUrl} 
                    alt="Anteprima immagine" 
                    className="object-contain w-full h-full rounded-lg shadow-2xl"
                />
                <button 
                    onClick={onClose} 
                    aria-label="Chiudi anteprima" 
                    className="absolute -top-3 -right-3 p-1.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default ImagePreviewModal;