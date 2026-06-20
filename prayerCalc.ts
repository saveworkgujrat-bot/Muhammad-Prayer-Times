/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  PrayerTimes,
  CalculationMethod,
  AsrMethod,
  HighLatitudeRule,
  PrayerSettings,
  HijriDate,
} from '../types';

// Helper: Convert degrees to radians
function degToRad(deg: number): number {
  return (deg * Math.PI) / 180.0;
}

// Helper: Convert radians to degrees
function radToDeg(rad: number): number {
  return (rad * 180.0) / Math.PI;
}

// Helper: Normalize an angle to [0, 360] range
function fixAngle(angle: number): number {
  let a = angle % 360.0;
  if (a < 0) {
    a += 360.0;
  }
  return a;
}

// Helper: Normalize hour values to [0, 24] range
function fixHour(hour: number): number {
  let h = hour % 24.0;
  if (h < 0) {
    h += 24.0;
  }
  return h;
}

// Helper: Convert decimal hour to "HH:MM" string
export function formatTime(decimalHour: number, format24h: boolean = false): string {
  if (isNaN(decimalHour)) return '--:--';
  const hours = Math.floor(decimalHour);
  const minutes = Math.round((decimalHour - hours) * 60);
  
  // Handle case where round makes it 60
  let displayHours = hours;
  let displayMinutes = minutes;
  if (displayMinutes === 60) {
    displayMinutes = 0;
    displayHours = (displayHours + 1) % 24;
  }

  const paddedMinutes = String(displayMinutes).padStart(2, '0');

  if (format24h) {
    const paddedHours = String(displayHours).padStart(2, '0');
    return `${paddedHours}:${paddedMinutes}`;
  } else {
    const ampm = displayHours >= 12 ? 'PM' : 'AM';
    let hour12 = displayHours % 12;
    if (hour12 === 0) hour12 = 12;
    return `${hour12}:${paddedMinutes} ${ampm}`;
  }
}

// Parse "HH:MM" string back to decimal hours of the local day
export function parseTimeToDecimal(timeStr: string): number {
  if (!timeStr || timeStr === '--:--') return 12;
  try {
    // Supports "13:45" or "1:45 PM"
    const cleaned = timeStr.trim().toUpperCase();
    const isPM = cleaned.includes('PM');
    const isAM = cleaned.includes('AM');
    const numericPart = cleaned.replace(/[AP]M/, '').trim();
    const [hStr, mStr] = numericPart.split(':');
    let hours = parseInt(hStr, 10);
    const minutes = parseInt(mStr, 10);

    if (isPM && hours < 12) {
      hours += 12;
    } else if (isAM && hours === 12) {
      hours = 0;
    }
    return hours + minutes / 60;
  } catch (e) {
    return 12;
  }
}

// Detailed solar calculations
interface SunCoordinates {
  declination: number; // radians
  equationOfTime: number; // hours
}

function getSunCoordinates(julianDaysSinceJ2000: number): SunCoordinates {
  const d = julianDaysSinceJ2000;
  
  // Mean anomaly of the Sun (degrees)
  const g = fixAngle(357.529 + 0.98560028 * d);
  
  // Mean longitude of the Sun (degrees)
  const q = fixAngle(280.459 + 0.98564736 * d);
  
  // Ecliptic longitude (degrees)
  const L = fixAngle(q + 1.915 * Math.sin(degToRad(g)) + 0.02 * Math.sin(degToRad(2 * g)));
  
  // Obliquity of the ecliptic (degrees)
  const e = 23.439 - 0.00000036 * d;
  
  // Right Ascension (RA) in degrees
  let RA = radToDeg(Math.atan2(Math.cos(degToRad(e)) * Math.sin(degToRad(L)), Math.cos(degToRad(L))));
  RA = fixAngle(RA);
  
  // Quadrant adjustment for RA
  const Lquad = Math.floor(L / 90.0) * 90.0;
  const RAquad = Math.floor(RA / 90.0) * 90.0;
  RA = RA + (Lquad - RAquad);
  
  // Solar Declination
  const declination = Math.asin(Math.sin(degToRad(e)) * Math.sin(degToRad(L)));
  
  // Equation of Time in hours
  let equationOfTime = (q - RA) / 15.0;
  if (equationOfTime > 12) equationOfTime -= 24;
  if (equationOfTime < -12) equationOfTime += 24;
  
  return { declination, equationOfTime };
}

