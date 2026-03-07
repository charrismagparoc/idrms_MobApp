import { useState } from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, RefreshControl,
  ScrollView, StatusBar, StyleSheet, Text, TextInput,
  TouchableOpacity, TouchableWithoutFeedback, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sidebar } from '../components/Sidebar';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ALT_LEVELS, ZONES } from '../data/constants';

const ALL_Z = ['All Zones', ...ZONES];

const LEVEL_COLORS = {
  Danger:   { bg: '#2e0d0d', text: '#ef4444', border: '#dc2626' },
  Warning:  { bg: '#2e1a0d', text: '#f97316', border: '#ea580c' },
  Advisory: { bg: '#0d1f2e', text: '#38bdf8', border: '#0ea5e9' },
  Resolved: { bg: '#0d2e1f', text: '#22c55e', border: '#16a34a' },
};

const STATUS_COLORS = {
  Safe:        { bg: '#0d2e1f', text: '#22c55e', border: '#16a34a' },
  Evacuated:   { bg: '#0d1f2e', text: '#38bdf8', border: '#0ea5e9' },
  Unaccounted: { bg: '#2e1a0d', text: '#f97316', border: '#ea580c' },
};

const LEVEL_EMOJI = { Danger: '🚨', Warning: '⚡', Advisory: '📢', Resolved: '✅' };

const QUICK = [
  { label: 'Flood Warning',     level: 'Danger',   zone: 'Zone 3',    msg: 'FLOOD WARNING: Water level critically high. Immediate evacuation required.' },
  { label: 'Evacuation Order',  level: 'Danger',   zone: 'All Zones', msg: 'MANDATORY EVACUATION ORDER: All residents in high-risk zones must evacuate immediately.' },
  { label: 'Storm Advisory',    level: 'Advisory', zone: 'All Zones', msg: 'STORM ADVISORY: Strong winds and heavy rain expected. Prepare emergency kits.' },
  { label: 'All Clear',         level: 'Resolved', zone: 'All Zones', msg: 'ALL CLEAR: Emergency situation resolved. Residents may return to normal activities.' },
];

const EF = { level: 'Advisory', zone: 'All Zones', message: '' };

