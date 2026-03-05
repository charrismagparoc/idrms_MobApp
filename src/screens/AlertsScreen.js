import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { C } from '../styles/colors';
import { Badge, Search, Confirm, FormModal, FInput, FPick, SecHdr, Empty } from '../components/Shared';
import { ALT_LEVELS, ZONES } from '../data/constants';

const LEMOJI = { Danger:'🚨', Warning:'⚡', Advisory:'📢', Resolved:'✅' };
const LCOLOR = { Danger: C.red, Warning: C.orange, Advisory: C.blue, Resolved: C.green };
const ALL_Z   = ['All Zones', ...ZONES];
const QUICK = [
  { label:'Flood Warning',  level:'Danger',   zone:'Zone 3',    msg:'FLOOD WARNING: Water level critically high. Immediate evacuation required.' },
  { label:'Mandatory Evac', level:'Danger',   zone:'All Zones', msg:'MANDATORY EVACUATION ORDER: All residents in high-risk zones must evacuate immediately.' },
  { label:'Storm Advisory', level:'Advisory', zone:'All Zones', msg:'STORM ADVISORY: Strong winds and heavy rain expected. Prepare emergency kits.' },
  { label:'All Clear',      level:'Resolved', zone:'All Zones', msg:'ALL CLEAR: Emergency situation resolved. Residents may return to normal activities.' },
];
const EF = { level:'Advisory', zone:'All Zones', message:'' };

export default function AlertsScreen() {
  const { alerts, addAlert, deleteAlert, reload } = useApp();
  const { user } = useAuth();
  const [q, setQ]     = useState('');
  const [form, setForm] = useState({ ...EF });
  const [show, setShow] = useState(false);
  const [delId, setDelId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  const list = alerts.filter(a => !q || (a.message + a.zone + a.level).toLowerCase().includes(q.toLowerCase()));

  function openQ(qt) { setForm({ level: qt.level, zone: qt.zone, message: qt.msg }); setShow(true); }
  function set(k, v) { setForm(p => ({ ...p, [k]: v })); }

  async function save() {
    if (!form.message.trim()) return;
    setSaving(true);
    try { await addAlert(form, user.name); setShow(false); }
    catch (e) { console.warn(e); }
    setSaving(false);
  }

  async function onRefresh() { setBusy(true); await reload(); setBusy(false); }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={s.bar}>
        <Search value={q} onChange={setQ} placeholder="Search alerts..." />
        <TouchableOpacity style={s.add} onPress={() => { setForm({ ...EF }); setShow(true); }}><Text style={s.addTxt}>+ Send</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.list} refreshControl={<RefreshControl refreshing={busy} onRefresh={onRefresh} tintColor={C.blue} />}>
        <View style={s.card}>
          <SecHdr title="Quick Broadcast" />
          <View style={s.qgrid}>
            {QUICK.map(qt => (
              <TouchableOpacity key={qt.label} style={[s.qbtn, { borderColor: (LCOLOR[qt.level] || C.border) + '55' }]} onPress={() => openQ(qt)}>
                <Text style={s.qemoji}>{LEMOJI[qt.level]}</Text>
                <Text style={[s.qlbl, { color: LCOLOR[qt.level] || C.t1 }]}>{qt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={s.card}>
          <SecHdr title={'Alert History'} count={alerts.length} />
          {list.map(a => (
            <View key={String(a.id)} style={s.arow}>
              <Text style={s.aemoji}>{LEMOJI[a.level] || '📢'}</Text>
              <View style={{ flex: 1 }}>
                <View style={s.ameta1}>
                  <Badge label={a.level} variant={a.level} />
                  <Text style={s.azone}>{a.zone}</Text>
                </View>
                <Text style={s.amsg} numberOfLines={2}>{a.message}</Text>
                <Text style={s.ameta2}>{a.sent_by || 'System'}  ·  {a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}</Text>
              </View>
              <TouchableOpacity onPress={() => setDelId(a.id)} style={{ padding: 6 }}><Text>🗑️</Text></TouchableOpacity>
            </View>
          ))}
          {list.length === 0 && <Empty emoji="📢" title="No alerts yet" />}
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
      <FormModal visible={show} title="Send Alert" onClose={() => setShow(false)} onSave={save} saving={saving} saveLabel="Send">
        <FPick label="Alert Level" value={form.level} opts={ALT_LEVELS} onChange={v => set('level', v)} />
        <FPick label="Target Zone" value={form.zone} opts={ALL_Z} onChange={v => set('zone', v)} />
        <FInput label="Message *" value={form.message} onChange={v => set('message', v)} placeholder="Enter alert message..." multi req />
      </FormModal>
      <Confirm visible={!!delId} title="Delete Alert" msg="Remove from alert history?" onOk={async () => { await deleteAlert(delId, user.name); setDelId(null); }} onNo={() => setDelId(null)} />
    </View>
  );
}

const s = StyleSheet.create({
  bar:    { flexDirection: 'row', gap: 10, padding: 12, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  add:    { backgroundColor: C.red, borderRadius: 10, paddingHorizontal: 15, justifyContent: 'center', height: 42 },
  addTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  list:   { padding: 12 },
  card:   { backgroundColor: C.card, borderRadius: 12, padding: 13, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  qgrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  qbtn:   { width: '47%', backgroundColor: C.el, borderRadius: 12, padding: 13, alignItems: 'center', borderWidth: 1 },
  qemoji: { fontSize: 22, marginBottom: 5 },
  qlbl:   { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  arow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 9, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.border },
  aemoji: { fontSize: 18, paddingTop: 2 },
  ameta1: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 4 },
  azone:  { fontSize: 11, color: C.t3, fontWeight: '600' },
  amsg:   { fontSize: 12, color: C.t2, lineHeight: 17 },
  ameta2: { fontSize: 10, color: C.t3, marginTop: 3 },
});
