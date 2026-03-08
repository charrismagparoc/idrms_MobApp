import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Badge, Bar, Confirm, DeleteBtn, DropFilter, EditBtn, Empty, FInput, FormModal, FPick, FTags, Search } from '../components/Shared';
import { ScreenHeader } from '../components/ScreenHeader';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { EVAC_STAT, FACILITIES, ZONES } from '../data/constants';
import { C } from '../styles/colors';

const EF = { name: '', address: '', zone: 'Zone 1', status: 'Open', capacity: '100', occupancy: '0', contactPerson: '', contact: '', facilitiesAvailable: [] };

export default function EvacuationScreen({ navigation }) {
  const { evacCenters, addEvac, updateEvac, deleteEvac, reload } = useApp();
  const { user, logout } = useAuth();
  const [q, setQ]       = useState('');
  const [fil, setFil]   = useState('All');
  const [form, setForm] = useState({ ...EF });
  const [edit, setEdit] = useState(null);
  const [show, setShow] = useState(false);
  const [delId, setDelId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  const list = evacCenters.filter(c =>
    (!q || (c.name + c.address + c.zone).toLowerCase().includes(q.toLowerCase())) &&
    (fil === 'All' || c.status === fil)
  );

  const totCap = evacCenters.reduce((a, c) => a + (c.capacity || 0), 0);
  const totOcc = evacCenters.reduce((a, c) => a + (c.occupancy || 0), 0);

  function openAdd()   { setForm({ ...EF }); setEdit(null); setShow(true); }
  function openEdit(c) { setForm({ ...c, capacity: String(c.capacity || 100), occupancy: String(c.occupancy || 0), facilitiesAvailable: c.facilitiesAvailable || [] }); setEdit(c); setShow(true); }
  function set(k, v)   { setForm(p => ({ ...p, [k]: v })); }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const d = { ...form, capacity: parseInt(form.capacity) || 100, occupancy: parseInt(form.occupancy) || 0 };
      if (edit) await updateEvac(edit.id, d, user?.name);
      else      await addEvac(d, user?.name);
      setShow(false);
    } catch (e) { console.warn(e); }
    setSaving(false);
  }

  async function onRefresh() { setBusy(true); await reload(); setBusy(false); }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScreenHeader
        title="Evacuation"
        currentRoute="Evacuation"
        onNavigate={n => navigation.navigate(n)}
        onLogout={logout}
      />

      <View style={s.bar}>
        <Search value={q} onChange={setQ} placeholder="Search centers..." />
        <TouchableOpacity style={[s.addBtn, { backgroundColor: C.green }]} onPress={openAdd} activeOpacity={0.8}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={s.addTxt}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={s.sumRow}>
        {[[evacCenters.filter(c=>c.status==='Open').length,'Open',C.green,'location'],
          [totOcc,'Evacuees',C.blue,'people'],
          [totCap-totOcc,'Remaining',C.orange,'swap-horizontal'],
          [evacCenters.length,'Total',C.purple,'business']].map(([v,l,c,ico]) => (
          <View key={l} style={[s.sumCard, { borderColor: c + '33' }]}>
            <Ionicons name={ico} size={14} color={c} style={{ marginBottom: 3 }} />
            <Text style={[s.sumV, { color: c }]}>{v}</Text>
            <Text style={s.sumL}>{l}</Text>
          </View>
        ))}
      </View>

      <View style={s.filterRow}>
        <DropFilter label="Status" value={fil} opts={['All', ...EVAC_STAT]} onSelect={setFil} color={C.green} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={busy} onRefresh={onRefresh} tintColor={C.blue} />}>

        <Text style={s.count}>{list.length} center{list.length !== 1 ? 's' : ''}</Text>

        <View style={s.tableWrap}>
          <View style={s.thead}>
            <Text style={[s.th, { flex: 2.5 }]}>CENTER</Text>
            <Text style={[s.th, { width: 56 }]}>STATUS</Text>
            <Text style={[s.th, { flex: 1.5 }]}>OCCUPANCY</Text>
            <Text style={[s.th, { width: 60, textAlign: 'right' }]}>ACT</Text>
          </View>
          {list.map((c, idx) => {
            const pct = c.capacity > 0 ? Math.min(Math.round(c.occupancy / c.capacity * 100), 100) : 0;
            return (
              <View key={String(c.id)} style={[s.trow, idx % 2 === 1 && s.zebra]}>
                <View style={{ flex: 2.5 }}>
                  <Text style={s.tdBold} numberOfLines={1}>{c.name}</Text>
                  <Text style={s.tdSub} numberOfLines={1}>{c.zone}{c.contactPerson ? '  ·  ' + c.contactPerson : ''}</Text>
                  {(c.facilitiesAvailable || []).length > 0 &&
                    <Text style={s.tdSub} numberOfLines={1}>{c.facilitiesAvailable.join(', ')}</Text>}
                </View>
                <View style={{ width: 56 }}><Badge label={c.status} variant={c.status} /></View>
                <View style={{ flex: 1.5 }}>
                  <Text style={s.tdSub}>{c.occupancy}/{c.capacity} ({pct}%)</Text>
                  <Bar value={c.occupancy} max={c.capacity} height={5} />
                </View>
                <View style={{ width: 60, flexDirection: 'row', justifyContent: 'flex-end', gap: 5 }}>
                  <EditBtn   onPress={() => openEdit(c)}    />
                  <DeleteBtn onPress={() => setDelId(c.id)} />
                </View>
              </View>
            );
          })}
        </View>
        {list.length === 0 && <Empty iconName="location-outline" title="No centers yet" />}
      </ScrollView>

      <FormModal visible={show} title={edit ? 'Edit Center' : 'Add Center'} onClose={() => setShow(false)} onSave={save} saving={saving}>
        <FInput label="Center Name *" value={form.name}         onChange={v => set('name', v)}              req />
        <FInput label="Address"       value={form.address || ''} onChange={v => set('address', v)}              />
        <FPick  label="Zone"          value={form.zone}          opts={ZONES}      onChange={v => set('zone', v)} />
        <FPick  label="Status"        value={form.status}        opts={EVAC_STAT}  onChange={v => set('status', v)} />
        <FInput label="Capacity"      value={form.capacity}      onChange={v => set('capacity', v)}  type="numeric" />
        <FInput label="Occupancy"     value={form.occupancy}     onChange={v => set('occupancy', v)} type="numeric" />
        <FInput label="Contact Person" value={form.contactPerson || ''} onChange={v => set('contactPerson', v)} />
        <FInput label="Contact No."   value={form.contact || ''}  onChange={v => set('contact', v)} type="phone-pad" />
        <FTags  label="Facilities"    values={form.facilitiesAvailable || []} opts={FACILITIES} onChange={v => set('facilitiesAvailable', v)} />
      </FormModal>

      <Confirm visible={!!delId} title="Delete Center" msg="Remove this evacuation center?"
        onOk={async () => { const c = evacCenters.find(x => x.id === delId); await deleteEvac(delId, c?.name, user?.name); setDelId(null); }}
        onNo={() => setDelId(null)} />
      </View>
  );
}

