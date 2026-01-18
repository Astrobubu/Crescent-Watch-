/**
 * Crescent Watch - Internationalization
 */

export type Locale = 'en' | 'ar';

export interface Translations {
    appName: string;
    calculate: string;
    calculating: string;
    selectDate: string;
    selectLocation: string;
    tapToSelect: string;
    resolution: string;
    lowRes: string;
    medRes: string;
    highRes: string;
    settings: string;
    language: string;
    criterion: string;
    saveMap: string;
    viewSimulation: string;
    simulation: string;
    close: string;

    // Location panel
    selectedLocation: string;
    moonAltitude: string;
    sunAltitude: string;
    elongation: string;
    sunsetTime: string;
    moonsetTime: string;
    visibility: string;

    // Visibility zones
    zoneA: string;
    zoneB: string;
    zoneC: string;
    zoneD: string;
    zoneADesc: string;
    zoneBDesc: string;
    zoneCDesc: string;
    zoneDDesc: string;

    // Legend
    legend: string;
    nakedEye: string;
    mayBeVisible: string;
    opticalAid: string;
    notVisible: string;

    // Errors
    noLocation: string;
    calculationError: string;
}

const translations: Record<Locale, Translations> = {
    en: {
        appName: 'Crescent Watch',
        calculate: 'Calculate',
        calculating: 'Calculating...',
        selectDate: 'Select Date',
        selectLocation: 'Select Location',
        tapToSelect: 'Tap on map to select location',
        resolution: 'Resolution',
        lowRes: 'Fast (4°)',
        medRes: 'Medium (2°)',
        highRes: 'High (1°)',
        settings: 'Settings',
        language: 'Language',
        criterion: 'Criterion',
        saveMap: 'Save Map',
        viewSimulation: 'View Simulation',
        simulation: 'Moon Simulation',
        close: 'Close',

        selectedLocation: 'Selected Location',
        moonAltitude: 'Moon Altitude',
        sunAltitude: 'Sun Altitude',
        elongation: 'Elongation',
        sunsetTime: 'Sunset',
        moonsetTime: 'Moonset',
        visibility: 'Visibility',

        zoneA: 'Zone A',
        zoneB: 'Zone B',
        zoneC: 'Zone C',
        zoneD: 'Zone D',
        zoneADesc: 'Easily visible to naked eye',
        zoneBDesc: 'May be visible to naked eye',
        zoneCDesc: 'Optical aid required',
        zoneDDesc: 'Not visible',

        legend: 'Legend',
        nakedEye: 'Naked Eye',
        mayBeVisible: 'May Be Visible',
        opticalAid: 'Optical Aid',
        notVisible: 'Not Visible',

        noLocation: 'No location selected',
        calculationError: 'Calculation failed'
    },
    ar: {
        appName: 'رصد الهلال',
        calculate: 'احسب',
        calculating: 'جاري الحساب...',
        selectDate: 'اختر التاريخ',
        selectLocation: 'اختر الموقع',
        tapToSelect: 'انقر على الخريطة لاختيار الموقع',
        resolution: 'الدقة',
        lowRes: 'سريع (٤°)',
        medRes: 'متوسط (٢°)',
        highRes: 'عالي (١°)',
        settings: 'الإعدادات',
        language: 'اللغة',
        criterion: 'المعيار',
        saveMap: 'حفظ الخريطة',
        viewSimulation: 'عرض المحاكاة',
        simulation: 'محاكاة القمر',
        close: 'إغلاق',

        selectedLocation: 'الموقع المحدد',
        moonAltitude: 'ارتفاع القمر',
        sunAltitude: 'ارتفاع الشمس',
        elongation: 'الاستطالة',
        sunsetTime: 'غروب الشمس',
        moonsetTime: 'غروب القمر',
        visibility: 'الرؤية',

        zoneA: 'المنطقة أ',
        zoneB: 'المنطقة ب',
        zoneC: 'المنطقة ج',
        zoneD: 'المنطقة د',
        zoneADesc: 'مرئي بسهولة بالعين المجردة',
        zoneBDesc: 'قد يُرى بالعين المجردة',
        zoneCDesc: 'يتطلب أجهزة بصرية',
        zoneDDesc: 'غير مرئي',

        legend: 'دليل الألوان',
        nakedEye: 'العين المجردة',
        mayBeVisible: 'قد يُرى',
        opticalAid: 'أجهزة بصرية',
        notVisible: 'غير مرئي',

        noLocation: 'لم يتم تحديد موقع',
        calculationError: 'فشل الحساب'
    }
};

export function getTranslations(locale: Locale): Translations {
    return translations[locale];
}

export function isRTL(locale: Locale): boolean {
    return locale === 'ar';
}
