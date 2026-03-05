import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { C } from '../styles/colors';
import { Badge, Search, Chips, Confirm, FormModal, FInput, FPick, FTags, Empty } from '../components/Shared';
import { ZONES, VULN_TAGS, RES_STAT } from '../data/constants';

const EF = { name:'', zone:'Zone 1', address:'', householdMembers:'1', contact:'', evacuationStatus:'Safe', vulnerabilityTags:[], notes:'' };

export default function ResidentsScreen() {
  const { residents, addResident, updateResident, deleteResident, reload } = useApp();
  const { user } = useAuth();
  const [q, setQ]       = useState('');
  const [fz, setFz]     = useState('All');
  const [fe, setFe]     = useState('All');
  const [form, setForm] = useState({ ...EF });
  const [edit, setEdit] = useState(null);
  const [show, setShow] = useState(false);
  const [delId, setDelId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  const list = residents.filter(r => {
    const mq = !q || (r.name + r.address + r.zone).toLowerCase().includes(q.toLowerCase());
    return mq && (fz === 'All' || r.zone === fz) && (fe === 'All' || r.evacuationStatus === fe);
  });

  function openAdd() { setForm({ ...EF }); setEdit(null); setShow(true); }
  function openEdit(r) { setForm({ ...r, householdMembers: String(r.householdMembers || 1), vulnerabilityTags: r.vulnerabilityTags || [] }); setEdit(r); setShow(true); }
  function set(k, v) { setForm(p => ({ ...p, [k]: v })); }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const d = { ...form, householdMembers: parseInt(form.householdMembers) || 1 };
      if (edit) await updateResident(edit.id, d, user.name);
      else await addResident(d, user.name);
      setShow(false);
    } catch (e) { console.warn(e); }
    setSaving(false);
  }

  async function onRefresh() { setBusy(true); await reload(); setBusy(false); }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={s.bar}>
        <Search value={q} onChange={setQ} placeholder="Search residents..." />
        <TouchableOpacity style={s.add} onPress={openAdd}><Text style={s.addTxt}>+ Add</Text></TouchableOpacity>
      </View>
      <View style={s.fbar}><Chips opts={['All', ...ZONES]} val={fz} onSelect={setFz} /></View>
      <View style={s.fbar}><Chips opts={['All', ...RES_STAT]} val={fe} onSelect={setFe} active={C.purple} /></View>
      <ScrollView contentContainerStyle={s.list} refreshControl={<RefreshControl refreshing={busy} onRefresh={onRefresh} tintColor={C.blue} />}>
        <Text style={s.count}>{list.length} of {residents.length} residents</Text>
        {list.map(r => (
          <View key={String(r.id)} style={s.card}>
            <View style={s.top}>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{r.name}</Text>
                <Text style={s.zone}>{r.zone}{r.address ? '  ·  ' + r.address : ''}</Text>
              </View>
              <TouchableOpacity onPress={() => openEdit(r)} style={s.iBtn}><Text>✏️</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setDelId(r.id)} style={s.iBtn}><Text>🗑️</Text></TouchableOpacity>
            </View>
            <View style={s.meta}>
              <Badge label={r.evacuationStatus || 'Safe'} variant={r.evacuationStatus || 'Safe'} />
              <Text style={s.m}>👥 {r.householdMembers || 1} members</Text>
              {r.contact ? <Text style={s.m}>📞 {r.contact}</Text> : null}
            </View>
            {(r.vulnerabilityTags || []).length > 0 && (
              <View style={s.tags}>
                {r.vulnerabilityTags.map(t => <View key={t} style={s.tag}><Text style={s.tagT}>{t}</Text></View>)}
              </View>
            )}
          </View>
        ))}
        {list.length === 0 && <Empty emoji="👥" title="No residents yet" />}
        <View style={{ height: 24 }} />
      </ScrollView>
      <FormModal visible={show} title={edit ? 'Edit Resident' : 'Add Resident'} onClose={() => setShow(false)} onSave={save} saving={saving}>
        <FInput label="Full Name *" value={form.name} onChange={v => set('name', v)} req />
        <FPick label="Zone" value={form.zone} opts={ZONES} onChange={v => set('zone', v)} />
        <FInput label="Address" value={form.address || ''} onChange={v => set('address', v)} />
        <FInput label="Household Members" value={form.householdMembers} onChange={v => set('householdMembers', v)} type="numeric" />
        <FInput label="Contact Number" value={form.contact || ''} onChange={v => set('contact', v)} type="phone-pad" />
        <FPick label="Evacuation Status" value={form.evacuationStatus || 'Safe'} opts={RES_STAT} onChange={v => set('evacuationStatus', v)} />
        <FTags label="Vulnerability Tags" values={form.vulnerabilityTags || []} opts={VULN_TAGS} onChange={v => set('vulnerabilityTags', v)} />
        <FInput label="Notes" value={form.notes || ''} onChange={v => set('notes', v)} multi />
      </FormModal>
      <Confirm visible={!!delId} title="Delete Resident" msg="Remove this resident record?" onOk={async () => { const r = residents.find(x => x.id === delId); await deleteResident(delId, r && r.name, user.name); setDelId(null); }} onNo={() => setDelId(null)} />
    </View>
  );
}

const s = StyleSheet.create({
  bar:    { flexDirection: 'row', gap: 10, padding: 12, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  add:    { backgroundColor: C.purple, borderRadius: 10, paddingHorizontal: 15, justifyContent: 'center', height: 42 },
  addTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  fbar:   { backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  list:   { padding: 12 },
  count:  { fontSize: 11, color: C.t3, marginBottom: 7 },
  card:   { backgroundColor: C.card, borderRadius: 12, padding: 13, marginBottom: 9, borderWidth: 1, borderColor: C.border },
  top:    { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 7 },
  name:   { fontSize: 13, fontWeight: '700', color: C.t1 },
  zone:   { fontSize: 10, color: C.t3, marginTop: 2 },
  iBtn:   { padding: 5 },
  meta:   { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  m:      { fontSize: 10, color: C.t3 },
  tags:   { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 7 },
  tag:    { backgroundColor: C.purple + '22', borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: C.purple + '44' },
  tagT:   { fontSize: 9, color: C.purple, fontWeight: '800' },
});
