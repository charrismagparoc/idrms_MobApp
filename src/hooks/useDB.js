import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SB_URL, SB_KEY, ZONE_COORDS } from '../data/constants';

export const sb = createClient(SB_URL, SB_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

const now = () => new Date().toISOString();
let _id = 9000;
const lid = () => String(++_id);

const ni = r => ({ ...r, dateReported: r.date_reported, createdAt: r.created_at });
const ne = r => ({ ...r, facilitiesAvailable: r.facilities_available || [], contactPerson: r.contact_person });
const nr = r => ({ ...r, householdMembers: r.household_members, evacuationStatus: r.evacuation_status, vulnerabilityTags: r.vulnerability_tags || [] });
const na = r => ({ ...r, id: String(r.id), userName: r.user_name || 'System', createdAt: r.created_at || now(), urgent: !!r.urgent });

function gps(zone) {
  const b = ZONE_COORDS[zone] || { lat: 8.492, lng: 124.650 };
  return { lat: b.lat + (Math.random() - 0.5) * 0.004, lng: b.lng + (Math.random() - 0.5) * 0.004 };
}

async function q(promise) {
  const { data, error } = await promise;
  if (error) throw error;
  return data;
}

const CACHE_KEY = 'useDB_cache_v1';

async function saveCache(data) {
  try { await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (_) {}
}

async function loadCache() {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

export function useDB() {
  const [incidents,   setI] = useState([]);
  const [alerts,      setA] = useState([]);
  const [evacCenters, setE] = useState([]);
  const [residents,   setR] = useState([]);
  const [resources,   setS] = useState([]);
  const [users,       setU] = useState([]);
  const [activityLog, setL] = useState([]);
  const [loading,  setLoad] = useState(true);

  const reload = useCallback(async () => {
    setLoad(true);
    try {
      const [ri, ra, re, rr, rs, ru, rl] = await Promise.allSettled([
        sb.from('incidents').select('*').order('created_at', { ascending: false }),
        sb.from('alerts').select('*').order('created_at', { ascending: false }),
        sb.from('evac_centers').select('*'),
        sb.from('residents').select('*').order('created_at', { ascending: false }),
        sb.from('resources').select('*'),
        sb.from('users').select('*'),
        sb.from('activity_log').select('*').order('created_at', { ascending: false }).limit(150),
      ]);

      // Only update state if the fetch actually returned data
      const use = (result, mapper, setter, fallbackSetter) => {
        if (result.status === 'fulfilled' && result.value.data && result.value.data.length >= 0 && !result.value.error) {
          const mapped = result.value.data.map(mapper || (x => x));
          setter(mapped);
          return mapped;
        }
        // Keep existing state
        return null;
      };

      const mappedI = use(ri, ni, setI);
      const mappedA = use(ra, x => x, setA);
      const mappedE = use(re, ne, setE);
      const mappedR = use(rr, nr, setR);
      const mappedS = use(rs, x => x, setS);
      const mappedL = use(rl, na, setL);

      let us = null;
      if (ru.status === 'fulfilled' && ru.value.data) {
        us = ru.value.data;
        if (us.length === 0) {
          const { data: s } = await sb.from('users').insert([
            { name: 'Admin User', email: 'admin@kauswagan.gov.ph', password: 'admin123', role: 'Admin', status: 'Active' },
          ]).select();
          us = s || [];
        }
        setU(us);
      }

      // Persist successful fetches to cache
      const cacheUpdate = {};
      if (mappedI) cacheUpdate.incidents   = mappedI;
      if (mappedA) cacheUpdate.alerts      = mappedA;
      if (mappedE) cacheUpdate.evacCenters = mappedE;
      if (mappedR) cacheUpdate.residents   = mappedR;
      if (mappedS) cacheUpdate.resources   = mappedS;
      if (us)      cacheUpdate.users       = us;
      if (mappedL) cacheUpdate.activityLog = mappedL;
      if (Object.keys(cacheUpdate).length > 0) {
        const existing = await loadCache() || {};
        saveCache({ ...existing, ...cacheUpdate });
      }

    } catch (err) {
      console.warn('DB reload error:', err);
      // Iya e try ug restore from cache if nay error
      const cache = await loadCache();
      if (cache) {
        if (cache.incidents)   setI(cache.incidents);
        if (cache.alerts)      setA(cache.alerts);
        if (cache.evacCenters) setE(cache.evacCenters);
        if (cache.residents)   setR(cache.residents);
        if (cache.resources)   setS(cache.resources);
        if (cache.activityLog) setL(cache.activityLog);
        if (cache.users)       setU(cache.users);
      } else {
        setU([{ id: 'local1', name: 'Admin', email: 'admin@kauswagan.gov.ph', password: 'admin123', role: 'Admin', status: 'Active' }]);
      }
    } finally {
      setLoad(false);
    }
  }, []);

  useEffect(() => {
    // Load cached data immediately para dili mag blanko ang UI while fetching
    loadCache().then(cache => {
      if (cache) {
        if (cache.incidents)   setI(cache.incidents);
        if (cache.alerts)      setA(cache.alerts);
        if (cache.evacCenters) setE(cache.evacCenters);
        if (cache.residents)   setR(cache.residents);
        if (cache.resources)   setS(cache.resources);
        if (cache.activityLog) setL(cache.activityLog);
        if (cache.users)       setU(cache.users);
      }
    });
    reload();
  }, [reload]);

  const log = useCallback((action, type, user, urgent) => {
    setL(p => [{ id: lid(), action, type, userName: user || 'System', urgent: !!urgent, createdAt: now() }, ...p].slice(0, 150));
    sb.from('activity_log').insert([{ action, type, user_name: user || 'System', urgent: !!urgent }]).then().catch(() => {});
  }, []);

  const loginUser = useCallback(async (email, password) => {
    try {
      const { data: found } = await sb.from('users').select('*').ilike('email', email.trim()).eq('password', password).eq('status', 'Active').single();
      if (!found) return { ok: false, msg: 'Wrong email or password.' };
      log('Signed in: ' + found.name, 'Auth', found.name);
      return { ok: true, user: { id: found.id, name: found.name, email: found.email, role: found.role } };
    } catch (_) {
      const local = users.find(u => u.email?.toLowerCase() === email.trim().toLowerCase() && u.password === password && u.status === 'Active');
      if (local) return { ok: true, user: { id: local.id, name: local.name, email: local.email, role: local.role } };
      return { ok: false, msg: 'Cannot connect. Check internet.' };
    }
  }, [users, log]);

  // Incidents
  const addIncident = useCallback(async (d, user) => {
    const p = gps(d.zone);
    const rec = await q(sb.from('incidents').insert([{ type: d.type, zone: d.zone, location: d.location || '', severity: d.severity || 'Medium', status: 'Pending', description: d.description || '', reporter: d.reporter || '', lat: p.lat, lng: p.lng }]).select().single());
    setI(prev => [ni(rec), ...prev]);
    log('Incident: ' + d.type + ' in ' + d.zone, 'Incident', user, d.severity === 'High');
  }, [log]);

  const updateIncident = useCallback(async (id, d, user) => {
    const { id: _, created_at, date_reported, dateReported, createdAt, ...safe } = d;
    const rec = await q(sb.from('incidents').update(safe).eq('id', id).select().single());
    setI(prev => prev.map(r => r.id === id ? ni(rec) : r));
    log('Incident updated', 'Incident', user);
  }, [log]);

  const deleteIncident = useCallback(async (id, label, user) => {
    await q(sb.from('incidents').delete().eq('id', id));
    setI(prev => prev.filter(r => r.id !== id));
    log('Incident deleted: ' + (label || ''), 'Incident', user, true);
  }, [log]);

  // Alerts
  const addAlert = useCallback(async (d, user) => {
    const recipientsCount = (d.recipientsCount !== undefined && d.recipientsCount !== null) ? d.recipientsCount : 0;
    const rec = await q(sb.from('alerts').insert([{ title: d.level + ' — ' + d.zone, message: d.message, level: d.level, zone: d.zone, channel: 'Mobile', recipients_count: recipientsCount, sent_by: user }]).select().single());
    setA(prev => [rec, ...prev]);
    log(d.level + ' alert to ' + d.zone, 'Alert', user, d.level === 'Danger');
  }, [log]);

  const deleteAlert = useCallback(async (id, user) => {
    await q(sb.from('alerts').delete().eq('id', id));
    setA(prev => prev.filter(r => r.id !== id));
    log('Alert deleted', 'Alert', user);
  }, [log]);

  // Evac centers
  const addEvac = useCallback(async (d, user) => {
    const p = gps(d.zone);
    const rec = await q(sb.from('evac_centers').insert([{ name: d.name, zone: d.zone, address: d.address || '', capacity: parseInt(d.capacity) || 100, occupancy: parseInt(d.occupancy) || 0, status: d.status || 'Open', facilities_available: d.facilitiesAvailable || [], contact_person: d.contactPerson || '', contact: d.contact || '', lat: p.lat, lng: p.lng }]).select().single());
    setE(prev => [...prev, ne(rec)]);
    log('Evac center added: ' + d.name, 'Evacuation', user);
  }, [log]);

  const updateEvac = useCallback(async (id, d, user) => {
    const rec = await q(sb.from('evac_centers').update({ name: d.name, zone: d.zone, address: d.address || '', capacity: parseInt(d.capacity) || 100, occupancy: parseInt(d.occupancy) || 0, status: d.status, facilities_available: d.facilitiesAvailable || [], contact_person: d.contactPerson || '', contact: d.contact || '' }).eq('id', id).select().single());
    setE(prev => prev.map(r => r.id === id ? ne(rec) : r));
    log('Evac updated: ' + d.name, 'Evacuation', user);
  }, [log]);

  const deleteEvac = useCallback(async (id, name, user) => {
    await q(sb.from('evac_centers').delete().eq('id', id));
    setE(prev => prev.filter(r => r.id !== id));
    log('Evac deleted: ' + (name || ''), 'Evacuation', user, true);
  }, [log]);

  // Residents
  const addResident = useCallback(async (d, user) => {
    const p = gps(d.zone);
    const rec = await q(sb.from('residents').insert([{ name: d.name, zone: d.zone, address: d.address || '', household_members: parseInt(d.householdMembers) || 1, contact: d.contact || '', evacuation_status: d.evacuationStatus || 'Safe', vulnerability_tags: d.vulnerabilityTags || [], notes: d.notes || '', added_by: user || 'Mobile', lat: p.lat, lng: p.lng }]).select().single());
    setR(prev => {
      const next = [nr(rec), ...prev];
      loadCache().then(c => saveCache({ ...(c || {}), residents: next }));
      return next;
    });
    log('Resident added: ' + d.name, 'Resident', user);
  }, [log]);

  const updateResident = useCallback(async (id, d, user) => {
    const rec = await q(sb.from('residents').update({ name: d.name, zone: d.zone, address: d.address || '', household_members: parseInt(d.householdMembers) || 1, contact: d.contact || '', evacuation_status: d.evacuationStatus || 'Safe', vulnerability_tags: d.vulnerabilityTags || [], notes: d.notes || '' }).eq('id', id).select().single());
    setR(prev => {
      const next = prev.map(r => r.id === id ? nr(rec) : r);
      loadCache().then(c => saveCache({ ...(c || {}), residents: next }));
      return next;
    });
    log('Resident updated: ' + d.name, 'Resident', user);
  }, [log]);

  const deleteResident = useCallback(async (id, name, user) => {
    await q(sb.from('residents').delete().eq('id', id));
    setR(prev => {
      const next = prev.filter(r => r.id !== id);
      loadCache().then(c => saveCache({ ...(c || {}), residents: next }));
      return next;
    });
    log('Resident deleted: ' + (name || ''), 'Resident', user, true);
  }, [log]);

  // Resources
  const addResource = useCallback(async (d, user) => {
    const rec = await q(sb.from('resources').insert([{ name: d.name, category: d.category, quantity: parseInt(d.quantity) || 1, available: parseInt(d.available) || 1, unit: d.unit || 'pcs', location: d.location || '', status: d.status || 'Available', notes: d.notes || '' }]).select().single());
    setS(prev => [...prev, rec]);
    log('Resource added: ' + d.name, 'Resource', user);
  }, [log]);

  const updateResource = useCallback(async (id, d, user) => {
    const { id: _, created_at, updated_at, ...safe } = d;
    const rec = await q(sb.from('resources').update(safe).eq('id', id).select().single());
    setS(prev => prev.map(r => r.id === id ? rec : r));
    log('Resource updated: ' + (d.name || ''), 'Resource', user);
  }, [log]);

  const deleteResource = useCallback(async (id, name, user) => {
    await q(sb.from('resources').delete().eq('id', id));
    setS(prev => prev.filter(r => r.id !== id));
    log('Resource deleted: ' + (name || ''), 'Resource', user, true);
  }, [log]);

  return {
    loading, reload,
    incidents, alerts, evacCenters, residents, resources, users, activityLog,
    loginUser,
    addIncident, updateIncident, deleteIncident,
    addAlert, deleteAlert,
    addEvac, updateEvac, deleteEvac,
    addResident, updateResident, deleteResident,
    addResource, updateResource, deleteResource,
  };
}