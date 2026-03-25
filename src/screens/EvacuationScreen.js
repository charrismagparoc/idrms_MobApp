import { Ionicons } from '@expo/vector-icons';
import { Alert, Linking, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge, Bar, Confirm, DeleteBtn, DropFilter, EditBtn, Empty, FInput, FormModal, FPick, FTags, Search } from '../components/Shared';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { EVAC_STAT, FACILITIES, ZONES } from '../data/constants';
import { C } from '../styles/colors';

const { width: SCREEN_W } = Dimensions.get('window');
const SHEET_W = SCREEN_W - 32;

const EF = { name: '', address: '', zone: 'Zone 1', status: 'Open', capacity: '100', occupancy: '0', contactPerson: '', contact: '', facilitiesAvailable: [] };

function DetailModal({ center, centers, onClose, onEdit, onNavigate }) {
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(0);
  if (!center) return null;

  const currentIdx = centers.findIndex(c => c.id === center.id);
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx < centers.length - 1;

  const pct = center.capacity > 0 ? Math.min(Math.round(center.occupancy / center.capacity * 100), 100) : 0;
  const barColor = pct >= 90 ? C.red : pct >= 70 ? C.orange : C.green;
  const hasFacilities = (center.facilitiesAvailable || []).length > 0;
  const pages = hasFacilities ? 3 : 2;

  function call() {
    if (center.contact) Linking.openURL(`tel:${center.contact}`);
  }

  function onScroll(e) {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SHEET_W);
    setPage(idx);
  }

  return (
    <Modal visible={!!center} animationType="slide" transparent onRequestClose={onClose}>
      <View style={d.overlay}>
        <View style={[d.sheet, { paddingBottom: insets.bottom + 16 }]}>

          <View style={d.handle} />

          <View style={d.header}>
            <TouchableOpacity onPress={() => { setPage(0); onNavigate(centers[currentIdx - 1]); }}
              disabled={!hasPrev} style={{ padding: 4, opacity: hasPrev ? 1 : 0.2 }}>
              <Ionicons name="chevron-back" size={20} color={C.t1} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginHorizontal: 6 }}>
              <Text style={d.name} numberOfLines={1}>{center.name}</Text>
              <Text style={d.zone}>{center.zone}  ·  {currentIdx + 1} of {centers.length}</Text>
            </View>
            <Badge label={center.status} variant={center.status} />
            <TouchableOpacity onPress={() => { setPage(0); onNavigate(centers[currentIdx + 1]); }}
              disabled={!hasNext} style={{ padding: 4, opacity: hasNext ? 1 : 0.2, marginLeft: 6 }}>
              <Ionicons name="chevron-forward" size={20} color={C.t1} />
            </TouchableOpacity>
          </View>

          <View style={d.dotsRow}>
            {Array.from({ length: pages }).map((_, i) => (
              <View key={i} style={[d.dot, page === i && d.dotActive]} />
            ))}
          </View>

          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScroll}
            style={{ width: SHEET_W }}
          >
            <View style={[d.page, { width: SHEET_W }]}>
              <View style={d.card}>
                <Text style={d.cardTitle}>OCCUPANCY</Text>
                <View style={d.capRow}>
                  <Text style={[d.capNum, { color: barColor }]}>{center.occupancy}</Text>
                  <Text style={d.capSep}>/</Text>
                  <Text style={d.capMax}>{center.capacity}</Text>
                  <View style={[d.pctPill, { backgroundColor: barColor + '22' }]}>
                    <Text style={[d.pctTxt, { color: barColor }]}>{pct}%</Text>
                  </View>
                </View>
                <Bar value={center.occupancy} max={center.capacity} height={10} color={barColor} />
                <Text style={d.remaining}>{center.capacity - center.occupancy} slots remaining</Text>
              </View>
            </View>

            <View style={[d.page, { width: SHEET_W }]}>
              <View style={d.card}>
                <Text style={d.cardTitle}>DETAILS</Text>
                {center.address ? (
                  <View style={d.infoRow}>
                    <Ionicons name="location-outline" size={15} color={C.blue} />
                    <Text style={d.infoTxt}>{center.address}</Text>
                  </View>
                ) : null}
                <View style={d.infoRow}>
                  <Ionicons name="map-outline" size={15} color={C.blue} />
                  <Text style={d.infoTxt}>{center.zone}</Text>
                </View>
                {center.contactPerson ? (
                  <View style={d.infoRow}>
                    <Ionicons name="person-outline" size={15} color={C.blue} />
                    <Text style={d.infoTxt}>{center.contactPerson}</Text>
                  </View>
                ) : null}
                {center.contact ? (
                  <View style={d.infoRow}>
                    <Ionicons name="call-outline" size={15} color={C.blue} />
                    <Text style={[d.infoTxt, { flex: 1 }]}>{center.contact}</Text>
                    <TouchableOpacity style={d.callBtn} onPress={call} activeOpacity={0.8}>
                      <Ionicons name="call" size={13} color="#fff" />
                      <Text style={d.callTxt}>Call</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            </View>

            {hasFacilities && (
              <View style={[d.page, { width: SHEET_W }]}>
                <View style={d.card}>
                  <Text style={d.cardTitle}>FACILITIES</Text>
                  <View style={d.tagsWrap}>
                    {center.facilitiesAvailable.map(f => (
                      <View key={f} style={d.tag}>
                        <Ionicons name="checkmark-circle" size={12} color={C.green} />
                        <Text style={d.tagTxt}>{f}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          <Text style={d.hint}>← swipe to see more →</Text>

          <View style={d.actions}>
            <TouchableOpacity style={d.editBtn} onPress={onEdit} activeOpacity={0.8}>
              <Ionicons name="create-outline" size={16} color="#fff" />
              <Text style={d.editTxt}>Edit Center</Text>
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

export default function EvacuationScreen() {
  const insets = useSafeAreaInsets();
  const { evacCenters, addEvac, updateEvac, deleteEvac, reload } = useApp();
  const { user } = useAuth();
  const [q, setQ]           = useState('');
  const [fil, setFil]       = useState('All');
  const [form, setForm]     = useState({ ...EF });
  const [edit, setEdit]     = useState(null);
  const [show, setShow]     = useState(false);
  const [delId, setDelId]   = useState(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy]     = useState(false);
  const [detail, setDetail] = useState(null);

  const list = evacCenters.filter(c =>
    (!q || (c.name + c.address + c.zone).toLowerCase().includes(q.toLowerCase())) &&
    (fil === 'All' || c.status === fil)
  );

  function openAdd() { setForm({ ...EF }); setEdit(null); setShow(true); }

  function openEdit(c) {
    setForm({
      name:                c.name                || '',
      address:             c.address             || '',
      zone:                c.zone                || 'Zone 1',
      status:              c.status              || 'Open',
      capacity:            String(c.capacity     || 100),
      occupancy:           String(c.occupancy    || 0),
      contactPerson:       c.contactPerson       || c.contact_person  || '',
      contact:             c.contact             || '',
      facilitiesAvailable: c.facilitiesAvailable || c.facilities_available || [],
    });
    setEdit(c);
    setShow(true);
  }

  function set(k, v) { setForm(p => ({ ...p, [k]: v })); }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name:                form.name.trim(),
        address:             form.address             || '',
        zone:                form.zone,
        status:              form.status,
        capacity:            parseInt(form.capacity)  || 100,
        occupancy:           parseInt(form.occupancy) || 0,
        contactPerson:       form.contactPerson       || '',
        contact:             form.contact             || '',
        facilitiesAvailable: form.facilitiesAvailable || [],
      };

      if (edit) {
        await updateEvac(edit.id, payload, user?.name);
      } else {
        await addEvac(payload, user?.name);
      }

      setShow(false);
      setEdit(null);
      setForm({ ...EF });
      await reload();
    } catch (e) {
      Alert.alert('Save Failed', e?.message || 'Something went wrong. Please try again.');
      console.warn('Save evac error:', e);
    }
    setSaving(false);
  }

  async function onRefresh() { setBusy(true); await reload(); setBusy(false); }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>

      <View style={[s.topBar, { paddingTop: insets.top + 14 }]}>
        <View style={s.logoRow}>
          <Ionicons name="shield-checkmark" size={20} color={C.blue} />
          <Text style={s.title}>Evacuation</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={openAdd} activeOpacity={0.8}>
          <Ionicons name="location" size={15} color="#fff" />
          <Text style={s.addTxt}>Add Center</Text>
        </TouchableOpacity>
      </View>

      <View style={s.bar}>
        <Search value={q} onChange={setQ} placeholder="Search centers..." />
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
              <TouchableOpacity key={String(c.id)} style={[s.trow, idx % 2 === 1 && s.zebra]}
                onPress={() => setDetail(c)} activeOpacity={0.7}>
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
              </TouchableOpacity>
            );
          })}
        </View>
        {list.length === 0 && <Empty iconName="location-outline" title="No centers yet" />}
      </ScrollView>

      <DetailModal
        center={detail}
        centers={list}
        onClose={() => setDetail(null)}
        onEdit={() => {
          const c = detail;
          setDetail(null);
          setTimeout(() => openEdit(c), 100);
        }}
        onNavigate={(c) => setDetail(c)}
      />

      <FormModal visible={show} title={edit ? 'Edit Center' : 'Add Center'} onClose={() => setShow(false)} onSave={save} saving={saving}>
        <FInput label="Center Name *"  value={form.name}               onChange={v => set('name', v)}            req />
        <FInput label="Address"        value={form.address || ''}       onChange={v => set('address', v)}             />
        <FPick  label="Zone"           value={form.zone}                opts={ZONES}     onChange={v => set('zone', v)} />
        <FPick  label="Status"         value={form.status}              opts={EVAC_STAT} onChange={v => set('status', v)} />
        <FInput label="Capacity"       value={form.capacity}            onChange={v => set('capacity', v)}  type="numeric" />
        <FInput label="Occupancy"      value={form.occupancy}           onChange={v => set('occupancy', v)} type="numeric" />
        <FInput label="Contact Person" value={form.contactPerson || ''}  onChange={v => set('contactPerson', v)} />
        <FInput label="Contact No."    value={form.contact || ''}        onChange={v => set('contact', v)} type="phone-pad" />
        <FTags  label="Facilities"     values={form.facilitiesAvailable || []} opts={FACILITIES} onChange={v => set('facilitiesAvailable', v)} />
      </FormModal>

      <Confirm visible={!!delId} title="Delete Center" msg="Remove this evacuation center?"
        onOk={async () => { const c = evacCenters.find(x => x.id === delId); await deleteEvac(delId, c?.name, user?.name); setDelId(null); }}
        onNo={() => setDelId(null)} />
    </View>
  );
}

