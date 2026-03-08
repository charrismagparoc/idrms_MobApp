import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DropFilter, Empty, Search, SecHdr } from '../components/Shared';
import { ScreenHeader } from '../components/ScreenHeader';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { C } from '../styles/colors';

const TYPE_ICON = {
  Alert:      { icon: 'megaphone',       color: C.red    },
  Incident:   { icon: 'warning',         color: C.orange },
  Evacuation: { icon: 'location',        color: C.green  },
  Resource:   { icon: 'cube',            color: C.blue   },
  Resident:   { icon: 'person',          color: C.purple },
  User:       { icon: 'person-circle',   color: C.t2     },
  Auth:       { icon: 'log-in',          color: C.blue   },
  System:     { icon: 'settings',        color: C.t2     },
};

export default function ActivityLogScreen({ navigation }) {
  const { activityLog, reload } = useApp();
  const { logout } = useAuth();
  const [q, setQ]                 = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [busy, setBusy]           = useState(false);

  useEffect(() => { setBusy(true); reload().finally(() => setBusy(false)); }, []);

  const types    = ['All', ...new Set(activityLog.map(l => l.type).filter(Boolean))];
  const filtered = activityLog.filter(l =>
    (!q || (l.action||'').toLowerCase().includes(q.toLowerCase()) || (l.userName||'').toLowerCase().includes(q.toLowerCase())) &&
    (typeFilter === 'All' || l.type === typeFilter)
  );

  async function onRefresh() { setBusy(true); await reload(); setBusy(false); }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScreenHeader
        title="Activity Log"
        currentRoute="ActivityLog"
        onNavigate={n => navigation.navigate(n)}
        onLogout={logout}
      />

      <View style={s.bar}>
        <Search value={q} onChange={setQ} placeholder="Search action, user..." />
      </View>

      <View style={s.filterRow}>
        <DropFilter label="Type" value={typeFilter} opts={types} onSelect={setTypeFilter} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={busy} onRefresh={onRefresh} tintColor={C.blue} />}>

        <View style={s.meta}>
          <SecHdr title="Audit Trail" count={activityLog.length} />
          <Text style={s.count}>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</Text>
        </View>

        <View style={s.tableWrap}>
          <View style={s.thead}>
            <Text style={[s.th, { width: 30 }]}></Text>
            <Text style={[s.th, { flex: 3 }]}>ACTION</Text>
            <Text style={[s.th, { width: 66 }]}>TYPE</Text>
            <Text style={[s.th, { width: 60 }]}>USER</Text>
            <Text style={[s.th, { width: 52, textAlign: 'right' }]}>DATE</Text>
          </View>
          {filtered.map((log, i) => {
            const cfg = TYPE_ICON[log.type] || TYPE_ICON.System;
            return (
              <View key={log.id || i} style={[s.trow, i % 2 === 1 && s.zebra]}>
                <View style={[s.iconCircle, { backgroundColor: cfg.color + '20', width: 30 }]}>
                  <Ionicons name={cfg.icon} size={13} color={cfg.color} />
                </View>
                <View style={{ flex: 3, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  {log.urgent && <Ionicons name="alert-circle" size={10} color={C.red} />}
                  <Text style={s.td} numberOfLines={2}>{log.action || '—'}</Text>
                </View>
                <View style={{ width: 66 }}>
                  <View style={[s.typeBadge, { backgroundColor: cfg.color + '20' }]}>
                    <Text style={[s.typeTxt, { color: cfg.color }]}>{log.type || 'System'}</Text>
                  </View>
                </View>
                <Text style={[s.tdSub, { width: 60 }]} numberOfLines={1}>{log.userName || 'System'}</Text>
                <Text style={[s.tdSub, { width: 52, textAlign: 'right' }]}>
                  {log.createdAt ? new Date(log.createdAt).toLocaleDateString('en-PH',{ month:'short', day:'numeric' }) : '—'}
                </Text>
              </View>
            );
          })}
        </View>
        {filtered.length === 0 && !busy &&
          <Empty iconName="list-outline" title={activityLog.length === 0 ? 'No activity yet' : 'No matching records'} />}
      </ScrollView>
      </View>
  );
}

const s = StyleSheet.create({
  bar:        { padding: 12, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  filterRow:  { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  meta:       { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 2 },
  count:      { fontSize: 11, color: C.t3, marginBottom: 6 },
  tableWrap:  { marginHorizontal: 12, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  thead:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, backgroundColor: C.el },
  th:         { fontSize: 9, fontWeight: '700', color: C.t3, letterSpacing: 0.4 },
  trow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10, borderTopWidth: 1, borderTopColor: C.border, gap: 4 },
  zebra:      { backgroundColor: 'rgba(255,255,255,0.02)' },
  iconCircle: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  td:         { fontSize: 12, color: C.t1, flex: 1 },
  tdSub:      { fontSize: 10, color: C.t3 },
  typeBadge:  { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  typeTxt:    { fontSize: 9, fontWeight: '700' },
});
