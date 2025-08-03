// Dichiarazione globale per gli oggetti mappa
declare global {
    interface Window {
        L: any;      // Per Leaflet
    }
}

export enum InterventionStatus {
    NEW = 'Nuovo',
    PENDING = 'In Attesa',
    IN_PROGRESS = 'In Corso',
    COMPLETED = 'Completato',
    CANCELED = 'Annullato'
}

export enum Priority {
    LOW = 'Bassa',
    MEDIUM = 'Media',
    HIGH = 'Alta',
    URGENT = 'Urgente'
}

export enum ClientType {
    PRIVATE = 'Privato',
    COMPANY = 'Azienda',
    PUBLIC_ENTITY = 'Ente Pubblico',
    MUNICIPALITY = 'Comune',
    REGION = 'Regione'
}

export enum PaymentStatus {
    TO_BE_INVOICED = 'Da Fatturare',
    ISSUED = 'Emessa',
    PAID = 'Pagata',
    OVERDUE = 'Scaduta'
}

export enum PersonnelRole {
    TECHNICIAN = 'Tecnico',
    APPRENTICE = 'Apprendista',
    TEAM_LEADER = 'Capo Squadra',
    SPECIALIST = 'Specialista'
}

export enum PersonnelStatus {
    ACTIVE = 'Attivo',
    ON_LEAVE = 'In Permesso',
    SUSPENDED = 'Sospeso',
}

export enum VehicleType {
    VAN = 'Furgone',
    CAR = 'Auto',
    TRUCK = 'Camion'
}

export enum VehicleStatus {
    AVAILABLE = 'Disponibile',
    IN_USE = 'In Intervento',
    MAINTENANCE = 'In Manutenzione'
}


export interface EconomicDetails {
    materialsCost: number;
    laborCost: number;
    extraCharges: number;
    vatPercentage: number; // e.g., 22 for 22%
    status: PaymentStatus;
}

export interface UsedMaterial {
    id: string;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    unit: string;
}

export interface Attachment {
    id: string;
    type: 'image' | 'document';
    url: string;
    description: string;
    timestamp: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
}

export interface Asset {
    id: number;
    name: string;
    brand: string;
    model: string;
    serialNumber: string;
    clientId: number;
}

export interface Client {
    id: number;
    name: string;
    phone: string;
    email: string;
    type: ClientType;
    fiscalCode?: string; // Codice Fiscale
    vatNumber?: string;  // Partita IVA
}

export interface Coordinates {
    lat: number;
    lng: number;
}

export type PreviewCoordinates = Coordinates;

export interface Personnel {
    id: number;
    name: string;
    role: PersonnelRole;
    status: PersonnelStatus;
    phone: string;
    email: string;
}

export interface Vehicle {
    id: number;
    name: string;
    licensePlate: string;
    type: VehicleType;
    status: VehicleStatus;
    position: Coordinates;
    equipment: string[];
}

export interface Team {
    id: number;
    name: string;
    memberIds: number[];
    // Removed vehicleId - teams can use multiple vehicles
}

// New types for team attendance tracking
export interface TeamMemberAttendance {
    memberId: number;
    name: string;
    role: PersonnelRole;
    isPresent: boolean;
    modifiedBy?: string;
    modifiedAt?: string;
}

export interface ExternalMember {
    id: string; // UUID for external members
    name: string;
    role: string;
    company?: string;
    phone?: string;
    addedBy: string;
    addedAt: string;
}

export interface InterventionTeamDetails {
    teamId: number;
    teamName: string;
    attendance: TeamMemberAttendance[];
    externalMembers: ExternalMember[];
    vehiclesUsed: number[]; // Array of vehicle IDs used
    lastModified?: string;
    modifiedBy?: string;
}

export interface ActivityLog {
    timestamp: string;
    user: string; // "Sistema", "Admin", o nome del tecnico
    description: string;
}

export interface Intervention {
    id: number;
    title: string;
    description: string;
    address: string;
    coordinates: Coordinates;
    client: Client;
    assetId: number | null;
    assignedTeamId: number | null; // Primary team (for backward compatibility)
    assignedTeamIds: number[]; // Multiple teams support
    teamsDetails: InterventionTeamDetails[]; // Details for each team
    status: InterventionStatus;
    priority: Priority;
    creationDate: string;
    scheduledStartDate?: string;
    scheduledEndDate?: string;
    lastUpdate: string;
    notes?: string;
    history: ActivityLog[];
    economicDetails: EconomicDetails;
    materials: UsedMaterial[];
    attachments: Attachment[];
}

export type PrecisionLevel = 'Rooftop' | 'StreetAddress' | 'Street' | 'City' | 'Unknown';

export type GeolocationProvider = 'google-maps-scraper' | 'opencage' | 'overpass' | 'photon' | 'nominatim';

export interface AddressSuggestion {
    displayName: string;
    coordinates: Coordinates;
    provider: GeolocationProvider;
    confidence: number;
    hasHouseNumber: boolean;
    precision: PrecisionLevel;
}

export type MapService = 'leaflet' | 'none' | 'initializing';

export type MapStyle = 'osm' | 'carto-positron';

export type MapOverlay = 'standard' | 'cluster' | 'heatmap';

export interface OptimizedRouteStop {
    order: number;
    interventionId: number;
    title: string;
    address: string;
    coordinates: Coordinates;
    estimatedTravelTimeMinutes: number;
    estimatedDistanceKm: number;
}

export interface OptimizedRoute {
    technicianId: number;
    stops: OptimizedRouteStop[];
    totalEstimatedTimeMinutes: number;
    totalEstimatedDistanceKm: number;
}