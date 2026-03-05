import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useWeather } from '../hooks/useWeather';
import { useRisk } from '../hooks/useRisk';
import { C, TYPE_COLOR } from '../styles/colors';
import { Badge, SecHdr, Bar } from '../components/Shared';

function KCard({ emoji, value, label, color }) {
  return (
    <View style={[k.card, { borderColor: (color || C.blue) + '30' }]}>
      <Text style={k.emoji}>{emoji}</Text>
      <Text style={[k.val, { color: color || C.blue }]}>{value ?? 0}</Text>
      <Text style={k.lbl}>{label}</Text>
    </View>
  );
}
const k = StyleSheet.create({
  card:  { flex: 1, backgroundColor: C.card, borderRadius: 12, padding: 11, alignItems: 'center', borderWidth: 1, minWidth: 74 },
  emoji: { fontSize: 16, marginBottom: 3 },
  val:   { fontSize: 20, fontWeight: '800', lineHeight: 24 },
  lbl:   { fontSize: 8.5, color: C.t3, textAlign: 'center', marginTop: 2, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
});

const RISK_C = { High: C.red, Medium: C.orange, Low: C.green };

export default function DashboardScreen({ navigation }) {
  const { incidents, alerts, evacCenters, residents, activityLog, reload } = useApp();
  const { logout } = useAuth();
  const w = useWeather();
  const { zoneRisks, highCount, medCount, lowCount, overallScore } = useRisk(residents, incidents, w);
  const [busy, setBusy] = useState(false);

  const activeInc = incidents.filter(i => ['Active', 'Pending'].includes(i.status));
  const totalOcc  = evacCenters.reduce((a, c) => a + (c.occupancy || 0), 0);
  const oc  = overallScore >= 70 ? C.red : overallScore >= 40 ? C.orange : C.green;
  const ol  = overallScore >= 70 ? 'HIGH RISK' : overallScore >= 40 ? 'MEDIUM RISK' : 'LOW RISK';

  async function onRefresh() { setBusy(true); await reload(); setBusy(false); }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.pad} refreshControl={<RefreshControl refreshing={busy} onRefresh={onRefresh} tintColor={C.blue} />}>
      <View style={s.hdr}>
        <View>
          <Text style={s.appName}>IDRMS</Text>
          <Text style={s.appSub}>Brgy. Kauswagan · BDRRMC</Text>
        </View>
        <View style={s.hdrR}>
          <View style={[s.wchip, { borderColor: (RISK_C[w.risk] || C.green) + '44' }]}>
            <Text style={s.wTxt}>{w.emoji} {w.temp}°C  {w.windKph}km/h</Text>
            <View style={[s.rpill, { backgroundColor: (RISK_C[w.risk] || C.green) + '22' }]}>
              <Text style={[s.rpillTxt, { color: RISK_C[w.risk] || C.green }]}>{w.risk}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={logout}><Text style={s.logoutTxt}>Sign out</Text></TouchableOpacity>
        </View>
      </View>

      <View style={[s.banner, { borderColor: oc + '44', backgroundColor: oc + '11' }]}>
        <View>
          <Text style={s.bannerLbl}>Overall Risk Level</Text>
          <Text style={[s.bannerVal, { color: oc }]}>{ol}  —  Score {overallScore}</Text>
        </View>
        <View style={[s.dot, { backgroundColor: oc }]} />
      </View>

      <View style={s.row}><KCard emoji="⚠️" value={incidents.length}                                         label="Total Inc."  color={C.orange} />
        <KCard emoji="🔴" value={activeInc.length}                                                           label="Active"      color={C.red}    />
        <KCard emoji="✅" value={incidents.filter(i => i.status === 'Resolved').length}                      label="Resolved"    color={C.green}  />
        <KCard emoji="📢" value={alerts.length}                                                              label="Alerts"      color={C.blue}   /></View>
      <View style={[s.row, s.mt0]}><KCard emoji="🏠" value={evacCenters.filter(c => c.status === 'Open').length} label="Open Ctr."  color={C.green}  />
        <KCard emoji="👥" value={totalOcc}                                                                   label="Evacuees"    color={C.purple} />
        <KCard emoji="🔴" value={highCount}                                                                  label="High Risk"   color={C.red}    />
        <KCard emoji="👤" value={residents.length}                                                           label="Residents"   color={C.blue}   /></View>
      <View style={[s.row, s.mt0]}><KCard emoji="🚨" value={highCount}                                       label="High"        color={C.red}    />
        <KCard emoji="⚡" value={medCount}                                                                   label="Medium"      color={C.orange} />
        <KCard emoji="🟢" value={lowCount}                                                                   label="Low"         color={C.green}  />
        <KCard emoji="📢" value={alerts.filter(a => a.level === 'Danger').length}                            label="Danger Alts" color={C.red}    /></View>

      <View style={s.card}>
        <SecHdr title="Active Incidents" count={activeInc.length} right="All →" onRight={() => navigation.navigate('Incidents')} />
        {activeInc.length === 0
          ? <Text style={s.empty}>✅  All clear — no active incidents</Text>
          : activeInc.slice(0, 6).map(i => (
              <View key={String(i.id)} style={s.irow}>
                <View style={[s.idot, { backgroundColor: TYPE_COLOR[i.type] || C.blue }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.ititle}>{i.type} — {i.zone}</Text>
                  {i.location ? <Text style={s.isub}>{i.location}</Text> : null}
                </View>
                <Badge label={i.severity} variant={i.severity} />
              </View>
          ))}
      </View>

      <View style={s.card}>
        <SecHdr title="Zone Risk Levels" right="Details →" onRight={() => navigation.navigate('Risk')} />
        {zoneRisks.map(z => (
          <View key={z.zone} style={s.zrow}>
            <Text style={s.zname}>{z.zone}</Text>
            <View style={s.ztrack}><View style={[s.zfill, { width: z.score + '%', backgroundColor: z.riskColor }]} /></View>
            <Text style={[s.zscore, { color: z.riskColor }]}>{z.score}</Text>
            <View style={[s.rpill, { backgroundColor: z.riskColor + '22', marginLeft: 0 }]}>
              <Text style={[s.rpillTxt, { color: z.riskColor }]}>{z.riskLabel}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={s.card}>
        <SecHdr title="Recent Activity" />
        {activityLog.slice(0, 8).map(a => (
          <View key={String(a.id)} style={s.arow}>
            <View style={[s.adot, { backgroundColor: a.urgent ? C.red : C.blue }]} />
            <View style={{ flex: 1 }}>
              <Text style={s.atxt} numberOfLines={1}>{a.action}</Text>
              <Text style={s.ameta}>{a.userName}  ·  {new Date(a.createdAt).toLocaleTimeString()}</Text>
            </View>
          </View>
        ))}
        {activityLog.length === 0 && <Text style={s.empty}>No activity yet</Text>}
      </View>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  pad:    { padding: 14 },
  hdr:    { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 13 },
  appName:{ fontSize: 22, fontWeight: '800', color: C.t1 },
  appSub: { fontSize: 10, color: C.t3, marginTop: 2, fontWeight: '600' },
  hdrR:   { alignItems: 'flex-end', gap: 6 },
  wchip:  { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.el, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  wTxt:   { fontSize: 11, color: C.t1, fontWeight: '600' },
  rpill:  { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, marginLeft: 4 },
  rpillTxt:{ fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  logoutTxt: { fontSize: 11, color: C.t3 },
  banner: { borderRadius: 12, borderWidth: 1.5, padding: 13, marginBottom: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bannerLbl: { fontSize: 10, color: C.t3, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  bannerVal: { fontSize: 17, fontWeight: '800', marginTop: 2 },
  dot:    { width: 13, height: 13, borderRadius: 7 },
  row:    { flexDirection: 'row', gap: 7, marginBottom: 7 },
  mt0:    { marginTop: 0 },
  card:   { backgroundColor: C.card, borderRadius: 13, padding: 13, marginBottom: 11, borderWidth: 1, borderColor: C.border },
  empty:  { color: C.t3, fontSize: 13, textAlign: 'center', paddingVertical: 8 },
  irow:   { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: C.border },
  idot:   { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
  ititle: { fontSize: 13, fontWeight: '700', color: C.t1 },
  isub:   { fontSize: 11, color: C.t3, marginTop: 1 },
  zrow:   { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 9 },
  zname:  { fontSize: 11, fontWeight: '700', color: C.t2, width: 46 },
  ztrack: { flex: 1, height: 7, backgroundColor: C.el, borderRadius: 4, overflow: 'hidden' },
  zfill:  { height: '100%', borderRadius: 4 },
  zscore: { fontSize: 12, fontWeight: '800', width: 24, textAlign: 'right' },
  arow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 9, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.border },
  adot:   { width: 6, height: 6, borderRadius: 3, marginTop: 5, flexShrink: 0 },
  atxt:   { fontSize: 12, color: C.t1, fontWeight: '500' },
  ameta:  { fontSize: 10, color: C.t3, marginTop: 2 },
});
