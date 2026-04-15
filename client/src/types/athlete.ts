export interface AthleteStats {
  goals?: number;
  assists?: number;
  matches?: number;
  yellowCards?: number;
  redCards?: number;
  minutesPlayed?: number;
  saves?: number; // for goalkeepers
  cleanSheets?: number; // for goalkeepers
  tackles?: number;
  passes?: number;
  passAccuracy?: number;
  shotsOnTarget?: number;
  [key: string]: number | undefined; // Allow for custom stats
}

export interface AthleteComputedStats extends AthleteStats {
  averageRating?: number;
  attendanceRate?: number;
  fouls?: number;
}

export interface AthleteProfileStatsSnapshot {
  stats: AthleteComputedStats;
  source: "performance" | "events" | "athlete";
  updatedAt?: string | null;
}

export interface AthleteMedia {
  id: string;
  url: string;
  type: "photo" | "video";
  caption?: string;
  uploadedAt: string;
  size?: number;
  mimeType?: string;
}

export interface AthleteContact {
  email?: string;
  phone?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  address?: {
    street?: string;
    city?: string;
    county?: string;
    country?: string;
    postalCode?: string;
  };
}

export interface Athlete {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  dateOfBirth?: string;
  position?: string;
  bio?: string;
  stats?: AthleteStats;
  media?: AthleteMedia[];
  contact?: AthleteContact;

  // Location information
  location?: string;
  county?: string; // Liberia counties

  // Sports information
  sport: string;
  level: "grassroots" | "semi-pro" | "professional";

  // Status and scouting
  scoutingStatus: "active" | "scouted" | "signed" | "inactive";
  trainingProgram?: string;
  performanceNotes?: string;

  // System fields
  status: "active" | "inactive" | "suspended";
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;

  // Additional fields
  height?: number; // in cm
  weight?: number; // in kg
  preferredFoot?: "left" | "right" | "both";
  nationality?: string;
  previousClubs?: string[];
  achievements?: string[];
  medicalInfo?: {
    allergies?: string[];
    injuries?: string[];
    conditions?: string[];
    bloodType?: string;
    medicalClearance?: boolean;
    lastMedicalCheck?: string;
    notes?: string;
  };

  // Social media
  socialMedia?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    tiktok?: string;
  };
}

export interface AthleteFilters {
  search: string;
  sport: string;
  level: string;
  county: string;
  scoutingStatus: string;
  ageRange: {
    min?: number;
    max?: number;
  };
  position: string;
}

export interface AthleteFormData {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age: string;
  dateOfBirth: string;
  position: string;
  bio: string;
  // Basic stats inputs (string to ease form handling)
  goals?: string;
  assists?: string;
  matches?: string;
  location: string;
  county: string;
  sport: string;
  level: string;
  scoutingStatus: string;
  trainingProgram: string;
  performanceNotes: string;
  height: string;
  weight: string;
  preferredFoot: string;
  nationality: string;
  previousClubs: string;
  achievements: string;
  instagram: string;
  twitter: string;
  facebook: string;
}

// Liberia Counties
export const LIBERIA_COUNTIES = [
  "Bomi",
  "Bong",
  "Gbarpolu",
  "Grand Bassa",
  "Grand Cape Mount",
  "Grand Gedeh",
  "Grand Kru",
  "Lofa",
  "Margibi",
  "Maryland",
  "Montserrado",
  "Nimba",
  "River Cess",
  "River Gee",
  "Sinoe",
] as const;

export type LiberiaCounty = (typeof LIBERIA_COUNTIES)[number];

// Sports available
export const SPORTS = [
  "football",
  "basketball",
  "athletics",
  "volleyball",
  "tennis",
  "boxing",
  "swimming",
] as const;

export type Sport = (typeof SPORTS)[number];

// Football positions
export const FOOTBALL_POSITIONS = [
  "Goalkeeper",
  "Centre-Back",
  "Left-Back",
  "Right-Back",
  "Defensive Midfielder",
  "Central Midfielder",
  "Attacking Midfielder",
  "Left Winger",
  "Right Winger",
  "Centre-Forward",
  "Striker",
] as const;

export type FootballPosition = (typeof FOOTBALL_POSITIONS)[number];

// Basketball positions
export const BASKETBALL_POSITIONS = [
  "Point Guard",
  "Shooting Guard",
  "Small Forward",
  "Power Forward",
  "Center",
] as const;

export type BasketballPosition = (typeof BASKETBALL_POSITIONS)[number];

// Athletics events
export const ATHLETICS_EVENTS = [
  "100m",
  "200m",
  "400m",
  "800m",
  "1500m",
  "5000m",
  "10000m",
  "Marathon",
  "Hurdles",
  "Long Jump",
  "High Jump",
  "Pole Vault",
  "Shot Put",
  "Discus",
  "Javelin",
  "Hammer Throw",
] as const;

export type AthleticsEvent = (typeof ATHLETICS_EVENTS)[number];

// User roles for permission checking
export interface UserRole {
  role: "admin" | "statistician" | "manager" | "coach" | "athlete" | "viewer";
  permissions: {
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canView: boolean;
    canExport: boolean;
    canImport: boolean;
  };
}

// Pagination interface
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// Bulk action types
export type BulkActionType =
  | "export"
  | "delete"
  | "updateStatus"
  | "updateLevel"
  | "assignProgram";

export interface BulkAction {
  type: BulkActionType;
  athleteIds: string[];
  data?: Record<string, unknown>;
}