const s = StyleSheet.create({
  bar:       { flexDirection: 'row', gap: 10, padding: 12, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  addBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 14, height: 42 },
  addTxt:    { color: '#fff', fontWeight: '700', fontSize: 13 },
  sumRow:    { flexDirection: 'row', gap: 6, padding: 10, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  sumCard:   { flex: 1, backgroundColor: C.bg, borderRadius: 8, padding: 9, alignItems: 'center', borderWidth: 1 },
  sumV:      { fontSize: 15, fontWeight: '800' },
  sumL:      { fontSize: 8, color: C.t3, textTransform: 'uppercase', fontWeight: '600', marginTop: 1 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  count:     { fontSize: 11, color: C.t3, paddingHorizontal: 14, paddingVertical: 8 },
  tableWrap: { marginHorizontal: 12, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  thead:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, backgroundColor: C.el },
  th:        { fontSize: 9, fontWeight: '700', color: C.t3, letterSpacing: 0.4 },
  trow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10, borderTopWidth: 1, borderTopColor: C.border, gap: 6 },
  zebra:     { backgroundColor: 'rgba(255,255,255,0.02)' },
  tdBold:    { fontSize: 12, fontWeight: '600', color: C.t1 },
  tdSub:     { fontSize: 10, color: C.t3, marginTop: 2 },
});
