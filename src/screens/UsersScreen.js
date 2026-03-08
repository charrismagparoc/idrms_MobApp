import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge, Confirm, DeleteBtn, EditBtn, Empty, FInput, FormModal, FPick, Search } from '../components/Shared';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { C } from '../styles/colors';

const EF = { name: '', role: 'Staff', email: '', status: 'Active', password: '' };

const AVATAR_COLORS = ['#e53935','#8e24aa','#1e88e5','#00897b','#f4511e','#6d4c41','#3949ab','#00acc1'];
function getAvatarColor(name) {
  const code = (name || 'U').charCodeAt(0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}
function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function groupAlphabetically(users) {
  const groups = {};
  users.forEach(u => {
    const letter = (u.name || '?')[0].toUpperCase();
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(u);
  });
  return Object.keys(groups).sort().map(letter => ({ letter, users: groups[letter] }));
}

export default function UsersScreen() {
  const insets = useSafeAreaInsets();
  const { users, addUser, updateUser, deleteUser, reload } = useApp();
  const { user } = useAuth();
  const [q, setQ]       = useState('');
  const [form, setForm] = useState({ ...EF });
  const [edit, setEdit] = useState(null);
  const [show, setShow] = useState(false);
  const [delId, setDelId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState('');
  const [busy, setBusy] = useState(false);

  const totalUsers    = users.length;
  const adminCount    = users.filter(u => u.role === 'Admin').length;
  const staffCount    = users.filter(u => u.role === 'Staff').length;
  const activeCount   = users.filter(u => u.status === 'Active').length;

  const filtered = users
    .filter(u =>
      !q ||
      u.name.toLowerCase().includes(q.toLowerCase()) ||
      u.email.toLowerCase().includes(q.toLowerCase()) ||
      (u.role||'').toLowerCase().includes(q.toLowerCase())
    )
    .sort((a, b) => {
      if (a.role === 'Admin' && b.role !== 'Admin') return -1;
      if (a.role !== 'Admin' && b.role === 'Admin') return  1;
      return 0;
    });

  const groups = q ? null : groupAlphabetically(filtered);

  function openAdd()   { setForm({ ...EF }); setEdit(null); setSaveErr(''); setShow(true); }
  function openEdit(u) { setForm({ ...u, password: '' }); setEdit(u); setSaveErr(''); setShow(true); }
  function set(k, v)   { setForm(p => ({ ...p, [k]: v })); }

  async function save() {
    if (!form.name.trim())  { setSaveErr('Full name is required.');          return; }
    if (!form.email.trim()) { setSaveErr('Email is required.');              return; }
    if (!edit && !form.password.trim()) { setSaveErr('Password required for new users.'); return; }
    setSaveErr(''); setSaving(true);
    try {
      if (edit) await updateUser(edit.id, form);
      else      await addUser(form);
      setShow(false);
    } catch (e) { setSaveErr(e.message || 'Error saving user'); }
    setSaving(false);
  }

  async function onRefresh() { setBusy(true); await reload(); setBusy(false); }

  const renderCard = (u) => {
    const isOnline    = u.status === 'Active';
    const avatarColor = getAvatarColor(u.name);
    const initials    = getInitials(u.name);
    return (
      <View key={String(u.id)} style={s.card}>
        <View style={s.avatarWrap}>
          <View style={[s.avatar, { backgroundColor: avatarColor }]}>
            <Text style={s.avatarTxt}>{initials}</Text>
          </View>
          <View style={[s.onlineDot, { backgroundColor: isOnline ? '#4caf50' : C.t3 }]} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={s.nameRow}>
            <Text style={s.tdBold} numberOfLines={1}>{u.name}</Text>
            <View style={[s.onlinePill, { backgroundColor: isOnline ? '#4caf5022' : C.el }]}>
              <Text style={[s.onlineTxt, { color: isOnline ? '#4caf50' : C.t3 }]}>
                {isOnline ? '● Online' : '○ Offline'}
              </Text>
            </View>
          </View>
          <Text style={s.tdSub} numberOfLines={1}>{u.email}</Text>
          <View style={s.badgeRow}>
            <Badge label={u.role}   variant={u.role === 'Admin' ? 'danger' : 'info'} />
            <Badge label={u.status} variant={u.status === 'Active' ? 'success' : 'warning'} />
          </View>
        </View>
        <View style={s.actions}>
          <EditBtn   onPress={() => openEdit(u)}    />
          <DeleteBtn onPress={() => setDelId(u.id)} />
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* HEADER */}
      <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
        <View style={s.logoRow}>
          <Ionicons name="shield-checkmark" size={18} color={C.blue} />
          <Text style={s.title}>Users</Text>
        </View>
        <View style={s.countBadge}>
          <Text style={s.countBadgeTxt}>{totalUsers}</Text>
        </View>
      </View>

      {/* SEARCH + ADD */}
      <View style={s.bar}>
        <Search value={q} onChange={setQ} placeholder="Search users..." />
        <TouchableOpacity style={[s.addBtn, { backgroundColor: C.blue }]} onPress={openAdd} activeOpacity={0.8}>
          <Ionicons name="person-add" size={16} color="#fff" />
          <Text style={s.addTxt}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* SUMMARY */}
      <View style={s.summary}>
        <View style={s.sumBox}>
          <Text style={s.sumVal}>{totalUsers}</Text>
          <Text style={s.sumLbl}>Total</Text>
        </View>
        <View style={s.sumDivider} />
        <View style={s.sumBox}>
          <Text style={[s.sumVal, { color: C.red }]}>{adminCount}</Text>
          <Text style={s.sumLbl}>Admin</Text>
        </View>
        <View style={s.sumDivider} />
        <View style={s.sumBox}>
          <Text style={[s.sumVal, { color: C.blue }]}>{staffCount}</Text>
          <Text style={s.sumLbl}>Staff</Text>
        </View>
        <View style={s.sumDivider} />
        <View style={s.sumBox}>
          <Text style={[s.sumVal, { color: '#4caf50' }]}>{activeCount}</Text>
          <Text style={s.sumLbl}>Active</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={busy} onRefresh={onRefresh} tintColor={C.blue} />}>

        <Text style={s.count}>{filtered.length} user{filtered.length !== 1 ? 's' : ''}</Text>

        {groups ? (
          groups.map(({ letter, users: groupUsers }) => (
            <View key={letter}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionLetter}>{letter}</Text>
                <View style={s.sectionLine} />
                <Text style={s.sectionCount}>{groupUsers.length}</Text>
              </View>
              {groupUsers.map(u => renderCard(u))}
            </View>
          ))
        ) : (
          filtered.map(u => renderCard(u))
        )}

        {filtered.length === 0 && <Empty iconName="people-outline" title="No users found" />}
      </ScrollView>

      <FormModal visible={show} title={edit ? 'Edit User' : 'Add User'} onClose={() => setShow(false)} onSave={save} saving={saving}>
        <FInput label="Full Name *"  value={form.name}       onChange={v => set('name', v)}     req />
        <FPick  label="Role"         value={form.role}       opts={['Admin','Staff']}            onChange={v => set('role', v)} />
        <FPick  label="Status"       value={form.status}     opts={['Active','Inactive']}        onChange={v => set('status', v)} />
        <FInput label="Email *"      value={form.email}      onChange={v => set('email', v)}    placeholder="user@kauswagan.gov.ph" req />
        <FInput label={`Password${edit ? ' (blank = keep)' : ' *'}`} value={form.password||''} onChange={v => set('password', v)} secure req={!edit} />
        {saveErr ? (
          <View style={s.errBox}>
            <Ionicons name="alert-circle-outline" size={14} color={C.red} />
            <Text style={s.errTxt}>{saveErr}</Text>
          </View>
        ) : null}
      </FormModal>

      <Confirm visible={!!delId} title="Delete User" msg="Remove this user account permanently?"
        onOk={async () => { await deleteUser(delId); setDelId(null); }}
        onNo={() => setDelId(null)} />
    </View>
  );
}

