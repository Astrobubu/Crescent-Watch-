'use client';

import { useRef, useEffect, useCallback } from 'react';
import { VisibilityPoint } from '@/lib/api';

interface MapCanvasProps {
    points: VisibilityPoint[];
    projection: 'equirect' | 'gallpeters' | 'mercator';
    opacity: number;
    onLocationClick: (lat: number, lon: number) => void;
    onMouseMove?: (lat: number, lon: number) => void;
}

const COLORS: Record<string, string> = {
    green: '#22c55e',  // Easily visible
    yellow: '#eab308', // Could be seen
    orange: '#f97316', // Optical aid
    red: '#ef4444',    // Not visible
    ocean: '#0a1628',
    land: '#162436',
    grid: 'rgba(255,255,255,0.1)',
    text: 'rgba(255,255,255,0.5)',
    border: '#3a506b'
};

// Natural Earth 110m land GeoJSON URL
const WORLD_DATA_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson';

interface GeoJSONFeature {
    geometry: {
        type: string;
        coordinates: number[][][] | number[][][][];
    };
}

interface WorldData {
    features: GeoJSONFeature[];
}

export default function MapCanvas({
    points,
    projection,
    opacity,
    onLocationClick,
    onMouseMove
}: MapCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const worldDataRef = useRef<WorldData | null>(null);
    const stepDeg = points.length > 0 ?
        Math.abs((points[1]?.lon || 2) - (points[0]?.lon || 0)) || 2 : 2;

    // Load world map data
    useEffect(() => {
        fetch(WORLD_DATA_URL)
            .then(res => res.json())
            .then(data => {
                worldDataRef.current = data;
                draw();
            })
            .catch(err => console.error('Failed to load world map:', err));
    }, []);

    // Project coordinates to canvas
    const project = useCallback((lat: number, lon: number, W: number, H: number, maxLat: number, type: string) => {
        const x = ((lon + 180) / 360) * W;
        let y_norm = 0;

        if (type === 'mercator') {
            // Mercator projection - proper scaling
            const latClamped = Math.max(-85, Math.min(85, lat));
            const latRad = latClamped * Math.PI / 180;
            const mercatorY = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
            // Scale by the max mercator value at the clamped latitude
            const maxLatRad = 85 * Math.PI / 180;
            const maxMercatorY = Math.log(Math.tan(Math.PI / 4 + maxLatRad / 2));
            y_norm = mercatorY / maxMercatorY / 2;
        } else if (type === 'gallpeters') {
            const sLat = Math.sin(lat * Math.PI / 180);
            const sMax = Math.sin(maxLat * Math.PI / 180);
            y_norm = sLat / (2 * sMax);
        } else {
            y_norm = lat / (2 * maxLat);
        }

        const y = H / 2 - (y_norm * H);
        return { x, y };
    }, []);

    // Inverse projection (canvas to lat/lon)
    const inverseProject = useCallback((x: number, y: number, W: number, H: number, type: string) => {
        const lon = (x / (W / 360)) - 180;
        let lat: number;

        if (type === 'mercator') {
            // Inverse Mercator
            const maxLat = 85;
            const maxMercatorY = Math.log(Math.tan(Math.PI / 4 + (maxLat * Math.PI / 180) / 2));
            const mercatorY = (1 - (2 * y) / H) * maxMercatorY;
            lat = (2 * Math.atan(Math.exp(mercatorY)) - Math.PI / 2) * (180 / Math.PI);
        } else if (type === 'gallpeters') {
            const sinLat = 1 - (2 * y) / H;
            const clamped = Math.max(-1, Math.min(1, sinLat));
            lat = Math.asin(clamped) * (180 / Math.PI);
        } else {
            lat = 90 * (1 - (2 * y) / H);
        }

        return { lat, lon };
    }, []);

    // Draw polygon ring
    const drawPolygon = useCallback((ctx: CanvasRenderingContext2D, rings: number[][][], W: number, H: number, maxLat: number, projType: string) => {
        for (const ring of rings) {
            let first = true;
            for (const [lon, lat] of ring) {
                if (Math.abs(lat) > maxLat + 5) continue;

                const p = project(lat, lon, W, H, maxLat, projType);
                if (first) { ctx.moveTo(p.x, p.y); first = false; }
                else ctx.lineTo(p.x, p.y);
            }
        }
    }, [project]);

    // Draw graticule
    const drawGraticule = useCallback((ctx: CanvasRenderingContext2D, W: number, H: number, maxLat: number, projType: string) => {
        ctx.strokeStyle = COLORS.grid;
        ctx.fillStyle = COLORS.text;
        ctx.font = '10px Inter, sans-serif';
        ctx.lineWidth = 1;

        // Longitude lines
        for (let lon = -180; lon <= 180; lon += 30) {
            const p1 = project(-maxLat, lon, W, H, maxLat, projType);
            const p2 = project(maxLat, lon, W, H, maxLat, projType);

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();

            if (lon > -180 && lon < 180) {
                ctx.textAlign = 'center';
                ctx.fillText(`${Math.abs(lon)}°`, p1.x, H - 5);
            }
        }

        // Latitude lines
        const latStep = 15;
        for (let lat = -90; lat <= 90; lat += latStep) {
            const pLeft = project(lat, -180, W, H, maxLat, projType);
            const pRight = project(lat, 180, W, H, maxLat, projType);

            ctx.beginPath();
            ctx.moveTo(0, pLeft.y);
            ctx.lineTo(W, pRight.y);
            ctx.stroke();

            if (lat !== -90 && lat !== 90) {
                ctx.textAlign = 'right';
                ctx.fillText(`${lat}°`, W - 10, pLeft.y + 3);
            }
        }
    }, [project]);

    // Main draw function
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = canvas.width;
        const H = canvas.height;
        const projType = projection;
        const viewMaxLat = 90;

        // Clear with ocean color
        ctx.fillStyle = COLORS.ocean;
        ctx.fillRect(0, 0, W, H);

        // Draw landmasses
        if (worldDataRef.current?.features) {
            ctx.fillStyle = COLORS.land;
            ctx.strokeStyle = COLORS.border;
            ctx.lineWidth = 1;
            ctx.beginPath();

            for (const feature of worldDataRef.current.features) {
                const geometry = feature.geometry;
                if (geometry.type === 'Polygon') {
                    drawPolygon(ctx, geometry.coordinates as number[][][], W, H, viewMaxLat, projType);
                } else if (geometry.type === 'MultiPolygon') {
                    for (const coords of geometry.coordinates as number[][][][]) {
                        drawPolygon(ctx, coords, W, H, viewMaxLat, projType);
                    }
                }
            }

            ctx.fill();
            ctx.stroke();
        }

        // Draw visibility overlay
        if (points.length > 0) {
            ctx.globalAlpha = opacity;
            const cellW = (stepDeg / 360) * W;
            const pad = 0.6;

            for (const pt of points) {
                if (Math.abs(pt.lat) > viewMaxLat) continue;

                const center = project(pt.lat, pt.lon, W, H, viewMaxLat, projType);
                const north = project(pt.lat + stepDeg / 2, pt.lon, W, H, viewMaxLat, projType);
                const south = project(pt.lat - stepDeg / 2, pt.lon, W, H, viewMaxLat, projType);
                const cellH = Math.abs(south.y - north.y);

                ctx.fillStyle = COLORS[pt.color] || COLORS.red;
                ctx.fillRect(center.x - cellW / 2, center.y - cellH / 2, cellW + pad, cellH + pad);
            }

            ctx.globalAlpha = 1.0;
        }

        // Draw graticule
        drawGraticule(ctx, W, H, viewMaxLat, projType);
    }, [points, projection, opacity, stepDeg, project, drawPolygon, drawGraticule]);

    // Resize canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            draw();
        };

        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, [draw]);

    // Redraw when dependencies change
    useEffect(() => {
        draw();
    }, [draw]);

    // Mouse move handler
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas || !onMouseMove) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const { lat, lon } = inverseProject(x, y, canvas.width, canvas.height, projection);
        onMouseMove(lat, lon);
    };

    // Click handler
    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const { lat, lon } = inverseProject(x, y, canvas.width, canvas.height, projection);
        onLocationClick(lat, lon);
    };

    return (
        <canvas
            ref={canvasRef}
            className="block w-full h-full cursor-crosshair"
            style={{ background: COLORS.ocean }}
            onMouseMove={handleMouseMove}
            onClick={handleClick}
        />
    );
}
