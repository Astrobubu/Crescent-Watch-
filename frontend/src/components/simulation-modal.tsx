'use client';

import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { SimulationResponse, SimulationTrajectoryPoint } from '@/lib/api';
import { X, Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

interface SimulationModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: SimulationResponse | null;
    isLoading: boolean;
    error: string | null;
}

// Generate truly random stars
function generateStars(count: number, seed: number): Array<{ x: number, y: number, size: number, brightness: number }> {
    const stars = [];
    // Use a seeded random for consistency during redraws but different per simulation
    let random = seed;
    const nextRandom = () => {
        random = (random * 16807) % 2147483647;
        return (random - 1) / 2147483646;
    };

    for (let i = 0; i < count; i++) {
        stars.push({
            x: nextRandom(),
            y: nextRandom() * 0.6, // Only in upper portion
            size: 0.5 + nextRandom() * 2,
            brightness: 0.3 + nextRandom() * 0.7
        });
    }
    return stars;
}

// Calculate timezone offset from longitude (approximate: 15 degrees = 1 hour)
function getTimezoneOffsetFromLongitude(lon: number): number {
    // Each 15 degrees of longitude = 1 hour offset from UTC
    return Math.round(lon / 15);
}

// Convert UTC ISO string to location's local time based on longitude
function utcToLocationLocal(isoString: string, lon: number): Date {
    const utcDate = new Date(isoString);
    const offsetHours = getTimezoneOffsetFromLongitude(lon);
    // Add the offset to get local time at that longitude
    return new Date(utcDate.getTime() + offsetHours * 60 * 60 * 1000);
}

