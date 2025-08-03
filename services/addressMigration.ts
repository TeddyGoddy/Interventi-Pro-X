/**
 * Script per pulire gli indirizzi esistenti nel database
 * Rimuove i provider dai displayName degli indirizzi salvati
 */

import { db } from './db';
import { cleanAddressDisplayName, hasProviderInDisplayName } from './addressUtils';

/**
 * Pulisce tutti gli indirizzi nel database rimuovendo le informazioni del provider
 */
export async function cleanAllAddressesInDatabase(): Promise<{
    processed: number;
    cleaned: number;
    errors: number;
}> {
    let processed = 0;
    let cleaned = 0;
    let errors = 0;

    try {
        console.log('🧹 [ADDRESS MIGRATION] Inizio pulizia indirizzi...');

        // Ottieni tutti gli interventi
        const interventions = await db.interventions.toArray();
        
        for (const intervention of interventions) {
            processed++;
            
            try {
                if (intervention.address && hasProviderInDisplayName(intervention.address)) {
                    const cleanAddress = cleanAddressDisplayName(intervention.address);
                    
                    console.log(`🧹 [ADDRESS MIGRATION] Pulizia intervento ${intervention.id}:`);
                    console.log(`   Prima: "${intervention.address}"`);
                    console.log(`   Dopo:  "${cleanAddress}"`);
                    
                    await db.interventions.update(intervention.id, {
                        address: cleanAddress
                    });
                    
                    cleaned++;
                }
            } catch (error) {
                console.error(`❌ [ADDRESS MIGRATION] Errore pulizia intervento ${intervention.id}:`, error);
                errors++;
            }
        }

        console.log(`✅ [ADDRESS MIGRATION] Completata! Processati: ${processed}, Puliti: ${cleaned}, Errori: ${errors}`);
        
        return { processed, cleaned, errors };
        
    } catch (error) {
        console.error('❌ [ADDRESS MIGRATION] Errore generale:', error);
        throw error;
    }
}

/**
 * Esegue la migrazione solo se necessario (controlla se ci sono indirizzi da pulire)
 */
export async function cleanAddressesIfNeeded(): Promise<boolean> {
    try {
        // Controlla se ci sono indirizzi che contengono provider
        const interventions = await db.interventions.toArray();
        const needsCleaning = interventions.some(intervention => 
            intervention.address && hasProviderInDisplayName(intervention.address)
        );

        if (needsCleaning) {
            console.log('🧹 [ADDRESS MIGRATION] Trovati indirizzi da pulire, avvio migrazione...');
            await cleanAllAddressesInDatabase();
            return true;
        } else {
            console.log('✅ [ADDRESS MIGRATION] Nessun indirizzo da pulire trovato.');
            return false;
        }
    } catch (error) {
        console.error('❌ [ADDRESS MIGRATION] Errore controllo migrazione:', error);
        return false;
    }
}
