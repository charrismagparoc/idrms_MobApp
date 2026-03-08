import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Badge, Confirm, DeleteBtn, DropFilter, EditBtn, Empty, FInput, FormModal, FPick, FTags, Search } from '../components/Shared';
import { ScreenHeader } from '../components/ScreenHeader';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { RES_STAT, VULN_TAGS, ZONES } from '../data/constants';
import { C } from '../styles/colors';

const EF = { name: '', zone: 'Zone 1', address: '', householdMembers: '1', contact: '', evacuationStatus: 'Safe', vulnerabilityTags: [], notes: '' };

export default function ResidentsScreen({ navigation }) {
  const { residents, addResident, updateResident, deleteResident, reload } = useApp();
  const { user, logout } = useAuth();
  const [q, setQ]       = useState('');
  const [fz, setFz]     = useState('All');
  const [fe, setFe]     = useState('All');
  const [form, setForm] = useState({ ...EF });
  const [edit, setEdit] = useState(null);
  const [show, setShow] = useState(false);
  const [delId, setDelId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  const list = residents.filter(r =>
    (!q || (r.name + r.address + r.zone).toLowerCase().includes(q.toLowerCase())) &&
    (fz === 'All' || r.zone === fz) &&
    (fe === 'All' || r.evacuationStatus === fe)
  );

  function openAdd()   { setForm({ ...EF }); setEdit(null); setShow(true); }
  function openEdit(r) { setForm({ ...r, householdMembers: String(r.householdMembers || 1), vulnerabilityTags: r.vulnerabilityTags || [] }); setEdit(r); setShow(true); }
  function set(k, v)   { setForm(p => ({ ...p, [k]: v })); }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const d = { ...form, householdMembers: parseInt(form.householdMembers) || 1 };
      if (edit) await updateResident(edit.id, d, user?.name);
      else      await addResident(d, user?.name);
      setShow(false);
    } catch (e) { console.warn(e); }
    setSaving(false);
  }

  async function onRefresh() { setBusy(true); await reload(); setBusy(false); }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScreenHeader
        title="Residents"
        currentRoute="Residents"
        onNavigate={n => navigation.navigate(n)}
        onLogout={logout}
      />

      <View style={s.bar}>
        <Search value={q} onChange={setQ} placeholder="Search residents..." />
        <TouchableOpacity style={[s.addBtn, { backgroundColor: C.purple }]} onPress={openAdd} activeOpacity={0.8}>
          <Ionicons name="person-add" size={16} color="#fff" />
          <Text style={s.addTxt}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={s.filterRow}>
        <DropFilter label="Zone"   value={fz} opts={['All', ...ZONES]}    onSelect={setFz}                 />
        <DropFilter label="Status" value={fe} opts={['All', ...RES_STAT]} onSelect={setFe} color={C.purple} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={busy} onRefresh={onRefresh} tintColor={C.blue} />}>

        <Text style={s.count}>{list.length} of {residents.length} residents</Text>

        <View style={s.tableWrap}>
          <View style={s.thead}>
            <Text style={[s.th, { flex: 2 }]}>NAME</Text>
            <Text style={[s.th, { width: 58 }]}>ZONE</Text>
            <Text style={[s.th, { width: 72 }]}>STATUS</Text>
            <Text style={[s.th, { width: 32, textAlign: 'center' }]}>HH</Text>
            <Text style={[s.th, { width: 60, textAlign: 'right' }]}>ACT</Text>
          </View>
          {list.map((r, idx) => (
            <View key={String(r.id)} style={[s.trow, idx % 2 === 1 && s.zebra]}>
              <View style={{ flex: 2 }}>
                <Text style={s.tdBold} numberOfLines={1}>{r.name}</Text>
                {r.address ? <Text style={s.tdSub} numberOfLines={1}>{r.address}</Text> : null}
                {(r.vulnerabilityTags || []).length > 0 &&
                  <Text style={s.tdTags} numberOfLines={1}>{r.vulnerabilityTags.join(', ')}</Text>}
              </View>
              <Text style={[s.td, { width: 58 }]} numberOfLines={1}>{r.zone}</Text>
              <View style={{ width: 72 }}><Badge label={r.evacuationStatus || 'Safe'} variant={r.evacuationStatus || 'Safe'} /></View>
              <Text style={[s.td, { width: 32, textAlign: 'center' }]}>{r.householdMembers || 1}</Text>
              <View style={{ width: 60, flexDirection: 'row', justifyContent: 'flex-end', gap: 5 }}>
                <EditBtn   onPress={() => openEdit(r)}    />
                <DeleteBtn onPress={() => setDelId(r.id)} />
              </View>
            </View>
          ))}
        </View>
        {list.length === 0 && <Empty iconName="people-outline" title="No residents yet" />}
      </ScrollView>

      <FormModal visible={show} title={edit ? 'Edit Resident' : 'Add Resident'} onClose={() => setShow(false)} onSave={save} saving={saving}>
        <FInput label="Full Name *"         value={form.name}                 onChange={v => set('name', v)}             req />
        <FPick  label="Zone"                value={form.zone}                 opts={ZONES}    onChange={v => set('zone', v)} />
        <FInput label="Address"             value={form.address || ''}        onChange={v => set('address', v)}              />
        <FInput label="Household Members"   value={form.householdMembers}     onChange={v => set('householdMembers', v)} type="numeric" />
        <FInput label="Contact Number"      value={form.contact || ''}        onChange={v => set('contact', v)}          type="phone-pad" />
        <FPick  label="Evacuation Status"   value={form.evacuationStatus||'Safe'} opts={RES_STAT} onChange={v => set('evacuationStatus', v)} />
        <FTags  label="Vulnerability Tags"  values={form.vulnerabilityTags||[]} opts={VULN_TAGS} onChange={v => set('vulnerabilityTags', v)} />
        <FInput label="Notes"               value={form.notes || ''}          onChange={v => set('notes', v)}            multi />
      </FormModal>

      <Confirm visible={!!delId} title="Delete Resident" msg="Remove this resident record?"
        onOk={async () => { const r = residents.find(x => x.id === delId); await deleteResident(delId, r?.name, user?.name); setDelId(null); }}
        onNo={() => setDelId(null)} />
      </View>
  );
}

const s = StyleSheet.create({
  bar:       { flexDirection: 'row', gap: 10, padding: 12, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  addBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 8, paddingHorizontal: 14, height: 42 },
  addTxt:    { color: '#fff', fontWeight: '700', fontSize: 13 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  count:     { fontSize: 11, color: C.t3, paddingHorizontal: 14, paddingVertical: 8 },
  tableWrap: { marginHorizontal: 12, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  thead:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, backgroundColor: C.el },
  th:        { fontSize: 9, fontWeight: '700', color: C.t3, letterSpacing: 0.4 },
  trow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10, borderTopWidth: 1, borderTopColor: C.border, gap: 4 },
  zebra:     { backgroundColor: 'rgba(255,255,255,0.02)' },
  td:        { fontSize: 12, color: C.t1 },
  tdBold:    { fontSize: 12, fontWeight: '600', color: C.t1 },
  tdSub:     { fontSize: 10, color: C.t3, marginTop: 1 },
  tdTags:    { fontSize: 9, color: C.purple, marginTop: 2 },
});
