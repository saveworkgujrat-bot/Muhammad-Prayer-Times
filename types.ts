/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LocationData {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: number; // UTC offset in hours (e.g. +5 for Pakistan)
  timezoneId?: string; // e.g. "Asia/Karachi"
  source: 'auto' | 'manual' | 'default';
}

export enum CalculationMethod {
  MWL = 'Muslim World League (MWL)',
  ISNA = 'Islamic Society of North America (ISNA)',
  Egypt = 'Egyptian General Authority of Survey',
  Makkah = 'Umm al-Qura University, Makkah',
  Karachi = 'University of Islamic Sciences, Karachi',
  Tehran = 'Institute of Geophysics, University of Tehran',
  Gulf = 'Gulf Region',
  Turkey = 'Turkey Diyanet',
}

export enum AsrMethod {
  Standard = 'Standard (Shafi\'i, Maliki, Hanbali)',
  Hanafi = 'Hanafi',
}

export enum HighLatitudeRule {
  None = 'None',
  MiddleNight = 'Middle of the Night',
  OneSeventh = 'One Seventh of the Night',
  AngleBased = 'Angle-Based Method',
}

export enum SoundAlert {
  Silence = 'Silent / Vibrate Indicator',
  GentleChime = 'Gentle Digital Bell',
  WarmHarmonium = 'Warm Harmonium Chord',
  VibratingBuzzer = 'Classic Synthesized Beep',
  SoftDistantAdhan = 'Soft Ambient Call (Synth)',
}

export interface PrayerSettings {
  method: CalculationMethod;
  asrMethod: AsrMethod;
  highLatitudeRule: HighLatitudeRule;
  soundAlert: SoundAlert;
  isNotificationEnabled: boolean;
  volume: number; // 0 to 1
  fajrOffset: number; // in minutes
  dhuhrOffset: number;
  asrOffset: number;
  maghribOffset: number;
  ishaOffset: number;
}

export interface PrayerTimes {
  Fajr: string;      // "HH:MM" 24h format or local format
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  [key: string]: string; // index signature
}

export interface HijriDate {
  day: number;
  monthName: string;
  monthNumber: number;
  year: number;
  formatted: string;
}
