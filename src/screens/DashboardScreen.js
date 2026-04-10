import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge, Bar, SecHdr } from '../components/Shared';
import { useApp } from '../context/AppContext';
import { useRisk } from '../hooks/useRisk';
import { useWeather } from '../hooks/useWeather';
import { C, TYPE_COLOR } from '../styles/colors';

function KPI({ value, label, color, iconName }) {
  return (
    <View style={[k.card, { borderColor: (color || C.blue) + '33' }]}>
      <Ionicons name={iconName} size={16} color={color || C.blue} style={{ marginBottom: 4 }} />
      <Text style={[k.val, { color: color || C.blue }]}>{value ?? 0}</Text>
      <Text style={k.lbl}>{label}</Text>
    </View>
  );
}

const k = StyleSheet.create({
  card: { flex: 1, backgroundColor: C.card, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 6, alignItems: 'center', borderWidth: 1, minWidth: 68 },
  val:  { fontSize: 18, fontWeight: '800', lineHeight: 22 },
  lbl:  { fontSize: 8, color: C.t3, textAlign: 'center', marginTop: 3, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
});

const RISK_C = { High: C.red, Medium: C.orange, Low: C.green };

export default function DashboardScreen({ navigation, onNavigate }) {
  const insets = useSafeAreaInsets();
  const { incidents, alerts, evacCenters, residents, activityLog, resources, reload } = useApp();
  const w = useWeather();
  const { zoneRisks, highCount, medCount, lowCount, overallScore } = useRisk(residents, incidents, w);
  const [busy, setBusy] = useState(false);

  const activeInc     = incidents.filter(i => ['Active', 'Pending'].includes(i.status));
  const totalOcc      = evacCenters.reduce((a, c) => a + (c.occupancy || 0), 0);
  const totalCap      = evacCenters.reduce((a, c) => a + (c.capacity || 0), 0);
  const oc = overallScore >= 70 ? C.red : overallScore >= 40 ? C.orange : C.green;
  const ol = overallScore >= 70 ? 'HIGH RISK' : overallScore >= 40 ? 'MEDIUM RISK' : 'LOW RISK';

  // Resource stats
  const totalItems    = (resources || []).length;
  const totalAvail    = (resources || []).filter(r => r.status === 'Available').length;
  const lowStockCount = (resources || []).filter(r => r.status === 'Low Stock' || (r.quantity > 0 && (r.available / r.quantity) < 0.2)).length;
  const depletedCount = (resources || []).filter(r => r.available === 0 || r.status === 'Depleted').length;

  async function onRefresh() { setBusy(true); await reload(); setBusy(false); }
  const nav = (screen) => {
    if (onNavigate) onNavigate(screen);
    else navigation.navigate(screen);
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Top Bar */}
      <View style={[s.topBar, { paddingTop: insets.top + 13 }]}>
        <View style={s.logoRow}>
          <Ionicons name="shield-checkmark" size={20} color={C.blue} />
          <Text style={s.title}>Dashboard</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.pad}
        refreshControl={<RefreshControl refreshing={busy} onRefresh={onRefresh} tintColor={C.blue} />}>

        {/* Weather row */}
        <View style={s.topRow}>
          <View>
            <Text style={s.appName}>IDRMS</Text>
            <Text style={s.appSub}>Brgy. Kauswagan · BDRRMC</Text>
          </View>
          <View style={[s.weatherChip, { borderColor: (RISK_C[w.risk] || C.green) + '55' }]}>
            <Ionicons name="partly-sunny-outline" size={14} color={RISK_C[w.risk] || C.green} />
            <Text style={s.weatherTxt}>{w.temp}°C  {w.windKph}km/h</Text>
            <View style={[s.rPill, { backgroundColor: (RISK_C[w.risk] || C.green) + '22' }]}>
              <Text style={[s.rPillTxt, { color: RISK_C[w.risk] || C.green }]}>{w.risk}</Text>
            </View>
          </View>
        </View>

        {/* Risk banner */}
        <View style={[s.banner, { borderColor: oc + '55', backgroundColor: oc + '11' }]}>
          <View>
            <Text style={s.bannerLbl}>OVERALL RISK LEVEL</Text>
            <Text style={[s.bannerVal, { color: oc }]}>{ol}  —  Score {overallScore}</Text>
          </View>
          <Ionicons name="shield-outline" size={28} color={oc} />
        </View>

        {/* KPI grid — Row 1 */}
        <View style={s.row}>
          <KPI value={incidents.length}                                  label="Total Inc."  color={C.orange} iconName="warning-outline"        />
          <KPI value={activeInc.length}                                  label="Active"      color={C.red}    iconName="alert-circle-outline"    />
          <KPI value={incidents.filter(i=>i.status==='Resolved').length} label="Resolved"    color={C.green}  iconName="checkmark-circle-outline" />
          <KPI value={alerts.length}                                     label="Alerts"      color={C.blue}   iconName="megaphone-outline"        />
        </View>

        {/* KPI grid — Row 2 */}
        <View style={[s.row, { marginTop: 0 }]}>
          <KPI value={evacCenters.filter(c=>c.status==='Open').length}   label="Open Ctrs"   color={C.green}  iconName="location-outline"  />
          <KPI value={totalOcc}                                          label="Evacuees"    color={C.purple} iconName="people-outline"    />
          <KPI value={totalCap - totalOcc}                               label="Remaining"   color={C.orange} iconName="swap-horizontal"   />
          <KPI value={highCount}                                         label="High Risk"   color={C.red}    iconName="flame-outline"     />
          <KPI value={residents.length}                                  label="Residents"   color={C.blue}   iconName="person-outline"    />
        </View>

        {/* Resource Availability */}
        <View style={s.section}>
          <SecHdr title="Resource Availability" right="View All" onRight={() => nav('Resources')} />
          <View style={s.resGrid}>

            {/* Total Items */}
            <View style={[s.resCard, { borderColor: C.blue + '33' }]}>
              <View style={s.resCardTop}>
                <Ionicons name="cube-outline" size={15} color={C.blue} />
                <Text style={[s.resVal, { color: C.blue }]}>{totalItems}</Text>
              </View>
              <Text style={s.resLbl}>Total Items</Text>
              <Bar value={totalItems} max={totalItems || 1} height={5} color={C.blue} />
            </View>

            {/* Available */}
            <View style={[s.resCard, { borderColor: C.green + '33' }]}>
              <View style={s.resCardTop}>
                <Ionicons name="checkmark-circle-outline" size={15} color={C.green} />
                <Text style={[s.resVal, { color: C.green }]}>{totalAvail}</Text>
              </View>
              <Text style={s.resLbl}>Available</Text>
              <Bar value={totalAvail} max={totalItems || 1} height={5} color={C.green} />
            </View>

            {/* Low Stock */}
            <View style={[s.resCard, { borderColor: (lowStockCount > 0 ? C.red : C.t3) + '33' }]}>
              <View style={s.resCardTop}>
                <Ionicons name="warning-outline" size={15} color={lowStockCount > 0 ? C.red : C.t3} />
                <Text style={[s.resVal, { color: lowStockCount > 0 ? C.red : C.t3 }]}>{lowStockCount}</Text>
              </View>
              <Text style={s.resLbl}>Low Stock</Text>
              <Bar value={lowStockCount} max={totalItems || 1} height={5} color={lowStockCount > 0 ? C.red : C.t3} />
            </View>

          </View>

          {/* Depleted warning row */}
          {depletedCount > 0 && (
            <View style={s.depletedRow}>
              <Ionicons name="alert-circle" size={13} color="#fff" />
              <Text style={s.depletedTxt}>
                {depletedCount} resource{depletedCount > 1 ? 's' : ''} fully depleted — restock needed
              </Text>
            </View>
          )}
        </View>

        {/* Active Incidents table */}
        <View style={s.section}>
          <SecHdr title="Active Incidents" count={activeInc.length} right="View All" onRight={() => nav('Incidents')} />
          {activeInc.length === 0
            ? <Text style={s.empty}>All clear — no active incidents</Text>
            : (
              <View style={s.tableWrap}>
                <View style={s.thead}>
                  <Text style={[s.th, { flex: 2 }]}>TYPE / ZONE</Text>
                  <Text style={[s.th, { flex: 1.5 }]}>LOCATION</Text>
                  <Text style={[s.th, { width: 64, textAlign: 'right' }]}>SEVERITY</Text>
                </View>
                {activeInc.slice(0, 8).map((i, idx) => (
                  <View key={String(i.id)} style={[s.trow, idx % 2 === 1 && s.zebra]}>
                    <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                      <View style={[s.dot, { backgroundColor: TYPE_COLOR[i.type] || C.blue }]} />
                      <Text style={s.td} numberOfLines={1}>{i.type} — {i.zone}</Text>
                    </View>
                    <Text style={[s.td, { flex: 1.5 }]} numberOfLines={1}>{i.location || '—'}</Text>
                    <View style={{ width: 64, alignItems: 'flex-end' }}>
                      <Badge label={i.severity} variant={i.severity} />
                    </View>
                  </View>
                ))}
              </View>
            )}
        </View>

        {/* Zone Risk table */}
        <View style={s.section}>
          <SecHdr title="Zone Risk Levels" right="Details" onRight={() => nav('Risk')} />
          <View style={s.tableWrap}>
            <View style={s.thead}>
              <Text style={[s.th, { width: 54 }]}>ZONE</Text>
              <Text style={[s.th, { flex: 1, paddingHorizontal: 6 }]}>SCORE</Text>
              <Text style={[s.th, { width: 66, textAlign: 'right' }]}>LEVEL</Text>
            </View>
            {zoneRisks.map((z, idx) => (
              <View key={z.zone} style={[s.trow, idx % 2 === 1 && s.zebra]}>
                <Text style={[s.tdBold, { width: 54 }]}>{z.zone}</Text>
                <View style={{ flex: 1, paddingHorizontal: 6 }}>
                  <Bar value={z.score} max={100} height={6} color={z.riskColor} />
                  <Text style={[s.scoreVal, { color: z.riskColor }]}>{z.score}</Text>
                </View>
                <View style={{ width: 66, alignItems: 'flex-end' }}>
                  <Badge label={z.riskLabel} variant={z.riskLabel} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={s.section}>
          <SecHdr title="Recent Activity" right="View All" onRight={() => nav('ActivityLog')} />
          <View style={s.tableWrap}>
            <View style={s.thead}>
              <Text style={[s.th, { flex: 3 }]}>ACTION</Text>
              <Text style={[s.th, { flex: 1, textAlign: 'right' }]}>USER</Text>
            </View>
            {activityLog.slice(0, 8).map((a, idx) => (
              <View key={String(a.id)} style={[s.trow, idx % 2 === 1 && s.zebra]}>
                <View style={{ flex: 3, flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                  <Ionicons name={a.urgent ? 'alert-circle' : 'ellipse'} size={8} color={a.urgent ? C.red : C.blue} />
                  <Text style={s.td} numberOfLines={1}>{a.action}</Text>
                </View>
                <Text style={[s.td, { flex: 1, textAlign: 'right', color: C.t3, fontSize: 10 }]} numberOfLines={1}>{a.userName}</Text>
              </View>
            ))}
            {activityLog.length === 0 && <Text style={s.empty}>No activity yet</Text>}
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  pad:         { padding: 12 },
  topBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 16, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  logoRow:     { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title:       { fontSize: 17, fontWeight: '800', color: C.t1 },
  topRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  appName:     { fontSize: 20, fontWeight: '800', color: C.t1 },
  appSub:      { fontSize: 10, color: C.t3, marginTop: 2, fontWeight: '600' },
  weatherChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.el, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1 },
  weatherTxt:  { fontSize: 11, color: C.t1, fontWeight: '600' },
  rPill:       { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  rPillTxt:    { fontSize: 9, fontWeight: '800' },
  banner:      { borderRadius: 10, borderWidth: 1.5, padding: 13, marginBottom: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bannerLbl:   { fontSize: 9, color: C.t3, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  bannerVal:   { fontSize: 15, fontWeight: '800' },
  row:         { flexDirection: 'row', gap: 6, marginBottom: 6 },
  section:     { backgroundColor: C.card, borderRadius: 10, padding: 13, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  empty:       { color: C.t3, fontSize: 12, textAlign: 'center', paddingVertical: 10 },
  tableWrap:   { borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  thead:       { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 10, backgroundColor: C.el },
  th:          { fontSize: 9, fontWeight: '700', color: C.t3, letterSpacing: 0.4 },
  trow:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 10, borderTopWidth: 1, borderTopColor: C.border },
  zebra:       { backgroundColor: 'rgba(255,255,255,0.02)' },
  td:          { fontSize: 12, color: C.t1 },
  tdBold:      { fontSize: 12, fontWeight: '700', color: C.t2 },
  dot:         { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
  scoreVal:    { fontSize: 10, fontWeight: '700', marginTop: 3 },
  // Resource Availability
  resGrid:     { flexDirection: 'row', gap: 8, marginTop: 6 },
  resCard:     { flex: 1, backgroundColor: C.bg, borderRadius: 10, padding: 10, borderWidth: 1 },
  resCardTop:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  resVal:      { fontSize: 16, fontWeight: '800' },
  resLbl:      { fontSize: 9, color: C.t3, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 },
  depletedRow: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: C.red, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginTop: 10 },
  depletedTxt: { color: '#fff', fontSize: 11, fontWeight: '700', flex: 1 },
});