const s = StyleSheet.create({
  topBar:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 16, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  logoRow:   { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title:     { fontSize: 17, fontWeight: '800', color: C.t1 },
  addBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.blue, borderRadius: 50, paddingHorizontal: 18, paddingVertical: 10 },
  addTxt:    { color: '#fff', fontWeight: '800', fontSize: 13 },
  bar:       { flexDirection: 'row', gap: 10, padding: 12, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
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

const d = StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:     { backgroundColor: C.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 16, paddingTop: 12, maxHeight: '85%', alignItems: 'center' },
  handle:    { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 16 },
  header:    { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 4, width: '100%' },
  name:      { fontSize: 16, fontWeight: '800', color: C.t1, flexShrink: 1 },
  zone:      { fontSize: 11, color: C.t3, marginTop: 3 },
  dotsRow:   { flexDirection: 'row', gap: 6, marginBottom: 12, alignSelf: 'center' },
  dot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },
  dotActive: { backgroundColor: C.blue, width: 18 },
  page:      { paddingBottom: 4 },
  card:      { backgroundColor: C.bg, borderRadius: 10, padding: 13, borderWidth: 1, borderColor: C.border },
  cardTitle: { fontSize: 9, fontWeight: '700', color: C.t3, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 },
  capRow:    { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 8 },
  capNum:    { fontSize: 28, fontWeight: '800' },
  capSep:    { fontSize: 18, color: C.t3, fontWeight: '300' },
  capMax:    { fontSize: 18, color: C.t2, fontWeight: '600' },
  pctPill:   { marginLeft: 8, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  pctTxt:    { fontSize: 12, fontWeight: '800' },
  remaining: { fontSize: 11, color: C.t3, marginTop: 6 },
  infoRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  infoTxt:   { fontSize: 13, color: C.t1, flex: 1 },
  callBtn:   { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.green, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, marginLeft: 8 },
  callTxt:   { color: '#fff', fontSize: 12, fontWeight: '700' },
  tagsWrap:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag:       { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.el, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  tagTxt:    { fontSize: 12, color: C.t1 },
  hint:      { fontSize: 10, color: C.t3, alignSelf: 'center', marginTop: 8, marginBottom: 4 },
  actions:   { flexDirection: 'row', gap: 10, marginTop: 8, width: '100%' },
  editBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: C.blue, borderRadius: 12, paddingVertical: 13 },
  editTxt:   { color: '#fff', fontWeight: '700', fontSize: 14 },
  closeBtn:  { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.el, borderRadius: 12, paddingVertical: 13 },
  closeTxt:  { color: C.t2, fontWeight: '700', fontSize: 14 },
});