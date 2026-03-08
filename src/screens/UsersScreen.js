import { useState } from 'react';
import { RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Badge, Confirm, Empty, FInput, FormModal, FPick } from '../components/Shared';
import { Sidebar } from '../components/Sidebar';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { C } from '../styles/colors';
import { styles } from '../styles/usersScreenStyles';

const ROLE_CLS = { Admin: C.red, Staff: C.blue };
const STATUS_CLS = { Active: C.green, Inactive: C.orange };
const EF = { name: '', role: 'Staff', email: '', status: 'Active', password: '' };

export default function UsersScreen({ navigation }) {
  const { users, addUser, updateUser, deleteUser, reload } = useApp();
  const { logout } = useAuth();
  const [q, setQ] = useState('');
  const [form, setForm] = useState({ ...EF });
  const [edit, setEdit] = useState(null);
  const [show, setShow] = useState(false);
  const [delId, setDelId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [saveErr, setSaveErr] = useState('');

  const list = users.filter(u => !q || (u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase()) ||
    (u.role && u.role.toLowerCase().includes(q.toLowerCase())) ||
    (u.status && u.status.toLowerCase().includes(q.toLowerCase()))
  ));

  function openAdd() {
    setForm({ ...EF });
    setEdit(null);
    setSaveErr('');
    setShow(true);
  }

  function openEdit(u) {
    setForm({ ...u, password: '' });
    setEdit(u);
    setSaveErr('');
    setShow(true);
  }

  function set(k, v) {
    setForm(p => ({ ...p, [k]: v }));
  }

  async function save() {
    if (!form.name.trim()) {
      setSaveErr('Full name is required.');
      return;
    }
    if (!form.email.trim()) {
      setSaveErr('Email is required.');
      return;
    }
    if (!edit && !form.password.trim()) {
      setSaveErr('Password is required for new users.');
      return;
    }
    setSaveErr('');
    setSaving(true);
    try {
      if (edit) await updateUser(edit.id, form);
      else await addUser(form);
      setShow(false);
    } catch (e) {
      setSaveErr(e.message || 'Error saving user');
    }
    setSaving(false);
  }

  async function onRefresh() {
    setBusy(true);
    await reload();
    setBusy(false);
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* HEADER */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.hamburger}>
          <Text style={styles.hamburgerText}>☰</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>Users</Text>
          <Text style={styles.headerSub} numberOfLines={2}>Manage system accounts</Text>
        </View>
        <TouchableOpacity style={styles.headerBtn} onPress={openAdd}>
          <Text style={styles.headerBtnTxt}>Add Users</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search users by name, email, role..."
            placeholderTextColor={C.t3}
            value={q}
            onChangeText={setQ}
          />
          {q && (
            <TouchableOpacity 
              style={styles.clearBtn}
              onPress={() => setQ('')}
            >
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={busy} onRefresh={onRefresh} tintColor={C.blue} />}>
        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {list.length} {list.length === 1 ? 'user' : 'users'} found
            {q && ` matching "${q}"`}
          </Text>
        </View>

        {list.map(u => (
          <View key={String(u.id)} style={styles.card}>
            <View style={styles.top}>
              <View style={[styles.avatar, { backgroundColor: ROLE_CLS[u.role] || C.blue }]}>
                <Text style={styles.avatarTxt}>{(u.name || 'U')[0].toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{u.name}</Text>
                <Text style={styles.email}>{u.email}</Text>
              </View>
              <TouchableOpacity onPress={() => openEdit(u)} style={styles.iBtn}>
                <Text>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setDelId(u.id)} style={styles.iBtn}>
                <Text>🗑️</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.meta}>
              <Badge label={u.role} variant={u.role === 'Admin' ? 'danger' : 'info'} />
              <Badge label={u.status} variant={u.status === 'Active' ? 'success' : 'warning'} />
            </View>

            {u.lastLogin && (
              <Text style={styles.lastLogin}>
                Last login: {new Date(u.lastLogin).toLocaleString()}
              </Text>
            )}
          </View>
        ))}

        {list.length === 0 && <Empty emoji="👥" title="No users found" />}
        <View style={{ height: 24 }} />
      </ScrollView>

      <FormModal
        visible={show}
        title={edit ? 'Edit User' : 'Add User'}
        onClose={() => setShow(false)}
        onSave={save}
        saving={saving}
      >
        <FInput label="Full Name *" value={form.name} onChange={v => set('name', v)} req />
        <FPick label="Role" value={form.role} opts={['Admin', 'Staff']} onChange={v => set('role', v)} />
        <FPick label="Status" value={form.status} opts={['Active', 'Inactive']} onChange={v => set('status', v)} />
        <FInput label="Email Address *" value={form.email} onChange={v => set('email', v)} placeholder="user@kauswagan.gov.ph" req />
        <FInput
          label={'Password ' + (edit ? '(leave blank to keep current)' : '*')}
          value={form.password || ''}
          onChange={v => set('password', v)}
          placeholder="Password..."
          type="password"
          req={!edit}
        />
        {saveErr && (
          <View style={styles.errBox}>
            <Text style={styles.errTxt}>{saveErr}</Text>
          </View>
        )}
      </FormModal>

      <Confirm
        visible={!!delId}
        title="Delete User"
        msg="Remove this user account permanently?"
        onOk={async () => {
          await deleteUser(delId);
          setDelId(null);
        }}
        onNo={() => setDelId(null)}
      />

      {/* SIDEBAR */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentRoute="Users"
        onNavigate={(screenName) => {
          navigation.navigate(screenName);
          setSidebarOpen(false);
        }}
        onLogout={() => {
          setSidebarOpen(false);
          logout();
        }}
        userName="User"
      />
    </View>
  );
}