// Calculate the Julian Date for Gregorian Date at 12:00 (midday) UTC
function getJulianDate(year: number, month: number, day: number): number {
  let Y = year;
  let M = month;
  if (M <= 2) {
    Y -= 1;
    M += 12;
  }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const JD = Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + day + B - 1524.5;
  return JD;
}

// Calculate Sun Altitude Angle parameters
interface CalculationParams {
  fajrAngle: number; // degrees
  ishaAngle: number; // degrees
  ishaIsInterval: boolean; // if true, isha is a fixed interval after Maghrib
  ishaInterval: number; // minutes
}

function getMethodParams(method: CalculationMethod): CalculationParams {
  switch (method) {
    case CalculationMethod.ISNA:
      return { fajrAngle: 15, ishaAngle: 15, ishaIsInterval: false, ishaInterval: 0 };
    case CalculationMethod.Egypt:
      return { fajrAngle: 19.5, ishaAngle: 17.5, ishaIsInterval: false, ishaInterval: 0 };
    case CalculationMethod.Makkah:
      return { fajrAngle: 18.5, ishaAngle: 0, ishaIsInterval: true, ishaInterval: 90 };
    case CalculationMethod.Karachi:
      return { fajrAngle: 18, ishaAngle: 18, ishaIsInterval: false, ishaInterval: 0 };
    case CalculationMethod.Tehran:
      return { fajrAngle: 17.7, ishaAngle: 14, ishaIsInterval: false, ishaInterval: 0 };
    case CalculationMethod.Gulf:
      return { fajrAngle: 19.5, ishaAngle: 0, ishaIsInterval: true, ishaInterval: 90 };
    case CalculationMethod.Turkey:
      return { fajrAngle: 18, ishaAngle: 17, ishaIsInterval: false, ishaInterval: 0 };
    case CalculationMethod.MWL:
    default:
      return { fajrAngle: 18, ishaAngle: 17, ishaIsInterval: false, ishaInterval: 0 };
  }
}

// Core Solar Hour Angle calculation
function getHourAngle(sunAltitudeAngle: number, latitude: number, declination: number): number {
  const G = degToRad(sunAltitudeAngle);
  const latRad = degToRad(latitude);
  
  // Formula: cos(H) = (sin(G) - sin(lat) * sin(dec)) / (cos(lat) * cos(dec))
  const cosH = (Math.sin(G) - Math.sin(latRad) * Math.sin(declination)) / 
                (Math.cos(latRad) * Math.cos(declination));
  
  if (cosH > 1.0 || cosH < -1.0) {
    return NaN; // Sun never reaches this altitude (high latitudes)
  }
  
  const HRad = Math.acos(cosH);
  return radToDeg(HRad) / 15.0; // convert to hours
}