// Dropdown 
function Dropdown({ label, value, opts, onChange, isOpen, onToggle }) {
  return (
    <View style={dd.wrap}>
      <Text style={dd.label}>{label}</Text>
      <TouchableOpacity style={dd.trigger} onPress={onToggle} activeOpacity={0.8}>
        <Text style={dd.val}>{value}</Text>
        <Text style={dd.arrow}>{isOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {isOpen && (
        <View style={dd.dropdown}>
          {opts.map(o => (
            <TouchableOpacity
              key={o}
              style={[dd.option, o === value && dd.optionActive]}
              onPress={() => { onChange(o); onToggle(); }}
            >
              <Text style={[dd.optTxt, o === value && dd.optTxtActive]}>{o}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// SMS Recipients Picker 
function SMSPicker({ residents, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = residents.filter(r =>
    !search || r.name.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(r) {
    onChange(selected.includes(r.id) ? selected.filter(x => x !== r.id) : [...selected, r.id]);
  }
  function selectAll() { onChange(residents.map(r => r.id)); }
  function clearAll()  { onChange([]); }

  const selectedResidents = residents.filter(r => selected.includes(r.id));

  return (
    <View style={sp.wrap}>
      <Text style={sp.label}>📱 SMS RECIPIENTS <Text style={sp.opt}>(optional)</Text></Text>

      {/* Trigger box */}
      <TouchableOpacity style={sp.box} onPress={() => setOpen(o => !o)} activeOpacity={0.85}>
        <View style={sp.chips}>
          {selectedResidents.length === 0
            ? <Text style={sp.placeholder}>Select residents to receive SMS...</Text>
            : selectedResidents.map(r => (
                <View key={r.id} style={sp.chip}>
                  <Text style={sp.chipTxt}>{r.name}</Text>
                  <TouchableOpacity onPress={() => toggle(r)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <Text style={sp.chipX}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))
          }
        </View>
        <Text style={sp.arrow}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {/* Dropdown panel */}
      {open && (
        <View style={sp.panel}>
          <View style={sp.searchRow}>
            <Text style={sp.searchIcon}>🔍</Text>
            <TextInput
              style={sp.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search residents..."
              placeholderTextColor="#4a5568"
            />
          </View>

          {/* Select All row */}
          <TouchableOpacity
            style={sp.selAllRow}
            onPress={selected.length === residents.length && residents.length > 0 ? clearAll : selectAll}
          >
            <View style={[sp.checkbox, selected.length === residents.length && residents.length > 0 && sp.checkboxOn]}>
              {selected.length === residents.length && residents.length > 0 && <Text style={sp.checkmark}>✓</Text>}
            </View>
            <Text style={sp.selAllTxt}>Select All ({residents.length} residents)</Text>
          </TouchableOpacity>

          {/* Resident rows */}
          <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
            {filtered.length === 0 ? (
              <Text style={sp.noRes}>No residents found</Text>
            ) : (
              filtered.map(r => {
                const hasContact = !!(r.contact && r.contact.trim());
                const on = selected.includes(r.id);
                const sc = STATUS_COLORS[r.evacuationStatus] || STATUS_COLORS.Safe;
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={[sp.resRow, on && sp.resRowOn]}
                    onPress={() => toggle(r)}
                    activeOpacity={0.7}
                  >
                    <View style={[sp.checkbox, on && sp.checkboxOn]}>
                      {on && <Text style={sp.checkmark}>✓</Text>}
                    </View>
                    <View style={sp.avatar}>
                      <Text style={sp.avatarTxt}>{r.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={sp.resName}>{r.name}</Text>
                      <Text style={sp.resSub}>
                        {r.zone}{hasContact ? ' · ' + r.contact : ' · no contact'}
                      </Text>
                    </View>
                    <View style={[sp.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                      <Text style={[sp.statusTxt, { color: sc.text }]}>
                        {(r.evacuationStatus || 'Safe').toUpperCase()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          {/* Footer */}
          {selected.length > 0 && (
            <View style={sp.panelFooter}>
              <Text style={sp.selCount}>📱 {selected.length} recipient{selected.length !== 1 ? 's' : ''} selected</Text>
              <TouchableOpacity onPress={clearAll}>
                <Text style={sp.clearAll}>Clear all</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <Text style={sp.hint}>
        Select residents to receive SMS. Leave empty to skip SMS.
      </Text>
    </View>
  );
}

// Send Alert Modal
function SendAlertModal({ visible, onClose, onSave, saving, initialForm, residents }) {
  const [form, setForm] = useState({ ...EF });
  const [smsRecipients, setSmsRecipients] = useState([]);
  const [openDD, setOpenDD] = useState(null);

  const onShow = () => {
    setForm(initialForm ? { ...initialForm } : { ...EF });
    setSmsRecipients([]);
    setOpenDD(null);
  };

  function set(k, v) { setForm(p => ({ ...p, [k]: v })); }

  function handleSave() {
    if (!form.message.trim()) return;
    onSave(form, smsRecipients);
  }

  const hasSMS = smsRecipients.length > 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} onShow={onShow}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={mo.overlay} />
      </TouchableWithoutFeedback>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={mo.kavWrap} pointerEvents="box-none">
        <View style={mo.sheet}>
          {/* Header */}
          <View style={mo.header}>
            <View style={mo.headerLeft}>
              <Text style={mo.headerIcon}>📢</Text>
              <Text style={mo.headerTitle}>Send Emergency Alert</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={mo.closeBtn}>
              <Text style={mo.closeX}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={mo.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Level + Zone row */}
            <View style={mo.row2}>
              <View style={{ flex: 1, zIndex: openDD === 'level' ? 30 : 10 }}>
                <Dropdown
                  label="ALERT LEVEL"
                  value={form.level}
                  opts={ALT_LEVELS}
                  onChange={v => set('level', v)}
                  isOpen={openDD === 'level'}
                  onToggle={() => setOpenDD(openDD === 'level' ? null : 'level')}
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1, zIndex: openDD === 'zone' ? 30 : 10 }}>
                <Dropdown
                  label="TARGET ZONE"
                  value={form.zone}
                  opts={ALL_Z}
                  onChange={v => set('zone', v)}
                  isOpen={openDD === 'zone'}
                  onToggle={() => setOpenDD(openDD === 'zone' ? null : 'zone')}
                />
              </View>
            </View>

            {/* Message */}
            <View style={mo.fieldWrap}>
              <Text style={mo.fieldLabel}>ALERT MESSAGE *</Text>
              <TextInput
                style={mo.textarea}
                value={form.message}
                onChangeText={v => set('message', v)}
                placeholder="e.g. FLOOD WARNING: Water level critically high..."
                placeholderTextColor="#4a5568"
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* SMS Recipients */}
            <SMSPicker
              residents={residents || []}
              selected={smsRecipients}
              onChange={setSmsRecipients}
            />

            <View style={{ height: 16 }} />
          </ScrollView>

          {/* Footer */}
          <View style={mo.footer}>
            <TouchableOpacity style={mo.cancelBtn} onPress={onClose}>
              <Text style={mo.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[mo.sendBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={mo.sendTxt}>
                {saving ? 'Sending...' : hasSMS ? `✈️  Send Alert + SMS (${smsRecipients.length})` : '✈️  Send Alert'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Main Screen
export default function AlertsScreen({ navigation }) {
  const { alerts, addAlert, deleteAlert, reload, residents } = useApp();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const [q, setQ]           = useState('');
  const [show, setShow]     = useState(false);
  const [initForm, setInit] = useState(null);
  const [delId, setDelId]   = useState(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy]     = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmDel, setConfirmDel]   = useState(false);

  const list = alerts.filter(a =>
    !q || (a.message + a.zone + a.level).toLowerCase().includes(q.toLowerCase())
  );

  const totalSent     = alerts.length;
  const dangerCount   = alerts.filter(a => a.level === 'Danger').length;
  const warningCount  = alerts.filter(a => a.level === 'Warning').length;
  const advisoryCount = alerts.filter(a => a.level === 'Advisory').length;
  const resolvedCount = alerts.filter(a => a.level === 'Resolved').length;

  function openSend(preset) {
    setInit(preset || { ...EF });
    setShow(true);
  }

  async function handleSave(form, smsRecipients) {
    setSaving(true);
    try {
      await addAlert({ ...form, recipientsCount: smsRecipients.length }, user.name);
      setShow(false);
    } catch (e) { console.warn(e); }
    setSaving(false);
  }

  async function handleDelete() {
    if (!delId) return;
    await deleteAlert(delId, user.name);
    setDelId(null);
    setConfirmDel(false);
  }

  async function onRefresh() { setBusy(true); await reload(); setBusy(false); }

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f1a', paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0f1a" translucent />

      {/* HEADER */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => setSidebarOpen(true)} style={s.hamburger}>
          <Text style={s.hamburgerText}>☰</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.headerTitle} numberOfLines={1}>Alert System</Text>
          <Text style={s.headerSub}>Broadcast emergency alerts — send in-app notifications and SMS to residents</Text>
        </View>
        <TouchableOpacity style={s.sendBtn} onPress={() => openSend(null)}>
          <Text style={s.sendBtnTxt}>📢  Send Alert</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={busy} onRefresh={onRefresh} tintColor="#38bdf8" />}
      >
        {/* Stat Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.statRow}
        >
          {[
            { label: 'TOTAL SENT', count: totalSent,     color: '#38bdf8' },
            { label: 'DANGER',     count: dangerCount,   color: '#ef4444' },
            { label: 'WARNING',    count: warningCount,  color: '#f97316' },
            { label: 'ADVISORY',   count: advisoryCount, color: '#38bdf8' },
            { label: 'RESOLVED',   count: resolvedCount, color: '#22c55e' },
          ].map(item => (
            <View key={item.label} style={s.statCard}>
              <Text style={[s.statCount, { color: item.color }]}>{item.count}</Text>
              <Text style={s.statLabel}>{item.label}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Quick Emergency Broadcast */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionIcon}>⚡</Text>
            <Text style={s.sectionTitle}>QUICK EMERGENCY BROADCAST</Text>
          </View>
          <View style={s.quickRow}>
            {QUICK.map(qt => {
              const lc = LEVEL_COLORS[qt.level] || LEVEL_COLORS.Advisory;
              return (
                <TouchableOpacity
                  key={qt.label}
                  style={[s.quickBtn, { borderColor: lc.border + '55' }]}
                  onPress={() => openSend({ level: qt.level, zone: qt.zone, message: qt.msg })}
                  activeOpacity={0.75}
                >
                  <Text style={s.quickEmoji}>{LEVEL_EMOJI[qt.level]}</Text>
                  <Text style={[s.quickLabel, { color: lc.text }]}>{qt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Search */}
        <View style={s.searchWrap}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            value={q}
            onChangeText={setQ}
            placeholder="Search alerts..."
            placeholderTextColor="#4a5568"
          />
        </View>

        {/* Alert History */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionIcon}>🔔</Text>
            <Text style={s.sectionTitle}>ALERT HISTORY</Text>
            <View style={s.historyCount}>
              <Text style={s.historyCountTxt}>{alerts.length}</Text>
            </View>
          </View>

          {list.length === 0 ? (
            <View style={s.emptyWrap}>
              <Text style={s.emptyIcon}>📢</Text>
              <Text style={s.emptyText}>No alerts yet</Text>
            </View>
          ) : (
            list.map(a => {
              const lc = LEVEL_COLORS[a.level] || LEVEL_COLORS.Advisory;
              const dateStr = a.created_at
                ? new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : '';
              return (
                <View key={String(a.id)} style={s.alertRow}>
                  {/* Left accent bar */}
                  <View style={[s.accentBar, { backgroundColor: lc.border }]} />

                  <View style={{ flex: 1 }}>
                    {/* Top: bell icon plus badge plus title plus zone */}
                    <View style={s.alertTop}>
                      <Text style={s.alertBell}>{LEVEL_EMOJI[a.level] || '📢'}</Text>
                      <View style={[s.levelBadge, { backgroundColor: lc.bg, borderColor: lc.border }]}>
                        <Text style={[s.levelBadgeTxt, { color: lc.text }]}>{(a.level || '').toUpperCase()}</Text>
                      </View>
                      <Text style={s.alertTitle} numberOfLines={1}>
                        {a.title || (a.level + ' — ' + a.zone)}
                      </Text>
                      <Text style={s.alertZone}>{a.zone}</Text>
                      <TouchableOpacity
                        style={s.deleteBtn}
                        onPress={() => { setDelId(a.id); setConfirmDel(true); }}
                      >
                        <Text style={s.deleteBtnTxt}>🗑️</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Message */}
                    <Text style={s.alertMsg} numberOfLines={2}>{a.message}</Text>

                    {/* Meta */}
                    <View style={s.alertMeta}>
                      <Text style={s.metaTxt}>👤 {a.sent_by || 'System'}</Text>
                    {a.recipients_count > 0 ? <Text style={s.metaTxt}>👥 {a.recipients_count} recipient{a.recipients_count !== 1 ? 's' : ''}</Text> : null}
                      {dateStr ? <Text style={s.metaTxt}>🕐 {dateStr}</Text> : null}
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Send Alert Modal */}
      <SendAlertModal
        visible={show}
        onClose={() => setShow(false)}
        onSave={handleSave}
        saving={saving}
        initialForm={initForm}
        residents={residents || []}
      />

      {/* Delete Confirm Modal */}
      <Modal visible={confirmDel} transparent animationType="fade" onRequestClose={() => setConfirmDel(false)}>
        <TouchableWithoutFeedback onPress={() => setConfirmDel(false)}>
          <View style={mo.overlay} />
        </TouchableWithoutFeedback>
        <View style={cm.centerer}>
          <View style={cm.box}>
            <Text style={cm.title}>Delete Alert</Text>
            <Text style={cm.msg}>Remove from alert history?</Text>
            <View style={cm.btns}>
              <TouchableOpacity style={cm.cancelBtn} onPress={() => setConfirmDel(false)}>
                <Text style={cm.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={cm.okBtn} onPress={handleDelete}>
                <Text style={cm.okTxt}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentRoute="Alerts"
        onNavigate={(screenName) => { navigation.navigate(screenName); setSidebarOpen(false); }}
        onLogout={() => { setSidebarOpen(false); logout(); }}
        userName={user?.name || 'User'}
      />
    </View>
  );
}

// Styles 
const s = StyleSheet.create({
  header: {
    backgroundColor: '#0d1424',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hamburger:     { padding: 6 },
  hamburgerText: { fontSize: 24, color: '#94a3b8' },
  headerTitle:   { fontSize: 17, fontWeight: '800', color: '#f1f5f9', letterSpacing: -0.3 },
  headerSub:     { fontSize: 10, color: '#4a5568', marginTop: 2, lineHeight: 15, flexShrink: 1 },
  sendBtn: {
    backgroundColor: '#38bdf8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  sendBtnTxt: { color: '#0a0f1a', fontWeight: '800', fontSize: 12 },

  statRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 8,
  },
  statCard: {
    width: 80,
    backgroundColor: '#0d1424',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  statCount: { fontSize: 22, fontWeight: '900' },
  statLabel: { fontSize: 7, fontWeight: '700', color: '#4a5568', letterSpacing: 0.6, marginTop: 4, textAlign: 'center' },

  section: {
    marginHorizontal: 14,
    marginBottom: 14,
    backgroundColor: '#0d1424',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 },
  sectionIcon:   { fontSize: 13 },
  sectionTitle:  { fontSize: 10, fontWeight: '800', color: '#4a5568', letterSpacing: 1 },
  historyCount: {
    marginLeft: 6,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  historyCountTxt: { fontSize: 10, color: '#94a3b8', fontWeight: '700' },

  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickBtn: {
    width: '47.5%',
    backgroundColor: '#111827',
    borderRadius: 10,
    padding: 13,
    alignItems: 'center',
    borderWidth: 1,
  },
  quickEmoji: { fontSize: 20, marginBottom: 6 },
  quickLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d1424',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    marginHorizontal: 14,
    marginBottom: 14,
  },
  searchIcon:  { marginRight: 8, fontSize: 15 },
  searchInput: { flex: 1, color: '#e2e8f0', fontSize: 14 },

  alertRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#111827',
    paddingVertical: 12,
    gap: 10,
  },
  accentBar: { width: 3, borderRadius: 2, alignSelf: 'stretch' },

  alertTop: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 5, flexWrap: 'wrap' },
  alertBell: { fontSize: 15 },
  levelBadge: {
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  levelBadgeTxt: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  alertTitle:  { flex: 1, fontSize: 12, fontWeight: '700', color: '#e2e8f0' },
  alertZone:   { fontSize: 10, color: '#4a5568' },
  deleteBtn:   { padding: 4 },
  deleteBtnTxt: { fontSize: 14 },

  alertMsg:  { fontSize: 12, color: '#94a3b8', lineHeight: 18, marginBottom: 6 },
  alertMeta: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  metaTxt:   { fontSize: 10, color: '#4a5568' },

  emptyWrap: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 36, marginBottom: 10, opacity: 0.3 },
  emptyText: { fontSize: 13, color: '#2d3748' },
});

// Dropdown styles
const dd = StyleSheet.create({
  wrap:    { position: 'relative' },
  label:   { fontSize: 9, color: '#4a5568', fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 },
  trigger: {
    backgroundColor: '#0a0f1a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 7,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  val:   { color: '#e2e8f0', fontSize: 13 },
  arrow: { color: '#4a5568', fontSize: 10 },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 7,
    zIndex: 999,
    elevation: 20,
    marginTop: 2,
    overflow: 'hidden',
  },
  option:       { paddingHorizontal: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  optionActive: { backgroundColor: '#1d4ed8' },
  optTxt:       { color: '#94a3b8', fontSize: 13 },
  optTxtActive: { color: '#fff', fontWeight: '700' },
});

// SMS Picker styles
const sp = StyleSheet.create({
  wrap:  { marginBottom: 14 },
  label: { fontSize: 9, color: '#4a5568', fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 },
  opt:   { fontWeight: '400', color: '#2d3748' },
  box: {
    backgroundColor: '#0a0f1a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 7,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  chips:       { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  placeholder: { color: '#4a5568', fontSize: 13 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e3a4a',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 5,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  chipTxt: { color: '#38bdf8', fontSize: 11, fontWeight: '600' },
  chipX:   { color: '#38bdf8', fontSize: 11 },
  arrow:   { color: '#4a5568', fontSize: 10, marginLeft: 8 },
  panel: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 7,
    marginTop: 4,
    overflow: 'hidden',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon:  { marginRight: 8, fontSize: 13 },
  searchInput: { flex: 1, color: '#e2e8f0', fontSize: 13 },
  selAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  selAllTxt: { color: '#94a3b8', fontSize: 12 },
  checkbox: {
    width: 18, height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: '#0a0f1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: '#1d4ed8', borderColor: '#3b82f6' },
  checkmark:  { color: '#fff', fontSize: 11, fontWeight: '700' },
  resRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  resRowOn:  { backgroundColor: '#0e1f35' },
  avatar: {
    width: 30, height: 30,
    borderRadius: 15,
    backgroundColor: '#1e3a4a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTxt: { color: '#38bdf8', fontSize: 13, fontWeight: '700' },
  resName:   { fontSize: 12, fontWeight: '600', color: '#e2e8f0' },
  resSub:    { fontSize: 10, color: '#4a5568', marginTop: 1 },
  statusBadge: {
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusTxt:  { fontSize: 8, fontWeight: '800', letterSpacing: 0.4 },
  noRes:      { padding: 16, color: '#4a5568', fontSize: 12, textAlign: 'center' },
  panelFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    backgroundColor: '#0d1424',
  },
  selCount: { fontSize: 11, color: '#38bdf8', fontWeight: '700' },
  clearAll: { fontSize: 11, color: '#ef4444' },
  hint: { fontSize: 9, color: '#2d3748', marginTop: 6, lineHeight: 14 },
});

// Modal styles
const mo = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)' },
  kavWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  sheet: {
    backgroundColor: '#0d1424',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    width: '100%',
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIcon:  { fontSize: 16 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#f1f5f9' },
  closeBtn:    { padding: 4 },
  closeX:      { color: '#64748b', fontSize: 18 },
  body:        { paddingHorizontal: 18, paddingTop: 16 },
  row2:        { flexDirection: 'row', marginBottom: 14 },
  fieldWrap:   { marginBottom: 14 },
  fieldLabel:  { fontSize: 9, color: '#4a5568', fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 },
  textarea: {
    backgroundColor: '#0a0f1a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 7,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#e2e8f0',
    fontSize: 13,
    height: 90,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  cancelTxt: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  sendBtn: {
    flex: 2,
    backgroundColor: '#38bdf8',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  sendTxt: { color: '#0a0f1a', fontSize: 13, fontWeight: '800' },
});

// Confirm dialog styles
const cm = StyleSheet.create({
  centerer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  box: {
    backgroundColor: '#0d1424',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 24,
    width: '100%',
  },
  title:  { fontSize: 16, fontWeight: '800', color: '#f1f5f9', marginBottom: 8 },
  msg:    { fontSize: 13, color: '#94a3b8', marginBottom: 20 },
  btns:   { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  cancelTxt: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  okBtn: {
    flex: 1,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  okTxt: { color: '#fff', fontSize: 13, fontWeight: '800' },
});