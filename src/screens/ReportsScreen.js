import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import { useWeather } from '../hooks/useWeather';
import { useRisk } from '../hooks/useRisk';
import { C, TYPE_COLOR } from '../styles/colors';
import { Badge, Bar, SecHdr } from '../components/Shared';
import { TYPES } from '../data/constants';

function K({ emoji, value, label, color }) {
  return (
    <View style={[k.card, { borderColor: (color || C.blue) + '30' }]}>
      <Text style={k.emoji}>{emoji}</Text>
      <Text style={[k.val, { color: color || C.blue }]}>{value ?? 0}</Text>
      <Text style={k.lbl}>{label}</Text>
    </View>
  );
}
const k = StyleSheet.create({
  card:  { flex: 1, backgroundColor: C.card, borderRadius: 12, padding: 11, alignItems: 'center', borderWidth: 1, minWidth: 80 },
  emoji: { fontSize: 17, marginBottom: 3 },
  val:   { fontSize: 20, fontWeight: '800' },
  lbl:   { fontSize: 8.5, color: C.t3, textAlign: 'center', marginTop: 2, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
});

export default function ReportsScreen() {
  const { incidents, alerts, evacCenters, residents } = useApp();
  const w  = useWeather();
  const { zoneRisks } = useRisk(residents, incidents, w);
  const active   = incidents.filter(i => ['Active','Pending'].includes(i.status));
  const resolved = incidents.filter(i => i.status === 'Resolved');
  const totOcc   = evacCenters.reduce((a,c) => a+(c.occupancy||0),0);
  const totCap   = evacCenters.reduce((a,c) => a+(c.capacity||0),0);
  const pctOcc   = totCap > 0 ? Math.round(totOcc/totCap*100) : 0;

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.pad}>
      <Text style={s.title}>Reports & Analytics</Text>
      <Text style={s.sub}>Live overview — Barangay Kauswagan</Text>

      <View style={s.row}><K emoji="⚠️" value={incidents.length} label="Total Inc."  color={C.orange} />
        <K emoji="🔴" value={active.length}    label="Active"      color={C.red}    />
        <K emoji="✅" value={resolved.length}  label="Resolved"    color={C.green}  /></View>
      <View style={[s.row,{marginTop:0}]}><K emoji="👥" value={residents.length}  label="Residents"  color={C.purple} />
        <K emoji="🏠" value={pctOcc+'%'}       label="Evac Occ."   color={C.blue}   />
        <K emoji="📢" value={alerts.length}    label="Alerts"      color={C.yellow} /></View>

      <View style={s.card}>
        <SecHdr title="Incidents by Type" />
        {TYPES.map(type => {
          const cnt = incidents.filter(i => i.type === type).length;
          const pct = incidents.length > 0 ? Math.round(cnt/incidents.length*100) : 0;
          const c   = TYPE_COLOR[type] || C.blue;
          return (
            <View key={type} style={s.trow}>
              <Text style={s.tlbl}>{type}</Text>
              <View style={s.ttrack}><View style={[s.tfill, { width: pct+'%', backgroundColor: c }]} /></View>
              <Text style={[s.tcnt, { color: c }]}>{cnt}</Text>
            </View>
          );
        })}
      </View>

      <View style={s.card}>
        <SecHdr title="Zone Risk Summary" />
        <View style={s.thdr}>
          <Text style={[s.th, { flex:2 }]}>Zone</Text>
          <Text style={[s.th, { flex:1.5 }]}>Risk</Text>
          <Text style={[s.th, { flex:2 }]}>Hazard</Text>
          <Text style={[s.th, { flex:1, textAlign:'right' }]}>Inc.</Text>
        </View>
        {zoneRisks.map(z => {
          const zi = incidents.filter(i => i.zone === z.zone).length;
          return (
            <View key={z.zone} style={s.trow2}>
              <Text style={[s.td, { flex:2, fontWeight:'600', color:C.t1 }]}>{z.zone}</Text>
              <View style={{ flex:1.5 }}><Badge label={z.riskLabel} variant={z.riskLabel} /></View>
              <Text style={[s.td, { flex:2 }]}>{z.mainHazard}</Text>
              <Text style={[s.td, { flex:1, textAlign:'right', fontWeight:'700', color:C.orange }]}>{zi}</Text>
            </View>
          );
        })}
      </View>

      <View style={s.card}>
        <SecHdr title={'Evacuation Centers'} count={evacCenters.length} />
        {evacCenters.slice(0,8).map(c => (
          <View key={String(c.id)} style={s.erow}>
            <View style={{ flex:1 }}>
              <Text style={s.ename}>{c.name}</Text>
              <Text style={s.emeta}>{c.zone}  ·  {c.occupancy}/{c.capacity}</Text>
              <Bar value={c.occupancy} max={c.capacity} height={5} />
            </View>
            <View style={{ marginLeft:9 }}><Badge label={c.status} variant={c.status} /></View>
          </View>
        ))}
        {evacCenters.length === 0 && <Text style={s.empty}>No centers</Text>}
      </View>

      <View style={s.card}>
        <SecHdr title={'Recent Alerts'} count={alerts.length} />
        {alerts.slice(0,6).map(a => (
          <View key={String(a.id)} style={s.arow}>
            <View style={s.ameta1}>
              <Badge label={a.level} variant={a.level} />
              <Text style={s.azone}>{a.zone}</Text>
            </View>
            <Text style={s.amsg} numberOfLines={1}>{a.message}</Text>
            <Text style={s.aby}>{a.sent_by}  ·  {a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}</Text>
          </View>
        ))}
        {alerts.length === 0 && <Text style={s.empty}>No alerts</Text>}
      </View>
      <View style={{ height: 28 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex:1, backgroundColor: C.bg },
  pad:    { padding:14 },
  title:  { fontSize:22, fontWeight:'800', color:C.t1 },
  sub:    { fontSize:11, color:C.t3, marginTop:2, marginBottom:13 },
  row:    { flexDirection:'row', gap:7, marginBottom:7 },
  card:   { backgroundColor:C.card, borderRadius:13, padding:13, marginBottom:11, borderWidth:1, borderColor:C.border },
  trow:   { flexDirection:'row', alignItems:'center', gap:9, marginBottom:9 },
  tlbl:   { fontSize:11, color:C.t2, width:76, fontWeight:'600' },
  ttrack: { flex:1, height:8, backgroundColor:C.el, borderRadius:4, overflow:'hidden' },
  tfill:  { height:'100%', borderRadius:4, minWidth:4 },
  tcnt:   { fontSize:13, fontWeight:'800', width:22, textAlign:'right' },
  thdr:   { flexDirection:'row', paddingBottom:7, borderBottomWidth:1, borderBottomColor:C.border, marginBottom:5 },
  th:     { fontSize:9, fontWeight:'700', color:C.t3, textTransform:'uppercase', letterSpacing:0.3 },
  trow2:  { flexDirection:'row', alignItems:'center', paddingVertical:7, borderBottomWidth:1, borderBottomColor:C.border },
  td:     { fontSize:11, color:C.t2 },
  erow:   { flexDirection:'row', alignItems:'center', paddingVertical:9, borderBottomWidth:1, borderBottomColor:C.border },
  ename:  { fontSize:12, fontWeight:'600', color:C.t1 },
  emeta:  { fontSize:10, color:C.t3, marginTop:2, marginBottom:5 },
  arow:   { paddingVertical:7, borderBottomWidth:1, borderBottomColor:C.border },
  ameta1: { flexDirection:'row', alignItems:'center', gap:7, marginBottom:3 },
  azone:  { fontSize:10, color:C.t3, fontWeight:'600' },
  amsg:   { fontSize:11, color:C.t2 },
  aby:    { fontSize:9, color:C.t3, marginTop:3 },
  empty:  { fontSize:12, color:C.t3, textAlign:'center', paddingVertical:10 },
  yellow: C.yellow,
});
