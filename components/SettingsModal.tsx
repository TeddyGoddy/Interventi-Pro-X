import * as React from 'react';
import { MapStyle, MapService, MapOverlay } from '../types';
import { FiX, FiSun, FiMoon, FiMap, FiGlobe, FiSettings, FiRefreshCw, FiLayers, FiFilter } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    theme: string;
    onThemeChange: () => void;
    mapStyle: MapStyle;
    onMapStyleChange: (style: MapStyle) => void;
    mapService: MapService;
    onMapServiceChange: (service: MapService) => void;
    mapOverlay?: MapOverlay;
    onMapOverlayChange?: (overlay: MapOverlay) => void;
    mapFilters?: {
        showTeams: boolean;
        showHighPriority: boolean;
        showCompleted: boolean;
    };
    onMapFiltersChange?: (filters: {
        showTeams: boolean;
        showHighPriority: boolean;
        showCompleted: boolean;
    }) => void;
    uiDensity?: 'compact' | 'normal' | 'spacious';
    onUiDensityChange?: (density: 'compact' | 'normal' | 'spacious') => void;
    fontFamily?: 'system' | 'styrene' | 'inter' | 'roboto' | 'opensans';
    onFontFamilyChange?: (font: 'system' | 'styrene' | 'inter' | 'roboto' | 'opensans') => void;
}

interface AppSettings {
    autoSave: boolean;
    notifications: boolean;
    uiDensity: 'compact' | 'normal' | 'spacious';
    fontFamily: 'system' | 'styrene' | 'inter' | 'roboto' | 'opensans';
    defaultPriority: 'low' | 'medium' | 'high' | 'urgent';
    language: 'it' | 'en';
    dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
    currency: 'EUR' | 'USD' | 'GBP';
    timeFormat: '24h' | '12h';
}

const defaultSettings: AppSettings = {
    autoSave: true,
    notifications: true,
    uiDensity: 'normal',
    fontFamily: 'system',
    defaultPriority: 'medium',
    language: 'it',
    dateFormat: 'DD/MM/YYYY',
    currency: 'EUR',
    timeFormat: '24h'
};

const mapStyleOptions: { value: MapStyle; label: string; description: string }[] = [
    { value: 'carto-positron', label: 'Chiara', description: 'Stile chiaro e pulito, ideale per la lettura' },
    { value: 'osm', label: 'Dettagli', description: 'Stile OpenStreetMap classico con colori vivaci' }
];

const mapOverlayOptions: { value: MapOverlay; label: string; description: string }[] = [
    { value: 'standard', label: 'Standard', description: 'Visualizzazione normale con marcatori individuali' },
    { value: 'cluster', label: 'Cluster', description: 'Raggruppa i marcatori vicini per una vista più pulita' },
    { value: 'heatmap', label: 'Heatmap', description: 'Mappa di calore che mostra la densità degli interventi' }
];

