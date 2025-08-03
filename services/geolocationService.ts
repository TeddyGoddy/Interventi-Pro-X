import { AddressSuggestion, Coordinates, PrecisionLevel, GeolocationProvider } from '../types';

const LOCAL_SCRAPER_URL = 'http://localhost:4000/geocode';
import { calculateDistance } from './utils';

// TODO: Move API Key to environment variables
const OPENCAGE_API_KEY = 'c7c6c59d2f7c45b69b5c0d538b7f6cbe';

const CACHE_KEY = 'geocoding_cache_v2'; // new version for new provider
const CACHE_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days

const API_USER_AGENT = 'Gestionale Interventi Pro/1.0';
const PHOTON_BASE_URL = 'https://photon.komoot.io/api/';
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/';
const OVERPASS_BASE_URL = 'https://overpass-api.de/api/interpreter';

// Internal types for processing
interface GeocodeResult {
  displayName: string;
  coordinates: Coordinates;
  provider: GeolocationProvider;
  confidence: number;
  hasHouseNumber: boolean;
  precision: PrecisionLevel;
}

interface AddressParts {
  street?: string;
  houseNumber?: string;
  city?: string;
}

type CachedGeocode = {
  query: string;
  results: AddressSuggestion[];
  timestamp: number;
};

const CACHE_EXPIRY_DAYS = 30;

// Helper functions
const fetchWithTimeout = (url: RequestInfo, options: RequestInit, timeout = 5000): Promise<Response> => {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), timeout)
    )
  ]);
};

const confidenceToPrecision = (confidence: number, hasHouseNumber: boolean): PrecisionLevel => {
  if (confidence >= 0.95) return 'Rooftop';
  if (confidence >= 0.7 || hasHouseNumber) return 'StreetAddress';
  if (confidence >= 0.5) return 'Street';
  if (confidence >= 0.3) return 'City';
  return 'Unknown';
}

const parseItalianAddress = (query: string): AddressParts => {
  const patterns = [
    // Pattern 1: "via xx 123, city"
    /^(via|viale|corso|piazza|largo|vicolo|strada)\s+([^,]+?)\s+(\d+[a-zA-Z]{0,2})\s*,\s*(.+)$/i,
    // Pattern 2: "via xx 123 city" (no comma)
    /^(via|viale|corso|piazza|largo|vicolo|strada)\s+([^,]+?)\s+(\d+[a-zA-Z]{0,2})\s+(.+)$/i,
    // Pattern 3: "xx 123, city"
    /^([^,]+?)\s+(\d+[a-zA-Z]{0,2})\s*,\s*(.+)$/i,
    // Pattern 4: "xx 123 city" (no comma)
    /^([^,]+?)\s+(\d+[a-zA-Z]{0,2})\s+(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match) {
      // Patterns starting with street type (e.g., "via")
      if (/^(via|viale|corso|piazza|largo|vicolo|strada)/i.test(match[0])) {
        return { street: `${match[1]} ${match[2]}`.trim(), houseNumber: match[3], city: match[4]?.trim() };
      }
      // Patterns starting directly with street name
      return { street: match[1].trim(), houseNumber: match[2], city: match[3]?.trim() };
    }
  }

  // Fallback for just street and number, no city
  const fallbackMatch = query.match(/^(.+?)\s+(\d+[a-zA-Z]{0,2})\s*$/);
  if (fallbackMatch) {
    return { street: fallbackMatch[1].trim(), houseNumber: fallbackMatch[2] };
  }

  return { street: query }; // Final fallback
}

