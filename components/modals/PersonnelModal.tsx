import * as React from 'react';
import { Personnel, PersonnelRole, PersonnelStatus } from '../../types';

interface PersonnelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (personnel: Personnel) => void;
    existingPersonnel: Personnel | null;
}

const PersonnelModal: React.FC<PersonnelModalProps> = ({ isOpen, onClose, onSave, existingPersonnel }) => {
    const [personnel, setPersonnel] = React.useState<Omit<Personnel, 'id'>>({
        name: '',
        email: '',
        phone: '',
        role: PersonnelRole.TECHNICIAN,
        status: PersonnelStatus.ACTIVE,
    });

    React.useEffect(() => {
        if (existingPersonnel) {
            setPersonnel(existingPersonnel);
        } else {
            setPersonnel({
                name: '',
                email: '',
                phone: '',
                role: PersonnelRole.TECHNICIAN,
                status: PersonnelStatus.ACTIVE,
            });
        }
    }, [existingPersonnel, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setPersonnel(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ id: existingPersonnel?.id, ...personnel } as Personnel);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1100] p-4" role="dialog" aria-modal="true">
            <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-scale-in border border-border-light dark:border-border-dark">
                <header className="flex justify-between items-center p-4 border-b border-border-light dark:border-border-dark shrink-0">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{existingPersonnel ? 'Modifica Personale' : 'Nuovo Personale'}</h2>
                    <button onClick={onClose} aria-label="Chiudi modale" className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome*</label>
                        <input type="text" name="name" id="name" value={personnel.name} onChange={handleChange} required className="w-full p-2 border rounded-lg bg-background-light dark:bg-gray-700 dark:border-border-dark" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email*</label>
                            <input type="email" name="email" id="email" value={personnel.email} onChange={handleChange} required className="w-full p-2 border rounded-lg bg-background-light dark:bg-gray-700 dark:border-border-dark" />
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefono</label>
                            <input type="tel" name="phone" id="phone" value={personnel.phone} onChange={handleChange} className="w-full p-2 border rounded-lg bg-background-light dark:bg-gray-700 dark:border-border-dark" />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ruolo</label>
                            <select name="role" id="role" value={personnel.role} onChange={handleChange} className="w-full p-2 border rounded-lg bg-background-light dark:bg-gray-700 dark:border-border-dark">
                                {Object.values(PersonnelRole).map(role => <option key={role} value={role}>{role}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stato</label>
                            <select name="status" id="status" value={personnel.status} onChange={handleChange} className="w-full p-2 border rounded-lg bg-background-light dark:bg-gray-700 dark:border-border-dark">
                                {Object.values(PersonnelStatus).map(status => <option key={status} value={status}>{status}</option>)}
                            </select>
                        </div>
                    </div>
                </form>

                <footer className="flex justify-end gap-3 p-4 border-t border-border-light dark:border-border-dark shrink-0 bg-gray-50 dark:bg-background-dark/50 rounded-b-lg">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Annulla</button>
                    <button type="submit" onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg shadow-sm hover:bg-primary-dark">
                        {existingPersonnel ? 'Salva Modifiche' : 'Crea Personale'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default PersonnelModal;
