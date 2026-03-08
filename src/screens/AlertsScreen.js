import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Confirm, DeleteBtn, Empty } from '../components/Shared';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ALT_LEVELS, ZONES } from '../data/constants';
import { C } from '../styles/colors';

/* ─── constants ─────────────────────────────────────────────── */
const LCOLOR = { Danger: C.red, Warning: C.orange, Advisory: C.blue, Resolved: C.green };
const ALL_Z  = ['All Zones', ...ZONES];
const EF     = { level: 'Advisory', zone: 'All Zones', message: '' };

const QUICK = [
  { label: 'Flood Warning',   level: 'Danger',   zone: 'Zone 3',    icon: 'water',  color: '#06b6d4', msg: 'FLOOD WARNING: Water level critically high. Immediate evacuation required.'   },
  { label: 'Evacuation Order',level: 'Danger',   zone: 'All Zones', icon: 'exit',            msg: 'MANDATORY EVACUATION ORDER: All residents in high-risk zones must evacuate.'  },
  { label: 'Storm Advisory',  level: 'Advisory', zone: 'All Zones', icon: 'partly-sunny',    msg: 'STORM ADVISORY: Strong winds and heavy rain expected. Prepare emergency kits.' },
  { label: 'All Clear',       level: 'Resolved', zone: 'All Zones', icon: 'shield-checkmark',msg: 'ALL CLEAR: Emergency resolved. Residents may return to normal activities.'     },
];

