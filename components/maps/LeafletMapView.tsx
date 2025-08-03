import React from 'react';
import { Intervention, Vehicle, Team, InterventionStatus, Priority, Coordinates, MapStyle, MapOverlay } from '../../types';
import { useMap } from '../../contexts/MapContext';
import 'leaflet.heat';

interface LeafletMapViewProps {
    interventions: Intervention[];
    selectedIntervention: Intervention | null;
    onSelectIntervention: (intervention: Intervention) => void;
    vehicles: Vehicle[];
    teams: Team[];
    mapCenter: Coordinates | null;
    theme: string;
    mapStyle: MapStyle;
    setMapStyle: (style: MapStyle) => void;
    mapOverlay: MapOverlay;
    mapFilters: MapFilters;
    onMapReady?: (mapInstance: any) => void;
    forceRefresh?: number; // Timestamp per forzare refresh marker
}

interface MapFilters {
  showTeams: boolean;
  showHighPriority: boolean;
  showCompleted: boolean;
}

const statusColors: Record<InterventionStatus, string> = {
    [InterventionStatus.NEW]: '#3B82F6', // blue-500
    [InterventionStatus.PENDING]: '#F97316', // orange-500
    [InterventionStatus.IN_PROGRESS]: '#F59E0B', // amber-500
    [InterventionStatus.COMPLETED]: '#10B981', // emerald-500
    [InterventionStatus.CANCELED]: '#6B7280', // gray-500
};

