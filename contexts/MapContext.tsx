import * as React from 'react';
import { MapService } from '../types';

interface MapContextType {
    mapService: MapService;
    hasCluster: boolean;
    hasHeatmap: boolean;
}

const MapContext = React.createContext<MapContextType | undefined>(undefined);

export const MapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mapService, setMapService] = React.useState<MapService>('initializing');
    const [hasCluster, setHasCluster] = React.useState(false);
    const [hasHeatmap, setHasHeatmap] = React.useState(false);

    React.useEffect(() => {
        // This effect runs only once on mount to initialize.
        // It polls for the Leaflet object in case of script loading race conditions.
        
        let attempts = 0;
        const maxAttempts = 30; // 30 * 100ms = 3 seconds

        const intervalId = setInterval(() => {
            attempts++;

            if (window.L) {
                clearInterval(intervalId);
                console.log("✅ Leaflet core library found.");
                setMapService('leaflet');

                if (window.L.markerClusterGroup) {
                    console.log("✅ Leaflet.markercluster plugin found.");
                    setHasCluster(true);
                } else {
                    console.warn("🚨 Leaflet.markercluster plugin not available. Clustering will be disabled.");
                }

                if (window.L.heatLayer) {
                    console.log("✅ Leaflet.heat plugin found.");
                    setHasHeatmap(true);
                } else {
                    console.warn("🚨 Leaflet.heat plugin not available. Heatmap will be disabled.");
                }
            } else if (attempts >= maxAttempts) {
                clearInterval(intervalId);
                console.error("🚨 Failed to find Leaflet core library (window.L) after 3 seconds. The map will not work.");
                setMapService('none');
            }
        }, 100);

        return () => clearInterval(intervalId);
    }, []); // Empty dependency array ensures this runs only once on mount.

    return (
        <MapContext.Provider value={{ mapService, hasCluster, hasHeatmap }}>
            {children}
        </MapContext.Provider>
    );
};

export const useMap = (): MapContextType => {
    const context = React.useContext(MapContext);
    if (context === undefined) {
        throw new Error('useMap must be used within a MapProvider');
    }
    return context;
};