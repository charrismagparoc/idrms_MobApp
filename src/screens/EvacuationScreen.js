import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { C } from '../styles/colors';
import { Badge, Search, Chips, Bar, Confirm, FormModal, FInput, FPick, FTags, Empty } from '../components/Shared';
import { ZONES, EVAC_STAT, FACILITIES } from '../data/constants';

const EF = { name:'', address:'', zone:'Zone 1', status:'Open', capacity:'100', occupancy:'0', contactPerson:'', contact:'', facilitiesAvailable:[] };

export default function EvacuationScreen() {
  const { evacCenters, addEvac, updateEvac, deleteEvac, reload } = useApp();
  const { user } = useAuth();
  const [q, setQ]     = useState('');
  const [fil, setFil] = useState('All');
  const [form, setForm] = useState({ ...EF });
  const [edit, setEdit] = useState(null);
  const [show, setShow] = useState(false);
  const [delId, setDelId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  const list = evacCenters.filter(c => {
    const mq = !q || (c.name + c.address + c.zone).toLowerCase().includes(q.toLowerCase());
    return mq && (fil === 'All' || c.status === fil);
  });

  const totCap = evacCenters.reduce((a, c) => a + (c.capacity || 0), 0);
  const totOcc = evacCenters.reduce((a, c) => a + (c.occupancy || 0), 0);

  function openAdd() { setForm({ ...EF }); setEdit(null); setShow(true); }
  function openEdit(c) { setForm({ ...c, capacity: String(c.capacity || 100), occupancy: String(c.occupancy || 0), facilitiesAvailable: c.facilitiesAvailable || [] }); setEdit(c); setShow(true); }
  function set(k, v) { setForm(p => ({ ...p, [k]: v })); }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const d = { ...form, capacity: parseInt(form.capacity) || 100, occupancy: parseInt(form.occupancy) || 0 };
      if (edit) await updateEvac(edit.id, d, user.name);
      else await addEvac(d, user.name);
      setShow(false);
    } catch (e) { console.warn(e); }
    setSaving(false);
  }

  async function onRefresh() { setBusy(true); await reload(); setBusy(false); }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={s.bar}>
        <Search value={q} onChange={setQ} placeholder="Search centers..." />
        <TouchableOpacity style={s.add} onPress={openAdd}><Text style={s.addTxt}>+ Add</Text></TouchableOpacity>
      </View>
      <View style={s.sumRow}>
        {[[evacCenters.filter(c=>c.status==='Open').length,'Open',C.green],[totOcc,'Evacuees',C.blue],[totCap-totOcc,'Remaining',C.orange],[evacCenters.length,'Total',C.purple]].map(([v,l,c]) => (
          <View key={l} style={[s.sum, { borderColor: c + '33' }]}>
            <Text style={[s.sumV, { color: c }]}>{v}</Text>
            <Text style={s.sumL}>{l}</Text>
          </View>
        ))}
      </View>
      <View style={s.fbar}><Chips opts={['All', ...EVAC_STAT]} val={fil} onSelect={setFil} active={C.green} /></View>
      <ScrollView contentContainerStyle={s.list} refreshControl={<RefreshControl refreshing={busy} onRefresh={onRefresh} tintColor={C.blue} />}>
        <Text style={s.count}>{list.length} center{list.length !== 1 ? 's' : ''}</Text>
        {list.map(c => {
          const pct = c.capacity > 0 ? Math.min(Math.round(c.occupancy / c.capacity * 100), 100) : 0;
          return (
            <View key={String(c.id)} style={s.card}>
              <View style={s.ctop}>
                <View style={{ flex: 1 }}>
                  <Text style={s.cname}>{c.name}</Text>
                  {c.address ? <Text style={s.caddr}>{c.address}</Text> : null}
                </View>
                <TouchableOpacity onPress={() => openEdit(c)} style={s.iBtn}><Text>✏️</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setDelId(c.id)} style={s.iBtn}><Text>🗑️</Text></TouchableOpacity>
              </View>
              <View style={s.meta}>
                <Badge label={c.status} variant={c.status} />
                <Text style={s.mzone}>{c.zone}</Text>
                {c.contactPerson ? <Text style={s.mcp}>📞 {c.contactPerson}</Text> : null}
              </View>
              <View style={s.occR}>
                <Text style={s.occL}>Occupancy</Text>
                <Text style={s.occV}>{c.occupancy}/{c.capacity}  ({pct}%)</Text>
              </View>
              <Bar value={c.occupancy} max={c.capacity} height={7} />
              {(c.facilitiesAvailable || []).length > 0 && (
                <View style={s.facs}>
                  {c.facilitiesAvailable.map(f => <View key={f} style={s.fchip}><Text style={s.ftxt}>{f}</Text></View>)}
                </View>
              )}
            </View>
          );
        })}
        {list.length === 0 && <Empty emoji="🏠" title="No centers yet" />}
        <View style={{ height: 24 }} />
      </ScrollView>
      <FormModal visible={show} title={edit ? 'Edit Center' : 'Add Center'} onClose={() => setShow(false)} onSave={save} saving={saving}>
        <FInput label="Center Name *" value={form.name} onChange={v => set('name', v)} req />
        <FInput label="Address" value={form.address || ''} onChange={v => set('address', v)} />
        <FPick label="Zone" value={form.zone} opts={ZONES} onChange={v => set('zone', v)} />
        <FPick label="Status" value={form.status} opts={EVAC_STAT} onChange={v => set('status', v)} />
        <FInput label="Capacity" value={form.capacity} onChange={v => set('capacity', v)} type="numeric" />
        <FInput label="Occupancy" value={form.occupancy} onChange={v => set('occupancy', v)} type="numeric" />
        <FInput label="Contact Person" value={form.contactPerson || ''} onChange={v => set('contactPerson', v)} />
        <FInput label="Contact Number" value={form.contact || ''} onChange={v => set('contact', v)} type="phone-pad" />
        <FTags label="Facilities" values={form.facilitiesAvailable || []} opts={FACILITIES} onChange={v => set('facilitiesAvailable', v)} />
      </FormModal>
      <Confirm visible={!!delId} title="Delete Center" msg="Remove this evacuation center?" onOk={async () => { const c = evacCenters.find(x => x.id === delId); await deleteEvac(delId, c && c.name, user.name); setDelId(null); }} onNo={() => setDelId(null)} />
    </View>
  );
}

