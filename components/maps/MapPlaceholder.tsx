import React from 'react';

interface MapPlaceholderProps {
    status: 'initializing' | 'error';
    message?: string;
}

const MapPlaceholder: React.FC<MapPlaceholderProps> = ({ status, message }) => {
    return (
        <div className="map-container flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800/50 text-center p-4">
            {status === 'initializing' && (
                <>
                    <svg className="animate-spin h-8 w-8 text-gray-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Inizializzazione mappa...</p>
                </>
            )}
            {status === 'error' && (
                 <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-400 mb-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-gray-600 dark:text-gray-300 font-semibold">{message || 'Impossibile caricare la mappa.'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Potrebbe essere bloccata da un ad-blocker o da un problema di rete.</p>
                 </>
            )}
        </div>
    );
};
export default MapPlaceholder;