async function searchWithGoogleMapsScraper(query: string, forceRefresh = false): Promise<AddressSuggestion[]> {
  try {
    console.log(`[GEOLOCATION] 🔍 Google Maps Scraper SEMPLIFICATO per: "${query}"`);
    
    const response = await fetch(`http://localhost:4000/geocode?address=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.log(`[GEOLOCATION] ❌ Google Maps HTTP error: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    
    if (!data.lat || !data.lon) {
      console.log(`[GEOLOCATION] ⚠️ Google Maps: coordinate mancanti`);
      return [];
    }
    
    const result: AddressSuggestion[] = [{
      displayName: `${query} (Google Maps)`,
      coordinates: {
        lat: parseFloat(data.lat),
        lng: parseFloat(data.lon)
      },
      provider: 'google-maps-scraper' as GeolocationProvider,
      confidence: 1.0,
      hasHouseNumber: true,
      precision: 'Rooftop' as PrecisionLevel
    }];
    
    console.log(`[GEOLOCATION] ✅ Google Maps SUCCESS:`, result[0].coordinates);
    return result;
    
  } catch (error) {
    console.error(`[GEOLOCATION] 🚨 Google Maps ERROR:`, error.message);
    return [];
  }
}

// Search functions for each provider - Ottimizzate per velocità
const searchWithPhoton = async (query: string): Promise<GeocodeResult[]> => {
  const url = `${PHOTON_BASE_URL}?q=${encodeURIComponent(query)}&limit=2&lang=it&bbox=6.74,36.61,18.48,47.11`; // Solo 2 risultati
  try {
    const response = await fetchWithTimeout(url, { headers: { 'User-Agent': API_USER_AGENT } }, 1500); // Ultra veloce: 1.5s
    if (!response.ok) return [];
    const data = await response.json();
    return data.features.map((f: any): GeocodeResult => {
      const p = f.properties;
      const displayName = [p.name, p.street, p.housenumber, p.postcode, p.city, p.country].filter(Boolean).join(', ');
      let confidence = p.extent ? 0.4 : 0.6;
      if (p.housenumber) confidence += 0.3;
      if (p.street && query.toLowerCase().includes(p.street.toLowerCase())) confidence += 0.1;

      return {
        displayName,
        coordinates: { lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] },
        provider: 'photon',
        confidence: Math.min(confidence, 1.0),
        hasHouseNumber: !!p.housenumber,
        precision: confidenceToPrecision(confidence, !!p.housenumber)
      };
    });
  } catch (e) {
    console.log('[GEOLOCATION] ⚡ Photon timeout (2s)');
    return [];
  }
}

const searchWithNominatim = async (query: string): Promise<GeocodeResult[]> => {
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    addressdetails: '1',
    limit: '3', // Ridotto da 5 a 3
    countrycodes: 'it',
    'accept-language': 'it',
  });
  try {
    const response = await fetchWithTimeout(`${NOMINATIM_BASE_URL}search?${params.toString()}`, { headers: { 'User-Agent': API_USER_AGENT } }, 2000); // Ridotto da 3s a 2s
    if (!response.ok) return [];
    const data = await response.json();
    return data.map((item: any): GeocodeResult => {
      return {
        displayName: item.display_name,
        coordinates: { lat: parseFloat(item.lat), lng: parseFloat(item.lon) },
        provider: 'nominatim',
        confidence: parseFloat(item.importance) || 0.5,
        hasHouseNumber: !!item.address?.house_number,
        precision: confidenceToPrecision(parseFloat(item.importance) || 0.5, !!item.address?.house_number)
      };
    });
  } catch (e) {
    console.log('[GEOLOCATION] ⚡ Nominatim timeout (2s)');
    return [];
  }
}

const searchWithOverpass = async (query: string): Promise<GeocodeResult[]> => {
  const parts = parseItalianAddress(query);
  if (!parts.street || !parts.houseNumber) return [];

  const cityFilter = parts.city ? `["addr:city"~"${parts.city}",i]` : '';
  const overpassQuery = `[out:json][timeout:3][bbox:36.61,6.74,47.11,18.48];(node["addr:street"~"${parts.street}",i]["addr:housenumber"~"${parts.houseNumber}",i]${cityFilter};way["addr:street"~"${parts.street}",i]["addr:housenumber"~"${parts.houseNumber}",i]${cityFilter};);out center;`;

  try {
    const response = await fetchWithTimeout(OVERPASS_BASE_URL, { method: 'POST', body: overpassQuery }, 3000); // Ridotto da 8s a 3s
    if (!response.ok) return [];
    const data = await response.json();
    return data.elements.map((el: any): GeocodeResult => {
      const tags = el.tags;
      const displayName = `${tags['addr:street'] || ''} ${tags['addr:housenumber'] || ''}, ${tags['addr:postcode'] || ''} ${tags['addr:city'] || ''}`.trim().replace(/,$/, '');
      return {
        displayName,
        coordinates: { lat: el.lat || el.center.lat, lng: el.lon || el.center.lon },
        provider: 'overpass',
        confidence: 0.95,
        hasHouseNumber: true,
        precision: 'Rooftop'
      };
    });
  } catch (e) {
    console.log('[GEOLOCATION] ⚡ Overpass timeout (3s)');
    return [];
  }
}

