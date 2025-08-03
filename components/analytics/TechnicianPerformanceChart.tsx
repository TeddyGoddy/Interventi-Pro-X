import * as React from 'react';
import { Bar } from 'react-chartjs-2';
import { type ChartOptions } from 'chart.js';
import { Intervention, Team, InterventionStatus } from '../../types';

interface TeamPerformanceChartProps {
    interventions: Intervention[];
    teams: Team[];
}

const TeamPerformanceChart: React.FC<TeamPerformanceChartProps> = ({ interventions, teams }) => {

    const chartData = React.useMemo(() => {
        const performance = teams.map(team => {
            const completedCount = interventions.filter(iv => 
                iv.assignedTeamId === team.id && iv.status === InterventionStatus.COMPLETED
            ).length;
            return { name: team.name, count: completedCount };
        });

        // Sort by performance and take top 10
        const sortedPerformance = performance.sort((a, b) => b.count - a.count).slice(0, 10);
        
        return {
            labels: sortedPerformance.map(p => p.name),
            datasets: [{
                label: 'Interventi Completati',
                data: sortedPerformance.map(p => p.count),
                backgroundColor: 'hsla(244, 76%, 58%, 0.7)',
                borderColor: 'hsl(244, 76%, 58%)',
                borderWidth: 1,
            }]
        };

    }, [interventions, teams]);

    const isDarkMode = document.documentElement.classList.contains('dark');
    const options: ChartOptions<'bar'> = {
        indexAxis: 'y' as const,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: false }
        },
        scales: {
             x: {
                ticks: { color: isDarkMode ? '#9CA3AF' : '#6B7280', stepSize: 1 },
                grid: { color: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
            },
            y: {
                ticks: { color: isDarkMode ? '#D1D5DB' : '#374151' },
                grid: { display: false }
            }
        }
    };

    return (
        <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-lg shadow-lg h-full min-h-[300px]">
            <h3 className="font-semibold mb-4 text-gray-800 dark:text-white">Performance Squadre (Top 10)</h3>
            {interventions.length > 0 && teams.length > 0 ? (
                 <div className="h-64">
                    <Bar options={options} data={chartData} />
                 </div>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-500">Nessun dato da mostrare.</div>
            )}
        </div>
    );
};
export default TeamPerformanceChart;