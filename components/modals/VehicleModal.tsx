import * as React from 'react';
import { Vehicle, VehicleStatus, VehicleType } from '../../types';
import TagInput from '../common/TagInput';

interface VehicleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (vehicle: Vehicle) => void;
    existingVehicle: Vehicle | null;
}

const VehicleModal: React.FC<VehicleModalProps> = ({ isOpen, onClose, onSave, existingVehicle }) => {
    
    const getInitialState = () => ({
        name: '',
        licensePlate: '',
        type: VehicleType.VAN,
        status: VehicleStatus.AVAILABLE,
        equipment: [] as string[],
    });

    const [vehicle, setVehicle] = React.useState<Partial<Vehicle>>(getInitialState());

    React.useEffect(() => {
        if (existingVehicle) {
            setVehicle(existingVehicle);
        } else {
            setVehicle(getInitialState());
        }
    }, [existingVehicle, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setVehicle(prev => ({ ...prev, [name]: value }));
    };

    const handleSetEquipment = (tags: string[]) => {
        setVehicle(prev => ({...prev, equipment: tags}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Position is not editable here, so we preserve the existing one or set a default
        const position = existingVehicle?.position || { lat: 45.4642, lng: 9.1900 }; // Default to Milan
        onSave({ id: existingVehicle?.id, ...vehicle, position } as Vehicle);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1100] p-4" role="dialog" aria-modal="true">
            <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-scale-in border border-border-light dark:border-border-dark">
                <header className="flex justify-between items-center p-4 border-b border-border-light dark:border-border-dark shrink-0">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{existingVehicle ? 'Modifica Veicolo' : 'Nuovo Veicolo'}</h2>
                    <button onClick={onClose} aria-label="Chiudi modale" className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome/ID Veicolo*</label>
                            <input type="text" name="name" id="name" value={vehicle.name || ''} onChange={handleChange} required className="w-full p-2 border rounded-lg bg-background-light dark:bg-gray-700 dark:border-border-dark" />
                        </div>
                        <div>
                            <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Targa*</label>
                            <input type="text" name="licensePlate" id="licensePlate" value={vehicle.licensePlate || ''} onChange={handleChange} required className="w-full p-2 border rounded-lg bg-background-light dark:bg-gray-700 dark:border-border-dark font-mono uppercase" />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                            <select name="type" id="type" value={vehicle.type || VehicleType.VAN} onChange={handleChange} className="w-full p-2 border rounded-lg bg-background-light dark:bg-gray-700 dark:border-border-dark">
                                {Object.values(VehicleType).map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stato</label>
                            <select name="status" id="status" value={vehicle.status || VehicleStatus.AVAILABLE} onChange={handleChange} className="w-full p-2 border rounded-lg bg-background-light dark:bg-gray-700 dark:border-border-dark">
                                {Object.values(VehicleStatus).map(status => <option key={status} value={status}>{status}</option>)}
                            </select>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Equipaggiamento a bordo</label>
                        <TagInput tags={vehicle.equipment || []} setTags={handleSetEquipment} placeholder="Aggiungi attrezzatura..."/>
                    </div>
                </form>

                <footer className="flex justify-end gap-3 p-4 border-t border-border-light dark:border-border-dark shrink-0 bg-gray-50 dark:bg-background-dark/50 rounded-b-lg">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Annulla</button>
                    <button type="submit" onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg shadow-sm hover:bg-primary-dark">
                        {existingVehicle ? 'Salva Modifiche' : 'Crea Veicolo'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default VehicleModal;