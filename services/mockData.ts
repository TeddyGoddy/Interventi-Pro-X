import { Intervention, Client, Personnel, InterventionStatus, Priority, ClientType, PaymentStatus, Asset, UsedMaterial, Attachment, PersonnelRole, PersonnelStatus, Vehicle, VehicleType, VehicleStatus, Team } from '../types';

export const mockClients: Client[] = [
    { id: 1, name: 'Mario Rossi S.p.A.', phone: '333-1234567', email: 'acquisti@rossispa.com', type: ClientType.COMPANY, vatNumber: 'IT01234567890' },
    { id: 2, name: 'Condominio Verdi', phone: '334-7654321', email: 'amministrazione@condominioverdi.it', type: ClientType.COMPANY, fiscalCode: 'VRDCRM80A01H501Z' },
    { id: 3, name: 'Studio Legale Bianchi', phone: '335-1122334', email: 'info@bianchilex.it', type: ClientType.COMPANY, vatNumber: 'IT98765432109' },
    { id: 4, name: 'Paolo Neri', phone: '336-5566778', email: 'paolo.neri@email.com', type: ClientType.PRIVATE, fiscalCode: 'NREPLA75M01F205Z' },
    { id: 5, name: 'Azienda Agricola Verde Natura', phone: '337-9876543', email: 'info@verdenatura.it', type: ClientType.COMPANY, vatNumber: 'IT11223344556' },
    { id: 6, name: 'Ristorante La Pergola', phone: '338-1122334', email: 'prenotazioni@lapergola.com', type: ClientType.COMPANY, vatNumber: 'IT22334455667' },
    { id: 7, name: 'Farmacia Centrale', phone: '339-4455667', email: 'info@farmaciacentrale.it', type: ClientType.COMPANY, vatNumber: 'IT33445566778' },
    { id: 8, name: 'Banca Popolare Milano', phone: '340-7788990', email: 'servizioclienti@bpm.it', type: ClientType.COMPANY, vatNumber: 'IT44556677889' },
    { id: 9, name: 'Hotel Excelsior', phone: '341-2233445', email: 'reception@hotelexcelsior.com', type: ClientType.COMPANY, vatNumber: 'IT55667788990' },
    { id: 10, name: 'Libreria Il Girasole', phone: '342-5566778', email: 'info@libreriagirasole.it', type: ClientType.COMPANY, vatNumber: 'IT66778899001' },
    { id: 11, name: 'Palestra Fit & Go', phone: '343-8899001', email: 'info@fitandgo.it', type: ClientType.COMPANY, vatNumber: 'IT77889900112' },
    { id: 12, name: 'Carrozzeria Lampo', phone: '344-1122334', email: 'info@carrozzerialampo.it', type: ClientType.COMPANY, vatNumber: 'IT88990011223' },
    { id: 13, name: 'Pizzeria Bella Napoli', phone: '345-4455667', email: 'ordini@bellanapoli.com', type: ClientType.COMPANY, vatNumber: 'IT99001122334' },
    { id: 14, name: 'Studio Dentistico Dott. Rossi', phone: '346-7788990', email: 'studio@rossidentale.it', type: ClientType.COMPANY, vatNumber: 'IT00112233445' },
    { id: 15, name: 'Supermercato Coop', phone: '347-2233445', email: 'clienti@coopmi.it', type: ClientType.COMPANY, vatNumber: 'IT11223344556' },
];

export const mockAssets: Asset[] = [
    { id: 1, clientId: 1, name: 'Caldaia Condominiale', brand: 'Vaillant', model: 'ecoTEC plus VMW 346/5-5', serialNumber: 'SN-VA-00123' },
    { id: 2, clientId: 2, name: 'Climatizzatore Ufficio A', brand: 'Daikin', model: 'Perfera FTXM35R', serialNumber: 'SN-DA-98765' },
    { id: 3, clientId: 3, name: 'Termostato Sala Riunioni', brand: 'Nest', model: 'Learning Thermostat 3rd Gen', serialNumber: 'SN-NE-45678' },
    { id: 4, clientId: 11, name: 'Impianto Allarme Palestra', brand: 'Paradox', model: 'Magellan MG5050', serialNumber: 'SN-PA-33445' },
    { id: 5, clientId: 7, name: 'Lavastoviglie Professionale', brand: 'Miele', model: 'PG 8056 U', serialNumber: 'SN-MI-66778' },
];

