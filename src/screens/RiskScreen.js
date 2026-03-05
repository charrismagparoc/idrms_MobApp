import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { useApp } from '../context/AppContext';
import { useWeather } from '../hooks/useWeather';
import { useRisk } from '../hooks/useRisk';
import { C } from '../styles/colors';
import { Badge, Search, Chips, Bar, Empty } from '../components/Shared';
import { ZONES, SCORING_RULES } from '../data/constants';

export default function RiskScreen() {
  const { incidents, residents } = useApp();
  const w = useWeather();
  const { resRisks, zoneRisks, highCount, medCount, lowCount, overallScore } = useRisk(residents, incidents, w);
  const [tab, setTab]       = useState('Zones');
  const [q, setQ]           = useState('');
  const [fRisk, setFRisk]   = useState('All');
  const [fZone, setFZone]   = useState('All');
  const [showS, setShowS]   = useState(false);

  const oc = overallScore >= 70 ? C.red : overallScore >= 40 ? C.orange : C.green;
  const ol = overallScore >= 70 ? 'HIGH' : overallScore >= 40 ? 'MED' : 'LOW';

  const filtRes = resRisks.filter(r => {
    const mq = !q || (r.name + r.zone).toLowerCase().includes(q.toLowerCase());
    return mq && (fRisk === 'All' || r.riskLabel === fRisk) && (fZone === 'All' || r.zone === fZone);
  });

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={s.kpiHdr}>
        <View style={[s.oCard, { borderColor: oc + '44', backgroundColor: oc + '11' }]}>
          <Text style={s.oLbl}>Overall</Text>
          <Text style={[s.oScore, { color: oc }]}>{overallScore}</Text>
          <View style={[s.pill, { backgroundColor: oc + '22' }]}><Text style={[s.pillTxt, { color: oc }]}>{ol}</Text></View>
        </View>
        {[[highCount,'HIGH',C.red],[medCount,'MED',C.orange],[lowCount,'LOW',C.green]].map(([v,l,c]) => (
          <View key={l} style={[s.mini, { borderColor: c + '33' }]}>
            <Text style={[s.miniV, { color: c }]}>{v}</Text>
            <Text style={s.miniL}>{l}</Text>
          </View>
        ))}
      </View>

      <View style={s.tabBar}>
        {['Zones','Residents'].map(t => (
          <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabA]} onPress={() => setTab(t)}>
            <Text style={[s.tabTxt, tab === t && s.tabTxtA]}>{t}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={s.infoBtn} onPress={() => setShowS(true)}>
          <Text style={s.infoTxt}>ℹ Scoring</Text>
        </TouchableOpacity>
      </View>

      {tab === 'Zones' ? (
        <ScrollView contentContainerStyle={s.list}>
          {zoneRisks.map(z => (
            <View key={z.zone} style={[s.card, { borderLeftWidth: 3, borderLeftColor: z.riskColor }]}>
              <View style={s.ztop}>
                <View>
                  <Text style={s.zname}>{z.zone}</Text>
                  <Text style={s.zhaz}>{z.mainHazard} Risk</Text>
                </View>
                <View style={s.zright}>
                  <Text style={[s.zscore, { color: z.riskColor }]}>{z.score}</Text>
                  <Badge label={z.riskLabel} variant={z.riskLabel} />
                </View>
              </View>
              <Bar value={z.score} max={100} height={8} color={z.riskColor} />
              <View style={s.zstats}>
                {[['👥',z.totalResidents,'Residents'],['⚠️',z.vulnerable,'Vulnerable'],['❓',z.unaccounted,'Missing'],['🏠',z.evacuated,'Evacuated'],['🔥',z.activeInc,'Active Inc']].map(([e,v,l]) => (
                  <View key={l} style={s.stat}>
                    <Text style={s.stE}>{e}</Text>
                    <Text style={s.stV}>{v}</Text>
                    <Text style={s.stL}>{l}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
          <View style={{ height: 24 }} />
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={s.rbar}><Search value={q} onChange={setQ} placeholder="Search residents..." /></View>
          <View style={s.fbar}><Chips opts={['All','HIGH','MEDIUM','LOW']} val={fRisk} onSelect={setFRisk} /></View>
          <View style={s.fbar}><Chips opts={['All',...ZONES]} val={fZone} onSelect={setFZone} active={C.blue} /></View>
          <ScrollView contentContainerStyle={s.list}>
            <Text style={s.count}>{filtRes.length} of {resRisks.length}</Text>
            {filtRes.map((r, idx) => (
              <View key={String(r.id)} style={s.card}>
                <View style={s.rtop}>
                  <Text style={s.rank}>#{idx+1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.rname}>{r.name}</Text>
                    <Text style={s.rmeta}>{r.zone}{r.householdMembers > 1 ? '  ·  ' + r.householdMembers + ' members' : ''}</Text>
                  </View>
                  <View style={s.rright}>
                    <Text style={[s.rscore, { color: r.riskColor }]}>{r.score}</Text>
                    <Badge label={r.riskLabel} variant={r.riskLabel} />
                  </View>
                </View>
                <Bar value={r.score} max={100} height={6} color={r.riskColor} />
                {(r.vulnerabilityTags || []).length > 0 && (
                  <View style={s.tags}>
                    {r.vulnerabilityTags.map(t => <View key={t} style={s.tag}><Text style={s.tagT}>{t}</Text></View>)}
                  </View>
                )}
              </View>
            ))}
            {filtRes.length === 0 && <Empty emoji="📊" title="No matches" />}
            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      )}

      <Modal visible={showS === true} transparent={true} animationType="slide" onRequestClose={() => setShowS(false)}>
        <TouchableWithoutFeedback onPress={() => setShowS(false)}>
          <View style={sm.ov}>
            <TouchableWithoutFeedback>
              <View style={sm.sheet}>
                <View style={sm.handle} />
                <View style={sm.hdr}>
                  <Text style={sm.title}>How Scores Are Calculated</Text>
                  <TouchableOpacity onPress={() => setShowS(false)}><Text style={sm.x}>✕</Text></TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={sm.intro}>Each resident gets a 0–100 risk score from 7 factors, recalculated live.</Text>
                  {SCORING_RULES.map(([t, d]) => (
                    <View key={t} style={sm.rule}>
                      <Text style={sm.rTitle}>{t}</Text>
                      <Text style={sm.rDesc}>{d}</Text>
                    </View>
                  ))}
                  <View style={sm.leg}>
                    <Text style={sm.legH}>Score Interpretation</Text>
                    {[['70–100','HIGH',C.red],['40–69','MEDIUM',C.orange],['0–39','LOW',C.green]].map(([r,l,c]) => (
                      <View key={l} style={sm.legRow}>
                        <View style={[sm.legDot, { backgroundColor: c }]} />
                        <Text style={sm.legR}>{r}</Text>
                        <Text style={[sm.legL, { color: c }]}>{l}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={{ height: 28 }} />
                </ScrollView>
                <TouchableOpacity style={sm.closeBtn} onPress={() => setShowS(false)}>
                  <Text style={sm.closeTxt}>Close</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  kpiHdr:  { flexDirection: 'row', gap: 7, padding: 11, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  oCard:   { flex: 2, borderRadius: 11, padding: 11, alignItems: 'center', borderWidth: 1 },
  oLbl:    { fontSize: 8.5, color: C.t3, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  oScore:  { fontSize: 26, fontWeight: '800', lineHeight: 30 },
  pill:    { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 9, marginTop: 3 },
  pillTxt: { fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  mini:    { flex: 1, backgroundColor: C.el, borderRadius: 11, padding: 9, alignItems: 'center', borderWidth: 1 },
  miniV:   { fontSize: 18, fontWeight: '800' },
  miniL:   { fontSize: 8, color: C.t3, fontWeight: '700', letterSpacing: 0.3, marginTop: 2 },
  tabBar:  { flexDirection: 'row', backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border, paddingHorizontal: 12 },
  tab:     { paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabA:    { borderBottomColor: C.blue },
  tabTxt:  { fontSize: 13, fontWeight: '600', color: C.t3 },
  tabTxtA: { color: C.blue },
  infoBtn: { marginLeft: 'auto', paddingVertical: 12, paddingHorizontal: 10 },
  infoTxt: { fontSize: 11, color: C.blue, fontWeight: '600' },
  list:    { padding: 12 },
  count:   { fontSize: 11, color: C.t3, marginBottom: 7 },
  card:    { backgroundColor: C.card, borderRadius: 12, padding: 13, marginBottom: 9, borderWidth: 1, borderColor: C.border },
  ztop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 9 },
  zname:   { fontSize: 14, fontWeight: '700', color: C.t1 },
  zhaz:    { fontSize: 10, color: C.t3, marginTop: 3 },
  zright:  { alignItems: 'flex-end', gap: 5 },
  zscore:  { fontSize: 20, fontWeight: '800' },
  zstats:  { flexDirection: 'row', justifyContent: 'space-between', marginTop: 11 },
  stat:    { alignItems: 'center', flex: 1 },
  stE:     { fontSize: 13, marginBottom: 2 },
  stV:     { fontSize: 13, fontWeight: '800', color: C.t1 },
  stL:     { fontSize: 7.5, color: C.t3, fontWeight: '600', textAlign: 'center' },
  rbar:    { padding: 11, paddingBottom: 0, backgroundColor: C.card },
  fbar:    { backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  rtop:    { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 7 },
  rank:    { fontSize: 11, fontWeight: '700', color: C.t3, width: 26 },
  rname:   { fontSize: 13, fontWeight: '700', color: C.t1 },
  rmeta:   { fontSize: 10, color: C.t3, marginTop: 2 },
  rright:  { alignItems: 'flex-end', gap: 4 },
  rscore:  { fontSize: 17, fontWeight: '800' },
  tags:    { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 7 },
  tag:     { backgroundColor: C.purple + '22', borderRadius: 7, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: C.purple + '44' },
  tagT:    { fontSize: 9, color: C.purple, fontWeight: '800' },
});

const sm = StyleSheet.create({
  ov:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' },
  sheet:    { backgroundColor: C.card, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 18, paddingTop: 12, maxHeight: '88%' },
  handle:   { width: 38, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  hdr:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 },
  title:    { fontSize: 16, fontWeight: '700', color: C.t1 },
  x:        { fontSize: 16, color: C.t3, padding: 4 },
  intro:    { fontSize: 12, color: C.t2, lineHeight: 18, marginBottom: 12 },
  rule:     { backgroundColor: C.el, borderRadius: 11, padding: 13, marginBottom: 7, borderWidth: 1, borderColor: C.border },
  rTitle:   { fontSize: 12, fontWeight: '700', color: C.blue, marginBottom: 4 },
  rDesc:    { fontSize: 11, color: C.t2, lineHeight: 16 },
  leg:      { backgroundColor: C.el, borderRadius: 11, padding: 13, marginTop: 4, borderWidth: 1, borderColor: C.border },
  legH:     { fontSize: 10, fontWeight: '700', color: C.t3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 9 },
  legRow:   { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 7 },
  legDot:   { width: 9, height: 9, borderRadius: 5 },
  legR:     { fontSize: 12, fontWeight: '700', color: C.t2, width: 52 },
  legL:     { fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
  closeBtn: { backgroundColor: C.el, borderRadius: 11, padding: 13, alignItems: 'center', marginTop: 11, marginBottom: 22, borderWidth: 1, borderColor: C.border },
  closeTxt: { fontSize: 14, fontWeight: '700', color: C.t2 },
});
