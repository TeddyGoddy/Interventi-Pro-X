import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Intervention, Vehicle, Team, Coordinates, MapStyle, Priority, InterventionStatus, Personnel, Asset, EconomicDetails, PaymentStatus, UsedMaterial, Attachment, MapOverlay, MapService } from '../types';
import InterventionList from './InterventionList';
import InterventionDetails from './InterventionDetails';
import LeafletMapView from './maps/LeafletMapView';

// Combine all props needed by MapView and its children
interface MapFilters {
    showTeams: boolean;
    showHighPriority: boolean;
    showCompleted: boolean;
}
interface MapViewProps {
    // Data
    interventions: Intervention[];
    selectedIntervention: Intervention | null;
    personnel: Personnel[];
    assets: Asset[];
    teams: Team[];
    vehicles: Vehicle[];
    // State & Handlers for InterventionList
    onSelectIntervention: (intervention: Intervention) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    statusFilter: InterventionStatus | 'all';
    setStatusFilter: (status: InterventionStatus | 'all') => void;
    priorityFilter: Priority | 'all';
    setPriorityFilter: (priority: Priority | 'all') => void;
    onCreateIntervention: () => void;
    // Map specific
    mapCenter: Coordinates | null;
    theme: string;
    mapStyle: MapStyle;
    setMapStyle: (style: MapStyle) => void;
    mapOverlay: MapOverlay;
    mapFilters: MapFilters;
    forceRefresh?: number;
    // InterventionDetails Actions
    onUpdateStatus: (id: number, status: InterventionStatus) => void;
    onUpdatePriority: (id: number, priority: Priority) => void;
    onAssignTeam: (id: number, teamId: number | null) => void;
    onAssignMultipleTeams: (id: number, teamIds: number[]) => void;
    onUpdateDetails: (id: number, details: { description?: string; notes?: string }) => void;
    mapService: MapService;
    onUpdateEconomicDetails: (id: number, economicDetails: EconomicDetails) => void;
    onUpdatePaymentStatus: (id: number, paymentStatus: PaymentStatus) => void;
    onAddHistoryLog: (id: number, description: string) => void;
    onAddMaterial: (id: number, material: UsedMaterial) => void;
    onRemoveMaterial: (id: number, materialId: string) => void;
    onUpdateAsset?: (interventionId: number, asset: Asset) => void;
    onAddAttachment: (id: number, attachment: Attachment) => void;
    onRemoveAttachment: (id: number, attachmentId: string) => void;
    onOpenImagePreview: (url: string) => void;
    onDeleteIntervention: (id: number) => void;
}

const MapView: React.FC<MapViewProps> = (props) => {
    const mapRef = React.useRef<any>(null);

    const handleMapReady = (mapInstance: any) => {
        mapRef.current = mapInstance;
    };

    const invalidateMapSize = () => {
        if (mapRef.current) {
            // Delay invalidateSize to allow panels to resize first
            setTimeout(() => mapRef.current.invalidateSize(), 0);
        }
    };

    return (
        <div className="h-full bg-base-light dark:bg-base-dark text-text-light dark:text-text-dark">
            <PanelGroup direction="horizontal" onLayout={invalidateMapSize}>
                <Panel defaultSize={25} minSize={20} className="min-w-[350px]">
                    <InterventionList 
                        interventions={props.interventions}
                        onSelectIntervention={props.onSelectIntervention}
                        selectedIntervention={props.selectedIntervention}
                        searchTerm={props.searchTerm}
                        setSearchTerm={props.setSearchTerm}
                        statusFilter={props.statusFilter}
                        setStatusFilter={props.setStatusFilter}
                        priorityFilter={props.priorityFilter}
                        setPriorityFilter={props.setPriorityFilter}
                        onAddClick={props.onCreateIntervention}
                    />
                </Panel>
                <PanelResizeHandle className="w-2 bg-border-light dark:bg-border-dark hover:bg-primary-light dark:hover:bg-primary-dark transition-colors" />
                <Panel>
                    <PanelGroup direction="vertical" onLayout={invalidateMapSize}>
                        <Panel defaultSize={67} minSize={30}>
                            <LeafletMapView 
                                interventions={props.interventions}
                                selectedIntervention={props.selectedIntervention}
                                onSelectIntervention={props.onSelectIntervention}
                                vehicles={props.vehicles}
                                teams={props.teams}
                                mapCenter={props.mapCenter}
                                theme={props.theme}
                                mapStyle={props.mapStyle}
                                setMapStyle={props.setMapStyle}
                                mapOverlay={props.mapOverlay}
                                mapFilters={props.mapFilters}
                                forceRefresh={props.forceRefresh}
                                onMapReady={handleMapReady}
                            />
                        </Panel>
                        <PanelResizeHandle className="h-2 bg-border-light dark:bg-border-dark hover:bg-primary-light dark:hover:bg-primary-dark transition-colors" />
                        <Panel minSize={20}>
                            <div className="h-full overflow-y-auto bg-surface-light dark:bg-surface-dark">
                                {props.selectedIntervention && (
                                    <InterventionDetails 
                                        intervention={props.selectedIntervention}
                                        personnel={props.personnel}
                                        assets={props.assets}
                                        teams={props.teams}
                                        onUpdateStatus={props.onUpdateStatus}
                                        onUpdatePriority={props.onUpdatePriority}
                                        onAssignTeam={props.onAssignTeam}
                                        onAssignMultipleTeams={props.onAssignMultipleTeams}
                                        onUpdateDetails={props.onUpdateDetails}
                                        onUpdateEconomicDetails={props.onUpdateEconomicDetails}
                                        onUpdatePaymentStatus={props.onUpdatePaymentStatus}
                                        onAddHistoryLog={props.onAddHistoryLog}
                                        onAddMaterial={props.onAddMaterial}
                                        onRemoveMaterial={props.onRemoveMaterial}
                                        onUpdateAsset={props.onUpdateAsset}
                                        onAddAttachment={props.onAddAttachment}
                                        onRemoveAttachment={props.onRemoveAttachment}
                                        onOpenImagePreview={props.onOpenImagePreview}
                                        onDeleteIntervention={props.onDeleteIntervention}
                                        onCenterMap={() => {}}
                                        mapService={props.mapService}
                                        theme={props.theme}
                                        mapStyle={props.mapStyle}
                                    />
                                )}
                            </div>
                        </Panel>
                    </PanelGroup>
                </Panel>
            </PanelGroup>
        </div>
    );
};

export default MapView;