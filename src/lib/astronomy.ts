/**
 * Crescent Watch - Astronomy Calculations
 * 
 * Pure TypeScript implementation using the Astronomy Engine library.
 * Provides moon visibility calculations using Yallop and Odeh criteria.
 */

import * as Astronomy from 'astronomy-engine';

// Constants
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const EARTH_RADIUS_KM = 6378.137;

// Types
export interface VisibilityPoint {
    lat: number;
    lon: number;
    color: 'green' | 'yellow' | 'orange' | 'red';
    moonAlt?: number;
    sunAlt?: number;
    elongation?: number;
    odehZone?: 'A' | 'B' | 'C' | 'D';
    yallopClass?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
}

export interface MoonSunData {
    sunAlt: number;
    sunAz: number;
    moonAlt: number;
    moonAz: number;
    elongation: number;
    moonDistKm: number;
    illumination: number;
}

export interface SimulationPoint {
    timeOffsetMin: number;
    sunAlt: number;
    sunAz: number;
    moonAlt: number;
    moonAz: number;
    illumination: number;
    elongation: number;
    tilt: number;
}

export interface OdehResult {
    v: number;
    zone: 'A' | 'B' | 'C' | 'D';
    visibility: 'naked_eye' | 'optical_aid' | 'not_visible';
}

export interface YallopResult {
    q: number;
    cls: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
    visibility: string;
}

/**
 * Find sunset time for a given location and date
 * Uses LOCAL date based on longitude to avoid dateline cutoff
 */
export function findSunset(
    lat: number,
    lon: number,
    year: number,
    month: number,
    day: number
): Astronomy.AstroTime | null {
    const observer = new Astronomy.Observer(lat, lon, 0);

    // Calculate timezone offset from longitude (approximate: 15° = 1 hour)
    const tzOffsetHours = Math.round(lon / 15);

    // Create local noon for this location
    // Start at 12:00 UTC, then adjust by timezone offset
    const localNoonUTC = new Date(Date.UTC(year, month - 1, day, 12 - tzOffsetHours, 0, 0));
    const startTime = Astronomy.MakeTime(localNoonUTC);

    // Search for next sunset (-1 = setting)
    const sunset = Astronomy.SearchRiseSet(
        Astronomy.Body.Sun,
        observer,
        -1,
        startTime,
        1
    );

    return sunset;
}

/**
 * Find moonset time for a given location and date
 */
export function findMoonset(
    lat: number,
    lon: number,
    startTime: Astronomy.AstroTime
): Astronomy.AstroTime | null {
    const observer = new Astronomy.Observer(lat, lon, 0);

    const moonset = Astronomy.SearchRiseSet(
        Astronomy.Body.Moon,
        observer,
        -1,
        startTime,
        1
    );

    return moonset;
}

/**
 * Get Moon and Sun positions at a specific time
 */
export function getMoonSunData(
    lat: number,
    lon: number,
    time: Astronomy.AstroTime
): MoonSunData {
    const observer = new Astronomy.Observer(lat, lon, 0);

    // Sun position
    const sunEquator = Astronomy.Equator(Astronomy.Body.Sun, time, observer, true, true);
    const sunHorizon = Astronomy.Horizon(time, observer, sunEquator.ra, sunEquator.dec, 'normal');

    // Moon position
    const moonEquator = Astronomy.Equator(Astronomy.Body.Moon, time, observer, true, true);
    const moonHorizon = Astronomy.Horizon(time, observer, moonEquator.ra, moonEquator.dec, 'normal');

    // Elongation (angular separation between Sun and Moon)
    const elongation = Astronomy.AngleBetween(
        Astronomy.GeoVector(Astronomy.Body.Sun, time, true),
        Astronomy.GeoVector(Astronomy.Body.Moon, time, true)
    );

    // Moon distance in km
    const moonGeo = Astronomy.GeoVector(Astronomy.Body.Moon, time, true);
    const moonDistAU = Math.sqrt(moonGeo.x * moonGeo.x + moonGeo.y * moonGeo.y + moonGeo.z * moonGeo.z);
    const moonDistKm = moonDistAU * 149597870.7;

    // Illumination
    const illum = Astronomy.Illumination(Astronomy.Body.Moon, time);

    return {
        sunAlt: sunHorizon.altitude,
        sunAz: sunHorizon.azimuth,
        moonAlt: moonHorizon.altitude,
        moonAz: moonHorizon.azimuth,
        elongation,
        moonDistKm,
        illumination: illum.phase_fraction
    };
}