const s = StyleSheet.create({
  topBar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 10, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  logoRow:      { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title:        { fontSize: 15, fontWeight: '700', color: C.t1 },
  countBadge:   { backgroundColor: C.blue, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, minWidth: 24, alignItems: 'center' },
  countBadgeTxt:{ color: '#fff', fontSize: 11, fontWeight: '800' },
  bar:          { flexDirection: 'row', gap: 10, padding: 12, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  addBtn:       { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 8, paddingHorizontal: 14, height: 42 },
  addTxt:       { color: '#fff', fontWeight: '700', fontSize: 13 },
  summary:      { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border, paddingHorizontal: 16, paddingVertical: 10 },
  sumBox:       { alignItems: 'center', flex: 1 },
  sumVal:       { fontSize: 18, fontWeight: '800', color: C.t1 },
  sumLbl:       { fontSize: 9, color: C.t3, marginTop: 2, fontWeight: '600', textTransform: 'uppercase' },
  sumDivider:   { width: 1, height: 30, backgroundColor: C.border },
  count:        { fontSize: 11, color: C.t3, paddingHorizontal: 14, paddingVertical: 8 },
  sectionHeader:{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6, gap: 8 },
  sectionLetter:{ fontSize: 13, fontWeight: '800', color: C.blue, width: 18 },
  sectionLine:  { flex: 1, height: 1, backgroundColor: C.border },
  sectionCount: { fontSize: 10, color: C.t3, fontWeight: '700' },
  card:         { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, marginHorizontal: 12, marginBottom: 8, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.border },
  avatarWrap:   { position: 'relative' },
  avatar:       { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:    { color: '#fff', fontSize: 15, fontWeight: '800' },
  onlineDot:    { position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: 6, borderWidth: 2, borderColor: C.card },
  nameRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  tdBold:       { fontSize: 13, fontWeight: '700', color: C.t1, flex: 1 },
  tdSub:        { fontSize: 11, color: C.t3, marginBottom: 5 },
  badgeRow:     { flexDirection: 'row', gap: 5 },
  onlinePill:   { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  onlineTxt:    { fontSize: 9, fontWeight: '700' },
  actions:      { flexDirection: 'column', gap: 5 },
  errBox:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.red + '18', borderRadius: 8, padding: 10, marginTop: 8, borderWidth: 1, borderColor: C.red + '44' },
  errTxt:       { color: C.red, fontSize: 12, fontWeight: '600' },
});