import { useCallback, useEffect, useState } from 'react';
import { ZONE_COORDS } from '../data/constants';

const API_URL = 'https://julianna-unblossomed-zahra.ngrok-free.dev/api'; 

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

// API helper
async function api(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }
  if (res.status === 204) return null;
  return res.json();
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
        api('/incidents/'),
        api('/alerts/'),
        api('/evacuation-centers/'),
        api('/residents/'),
        api('/resources/'),
        api('/users/'),
        api('/activity-log/'),
      ]);
      const g = x => x.status === 'fulfilled' ? (x.value || []) : [];
      let us = g(ru);
      if (us.length === 0) {
        const seeded = await api('/users/', {
          method: 'POST',
          body: { name: 'Admin User', email: 'admin@kauswagan.gov.ph', password: 'admin123', role: 'Admin', status: 'Active' },
        });
        us = seeded ? [seeded] : [];
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
    api('/activity-log/', {
      method: 'POST',
      body: { action, type, user_name: user || 'System', urgent: !!urgent },
    }).catch(() => {});
  }, []);

  const loginUser = useCallback(async (email, password) => {
    try {
      const data = await api('/auth/login/', {
        method: 'POST',
        body: { email: email.trim(), password },
      });
      if (!data || !data.user) return { ok: false, msg: 'Wrong email or password.' };
      log('Signed in: ' + data.user.name, 'Auth', data.user.name);
      return { ok: true, user: data.user };
    } catch (_) {
      const local = users.find(u => u.email?.toLowerCase() === email.trim().toLowerCase() && u.password === password && u.status === 'Active');
      if (local) {
        log('Signed in: ' + local.name, 'Auth', local.name);
        return { ok: true, user: { id: local.id, name: local.name, email: local.email, role: local.role } };
      }
      return { ok: false, msg: 'Cannot connect. Make sure Django server is running.' };
    }
  }, [users, log]);

  const addIncident = useCallback(async (d, user) => {
    const p = gps(d.zone);
    const rec = await api('/incidents/', {
      method: 'POST',
      body: { type: d.type, zone: d.zone, location: d.location || '', severity: d.severity || 'Medium', status: 'Pending', description: d.description || '', reporter: d.reporter || '', lat: p.lat, lng: p.lng, source: 'mobile' },
    });
    setI(prev => [ni(rec), ...prev]);
    log('Incident: ' + d.type + ' in ' + d.zone, 'Incident', user, d.severity === 'High');
  }, [log]);

  const updateIncident = useCallback(async (id, d, user) => {
    const { id: _, created_at, date_reported, dateReported, createdAt, ...safe } = d;
    const rec = await api(`/incidents/${id}/`, { method: 'PATCH', body: safe });
    setI(prev => prev.map(r => r.id === id ? ni(rec) : r));
    log('Incident updated', 'Incident', user);
  }, [log]);

  const deleteIncident = useCallback(async (id, label, user) => {
    await api(`/incidents/${id}/`, { method: 'DELETE' });
    setI(prev => prev.filter(r => r.id !== id));
    log('Incident deleted: ' + (label || ''), 'Incident', user, true);
  }, [log]);

  const addAlert = useCallback(async (d, user) => {
    const count = d.recipients_count ?? d.smsCount ?? 0;
    const rec = await api('/alerts/', {
      method: 'POST',
      body: { title: d.level + ' — ' + d.zone, message: d.message, level: d.level, zone: d.zone, recipients_count: count, sent_by: user || 'System' },
    });
    setA(prev => [{ ...rec, recipients_count: count }, ...prev]);
    log(d.level + ' alert to ' + d.zone, 'Alert', user, d.level === 'Danger');
  }, [log]);

  const deleteAlert = useCallback(async (id, user) => {
    await api(`/alerts/${id}/`, { method: 'DELETE' });
    setA(prev => prev.filter(r => r.id !== id));
    log('Alert deleted', 'Alert', user);
  }, [log]);

  const addEvac = useCallback(async (d, user) => {
    const p = gps(d.zone);
    const rec = await api('/evacuation-centers/', {
      method: 'POST',
      body: { name: d.name, zone: d.zone, address: d.address || '', capacity: parseInt(d.capacity) || 100, occupancy: parseInt(d.occupancy) || 0, status: d.status || 'Open', facilities_available: d.facilitiesAvailable || [], contact_person: d.contactPerson || '', contact: d.contact || '', lat: p.lat, lng: p.lng },
    });
    setE(prev => [...prev, ne(rec)]);
    log('Evac center added: ' + d.name, 'Evacuation', user);
  }, [log]);

  const updateEvac = useCallback(async (id, d, user) => {
    const rec = await api(`/evacuation-centers/${id}/`, {
      method: 'PATCH',
      body: { name: d.name, zone: d.zone, address: d.address || '', capacity: parseInt(d.capacity) || 100, occupancy: parseInt(d.occupancy) || 0, status: d.status, facilities_available: d.facilitiesAvailable || [], contact_person: d.contactPerson || '', contact: d.contact || '' },
    });
    setE(prev => prev.map(r => r.id === id ? ne(rec) : r));
    log('Evac updated: ' + d.name, 'Evacuation', user);
  }, [log]);

  const deleteEvac = useCallback(async (id, name, user) => {
    await api(`/evacuation-centers/${id}/`, { method: 'DELETE' });
    setE(prev => prev.filter(r => r.id !== id));
    log('Evac deleted: ' + (name || ''), 'Evacuation', user, true);
  }, [log]);

  const addResident = useCallback(async (d, user) => {
    const p = gps(d.zone);
    const rec = await api('/residents/', {
      method: 'POST',
      body: { name: d.name, zone: d.zone, address: d.address || '', household_members: parseInt(d.householdMembers) || 1, contact: d.contact || '', evacuation_status: d.evacuationStatus || 'Safe', vulnerability_tags: d.vulnerabilityTags || [], notes: d.notes || '', added_by: user || 'Mobile', lat: p.lat, lng: p.lng, source: 'mobile' },
    });
    setR(prev => [nr(rec), ...prev]);
    log('Resident added: ' + d.name, 'Resident', user);
  }, [log]);

  const updateResident = useCallback(async (id, d, user) => {
    const rec = await api(`/residents/${id}/`, {
      method: 'PATCH',
      body: { name: d.name, zone: d.zone, address: d.address || '', household_members: parseInt(d.householdMembers) || 1, contact: d.contact || '', evacuation_status: d.evacuationStatus || 'Safe', vulnerability_tags: d.vulnerabilityTags || [], notes: d.notes || '' },
    });
    setR(prev => prev.map(r => r.id === id ? nr(rec) : r));
    log('Resident updated: ' + d.name, 'Resident', user);
  }, [log]);

  const deleteResident = useCallback(async (id, name, user) => {
    await api(`/residents/${id}/`, { method: 'DELETE' });
    setR(prev => prev.filter(r => r.id !== id));
    log('Resident deleted: ' + (name || ''), 'Resident', user, true);
  }, [log]);

  const addResource = useCallback(async (d, user) => {
    const rec = await api('/resources/', {
      method: 'POST',
      body: { name: d.name, category: d.category, quantity: parseInt(d.quantity) || 1, available: parseInt(d.available) || 1, unit: d.unit || 'pcs', location: d.location || '', status: d.status || 'Available', notes: d.notes || '' },
    });
    setS(prev => [...prev, rec]);
    log('Resource added: ' + d.name, 'Resource', user);
  }, [log]);

  const updateResource = useCallback(async (id, d, user) => {
    const rec = await api(`/resources/${id}/`, {
      method: 'PATCH',
      body: { name: d.name, category: d.category, quantity: parseInt(d.quantity) || 0, available: parseInt(d.available) || 0, unit: d.unit || 'pcs', location: d.location || '', status: d.status || 'Available', notes: d.notes || '' },
    });
    setS(prev => prev.map(r => r.id === id ? rec : r));
    log('Resource updated: ' + (d.name || ''), 'Resource', user);
  }, [log]);

  const deleteResource = useCallback(async (id, name, user) => {
    await api(`/resources/${id}/`, { method: 'DELETE' });
    setS(prev => prev.filter(r => r.id !== id));
    log('Resource deleted: ' + (name || ''), 'Resource', user, true);
  }, [log]);

  const addUser = useCallback(async (d) => {
    const rec = await api('/users/', {
      method: 'POST',
      body: { name: d.name, email: d.email, password: d.password, role: d.role || 'Staff', status: d.status || 'Active' },
    });
    setU(prev => [...prev, rec]);
  }, []);

  const updateUser = useCallback(async (id, d) => {
    const update = { name: d.name, email: d.email, role: d.role, status: d.status };
    if (d.password && d.password.trim()) update.password = d.password;
    const rec = await api(`/users/${id}/`, { method: 'PATCH', body: update });
    setU(prev => prev.map(r => r.id === id ? rec : r));
  }, []);

  const deleteUser = useCallback(async (id) => {
    await api(`/users/${id}/`, { method: 'DELETE' });
    setU(prev => prev.filter(r => r.id !== id));
  }, []);

  return {
    loading, reload, log,
    incidents, alerts, evacCenters, residents, resources, users, activityLog,
    loginUser,
    addIncident, updateIncident, deleteIncident,
    addAlert, deleteAlert,
    addEvac, updateEvac, deleteEvac,
    addResident, updateResident, deleteResident,
    addResource, updateResource, deleteResource,
    addUser, updateUser, deleteUser,
  };
}