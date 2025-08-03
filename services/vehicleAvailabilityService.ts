import { Intervention, InterventionStatus, Vehicle } from '../types';

/**
 * Service per gestire la disponibilità dei veicoli
 */

/**
 * Ottiene l'elenco dei veicoli attualmente in uso da interventi "In corso"
 * @param interventions - Lista di tutti gli interventi
 * @param currentInterventionId - ID dell'intervento corrente (escluso dal controllo)
 * @returns Array di ID dei veicoli in uso
 */
export function getVehiclesInUse(
    interventions: Intervention[], 
    currentInterventionId?: number
): number[] {
    const vehiclesInUse = new Set<number>();
    
    interventions.forEach(intervention => {
        // Esclude l'intervento corrente dal controllo
        if (currentInterventionId && intervention.id === currentInterventionId) {
            return;
        }
        
        // Solo interventi "In corso" bloccano i veicoli
        if (intervention.status === InterventionStatus.IN_PROGRESS) {
            intervention.teamsDetails.forEach(teamDetail => {
                teamDetail.vehiclesUsed.forEach(vehicleId => {
                    vehiclesInUse.add(vehicleId);
                });
            });
        }
    });
    
    return Array.from(vehiclesInUse);
}

/**
 * Verifica se un veicolo è disponibile per l'assegnazione
 * @param vehicleId - ID del veicolo da verificare
 * @param interventions - Lista di tutti gli interventi
 * @param currentInterventionId - ID dell'intervento corrente (escluso dal controllo)
 * @returns true se il veicolo è disponibile, false se è in uso
 */
export function isVehicleAvailable(
    vehicleId: number,
    interventions: Intervention[],
    currentInterventionId?: number
): boolean {
    const vehiclesInUse = getVehiclesInUse(interventions, currentInterventionId);
    return !vehiclesInUse.includes(vehicleId);
}

/**
 * Filtra i veicoli disponibili da una lista
 * @param vehicles - Lista di tutti i veicoli
 * @param interventions - Lista di tutti gli interventi
 * @param currentInterventionId - ID dell'intervento corrente (escluso dal controllo)
 * @returns Array di veicoli disponibili
 */
export function getAvailableVehicles(
    vehicles: Vehicle[],
    interventions: Intervention[],
    currentInterventionId?: number
): Vehicle[] {
    const vehiclesInUse = getVehiclesInUse(interventions, currentInterventionId);
    
    return vehicles.filter(vehicle => 
        !vehiclesInUse.includes(vehicle.id)
    );
}

/**
 * Ottiene informazioni dettagliate sui veicoli in uso
 * @param interventions - Lista di tutti gli interventi
 * @param currentInterventionId - ID dell'intervento corrente (escluso dal controllo)
 * @returns Mappa vehicleId -> informazioni sull'intervento che lo sta usando
 */
export function getVehicleUsageInfo(
    interventions: Intervention[],
    currentInterventionId?: number
): Map<number, { intervention: Intervention, teamName: string }> {
    const usageInfo = new Map<number, { intervention: Intervention, teamName: string }>();
    
    interventions.forEach(intervention => {
        // Esclude l'intervento corrente dal controllo
        if (currentInterventionId && intervention.id === currentInterventionId) {
            return;
        }
        
        // Solo interventi "In corso" bloccano i veicoli
        if (intervention.status === InterventionStatus.IN_PROGRESS) {
            intervention.teamsDetails.forEach(teamDetail => {
                teamDetail.vehiclesUsed.forEach(vehicleId => {
                    usageInfo.set(vehicleId, {
                        intervention,
                        teamName: teamDetail.teamName
                    });
                });
            });
        }
    });
    
    return usageInfo;
}
