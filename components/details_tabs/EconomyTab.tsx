import * as React from 'react';
import { Intervention, PaymentStatus, EconomicDetails } from '../../types';

interface EconomyTabProps {
    intervention: Intervention;
    onUpdateEconomicDetails: (id: number, economicDetails: EconomicDetails) => void;
    onUpdatePaymentStatus: (id: number, status: PaymentStatus) => void;
}

const paymentStatusColors: Record<PaymentStatus, string> = {
    [PaymentStatus.TO_BE_INVOICED]: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    [PaymentStatus.ISSUED]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    [PaymentStatus.PAID]: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    [PaymentStatus.OVERDUE]: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
};

const EconomyTab: React.FC<EconomyTabProps> = ({ intervention, onUpdateEconomicDetails, onUpdatePaymentStatus }) => {
    
    const [isEditing, setIsEditing] = React.useState(false);
    const [costs, setCosts] = React.useState({
        materialsCost: intervention.economicDetails.materialsCost,
        laborCost: intervention.economicDetails.laborCost,
        extraCharges: intervention.economicDetails.extraCharges,
    });

    React.useEffect(() => {
        setCosts({
            materialsCost: intervention.economicDetails.materialsCost,
            laborCost: intervention.economicDetails.laborCost,
            extraCharges: intervention.economicDetails.extraCharges,
        });
        setIsEditing(false);
    }, [intervention]);

    const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCosts(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    };

    const handleSaveCosts = () => {
        const updatedEconomicDetails: EconomicDetails = {
            ...intervention.economicDetails,
            materialsCost: costs.materialsCost,
            laborCost: costs.laborCost,
            extraCharges: costs.extraCharges,
        };
        onUpdateEconomicDetails(intervention.id, updatedEconomicDetails);
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setCosts({
            materialsCost: intervention.economicDetails.materialsCost,
            laborCost: intervention.economicDetails.laborCost,
            extraCharges: intervention.economicDetails.extraCharges,
        });
        setIsEditing(false);
    };

    const economicDetailsToUse = isEditing ? { ...intervention.economicDetails, ...costs } : intervention.economicDetails;
    const subtotal = economicDetailsToUse.materialsCost + economicDetailsToUse.laborCost + economicDetailsToUse.extraCharges;
    const vatAmount = subtotal * (economicDetailsToUse.vatPercentage / 100);
    const total = subtotal + vatAmount;

    return (
        <div className="space-y-6 animate-scale-in">
            <div>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Dettagli Economici</h3>
                    {!isEditing && <button onClick={() => setIsEditing(true)} className="text-sm text-primary hover:underline">Modifica Costi</button>}
                </div>
                <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg space-y-3">
                    {isEditing ? (
                        <>
                            <div className="flex justify-between items-center text-sm"><label htmlFor="materialsCost" className="text-gray-600 dark:text-gray-400">Costo Materiali</label><input type="number" name="materialsCost" id="materialsCost" value={costs.materialsCost} onChange={handleCostChange} className="w-24 p-1 border rounded-md bg-white dark:bg-gray-800 dark:border-border-dark text-right" /></div>
                            <div className="flex justify-between items-center text-sm"><label htmlFor="laborCost" className="text-gray-600 dark:text-gray-400">Costo Manodopera</label><input type="number" name="laborCost" id="laborCost" value={costs.laborCost} onChange={handleCostChange} className="w-24 p-1 border rounded-md bg-white dark:bg-gray-800 dark:border-border-dark text-right" /></div>
                            <div className="flex justify-between items-center text-sm"><label htmlFor="extraCharges" className="text-gray-600 dark:text-gray-400">Spese Extra</label><input type="number" name="extraCharges" id="extraCharges" value={costs.extraCharges} onChange={handleCostChange} className="w-24 p-1 border rounded-md bg-white dark:bg-gray-800 dark:border-border-dark text-right" /></div>
                        </>
                    ) : (
                         <>
                            <div className="flex justify-between items-center text-sm"><span className="text-gray-600 dark:text-gray-400">Costo Materiali</span><span className="font-medium text-gray-800 dark:text-gray-200">{formatCurrency(economicDetailsToUse.materialsCost)}</span></div>
                            <div className="flex justify-between items-center text-sm"><span className="text-gray-600 dark:text-gray-400">Costo Manodopera</span><span className="font-medium text-gray-800 dark:text-gray-200">{formatCurrency(economicDetailsToUse.laborCost)}</span></div>
                            <div className="flex justify-between items-center text-sm"><span className="text-gray-600 dark:text-gray-400">Spese Extra</span><span className="font-medium text-gray-800 dark:text-gray-200">{formatCurrency(economicDetailsToUse.extraCharges)}</span></div>
                         </>
                    )}
                    <hr className="border-border-light dark:border-border-dark my-2"/>
                    <div className="flex justify-between items-center"><span className="text-gray-600 dark:text-gray-400">Subtotale</span><span className="font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(subtotal)}</span></div>
                    <div className="flex justify-between items-center"><span className="text-gray-600 dark:text-gray-400">IVA ({economicDetailsToUse.vatPercentage}%)</span><span className="font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(vatAmount)}</span></div>
                     <hr className="border-border-light dark:border-border-dark my-2"/>
                    <div className="flex justify-between items-center text-xl"><span className="font-bold text-gray-800 dark:text-white">Totale</span><span className="font-bold text-primary">{formatCurrency(total)}</span></div>
                     {isEditing && <div className="flex justify-end gap-2 pt-2"><button onClick={handleCancelEdit} className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">Annulla</button><button onClick={handleSaveCosts} className="px-3 py-1 text-sm text-white bg-primary rounded-md hover:bg-primary-dark">Salva Costi</button></div>}
                </div>
            </div>

            <div>
                <h3 className="font-semibold text-lg mb-3 text-gray-800 dark:text-gray-200">Stato Pagamento</h3>
                <div className="flex items-center gap-4">
                    <select id="payment-status-update" value={intervention.economicDetails.status} onChange={e => onUpdatePaymentStatus(intervention.id, e.target.value as PaymentStatus)} className="p-2 border rounded-lg bg-background-light dark:bg-gray-700 dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-ring flex-grow">
                        {Object.values(PaymentStatus).map(s => (<option key={s} value={s}>{s}</option>))}
                    </select>
                    <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${paymentStatusColors[intervention.economicDetails.status]}`}>{intervention.economicDetails.status}</span>
                </div>
            </div>
        </div>
    );
};

export default EconomyTab;