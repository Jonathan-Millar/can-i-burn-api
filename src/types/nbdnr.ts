export interface GPSCoordinates {
  latitude: number;
  longitude: number;
}

export interface Location {
  province: string;
  state: string;
  county: string;
  country: string;
}

export enum FireStatus {
  NO_BURN = 0,
  RESTRICTED_BURN = 1,
  OPEN_BURN = 2
}

export interface FireWatchResponse {
  status: FireStatus;
  valid_from: Date;
  valid_to: Date;
  location: Location;
  coordinates: GPSCoordinates;
  jurisdiction?: string;
  restrictions?: string[];
}

export interface NBDNRBurnCategory {
  NAME: string;
  PUBLICCATEGORY: number;
  VALIDDATE: number;
}

// NBDNR Public Category mappings based on the dashboard definitions
export enum NBDNRPublicCategory {
  OUT_OF_CONTROL = 0,
  CONTAINED = 1,
  UNDER_CONTROL = 2,
  PATROLLED = 3,
  OUT = 4
}