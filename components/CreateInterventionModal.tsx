import * as React from 'react';
import { db } from '../services/db';
import { Priority, InterventionStatus, AddressSuggestion, MapService, MapStyle, Client, ClientType, Intervention, PaymentStatus, ActivityLog, Personnel, Team, Vehicle, VehicleStatus } from '../types';
import { cleanAddressDisplayName } from '../services/addressUtils';
import { getAvailableVehicles } from '../services/vehicleAvailabilityService';
import LocationInput from './LocationInput';
import { calculateDistance } from '../services/utils';

interface CreateInterventionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (newInterventionId: number) => void;
    mapService: MapService;
    theme: string;
    mapStyle: MapStyle;
    interventions: Intervention[];
    personnel: Personnel[];
    teams: Team[];
    vehicles: Vehicle[];
}

const Section: React.FC<{ number: number; title: string; children: React.ReactNode }> = ({ number, title, children }) => (
    <div className="pt-5">
        <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-lg">{number}</div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <div className="pl-11 space-y-4">{children}</div>
    </div>
);


const CreateInterventionModal: React.FC<CreateInterventionModalProps> = ({ 
    isOpen, onClose, onCreated, mapService, theme, mapStyle, interventions, teams, vehicles 
}) => {
    const initialFormData = {
        title: '',
        description: '',
        priority: Priority.MEDIUM,
        assignedTeamId: null as number | null,
    };
    
    const initialNewClientData = {
        name: '',
        phone: '',
        email: '',
        type: ClientType.PRIVATE,
        fiscalCode: '',
        vatNumber: ''
    };

    const [formData, setFormData] = React.useState(initialFormData);
    const [verifiedAddress, setVerifiedAddress] = React.useState<AddressSuggestion | null>(null);
    const [error, setError] = React.useState('');
    const [isSaving, setIsSaving] = React.useState(false);
    const [suggestedTeam, setSuggestedTeam] = React.useState<{ team: Team, reason: string } | null>(null);

    // Client state
    const [clientSearchTerm, setClientSearchTerm] = React.useState('');
    const [clientSearchResults, setClientSearchResults] = React.useState<Client[]>([]);
    const [isSearchingClient, setIsSearchingClient] = React.useState(false);
    const [selectedClient, setSelectedClient] = React.useState<Client | null>(null);
    const [isCreatingNewClient, setIsCreatingNewClient] = React.useState(false);
    const [newClientData, setNewClientData] = React.useState(initialNewClientData);

    const clientSearchDebounceTimeout = React.useRef<number | null>(null);


    const resetState = React.useCallback(() => {
        setFormData(initialFormData);
        setVerifiedAddress(null);
        setError('');
        setIsSaving(false);
        setSuggestedTeam(null);
        setClientSearchTerm('');
        setClientSearchResults([]);
        setSelectedClient(null);
        setIsCreatingNewClient(false);
        setNewClientData(initialNewClientData);
    }, []);

    React.useEffect(() => {
        if (isOpen) {
            resetState();
        }
    }, [isOpen, resetState]);
    
    const handleClientSearch = (term: string) => {
        setClientSearchTerm(term);
        setSelectedClient(null);
        setIsCreatingNewClient(false);

        if (clientSearchDebounceTimeout.current) clearTimeout(clientSearchDebounceTimeout.current);
        if (term.length < 2) {
            setClientSearchResults([]);
            return;
        }

        clientSearchDebounceTimeout.current = window.setTimeout(async () => {
            setIsSearchingClient(true);
            try {
                const results = await db.clients
                    .where('name').startsWithIgnoreCase(term).limit(5).toArray();
                setClientSearchResults(results);
            } catch (e) {
                console.error("Client search failed", e);
                setClientSearchResults([]);
            } finally {
                setIsSearchingClient(false);
            }
        }, 300);
    };

    const handleSelectClient = (client: Client) => {
        setSelectedClient(client);
        setClientSearchTerm(client.name);
        setClientSearchResults([]);
        setIsCreatingNewClient(false);
    };
    
    const startNewClientCreation = () => {
        setSelectedClient(null);
        setIsCreatingNewClient(true);
        setClientSearchTerm('');
        setClientSearchResults([]);
        setNewClientData({...initialNewClientData, name: clientSearchTerm});
    };

    React.useEffect(() => {
        if (!verifiedAddress || !teams || !vehicles || teams.length === 0 || vehicles.length === 0) {
            setSuggestedTeam(null);
            return;
        }
    
        const teamsWithDetails = teams.map((team, index) => {
            // Ottieni solo i veicoli realmente disponibili (non in uso da interventi in corso)
            const reallyAvailableVehicles = getAvailableVehicles(vehicles, interventions)
                .filter(v => v.status === VehicleStatus.AVAILABLE);
            
            const vehicle = reallyAvailableVehicles[index % reallyAvailableVehicles.length];
            if (!vehicle) return null;

            return {
                team,
                vehicle,
                workload: interventions.filter(iv => iv.assignedTeamId === team.id && [InterventionStatus.NEW, InterventionStatus.IN_PROGRESS].includes(iv.status)).length,
                distance: calculateDistance(vehicle.position, verifiedAddress.coordinates)
            };
        }).filter(item => item !== null) as { team: Team, vehicle: Vehicle, workload: number, distance: number }[];

        if (teamsWithDetails.length === 0) {
            setSuggestedTeam(null);
            return;
        }

        // Sort by distance to find the closest ones first
        teamsWithDetails.sort((a, b) => a.distance - b.distance);

        // Take top 3 closest to consider for workload
        const closestCandidates = teamsWithDetails.slice(0, 3);
        
        // From the closest candidates, find the one with the minimum workload.
        // If workload is the same, the one with less distance is chosen due to the initial sort.
        const bestChoice = closestCandidates.reduce((best, current) => {
            if (current.workload < best.workload) {
                return current;
            }
            return best;
        });

        if (bestChoice) {
            const reason = `Consigliato: ${bestChoice.team.name} (veicolo a ${bestChoice.distance.toFixed(1)} km, ${bestChoice.workload} interventi attivi)`;
            setSuggestedTeam({ team: bestChoice.team, reason });
        } else {
            setSuggestedTeam(null);
        }
    }, [verifiedAddress, teams, vehicles, interventions]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleNewClientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewClientData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.title.trim()) return setError('Il titolo è obbligatorio.');
        if (!selectedClient && !isCreatingNewClient) return setError('Seleziona un cliente o creane uno nuovo.');
        if (isCreatingNewClient && !newClientData.name.trim()) return setError('Il nome del nuovo cliente è obbligatorio.');
        if (!verifiedAddress) return setError('L\'indirizzo deve essere verificato.');

        setIsSaving(true);
        try {
            const interventionId = await db.transaction('rw', db.clients, db.interventions, async () => {
                let finalClient: Client;

                if (isCreatingNewClient) {
                    const newId = await db.clients.add({
                       name: newClientData.name,
                       phone: newClientData.phone,
                       email: newClientData.email,
                       type: newClientData.type,
                       fiscalCode: newClientData.fiscalCode || undefined,
                       vatNumber: newClientData.vatNumber || undefined,
                    } as Client);
                    finalClient = { id: newId, ...newClientData };
                } else {
                    finalClient = selectedClient!;
                }

                const now = new Date().toISOString();
                const cleanAddress = cleanAddressDisplayName(verifiedAddress.displayName);
                console.log('🧹 [CREATE MODAL] Indirizzo pulito:', cleanAddress, 'da:', verifiedAddress.displayName);
                
                const newIntervention: Omit<Intervention, 'id'> = {
                    title: formData.title,
                    description: formData.description,
                    address: cleanAddress, // Usa l'indirizzo pulito
                    coordinates: verifiedAddress.coordinates,
                    client: finalClient,
                    assetId: null,
                    assignedTeamId: formData.assignedTeamId ? Number(formData.assignedTeamId) : null,
                    assignedTeamIds: formData.assignedTeamId ? [Number(formData.assignedTeamId)] : [],
                    teamsDetails: [], // Vuoto per nuovi interventi
                    status: InterventionStatus.NEW,
                    priority: formData.priority,
                    creationDate: now,
                    lastUpdate: now,
                    notes: '',
                    history: [{ timestamp: now, user: 'Sistema', description: 'Intervento creato.' } as ActivityLog],
                    economicDetails: { materialsCost: 0, laborCost: 0, extraCharges: 0, vatPercentage: 22, status: PaymentStatus.TO_BE_INVOICED },
                    materials: [],
                    attachments: [],
                };
                return await db.interventions.add(newIntervention as Intervention);
            });

            if (interventionId) {
                onCreated(interventionId);
                onClose();
            }

        } catch (err) {
            console.error("Failed to create intervention:", err);
            setError("Si è verificato un errore durante il salvataggio. Riprova.");
        } finally {
            setIsSaving(false);
        }
    };
    
    if(!isOpen) return null;

    const isSubmittable = formData.title.trim() && (selectedClient || (isCreatingNewClient && newClientData.name.trim())) && verifiedAddress && !isSaving;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1100] p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-scale-in border border-border-light dark:border-border-dark">
                <header className="flex justify-between items-center p-4 border-b border-border-light dark:border-border-dark shrink-0">
                    <h2 id="modal-title" className="text-xl font-bold text-gray-900 dark:text-white">Nuovo Intervento</h2>
                    <button onClick={onClose} aria-label="Chiudi modale" className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </header>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto" noValidate>
                    {error && <p className="mb-4 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-3 rounded-lg text-sm">{error}</p>}
                    
                    <div className="space-y-2">
                        {/* SEZIONE CLIENTE */}
                        <Section number={1} title="Seleziona o Crea Cliente">
                            {!selectedClient && !isCreatingNewClient && (
                                <div className="relative">
                                    <label htmlFor="clientSearch" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cerca cliente*</label>
                                    <input type="text" id="clientSearch" value={clientSearchTerm} onChange={e => handleClientSearch(e.target.value)} placeholder="Inizia a digitare il nome del cliente..." className="w-full p-2 border rounded-lg bg-background-light dark:bg-gray-700 dark:border-border-dark" />
                                    {isSearchingClient && <div className="absolute right-2 top-9"><svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle></svg></div>}
                                    {clientSearchResults.length > 0 && (
                                        <ul className="absolute z-10 w-full mt-1 bg-surface-light dark:bg-surface-dark border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                            {clientSearchResults.map(c => <li key={c.id} onClick={() => handleSelectClient(c)} className="p-2 cursor-pointer hover:bg-primary/10">{c.name}</li>)}
                                        </ul>
                                    )}
                                    {clientSearchTerm.length > 1 && !isSearchingClient && clientSearchResults.length === 0 && (
                                        <div className="mt-2 text-sm text-center">
                                            <span className="text-gray-500">Nessun cliente trovato.</span>
                                            <button type="button" onClick={startNewClientCreation} className="ml-2 font-semibold text-primary hover:underline">Creane uno nuovo</button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedClient && (
                                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <div className="font-semibold text-blue-800 dark:text-blue-200">{selectedClient.name}</div>
                                    <button type="button" onClick={() => { setSelectedClient(null); setClientSearchTerm(''); }} className="text-sm text-primary hover:underline">Cambia</button>
                                </div>
                            )}

                            {isCreatingNewClient && (
                                <div className="p-4 border-l-4 border-primary bg-primary/5 dark:bg-primary/10 rounded-r-lg space-y-4">
                                    <h4 className="font-semibold">Nuovo Cliente</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label htmlFor="newClientName" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nome*</label><input type="text" id="newClientName" name="name" value={newClientData.name} onChange={handleNewClientChange} className="w-full p-2 border rounded-lg bg-background-light dark:bg-gray-700 dark:border-border-dark"/></div>
                                        <div><label htmlFor="clientType" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Tipo Cliente</label><select id="clientType" name="type" value={newClientData.type} onChange={handleNewClientChange} className="w-full p-2 border rounded-lg bg-background-light dark:bg-gray-700 dark:border-border-dark">{Object.values(ClientType).map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                                        <div><label htmlFor="newClientPhone" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Telefono</label><input type="tel" id="newClientPhone" name="phone" value={newClientData.phone} onChange={handleNewClientChange} className="w-full p-2 border rounded-lg bg-background-light dark:bg-gray-700 dark:border-border-dark"/></div>
                                        <div><label htmlFor="newClientEmail" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Email</label><input type="email" id="newClientEmail" name="email" value={newClientData.email} onChange={handleNewClientChange} className="w-full p-2 border rounded-lg bg-background-light dark:bg-gray-700 dark:border-border-dark"/></div>
                                        {newClientData.type === ClientType.PRIVATE && (
                                            <div className="md:col-span-2">
                                                <label htmlFor="fiscalCode" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Codice Fiscale</label>
                                                <input type="text" id="fiscalCode" name="fiscalCode" value={newClientData.fiscalCode} onChange={handleNewClientChange} className="w-full p-2 border rounded-lg bg-background-light dark:bg-gray-700 dark:border-border-dark"/>
                                            </div>
                                        )}
                                        {newClientData.type !== ClientType.PRIVATE && (
                                            <div className="md:col-span-2">
                                                <label htmlFor="vatNumber" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Partita IVA</label>
                                                <input type="text" id="vatNumber" name="vatNumber" value={newClientData.vatNumber} onChange={handleNewClientChange} className="w-full p-2 border rounded-lg bg-background-light dark:bg-gray-700 dark:border-border-dark"/>
                                            </div>
                                        )}
                                    </div>
                                    <button type="button" onClick={() => {setIsCreatingNewClient(false); setClientSearchTerm(''); }} className="text-sm text-gray-600 dark:text-gray-400 hover:underline">Annulla creazione</button>
                                </div>
                            )}
                        </Section>

                        {/* SEZIONE INTERVENTO */}
                        <Section number={2} title="Dettagli Intervento">
                             <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titolo*</label>
                                <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} className="w-full p-2 border rounded-lg bg-background-light dark:bg-gray-700 dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-ring" required />
                            </div>
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrizione</label>
                                <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} className="w-full p-2 border rounded-lg bg-background-light dark:bg-gray-700 dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-ring"></textarea>
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priorità</label>
                                    <select name="priority" id="priority" value={formData.priority} onChange={handleChange} className="w-full p-2 border rounded-lg bg-background-light dark:bg-gray-700 dark:border-border-dark">
                                        {Object.values(Priority).map(p => (<option key={p} value={p}>{p}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="assignedTeamId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assegna Squadra</label>
                                    <select name="assignedTeamId" id="assignedTeamId" value={formData.assignedTeamId ?? ''} onChange={(e) => setFormData(prev => ({...prev, assignedTeamId: e.target.value ? parseInt(e.target.value) : null}))} className="w-full p-2 border rounded-lg bg-background-light dark:bg-gray-700 dark:border-border-dark">
                                        <option value="">Non assegnata</option>
                                        {teams.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
                                    </select>
                                </div>
                            </div>
                            {suggestedTeam && (
                                <button type="button" onClick={() => setFormData(p => ({...p, assignedTeamId: suggestedTeam.team.id}))} className="w-full text-left p-2 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/30 rounded-r-lg hover:bg-green-100 dark:hover:bg-green-900/50">
                                    <p className="font-semibold text-green-800 dark:text-green-200 text-sm">{suggestedTeam.reason}</p>
                                </button>
                            )}
                        </Section>

                        {/* SEZIONE INDIRIZZO */}
                        <Section number={3} title="Indirizzo Intervento">
                            <LocationInput 
                                initialValue={null} 
                                onAddressVerified={(address) => {
                                    console.log('🏠 [CREATE MODAL] Address verified:', address);
                                    setVerifiedAddress(address);
                                }} 
                                mapService={mapService} 
                                theme={theme} 
                                mapStyle={mapStyle}
                                resetTrigger={0} // Non serve reset nel modal di creazione
                            />
                        </Section>
                    </div>
                </form>

                <footer className="flex justify-end gap-3 p-4 border-t border-border-light dark:border-border-dark shrink-0 bg-gray-50 dark:bg-background-dark/50 rounded-b-lg">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Annulla</button>
                    <button type="submit" onClick={handleSubmit} disabled={!isSubmittable} className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg shadow-sm hover:bg-primary-dark disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2">
                        {isSaving && <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                        {isSaving ? 'Salvataggio...' : 'Crea Intervento'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default CreateInterventionModal;