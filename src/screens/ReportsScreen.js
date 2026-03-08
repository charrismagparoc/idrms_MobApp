import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Badge, Bar, SecHdr } from '../components/Shared';
import { ScreenHeader } from '../components/ScreenHeader';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { TYPES } from '../data/constants';
import { useRisk } from '../hooks/useRisk';
import { useWeather } from '../hooks/useWeather';
import { C, TYPE_COLOR } from '../styles/colors';

function KPI({ value, label, color, iconName }) {
  return (
    <View style={[k.card, { borderColor: (color||C.blue)+'33' }]}>
      <Ionicons name={iconName} size={15} color={color||C.blue} style={{ marginBottom: 3 }} />
      <Text style={[k.val, { color: color||C.blue }]}>{value ?? 0}</Text>
      <Text style={k.lbl}>{label}</Text>
    </View>
  );
}
const k = StyleSheet.create({
  card: { flex: 1, backgroundColor: C.card, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 6, alignItems: 'center', borderWidth: 1, minWidth: 80 },
  val:  { fontSize: 18, fontWeight: '800' },
  lbl:  { fontSize: 8, color: C.t3, textAlign: 'center', marginTop: 2, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
});

export default function ReportsScreen({ navigation }) {
  const { incidents, alerts, evacCenters, residents } = useApp();
  const { logout } = useAuth();
  const w = useWeather();
  const { zoneRisks } = useRisk(residents, incidents, w);

  const active  = incidents.filter(i => ['Active','Pending'].includes(i.status));
  const totOcc  = evacCenters.reduce((a,c) => a + (c.occupancy||0), 0);
  const totCap  = evacCenters.reduce((a,c) => a + (c.capacity||0), 0);
  const pctOcc  = totCap > 0 ? Math.round(totOcc / totCap * 100) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScreenHeader
        title="Reports"
        currentRoute="Reports"
        onNavigate={n => navigation.navigate(n)}
        onLogout={logout}
      />

      <ScrollView contentContainerStyle={s.pad}>
        <Text style={s.pageTitle}>Reports & Analytics</Text>
        <Text style={s.pageSub}>Live overview — Barangay Kauswagan</Text>

        <View style={s.row}>
          <KPI value={incidents.length} label="Total Inc."  color={C.orange} iconName="warning-outline"       />
          <KPI value={active.length}    label="Active"      color={C.red}    iconName="alert-circle-outline"  />
          <KPI value={incidents.filter(i=>i.status==='Resolved').length} label="Resolved" color={C.green} iconName="checkmark-circle-outline" />
        </View>
        <View style={[s.row, { marginTop: 0 }]}>
          <KPI value={residents.length} label="Residents"   color={C.purple} iconName="people-outline"        />
          <KPI value={pctOcc + '%'}     label="Evac Occ."   color={C.blue}   iconName="location-outline"      />
          <KPI value={alerts.length}    label="Alerts"      color={C.yellow} iconName="megaphone-outline"     />
        </View>

        {/* Incidents by Type */}
        <View style={s.section}>
          <SecHdr title="Incidents by Type" />
          <View style={s.tableWrap}>
            <View style={s.thead}>
              <Text style={[s.th, { width: 90 }]}>TYPE</Text>
              <Text style={[s.th, { flex: 1, paddingHorizontal: 8 }]}>DISTRIBUTION</Text>
              <Text style={[s.th, { width: 30, textAlign: 'right' }]}>CNT</Text>
            </View>
            {TYPES.map((type, idx) => {
              const cnt = incidents.filter(i => i.type === type).length;
              const pct = incidents.length > 0 ? Math.round(cnt / incidents.length * 100) : 0;
              const c   = TYPE_COLOR[type] || C.blue;
              return (
                <View key={type} style={[s.trow, idx % 2 === 1 && s.zebra]}>
                  <View style={{ width: 90, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={[s.dot, { backgroundColor: c }]} />
                    <Text style={s.tdBold}>{type}</Text>
                  </View>
                  <View style={{ flex: 1, paddingHorizontal: 8 }}>
                    <Bar value={pct} max={100} height={6} color={c} />
                  </View>
                  <Text style={[s.tdBold, { width: 30, textAlign: 'right', color: c }]}>{cnt}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Zone Risk */}
        <View style={s.section}>
          <SecHdr title="Zone Risk Summary" />
          <View style={s.tableWrap}>
            <View style={s.thead}>
              <Text style={[s.th, { flex: 1.5 }]}>ZONE</Text>
              <Text style={[s.th, { flex: 1 }]}>LEVEL</Text>
              <Text style={[s.th, { flex: 1 }]}>HAZARD</Text>
              <Text style={[s.th, { width: 34, textAlign: 'right' }]}>INC</Text>
            </View>
            {zoneRisks.map((z, idx) => {
              const zi = incidents.filter(i => i.zone === z.zone).length;
              return (
                <View key={z.zone} style={[s.trow, idx % 2 === 1 && s.zebra]}>
                  <Text style={[s.tdBold, { flex: 1.5 }]}>{z.zone}</Text>
                  <View style={{ flex: 1 }}><Badge label={z.riskLabel} variant={z.riskLabel} /></View>
                  <Text style={[s.td, { flex: 1 }]}>{z.mainHazard}</Text>
                  <Text style={[s.tdBold, { width: 34, textAlign: 'right', color: zi > 0 ? C.orange : C.t3 }]}>{zi}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Evac Centers */}
        <View style={s.section}>
          <SecHdr title="Evacuation Centers" count={evacCenters.length} />
          <View style={s.tableWrap}>
            <View style={s.thead}>
              <Text style={[s.th, { flex: 2 }]}>CENTER</Text>
              <Text style={[s.th, { flex: 1.2 }]}>OCCUPANCY</Text>
              <Text style={[s.th, { width: 54 }]}>STATUS</Text>
            </View>
            {evacCenters.slice(0,8).map((c, idx) => (
              <View key={String(c.id)} style={[s.trow, idx % 2 === 1 && s.zebra]}>
                <View style={{ flex: 2 }}>
                  <Text style={s.tdBold} numberOfLines={1}>{c.name}</Text>
                  <Text style={s.tdSub}>{c.zone}</Text>
                </View>
                <View style={{ flex: 1.2 }}>
                  <Text style={s.tdSub}>{c.occupancy}/{c.capacity}</Text>
                  <Bar value={c.occupancy} max={c.capacity} height={5} />
                </View>
                <View style={{ width: 54 }}><Badge label={c.status} variant={c.status} /></View>
              </View>
            ))}
            {evacCenters.length === 0 && <Text style={s.empty}>No centers</Text>}
          </View>
        </View>

        {/* Recent Alerts */}
        <View style={s.section}>
          <SecHdr title="Recent Alerts" count={alerts.length} />
          <View style={s.tableWrap}>
            <View style={s.thead}>
              <Text style={[s.th, { width: 68 }]}>LEVEL</Text>
              <Text style={[s.th, { width: 68 }]}>ZONE</Text>
              <Text style={[s.th, { flex: 1 }]}>MESSAGE</Text>
            </View>
            {alerts.slice(0,6).map((a, idx) => (
              <View key={String(a.id)} style={[s.trow, idx % 2 === 1 && s.zebra]}>
                <View style={{ width: 68 }}><Badge label={a.level} variant={a.level} /></View>
                <Text style={[s.td, { width: 68 }]} numberOfLines={1}>{a.zone}</Text>
                <Text style={[s.td, { flex: 1  }]} numberOfLines={1}>{a.message}</Text>
              </View>
            ))}
            {alerts.length === 0 && <Text style={s.empty}>No alerts</Text>}
          </View>
        </View>
        <View style={{ height: 28 }} />
      </ScrollView>
      </View>
  );
}

const s = StyleSheet.create({
  pad:       { padding: 12 },
  pageTitle: { fontSize: 20, fontWeight: '800', color: C.t1 },
  pageSub:   { fontSize: 11, color: C.t3, marginTop: 2, marginBottom: 12 },
  row:       { flexDirection: 'row', gap: 6, marginBottom: 6 },
  section:   { backgroundColor: C.card, borderRadius: 10, padding: 13, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  tableWrap: { borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  thead:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, backgroundColor: C.el },
  th:        { fontSize: 9, fontWeight: '700', color: C.t3, letterSpacing: 0.4 },
  trow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 10, borderTopWidth: 1, borderTopColor: C.border, gap: 6 },
  zebra:     { backgroundColor: 'rgba(255,255,255,0.02)' },
  td:        { fontSize: 12, color: C.t1 },
  tdBold:    { fontSize: 12, fontWeight: '600', color: C.t1 },
  tdSub:     { fontSize: 10, color: C.t3, marginTop: 1 },
  dot:       { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
  empty:     { fontSize: 12, color: C.t3, textAlign: 'center', paddingVertical: 10 },
});
