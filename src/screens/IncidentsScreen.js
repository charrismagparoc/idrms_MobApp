import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Badge, Confirm, DeleteBtn, DropFilter, EditBtn, Empty, FInput, FormModal, FPick, Search } from '../components/Shared';
import { ScreenHeader } from '../components/ScreenHeader';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { INC_STATUS, SEVERITIES, TYPES, ZONES } from '../data/constants';
import { C, TYPE_COLOR } from '../styles/colors';

const EMPTY = { type: 'Flood', zone: 'Zone 1', location: '', severity: 'Medium', status: 'Pending', description: '', reporter: '' };

export default function IncidentsScreen({ navigation }) {
  const { incidents, addIncident, updateIncident, deleteIncident, reload } = useApp();
  const { user, logout } = useAuth();
  const [q, setQ]           = useState('');
  const [filStatus, setFilStatus]     = useState('All');
  const [filSeverity, setFilSeverity] = useState('All');
  const [form, setForm]   = useState({ ...EMPTY });
  const [edit, setEdit]   = useState(null);
  const [show, setShow]   = useState(false);
  const [delId, setDelId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy]   = useState(false);

  const list = incidents.filter(i => {
    const mq = !q || (i.type + i.zone + (i.location||'')).toLowerCase().includes(q.toLowerCase());
    const ms = filStatus   === 'All' || i.status   === filStatus;
    const mv = filSeverity === 'All' || i.severity === filSeverity;
    return mq && ms && mv;
  });

  function openAdd()   { setForm({ ...EMPTY }); setEdit(null); setShow(true); }
  function openEdit(i) { setForm({ ...i }); setEdit(i); setShow(true); }
  function set(k, v)   { setForm(p => ({ ...p, [k]: v })); }

  async function save() {
    if (!form.type) return;
    setSaving(true);
    try {
      if (edit) await updateIncident(edit.id, form, user?.name);
      else      await addIncident(form, user?.name);
      setShow(false);
    } catch (e) { console.warn(e); }
    setSaving(false);
  }

  async function onRefresh() { setBusy(true); await reload(); setBusy(false); }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScreenHeader
        title="Incidents"
        currentRoute="Incidents"
        onNavigate={n => navigation.navigate(n)}
        onLogout={logout}
      />

      {/* Search + Add */}
      <View style={s.bar}>
        <Search value={q} onChange={setQ} placeholder="Search incidents..." />
        <TouchableOpacity style={s.addBtn} onPress={openAdd} activeOpacity={0.8}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={s.addTxt}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={s.filterRow}>
        <DropFilter label="Status"   value={filStatus}   opts={['All', ...INC_STATUS]} onSelect={setFilStatus}   />
        <DropFilter label="Severity" value={filSeverity} opts={['All', ...SEVERITIES]} onSelect={setFilSeverity} color={C.orange} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={busy} onRefresh={onRefresh} tintColor={C.blue} />}>

        <Text style={s.count}>{list.length} incident{list.length !== 1 ? 's' : ''}</Text>

        <View style={s.tableWrap}>
          <View style={s.thead}>
            <Text style={[s.th, { flex: 2 }]}>TYPE / ZONE</Text>
            <Text style={[s.th, { flex: 1.5 }]}>LOCATION</Text>
            <Text style={[s.th, { width: 58 }]}>SEV</Text>
            <Text style={[s.th, { width: 68 }]}>STATUS</Text>
            <Text style={[s.th, { width: 60, textAlign: 'right' }]}>ACT</Text>
          </View>
          {list.map((i, idx) => (
            <View key={String(i.id)} style={[s.trow, idx % 2 === 1 && s.zebra]}>
              <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={[s.dot, { backgroundColor: TYPE_COLOR[i.type] || C.blue }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.tdBold} numberOfLines={1}>{i.type}</Text>
                  <Text style={s.tdSub}>{i.zone}</Text>
                </View>
              </View>
              <View style={{ flex: 1.5 }}>
                <Text style={s.td} numberOfLines={1}>{i.location || '—'}</Text>
                {i.description ? <Text style={s.tdSub} numberOfLines={1}>{i.description}</Text> : null}
              </View>
              <View style={{ width: 58 }}><Badge label={i.severity} variant={i.severity} /></View>
              <View style={{ width: 68 }}><Badge label={i.status}   variant={i.status}   /></View>
              <View style={{ width: 60, flexDirection: 'row', justifyContent: 'flex-end', gap: 5 }}>
                <EditBtn   onPress={() => openEdit(i)}   />
                <DeleteBtn onPress={() => setDelId(i.id)} />
              </View>
            </View>
          ))}
        </View>
        {list.length === 0 && <Empty iconName="warning-outline" title={q ? 'No results' : 'No incidents yet'} />}
      </ScrollView>

      <FormModal visible={show} title={edit ? 'Edit Incident' : 'Report Incident'} onClose={() => setShow(false)} onSave={save} saving={saving} saveLabel={edit ? 'Save' : 'Report'}>
        <FPick  label="Type"        value={form.type}        opts={TYPES}       onChange={v => set('type', v)}        req />
        <FPick  label="Zone"        value={form.zone}        opts={ZONES}       onChange={v => set('zone', v)}            />
        <FInput label="Location"    value={form.location}    onChange={v => set('location', v)}    placeholder="e.g. Purok 3" />
        <FPick  label="Severity"    value={form.severity}    opts={SEVERITIES}  onChange={v => set('severity', v)}        />
        {edit && <FPick label="Status" value={form.status}   opts={INC_STATUS}  onChange={v => set('status', v)}          />}
        <FInput label="Description" value={form.description} onChange={v => set('description', v)} multi />
        <FInput label="Reporter"    value={form.reporter}    onChange={v => set('reporter', v)}                           />
      </FormModal>

      <Confirm visible={!!delId} title="Delete Incident" msg="Remove this incident permanently?"
        onOk={async () => { const i = incidents.find(x => x.id === delId); await deleteIncident(delId, i?.type, user?.name); setDelId(null); }}
        onNo={() => setDelId(null)} />
      </View>
  );
}

const s = StyleSheet.create({
  bar:       { flexDirection: 'row', gap: 10, padding: 12, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  addBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.blue, borderRadius: 8, paddingHorizontal: 14, height: 42 },
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
  dot:       { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
});