// Main calculation function
export function calculatePrayerTimes(
  date: Date,
  latitude: number,
  longitude: number,
  timezone: number,
  settings: PrayerSettings
): PrayerTimes {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  const JD = getJulianDate(year, month, day);
  const d = JD - 2451545.0; // Solar coordinates relative to midday
  
  const { declination, equationOfTime } = getSunCoordinates(d);
  
  // Dhuhr is solar transit time
  // Solar Noon = 12 + timezone - longitude/15 - EquationOfTime
  const midday = 12.0 + timezone - longitude / 15.0 - equationOfTime;
  let dhuhrHour = fixHour(midday);

  // Fajr & Isha details based on calculation methods
  const params = getMethodParams(settings.method);
  
  // Standard Sunrise/Sunset angle is -0.8333 degrees (refraction and angular diameter)
  const sunriseSunAltitude = -0.8333;
  
  let sunriseHourAngle = getHourAngle(sunriseSunAltitude, latitude, declination);
  let sunriseHour = isNaN(sunriseHourAngle) ? NaN : fixHour(dhuhrHour - sunriseHourAngle);
  let sunsetHour = isNaN(sunriseHourAngle) ? NaN : fixHour(dhuhrHour + sunriseHourAngle);

  // Fajr Hour Angle
  let fajrHourAngle = getHourAngle(-params.fajrAngle, latitude, declination);
  let fajrHour = isNaN(fajrHourAngle) ? NaN : fixHour(dhuhrHour - fajrHourAngle);

  // Isha Hour Angle (if not computed as intervals)
  let ishaHour = NaN;
  if (!params.ishaIsInterval) {
    let ishaHourAngle = getHourAngle(-params.ishaAngle, latitude, declination);
    ishaHour = isNaN(ishaHourAngle) ? NaN : fixHour(dhuhrHour + ishaHourAngle);
  } else {
    // Isha is a fixed interval after Maghrib (usually Sunset + 90 mins)
    if (!isNaN(sunsetHour)) {
      ishaHour = fixHour(sunsetHour + params.ishaInterval / 60.0);
    }
  }

  // Asr altitude calculation
  // Shadow factor: Standard Shafi'i=1, Hanafi=2
  const shadowFactor = settings.asrMethod === AsrMethod.Hanafi ? 2 : 1;
  const latDecDiff = Math.abs(degToRad(latitude) - declination);
  const asrAltitudeRad = Math.atan(1.0 / (shadowFactor + Math.tan(latDecDiff)));
  const asrAltitudeDeg = radToDeg(asrAltitudeRad);
  
  const asrHourAngle = getHourAngle(asrAltitudeDeg, latitude, declination);
  const asrHour = isNaN(asrHourAngle) ? NaN : fixHour(dhuhrHour + asrHourAngle);

  // Maghrib is typically Sunset (some add minor offset like +2 or +3 mins, but calculating direct is highly accurate)
  const maghribHour = sunsetHour;

  // Handle high latitude anomalies if any times are NaN
  let finalFajr = fajrHour;
  let finalSunrise = sunriseHour;
  let finalDhuhr = dhuhrHour;
  let finalAsr = asrHour;
  let finalSunset = sunsetHour;
  let finalMaghrib = maghribHour;
  let finalIsha = ishaHour;

  if (isNaN(fajrHour) || isNaN(sunriseHour) || isNaN(sunsetHour) || isNaN(ishaHour)) {
    // Implement a simple High Latitude Rule if desired
    // Standard rule standardizes intervals based on night fraction
    const nightFraction = 1 / 4; // e.g. 25% of night as fixed spacing
    const approxSunset = 18.0; 
    const approxSunrise = 6.0;
    const approxNight = 12.0;

    if (isNaN(finalSunrise)) finalSunrise = fixHour(dhuhrHour - 6.0);
    if (isNaN(finalSunset)) finalSunset = fixHour(dhuhrHour + 6.0);
    if (isNaN(finalMaghrib)) finalMaghrib = finalSunset;
    
    if (isNaN(finalFajr)) {
      // Set Fajr to a reasonable time before sunrise
      finalFajr = fixHour(finalSunrise - (approxNight * nightFraction));
    }
    if (isNaN(finalIsha)) {
      // Set Isha to a reasonable time after sunset
      finalIsha = fixHour(finalSunset + (approxNight * nightFraction));
    }
  }

  // Apply user-defined offsets in minutes
  if (!isNaN(finalFajr)) finalFajr = fixHour(finalFajr + settings.fajrOffset / 60.0);
  if (!isNaN(finalSunrise)) finalSunrise = fixHour(finalSunrise + 0); // Sunrise no slider needed usually
  if (!isNaN(finalDhuhr)) finalDhuhr = fixHour(finalDhuhr + settings.dhuhrOffset / 60.0);
  if (!isNaN(finalAsr)) finalAsr = fixHour(finalAsr + settings.asrOffset / 60.0);
  if (!isNaN(finalSunset)) finalSunset = fixHour(finalSunset + 0);
  if (!isNaN(finalMaghrib)) finalMaghrib = fixHour(finalMaghrib + settings.maghribOffset / 60.0);
  if (!isNaN(finalIsha)) finalIsha = fixHour(finalIsha + settings.ishaOffset / 60.0);

  return {
    Fajr: formatTime(finalFajr),
    Sunrise: formatTime(finalSunrise),
    Dhuhr: formatTime(finalDhuhr),
    Asr: formatTime(finalAsr),
    Sunset: formatTime(finalSunset),
    Maghrib: formatTime(finalMaghrib),
    Isha: formatTime(finalIsha),
  };
}

