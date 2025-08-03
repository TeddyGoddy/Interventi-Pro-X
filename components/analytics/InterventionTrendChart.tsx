import * as React from 'react';
import { Line } from 'react-chartjs-2';
import { type ChartOptions } from 'chart.js';
import { it } from 'date-fns/locale/it';
import { Intervention, InterventionStatus } from '../../types';

interface InterventionTrendChartProps {
    interventions: Intervention[];
}

const InterventionTrendChart: React.FC<InterventionTrendChartProps> = ({ interventions }) => {
    const chartData = React.useMemo(() => {
        const data: { [date: string]: { created: number; completed: number; canceled: number } } = {};

        interventions.forEach(iv => {
            const createdDate = new Date(iv.creationDate).toISOString().split('T')[0];
            if (!data[createdDate]) data[createdDate] = { created: 0, completed: 0, canceled: 0 };
            data[createdDate].created++;

            if (iv.status === InterventionStatus.COMPLETED || iv.status === InterventionStatus.CANCELED) {
                const updatedDate = new Date(iv.lastUpdate).toISOString().split('T')[0];
                 if (!data[updatedDate]) data[updatedDate] = { created: 0, completed: 0, canceled: 0 };
                if(iv.status === InterventionStatus.COMPLETED) data[updatedDate].completed++;
                if(iv.status === InterventionStatus.CANCELED) data[updatedDate].canceled++;
            }
        });

        const sortedDates = Object.keys(data).sort((a,b) => new Date(a).getTime() - new Date(b).getTime());
        
        return {
            labels: sortedDates,
            datasets: [
                {
                    label: 'Creati',
                    data: sortedDates.map(date => data[date].created),
                    borderColor: 'hsl(244, 76%, 58%)',
                    backgroundColor: 'hsla(244, 76%, 58%, 0.2)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Completati',
                    data: sortedDates.map(date => data[date].completed),
                    borderColor: 'rgb(16, 185, 129)',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    tension: 0.3
                },
                 {
                    label: 'Annullati',
                    data: sortedDates.map(date => data[date].canceled),
                    borderColor: 'rgb(239, 68, 68)',
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    tension: 0.3
                }
            ]
        };
    }, [interventions]);
    
    const isDarkMode = document.documentElement.classList.contains('dark');
    const options: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: { color: isDarkMode ? '#D1D5DB' : '#374151' }
            },
            title: {
                display: false
            }
        },
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'day',
                    tooltipFormat: 'dd MMM yyyy',
                    displayFormats: { day: 'dd MMM' }
                },
                adapters: { date: { locale: it } },
                ticks: { color: isDarkMode ? '#9CA3AF' : '#6B7280' },
                grid: { color: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    color: isDarkMode ? '#9CA3AF' : '#6B7280',
                    stepSize: 1
                },
                grid: { color: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
            }
        }
    };

    return (
        <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-lg shadow-lg h-[400px]">
            <h3 className="font-semibold mb-4 text-gray-800 dark:text-white">Trend Interventi</h3>
            {interventions.length > 0 ? (
                <Line options={options} data={chartData} />
            ) : (
                <div className="flex items-center justify-center h-full text-gray-500">Nessun dato da mostrare.</div>
            )}
        </div>
    );
};
export default InterventionTrendChart;
