// API client for FastAPI backend
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface VisibilityMeta {
    date: string;
    date_mode: string;
    eval_time: string;
    step_deg: number;
    max_lat: number;
    calc_time_ms: number;
}

export interface VisibilityPoint {
    lat: number;
    lon: number;
    color: 'green' | 'yellow' | 'orange' | 'red';
}

export interface VisibilityResponse {
    meta: VisibilityMeta;
    points: VisibilityPoint[];
}

export interface SimulationTrajectoryPoint {
    time_offset_min: number;
    sun_alt: number;
    sun_az: number;
    moon_alt: number;
    moon_az: number;
    illumination: number;
    elongation: number;
    tilt: number;
}

export interface SimulationResponse {
    meta: {
        lat: number;
        lon: number;
        sunset_iso: string;
        calc_time_ms: number;
    };
    trajectory: SimulationTrajectoryPoint[];
}

export async function fetchVisibility(
    year: number,
    month: number,
    day: number,
    options: {
        stepDeg?: number;
        evalTime?: 'sunset' | 'best';
        includePolar?: boolean;
        criterion?: 'yallop' | 'odeh';
    } = {},
    onProgress?: (progress: number, status: string) => void
): Promise<VisibilityResponse> {
    const {
        stepDeg = 2,
        evalTime = 'sunset',
        includePolar = false,
        criterion = 'odeh'
    } = options;

    const url = `${API_BASE}/visibility?y=${year}&m=${month}&d=${day}&step_deg=${stepDeg}&eval_time=${evalTime}&include_polar=${includePolar}&date_mode=local`;

    const res = await fetch(url);
    if (!res.ok) {
        try {
            const error = await res.json();
            throw new Error(error.error || error.detail || 'Failed to fetch visibility data');
        } catch (e) {
            throw new Error('Failed to connect to API');
        }
    }

    // Handle Streaming Response (NDJSON)
    const reader = res.body?.getReader();
    if (!reader) {
        // Fallback to normal JSON if no reader
        return res.json();
    }

    const decoder = new TextDecoder();
    let result: VisibilityResponse | null = null;
    let buffer = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            // Keep the last chunk in buffer as it might be incomplete
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const chunk = JSON.parse(line);

                    if (chunk.progress !== undefined && onProgress) {
                        onProgress(chunk.progress, chunk.status || '');
                    }

                    if (chunk.result) {
                        result = chunk.result;
                    }

                    if (chunk.error) {
                        throw new Error(chunk.error);
                    }
                } catch (e) {
                    console.warn('Error parsing stream chunk:', line);
                }
            }
        }
    } finally {
        reader.releaseLock();
    }

    if (result) return result;
    throw new Error('Stream ended without returning a result');
}

export async function fetchSimulation(
    lat: number,
    lon: number,
    year: number,
    month: number,
    day: number
): Promise<SimulationResponse> {
    const url = `${API_BASE}/simulation?lat=${lat}&lon=${lon}&y=${year}&m=${month}&d=${day}`;

    const res = await fetch(url);
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to fetch simulation data');
    }

    return res.json();
}

// Hijri calendar utilities (simple implementation)
export interface HijriDate {
    year: number;
    month: number;
    day: number;
    monthName: string;
}

export const HIJRI_MONTHS = [
    'Muharram', 'Safar', 'Rabi\' al-Awwal', 'Rabi\' al-Thani',
    'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha\'ban',
    'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
];

export const HIJRI_MONTHS_AR = [
    'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر',
    'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
    'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
];

// Simple Gregorian to Hijri conversion (approximate)
export function toHijri(date: Date): HijriDate {
    // Use Intl.DateTimeFormat for accurate conversion
    const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
    });

    const parts = formatter.formatToParts(date);
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '1');
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '1');
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '1');

    return {
        year,
        month,
        day,
        monthName: HIJRI_MONTHS[month - 1] || ''
    };
}

// Get estimated observation dates for a Hijri month
// This uses a reference new moon and calculates forward/backward
export function getObservationDates(hijriYear: number, hijriMonth: number): Date[] {
    // Reference: New moon on January 29, 2025 at roughly 12:36 UTC
    // This corresponds to Rajab 29, 1446 / start of Sha'ban 1446
    const referenceNewMoon = new Date(Date.UTC(2025, 0, 29, 12, 36, 0));
    const referenceHijriYear = 1446;
    const referenceHijriMonth = 8; // Sha'ban

    const synodicMonth = 29.530588853; // Mean synodic month in days

    // Calculate how many months from reference to target
    const refMonthsFromEpoch = (referenceHijriYear - 1) * 12 + (referenceHijriMonth - 1);
    const targetMonthsFromEpoch = (hijriYear - 1) * 12 + (hijriMonth - 1);
    const monthsDiff = targetMonthsFromEpoch - refMonthsFromEpoch;

    // Calculate the new moon date for the target month
    const daysDiff = monthsDiff * synodicMonth;
    const targetNewMoon = new Date(referenceNewMoon.getTime() + daysDiff * 24 * 60 * 60 * 1000);

    // Return 3 potential observation dates (evening before, evening of, evening after new moon)
    // Crescent observation happens in the evening after new moon
    const dates: Date[] = [];
    for (let i = 0; i <= 2; i++) {
        const d = new Date(targetNewMoon);
        d.setDate(d.getDate() + i);
        dates.push(d);
    }

    return dates;
}