// Format date elegantly in Gregorian
export function getFormattedGregorianDate(date: Date): string {
  // Format matching: "18 Jun Thu 2026" or "19 Jun Fri 2026"
  const optionsDay = { day: 'numeric' } as const;
  const optionsMonth = { month: 'short' } as const;
  const optionsWeekday = { weekday: 'short' } as const;
  const optionsYear = { year: 'numeric' } as const;

  const dayStr = date.toLocaleDateString('en-US', optionsDay);
  const monthStr = date.toLocaleDateString('en-US', optionsMonth);
  const weekdayStr = date.toLocaleDateString('en-US', optionsWeekday);
  const yearStr = date.toLocaleDateString('en-US', optionsYear);

  return `${dayStr} ${monthStr} ${weekdayStr} ${yearStr}`;
}

// Convert Gregorian to Hijri accurately with Intl.DateTimeFormat
export function getHijriDate(date: Date, adjustmentDays: number = 0): HijriDate {
  try {
    const adjustedDate = new Date(date);
    if (adjustmentDays !== 0) {
      adjustedDate.setDate(adjustedDate.getDate() + adjustmentDays);
    }
    
    // Format using the islamic-umalqura calendar directly if supported
    const formatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    
    const parts = formatter.formatToParts(adjustedDate);
    let dayStr = '';
    let monthName = '';
    let yearStr = '';
    
    parts.forEach(part => {
      if (part.type === 'day') dayStr = part.value;
      else if (part.type === 'month') monthName = part.value;
      else if (part.type === 'year') yearStr = part.value;
    });

    // Make sure month is clean
    if (!monthName) monthName = 'Muharram';
    
    const day = parseInt(dayStr, 10) || adjustedDate.getDate();
    const year = parseInt(yearStr, 10) || 1448;
    
    // In some systems, formatting might output English descriptions, let's translate or keep clean
    // Strip trailing 'AH' if present
    const cleanedYearStr = yearStr.replace('AH', '').trim();
    const formatted = `${day} ${monthName} ${cleanedYearStr}`;

    return {
      day,
      monthName,
      monthNumber: 1,
      year: parseInt(cleanedYearStr, 10) || year,
      formatted,
    };
  } catch (e) {
    // Fallback if not supported
    // Math based Hijri calendar fallback
    const jd = getJulianDate(date.getFullYear(), date.getMonth() + 1, date.getDate()) + adjustmentDays;
    const l = jd - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    const l_adjusted = l - 10631 * n + 354;
    const j = Math.floor((10985 - l_adjusted) / 5316) * Math.floor((50 * l_adjusted) / 17719) + Math.floor(l_adjusted / 5670) * Math.floor((43 * l_adjusted) / 15238);
    const l_final = l_adjusted - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
    const m = Math.floor((24 * l_final) / 709);
    const d = l_final - Math.floor((709 * m) / 24);
    const y = 30 * n + j - 30;

    const islamicMonths = [
      'Muharram', 'Safar', 'Rabi\' al-Awwal', 'Rabi\' ath-Thani',
      'Jumada al-Awwal', 'Jumada ath-Thani', 'Rajab', 'Sha\'ban',
      'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
    ];
    const monthIndex = Math.min(11, Math.max(0, m - 1));
    const mName = islamicMonths[monthIndex];

    return {
      day: d,
      monthName: mName,
      monthNumber: m + 1,
      year: y,
      formatted: `${d} ${mName} ${y}`,
    };
  }
}