export const mockPersonnel: Personnel[] = [
    { id: 1, name: 'Marco Gialli', role: PersonnelRole.TEAM_LEADER, status: PersonnelStatus.ACTIVE, email: 'marco.gialli@example.com', phone: '3331112233' },
    { id: 2, name: 'Laura Esposito', role: PersonnelRole.TECHNICIAN, status: PersonnelStatus.ACTIVE, email: 'laura.esposito@example.com', phone: '3334445566' },
    { id: 3, name: 'Luca Verdi', role: PersonnelRole.TECHNICIAN, status: PersonnelStatus.ACTIVE, email: 'luca.verdi@example.com', phone: '3337778899' },
    { id: 4, name: 'Sofia Romano', role: PersonnelRole.APPRENTICE, status: PersonnelStatus.ACTIVE, email: 'sofia.romano@example.com', phone: '3339998877' },
    { id: 5, name: 'Antonio Russo', role: PersonnelRole.TEAM_LEADER, status: PersonnelStatus.ACTIVE, email: 'antonio.russo@example.com', phone: '3341112233' },
    { id: 6, name: 'Francesca Ferrari', role: PersonnelRole.TECHNICIAN, status: PersonnelStatus.ACTIVE, email: 'francesca.ferrari@example.com', phone: '3344445566' },
    { id: 7, name: 'Giuseppe Conti', role: PersonnelRole.SPECIALIST, status: PersonnelStatus.ACTIVE, email: 'giuseppe.conti@example.com', phone: '3347778899' },
    { id: 8, name: 'Maria Esposito', role: PersonnelRole.TECHNICIAN, status: PersonnelStatus.ON_LEAVE, email: 'maria.esposito@example.com', phone: '3349998877' },
];

export const mockVehicles: Vehicle[] = [
    { id: 1, name: 'Furgone 1', licensePlate: 'AA123BB', type: VehicleType.VAN, status: VehicleStatus.AVAILABLE, position: { lat: 45.4642, lng: 9.1900 }, equipment: ['Scala', 'Cassetta attrezzi base', 'Pompa vuoto'] }, // Milan
    { id: 2, name: 'Furgone 2', licensePlate: 'CC456DD', type: VehicleType.VAN, status: VehicleStatus.IN_USE, position: { lat: 45.6953, lng: 9.6669 }, equipment: ['Gruppo manometrico', 'Cercafughe', 'Ricambi base caldaie'] }, // Bergamo
    { id: 3, name: 'Auto Tecnica', licensePlate: 'EE789FF', type: VehicleType.CAR, status: VehicleStatus.MAINTENANCE, position: { lat: 45.5398, lng: 10.2185 }, equipment: ['Tester multifunzione', 'Laptop diagnosi'] }, // Brescia
    { id: 4, name: 'Furgone 3', licensePlate: 'GG012HH', type: VehicleType.VAN, status: VehicleStatus.AVAILABLE, position: { lat: 45.5842, lng: 9.2730 }, equipment: ['Saldatore', 'Generatore', 'Compressore'] }, // Monza
];

export const mockTeams: Team[] = [
    { id: 1, name: 'Squadra Alpha', memberIds: [1, 4] }, // Marco Galli + Luca Verdi
    { id: 2, name: 'Squadra Bravo', memberIds: [2, 3] }, // Sofia Romano + Laura Esposito
    { id: 3, name: 'Squadra Charlie', memberIds: [5, 6] }, // Antonio Rossi + Francesca Ferrari
    { id: 4, name: 'Specialista (solo)', memberIds: [7] }, // Giuseppe Conti
];

const now = new Date();
const generateId = () => Math.random().toString(36).substr(2, 9);

// Modifica la generazione delle coordinate per distribuirle meglio in Lombardia
const lombardyBoundingBox = {
  minLat: 44.7,
  maxLat: 46.7,
  minLng: 8.5,
  maxLng: 11.5
};

