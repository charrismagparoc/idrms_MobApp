import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Badge, Confirm, DeleteBtn, EditBtn, Empty, FInput, FormModal, FPick, Search } from '../components/Shared';
import { ScreenHeader } from '../components/ScreenHeader';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { C } from '../styles/colors';

const EF = { name: '', role: 'Staff', email: '', status: 'Active', password: '' };

export default function UsersScreen({ navigation }) {
  const { users, addUser, updateUser, deleteUser, reload } = useApp();
  const { logout } = useAuth();
  const [q, setQ]       = useState('');
  const [form, setForm] = useState({ ...EF });
  const [edit, setEdit] = useState(null);
  const [show, setShow] = useState(false);
  const [delId, setDelId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState('');
  const [busy, setBusy] = useState(false);

  const list = users.filter(u =>
    !q ||
    u.name.toLowerCase().includes(q.toLowerCase()) ||
    u.email.toLowerCase().includes(q.toLowerCase()) ||
    (u.role||'').toLowerCase().includes(q.toLowerCase())
  );

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

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScreenHeader
        title="Users"
        currentRoute="Users"
        onNavigate={n => navigation.navigate(n)}
        onLogout={logout}
      />

      <View style={s.bar}>
        <Search value={q} onChange={setQ} placeholder="Search users..." />
        <TouchableOpacity style={[s.addBtn, { backgroundColor: C.blue }]} onPress={openAdd} activeOpacity={0.8}>
          <Ionicons name="person-add" size={16} color="#fff" />
          <Text style={s.addTxt}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={busy} onRefresh={onRefresh} tintColor={C.blue} />}>

        <Text style={s.count}>{list.length} user{list.length !== 1 ? 's' : ''}</Text>

        <View style={s.tableWrap}>
          <View style={s.thead}>
            <Text style={[s.th, { flex: 2 }]}>NAME / EMAIL</Text>
            <Text style={[s.th, { width: 54 }]}>ROLE</Text>
            <Text style={[s.th, { width: 64 }]}>STATUS</Text>
            <Text style={[s.th, { width: 60, textAlign: 'right' }]}>ACT</Text>
          </View>
          {list.map((u, idx) => (
            <View key={String(u.id)} style={[s.trow, idx % 2 === 1 && s.zebra]}>
              <View style={{ flex: 2 }}>
                <Text style={s.tdBold} numberOfLines={1}>{u.name}</Text>
                <Text style={s.tdSub}  numberOfLines={1}>{u.email}</Text>
              </View>
              <View style={{ width: 54 }}><Badge label={u.role} variant={u.role === 'Admin' ? 'danger' : 'info'} /></View>
              <View style={{ width: 64 }}><Badge label={u.status} variant={u.status === 'Active' ? 'success' : 'warning'} /></View>
              <View style={{ width: 60, flexDirection: 'row', justifyContent: 'flex-end', gap: 5 }}>
                <EditBtn   onPress={() => openEdit(u)}    />
                <DeleteBtn onPress={() => setDelId(u.id)} />
              </View>
            </View>
          ))}
        </View>
        {list.length === 0 && <Empty iconName="people-outline" title="No users found" />}
      </ScrollView>

      <FormModal visible={show} title={edit ? 'Edit User' : 'Add User'} onClose={() => setShow(false)} onSave={save} saving={saving}>
        <FInput label="Full Name *"  value={form.name}        onChange={v => set('name', v)}     req />
        <FPick  label="Role"         value={form.role}        opts={['Admin','Staff']}            onChange={v => set('role', v)} />
        <FPick  label="Status"       value={form.status}      opts={['Active','Inactive']}        onChange={v => set('status', v)} />
        <FInput label="Email *"      value={form.email}       onChange={v => set('email', v)}    placeholder="user@kauswagan.gov.ph" req />
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
  bar:       { flexDirection: 'row', gap: 10, padding: 12, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  addBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 8, paddingHorizontal: 14, height: 42 },
  addTxt:    { color: '#fff', fontWeight: '700', fontSize: 13 },
  count:     { fontSize: 11, color: C.t3, paddingHorizontal: 14, paddingVertical: 8 },
  tableWrap: { marginHorizontal: 12, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  thead:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, backgroundColor: C.el },
  th:        { fontSize: 9, fontWeight: '700', color: C.t3, letterSpacing: 0.4 },
  trow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10, borderTopWidth: 1, borderTopColor: C.border, gap: 6 },
  zebra:     { backgroundColor: 'rgba(255,255,255,0.02)' },
  tdBold:    { fontSize: 12, fontWeight: '600', color: C.t1 },
  tdSub:     { fontSize: 10, color: C.t3, marginTop: 1 },
  errBox:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.red + '18', borderRadius: 8, padding: 10, marginTop: 8, borderWidth: 1, borderColor: C.red + '44' },
  errTxt:    { color: C.red, fontSize: 12, fontWeight: '600' },
});
