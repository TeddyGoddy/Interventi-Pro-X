import * as React from 'react';
import { Intervention, Personnel, Team, Coordinates, Asset, PaymentStatus, EconomicDetails, UsedMaterial, Attachment, MapService, MapStyle } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';

import GeneralTab from './details_tabs/GeneralTab';
import EconomyTab from './details_tabs/EconomyTab';
import MaterialsTab from './details_tabs/MaterialsTab';
import AttachmentsTab from './details_tabs/AttachmentsTab';
import HistoryTab from './details_tabs/HistoryTab';

interface InterventionDetailsProps {
    intervention: Intervention | null;
    personnel: Personnel[];
    teams: Team[];
    assets: Asset[];
    onUpdateStatus: (id: number, status: any) => void;
    onUpdatePriority: (id: number, priority: any) => void;
    onAssignTeam: (id: number, teamId: number | null) => void;
    onAssignMultipleTeams: (id: number, teamIds: number[]) => void;
    onUpdateDetails: (id: number, details: { description?: string, notes?: string, title?: string, address?: string, coordinates?: Coordinates }) => void;
    onAddHistoryLog: (id: number, description: string) => void;
    onCenterMap: (coordinates: Coordinates) => void;
    onUpdateEconomicDetails: (id: number, economicDetails: EconomicDetails) => void;
    onUpdatePaymentStatus: (id: number, status: PaymentStatus) => void;
    onAddMaterial: (id: number, material: UsedMaterial) => void;
    onRemoveMaterial: (id: number, materialId: string) => void;
    onUpdateAsset?: (interventionId: number, asset: Asset) => void;
    onAddAttachment: (id: number, attachment: Attachment) => void;
    onRemoveAttachment: (id: number, attachmentId: string) => void;
    onOpenImagePreview: (url: string) => void;
    onDeleteIntervention: (id: number) => void;
    onOpenTeamAttendanceModal?: (intervention: Intervention, teamId?: number) => void;
    isExpanded?: boolean;
    onToggleExpansion?: () => void;
    hideHeader?: boolean; // Per nascondere l'header in modalità mobile
    mapService: MapService;
    theme: string;
    mapStyle: MapStyle;
}

type Tab = 'general' | 'economy' | 'materials' | 'attachments' | 'history';

