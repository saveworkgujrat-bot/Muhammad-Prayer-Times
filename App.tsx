/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Volume2,
  VolumeX,
  Compass,
  MapPin,
  Settings,
  Search,
  Navigation,
  Globe,
  Clock,
  ChevronDown,
  Layout,
  Smartphone,
  Copy,
  Check,
  Info,
  Calendar,
  AlertTriangle,
  ExternalLink,
  Sunset as SunsetIcon,
  Sunrise as SunriseIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LocationData,
  CalculationMethod,
  AsrMethod,
  HighLatitudeRule,
  SoundAlert,
  PrayerSettings
} from './types';
import {
  calculatePrayerTimes,
  getHijriDate,
  getFormattedGregorianDate,
  POPULAR_CITIES
} from './utils/prayerCalc';
import { playSound } from './utils/audioSynth';
import SettingsModal from './components/SettingsModal';

function MosqueIcon({ className = "w-8 h-8", active = false }: { className?: string; active?: boolean }) {
  const strokeColor = active ? "#10b981" : "#94a3b8"; // emerald-500 vs slate-405
  const activeFill = active ? "rgba(16, 185, 129, 0.2)" : "rgba(148, 163, 184, 0.05)";
  const gateFill = active ? "rgba(16, 185, 129, 0.4)" : "rgba(148, 163, 184, 0.15)";
  
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={`${className} transition-all duration-300 ${active ? 'scale-110 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]' : ''}`} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Crescent moon on top of dome */}
      <path 
        d="M12 2C12.3 2 12.55 2.1 12.7 2.3C12.3 2.7 12.1 3.2 12.1 3.75C12.1 4.7 12.9 5.5 13.85 5.5C14.15 5.5 14.4 5.4 14.65 5.25C14.35 5.85 13.7 6.25 13 6.25C11.6 6.25 10.5 5.15 10.5 3.75C10.5 2.75 11.1 1.9 12 2Z" 
        fill={strokeColor} 
      />
      
      {/* Spire directly below crescent */}
      <path d="M12 6.25V7.5" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round"/>

      {/* Main Dome */}
      <path 
        d="M6.5 14.5C6.5 10.5 8.5 8.5 12 8.5C15.5 8.5 17.5 10.5 17.5 14.5H6.5Z" 
        fill={activeFill} 
        stroke={strokeColor} 
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* traditional dome arch inlay */}
      <path 
        d="M9.5 14.5C9.5 12.2 10.5 11.2 12 11.2C13.5 11.2 14.5 12.2 14.5 14.5" 
        stroke={strokeColor} 
        strokeWidth="1.2"
      />

      {/* Left Minaret Tower */}
      <path 
        d="M3 12C3 11 3.5 10.5 4 10.5C4.5 10.5 5 11 5 12V19.5H3V12Z" 
        fill={activeFill}
        stroke={strokeColor} 
        strokeWidth="1.5" 
        strokeLinejoin="round"
      />
      {/* Left Tower spire */}
      <path d="M4 10.5V8.5" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M3.5 8.5H4.5" stroke={strokeColor} strokeWidth="1.2" />

      {/* Right Minaret Tower */}
      <path 
        d="M19 12C19 11 19.5 10.5 20 10.5C20.5 10.5 21 11 21 12V19.5H19V12Z" 
        fill={activeFill}
        stroke={strokeColor} 
        strokeWidth="1.5" 
        strokeLinejoin="round"
      />
      {/* Right Tower spire */}
      <path d="M20 10.5V8.5" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M19.5 8.5H20.5" stroke={strokeColor} strokeWidth="1.2" />

      {/* Foundation Block base */}
      <path d="M2 19.5H22" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
      <rect x="5.5" y="14.5" width="13" height="5" fill={activeFill} stroke={strokeColor} strokeWidth="1.5" />

      {/* Gateway entrance door */}
      <path 
        d="M10.5 19.5V16.8C10.5 16 11.2 15.3 12 15.3C12.8 15.3 13.5 16 13.5 16.8V19.5" 
        fill={gateFill} 
        stroke={strokeColor} 
        strokeWidth="1.2"
      />
    </svg>
  );
}

const DEFAULT_SETTINGS: PrayerSettings = {
  method: CalculationMethod.Karachi,
  asrMethod: AsrMethod.Hanafi,
  highLatitudeRule: HighLatitudeRule.AngleBased,
  soundAlert: SoundAlert.SoftDistantAdhan,
  isNotificationEnabled: true,
  volume: 0.6,
  fajrOffset: 0,
  dhuhrOffset: 0,
  asrOffset: 0,
  maghribOffset: 0,
  ishaOffset: 0,
};

const DEFAULT_LOCATION: LocationData = {
  city: 'Gujrat',
  country: 'Pakistan',
  latitude: 32.5731,
  longitude: 74.0789,
  timezone: 5,
  source: 'default',
};

