import * as React from 'react';
import { Intervention, InterventionStatus, PaymentStatus } from '../../types';

interface EconomicKpisProps {
    interventions: Intervention[];
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);

const KpiCard: React.FC<{ title: string, value: string | number, icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-lg shadow-md flex items-center gap-4 border border-border-light dark:border-border-dark">
        <div className="p-3 rounded-full bg-primary/10 text-primary">{icon}</div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
        </div>
    </div>
);

const EconomicKpis: React.FC<EconomicKpisProps> = ({ interventions }) => {
    const kpis = React.useMemo(() => {
        let totalRevenue = 0;
        let toBeInvoiced = 0;
        let completedCount = 0;
        let totalCostOfCompleted = 0;

        for (const iv of interventions) {
            const subtotal = iv.economicDetails.materialsCost + iv.economicDetails.laborCost + iv.economicDetails.extraCharges;
            const total = subtotal * (1 + iv.economicDetails.vatPercentage / 100);

            if (iv.economicDetails.status === PaymentStatus.PAID) {
                totalRevenue += total;
            }
            if (iv.status === InterventionStatus.COMPLETED && iv.economicDetails.status === PaymentStatus.TO_BE_INVOICED) {
                toBeInvoiced += total;
            }
            if (iv.status === InterventionStatus.COMPLETED) {
                completedCount++;
                totalCostOfCompleted += total;
            }
        }

        const averageCost = completedCount > 0 ? totalCostOfCompleted / completedCount : 0;

        return { totalRevenue, toBeInvoiced, completedCount, averageCost };
    }, [interventions]);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard 
                title="Fatturato Totale" 
                value={formatCurrency(kpis.totalRevenue)}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
            />
            <KpiCard 
                title="Da Fatturare" 
                value={formatCurrency(kpis.toBeInvoiced)}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
            />
            <KpiCard 
                title="Interventi Completati" 
                value={kpis.completedCount}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <KpiCard 
                title="Costo Medio Intervento" 
                value={formatCurrency(kpis.averageCost)}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>}
            />
        </div>
    );
};

export default EconomicKpis;