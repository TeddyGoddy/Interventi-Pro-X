import React, { useMemo, useCallback, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { EventChangeArg, EventClickArg, EventContentArg, DateSelectArg, EventDropArg } from '@fullcalendar/core';
import itLocale from '@fullcalendar/core/locales/it';
import { Intervention, InterventionStatus, Priority, Team, Client, Vehicle } from '../types';
import { CreateEventModal, CreateEventData } from './modals/CreateEventModal';
import { EditEventModal, EditEventData } from './modals/EditEventModal';

// Props interface for the component
interface PlanningPageProps {
    interventions: Intervention[];
    teams: Team[];
    clients: Client[];
    vehicles: Vehicle[];
    onUpdateInterventionTime: (id: number, startDate: Date, endDate: Date | null) => void;
    onCreateEvent?: (eventData: CreateEventData) => void;
    onEditEvent?: (eventData: EditEventData) => void;
    onDeleteEventScheduling?: (id: number) => void;
    onEditIntervention?: (intervention: Intervention) => void;
}

// Color mapping for intervention statuses
const statusStyles: Record<InterventionStatus, { backgroundColor: string, borderColor: string, textColor: string }> = {
    [InterventionStatus.NEW]: { backgroundColor: 'hsl(207, 82%, 56%)', borderColor: 'hsl(207, 82%, 46%)', textColor: '#fff' },
    [InterventionStatus.PENDING]: { backgroundColor: 'hsl(30, 93%, 54%)', borderColor: 'hsl(30, 93%, 44%)', textColor: '#fff' },
    [InterventionStatus.IN_PROGRESS]: { backgroundColor: 'hsl(40, 90%, 53%)', borderColor: 'hsl(40, 90%, 43%)', textColor: '#fff' },
    [InterventionStatus.COMPLETED]: { backgroundColor: 'hsl(150, 68%, 42%)', borderColor: 'hsl(150, 68%, 32%)', textColor: '#fff' },
    [InterventionStatus.CANCELED]: { backgroundColor: 'hsl(220, 9%, 56%)', borderColor: 'hsl(220, 9%, 46%)', textColor: '#fff' },
};

// Component to render the content of a calendar event
const renderEventContent = (eventInfo: EventContentArg) => {
    return (
        <div className="p-1 w-full h-full overflow-hidden text-white" style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.8)' }}>
            <b className="font-bold block truncate" style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.9)' }}>{eventInfo.timeText}</b>
            <i className="truncate block not-italic font-semibold" style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.8)' }}>{eventInfo.event.title}</i>
            {eventInfo.view.type.includes('Grid') && (
                <p className="text-xs truncate font-medium" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)', opacity: 0.95 }}>{eventInfo.event.extendedProps.teamName}</p>
            )}
        </div>
    );
};