const LeafletMapView: React.FC<LeafletMapViewProps> = ({ 
    interventions, selectedIntervention, onSelectIntervention, vehicles, teams,
    mapCenter, theme, mapStyle, setMapStyle, mapOverlay, mapFilters, onMapReady, forceRefresh
}) => {
    const mapContainerRef = React.useRef<HTMLDivElement>(null);
    const mapRef = React.useRef<any>(null);
    const tileLayerRef = React.useRef<any>(null);
    const vehicleMarkersLayer = React.useRef<any>(null);
    const interventionMarkersLayer = React.useRef<any>(null); // This will be the cluster or standard layer
    const heatmapLayer = React.useRef<any>(null);


    const vehicleMarkersRef = React.useRef<Map<number, any>>(new Map());
    const interventionMarkersRef = React.useRef<Map<number, any>>(new Map());
    
    const { hasCluster, hasHeatmap } = useMap();
    const activeOverlay = mapOverlay;
    const filters = mapFilters;

        const heatPoints = React.useMemo(() => {
        console.log('🔥 Calculating heatPoints...');
        console.log('🔥 Total interventions:', interventions.length);
        console.log('🔥 Filters:', filters);
        
        const filtered = interventions
            .filter(iv => (filters.showHighPriority ? true : iv.priority !== Priority.URGENT) && (filters.showCompleted ? true : iv.status !== InterventionStatus.COMPLETED));
        
        console.log('🔥 Filtered interventions:', filtered.length);
        
        const points = filtered.map(iv => {
            console.log('🔥 Processing intervention:', iv.id, 'coords:', iv.coordinates);
            return [iv.coordinates.lat, iv.coordinates.lng, iv.priority === Priority.URGENT ? 1 : 0.5];
        });
        
        console.log('🔥 Final heatPoints:', points.length, 'points');
        return points;
    }, [interventions, filters.showHighPriority, filters.showCompleted]);

    const heatmapData = interventions.map(iv => ({
        lat: iv.coordinates.lat,
        lng: iv.coordinates.lng,
        value: iv.priority === Priority.HIGH ? 2 : 1
    }));





    const tiles = {
      'osm': {
          light: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          dark: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', // Manteniamo sempre la versione chiara
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19 // OSM supporta fino al livello 19
      },
      'carto-positron': {
          light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
          dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          maxZoom: 18 // Carto supporta fino al livello 18
      }
    };
    
    const createIcon = React.useCallback((color: string, iconSvg: string, isUrgent: boolean, isSelected: boolean) => {
        const pulseClass = isUrgent ? 'marker-pulse' : '';
        const selectedClass = isSelected ? 'selected-marker' : '';
        const iconHtml = `
            <div class="${pulseClass}" style="position: relative;">
              <div style="background-color: ${color};" class="rounded-full w-8 h-8 flex items-center justify-center text-white shadow-lg ring-2 ring-white/50">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  ${iconSvg}
                </svg>
              </div>
            </div>
        `;
        return window.L.divIcon({
            html: iconHtml,
            className: `leaflet-div-icon ${selectedClass}`,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        });
    }, []);

    // Initialize map and handle theme/tile changes
    React.useEffect(() => {
        const currentTileProvider = tiles[mapStyle];
        const currentMaxZoom = currentTileProvider.maxZoom;
        
        if (mapContainerRef.current && !mapRef.current) {
            mapRef.current = window.L.map(mapContainerRef.current, {
                zoomControl: false,
                maxZoom: currentMaxZoom
            }).setView([42.504154, 12.646361], 6);

            window.L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);
            vehicleMarkersLayer.current = window.L.layerGroup().addTo(mapRef.current);

            // Heatmap initialization moved to separate useEffect
            if (mapRef.current && onMapReady) {
                onMapReady(mapRef.current);
            }
        }
        
        // Force resize for mobile
        setTimeout(() => {
            if (mapRef.current) {
                mapRef.current.invalidateSize();
            }
        }, 100);

        if (mapRef.current) {
            const tileProvider = tiles[mapStyle];
            const tileUrl = theme === 'dark' ? tileProvider.dark : tileProvider.light;
            const tileAttribution = tileProvider.attribution;
            const maxZoom = tileProvider.maxZoom;

            // Aggiorna il maxZoom della mappa se è cambiato
            if (mapRef.current.options.maxZoom !== maxZoom) {
                mapRef.current.options.maxZoom = maxZoom;
                // Se il zoom corrente supera il nuovo limite, riduci il zoom
                if (mapRef.current.getZoom() > maxZoom) {
                    mapRef.current.setZoom(maxZoom);
                }
            }

            if (tileLayerRef.current) {
                tileLayerRef.current.setUrl(tileUrl);
                tileLayerRef.current.options.maxZoom = maxZoom;
                const currentAttribution = tileLayerRef.current.options.attribution;
                if (currentAttribution !== tileAttribution) {
                    mapRef.current.attributionControl.removeAttribution(currentAttribution);
                    mapRef.current.attributionControl.addAttribution(tileAttribution);
                    tileLayerRef.current.options.attribution = tileAttribution;
                }
            } else {
                tileLayerRef.current = window.L.tileLayer(tileUrl, { 
                    attribution: tileAttribution,
                    maxZoom: maxZoom
                }).addTo(mapRef.current);
            }
        }

        return () => {
            if (mapRef.current && mapContainerRef.current && !mapContainerRef.current.isConnected) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [theme, mapStyle, hasHeatmap]);

    // Initialize heatmap layer when data is ready
    React.useEffect(() => {
        if (!mapRef.current || !hasHeatmap || heatmapLayer.current) return;
        
        if (typeof window.L.heatLayer === 'function') {
            console.log('🔥 Initializing heatmap layer with', heatPoints.length, 'points...');
            heatmapLayer.current = window.L.heatLayer(heatPoints, {
                radius: 25,
                blur: 15,
                maxZoom: 17,
                gradient: {0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red'}
            });
            console.log('🔥 Heatmap layer created:', heatmapLayer.current);
            
            // If heatmap is currently active, add it to the map
            if (activeOverlay === 'heatmap') {
                console.log('🔥 Adding heatmap to map immediately...');
                mapRef.current.addLayer(heatmapLayer.current);
            }
        }
    }, [hasHeatmap, heatPoints, activeOverlay]);
    
    // Handle overlay changes (standard, cluster, heatmap)
    React.useEffect(() => {
        if (!mapRef.current) return;

        if (interventionMarkersLayer.current) {
            mapRef.current.removeLayer(interventionMarkersLayer.current);
            interventionMarkersLayer.current = null;
        }
        if (heatmapLayer.current && mapRef.current.hasLayer(heatmapLayer.current)) {
            mapRef.current.removeLayer(heatmapLayer.current);
        }
        
        interventionMarkersRef.current.clear();

        if (activeOverlay === 'cluster' && hasCluster) {
             interventionMarkersLayer.current = window.L.markerClusterGroup();
        } else {
             interventionMarkersLayer.current = window.L.layerGroup();
        }
        
        if(activeOverlay !== 'heatmap') {
            mapRef.current.addLayer(interventionMarkersLayer.current);
        } else if (hasHeatmap && heatmapLayer.current) {
            console.log('🔥 Adding heatmap layer to map...');
            mapRef.current.addLayer(heatmapLayer.current);
            console.log('🔥 Heatmap layer added to map');
        }

    }, [activeOverlay, hasCluster, hasHeatmap]);


    // Update vehicle markers
    React.useEffect(() => {
        if (!vehicleMarkersLayer.current || !vehicles || !teams) return;
        
        const vehicleIconSvg = `<path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />`;

        const currentMarkerIds = new Set(vehicles.map(v => v.id));

        vehicleMarkersRef.current.forEach((marker, id) => {
            if (!currentMarkerIds.has(id)) {
                vehicleMarkersLayer.current.removeLayer(marker);
                vehicleMarkersRef.current.delete(id);
            }
        });
        
        vehicles.forEach(vehicle => {
            const icon = createIcon('#1E40AF', vehicleIconSvg, false, false);
            const latLng = [vehicle.position.lat, vehicle.position.lng];
            const existingMarker = vehicleMarkersRef.current.get(vehicle.id);
            const popupContent = `<b>${vehicle.name}</b><br>${vehicle.licensePlate}<br><small>Disponibile per squadre</small>`;

            if (existingMarker) {
                existingMarker.setLatLng(latLng).setIcon(icon).setPopupContent(popupContent);
            } else {
                const newMarker = window.L.marker(latLng, { icon }).bindPopup(popupContent);
                vehicleMarkersLayer.current.addLayer(newMarker);
                vehicleMarkersRef.current.set(vehicle.id, newMarker);
            }
        });
    }, [vehicles, teams, createIcon]);

    React.useEffect(() => {
        if (!vehicleMarkersLayer.current) return;
        
        vehicles.forEach(vehicle => {
            const marker = vehicleMarkersRef.current.get(vehicle.id);
            if (marker) {
                if (filters.showTeams) {
                    marker.addTo(mapRef.current);
                } else {
                    mapRef.current.removeLayer(marker);
                }
            }
        });
    }, [filters.showTeams]);

    // Update intervention markers and heatmap data
    React.useEffect(() => {
        if ((activeOverlay === 'heatmap' && !heatmapLayer.current) || (activeOverlay !== 'heatmap' && !interventionMarkersLayer.current)) return;
        
        if (activeOverlay === 'heatmap' && hasHeatmap && heatmapLayer.current) {
            console.log('🔥 Updating heatmap with points:', heatPoints.length, 'points');
            console.log('🔥 Sample points:', heatPoints.slice(0, 3));
            heatmapLayer.current.setLatLngs(heatPoints);
            return; // Don't process markers for heatmap view
        }
        
        if (activeOverlay !== 'heatmap' && interventionMarkersLayer.current) {
            const interventionIconSvg = `<path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />`;
            
            console.log('🗺️ [LEAFLET MAP] Aggiornamento marker interventi:', {
                interventionsCount: interventions.length,
                forceRefresh,
                selectedIntervention: selectedIntervention?.id
            });
            
            interventionMarkersLayer.current.clearLayers();
            interventionMarkersRef.current.clear();

            interventions.forEach(iv => {
                const isSelected = selectedIntervention?.id === iv.id;
                const icon = createIcon(statusColors[iv.status] || '#6B7280', interventionIconSvg, iv.priority === Priority.URGENT && iv.status !== InterventionStatus.COMPLETED, isSelected);
                const latLng = [iv.coordinates.lat, iv.coordinates.lng];
                
                // 🔍 DEBUG: Log coordinate per ogni marker
                console.log(`📍 [MARKER ${iv.id}] Coordinate:`, {
                    id: iv.id,
                    title: iv.title,
                    address: iv.address,
                    coordinates: iv.coordinates,
                    latLng,
                    isSelected
                });
                
                const newMarker = window.L.marker(latLng, { icon, zIndexOffset: isSelected ? 1000 : 0 })
                    .bindPopup(iv.title)
                    .on('click', () => onSelectIntervention(iv));
                
                interventionMarkersRef.current.set(iv.id, newMarker);
            });

            const markersToAdd = Array.from(interventionMarkersRef.current.values());
            
            if (interventionMarkersLayer.current.addLayers) {
                interventionMarkersLayer.current.addLayers(markersToAdd);
            } else {
                markersToAdd.forEach(marker => interventionMarkersLayer.current.addLayer(marker));
            }
        }

    }, [interventions, selectedIntervention, onSelectIntervention, createIcon, activeOverlay, hasHeatmap, heatPoints, forceRefresh]);

    // Handle map centering
    React.useEffect(() => {
        if (!mapRef.current) return;
        const targetCoords = mapCenter ?? selectedIntervention?.coordinates;
        if (targetCoords) {
            mapRef.current.flyTo([targetCoords.lat, targetCoords.lng], 15, { duration: 1.2 });
        } else if (interventions.length > 0 && activeOverlay !== 'heatmap' && interventionMarkersLayer.current?.getBounds) {
            const bounds = interventionMarkersLayer.current.getBounds();
            if(bounds.isValid()){
                 mapRef.current.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    }, [selectedIntervention, mapCenter, interventions, activeOverlay]);


    return (
      <div className="relative h-full w-full rounded-lg overflow-hidden">
        <div 
          ref={mapContainerRef} 
          className="leaflet-container w-full h-full" 
          style={{ minHeight: '300px', height: '100%', width: '100%' }}
        />
      </div>
    );
};

export default LeafletMapView;