/**
 * Calculate crescent semi-width in arcminutes
 * Matches the original Python implementation exactly
 */
export function calcCrescentWidth(
    arclDeg: number,
    moonAltDeg: number,
    distKm: number
): number {
    const sinPi = Math.min(EARTH_RADIUS_KM / distKm, 1.0);
    const piRad = Math.asin(sinPi);
    const hRad = moonAltDeg * DEG2RAD;
    const sdRad = 0.27245 * piRad;
    const sdPrimeRad = sdRad * (1.0 + Math.sin(hRad) * Math.sin(piRad));
    const arclRad = arclDeg * DEG2RAD;
    const wPrimeRad = sdPrimeRad * (1.0 - Math.cos(arclRad));
    return wPrimeRad * RAD2DEG * 60.0;
}

/**
 * Yallop criterion - returns q value and classification
 */
export function yallopCriterion(
    arcl: number,
    arcv: number,
    wPrime: number
): YallopResult {
    const f = 11.8371 - 6.3226 * wPrime + 0.7319 * Math.pow(wPrime, 2) - 0.1018 * Math.pow(wPrime, 3);
    const q = (arcv - f) / 10.0;

    if (q > 0.216) {
        return { q, cls: 'A', visibility: 'naked_eye_easy' };
    } else if (q > -0.014) {
        return { q, cls: 'B', visibility: 'naked_eye_perfect' };
    } else if (q > -0.160) {
        return { q, cls: 'C', visibility: 'mixed_optical_helpful' };
    } else if (q > -0.232) {
        return { q, cls: 'D', visibility: 'optical_required' };
    } else if (q > -0.293) {
        return { q, cls: 'E', visibility: 'not_visible_telescope' };
    } else {
        return { q, cls: 'F', visibility: 'not_visible' };
    }
}

/**
 * Odeh criterion - returns V value and zone
 * Reference: Mohammad Odeh's criterion from Accurate Times
 */
export function odehCriterion(arcv: number, wArcmin: number): OdehResult {
    const curve = -0.1018 * Math.pow(wArcmin, 3) +
        0.7319 * Math.pow(wArcmin, 2) -
        6.3226 * wArcmin + 7.1651;
    const v = arcv - curve;

    if (v >= 5.65) {
        return { v, zone: 'A', visibility: 'naked_eye' };
    } else if (v >= 2.0) {
        return { v, zone: 'B', visibility: 'naked_eye' };
    } else if (v >= -0.96) {
        return { v, zone: 'C', visibility: 'optical_aid' };
    } else {
        return { v, zone: 'D', visibility: 'not_visible' };
    }
}

/**
 * Map Odeh zone to display color
 */
export function zoneToColor(zone: 'A' | 'B' | 'C' | 'D'): 'green' | 'yellow' | 'orange' | 'red' {
    switch (zone) {
        case 'A': return 'green';
        case 'B': return 'yellow';
        case 'C': return 'orange';
        case 'D': return 'red';
    }
}

/**
 * Map Yallop class to display color
 */
export function yallopClassToColor(cls: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'): 'green' | 'yellow' | 'orange' | 'red' {
    switch (cls) {
        case 'A': return 'green';
        case 'B': return 'green';
        case 'C': return 'yellow';
        case 'D': return 'orange';
        case 'E': return 'red';
        case 'F': return 'red';
    }
}

