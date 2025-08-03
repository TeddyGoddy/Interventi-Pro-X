import React from 'react';
import { Intervention, InterventionStatus } from '../types';

// Status colors matching desktop
const statusColors: Record<InterventionStatus, string> = {
    [InterventionStatus.NEW]: '#3B82F6', // blue-500
    [InterventionStatus.PENDING]: '#F97316', // orange-500
    [InterventionStatus.IN_PROGRESS]: '#F59E0B', // amber-500
    [InterventionStatus.COMPLETED]: '#10B981', // emerald-500
    [InterventionStatus.CANCELED]: '#EF4444', // red-500
};

// Create custom colored marker icon
const createColoredIcon = (color: string, isSelected: boolean = false) => {
    const size = isSelected ? 35 : 25;
    const borderWidth = isSelected ? 4 : 2;
    const borderColor = isSelected ? '#FFD700' : '#FFFFFF'; // Gold border for selected
    
    return window.L.divIcon({
        className: 'custom-marker',
        html: `
            <div style="
                width: ${size}px;
                height: ${size}px;
                background-color: ${color};
                border: ${borderWidth}px solid ${borderColor};
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: ${size > 30 ? '14px' : '10px'};
                color: white;
                font-weight: bold;
                ${isSelected ? 'animation: pulse 2s infinite;' : ''}
            ">
                ${isSelected ? '📍' : '●'}
            </div>
            <style>
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }
            </style>
        `,
        iconSize: [size, size],
        iconAnchor: [size/2, size],
        popupAnchor: [0, -size]
    });
};

interface SimpleMobileMapProps {
    interventions: Intervention[];
    selectedIntervention: Intervention | null;
    onSelectIntervention: (intervention: Intervention) => void;
    mapCenter?: { lat: number; lng: number } | null;
}

const SimpleMobileMap: React.FC<SimpleMobileMapProps> = ({ 
    interventions, 
    selectedIntervention, 
    onSelectIntervention,
    mapCenter
}) => {
    const mapRef = React.useRef<HTMLDivElement>(null);
    const leafletMapRef = React.useRef<any>(null);

    React.useEffect(() => {
        if (!mapRef.current || leafletMapRef.current) return;

        // Initialize simple Leaflet map
        try {
            const map = window.L.map(mapRef.current, {
                center: [41.9028, 12.4964], // Rome center
                zoom: 6,
                zoomControl: true,
                attributionControl: false
            });

            // Add tile layer
            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
            }).addTo(map);

            leafletMapRef.current = map;

            // Force resize after initialization
            setTimeout(() => {
                map.invalidateSize();
            }, 100);

        } catch (error) {
            console.error('❌ Error initializing mobile map:', error);
        }
    }, []);

    // Add markers for interventions
    React.useEffect(() => {
        if (!leafletMapRef.current || !interventions.length) return;

        // Clear existing markers
        leafletMapRef.current.eachLayer((layer: any) => {
            if (layer.options && layer.options.intervention) {
                leafletMapRef.current.removeLayer(layer);
            }
        });

        // Add new markers with colors and selection highlighting
        interventions.forEach(intervention => {
            if (intervention.coordinates) {
                const isSelected = selectedIntervention?.id === intervention.id;
                const color = statusColors[intervention.status] || '#6B7280';
                const icon = createColoredIcon(color, isSelected);

                const marker = window.L.marker([
                    intervention.coordinates.lat, 
                    intervention.coordinates.lng
                ], {
                    icon: icon,
                    intervention: intervention
                });

                // Enhanced popup with status color
                marker.bindPopup(`
                    <div class="p-3 min-w-[200px]">
                        <h3 class="font-bold text-gray-900 mb-1">${intervention.title}</h3>
                        <p class="text-sm text-gray-700 mb-2">${intervention.address}</p>
                        <div class="flex items-center gap-2">
                            <span class="inline-block w-3 h-3 rounded-full" style="background-color: ${color}"></span>
                            <span class="text-xs font-medium" style="color: ${color}">${intervention.status}</span>
                        </div>
                        <p class="text-xs text-gray-500 mt-1">ID: #${intervention.id}</p>
                    </div>
                `);

                marker.on('click', () => {
                    onSelectIntervention(intervention);
                });

                marker.addTo(leafletMapRef.current);
            }
        });

        // Fit bounds to show all markers
        if (interventions.length > 0) {
            const group = new window.L.featureGroup(
                interventions
                    .filter(i => i.coordinates)
                    .map(i => window.L.marker([i.coordinates!.lat, i.coordinates!.lng]))
            );
            leafletMapRef.current.fitBounds(group.getBounds().pad(0.1));
        }
    }, [interventions, selectedIntervention, onSelectIntervention]);

    // Handle map centering and zoom when clicking map icon on intervention
    React.useEffect(() => {
        if (!leafletMapRef.current) return;
        
        const targetCoords = mapCenter ?? selectedIntervention?.coordinates;
        if (targetCoords) {
            // Zoom to specific intervention with animation
            leafletMapRef.current.flyTo([targetCoords.lat, targetCoords.lng], 15, { 
                duration: 1.2 
            });
        }
    }, [mapCenter, selectedIntervention]);

    return (
        <div className="w-full h-full relative">
            <div 
                ref={mapRef} 
                className="w-full h-full"
                style={{ minHeight: '300px' }}
            />
            <div className="absolute top-2 left-2 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow text-xs">
                📍 {interventions.length} interventi
            </div>
        </div>
    );
};

export default SimpleMobileMap;
