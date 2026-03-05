import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { C, TYPE_COLOR } from '../styles/colors';
import { Badge, Search, Chips, Confirm, FormModal, FInput, FPick, Empty } from '../components/Shared';
import { TYPES, ZONES, SEVERITIES, INC_STATUS } from '../data/constants';

const EMPTY = { type: 'Flood', zone: 'Zone 1', location: '', severity: 'Medium', status: 'Pending', description: '', reporter: '' };

export default function IncidentsScreen() {
  const { incidents, addIncident, updateIncident, deleteIncident, reload } = useApp();
  const { user } = useAuth();
  const [q, setQ]    = useState('');
  const [fil, setFil]= useState('All');
  const [form, setForm] = useState({ ...EMPTY });
  const [edit, setEdit] = useState(null);
  const [show, setShow] = useState(false);
  const [delId, setDelId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  const list = incidents.filter(i => {
    const mq = !q || (i.type+i.zone+i.location).toLowerCase().includes(q.toLowerCase());
    const ms = fil === 'All' || i.status === fil;
    return mq && ms;
  });

  function openAdd()  { setForm({ ...EMPTY }); setEdit(null); setShow(true); }
  function openEdit(i) { setForm({ ...i }); setEdit(i); setShow(true); }
  function set(k, v)  { setForm(p => ({ ...p, [k]: v })); }

  async function save() {
    if (!form.type) return;
    setSaving(true);
    try {
      if (edit) await updateIncident(edit.id, form, user.name);
      else await addIncident(form, user.name);
      setShow(false);
    } catch (e) { console.warn(e); }
    setSaving(false);
  }

  async function onRefresh() { setBusy(true); await reload(); setBusy(false); }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={s.bar}>
        <Search value={q} onChange={setQ} placeholder="Search incidents..." />
        <TouchableOpacity style={s.add} onPress={openAdd}><Text style={s.addTxt}>+ Add</Text></TouchableOpacity>
      </View>
      <View style={s.fbar}><Chips opts={['All', ...INC_STATUS]} val={fil} onSelect={setFil} /></View>
      <ScrollView contentContainerStyle={s.list} refreshControl={<RefreshControl refreshing={busy} onRefresh={onRefresh} tintColor={C.blue} />}>
        <Text style={s.count}>{list.length} incident{list.length !== 1 ? 's' : ''}</Text>
        {list.map(i => (
          <View key={String(i.id)} style={s.card}>
            <View style={s.top}>
              <View style={[s.tdot, { backgroundColor: TYPE_COLOR[i.type] || C.blue }]} />
              <Text style={s.title}>{i.type} — {i.zone}</Text>
              <TouchableOpacity onPress={() => openEdit(i)} style={s.iBtn}><Text>✏️</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setDelId(i.id)} style={s.iBtn}><Text>🗑️</Text></TouchableOpacity>
            </View>
            {i.location ? <Text style={s.sub}>{i.location}</Text> : null}
            {i.description ? <Text style={s.desc} numberOfLines={2}>{i.description}</Text> : null}
            <View style={s.badges}>
              <Badge label={i.severity} variant={i.severity} />
              <Badge label={i.status}   variant={i.status}   />
            </View>
          </View>
        ))}
        {list.length === 0 && <Empty emoji="📋" title={q ? 'No results' : 'No incidents yet'} />}
        <View style={{ height: 24 }} />
      </ScrollView>

      <FormModal visible={show} title={edit ? 'Edit Incident' : 'Report Incident'} onClose={() => setShow(false)} onSave={save} saving={saving} saveLabel={edit ? 'Save' : 'Report'}>
        <FPick label="Type" value={form.type} opts={TYPES} onChange={v => set('type', v)} req />
        <FPick label="Zone" value={form.zone} opts={ZONES} onChange={v => set('zone', v)} />
        <FInput label="Location" value={form.location} onChange={v => set('location', v)} placeholder="e.g. Purok 3 near river" />
        <FPick label="Severity" value={form.severity} opts={SEVERITIES} onChange={v => set('severity', v)} />
        {edit && <FPick label="Status" value={form.status} opts={INC_STATUS} onChange={v => set('status', v)} />}
        <FInput label="Description" value={form.description} onChange={v => set('description', v)} multi />
        <FInput label="Reporter" value={form.reporter} onChange={v => set('reporter', v)} />
      </FormModal>
      <Confirm visible={!!delId} title="Delete Incident" msg="Remove this incident permanently?" onOk={async () => { const i = incidents.find(x => x.id === delId); await deleteIncident(delId, (i && i.type) || '', user.name); setDelId(null); }} onNo={() => setDelId(null)} />
    </View>
  );
}

const s = StyleSheet.create({
  bar:    { flexDirection: 'row', gap: 10, padding: 12, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  add:    { backgroundColor: C.blue, borderRadius: 10, paddingHorizontal: 15, justifyContent: 'center', height: 42 },
  addTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  fbar:   { backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  list:   { padding: 12 },
  count:  { fontSize: 11, color: C.t3, marginBottom: 7 },
  card:   { backgroundColor: C.card, borderRadius: 12, padding: 13, marginBottom: 9, borderWidth: 1, borderColor: C.border },
  top:    { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  tdot:   { width: 8, height: 8, borderRadius: 4, marginRight: 8, flexShrink: 0 },
  title:  { flex: 1, fontSize: 13, fontWeight: '700', color: C.t1 },
  iBtn:   { padding: 5 },
  sub:    { fontSize: 11, color: C.t3, marginBottom: 4 },
  desc:   { fontSize: 12, color: C.t2, lineHeight: 17, marginBottom: 7 },
  badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 3 },
});
