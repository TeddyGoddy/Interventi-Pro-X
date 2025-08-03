import * as React from 'react';
import { Team, Personnel } from '../../types';

interface TeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (team: Team) => void;
    existingTeam: Team | null;
    personnel: Personnel[];
}

const TeamModal: React.FC<TeamModalProps> = ({ isOpen, onClose, onSave, existingTeam, personnel }) => {
    const [team, setTeam] = React.useState<Omit<Team, 'id'>>({
        name: '',
        memberIds: [],
    });

    React.useEffect(() => {
        if (existingTeam) {
            setTeam(existingTeam);
        } else {
            setTeam({ name: '', memberIds: [] });
        }
    }, [existingTeam, isOpen]);

    const handleMemberToggle = (memberId: number) => {
        setTeam(prev => {
            const memberIds = prev.memberIds.includes(memberId)
                ? prev.memberIds.filter(id => id !== memberId)
                : [...prev.memberIds, memberId];
            return { ...prev, memberIds };
        });
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!team.name) return;
        onSave({ id: existingTeam?.id, ...team } as Team);
    };

    if (!isOpen) return null;

    const availablePersonnel = personnel.filter(p => p.status === 'Attivo' || team.memberIds.includes(p.id));

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1100] p-4" role="dialog" aria-modal="true">
            <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-scale-in border border-border-light dark:border-border-dark">
                <header className="flex justify-between items-center p-4 border-b border-border-light dark:border-border-dark shrink-0">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{existingTeam ? 'Modifica Squadra' : 'Nuova Squadra'}</h2>
                    <button onClick={onClose} aria-label="Chiudi modale" className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Squadra*</label>
                        <input type="text" name="name" id="name" value={team.name} onChange={(e) => setTeam(p => ({...p, name: e.target.value}))} required className="w-full p-2 border rounded-lg bg-background-light dark:bg-gray-700 dark:border-border-dark" />
                    </div>
                    
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Membri Squadra</h3>
                        <div className="max-h-60 overflow-y-auto border rounded-lg p-2 space-y-2 bg-background-light dark:bg-gray-700/50 dark:border-border-dark">
                            {availablePersonnel.map(p => (
                                <label key={p.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer">
                                    <input type="checkbox" checked={team.memberIds.includes(p.id)} onChange={() => handleMemberToggle(p.id)} className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary"/>
                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.name}</span>
                                </label>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">I mezzi verranno assegnati per ogni intervento specifico</p>
                    </div>

                </form>

                <footer className="flex justify-end gap-3 p-4 border-t border-border-light dark:border-border-dark shrink-0 bg-gray-50 dark:bg-background-dark/50 rounded-b-lg">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Annulla</button>
                    <button type="submit" onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg shadow-sm hover:bg-primary-dark">
                        {existingTeam ? 'Salva Modifiche' : 'Crea Squadra'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default TeamModal;
