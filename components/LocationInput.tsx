import * as React from 'react';
import { AddressSuggestion, Coordinates, MapService, MapStyle, PrecisionLevel, GeolocationProvider } from '../types';
import { searchAddress, getAddressFromCoordinates, clearAllGeocodingCache } from '../services/geolocationService';
import { toast } from 'react-hot-toast';
import DraggablePinMap from './maps/DraggablePinMap';
import { FiMapPin, FiRefreshCw, FiTrash2, FiSearch } from 'react-icons/fi';


interface LocationInputProps {
    initialValue: AddressSuggestion | null;
    onAddressVerified: (address: AddressSuggestion | null) => void;
    mapService: MapService;
    theme: string;
    mapStyle: MapStyle;
    resetTrigger?: number; // Timestamp per forzare reset
}

const precisionStyles: Record<PrecisionLevel, { text: string; classes: string }> = {
    Rooftop: { text: 'Tetto', classes: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' },
    StreetAddress: { text: 'Indirizzo', classes: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' },
    Street: { text: 'Strada', classes: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' },
    City: { text: 'Città', classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' },
    Unknown: { text: 'Bassa', classes: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
};

const providerStyles: Record<GeolocationProvider, { text: string; classes: string }> = {
    'google-maps-scraper': { text: 'Google Maps', classes: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' },
    'opencage': { text: 'OpenCage', classes: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' },
    'overpass': { text: 'Overpass', classes: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300' },
    'photon': { text: 'Photon', classes: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300' },
    'nominatim': { text: 'Nominatim', classes: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
};

const LocationInput: React.FC<LocationInputProps> = ({ initialValue, onAddressVerified, mapService, theme, mapStyle, resetTrigger }) => {
        const [inputValue, setInputValue] = React.useState(initialValue?.displayName || '');
    const [suggestions, setSuggestions] = React.useState<AddressSuggestion[]>([]);
    const [isSuggestionBoxOpen, setIsSuggestionBoxOpen] = React.useState(false);
    
    const [isLoading, setIsLoading] = React.useState(false);
    const [isReverseGeocoding, setIsReverseGeocoding] = React.useState(false);
    const [isGoogleMapsSearching, setIsGoogleMapsSearching] = React.useState(false);

    const [verifiedAddress, setVerifiedAddress] = React.useState<AddressSuggestion | null>(null);
    const [isMapVisible, setIsMapVisible] = React.useState(false);
    const [activeIndex, setActiveIndex] = React.useState(-1);


    const containerRef = React.useRef<HTMLDivElement>(null);
    const latestRequestRef = React.useRef(0);
    const isGeocodingServiceReady = mapService === 'leaflet';

    React.useEffect(() => {
        if (initialValue) {
            setInputValue(initialValue.displayName);
            setVerifiedAddress(initialValue);
            setIsMapVisible(true);
            onAddressVerified(initialValue);
        } else {
            // Solo resetta se non abbiamo già un indirizzo verificato
            // Questo previene il reset dopo aver selezionato un suggerimento
            setInputValue('');
            // NON resettare verifiedAddress se è già stato impostato
            // setVerifiedAddress(null);
            // setIsMapVisible(false);
            // onAddressVerified(null);
        }
    }, [initialValue]);

    // Effect per gestire il reset manuale
    React.useEffect(() => {
        if (resetTrigger) {
            console.log('🔄 [LOCATIONINPUT] Reset manuale triggered:', resetTrigger);
            setInputValue('');
            setVerifiedAddress(null);
            setIsMapVisible(false);
            setSuggestions([]);
            setIsSuggestionBoxOpen(false);
            onAddressVerified(null);
        }
    }, [resetTrigger, onAddressVerified]);

    const fetchSuggestions = React.useCallback(async (query: string, forceRefresh = false) => {
        console.log(`[LOCATIONINPUT] 🚨 FETCHSUGGESTIONS CHIAMATA! Query: "${query}"`);
        
        if (forceRefresh) {
            console.log(`[GEOLOCATION] 🔄 Refresh forzato per: "${query}"`);
        }

        latestRequestRef.current += 1;
        const currentRequest = latestRequestRef.current;
        
        setIsLoading(true);
        setIsGoogleMapsSearching(true);
        setActiveIndex(-1);
        setSuggestions([]); // Pulisci i suggerimenti precedenti

        try {
            // 🚀 SISTEMA CON INDICATORE GOOGLE MAPS
            console.log(`[LOCATIONINPUT] 🚀 Avvio ricerca con indicatore Google Maps...`);
            const results = await searchAddress(query, forceRefresh);
            
            if (latestRequestRef.current === currentRequest) {
                console.log(`[LOCATIONINPUT] ✅ Risultati ricevuti: ${results.length}`);
                setSuggestions(results);
                
                // Controlla se Google Maps ha fornito risultati
                const googleMapsResults = results.filter(r => r.provider === 'google-maps-scraper');
                if (googleMapsResults.length > 0) {
                    toast.success(`🎯 Posizione precisa trovata con Google Maps!`, {
                        duration: 3000,
                        icon: '🗺️'
                    });
                    setIsGoogleMapsSearching(false);
                } else {
                    // Se non ci sono risultati Google Maps, mantieni l'indicatore per un po'
                    setTimeout(() => {
                        if (latestRequestRef.current === currentRequest) {
                            setIsGoogleMapsSearching(false);
                        }
                    }, 2000); // Mantieni l'indicatore per 2 secondi extra
                }
            }
        } catch (error) {
            if (latestRequestRef.current === currentRequest) {
                console.error('[LOCATIONINPUT] Errore ricerca:', error);
                toast.error("Errore durante la ricerca dell'indirizzo.");
                setSuggestions([]);
                setIsGoogleMapsSearching(false);
            }
        } finally {
            if (latestRequestRef.current === currentRequest) {
                setIsLoading(false);
            }
        }
    }, []);

    

    

    const debounceTimeoutRef = React.useRef<number | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        setIsSuggestionBoxOpen(true);

        // Resetta lo stato quando l'utente modifica l'input
        if (verifiedAddress) {
            setVerifiedAddress(null);
            setIsMapVisible(false);
            onAddressVerified(null);
        }
        
        // Reset dello stato Google Maps
        setIsGoogleMapsSearching(false);

        // Cancella il timeout precedente se esiste
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        // Se il valore è vuoto, nascondi i suggerimenti
        if (!value.trim()) {
            setSuggestions([]);
            setIsSuggestionBoxOpen(false);
            setIsLoading(false);
            setIsGoogleMapsSearching(false);
            return;
        }

        // 🚀 OTTIMIZZAZIONE: Evita ricerche per query troppo corte o generiche
        const trimmedValue = value.trim().toLowerCase();
        if (trimmedValue.length < 5 || 
            trimmedValue === 'via' || 
            trimmedValue === 'via ' ||
            trimmedValue === 'corso' ||
            trimmedValue === 'piazza' ||
            trimmedValue === 'viale') {
            console.log(`[GEOLOCATION] ⚠️ Query troppo corta/generica, skip: "${value}"`);
            setSuggestions([]);
            setIsSuggestionBoxOpen(false);
            setIsLoading(false);
            setIsGoogleMapsSearching(false);
            return;
        }

        // Se l'input è troppo corto, non fare nulla
        if (value.trim().length < 3) {
            return;
        }

        // Imposta il nuovo timeout per il debounce di 300ms (più veloce)
        setIsLoading(true);
        debounceTimeoutRef.current = window.setTimeout(() => {
            console.log(`[GEOLOCATION] 🕐 Debounce completato, avvio ricerca per: "${value}"`);
            fetchSuggestions(value, false);
        }, 300);
    };

    const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
        setInputValue(suggestion.displayName);
        setSuggestions([]);
        setIsSuggestionBoxOpen(false);
        setIsGoogleMapsSearching(false);
        setVerifiedAddress(suggestion);
        setIsMapVisible(true);
        onAddressVerified(suggestion);
    };

    const handlePositionChange = async (newCoords: Coordinates) => {
        setIsReverseGeocoding(true);
        const newAddressSuggestion = await getAddressFromCoordinates(newCoords);
        setInputValue(newAddressSuggestion.displayName);
        setVerifiedAddress(newAddressSuggestion);
        onAddressVerified(newAddressSuggestion);
        setIsReverseGeocoding(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isSuggestionBoxOpen) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0 && suggestions[activeIndex]) {
                handleSelectSuggestion(suggestions[activeIndex]);
            }
        } else if (e.key === 'Escape') {
            setIsSuggestionBoxOpen(false);
        }
    };

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsSuggestionBoxOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            // Pulisci il timeout quando il componente si smonta
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, []);

    const handleClearCache = () => {
        clearAllGeocodingCache();
        toast.success('Cache di geocodifica pulita!');
        setSuggestions([]);
    };

    const getPlaceholderText = () => {
        if (!isGeocodingServiceReady) return "Servizio di ricerca non disponibile.";
        return "Inizia a digitare l'indirizzo...";
    };

    const precisionInfo = verifiedAddress ? (precisionStyles[verifiedAddress.precision] || precisionStyles.Unknown) : null;

    return (
        <div ref={containerRef} className="relative">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Indirizzo Intervento*</label>
            <div className="relative">
                <input
                    type="text" id="address" value={inputValue} onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    className="w-full p-2 border rounded-lg bg-background-light dark:bg-gray-700 dark:border-border-dark pr-32"
                    required autoComplete="off" placeholder={getPlaceholderText()}
                    disabled={!isGeocodingServiceReady}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {(isLoading || isReverseGeocoding) && <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                    {verifiedAddress && !isLoading && !isReverseGeocoding && (
                        <div className="flex items-center gap-2">
                            {precisionInfo && (
                                <span className={`text-xs font-bold px-2 py-1 rounded-md ${precisionInfo.classes}`}>
                                    Precisione: {precisionInfo.text}
                                </span>
                            )}
                            <button 
                                type="button" 
                                onClick={() => fetchSuggestions(inputValue, true)}
                                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                title="Forza aggiornamento coordinate"
                            >
                                <FiRefreshCw className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            </button>
                            <button onClick={handleClearCache} className="p-1 rounded-full hover:bg-red-200 dark:hover:bg-red-800 transition-colors" title="Pulisci cache">
                                <FiTrash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {isSuggestionBoxOpen && (
                <ul className="absolute z-50 w-full mt-1 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {/* Indicatore Google Maps */}
                    {isGoogleMapsSearching && suggestions.length > 0 && (
                        <li className="p-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-l-4 border-green-400 dark:border-green-500">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <FiSearch className="h-4 w-4 text-green-600 dark:text-green-400 animate-pulse" />
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                                </div>
                                <div className="flex-grow">
                                    <div className="text-sm font-medium text-green-800 dark:text-green-200">
                                        🗺️ Google Maps sta cercando la posizione più accurata...
                                    </div>
                                    <div className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                                        I risultati più precisi appariranno a breve
                                    </div>
                                </div>
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                                </div>
                            </div>
                        </li>
                    )}
                    
                    {isLoading && suggestions.length === 0 ? (
                        <li className="p-3 text-sm text-gray-500 text-center italic">Ricerca in corso...</li>
                    ) : suggestions.length > 0 ? (
                        suggestions.map((s, index) => {
                            const suggestionPrecisionStyle = precisionStyles[s.precision] || precisionStyles.Unknown;
                            const providerStyle = providerStyles[s.provider] || providerStyles.nominatim;
                            return (
                                <li
                                    key={`${s.provider}-${s.displayName}-${index}`}
                                    onClick={() => handleSelectSuggestion(s)}
                                    onMouseOver={() => setActiveIndex(index)}
                                    className={`p-3 text-sm flex justify-between items-start cursor-pointer border-l-4 ${
                                        activeIndex === index ? 'bg-primary/20 border-primary' : 'border-transparent hover:bg-primary/10 hover:border-primary/20'
                                    }`}
                                >
                                    <div className="flex-grow pr-2">
                                      <span>{s.displayName}</span>
                                      <div className="flex items-center gap-2 mt-1.5">
                                        <span className={`text-xs font-semibold ${suggestionPrecisionStyle.classes} inline-block px-1.5 py-0.5 rounded-md`}>
                                            Prec: {suggestionPrecisionStyle.text}
                                        </span>
                                        <span className={`text-xs font-semibold ${providerStyle.classes} inline-block px-1.5 py-0.5 rounded-md`}>
                                            Fonte: {providerStyle.text}
                                        </span>
                                      </div>
                                    </div>
                                </li>
                            );
                        })
                    ) : (
                         <li className="p-3 text-sm text-gray-500 text-center">Nessun risultato trovato.</li>
                    )}
                </ul>
            )}
            {isMapVisible && verifiedAddress && (
                <div className="md:col-span-2 h-48 mt-2 rounded-lg overflow-hidden border border-border-light dark:border-border-dark">
                    <DraggablePinMap
                        initialCoords={verifiedAddress.coordinates}
                        onPositionChange={handlePositionChange}
                        theme={theme}
                        mapStyle={mapStyle}
                    />
                </div>
            )}
        </div>
    );
};

export default LocationInput;