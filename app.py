from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from datetime import date, datetime, timezone, timedelta
import numpy as np
import math
import time
import json
from skyfield.api import load, wgs84
from skyfield import almanac
from skyfield.framelib import itrs
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app = FastAPI(title="Crescent Watch (Vectorized)")

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def home():
    return FileResponse("static/index.html")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Skyfield Loader ---
eph = load("de421.bsp")
ts = load.timescale()
SUN = eph["sun"]
MOON = eph["moon"]
EARTH = eph["earth"]

RAD2DEG = 180.0 / np.pi
DEG2RAD = np.pi / 180.0

def approx_tz_offset_hours(lon):
    return np.round(lon / 15.0).astype(int)

def vectorized_newton_solve(
    t_utc, target_body, target_alt_deg, lat_objs, 
    iterations=3, step_seconds=120.0
):
    """
    Perform vectorized Newton-Raphson iteration to find time when body reaches target_alt.
    t_utc: Initial guess Time object (vector)
    target_body: SUN or MOON
    target_alt_deg: Target altitude in degrees
    lat_objs: Vectorized wgs84.latlon object
    """
    t = t_utc
    
    # We iterate N times
    for _ in range(iterations):
        # 1. Calculate current altitude
        observer = EARTH + lat_objs
        # apparent() is rigorous (aberration, deflection, etc.)
        apparent = observer.at(t).observe(target_body).apparent()
        alt, _, _ = apparent.altaz()
        
        # 2. Estimate derivative (deg/sec) with a small step
        # Note: We can reuse the same observer setup roughly, but strictness requires re-eval
        dt = step_seconds / 86400.0 # days
        t2 = ts.tt_jd(t.tt + dt)
        
        apparent2 = observer.at(t2).observe(target_body).apparent()
        alt2, _, _ = apparent2.altaz()
        
        y1 = alt.degrees
        y2 = alt2.degrees
        rate = (y2 - y1) / step_seconds # deg / sec
        
        # Avoid division by zero
        rate = np.where(np.abs(rate) < 1e-7, 1e-7, rate)
        
        diff = y1 - target_alt_deg
        
        # 3. Newton step: t_new = t - diff/rate
        correction_sec = diff / rate
        
        # Clamp correction to avoid wild jumps (e.g. +/- 4 hours)
        correction_sec = np.clip(correction_sec, -14400, 14400)
        
        t = ts.tt_jd(t.tt - (correction_sec / 86400.0))
        
    return t

def vectorized_topocentric_data(t_utc, lat_objs):
    """
    Calculate topocentric data (Sun/Moon alt/az, separation) for arrays of points at times t_utc.
    """
    observer = EARTH + lat_objs
    t = t_utc
    
    sun_app = observer.at(t).observe(SUN).apparent()
    moon_app = observer.at(t).observe(MOON).apparent()
    
    sun_alt, sun_az, _ = sun_app.altaz()
    moon_alt, moon_az, _ = moon_app.altaz()
    
    # Separation (elongation)
    elong = sun_app.separation_from(moon_app)
    
    return {
        "sun_alt": sun_alt.degrees,
        "sun_az": sun_az.degrees,
        "moon_alt": moon_alt.degrees,
        "moon_az": moon_az.degrees,
        "arcl": elong.degrees,
        # Distance needed for parallax? separation_from handles arc length.
        # For Yallop width, we need parallax. 
        # Moon distance:
        "moon_dist": observer.at(t).observe(MOON).distance().km
    }

def vectorized_yallop(arcl, arcv, w_prime):
    # f = 11.8371 - 6.3226*W' + 0.7319*W'^2 - 0.1018*W'^3
    f = (11.8371 - 6.3226 * w_prime + 0.7319 * (w_prime**2) - 0.1018 * (w_prime**3))
    q = (arcv - f) / 10.0
    
    # Classify
    # We use numpy 'select' or nested 'where' for vector classification
    # A: > 0.216
    # B: > -0.014
    # C: > -0.160
    # D: > -0.232
    # E: > -0.293
    # F: <= -0.293
    
    conditions = [
        q > 0.216,
        q > -0.014,
        q > -0.160,
        q > -0.232,
        q > -0.293
    ]
    choices_cls = ['A', 'B', 'C', 'D', 'E']
    choices_vis = ['naked_eye_easy', 'naked_eye_perfect', 'mixed_optical_helpful', 'optical_required', 'not_visible_telescope']
    
    y_cls = np.select(conditions, choices_cls, default='F')
    y_vis = np.select(conditions, choices_vis, default='not_visible')
    
    return q, y_cls, y_vis

