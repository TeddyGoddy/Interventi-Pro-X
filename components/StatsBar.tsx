import * as React from 'react';
import { Intervention, InterventionStatus } from '../types';

interface StatsBarProps {
    interventions: Intervention[];
    activeStatusFilter?: InterventionStatus | null;
    onStatusFilterClick: (status: InterventionStatus | null) => void;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

interface StatCardData {
    label: string;
    count: number;
    trend: number;
    icon: React.ReactNode;
    bgColor: string;
    iconColor: string;
}

const StatsBar: React.FC<StatsBarProps> = ({ interventions, activeStatusFilter, onStatusFilterClick, isCollapsed = false, onToggleCollapse }) => {
    const { currentStats, previousStats, statsWithTrends } = React.useMemo(() => {
        const now = new Date();
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        
        // Conteggi attuali - tutti gli interventi per stato attuale
        const currentCounts = {
            [InterventionStatus.NEW]: 0,
            [InterventionStatus.PENDING]: 0,
            [InterventionStatus.IN_PROGRESS]: 0,
            [InterventionStatus.COMPLETED]: 0,
            [InterventionStatus.CANCELED]: 0,
        };
        
        // Conteggi un mese fa - interventi che esistevano un mese fa per il loro stato attuale
        const previousCounts = {
            [InterventionStatus.NEW]: 0,
            [InterventionStatus.PENDING]: 0,
            [InterventionStatus.IN_PROGRESS]: 0,
            [InterventionStatus.COMPLETED]: 0,
            [InterventionStatus.CANCELED]: 0,
        };
        
        for (const intervention of interventions) {
            const creationDate = new Date(intervention.creationDate);
            
            // Conta tutti gli interventi attuali per stato
            if (currentCounts.hasOwnProperty(intervention.status)) {
                currentCounts[intervention.status]++;
            }
            
            // Conta solo gli interventi che esistevano già un mese fa
            // (per il confronto del trend)
            if (creationDate <= oneMonthAgo) {
                if (previousCounts.hasOwnProperty(intervention.status)) {
                    previousCounts[intervention.status]++;
                }
            }
        }
        
        // Calcolo trend
        const calculateTrend = (current: number, previous: number): number => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        };
        
        const stats: StatCardData[] = [
            {
                label: 'Nuovi',
                count: currentCounts[InterventionStatus.NEW],
                trend: calculateTrend(currentCounts[InterventionStatus.NEW], previousCounts[InterventionStatus.NEW]),
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                ),
                bgColor: 'bg-blue-50 dark:bg-blue-900/20',
                iconColor: 'text-blue-600 dark:text-blue-400'
            },
            {
                label: 'In Attesa',
                count: currentCounts[InterventionStatus.PENDING],
                trend: calculateTrend(currentCounts[InterventionStatus.PENDING], previousCounts[InterventionStatus.PENDING]),
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                ),
                bgColor: 'bg-orange-50 dark:bg-orange-900/20',
                iconColor: 'text-orange-600 dark:text-orange-400'
            },
            {
                label: 'In Corso',
                count: currentCounts[InterventionStatus.IN_PROGRESS],
                trend: calculateTrend(currentCounts[InterventionStatus.IN_PROGRESS], previousCounts[InterventionStatus.IN_PROGRESS]),
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                ),
                bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
                iconColor: 'text-yellow-600 dark:text-yellow-400'
            },
            {
                label: 'Completati',
                count: currentCounts[InterventionStatus.COMPLETED],
                trend: calculateTrend(currentCounts[InterventionStatus.COMPLETED], previousCounts[InterventionStatus.COMPLETED]),
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                ),
                bgColor: 'bg-green-50 dark:bg-green-900/20',
                iconColor: 'text-green-600 dark:text-green-400'
            },
            {
                label: 'Annullati',
                count: currentCounts[InterventionStatus.CANCELED],
                trend: calculateTrend(currentCounts[InterventionStatus.CANCELED], previousCounts[InterventionStatus.CANCELED]),
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                ),
                bgColor: 'bg-red-50 dark:bg-red-900/20',
                iconColor: 'text-red-600 dark:text-red-400'
            }
        ];
        
        return {
            currentStats: currentCounts,
            previousStats: previousCounts,
            statsWithTrends: stats
        };
    }, [interventions]);
    
    const handleStatusClick = (index: number) => {
        const statusOrder = [InterventionStatus.NEW, InterventionStatus.PENDING, InterventionStatus.IN_PROGRESS, InterventionStatus.COMPLETED, InterventionStatus.CANCELED];
        const status = statusOrder[index];
        
        if (activeStatusFilter === status) {
            onStatusFilterClick(null);
        } else {
            onStatusFilterClick(status);
        }
    };
    
    const formatTrend = (trend: number): { text: string; color: string } => {
        if (trend > 0) {
            return { text: `+${trend}% vs mese scorso`, color: 'text-green-600' };
        } else if (trend < 0) {
            return { text: `${trend}% vs mese scorso`, color: 'text-red-600' };
        } else {
            return { text: '0% vs mese scorso', color: 'text-gray-500' };
        }
    };
    
    return (
        <div className="relative">
            {/* Toggle Button - Solo su mobile */}
            {onToggleCollapse && (
                <button
                    onClick={onToggleCollapse}
                    className="md:hidden absolute -top-2 right-2 z-20 bg-white dark:bg-gray-800 rounded-full p-2 shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200"
                    title={isCollapsed ? 'Espandi statistiche' : 'Riduci statistiche'}
                >
                    <svg 
                        className={`w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform duration-200 ${
                            isCollapsed ? 'rotate-180' : ''
                        }`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                </button>
            )}
            
            {/* Stats Grid */}
            <div className={`transition-all duration-300 overflow-hidden ${
                isCollapsed ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'
            }`}>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {statsWithTrends.map((stat, index) => {
                        const statusOrder = [InterventionStatus.NEW, InterventionStatus.PENDING, InterventionStatus.IN_PROGRESS, InterventionStatus.COMPLETED, InterventionStatus.CANCELED];
                        const isActive = activeStatusFilter === statusOrder[index];
                        const trendInfo = formatTrend(stat.trend);
                        
                        return (
                            <button
                                key={index}
                                onClick={() => handleStatusClick(index)}
                                className={`bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 text-left relative overflow-hidden ${
                                    isActive ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''
                                }`}
                                title={`${isActive ? 'Rimuovi filtro' : 'Filtra per'} ${stat.label}`}
                            >
                                {/* Content */}
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-1">
                                        <div>
                                            <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-0.5">
                                                {stat.label}
                                            </div>
                                            <div className="text-xl font-bold text-gray-900 dark:text-white">
                                                {stat.count}
                                            </div>
                                        </div>
                                        <div className={`p-1.5 rounded-lg mt-2 ${stat.bgColor}`}>
                                            <div className={stat.iconColor}>
                                                {stat.icon}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className={`text-xs font-medium ${trendInfo.color}`}>
                                        {trendInfo.text}
                                    </div>
                                </div>
                                
                                {/* Active indicator */}
                                {isActive && (
                                    <div className="absolute inset-0 bg-blue-50 dark:bg-blue-900/10 opacity-50" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default StatsBar;