const s = StyleSheet.create({
  bar:    { flexDirection: 'row', gap: 10, padding: 12, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  add:    { backgroundColor: C.green, borderRadius: 10, paddingHorizontal: 15, justifyContent: 'center', height: 42 },
  addTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  sumRow: { flexDirection: 'row', gap: 7, padding: 10, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  sum:    { flex: 1, backgroundColor: C.bg, borderRadius: 10, padding: 9, alignItems: 'center', borderWidth: 1 },
  sumV:   { fontSize: 18, fontWeight: '800' },
  sumL:   { fontSize: 8.5, color: C.t3, textTransform: 'uppercase', fontWeight: '600', marginTop: 2 },
  fbar:   { backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  list:   { padding: 12 },
  count:  { fontSize: 11, color: C.t3, marginBottom: 7 },
  card:   { backgroundColor: C.card, borderRadius: 12, padding: 13, marginBottom: 9, borderWidth: 1, borderColor: C.border },
  ctop:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  cname:  { fontSize: 13, fontWeight: '700', color: C.t1 },
  caddr:  { fontSize: 10, color: C.t3, marginTop: 2 },
  iBtn:   { padding: 5 },
  meta:   { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 9, flexWrap: 'wrap' },
  mzone:  { fontSize: 11, color: C.t2, fontWeight: '600' },
  mcp:    { fontSize: 10, color: C.t3 },
  occR:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  occL:   { fontSize: 10, color: C.t3 },
  occV:   { fontSize: 10, color: C.t2, fontWeight: '700' },
  facs:   { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 7 },
  fchip:  { backgroundColor: C.el, borderRadius: 7, paddingHorizontal: 6, paddingVertical: 3, borderWidth: 1, borderColor: C.border },
  ftxt:   { fontSize: 9, color: C.t2, fontWeight: '600' },
});
