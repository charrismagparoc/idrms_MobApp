import { useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Badge, SecHdr } from '../components/Shared';
import { Sidebar } from '../components/Sidebar';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useRisk } from '../hooks/useRisk';
import { useWeather } from '../hooks/useWeather';
import { C, TYPE_COLOR } from '../styles/colors';
import { styles as s } from '../styles/dashboardScreenStyles';

function KCard({ emoji, value, label, color }) {
  return (
    <View style={[{ flex: 1, backgroundColor: C.card, borderRadius: 12, padding: 11, alignItems: 'center', borderWidth: 1, minWidth: 74, borderColor: (color || C.blue) + '30' }]}>
      <Text style={{ fontSize: 16, marginBottom: 3 }}>{emoji}</Text>
      <Text style={[{ fontSize: 20, fontWeight: '800', lineHeight: 24 }, { color: color || C.blue }]}>{value ?? 0}</Text>
      <Text style={{ fontSize: 8.5, color: C.t3, textAlign: 'center', marginTop: 2, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</Text>
    </View>
  );
}

const RISK_C = { High: C.red, Medium: C.orange, Low: C.green };

export default function DashboardScreen({ navigation }) {
  const { incidents, alerts, evacCenters, residents, activityLog, reload } = useApp();
  const { logout } = useAuth();
  const w = useWeather();
  const { zoneRisks, highCount, medCount, lowCount, overallScore } = useRisk(residents, incidents, w);
  const [busy, setBusy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeInc = incidents.filter(i => ['Active', 'Pending'].includes(i.status));
  const totalOcc  = evacCenters.reduce((a, c) => a + (c.occupancy || 0), 0);
  const oc  = overallScore >= 70 ? C.red : overallScore >= 40 ? C.orange : C.green;
  const ol  = overallScore >= 70 ? 'HIGH RISK' : overallScore >= 40 ? 'MEDIUM RISK' : 'LOW RISK';

  async function onRefresh() { setBusy(true); await reload(); setBusy(false); }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* HEADER */}
      <View style={s.headerContainer}>
        <TouchableOpacity onPress={() => setSidebarOpen(true)} style={s.hamburger}>
          <Text style={s.hamburgerText}>☰</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.headerTitle} numberOfLines={1} adjustsFontSizeToFit>Dashboard</Text>
          <Text style={s.headerSub} numberOfLines={2}>Overview and insights</Text>
        </View>
      </View>

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
          </View>
        </View>

        <View style={[s.banner, { borderColor: oc + '44', backgroundColor: oc + '11' }]}>
          <View>
            <Text style={s.bannerLbl}>Overall Risk Level</Text>
            <Text style={[s.bannerVal, { color: oc }]}>{ol}  —  Score {overallScore}</Text>
          </View>
          <View style={[s.dot, { backgroundColor: oc }]} />
        </View>

        <View style={s.row}>
          <KCard emoji="⚠️" value={incidents.length} label="Total Inc." color={C.orange} />
          <KCard emoji="🔴" value={activeInc.length} label="Active" color={C.red} />
          <KCard emoji="✅" value={incidents.filter(i => i.status === 'Resolved').length} label="Resolved" color={C.green} />
          <KCard emoji="📢" value={alerts.length} label="Alerts" color={C.blue} />
        </View>
        <View style={[s.row, s.mt0]}>
          <KCard emoji="🏠" value={evacCenters.filter(c => c.status === 'Open').length} label="Open Ctr." color={C.green} />
          <KCard emoji="👥" value={totalOcc} label="Evacuees" color={C.purple} />
          <KCard emoji="🔴" value={highCount} label="High Risk" color={C.red} />
          <KCard emoji="👤" value={residents.length} label="Residents" color={C.blue} />
        </View>
        <View style={[s.row, s.mt0]}>
          <KCard emoji="🚨" value={highCount} label="High" color={C.red} />
          <KCard emoji="⚡" value={medCount} label="Medium" color={C.orange} />
          <KCard emoji="🟢" value={lowCount} label="Low" color={C.green} />
          <KCard emoji="📢" value={alerts.filter(a => a.level === 'Danger').length} label="Danger Alts" color={C.red} />
        </View>

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
              <View style={[{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, marginLeft: 0, backgroundColor: z.riskColor + '22' }]}>
                <Text style={[{ fontSize: 9, fontWeight: '800', letterSpacing: 0.3, color: z.riskColor }]}>{z.riskLabel}</Text>
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

      {/* SIDEBAR */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentRoute="Dashboard"
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