const InterventionDetails: React.FC<InterventionDetailsProps> = (props) => {
    const { intervention, assets, onDeleteIntervention, isExpanded, onToggleExpansion, hideHeader = false } = props;
    const [activeTab, setActiveTab] = React.useState<Tab>('general');
    const isMobile = useIsMobile();
    const previousInterventionIdRef = React.useRef<number | null>(null);
    
    React.useEffect(() => {
        if (intervention) {
            // Solo resetta il tab se è un intervento diverso (ID diverso)
            // Non resettare se è lo stesso intervento ma aggiornato
            if (previousInterventionIdRef.current !== intervention.id) {
                setActiveTab('general');
                previousInterventionIdRef.current = intervention.id;
            }
        } else {
            // Se non c'è intervento, resetta il ref
            previousInterventionIdRef.current = null;
        }
    }, [intervention]);
    
    if (!intervention) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col items-center justify-center transition-all duration-300">
                <div className="text-center p-8">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nessun intervento selezionato</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                        Seleziona un intervento dalla lista a sinistra per visualizzarne i dettagli completi.
                    </p>
                </div>
            </div>
        );
    }
    
    const interventionAsset = assets.find(a => a.id === intervention.assetId);

    const TabButton: React.FC<{tab: Tab, label: string, icon: React.ReactNode}> = ({ tab, label, icon }) => (
        <button 
            onClick={() => setActiveTab(tab)}
            role="tab"
            aria-selected={activeTab === tab}
            className={`group inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap mobile-tab-button ${
                activeTab === tab 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
        >
            <span className={`transition-colors duration-200 ${
                activeTab === tab ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
            }`}>
                {icon}
            </span>
            {label}
        </button>
    );

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col transition-all duration-300 mobile-details-container">
            {/* HEADER COMPATTO E PROFESSIONALE */}
            {!hideHeader && (
                <div className="relative">
                {/* Header Content */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                            {/* Icon Badge Compatto */}
                            <div className="flex-shrink-0">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                    intervention.status === 'Completato' ? 'bg-green-50 dark:bg-green-900/20' :
                                    intervention.status === 'In Corso' ? 'bg-blue-50 dark:bg-blue-900/20' :
                                    intervention.status === 'In Attesa' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                                    'bg-gray-50 dark:bg-gray-900/20'
                                }`}>
                                    {intervention.status === 'Completato' ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    ) : intervention.status === 'In Corso' ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    ) : intervention.status === 'In Attesa' ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    )}
                                </div>
                            </div>
                            
                            {/* Title & Badges Compatti */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate" title={intervention.title}>
                                        {intervention.title}
                                    </h2>
                                    
                                    {/* Priority Badge con Icona SVG */}
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                                        intervention.priority === 'Urgente' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                                        intervention.priority === 'Alta' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300' :
                                        intervention.priority === 'Media' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                                        'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                                    }`}>
                                        {intervention.priority === 'Urgente' ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                            </svg>
                                        ) : intervention.priority === 'Alta' ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        ) : intervention.priority === 'Media' ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        )}
                                        {intervention.priority}
                                    </span>
                                </div>
                                
                                {/* Info Essenziali */}
                                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a1.994 1.994 0 01-1.414.586H7a4 4 0 01-4-4V7a4 4 0 014-4z" />
                                        </svg>
                                        ID {intervention.id}
                                    </span>
                                    
                                    {intervention.scheduledStartDate ? (
                                        <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            Programmato {new Date(intervention.scheduledStartDate).toLocaleDateString('it-IT')}
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            {new Date(intervention.creationDate).toLocaleDateString('it-IT')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            {onToggleExpansion && !isMobile && (
                                <button
                                    onClick={onToggleExpansion}
                                    className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-200"
                                    aria-label={isExpanded ? "Comprimi dettagli" : "Espandi dettagli"}
                                    title={isExpanded ? "Comprimi dettagli" : "Espandi dettagli"}
                                >
                                    {isExpanded ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7-7m0 0l-7 7m7-7v18" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    )}
                                </button>
                            )}
                            <button
                                onClick={() => onDeleteIntervention(intervention.id)}
                                className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-200"
                                aria-label="Elimina intervento"
                                title="Elimina intervento"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Barra di Ridimensionamento */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-transparent hover:bg-blue-500/20 cursor-ns-resize group transition-colors duration-200"
                     title="Trascina per ridimensionare">
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-gray-300 dark:bg-gray-600 group-hover:bg-blue-500 transition-colors duration-200"></div>
                </div>
            </div>
            )}
            
            {/* Modern Tabs */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 mobile-tab-container">
                <nav className="flex space-x-1 overflow-x-auto scrollbar-hide mobile-tabs" aria-label="Tabs">
                    <TabButton 
                        tab="general" 
                        label="Generale" 
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                    />
                    <TabButton 
                        tab="economy" 
                        label="Economia" 
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                        }
                    />
                    <TabButton 
                        tab="materials" 
                        label="Materiali" 
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        }
                    />
                    <TabButton 
                        tab="attachments" 
                        label="Allegati" 
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                        }
                    />
                    <TabButton 
                        tab="history" 
                        label="Cronologia" 
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                    />
                </nav>
            </div>

            {/* Content Area - MIGLIORATO SCROLL */}
            <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
                    <div className="p-6 pb-12 min-h-full">
                        {activeTab === 'general' && <GeneralTab {...props} />}
                        {activeTab === 'economy' && <EconomyTab intervention={intervention} onUpdateEconomicDetails={props.onUpdateEconomicDetails} onUpdatePaymentStatus={props.onUpdatePaymentStatus} />}
                        {activeTab === 'materials' && <MaterialsTab intervention={intervention} asset={interventionAsset} onAddMaterial={props.onAddMaterial} onRemoveMaterial={props.onRemoveMaterial} onUpdateAsset={props.onUpdateAsset} />}
                        {activeTab === 'attachments' && <AttachmentsTab intervention={intervention} onOpenImagePreview={props.onOpenImagePreview} onAddAttachment={props.onAddAttachment} onRemoveAttachment={props.onRemoveAttachment} />}
                        {activeTab === 'history' && <HistoryTab intervention={intervention} onAddHistoryLog={props.onAddHistoryLog} />}
                        
                        {/* Spazio extra per scroll completo */}
                        <div className="h-32"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InterventionDetails;