// Lombardy locations for random generation
const lombardyLocations = [
    { city: "Milano", address: "Via Montenapoleone 8", zip: "20121", province: "MI", lat: 45.4674, lng: 9.1930 },
    { city: "Milano", address: "Piazza Duomo 1", zip: "20122", province: "MI", lat: 45.4642, lng: 9.1916 },
    { city: "Milano", address: "Corso Como 10", zip: "20154", province: "MI", lat: 45.4831, lng: 9.1882 },
    { city: "Bergamo", address: "Via XX Settembre 10", zip: "24122", province: "BG", lat: 45.6953, lng: 9.6669 },
    { city: "Bergamo", address: "Piazza Vecchia", zip: "24129", province: "BG", lat: 45.7041, lng: 9.6601 },
    { city: "Brescia", address: "Via Trieste 10", zip: "25121", province: "BS", lat: 45.5398, lng: 10.2185 },
    { city: "Brescia", address: "Piazza della Loggia", zip: "25121", province: "BS", lat: 45.5385, lng: 10.2227 },
    { city: "Como", address: "Via Vittorio Emanuele II 1", zip: "22100", province: "CO", lat: 45.8118, lng: 9.0837 },
    { city: "Como", address: "Lungolario Trento", zip: "22100", province: "CO", lat: 45.8142, lng: 9.0850 },
    { city: "Monza", address: "Via Italia 1", zip: "20900", province: "MB", lat: 45.5842, lng: 9.2730 },
    { city: "Monza", address: "Viale Brianza 1", zip: "20900", province: "MB", lat: 45.5900, lng: 9.2780 },
    { city: "Pavia", address: "Strada Nuova 65", zip: "27100", province: "PV", lat: 45.1873, lng: 9.1557 },
    { city: "Pavia", address: "Piazza della Vittoria", zip: "27100", province: "PV", lat: 45.1867, lng: 9.1550 },
    { city: "Varese", address: "Via Marcobi 1", zip: "21100", province: "VA", lat: 45.8190, lng: 8.8250 },
    { city: "Varese", address: "Corso Matteotti", zip: "21100", province: "VA", lat: 45.8180, lng: 8.8230 },
];

export const mockMaterials: UsedMaterial[] = [
  {
    id: 'mat-1',
    name: 'Filtro aria condizionata',
    sku: 'AC-FILT-01',
    price: 24.90,
    quantity: 1,
    unit: 'pz'
  },
  {
    id: 'mat-2',
    name: 'Guarnizione in gomma',
    sku: 'SEAL-RUB-05',
    price: 3.50,
    quantity: 2,
    unit: 'pz'
  },
  {
    id: 'mat-3',
    name: 'Liquido refrigerante',
    sku: 'COOL-LIQ-1L',
    price: 12.00,
    quantity: 1.5,
    unit: 'L'
  }
];