// Main PlanningPage component
const PlanningPage: React.FC<PlanningPageProps> = ({
    interventions,
    teams,
    clients,
    vehicles,
    onUpdateInterventionTime,
    onCreateEvent,
    onEditEvent,
    onDeleteEventScheduling,
    onEditIntervention
}) => {
    // State management
    const [filteredTeamIds, setFilteredTeamIds] = useState<number[]>([]);
    const [statusFilter, setStatusFilter] = useState<InterventionStatus | null>(null);
    const [priorityFilter, setPriorityFilter] = useState<Priority | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedEvent, setSelectedEvent] = useState<Intervention | null>(null);
    const [filtersCollapsed, setFiltersCollapsed] = useState(false);
    const [showCreateEventModal, setShowCreateEventModal] = useState(false);
    const [showEditEventModal, setShowEditEventModal] = useState(false);
    const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day' | 'list'>('month');
    const [calendarKey, setCalendarKey] = useState(Date.now());
    const [isFiltersCollapsed, setIsFiltersCollapsed] = useState<boolean>(false);

    // Force re-render when needed
    React.useEffect(() => {
        setCalendarKey(Date.now());
    }, []);

    // Handler functions
    const handleTeamFilterChange = useCallback((teamId: number) => {
        setFilteredTeamIds(prev => 
            prev.includes(teamId) 
                ? prev.filter(id => id !== teamId)
                : [...prev, teamId]
        );
    }, []);

    const handleClearFilters = useCallback(() => {
        setFilteredTeamIds([]);
        setStatusFilter(null);
        setPriorityFilter(null);
        setSearchTerm('');
    }, []);

    const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
        // Create new event on date selection
        if (onCreateEvent) {
            setShowCreateEventModal(true);
        } else {
            alert('Funzionalità di creazione eventi in sviluppo. Seleziona un intervento esistente per pianificarlo.');
        }
    }, [onCreateEvent]);

    const handleCreateEvent = useCallback(() => {
        setShowCreateEventModal(true);
    }, []);

    const handleSaveNewEvent = useCallback((eventData: CreateEventData) => {
        if (onCreateEvent) {
            onCreateEvent(eventData);
        }
        setShowCreateEventModal(false);
    }, [onCreateEvent]);

    const handleEditEvent = useCallback(() => {
        setShowEditEventModal(true);
    }, []);

    const handleSaveEditEvent = useCallback((eventData: EditEventData) => {
        if (onEditEvent) {
            onEditEvent(eventData);
        }
        setShowEditEventModal(false);
        setSelectedEvent(null);
    }, [onEditEvent]);

    const handleEventClick = useCallback((clickInfo: EventClickArg) => {
        const intervention = interventions.find(i => i.id.toString() === clickInfo.event.id);
        if (intervention) {
            setSelectedEvent(intervention);
        }
    }, [interventions]);



    const handleDeleteEvent = useCallback((id: number) => {
        // Delete only the event scheduling (scheduledStartDate/scheduledEndDate), not the intervention
        if (onDeleteEventScheduling) {
            onDeleteEventScheduling(id);
            setSelectedEvent(null);
        } else {
            // Fallback: Use the intervention time update to clear scheduling
            onUpdateInterventionTime(id, new Date(0), null); // Clear scheduling
            setSelectedEvent(null);
            alert('✅ Evento rimosso dal calendario!\n\nL\'intervento rimane nel sistema e può essere riprogrammato in futuro.');
        }
    }, [onDeleteEventScheduling, onUpdateInterventionTime]);

    // Filtered interventions based on all filters
    const filteredInterventions = useMemo(() => {
        let filtered = interventions.filter(iv => iv.scheduledStartDate);

        // Search filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(iv => 
                iv.title.toLowerCase().includes(searchLower) ||
                iv.description.toLowerCase().includes(searchLower) ||
                iv.address.toLowerCase().includes(searchLower) ||
                iv.client.name.toLowerCase().includes(searchLower)
            );
        }

        // Status filter
        if (statusFilter) {
            filtered = filtered.filter(iv => iv.status === statusFilter);
        }

        // Priority filter
        if (priorityFilter) {
            filtered = filtered.filter(iv => iv.priority === priorityFilter);
        }

        // Team filter
        if (filteredTeamIds.length > 0) {
            filtered = filtered.filter(iv => 
                iv.assignedTeamId ? filteredTeamIds.includes(iv.assignedTeamId) : false
            );
        }

        return filtered.sort((a, b) => {
            const dateA = new Date(a.scheduledStartDate!);
            const dateB = new Date(b.scheduledStartDate!);
            return dateA.getTime() - dateB.getTime();
        });
    }, [interventions, searchTerm, statusFilter, priorityFilter, filteredTeamIds]);

    // Inject styles dynamically based on theme
    React.useEffect(() => {
        const calendarLightThemeStyles = `
            .fc {
                background-color: white;
                color: #1f2937;
            }
            .fc-toolbar-title {
                color: #1f2937 !important;
                font-weight: 600;
            }
            .fc-button {
                background-color: #f3f4f6 !important;
                border-color: #d1d5db !important;
                color: #374151 !important;
            }
            .fc-button:hover {
                background-color: #e5e7eb !important;
            }
            .fc-button-active {
                background-color: #6366f1 !important;
                border-color: #6366f1 !important;
                color: white !important;
            }
            .fc-col-header-cell {
                background-color: #f9fafb;
                color: #374151;
                font-weight: 600;
            }
            .fc-daygrid-day {
                background-color: white;
            }
            .fc-daygrid-day-number {
                color: #374151;
            }
            .fc-day-today {
                background-color: #fef3c7 !important;
            }
            .fc-list-day-cushion {
                background-color: #f3f4f6;
                color: #374151;
            }
            .fc-list-event {
                border-left-color: #6366f1;
            }
            .fc-list-event-title {
                color: #374151;
            }
            .fc-list-event-time {
                color: #6b7280;
            }
        `;

        const calendarDarkThemeStyles = `
            .fc {
                background-color: #1f2937;
                color: white;
            }
            .fc-toolbar-title {
                color: white !important;
                font-weight: 600;
            }
            .fc-button {
                background-color: #374151 !important;
                border-color: #374151 !important;
                color: white !important;
            }
            .fc-button:hover {
                background-color: #6366f1 !important;
            }
            .fc-button-active {
                background-color: #6366f1 !important;
                border-color: #6366f1 !important;
                color: white !important;
            }
            .fc-col-header-cell {
                background-color: #374151;
                color: white;
                font-weight: 600;
            }
            .fc-daygrid-day {
                background-color: #374151;
            }
            .fc-daygrid-day-number {
                color: white;
            }
            .fc-day-today {
                background-color: #fef3c7 !important;
            }
            .fc-list-day-cushion {
                background-color: #374151;
                color: white;
            }
            .fc-list-event {
                border-left-color: #6366f1;
            }
            .fc-list-event-title {
                color: white;
            }
            .fc-list-event-time {
                color: #6b7280;
            }
            .fc-event-content {
                font-size: 0.7rem !important;
                padding: 1px 2px !important;
                line-height: 1.1;
                height: 100%;
                overflow: hidden;
            }
            .fc-event-title {
                font-weight: 500;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: calc(100% - 20px);
            }
            .fc-daygrid-event {
                margin: 1px 0 !important;
                font-size: 0.65rem !important;
                min-height: 18px !important;
                overflow: hidden !important;
            }
            .fc-daygrid-event .fc-event-main {
                padding: 2px 4px !important;
                overflow: hidden !important;
                white-space: nowrap !important;
                text-overflow: ellipsis !important;
            }
            .fc-daygrid-event .fc-event-title {
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                white-space: nowrap !important;
                display: block !important;
            }
            .fc-event {
                border: none !important;
                border-radius: 3px !important;
            }
            
            /* Right panel layout fixes */
            .event-details-panel {
                display: flex !important;
                flex-direction: column !important;
                height: 100% !important;
            }
            .event-details-content {
                flex: 1 !important;
                overflow-y: auto !important;
                min-height: 0 !important;
            }
            .event-details-footer {
                flex-shrink: 0 !important;
                border-top: 1px solid var(--border-color) !important;
                background: var(--surface-color) !important;
                margin-top: auto !important;
            }
        `;

        const style = document.createElement('style');
        style.type = 'text/css';
        style.appendChild(document.createTextNode(calendarLightThemeStyles)); // Single theme CSS
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    // Remove duplicate functions - using the enhanced versions defined earlier

    // Memoized transformation of interventions into FullCalendar event objects
    const calendarEvents = useMemo(() => {
        if (!filteredInterventions || !teams) return [];

        return filteredInterventions.map(iv => {
            const team = teams.find(t => t.id === iv.assignedTeamId);
            const styles = statusStyles[iv.status] || statusStyles[InterventionStatus.CANCELED];
            return {
                id: iv.id.toString(),
                title: iv.title,
                start: iv.scheduledStartDate,
                end: iv.scheduledEndDate,
                backgroundColor: styles.backgroundColor,
                borderColor: styles.borderColor,
                textColor: styles.textColor,
                extendedProps: {
                    teamName: team?.name || 'N/A',
                    address: iv.address,
                    priority: iv.priority,
                    status: iv.status,
                    client: iv.client.name
                },
            };
        });
    }, [filteredInterventions, teams]);

    // Callback for when an event is dragged and dropped
    const handleEventDrop = React.useCallback((dropInfo: EventDropArg) => {
        onUpdateInterventionTime(
            parseInt(dropInfo.event.id),
            dropInfo.event.start!,
            dropInfo.event.end
        );
    }, [onUpdateInterventionTime]);

    // Callback for when an event is resized
    const handleEventResize = useCallback((resizeInfo: EventChangeArg) => {
        onUpdateInterventionTime(
            parseInt(resizeInfo.event.id),
            resizeInfo.event.start!,
            resizeInfo.event.end
        );
    }, [onUpdateInterventionTime]);

    // Custom event content renderer
    const renderEventContent = useCallback((eventInfo: any) => {
        const { event } = eventInfo;
        const priority = event.extendedProps.priority;
        const status = event.extendedProps.status;
        
        const priorityIcon = priority === Priority.URGENT ? '●' :
                           priority === Priority.HIGH ? '●' :
                           priority === Priority.MEDIUM ? '●' : '●';
        
        // Dynamic text color using CSS variables that adapt to theme automatically
        const isUrgent = priority === Priority.URGENT;
        const isHigh = priority === Priority.HIGH;
        const isMedium = priority === Priority.MEDIUM;
        
        const textColor = 'var(--text-primary, #1f2937)';
        const iconColor = isUrgent ? 'var(--priority-urgent, #dc2626)' :
                         isHigh ? 'var(--priority-high, #ea580c)' :
                         isMedium ? 'var(--priority-medium, #ca8a04)' : 
                         'var(--priority-low, #6b7280)';

        return (
            <div className="fc-event-content" style={{ 
                fontSize: '0.65rem', 
                padding: '2px 4px', 
                lineHeight: '1.1',
                overflow: 'hidden',
                width: '100%',
                height: '100%'
            }}>
                <div className="flex items-center gap-1" style={{ 
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    width: '100%'
                }}>
                    <span className="flex-shrink-0" style={{ 
                        fontSize: '8px',
                        color: iconColor
                    }}>{priorityIcon}</span>
                    <span className="truncate font-medium" style={{ 
                        fontSize: '0.65rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: textColor
                    }}>{event.title}</span>
                </div>
            </div>
        );
    }, []);

    return (
        <main className="flex-grow flex flex-col lg:flex-row gap-4 p-4 bg-background-light dark:bg-background-dark animate-scale-in overflow-hidden">
            
            {/* Left Panel - Event List & Filters */}
            <aside className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4">
                {/* Quick Stats */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-lg p-4 border border-border-light dark:border-border-dark">
                    <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <h2 className="font-semibold text-lg text-gray-900 dark:text-white">Pianificazione</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{filteredInterventions.length}</div>
                            <div className="text-xs text-blue-600 dark:text-blue-400">Pianificati</div>
                        </div>
                        <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                            <div className="text-xl font-bold text-green-600 dark:text-green-400">{filteredInterventions.filter(i => new Date(i.scheduledStartDate!) >= new Date()).length}</div>
                            <div className="text-xs text-green-600 dark:text-green-400">Futuri</div>
                        </div>
                    </div>
                </div>

                {/* Advanced Filters */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark">
                    <div 
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                        onClick={() => setIsFiltersCollapsed(!isFiltersCollapsed)}
                    >
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                            </svg>
                            <h3 className="font-medium text-gray-900 dark:text-white">Filtri</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            {(searchTerm || statusFilter || priorityFilter || filteredTeamIds.length > 0) && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                    Attivi
                                </span>
                            )}
                            <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                                isFiltersCollapsed ? 'rotate-180' : ''
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                    
                    {!isFiltersCollapsed && (
                        <div className="p-4 pt-0 space-y-3">
                    {/* Search */}
                    <div>
                        <input
                            type="text"
                            placeholder="Cerca interventi..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2 text-sm border rounded-lg bg-background-light dark:bg-gray-700 dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Stato</label>
                        <select
                            value={statusFilter || ''}
                            onChange={(e) => setStatusFilter(e.target.value as InterventionStatus || null)}
                            className="w-full p-2 text-sm border rounded-lg bg-background-light dark:bg-gray-700 dark:border-border-dark"
                        >
                            <option value="">Tutti</option>
                            {Object.values(InterventionStatus).map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>

                    {/* Priority Filter */}
                    <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Priorità</label>
                        <select
                            value={priorityFilter || ''}
                            onChange={(e) => setPriorityFilter(e.target.value as Priority || null)}
                            className="w-full p-2 text-sm border rounded-lg bg-background-light dark:bg-gray-700 dark:border-border-dark"
                        >
                            <option value="">Tutte</option>
                            {Object.values(Priority).map(priority => (
                                <option key={priority} value={priority}>{priority}</option>
                            ))}
                        </select>
                    </div>

                    {/* Team Filter */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Squadre</label>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                            {teams.map(team => (
                                <label key={team.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 p-1 rounded">
                                    <input
                                        type="checkbox"
                                        checked={filteredTeamIds.includes(team.id)}
                                        onChange={() => handleTeamFilterChange(team.id)}
                                        className="w-3 h-3 text-primary rounded"
                                    />
                                    <span className="text-gray-800 dark:text-gray-200 truncate">{team.name}</span>
                                </label>
                            ))}
                        </div>
                        <button
                            onClick={handleClearFilters}
                            className="w-full mt-2 text-xs text-primary hover:underline"
                        >
                            Pulisci filtri
                        </button>
                    </div>
                        </div>
                    )}
                </div>

                {/* Event List */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark flex-grow min-h-0">
                    <div className="p-4 border-b border-border-light dark:border-border-dark">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <h3 className="font-medium text-gray-900 dark:text-white">Eventi Pianificati</h3>
                        </div>
                    </div>
                    <div className="p-2 overflow-y-auto max-h-96">
                        {filteredInterventions.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <svg className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="text-sm">Nessun evento pianificato</p>
                            </div>
                        ) : (
                            filteredInterventions.map(intervention => (
                                <div
                                    key={intervention.id}
                                    onClick={() => setSelectedEvent(intervention)}
                                    className={`p-3 mb-2 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                                        selectedEvent?.id === intervention.id
                                            ? 'border-primary bg-primary/5'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-grow min-w-0">
                                            <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                                {intervention.title}
                                            </h4>
                                            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span className="truncate">{intervention.address}</span>
                                            </div>
                                            {intervention.scheduledStartDate && (
                                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span>{new Date(intervention.scheduledStartDate).toLocaleDateString('it-IT', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
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
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                intervention.status === InterventionStatus.COMPLETED
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                    : intervention.status === InterventionStatus.IN_PROGRESS
                                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                                            }`}>
                                                {intervention.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </aside>

            {/* Center Panel - Calendar */}
            <div className="flex-grow flex flex-col min-h-0">
                {/* Calendar Header */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-lg p-4 mb-4 border border-border-light dark:border-border-dark">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <h2 className="font-semibold text-lg text-gray-900 dark:text-white">Calendario</h2>
                            </div>
                            <div className="flex items-center gap-1">
                                {(['month', 'week', 'day', 'list'] as const).map((view) => (
                                    <button
                                        key={view}
                                        onClick={() => setCalendarView(view)}
                                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                            calendarView === view
                                                ? 'bg-primary text-primary-foreground'
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        {view === 'month' ? 'Mese' : view === 'week' ? 'Settimana' : view === 'day' ? 'Giorno' : 'Lista'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={handleCreateEvent}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Nuovo Evento
                        </button>
                    </div>
                </div>

                {/* Calendar Container */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark flex-grow min-h-0">
                    <div className="p-4 h-full">
                        <FullCalendar
                            key={calendarKey}
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: '' // We handle view switching in our custom header
                            }}
                            initialView={calendarView === 'month' ? 'dayGridMonth' : calendarView === 'week' ? 'timeGridWeek' : calendarView === 'day' ? 'timeGridDay' : 'listWeek'}
                            locale={itLocale}
                            weekends={true}
                            events={calendarEvents}
                            editable={true}
                            droppable={true}
                            selectable={true}
                            selectMirror={true}
                            dayMaxEvents={true}
                            weekNumbers={true}
                            navLinks={true}
                            select={handleDateSelect}
                            eventClick={handleEventClick}
                            eventDrop={handleEventDrop}
                            eventResize={handleEventResize}
                            eventContent={renderEventContent}
                            height="100%"
                            contentHeight="auto"
                            aspectRatio={1.35}
                        />
                    </div>
                </div>
            </div>

            {/* Create Event Modal */}
            <CreateEventModal
                isOpen={showCreateEventModal}
                onClose={() => setShowCreateEventModal(false)}
                onSave={handleSaveNewEvent}
                interventions={interventions}
            />

            {/* Edit Event Modal */}
            <EditEventModal
                isOpen={showEditEventModal}
                onClose={() => setShowEditEventModal(false)}
                onSave={handleSaveEditEvent}
                intervention={selectedEvent}
            />

            {/* Right Panel - Event Details */}
            {selectedEvent && (
                <aside className="event-details-panel w-full lg:w-80 flex-shrink-0 bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark flex flex-col max-h-[calc(100vh-8rem)] min-h-[500px]">
                    <div className="p-4 border-b border-border-light dark:border-border-dark flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h3 className="font-medium text-gray-900 dark:text-white">Dettagli Evento</h3>
                            </div>
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className="event-details-content p-4 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-12rem)]">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Titolo</label>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedEvent.title}</p>
                        </div>
                        
                        {selectedEvent.description && (
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Descrizione</label>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{selectedEvent.description}</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Cliente</label>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{selectedEvent.client.name}</p>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Indirizzo</label>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{selectedEvent.address}</p>
                        </div>

                        {selectedEvent.scheduledStartDate && (
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Data e Ora</label>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    {new Date(selectedEvent.scheduledStartDate).toLocaleString('it-IT')}
                                    {selectedEvent.scheduledEndDate && (
                                        <span> - {new Date(selectedEvent.scheduledEndDate).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                                    )}
                                </p>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                selectedEvent.priority === Priority.URGENT
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                    : selectedEvent.priority === Priority.HIGH
                                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                                    : selectedEvent.priority === Priority.MEDIUM
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            }`}>
                                {selectedEvent.priority}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                selectedEvent.status === InterventionStatus.COMPLETED
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : selectedEvent.status === InterventionStatus.IN_PROGRESS
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                            }`}>
                                {selectedEvent.status}
                            </span>
                        </div>

                    </div>
                    <div className="event-details-footer p-4 pt-0 flex-shrink-0" style={{ minHeight: '80px', position: 'sticky', bottom: 0 }}>
                        <div className="flex gap-2 pt-3 border-t border-border-light dark:border-border-dark">
                            <button
                                onClick={() => {
                                    console.log('Edit event clicked:', selectedEvent.id);
                                    handleEditEvent();
                                }}
                                className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V6a1 1 0 00-1-1zm-7 7a2 2 0 012-2h1a1 1 0 011 1v3a1 1 0 01-1 1H6a2 2 0 01-2-2v-1z" />
                                </svg>
                                Modifica Evento
                            </button>
                            <button
                                onClick={() => {
                                    console.log('Delete event clicked:', selectedEvent.id);
                                    handleDeleteEvent(selectedEvent.id);
                                }}
                                className="px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1 font-medium"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Elimina Evento
                            </button>
                        </div>
                    </div>
                </aside>
            )}
        </main>
    );
};

export default PlanningPage;
