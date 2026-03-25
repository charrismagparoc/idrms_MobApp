import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, TouchableWithoutFeedback, View,
} from 'react-native';
import { C, BADGE } from '../styles/colors';

// ─── Badge ────────────────────────────────────────────────────────────────────
const BDG_MAP = {
  high:'danger',danger:'danger',
  medium:'warning',warning:'warning',
  low:'success',success:'success',open:'success',safe:'success',resolved:'success',
  info:'info',verified:'info',advisory:'info',evacuated:'info',
  pending:'warning',full:'warning',
  active:'danger',unaccounted:'danger',
  closed:'neutral',neutral:'neutral',
  purple:'purple',responded:'purple',
  available:'success',
  'partially deployed':'warning',
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
  wrap: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4, alignSelf: 'flex-start' },
  text: { fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
});

// ─── Bar ─────────────────────────────────────────────────────────────────────
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
  track: { backgroundColor: C.el, borderRadius: 3, overflow: 'hidden', width: '100%' },
  fill:  { borderRadius: 3 },
});

// ─── Search ──────────────────────────────────────────────────────────────────
export function Search({ value, onChange, placeholder }) {
  return (
    <View style={sr.wrap}>
      <Ionicons name="search" size={16} color={C.t3} style={{ marginRight: 8 }} />
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
          <Ionicons name="close-circle" size={16} color={C.t3} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
const sr = StyleSheet.create({
  wrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: C.inp, borderRadius: 8, borderWidth: 1, borderColor: C.border, paddingHorizontal: 11, height: 42 },
  inp:  { flex: 1, color: C.t1, fontSize: 13 },
});

// ─── DropFilter ───────────────────────────────────────────────────────────────
export function DropFilter({ label, value, opts, onSelect, color }) {
  const [open, setOpen] = useState(false);
  const ac = color || C.blue;
  const active = value !== opts[0];
  return (
    <View style={df.wrap}>
      {label ? <Text style={df.label}>{label}</Text> : null}
      <TouchableOpacity style={[df.trigger, active && { borderColor: ac }]} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Text style={[df.val, active && { color: ac }]} numberOfLines={1}>{value}</Text>
        <Ionicons name="chevron-down" size={13} color={active ? ac : C.t3} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={df.ov}>
            <TouchableWithoutFeedback>
              <View style={df.sheet}>
                <Text style={df.sheetTitle}>{label || 'Select'}</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {opts.map(o => (
                    <TouchableOpacity key={o} style={[df.option, value === o && { backgroundColor: ac + '22' }]}
                      onPress={() => { onSelect(o); setOpen(false); }}>
                      <View style={[df.dot, { backgroundColor: value === o ? ac : 'transparent', borderColor: value === o ? ac : C.border }]} />
                      <Text style={[df.optTxt, value === o && { color: ac, fontWeight: '700' }]}>{o}</Text>
                      {value === o && <Ionicons name="checkmark" size={16} color={ac} style={{ marginLeft: 'auto' }} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
const df = StyleSheet.create({
  wrap:       { flex: 1, minWidth: 90 },
  label:      { fontSize: 10, color: C.t3, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  trigger:    { flexDirection: 'row', alignItems: 'center', backgroundColor: C.el, borderRadius: 8, borderWidth: 1, borderColor: C.border, paddingHorizontal: 11, paddingVertical: 9, gap: 6 },
  val:        { flex: 1, fontSize: 13, color: C.t2, fontWeight: '600' },
  ov:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sheet:      { backgroundColor: C.card, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 40, maxHeight: '72%', borderTopWidth: 1, borderColor: C.border },
  sheetTitle: { fontSize: 12, fontWeight: '700', color: C.t3, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 14 },
  option:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 8, borderRadius: 8, marginBottom: 2 },
  dot:        { width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
  optTxt:     { fontSize: 14, color: C.t1 },
});

// ─── FilterBar ────────────────────────────────────────────────────────────────
export function FilterBar({ filters }) {
  return (
    <View style={fb.row}>
      {filters.map((f, i) => (
        <DropFilter key={i} label={f.label} value={f.value} opts={f.opts} onSelect={f.onSelect} color={f.color} />
      ))}
    </View>
  );
}
const fb = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
});

// ─── Confirm ─────────────────────────────────────────────────────────────────
export function Confirm({ visible, title, msg, onOk, onNo, okLabel }) {
  return (
    <Modal visible={visible === true} transparent animationType="fade" onRequestClose={onNo}>
      <TouchableWithoutFeedback onPress={onNo}>
        <View style={cm.ov}>
          <TouchableWithoutFeedback>
            <View style={cm.box}>
              <View style={cm.iconRow}>
                <Ionicons name="alert-circle" size={28} color={C.red} />
              </View>
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
  box:       { backgroundColor: C.card, borderRadius: 14, padding: 24, width: '100%', maxWidth: 360, borderWidth: 1, borderColor: C.border },
  iconRow:   { alignItems: 'center', marginBottom: 10 },
  title:     { fontSize: 16, fontWeight: '700', color: C.t1, marginBottom: 8, textAlign: 'center' },
  msg:       { fontSize: 13, color: C.t2, lineHeight: 20, marginBottom: 20, textAlign: 'center' },
  row:       { flexDirection: 'row', gap: 10 },
  btn:       { flex: 1, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cancel:    { backgroundColor: C.el, borderWidth: 1, borderColor: C.border },
  ok:        { backgroundColor: C.red },
  cancelTxt: { color: C.t2, fontWeight: '600', fontSize: 13 },
  okTxt:     { color: '#fff', fontWeight: '700', fontSize: 13 },
});

// ─── FormModal ────────────────────────────────────────────────────────────────
export function FormModal({ visible, title, onClose, onSave, saving, saveLabel, children }) {
  return (
    <Modal visible={visible === true} transparent={false} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={fm.hdr}>
          <TouchableOpacity onPress={onClose} style={fm.closeBtn}>
            <Ionicons name="close" size={22} color={C.t2} />
          </TouchableOpacity>
          <Text style={fm.title} numberOfLines={1}>{title}</Text>
          <TouchableOpacity onPress={onSave} disabled={saving === true} style={[fm.saveBtn, saving === true && fm.saveBtnOff]}>
            {saving === true
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={fm.saveTxt}>{saveLabel || 'Save'}</Text>}
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
  hdr:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 54, paddingBottom: 14, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  closeBtn:  { padding: 4, minWidth: 36 },
  title:     { flex: 1, fontSize: 15, fontWeight: '700', color: C.t1, textAlign: 'center', paddingHorizontal: 8 },
  saveBtn:   { backgroundColor: C.blue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 7, minWidth: 64, alignItems: 'center' },
  saveBtnOff:{ opacity: 0.45 },
  saveTxt:   { color: '#fff', fontWeight: '700', fontSize: 13 },
});

// ─── FLabel ──────────────────────────────────────────────────────────────────
function FLabel({ text, req }) {
  return (
    <Text style={ff.lbl}>
      {text}{req === true ? <Text style={{ color: C.red }}> *</Text> : null}
    </Text>
  );
}

// ─── FInput ──────────────────────────────────────────────────────────────────
export function FInput({ label, value, onChange, placeholder, type, secure, multi, req }) {
  return (
    <View style={ff.grp}>
      <FLabel text={label} req={req === true} />
      <TextInput
        style={[ff.inp, multi === true && ff.multi]}
        value={value || ''}
        onChangeText={onChange}
        placeholder={placeholder || ''}
        placeholderTextColor={C.t3}
        keyboardType={type || 'default'}
        secureTextEntry={secure === true}
        multiline={multi === true}
        numberOfLines={multi === true ? 3 : undefined}
        autoCapitalize="none"
        textAlignVertical={multi === true ? 'top' : 'auto'}
      />
    </View>
  );
}

// ─── FPick (dropdown) ─────────────────────────────────────────────────────────
export function FPick({ label, value, opts, onChange, req }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={ff.grp}>
      <FLabel text={label} req={req === true} />
      <TouchableOpacity style={ff.drop} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Text style={ff.dropVal}>{value || 'Select...'}</Text>
        <Ionicons name="chevron-down" size={14} color={C.t3} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={ff.ov}>
            <TouchableWithoutFeedback>
              <View style={ff.sheet}>
                <Text style={ff.sheetTitle}>{label}</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {opts.map(o => (
                    <TouchableOpacity key={o} style={[ff.opt, value === o && ff.optA]}
                      onPress={() => { onChange(o); setOpen(false); }}>
                      <Ionicons name={value === o ? 'radio-button-on' : 'radio-button-off'} size={16} color={value === o ? C.blue : C.t3} />
                      <Text style={[ff.optTxt, value === o && ff.optTxtA]}>{o}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

// ─── FTags (multi-select dropdown) ────────────────────────────────────────────
export function FTags({ label, values, opts, onChange }) {
  const [open, setOpen] = useState(false);
  function toggle(v) {
    onChange(values.includes(v) ? values.filter(x => x !== v) : [...values, v]);
  }
  return (
    <View style={ff.grp}>
      <FLabel text={label} />
      <TouchableOpacity style={ff.drop} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Text style={ff.dropVal} numberOfLines={1}>
          {values.length === 0 ? 'Select options...' : values.join(', ')}
        </Text>
        <Ionicons name="chevron-down" size={14} color={C.t3} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={ff.ov}>
            <TouchableWithoutFeedback>
              <View style={ff.sheet}>
                <Text style={ff.sheetTitle}>{label}</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {opts.map(o => {
                    const on = values.includes(o);
                    return (
                      <TouchableOpacity key={o} style={[ff.opt, on && { backgroundColor: C.purple + '18' }]} onPress={() => toggle(o)}>
                        <Ionicons name={on ? 'checkbox' : 'square-outline'} size={18} color={on ? C.purple : C.t3} />
                        <Text style={[ff.optTxt, on && { color: C.purple, fontWeight: '700' }]}>{o}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <TouchableOpacity style={ff.doneBtn} onPress={() => setOpen(false)}>
                  <Ionicons name="checkmark-circle" size={16} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={ff.doneTxt}>Done  ({values.length} selected)</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const ff = StyleSheet.create({
  grp:       { marginBottom: 14 },
  lbl:       { fontSize: 11, fontWeight: '600', color: C.t2, marginBottom: 6 },
  inp:       { backgroundColor: C.inp, borderRadius: 8, borderWidth: 1, borderColor: C.border, paddingHorizontal: 13, paddingVertical: 11, color: C.t1, fontSize: 14 },
  multi:     { minHeight: 80, paddingTop: 11 },
  drop:      { flexDirection: 'row', alignItems: 'center', backgroundColor: C.inp, borderRadius: 8, borderWidth: 1, borderColor: C.border, paddingHorizontal: 13, paddingVertical: 12, gap: 8 },
  dropVal:   { flex: 1, fontSize: 14, color: C.t1 },
  ov:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sheet:     { backgroundColor: C.card, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 36, maxHeight: '76%', borderTopWidth: 1, borderColor: C.border },
  sheetTitle:{ fontSize: 12, fontWeight: '700', color: C.t3, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 14 },
  opt:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 8, borderRadius: 8, marginBottom: 2 },
  optA:      { backgroundColor: C.blue + '18' },
  optTxt:    { fontSize: 14, color: C.t1 },
  optTxtA:   { color: C.blue, fontWeight: '700' },
  doneBtn:   { marginTop: 12, backgroundColor: C.blue, borderRadius: 8, padding: 13, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  doneTxt:   { color: '#fff', fontWeight: '700', fontSize: 13 },
});

// ─── SecHdr ───────────────────────────────────────────────────────────────────
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

// ─── Row action buttons (edit / delete) ──────────────────────────────────────
export function EditBtn({ onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={ab.edit} activeOpacity={0.7}>
      <Ionicons name="pencil" size={13} color={C.blue} />
    </TouchableOpacity>
  );
}
export function DeleteBtn({ onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={ab.del} activeOpacity={0.7}>
      <Ionicons name="trash" size={13} color={C.red} />
    </TouchableOpacity>
  );
}
const ab = StyleSheet.create({
  edit: { width: 28, height: 28, borderRadius: 6, backgroundColor: C.blue + '18', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.blue + '44' },
  del:  { width: 28, height: 28, borderRadius: 6, backgroundColor: C.red  + '18', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.red  + '44' },
});

// ─── Empty ────────────────────────────────────────────────────────────────────
export function Empty({ iconName, title, sub }) {
  return (
    <View style={em.wrap}>
      <Ionicons name={iconName || 'folder-open-outline'} size={38} color={C.t3} style={{ marginBottom: 10 }} />
      {title ? <Text style={em.title}>{title}</Text> : null}
      {sub   ? <Text style={em.sub}>{sub}</Text>     : null}
    </View>
  );
}
const em = StyleSheet.create({
  wrap:  { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  title: { fontSize: 13, fontWeight: '600', color: C.t2, textAlign: 'center' },
  sub:   { fontSize: 11, color: C.t3, marginTop: 4, textAlign: 'center', lineHeight: 17 },
});
