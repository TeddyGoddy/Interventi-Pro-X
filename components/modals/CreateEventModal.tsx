import React, { useState, useEffect } from 'react';
import { Intervention, InterventionStatus, Priority } from '../../types';

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (eventData: CreateEventData) => void;
    interventions: Intervention[];
}

export interface CreateEventData {
    interventionId: number;
    scheduledStartDate: string;
    scheduledEndDate?: string;
    reminderDays: number[];
    reminderTimes: string[];
    notes?: string;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
    isOpen,
    onClose,
    onSave,
    interventions
}) => {
    const [selectedInterventionId, setSelectedInterventionId] = useState<number | null>(null);
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endDate, setEndDate] = useState('');
    const [endTime, setEndTime] = useState('17:00');
    const [reminderDays, setReminderDays] = useState<number[]>([1]);
    const [reminderTimes, setReminderTimes] = useState<string[]>(['09:00']);
    const [notes, setNotes] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedInterventionId(null);
            setStartDate('');
            setStartTime('09:00');
            setEndDate('');
            setEndTime('17:00');
            setReminderDays([1]);
            setReminderTimes(['09:00']);
            setNotes('');
            setSearchTerm('');
        }
    }, [isOpen]);

    // Filter available interventions (no scheduling yet)
    const availableInterventions = interventions.filter(intervention => 
        !intervention.scheduledStartDate && 
        intervention.status !== InterventionStatus.COMPLETED &&
        intervention.status !== InterventionStatus.CANCELED &&
        (searchTerm === '' || 
         intervention.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
         intervention.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const selectedIntervention = availableInterventions.find(i => i.id === selectedInterventionId);

    const handleSave = () => {
        if (!selectedInterventionId || !startDate) return;

        const eventData: CreateEventData = {
            interventionId: selectedInterventionId,
            scheduledStartDate: `${startDate}T${startTime}:00`,
            scheduledEndDate: endDate ? `${endDate}T${endTime}:00` : undefined,
            reminderDays,
            reminderTimes,
            notes: notes.trim() || undefined
        };

        onSave(eventData);
        onClose();
    };

    const addReminder = () => {
        setReminderDays([...reminderDays, 1]);
        setReminderTimes([...reminderTimes, '09:00']);
    };

    const removeReminder = (index: number) => {
        setReminderDays(reminderDays.filter((_, i) => i !== index));
        setReminderTimes(reminderTimes.filter((_, i) => i !== index));
    };

    const updateReminderDay = (index: number, days: number) => {
        const newReminderDays = [...reminderDays];
        newReminderDays[index] = days;
        setReminderDays(newReminderDays);
    };

    const updateReminderTime = (index: number, time: string) => {
        const newReminderTimes = [...reminderTimes];
        newReminderTimes[index] = time;
        setReminderTimes(newReminderTimes);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-surface-dark rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                
                {/* Header */}
                <div className="p-6 border-b border-border-light dark:border-border-dark">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4l6 6m0-6l-6 6" />
                            </svg>
                            Programma Nuovo Evento
                        </h2>
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

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
                    
                    {/* Step 1: Select Intervention */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                            1. Seleziona Intervento da Programmare
                        </h3>
                        
                        {/* Search */}
                        <div className="mb-3">
                            <input
                                type="text"
                                placeholder="Cerca intervento..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-darker text-gray-900 dark:text-white"
                            />
                        </div>

                        {/* Interventions List */}
                        <div className="border border-border-light dark:border-border-dark rounded-lg max-h-48 overflow-y-auto">
                            {availableInterventions.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                    {searchTerm ? 'Nessun intervento trovato' : 'Nessun intervento disponibile per la programmazione'}
                                </div>
                            ) : (
                                availableInterventions.map((intervention) => (
                                    <div
                                        key={intervention.id}
                                        onClick={() => setSelectedInterventionId(intervention.id)}
                                        className={`p-3 border-b border-border-light dark:border-border-dark last:border-b-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-surface-darker transition-colors ${
                                            selectedInterventionId === intervention.id 
                                                ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' 
                                                : ''
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900 dark:text-white">{intervention.title}</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{intervention.client?.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                                        intervention.priority === Priority.URGENT
                                                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                            : intervention.priority === Priority.HIGH
                                                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                                                            : intervention.priority === Priority.MEDIUM
                                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                    }`}>
                                                        {intervention.priority}
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">#{intervention.id}</span>
                                                </div>
                                            </div>
                                            {selectedInterventionId === intervention.id && (
                                                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Step 2: Set Date and Time */}
                    {selectedIntervention && (
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                                2. Imposta Data e Orario
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Start Date/Time */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Data Inizio *
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="flex-1 px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-darker text-gray-900 dark:text-white"
                                            required
                                        />
                                        <input
                                            type="time"
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                            className="px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-darker text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>

                                {/* End Date/Time */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Data Fine (opzionale)
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="flex-1 px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-darker text-gray-900 dark:text-white"
                                        />
                                        <input
                                            type="time"
                                            value={endTime}
                                            onChange={(e) => setEndTime(e.target.value)}
                                            className="px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-darker text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Notifications */}
                    {selectedIntervention && startDate && (
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                                3. Imposta Notifiche
                            </h3>
                            
                            {reminderDays.map((days, index) => (
                                <div key={index} className="flex items-center gap-3 mb-3">
                                    <select
                                        value={days}
                                        onChange={(e) => updateReminderDay(index, parseInt(e.target.value))}
                                        className="px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-darker text-gray-900 dark:text-white"
                                    >
                                        <option value={0}>Il giorno stesso</option>
                                        <option value={1}>1 giorno prima</option>
                                        <option value={3}>3 giorni prima</option>
                                        <option value={7}>1 settimana prima</option>
                                        <option value={14}>2 settimane prima</option>
                                    </select>
                                    
                                    <span className="text-sm text-gray-600 dark:text-gray-400">alle</span>
                                    
                                    <input
                                        type="time"
                                        value={reminderTimes[index]}
                                        onChange={(e) => updateReminderTime(index, e.target.value)}
                                        className="px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-darker text-gray-900 dark:text-white"
                                    />
                                    
                                    {reminderDays.length > 1 && (
                                        <button
                                            onClick={() => removeReminder(index)}
                                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                            
                            <button
                                onClick={addReminder}
                                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Aggiungi altra notifica
                            </button>
                        </div>
                    )}

                    {/* Step 4: Notes */}
                    {selectedIntervention && startDate && (
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                                4. Note Aggiuntive (opzionale)
                            </h3>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Aggiungi note per questo evento programmato..."
                                rows={3}
                                className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-darker text-gray-900 dark:text-white resize-none"
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border-light dark:border-border-dark flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-border-light dark:border-border-dark rounded-lg hover:bg-gray-50 dark:hover:bg-surface-darker transition-colors"
                    >
                        Annulla
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!selectedInterventionId || !startDate}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        📅 Programma Evento
                    </button>
                </div>
            </div>
        </div>
    );
};
