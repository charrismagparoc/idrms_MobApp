import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { C } from '../styles/colors';
import { Badge, Search, Chips, Bar, Confirm, FormModal, FInput, FPick, Empty } from '../components/Shared';
import { RES_CATS } from '../data/constants';

const CEMOJI = { Equipment:'🔧', Medical:'💊', 'Food Supply':'🍱', Vehicle:'🚗', 'Safety Gear':'🦺' };
const EF     = { name:'', category:'Equipment', quantity:'1', available:'1', unit:'pcs', location:'', status:'Available', notes:'' };

export default function ResourcesScreen() {
  const { resources, addResource, updateResource, deleteResource, reload } = useApp();
  const { user } = useAuth();
  const [q, setQ]     = useState('');
  const [fil, setFil] = useState('All');
  const [form, setForm] = useState({ ...EF });
  const [edit, setEdit] = useState(null);
  const [show, setShow] = useState(false);
  const [delId, setDelId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  const list = resources.filter(r => {
    const mq = !q || (r.name + r.category + r.location).toLowerCase().includes(q.toLowerCase());
    return mq && (fil === 'All' || r.category === fil);
  });

  function openAdd() { setForm({ ...EF }); setEdit(null); setShow(true); }
  function openEdit(r) { setForm({ name: r.name || '', category: r.category || 'Equipment', quantity: String(r.quantity || 1), available: String(r.available || 1), unit: r.unit || 'pcs', location: r.location || '', status: r.status || 'Available', notes: r.notes || '' }); setEdit(r); setShow(true); }
  function set(k, v) { setForm(p => ({ ...p, [k]: v })); }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const d = { ...form, quantity: parseInt(form.quantity) || 1, available: parseInt(form.available) || 0 };
      if (edit) await updateResource(edit.id, { ...edit, ...d }, user.name);
      else await addResource(d, user.name);
      setShow(false);
    } catch (e) { console.warn(e); }
    setSaving(false);
  }

  async function onRefresh() { setBusy(true); await reload(); setBusy(false); }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={s.bar}>
        <Search value={q} onChange={setQ} placeholder="Search resources..." />
        <TouchableOpacity style={s.add} onPress={openAdd}><Text style={s.addTxt}>+ Add</Text></TouchableOpacity>
      </View>
      <View style={s.fbar}><Chips opts={['All', ...RES_CATS]} val={fil} onSelect={setFil} active={C.orange} /></View>
      <ScrollView contentContainerStyle={s.list} refreshControl={<RefreshControl refreshing={busy} onRefresh={onRefresh} tintColor={C.blue} />}>
        <Text style={s.count}>{list.length} item{list.length !== 1 ? 's' : ''}</Text>
        {list.map(r => {
          const pct = r.quantity > 0 ? Math.round(r.available / r.quantity * 100) : 0;
          return (
            <View key={String(r.id)} style={s.card}>
              <View style={s.top}>
                <Text style={s.catEmoji}>{CEMOJI[r.category] || '📦'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{r.name}</Text>
                  <Text style={s.cat}>{r.category}{r.location ? '  ·  ' + r.location : ''}</Text>
                </View>
                <TouchableOpacity onPress={() => openEdit(r)} style={s.iBtn}><Text>✏️</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setDelId(r.id)} style={s.iBtn}><Text>🗑️</Text></TouchableOpacity>
              </View>
              <View style={s.avR}>
                <Text style={s.avL}>Available</Text>
                <Text style={s.avV}>{r.available}/{r.quantity} {r.unit || 'pcs'}  ({pct}%)</Text>
              </View>
              <Bar value={r.available} max={r.quantity} height={7} />
              <View style={s.bot}>
                <Badge label={r.status || 'Available'} variant={r.status === 'Available' ? 'success' : 'warning'} />
                {r.notes ? <Text style={s.notes} numberOfLines={1}>{r.notes}</Text> : null}
              </View>
            </View>
          );
        })}
        {list.length === 0 && <Empty emoji="📦" title="No resources yet" />}
        <View style={{ height: 24 }} />
      </ScrollView>
      <FormModal visible={show} title={edit ? 'Edit Resource' : 'Add Resource'} onClose={() => setShow(false)} onSave={save} saving={saving}>
        <FInput label="Resource Name *" value={form.name} onChange={v => set('name', v)} req />
        <FPick label="Category" value={form.category} opts={RES_CATS} onChange={v => set('category', v)} />
        <FInput label="Total Quantity" value={form.quantity} onChange={v => set('quantity', v)} type="numeric" />
        <FInput label="Available" value={form.available} onChange={v => set('available', v)} type="numeric" />
        <FInput label="Unit" value={form.unit} onChange={v => set('unit', v)} placeholder="pcs, boxes..." />
        <FInput label="Location" value={form.location || ''} onChange={v => set('location', v)} />
        <FPick label="Status" value={form.status} opts={['Available','Low Stock','Depleted','Reserved']} onChange={v => set('status', v)} />
        <FInput label="Notes" value={form.notes || ''} onChange={v => set('notes', v)} multi />
      </FormModal>
      <Confirm visible={!!delId} title="Delete Resource" msg="Remove this resource?" onOk={async () => { const r = resources.find(x => x.id === delId); await deleteResource(delId, r && r.name, user.name); setDelId(null); }} onNo={() => setDelId(null)} />
    </View>
  );
}

const s = StyleSheet.create({
  bar:      { flexDirection: 'row', gap: 10, padding: 12, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  add:      { backgroundColor: C.orange, borderRadius: 10, paddingHorizontal: 15, justifyContent: 'center', height: 42 },
  addTxt:   { color: '#fff', fontWeight: '700', fontSize: 14 },
  fbar:     { backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  list:     { padding: 12 },
  count:    { fontSize: 11, color: C.t3, marginBottom: 7 },
  card:     { backgroundColor: C.card, borderRadius: 12, padding: 13, marginBottom: 9, borderWidth: 1, borderColor: C.border },
  top:      { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 9 },
  catEmoji: { fontSize: 20 },
  name:     { fontSize: 13, fontWeight: '700', color: C.t1 },
  cat:      { fontSize: 10, color: C.t3, marginTop: 2 },
  iBtn:     { padding: 5 },
  avR:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  avL:      { fontSize: 10, color: C.t3 },
  avV:      { fontSize: 10, color: C.t2, fontWeight: '700' },
  bot:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 7 },
  notes:    { fontSize: 10, color: C.t3, flex: 1 },
});
