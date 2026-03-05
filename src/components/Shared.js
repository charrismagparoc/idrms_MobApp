import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Modal, ScrollView, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback, ActivityIndicator,
} from 'react-native';
import { C, BADGE } from '../styles/colors';

const BDG_MAP = {
  high:'danger', danger:'danger',
  medium:'warning', warning:'warning',
  low:'success', success:'success', open:'success', safe:'success', resolved:'success',
  info:'info', verified:'info', advisory:'info', evacuated:'info',
  pending:'warning', full:'warning',
  active:'danger', unaccounted:'danger',
  closed:'neutral', neutral:'neutral',
  purple:'purple', responded:'purple',
};

export function Badge({ label, variant }) {
  const key = BDG_MAP[(variant || label || '').toLowerCase()] || 'neutral';
  const s   = BADGE[key] || BADGE.neutral;
  return (
    <View style={[b.wrap, { backgroundColor: s.bg }]}>
      <Text style={[b.text, { color: s.fg }]}>{(label || '').toUpperCase()}</Text>
    </View>
  );
}
const b = StyleSheet.create({
  wrap: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start' },
  text: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
});

export function Bar({ value, max, height, color }) {
  const pct = (max || 0) > 0 ? Math.min((value / max) * 100, 100) : 0;
  const c   = color || (pct > 80 ? C.red : pct > 50 ? C.orange : C.green);
  const h   = height || 6;
  return (
    <View style={[pr.track, { height: h }]}>
      <View style={[pr.fill, { width: pct + '%', backgroundColor: c, height: h }]} />
    </View>
  );
}
const pr = StyleSheet.create({
  track: { backgroundColor: C.el, borderRadius: 4, overflow: 'hidden', width: '100%' },
  fill:  { borderRadius: 4 },
});