// Format time in HH:MM format
function formatTime(date: Date): string {
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Get timezone label from longitude
function getTimezoneLabel(lon: number): string {
    const offset = getTimezoneOffsetFromLongitude(lon);
    const sign = offset >= 0 ? '+' : '';
    return `UTC${sign}${offset}`;
}

export default function SimulationModal({
    isOpen,
    onClose,
    data,
    isLoading,
    error
}: SimulationModalProps) {
    const { t, isRTL } = useLanguage();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [timeOffset, setTimeOffset] = useState(0);
    const [showBuildings, setShowBuildings] = useState(true);
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 500 });

    // Generate stars once per simulation data
    const stars = useMemo(() => {
        if (!data) return [];
        return generateStars(100, Math.floor(data.meta.lat * 1000 + data.meta.lon * 100));
    }, [data]);

    // Get current frame based on time offset
    const getFrame = useCallback((offset: number): SimulationTrajectoryPoint | null => {
        if (!data?.trajectory?.length) return null;
        return data.trajectory.find(p => p.time_offset_min >= offset)
            || data.trajectory[data.trajectory.length - 1];
    }, [data]);

    const frame = useMemo(() => getFrame(timeOffset), [getFrame, timeOffset]);

    // Get sunset time in location's local timezone
    const sunsetLocal = useMemo(() => {
        if (!data?.meta?.sunset_iso) return null;
        return utcToLocationLocal(data.meta.sunset_iso, data.meta.lon);
    }, [data]);

    // Location timezone label
    const timezoneLabel = useMemo(() => {
        if (!data) return '';
        return getTimezoneLabel(data.meta.lon);
    }, [data]);

    // Current simulation time
    const currentTime = useMemo(() => {
        if (!sunsetLocal) return null;
        const time = new Date(sunsetLocal.getTime() + timeOffset * 60 * 1000);
        return time;
    }, [sunsetLocal, timeOffset]);

    // Draw simulation
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !frame) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = canvas.width;
        const H = canvas.height;
        const horizonY = H * 0.75;

        // Sky gradient based on sun altitude
        const sunAlt = frame.sun_alt;
        const grad = ctx.createLinearGradient(0, 0, 0, H);

        if (sunAlt > 0) {
            // Daytime
            grad.addColorStop(0, '#4a90d9');
            grad.addColorStop(0.5, '#87CEEB');
            grad.addColorStop(1, '#f0e68c');
        } else if (sunAlt > -6) {
            // Civil twilight - golden/orange
            grad.addColorStop(0, '#1a2a4a');
            grad.addColorStop(0.3, '#2d4a6a');
            grad.addColorStop(0.6, '#8b6a4a');
            grad.addColorStop(0.85, '#ff8866');
            grad.addColorStop(1, '#ffaa77');
        } else if (sunAlt > -12) {
            // Nautical twilight
            grad.addColorStop(0, '#0a1628');
            grad.addColorStop(0.5, '#1a3050');
            grad.addColorStop(1, '#3a5070');
        } else if (sunAlt > -18) {
            // Astronomical twilight
            grad.addColorStop(0, '#050a15');
            grad.addColorStop(1, '#0f1a2a');
        } else {
            // Night
            grad.addColorStop(0, '#020510');
            grad.addColorStop(1, '#0a0f1a');
        }

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Draw stars (only when sun is below horizon)
        if (sunAlt < -6) {
            const starAlpha = Math.min(1, (-sunAlt - 6) / 12);
            stars.forEach(star => {
                ctx.beginPath();
                ctx.arc(star.x * W, star.y * H, star.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * starAlpha})`;
                ctx.fill();
            });
        }

        // Projection settings
        const FOV = 50; // degrees
        const pxPerDeg = W / FOV;
        const centerAz = frame.sun_az;

        const toScreen = (az: number, alt: number) => {
            let dAz = az - centerAz;
            while (dAz > 180) dAz -= 360;
            while (dAz < -180) dAz += 360;

            const x = W / 2 + dAz * pxPerDeg;
            const y = horizonY - alt * pxPerDeg;
            return { x, y };
        };

        // Sun glow (below horizon creates the orange glow)
        if (sunAlt > -10) {
            const sunPos = toScreen(frame.sun_az, Math.max(frame.sun_alt, -5));
            const glowRadius = 250 * (1 - Math.abs(sunAlt) / 10);
            const sunGrad = ctx.createRadialGradient(sunPos.x, sunPos.y, 0, sunPos.x, sunPos.y, glowRadius);
            sunGrad.addColorStop(0, `rgba(255, 150, 50, ${0.4 * (1 - Math.abs(sunAlt) / 10)})`);
            sunGrad.addColorStop(0.5, `rgba(255, 100, 50, ${0.2 * (1 - Math.abs(sunAlt) / 10)})`);
            sunGrad.addColorStop(1, 'rgba(255, 100, 50, 0)');
            ctx.fillStyle = sunGrad;
            ctx.fillRect(0, 0, W, H);
        }

        // Moon rendering
        const moonPos = toScreen(frame.moon_az, frame.moon_alt);
        const moonScale = 4;
        const moonRadius = (0.25 * pxPerDeg) * moonScale;

        if (moonPos.y < horizonY && moonPos.x > -moonRadius && moonPos.x < W + moonRadius) {
            ctx.save();
            ctx.translate(moonPos.x, moonPos.y);
            ctx.rotate((frame.tilt - 90) * Math.PI / 180);

            // Earthshine (dark side)
            ctx.beginPath();
            ctx.arc(0, 0, moonRadius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(30, 35, 45, 0.9)';
            ctx.fill();

            // Bright crescent
            const k = frame.illumination;
            const r = moonRadius;
            ctx.fillStyle = '#fffef8';

            if (k < 0.5) {
                // Thin crescent
                const xTerm = r * (1 - 2 * k);
                ctx.beginPath();
                ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2);
                ctx.bezierCurveTo(xTerm, r * 0.55, xTerm, -r * 0.55, 0, -r);
                ctx.fill();
            } else {
                // Gibbous
                ctx.beginPath();
                ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2);
                ctx.fill();
                const xTerm = r * (2 * k - 1);
                ctx.beginPath();
                ctx.ellipse(0, 0, xTerm, r, 0, -Math.PI / 2, Math.PI / 2);
                ctx.fill();
            }

            // Moon glow
            ctx.shadowColor = '#fffef8';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(0, 0, moonRadius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255,254,248,0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.restore();
        }

        // Draw angular measurement lines
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;

        // Moon altitude line
        if (frame.moon_alt > 0 && moonPos.y < horizonY) {
            ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)';
            ctx.beginPath();
            ctx.moveTo(moonPos.x, moonPos.y + moonRadius + 5);
            ctx.lineTo(moonPos.x, horizonY);
            ctx.stroke();

            // Altitude label
            ctx.fillStyle = '#64c8ff';
            ctx.font = '12px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${frame.moon_alt.toFixed(1)}°`, moonPos.x, (moonPos.y + horizonY) / 2 + 4);
        }

        // Elongation arc (simplified as line)
        const sunScreenPos = toScreen(frame.sun_az, Math.min(frame.sun_alt, 0));
        if (Math.abs(moonPos.x - sunScreenPos.x) > 20) {
            ctx.strokeStyle = 'rgba(255, 215, 100, 0.4)';
            ctx.beginPath();
            ctx.moveTo(moonPos.x, Math.min(moonPos.y, horizonY - 10));
            ctx.lineTo(sunScreenPos.x, horizonY - 10);
            ctx.stroke();

            // Elongation label
            ctx.fillStyle = '#ffd764';
            ctx.textAlign = 'center';
            ctx.fillText(`${frame.elongation.toFixed(1)}° elongation`, (moonPos.x + sunScreenPos.x) / 2, horizonY - 20);
        }

        ctx.setLineDash([]);

        // Ground
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, horizonY, W, H - horizonY);

        // Horizon line
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, horizonY);
        ctx.lineTo(W, horizonY);
        ctx.stroke();

        // Buildings silhouette (SVG-style paths)
        if (showBuildings) {
            ctx.fillStyle = '#050505';

            // Left building cluster
            const b1 = horizonY;
            ctx.beginPath();
            ctx.moveTo(0, b1);
            ctx.lineTo(0, b1 - 80);
            ctx.lineTo(30, b1 - 80);
            ctx.lineTo(30, b1 - 100);
            ctx.lineTo(50, b1 - 100);
            ctx.lineTo(50, b1 - 85);
            ctx.lineTo(70, b1 - 85);
            ctx.lineTo(70, b1 - 120);
            ctx.lineTo(90, b1 - 120);
            ctx.lineTo(90, b1 - 70);
            ctx.lineTo(120, b1 - 70);
            ctx.lineTo(120, b1 - 90);
            ctx.lineTo(140, b1 - 90);
            ctx.lineTo(140, b1);
            ctx.closePath();
            ctx.fill();

            // Right building cluster  
            ctx.beginPath();
            ctx.moveTo(W, b1);
            ctx.lineTo(W, b1 - 60);
            ctx.lineTo(W - 40, b1 - 60);
            ctx.lineTo(W - 40, b1 - 95);
            ctx.lineTo(W - 60, b1 - 95);
            ctx.lineTo(W - 60, b1 - 75);
            ctx.lineTo(W - 90, b1 - 75);
            ctx.lineTo(W - 90, b1 - 110);
            ctx.lineTo(W - 110, b1 - 110);
            ctx.lineTo(W - 110, b1 - 55);
            ctx.lineTo(W - 140, b1 - 55);
            ctx.lineTo(W - 140, b1);
            ctx.closePath();
            ctx.fill();

            // Small distant buildings
            ctx.fillRect(W * 0.3, b1 - 25, 15, 25);
            ctx.fillRect(W * 0.35, b1 - 35, 12, 35);
            ctx.fillRect(W * 0.6, b1 - 30, 18, 30);
            ctx.fillRect(W * 0.65, b1 - 20, 10, 20);
        }
    }, [frame, stars, showBuildings]);

    // Resize handler
    useEffect(() => {
        if (!isOpen || !containerRef.current) return;

        const updateSize = () => {
            const container = containerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const width = rect.width - 32; // padding
            const height = Math.min(rect.height - 180, width * 0.5); // 2:1 aspect, leave room for controls

            setCanvasSize({ width: Math.max(400, width), height: Math.max(250, height) });
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, [isOpen]);

    // Update canvas size
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = canvasSize.width;
        canvas.height = canvasSize.height;
        draw();
    }, [canvasSize, draw]);

    // Redraw when data changes
    useEffect(() => {
        draw();
    }, [draw]);

    // Reset time offset when data changes
    useEffect(() => {
        setTimeOffset(0);
    }, [data]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/90">
            <div
                ref={containerRef}
                className="relative w-[95vw] max-w-5xl h-[90vh] bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                    <div>
                        <h2 className="text-lg font-semibold text-white">{t('simulation.title')}</h2>
                        {data && (
                            <p className="text-sm text-zinc-400">
                                Location: {data.meta.lat.toFixed(2)}°, {data.meta.lon.toFixed(2)}°
                            </p>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                    >
                        <X size={20} />
                    </Button>
                </div>

                {/* Canvas Container */}
                <div className="flex-1 flex items-center justify-center p-4 bg-black">
                    {isLoading && (
                        <div className="flex items-center gap-3 text-zinc-400">
                            <Loader2 className="animate-spin" size={24} />
                            <span>{t('simulation.loading')}</span>
                        </div>
                    )}

                    {error && (
                        <div className="text-red-400 text-center p-6 max-w-md">
                            <p className="font-semibold mb-2">{t('simulation.error')}</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {!isLoading && !error && data && (
                        <canvas
                            ref={canvasRef}
                            className="rounded-lg"
                            style={{ maxWidth: '100%', maxHeight: '100%' }}
                        />
                    )}
                </div>

                {/* Controls */}
                {data && !isLoading && !error && (
                    <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/50">
                        <div className="max-w-3xl mx-auto space-y-4">
                            {/* Time Slider */}
                            <div className="flex items-center gap-4">
                                <div className="text-sm text-zinc-400 w-40">
                                    {currentTime ? formatTime(currentTime) : '--:--'}
                                    <span className="text-zinc-600 ml-1">
                                        {timezoneLabel}
                                    </span>
                                </div>
                                <Slider
                                    value={[timeOffset]}
                                    onValueChange={([v]) => setTimeOffset(v)}
                                    min={0}
                                    max={60}
                                    step={1}
                                    className="flex-1"
                                />
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                <div className="bg-zinc-800/50 rounded-lg p-3">
                                    <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">{t('simulation.moon_alt')}</div>
                                    <div className="text-white font-medium">{frame?.moon_alt.toFixed(1)}°</div>
                                </div>
                                <div className="bg-zinc-800/50 rounded-lg p-3">
                                    <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">{t('simulation.illumination')}</div>
                                    <div className="text-white font-medium">{frame ? (frame.illumination * 100).toFixed(1) : 0}%</div>
                                </div>
                                <div className="bg-zinc-800/50 rounded-lg p-3">
                                    <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">{t('simulation.elongation')}</div>
                                    <div className="text-white font-medium">{frame?.elongation.toFixed(1)}°</div>
                                </div>
                                <div className="bg-zinc-800/50 rounded-lg p-3">
                                    <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">{t('simulation.sunset')} ({timezoneLabel})</div>
                                    <div className="text-white font-medium">{sunsetLocal ? formatTime(sunsetLocal) : '--:--'}</div>
                                </div>
                            </div>

                            {/* Legend & Options */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6 text-xs text-zinc-500">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-0.5 bg-sky-400"></div>
                                        <span>{t('simulation.legend.alt')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-0.5 bg-amber-400"></div>
                                        <span>{t('simulation.legend.elong')}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="buildings"
                                        checked={showBuildings}
                                        onCheckedChange={(v) => setShowBuildings(Boolean(v))}
                                    />
                                    <Label htmlFor="buildings" className="text-sm text-zinc-400 cursor-pointer">
                                        {t('simulation.show_buildings')}
                                    </Label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