export type Criterion = 'odeh' | 'yallop' | 'saao' | 'shaukat';

/**
 * SAAO criterion - South African Astronomical Observatory
 * Based on moon age and altitude
 */
export function saaoCriterion(moonAlt: number, moonAge: number): { zone: 'A' | 'B' | 'C' | 'D', color: 'green' | 'yellow' | 'orange' | 'red' } {
    // SAAO uses moon age (hours since new moon) and altitude
    // Simplified version using altitude thresholds
    if (moonAlt >= 10 && moonAge >= 24) {
        return { zone: 'A', color: 'green' };
    } else if (moonAlt >= 6 && moonAge >= 18) {
        return { zone: 'B', color: 'yellow' };
    } else if (moonAlt >= 3 && moonAge >= 15) {
        return { zone: 'C', color: 'orange' };
    } else {
        return { zone: 'D', color: 'red' };
    }
}

/**
 * Shaukat criterion - Khalid Shaukat's visibility criterion
 * Based on elongation and altitude
 */
export function shaukatCriterion(elongation: number, moonAlt: number): { zone: 'A' | 'B' | 'C' | 'D', color: 'green' | 'yellow' | 'orange' | 'red' } {
    // Shaukat uses elongation > 10° as minimum
    if (elongation < 10) {
        return { zone: 'D', color: 'red' };
    }

    if (moonAlt >= 8 && elongation >= 12) {
        return { zone: 'A', color: 'green' };
    } else if (moonAlt >= 5 && elongation >= 10) {
        return { zone: 'B', color: 'yellow' };
    } else if (moonAlt >= 2 && elongation >= 8) {
        return { zone: 'C', color: 'orange' };
    } else {
        return { zone: 'D', color: 'red' };
    }
}

/**
 * Calculate visibility for a single point
 */
export function calculateVisibilityPoint(
    lat: number,
    lon: number,
    year: number,
    month: number,
    day: number,
    criterion: Criterion = 'odeh'
): VisibilityPoint | null {
    try {
        // Find sunset
        const sunset = findSunset(lat, lon, year, month, day);
        if (!sunset) {
            return { lat, lon, color: 'red' }; // No sunset (polar region)
        }

        // Get moon/sun data at sunset
        const data = getMoonSunData(lat, lon, sunset);

        // Calculate derived values
        const arcl = data.elongation;
        const arcv = data.moonAlt - data.sunAlt;
        const wPrime = calcCrescentWidth(arcl, data.moonAlt, data.moonDistKm);

        // Apply all criteria
        const odeh = odehCriterion(arcv, wPrime);
        const yallop = yallopCriterion(arcl, arcv, wPrime);
        // For SAAO and Shaukat, we use simplified versions
        const saao = saaoCriterion(data.moonAlt, 20); // Approximate moon age
        const shaukat = shaukatCriterion(arcl, data.moonAlt);

        // Moon below horizon at sunset = not visible
        if (data.moonAlt < 0) {
            return {
                lat,
                lon,
                color: 'red',
                moonAlt: data.moonAlt,
                sunAlt: data.sunAlt,
                elongation: arcl,
                odehZone: 'D',
                yallopClass: 'F'
            };
        }

        // Choose color based on selected criterion
        let color: 'green' | 'yellow' | 'orange' | 'red';
        switch (criterion) {
            case 'odeh':
                color = zoneToColor(odeh.zone);
                break;
            case 'yallop':
                color = yallopClassToColor(yallop.cls);
                break;
            case 'saao':
                color = saao.color;
                break;
            case 'shaukat':
                color = shaukat.color;
                break;
            default:
                color = zoneToColor(odeh.zone);
        }

        return {
            lat,
            lon,
            color,
            moonAlt: data.moonAlt,
            sunAlt: data.sunAlt,
            elongation: arcl,
            odehZone: odeh.zone,
            yallopClass: yallop.cls
        };
    } catch (error) {
        console.error(`Error calculating visibility for (${lat}, ${lon}):`, error);
        return { lat, lon, color: 'red' };
    }
}