/* ─── tiny level-picker ──────────────────────────────────────── */
function LevelPicker({ value, onChange, open, onToggle }) {
  return (
    <View style={{ flex: 1, zIndex: open ? 20 : 1 }}>
      <TouchableOpacity style={pk.btn} onPress={onToggle} activeOpacity={0.8}>
        <Text style={pk.val}>{value}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color={C.t3} />
      </TouchableOpacity>
      {open && (
        <View style={pk.drop}>
          {ALT_LEVELS.map(l => (
            <TouchableOpacity key={l} style={pk.opt} onPress={() => { onChange(l); onToggle(); Keyboard.dismiss(); }}>
              <Text style={[pk.optTxt, value === l && { color: LCOLOR[l] || C.blue }]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

/* ─── tiny zone-picker ───────────────────────────────────────── */
function ZonePicker({ value, onChange, open, onToggle }) {
  return (
    <View style={{ flex: 1, zIndex: open ? 20 : 1 }}>
      <TouchableOpacity style={pk.btn} onPress={onToggle} activeOpacity={0.8}>
        <Text style={pk.val}>{value}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color={C.t3} />
      </TouchableOpacity>
      {open && (
        <View style={pk.drop}>
          {ALL_Z.map(z => (
            <TouchableOpacity key={z} style={pk.opt} onPress={() => { onChange(z); onToggle(); Keyboard.dismiss(); }}>
              <Text style={[pk.optTxt, value === z && { color: C.blue }]}>{z}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

/* ─── Send Alert Modal ───────────────────────────────────────── */
// `saving` is owned by the parent and passed as a prop.
// `handleSave` is synchronous — async lives in the parent only.
function SendAlertModal({ visible, onClose, onSave, saving, initialForm, residents = [] }) {
  const [form, setForm]         = useState({ ...EF });
  const [resQ, setResQ]         = useState('');
  const [selected, setSelected] = useState([]);
  const [openPicker, setOpenPicker] = useState(null);
  const [showResidents, setShowResidents] = useState(false);

  const msgInputRef  = useRef(null);
  const resSearchRef = useRef(null);

  // Reset form every time the modal becomes visible
  function onShow() {
    setForm(initialForm ? { ...initialForm } : { ...EF });
    setSelected([]);
    setResQ('');
    setOpenPicker(null);
    setShowResidents(false);
  }

  function blurAllInputs() {
    msgInputRef.current?.blur();
    resSearchRef.current?.blur();
    Keyboard.dismiss();
  }

  function togglePicker(name) {
    Keyboard.dismiss();
    msgInputRef.current?.blur();
    resSearchRef.current?.blur();
    setOpenPicker(prev => (prev === name ? null : name));
  }

  function set(k, v) { setForm(p => ({ ...p, [k]: v })); }

  const filteredRes = residents.filter(r =>
    !resQ || r.name?.toLowerCase().includes(resQ.toLowerCase())
  );

  function toggleRes(id) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  }
  function toggleAll() {
    setSelected(s => s.length === filteredRes.length ? [] : filteredRes.map(r => r.id));
  }

  // Synchronous — just validates and delegates to parent
  function handleSave() {
    if (!form.message.trim()) return;
    const selectedNames = residents
      .filter(r => selected.includes(r.id))
      .map(r => r.name);
    onSave(form, selected, selectedNames);
  }

  const STATUS_COLOR = { Safe: C.green, Evacuated: C.orange, Unaccounted: C.red };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onShow={onShow}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={m.overlay} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={m.kavWrap}
        pointerEvents="box-none"
      >
        <View style={m.sheet}>

          {/* header */}
          <View style={m.hdr}>
            <Ionicons name="megaphone" size={20} color={C.blue} />
            <Text style={m.hdrTxt}>Send Emergency Alert</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={C.t2} />
            </TouchableOpacity>
          </View>

          <ScrollView style={m.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* pickers row */}
            <View style={[m.row, { zIndex: 20 }]}>
              <LevelPicker
                value={form.level}
                onChange={v => set('level', v)}
                open={openPicker === 'level'}
                onToggle={() => togglePicker('level')}
              />
              <ZonePicker
                value={form.zone}
                onChange={v => set('zone', v)}
                open={openPicker === 'zone'}
                onToggle={() => togglePicker('zone')}
              />
            </View>

            {/* message */}
            <Text style={m.label}>ALERT MESSAGE *</Text>
            <TextInput
              ref={msgInputRef}
              style={m.msgInput}
              value={form.message}
              onChangeText={v => set('message', v)}
              placeholder="e.g. FLOOD WARNING: Water level critically high..."
              placeholderTextColor={C.t3}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* SMS recipients */}
            <View style={m.smsHdr}>
              <Ionicons name="phone-portrait-outline" size={14} color={C.t3} />
              <Text style={m.label2}>SMS RECIPIENTS</Text>
              <Text style={m.optional}>(optional)</Text>
            </View>

            <TouchableOpacity style={m.selBar} onPress={() => setShowResidents(p => !p)} activeOpacity={0.8}>
              <Text style={m.selTxt}>
                {selected.length > 0
                  ? `${selected.length} resident(s) selected`
                  : 'Select residents to receive SMS...'}
              </Text>
              <Ionicons name={showResidents ? 'chevron-up' : 'chevron-down'} size={14} color={C.t3} />
            </TouchableOpacity>

            {showResidents && (
              <>
            <View style={m.resSearch}>
              <Ionicons name="search" size={14} color={C.t3} />
              <TextInput
                ref={resSearchRef}
                style={m.resSearchInput}
                value={resQ}
                onChangeText={setResQ}
                placeholder="Search residents..."
                placeholderTextColor={C.t3}
              />
            </View>

            <TouchableOpacity style={m.selectAllRow} onPress={toggleAll} activeOpacity={0.7}>
              <View style={[m.checkbox, selected.length === filteredRes.length && filteredRes.length > 0 && m.checkboxOn]}>
                {selected.length === filteredRes.length && filteredRes.length > 0 && (
                  <Ionicons name="checkmark" size={11} color="#fff" />
                )}
              </View>
              <Text style={m.selectAllTxt}>Select All ({filteredRes.length} {filteredRes.length === 1 ? 'resident' : 'residents'})</Text>
            </TouchableOpacity>

            {filteredRes.map(r => {
              const checked = selected.includes(r.id);
              const statusVal = r.evacuationStatus || '';
              const statusColor = STATUS_COLOR[statusVal] || C.t3;
              return (
                <TouchableOpacity key={r.id} style={m.resRow} onPress={() => toggleRes(r.id)} activeOpacity={0.7}>
                  <View style={[m.checkbox, checked && m.checkboxOn]}>
                    {checked && <Ionicons name="checkmark" size={11} color="#fff" />}
                  </View>
                  <View style={m.avatar}>
                    <Text style={m.avatarTxt}>{(r.name || '?')[0].toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={m.resName}>{r.name}</Text>
                    <Text style={m.resSub}>{r.zone} · {r.contact || 'no contact'}</Text>
                  </View>
                  {statusVal ? (
                    <View style={[m.statusBadge, { borderColor: statusColor }]}>
                      <Text style={[m.statusTxt, { color: statusColor }]}>{statusVal.toUpperCase()}</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}

            <Text style={m.hint}>Select residents to receive SMS. Leave empty to skip SMS.</Text>
              </>
            )}
            <View style={{ height: 16 }} />
          </ScrollView>

          {/* footer */}
          <View style={m.footer}>
            <TouchableOpacity style={m.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={m.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[m.sendBtn, saving && { opacity: 0.5 }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={16} color="#fff" />
              <Text style={m.sendTxt}>
                {saving ? 'Sending…' : selected.length > 0 ? `Send Alert + SMS (${selected.length})` : 'Send Alert'}
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ─── history item ───────────────────────────────────────────── */
function HistoryItem({ a, onDelete }) {
  const color = LCOLOR[a.level] || C.blue;
  const date  = a.created_at
    ? new Date(a.created_at).toLocaleString()
    : '';
  const hasRecipients = a.recipients?.length > 0;
  return (
    <View style={[hi.row, { borderLeftColor: color }]}>
      <View style={hi.top}>
        <View style={[hi.badge, { borderColor: color }]}>
          <Text style={[hi.badgeTxt, { color }]}>{a.level?.toUpperCase()}</Text>
        </View>
        <Text style={hi.title} numberOfLines={1}>{a.title || (a.level + ' — ' + a.zone)}</Text>
        <Text style={hi.zone}>{a.zone}</Text>
        <DeleteBtn onPress={onDelete} />
      </View>
      <Text style={hi.msg} numberOfLines={2}>{a.message}</Text>
      <View style={hi.meta}>
        {a.sent_by && <><Ionicons name="person-outline" size={11} color={C.t3} /><Text style={hi.metaTxt}>{a.sent_by}</Text></>}
        {(a.recipients_count > 0) && <><Ionicons name="people-outline" size={11} color={C.t3} /><Text style={hi.metaTxt}>{a.recipients_count} {a.recipients_count === 1 ? 'recipient' : 'recipients'}</Text></>}
        {date && <><Ionicons name="time-outline" size={11} color={C.t3} /><Text style={hi.metaTxt}>{date}</Text></>}
      </View>
    </View>
  );
}

/* ─── stat card ──────────────────────────────────────────────── */
function StatCard({ value, label, color, icon }) {
  return (
    <View style={[sc.card, { borderColor: color + '33' }]}>
      <View style={[sc.iconWrap, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[sc.val, { color }]}>{value}</Text>
      <Text style={sc.lbl}>{label}</Text>
    </View>
  );
}

/* ─── main screen ────────────────────────────────────────────── */
export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const { alerts, addAlert, deleteAlert, reload, residents } = useApp();
  const { user }   = useAuth();
  const [q, setQ]  = useState('');
  const [show, setShow]     = useState(false);
  const [initForm, setInit] = useState(null);
  const [delId, setDelId]   = useState(null);
  const [saving, setSaving] = useState(false); // owned here, passed as prop to modal
  const [busy, setBusy]     = useState(false);

  const list = alerts.filter(a =>
    !q || (a.message + a.zone + a.level).toLowerCase().includes(q.toLowerCase())
  );

  const counts = {
    total:    alerts.length,
    danger:   alerts.filter(a => a.level === 'Danger').length,
    warning:  alerts.filter(a => a.level === 'Warning').length,
    advisory: alerts.filter(a => a.level === 'Advisory').length,
    resolved: alerts.filter(a => a.level === 'Resolved').length,
  };

  function openSend(preset) {
    setInit(preset || { ...EF });
    setShow(true);
  }

  // Async owned here — passes exactly the fields addAlert in useDB expects:
  // { level, zone, message } + userName string
  async function handleSave(form, selectedResidents, selectedNames) {
    setSaving(true);
    try {
      await addAlert(
        {
          level: form.level,
          zone: form.zone,
          message: form.message,
          smsCount: selectedResidents.length,
          recipients_count: selectedResidents.length,
          recipients: selectedNames,
        },
        user?.name || 'System'
      );
      setShow(false);
    } catch (e) {
      console.warn('addAlert error:', e);
    } finally {
      setSaving(false);
    }
  }

  async function onRefresh() { setBusy(true); await reload(); setBusy(false); }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>

      {/* ── top bar ── */}
      <View style={[s.topBar, { paddingTop: insets.top + 10 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 }}>
          <Ionicons name="shield-checkmark" size={20} color={C.blue} />
          <Text style={[s.pageTitle, { flex: 1 }]}>Alert System</Text>
        </View>
        <TouchableOpacity style={s.sendBtn} onPress={() => openSend(null)} activeOpacity={0.85}>
          <Ionicons name="megaphone" size={13} color="#fff" />
          <Text style={s.sendBtnTxt}>Send Alert</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={<RefreshControl refreshing={busy} onRefresh={onRefresh} tintColor={C.blue} />}
      >
        {/* ── stats ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.statsRow}>
          <StatCard value={counts.total}    label="TOTAL SENT" color={C.blue}   icon="megaphone"           />
          <StatCard value={counts.danger}   label="DANGER"     color={C.red}    icon="warning"             />
          <StatCard value={counts.warning}  label="WARNING"    color={C.orange} icon="alert-circle"        />
          <StatCard value={counts.advisory} label="ADVISORY"   color={C.blue}   icon="information-circle"  />
          <StatCard value={counts.resolved} label="RESOLVED"   color={C.green}  icon="checkmark-circle"    />
        </ScrollView>

        {/* ── quick broadcast ── */}
        <View style={s.section}>
          <View style={s.secHdr}>
            <Ionicons name="flash" size={15} color={C.orange} />
            <Text style={s.secTitle}>QUICK EMERGENCY BROADCAST</Text>
          </View>
          <View style={s.quickGrid}>
            {QUICK.map(qt => {
              const col = qt.color || LCOLOR[qt.level] || C.blue;
              return (
                <TouchableOpacity
                  key={qt.label}
                  style={[s.quickCard, { borderColor: col + '55' }]}
                  onPress={() => openSend({ level: qt.level, zone: qt.zone, message: qt.msg })}
                  activeOpacity={0.75}
                >
                  <Ionicons name={qt.icon} size={28} color={col} />
                  <Text style={[s.quickLabel, { color: col }]}>{qt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── search ── */}
        <View style={s.searchWrap}>
          <Ionicons name="search" size={16} color={C.t3} style={{ marginRight: 8 }} />
          <TextInput
            style={s.searchInput}
            value={q}
            onChangeText={setQ}
            placeholder="Search alerts..."
            placeholderTextColor={C.t3}
          />
        </View>

        {/* ── alert history ── */}
        <View style={s.section}>
          <View style={s.secHdr}>
            <Ionicons name="notifications" size={15} color={C.blue} />
            <Text style={s.secTitle}>ALERT HISTORY</Text>
            <View style={s.countBadge}><Text style={s.countTxt}>{alerts.length}</Text></View>
          </View>
          {list.map(a => (
            <HistoryItem key={String(a.id)} a={a} onDelete={() => setDelId(a.id)} />
          ))}
          {list.length === 0 && <Empty iconName="megaphone-outline" title="No alerts yet" />}
        </View>
      </ScrollView>

      {/* ── modal ── */}
      <SendAlertModal
        visible={show}
        onClose={() => setShow(false)}
        onSave={handleSave}
        saving={saving}
        initialForm={initForm}
        residents={residents || []}
      />

      <Confirm
        visible={!!delId}
        title="Delete Alert"
        msg="Remove from alert history?"
        onOk={async () => { await deleteAlert(delId, user?.name); setDelId(null); }}
        onNo={() => setDelId(null)}
      />
    </View>
  );
}

/* ─── styles ─────────────────────────────────────────────────── */
const s = StyleSheet.create({
  topBar:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  pageTitle:   { fontSize: 16, fontWeight: '800', color: C.t1 },
  pageSub:     { fontSize: 11, color: C.t3, marginTop: 3, lineHeight: 16 },
  sendBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.blue, borderRadius: 22, paddingHorizontal: 10, paddingVertical: 7 },

  sendBtnTxt:  { color: '#fff', fontWeight: '700', fontSize: 12 },
  statsRow:    { flexDirection: 'row', gap: 10, paddingHorizontal: 12, paddingVertical: 14 },
  section:     { marginHorizontal: 12, marginBottom: 12, backgroundColor: C.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border },
  secHdr:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },

  secTitle:    { fontSize: 11, fontWeight: '700', color: C.t3, letterSpacing: 0.5 },
  countBadge:  { backgroundColor: C.el, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 4 },
  countTxt:    { fontSize: 11, fontWeight: '700', color: C.t2 },
  quickGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard:   { width: '47%', backgroundColor: C.el, borderRadius: 10, borderWidth: 1, alignItems: 'center', paddingVertical: 20, gap: 8 },

  quickLabel:  { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  searchWrap:  { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12, marginBottom: 12, backgroundColor: C.card, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, height: 42 },
  searchInput: { flex: 1, color: C.t1, fontSize: 13 },
});

const sc = StyleSheet.create({
  card:     { width: 80, backgroundColor: C.card, borderRadius: 12, borderWidth: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 4 },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  val:      { fontSize: 22, fontWeight: '900' },
  lbl:      { fontSize: 7, fontWeight: '700', color: C.t3, letterSpacing: 0.6, marginTop: 4, textAlign: 'center' },
});

const hi = StyleSheet.create({
  row:      { borderLeftWidth: 3, paddingLeft: 10, paddingVertical: 10, paddingRight: 6, borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 2 },
  top:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  badge:    { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  badgeTxt: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  title:    { flex: 1, fontSize: 12, fontWeight: '700', color: C.t1 },
  zone:     { fontSize: 11, color: C.t3 },
  msg:      { fontSize: 12, color: C.t2, lineHeight: 17, marginBottom: 6 },
  meta:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  metaTxt:  { fontSize: 10, color: C.t3, marginLeft: 3 },
});

const pk = StyleSheet.create({
  btn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1e2530', borderRadius: 8, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 10 },
  val:    { fontSize: 13, color: C.t1, fontWeight: '600' },
  drop:   { position: 'absolute', top: 44, left: 0, right: 0, backgroundColor: '#1e2530', borderRadius: 8, borderWidth: 1, borderColor: C.border, zIndex: 99, elevation: 10 },
  opt:    { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  optTxt: { fontSize: 13, color: C.t1 },
});

const m = StyleSheet.create({
  overlay:       { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  kavWrap:       { flex: 1, justifyContent: 'flex-end' },
  sheet:         { backgroundColor: C.card, borderTopLeftRadius: 18, borderTopRightRadius: 18, maxHeight: '90%' },
  hdr:           { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border },

  hdrTxt:        { flex: 1, fontSize: 16, fontWeight: '800', color: C.t1 },
  body:          { paddingHorizontal: 18, paddingTop: 16 },
  row:           { flexDirection: 'row', gap: 10, marginBottom: 14, zIndex: 10 },
  label:         { fontSize: 10, fontWeight: '700', color: C.t3, letterSpacing: 0.4, marginBottom: 6 },
  msgInput:      { backgroundColor: '#1a2030', borderRadius: 8, borderWidth: 1, borderColor: C.border, padding: 12, color: C.t1, fontSize: 13, minHeight: 90, marginBottom: 14 },
  smsHdr:        { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  label2:        { fontSize: 10, fontWeight: '700', color: C.t3, letterSpacing: 0.4 },
  optional:      { fontSize: 10, color: C.t3 },
  selBar:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1a2030', borderRadius: 8, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8 },
  selTxt:        { fontSize: 12, color: C.t3 },
  resSearch:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a2030', borderRadius: 8, borderWidth: 1, borderColor: C.border, paddingHorizontal: 10, height: 38, gap: 8, marginBottom: 6 },
  resSearchInput:{ flex: 1, color: C.t1, fontSize: 13 },
  selectAllRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  selectAllTxt:  { fontSize: 13, color: C.t1 },
  checkbox:      { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: C.t3, alignItems: 'center', justifyContent: 'center' },
  checkboxOn:    { backgroundColor: C.blue, borderColor: C.blue },
  resRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  avatar:        { width: 34, height: 34, borderRadius: 17, backgroundColor: C.blue + '44', alignItems: 'center', justifyContent: 'center' },
  avatarTxt:     { fontSize: 14, fontWeight: '700', color: C.blue },
  resName:       { fontSize: 13, fontWeight: '700', color: C.t1 },
  resSub:        { fontSize: 11, color: C.t3, marginTop: 1 },
  statusBadge:   { borderWidth: 1, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3 },
  statusTxt:     { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  hint:          { fontSize: 10, color: C.t3, textAlign: 'center', paddingVertical: 10 },
  footer:        { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: C.border },
  cancelBtn:     { flex: 1, backgroundColor: C.el, borderRadius: 10, alignItems: 'center', paddingVertical: 13 },
  cancelTxt:     { fontSize: 14, fontWeight: '700', color: C.t2 },
  sendBtn:       { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.blue, borderRadius: 10, paddingVertical: 13 },

  sendTxt:       { fontSize: 14, fontWeight: '700', color: '#fff' },
});