// Popular world cities dataset for instant search
export interface PresetCity {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: number;
}

export const POPULAR_CITIES: PresetCity[] = [
  { name: 'Gujrat', country: 'Pakistan', latitude: 32.5731, longitude: 74.0789, timezone: 5 },
  { name: 'Mecca', country: 'Saudi Arabia', latitude: 21.3891, longitude: 39.8579, timezone: 3 },
  { name: 'Medina', country: 'Saudi Arabia', latitude: 24.4672, longitude: 39.6111, timezone: 3 },
  { name: 'Cairo', country: 'Egypt', latitude: 30.0444, longitude: 31.2357, timezone: 2 },
  { name: 'London', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278, timezone: 1 },
  { name: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.0060, timezone: -4 },
  { name: 'Karachi', country: 'Pakistan', latitude: 24.8607, longitude: 67.0011, timezone: 5 },
  { name: 'Lahore', country: 'Pakistan', latitude: 31.5204, longitude: 74.3587, timezone: 5 },
  { name: 'Islamabad', country: 'Pakistan', latitude: 33.6844, longitude: 73.0479, timezone: 5 },
  { name: 'Dubai', country: 'United Arab Emirates', latitude: 25.2048, longitude: 55.2708, timezone: 4 },
  { name: 'Istanbul', country: 'Turkey', latitude: 41.0082, longitude: 28.9784, timezone: 3 },
  { name: 'Jakarta', country: 'Indonesia', latitude: -6.2088, longitude: 106.8456, timezone: 7 },
  { name: 'Kuala Lumpur', country: 'Malaysia', latitude: 3.1390, longitude: 101.6869, timezone: 8 },
  { name: 'Dhaka', country: 'Bangladesh', latitude: 23.8103, longitude: 90.4125, timezone: 6 },
  { name: 'Riyadh', country: 'Saudi Arabia', latitude: 24.7136, longitude: 46.6753, timezone: 3 },
  { name: 'Kazan', country: 'Russia', latitude: 55.7887, longitude: 49.1221, timezone: 3 },
  { name: 'Toronto', country: 'Canada', latitude: 43.6532, longitude: -79.3832, timezone: -4 },
  { name: 'Sydney', country: 'Australia', latitude: -33.8688, longitude: 151.2093, timezone: 10 },
  { name: 'Cape Town', country: 'South Africa', latitude: -33.9249, longitude: 18.4241, timezone: 2 },
  { name: 'Mumbai', country: 'India', latitude: 19.0760, longitude: 72.8777, timezone: 5.5 },
  { name: 'Delhi', country: 'India', latitude: 28.6139, longitude: 77.2090, timezone: 5.5 },
  { name: 'Baghdad', country: 'Iraq', latitude: 33.3152, longitude: 44.3661, timezone: 3 },
  { name: 'Amman', country: 'Jordan', latitude: 31.9522, longitude: 35.9106, timezone: 3 },
  { name: 'Tunis', country: 'Tunisia', latitude: 36.8065, longitude: 10.1815, timezone: 1 },
  { name: 'Casablanca', country: 'Morocco', latitude: 33.5731, longitude: -7.5898, timezone: 1 },
  { name: 'Tehran', country: 'Iran', latitude: 35.6892, longitude: 51.3890, timezone: 3.5 },
];
