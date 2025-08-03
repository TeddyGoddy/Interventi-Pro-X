import * as React from 'react';
import { Intervention, InterventionStatus, Priority, Personnel, Team, Coordinates, MapService, MapStyle, AddressSuggestion, PrecisionLevel, GeolocationProvider } from '../../types';
import { cleanAddressDisplayName } from '../../services/addressUtils';
import { cleanAddressesIfNeeded } from '../../services/addressMigration';
import LocationInput from '../LocationInput';

interface GeneralTabProps {
    intervention: Intervention;
    personnel: Personnel[];
    teams: Team[];
    onUpdateStatus: (id: number, status: InterventionStatus) => void;
    onUpdatePriority: (id: number, priority: Priority) => void;
    onAssignTeam: (id: number, teamId: number | null) => void;
    onAssignMultipleTeams: (id: number, teamIds: number[]) => void;
    onUpdateDetails: (id: number, details: { description?: string, notes?: string, title?: string, address?: string, coordinates?: Coordinates, client?: { name?: string, phone?: string, email?: string, type?: string } }) => void;
    onCenterMap: (coordinates: Coordinates) => void;
    onOpenTeamAttendanceModal?: (intervention: Intervention, teamId?: number) => void;
    mapService: MapService;
    theme: string;
    mapStyle: MapStyle;
}

