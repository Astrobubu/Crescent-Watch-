/**
 * Crescent Watch - Hijri Calendar Utilities
 */

export interface HijriDate {
    year: number;
    month: number;
    day: number;
    monthName: string;
    monthNameAr: string;
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

/**
 * Convert Gregorian date to Hijri using Intl API (Umm al-Qura calendar)
 */
export function toHijri(date: Date): HijriDate {
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
        monthName: HIJRI_MONTHS[month - 1] || '',
        monthNameAr: HIJRI_MONTHS_AR[month - 1] || ''
    };
}

/**
 * Get estimated observation dates for a Hijri month
 * Uses synodic month calculation from a reference new moon
 */
export function getObservationDates(hijriYear: number, hijriMonth: number): Date[] {
    // Reference: New moon on January 29, 2025 at roughly 12:36 UTC
    // This corresponds to Sha'ban 1446
    const referenceNewMoon = new Date(Date.UTC(2025, 0, 29, 12, 36, 0));
    const referenceHijriYear = 1446;
    const referenceHijriMonth = 8; // Sha'ban

    const synodicMonth = 29.530588853; // Mean synodic month in days

    // Calculate months difference from reference
    const refMonthsFromEpoch = (referenceHijriYear - 1) * 12 + (referenceHijriMonth - 1);
    const targetMonthsFromEpoch = (hijriYear - 1) * 12 + (hijriMonth - 1);
    const monthsDiff = targetMonthsFromEpoch - refMonthsFromEpoch;

    // Calculate target new moon date
    const daysDiff = monthsDiff * synodicMonth;
    const targetNewMoon = new Date(referenceNewMoon.getTime() + daysDiff * 24 * 60 * 60 * 1000);

    // Return potential observation dates (evening of new moon and next 2 days)
    const dates: Date[] = [];
    for (let i = 0; i <= 2; i++) {
        const d = new Date(targetNewMoon);
        d.setDate(d.getDate() + i);
        dates.push(d);
    }

    return dates;
}

/**
 * Format Hijri date for display
 */
export function formatHijriDate(hijri: HijriDate, lang: 'en' | 'ar' = 'en'): string {
    const monthName = lang === 'ar' ? hijri.monthNameAr : hijri.monthName;

    if (lang === 'ar') {
        return `${hijri.day} ${monthName} ${hijri.year}`;
    }

    return `${hijri.day} ${monthName} ${hijri.year} AH`;
}

/**
 * Get the next Hijri month from current date
 */
export function getNextHijriMonth(date: Date = new Date()): { year: number; month: number } {
    const hijri = toHijri(date);

    if (hijri.month === 12) {
        return { year: hijri.year + 1, month: 1 };
    }

    return { year: hijri.year, month: hijri.month + 1 };
}