export const mockInterventions: Intervention[] = [
    {
        id: 1,
        title: 'Riparazione Caldaia Bloccata',
        description: 'La caldaia principale del palazzo è in blocco totale, non produce acqua calda né riscaldamento. Massima urgenza richiesta.',
        address: 'Via Dante 10, 20123 Milano MI, Italia',
        coordinates: { 
            lat: lombardyBoundingBox.minLat + Math.random() * (lombardyBoundingBox.maxLat - lombardyBoundingBox.minLat),
            lng: lombardyBoundingBox.minLng + Math.random() * (lombardyBoundingBox.maxLng - lombardyBoundingBox.minLng)
        },
        client: mockClients[0],
        assetId: 1,
        assignedTeamId: 1,
        assignedTeamIds: [1],
        teamsDetails: [
            {
                teamId: 1,
                teamName: 'Squadra Alpha',
                attendance: [
                    {
                        memberId: 1,
                        name: 'Marco Galli',
                        role: PersonnelRole.TEAM_LEADER,
                        isPresent: true,
                        modifiedBy: 'Sistema',
                        modifiedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString()
                    },
                    {
                        memberId: 4,
                        name: 'Luca Verdi',
                        role: PersonnelRole.APPRENTICE,
                        isPresent: true,
                        modifiedBy: 'Sistema',
                        modifiedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString()
                    }
                ],
                externalMembers: [],
                vehiclesUsed: [1, 2], // Furgone Principale + Auto Aziendale
                lastModified: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
                modifiedBy: 'Marco Galli'
            }
        ],
        status: InterventionStatus.IN_PROGRESS,
        priority: Priority.URGENT,
        creationDate: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        scheduledStartDate: new Date(new Date().setHours(11, 0, 0, 0)).toISOString(),
        scheduledEndDate: new Date(new Date().setHours(13, 0, 0, 0)).toISOString(),
        lastUpdate: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
        notes: 'La squadra è in viaggio. Previsto arrivo ore 12:00. Verificare la pressione del circuito prima di intervenire.',
        history: [
            { timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), user: 'Admin', description: 'Squadra Alpha assegnata.' },
            { timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), user: 'Sistema', description: 'Intervento creato.' },
        ],
        economicDetails: {
            materialsCost: 125.50,
            laborCost: 80.00,
            extraCharges: 15.00, // Uscita
            vatPercentage: 22,
            status: PaymentStatus.TO_BE_INVOICED
        },
        materials: [
            { id: generateId(), name: 'Valvola a 3 vie', sku: 'VLV-3W-001', quantity: 1, price: 95.50, unit: 'pz' },
            { id: generateId(), name: 'Guarnizione', sku: 'GUA-012', quantity: 3, price: 10.00, unit: 'pz' },
        ],
        attachments: [
            { id: generateId(), type: 'image', url: 'https://images.unsplash.com/photo-1585064593845-9dec24a8a293?q=80&w=2070&auto=format&fit=crop', description: 'Foto della caldaia prima dell\'intervento', timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString() },
            { id: generateId(), type: 'document', url: '#', description: 'Manuale tecnico Vaillant ecoTEC', timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString() },
        ]
    },
    {
        id: 2,
        title: 'Manutenzione Programmata Condizionatori',
        description: 'Controllo annuale e pulizia filtri dei 5 condizionatori dell\'ufficio.',
        address: 'Corso Buenos Aires 50, 20124 Milano MI, Italia',
        coordinates: { 
            lat: lombardyBoundingBox.minLat + Math.random() * (lombardyBoundingBox.maxLat - lombardyBoundingBox.minLat),
            lng: lombardyBoundingBox.minLng + Math.random() * (lombardyBoundingBox.maxLng - lombardyBoundingBox.minLng)
        },
        client: mockClients[1],
        assetId: 2,
        assignedTeamId: 1,
        assignedTeamIds: [1],
        teamsDetails: [], // No details for NEW status
        status: InterventionStatus.NEW,
        priority: Priority.MEDIUM,
        creationDate: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        scheduledStartDate: new Date(new Date().setDate(now.getDate() + 1)).toISOString(),
        scheduledEndDate: new Date(new Date(new Date().setDate(now.getDate() + 1)).setHours(11, 0, 0, 0)).toISOString(),
        lastUpdate: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        notes: '',
        history: [
               { timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), user: 'Sistema', description: 'Intervento creato.' },
        ],
        economicDetails: { materialsCost: 30.00, laborCost: 150.00, extraCharges: 0, vatPercentage: 22, status: PaymentStatus.TO_BE_INVOICED },
        materials: [{ id: generateId(), name: 'Kit pulizia filtri', sku: 'CLN-KIT-01', quantity: 1, price: 30.00, unit: 'kit' }],
        attachments: []
    },
    {
        id: 3,
        title: 'Sostituzione Termostato Digitale',
        description: 'Il termostato non regola correttamente la temperatura. Si richiede sostituzione con modello smart.',
        address: 'Via Pignolo 1, 24121 Bergamo BG, Italia',
        coordinates: { 
            lat: lombardyBoundingBox.minLat + Math.random() * (lombardyBoundingBox.maxLat - lombardyBoundingBox.minLat),
            lng: lombardyBoundingBox.minLng + Math.random() * (lombardyBoundingBox.maxLng - lombardyBoundingBox.minLng)
        },
        client: mockClients[2],
        assetId: 3,
        assignedTeamId: 2,
        assignedTeamIds: [2],
        teamsDetails: [], // Completed intervention, details archived
        status: InterventionStatus.COMPLETED,
        priority: Priority.HIGH,
        creationDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        scheduledStartDate: new Date(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).setHours(14,0,0,0)).toISOString(),
        scheduledEndDate: new Date(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).setHours(15,30,0,0)).toISOString(),
        lastUpdate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Intervento completato con successo. Il cliente ha firmato il rapporto.',
        history: [
               { timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), user: 'Laura Esposito', description: 'Stato cambiato in Completato.' },
               { timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), user: 'Admin', description: 'Squadra Bravo assegnata.' },
               { timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), user: 'Sistema', description: 'Intervento creato.' },
        ],
        economicDetails: { materialsCost: 250.00, laborCost: 60.00, extraCharges: 0, vatPercentage: 22, status: PaymentStatus.PAID },
        materials: [{ id: generateId(), name: 'Termostato Nest 3rd Gen', sku: 'NEST-T3-01', quantity: 1, price: 250.00, unit: 'pz' }],
        attachments: [
            { id: generateId(), type: 'image', url: 'https://images.unsplash.com/photo-1617103996237-70412e0d3318?q=80&w=2070&auto=format&fit=crop', description: 'Foto del nuovo termostato installato', timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() }
        ]
    },
    {
        id: 4,
        title: 'Preventivo Installazione Lavatrice',
        description: 'Il cliente richiede un preventivo per installare una nuova lavatrice. Non è un intervento.',
        address: 'Via dei Musei 55, 25121 Brescia BS, Italia',
        coordinates: { 
            lat: lombardyBoundingBox.minLat + Math.random() * (lombardyBoundingBox.maxLat - lombardyBoundingBox.minLat),
            lng: lombardyBoundingBox.minLng + Math.random() * (lombardyBoundingBox.maxLng - lombardyBoundingBox.minLng)
        },
        client: mockClients[3],
        assetId: null,
        assignedTeamId: null,
        assignedTeamIds: [],
        teamsDetails: [],
        status: InterventionStatus.CANCELED,
        priority: Priority.LOW,
        creationDate: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        lastUpdate: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Il cliente ha annullato la richiesta, ha deciso di non procedere.',
        history: [
            { timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(), user: 'Admin', description: 'Stato cambiato in Annullato.' },
            { timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), user: 'Sistema', description: 'Intervento creato.' },
        ],
        economicDetails: { materialsCost: 0, laborCost: 0, extraCharges: 0, vatPercentage: 22, status: PaymentStatus.TO_BE_INVOICED },
        materials: [],
        attachments: []
    },
    {
        id: 11,
        title: 'Verifica Impianto Allarme',
        description: 'L\'impianto di allarme suona senza motivo. Necessaria verifica.',
        address: 'Via Indipendenza 15, 22100 Como CO, Italia',
        coordinates: { 
            lat: lombardyBoundingBox.minLat + Math.random() * (lombardyBoundingBox.maxLat - lombardyBoundingBox.minLat),
            lng: lombardyBoundingBox.minLng + Math.random() * (lombardyBoundingBox.maxLng - lombardyBoundingBox.minLng)
        },
        client: mockClients[10],
        assetId: 4,
        assignedTeamId: 4,
        assignedTeamIds: [4],
        teamsDetails: [
            {
                teamId: 4,
                teamName: 'Specialista (solo)',
                attendance: [
                    {
                        memberId: 7,
                        name: 'Giuseppe Conti',
                        role: PersonnelRole.SPECIALIST,
                        isPresent: true,
                        modifiedBy: 'Sistema',
                        modifiedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString()
                    }
                ],
                externalMembers: [],
                vehiclesUsed: [3], // Furgone Attrezzato
                lastModified: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
                modifiedBy: 'Giuseppe Conti'
            }
        ],
        status: InterventionStatus.IN_PROGRESS,
        priority: Priority.HIGH,
        creationDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        scheduledStartDate: new Date(new Date(now.getTime() - 2 * 60 * 60 * 1000)).toISOString(),
        lastUpdate: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
        notes: 'Specialista al lavoro per diagnosticare il problema. Sospetto su un sensore perimetrale.',
        history: [
            { timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), user: 'Giuseppe Conti', description: 'Diagnosi in corso.' },
            { timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), user: 'Sistema', description: 'Intervento creato.' },
        ],
        economicDetails: { materialsCost: 0, laborCost: 75, extraCharges: 0, vatPercentage: 22, status: PaymentStatus.TO_BE_INVOICED },
        materials: [],
        attachments: []
    },
    {
        id: 12,
        title: 'Emergenza Impianto Elettrico Complesso',
        description: 'Blackout totale in edificio commerciale. Richiede intervento di squadre multiple per ripristino rapido.',
        address: 'Via Manzoni 42, 20121 Milano MI, Italia',
        coordinates: { 
            lat: lombardyBoundingBox.minLat + Math.random() * (lombardyBoundingBox.maxLat - lombardyBoundingBox.minLat),
            lng: lombardyBoundingBox.minLng + Math.random() * (lombardyBoundingBox.maxLng - lombardyBoundingBox.minLng)
        },
        client: mockClients[0],
        assetId: 1,
        assignedTeamId: 1, // Primary team
        assignedTeamIds: [1, 2], // Multiple teams
        teamsDetails: [
            {
                teamId: 1,
                teamName: 'Squadra Alpha',
                attendance: [
                    {
                        memberId: 1,
                        name: 'Marco Galli',
                        role: PersonnelRole.TEAM_LEADER,
                        isPresent: true,
                        modifiedBy: 'Sistema',
                        modifiedAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString()
                    },
                    {
                        memberId: 4,
                        name: 'Luca Verdi',
                        role: PersonnelRole.APPRENTICE,
                        isPresent: true,
                        modifiedBy: 'Sistema',
                        modifiedAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString()
                    }
                ],
                externalMembers: [],
                vehiclesUsed: [1], // Furgone Principale
                lastModified: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
                modifiedBy: 'Marco Galli'
            },
            {
                teamId: 2,
                teamName: 'Squadra Bravo',
                attendance: [
                    {
                        memberId: 2,
                        name: 'Laura Esposito',
                        role: PersonnelRole.TECHNICIAN,
                        isPresent: true,
                        modifiedBy: 'Sistema',
                        modifiedAt: new Date(now.getTime() - 25 * 60 * 1000).toISOString()
                    },
                    {
                        memberId: 3,
                        name: 'Luca Verdi',
                        role: PersonnelRole.TECHNICIAN,
                        isPresent: false, // Assente
                        modifiedBy: 'Laura Esposito',
                        modifiedAt: new Date(now.getTime() - 20 * 60 * 1000).toISOString()
                    }
                ],
                externalMembers: [
                    {
                        id: 'ext-001',
                        name: 'Roberto Electricista',
                        role: 'Elettricista Specializzato',
                        company: 'ElettroService SRL',
                        phone: '+39 333 123 4567',
                        addedBy: 'Laura Esposito',
                        addedAt: new Date(now.getTime() - 15 * 60 * 1000).toISOString()
                    }
                ],
                vehiclesUsed: [2, 4], // Auto Aziendale + Furgone Piccolo
                lastModified: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
                modifiedBy: 'Laura Esposito'
            }
        ],
        status: InterventionStatus.IN_PROGRESS,
        priority: Priority.URGENT,
        creationDate: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
        scheduledStartDate: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
        scheduledEndDate: new Date(new Date().setHours(17, 0, 0, 0)).toISOString(),
        lastUpdate: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
        notes: 'Intervento complesso con squadre multiple. Alpha gestisce quadri elettrici, Bravo ripristina illuminazione.',
        history: [
            { timestamp: new Date(now.getTime() - 10 * 60 * 1000).toISOString(), user: 'Laura Esposito', description: 'Aggiunto membro esterno Roberto Electricista.' },
            { timestamp: new Date(now.getTime() - 25 * 60 * 1000).toISOString(), user: 'Admin', description: 'Squadra Bravo assegnata come supporto.' },
            { timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), user: 'Admin', description: 'Squadra Alpha assegnata.' },
            { timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(), user: 'Sistema', description: 'Intervento creato.' },
        ],
        economicDetails: {
            materialsCost: 450.00,
            laborCost: 320.00,
            extraCharges: 50.00, // Emergenza
            vatPercentage: 22,
            status: PaymentStatus.TO_BE_INVOICED
        },
        materials: [
            { id: generateId(), name: 'Interruttore Magnetotermico', sku: 'INT-MAG-32A', quantity: 3, price: 85.00, unit: 'pz' },
            { id: generateId(), name: 'Cavo elettrico 6mm', sku: 'CAV-6MM-50M', quantity: 50, price: 120.00, unit: 'm' },
            { id: generateId(), name: 'Lampade LED emergenza', sku: 'LED-EMG-12W', quantity: 8, price: 245.00, unit: 'pz' },
        ],
        attachments: [
            { id: generateId(), type: 'image', url: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?q=80&w=2069&auto=format&fit=crop', description: 'Quadro elettrico danneggiato', timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString() },
            { id: generateId(), type: 'image', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2070&auto=format&fit=crop', description: 'Lavori in corso squadra Alpha', timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString() },
        ]
    }
];

