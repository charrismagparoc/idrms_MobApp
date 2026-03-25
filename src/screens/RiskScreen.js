  import { Ionicons } from '@expo/vector-icons';
  import { useState } from 'react';
  import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
  import { useSafeAreaInsets } from 'react-native-safe-area-context';
  import { Badge, Bar, DropFilter, Empty, Search } from '../components/Shared';
  import { useApp } from '../context/AppContext';
  import { useAuth } from '../context/AuthContext';
  import { SCORING_RULES, ZONES } from '../data/constants';
  import { useRisk } from '../hooks/useRisk';
  import { useWeather } from '../hooks/useWeather';
  import { C } from '../styles/colors';

  export default function RiskScreen() {
    const insets = useSafeAreaInsets();
    const { incidents, residents } = useApp();
    const { user } = useAuth();
    const w = useWeather();
    const { resRisks, zoneRisks } = useRisk(residents, incidents, w);
    const [tab, setTab]     = useState('Zones');
    const [q, setQ]         = useState('');
    const [fRisk, setFRisk] = useState('All');
    const [fZone, setFZone] = useState('All');
    const [showS, setShowS] = useState(false);

    const filtRes = resRisks.filter(r =>
      (!q || (r.name + r.zone).toLowerCase().includes(q.toLowerCase())) &&
      (fRisk === 'All' || r.riskLabel === fRisk) &&
      (fZone === 'All' || r.zone === fZone)
    );

    const filtZones = zoneRisks.filter(z =>
      (fRisk === 'All' || z.riskLabel === fRisk)
    );

    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={[s.topBar, { paddingTop: insets.top + 14 }]}>
          <View style={s.logoRow}>
            <Ionicons name="shield-checkmark" size={20} color={C.blue} />
            <Text style={s.title}>Risk Assessment</Text>
          </View>
        </View>

        {/* Tab bar */}
        <View style={s.tabBar}>
          {['Zones', 'Residents'].map(t => (
            <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabA]} onPress={() => setTab(t)}>
              <Text style={[s.tabTxt, tab === t && s.tabTxtA]}>{t}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={s.infoBtn} onPress={() => setShowS(true)}>
            <Ionicons name="information-circle-outline" size={16} color={C.blue} />
            <Text style={s.infoTxt}>Scoring</Text>
          </TouchableOpacity>
        </View>

        {tab === 'Zones' ? (
          <View style={{ flex: 1 }}>
            <View style={s.filterRow}>
              <DropFilter label="Risk" value={fRisk} opts={['All', 'HIGH', 'MEDIUM', 'LOW']} onSelect={setFRisk} color={C.red} />
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
              <Text style={s.count}>{filtZones.length} zone{filtZones.length !== 1 ? 's' : ''}</Text>
              <View style={s.tableWrap}>
                <View style={s.thead}>
                  <Text style={[s.th, { width: 64 }]}>ZONE</Text>
                  <Text style={[s.th, { flex: 1, paddingHorizontal: 8 }]}>SCORE</Text>
                  <Text style={[s.th, { width: 64 }]}>LEVEL</Text>
                  <Text style={[s.th, { width: 36, textAlign: 'center' }]}>RES</Text>
                  <Text style={[s.th, { width: 36, textAlign: 'center' }]}>VULN</Text>
                  <Text style={[s.th, { width: 36, textAlign: 'center' }]}>INC</Text>
                </View>
                {filtZones.map((z, idx) => (
                  <View key={z.zone} style={[s.trow, idx % 2 === 1 && s.zebra]}>
                    <View style={{ width: 64 }}>
                      <Text style={s.tdBold}>{z.zone}</Text>
                      <Text style={s.tdSub}>{z.mainHazard}</Text>
                    </View>
                    <View style={{ flex: 1, paddingHorizontal: 8 }}>
                      <Bar value={z.score} max={100} height={6} color={z.riskColor} />
                      <Text style={[s.scoreVal, { color: z.riskColor }]}>{z.score}</Text>
                    </View>
                    <View style={{ width: 64 }}><Badge label={z.riskLabel} variant={z.riskLabel} /></View>
                    <Text style={[s.tdCenter, { width: 36 }]}>{z.totalResidents}</Text>
                    <Text style={[s.tdCenter, { width: 36 }]}>{z.vulnerable}</Text>
                    <Text style={[s.tdCenter, { width: 36, color: z.activeInc > 0 ? C.red : C.t3 }]}>{z.activeInc}</Text>
                  </View>
                ))}
              </View>
              {filtZones.length === 0 && <Empty iconName="analytics-outline" title="No matches" />}
            </ScrollView>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <View style={s.sbar}><Search value={q} onChange={setQ} placeholder="Search residents..." /></View>
            <View style={s.filterRow}>
              <DropFilter label="Risk" value={fRisk} opts={['All', 'HIGH', 'MEDIUM', 'LOW']} onSelect={setFRisk} color={C.red} />
              <DropFilter label="Zone" value={fZone} opts={['All', ...ZONES]}                onSelect={setFZone} />
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
              <Text style={s.count}>{filtRes.length} of {resRisks.length}</Text>
              <View style={s.tableWrap}>
                <View style={s.thead}>
                  <Text style={[s.th, { width: 28 }]}>#</Text>
                  <Text style={[s.th, { flex: 2 }]}>NAME / ZONE</Text>
                  <Text style={[s.th, { flex: 1, paddingHorizontal: 6 }]}>SCORE</Text>
                  <Text style={[s.th, { width: 66 }]}>LEVEL</Text>
                </View>
                {filtRes.map((r, idx) => (
                  <View key={String(r.id)} style={[s.trow, idx % 2 === 1 && s.zebra]}>
                    <Text style={[s.tdSub, { width: 28 }]}>{idx + 1}</Text>
                    <View style={{ flex: 2 }}>
                      <Text style={s.tdBold} numberOfLines={1}>{r.name}</Text>
                      <Text style={s.tdSub}>{r.zone}</Text>
                      {(r.vulnerabilityTags || []).length > 0 &&
                        <Text style={s.tdTags} numberOfLines={1}>{r.vulnerabilityTags.join(', ')}</Text>}
                    </View>
                    <View style={{ flex: 1, paddingHorizontal: 6 }}>
                      <Bar value={r.score} max={100} height={5} color={r.riskColor} />
                      <Text style={[s.scoreVal, { color: r.riskColor }]}>{r.score}</Text>
                    </View>
                    <View style={{ width: 66 }}><Badge label={r.riskLabel} variant={r.riskLabel} /></View>
                  </View>
                ))}
              </View>
              {filtRes.length === 0 && <Empty iconName="analytics-outline" title="No matches" />}
            </ScrollView>
          </View>
        )}

        {/* Scoring modal */}
        <Modal visible={showS === true} transparent animationType="slide" onRequestClose={() => setShowS(false)}>
          <TouchableWithoutFeedback onPress={() => setShowS(false)}>
            <View style={sm.ov}>
              <TouchableWithoutFeedback>
                <View style={sm.sheet}>
                  <View style={sm.handle} />
                  <View style={sm.hdr}>
                    <Text style={sm.title}>Scoring System</Text>
                    <TouchableOpacity onPress={() => setShowS(false)}>
                      <Ionicons name="close" size={22} color={C.t2} />
                    </TouchableOpacity>
                  </View>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={sm.intro}>Each resident receives a 0–100 risk score based on 7 factors.</Text>
                    {SCORING_RULES.map(([t, d]) => (
                      <View key={t} style={sm.rule}>
                        <View style={sm.ruleRow}>
                          <Ionicons name="chevron-forward-circle" size={14} color={C.blue} />
                          <Text style={sm.rTitle}>{t}</Text>
                        </View>
                        <Text style={sm.rDesc}>{d}</Text>
                      </View>
                    ))}
                    <View style={sm.leg}>
                      <Text style={sm.legH}>Score Interpretation</Text>
                      {[['70–100','HIGH',C.red,'flame'],['40–69','MEDIUM',C.orange,'warning'],['0–39','LOW',C.green,'checkmark-circle']].map(([r,l,c,ico]) => (
                        <View key={l} style={sm.legRow}>
                          <Ionicons name={ico} size={16} color={c} />
                          <Text style={sm.legR}>{r}</Text>
                          <Text style={[sm.legL, { color: c }]}>{l}</Text>
                        </View>
                      ))}
                    </View>
                    <View style={{ height: 24 }} />
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
    topBar:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 16, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
    logoRow:   { flexDirection: 'row', alignItems: 'center', gap: 7 },
    title:     { fontSize: 17, fontWeight: '800', color: C.t1 },
    tabBar:    { flexDirection: 'row', backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border, paddingHorizontal: 12 },
    tab:       { paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabA:      { borderBottomColor: C.blue },
    tabTxt:    { fontSize: 13, fontWeight: '600', color: C.t3 },
    tabTxtA:   { color: C.blue },
    infoBtn:   { marginLeft: 'auto', paddingVertical: 12, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
    infoTxt:   { fontSize: 11, color: C.blue, fontWeight: '600' },
    sbar:      { padding: 12, paddingBottom: 0, backgroundColor: C.card },
    filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
    count:     { fontSize: 11, color: C.t3, paddingHorizontal: 14, paddingVertical: 8 },
    tableWrap: { marginHorizontal: 12, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: C.border, marginTop: 4 },
    thead:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, backgroundColor: C.el },
    th:        { fontSize: 9, fontWeight: '700', color: C.t3, letterSpacing: 0.4 },
    trow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10, borderTopWidth: 1, borderTopColor: C.border, gap: 4 },
    zebra:     { backgroundColor: 'rgba(255,255,255,0.02)' },
    tdBold:    { fontSize: 12, fontWeight: '600', color: C.t1 },
    tdSub:     { fontSize: 10, color: C.t3, marginTop: 1 },
    tdTags:    { fontSize: 9, color: C.purple, marginTop: 2 },
    tdCenter:  { fontSize: 12, color: C.t1, textAlign: 'center', fontWeight: '600' },
    scoreVal:  { fontSize: 10, fontWeight: '700', marginTop: 3 },
  });

  const sm = StyleSheet.create({
    ov:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' },
    sheet:    { backgroundColor: C.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 18, paddingTop: 12, maxHeight: '88%' },
    handle:   { width: 38, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
    hdr:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    title:    { fontSize: 15, fontWeight: '700', color: C.t1 },
    intro:    { fontSize: 12, color: C.t2, lineHeight: 18, marginBottom: 12 },
    rule:     { backgroundColor: C.el, borderRadius: 10, padding: 13, marginBottom: 7, borderWidth: 1, borderColor: C.border },
    ruleRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    rTitle:   { fontSize: 12, fontWeight: '700', color: C.blue },
    rDesc:    { fontSize: 11, color: C.t2, lineHeight: 16 },
    leg:      { backgroundColor: C.el, borderRadius: 10, padding: 13, marginTop: 4, borderWidth: 1, borderColor: C.border },
    legH:     { fontSize: 10, fontWeight: '700', color: C.t3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 9 },
    legRow:   { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 7 },
    legR:     { fontSize: 12, fontWeight: '700', color: C.t2, width: 52 },
    legL:     { fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
    closeBtn: { backgroundColor: C.el, borderRadius: 10, padding: 13, alignItems: 'center', marginTop: 11, marginBottom: 22, borderWidth: 1, borderColor: C.border },
    closeTxt: { fontSize: 14, fontWeight: '700', color: C.t2 },
  });