import { GPSCoordinates, FireWatchResponse, FireStatus, Location, NBDNRBurnCategory, NBDNRPublicCategory } from '../types/nbdnr.ts';

interface ArcGISError {
  code: number;
  message: string;
  details?: string[];
}

interface ArcGISFeature {
  attributes: NBDNRBurnCategory;
}

interface ArcGISQueryResponse {
  features: ArcGISFeature[];
  error?: ArcGISError;
}

export class NBDNRService {
  private readonly baseUrl = 'https://gis-erd-der.gnb.ca/gisserver/rest/services/FireWeather/BurnCategories/MapServer/0';
  private readonly userAgent = 'CanIBurnAPI/1.0';

  /**
   * Get fire watch status for given coordinates from NBDNR data
   */
  async getFireWatchStatus(coordinates: GPSCoordinates): Promise<FireWatchResponse> {
    this.validateCoordinates(coordinates);

    try {
      const burnCategory = await this.queryBurnCategory(coordinates);
      
      if (!burnCategory) {
        // If no data found, assume it's outside New Brunswick or no restrictions
        return this.createDefaultResponse(coordinates);
      }

      return this.mapToFireWatchResponse(burnCategory, coordinates);
    } catch (error) {
      console.error('Error fetching NBDNR fire watch data:', error);
      throw new Error('Failed to fetch fire watch data from NBDNR service');
    }
  }

  /**
   * Query NBDNR ArcGIS service for burn category at given coordinates
   */
  private async queryBurnCategory(coordinates: GPSCoordinates): Promise<NBDNRBurnCategory | null> {
    const { latitude, longitude } = coordinates;
    
    const queryParams = new URLSearchParams({
      geometry: `${longitude},${latitude}`,
      geometryType: 'esriGeometryPoint',
      spatialRel: 'esriSpatialRelIntersects',
      inSR: '4326', // WGS84
      outFields: 'NAME,PUBLICCATEGORY,VALIDDATE',
      f: 'json'
    });

    const url = `${this.baseUrl}/query?${queryParams}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': this.userAgent
      }
    });

    if (!response.ok) {
      throw new Error(`NBDNR service responded with status: ${response.status}`);
    }

    const data = await response.json() as ArcGISQueryResponse;
    
    if (data.error) {
      throw new Error(`NBDNR service error: ${data.error.message}`);
    }

    if (!data.features || data.features.length === 0) {
      return null;
    }

    return data.features[0].attributes;
  }

  /**
   * Map NBDNR burn category to FireWatchResponse
   */
  private mapToFireWatchResponse(burnCategory: NBDNRBurnCategory, coordinates: GPSCoordinates): FireWatchResponse {
    const status = this.mapPublicCategoryToFireStatus(burnCategory.PUBLICCATEGORY);
    const validDate = new Date(burnCategory.VALIDDATE);
    
    // Create a valid_to date (assuming valid for 24 hours)
    const validTo = new Date(validDate);
    validTo.setDate(validTo.getDate() + 1);

    const location: Location = {
      province: 'New Brunswick',
      state: 'New Brunswick',
      county: burnCategory.NAME,
      country: 'Canada'
    };

    const restrictions = this.getRestrictionsForCategory(burnCategory.PUBLICCATEGORY);

    return {
      status,
      valid_from: validDate,
      valid_to: validTo,
      location,
      coordinates,
      jurisdiction: 'New Brunswick Department of Natural Resources and Energy Development',
      restrictions
    };
  }

  /**
   * Map NBDNR public category to FireStatus enum
   */
  private mapPublicCategoryToFireStatus(publicCategory: number): FireStatus {
    switch (publicCategory) {
      case NBDNRPublicCategory.OUT_OF_CONTROL:
      case NBDNRPublicCategory.CONTAINED:
        return FireStatus.NO_BURN; // Active fires = no burning allowed
      case NBDNRPublicCategory.UNDER_CONTROL:
      case NBDNRPublicCategory.PATROLLED:
        return FireStatus.RESTRICTED_BURN; // Controlled fires = restricted burning
      case NBDNRPublicCategory.OUT:
      default:
        return FireStatus.OPEN_BURN; // No active fires = open burning (subject to other restrictions)
    }
  }

  /**
   * Get restrictions based on public category
   */
  private getRestrictionsForCategory(publicCategory: number): string[] {
    switch (publicCategory) {
      case NBDNRPublicCategory.OUT_OF_CONTROL:
        return [
          'No burning permitted - active uncontrolled fires in area',
          'High fire danger conditions',
          'Contact local authorities before any outdoor activities'
        ];
      case NBDNRPublicCategory.CONTAINED:
        return [
          'No burning permitted - active contained fires in area',
          'Fire crews actively working in area',
          'Elevated fire danger conditions'
        ];
      case NBDNRPublicCategory.UNDER_CONTROL:
        return [
          'Restricted burning only',
          'Fires under control but still active',
          'Check local fire weather conditions',
          'Have suppression equipment ready'
        ];
      case NBDNRPublicCategory.PATROLLED:
        return [
          'Restricted burning - area under fire patrol',
          'Monitor weather conditions closely',
          'Have suppression equipment ready',
          'Notify local fire department of burning activities'
        ];
      case NBDNRPublicCategory.OUT:
      default:
        return [
          'Follow standard fire safety practices',
          'Check current fire weather conditions',
          'Obtain required permits',
          'Have suppression equipment available'
        ];
    }
  }

  /**
   * Create default response for areas outside New Brunswick or with no data
   */
  private createDefaultResponse(coordinates: GPSCoordinates): FireWatchResponse {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const location: Location = {
      province: 'Unknown',
      state: 'Unknown',
      county: 'Unknown',
      country: 'Canada'
    };

    return {
      status: FireStatus.OPEN_BURN,
      valid_from: now,
      valid_to: tomorrow,
      location,
      coordinates,
      jurisdiction: 'Outside New Brunswick jurisdiction',
      restrictions: [
        'Location outside New Brunswick',
        'Contact local fire authorities for burning restrictions',
        'Follow provincial and municipal fire regulations'
      ]
    };
  }

  /**
   * Validate GPS coordinates
   */
  private validateCoordinates(coordinates: GPSCoordinates): void {
    const { latitude, longitude } = coordinates;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new Error('Coordinates must be numbers');
    }

    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude must be between -90 and 90');
    }

    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude must be between -180 and 180');
    }
  }
}