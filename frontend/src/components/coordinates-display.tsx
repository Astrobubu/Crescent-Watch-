import { useLanguage } from '@/lib/i18n';

interface CoordinatesDisplayProps {
    lat: number | null;
    lon: number | null;
}

export default function CoordinatesDisplay({ lat, lon }: CoordinatesDisplayProps) {
    const { t } = useLanguage();

    if (lat === null || lon === null) {
        return null;
    }

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-zinc-900/90 backdrop-blur border border-zinc-800 shadow-lg text-white px-3 py-1.5 rounded-md text-xs font-mono pointer-events-none">
            {t('coords.lat')}: {lat.toFixed(2)}°, {t('coords.lon')}: {lon.toFixed(2)}°
        </div>
    );
}