// Funzione per generare altri interventi fittizi per arrivare a ~50
const generateMoreInterventions = (): Intervention[] => {
    const additionalInterventions: Intervention[] = [];
    const statuses = Object.values(InterventionStatus);
    const priorities = Object.values(Priority);

    for (let i = 5; i <= 50; i++) {
        if (mockInterventions.find(iv => iv.id === i)) continue;

        const client = mockClients[i % mockClients.length];
        const team = mockTeams[i % mockTeams.length];
        const status = statuses[i % statuses.length];
        const priority = priorities[i % priorities.length];
        const creation = new Date(now.getTime() - (i * 12 * 60 * 60 * 1000));
        const update = new Date(creation.getTime() + (Math.random() * 10 * 60 * 60 * 1000));
        
        const start = new Date(creation.getTime() + (Math.random() * 24 * 60 * 60 * 1000));
        start.setHours(Math.floor(Math.random() * 9) + 8, 0, 0, 0); // Random hour between 8 and 16
        const end = new Date(start.getTime() + ((Math.floor(Math.random() * 3) + 1) * 60 * 60 * 1000)); // Duration 1 to 3 hours

        // Select a random Lombardy location
        const randomLocation = lombardyLocations[Math.floor(Math.random() * lombardyLocations.length)];
        const fullAddress = `${randomLocation.address}, ${randomLocation.zip} ${randomLocation.city} ${randomLocation.province}, Italia`;

        additionalInterventions.push({
            id: i,
            title: `Intervento di manutenzione #${i} - ${randomLocation.city}`,
            description: `Descrizione generica per l'intervento numero ${i} presso ${randomLocation.city}.`,
            address: fullAddress,
            coordinates: { 
                lat: lombardyBoundingBox.minLat + Math.random() * (lombardyBoundingBox.maxLat - lombardyBoundingBox.minLat),
                lng: lombardyBoundingBox.minLng + Math.random() * (lombardyBoundingBox.maxLng - lombardyBoundingBox.minLng)
            },
            client,
            assetId: Math.random() > 0.5 ? mockAssets[Math.floor(Math.random() * mockAssets.length)].id : null, // Randomly assign an asset or null
            assignedTeamId: team.id,
            assignedTeamIds: [team.id],
            teamsDetails: status === InterventionStatus.IN_PROGRESS ? [
                {
                    teamId: team.id,
                    teamName: team.name,
                    attendance: team.memberIds.map(memberId => {
                        const member = mockPersonnel.find(p => p.id === memberId)!;
                        return {
                            memberId,
                            name: member.name,
                            role: member.role,
                            isPresent: Math.random() > 0.2, // 80% chance of being present
                            modifiedBy: 'Sistema',
                            modifiedAt: update.toISOString()
                        };
                    }),
                    externalMembers: [],
                    vehiclesUsed: Math.random() > 0.3 ? [mockVehicles[Math.floor(Math.random() * mockVehicles.length)].id] : [], // 70% chance of having a vehicle
                    lastModified: update.toISOString(),
                    modifiedBy: 'Sistema'
                }
            ] : [],
            status,
            priority,
            creationDate: creation.toISOString(),
            scheduledStartDate: start.toISOString(),
            scheduledEndDate: end.toISOString(),
            lastUpdate: update.toISOString(),
            history: [{ timestamp: creation.toISOString(), user: 'Sistema', description: 'Intervento creato.' }],
            economicDetails: {
                materialsCost: parseFloat((Math.random() * 50).toFixed(2)),
                laborCost: parseFloat((Math.random() * 100 + 50).toFixed(2)),
                extraCharges: Math.random() > 0.7 ? parseFloat((Math.random() * 20).toFixed(2)) : 0, // Some interventions have extra charges
                vatPercentage: 22,
                status: PaymentStatus.TO_BE_INVOICED,
            },
            materials: [], // Keeping materials empty for generated interventions for brevity
            attachments: [], // Keeping attachments empty for generated interventions for brevity
        });
    }
    return additionalInterventions;
}

mockInterventions.push(...generateMoreInterventions());