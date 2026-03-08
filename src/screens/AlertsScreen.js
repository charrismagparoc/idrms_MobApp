import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Badge, Confirm, DeleteBtn, DropFilter, Empty, FInput, FormModal, FPick, Search, SecHdr } from '../components/Shared';
import { ScreenHeader } from '../components/ScreenHeader';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ALT_LEVELS, ZONES } from '../data/constants';
import { C } from '../styles/colors';

const LCOLOR  = { Danger: C.red, Warning: C.orange, Advisory: C.blue, Resolved: C.green };
const ALL_Z   = ['All Zones', ...ZONES];
const EF      = { level: 'Advisory', zone: 'All Zones', message: '' };
const QUICK = [
  { label: 'Flood Warning',  level: 'Danger',   zone: 'Zone 3',    icon: 'water',         msg: 'FLOOD WARNING: Water level critically high. Immediate evacuation required.'  },
  { label: 'Mandatory Evac', level: 'Danger',   zone: 'All Zones', icon: 'home-outline',   msg: 'MANDATORY EVACUATION ORDER: All residents in high-risk zones must evacuate.' },
  { label: 'Storm Advisory', level: 'Advisory', zone: 'All Zones', icon: 'thunderstorm',   msg: 'STORM ADVISORY: Strong winds and heavy rain expected. Prepare emergency kits.'},
  { label: 'All Clear',      level: 'Resolved', zone: 'All Zones', icon: 'checkmark-circle',msg: 'ALL CLEAR: Emergency resolved. Residents may return to normal activities.'    },
];

export default function AlertsScreen({ navigation }) {
  const { alerts, addAlert, deleteAlert, reload } = useApp();
  const { user, logout } = useAuth();
  const [q, setQ]           = useState('');
  const [filLevel, setFilLevel] = useState('All');
  const [form, setForm]     = useState({ ...EF });
  const [show, setShow]     = useState(false);
  const [delId, setDelId]   = useState(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy]     = useState(false);

  const list = alerts.filter(a => {
    const mq = !q || (a.message + a.zone + a.level).toLowerCase().includes(q.toLowerCase());
    return mq && (filLevel === 'All' || a.level === filLevel);
  });

  function set(k, v) { setForm(p => ({ ...p, [k]: v })); }

  async function save() {
    if (!form.message.trim()) return;
    setSaving(true);
    try { await addAlert(form, user?.name); setShow(false); }
    catch (e) { console.warn(e); }
    setSaving(false);
  }

  async function onRefresh() { setBusy(true); await reload(); setBusy(false); }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScreenHeader
        title="Alerts"
        currentRoute="Alerts"
        onNavigate={n => navigation.navigate(n)}
        onLogout={logout}
      />

      <View style={s.bar}>
        <Search value={q} onChange={setQ} placeholder="Search alerts..." />
        <TouchableOpacity style={[s.addBtn, { backgroundColor: C.red }]} onPress={() => { setForm({ ...EF }); setShow(true); }} activeOpacity={0.8}>
          <Ionicons name="megaphone" size={16} color="#fff" />
          <Text style={s.addTxt}>Send</Text>
        </TouchableOpacity>
      </View>

      <View style={s.filterRow}>
        <DropFilter label="Level" value={filLevel} opts={['All', ...ALT_LEVELS]} onSelect={setFilLevel} color={C.red} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}
        refreshControl={<RefreshControl refreshing={busy} onRefresh={onRefresh} tintColor={C.blue} />}>

        {/* Quick Broadcast */}
        <View style={s.section}>
          <SecHdr title="Quick Broadcast" />
          <View style={s.tableWrap}>
            {QUICK.map((qt, idx) => (
              <TouchableOpacity key={qt.label} style={[s.qrow, idx % 2 === 1 && s.zebra]}
                onPress={() => { setForm({ level: qt.level, zone: qt.zone, message: qt.msg }); setShow(true); }}
                activeOpacity={0.7}>
                <Ionicons name={qt.icon} size={18} color={LCOLOR[qt.level] || C.blue} />
                <View style={{ flex: 1 }}>
                  <Text style={s.qlbl}>{qt.label}</Text>
                  <Text style={s.qsub} numberOfLines={1}>{qt.msg}</Text>
                </View>
                <Badge label={qt.level} variant={qt.level} />
                <Ionicons name="chevron-forward" size={14} color={C.t3} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* History */}
        <View style={s.section}>
          <SecHdr title="Alert History" count={alerts.length} />
          <View style={s.tableWrap}>
            <View style={s.thead}>
              <Text style={[s.th, { width: 70 }]}>LEVEL</Text>
              <Text style={[s.th, { width: 68 }]}>ZONE</Text>
              <Text style={[s.th, { flex: 1 }]}>MESSAGE</Text>
              <Text style={[s.th, { width: 28 }]}></Text>
            </View>
            {list.map((a, idx) => (
              <View key={String(a.id)} style={[s.trow, idx % 2 === 1 && s.zebra]}>
                <View style={{ width: 70 }}><Badge label={a.level} variant={a.level} /></View>
                <Text style={[s.td, { width: 68 }]} numberOfLines={1}>{a.zone}</Text>
                <Text style={[s.td, { flex: 1 }]}   numberOfLines={2}>{a.message}</Text>
                <DeleteBtn onPress={() => setDelId(a.id)} />
              </View>
            ))}
          </View>
          {list.length === 0 && <Empty iconName="megaphone-outline" title="No alerts yet" />}
        </View>
      </ScrollView>

      <FormModal visible={show} title="Send Alert" onClose={() => setShow(false)} onSave={save} saving={saving} saveLabel="Send">
        <FPick  label="Alert Level"  value={form.level}   opts={ALT_LEVELS} onChange={v => set('level', v)}   />
        <FPick  label="Target Zone"  value={form.zone}    opts={ALL_Z}      onChange={v => set('zone', v)}    />
        <FInput label="Message *"    value={form.message} onChange={v => set('message', v)} placeholder="Enter alert message..." multi req />
      </FormModal>

      <Confirm visible={!!delId} title="Delete Alert" msg="Remove from alert history?"
        onOk={async () => { await deleteAlert(delId, user?.name); setDelId(null); }}
        onNo={() => setDelId(null)} />
      </View>
  );
}

const s = StyleSheet.create({
  bar:       { flexDirection: 'row', gap: 10, padding: 12, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  addBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 8, paddingHorizontal: 14, height: 42 },
  addTxt:    { color: '#fff', fontWeight: '700', fontSize: 13 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  section:   { margin: 12, marginBottom: 0, backgroundColor: C.card, borderRadius: 10, padding: 13, borderWidth: 1, borderColor: C.border },
  tableWrap: { borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  thead:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, backgroundColor: C.el },
  th:        { fontSize: 9, fontWeight: '700', color: C.t3, letterSpacing: 0.4 },
  trow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10, borderTopWidth: 1, borderTopColor: C.border, gap: 6 },
  qrow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 12, borderTopWidth: 1, borderTopColor: C.border, gap: 10 },
  zebra:     { backgroundColor: 'rgba(255,255,255,0.02)' },
  td:        { fontSize: 12, color: C.t1 },
  qlbl:      { fontSize: 13, fontWeight: '700', color: C.t1 },
  qsub:      { fontSize: 10, color: C.t3, marginTop: 2 },
});