/**
 * Generate visibility grid for the entire world
 */
export function generateVisibilityGrid(
    year: number,
    month: number,
    day: number,
    options: {
        stepDeg?: number;
        maxLat?: number;
        criterion?: Criterion;
        onProgress?: (progress: number) => void;
    } = {}
): VisibilityPoint[] {
    const { stepDeg = 2, maxLat = 60, criterion = 'odeh', onProgress } = options;

    const points: VisibilityPoint[] = [];
    const lats: number[] = [];
    const lons: number[] = [];

    // Build coordinate arrays
    for (let lat = -maxLat; lat <= maxLat; lat += stepDeg) {
        lats.push(lat);
    }
    for (let lon = -180; lon < 180; lon += stepDeg) {
        lons.push(lon);
    }

    const totalPoints = lats.length * lons.length;
    let processedPoints = 0;

    // Calculate visibility for each point
    for (const lat of lats) {
        for (const lon of lons) {
            const point = calculateVisibilityPoint(lat, lon, year, month, day, criterion);
            if (point) {
                points.push(point);
            }

            processedPoints++;
            if (onProgress && processedPoints % 100 === 0) {
                onProgress(Math.round((processedPoints / totalPoints) * 100));
            }
        }
    }

    if (onProgress) {
        onProgress(100);
    }

    return points;
}

/**
 * Generate simulation trajectory for a location
 * Returns moon/sun positions from sunset to moonset
 */
export function getSimulationTrajectory(
    lat: number,
    lon: number,
    year: number,
    month: number,
    day: number
): { sunsetIso: string; trajectory: SimulationPoint[] } | null {
    try {
        const sunset = findSunset(lat, lon, year, month, day);
        if (!sunset) {
            return null;
        }

        const trajectory: SimulationPoint[] = [];
        const observer = new Astronomy.Observer(lat, lon, 0);

        // Generate 75 minutes of data (every 2 minutes)
        for (let i = 0; i <= 75; i += 2) {
            const offsetMs = i * 60 * 1000; // Convert minutes to milliseconds
            const timeDate = new Date(sunset.date.getTime() + offsetMs);
            const time = Astronomy.MakeTime(timeDate);

            // Get positions
            const sunEquator = Astronomy.Equator(Astronomy.Body.Sun, time, observer, true, true);
            const sunHorizon = Astronomy.Horizon(time, observer, sunEquator.ra, sunEquator.dec, 'normal');

            const moonEquator = Astronomy.Equator(Astronomy.Body.Moon, time, observer, true, true);
            const moonHorizon = Astronomy.Horizon(time, observer, moonEquator.ra, moonEquator.dec, 'normal');

            const elongation = Astronomy.AngleBetween(
                Astronomy.GeoVector(Astronomy.Body.Sun, time, true),
                Astronomy.GeoVector(Astronomy.Body.Moon, time, true)
            );

            const illum = Astronomy.Illumination(Astronomy.Body.Moon, time);

            // Calculate tilt (angle from zenith to sun relative to moon)
            const dy = sunHorizon.altitude - moonHorizon.altitude;
            const dx = (sunHorizon.azimuth - moonHorizon.azimuth) * Math.cos(moonHorizon.altitude * DEG2RAD);
            const tiltFromRight = Math.atan2(dy, dx) * RAD2DEG;

            trajectory.push({
                timeOffsetMin: i,
                sunAlt: sunHorizon.altitude,
                sunAz: sunHorizon.azimuth,
                moonAlt: moonHorizon.altitude,
                moonAz: moonHorizon.azimuth,
                illumination: illum.phase_fraction,
                elongation,
                tilt: 90 - tiltFromRight // Convert to angle from zenith
            });
        }

        return {
            sunsetIso: sunset.date.toISOString(),
            trajectory
        };
    } catch (error) {
        console.error('Error generating simulation trajectory:', error);
        return null;
    }
}
