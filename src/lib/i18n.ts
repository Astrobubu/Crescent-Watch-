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
    islamicMonth: string;
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
    illumination: string;
    visibility: string;

    // Simulation Legend
    legendAlt: string;
    legendElong: string;
    showBuildings: string;

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

    // Map Settings Options
    projEquirectangular: string;
    projEqualArea: string;
    covStandard: string;
    covExtended: string;
    covGlobal: string;
    projection: string;
    coverage: string;
    critOdeh: string;
    critYallop: string;
    critSAAO: string;
    res05: string;
    res1: string;
    res2: string;
    res3: string;
    res4: string;

    // Simulation Extra
    moonAge: string;
    azimuthDiff: string;
    timeFormat: string;
    format12h: string;
    format24h: string;
    latitude: string;
    longitude: string;

    // Errors
    noLocation: string;
    calculationError: string;

    // Settings & About
    adjustFontSize: string;
    aboutApp: string;
    aboutDesc: string;
    developedBy: string;
    projectLead: string;
    version: string;
    contact: string;
    reset: string;
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
        islamicMonth: 'Islamic Month',
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
        illumination: 'Illumination',
        visibility: 'Visibility',
        legendAlt: 'Altitude',
        legendElong: 'Elongation',
        showBuildings: 'Show Buildings',

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

        projEquirectangular: 'Equirectangular',
        projEqualArea: 'Equal Area',
        covStandard: 'Standard (±60°)',
        covExtended: 'Extended (±70°)',
        covGlobal: 'Global (±80°)',
        projection: 'Projection',
        coverage: 'Coverage',
        critOdeh: 'Odeh (2006)',
        critYallop: 'Yallop (1997)',
        critSAAO: 'SAAO (1988)',
        res05: '0.5° (Ultra High)',
        res1: '1° (High)',
        res2: '2° (Medium)',
        res3: '3° (Low)',
        res4: '4° (Fast)',

        moonAge: 'Moon Age',
        azimuthDiff: 'Azimuth Diff',
        timeFormat: 'Time Format',
        format12h: '12h',
        format24h: '24h',
        latitude: 'Latitude',
        longitude: 'Longitude',

        noLocation: 'No location selected',
        calculationError: 'Calculation failed',

        // Settings & About
        adjustFontSize: 'Adjust Font Size',
        aboutApp: 'About App',
        aboutDesc: 'Crescent Watch is a high-precision tool for predicting Islamic lunar crescent visibility.',
        developedBy: 'Developed by',
        projectLead: 'Project Lead',
        version: 'Version',
        contact: 'Contact',
        reset: 'Reset Defaults'
    },
    ar: {
        appName: 'رصد الهلال',
        calculate: 'احسب',
        calculating: 'جاري الحساب...',
        selectDate: 'اختر التاريخ',
        selectLocation: 'اختر الموقع',
        tapToSelect: 'انقر على الخريطة لاختيار الموقع',
        resolution: 'الدقة',
        lowRes: 'سريع (4°)',
        medRes: 'متوسط (2°)',
        highRes: 'عالي (1°)',
        settings: 'الإعدادات',
        language: 'اللغة',
        criterion: 'المعيار',
        islamicMonth: 'الشهر الهجري',
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
        illumination: 'الإضاءة',
        visibility: 'الرؤية',
        legendAlt: 'الارتفاع',
        legendElong: 'الاستطالة',
        showBuildings: 'إظهار المباني',

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

        projEquirectangular: 'مستطيل',
        projEqualArea: 'متساوي المساحة',
        covStandard: 'قياسي (±60°)',
        covExtended: 'موسع (±70°)',
        covGlobal: 'عالمي (±80°)',
        projection: 'الإسقاط',
        coverage: 'التغطية',
        critOdeh: 'عودة (2006)',
        critYallop: 'يالوب (1997)',
        critSAAO: 'جنوب أفريقيا (1988)',
        res05: '0.5° (دقة فائقة)',
        res1: '1° (دقة عالية)',
        res2: '2° (دقة متوسطة)',
        res3: '3° (دقة منخفضة)',
        res4: '4° (سريع)',

        moonAge: 'عمر القمر',
        azimuthDiff: 'فرق السمت',
        timeFormat: 'تنسيق الوقت',
        format12h: '12 ساعة',
        format24h: '24 ساعة',
        latitude: 'خط العرض',
        longitude: 'خط الطول',

        noLocation: 'لم يتم تحديد موقع',
        calculationError: 'فشل الحساب',

        // Settings & About
        adjustFontSize: 'حجم الخط',
        aboutApp: 'عن التطبيق',
        aboutDesc: 'رصد الهلال هي أداة عالية الدقة للتنبؤ بإمكانية رؤية الهلال القمري.',
        developedBy: 'تطوير',
        projectLead: 'إشراف',
        version: 'الإصدار',
        contact: 'تواصل معنا',
        reset: 'المعدلات الافتراضية'
    }
};

export function getTranslations(locale: Locale): Translations {
    return translations[locale];
}

export function isRTL(locale: Locale): boolean {
    return locale === 'ar';
}