const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    theme,
    onThemeChange,
    mapStyle,
    onMapStyleChange,
    mapService,
    onMapServiceChange,
    mapOverlay = 'standard',
    onMapOverlayChange,
    mapFilters = { showTeams: true, showHighPriority: true, showCompleted: true },
    onMapFiltersChange,
    uiDensity = 'normal',
    onUiDensityChange,
    fontFamily = 'system',
    onFontFamilyChange
}) => {
    const [settings, setSettings] = React.useState<AppSettings>(() => {
        const saved = localStorage.getItem('app-settings');
        return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    });

    const [activeTab, setActiveTab] = React.useState<'appearance' | 'map' | 'general' | 'advanced'>('appearance');

    const handleSettingChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    // Auto-save delle impostazioni generali
    React.useEffect(() => {
        localStorage.setItem('app-settings', JSON.stringify(settings));
        // Apply font family to document
        applyFontFamily(settings.fontFamily);
    }, [settings]);

    // Function to apply font family to document
    const applyFontFamily = (fontFamily: string) => {
        const fontMap: Record<string, string> = {
            'system': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'styrene': '"Styrene B", system-ui, sans-serif',
            'inter': '"Inter", system-ui, sans-serif',
            'roboto': '"Roboto", system-ui, sans-serif',
            'opensans': '"Open Sans", system-ui, sans-serif'
        };
        
        document.documentElement.style.setProperty('--font-family', fontMap[fontFamily] || fontMap.system);
    };

    // Apply font on component mount
    React.useEffect(() => {
        applyFontFamily(settings.fontFamily);
    }, []);



    const handleReset = () => {
        setSettings(defaultSettings);
        localStorage.removeItem('app-settings');
        toast.success('Impostazioni ripristinate ai valori predefiniti', {
            icon: '🔄',
            duration: 3000
        });
    };

    if (!isOpen) return null;

    const TabButton: React.FC<{ tab: string; label: string; icon: React.ReactNode }> = ({ tab, label, icon }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`w-full flex items-center ui-density-gap-sm ui-density-spacing-sm ui-density-text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
        >
            {icon}
            {label}
        </button>
    );

    const SettingRow: React.FC<{ label: string; description: string; children: React.ReactNode }> = ({ label, description, children }) => (
        <div className="flex items-center justify-between ui-density-spacing-md border border-border-light dark:border-border-dark rounded-lg">
            <div>
                <h4 className="ui-density-text-base font-medium text-gray-900 dark:text-gray-100">{label}</h4>
                <p className="ui-density-text-xs text-gray-500 dark:text-gray-400">{description}</p>
            </div>
            <div className="flex-shrink-0">
                {children}
            </div>
        </div>
    );

    const Toggle: React.FC<{ checked: boolean; onChange: (checked: boolean) => void }> = ({ checked, onChange }) => (
        <button
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                checked ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
            }`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    checked ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
        </button>
    );

    const Select: React.FC<{ value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }> = ({ value, onChange, options }) => (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="px-3 py-1.5 text-sm border border-border-light dark:border-border-dark rounded-md bg-surface-light dark:bg-surface-dark text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
        >
            {options.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
            ))}
        </select>
    );

    const DensitySlider: React.FC<{ 
        value: 'compact' | 'normal' | 'spacious'; 
        onChange: (value: 'compact' | 'normal' | 'spacious') => void 
    }> = ({ value, onChange }) => {
        const densityValues = ['compact', 'normal', 'spacious'] as const;
        const currentIndex = densityValues.indexOf(value);
        
        const handleSliderChange = (index: number) => {
            onChange(densityValues[index]);
        };

        return (
            <div className="w-full max-w-sm mx-auto">
                <div className="relative">
                    {/* Track */}
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full relative">
                        {/* Active track */}
                        <div 
                            className="h-2 bg-primary rounded-full transition-all duration-200"
                            style={{ width: `${(currentIndex / (densityValues.length - 1)) * 100}%` }}
                        />
                        
                        {/* Tick marks */}
                        {densityValues.map((_, index) => (
                            <div
                                key={index}
                                className="absolute top-1/2 transform -translate-y-1/2 w-0.5 h-4 bg-gray-400 dark:bg-gray-500"
                                style={{ left: `${(index / (densityValues.length - 1)) * 100}%` }}
                            />
                        ))}
                        
                        {/* Slider thumb */}
                        <div
                            className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-primary rounded-full border-2 border-white dark:border-gray-800 shadow-lg cursor-pointer transition-all duration-200 hover:scale-110"
                            style={{ left: `${(currentIndex / (densityValues.length - 1)) * 100}%` }}
                        />
                        
                        {/* Clickable areas */}
                        {densityValues.map((_, index) => (
                            <button
                                key={index}
                                className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                style={{ left: `${(index / (densityValues.length - 1)) * 100}%` }}
                                onClick={() => handleSliderChange(index)}
                            />
                        ))}
                    </div>
                    
                    {/* Labels */}
                    <div className="flex justify-between mt-3 px-1">
                        <div className="flex flex-col items-center">
                            <span className="text-lg font-bold text-gray-700 dark:text-gray-300">A</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Compatta</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-base font-medium text-gray-600 dark:text-gray-400">A</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Normale</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-xl font-bold text-gray-800 dark:text-gray-200">A</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Spaziosa</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between ui-density-spacing-lg border-b border-border-light dark:border-border-dark flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <FiSettings className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="ui-density-text-lg font-bold text-gray-900 dark:text-gray-100">Impostazioni</h2>
                            <p className="ui-density-text-sm text-gray-500 dark:text-gray-400">Personalizza l'applicazione secondo le tue preferenze</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <FiX className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex flex-1 min-h-0">
                    {/* Sidebar */}
                    <div className="w-64 ui-density-spacing-md border-r border-border-light dark:border-border-dark bg-gray-50/50 dark:bg-gray-800/50 flex-shrink-0">
                        <nav className="space-y-2">
                            <TabButton tab="appearance" label="Aspetto" icon={<FiSun className="h-4 w-4" />} />
                            <TabButton tab="map" label="Mappa" icon={<FiMap className="h-4 w-4" />} />
                            <TabButton tab="general" label="Generale" icon={<FiGlobe className="h-4 w-4" />} />
                            <TabButton tab="advanced" label="Avanzate" icon={<FiSettings className="h-4 w-4" />} />
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="flex-1 ui-density-spacing-lg overflow-y-auto min-h-0">
                        {activeTab === 'appearance' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="ui-density-text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Tema e Aspetto</h3>
                                    <div className="ui-density-gap-md space-y-4">
                                        <SettingRow
                                            label="Tema"
                                            description="Scegli tra tema chiaro e scuro"
                                        >
                                            <button
                                                onClick={onThemeChange}
                                                className="flex items-center ui-density-gap-sm ui-density-spacing-sm ui-density-text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors ui-density-button"
                                            >
                                                {theme === 'dark' ? (
                                                    <><FiMoon className="h-4 w-4" /> Scuro</>
                                                ) : (
                                                    <><FiSun className="h-4 w-4" /> Chiaro</>
                                                )}
                                            </button>
                                        </SettingRow>

                                        <div>
                                            <label className="ui-density-text-sm font-medium text-gray-900 dark:text-gray-100 mb-4 block">
                                                Densità interfaccia
                                            </label>
                                            <div className="ui-density-spacing-md">
                                                <DensitySlider
                                                    value={onUiDensityChange ? uiDensity : settings.uiDensity}
                                                    onChange={(density) => {
                                                        if (onUiDensityChange) {
                                                            onUiDensityChange(density);
                                                        } else {
                                                            handleSettingChange('uiDensity', density);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="ui-density-text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 block">
                                                Famiglia di caratteri
                                            </label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { value: 'system', label: 'Sistema', preview: 'Aa' },
                                                    { value: 'styrene', label: 'Styrene B', preview: 'Aa' },
                                                    { value: 'inter', label: 'Inter', preview: 'Aa' },
                                                    { value: 'roboto', label: 'Roboto', preview: 'Aa' },
                                                    { value: 'opensans', label: 'Open Sans', preview: 'Aa' }
                                                ].map((font) => (
                                                    <button
                                                        key={font.value}
                                                        onClick={() => {
                                                            if (onFontFamilyChange) {
                                                                onFontFamilyChange(font.value as any);
                                                            } else {
                                                                handleSettingChange('fontFamily', font.value as any);
                                                            }
                                                        }}
                                                        className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                                                            (onFontFamilyChange ? fontFamily : settings.fontFamily) === font.value
                                                                ? 'border-primary bg-primary/5 shadow-sm'
                                                                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                                                        }`}
                                                    >
                                                        <div className="flex flex-col items-center gap-2">
                                                            <span 
                                                                className="text-2xl font-medium text-gray-700 dark:text-gray-300"
                                                                style={{ 
                                                                    fontFamily: font.value === 'system' ? 'system-ui' : 
                                                                               font.value === 'styrene' ? 'Styrene B, sans-serif' : 
                                                                               font.value === 'inter' ? 'Inter, sans-serif' : 
                                                                               font.value === 'roboto' ? 'Roboto, sans-serif' : 
                                                                               'Open Sans, sans-serif' 
                                                                }}
                                                            >
                                                                {font.preview}
                                                            </span>
                                                            <div className="text-center">
                                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{font.label}</p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">Font famiglia</p>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'map' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="ui-density-text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Configurazione Mappa</h3>
                                    <div className="space-y-4">
                                        <SettingRow
                                            label="Servizio Mappa"
                                            description="Scegli il provider per le mappe"
                                        >
                                            <Select
                                                value={mapService}
                                                onChange={(value) => onMapServiceChange(value as MapService)}
                                                options={[
                                                    { value: 'leaflet', label: 'Leaflet (OpenStreetMap)' },
                                                    { value: 'none', label: 'Nessuna Mappa' }
                                                ]}
                                            />
                                        </SettingRow>

                                        <div>
                                            <label className="ui-density-text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 block">
                                                Stile Mappa
                                            </label>
                                            <div className="grid grid-cols-1 gap-3">
                                                {mapStyleOptions.map((option) => (
                                                    <label
                                                        key={option.value}
                                                        className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                                                            mapStyle === option.value
                                                                ? 'border-primary bg-primary/5'
                                                                : 'border-border-light dark:border-border-dark hover:border-primary/50'
                                                        }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="mapStyle"
                                                            value={option.value}
                                                            checked={mapStyle === option.value}
                                                            onChange={() => onMapStyleChange(option.value)}
                                                            className="mt-1"
                                                        />
                                                        <div>
                                                            <div className="font-medium text-gray-900 dark:text-gray-100">
                                                                {option.label}
                                                            </div>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                {option.description}
                                                            </div>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {onMapOverlayChange && (
                                            <div>
                                                <label className="ui-density-text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 block">
                                                    <FiLayers className="inline h-4 w-4 mr-2" />
                                                    Tipo di Visualizzazione
                                                </label>
                                                <div className="grid grid-cols-1 gap-3">
                                                    {mapOverlayOptions.map((option) => (
                                                        <label
                                                            key={option.value}
                                                            className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                                                                mapOverlay === option.value
                                                                    ? 'border-primary bg-primary/5'
                                                                    : 'border-border-light dark:border-border-dark hover:border-primary/50'
                                                            }`}
                                                        >
                                                            <input
                                                                type="radio"
                                                                name="mapOverlay"
                                                                value={option.value}
                                                                checked={mapOverlay === option.value}
                                                                onChange={() => onMapOverlayChange(option.value)}
                                                                className="mt-1"
                                                            />
                                                            <div>
                                                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                                                    {option.label}
                                                                </div>
                                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                    {option.description}
                                                                </div>
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {onMapFiltersChange && (
                                            <div>
                                                <h4 className="ui-density-text-md font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                                                    <FiFilter className="h-4 w-4 mr-2" />
                                                    Filtri Mappa
                                                </h4>
                                                <div className="space-y-3">
                                                    <SettingRow
                                                        label="Mostra Squadre"
                                                        description="Visualizza i marcatori delle squadre sulla mappa"
                                                    >
                                                        <Toggle
                                                            checked={mapFilters.showTeams}
                                                            onChange={(checked) => onMapFiltersChange({ ...mapFilters, showTeams: checked })}
                                                        />
                                                    </SettingRow>

                                                    <SettingRow
                                                        label="Evidenzia Priorità Alta"
                                                        description="Evidenzia gli interventi ad alta priorità"
                                                    >
                                                        <Toggle
                                                            checked={mapFilters.showHighPriority}
                                                            onChange={(checked) => onMapFiltersChange({ ...mapFilters, showHighPriority: checked })}
                                                        />
                                                    </SettingRow>

                                                    <SettingRow
                                                        label="Mostra Completati"
                                                        description="Visualizza anche gli interventi completati"
                                                    >
                                                        <Toggle
                                                            checked={mapFilters.showCompleted}
                                                            onChange={(checked) => onMapFiltersChange({ ...mapFilters, showCompleted: checked })}
                                                        />
                                                    </SettingRow>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="ui-density-text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Impostazioni Generali</h3>
                                    <div className="space-y-4">
                                        <SettingRow
                                            label="Salvataggio automatico"
                                            description="Salva automaticamente le modifiche"
                                        >
                                            <Toggle
                                                checked={settings.autoSave}
                                                onChange={(checked) => handleSettingChange('autoSave', checked)}
                                            />
                                        </SettingRow>

                                        <SettingRow
                                            label="Notifiche"
                                            description="Ricevi notifiche per eventi importanti"
                                        >
                                            <Toggle
                                                checked={settings.notifications}
                                                onChange={(checked) => handleSettingChange('notifications', checked)}
                                            />
                                        </SettingRow>

                                        <SettingRow
                                            label="Priorità predefinita"
                                            description="Priorità assegnata ai nuovi interventi"
                                        >
                                            <Select
                                                value={settings.defaultPriority}
                                                onChange={(value) => handleSettingChange('defaultPriority', value as any)}
                                                options={[
                                                    { value: 'low', label: 'Bassa' },
                                                    { value: 'medium', label: 'Media' },
                                                    { value: 'high', label: 'Alta' },
                                                    { value: 'urgent', label: 'Urgente' }
                                                ]}
                                            />
                                        </SettingRow>

                                        <SettingRow
                                            label="Formato data"
                                            description="Come visualizzare le date nell'applicazione"
                                        >
                                            <Select
                                                value={settings.dateFormat}
                                                onChange={(value) => handleSettingChange('dateFormat', value as any)}
                                                options={[
                                                    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (Italiano)' },
                                                    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (Americano)' },
                                                    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' }
                                                ]}
                                            />
                                        </SettingRow>

                                        <SettingRow
                                            label="Valuta"
                                            description="Valuta utilizzata per i calcoli economici"
                                        >
                                            <Select
                                                value={settings.currency}
                                                onChange={(value) => handleSettingChange('currency', value as any)}
                                                options={[
                                                    { value: 'EUR', label: 'Euro (€)' },
                                                    { value: 'USD', label: 'Dollaro ($)' },
                                                    { value: 'GBP', label: 'Sterlina (£)' }
                                                ]}
                                            />
                                        </SettingRow>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'advanced' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="ui-density-text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Impostazioni Avanzate</h3>
                                    <div className="space-y-4">
                                        <SettingRow
                                            label="Formato orario"
                                            description="Formato per la visualizzazione dell'orario"
                                        >
                                            <Select
                                                value={settings.timeFormat}
                                                onChange={(value) => handleSettingChange('timeFormat', value as any)}
                                                options={[
                                                    { value: '24h', label: '24 ore (14:30)' },
                                                    { value: '12h', label: '12 ore (2:30 PM)' }
                                                ]}
                                            />
                                        </SettingRow>

                                        <div className="pt-4 border-t border-border-light dark:border-border-dark">
                                            <h4 className="ui-density-text-md font-medium text-gray-900 dark:text-gray-100 mb-3">Gestione Dati</h4>
                                            <div className="space-y-3">
                                                <button
                                                    onClick={() => {
                                                        // Implementare export dati
                                                        toast.success('Funzionalità in arrivo!', { icon: '🚀' });
                                                    }}
                                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                                >
                                                    <FiRefreshCw className="h-4 w-4" />
                                                    Esporta Dati
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        // Implementare import dati
                                                        toast.success('Funzionalità in arrivo!', { icon: '🚀' });
                                                    }}
                                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                                >
                                                    <FiRefreshCw className="h-4 w-4" />
                                                    Importa Dati
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between ui-density-spacing-lg border-t border-border-light dark:border-border-dark bg-gray-50/50 dark:bg-gray-800/50 flex-shrink-0">
                    <button
                        onClick={handleReset}
                        className="flex items-center ui-density-gap-sm ui-density-spacing-sm ui-density-text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ui-density-button"
                    >
                        <FiRefreshCw className="h-4 w-4" />
                        Ripristina Default
                    </button>
                    <button
                        onClick={onClose}
                        className="flex items-center ui-density-gap-sm ui-density-spacing-sm ui-density-text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors ui-density-button"
                    >
                        <FiX className="h-4 w-4" />
                        Chiudi
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