const GeneralTab: React.FC<GeneralTabProps> = ({ 
    intervention, personnel, teams, onUpdateStatus, onUpdatePriority, 
    onAssignTeam, onAssignMultipleTeams, onUpdateDetails, onCenterMap, onOpenTeamAttendanceModal,
    mapService, theme, mapStyle
}) => {
    const [isEditingClientData, setIsEditingClientData] = React.useState(false);
    const [titleContent, setTitleContent] = React.useState(intervention.title);
    const [clientName, setClientName] = React.useState(intervention.client.name);
    const [clientPhone, setClientPhone] = React.useState(intervention.client.phone);
    const [clientEmail, setClientEmail] = React.useState(intervention.client.email);
    const [clientType, setClientType] = React.useState<string>(intervention.client.type);
    const [isEditingAddress, setIsEditingAddress] = React.useState(false);
    const [addressContent, setAddressContent] = React.useState(intervention.address);
    const [verifiedAddress, setVerifiedAddress] = React.useState<AddressSuggestion | null>(null);
    const [locationInputResetTrigger, setLocationInputResetTrigger] = React.useState<number>(0);
    const [isEditingDesc, setIsEditingDesc] = React.useState(false);
    const [descContent, setDescContent] = React.useState(intervention.description);
    const [isEditingNotes, setIsEditingNotes] = React.useState(false);
    const [notesContent, setNotesContent] = React.useState(intervention.notes || '');

    React.useEffect(() => {
        setNotesContent(intervention.notes || '');
        setDescContent(intervention.description);
        setTitleContent(intervention.title);
        setClientName(intervention.client.name);
        setClientPhone(intervention.client.phone);
        setClientEmail(intervention.client.email);
        setClientType(intervention.client.type);
        setIsEditingClientData(false);
        setAddressContent(intervention.address);
        setIsEditingNotes(false);
        setIsEditingDesc(false);
        setIsEditingAddress(false);
    }, [intervention]);

    const handleSaveNotes = () => {
        onUpdateDetails(intervention.id, { notes: notesContent });
        setIsEditingNotes(false);
    };
    
    const handleSaveDesc = () => {
        onUpdateDetails(intervention.id, { description: descContent });
        setIsEditingDesc(false);
    };
    
    const handleSaveClientData = async () => {
        try {
            console.log('💾 [SAVE CLIENT DATA] Salvando dati cliente e titolo...');
            
            // Aggiorna sia il titolo che i dati del cliente
            await onUpdateDetails(intervention.id, { 
                title: titleContent,
                client: {
                    name: clientName,
                    phone: clientPhone,
                    email: clientEmail,
                    type: clientType
                }
            });
            
            console.log('✅ [SAVE CLIENT DATA] Dati salvati:', {
                title: titleContent,
                client: {
                    name: clientName,
                    phone: clientPhone,
                    email: clientEmail,
                    type: clientType
                }
            });
            
            setIsEditingClientData(false);
            
        } catch (error) {
            console.error('❌ [SAVE CLIENT DATA] Errore salvataggio:', error);
        }
    };
    
    const handleSaveAddress = async () => {
        try {
            // Usa l'indirizzo dal verifiedAddress se disponibile, altrimenti addressContent
            const finalAddress = verifiedAddress?.displayName || addressContent;
            const updateData: { address: string; coordinates?: Coordinates } = { address: finalAddress };
            let newCoordinates: Coordinates | null = null;
            
            console.log('🏠 [SAVE ADDRESS] Inizio salvataggio indirizzo:', {
                addressContent,
                verifiedAddress,
                finalAddress,
                interventionId: intervention.id,
                currentCoordinates: intervention.coordinates
            });
            
            // Se abbiamo un indirizzo verificato con coordinate, aggiorniamo anche quelle
            if (verifiedAddress && verifiedAddress.coordinates) {
                updateData.coordinates = verifiedAddress.coordinates;
                newCoordinates = verifiedAddress.coordinates;
                console.log('📍 [SAVE ADDRESS] Coordinate da verifiedAddress:', newCoordinates);
            } else if (finalAddress.trim() && intervention.coordinates) {
                // Se l'utente ha digitato un indirizzo ma non ha selezionato dai suggerimenti,
                // e l'indirizzo è simile a quello esistente, manteniamo le coordinate esistenti
                const originalAddress = intervention.address.toLowerCase().trim();
                const newAddress = finalAddress.toLowerCase().trim();
                
                // Calcola similarità semplice (contiene parole chiave comuni)
                const originalWords = originalAddress.split(/\s+/);
                const newWords = newAddress.split(/\s+/);
                const commonWords = originalWords.filter(word => 
                    word.length > 2 && newWords.some(newWord => 
                        newWord.includes(word) || word.includes(newWord)
                    )
                );
                
                // Se c'è almeno il 30% di similarità, mantieni coordinate esistenti
                const similarity = commonWords.length / Math.max(originalWords.length, newWords.length);
                
                if (similarity > 0.3) {
                    updateData.coordinates = intervention.coordinates;
                    newCoordinates = intervention.coordinates;
                    console.log('📍 [SAVE ADDRESS] Coordinate mantenute (similarità:', similarity.toFixed(2), '):', newCoordinates);
                } else {
                    console.log('⚠️ [SAVE ADDRESS] Indirizzo troppo diverso, coordinate rimosse (similarità:', similarity.toFixed(2), ')');
                }
            } else {
                console.log('⚠️ [SAVE ADDRESS] Nessuna coordinata disponibile');
            }
            
            console.log('💾 [SAVE ADDRESS] Dati da salvare:', updateData);
            
            console.log('🚀 [SAVE ADDRESS] Chiamando onUpdateDetails...');
            await onUpdateDetails(intervention.id, updateData);
            
            console.log('✅ [SAVE ADDRESS] Salvataggio completato, onUpdateDetails ritornato');
            
            // Centra la mappa sulle nuove coordinate se disponibili
            if (newCoordinates) {
                console.log('🗺️ [SAVE ADDRESS] Centrando mappa su:', newCoordinates);
                
                // Forza il refresh della mappa con multipli tentativi per garantire l'aggiornamento
                setTimeout(() => {
                    onCenterMap(newCoordinates);
                    console.log('🔄 [SAVE ADDRESS] Primo tentativo refresh mappa');
                }, 300);
                
                setTimeout(() => {
                    onCenterMap(newCoordinates);
                    console.log('🔄 [SAVE ADDRESS] Secondo tentativo refresh mappa');
                }, 800);
                
                setTimeout(() => {
                    onCenterMap(newCoordinates);
                    console.log('🔄 [SAVE ADDRESS] Terzo tentativo refresh mappa - FINALE');
                }, 1500);
                
                // Verifica che l'intervento abbia le coordinate aggiornate dopo un breve delay
                setTimeout(() => {
                    console.log('🔍 [SAVE ADDRESS] Verifica intervento aggiornato:', {
                        interventionId: intervention.id,
                        currentCoordinates: intervention.coordinates,
                        expectedCoordinates: newCoordinates
                    });
                }, 1000);
            } else {
                console.log('🗺️ [SAVE ADDRESS] Nessuna coordinata per centrare mappa');
            }
            
            setIsEditingAddress(false);
            setVerifiedAddress(null);
        } catch (error) {
            console.error('❌ [SAVE ADDRESS] Errore nel salvataggio indirizzo:', error);
        }
    };
    
    const handleAddressVerified = async (address: AddressSuggestion | null) => {
        console.log('📍 [ADDRESS VERIFIED] Indirizzo verificato:', {
            address,
            hasCoordinates: address?.coordinates ? 'Sì' : 'No',
            coordinates: address?.coordinates
        });
        setVerifiedAddress(address);
        if (address) {
            // Pulisce il displayName rimuovendo il provider
            const cleanAddress = cleanAddressDisplayName(address.displayName);
            setAddressContent(cleanAddress);
            
            // 🚀 SOLUZIONE FIGA: Salva IMMEDIATAMENTE le coordinate!
            console.log('🚀 [INSTANT SAVE] Salvando coordinate immediatamente!');
            console.log('🧹 [CLEAN ADDRESS] Indirizzo pulito:', cleanAddress, 'da:', address.displayName);
            
            const updateData = {
                address: cleanAddress, // Usa l'indirizzo pulito
                coordinates: address.coordinates
            };
            
            try {
                await onUpdateDetails(intervention.id, updateData);
                console.log('✅ [INSTANT SAVE] Coordinate salvate istantaneamente!');
                
                // Forza refresh mappa
                setTimeout(() => {
                    onCenterMap(address.coordinates);
                    console.log('🗺️ [INSTANT SAVE] Mappa centrata su nuove coordinate');
                }, 100);
                
            } catch (error) {
                console.error('❌ [INSTANT SAVE] Errore salvataggio:', error);
            }
        }
    };
    
    const handleStartEditingAddress = () => {
        setIsEditingAddress(true);
        // Reset LocationInput per permettere modifica libera
        setVerifiedAddress(null);
        setAddressContent('');
        // Triggera reset del LocationInput
        setLocationInputResetTrigger(Date.now());
    };
    
    const handleCancelEditingAddress = () => {
        setIsEditingAddress(false);
        // Ripristina valori originali
        setAddressContent(intervention.address);
        setVerifiedAddress(null);
    };



    const assignedTeam = teams.find(t => t.id === intervention.assignedTeamId);
    const teamMembers = assignedTeam ? personnel.filter(p => assignedTeam.memberIds.includes(p.id)) : [];
    
    // Helper function to get present members and externals for a team
    const getTeamDisplayInfo = (teamId: number) => {
        const teamDetails = intervention.teamsDetails?.find(td => td.teamId === teamId);
        
        if (!teamDetails) {
            // No attendance data, show all team members (default behavior)
            const team = teams.find(t => t.id === teamId);
            const allMembers = team ? personnel.filter(p => team.memberIds.includes(p.id)) : [];
            return {
                presentMembers: allMembers,
                externalMembers: []
            };
        }
        
        // Get only present members
        const presentMembers = teamDetails.attendance
            .filter(att => att.isPresent)
            .map(att => ({ id: att.memberId, name: att.name }));
            
        return {
            presentMembers,
            externalMembers: teamDetails.externalMembers || []
        };
    };
    
    // Get display info for primary team
    const primaryTeamInfo = intervention.assignedTeamId ? getTeamDisplayInfo(intervention.assignedTeamId) : { presentMembers: [], externalMembers: [] };
    
    // Gestione squadre multiple
    const assignedTeams = teams.filter(t => 
        intervention.assignedTeamIds?.includes(t.id) && 
        t.id !== intervention.assignedTeamId // Escludi squadra principale
    );
    const [showAddTeamDropdown, setShowAddTeamDropdown] = React.useState(false);
    
    // Sincronizza i dati quando l'intervento viene aggiornato
    React.useEffect(() => {
        setTitleContent(intervention.title);
        setClientName(intervention.client.name);
        setClientPhone(intervention.client.phone);
        setClientEmail(intervention.client.email);
        setClientType(intervention.client.type);
        setAddressContent(intervention.address);
        setDescContent(intervention.description);
        setNotesContent(intervention.notes || '');
        console.log('🔄 [INTERVENTION UPDATE] Dati sincronizzati:', {
            address: intervention.address,
            coordinates: intervention.coordinates
        });
    }, [intervention.id, intervention.address, intervention.coordinates, intervention.title, intervention.description, intervention.notes, intervention.client]);
    
    const handleAddTeam = (teamId: number) => {
        const currentTeamIds = intervention.assignedTeamIds || [];
        if (!currentTeamIds.includes(teamId)) {
            // Always include primary team in the array
            const primaryTeamId = intervention.assignedTeamId;
            const newTeamIds = primaryTeamId ? [primaryTeamId, ...currentTeamIds.filter(id => id !== primaryTeamId), teamId] : [...currentTeamIds, teamId];
            onAssignMultipleTeams(intervention.id, newTeamIds);
        }
        setShowAddTeamDropdown(false);
    };
    
    const handleRemoveTeam = (teamId: number) => {
        const currentTeamIds = intervention.assignedTeamIds || [];
        const newTeamIds = currentTeamIds.filter(id => id !== teamId);
        // Ensure primary team is still in the array if it exists
        const primaryTeamId = intervention.assignedTeamId;
        if (primaryTeamId && !newTeamIds.includes(primaryTeamId)) {
            newTeamIds.unshift(primaryTeamId);
        }
        onAssignMultipleTeams(intervention.id, newTeamIds);
    };
    
    const availableTeamsToAdd = teams.filter(t => 
        !(intervention.assignedTeamIds || []).includes(t.id) && 
        t.id !== intervention.assignedTeamId
    );

    return (
        <div className="space-y-6">
            {/* Sezione Info Cliente e Stato */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Info Cliente Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Info Cliente</h3>
                        </div>
                        {!isEditingClientData && (
                            <button 
                                onClick={() => setIsEditingClientData(true)} 
                                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                            >
                                Modifica
                            </button>
                        )}
                    </div>
                    
                    {isEditingClientData ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titolo Intervento</label>
                                <input 
                                    type="text" 
                                    value={titleContent} 
                                    onChange={e => setTitleContent(e.target.value)} 
                                    className="w-full p-2 border rounded-lg bg-background-light dark:bg-gray-700 dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-ring text-sm font-medium"
                                    placeholder="Titolo dell'intervento"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Cliente</label>
                                <input 
                                    type="text" 
                                    value={clientName} 
                                    onChange={e => setClientName(e.target.value)} 
                                    className="w-full p-2 border rounded-lg bg-background-light dark:bg-gray-700 dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                                    placeholder="Nome del cliente"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo Cliente</label>
                                <select 
                                    value={clientType} 
                                    onChange={e => setClientType(e.target.value)} 
                                    className="w-full p-2 border rounded-lg bg-background-light dark:bg-gray-700 dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                                >
                                    <option value="Privato">Privato</option>
                                    <option value="Azienda">Azienda</option>
                                    <option value="Ente Pubblico">Ente Pubblico</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefono</label>
                                <input 
                                    type="tel" 
                                    value={clientPhone} 
                                    onChange={e => setClientPhone(e.target.value)} 
                                    className="w-full p-2 border rounded-lg bg-background-light dark:bg-gray-700 dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                                    placeholder="Numero di telefono"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                <input 
                                    type="email" 
                                    value={clientEmail} 
                                    onChange={e => setClientEmail(e.target.value)} 
                                    className="w-full p-2 border rounded-lg bg-background-light dark:bg-gray-700 dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                                    placeholder="Indirizzo email"
                                />
                            </div>
                            
                            <div className="flex justify-end gap-2 mt-4">
                                <button 
                                    onClick={() => {
                                        setIsEditingClientData(false);
                                        setTitleContent(intervention.title);
                                        setClientName(intervention.client.name);
                                        setClientPhone(intervention.client.phone);
                                        setClientEmail(intervention.client.email);
                                        setClientType(intervention.client.type as string);
                                    }} 
                                    className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
                                >
                                    Annulla
                                </button>
                                <button 
                                    onClick={handleSaveClientData} 
                                    className="px-3 py-1 text-sm text-white bg-primary rounded-md hover:bg-primary-dark"
                                >
                                    Salva Modifiche
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Nome */}
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Nome</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{clientName}</p>
                                </div>
                            </div>
                            
                            {/* Tipo */}
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Tipo</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{clientType}</p>
                                </div>
                            </div>
                            
                            {/* Telefono */}
                            {clientPhone && (
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Telefono</p>
                                        <a 
                                            href={`tel:${clientPhone}`} 
                                            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                        >
                                            {clientPhone}
                                        </a>
                                    </div>
                                </div>
                            )}
                            
                            {/* Email */}
                            {clientEmail && (
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Email</p>
                                        <a 
                                            href={`mailto:${clientEmail}`} 
                                            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                        >
                                            {clientEmail}
                                        </a>
                                    </div>
                                </div>
                            )}
                            
                            {/* Indirizzo */}
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-1">Indirizzo</p>
                                    {isEditingAddress ? (
                                        <div>
                                            <div className="mb-2">
                                                <LocationInput 
                                                    initialValue={null}
                                                    onAddressVerified={handleAddressVerified}
                                                    mapService={mapService}
                                                    theme={theme}
                                                    mapStyle={mapStyle}
                                                    resetTrigger={locationInputResetTrigger}
                                                />
                                            </div>
                                            {/* Mostra indirizzo selezionato */}
                                            {(verifiedAddress || addressContent.trim()) && (
                                                <div className="mb-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        <span className="text-green-800 dark:text-green-200 font-medium">Indirizzo selezionato:</span>
                                                    </div>
                                                    <div className="mt-1 text-green-700 dark:text-green-300">
                                                        {verifiedAddress ? verifiedAddress.displayName : addressContent}
                                                    </div>
                                                    {verifiedAddress && (
                                                        <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                                                            Fonte: {verifiedAddress.provider} • Precisione: {verifiedAddress.precision}
                                                            <div className="mt-1 font-medium">
                                                                ✅ Coordinate salvate automaticamente!
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <div className="flex justify-end gap-1 mt-1">
                                                <button 
                                                    onClick={handleCancelEditingAddress}
                                                    className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                                                >
                                                    Annulla
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        // Se abbiamo un indirizzo verificato, è già stato salvato automaticamente
                                                        if (verifiedAddress) {
                                                            console.log('📍 [CLOSE EDITING] Indirizzo già salvato, chiudo editing');
                                                            setIsEditingAddress(false);
                                                            setVerifiedAddress(null);
                                                        } else {
                                                            // Fallback al salvataggio normale se necessario
                                                            handleSaveAddress();
                                                        }
                                                    }}
                                                    className="px-2 py-1 text-xs text-white bg-primary rounded hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed"
                                                    disabled={!verifiedAddress && !addressContent.trim()}
                                                >
                                                    {verifiedAddress ? 'Conferma' : (addressContent.trim() ? 'Salva Indirizzo' : 'Seleziona Indirizzo')}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => onCenterMap(intervention.coordinates)} 
                                                className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors text-left"
                                            >
                                                {addressContent}
                                            </button>
                                            <button 
                                                onClick={handleStartEditingAddress} 
                                                className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" 
                                                title="Modifica indirizzo"
                                            >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Stato Intervento Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Stato Intervento</h3>
                    </div>
                    <div className="space-y-4">
                        {/* Stato */}
                        <div className="space-y-2">
                            <label htmlFor="status-update" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                <div className="w-4 h-4 bg-gray-50 dark:bg-gray-700 rounded flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                Stato
                            </label>
                            <select 
                                id="status-update" 
                                value={intervention.status} 
                                onChange={e => onUpdateStatus(intervention.id, e.target.value as InterventionStatus)} 
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            >
                                <option disabled>Aggiorna stato</option>
                                {Object.values(InterventionStatus).map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Priorità */}
                        <div className="space-y-2">
                            <label htmlFor="priority-update" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                <div className="w-4 h-4 bg-gray-50 dark:bg-gray-700 rounded flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                Priorità
                            </label>
                            <select 
                                id="priority-update" 
                                value={intervention.priority} 
                                onChange={e => onUpdatePriority(intervention.id, e.target.value as Priority)} 
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            >
                                <option disabled>Aggiorna priorità</option>
                                {Object.values(Priority).map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Squadra */}
                        <div className="space-y-2">
                            <label htmlFor="team-assign" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                <div className="w-4 h-4 bg-gray-50 dark:bg-gray-700 rounded flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                Squadra
                            </label>
                            <div className="flex items-center gap-2">
                                <select 
                                    id="team-assign" 
                                    value={intervention.assignedTeamId ?? ''} 
                                    onChange={e => onAssignTeam(intervention.id, e.target.value ? parseInt(e.target.value) : null)} 
                                    className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                >
                                    <option value="">Non assegnata</option>
                                    {teams.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                                {intervention.assignedTeamId && (
                                    <button
                                        onClick={(e) => {
                                            console.log('🔥 Button clicked on:', navigator.userAgent.includes('SamsungBrowser') ? 'Samsung Internet' : 'Other browser');
                                            e.preventDefault();
                                            e.stopPropagation();
                                            
                                            // Timeout per Samsung Internet compatibility
                                            setTimeout(() => {
                                                onOpenTeamAttendanceModal?.(intervention, intervention.assignedTeamId!);
                                            }, 50);
                                        }}
                                        className="p-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors flex-shrink-0"
                                        title="Gestisci presenza squadra principale"
                                        style={{ 
                                            WebkitTapHighlightColor: 'transparent',
                                            touchAction: 'manipulation',
                                            backgroundColor: '#dbeafe',
                                            color: '#2563eb'
                                        }}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                            {(primaryTeamInfo.presentMembers.length > 0 || primaryTeamInfo.externalMembers.length > 0) && (
                                <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded text-xs text-gray-600 dark:text-gray-400">
                                    {primaryTeamInfo.presentMembers.length > 0 && (
                                        <div><span className="font-medium">Membri:</span> {primaryTeamInfo.presentMembers.map(m => m.name).join(', ')}</div>
                                    )}
                                    {primaryTeamInfo.externalMembers.length > 0 && (
                                        <div className={primaryTeamInfo.presentMembers.length > 0 ? 'mt-1' : ''}>
                                            <span className="font-medium">Esterni:</span> {primaryTeamInfo.externalMembers.map(e => e.name).join(', ')}
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {/* Squadre aggiuntive */}
                            {assignedTeams.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Squadre Aggiuntive:</h4>
                                    {assignedTeams.map(team => {
                                        const teamInfo = getTeamDisplayInfo(team.id);
                                        return (
                                            <div key={team.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-sm">{team.name}</span>
                                                        <button
                                                            onClick={() => onOpenTeamAttendanceModal?.(intervention, team.id)}
                                                            className="p-1 rounded bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 transition-colors"
                                                            title={`Gestisci presenza ${team.name}`}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveTeam(team.id)}
                                                        className="p-1 rounded bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-300 transition-colors"
                                                        title={`Rimuovi ${team.name}`}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                {(teamInfo.presentMembers.length > 0 || teamInfo.externalMembers.length > 0) && (
                                                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                        {teamInfo.presentMembers.length > 0 && (
                                                            <span>Membri: {teamInfo.presentMembers.map(m => m.name).join(', ')}</span>
                                                        )}
                                                        {teamInfo.externalMembers.length > 0 && (
                                                            <span>
                                                                {teamInfo.presentMembers.length > 0 ? ' | ' : ''}
                                                                Esterni: {teamInfo.externalMembers.map(e => e.name).join(', ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            
                            {/* Pulsante Aggiungi Squadra */}
                            {availableTeamsToAdd.length > 0 && (
                                <div className="mt-2 relative">
                                    {!showAddTeamDropdown ? (
                                        <button
                                            onClick={() => setShowAddTeamDropdown(true)}
                                            className="text-sm text-primary hover:underline flex items-center gap-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            Aggiungi squadra
                                        </button>
                                    ) : (
                                        <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-2 absolute z-10 min-w-48">
                                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Seleziona squadra da aggiungere:</div>
                                            {availableTeamsToAdd.map(team => (
                                                <button
                                                    key={team.id}
                                                    onClick={() => handleAddTeam(team.id)}
                                                    className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                                                >
                                                    {team.name}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => setShowAddTeamDropdown(false)}
                                                className="w-full text-left px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 rounded mt-1 border-t border-gray-200 dark:border-gray-600"
                                            >
                                                Annulla
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sezione Descrizione */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Descrizione Problema</h3>
                    </div>
                    {!isEditingDesc && (
                        <button 
                            onClick={() => setIsEditingDesc(true)} 
                            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                        >
                            Modifica
                        </button>
                    )}
                </div>
                {isEditingDesc ? (
                    <div className="space-y-3">
                        <textarea 
                            value={descContent} 
                            onChange={e => setDescContent(e.target.value)} 
                            rows={5} 
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-vertical"
                            placeholder="Descrivi il problema riscontrato..."
                        />
                        <div className="flex justify-end gap-2">
                            <button 
                                onClick={() => {setIsEditingDesc(false); setDescContent(intervention.description);}} 
                                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                Annulla
                            </button>
                            <button 
                                onClick={handleSaveDesc} 
                                className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors font-medium"
                            >
                                Salva Descrizione
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                        <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap text-sm leading-relaxed min-h-[100px]">
                            {descContent || <span className="text-gray-500 dark:text-gray-400 italic">Nessuna descrizione inserita.</span>}
                        </p>
                    </div>
                )}
            </div>
            
            {/* Sezione Note */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Note Intervento</h3>
                    </div>
                    {!isEditingNotes && (
                        <button 
                            onClick={() => setIsEditingNotes(true)} 
                            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                        >
                            Modifica
                        </button>
                    )}
                </div>
                {isEditingNotes ? (
                    <div className="space-y-3">
                        <textarea 
                            value={notesContent} 
                            onChange={e => setNotesContent(e.target.value)} 
                            rows={4} 
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-vertical"
                            placeholder="Aggiungi note aggiuntive sull'intervento..."
                        />
                        <div className="flex justify-end gap-2">
                            <button 
                                onClick={() => {setIsEditingNotes(false); setNotesContent(intervention.notes || '');}} 
                                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                Annulla
                            </button>
                            <button 
                                onClick={handleSaveNotes} 
                                className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors font-medium"
                            >
                                Salva Note
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                        <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap text-sm leading-relaxed min-h-[80px]">
                            {notesContent || <span className="text-gray-500 dark:text-gray-400 italic">Nessuna nota inserita.</span>}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GeneralTab;