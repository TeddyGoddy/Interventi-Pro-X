import * as React from 'react';
import { Intervention } from '../../types';

interface HistoryTabProps {
    intervention: Intervention;
    onAddHistoryLog: (id: number, description: string) => void;
}

const HistoryTab: React.FC<HistoryTabProps> = ({ intervention, onAddHistoryLog }) => {
    const [newLogEntry, setNewLogEntry] = React.useState('');

    const handleAddLog = () => {
        if (newLogEntry.trim()) {
            onAddHistoryLog(intervention.id, newLogEntry.trim());
            setNewLogEntry('');
        }
    };

    return (
        <div className="animate-scale-in flex flex-col h-full">
            <h3 className="font-semibold text-lg mb-3 text-gray-800 dark:text-gray-200">Cronologia Attività</h3>
            <div className="flex-grow overflow-y-auto pr-2">
                <ul className="space-y-4">
                    {intervention.history.map((log, index) => (
                        <li key={index} className="flex gap-3">
                            <div className="flex flex-col items-center">
                                <div className="w-3 h-3 bg-primary rounded-full ring-4 ring-primary/20 mt-1"></div>
                                {index < intervention.history.length - 1 && <div className="w-px h-full bg-border-light dark:bg-border-dark"></div>}
                            </div>
                            <div>
                                <p className="text-sm text-gray-800 dark:text-gray-200">{log.description}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(log.timestamp).toLocaleString('it-IT')} - <strong>{log.user}</strong></p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark flex gap-2">
                <input
                    type="text"
                    value={newLogEntry}
                    onChange={e => setNewLogEntry(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleAddLog()}
                    placeholder="Aggiungi una nota alla cronologia..."
                    className="w-full p-2 border rounded-lg bg-background-light dark:bg-gray-700 dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                />
                <button onClick={handleAddLog} className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg shadow-sm hover:bg-primary-dark">Aggiungi</button>
            </div>
        </div>
    );
};

export default HistoryTab;