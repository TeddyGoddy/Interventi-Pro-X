import React from 'react';
import { 
    TeamMemberAttendance, 
    ExternalMember, 
    Personnel, 
    Vehicle, 
    PersonnelRole,
    Intervention 
} from '../types';
import { getVehicleUsageInfo, isVehicleAvailable } from '../services/vehicleAvailabilityService';

interface TeamAttendanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    teamName: string;
    attendance: TeamMemberAttendance[];
    externalMembers: ExternalMember[];
    vehiclesUsed: number[];
    personnel: Personnel[];
    vehicles: Vehicle[];
    interventions: Intervention[]; // Per controllare la disponibilità dei veicoli
    currentInterventionId?: number; // ID dell'intervento corrente
    onSave: (
        attendance: TeamMemberAttendance[], 
        externalMembers: ExternalMember[], 
        vehiclesUsed: number[]
    ) => void;
}

const TeamAttendanceModal: React.FC<TeamAttendanceModalProps> = ({
    isOpen,
    onClose,
    teamName,
    attendance: initialAttendance,
    externalMembers: initialExternalMembers,
    vehiclesUsed: initialVehiclesUsed,
    personnel,
    vehicles,
    interventions,
    currentInterventionId,
    onSave
}) => {
    const [attendance, setAttendance] = React.useState<TeamMemberAttendance[]>(initialAttendance);
    const [externalMembers, setExternalMembers] = React.useState<ExternalMember[]>(initialExternalMembers);
    const [vehiclesUsed, setVehiclesUsed] = React.useState<number[]>(initialVehiclesUsed);
    const [newExternalMember, setNewExternalMember] = React.useState({
        name: '',
        role: '',
        company: '',
        phone: ''
    });

    // Calcola informazioni sui veicoli in uso
    const vehicleUsageInfo = React.useMemo(() => {
        return getVehicleUsageInfo(interventions, currentInterventionId);
    }, [interventions, currentInterventionId]);

    React.useEffect(() => {
        setAttendance(initialAttendance);
        setExternalMembers(initialExternalMembers);
        setVehiclesUsed(initialVehiclesUsed);
    }, [initialAttendance, initialExternalMembers, initialVehiclesUsed]);

    const toggleAttendance = (memberId: number) => {
        setAttendance(prev => prev.map(member => 
            member.memberId === memberId 
                ? { 
                    ...member, 
                    isPresent: !member.isPresent,
                    modifiedBy: 'Utente', // In production, use actual user
                    modifiedAt: new Date().toISOString()
                  }
                : member
        ));
    };

    const addExternalMember = () => {
        if (!newExternalMember.name.trim()) return;

        const externalMember: ExternalMember = {
            id: crypto.randomUUID(),
            name: newExternalMember.name,
            role: newExternalMember.role || 'Esterno',
            company: newExternalMember.company || undefined,
            phone: newExternalMember.phone || undefined,
            addedBy: 'Utente', // In production, use actual user
            addedAt: new Date().toISOString()
        };

        setExternalMembers(prev => [...prev, externalMember]);
        setNewExternalMember({ name: '', role: '', company: '', phone: '' });
    };

    const removeExternalMember = (id: string) => {
        setExternalMembers(prev => prev.filter(member => member.id !== id));
    };

    const toggleVehicle = (vehicleId: number) => {
        // Controlla se il veicolo è disponibile
        const isAvailable = isVehicleAvailable(vehicleId, interventions, currentInterventionId);
        
        // Se il veicolo è in uso da un altro intervento, non permettere la selezione
        if (!isAvailable && !vehiclesUsed.includes(vehicleId)) {
            return;
        }
        
        setVehiclesUsed(prev => 
            prev.includes(vehicleId)
                ? prev.filter(id => id !== vehicleId)
                : [...prev, vehicleId]
        );
    };

    const handleSave = () => {
        onSave(attendance, externalMembers, vehiclesUsed);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '1rem'
            }}
        >
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Presenza Squadra
                                </h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {teamName}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Team Members Attendance */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Membri Squadra
                        </h3>
                        <div className="space-y-3">
                            {attendance.map(member => (
                                <div key={member.memberId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${member.isPresent ? 'bg-green-500' : 'bg-red-500'}`} />
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {member.name}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {member.role}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleAttendance(member.memberId)}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                            member.isPresent
                                                ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200'
                                                : 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200'
                                        }`}
                                    >
                                        {member.isPresent ? 'Presente' : 'Assente'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* External Members */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Membri Esterni
                        </h3>
                        
                        {/* Add External Member Form */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                            <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-3">
                                Aggiungi Membro Esterno
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    placeholder="Nome *"
                                    value={newExternalMember.name}
                                    onChange={(e) => setNewExternalMember(prev => ({ ...prev, name: e.target.value }))}
                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                                <input
                                    type="text"
                                    placeholder="Ruolo"
                                    value={newExternalMember.role}
                                    onChange={(e) => setNewExternalMember(prev => ({ ...prev, role: e.target.value }))}
                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                                <input
                                    type="text"
                                    placeholder="Azienda"
                                    value={newExternalMember.company}
                                    onChange={(e) => setNewExternalMember(prev => ({ ...prev, company: e.target.value }))}
                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                                <input
                                    type="tel"
                                    placeholder="Telefono"
                                    value={newExternalMember.phone}
                                    onChange={(e) => setNewExternalMember(prev => ({ ...prev, phone: e.target.value }))}
                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <button
                                onClick={addExternalMember}
                                disabled={!newExternalMember.name.trim()}
                                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Aggiungi
                            </button>
                        </div>

                        {/* External Members List */}
                        <div className="space-y-3">
                            {externalMembers.map(member => (
                                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {member.name}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {member.role} {member.company && `• ${member.company}`}
                                        </p>
                                        {member.phone && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                📞 {member.phone}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => removeExternalMember(member.id)}
                                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                            {externalMembers.length === 0 && (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                                    Nessun membro esterno aggiunto
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Vehicles Used */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Mezzi Utilizzati
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {vehicles.map(vehicle => {
                                const isAvailable = isVehicleAvailable(vehicle.id, interventions, currentInterventionId);
                                const usageInfo = vehicleUsageInfo.get(vehicle.id);
                                const isCurrentlySelected = vehiclesUsed.includes(vehicle.id);
                                const isDisabled = !isAvailable && !isCurrentlySelected;
                                
                                return (
                                    <div 
                                        key={vehicle.id} 
                                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                            isDisabled 
                                                ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' 
                                                : 'bg-gray-50 dark:bg-gray-700'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isCurrentlySelected}
                                            onChange={() => toggleVehicle(vehicle.id)}
                                            disabled={isDisabled}
                                            className={`w-4 h-4 rounded focus:ring-blue-500 ${
                                                isDisabled 
                                                    ? 'text-gray-400 cursor-not-allowed' 
                                                    : 'text-blue-600'
                                            }`}
                                        />
                                        <div className="flex-1">
                                            <p className={`font-medium ${
                                                isDisabled 
                                                    ? 'text-red-700 dark:text-red-300' 
                                                    : 'text-gray-900 dark:text-white'
                                            }`}>
                                                {vehicle.name}
                                                {isDisabled && (
                                                    <span className="ml-2 text-xs font-normal text-red-600 dark:text-red-400">
                                                        (In uso)
                                                    </span>
                                                )}
                                            </p>
                                            <p className={`text-sm ${
                                                isDisabled 
                                                    ? 'text-red-600 dark:text-red-400' 
                                                    : 'text-gray-600 dark:text-gray-400'
                                            }`}>
                                                {vehicle.licensePlate} • {vehicle.type}
                                            </p>
                                            {isDisabled && usageInfo && (
                                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                                    Utilizzato da: {usageInfo.teamName} - {usageInfo.intervention.title}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                        >
                            Annulla
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Salva Modifiche
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamAttendanceModal;
