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
      const g = x => x.status === 'fulfilled' ? (x.value.data || []) : [];
      let us = g(ru);
      if (us.length === 0) {
        const { data: s } = await sb.from('users').insert([
          { name: 'Admin User', email: 'admin@kauswagan.gov.ph', password: 'admin123', role: 'Admin', status: 'Active' },
        ]).select();
        us = s || [];
      }
      setI(g(ri).map(ni));
      setA(g(ra));
      setE(g(re).map(ne));
      setR(g(rr).map(nr));
      setS(g(rs));
      setU(us);
      setL(g(rl).map(na));
    } catch (err) {
      console.warn('DB error:', err);
      setU([{ id: 'local1', name: 'Admin', email: 'admin@kauswagan.gov.ph', password: 'admin123', role: 'Admin', status: 'Active' }]);
    } finally {
      setLoad(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

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
    const rec = await q(sb.from('alerts').insert([{ title: d.level + ' — ' + d.zone, message: d.message, level: d.level, zone: d.zone, channel: 'Mobile', recipients_count: d.zone === 'All Zones' ? 1284 : Math.floor(Math.random() * 300 + 150), sent_by: user }]).select().single());
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
    setR(prev => [nr(rec), ...prev]);
    log('Resident added: ' + d.name, 'Resident', user);
  }, [log]);

  const updateResident = useCallback(async (id, d, user) => {
    const rec = await q(sb.from('residents').update({ name: d.name, zone: d.zone, address: d.address || '', household_members: parseInt(d.householdMembers) || 1, contact: d.contact || '', evacuation_status: d.evacuationStatus || 'Safe', vulnerability_tags: d.vulnerabilityTags || [], notes: d.notes || '' }).eq('id', id).select().single());
    setR(prev => prev.map(r => r.id === id ? nr(rec) : r));
    log('Resident updated: ' + d.name, 'Resident', user);
  }, [log]);

  const deleteResident = useCallback(async (id, name, user) => {
    await q(sb.from('residents').delete().eq('id', id));
    setR(prev => prev.filter(r => r.id !== id));
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
