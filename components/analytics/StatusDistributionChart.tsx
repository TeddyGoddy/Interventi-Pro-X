import * as React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { type ChartOptions } from 'chart.js';
import { Intervention, InterventionStatus } from '../../types';

interface StatusDistributionChartProps {
    interventions: Intervention[];
}

const statusColors: Record<InterventionStatus, { bg: string, border: string }> = {
    [InterventionStatus.NEW]: { bg: 'rgba(59, 130, 246, 0.7)', border: 'rgb(59, 130, 246)'},
    [InterventionStatus.PENDING]: { bg: 'rgba(249, 115, 22, 0.7)', border: 'rgb(249, 115, 22)' },
    [InterventionStatus.IN_PROGRESS]: { bg: 'rgba(245, 158, 11, 0.7)', border: 'rgb(245, 158, 11)' },
    [InterventionStatus.COMPLETED]: { bg: 'rgba(16, 185, 129, 0.7)', border: 'rgb(16, 185, 129)' },
    [InterventionStatus.CANCELED]: { bg: 'rgba(107, 114, 128, 0.7)', border: 'rgb(107, 114, 128)' },
};

const StatusDistributionChart: React.FC<StatusDistributionChartProps> = ({ interventions }) => {

    const chartData = React.useMemo(() => {
        const counts = interventions.reduce((acc, iv) => {
            acc[iv.status] = (acc[iv.status] || 0) + 1;
            return acc;
        }, {} as Record<InterventionStatus, number>);

        const labels = Object.keys(counts) as InterventionStatus[];
        const data = Object.values(counts);
        const backgroundColors = labels.map(label => statusColors[label].bg);
        const borderColors = labels.map(label => statusColors[label].border);

        return {
            labels,
            datasets: [{
                label: 'Interventi',
                data,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1,
            }]
        };
    }, [interventions]);
    
    const isDarkMode = document.documentElement.classList.contains('dark');
    const options: ChartOptions<'doughnut'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right' as const,
                 labels: { color: isDarkMode ? '#D1D5DB' : '#374151' }
            },
            title: { display: false },
        },
        cutout: '60%',
    };

    return (
        <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-lg shadow-lg h-full min-h-[300px]">
            <h3 className="font-semibold mb-4 text-gray-800 dark:text-white">Distribuzione per Stato</h3>
            {interventions.length > 0 ? (
                <div className="h-64">
                    <Doughnut data={chartData} options={options} />
                </div>
             ) : (
                <div className="flex items-center justify-center h-full text-gray-500">Nessun dato da mostrare.</div>
            )}
        </div>
    );
};
export default StatusDistributionChart;
