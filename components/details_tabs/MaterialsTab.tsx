import * as React from 'react';
import { Intervention, Asset, UsedMaterial } from '../../types';

interface MaterialsTabProps {
    intervention: Intervention;
    asset: Asset | undefined;
    onAddMaterial: (id: number, material: UsedMaterial) => void;
    onRemoveMaterial: (id: number, materialId: string) => void;
    onUpdateAsset?: (interventionId: number, asset: Asset) => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
};

const MaterialsTab: React.FC<MaterialsTabProps> = ({ intervention, asset, onAddMaterial, onRemoveMaterial, onUpdateAsset }) => {
    const { materials } = intervention;
    const [isAdding, setIsAdding] = React.useState(false);
    const [newMaterial, setNewMaterial] = React.useState({ name: '', sku: '', quantity: 1, price: 0, unit: 'pz' });
    const [isEditingAsset, setIsEditingAsset] = React.useState(false);
    const [editedAsset, setEditedAsset] = React.useState<Asset | null>(asset || null);

    const handleAddMaterial = () => {
        if (!newMaterial.name || newMaterial.quantity <= 0) return;
        const materialToAdd: UsedMaterial = {
            id: Math.random().toString(36).substr(2, 9),
            ...newMaterial
        };
        onAddMaterial(intervention.id, materialToAdd);
        setNewMaterial({ name: '', sku: '', quantity: 1, price: 0, unit: 'pz' });
        setIsAdding(false);
    };

    const handleSaveAsset = () => {
        if (!editedAsset || !onUpdateAsset) return;
        if (!editedAsset.name.trim()) {
            alert('Il nome dell\'asset è obbligatorio');
            return;
        }
        
        const assetToSave: Asset = {
            id: editedAsset.id || Math.floor(Math.random() * 10000),
            name: editedAsset.name.trim(),
            brand: editedAsset.brand.trim(),
            model: editedAsset.model.trim(),
            serialNumber: editedAsset.serialNumber.trim(),
            clientId: intervention.client.id
        };
        
        onUpdateAsset(intervention.id, assetToSave);
        setIsEditingAsset(false);
    };

    const handleCancelAssetEdit = () => {
        setEditedAsset(asset || null);
        setIsEditingAsset(false);
    };

    const handleStartAssetEdit = () => {
        if (!editedAsset) {
            setEditedAsset({
                id: 0,
                name: '',
                brand: '',
                model: '',
                serialNumber: '',
                clientId: intervention.client.id
            });
        }
        setIsEditingAsset(true);
    };

    return (
        <div className="space-y-6 animate-scale-in">
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Asset del Cliente</h3>
                    {!isEditingAsset && (
                        <button
                            onClick={handleStartAssetEdit}
                            className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200 flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            {asset ? 'Modifica' : 'Aggiungi Asset'}
                        </button>
                    )}
                </div>
                
                {isEditingAsset ? (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Nome Asset *
                                </label>
                                <input
                                    type="text"
                                    value={editedAsset?.name || ''}
                                    onChange={(e) => setEditedAsset(prev => prev ? {...prev, name: e.target.value} : null)}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Es. Climatizzatore Ufficio A"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Marca
                                </label>
                                <input
                                    type="text"
                                    value={editedAsset?.brand || ''}
                                    onChange={(e) => setEditedAsset(prev => prev ? {...prev, brand: e.target.value} : null)}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Es. Daikin"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Modello
                                </label>
                                <input
                                    type="text"
                                    value={editedAsset?.model || ''}
                                    onChange={(e) => setEditedAsset(prev => prev ? {...prev, model: e.target.value} : null)}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Es. FTXM35R"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Numero Seriale
                                </label>
                                <input
                                    type="text"
                                    value={editedAsset?.serialNumber || ''}
                                    onChange={(e) => setEditedAsset(prev => prev ? {...prev, serialNumber: e.target.value} : null)}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Es. SN-DA-39765"
                                />
                            </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={handleCancelAssetEdit}
                                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                            >
                                Annulla
                            </button>
                            <button
                                onClick={handleSaveAsset}
                                className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200 flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Salva Asset
                            </button>
                        </div>
                    </div>
                ) : asset ? (
                    <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg text-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <p><strong>Nome:</strong> {asset.name}</p>
                            <p><strong>Marca:</strong> {asset.brand}</p>
                            <p><strong>Modello:</strong> {asset.model}</p>
                            <p><strong>Seriale:</strong> {asset.serialNumber}</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 text-center">
                        <div className="flex items-center justify-center mb-2">
                            <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-1">Nessun asset associato</p>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400">Clicca "Aggiungi Asset" per associare un dispositivo a questo intervento</p>
                    </div>
                )}
            </div>

            <div>
                <h3 className="font-semibold text-lg mb-3 text-gray-800 dark:text-gray-200">Materiali Utilizzati</h3>
                <div className="overflow-x-auto border border-border-light dark:border-border-dark rounded-lg">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-300 uppercase text-xs">
                            <tr>
                                <th className="p-3 font-semibold text-left">Nome</th>
                                <th className="p-3 font-semibold text-center">Qtà</th>
                                <th className="p-3 font-semibold text-right">Prezzo</th>
                                <th className="p-3 font-semibold text-right">Subtotale</th>
                                <th className="w-10 p-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-light dark:divide-border-dark">
                            {materials.map(material => (
                                <tr key={material.id}>
                                    <td className="p-3"><div>{material.name}</div><div className="text-xs text-gray-400">{material.sku}</div></td>
                                    <td className="p-3 text-center">{material.quantity}</td>
                                    <td className="p-3 text-right">{formatCurrency(material.price)}</td>
                                    <td className="p-3 text-right font-medium">{formatCurrency(material.price * material.quantity)}</td>
                                    <td className="p-3 text-center">
                                        <button onClick={() => onRemoveMaterial(intervention.id, material.id)} className="text-gray-400 hover:text-red-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                             {isAdding && (
                                <tr>
                                    <td className="p-2"><input type="text" placeholder="Nome" value={newMaterial.name} onChange={e => setNewMaterial({...newMaterial, name: e.target.value})} className="w-full p-1 border rounded bg-white dark:bg-gray-800" /></td>
                                    <td className="p-2 text-center"><input type="number" min="1" value={newMaterial.quantity} onChange={e => setNewMaterial({...newMaterial, quantity: parseInt(e.target.value) || 1})} className="w-16 p-1 border rounded bg-white dark:bg-gray-800 text-center" /></td>
                                    <td className="p-2 text-right"><input type="number" step="0.01" value={newMaterial.price} onChange={e => setNewMaterial({...newMaterial, price: parseFloat(e.target.value) || 0})} className="w-20 p-1 border rounded bg-white dark:bg-gray-800 text-right" /></td>
                                    <td className="p-2 text-right font-medium">{formatCurrency(newMaterial.price * newMaterial.quantity)}</td>
                                    <td className="p-2 text-center">
                                        <button onClick={handleAddMaterial} className="text-green-500 p-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></button>
                                        <button onClick={() => setIsAdding(false)} className="text-red-500 p-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg></button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                 {!isAdding && (
                    <div className="mt-4">
                        <button onClick={() => setIsAdding(true)} className="text-sm font-semibold text-primary hover:underline">+ Aggiungi materiale</button>
                    </div>
                 )}
            </div>
        </div>
    );
};

export default MaterialsTab;