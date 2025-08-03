import * as React from 'react';
import { Coordinates, MapStyle } from '../../types';

interface DraggablePinMapProps {
    initialCoords: Coordinates;
    onPositionChange: (coords: Coordinates) => void;
    theme: string;
    mapStyle: MapStyle;
}

const DraggablePinMap: React.FC<DraggablePinMapProps> = ({ initialCoords, onPositionChange, theme, mapStyle }) => {
    const mapContainerRef = React.useRef<HTMLDivElement>(null);
    const mapRef = React.useRef<any>(null);
    const markerRef = React.useRef<any>(null);

    const tiles = {
        'osm': {
            light: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        },
        'carto-positron': {
            light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
            dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        }
    };

    React.useEffect(() => {
        if (!mapContainerRef.current || !window.L) return;

        if (mapRef.current) {
            mapRef.current.remove();
        }

        mapRef.current = window.L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: false,
        }).setView([initialCoords.lat, initialCoords.lng], 17);

        const tileProvider = tiles[mapStyle];
        const tileUrl = theme === 'dark' ? tileProvider.dark : tileProvider.light;
        window.L.tileLayer(tileUrl).addTo(mapRef.current);

        const iconHtml = `<div style="background-color: #ef4444;" class="rounded-full w-6 h-6 flex items-center justify-center text-white shadow-lg ring-2 ring-white/50 cursor-move"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" /></svg></div>`;
        const markerIcon = window.L.divIcon({
            html: iconHtml,
            className: 'leaflet-div-icon',
            iconSize: [24, 24],
            iconAnchor: [12, 24],
        });

        markerRef.current = window.L.marker([initialCoords.lat, initialCoords.lng], { 
            icon: markerIcon, 
            draggable: true 
        }).addTo(mapRef.current);

        markerRef.current.on('dragend', (event: any) => {
            const marker = event.target;
            const position = marker.getLatLng();
            onPositionChange({ lat: position.lat, lng: position.lng });
        });
        
        // Invalidate size after a short delay for rendering
        setTimeout(() => mapRef.current?.invalidateSize(), 50);

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [initialCoords, theme, mapStyle, onPositionChange]);
    
    // Update map view if coordinates change from parent
    React.useEffect(() => {
        if (mapRef.current && initialCoords) {
            mapRef.current.setView([initialCoords.lat, initialCoords.lng]);
            if(markerRef.current) {
                markerRef.current.setLatLng([initialCoords.lat, initialCoords.lng]);
            }
        }
    }, [initialCoords]);


    return <div ref={mapContainerRef} className="map-container" />;
};

export default DraggablePinMap;