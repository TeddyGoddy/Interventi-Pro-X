import React from 'react';

interface MapDebugProps {
    interventions: any[];
    mapCenter: any;
    theme: string;
}

const MapDebug: React.FC<MapDebugProps> = ({ interventions, mapCenter, theme }) => {
    return (
        <div className="p-4 bg-gray-100 dark:bg-gray-800 text-sm">
            <h3 className="font-bold mb-2">🗺️ Map Debug Info</h3>
            <div className="space-y-1">
                <div>Interventions: {interventions?.length || 0}</div>
                <div>Map Center: {mapCenter ? `${mapCenter.lat}, ${mapCenter.lng}` : 'null'}</div>
                <div>Theme: {theme}</div>
                <div>Screen: {window.innerWidth}x{window.innerHeight}</div>
                <div>User Agent: {navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}</div>
            </div>
            <div className="mt-2 p-2 bg-red-100 dark:bg-red-900 rounded">
                <div className="text-red-800 dark:text-red-200">
                    Se vedi questo, la mappa non si sta caricando correttamente.
                </div>
            </div>
        </div>
    );
};

export default MapDebug;