def vectorized_odeh(arcv, w_arcmin):
    # V = ARCV - (-0.1018*W^3 + 0.7319*W^2 - 6.3226*W + 7.1651)
    curve = (-0.1018*(w_arcmin**3) + 0.7319*(w_arcmin**2) - 6.3226*w_arcmin + 7.1651)
    v = arcv - curve
    
    conditions = [
        v >= 5.65,
        v >= 2.0,
        v >= -0.96
    ]
    choices_zone = ['A', 'B', 'C']
    choices_vis = ['naked_eye', 'naked_eye', 'optical_aid']
    
    o_zone = np.select(conditions, choices_zone, default='D')
    o_vis = np.select(conditions, choices_vis, default='not_visible')
    
    return v, o_zone, o_vis

def classify_color_vectorized(y_cls, o_zone):
    """
    Use ONLY Odeh zones for color classification to match Mohammad Odeh's criterion.
    Reference colors from Accurate Times:
      - Green: Zone A (V >= 5.65) - Easily Visible by Naked Eye
      - Magenta/Pink: Zone B (V >= 2.0) - Could be Seen by Naked Eye
      - Blue/Cyan: Zone C (V >= -0.96) - Need Optical Aid
      - Red: Zone D (V < -0.96) - Not Visible / Impossible
    
    For our UI, we map:
      - A -> green
      - B -> yellow (representing "could be seen" / marginal naked eye)
      - C -> orange (optical aid needed)
      - D -> red (not visible)
    """
    colors = np.full(o_zone.shape, 'red', dtype=object)
    colors[o_zone == 'C'] = 'orange'  # Optical aid
    colors[o_zone == 'B'] = 'yellow'  # Could be seen by naked eye
    colors[o_zone == 'A'] = 'green'   # Easily visible
    
    return colors

