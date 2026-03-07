import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  RefreshControl, ScrollView, StyleSheet, Text,
  TouchableOpacity, View, TextInput, Modal,
  TouchableWithoutFeedback, KeyboardAvoidingView,
  Platform, StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sidebar } from '../components/Sidebar';
import { useApp } from '../context/AppContext';
import { RES_STAT, VULN_TAGS, ZONES } from '../data/constants';
import { C } from '../styles/colors';

const EF = {
  name: '', zone: 'Zone 1', address: '', householdMembers: '1',
  contact: '', evacuationStatus: 'Safe', vulnerabilityTags: [], notes: ''
};

const STATUS_COLORS = {
  Safe:         { bg: '#0d2e1f', text: '#22c55e', border: '#16a34a' },
  Evacuated:    { bg: '#0d1f2e', text: '#38bdf8', border: '#0ea5e9' },
  Unaccounted:  { bg: '#2e1a0d', text: '#f97316', border: '#ea580c' },
};

function StatBadge({ label, count, color, onPress, active }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        sb.wrap,
        { borderColor: color + '55', backgroundColor: color + '18' },
        active && { backgroundColor: color + '38', borderColor: color, borderWidth: 2 },
      ]}
    >
      <Text style={[sb.count, { color }]}>{count}</Text>
      <Text style={[sb.label, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function DropdownPicker({ label, value, opts, onChange, isOpen, onToggle }) {
  return (
    <View style={dp.wrap}>
      <Text style={dp.label}>{label}</Text>
      <TouchableOpacity style={dp.trigger} onPress={onToggle} activeOpacity={0.8}>
        <Text style={dp.val}>{value}</Text>
        <Text style={dp.arrow}>{isOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {isOpen && (
        <View style={dp.dropdown}>
          {opts.map(o => (
            <TouchableOpacity
              key={o}
              style={[dp.option, o === value && dp.optionActive]}
              onPress={() => { onChange(o); onToggle(); }}
            >
              <Text style={[dp.optionText, o === value && dp.optionTextActive]}>{o}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function TagToggle({ label, values, opts, onChange }) {
  return (
    <View style={tt.wrap}>
      <Text style={tt.label}>{label}</Text>
      <View style={tt.row}>
        {opts.map(o => {
          const active = values.includes(o);
          return (
            <TouchableOpacity
              key={o}
              style={[tt.tag, active && tt.tagActive]}
              onPress={() => onChange(active ? values.filter(v => v !== o) : [...values, o])}
            >
              <Text style={[tt.tagText, active && tt.tagTextActive]}>{o}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function FormField({ label, value, onChange, placeholder, keyboardType, multiline }) {
  return (
    <View style={ff.wrap}>
      <Text style={ff.label}>{label}</Text>
      <TextInput
        style={[ff.input, multiline && { height: 80, textAlignVertical: 'top', paddingTop: 10 }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#4a5568"
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
      />
    </View>
  );
}

function ResidentModal({ visible, onClose, onSave, saving, editData }) {
  const isEdit = !!editData;
  const [form, setForm] = useState({ ...EF });
  const [openDD, setOpenDD] = useState(null); // 'zone' | 'status' | null

  // Sync form when editData changes
  useState(() => {
    if (editData) {
      setForm({
        ...editData,
        householdMembers: String(editData.householdMembers || 1),
        vulnerabilityTags: editData.vulnerabilityTags || [],
      });
    } else {
      setForm({ ...EF });
    }
  });

  // Reset on visibility change
  const prevVisible = useState(false);

  function set(k, v) { setForm(p => ({ ...p, [k]: v })); }

  function handleSave() {
    if (!form.name.trim()) return;
    onSave(form);
  }

  // Reset form whenever modal opens
  const onShow = () => {
    setOpenDD(null);
    if (editData) {
      setForm({
        ...editData,
        householdMembers: String(editData.householdMembers || 1),
        vulnerabilityTags: editData.vulnerabilityTags || [],
      });
    } else {
      setForm({ ...EF });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} onShow={onShow}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={am.overlay} />
      </TouchableWithoutFeedback>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={am.kavWrap}
        pointerEvents="box-none"
      >
        <View style={am.sheet}>
          {/* Modal Header */}
          <View style={am.header}>
            <View style={am.headerLeft}>
              <Text style={am.headerIcon}>{isEdit ? '✏️' : '👤'}</Text>
              <Text style={am.headerTitle}>{isEdit ? 'Edit Resident' : 'Add Resident'}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={am.closeBtn}>
              <Text style={am.closeX}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={am.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Full Name */}
            <FormField
              label="FULL NAME *"
              value={form.name}
              onChange={v => set('name', v)}
              placeholder="Full name..."
            />

            {/* Zone + Evacuation Status row */}
            <View style={am.row2}>
              <View style={{ flex: 1, zIndex: openDD === 'zone' ? 30 : 10 }}>
                <DropdownPicker
                  label="ZONE" value={form.zone} opts={ZONES}
                  onChange={v => set('zone', v)}
                  isOpen={openDD === 'zone'}
                  onToggle={() => setOpenDD(openDD === 'zone' ? null : 'zone')}
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1, zIndex: openDD === 'status' ? 30 : 10 }}>
                <DropdownPicker
                  label="EVACUATION STATUS" value={form.evacuationStatus} opts={RES_STAT}
                  onChange={v => set('evacuationStatus', v)}
                  isOpen={openDD === 'status'}
                  onToggle={() => setOpenDD(openDD === 'status' ? null : 'status')}
                />
              </View>
            </View>

            {/* Address */}
            <FormField
              label="ADDRESS"
              value={form.address || ''}
              onChange={v => set('address', v)}
              placeholder="Purok / Street..."
            />

            {/* Household ug Contact No. */}
            <View style={am.row2}>
              <View style={{ flex: 1 }}>
                <FormField
                  label="HOUSEHOLD MEMBERS"
                  value={form.householdMembers}
                  onChange={v => set('householdMembers', v)}
                  placeholder="1"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <FormField
                  label="CONTACT NUMBER"
                  value={form.contact || ''}
                  onChange={v => set('contact', v)}
                  placeholder="09XX-XXX-XXXX"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Vulnerability Tags */}
            <TagToggle
              label="VULNERABILITY TAGS"
              values={form.vulnerabilityTags}
              opts={VULN_TAGS}
              onChange={v => set('vulnerabilityTags', v)}
            />

            {/* Notes */}
            <FormField
              label="NOTES"
              value={form.notes || ''}
              onChange={v => set('notes', v)}
              placeholder="Additional notes..."
              multiline
            />

            <View style={{ height: 16 }} />
          </ScrollView>

          {/* Footer buttons */}
          <View style={am.footer}>
            <TouchableOpacity style={am.cancelBtn} onPress={onClose}>
              <Text style={am.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[am.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={am.saveText}>
                {saving ? 'Saving...' : isEdit ? '💾  Save Changes' : '💾  Add Resident'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function ResidentsScreen({ navigation }) {
  const { residents, addResident, updateResident, deleteResident, reload } = useApp();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [q, setQ]              = useState('');
  const [fz, setFz]            = useState('All');
  const [fe, setFe]            = useState('All');
  const [fvuln, setFvuln]      = useState(false);
  const [show, setShow]        = useState(false);
  const [openDD, setOpenDD]    = useState(null); // 'zone' | 'status' | null
  const [editResident, setEditResident] = useState(null);
  const [saving, setSaving]    = useState(false);
  const [busy, setBusy]        = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [delTarget, setDelTarget] = useState(null); // { id, name }

  function openAdd()    { setEditResident(null); setShow(true); }
  function openEdit(r)  { setEditResident(r);    setShow(true); }
  function closeModal() { setShow(false); setEditResident(null); }

  const list = residents.filter(r => {
    const mq = !q || (r.name + r.address + r.zone).toLowerCase().includes(q.toLowerCase());
    const mz = fz === 'All' || r.zone === fz;
    const me = fe === 'All' || r.evacuationStatus === fe;
    const mv = !fvuln || (r.vulnerabilityTags || []).length > 0;
    return mq && mz && me && mv;
  });

  const safeCount        = residents.filter(r => r.evacuationStatus === 'Safe').length;
  const evacuatedCount   = residents.filter(r => r.evacuationStatus === 'Evacuated').length;
  const unaccountedCount = residents.filter(r => r.evacuationStatus === 'Unaccounted').length;
  const vulnerableCount  = residents.filter(r => (r.vulnerabilityTags || []).length > 0).length;

  async function handleSave(form) {
    setSaving(true);
    try {
      const d = { ...form, householdMembers: parseInt(form.householdMembers) || 1 };
      if (editResident) {
        await updateResident(editResident.id, d, user.name);
      } else {
        await addResident(d, user.name);
      }
      closeModal();
    } catch (e) { console.warn(e); }
    setSaving(false);
  }

  async function onRefresh() {
    setBusy(true);
    
    setQ('');
    setFe('All');
    setFz('All');
    setFvuln(false);
    try {
      await reload();
    } catch (e) {
      console.warn('Refresh error:', e);
    }
    setBusy(false);
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f1a', paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0f1a" translucent />

      {/* HEADER */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => setSidebarOpen(true)} style={s.hamburger}>
          <Text style={s.hamburgerText}>☰</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.headerTitle} numberOfLines={1} adjustsFontSizeToFit>Resident Management</Text>
          <Text style={s.headerSub} numberOfLines={2}>Database with vulnerability tagging and evacuation tracking</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={openAdd}>
          <Text style={s.addBtnText}>Add Resident</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={busy} onRefresh={onRefresh} tintColor="#38bdf8" />}
      >
        {/* Stat Badges */}
        <View style={s.statRow}>
          <StatBadge
            label="SAFE" count={safeCount} color="#22c55e"
            active={fe === 'Safe'}
            onPress={() => { setFe(fe === 'Safe' ? 'All' : 'Safe'); setFvuln(false); setFz('All'); }}
          />
          <StatBadge
            label="EVACUATED" count={evacuatedCount} color="#38bdf8"
            active={fe === 'Evacuated'}
            onPress={() => { setFe(fe === 'Evacuated' ? 'All' : 'Evacuated'); setFvuln(false); setFz('All'); }}
          />
          <StatBadge
            label="UNACCOUNTED" count={unaccountedCount} color="#f97316"
            active={fe === 'Unaccounted'}
            onPress={() => { setFe(fe === 'Unaccounted' ? 'All' : 'Unaccounted'); setFvuln(false); setFz('All'); }}
          />
          <StatBadge
            label="VULNERABLE" count={vulnerableCount} color="#a855f7"
            active={fvuln}
            onPress={() => { setFvuln(v => !v); setFe('All'); setFz('All'); }}
          />
        </View>

        {/* Search bar */}
        <View style={s.controlBar}>
          <View style={s.searchWrap}>
            <Text style={s.searchIcon}>🔍</Text>
            <TextInput
              style={s.searchInput}
              value={q}
              onChangeText={setQ}
              placeholder="Search name or address..."
              placeholderTextColor="#4a5568"
            />
          </View>

          {/* Filter dropdowns */}
          <View style={s.selects}>
            <View style={[s.selectWrap, { zIndex: openDD === 'zone' ? 20 : 10 }]}>
              <DropdownPicker
                label="" value={fz} opts={['All', ...ZONES]}
                onChange={setFz}
                isOpen={openDD === 'zone'}
                onToggle={() => setOpenDD(openDD === 'zone' ? null : 'zone')}
              />
            </View>
            <View style={[s.selectWrap, { zIndex: openDD === 'status' ? 20 : 10 }]}>
              <DropdownPicker
                label="" value={fe} opts={['All', ...RES_STAT]}
                onChange={v => { setFe(v); setFvuln(false); }}
                isOpen={openDD === 'status'}
                onToggle={() => setOpenDD(openDD === 'status' ? null : 'status')}
              />
            </View>
          </View>
        </View>

        {/* Count */}
        <View style={s.countRow}>
          <Text style={s.countText}>{list.length} {list.length === 1 ? 'resident' : 'residents'}</Text>
        </View>

        {/* Card list */}
        <View style={s.cardList}>
          {list.length === 0 ? (
            <View style={s.emptyWrap}>
              <Text style={s.emptyIcon}>👥</Text>
              <Text style={s.emptyText}>No residents found.</Text>
            </View>
          ) : (
            list.map(r => {
              const sc = STATUS_COLORS[r.evacuationStatus] || STATUS_COLORS.Safe;
              return (
                <View key={String(r.id)} style={s.card}>
                  {/* Top row: name ug actions */}
                  <View style={s.cardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.cardName}>{r.name}</Text>
                      <Text style={s.cardZone}>
                        {r.zone}{r.address ? '  ·  ' + r.address : ''}
                      </Text>
                    </View>
                    <View style={[s.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                      <Text style={[s.statusText, { color: sc.text }]}>{r.evacuationStatus || 'Safe'}</Text>
                    </View>
                  </View>

                  {/* Meta row */}
                  <View style={s.cardMeta}>
                    <View style={s.metaItem}>
                      <Text style={s.metaIcon}>👥</Text>
                      <Text style={s.metaVal}>{r.householdMembers || 1} {(r.householdMembers || 1) === 1 ? 'member' : 'members'}</Text>
                    </View>
                    {r.contact ? (
                      <View style={s.metaItem}>
                        <Text style={s.metaIcon}>📞</Text>
                        <Text style={s.metaVal}>{r.contact}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Vulnerability tags */}
                  {(r.vulnerabilityTags || []).length > 0 && (
                    <View style={s.cardTags}>
                      {r.vulnerabilityTags.map(t => (
                        <View key={t} style={s.vtag}>
                          <Text style={s.vtagT}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Action buttons */}
                  <View style={s.cardActions}>
                    <TouchableOpacity
                      style={s.actionBtn}
                      onPress={() => openEdit(r)}
                    >
                      <Text style={s.actionBtnText}>✏️  Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.actionBtn, s.actionBtnDanger]}
                      onPress={() => setDelTarget({ id: r.id, name: r.name })}
                    >
                      <Text style={[s.actionBtnText, { color: '#ef4444' }]}>🗑️  Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Add / maka Edit ug Resident Modal */}
      <ResidentModal
        visible={show}
        onClose={closeModal}
        onSave={handleSave}
        saving={saving}
        editData={editResident}
      />

      {/* Delete Confirm Modal */}
      <Modal visible={!!delTarget} transparent animationType="fade" onRequestClose={() => setDelTarget(null)}>
        <TouchableWithoutFeedback onPress={() => setDelTarget(null)}>
          <View style={cm.overlay} />
        </TouchableWithoutFeedback>
        <View style={cm.centerer}>
          <View style={cm.box}>
            <Text style={cm.title}>Delete Resident</Text>
            <Text style={cm.msg}>
              Remove <Text style={cm.name}>{delTarget?.name}</Text> from the resident list?
            </Text>
            <View style={cm.btns}>
              <TouchableOpacity style={cm.cancelBtn} onPress={() => setDelTarget(null)}>
                <Text style={cm.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={cm.okBtn}
                onPress={async () => {
                  await deleteResident(delTarget.id, delTarget.name, user.name);
                  setDelTarget(null);
                }}
              >
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
        currentRoute="Residents"
        onNavigate={(screenName) => {
          navigation.navigate(screenName);
          setSidebarOpen(false);
        }}
        onLogout={() => {
          setSidebarOpen(false);
          logout();
        }}
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
  headerTitle:   { fontSize: 17, fontWeight: '800', color: '#f1f5f9', letterSpacing: -0.3, flexShrink: 1 },
  headerSub:     { fontSize: 10, color: '#4a5568', marginTop: 2, lineHeight: 15, flexShrink: 1 },
  addBtn: {
    backgroundColor: '#38bdf8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: '#0a0f1a', fontWeight: '800', fontSize: 13 },

  statRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexWrap: 'wrap',
  },

  controlBar: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 10,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d1424',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
  },
  searchIcon:  { marginRight: 8, fontSize: 15 },
  searchInput: { flex: 1, color: '#e2e8f0', fontSize: 14 },
  selects:     { flexDirection: 'row', gap: 10 },
  selectWrap:  { flex: 1 },

  countRow: {
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  countText: { fontSize: 11, color: '#4a5568' },

  // Card list
  cardList: { paddingHorizontal: 14, gap: 10 },
  card: {
    backgroundColor: '#0d1424',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  cardName: { fontSize: 15, fontWeight: '800', color: '#f1f5f9' },
  cardZone: { fontSize: 12, color: '#64748b', marginTop: 3 },

  cardMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaIcon: { fontSize: 12 },
  metaVal:  { fontSize: 12, color: '#94a3b8' },

  cardTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },

  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 10,
  },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 7,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  actionBtnDanger: { borderColor: '#ef444433' },
  actionBtnText:   { color: '#94a3b8', fontSize: 12, fontWeight: '600' },

  statusBadge: {
    borderRadius: 7,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },

  vtag: {
    backgroundColor: '#1e1035',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#6d28d9',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  vtagT: { fontSize: 10, color: '#a855f7', fontWeight: '700' },

  emptyWrap: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 44, marginBottom: 12, opacity: 0.3 },
  emptyText: { fontSize: 14, color: '#2d3748' },
});

// StatBadge styles
const sb = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  count: { fontSize: 13, fontWeight: '800' },
  label: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  check: { fontSize: 10, fontWeight: '900', marginLeft: 2 },
});

// DropdownPicker styles
const dp = StyleSheet.create({
  wrap:    { position: 'relative', zIndex: 10 },
  label:   { fontSize: 9, color: '#4a5568', fontWeight: '700', letterSpacing: 0.8, marginBottom: 5 },
  trigger: {
    backgroundColor: '#0d1424',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  val:   { color: '#e2e8f0', fontSize: 12 },
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
    elevation: 10,
    marginTop: 2,
    overflow: 'hidden',
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  optionActive:     { backgroundColor: '#1d4ed8' },
  optionText:       { color: '#94a3b8', fontSize: 12 },
  optionTextActive: { color: '#fff', fontWeight: '700' },
});

// TagToggle styles
const tt = StyleSheet.create({
  wrap:  { marginBottom: 14 },
  label: { fontSize: 9, color: '#4a5568', fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  row:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#111827',
  },
  tagActive:     { borderColor: '#38bdf8', backgroundColor: '#0e3a52' },
  tagText:       { color: '#64748b', fontSize: 12 },
  tagTextActive: { color: '#38bdf8', fontWeight: '700' },
});

// FormField styles
const ff = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontSize: 9, color: '#4a5568', fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 },
  input: {
    backgroundColor: '#0d1424',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 7,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#e2e8f0',
    fontSize: 13,
    height: 42,
  },
});

// AddResidentModal styles
const am = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  kavWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  sheet: {
    backgroundColor: '#0d1424',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    width: '100%',
    maxHeight: '90%',
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
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIcon: { fontSize: 16 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#f1f5f9' },
  closeBtn: { padding: 4 },
  closeX: { color: '#64748b', fontSize: 18, fontWeight: '300' },

  body: { paddingHorizontal: 18, paddingTop: 16 },
  row2: { flexDirection: 'row', marginBottom: 0 },

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
  cancelText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  saveBtn: {
    flex: 2,
    backgroundColor: '#38bdf8',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveText: { color: '#0a0f1a', fontSize: 13, fontWeight: '800' },
});
// Confirm Delete Modal styles
const cm = StyleSheet.create({
  overlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  centerer:  { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', padding: 32 },
  box:       { backgroundColor: '#0d1424', borderRadius: 16, padding: 24, width: '100%', borderWidth: 1, borderColor: '#1e293b' },
  title:     { fontSize: 18, fontWeight: '800', color: '#f1f5f9', marginBottom: 8 },
  msg:       { fontSize: 14, color: '#94a3b8', lineHeight: 20, marginBottom: 24 },
  name:      { color: '#f1f5f9', fontWeight: '700' },
  btns:      { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, backgroundColor: '#1e293b', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  cancelTxt: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
  okBtn:     { flex: 1, backgroundColor: '#ef4444', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  okTxt:     { color: '#fff', fontSize: 14, fontWeight: '800' },
});