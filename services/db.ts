import Dexie, { type Table } from 'dexie';
import { Intervention, Client, Personnel, Asset, Vehicle, Team, UsedMaterial } from '../types';
import { mockInterventions, mockClients, mockPersonnel, mockAssets, mockVehicles, mockTeams } from './mockData';

// La chiave per localStorage, legata alla versione del DB.
// Se si cambia versione dello schema, si può cambiare questa chiave per forzare un nuovo popolamento.
const POPULATED_FLAG_KEY = 'db_populated_v9';

export class ProXDatabase extends Dexie {
    interventions!: Table<Intervention, number>;
    clients!: Table<Client, number>;
    personnel!: Table<Personnel, number>;
    assets!: Table<Asset, number>;
    vehicles!: Table<Vehicle, number>;
    teams!: Table<Team, number>;

    constructor() {
        super('ProXDatabase');
        this.version(9).stores({
            interventions: '++id, status, priority, assignedTeamId, lastUpdate, scheduledStartDate',
            clients: '++id, name, type',
            personnel: '++id, name, role, status',
            assets: '++id, clientId, serialNumber',
            vehicles: '++id, name, licensePlate, status',
            teams: '++id, name',
        });
    }

    async populate() {
        // Controllo primario e veloce basato su localStorage per evitare transazioni non necessarie.
        if (localStorage.getItem(POPULATED_FLAG_KEY)) {
            console.log("Database population skipped (flag found).");
            return;
        }

        return this.transaction('rw', this.tables, async () => {
            // Controllo di sicurezza all'interno della transazione per evitare race conditions.
            const clientCount = await this.clients.count();
            if (clientCount > 0) {
                console.log("Database already contains data, setting flag and skipping population.");
                localStorage.setItem(POPULATED_FLAG_KEY, 'true');
                return;
            }

            console.log("Populating database with mock data for the first time...");
            
            await this.clients.bulkAdd(mockClients);
            await this.personnel.bulkAdd(mockPersonnel);
            await this.assets.bulkAdd(mockAssets);
            await this.vehicles.bulkAdd(mockVehicles);
            await this.teams.bulkAdd(mockTeams);
            await this.interventions.bulkAdd(mockInterventions);

            // Imposta il flag per indicare che il popolamento è stato completato.
            localStorage.setItem(POPULATED_FLAG_KEY, 'true');
            console.log("Database populated and persistence flag set.");
        });
    }

    async onAddMaterial(id: number, material: UsedMaterial) {
        await this.transaction('rw', this.interventions, async () => {
            const intervention = await this.interventions.get(id);
            if (!intervention) return;
            
            const updatedMaterials = [...intervention.materials, material];
            const materialsCost = updatedMaterials.reduce((sum, m) => sum + (m.price * m.quantity), 0);
            
            await this.interventions.update(id, {
                materials: updatedMaterials,
                economicDetails: {
                    ...intervention.economicDetails,
                    materialsCost
                }
            });
        });
    }

    async onRemoveMaterial(id: number, materialId: string) {
        await this.transaction('rw', this.interventions, async () => {
            const intervention = await this.interventions.get(id);
            if (!intervention) return;
            
            const updatedMaterials = intervention.materials.filter(m => m.id !== materialId);
            const materialsCost = updatedMaterials.reduce((sum, m) => sum + (m.price * m.quantity), 0);
            
            await this.interventions.update(id, {
                materials: updatedMaterials,
                economicDetails: {
                    ...intervention.economicDetails,
                    materialsCost
                }
            });
        });
    }
}

export const db = new ProXDatabase();