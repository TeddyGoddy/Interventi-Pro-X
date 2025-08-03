/**
 * Utility functions for address handling
 */

/**
 * Pulisce il displayName dell'indirizzo rimuovendo il provider
 * Esempi:
 * "via ettore fieramosca 3, cinisello balsamo (Google Maps)" → "via ettore fieramosca 3, cinisello balsamo"
 * "Via Roma 123, Milano (OpenCage)" → "Via Roma 123, Milano"
 * "Piazza Duomo, Firenze (Nominatim)" → "Piazza Duomo, Firenze"
 */
export function cleanAddressDisplayName(displayName: string): string {
    if (!displayName) return displayName;
    
    // Pattern per rimuovere il provider tra parentesi alla fine
    // Matches: "(Google Maps)", "(OpenCage)", "(Photon)", "(Nominatim)", "(Overpass)", etc.
    const providerPattern = /\s*\([^)]*Maps?\)?\s*$/i;
    const cleanedName = displayName.replace(providerPattern, '').trim();
    
    // Se non ha trovato il pattern standard, prova pattern più generici
    const genericProviderPattern = /\s*\((OpenCage|Photon|Nominatim|Overpass|Google)\)?\s*$/i;
    const finalCleanedName = cleanedName.replace(genericProviderPattern, '').trim();
    
    return finalCleanedName || displayName; // Fallback al nome originale se la pulizia fallisce
}

/**
 * Verifica se un display name contiene informazioni del provider
 */
export function hasProviderInDisplayName(displayName: string): boolean {
    if (!displayName) return false;
    
    const providerPattern = /\s*\([^)]*Maps?|OpenCage|Photon|Nominatim|Overpass\)\s*$/i;
    return providerPattern.test(displayName);
}
