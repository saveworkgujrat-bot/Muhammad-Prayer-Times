/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Volume2,
  Sliders,
  Compass,
  VolumeX,
  Check,
  Calendar,
  AlertOctagon,
  Undo2,
  Info
} from 'lucide-react';
import {
  CalculationMethod,
  AsrMethod,
  SoundAlert,
  PrayerSettings,
  LocationData
} from '../types';
import { playSound } from '../utils/audioSynth';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PrayerSettings;
  onUpdateSettings: (newSettings: PrayerSettings) => void;
  location: LocationData;
  onUpdateLocation: (newLocation: LocationData) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  location,
  onUpdateLocation,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'methods' | 'offsets' | 'sound' | 'coords'>('methods');
  const [tempLat, setTempLat] = useState(String(location.latitude));
  const [tempLng, setTempLng] = useState(String(location.longitude));
  const [tempTz, setTempTz] = useState(String(location.timezone));
  const [tempCity, setTempCity] = useState(location.city);
  const [tempCountry, setTempCountry] = useState(location.country);
  const [hijriAdjustment, setHijriAdjustment] = useState(() => {
    const saved = localStorage.getItem('hijri_adjustment');
    return saved ? parseInt(saved, 10) : 0;
  });

  if (!isOpen) return null;

  const handleTestSound = () => {
    playSound(settings.soundAlert, settings.volume);
  };

  const handleApplyCoordinates = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(tempLat);
    const lng = parseFloat(tempLng);
    const tz = parseFloat(tempTz);
    
    if (isNaN(lat) || lat < -90 || lat > 90) {
      alert('Invalid Latitude (-90 to 90)');
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      alert('Invalid Longitude (-180 to 180)');
      return;
    }
    if (isNaN(tz) || tz < -12 || tz > 14) {
      alert('Invalid Timezone Offset (-12 to +14)');
      return;
    }

    onUpdateLocation({
      city: tempCity.trim() || 'Custom Coordinates',
      country: tempCountry.trim() || '',
      latitude: lat,
      longitude: lng,
      timezone: tz,
      source: 'manual',
    });
  };

  const handleHijriAdjChange = (val: number) => {
    setHijriAdjustment(val);
    localStorage.setItem('hijri_adjustment', String(val));
    // Trigger storage event so that parent component updates
    window.dispatchEvent(new Event('storage'));
  };

  const handleResetOffsets = () => {
    onUpdateSettings({
      ...settings,
      fajrOffset: 0,
      dhuhrOffset: 0,
      asrOffset: 0,
      maghribOffset: 0,
      ishaOffset: 0
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-emerald-500/20 bg-slate-900 text-white shadow-2xl transition-all md:aspect-auto">
        {/* Header decoration */}
        <div className="h-1.5 bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-500" />
        
        <div className="flex items-center justify-between border-b border-slate-800 p-5">
          <div>
            <h2 className="font-sans text-xl font-semibold tracking-tight text-emerald-400">
              Prayer Settings
            </h2>
            <p className="text-xs text-slate-400">Configure calculations, sound alarms & parameters</p>
          </div>
          <button 
            id="close_settings_btn"
            onClick={onClose}
            className="rounded-full bg-slate-800 p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Structure */}
        <div className="flex h-[450px] flex-col md:flex-row">
          {/* Tabs Sidebar */}
          <div className="flex flex-row border-b border-slate-800 bg-slate-950/40 p-2 md:h-full md:w-48 md:flex-col md:border-b-0 md:border-r">
            <button
              id="tab_methods"
              onClick={() => setActiveTab('methods')}
              className={`flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all md:flex-initial ${
                activeTab === 'methods'
                  ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Compass size={14} />
              <span>Calculation</span>
            </button>
            <button
              id="tab_sound"
              onClick={() => setActiveTab('sound')}
              className={`flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all md:flex-initial ${
                activeTab === 'sound'
                  ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Volume2 size={14} />
              <span>Audio alerts</span>
            </button>
            <button
              id="tab_offsets"
              onClick={() => setActiveTab('offsets')}
              className={`flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all md:flex-initial ${
                activeTab === 'offsets'
                  ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Sliders size={14} />
              <span>Offsets (min)</span>
            </button>
            <button
              id="tab_coords"
              onClick={() => setActiveTab('coords')}
              className={`flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all md:flex-initial ${
                activeTab === 'coords'
                  ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Info size={14} />
              <span>Coordinates</span>
            </button>
          </div>

          {/* Content Pane */}
          <div className="flex-1 overflow-y-auto p-5">
            {activeTab === 'methods' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                    Calculation Method
                  </label>
                  <select
                    id="calc_method_select"
                    value={settings.method}
                    onChange={(e) => onUpdateSettings({ ...settings, method: e.target.value as CalculationMethod })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500 transition-colors"
                  >
                    {Object.values(CalculationMethod).map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-slate-400 leading-normal">
                    Adjusts twilight angles used to calculate accurate Fajr and Isha prayer times globally.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                    Asr Juristic Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(AsrMethod).map((asr) => (
                      <button
                        key={asr}
                        id={`asr_${asr.startsWith('Standard') ? 'standard' : 'hanafi'}`}
                        onClick={() => onUpdateSettings({ ...settings, asrMethod: asr })}
                        className={`flex items-center justify-between rounded-lg border p-2.5 text-xs font-medium transition-all ${
                          settings.asrMethod === asr
                            ? 'border-emerald-500 bg-emerald-500/5 text-emerald-400'
                            : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:bg-slate-800/60'
                        }`}
                      >
                        <span>{asr.split(' ')[0]}</span>
                        {settings.asrMethod === asr && <Check size={14} className="text-emerald-400" />}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400 leading-normal">
                    Hanafi uses a shadow offset of 2x for Asr, whereas standard Shafi'i/Maliki/Hanbali uses 1x shadow.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-2">
                    <Calendar size={13} />
                    <span>Hijri Calendar adjustment</span>
                  </label>
                  <div className="flex items-center gap-1.5 bg-slate-800/40 p-1.5 rounded-lg border border-slate-800">
                    {[-2, -1, 0, 1, 2].map((adj) => (
                      <button
                        key={adj}
                        id={`hj_${adj}`}
                        onClick={() => handleHijriAdjChange(adj)}
                        className={`flex-1 rounded-md py-1 text-xs font-medium transition-all ${
                          hijriAdjustment === adj
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        {adj > 0 ? `+${adj}` : adj}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Shift the current lunar date back or forward to align correctly with your regional moon sighting.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'sound' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                    Alarm Notification Alert
                  </label>
                  <select
                    id="sound_alert_select"
                    value={settings.soundAlert}
                    onChange={(e) => onUpdateSettings({ ...settings, soundAlert: e.target.value as SoundAlert })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500 transition-colors"
                  >
                    {Object.values(SoundAlert).map((alertItem) => (
                      <option key={alertItem} value={alertItem}>
                        {alertItem}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                      {settings.volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200">Alert Volume</div>
                      <div className="text-[10px] text-slate-400">Control speaker sound level</div>
                    </div>
                  </div>
                  <div className="flex flex-1 items-center gap-3 max-w-xs">
                    <input
                      id="volume_slider"
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={settings.volume}
                      onChange={(e) => onUpdateSettings({ ...settings, volume: parseFloat(e.target.value) })}
                      className="w-full accent-emerald-500"
                    />
                    <span className="text-xs font-mono text-slate-400 w-8 text-right">
                      {Math.round(settings.volume * 100)}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-slate-800 pt-3">
                  <button
                    id="test_sound_btn"
                    onClick={handleTestSound}
                    disabled={settings.soundAlert === SoundAlert.Silence}
                    className="flex-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-2 text-xs transition-colors flex items-center justify-center gap-1.5 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
                  >
                    <Volume2 size={14} />
                    <span>Play Sound Sample</span>
                  </button>
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-800/40 hover:bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 transition-all">
                    <input
                      id="notification_enabled_checkbox"
                      type="checkbox"
                      checked={settings.isNotificationEnabled}
                      onChange={(e) => onUpdateSettings({ ...settings, isNotificationEnabled: e.target.checked })}
                      className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-950"
                    />
                    <span className="text-xs text-slate-300 font-medium">Browser Notifications</span>
                  </label>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-2.5 flex gap-2 border border-slate-800">
                  <div className="text-emerald-400 shrink-0 mt-0.5"><AlertOctagon size={14} /></div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Note: Audio will play at the start of prayer times. Enable browser notification features to receive background countdown alerts when the tab is running.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'offsets' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                    Manual Prayer Offsets
                  </span>
                  <button 
                    id="reset_offsets_btn"
                    onClick={handleResetOffsets}
                    className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
                  >
                    <Undo2 size={11} />
                    <span>Reset All to 0</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {[
                    { label: 'Fajr', key: 'fajrOffset', val: settings.fajrOffset },
                    { label: 'Dhuhr', key: 'dhuhrOffset', val: settings.dhuhrOffset },
                    { label: 'Asr', key: 'asrOffset', val: settings.asrOffset },
                    { label: 'Maghrib', key: 'maghribOffset', val: settings.maghribOffset },
                    { label: 'Isha', key: 'ishaOffset', val: settings.ishaOffset },
                  ].map((field) => (
                    <div key={field.key} className="flex items-center justify-between gap-3 bg-slate-950/20 p-2 border border-slate-800/60 rounded-xl">
                      <span className="text-xs font-semibold text-slate-300 sm:w-16">{field.label}</span>
                      <div className="flex flex-1 items-center gap-3 max-w-xs">
                        <input
                          id={`offset_slider_${field.key}`}
                          type="range"
                          min="-30"
                          max="30"
                          step="1"
                          value={field.val}
                          onChange={(e) => 
                            onUpdateSettings({ 
                              ...settings, 
                              [field.key]: parseInt(e.target.value, 10) 
                            })
                          }
                          className="w-full accent-emerald-500"
                        />
                        <span className="text-xs font-mono text-slate-400 w-10 text-right">
                          {field.val > 0 ? `+${field.val}` : field.val}m
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 leading-normal mt-2 block">
                  Add or subtract minutes for each prayer time individually to match exactly with your local mosque clock.
                </p>
              </div>
            )}

            {activeTab === 'coords' && (
              <form onSubmit={handleApplyCoordinates} className="space-y-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Manual Coordinate Override
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">City Label</label>
                    <input
                      id="manual_city_input"
                      type="text"
                      value={tempCity}
                      onChange={(e) => setTempCity(e.target.value)}
                      placeholder="e.g. Gujrat"
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Country Label</label>
                    <input
                      id="manual_country_input"
                      type="text"
                      value={tempCountry}
                      onChange={(e) => setTempCountry(e.target.value)}
                      placeholder="e.g. Pakistan"
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Latitude</label>
                    <input
                      id="manual_lat_input"
                      type="number"
                      step="any"
                      min="-90"
                      max="90"
                      value={tempLat}
                      onChange={(e) => setTempLat(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Longitude</label>
                    <input
                      id="manual_lng_input"
                      type="number"
                      step="any"
                      min="-180"
                      max="180"
                      value={tempLng}
                      onChange={(e) => setTempLng(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">GMT Offset (Hours)</label>
                    <input
                      id="manual_tz_input"
                      type="number"
                      step="0.5"
                      min="-12"
                      max="14"
                      value={tempTz}
                      onChange={(e) => setTempTz(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    id="apply_coords_btn"
                    type="submit"
                    className="w-full rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 font-semibold py-2.5 text-xs transition-colors"
                  >
                    Apply CoordinatesOverride
                  </button>
                  <p className="mt-1.5 text-[10px] text-slate-400 text-center">
                    Current Source: <span className="text-emerald-400 font-mono">{location.source}</span>. Auto-location updates with your network automatically.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 bg-slate-950/60 p-4 border-t border-slate-800">
          <button
            id="close_settings_footer_btn"
            onClick={onClose}
            className="rounded-lg bg-slate-800 hover:bg-slate-700 px-5 py-2 text-xs font-semibold text-slate-300 transition-colors"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
}
