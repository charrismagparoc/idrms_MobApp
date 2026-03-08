import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Badge, Bar, Confirm, DeleteBtn, DropFilter, EditBtn, Empty, FInput, FormModal, FPick, Search } from '../components/Shared';
import { ScreenHeader } from '../components/ScreenHeader';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { RES_CATS } from '../data/constants';
import { C } from '../styles/colors';

const EF = { name: '', category: 'Equipment', quantity: '1', available: '1', unit: 'pcs', location: '', status: 'Available', notes: '' };

export default function ResourcesScreen({ navigation }) {
  const { resources, addResource, updateResource, deleteResource, reload } = useApp();
  const { user, logout } = useAuth();
  const [q, setQ]       = useState('');
  const [fil, setFil]   = useState('All');
  const [form, setForm] = useState({ ...EF });
  const [edit, setEdit] = useState(null);
  const [show, setShow] = useState(false);
  const [delId, setDelId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  const list = resources.filter(r =>
    (!q || (r.name + r.category + (r.location||'')).toLowerCase().includes(q.toLowerCase())) &&
    (fil === 'All' || r.category === fil)
  );

  function openAdd()   { setForm({ ...EF }); setEdit(null); setShow(true); }
  function openEdit(r) { setForm({ name: r.name||'', category: r.category||'Equipment', quantity: String(r.quantity||1), available: String(r.available||1), unit: r.unit||'pcs', location: r.location||'', status: r.status||'Available', notes: r.notes||'' }); setEdit(r); setShow(true); }
  function set(k, v)   { setForm(p => ({ ...p, [k]: v })); }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const d = { ...form, quantity: parseInt(form.quantity)||1, available: parseInt(form.available)||0 };
      if (edit) await updateResource(edit.id, { ...edit, ...d }, user?.name);
      else      await addResource(d, user?.name);
      setShow(false);
    } catch (e) { console.warn(e); }
    setSaving(false);
  }

  async function onRefresh() { setBusy(true); await reload(); setBusy(false); }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScreenHeader
        title="Resources"
        currentRoute="Resources"
        onNavigate={n => navigation.navigate(n)}
        onLogout={logout}
      />

      <View style={s.bar}>
        <Search value={q} onChange={setQ} placeholder="Search resources..." />
        <TouchableOpacity style={[s.addBtn, { backgroundColor: C.orange }]} onPress={openAdd} activeOpacity={0.8}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={s.addTxt}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={s.filterRow}>
        <DropFilter label="Category" value={fil} opts={['All', ...RES_CATS]} onSelect={setFil} color={C.orange} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={busy} onRefresh={onRefresh} tintColor={C.blue} />}>

        <Text style={s.count}>{list.length} item{list.length !== 1 ? 's' : ''}</Text>

        <View style={s.tableWrap}>
          <View style={s.thead}>
            <Text style={[s.th, { flex: 2 }]}>NAME / CATEGORY</Text>
            <Text style={[s.th, { flex: 1.5 }]}>AVAILABILITY</Text>
            <Text style={[s.th, { width: 74 }]}>STATUS</Text>
            <Text style={[s.th, { width: 60, textAlign: 'right' }]}>ACT</Text>
          </View>
          {list.map((r, idx) => {
            const pct = r.quantity > 0 ? Math.round(r.available / r.quantity * 100) : 0;
            return (
              <View key={String(r.id)} style={[s.trow, idx % 2 === 1 && s.zebra]}>
                <View style={{ flex: 2 }}>
                  <Text style={s.tdBold} numberOfLines={1}>{r.name}</Text>
                  <Text style={s.tdSub} numberOfLines={1}>{r.category}{r.location ? '  ·  ' + r.location : ''}</Text>
                </View>
                <View style={{ flex: 1.5 }}>
                  <Text style={s.tdSub}>{r.available}/{r.quantity} {r.unit||'pcs'} ({pct}%)</Text>
                  <Bar value={r.available} max={r.quantity} height={5} />
                </View>
                <View style={{ width: 74 }}>
                  <Badge label={r.status||'Available'} variant={r.status==='Available'?'success':'warning'} />
                </View>
                <View style={{ width: 60, flexDirection: 'row', justifyContent: 'flex-end', gap: 5 }}>
                  <EditBtn   onPress={() => openEdit(r)}    />
                  <DeleteBtn onPress={() => setDelId(r.id)} />
                </View>
              </View>
            );
          })}
        </View>
        {list.length === 0 && <Empty iconName="cube-outline" title="No resources yet" />}
      </ScrollView>

      <FormModal visible={show} title={edit ? 'Edit Resource' : 'Add Resource'} onClose={() => setShow(false)} onSave={save} saving={saving}>
        <FInput label="Resource Name *" value={form.name}         onChange={v => set('name', v)}     req />
        <FPick  label="Category"        value={form.category}     opts={RES_CATS} onChange={v => set('category', v)} />
        <FInput label="Total Quantity"  value={form.quantity}     onChange={v => set('quantity', v)}  type="numeric" />
        <FInput label="Available"       value={form.available}    onChange={v => set('available', v)} type="numeric" />
        <FInput label="Unit"            value={form.unit}         onChange={v => set('unit', v)}     placeholder="pcs, boxes..." />
        <FInput label="Location"        value={form.location||''} onChange={v => set('location', v)} />
        <FPick  label="Status"          value={form.status}       opts={['Available','Low Stock','Depleted','Reserved']} onChange={v => set('status', v)} />
        <FInput label="Notes"           value={form.notes||''}    onChange={v => set('notes', v)}    multi />
      </FormModal>

      <Confirm visible={!!delId} title="Delete Resource" msg="Remove this resource?"
        onOk={async () => { const r = resources.find(x => x.id === delId); await deleteResource(delId, r?.name, user?.name); setDelId(null); }}
        onNo={() => setDelId(null)} />
      </View>
  );
}

const s = StyleSheet.create({
  bar:       { flexDirection: 'row', gap: 10, padding: 12, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  addBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 14, height: 42 },
  addTxt:    { color: '#fff', fontWeight: '700', fontSize: 13 },
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
