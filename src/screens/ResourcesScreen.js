import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge, Bar, Confirm, DeleteBtn, DropFilter, EditBtn, Empty, FInput, FormModal, FPick, Search } from '../components/Shared';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { RES_CATS } from '../data/constants';
import { C } from '../styles/colors';

const EF = { name: '', category: 'Equipment', quantity: '1', available: '1', unit: 'pcs', location: '', status: 'Available', notes: '' };

// Stock level helper
function getStock(available, quantity, status) {
  if (status === 'Depleted')   return { label: '🔴 Critical', color: '#e53935' };
  if (status === 'Low Stock')  return { label: '🟡 Fair',      color: '#f4511e' };
  if (quantity === 0)          return { label: '🔴 Critical', color: '#e53935' };
  const pct = available / quantity;
  if (pct === 0)  return { label: '🔴 Critical', color: '#e53935' };
  if (pct < 0.2)  return { label: '🔴 Critical', color: '#e53935' };
  if (pct < 0.5)  return { label: '🟡 Fair',      color: '#f4511e' };
  return              { label: '🟢 Good',  color: '#4caf50' };
}

export default function ResourcesScreen() {
  const insets = useSafeAreaInsets();
  const { resources, addResource, updateResource, deleteResource, reload } = useApp();
  const { user, logout } = useAuth();
  const [q, setQ]       = useState('');
  const [fil, setFil]   = useState('All');
  const [sortLow, setSortLow] = useState(false);
  const [form, setForm] = useState({ ...EF });
  const [edit, setEdit] = useState(null);
  const [show, setShow] = useState(false);
  const [delId, setDelId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  const totalItems    = resources.length;
  const totalAvail    = resources.filter(r => r.status === 'Available').length;
  const lowStockCount = resources.filter(r => r.status === 'Low Stock' || (r.quantity > 0 && (r.available / r.quantity) < 0.2)).length;

  const depletedResources = resources.filter(r => r.available === 0 || r.status === 'Depleted');

  const list = resources
    .filter(r =>
      (!q || (r.name + r.category + (r.location||'')).toLowerCase().includes(q.toLowerCase())) &&
      (fil === 'All' || r.category === fil)
    )
    .sort((a, b) => {
      if (!sortLow) return 0;
      const pctA = a.quantity > 0 ? a.available / a.quantity : 0;
      const pctB = b.quantity > 0 ? b.available / b.quantity : 0;
      return pctA - pctB;
    });

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

      {/* HEADER */}
      <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
        <View style={s.logoRow}>
          <Ionicons name="shield-checkmark" size={18} color={C.blue} />
          <Text style={s.title}>Resources</Text>
        </View>
        <TouchableOpacity style={s.logoutBtn} onPress={logout} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="log-out-outline" size={18} color={C.red} />
          <Text style={s.logoutTxt}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={s.bar}>
        <Search value={q} onChange={setQ} placeholder="Search resources..." />
        <TouchableOpacity style={[s.addBtn, { backgroundColor: C.orange }]} onPress={openAdd} activeOpacity={0.8}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={s.addTxt}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* SUMMARY */}
      <View style={s.summary}>
        <View style={s.sumBox}>
          <Text style={s.sumVal}>{totalItems}</Text>
          <Text style={s.sumLbl}>Total Items</Text>
        </View>
        <View style={s.sumDivider} />
        <View style={s.sumBox}>
          <Text style={[s.sumVal, { color: '#4caf50' }]}>{totalAvail}</Text>
          <Text style={s.sumLbl}>Available</Text>
        </View>
        <View style={s.sumDivider} />
        <View style={s.sumBox}>
          <Text style={[s.sumVal, { color: lowStockCount > 0 ? C.red : C.t3 }]}>{lowStockCount}</Text>
          <Text style={s.sumLbl}>Low Stock</Text>
        </View>
        <TouchableOpacity style={[s.sortBtn, sortLow && s.sortBtnActive]} onPress={() => setSortLow(p => !p)}>
          <Text style={[s.sortTxt, sortLow && s.sortTxtActive]}>⬆ Availability</Text>
        </TouchableOpacity>
      </View>

      {/* CRITICAL ALERT BANNER */}
      {depletedResources.length > 0 && (
        <View style={s.alertBanner}>
          <Ionicons name="warning" size={15} color="#fff" />
          <Text style={s.alertTxt}>
            {depletedResources.length} resource{depletedResources.length > 1 ? 's' : ''} {depletedResources.length > 1 ? 'are' : 'is'} fully depleted — immediate restocking needed!
          </Text>
        </View>
      )}

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
            <Text style={[s.th, { width: 64 }]}>STATUS</Text>
            <Text style={[s.th, { width: 54 }]}>STATE</Text>
            <Text style={[s.th, { width: 54, textAlign: 'right' }]}>ACT</Text>
          </View>
          {list.map((r, idx) => {
            const pct   = r.quantity > 0 ? Math.round(r.available / r.quantity * 100) : 0;
            const stock = getStock(r.available, r.quantity, r.status);
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
                <View style={{ width: 64 }}>
                  <Badge label={r.status||'Available'} variant={r.status==='Available'?'success':'warning'} />
                </View>
                <View style={{ width: 54 }}>
                  <Text style={[s.stockTxt, { color: stock.color }]}>{stock.label}</Text>
                </View>
                <View style={{ width: 54, flexDirection: 'row', justifyContent: 'flex-end', gap: 5 }}>
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
  topBar:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 10, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  logoRow:       { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title:         { fontSize: 15, fontWeight: '700', color: C.t1 },
  logoutBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(232,72,85,0.12)', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 7, borderWidth: 1, borderColor: C.red + '44' },
  logoutTxt:     { color: C.red, fontSize: 11, fontWeight: '700' },
  bar:           { flexDirection: 'row', gap: 10, padding: 12, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  addBtn:        { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 14, height: 42 },
  addTxt:        { color: '#fff', fontWeight: '700', fontSize: 13 },
  summary:       { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border, paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  sumBox:        { alignItems: 'center', flex: 1 },
  sumVal:        { fontSize: 18, fontWeight: '800', color: C.t1 },
  sumLbl:        { fontSize: 9, color: C.t3, marginTop: 2, fontWeight: '600', textTransform: 'uppercase' },
  sumDivider:    { width: 1, height: 30, backgroundColor: C.border },
  sortBtn:       { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg },
  sortBtnActive: { backgroundColor: C.orange, borderColor: C.orange },
  sortTxt:       { fontSize: 10, color: C.t2, fontWeight: '700' },
  sortTxtActive: { color: '#fff' },
  alertBanner:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#e53935', paddingHorizontal: 14, paddingVertical: 10 },
  alertTxt:      { color: '#fff', fontSize: 12, fontWeight: '700', flex: 1 },
  filterRow:     { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  count:         { fontSize: 11, color: C.t3, paddingHorizontal: 14, paddingVertical: 8 },
  tableWrap:     { marginHorizontal: 12, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  thead:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, backgroundColor: C.el },
  th:            { fontSize: 9, fontWeight: '700', color: C.t3, letterSpacing: 0.4 },
  trow:          { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10, borderTopWidth: 1, borderTopColor: C.border, gap: 6 },
  zebra:         { backgroundColor: 'rgba(255,255,255,0.02)' },
  tdBold:        { fontSize: 12, fontWeight: '600', color: C.t1 },
  tdSub:         { fontSize: 10, color: C.t3, marginTop: 2 },
  stockTxt:      { fontSize: 10, fontWeight: '700' },
});