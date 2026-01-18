'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Moon, Settings, Calendar, MapPin, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  generateVisibilityGrid,
  calculateVisibilityPoint,
  getSimulationTrajectory,
  VisibilityPoint
} from '@/lib/astronomy';
import { toHijri, formatHijriDate } from '@/lib/hijri';
import { getTranslations, Locale, isRTL } from '@/lib/i18n';

// Map colors
const COLORS = {
  ocean: '#0a1628',
  land: '#162436',
  border: '#3a506b',
  green: '#22c55e',
  yellow: '#eab308',
  orange: '#f97316',
  red: '#ef4444',
  grid: 'rgba(255,255,255,0.05)',
  text: 'rgba(255,255,255,0.3)'
};

// GeoJSON types
interface GeoJSONFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: number[][][] | number[][][][];
  };
}

interface WorldData {
  features: GeoJSONFeature[];
}

export default function Home() {
  // State
  const [locale, setLocale] = useState<Locale>('en');
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  });
  const [resolution, setResolution] = useState(2);
  const [isCalculating, setIsCalculating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visibilityPoints, setVisibilityPoints] = useState<VisibilityPoint[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationData, setLocationData] = useState<VisibilityPoint | null>(null);
  const [worldData, setWorldData] = useState<WorldData | null>(null);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Translations
  const t = getTranslations(locale);
  const rtl = isRTL(locale);

  // Hijri date
  const hijriDate = toHijri(selectedDate);

  // Load world map data
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
      .then(res => res.json())
      .then(data => setWorldData(data))
      .catch(console.error);
  }, []);

  // Draw map
  const drawMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear and fill ocean
    ctx.fillStyle = COLORS.ocean;
    ctx.fillRect(0, 0, width, height);

    // Projection helper
    const project = (lon: number, lat: number): [number, number] => {
      const x = ((lon + 180) / 360) * width;
      const y = ((90 - lat) / 180) * height;
      return [x, y];
    };

    // Draw land masses
    if (worldData) {
      ctx.fillStyle = COLORS.land;
      ctx.strokeStyle = COLORS.border;
      ctx.lineWidth = 0.5;

      for (const feature of worldData.features) {
        const { type, coordinates } = feature.geometry;

        const drawPolygon = (rings: number[][][]) => {
          ctx.beginPath();
          for (const ring of rings) {
            let first = true;
            for (const coord of ring) {
              const [x, y] = project(coord[0], coord[1]);
              if (first) {
                ctx.moveTo(x, y);
                first = false;
              } else {
                ctx.lineTo(x, y);
              }
            }
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        };

        if (type === 'Polygon') {
          drawPolygon(coordinates as number[][][]);
        } else if (type === 'MultiPolygon') {
          for (const polygon of (coordinates as number[][][][])) {
            drawPolygon(polygon);
          }
        }
      }
    }

    // Draw visibility overlay
    if (visibilityPoints.length > 0) {
      const step = resolution;
      const cellW = (step / 360) * width;
      const cellH = (step / 180) * height;

      for (const point of visibilityPoints) {
        const [x, y] = project(point.lon, point.lat);
        ctx.fillStyle = COLORS[point.color];
        ctx.globalAlpha = 0.6;
        ctx.fillRect(x - cellW / 2, y - cellH / 2, cellW, cellH);
      }
      ctx.globalAlpha = 1;
    }

    // Draw grid
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 0.5;

    // Longitude lines
    for (let lon = -180; lon <= 180; lon += 30) {
      const [x] = project(lon, 0);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Latitude lines
    for (let lat = -60; lat <= 60; lat += 30) {
      const [, y] = project(0, lat);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw selected location marker
    if (selectedLocation) {
      const [x, y] = project(selectedLocation.lon, selectedLocation.lat);

      // Outer ring
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner dot
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#fbbf24';
      ctx.fill();
    }
  }, [worldData, visibilityPoints, resolution, selectedLocation]);

  // Redraw on changes
  useEffect(() => {
    drawMap();

    const handleResize = () => drawMap();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawMap]);

  // Handle map click/tap
  const handleMapClick = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const lon = (x / rect.width) * 360 - 180;
    const lat = 90 - (y / rect.height) * 180;

    // Clamp to valid range
    const clampedLat = Math.max(-60, Math.min(60, lat));
    const clampedLon = Math.max(-180, Math.min(180, lon));

    setSelectedLocation({ lat: clampedLat, lon: clampedLon });

    // Calculate visibility for this location
    const point = calculateVisibilityPoint(
      clampedLat,
      clampedLon,
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      selectedDate.getDate()
    );
    setLocationData(point);
  }, [selectedDate]);

  // Calculate visibility
  const handleCalculate = useCallback(async () => {
    setIsCalculating(true);
    setProgress(0);

    // Use setTimeout to allow UI to update
    setTimeout(() => {
      const points = generateVisibilityGrid(
        selectedDate.getFullYear(),
        selectedDate.getMonth() + 1,
        selectedDate.getDate(),
        {
          stepDeg: resolution,
          maxLat: 60,
          onProgress: setProgress
        }
      );

      setVisibilityPoints(points);
      setIsCalculating(false);

      // Scroll to map on mobile
      if (window.innerWidth < 768) {
        containerRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  }, [selectedDate, resolution]);

  // Format date for input
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      dir={rtl ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 glass safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Moon className="w-6 h-6 text-primary crescent-glow" />
            <h1 className="text-lg font-semibold">{t.appName}</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
              className="text-xs"
            >
              {locale === 'en' ? 'عربي' : 'EN'}
            </Button>

            {/* Settings */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>{t.settings}</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <div>
                    <label className="text-sm font-medium">{t.resolution}</label>
                    <div className="mt-2 space-y-2">
                      <Slider
                        value={[resolution]}
                        onValueChange={([v]) => setResolution(v)}
                        min={1}
                        max={4}
                        step={1}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{t.highRes}</span>
                        <span>{t.lowRes}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">{t.language}</label>
                    <div className="mt-2 flex gap-2">
                      <Button
                        variant={locale === 'en' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setLocale('en')}
                      >
                        English
                      </Button>
                      <Button
                        variant={locale === 'ar' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setLocale('ar')}
                      >
                        العربية
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col md:flex-row">
        {/* Map section */}
        <div
          ref={containerRef}
          className="flex-1 relative min-h-[50vh] md:min-h-0"
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full map-container cursor-crosshair"
            onClick={handleMapClick}
            onTouchStart={handleMapClick}
          />

          {/* Loading overlay */}
          {isCalculating && (
            <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <div className="text-sm">{t.calculating}</div>
              <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Legend (desktop) */}
          <div className="hidden md:block absolute bottom-4 left-4 glass rounded-lg p-3">
            <div className="text-xs font-medium mb-2">{t.legend}</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded zone-a" />
                <span className="text-xs">{t.nakedEye}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded zone-b" />
                <span className="text-xs">{t.mayBeVisible}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded zone-c" />
                <span className="text-xs">{t.opticalAid}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded zone-d" />
                <span className="text-xs">{t.notVisible}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Controls panel */}
        <div className="md:w-80 lg:w-96 p-4 space-y-4 safe-bottom bg-card/50">
          {/* Date picker */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{t.selectDate}</span>
              </div>

              <input
                type="date"
                value={formatDateForInput(selectedDate)}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />

              <div className="mt-2 text-xs text-muted-foreground">
                {formatHijriDate(hijriDate, locale)}
              </div>
            </CardContent>
          </Card>

          {/* Calculate button */}
          <Button
            className="w-full h-12 text-lg"
            onClick={handleCalculate}
            disabled={isCalculating}
          >
            {isCalculating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {progress}%
              </>
            ) : (
              t.calculate
            )}
          </Button>

          {/* Selected location details */}
          {locationData && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{t.selectedLocation}</span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lat, Lon</span>
                    <span>{selectedLocation?.lat.toFixed(2)}°, {selectedLocation?.lon.toFixed(2)}°</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.moonAltitude}</span>
                    <span>{locationData.moonAlt?.toFixed(2)}°</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.elongation}</span>
                    <span>{locationData.elongation?.toFixed(2)}°</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t.visibility}</span>
                    <Badge
                      variant="secondary"
                      className={`zone-${locationData.odehZone?.toLowerCase()}`}
                    >
                      {t[`zone${locationData.odehZone}` as keyof typeof t]}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Legend (mobile) */}
          <div className="md:hidden">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium mb-3">{t.legend}</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded zone-a" />
                    <span className="text-xs">{t.nakedEye}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded zone-b" />
                    <span className="text-xs">{t.mayBeVisible}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded zone-c" />
                    <span className="text-xs">{t.opticalAid}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded zone-d" />
                    <span className="text-xs">{t.notVisible}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
