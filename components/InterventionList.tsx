import React, { useState, useEffect } from 'react';
import { Intervention, InterventionStatus, Priority } from '../types';

interface InterventionListProps {
    interventions: Intervention[];
    selectedIntervention: Intervention | null;
    onSelectIntervention: (intervention: Intervention) => void;
    searchTerm: string;
    setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
    statusFilter: InterventionStatus | 'all';
    setStatusFilter: React.Dispatch<React.SetStateAction<InterventionStatus | 'all'>>;
    priorityFilter: Priority | 'all';
    setPriorityFilter: React.Dispatch<React.SetStateAction<Priority | 'all'>>;
    onAddClick: () => void;
}

const statusColors: Record<InterventionStatus, string> = {
    [InterventionStatus.NEW]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    [InterventionStatus.PENDING]: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
    [InterventionStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    [InterventionStatus.COMPLETED]: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    [InterventionStatus.CANCELED]: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};

const priorityClasses: Record<Priority, { ring: string; text: string }> = {
    [Priority.LOW]: { ring: 'ring-gray-300', text: 'text-gray-500' },
    [Priority.MEDIUM]: { ring: 'ring-blue-400', text: 'text-blue-500' },
    [Priority.HIGH]: { ring: 'ring-yellow-400', text: 'text-yellow-500' },
    [Priority.URGENT]: { ring: 'ring-red-500', text: 'text-red-500' },
}

const InterventionList: React.FC<InterventionListProps> = ({
    interventions, selectedIntervention, onSelectIntervention, searchTerm,
    setSearchTerm, statusFilter, setStatusFilter, priorityFilter, setPriorityFilter, onAddClick,
}) => {
    const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            setSearchTerm(localSearchTerm);
        }, 400); // 400ms di debounce

        return () => {
            clearTimeout(debounceTimer);
        };
    }, [localSearchTerm, setSearchTerm]);

    return (
        <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-lg flex flex-col h-full transition-colors duration-300 border border-border-light dark:border-border-dark">
            <div className="p-4 border-b border-border-light dark:border-border-dark">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Interventi</h2>
                    <button
                        onClick={onAddClick}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary-foreground bg-primary rounded-lg shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring dark:focus:ring-offset-surface-dark"
                        aria-label="Aggiungi nuovo intervento"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Nuovo
                    </button>
                </div>
                <div className="relative mb-3">
                     <label htmlFor="search-intervention" className="sr-only">Cerca</label>
                    <input id="search-intervention" type="search" placeholder="Cerca..." value={localSearchTerm} onChange={(e) => setLocalSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background-light dark:bg-gray-700 dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-ring" />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <select id="status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="w-full p-2 border rounded-lg bg-background-light dark:bg-gray-700 dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-ring">
                        <option value="all">Tutti gli stati</option>
                        {Object.values(InterventionStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select id="priority-filter" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as any)} className="w-full p-2 border rounded-lg bg-background-light dark:bg-gray-700 dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-ring">
                        <option value="all">Tutte le priorità</option>
                        {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
            </div>
            <ul className="overflow-y-auto flex-grow divide-y divide-border-light dark:divide-border-dark" aria-live="polite">
                {interventions.length > 0 ? (
                    interventions.map(iv => (
                        <li key={iv.id} onClick={() => onSelectIntervention(iv)} onKeyPress={(e) => e.key === 'Enter' && onSelectIntervention(iv)}
                            tabIndex={0} role="button" aria-pressed={selectedIntervention?.id === iv.id}
                            className={`p-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:z-10 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150 relative ${
                                selectedIntervention?.id === iv.id ? 'bg-primary/10' : ''
                            }`}>
                             <div className={`absolute left-0 top-0 bottom-0 w-1 ${selectedIntervention?.id === iv.id ? 'bg-primary' : 'bg-transparent'}`}></div>
                            <div className="flex justify-between items-start gap-3">
                                <div className={`flex-shrink-0 w-3 h-3 mt-1.5 rounded-full ring-2 ring-offset-2 dark:ring-offset-surface-dark ${priorityClasses[iv.priority].ring}`}></div>
                                <div className="flex-grow pr-2 min-w-0">
                                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{iv.title}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate flex items-center gap-1.5">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                                      {iv.client.name}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate flex items-center gap-1.5">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                                      {iv.address}
                                    </p>
                                </div>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${statusColors[iv.status]}`}>
                                    {iv.status}
                                </span>
                            </div>
                        </li>
                    ))
                ) : (
                     <li className="p-8 text-center text-gray-500">Nessun intervento trovato.</li>
                )}
            </ul>
        </div>
    );
};

export default InterventionList;