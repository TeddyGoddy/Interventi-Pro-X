import * as React from 'react';
import { Personnel, Vehicle, Team, PersonnelRole, PersonnelStatus, VehicleType, VehicleStatus, Intervention, InterventionStatus } from '../types';
import TeamModal from './modals/TeamModal';
import PersonnelModal from './modals/PersonnelModal';
import VehicleModal from './modals/VehicleModal';

interface ResourcesPageProps {
    personnel: Personnel[];
    vehicles: Vehicle[];
    teams: Team[];
    interventions: Intervention[];
    onSaveResource: (type: 'personnel' | 'vehicle' | 'team', data: any) => void;
    onDeleteResource: (type: 'personnel' | 'vehicle' | 'team', id: number, name: string) => void;
}

type ActiveTab = 'personnel' | 'vehicles' | 'teams';
type ModalState = {
    isOpen: boolean;
    type: 'team' | 'personnel' | 'vehicle' | null;
    data?: Team | Personnel | Vehicle | null;
}

const TabButton: React.FC<{ tab: ActiveTab; activeTab: ActiveTab; setTab: (tab: ActiveTab) => void; label: string }> =
    ({ tab, activeTab, setTab, label }) => (
        <button
            onClick={() => setTab(tab)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 focus:outline-none transition-colors duration-200 ${activeTab === tab
                ? 'text-primary border-primary'
                : 'text-gray-500 dark:text-gray-400 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                }`}
        >
            {label}
        </button>
    );

const roleColors: Record<PersonnelRole, string> = {
    [PersonnelRole.TECHNICIAN]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    [PersonnelRole.APPRENTICE]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    [PersonnelRole.TEAM_LEADER]: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    [PersonnelRole.SPECIALIST]: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
};

const personnelStatusColors: Record<PersonnelStatus, string> = {
    [PersonnelStatus.ACTIVE]: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    [PersonnelStatus.ON_LEAVE]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    [PersonnelStatus.SUSPENDED]: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};

const vehicleStatusColors: Record<VehicleStatus, string> = {
    [VehicleStatus.AVAILABLE]: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    [VehicleStatus.IN_USE]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    [VehicleStatus.MAINTENANCE]: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};

const ActionButtons: React.FC<{ onEdit: () => void; onDelete: () => void; }> = ({ onEdit, onDelete }) => (
    <div className="flex items-center gap-2">
        <button onClick={onEdit} className="p-1.5 text-gray-500 hover:text-primary rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
        </button>
        <button onClick={onDelete} className="p-1.5 text-gray-500 hover:text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-800/50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
        </button>
    </div>
);


const ResourcesPage: React.FC<ResourcesPageProps> = ({ personnel, vehicles, teams, interventions, onSaveResource, onDeleteResource }) => {
    const [activeTab, setActiveTab] = React.useState<ActiveTab>('teams');
    const [modalState, setModalState] = React.useState<ModalState>({ isOpen: false, type: null, data: null });

    const handleOpenModal = (type: ModalState['type'], data: ModalState['data'] = null) => {
        setModalState({ isOpen: true, type, data });
    };

    const handleCloseModal = () => {
        setModalState({ isOpen: false, type: null, data: null });
    };

    const handleSave = (type: 'team' | 'personnel' | 'vehicle', data: any) => {
        onSaveResource(type, data);
        handleCloseModal();
    }

    // Function to get vehicles currently in use by a team
    const getTeamVehiclesInUse = (teamId: number) => {
        const activeInterventions = interventions.filter(intervention => 
            intervention.status === InterventionStatus.IN_PROGRESS && 
            intervention.assignedTeamIds?.includes(teamId)
        );
        
        const vehicleIds = new Set<number>();
        activeInterventions.forEach(intervention => {
            intervention.teamsDetails?.forEach(teamDetail => {
                if (teamDetail.teamId === teamId) {
                    teamDetail.vehiclesUsed.forEach(vehicleId => vehicleIds.add(vehicleId));
                }
            });
        });
        
        return Array.from(vehicleIds).map(id => vehicles.find(v => v.id === id)).filter(Boolean);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'teams':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teams.map(team => {
                            const teamMembers = personnel.filter(p => team.memberIds.includes(p.id));
                            return (
                                <div key={team.id} className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-md p-4 border border-border-light dark:border-border-dark flex flex-col">
                                     <div className="flex justify-between items-start">
                                         <div className="flex-1">
                                             <h4 className="font-bold text-lg text-primary">{team.name}</h4>
                                             {(() => {
                                                 const vehiclesInUse = getTeamVehiclesInUse(team.id);
                                                 return vehiclesInUse.length > 0 ? (
                                                     <div className="mt-1">
                                                         <p className="text-xs text-green-600 dark:text-green-400 font-medium">🚗 In uso ora:</p>
                                                         <div className="flex flex-wrap gap-1 mt-1">
                                                             {vehiclesInUse.map(vehicle => (
                                                                 <span key={vehicle!.id} className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-0.5 rounded-full font-medium">
                                                                     {vehicle!.name}
                                                                 </span>
                                                             ))}
                                                         </div>
                                                     </div>
                                                 ) : (
                                                     <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Nessun mezzo in uso</p>
                                                 );
                                             })()
                                             }
                                         </div>
                                         <ActionButtons onEdit={() => handleOpenModal('team', team)} onDelete={() => onDeleteResource('team', team.id!, team.name)} />
                                     </div>

                                    <div className="mt-4 flex-grow">
                                        <h5 className="font-semibold text-sm mb-2">Membri</h5>
                                        {teamMembers.length > 0 ? (
                                            <ul className="space-y-2">
                                                {teamMembers.map(member => (
                                                    <li key={member.id} className="text-sm flex items-center justify-between">
                                                        <span>{member.name}</span>
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${roleColors[member.role]}`}>{member.role}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (<p className="text-sm text-gray-400 italic">Nessun membro</p>)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            case 'personnel':
                return (
                    <div className="overflow-x-auto bg-surface-light dark:bg-surface-dark rounded-lg shadow-md border border-border-light dark:border-border-dark">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-300 uppercase text-xs">
                                <tr>
                                    <th className="p-3 text-left font-semibold">Nome</th>
                                    <th className="p-3 text-left font-semibold">Contatti</th>
                                    <th className="p-3 text-left font-semibold">Ruolo</th>
                                    <th className="p-3 text-left font-semibold">Stato</th>
                                    <th className="p-3 text-right font-semibold">Azioni</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                {personnel.map(p => (
                                    <tr key={p.id}>
                                        <td className="p-3 font-medium text-gray-900 dark:text-gray-100">{p.name}</td>
                                        <td className="p-3 text-gray-600 dark:text-gray-400">
                                            <div>{p.email}</div>
                                            <div>{p.phone}</div>
                                        </td>
                                        <td className="p-3"><span className={`text-xs font-bold px-2 py-1 rounded-full ${roleColors[p.role]}`}>{p.role}</span></td>
                                        <td className="p-3"><span className={`text-xs font-bold px-2 py-1 rounded-full ${personnelStatusColors[p.status]}`}>{p.status}</span></td>
                                        <td className="p-3 text-right">
                                            <ActionButtons onEdit={() => handleOpenModal('personnel', p)} onDelete={() => onDeleteResource('personnel', p.id!, p.name)} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            case 'vehicles':
                return (
                    <div className="overflow-x-auto bg-surface-light dark:bg-surface-dark rounded-lg shadow-md border border-border-light dark:border-border-dark">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-300 uppercase text-xs">
                                <tr>
                                    <th className="p-3 text-left font-semibold">Nome</th>
                                    <th className="p-3 text-left font-semibold">Targa</th>
                                    <th className="p-3 text-left font-semibold">Tipo</th>
                                    <th className="p-3 text-left font-semibold">Equipaggiamento</th>
                                    <th className="p-3 text-left font-semibold">Stato</th>
                                    <th className="p-3 text-right font-semibold">Azioni</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                {vehicles.map(v => (
                                    <tr key={v.id}>
                                        <td className="p-3 font-medium text-gray-900 dark:text-gray-100">{v.name}</td>
                                        <td className="p-3 font-mono text-gray-700 dark:text-gray-300">{v.licensePlate}</td>
                                        <td className="p-3 text-gray-700 dark:text-gray-300">{v.type}</td>
                                        <td className="p-3 text-gray-700 dark:text-gray-400 text-xs max-w-xs truncate">{v.equipment.join(', ')}</td>
                                        <td className="p-3"><span className={`text-xs font-bold px-2 py-1 rounded-full ${vehicleStatusColors[v.status]}`}>{v.status}</span></td>
                                        <td className="p-3 text-right">
                                            <ActionButtons onEdit={() => handleOpenModal('vehicle', v)} onDelete={() => onDeleteResource('vehicle', v.id!, v.name)} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
        }
    };

    return (
        <>
            <main className="flex-grow p-4 md:p-6 lg:p-8 flex flex-col gap-6 bg-background-light dark:bg-background-dark animate-scale-in overflow-y-auto">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestione Risorse</h1>
                    <div className="flex gap-2">
                        <button onClick={() => handleOpenModal('team')} className="px-3 py-1.5 text-sm font-semibold rounded-md text-primary-foreground bg-primary hover:bg-primary-dark">Aggiungi Squadra</button>
                        <button onClick={() => handleOpenModal('personnel')} className="px-3 py-1.5 text-sm font-semibold rounded-md text-primary-foreground bg-primary hover:bg-primary-dark">Aggiungi Personale</button>
                        <button onClick={() => handleOpenModal('vehicle')} className="px-3 py-1.5 text-sm font-semibold rounded-md text-primary-foreground bg-primary hover:bg-primary-dark">Aggiungi Veicolo</button>
                    </div>
                </div>

                <div className="border-b border-border-light dark:border-border-dark">
                    <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                        <TabButton tab="teams" activeTab={activeTab} setTab={setActiveTab} label="Squadre" />
                        <TabButton tab="personnel" activeTab={activeTab} setTab={setActiveTab} label="Personale" />
                        <TabButton tab="vehicles" activeTab={activeTab} setTab={setActiveTab} label="Mezzi" />
                    </nav>
                </div>

                <div className="animate-scale-in">
                    {renderContent()}
                </div>
            </main>

            {modalState.isOpen && modalState.type === 'team' && (
                <TeamModal
                    isOpen={true}
                    onClose={handleCloseModal}
                    onSave={(data) => handleSave('team', data)}
                    existingTeam={modalState.data as Team | null}
                    personnel={personnel}
                />
            )}
            {modalState.isOpen && modalState.type === 'personnel' && (
                <PersonnelModal
                    isOpen={true}
                    onClose={handleCloseModal}
                    onSave={(data) => handleSave('personnel', data)}
                    existingPersonnel={modalState.data as Personnel | null}
                />
            )}
            {modalState.isOpen && modalState.type === 'vehicle' && (
                <VehicleModal
                    isOpen={true}
                    onClose={handleCloseModal}
                    onSave={(data) => handleSave('vehicle', data)}
                    existingVehicle={modalState.data as Vehicle | null}
                />
            )}
        </>
    );
};

export default ResourcesPage;