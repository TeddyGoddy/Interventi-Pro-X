import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './services/db';
import { Intervention, InterventionStatus, Client, Personnel, Priority, ActivityLog, Coordinates, MapStyle, MapService, MapOverlay, Asset, PaymentStatus, EconomicDetails, UsedMaterial, Attachment, Team, Vehicle, InterventionTeamDetails, TeamMemberAttendance, ExternalMember } from './types';
import Header from './components/Header';
import InterventionList from './components/InterventionList';
import InterventionDetails from './components/InterventionDetails';
import LeafletMapView from './components/maps/LeafletMapView';
import CreateInterventionModal from './components/CreateInterventionModal';
import DraggableHandle from './components/DraggableHandle';
import StatsBar from './components/StatsBar';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import ImagePreviewModal from './components/ImagePreviewModal';
import { useMap } from './contexts/MapContext';
import AnalyticsPage from './components/AnalyticsPage';
import ConfirmationModal from './components/ConfirmationModal';
import ResourcesPage from './components/ResourcesPage';
import PlanningPage from './components/PlanningPage';
import SettingsModal from './components/SettingsModal';
import { useIsMobile } from './hooks/useIsMobile';
import MapDebug from './components/MapDebug';
import SimpleMobileMap from './components/SimpleMobileMap';
import TeamAttendanceModal from './components/TeamAttendanceModal';

