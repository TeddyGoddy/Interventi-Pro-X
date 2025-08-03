import * as React from 'react';
import { Intervention, Team } from '../types';
import EconomicKpis from './analytics/EconomicKpis';
import InterventionTrendChart from './analytics/InterventionTrendChart';
import TeamPerformanceChart from './analytics/TechnicianPerformanceChart';
import StatusDistributionChart from './analytics/StatusDistributionChart';

interface AnalyticsPageProps {
    interventions: Intervention[];
    teams: Team[];
}

type FilterType = '30d' | '90d' | 'all';

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ interventions, teams }) => {
    const [filter, setFilter] = React.useState<FilterType>('30d');

    const filteredInterventions = React.useMemo(() => {
        if (filter === 'all') return interventions;
        const now = new Date();
        const daysToSubtract = filter === '30d' ? 30 : 90;
        const cutoffDate = new Date(new Date().setDate(now.getDate() - daysToSubtract));
        return interventions.filter(iv => new Date(iv.creationDate) >= cutoffDate);
    }, [interventions, filter]);

    const FilterButton: React.FC<{ type: FilterType; label: string }> = ({ type, label }) => (
        <button
            onClick={() => setFilter(type)}
            className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                filter === type
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface-light dark:bg-surface-dark hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
        >
            {label}
        </button>
    );

    return (
        <main className="flex-grow p-4 md:p-6 lg:p-8 flex flex-col gap-6 bg-background-light dark:bg-background-dark animate-scale-in overflow-y-auto">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
                <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                    <FilterButton type="30d" label="Ultimi 30 giorni" />
                    <FilterButton type="90d" label="Ultimi 90 giorni" />
                    <FilterButton type="all" label="Sempre" />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <EconomicKpis interventions={filteredInterventions} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="xl:col-span-1">
                    <InterventionTrendChart interventions={filteredInterventions} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-6">
                    <TeamPerformanceChart interventions={filteredInterventions} teams={teams} />
                    <StatusDistributionChart interventions={filteredInterventions} />
                </div>
            </div>
        </main>
    );
};
export default AnalyticsPage;