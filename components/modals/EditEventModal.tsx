import React, { useState, useEffect } from 'react';
import { Intervention } from '../../types';

interface EditEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (eventData: EditEventData) => void;
    intervention: Intervention | null;
}

export interface EditEventData {
    interventionId: number;
    scheduledStartDate: string;
    scheduledEndDate?: string;
    reminderDays: number[];
    reminderTimes: string[];
    notes?: string;
}

export const EditEventModal: React.FC<EditEventModalProps> = ({
    isOpen,
    onClose,
    onSave,
    intervention
}) => {
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endDate, setEndDate] = useState('');
    const [endTime, setEndTime] = useState('17:00');
    const [reminderDays, setReminderDays] = useState<number[]>([1]);
    const [reminderTimes, setReminderTimes] = useState<string[]>(['09:00']);
    const [notes, setNotes] = useState('');

    // Initialize form with current event data
    useEffect(() => {
        if (isOpen && intervention) {
            if (intervention.scheduledStartDate) {
                const startDateTime = new Date(intervention.scheduledStartDate);
                setStartDate(startDateTime.toISOString().split('T')[0]);
                setStartTime(startDateTime.toTimeString().slice(0, 5));
            }
            
            if (intervention.scheduledEndDate) {
                const endDateTime = new Date(intervention.scheduledEndDate);
                setEndDate(endDateTime.toISOString().split('T')[0]);
                setEndTime(endDateTime.toTimeString().slice(0, 5));
            } else {
                setEndDate('');
                setEndTime('17:00');
            }
            
            // Initialize with default reminders for now
            setReminderDays([1]);
            setReminderTimes(['09:00']);
            setNotes(intervention.notes || '');
        }
    }, [isOpen, intervention]);

    const handleSave = () => {
        if (!intervention || !startDate) return;

        const eventData: EditEventData = {
            interventionId: intervention.id,
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

    if (!isOpen || !intervention) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-surface-dark rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                
                {/* Header */}
                <div className="p-6 border-b border-border-light dark:border-border-dark">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V6a1 1 0 00-1-1zm-7 7a2 2 0 012-2h1a1 1 0 011 1v3a1 1 0 01-1 1H6a2 2 0 01-2-2v-1z" />
                            </svg>
                            Modifica Evento Programmato
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
                    
                    {/* Event Info */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Evento per Intervento:</h3>
                        <p className="text-blue-800 dark:text-blue-200 font-medium">{intervention.title}</p>
                        <p className="text-blue-600 dark:text-blue-300 text-sm">Cliente: {intervention.client?.name}</p>
                        <p className="text-blue-600 dark:text-blue-300 text-sm">ID: #{intervention.id}</p>
                    </div>

                    {/* Date and Time */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                            📅 Modifica Data e Orario
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

                    {/* Notifications */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                            🔔 Modifica Notifiche
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

                    {/* Notes */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                            📝 Note Evento (opzionale)
                        </h3>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Note aggiuntive per questo evento programmato..."
                            rows={3}
                            className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-darker text-gray-900 dark:text-white resize-none"
                        />
                    </div>
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
                        disabled={!startDate}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Salva Modifiche Evento
                    </button>
                </div>
            </div>
        </div>
    );
};
