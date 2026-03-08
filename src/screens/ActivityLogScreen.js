import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Chips, Empty, SecHdr } from '../components/Shared';
import { Sidebar } from '../components/Sidebar';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { styles } from '../styles/activityLogScreenStyles';
import { C } from '../styles/colors';

const TYPE_CLS = {
  Alert: C.red,
  Incident: C.orange,
  Evacuation: C.green,
  Resource: C.blue,
  Resident: C.purple,
  User: C.t2,
  Auth: C.blue,
  System: C.t2,
};

export default function ActivityLogScreen({ navigation }) {
  const { activityLog, reload } = useApp();
  const { logout } = useAuth();
  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [busy, setBusy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setBusy(true);
    reload().finally(() => setBusy(false));
  }, []);

  const types = ['All', ...new Set(activityLog.map(l => l.type).filter(Boolean))];

  const filtered = activityLog.filter(l => {
    const matchSearch = !q || (
      (l.action || '').toLowerCase().includes(q.toLowerCase()) || 
      (l.userName || '').toLowerCase().includes(q.toLowerCase()) ||
      (l.createdAt && new Date(l.createdAt).toLocaleDateString('en-PH').includes(q)) ||
      (l.createdAt && new Date(l.createdAt).toLocaleString('en-PH', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }).includes(q))
    );
    const matchType = typeFilter === 'All' || l.type === typeFilter;
    return matchSearch && matchType;
  });

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
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>Activity Log</Text>
          <Text style={styles.headerSub} numberOfLines={2}>Complete audit trail</Text>
        </View>
      </View>

      <View style={styles.searchBar}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search action, user, or date (e.g. Mar 7)..."
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

      <View style={styles.fbar}>
        <Chips opts={types} val={typeFilter} onSelect={setTypeFilter} />
      </View>

      <ScrollView contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={busy} onRefresh={onRefresh} tintColor={C.blue} />}>
        <View style={styles.info}>
          <SecHdr title="Audit Trail" count={activityLog.length} />
          <Text style={styles.countText}>
            {filtered.length} record{filtered.length !== 1 ? 's' : ''} found
            {q && ` matching "${q}"`}
            {typeFilter !== 'All' && ` · Type: ${typeFilter}`}
          </Text>
          {q && /^\d{1,2}/.test(q) && (
            <Text style={styles.hintText}>💡 Searching by date: Try "Mar 7" or "2024-03-07"</Text>
          )}
        </View>

        {filtered.map((log, i) => (
          <View key={log.id || i} style={styles.card}>
            <View style={styles.top}>
              <View style={[styles.avatar, { backgroundColor: TYPE_CLS[log.type] || C.t2 }]}>
                <Text style={styles.avatarTxt}>{(log.userName || 'S')[0].toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.action}>{log.action || '—'}</Text>
                <View style={styles.meta}>
                  <View style={[styles.badge, { backgroundColor: TYPE_CLS[log.type] + '22' }]}>
                    <Text style={[styles.badgeTxt, { color: TYPE_CLS[log.type] }]}>{log.type || 'System'}</Text>
                  </View>
                  <Text style={styles.user}>{log.userName || 'System'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.bottom}>
              <Text style={styles.timestamp}>
                {log.createdAt
                  ? new Date(log.createdAt).toLocaleDateString('en-PH', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—'}
              </Text>
              {log.urgent && <Text style={styles.urgent}>⚠️ Urgent</Text>}
            </View>
          </View>
        ))}

        {filtered.length === 0 && !busy && (
          <Empty
            emoji="📋"
            title={activityLog.length === 0 ? 'No activity yet' : 'No matching records'}
          />
        )}
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* SIDEBAR */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentRoute="ActivityLog"
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