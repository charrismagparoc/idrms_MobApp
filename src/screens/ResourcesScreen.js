import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Dimensions, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge, Bar, Confirm, DeleteBtn, DropFilter, EditBtn, Empty, FInput, FormModal, FPick, Search } from '../components/Shared';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { RES_CATS } from '../data/constants';
import { C } from '../styles/colors';

const EF = { name: '', category: '', quantity: '', available: '', unit: '', location: '', status: '', notes: '' };

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

function DetailModal({ resource, onClose, onEdit, onRestock }) {
  const insets = useSafeAreaInsets();
  if (!resource) return null;

  const pct      = resource.quantity > 0 ? Math.min(Math.round(resource.available / resource.quantity * 100), 100) : 0;
  const stock    = getStock(resource.available, resource.quantity, resource.status);
  const barColor = pct >= 50 ? '#4caf50' : pct >= 20 ? '#f4511e' : '#e53935';
  const isFull   = resource.available >= resource.quantity;

  return (
    <Modal visible={!!resource} animationType="slide" transparent onRequestClose={onClose}>
      <View style={d.overlay}>
        <View style={[d.sheet, { paddingBottom: insets.bottom + 16 }]}>

          <View style={d.handle} />

          <View style={d.header}>
            <View style={{ flex: 1 }}>
              <Text style={d.name} numberOfLines={1}>{resource.name}</Text>
              <Text style={d.sub}>{resource.category}{resource.location ? '  ·  ' + resource.location : ''}</Text>
            </View>
            <Badge label={resource.status || 'Available'} variant={resource.status === 'Available' ? 'success' : 'warning'} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>

            <View style={d.card}>
              <Text style={d.cardTitle}>AVAILABILITY</Text>
              <View style={d.capRow}>
                <Text style={[d.capNum, { color: barColor }]}>{resource.available}</Text>
                <Text style={d.capSep}>/</Text>
                <Text style={d.capMax}>{resource.quantity} {resource.unit || 'pcs'}</Text>
                <View style={[d.pctPill, { backgroundColor: barColor + '22' }]}>
                  <Text style={[d.pctTxt, { color: barColor }]}>{pct}%</Text>
                </View>
              </View>
              <Bar value={resource.available} max={resource.quantity} height={10} color={barColor} />
              <View style={d.stockRow}>
                <Text style={[d.stockLbl, { color: stock.color }]}>{stock.label}</Text>
                <Text style={d.remaining}>{resource.quantity - resource.available} units needed to restock</Text>
              </View>
            </View>

            <View style={d.card}>
              <Text style={d.cardTitle}>DETAILS</Text>
              <View style={d.infoRow}>
                <Ionicons name="cube-outline" size={15} color={C.blue} />
                <Text style={d.infoTxt}>{resource.category}</Text>
              </View>
              {resource.location ? (
                <View style={d.infoRow}>
                  <Ionicons name="location-outline" size={15} color={C.blue} />
                  <Text style={d.infoTxt}>{resource.location}</Text>
                </View>
              ) : null}
              <View style={d.infoRow}>
                <Ionicons name="layers-outline" size={15} color={C.blue} />
                <Text style={d.infoTxt}>Total Quantity: {resource.quantity} {resource.unit || 'pcs'}</Text>
              </View>
              <View style={d.infoRow}>
                <Ionicons name="checkmark-circle-outline" size={15} color={C.blue} />
                <Text style={d.infoTxt}>Available: {resource.available} {resource.unit || 'pcs'}</Text>
              </View>
              {resource.updatedBy ? (
                <View style={d.infoRow}>
                  <Ionicons name="person-outline" size={15} color={C.blue} />
                  <Text style={d.infoTxt}>Last updated by: {resource.updatedBy}</Text>
                </View>
              ) : null}
              {resource.updatedAt ? (
                <View style={d.infoRow}>
                  <Ionicons name="time-outline" size={15} color={C.blue} />
                  <Text style={d.infoTxt}>{new Date(resource.updatedAt).toLocaleString()}</Text>
                </View>
              ) : null}
            </View>

            {resource.notes ? (
              <View style={d.card}>
                <Text style={d.cardTitle}>NOTES</Text>
                <Text style={d.notesTxt}>{resource.notes}</Text>
              </View>
            ) : null}

          </ScrollView>

          <View style={d.actions}>
            <TouchableOpacity
              style={[d.restockBtn, isFull && { opacity: 0.4 }]}
              onPress={() => !isFull && onRestock()}
              activeOpacity={0.8}>
              <Ionicons name="refresh-circle" size={16} color="#fff" />
              <Text style={d.restockTxt}>{isFull ? 'Fully Stocked' : 'Restock'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={d.editBtn} onPress={onEdit} activeOpacity={0.8}>
              <Ionicons name="create-outline" size={16} color="#fff" />
              <Text style={d.editTxt}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={d.closeBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={d.closeTxt}>Close</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

export default function ResourcesScreen() {
  const insets = useSafeAreaInsets();
  const { resources, addResource, updateResource, deleteResource, reload } = useApp();
  const { user } = useAuth();
  const [q, setQ]               = useState('');
  const [fil, setFil]           = useState('All');
  const [sortLow, setSortLow]   = useState(false);
  const [form, setForm]         = useState({ ...EF });
  const [edit, setEdit]         = useState(null);
  const [show, setShow]         = useState(false);
  const [delId, setDelId]       = useState(null);
  const [saving, setSaving]     = useState(false);
  const [busy, setBusy]         = useState(false);
  const [selected, setSelected]           = useState([]);
  const [selectMode, setSelectMode]       = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [detail, setDetail]               = useState(null);

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
  function openEdit(r) { setForm({ name: r.name||'', category: r.category||'', quantity: String(r.quantity||''), available: String(r.available||''), unit: r.unit||'', location: r.location||'', status: r.status||'', notes: r.notes||'' }); setEdit(r); setShow(true); }
  function set(k, v)   { setForm(p => ({ ...p, [k]: v })); }

  function toggleSelectMode() { setSelectMode(p => !p); setSelected([]); }
  function toggleItem(id)     { setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]); }
  function toggleAll()        { setSelected(selected.length === list.length ? [] : list.map(r => r.id)); }

  async function deleteSelected() {
    for (const id of selected) {
      const r = resources.find(x => x.id === id);
      await deleteResource(id, r?.name, user?.name);
    }
    setSelected([]);
    setSelectMode(false);
    setConfirmDelete(false);
  }

  async function restock(r) {
    try {
      await updateResource(r.id, {
        ...r,
        available: r.quantity,
        status: 'Available',
        updatedBy: user?.name,
        updatedAt: new Date().toISOString(),
      }, user?.name);
      const updated = { ...r, available: r.quantity, status: 'Available', updatedBy: user?.name, updatedAt: new Date().toISOString() };
      setDetail(updated);
      await reload();
    } catch (e) { console.warn(e); }
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const d = {
        ...form,
        quantity: parseInt(form.quantity) || 0,
        available: parseInt(form.available) || 0,
        updatedBy: user?.name,
        updatedAt: new Date().toISOString(),
      };
      if (edit) {
        await updateResource(edit.id, { ...edit, ...d }, user?.name);
      } else {
        await addResource(d, user?.name);
      }
      setShow(false);
      setEdit(null);
      setForm({ ...EF });
      await reload();
    } catch (e) { console.warn(e); }
    setSaving(false);
  }

  async function onRefresh() { setBusy(true); await reload(); setBusy(false); }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>

      {/* HEADER */}
      <View style={[s.topBar, { paddingTop: insets.top + 14 }]}>
        <View style={s.logoRow}>
          <Ionicons name="shield-checkmark" size={20} color={C.blue} />
          <Text style={s.title}>Resources</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TouchableOpacity
            style={[s.selectBtn, selectMode && s.selectBtnActive]}
            onPress={toggleSelectMode} activeOpacity={0.8}>
            <Ionicons name={selectMode ? 'close' : 'checkbox-outline'} size={15}
              color={selectMode ? '#fff' : C.t2} />
            <Text style={[s.selectBtnTxt, selectMode && { color: '#fff' }]}>
              {selectMode ? 'Cancel' : 'Select'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.addBtn} onPress={openAdd} activeOpacity={0.8}>
            <Ionicons name="cube" size={15} color="#fff" />
            <Text style={s.addTxt}>Add Resource</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SELECT ACTION BAR */}
      {selectMode && (
        <View style={s.actionBar}>
          <TouchableOpacity onPress={toggleAll} style={s.selectAllRow}>
            <Ionicons
              name={selected.length === list.length ? 'checkbox' : 'square-outline'}
              size={18} color={C.blue} />
            <Text style={s.selectAllTxt}>
              {selected.length === list.length ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>
          <Text style={s.selectedCount}>{selected.length} selected</Text>
          <TouchableOpacity
            style={[s.trashBtn, selected.length === 0 && { opacity: 0.4 }]}
            onPress={() => selected.length > 0 && setConfirmDelete(true)}
            activeOpacity={0.8}>
            <Ionicons name="trash" size={16} color="#fff" />
            <Text style={s.trashTxt}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* SEARCH + SORT */}
      <View style={s.bar}>
        <Search value={q} onChange={setQ} placeholder="Search resources..." />
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
            {selectMode && <View style={{ width: 28 }} />}
            <Text style={[s.th, { flex: 2 }]}>NAME / CATEGORY</Text>
            <Text style={[s.th, { flex: 1.5 }]}>AVAILABILITY</Text>
            <Text style={[s.th, { width: 64 }]}>STATUS</Text>
            <Text style={[s.th, { width: 54 }]}>STATE</Text>
            {!selectMode && <Text style={[s.th, { width: 54, textAlign: 'right' }]}>ACT</Text>}
          </View>

          {list.map((r, idx) => {
            const pct        = r.quantity > 0 ? Math.round(r.available / r.quantity * 100) : 0;
            const stock      = getStock(r.available, r.quantity, r.status);
            const isSelected = selected.includes(r.id);
            return (
              <TouchableOpacity
                key={String(r.id)}
                style={[s.trow, idx % 2 === 1 && s.zebra, isSelected && s.rowSelected]}
                onPress={() => selectMode ? toggleItem(r.id) : setDetail(r)}
                activeOpacity={0.7}>
                {selectMode && (
                  <View style={{ width: 28, alignItems: 'center' }}>
                    <Ionicons
                      name={isSelected ? 'checkbox' : 'square-outline'}
                      size={18} color={isSelected ? C.red : C.t3} />
                  </View>
                )}
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
                {!selectMode && (
                  <View style={{ width: 54, flexDirection: 'row', justifyContent: 'flex-end', gap: 5 }}>
                    <EditBtn   onPress={() => openEdit(r)}    />
                    <DeleteBtn onPress={() => setDelId(r.id)} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        {list.length === 0 && <Empty iconName="cube-outline" title="No resources yet" />}
      </ScrollView>

      {/* Detail Modal */}
      <DetailModal
        resource={detail}
        onClose={() => setDetail(null)}
        onEdit={() => {
          const r = detail;
          setDetail(null);
          setTimeout(() => openEdit(r), 100);
        }}
        onRestock={() => restock(detail)}
      />

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

      {/* Single delete */}
      <Confirm visible={!!delId} title="Delete Resource" msg="Remove this resource?"
        onOk={async () => { const r = resources.find(x => x.id === delId); await deleteResource(delId, r?.name, user?.name); setDelId(null); }}
        onNo={() => setDelId(null)} />

      {/* Multi delete */}
      <Confirm
        visible={confirmDelete}
        title="Delete Selected"
        msg={`Remove ${selected.length} selected resource${selected.length > 1 ? 's' : ''}? This cannot be undone.`}
        onOk={deleteSelected}
        onNo={() => setConfirmDelete(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  topBar:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 16, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  logoRow:        { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title:          { fontSize: 17, fontWeight: '800', color: C.t1 },
  addBtn:         { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.blue, borderRadius: 50, paddingHorizontal: 18, paddingVertical: 10 },
  addTxt:         { color: '#fff', fontWeight: '800', fontSize: 13 },
  selectBtn:      { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 50, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg },
  selectBtnActive:{ backgroundColor: C.blue, borderColor: C.blue },
  selectBtnTxt:   { fontSize: 12, fontWeight: '700', color: C.t2 },
  actionBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.el, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  selectAllRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  selectAllTxt:   { fontSize: 12, fontWeight: '700', color: C.blue },
  selectedCount:  { fontSize: 12, color: C.t3, fontWeight: '600' },
  trashBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.red, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  trashTxt:       { color: '#fff', fontSize: 12, fontWeight: '700' },
  bar:            { flexDirection: 'row', gap: 10, padding: 12, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border, alignItems: 'center' },
  sortBtn:        { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg },
  sortBtnActive:  { backgroundColor: C.orange, borderColor: C.orange },
  sortTxt:        { fontSize: 10, color: C.t2, fontWeight: '700' },
  sortTxtActive:  { color: '#fff' },
  alertBanner:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#e53935', paddingHorizontal: 14, paddingVertical: 10 },
  alertTxt:       { color: '#fff', fontSize: 12, fontWeight: '700', flex: 1 },
  filterRow:      { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  count:          { fontSize: 11, color: C.t3, paddingHorizontal: 14, paddingVertical: 8 },
  tableWrap:      { marginHorizontal: 12, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  thead:          { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, backgroundColor: C.el },
  th:             { fontSize: 9, fontWeight: '700', color: C.t3, letterSpacing: 0.4 },
  trow:           { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10, borderTopWidth: 1, borderTopColor: C.border, gap: 6 },
  zebra:          { backgroundColor: 'rgba(255,255,255,0.02)' },
  rowSelected:    { backgroundColor: C.red + '18' },
  tdBold:         { fontSize: 12, fontWeight: '600', color: C.t1 },
  tdSub:          { fontSize: 10, color: C.t3, marginTop: 2 },
  stockTxt:       { fontSize: 10, fontWeight: '700' },
  logoutBtn:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(232,72,85,0.12)', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 7, borderWidth: 1, borderColor: C.red + '44' },
  logoutTxt:      { color: C.red, fontSize: 11, fontWeight: '700' },
});

const d = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:      { backgroundColor: C.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 16, paddingTop: 12, maxHeight: '85%' },
  handle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 16 },
  header:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 10 },
  name:       { fontSize: 16, fontWeight: '800', color: C.t1, flexShrink: 1 },
  sub:        { fontSize: 11, color: C.t3, marginTop: 3 },
  card:       { backgroundColor: C.bg, borderRadius: 10, padding: 13, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  cardTitle:  { fontSize: 9, fontWeight: '700', color: C.t3, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 },
  capRow:     { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 8 },
  capNum:     { fontSize: 28, fontWeight: '800' },
  capSep:     { fontSize: 18, color: C.t3, fontWeight: '300' },
  capMax:     { fontSize: 18, color: C.t2, fontWeight: '600' },
  pctPill:    { marginLeft: 8, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  pctTxt:     { fontSize: 12, fontWeight: '800' },
  stockRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  stockLbl:   { fontSize: 12, fontWeight: '700' },
  remaining:  { fontSize: 10, color: C.t3 },
  infoRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  infoTxt:    { fontSize: 13, color: C.t1, flex: 1 },
  notesTxt:   { fontSize: 13, color: C.t2, lineHeight: 20 },
  actions:    { flexDirection: 'row', gap: 8, marginTop: 8 },
  restockBtn: { flex: 1.2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.green, borderRadius: 12, paddingVertical: 13 },
  restockTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  editBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.blue, borderRadius: 12, paddingVertical: 13 },
  editTxt:    { color: '#fff', fontWeight: '700', fontSize: 13 },
  closeBtn:   { flex: 0.8, alignItems: 'center', justifyContent: 'center', backgroundColor: C.el, borderRadius: 12, paddingVertical: 13 },
  closeTxt:   { color: C.t2, fontWeight: '700', fontSize: 13 },
});