const searchWithOpenCage = async (query: string): Promise<AddressSuggestion[]> => {
  const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${OPENCAGE_API_KEY}&language=it&countrycode=it&limit=3&no_annotations=1`; // Ottimizzato: limit=3, no_annotations
  try {
    const response = await fetchWithTimeout(url, {}, 2000); // Timeout 2s
    if (!response.ok) throw new Error('OpenCage request failed');
    const data = await response.json();

    return data.results.map((item: any): AddressSuggestion => {
      const confidence = item.confidence / 10; // OpenCage confidence is 1-10
      const hasHouseNumber = !!item.components.house_number;
      return {
        displayName: item.formatted,
        coordinates: { lat: item.geometry.lat, lng: item.geometry.lng },
        provider: 'opencage',
        confidence: confidence,
        hasHouseNumber: hasHouseNumber,
        precision: confidenceToPrecision(confidence, hasHouseNumber)
      };
    });
  } catch (e) {
    console.error("Error searching with OpenCage:", e);
    return [];
  }
}

const GEOCODING_PROVIDERS: GeolocationProvider[] = ['google-maps-scraper', 'opencage', 'overpass', 'photon', 'nominatim'];



// Funzione di ranking intelligente per i risultati
const rankResults = (results: AddressSuggestion[]): AddressSuggestion[] => {
    return results.sort((a, b) => {
        // 1. Google Maps ha sempre priorità massima
        if (a.provider === 'google-maps-scraper' && b.provider !== 'google-maps-scraper') return -1;
        if (b.provider === 'google-maps-scraper' && a.provider !== 'google-maps-scraper') return 1;
        
        // 2. Ordina per precisione
        const precisionOrder: Record<PrecisionLevel, number> = { 
            'Rooftop': 0, 'StreetAddress': 1, 'Street': 2, 'City': 3, 'Unknown': 4 
        };
        const precisionDiff = (precisionOrder[a.precision] ?? 99) - (precisionOrder[b.precision] ?? 99);
        if (precisionDiff !== 0) return precisionDiff;
        
        // 3. Ordina per confidenza
        return b.confidence - a.confidence;
    });
};

export async function searchAddress(
    query: string, 
    forceRefresh = false
): Promise<AddressSuggestion[]> {
    console.log(`[GEOLOCATION] 🚀 Ricerca SEMPLIFICATA per: "${query}"`);

    // Controllo cache
    if (!forceRefresh) {
        const cached = getFromCache(query);
        if (cached && cached.length > 0) {
            console.log(`[GEOLOCATION] 📋 Cache hit: ${cached.length} risultati`);
            return cached;
        }
    }

    // 🚀 RICERCA PARALLELA CON GOOGLE MAPS INCLUSO
    console.log(`[GEOLOCATION] ⚡ Avvio TUTTI i provider in parallelo...`);
    
    try {
        const allResults = await Promise.allSettled([
            searchWithOpenCage(query),
            searchWithOverpass(query), 
            searchWithPhoton(query), // DISABILITATO: errori 400 Bad Request
            searchWithNominatim(query),
            searchWithGoogleMapsScraper(query, forceRefresh)
        ]);
        
        console.log(`[GEOLOCATION] 📦 Tutti i provider completati`);
        
        // Debug: analizza ogni promise result
        allResults.forEach((result, index) => {
            const providerNames = ['opencage', 'overpass', 'photon', 'nominatim', 'google-maps-scraper'];
            const providerName = providerNames[index];
            
            if (result.status === 'fulfilled') {
                console.log(`[GEOLOCATION] ✅ ${providerName}: ${result.value.length} risultati`);
                if (providerName === 'google-maps-scraper' && result.value.length > 0) {
                    console.log(`[GEOLOCATION] 🗺️ Google Maps result:`, result.value[0]);
                }
            } else {
                console.log(`[GEOLOCATION] ❌ ${providerName}: ERRORE -`, result.reason);
            }
        });
        
        // Estrai tutti i risultati
        const allSuggestions: AddressSuggestion[] = allResults
            .filter(result => result.status === 'fulfilled')
            .flatMap(result => (result as PromiseFulfilledResult<AddressSuggestion[]>).value);
        
        console.log(`[GEOLOCATION] 📊 Risultati totali: ${allSuggestions.length}`);
        
        // Debug: mostra tutti i risultati per provider
        const byProvider = allSuggestions.reduce((acc, result) => {
            acc[result.provider] = (acc[result.provider] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        console.log(`[GEOLOCATION] 📊 Risultati per provider:`, byProvider);
        
        // Mostra i primi risultati di ogni provider
        allSuggestions.forEach((result, index) => {
            if (index < 10) { // Solo i primi 10
                console.log(`[GEOLOCATION] 📝 [${index}] ${result.provider}: "${result.displayName}"`);
            }
        });
        
        // Ordina per qualità (senza rimozione duplicati per ora)
        const rankedResults = rankResults(allSuggestions);
        
        console.log(`[GEOLOCATION] 🎆 Risultati finali: ${rankedResults.length}`);
        
        // Debug: mostra i risultati finali ordinati
        rankedResults.forEach((result, index) => {
            if (index < 5) { // Solo i primi 5
                console.log(`[GEOLOCATION] 🏆 [${index}] ${result.provider}: "${result.displayName}" (conf: ${result.confidence})`);
            }
        });
        
        // Salva in cache
        if (rankedResults.length > 0) {
            addToCache(query, rankedResults);
        }
        
        return rankedResults;
        
    } catch (error) {
        console.error(`[GEOLOCATION] 🚨 Errore ricerca:`, error);
        return [];
    }
}


const reverseWithNominatim = async(coords: Coordinates): Promise<AddressSuggestion | null> => {
    const url = `${NOMINATIM_BASE_URL}reverse?format=jsonv2&lat=${coords.lat}&lon=${coords.lng}&accept-language=it&zoom=18&limit=2`; // Solo 2 risultati
    try {
        const response = await fetchWithTimeout(url, { headers: { 'User-Agent': API_USER_AGENT } }, 2500); // Ridotto a 2.5s
        if (!response.ok) return null;
        const data = await response.json();
        if (data && data.display_name) {
            const hasHouseNumber = !!data.address?.house_number;
            return {
                displayName: data.display_name,
                coordinates: coords,
                provider: 'nominatim',
                confidence: 0.9, // High confidence for reverse geocoding
                hasHouseNumber: hasHouseNumber,
                precision: hasHouseNumber ? 'StreetAddress' : 'Street'
            }
        }
        return null;
    } catch (e) {
        console.error("Reverse geocoding with Nominatim failed or timed out:", e);
        return null;
    }
}

export const getAddressFromCoordinates = async (coords: Coordinates): Promise<AddressSuggestion> => {
    const result = await reverseWithNominatim(coords);
    if (result) return result;

    return {
        displayName: 'Errore nel recupero dell\'indirizzo',
        coordinates: coords,
        provider: 'nominatim',
        confidence: 0,
        hasHouseNumber: false,
        precision: 'Unknown'
    };
};

function getFromCache(query: string): AddressSuggestion[] | null {
    const cacheKey = `geocode:${query.toLowerCase().trim()}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
        const { results, timestamp }: CachedGeocode = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000) {
            return results;
        }
    }

    return null;
}