export function Search({ value, onChange, placeholder }) {
  return (
    <View style={sr.wrap}>
      <Text style={sr.icon}>🔍</Text>
      <TextInput
        style={sr.inp}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder || 'Search...'}
        placeholderTextColor={C.t3}
        autoCapitalize="none"
        
      />
      {value ? (
        <TouchableOpacity onPress={() => onChange('')}>
          <Text style={sr.x}>✕</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
const sr = StyleSheet.create({
  wrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: C.inp, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 11, height: 42 },
  icon: { fontSize: 13, marginRight: 7 },
  inp:  { flex: 1, color: C.t1, fontSize: 14 },
  x:    { color: C.t3, fontSize: 14, paddingLeft: 6 },
});

export function Chips({ opts, val, onSelect, active }) {
  const ac = active || C.blue;
  return (
    <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
      <View style={{ flexDirection: 'row', gap: 7 }}>
        {opts.map(function(o) {
          var on = val === o;
          return (
            <TouchableOpacity key={o} onPress={function() { onSelect(o); }} style={[ch.chip, on ? { backgroundColor: ac + '22', borderColor: ac } : null]}>
              <Text style={[ch.txt, on ? { color: ac } : null]}>{o}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}
const ch = StyleSheet.create({
  chip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20, backgroundColor: C.el, borderWidth: 1, borderColor: C.border },
  txt:  { fontSize: 12, color: C.t2, fontWeight: '600' },
});

export function Confirm({ visible, title, msg, onOk, onNo, okLabel }) {
  const isVisible = visible === true;
  return (
    <Modal visible={isVisible} transparent={true} animationType="fade" onRequestClose={onNo}>
      <TouchableWithoutFeedback onPress={onNo}>
        <View style={cm.ov}>
          <TouchableWithoutFeedback>
            <View style={cm.box}>
              <Text style={cm.title}>{title}</Text>
              <Text style={cm.msg}>{msg}</Text>
              <View style={cm.row}>
                <TouchableOpacity style={[cm.btn, cm.cancel]} onPress={onNo}>
                  <Text style={cm.cancelTxt}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[cm.btn, cm.ok]} onPress={onOk}>
                  <Text style={cm.okTxt}>{okLabel || 'Delete'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
const cm = StyleSheet.create({
  ov:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  box:       { backgroundColor: C.card, borderRadius: 16, padding: 24, width: '100%', maxWidth: 360, borderWidth: 1, borderColor: C.border },
  title:     { fontSize: 17, fontWeight: '700', color: C.t1, marginBottom: 8 },
  msg:       { fontSize: 14, color: C.t2, lineHeight: 21, marginBottom: 20 },
  row:       { flexDirection: 'row', gap: 10 },
  btn:       { flex: 1, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cancel:    { backgroundColor: C.el, borderWidth: 1, borderColor: C.border },
  ok:        { backgroundColor: C.red },
  cancelTxt: { color: C.t2, fontWeight: '600', fontSize: 14 },
  okTxt:     { color: '#fff', fontWeight: '700', fontSize: 14 },
});

export function FormModal({ visible, title, onClose, onSave, saving, saveLabel, children }) {
  const isVisible = visible === true;
  const isSaving  = saving  === true;
  return (
    <Modal visible={isVisible} transparent={false} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={fm.hdr}>
          <TouchableOpacity onPress={onClose} style={fm.closeBtn}>
            <Text style={fm.closeTxt}>✕</Text>
          </TouchableOpacity>
          <Text style={fm.title} numberOfLines={1}>{title}</Text>
          <TouchableOpacity onPress={onSave} disabled={isSaving} style={[fm.saveBtn, isSaving ? fm.saveBtnOff : null]}>
            {isSaving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={fm.saveTxt}>{saveLabel || 'Save'}</Text>}
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 50 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
const fm = StyleSheet.create({
  hdr:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  closeBtn:  { padding: 4, minWidth: 32 },
  closeTxt:  { fontSize: 16, color: C.t2 },
  title:     { flex: 1, fontSize: 16, fontWeight: '700', color: C.t1, textAlign: 'center', paddingHorizontal: 8 },
  saveBtn:   { backgroundColor: C.blue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, minWidth: 64, alignItems: 'center' },
  saveBtnOff:{ opacity: 0.45 },
  saveTxt:   { color: '#fff', fontWeight: '700', fontSize: 14 },
});

function FLabel({ text, req }) {
  return (
    <Text style={ff.lbl}>
      {text}{req === true ? <Text style={{ color: C.red }}> *</Text> : null}
    </Text>
  );
}

export function FInput({ label, value, onChange, placeholder, type, secure, multi, req }) {
  const isSecure    = secure === true;
  const isMultiline = multi  === true;
  return (
    <View style={ff.grp}>
      <FLabel text={label} req={req === true} />
      <TextInput
        style={[ff.inp, isMultiline ? ff.multi : null]}
        value={value || ''}
        onChangeText={onChange}
        placeholder={placeholder || ''}
        placeholderTextColor={C.t3}
        keyboardType={type || 'default'}
        secureTextEntry={isSecure}
        multiline={isMultiline}
        numberOfLines={isMultiline ? 3 : undefined}
        autoCapitalize="none"
        
        textAlignVertical={isMultiline ? 'top' : 'auto'}
      />
    </View>
  );
}

export function FPick({ label, value, opts, onChange, req, ac }) {
  const a = ac || C.blue;
  return (
    <View style={ff.grp}>
      <FLabel text={label} req={req === true} />
      <View style={ff.chips}>
        {opts.map(function(o) {
          const on = value === o;
          return (
            <TouchableOpacity key={o} onPress={function() { onChange(o); }} style={[ff.chip, on ? { backgroundColor: a + '22', borderColor: a } : null]}>
              <Text style={[ff.chipTxt, on ? { color: a } : null]}>{o}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export function FTags({ label, values, opts, onChange }) {
  function toggle(v) {
    if (values.includes(v)) onChange(values.filter(function(x) { return x !== v; }));
    else onChange(values.concat([v]));
  }
  return (
    <View style={ff.grp}>
      <FLabel text={label} />
      <View style={ff.chips}>
        {opts.map(function(o) {
          const on = values.includes(o);
          return (
            <TouchableOpacity key={o} onPress={function() { toggle(o); }} style={[ff.chip, on ? { backgroundColor: C.purple + '22', borderColor: C.purple } : null]}>
              <Text style={[ff.chipTxt, on ? { color: C.purple } : null]}>{o}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const ff = StyleSheet.create({
  grp:     { marginBottom: 14 },
  lbl:     { fontSize: 12, fontWeight: '600', color: C.t2, marginBottom: 6 },
  inp:     { backgroundColor: C.inp, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 13, paddingVertical: 11, color: C.t1, fontSize: 14 },
  multi:   { minHeight: 80, paddingTop: 11 },
  chips:   { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip:    { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: C.el, borderWidth: 1, borderColor: C.border },
  chipTxt: { fontSize: 12, color: C.t2, fontWeight: '600' },
});

export function SecHdr({ title, count, right, onRight }) {
  return (
    <View style={sh.row}>
      <View style={sh.left}>
        <Text style={sh.title}>{title}</Text>
        {count != null ? <View style={sh.badge}><Text style={sh.badgeTxt}>{count}</Text></View> : null}
      </View>
      {onRight ? <TouchableOpacity onPress={onRight}><Text style={sh.right}>{right || 'See all'}</Text></TouchableOpacity> : null}
    </View>
  );
}
const sh = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  left:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title:    { fontSize: 11, fontWeight: '700', color: C.t3, textTransform: 'uppercase', letterSpacing: 0.7 },
  badge:    { backgroundColor: 'rgba(232,72,85,0.18)', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  badgeTxt: { fontSize: 9, fontWeight: '800', color: C.red },
  right:    { fontSize: 12, color: C.blue, fontWeight: '600' },
});

export function Empty({ emoji, title, sub }) {
  return (
    <View style={em.wrap}>
      <Text style={em.emoji}>{emoji || '📭'}</Text>
      {title ? <Text style={em.title}>{title}</Text> : null}
      {sub   ? <Text style={em.sub}>{sub}</Text>     : null}
    </View>
  );
}
const em = StyleSheet.create({
  wrap:  { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 20 },
  emoji: { fontSize: 34, marginBottom: 10 },
  title: { fontSize: 14, fontWeight: '600', color: C.t2, textAlign: 'center' },
  sub:   { fontSize: 12, color: C.t3, marginTop: 4, textAlign: 'center', lineHeight: 18 },
});