const App: React.FC = () => {
    const [selectedInterventionId, setSelectedInterventionId] = React.useState<number | null>(null);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState<InterventionStatus | 'all'>('all');
    const [priorityFilter, setPriorityFilter] = React.useState<Priority | 'all'>('all');
    const [sortOrder, setSortOrder] = React.useState<string>('creationDate-desc');
    const [isDetailsExpanded, setIsDetailsExpanded] = React.useState(false);
    const [statsBarFilter, setStatsBarFilter] = React.useState<InterventionStatus | null>(null);
    const isMobile = useIsMobile();
    const [mobileView, setMobileView] = React.useState<'list' | 'details' | 'map'>('list');
    
    // Invalidate map when switching to map view on mobile
    React.useEffect(() => {
        if (isMobile && mobileView === 'map' && mapRef.current) {
            setTimeout(() => {
                mapRef.current.invalidateSize();
            }, 100);
        }
    }, [isMobile, mobileView]);

    // --- Data fetching from IndexedDB ---
    const interventions = useLiveQuery(() => db.interventions.toArray(), []);
    const personnel = useLiveQuery(() => db.personnel.toArray(), []);
    const clients = useLiveQuery(() => db.clients.toArray(), []);
    const assets = useLiveQuery(() => db.assets.toArray(), []);
    const teams = useLiveQuery(() => db.teams.toArray(), []);
    const vehicles = useLiveQuery(() => db.vehicles.toArray(), []);

    const filteredAndSortedInterventions = React.useMemo(() => {
        if (!interventions) return [];
        
        let filtered = interventions.filter(intervention => {
            const searchTermMatch = searchTerm === '' || 
                intervention.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                intervention.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                intervention.description.toLowerCase().includes(searchTerm.toLowerCase());

            const statusMatch = statusFilter === 'all' || intervention.status === statusFilter;
            const priorityMatch = priorityFilter === 'all' || intervention.priority === priorityFilter;
            const statsBarMatch = statsBarFilter === null || intervention.status === statsBarFilter;

            return searchTermMatch && statusMatch && priorityMatch && statsBarMatch;
        });

        switch (sortOrder) {
            case 'priority-desc':
                filtered.sort((a, b) => b.priority.localeCompare(a.priority));
                break;
            case 'priority-asc':
                filtered.sort((a, b) => a.priority.localeCompare(b.priority));
                break;
            case 'status':
                filtered.sort((a, b) => a.status.localeCompare(b.status));
                break;
            case 'creationDate-asc':
                filtered.sort((a, b) => new Date(a.creationDate).getTime() - new Date(b.creationDate).getTime());
                break;
            case 'creationDate-desc':
            default:
                filtered.sort((a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime());
                break;
        }

        return filtered;
    }, [interventions, searchTerm, statusFilter, priorityFilter, sortOrder, statsBarFilter]);
    const [theme, setTheme] = React.useState(() => localStorage.getItem('theme') || 'light');
    const [uiDensity, setUiDensity] = React.useState<'compact' | 'normal' | 'spacious'>(() => {
        const saved = localStorage.getItem('ui-density');
        return (saved as 'compact' | 'normal' | 'spacious') || 'normal';
    });
    const [fontFamily, setFontFamily] = React.useState<'system' | 'styrene' | 'inter' | 'roboto' | 'opensans'>(() => {
        const saved = localStorage.getItem('font-family');
        return (saved as 'system' | 'styrene' | 'inter' | 'roboto' | 'opensans') || 'system';
    });
    const [mapStyle, setMapStyle] = React.useState<MapStyle>('carto-positron');
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
    const [sidebarWidth, setSidebarWidth] = React.useState(420);
    const [mapCenter, setMapCenter] = React.useState<Coordinates | null>(null);
    const [forceMapRefresh, setForceMapRefresh] = React.useState<number>(0);
    const [isPreviewImageOpen, setIsPreviewImageOpen] = React.useState(false);
    const [previewImageUrl, setPreviewImageUrl] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    
    // Team Attendance Modal state
    const [isTeamAttendanceModalOpen, setIsTeamAttendanceModalOpen] = React.useState(false);
    const [selectedTeamForAttendance, setSelectedTeamForAttendance] = React.useState<{ intervention: Intervention; teamId: number } | null>(null);
    const [activeView, setActiveView] = React.useState<'dashboard' | 'analytics' | 'resources' | 'planning'>('dashboard');
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
    const [isStatsBarCollapsed, setIsStatsBarCollapsed] = React.useState(false);
    
    // Map settings state
    const [mapOverlay, setMapOverlay] = React.useState<MapOverlay>(() => {
        const saved = localStorage.getItem('map-overlay');
        return (saved as MapOverlay) || 'standard';
    });
    const [mapFilters, setMapFilters] = React.useState(() => {
        const saved = localStorage.getItem('map-filters');
        return saved ? JSON.parse(saved) : { showTeams: true, showHighPriority: true, showCompleted: true };
    });

    const handleOpenImagePreview = (url: string) => {
        setPreviewImageUrl(url);
        setIsPreviewImageOpen(true);
    };
    
    // State for deleting interventions
    const [isInterventionDeleteConfirmOpen, setIsInterventionDeleteConfirmOpen] = React.useState(false);
    const [interventionToDeleteId, setInterventionToDeleteId] = React.useState<number | null>(null);

    // State for deleting resources
    const [isResourceDeleteConfirmOpen, setIsResourceDeleteConfirmOpen] = React.useState(false);
    const [resourceToDelete, setResourceToDelete] = React.useState<{type: 'personnel' | 'vehicle' | 'team', id: number, name: string} | null>(null);

    const { mapService } = useMap();

    const selectedIntervention = React.useMemo(() => {
        if (!interventions || !selectedInterventionId) {
            return null;
        }
        return interventions.find(iv => iv.id === selectedInterventionId) ?? null;
    }, [interventions, selectedInterventionId]);

    // --- DB Initialization ---
    React.useEffect(() => {
        const initializeDatabase = async () => {
            try {
                await db.populate();
                console.log("Database popolato con dati di esempio (se necessario).");

                if (activeView === 'dashboard') {
                    const lastIntervention = await db.interventions.orderBy('lastUpdate').last();
                    if (lastIntervention) {
                        setSelectedInterventionId(lastIntervention.id);
                    }
                }
            } catch (error) {
                console.error("Errore fatale durante l'inizializzazione del database:", error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeDatabase();

    }, [activeView]);


    React.useEffect(() => {
        document.documentElement.className = theme;
        localStorage.setItem('theme', theme);
    }, [theme]);

    React.useEffect(() => {
        document.documentElement.setAttribute('data-ui-density', uiDensity);
    }, [uiDensity]);

    React.useEffect(() => {
        const fontMap: Record<string, string> = {
            'system': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'styrene': '"Styrene B", system-ui, sans-serif',
            'inter': '"Inter", system-ui, sans-serif',
            'roboto': '"Roboto", system-ui, sans-serif',
            'opensans': '"Open Sans", system-ui, sans-serif'
        };
        document.documentElement.style.setProperty('--font-family', fontMap[fontFamily] || fontMap.system);
        localStorage.setItem('font-family', fontFamily);
    }, [fontFamily]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const handleUiDensityChange = (density: 'compact' | 'normal' | 'spacious') => {
        setUiDensity(density);
        localStorage.setItem('ui-density', density);
    };

    const handleFontFamilyChange = (font: 'system' | 'styrene' | 'inter' | 'roboto' | 'opensans') => {
        setFontFamily(font);
    };

    const handleDrag = React.useCallback((movementX: number) => {
        const newWidth = sidebarWidth + movementX;
        if (newWidth > 350 && newWidth < 700) {
            setSidebarWidth(newWidth);
        }
    }, [sidebarWidth]);

    const setMapStyleHandler = (style: MapStyle) => {
        setMapStyle(style);
    };

    const handleOpenSettings = () => {
        setIsSettingsOpen(true);
    };

    const handleMapServiceChange = (service: MapService) => {
        // Per ora manteniamo sempre leaflet, ma la struttura è pronta per il futuro
        console.log('Map service change requested:', service);
    };

    const handleMapOverlayChange = (overlay: MapOverlay) => {
        setMapOverlay(overlay);
        localStorage.setItem('map-overlay', overlay);
    };

    const handleMapFiltersChange = (filters: { showTeams: boolean; showHighPriority: boolean; showCompleted: boolean }) => {
        setMapFilters(filters);
        localStorage.setItem('map-filters', JSON.stringify(filters));
    };

    const mapRef = React.useRef<any>(null);

    const handleMapReady = (mapInstance: any) => {
        mapRef.current = mapInstance;
        // Force a resize after a short delay to ensure proper sizing
        setTimeout(() => {
            if (mapRef.current) {
                mapRef.current.invalidateSize();
            }
        }, 100);
    };

    const handlePanelResize = () => {
        // Invalidate map size when panels are resized
        if (mapRef.current) {
            setTimeout(() => {
                mapRef.current.invalidateSize();
            }, 0);
        }
    };

    const createActivityLog = (description: string, user: string = 'Admin'): ActivityLog => ({
        timestamp: new Date().toISOString(),
        user,
        description,
    });
    
    const getInterventionAndLog = async (id: number, logMessage: string): Promise<{intervention: Intervention, newLog: ActivityLog} | null> => {
        const intervention = await db.interventions.get(id);
        if(!intervention) return null;
        return { intervention, newLog: createActivityLog(logMessage) };
    }

    // --- CRUD Operations for Interventions ---
    const handleUpdateDetails = async (id: number, details: { description?: string, notes?: string, title?: string, address?: string, coordinates?: Coordinates, client?: { name?: string, phone?: string, email?: string, type?: string } }) => {
        let logMessage = 'Dettagli aggiornati.';
        if (details.address) {
            logMessage = `Indirizzo aggiornato: ${details.address}`;
            if (details.coordinates) {
                logMessage += ` (coordinate: ${details.coordinates.lat.toFixed(6)}, ${details.coordinates.lng.toFixed(6)})`;
            }
        } else if (details.title) {
            logMessage = 'Titolo aggiornato.';
        } else if (details.description) {
            logMessage = 'Descrizione aggiornata.';
        } else if (details.notes) {
            logMessage = 'Note aggiornate.';
        } else if (details.client) {
            logMessage = 'Dati cliente aggiornati.';
        }
        
        console.log('🔄 [UPDATE DETAILS] Inizio aggiornamento:', { id, details, logMessage });
        
        const result = await getInterventionAndLog(id, logMessage);
        if(!result) return;
        
        // Prepara i dati per l'aggiornamento
        const updateData: any = { ...details, history: [result.newLog, ...result.intervention.history] };
        
        // Se stiamo aggiornando i dati del cliente, merge con i dati esistenti
        if (details.client) {
            const currentClient = result.intervention.client;
            updateData.client = {
                ...currentClient,
                ...details.client
            };
            console.log('📄 [UPDATE DETAILS] Client merge:', {
                current: currentClient,
                updates: details.client,
                merged: updateData.client
            });
        }
        
        console.log('💾 [UPDATE DETAILS] Dati da aggiornare:', updateData);
        
        await db.interventions.update(id, updateData);
        
        console.log('✅ [UPDATE DETAILS] Aggiornamento completato nel database');
        
        // 🗺️ FORCE MAP REFRESH: Se abbiamo aggiornato coordinate, forza refresh mappa
        if (details.coordinates) {
            console.log('🗺️ [UPDATE DETAILS] Forzando refresh mappa con nuove coordinate:', details.coordinates);
            
            // Aggiorna mapCenter per centrare la mappa
            setMapCenter(details.coordinates);
            
            // ⚡ FORCE IMMEDIATE REFRESH: Aspetta che Dexie aggiorni l'array e poi forza refresh
            setTimeout(() => {
                const refreshTimestamp = Date.now();
                console.log('🔄 [UPDATE DETAILS] Forzando refresh marker con timestamp:', refreshTimestamp);
                setForceMapRefresh(refreshTimestamp);
                
                // Verifica che l'intervento sia stato aggiornato
                db.interventions.get(id).then(updatedIntervention => {
                    console.log('🔍 [UPDATE DETAILS] Verifica intervento aggiornato:', {
                        id,
                        oldCoordinates: result.intervention.coordinates,
                        newCoordinates: updatedIntervention?.coordinates,
                        addressUpdated: updatedIntervention?.address !== result.intervention.address
                    });
                });
            }, 200); // Aspetta 200ms per permettere a Dexie di aggiornare
        }
    };
    
    const handleUpdateEconomicDetails = async (id: number, economicDetails: EconomicDetails) => {
        const result = await getInterventionAndLog(id, 'Dettagli economici aggiornati.');
        if(!result) return;
        await db.interventions.update(id, { economicDetails, history: [result.newLog, ...result.intervention.history] });
    };

    const handleAddMaterial = async (id: number, material: UsedMaterial) => {
        await db.onAddMaterial(id, material);
    };
    
    const handleRemoveMaterial = async (id: number, materialId: string) => {
        await db.onRemoveMaterial(id, materialId);
    };

    const handleUpdateAsset = async (interventionId: number, asset: Asset) => {
        const result = await getInterventionAndLog(interventionId, `Asset ${asset.name} aggiornato.`);
        if(!result) return;
        
        // Aggiorna l'asset nella lista degli assets
        const existingAssetIndex = assets.findIndex(a => a.id === asset.id);
        let updatedAssets = [...assets];
        
        if (existingAssetIndex >= 0) {
            updatedAssets[existingAssetIndex] = asset;
        } else {
            updatedAssets.push(asset);
        }
        
        // Aggiorna l'intervento con l'asset ID
        await db.interventions.update(interventionId, { 
            assetId: asset.id, 
            history: [result.newLog, ...result.intervention.history] 
        });
        
        // Aggiorna gli assets nel database
        await db.assets.put(asset);
    };

    const handleAddAttachment = async (id: number, attachment: Attachment) => {
        const result = await getInterventionAndLog(id, 'Allegato aggiunto.');
        if(!result) return;
        const updatedAttachments = [...result.intervention.attachments, attachment];
        await db.interventions.update(id, { attachments: updatedAttachments, history: [result.newLog, ...result.intervention.history] });
    };

    const handleRemoveAttachment = async (id: number, attachmentId: string) => {
        const result = await getInterventionAndLog(id, 'Allegato rimosso.');
        if(!result) return;
        const updatedAttachments = result.intervention.attachments.filter(a => a.id !== attachmentId);
        await db.interventions.update(id, { attachments: updatedAttachments, history: [result.newLog, ...result.intervention.history] });
    };

    const handleUpdateStatus = async (id: number, status: InterventionStatus) => {
        const result = await getInterventionAndLog(id, `Stato cambiato in: ${status}`);
        if(!result) return;
        await db.interventions.update(id, { status, history: [result.newLog, ...result.intervention.history] });
    };

    const handleUpdatePriority = async (id: number, priority: Priority) => {
        const result = await getInterventionAndLog(id, `Priorità cambiata in: ${priority}`);
        if(!result) return;
        await db.interventions.update(id, { priority, history: [result.newLog, ...result.intervention.history] });
    };

    const handleAssignTeam = async (id: number, teamId: number | null) => {
        const teamName = teams?.find(t => t.id === teamId)?.name || 'Nessuna';
        const result = await getInterventionAndLog(id, `Squadra assegnata: ${teamName}`);
        if(!result) return;
        
        // Get current additional teams
        const intervention = await db.interventions.get(id);
        const currentAdditionalTeams = intervention?.assignedTeamIds?.filter(tId => tId !== intervention.assignedTeamId) || [];
        
        // Update both assignedTeamId and assignedTeamIds
        const newAssignedTeamIds = teamId ? [teamId, ...currentAdditionalTeams] : currentAdditionalTeams;
        
        await db.interventions.update(id, { 
            assignedTeamId: teamId, 
            assignedTeamIds: newAssignedTeamIds,
            history: [result.newLog, ...result.intervention.history] 
        });
    };
    
    const handleAssignMultipleTeams = async (id: number, teamIds: number[]) => {
        const teamNames = teamIds.map(teamId => teams?.find(t => t.id === teamId)?.name || 'Sconosciuta').join(', ');
        const result = await getInterventionAndLog(id, `Squadre aggiuntive aggiornate: ${teamNames}`);
        if(!result) return;
        await db.interventions.update(id, { assignedTeamIds: teamIds, history: [result.newLog, ...result.intervention.history] });
    };

    const handleAddHistoryLog = async (id: number, description: string) => {
        const result = await getInterventionAndLog(id, description);
        if(!result) return;
        await db.interventions.update(id, { history: [result.newLog, ...result.intervention.history] });
    };
    
    // Team Attendance Modal functions
    const handleOpenTeamAttendanceModal = (intervention: Intervention, teamId?: number) => {
        console.log('🔍 handleOpenTeamAttendanceModal called:', { intervention: intervention.title, teamId });
        const targetTeamId = teamId || intervention.assignedTeamId;
        if (!targetTeamId) {
            console.log('❌ No target team ID found');
            return;
        }
        
        console.log('✅ Opening team attendance modal for team:', targetTeamId);
        setSelectedTeamForAttendance({ intervention, teamId: targetTeamId });
        setIsTeamAttendanceModalOpen(true);
    };
    
    const handleCloseTeamAttendanceModal = () => {
        setIsTeamAttendanceModalOpen(false);
        setSelectedTeamForAttendance(null);
    };
    
    const handleSaveTeamAttendance = async (
        attendance: TeamMemberAttendance[], 
        externalMembers: ExternalMember[], 
        vehiclesUsed: number[]
    ) => {
        if (!selectedTeamForAttendance) return;
        
        const { intervention, teamId } = selectedTeamForAttendance;
        const team = teams?.find(t => t.id === teamId);
        if (!team) return;
        
        // Create or update team details
        const teamDetails: InterventionTeamDetails = {
            teamId,
            teamName: team.name,
            attendance,
            externalMembers,
            vehiclesUsed,
            lastModified: new Date().toISOString(),
            modifiedBy: 'Admin' // TODO: Get from auth context
        };
        
        // Update intervention with team details
        const existingTeamsDetails = intervention.teamsDetails || [];
        const updatedTeamsDetails = existingTeamsDetails.filter(td => td.teamId !== teamId);
        updatedTeamsDetails.push(teamDetails);
        
        // Create activity log
        const presentCount = attendance.filter(a => a.isPresent).length;
        const totalCount = attendance.length;
        const externalCount = externalMembers.length;
        const vehicleCount = vehiclesUsed.length;
        
        const logMessage = `Presenza ${team.name} aggiornata: ${presentCount}/${totalCount} membri` + 
            (externalCount > 0 ? `, ${externalCount} esterni` : '') +
            (vehicleCount > 0 ? `, ${vehicleCount} mezzi` : '');
            
        const result = await getInterventionAndLog(intervention.id, logMessage);
        if(!result) return;
        
        await db.interventions.update(intervention.id, { 
            teamsDetails: updatedTeamsDetails, 
            history: [result.newLog, ...result.intervention.history] 
        });
        
        handleCloseTeamAttendanceModal();
    };
    
    const handleUpdatePaymentStatus = async (id: number, paymentStatus: PaymentStatus) => {
        const result = await getInterventionAndLog(id, `Stato pagamento cambiato in: ${paymentStatus}`);
        if(!result) return;
        const updatedEconomicDetails: EconomicDetails = { ...result.intervention.economicDetails, status: paymentStatus };
        await db.interventions.update(id, { economicDetails: updatedEconomicDetails, history: [result.newLog, ...result.intervention.history] });
    };
    
    const handleInterventionCreated = async (newId: number) => {
        setSelectedInterventionId(newId);
        const newIntervention = await db.interventions.get(newId);
        if (newIntervention) {
            setMapCenter(newIntervention.coordinates);
        }
    };

    const handleUpdateInterventionTime = async (id: number, start: Date, end: Date | null) => {
        const result = await getInterventionAndLog(id, 'Intervento riprogrammato via calendario.');
        if(!result) return;
        await db.interventions.update(id, { 
            scheduledStartDate: start.toISOString(),
            scheduledEndDate: end ? end.toISOString() : undefined,
            history: [result.newLog, ...result.intervention.history],
            lastUpdate: new Date().toISOString()
        });
    }
    
    const handleCreateIntervention = () => {
        setIsCreateModalOpen(true);
    };
    
    const handleEditIntervention = (intervention: Intervention) => {
        // Navigate to dashboard and select the intervention for editing
        setActiveView('dashboard');
        setSelectedInterventionId(intervention.id);
    };
    
    const handleDeleteEventScheduling = async (interventionId: number) => {
        // Remove only the scheduling (scheduledStartDate/scheduledEndDate) from intervention
        const result = await getInterventionAndLog(interventionId, 'Pianificazione evento rimossa.');
        if(!result) return;
        await db.interventions.update(interventionId, { 
            scheduledStartDate: undefined,
            scheduledEndDate: undefined,
            history: [result.newLog, ...result.intervention.history],
            lastUpdate: new Date().toISOString()
        });
    };

    const handleCreateEvent = async (eventData: any) => {
        // Schedule an existing intervention as an event with notifications
        try {
            const result = await getInterventionAndLog(eventData.interventionId, 
                `Evento programmato per ${new Date(eventData.scheduledStartDate).toLocaleDateString('it-IT')} alle ${new Date(eventData.scheduledStartDate).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`);
            if(!result) return;
            
            await db.interventions.update(eventData.interventionId, {
                scheduledStartDate: eventData.scheduledStartDate,
                scheduledEndDate: eventData.scheduledEndDate,
                notes: eventData.notes ? 
                    (result.intervention.notes ? result.intervention.notes + '\n\n' + eventData.notes : eventData.notes) : 
                    result.intervention.notes,
                history: [result.newLog, ...result.intervention.history],
                lastUpdate: new Date().toISOString()
            });
            
            // TODO: In futuro implementare sistema notifiche per reminderDays e reminderTimes
            // Per ora log delle notifiche programmate
            if (eventData.reminderDays.length > 0) {
                console.log('Notifiche programmate:', {
                    interventionId: eventData.interventionId,
                    reminderDays: eventData.reminderDays,
                    reminderTimes: eventData.reminderTimes,
                    eventDate: eventData.scheduledStartDate
                });
            }
            
            alert(`✅ Evento programmato con successo!\n\nDettagli:\n- Data: ${new Date(eventData.scheduledStartDate).toLocaleDateString('it-IT')}\n- Ora: ${new Date(eventData.scheduledStartDate).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}\n- Notifiche: ${eventData.reminderDays.length} programmate`);
            
        } catch (error) {
            console.error('Errore nella programmazione evento:', error);
            alert('Errore durante la programmazione dell\'evento. Riprova.');
        }
    };

    const handleEditEvent = async (eventData: any) => {
        // Edit only the event scheduling (dates/times), not the intervention details
        try {
            const result = await getInterventionAndLog(eventData.interventionId, 
                `Evento modificato - Nuova data: ${new Date(eventData.scheduledStartDate).toLocaleDateString('it-IT')} alle ${new Date(eventData.scheduledStartDate).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`);
            if(!result) return;
            
            await db.interventions.update(eventData.interventionId, {
                scheduledStartDate: eventData.scheduledStartDate,
                scheduledEndDate: eventData.scheduledEndDate,
                notes: eventData.notes ? 
                    (result.intervention.notes ? result.intervention.notes + '\n\n' + eventData.notes : eventData.notes) : 
                    result.intervention.notes,
                history: [result.newLog, ...result.intervention.history],
                lastUpdate: new Date().toISOString()
            });
            
            // TODO: Aggiornare anche sistema notifiche
            if (eventData.reminderDays.length > 0) {
                console.log('Notifiche aggiornate:', {
                    interventionId: eventData.interventionId,
                    reminderDays: eventData.reminderDays,
                    reminderTimes: eventData.reminderTimes,
                    eventDate: eventData.scheduledStartDate
                });
            }
            
            alert(`✅ Evento modificato con successo!\n\nNuovi dettagli:\n- Data: ${new Date(eventData.scheduledStartDate).toLocaleDateString('it-IT')}\n- Ora: ${new Date(eventData.scheduledStartDate).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}\n- Notifiche: ${eventData.reminderDays.length} configurate`);
            
        } catch (error) {
            console.error('Errore nella modifica evento:', error);
            alert('Errore durante la modifica dell\'evento. Riprova.');
        }
    };
    
    const handleDeleteIntervention = (id: number) => {
        setInterventionToDeleteId(id);
        setIsInterventionDeleteConfirmOpen(true);
    };

    const handleConfirmInterventionDelete = async () => {
        if (interventionToDeleteId === null) return;
        try {
            await db.interventions.delete(interventionToDeleteId);
            if (selectedInterventionId === interventionToDeleteId) {
                setSelectedInterventionId(null);
            }
        } catch (error) {
            console.error("Errore durante l'eliminazione dell'intervento:", error);
        } finally {
            setIsInterventionDeleteConfirmOpen(false);
            setInterventionToDeleteId(null);
        }
    };

    // --- CRUD Operations for Resources ---
    const getResourceTableName = (type: 'personnel' | 'vehicle' | 'team'): 'personnel' | 'vehicles' | 'teams' => {
        if (type === 'personnel') return 'personnel'; // 'personnel' is an exception (already plural-like)
        return `${type}s` as 'vehicles' | 'teams';
    }

    const handleSaveResource = async (type: 'personnel' | 'vehicle' | 'team', data: any) => {
        const tableName = getResourceTableName(type);
        try {
            if (data.id) {
                await db.table(tableName).put(data);
            } else {
                await db.table(tableName).add(data);
            }
        } catch(e) {
            console.error(`Errore durante il salvataggio di ${type}:`, e);
        }
    };

    const handleDeleteResource = (type: 'personnel' | 'vehicle' | 'team', id: number, name: string) => {
        if (type === 'team') {
            if (interventions?.some(iv => iv.assignedTeamId === id)) {
                alert('Impossibile eliminare una squadra assegnata a uno o più interventi.');
                return;
            }
        }
        // Note: Vehicles are no longer directly assigned to teams
        // Teams can use multiple vehicles per intervention
        if (type === 'personnel') {
            if (teams?.some(t => t.memberIds.includes(id))) {
                alert('Impossibile eliminare un membro del personale assegnato a una squadra. Rimuoverlo prima dalla squadra.');
                return;
            }
        }
        setResourceToDelete({type, id, name});
        setIsResourceDeleteConfirmOpen(true);
    };

    const handleConfirmResourceDelete = async () => {
        if (!resourceToDelete) return;
        const tableName = getResourceTableName(resourceToDelete.type);
        try {
            await db.table(tableName).delete(resourceToDelete.id);
        } catch (error) {
            console.error(`Errore durante l'eliminazione della risorsa:`, error);
        } finally {
            setIsResourceDeleteConfirmOpen(false);
            setResourceToDelete(null);
        }
    };

    const renderContent = () => {
        if (isLoading || !interventions || !personnel || !clients || !assets || !teams || !vehicles) {
            return (
                <div className="h-screen w-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
                     <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                </div>
            );
        }

        switch (activeView) {
            case 'dashboard':
                return (
                    <div className="h-full flex flex-col bg-background-light dark:bg-background-dark">
                        {/* Barra Statistiche */}
                        <div className="flex-shrink-0 p-4">
                            <StatsBar 
                                interventions={interventions || []} 
                                activeStatusFilter={statsBarFilter}
                                isCollapsed={isStatsBarCollapsed}
                                onToggleCollapse={() => setIsStatsBarCollapsed(!isStatsBarCollapsed)}
                                onStatusFilterClick={(status) => {
                                    setStatsBarFilter(status);
                                    // Reset il filtro status normale quando si usa StatsBar
                                    if (status !== null) {
                                        setStatusFilter('all');
                                    }
                                }}
                            />
                        </div>
                        
                        {/* Layout Principale */}
                        <div className="flex-1 min-h-0">
                            {isMobile ? (
                                /* Layout Mobile */
                                <div className="h-full">
                                    {mobileView === 'list' && (
                                        <div className="h-full bg-surface-light dark:bg-surface-dark rounded-lg shadow-lg m-2 transition-colors duration-300 border border-border-light dark:border-border-dark">
                                            <InterventionList
                                                interventions={filteredAndSortedInterventions}
                                                selectedIntervention={selectedIntervention}
                                                onSelectIntervention={(intervention) => {
                                                    setSelectedInterventionId(intervention.id);
                                                    setMobileView('details');
                                                }}
                                                searchTerm={searchTerm}
                                                setSearchTerm={setSearchTerm}
                                                statusFilter={statusFilter}
                                                setStatusFilter={setStatusFilter}
                                                priorityFilter={priorityFilter}
                                                setPriorityFilter={setPriorityFilter}
                                                onAddClick={() => setIsCreateModalOpen(true)}
                                            />
                                            {/* Floating Map Button */}
                                            <button
                                                onClick={() => setMobileView('map')}
                                                className="fixed bottom-4 right-4 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50"
                                                aria-label="Visualizza mappa"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 13l-6-3" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                    {mobileView === 'details' && selectedIntervention && (
                                        <div className="h-full bg-surface-light dark:bg-surface-dark rounded-lg shadow-lg m-2 transition-colors duration-300 border border-border-light dark:border-border-dark flex flex-col">
                                            {/* Mobile Header with Back Button */}
                                            <div className="flex-shrink-0 p-4 border-b border-border-light dark:border-border-dark flex items-center gap-3">
                                                <button
                                                    onClick={() => setMobileView('list')}
                                                    className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                    aria-label="Torna alla lista"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                    </svg>
                                                </button>
                                                <div className="flex-1">
                                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">{selectedIntervention.title}</h2>
                                                    <p className="text-sm text-gray-500">ID: #{selectedIntervention.id}</p>
                                                </div>
                                                <button
                                                    onClick={() => setMobileView('map')}
                                                    className="p-2 rounded-full text-gray-400 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/50 transition-colors"
                                                    aria-label="Visualizza su mappa"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="flex-1 overflow-y-auto min-h-0">
                                                <InterventionDetails
                                                    intervention={selectedIntervention}
                                                    personnel={personnel || []}
                                                    assets={assets || []}
                                                    teams={teams || []}
                                                    onUpdateStatus={handleUpdateStatus}
                                                    onUpdatePriority={handleUpdatePriority}
                                                    onAssignTeam={handleAssignTeam}
                                                    onAssignMultipleTeams={handleAssignMultipleTeams}
                                                    onUpdateDetails={handleUpdateDetails}
                                                    onUpdateEconomicDetails={handleUpdateEconomicDetails}
                                                    onUpdatePaymentStatus={handleUpdatePaymentStatus}
                                                    onAddHistoryLog={handleAddHistoryLog}
                                                    onAddMaterial={handleAddMaterial}
                                                    onRemoveMaterial={handleRemoveMaterial}
                                                    onUpdateAsset={handleUpdateAsset}
                                                    onAddAttachment={handleAddAttachment}
                                                    onRemoveAttachment={handleRemoveAttachment}
                                                    onOpenImagePreview={handleOpenImagePreview}
                                                    onDeleteIntervention={handleDeleteIntervention}
                                                    onOpenTeamAttendanceModal={handleOpenTeamAttendanceModal}
                                                    onCenterMap={(coords) => setMapCenter(coords)}
                                                    isExpanded={false}
                                                    onToggleExpansion={() => setIsDetailsExpanded(true)}
                                                    hideHeader={true} // Nasconde l'header per evitare duplicati in mobile
                                                    mapService={mapService}
                                                    theme={theme}
                                                    mapStyle={mapStyle}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {mobileView === 'map' && (
                                        <div className="h-full bg-surface-light dark:bg-surface-dark rounded-lg shadow-lg m-2 transition-colors duration-300 border border-border-light dark:border-border-dark overflow-hidden">
                                            {/* Mobile Map Header */}
                                            <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center gap-3">
                                                <button
                                                    onClick={() => setMobileView(selectedIntervention ? 'details' : 'list')}
                                                    className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                    aria-label="Indietro"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                    </svg>
                                                </button>
                                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Mappa Interventi</h2>
                                            </div>
                                            <div className="flex-1 min-h-0">
                                                <SimpleMobileMap
                                                    interventions={filteredAndSortedInterventions}
                                                    selectedIntervention={selectedIntervention}
                                                    onSelectIntervention={(intervention) => {
                                                        setSelectedInterventionId(intervention.id);
                                                        setMobileView('details');
                                                    }}
                                                    mapCenter={mapCenter}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : isDetailsExpanded ? (
                                /* Layout Espanso - Solo Dettagli */
                                <div className="h-full bg-surface-light dark:bg-surface-dark rounded-lg shadow-lg m-2 transition-colors duration-300 border border-border-light dark:border-border-dark">
                                    {selectedIntervention ? (
                                        <InterventionDetails
                                            intervention={selectedIntervention}
                                            personnel={personnel || []}
                                            assets={assets || []}
                                            teams={teams || []}
                                            onUpdateStatus={handleUpdateStatus}
                                            onUpdatePriority={handleUpdatePriority}
                                            onAssignTeam={handleAssignTeam}
                                            onAssignMultipleTeams={handleAssignMultipleTeams}
                                            onUpdateDetails={handleUpdateDetails}
                                            onUpdateEconomicDetails={handleUpdateEconomicDetails}
                                            onUpdatePaymentStatus={handleUpdatePaymentStatus}
                                            onAddHistoryLog={handleAddHistoryLog}
                                            onAddMaterial={handleAddMaterial}
                                            onRemoveMaterial={handleRemoveMaterial}
                                            onUpdateAsset={handleUpdateAsset}
                                            onAddAttachment={handleAddAttachment}
                                            onRemoveAttachment={handleRemoveAttachment}
                                            onOpenImagePreview={handleOpenImagePreview}
                                            onDeleteIntervention={handleDeleteIntervention}
                                            onOpenTeamAttendanceModal={handleOpenTeamAttendanceModal}
                                            onCenterMap={(coords) => setMapCenter(coords)}
                                            isExpanded={true}
                                            onToggleExpansion={() => setIsDetailsExpanded(false)}
                                            mapService={mapService}
                                            theme={theme}
                                            mapStyle={mapStyle}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                                            <p>Seleziona un intervento per visualizzare i dettagli</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Layout Normale - Pannelli */
                                <PanelGroup direction="horizontal" onLayout={handlePanelResize}>
                                {/* Lista Interventi - Sinistra */}
                                <Panel defaultSize={25} minSize={20} className="min-w-[350px]">
                                    <div className="h-full bg-surface-light dark:bg-surface-dark rounded-lg shadow-lg m-2 transition-colors duration-300 border border-border-light dark:border-border-dark">
                                        <InterventionList
                                            interventions={filteredAndSortedInterventions}
                                            selectedIntervention={selectedIntervention}
                                            onSelectIntervention={(intervention) => setSelectedInterventionId(intervention.id)}
                                            searchTerm={searchTerm}
                                            setSearchTerm={setSearchTerm}
                                            statusFilter={statusFilter}
                                            setStatusFilter={setStatusFilter}
                                            priorityFilter={priorityFilter}
                                            setPriorityFilter={setPriorityFilter}
                                            onAddClick={() => setIsCreateModalOpen(true)}
                                        />
                                    </div>
                                </Panel>
                                
                                <PanelResizeHandle className="w-2 bg-border-light dark:bg-border-dark hover:bg-primary-light dark:hover:bg-primary-dark transition-colors rounded-full mx-1" />
                                
                                {/* Pannello Centrale e Destra */}
                                <Panel>
                                    <PanelGroup direction="vertical" onLayout={handlePanelResize}>
                                        {/* Mappa - Centro */}
                                        <Panel defaultSize={70} minSize={40}>
                                            <div className="h-full bg-surface-light dark:bg-surface-dark rounded-lg shadow-lg m-2 transition-colors duration-300 border border-border-light dark:border-border-dark overflow-hidden">
                                                <LeafletMapView
                                                    interventions={filteredAndSortedInterventions}
                                                    selectedIntervention={selectedIntervention}
                                                    onSelectIntervention={(intervention) => setSelectedInterventionId(intervention.id)}
                                                    vehicles={vehicles || []}
                                                    teams={teams || []}
                                                    mapCenter={mapCenter}
                                                    theme={theme}
                                                    mapStyle={mapStyle}
                                                    setMapStyle={setMapStyleHandler}
                                                    mapOverlay={mapOverlay}
                                                    mapFilters={mapFilters}
                                                    onMapReady={handleMapReady}
                                                    forceRefresh={forceMapRefresh}
                                                />
                                            </div>
                                        </Panel>
                                        
                                        <PanelResizeHandle className="h-2 bg-border-light dark:bg-border-dark hover:bg-primary-light dark:hover:bg-primary-dark transition-colors rounded-full my-1" />
                                        
                                        {/* Dettagli Intervento - Basso a Destra */}
                                        <Panel defaultSize={30} minSize={25}>
                                            <div className="h-full bg-surface-light dark:bg-surface-dark rounded-lg shadow-lg m-2 transition-colors duration-300 border border-border-light dark:border-border-dark overflow-y-auto">
                                                {selectedIntervention ? (
                                                    <InterventionDetails
                                                        intervention={selectedIntervention}
                                                        personnel={personnel || []}
                                                        assets={assets || []}
                                                        teams={teams || []}
                                                        onUpdateStatus={handleUpdateStatus}
                                                        onUpdatePriority={handleUpdatePriority}
                                                        onAssignTeam={handleAssignTeam}
                                                        onAssignMultipleTeams={handleAssignMultipleTeams}
                                                        onUpdateDetails={handleUpdateDetails}
                                                        onUpdateEconomicDetails={handleUpdateEconomicDetails}
                                                        onUpdatePaymentStatus={handleUpdatePaymentStatus}
                                                        onAddHistoryLog={handleAddHistoryLog}
                                                        onAddMaterial={handleAddMaterial}
                                                        onRemoveMaterial={handleRemoveMaterial}
                                                        onUpdateAsset={handleUpdateAsset}
                                                        onAddAttachment={handleAddAttachment}
                                                        onRemoveAttachment={handleRemoveAttachment}
                                                        onOpenImagePreview={handleOpenImagePreview}
                                                        onDeleteIntervention={handleDeleteIntervention}
                                                        onOpenTeamAttendanceModal={handleOpenTeamAttendanceModal}
                                                        onCenterMap={(coords) => setMapCenter(coords)}
                                                        isExpanded={false}
                                                        onToggleExpansion={() => setIsDetailsExpanded(true)}
                                                        mapService={mapService}
                                                        theme={theme}
                                                        mapStyle={mapStyle}
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                                                        <p>Seleziona un intervento per visualizzare i dettagli</p>
                                                    </div>
                                                )}
                                            </div>
                                        </Panel>
                                    </PanelGroup>
                                </Panel>
                                </PanelGroup>
                            )}
                        </div>
                    </div>
                );
            case 'planning':
                return (
                    <PlanningPage
                        interventions={interventions}
                        teams={teams}
                        clients={clients}
                        vehicles={vehicles}
                        onUpdateInterventionTime={handleUpdateInterventionTime}
                        onCreateEvent={handleCreateEvent}
                        onEditEvent={handleEditEvent}
                        onDeleteEventScheduling={handleDeleteEventScheduling}
                        onEditIntervention={handleEditIntervention}
                    />
                );
            case 'analytics':
                 return (
                    <AnalyticsPage
                        interventions={interventions}
                        teams={teams}
                    />
                 );
            case 'resources':
                return (
                    <ResourcesPage 
                        personnel={personnel}
                        vehicles={vehicles}
                        teams={teams}
                        interventions={interventions}
                        onSaveResource={handleSaveResource}
                        onDeleteResource={handleDeleteResource}
                    />
                );
            default:
                return null;
        }
    }
    
    return (
        <div className={`h-screen w-screen flex flex-col text-gray-800 dark:text-gray-200 ${theme}`}>
            <Header
                theme={theme}
                activeView={activeView}
                setActiveView={setActiveView}
                onOpenSettings={handleOpenSettings}
            />

            <div className="flex-1 overflow-hidden">
                {renderContent()}
            </div>

            {interventions && personnel && teams && vehicles && (
                <CreateInterventionModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onCreated={handleInterventionCreated}
                    theme={theme}
                    mapStyle={mapStyle}
                    mapService={mapService}
                    interventions={interventions}
                    personnel={personnel}
                    teams={teams}
                    vehicles={vehicles}
                />
            )}
            
            <ImagePreviewModal 
                isOpen={isPreviewImageOpen}
                onClose={() => { setIsPreviewImageOpen(false); setPreviewImageUrl(null); }}
                imageUrl={previewImageUrl}
            />
            <ConfirmationModal
                isOpen={isInterventionDeleteConfirmOpen}
                onClose={() => {
                    setIsInterventionDeleteConfirmOpen(false);
                    setInterventionToDeleteId(null);
                }}
                onConfirm={handleConfirmInterventionDelete}
                title="Conferma Eliminazione Intervento"
                message="Sei sicuro di voler eliminare questo intervento? L'azione è irreversibile."
                confirmButtonText="Sì, Elimina"
            />
             <ConfirmationModal
                isOpen={isResourceDeleteConfirmOpen}
                onClose={() => {
                    setIsResourceDeleteConfirmOpen(false);
                    setResourceToDelete(null);
                }}
                onConfirm={handleConfirmResourceDelete}
                title={`Conferma Eliminazione ${resourceToDelete?.type || 'Risorsa'}`}
                message={`Sei sicuro di voler eliminare "${resourceToDelete?.name}"? L'azione è irreversibile.`}
                confirmButtonText="Sì, Elimina"
            />
            
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                theme={theme}
                onThemeChange={toggleTheme}
                mapStyle={mapStyle}
                onMapStyleChange={setMapStyleHandler}
                mapService={mapService}
                onMapServiceChange={handleMapServiceChange}
                mapOverlay={mapOverlay}
                onMapOverlayChange={handleMapOverlayChange}
                mapFilters={mapFilters}
                onMapFiltersChange={handleMapFiltersChange}
                uiDensity={uiDensity}
                onUiDensityChange={handleUiDensityChange}
                fontFamily={fontFamily}
                onFontFamilyChange={handleFontFamilyChange}
            />
            
            {/* Team Attendance Modal */}
            {selectedTeamForAttendance && (
                <TeamAttendanceModal
                    isOpen={isTeamAttendanceModalOpen}
                    onClose={handleCloseTeamAttendanceModal}
                    teamName={teams?.find(t => t.id === selectedTeamForAttendance.teamId)?.name || 'Squadra'}
                    attendance={(() => {
                        const teamDetails = selectedTeamForAttendance.intervention.teamsDetails?.find(td => td.teamId === selectedTeamForAttendance.teamId);
                        if (teamDetails?.attendance) {
                            return teamDetails.attendance;
                        }
                        // Create default attendance for team members
                        const team = teams?.find(t => t.id === selectedTeamForAttendance.teamId);
                        if (!team) return [];
                        return team.memberIds.map(memberId => {
                            const member = personnel?.find(p => p.id === memberId);
                            if (!member) return null;
                            return {
                                memberId: member.id,
                                name: member.name,
                                role: member.role,
                                isPresent: true, // Default to present
                                modifiedBy: 'Admin',
                                modifiedAt: new Date().toISOString()
                            };
                        }).filter(Boolean) as TeamMemberAttendance[];
                    })()}
                    externalMembers={(() => {
                        const teamDetails = selectedTeamForAttendance.intervention.teamsDetails?.find(td => td.teamId === selectedTeamForAttendance.teamId);
                        return teamDetails?.externalMembers || [];
                    })()}
                    vehiclesUsed={(() => {
                        const teamDetails = selectedTeamForAttendance.intervention.teamsDetails?.find(td => td.teamId === selectedTeamForAttendance.teamId);
                        return teamDetails?.vehiclesUsed || [];
                    })()}
                    personnel={personnel || []}
                    vehicles={vehicles || []}
                    interventions={interventions || []}
                    currentInterventionId={selectedTeamForAttendance.intervention.id}
                    onSave={handleSaveTeamAttendance}
                />
            )}
        </div>
    );
};

export default App;