@app.get("/simulation")
def simulation(
    lat: float,
    lon: float,
    y: int,
    m: int,
    d: int
):
    """
    Returns accurate Alt/Az trajectory for Sun and Moon for a specific location.
    Starting from Sunset to Moonset + padding.
    """
    try:
        t0_calc = time.time()
        
        # Observer: Must include Earth vector for almanac search
        observer = EARTH + wgs84.latlon(lat, lon)
        
        # Time: Start at 12:00 UTC on that day as a base search
        # To avoid datetime range issues, using 12:00 UTC is safer than guessing local hour
        # because local sunset could be NEXT day UTC or PREVIOUS day UTC.
        # Let's search a wide window around 12:00 UTC of target date.
        
        base_dt = datetime(y, m, d, 12, 0, 0, tzinfo=timezone.utc)
        t_start = ts.from_datetime(base_dt - timedelta(hours=12))
        t_end = ts.from_datetime(base_dt + timedelta(hours=36))
        
        # Precise Sunset
        t_sunsets, t_sunrises = almanac.find_settings(observer, SUN, t_start, t_end)
        
        if len(t_sunsets) == 0:
            return JSONResponse(status_code=400, content={"error": "No sunset found (Polar?)"})
            
        # Find the sunset closest to our target DATE (in local terms, or just the first one found?)
        # The user asks for Y-M-D. We should assume they mean the event happening roughly on that day.
        # Let's pick the sunset strictly NEAREST to 18:00 Local time of that day?
        # Simpler: Pick the first sunset found in the window starting 12:00 UTC?
        t_sunset = t_sunsets[0]
        
        # Generate 60 minutes of data (one point per minute)
        # T = Sunset + i minutes
        times = [ts.tt_jd(t_sunset.tt + i/1440.0) for i in range(0, 75, 2)] # every 2 mins for 75 mins
        
        trajectory = []
        
        for t in times:
            # Observational Data (Apparent - includes Refraction/Aberration)
            sun_obs = observer.at(t).observe(SUN)
            sun_app = sun_obs.apparent()
            sun_alt, sun_az, _ = sun_app.altaz()
            
            moon_obs = observer.at(t).observe(MOON)
            moon_app = moon_obs.apparent()
            moon_alt, moon_az, _ = moon_app.altaz()
            
            # --- rigorous Almanac Details ---
            # 1. Fraction Illuminated (k)
            # "The fraction of the Moon's disk that is illuminated"
            illum = almanac.fraction_illuminated(eph, 'moon', t)
            
            # 2. Phase Angle (Sun-Moon-Earth angle)
            # Angle between Sun-Moon vector and Earth-Moon vector?
            # almanac doesn't have a direct "phase_angle" function public widely, 
            # but separation gives elongation. Phase angle beta calc:
            # from skyfield.framelib import ecliptic_frame
            # But simple elongation is often what people mean by "Age".
            # Let's provide Elongation (Angle obtained at Earth)
            elongation = sun_app.separation_from(moon_app).degrees
            
            # 3. Crescent Tilt (Zenith Angle of the Bright Limb)
            # This is the direction of the Sun *relative to the Moon* in the sky.
            # Using the vector in the Alt-Az plane is the most direct way to get "Horizon Tilt".
            # Standard Formula for Position Angle of Bright Limb (Chi):
            # tan(Chi) = cos(SunAlt) * sin(SunAz - MoonAz) / (cos(MoonAlt)sin(SunAlt) - sin(MoonAlt)cos(SunAlt)cos(SunAz - MoonAz))
            # ...which reduces to the 2-argument arctangent of the vector differences in a local tangent plane.
            
            # We use the numeric vector difference of the apparent positions.
            # Convert to radians for math
            sa_r, mz_r = sun_alt.radians, moon_alt.radians
            saz_r, maz_r = sun_az.radians, moon_az.radians
            
            # Vector from Moon to Sun in Tangent Plane
            dy = sa_r - mz_r
            dx = (saz_r - maz_r) * np.cos(mz_r) # Scale Azimuth by cos(Alt) to get linear distance
            
            # Angle relative to "Up" (Zenith)
            # In plotting (X, Y), X is horizontal (Az), Y is vertical (Alt).
            # atan2(dx, dy) gives angle from Vertical (Y-axis)?
            # atan2(y, x) gives angle from X-axis.
            # We want Angle from Vertical (Up).
            # Tilt 0 = Sun is directly above Moon.
            # Tilt 90 = Sun is directly Right of Moon.
            
            # Our visual logic (Canvas) rotates by this angle.
            # Standard Math: atan2(dy, dx) is angle from Right.
            # We want to store the standard math angle and let frontend handle rotation.
            
            tilt_from_right = np.degrees(np.arctan2(dy, dx))
            
            # Also calculate Parallactic Angle just in case (q)
            # q = parallactic_angle(HA, dec, lat) ?
            # Not needed if we use direct Alt/Az diffs.
            
            trajectory.append({
                "time_offset_min": (t.tt - t_sunset.tt) * 1440.0,
                "sun_alt": sun_alt.degrees,
                "sun_az": sun_az.degrees,
                "moon_alt": moon_alt.degrees,
                "moon_az": moon_az.degrees,
                "illumination": illum,
                "elongation": elongation,
                "tilt": 90 - tilt_from_right # Convert to "Angle from Zenith" (0=Up, 90=Right)
                # If Sun is above (dy>0, dx=0) -> atan2(1,0)=90. 90-90=0. Correct.
                # If Sun is right (dy=0, dx>0) -> atan2(0,1)=0. 90-0=90. Correct.
            })
            
        return {
            "meta": {
                "lat": lat,
                "lon": lon,
                "sunset_iso": t_sunset.utc_iso(),
                "calc_time_ms": int((time.time() - t0_calc)*1000)
            },
            "trajectory": trajectory
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/visibility")
def visibility(
    y: int = Query(..., ge=1900, le=2100),
    m: int = Query(..., ge=1, le=12),
    d: int = Query(..., ge=1, le=31),
    step_deg: float = Query(2.0, ge=0.5, le=10.0),
    date_mode: str = Query("local", pattern="^(local|utc)$"),
    eval_time: str = Query("sunset", pattern="^(sunset|best)$"),
    include_polar: bool = Query(False),
):
    def iter_visibility():
        try:
            t0_start = time.time()
            yield json.dumps({"status": "Initializing grid...", "progress": 5}) + "\n"
            
            base_date = date(y, m, d)
            
            # 1. Create Grid
            max_lat = 85 if include_polar else 60
            lats_1d = np.arange(-max_lat, max_lat + 1, step_deg)
            lons_1d = np.arange(-180, 180, step_deg)
            lon_grid, lat_grid = np.meshgrid(lons_1d, lats_1d)
            lats = lat_grid.flatten()
            lons = lon_grid.flatten()
            total_points = len(lats)
            
            yield json.dumps({"status": f"Grid: {total_points} points", "progress": 10}) + "\n"
            
            # 2. Initial Sunset Guess
            base_dt_utc = datetime(y, m, d, 18, 0, 0, tzinfo=timezone.utc)
            base_ts = ts.from_datetime(base_dt_utc)
            time_shifts_days = -(lons / 15.0) / 24.0
            t_sunset_guess = ts.tt_jd(base_ts.tt + time_shifts_days)
            lat_objs = wgs84.latlon(lats, lons)
            
            yield json.dumps({"status": "Solving Sunsets...", "progress": 20}) + "\n"
            
            # 3. Solve for Sunset
            t_sunset = vectorized_newton_solve(
                t_sunset_guess, SUN, -0.833, lat_objs, iterations=3
            )
            
            yield json.dumps({"status": "Solving Moonsets...", "progress": 45}) + "\n"
            
            # 4. Moonset or Best Time
            t_moonset_guess = ts.tt_jd(t_sunset.tt + (45 / 1440.0))
            t_moonset = vectorized_newton_solve(
                t_moonset_guess, MOON, -0.833, lat_objs, iterations=3
            )
            
            yield json.dumps({"status": "Computing visibility...", "progress": 70}) + "\n"
            
            # 5. Compute Lag and Tb
            lag_days = t_moonset.tt - t_sunset.tt
            lag_min = lag_days * 1440.0
            
            if eval_time == "best":
                tb_days = t_sunset.tt + (4.0/9.0) * np.maximum(0, lag_days)
                t_eval = ts.tt_jd(tb_days)
            else:
                t_eval = t_sunset
                
            data = vectorized_topocentric_data(t_eval, lat_objs)
            
            # 6. Calculate Crescent Width
            def calc_width(arcl_deg, moon_alt_deg, dist_km):
                earth_radius = 6378.137
                sin_pi = np.clip(earth_radius / dist_km, 0, 1)
                pi_rad = np.arcsin(sin_pi)
                h_rad = np.radians(moon_alt_deg)
                sd_rad = 0.27245 * pi_rad
                sd_prime_rad = sd_rad * (1.0 + np.sin(h_rad)*np.sin(pi_rad))
                arcl_rad = np.radians(arcl_deg)
                w_prime_rad = sd_prime_rad * (1.0 - np.cos(arcl_rad))
                return np.degrees(w_prime_rad) * 60.0

            w_prime = calc_width(data["arcl"], data["moon_alt"], data["moon_dist"])
            arcv = data["moon_alt"] - data["sun_alt"]
            
            yield json.dumps({"status": "Classifying...", "progress": 85}) + "\n"
            
            # 7. Classification
            q, y_cls, y_vis = vectorized_yallop(data["arcl"], arcv, w_prime)
            v_vals, o_zone, o_vis = vectorized_odeh(arcv, w_prime)
            colors = classify_color_vectorized(y_cls, o_zone)
            
            invisible_mask = (lag_min <= 0)
            colors[invisible_mask] = 'red'
            
            yield json.dumps({"status": "Packaging results...", "progress": 95}) + "\n"
            
            results = []
            for lat, lon, col in zip(lats, lons, colors):
                results.append({"lat": float(lat), "lon": float(lon), "color": col})

            elapsed = time.time() - t0_start
            
            meta = {
                "date": base_date.isoformat(),
                "date_mode": date_mode,
                "eval_time": eval_time,
                "step_deg": step_deg,
                "max_lat": max_lat,
                "calc_time_ms": int(elapsed * 1000)
            }
            
            yield json.dumps({"progress": 100, "result": {"meta": meta, "points": results}}) + "\n"
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            yield json.dumps({"error": str(e)}) + "\n"

    return StreamingResponse(iter_visibility(), media_type="application/x-ndjson")
