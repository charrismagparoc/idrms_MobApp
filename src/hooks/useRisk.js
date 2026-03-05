import { useMemo } from 'react';
import { ZONE_BASE, ZONE_HAZARD, ZONES } from '../data/constants';

const VULN = { Bedridden: 12, PWD: 10, 'Senior Citizen': 8, Pregnant: 8, Infant: 7 };
const rainy = () => { const m = new Date().getMonth() + 1; return m >= 6 && m <= 11; };

function level(score) {
  if (score >= 70) return { label: 'HIGH',   color: '#e84855' };
  if (score >= 40) return { label: 'MEDIUM', color: '#f4a35a' };
  return               { label: 'LOW',    color: '#00d68f' };
}

export function useRisk(residents, incidents, weather) {
  const zoneCounts = useMemo(() => {
    const c = {};
    (incidents || []).forEach(i => { c[i.zone] = (c[i.zone] || 0) + 1; });
    return c;
  }, [incidents]);

  const resRisks = useMemo(() =>
    (residents || []).map(r => {
      let s = ZONE_BASE[r.zone] || 30;
      s += Math.min((r.vulnerabilityTags || []).reduce((a, t) => a + (VULN[t] || 5), 0), 40);
      if (r.evacuationStatus === 'Unaccounted') s += 18;
      else if (r.evacuationStatus === 'Evacuated') s -= 15;
      s += Math.min(((parseInt(r.householdMembers) || 1) - 1) * 1.8, 12);
      s += Math.min((zoneCounts[r.zone] || 0) * 6, 20);
      if ((weather && weather.risk) === 'High') s += 15;
      else if ((weather && weather.risk) === 'Medium') s += 7;
      if (rainy()) s += 8;
      const score = Math.min(Math.max(Math.round(s), 0), 100);
      const lv = level(score);
      return { ...r, score, riskLabel: lv.label, riskColor: lv.color };
    }).sort((a, b) => b.score - a.score),
  [residents, zoneCounts, weather]);

  const zoneRisks = useMemo(() =>
    ZONES.map(zone => {
      const zr  = (residents || []).filter(r => r.zone === zone);
      const zi  = (incidents  || []).filter(i => i.zone === zone);
      const ai  = zi.filter(i => ['Active', 'Pending'].includes(i.status)).length;
      let s = ZONE_BASE[zone] || 30;
      s += Math.min(ai * 8, 24);
      s += Math.min(zr.filter(r => (r.vulnerabilityTags || []).length > 0).length * 1.5, 15);
      s += Math.min(zr.filter(r => r.evacuationStatus === 'Unaccounted').length * 3, 12);
      if ((weather && weather.risk) === 'High') s += 12;
      else if ((weather && weather.risk) === 'Medium') s += 5;
      if (rainy()) s += 6;
      const score = Math.min(Math.max(Math.round(s), 0), 100);
      const lv = level(score);
      return {
        zone, score, riskLabel: lv.label, riskColor: lv.color,
        mainHazard:      ZONE_HAZARD[zone] || 'Flood',
        totalResidents:  zr.length,
        vulnerable:      zr.filter(r => (r.vulnerabilityTags || []).length > 0).length,
        evacuated:       zr.filter(r => r.evacuationStatus === 'Evacuated').length,
        unaccounted:     zr.filter(r => r.evacuationStatus === 'Unaccounted').length,
        activeInc:       ai,
      };
    }).sort((a, b) => b.score - a.score),
  [residents, incidents, weather]);

  const highCount   = resRisks.filter(r => r.riskLabel === 'HIGH').length;
  const medCount    = resRisks.filter(r => r.riskLabel === 'MEDIUM').length;
  const lowCount    = resRisks.filter(r => r.riskLabel === 'LOW').length;
  const overallScore = Math.round(resRisks.reduce((a, r) => a + r.score, 0) / Math.max(resRisks.length, 1));

  return { resRisks, zoneRisks, highCount, medCount, lowCount, overallScore };
}