export function clearAllGeocodingCache(): void {
    const allCacheKeys = Object.keys(localStorage);
    let clearedCount = 0;
    allCacheKeys.forEach(key => {
        if (key.startsWith('geocode:')) {
            localStorage.removeItem(key);
            clearedCount++;
        }
    });
    console.log(`[GEOLOCATION] 🧹 Cache completamente pulita. Rimosse ${clearedCount} voci.`);
}

function addToCache(query: string, results: AddressSuggestion[]): void {
    // Se stiamo aggiungendo un risultato ad alta precisione (es. dallo scraper), puliamo prima la cache da risultati simili ma meno precisi.
    if (results.some(r => r.precision === 'Rooftop')) {
        const allCacheKeys = Object.keys(localStorage);
        const queryBase = query.toLowerCase().trim().split(' ')[0]; // Usa la prima parola della query come base per la pulizia

        allCacheKeys.forEach(key => {
            if (key.startsWith('geocode:') && key.includes(queryBase)) {
                try {
                    const cachedItem = JSON.parse(localStorage.getItem(key) || '{}');
                    const hasRooftopResult = cachedItem.results?.some((r: AddressSuggestion) => r.precision === 'Rooftop');
                    if (!hasRooftopResult) {
                        console.log(`[GEOLOCATION] 🧹 Pulizia cache: rimossa voce meno precisa "${key}"`);
                        localStorage.removeItem(key);
                    }
                } catch (e) {
                    // Ignora errori di parsing
                }
            }
        });
    }

    const cacheKey = `geocode:${query.toLowerCase().trim()}`;
    localStorage.setItem(cacheKey, JSON.stringify({
        query,
        results,
        timestamp: Date.now()
    }));
}