export default function App() {
  const [currentTime, setCurrentTime] = useState(() => new Date());
  
  // Settings & Location state - lazy loaded from localStorage
  const [settings, setSettings] = useState<PrayerSettings>(() => {
    const saved = localStorage.getItem('muslim_prayer_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [location, setLocation] = useState<LocationData>(() => {
    const saved = localStorage.getItem('muslim_prayer_location');
    return saved ? JSON.parse(saved) : DEFAULT_LOCATION;
  });

  // UI state
  const [activeTab, setActiveTab] = useState<'tracker' | 'widgets'>('tracker');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCitySearchOpen, setIsCitySearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastNotifiedPrayer, setLastNotifiedPrayer] = useState('');
  const [hijriOffset, setHijriOffset] = useState<number>(0);
  const [systemAlertMessage, setSystemAlertMessage] = useState<string | null>(null);
  
  // Widget Customization States
  const [customWidgetSize, setCustomWidgetSize] = useState<'small' | 'medium' | 'lock'>('medium');
  const [customWidgetTheme, setCustomWidgetTheme] = useState<'emerald' | 'slate' | 'gold' | 'mono'>('emerald');
  const [isCopied, setIsCopied] = useState(false);

  // Widget Router Detection
  const [isWidgetMode, setIsWidgetMode] = useState(false);
  const [widgetType, setWidgetType] = useState<'small' | 'medium' | 'lock'>('small');
  const [widgetTheme, setWidgetTheme] = useState<'emerald' | 'slate' | 'gold' | 'mono'>('emerald');

  // Load URL query params if we are in embedded widget mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const widgetParam = params.get('widget');
    if (widgetParam) {
      setIsWidgetMode(true);
      setWidgetType(widgetParam as any || 'small');
      
      const themeParam = params.get('theme');
      if (themeParam) {
        setWidgetTheme(themeParam as any);
      }
      
      const cityParam = params.get('city');
      const countryParam = params.get('country') || '';
      const latParam = params.get('lat');
      const lngParam = params.get('lng');
      const tzParam = params.get('tz');

      if (cityParam && latParam && lngParam) {
        setLocation({
          city: cityParam,
          country: countryParam,
          latitude: parseFloat(latParam),
          longitude: parseFloat(lngParam),
          timezone: tzParam ? parseFloat(tzParam) : 5,
          source: 'manual',
        });
      }
    }
  }, []);

  // Sync state changes to localStorage
  useEffect(() => {
    if (!isWidgetMode) {
      localStorage.setItem('muslim_prayer_settings', JSON.stringify(settings));
    }
  }, [settings, isWidgetMode]);

  useEffect(() => {
    if (!isWidgetMode) {
      localStorage.setItem('muslim_prayer_location', JSON.stringify(location));
    }
  }, [location, isWidgetMode]);

  // Read Hijri adjustments on mount & local changes
  useEffect(() => {
    const loadHijriAdjustment = () => {
      const saved = localStorage.getItem('hijri_adjustment');
      setHijriOffset(saved ? parseInt(saved, 10) : 0);
    };
    loadHijriAdjustment();
    window.addEventListener('storage', loadHijriAdjustment);
    return () => window.removeEventListener('storage', loadHijriAdjustment);
  }, []);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Automatic Non-blocking Geolocation Adapter on first launch
  useEffect(() => {
    if (!isWidgetMode && location.source === 'default') {
      if (navigator.geolocation) {
        // Attempt immediate fetch to provide high-precision localized setup
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            const timezone = -new Date().getTimezoneOffset() / 60;
            setLocation({
              city: 'Mobile Location',
              country: 'Gps Detected',
              latitude: parseFloat(latitude.toFixed(4)),
              longitude: parseFloat(longitude.toFixed(4)),
              timezone,
              source: 'auto',
            });
            setSystemAlertMessage('Located! Adapted prayer times for your exact coordinate location.');
            setTimeout(() => setSystemAlertMessage(null), 6000);
          },
          () => {
            // Silently fallback without bothering the user since Gujrat defaults are loaded
          }
        );
      }
    }
  }, [isWidgetMode]);

  // Calculations for TODAY & TOMORROW
  const prayerTimes = calculatePrayerTimes(
    currentTime,
    location.latitude,
    location.longitude,
    location.timezone,
    settings
  );

  const tomorrowDate = new Date(currentTime);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowPrayerTimes = calculatePrayerTimes(
    tomorrowDate,
    location.latitude,
    location.longitude,
    location.timezone,
    settings
  );

  // Parse time format "H:MM AM" into localized Date objects
  const getPrayerDateTime = (timeStr: string, baseDate: Date): Date => {
    const d = new Date(baseDate);
    const cleaned = timeStr.trim().toUpperCase();
    const isPM = cleaned.includes('PM');
    const isAM = cleaned.includes('AM');
    const numericPart = cleaned.replace(/[AP]M/, '').trim();
    const [hStr, mStr] = numericPart.split(':');
    let hours = parseInt(hStr, 10);
    const minutes = parseInt(mStr, 10);

    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  // Identify next prayer and calculate countdown
  const getNextPrayerDetails = () => {
    const F = getPrayerDateTime(prayerTimes.Fajr, currentTime);
    const D = getPrayerDateTime(prayerTimes.Dhuhr, currentTime);
    const A = getPrayerDateTime(prayerTimes.Asr, currentTime);
    const M = getPrayerDateTime(prayerTimes.Maghrib, currentTime);
    const I = getPrayerDateTime(prayerTimes.Isha, currentTime);
    const tomorrowFajr = getPrayerDateTime(tomorrowPrayerTimes.Fajr, tomorrowDate);

    const checkList = [
      { name: 'Fajr', time: F },
      { name: 'Dhuhr', time: D },
      { name: 'Asr', time: A },
      { name: 'Maghrib', time: M },
      { name: 'Isha', time: I },
    ];

    let nextPrayer = { name: 'Fajr', time: tomorrowFajr, isTomorrow: true };
    for (const p of checkList) {
      if (currentTime < p.time) {
        nextPrayer = { name: p.name, time: p.time, isTomorrow: false };
        break;
      }
    }

    const diffMs = nextPrayer.time.getTime() - currentTime.getTime();
    const diffSecsTotal = Math.max(0, Math.floor(diffMs / 1000));
    const hours = Math.floor(diffSecsTotal / 3600);
    const minutes = Math.floor((diffSecsTotal % 3600) / 60);
    const seconds = diffSecsTotal % 60;

    const formattedCountdown = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    return {
      name: nextPrayer.name,
      timeString: nextPrayer.isTomorrow ? tomorrowPrayerTimes[nextPrayer.name] : prayerTimes[nextPrayer.name],
      countdown: formattedCountdown,
      totalSecondsLeft: diffSecsTotal
    };
  };

  const nextPrayer = getNextPrayerDetails();

  // Active current prayer
  const getActivePrayer = () => {
    const F = getPrayerDateTime(prayerTimes.Fajr, currentTime);
    const S = getPrayerDateTime(prayerTimes.Sunrise, currentTime);
    const D = getPrayerDateTime(prayerTimes.Dhuhr, currentTime);
    const A = getPrayerDateTime(prayerTimes.Asr, currentTime);
    const M = getPrayerDateTime(prayerTimes.Maghrib, currentTime);
    const I = getPrayerDateTime(prayerTimes.Isha, currentTime);

    if (currentTime >= F && currentTime < S) return 'Fajr';
    if (currentTime >= S && currentTime < D) return 'Sunrise';
    if (currentTime >= D && currentTime < A) return 'Dhuhr';
    if (currentTime >= A && currentTime < M) return 'Asr';
    if (currentTime >= M && currentTime < I) return 'Maghrib';
    return 'Isha';
  };

  const activePrayer = getActivePrayer();

  // Android Widget update synchronizer bridge integration
  useEffect(() => {
    const bridge = (window as any).AndroidBridge;
    if (bridge) {
      try {
        bridge.updateWidget(
          JSON.stringify(prayerTimes),
          nextPrayer.name,
          nextPrayer.countdown,
          location.city
        );
      } catch (e) {
        console.warn("Failed updating Android AppWidget provider:", e);
      }
    }
  }, [prayerTimes, nextPrayer, location.city]);

  // Alarm and system notification triggers
  useEffect(() => {
    if (isWidgetMode) return;

    const currentMinStr = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const matchedName = Object.keys(prayerTimes).find((key) => {
      if (key === 'Sunrise' || key === 'Sunset') return false;
      return prayerTimes[key] === currentMinStr;
    });

    if (matchedName && lastNotifiedPrayer !== matchedName) {
      setLastNotifiedPrayer(matchedName);
      playSound(settings.soundAlert, settings.volume);

      if (settings.isNotificationEnabled && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(`Prayer Alert: ${matchedName}`, {
            body: `It is now time for ${matchedName} prayer.`,
            icon: 'https://img.icons8.com/isometric/256/mosque.png'
          });
        }
      }

      setSystemAlertMessage(`Adhan notification! It is the onset of ${matchedName} prayer time.`);
      setTimeout(() => setSystemAlertMessage(null), 10000);
    }
  }, [currentTime, prayerTimes, settings, lastNotifiedPrayer, isWidgetMode]);

  // Notification toggler
  const handleToggleNotification = () => {
    if (!('Notification' in window)) {
      alert('This web browser does not support native push notifications.');
      return;
    }

    if (Notification.permission === 'default') {
      Notification.requestPermission().then((perm) => {
        setSettings((prev) => ({ ...prev, isNotificationEnabled: perm === 'granted' }));
      });
    } else {
      setSettings((prev) => ({
        ...prev,
        isNotificationEnabled: !prev.isNotificationEnabled && Notification.permission === 'granted'
      }));
    }
  };

  // Geo Location Manual Button trigger
  const handleTriggerGeoLocation = () => {
    if (!navigator.geolocation) {
      alert('Your browser does not permit geolocation triggers.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const timezone = -new Date().getTimezoneOffset() / 60;
        setLocation({
          city: 'My Location',
          country: 'Gps Synced',
          latitude: parseFloat(latitude.toFixed(4)),
          longitude: parseFloat(longitude.toFixed(4)),
          timezone,
          source: 'auto',
        });
        setSystemAlertMessage('GPS Location Synced successfully!');
        setTimeout(() => setSystemAlertMessage(null), 4000);
        setIsCitySearchOpen(false);
      },
      (err) => {
        alert(`Location acquisition failed: ${err.message}. Please use manual entry.`);
      }
    );
  };

  const handleSelectCity = (city: typeof POPULAR_CITIES[0]) => {
    setLocation({
      city: city.name,
      country: city.country,
      latitude: city.latitude,
      longitude: city.longitude,
      timezone: city.timezone,
      source: 'manual',
    });
    setIsCitySearchOpen(false);
  };

  const filteredCities = POPULAR_CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hijriFormatted = getHijriDate(currentTime, hijriOffset).formatted;
  const gregorianFormatted = getFormattedGregorianDate(currentTime);

  // Share link generator for widgets
  const getWidgetUrl = (size: 'small' | 'medium' | 'lock', themeStyle: string) => {
    const base = window.location.origin + window.location.pathname;
    return `${base}?widget=${size}&theme=${themeStyle}&city=${encodeURIComponent(location.city)}&country=${encodeURIComponent(location.country)}&lat=${location.latitude}&lng=${location.longitude}&tz=${location.timezone}`;
  };

  const handleCopyWidgetUrl = () => {
    const url = getWidgetUrl(customWidgetSize, customWidgetTheme);
    navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    });
  };

  // Theme styling helpers for widgets
  const getWidgetBackgroundClass = (theme: 'emerald' | 'slate' | 'gold' | 'mono') => {
    switch (theme) {
      case 'emerald':
        return 'bg-gradient-to-br from-teal-950 via-emerald-950 to-teal-950 border border-emerald-500/20 text-white';
      case 'slate':
        return 'bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 text-white';
      case 'gold':
        return 'bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40 border border-amber-500/10 text-white';
      case 'mono':
        return 'bg-black border border-neutral-800 text-white';
      default:
        return 'bg-slate-900 border border-slate-800 text-white';
    }
  };

  const getWidgetTextClass = (theme: 'emerald' | 'slate' | 'gold' | 'mono') => {
    switch (theme) {
      case 'emerald':
        return 'text-emerald-400';
      case 'slate':
        return 'text-slate-400';
      case 'gold':
        return 'text-amber-400/90';
      case 'mono':
        return 'text-white font-medium';
      default:
        return 'text-emerald-400';
    }
  };

  // =============================
  // RENDER METHOD 1: WIDGET ROUTER MODE (Full Screen Borderless widget template)
  // =============================
  if (isWidgetMode) {
    return (
      <div className={`p-4 min-h-screen flex items-center justify-center ${
        widgetTheme === 'mono' ? 'bg-black' : 'bg-slate-950'
      }`}>
        {widgetType === 'small' && (
          <div className={`w-[170px] h-[170px] p-4 rounded-3xl ${getWidgetBackgroundClass(widgetTheme)} flex flex-col justify-between shadow-2xl relative overflow-hidden select-none`}>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{nextPrayer.name} in</span>
                <Clock size={11} className={getWidgetTextClass(widgetTheme)} />
              </div>
              <div className="text-2xl font-extrabold tracking-tight font-mono mt-1 text-white leading-none">
                {nextPrayer.countdown}
              </div>
            </div>
            <div className="border-t border-white/5 pt-1.5">
              <div className="text-[12px] font-bold text-white flex items-center gap-1">
                <MapPin size={9} className={getWidgetTextClass(widgetTheme)} />
                <span className="truncate">{location.city}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-medium flex items-center justify-between">
                <span>Next: {nextPrayer.timeString}</span>
                <span className={`text-[9px] font-bold ${getWidgetTextClass(widgetTheme)}`}>{activePrayer} Now</span>
              </div>
            </div>
          </div>
        )}

        {widgetType === 'medium' && (
          <div className={`w-[340px] h-[170px] p-4 rounded-3xl ${getWidgetBackgroundClass(widgetTheme)} flex justify-between gap-3 shadow-2xl select-none`}>
            {/* Left side column */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">NEXT PRAYER</span>
                <h3 className="text-lg font-black text-white flex items-center gap-1.5 leading-none mt-0.5">
                  {nextPrayer.name}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded bg-white/5 font-semibold ${getWidgetTextClass(widgetTheme)}`}>
                    {nextPrayer.timeString}
                  </span>
                </h3>
                <div className="text-3xl font-extrabold font-mono tracking-tight text-white mt-1.5 leading-none">
                  {nextPrayer.countdown}
                </div>
              </div>
              <div className="border-t border-white/10 pt-2 flex items-center gap-1.5">
                <MapPin size={10} className={getWidgetTextClass(widgetTheme)} />
                <span className="text-xs font-bold text-white truncate max-w-[130px]">{location.city}</span>
              </div>
            </div>

            {/* Right side mini-timeline column */}
            <div className="w-[120px] bg-white/5 rounded-2xl p-2.5 flex flex-col justify-between text-xs border border-white/[0.02]">
              <div className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mb-1 border-b border-white/5 pb-1 text-center">
                Today Schedule
              </div>
              <div className="space-y-1">
                {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((name) => {
                  const isActive = activePrayer === name;
                  return (
                    <div key={name} className="flex items-center justify-between text-[11px]">
                      <span className={`font-semibold ${isActive ? getWidgetTextClass(widgetTheme) : 'text-slate-300'}`}>
                        {name}
                      </span>
                      <span className={`font-mono text-[10px] ${isActive ? 'text-white font-bold' : 'text-slate-500'}`}>
                        {prayerTimes[name]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {widgetType === 'lock' && (
          <div className="w-[160px] p-3 rounded-2xl bg-black border border-neutral-800 flex flex-col gap-1 shadow-md text-white font-sans text-center">
            <div className="text-[10px] font-bold text-neutral-400 tracking-widest uppercase">
              {nextPrayer.name} countdown
            </div>
            <div className="text-xl font-bold font-mono tracking-tighter text-white select-all">
              {nextPrayer.countdown}
            </div>
            <div className="text-[10px] text-neutral-500 font-medium">
              🕌 {location.city} • {nextPrayer.timeString}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =============================
  // RENDER METHOD 2: STANDARD COMPANION INTERFACE
  // =============================
  return (
    <div className="islamic-pattern min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 text-white font-sans overflow-x-hidden pb-12">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-48 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-md mx-auto px-4 pt-6 relative z-10">
        
        {/* Toast system alerts */}
        <AnimatePresence>
          {systemAlertMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 p-3.5 rounded-2xl shadow-xl border border-emerald-300/30 flex items-center justify-between text-xs font-bold"
            >
              <div className="flex items-center gap-2">
                <Bell size={16} className="animate-bounce" />
                <span>{systemAlertMessage}</span>
              </div>
              <button 
                onClick={() => setSystemAlertMessage(null)} 
                className="opacity-80 hover:opacity-100 font-bold ml-2 bg-slate-950/20 hover:bg-slate-950/40 rounded-full w-5 h-5 flex items-center justify-center"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Header Panel (Hijri format, Settings button) */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xl font-bold tracking-tight text-emerald-400 drop-shadow-md"
            >
              {hijriFormatted}
            </motion.h1>
            <p className="text-xs text-slate-400 font-semibold tracking-wide mt-0.5">
              {gregorianFormatted}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              id="header_notif_toggle"
              onClick={handleToggleNotification}
              title={settings.isNotificationEnabled ? 'Silence audio and push notifications' : 'Enable prayer alarms'}
              className={`rounded-full p-2.5 transition-all outline-none border ${
                settings.isNotificationEnabled 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 shadow-emerald-550/10 shadow-lg' 
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              {settings.isNotificationEnabled ? <Bell size={18} className="animate-pulse" /> : <VolumeX size={18} />}
            </button>
            <button
              id="header_settings_btn"
              onClick={() => setIsSettingsOpen(true)}
              title="Open full parameters"
              className="rounded-full bg-slate-900/80 border border-slate-805/80 p-2.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-all shadow-md"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* Segmented Controller Tab Bar */}
        <div className="bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800/80 grid grid-cols-2 gap-1.5 mb-5 shadow-lg">
          <button
            id="tab_companion"
            onClick={() => setActiveTab('tracker')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'tracker'
                ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Compass size={14} />
            <span>Daily Tracker</span>
          </button>
          <button
            id="tab_widgets"
            onClick={() => setActiveTab('widgets')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'widgets'
                ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Layout size={14} />
            <span>Mobile Widgets</span>
          </button>
        </div>

        {/* TAB 1: DAILY PRAYER TRACKER (Main App view) */}
        {activeTab === 'tracker' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {/* Sunrise / Sunset Dual Widget */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-3.5 flex items-center gap-3 shadow-md">
                <div className="rounded-xl bg-orange-500/10 p-2.5 text-orange-400 shrink-0">
                  <SunriseIcon size={18} />
                </div>
                <div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sunrise</div>
                  <div className="text-sm font-extrabold text-slate-100">{prayerTimes.Sunrise}</div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-3.5 flex items-center gap-3 shadow-md">
                <div className="rounded-xl bg-indigo-500/10 p-2.5 text-indigo-400 shrink-0">
                  <SunsetIcon size={18} />
                </div>
                <div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sunset</div>
                  <div className="text-sm font-extrabold text-slate-100">{prayerTimes.Sunset}</div>
                </div>
              </div>
            </div>

            {/* Main Central Countdown display */}
            <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-slate-900 via-slate-905 to-emerald-950/40 p-6 shadow-2xl text-center mb-5">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/5 blur-3xl rounded-full" />
              
              <p className="text-xs font-semibold text-emerald-400 mb-1.5 tracking-wider uppercase">
                Remaining time for <span className="font-extrabold text-white bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/20 ml-1 inline-block text-xs">{nextPrayer.name}</span>
              </p>
              
              <h2 id="live_countdown_timer" className="text-4xl sm:text-5xl font-black text-slate-100 tracking-tight font-mono drop-shadow mb-4">
                {nextPrayer.countdown}
              </h2>

              {/* Dynamic Location Pill Indicator */}
              <div 
                id="location_custom_pill"
                onClick={() => setIsCitySearchOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-800/40 hover:bg-slate-800 hover:border-emerald-555/40 pl-3.5 pr-2 py-1.5 transition-all text-xs cursor-pointer shadow-md select-none group"
              >
                <MapPin size={12} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-slate-200 group-hover:text-emerald-300">
                  {location.city}, {location.country}
                </span>
                <span className="text-[9px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-400 uppercase font-mono group-hover:bg-slate-655 font-bold">
                  {location.source === 'auto' ? 'GPS' : 'PIN'}
                </span>
                <div className="rounded-full bg-slate-705 p-0.5">
                  <ChevronDown size={10} className="text-slate-400 group-hover:text-white" />
                </div>
              </div>
            </div>

            {/* City Preset Selection Overlay panel */}
            <AnimatePresence>
              {isCitySearchOpen && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-5 bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Globe size={13} className="text-teal-400 animate-spin-slow" />
                      Select Prayer Location
                    </span>
                    <button 
                      onClick={() => setIsCitySearchOpen(false)}
                      className="text-[11px] font-bold text-slate-400 hover:text-white bg-slate-800/80 px-2.5 py-0.5 rounded-md"
                    >
                      Close
                    </button>
                  </div>

                  <div className="relative mb-2.5">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="search_query_input"
                      type="text"
                      placeholder="Search preset cities..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-xs rounded-xl bg-slate-950 border border-slate-800/80 pl-9 pr-3 py-2 outline-none focus:border-emerald-500 text-white"
                    />
                  </div>

                  {/* Scrollable list */}
                  <div className="grid grid-cols-2 gap-1 max-h-36 overflow-y-auto pr-1 mb-3">
                    {filteredCities.length > 0 ? (
                      filteredCities.map((city) => (
                        <button
                          key={city.name}
                          onClick={() => handleSelectCity(city)}
                          className="flex items-center justify-between rounded-xl bg-slate-950/40 hover:bg-emerald-500/10 border border-transparent px-3 py-2 text-left text-xs transition-all group"
                        >
                          <span className="text-slate-300 font-bold group-hover:text-emerald-300">{city.name}</span>
                          <span className="text-[10px] text-slate-500">{city.country}</span>
                        </button>
                      ))
                    ) : (
                      <div className="col-span-2 text-center text-xs text-slate-500 py-3">No preset matching your entry. Use coordinates.</div>
                    )}
                  </div>

                  {/* Manual / Geolocation control shortcuts */}
                  <div className="flex gap-2 border-t border-slate-800/80 pt-2.5">
                    <button
                      id="gps_location_acquire_btn"
                      onClick={handleTriggerGeoLocation}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl py-2 text-xs font-extrabold transition-all flex items-center justify-center gap-1 shadow-md shadow-emerald-500/10"
                    >
                      <Navigation size={12} className="fill-current" />
                      <span>Use Auto GPS Geolocation</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* List of Prayer Times */}
            <div className="space-y-2.5">
              {[
                { name: 'Fajr', label: 'Dawn Prayer', time: prayerTimes.Fajr },
                { name: 'Dhuhr', label: 'Midday Prayer', time: prayerTimes.Dhuhr },
                { name: 'Asr', label: 'Afternoon Prayer', time: prayerTimes.Asr },
                { name: 'Maghrib', label: 'Sunset Prayer', time: prayerTimes.Maghrib },
                { name: 'Isha', label: 'Night Prayer', time: prayerTimes.Isha },
              ].map((item) => {
                const isActive = activePrayer === item.name;
                return (
                  <div
                    key={item.name}
                    className={`rounded-2xl border p-3.5 flex items-center justify-between shadow-md transition-all ${
                      isActive 
                        ? 'border-emerald-500 bg-gradient-to-r from-emerald-950/50 via-slate-900 to-emerald-950/20 shadow-emerald-500/10' 
                        : 'border-slate-800/40 bg-slate-900/30 opacity-90'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`rounded-xl p-1.5 shrink-0 w-11 h-11 flex items-center justify-center transition-all duration-300 ${
                        isActive ? 'bg-emerald-500/15 border border-emerald-500/30 shadow-md shadow-emerald-500/10' : 'bg-slate-950 border border-slate-800/60'
                      }`}>
                        <MosqueIcon active={isActive} className="w-8 h-8" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-bold ${isActive ? 'text-emerald-400' : 'text-slate-100'}`}>
                            {item.name}
                          </span>
                          {isActive && (
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-extrabold px-1.5 py-0.5 rounded tracking-wider uppercase">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-semibold">{item.label}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-sm font-bold font-mono tracking-wide ${isActive ? 'text-emerald-300' : 'text-slate-200'}`}>
                        {item.time}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* TAB 2: MOBILE WIDGET DESIGNER & SIMULATOR (Requested Solution) */}
        {activeTab === 'widgets' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            {/* Widget config instructions card */}
            <div className="rounded-2xl bg-emerald-950/20 border border-emerald-500/15 p-4 text-xs leading-normal text-slate-300">
              <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1.5">
                <Info size={14} />
                <span>Mobile Widget Installer</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                We support live dynamic Home Screen and Lock Screen widgets. Customize the size and visual aesthetic theme below, then copy the live widget render link to pin onto your screen using iOS Web widgets or PWA.
              </p>
            </div>

            {/* Design Controls */}
            <div className="space-y-3.5 bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
                  Widget Template Selection
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'small', label: 'Square 2x2' },
                    { id: 'medium', label: 'Banner 4x2' },
                    { id: 'lock', label: 'Lock Circular' },
                  ].map((sz) => (
                    <button
                      key={sz.id}
                      onClick={() => setCustomWidgetSize(sz.id as any)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        customWidgetSize === sz.id
                          ? 'border-emerald-500 bg-emerald-555/10 text-emerald-400 font-extrabold'
                          : 'border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
                  Color Aesthetic Style
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'emerald', bg: 'bg-emerald-600', val: 'Classic' },
                    { id: 'slate', bg: 'bg-slate-700', val: 'Slate' },
                    { id: 'gold', bg: 'bg-amber-600', val: 'Gold' },
                    { id: 'mono', bg: 'bg-zinc-800', val: 'Stark' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setCustomWidgetTheme(t.id as any)}
                      className={`py-1.5 rounded-lg text-[11px] font-bold transition-all border flex flex-col items-center justify-center gap-1 ${
                        customWidgetTheme === t.id
                          ? 'border-emerald-400 bg-emerald-555/5 text-emerald-400'
                          : 'border-slate-800 text-slate-400 hover:bg-slate-805'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${t.bg}`} />
                      <span>{t.val}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* LIVE WIDGET SIMULATOR STAGE */}
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2.5 text-center">
                Home Screen Widget Live Simulator
              </div>
              
              <div className="flex justify-center bg-slate-950 p-6 rounded-3xl border border-slate-800/60 shadow-inner relative overflow-hidden min-h-[220px] items-center">
                {/* Simulated mobile screen wallpaper background */}
                <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/30 via-emerald-950/20 to-black" />

                <AnimatePresence mode="wait">
                  {customWidgetSize === 'small' && (
                    <motion.div
                      key="sim_small"
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.94 }}
                      className={`w-[170px] h-[170px] p-4 rounded-3xl ${getWidgetBackgroundClass(customWidgetTheme)} flex flex-col justify-between shadow-2xl relative overflow-hidden select-none`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{nextPrayer.name} in</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        </div>
                        <div className="text-2xl font-black tracking-tight font-mono mt-1 text-white leading-none">
                          {nextPrayer.countdown}
                        </div>
                      </div>
                      <div className="border-t border-white/5 pt-1.5">
                        <div className="text-[11px] font-bold text-white flex items-center gap-1">
                          <MapPin size={9} className={getWidgetTextClass(customWidgetTheme)} />
                          <span className="truncate">{location.city}</span>
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5 font-semibold flex items-center justify-between">
                          <span>Next: {nextPrayer.timeString}</span>
                          <span className={`text-[8px] font-bold ${getWidgetTextClass(customWidgetTheme)}`}>{activePrayer}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {customWidgetSize === 'medium' && (
                    <motion.div
                      key="sim_medium"
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.94 }}
                      className={`w-[340px] h-[170px] p-4 rounded-3xl ${getWidgetBackgroundClass(customWidgetTheme)} flex justify-between gap-3 shadow-2xl select-none`}
                    >
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">NEXT PRAYER</span>
                          <h3 className="text-sm font-black text-white flex items-center gap-1.5 leading-none mt-0.5">
                            {nextPrayer.name}
                            <span className={`text-[9px] px-1.5 py-0.5 rounded bg-white/5 font-semibold ${getWidgetTextClass(customWidgetTheme)}`}>
                              {nextPrayer.timeString}
                            </span>
                          </h3>
                          <div className="text-2xl font-black font-mono tracking-tight text-white mt-2 leading-none">
                            {nextPrayer.countdown}
                          </div>
                        </div>
                        <div className="border-t border-white/10 pt-2 flex items-center gap-1.5">
                          <MapPin size={10} className={getWidgetTextClass(customWidgetTheme)} />
                          <span className="text-xs font-bold text-white truncate max-w-[130px]">{location.city}</span>
                        </div>
                      </div>

                      <div className="w-[120px] bg-white/5 rounded-2xl p-2.5 flex flex-col justify-between text-xs border border-white/[0.02]">
                        <div className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mb-1 border-b border-white/5 pb-1 text-center">
                          Today Schedule
                        </div>
                        <div className="space-y-1">
                          {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((name) => {
                            const isActive = activePrayer === name;
                            return (
                              <div key={name} className="flex items-center justify-between text-[10px]">
                                <span className={`font-semibold ${isActive ? getWidgetTextClass(customWidgetTheme) : 'text-slate-300'}`}>
                                  {name}
                                </span>
                                <span className={`font-mono text-[9px] ${isActive ? 'text-white font-bold' : 'text-slate-500'}`}>
                                  {prayerTimes[name]}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {customWidgetSize === 'lock' && (
                    <motion.div
                      key="sim_lock"
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.94 }}
                      className="w-[160px] p-3 rounded-2xl bg-black border border-neutral-800 flex flex-col gap-1 shadow-md text-white text-center font-sans"
                    >
                      <div className="text-[9px] font-bold text-neutral-400 tracking-widest uppercase mb-0.5">
                        {nextPrayer.name} countdown
                      </div>
                      <div className="text-lg font-bold font-mono tracking-tighter text-white">
                        {nextPrayer.countdown}
                      </div>
                      <div className="text-[9px] text-neutral-500 font-medium">
                        🕌 {location.city} • {nextPrayer.timeString}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Actions for widgets */}
            <div className="space-y-2">
              <button
                id="copy_widget_link_btn"
                onClick={handleCopyWidgetUrl}
                className="w-full bg-emerald-555 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10"
              >
                {isCopied ? <Check size={14} /> : <Copy size={13} />}
                <span>{isCopied ? 'Copied Widget Link!' : 'Copy Custom Widget URL'}</span>
              </button>

              <div className="p-3 bg-slate-900/50 border border-slate-805 text-[11px] text-slate-400 leading-normal rounded-xl space-y-2">
                <div className="font-bold text-slate-200 border-b border-slate-800 pb-1">
                  💡 How to use this link on your phone screen:
                </div>
                
                <div className="space-y-1.5 text-[10.5px]">
                  <div>
                    <span className="text-emerald-400 font-bold">iOS Home Widget:</span> Install "WebWidget" or "WidgetWeb" app from Safari AppStore. Create a new widget, paste this copied URL, and configure refresh settings to enjoy a live home screen countdown widget.
                  </div>
                  <div>
                    <span className="text-teal-400 font-bold">Android Lock/Home Screen:</span> Use any customizable webpage widgets app (e.g., "Web Widget" or "Widgetify" from PlayStore). Drag to screen, paste this URL, and set transparent backgrounds.
                  </div>
                  <div>
                    <span className="text-amber-400 font-bold">Shortcut App Action:</span> On iOS, you can also add this widget page bookmark inside Safari as "Add to Home Screen" to get a direct premium 1x1 circular app companion.
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Traditional bottom footnote */}
        <div className="mt-8 text-center text-[10px] text-slate-500 leading-normal max-w-xs mx-auto">
          "Indeed, prayer has been decreed upon the believers a decree of specified times." <br />
          <span className="text-emerald-500 font-semibold mt-1.5 block">Surah An-Nisa 4:103</span>
        </div>

      </div>

      {/* Primary Parameters full-blown Settings modal overlay */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        location={location}
        onUpdateLocation={setLocation}
      />
    </div>
  );
}
