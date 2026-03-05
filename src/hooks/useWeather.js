import { useState, useEffect, useCallback } from 'react';

const KEY = 'bd5e378503939ddaee76f12ad7a97608';
const LAT = '8.4922';
const LNG = '124.6498';
const FB  = { temp: 29, humidity: 78, condition: 'Partly Cloudy', windKph: 14, risk: 'Low', emoji: '⛅' };

function risk(code, kph, rain) {
  if (code >= 200 && code < 300) return 'High';
  if (code >= 500 && code < 600 && rain > 10) return 'High';
  if (code >= 500 && code < 600 && rain > 5) return 'Medium';
  if (kph > 50) return 'High';
  if (kph > 30) return 'Medium';
  return 'Low';
}

function emoji(code) {
  if (code >= 200 && code < 300) return '⛈️';
  if (code >= 300 && code < 600) return '🌧️';
  if (code === 800) return '☀️';
  if (code === 801) return '⛅';
  return '☁️';
}

export function useWeather() {
  const [w, set] = useState(FB);
  const load = useCallback(async () => {
    try {
      const url = 'https://api.openweathermap.org/data/2.5/weather?lat=' + LAT + '&lon=' + LNG + '&appid=' + KEY;
      const res = await fetch(url);
      if (!res.ok) return;
      const d = await res.json();
      const kph  = Math.round(d.wind.speed * 3.6);
      const rain = (d.rain && d.rain['1h']) ? d.rain['1h'] : 0;
      const code = d.weather[0].id;
      set({ temp: Math.round(d.main.temp - 273.15), humidity: d.main.humidity, condition: d.weather[0].main, windKph: kph, risk: risk(code, kph, rain), emoji: emoji(code) });
    } catch (_) {}
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 600000); return () => clearInterval(t); }, [load]);
  return w;
}
