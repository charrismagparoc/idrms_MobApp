import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { C } from '../styles/colors';

export default function LoginScreen() {
  const { loginUser } = useApp();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [pass,  setPass]  = useState('');
  const [err,   setErr]   = useState('');
  const [busy,  setBusy]  = useState(false);

  async function submit() {
    if (!email.trim() || !pass) { setErr('Enter email and password.'); return; }
    setErr(''); setBusy(true);
    try {
      const r = await loginUser(email.trim(), pass);
      if (!r.ok) setErr(r.msg || 'Login failed.');
      else login(r.user);
    } catch (e) { setErr(e.message || 'Error.'); }
    setBusy(false);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.screen} contentContainerStyle={s.center} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <View style={s.logoBox}><Text style={s.logo}>🛡️</Text></View>
          <Text style={s.app}>IDRMS</Text>
          <Text style={s.sub}>Integrated Disaster Risk Management System</Text>
          <Text style={s.brgy}>Brgy. Kauswagan · Cagayan de Oro City</Text>
          <View style={s.div} />
          <Text style={s.lbl}>Email Address</Text>
          <TextInput
            style={s.inp}
            value={email}
            onChangeText={setEmail}
            placeholder="admin@kauswagan.gov.ph"
            placeholderTextColor={C.t3}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text style={[s.lbl, { marginTop: 12 }]}>Password</Text>
          <TextInput
            style={s.inp}
            value={pass}
            onChangeText={setPass}
            placeholder="••••••••"
            placeholderTextColor={C.t3}
            secureTextEntry={true}
            autoCapitalize="none"
          />
          {!!err && <View style={s.errBox}><Text style={s.errTxt}>{err}</Text></View>}
          <TouchableOpacity style={[s.btn, busy ? s.btnOff : null]} onPress={submit} disabled={busy} activeOpacity={0.8}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Sign In →</Text>}
          </TouchableOpacity>
          <View style={s.hint}>
            <Text style={s.hintH}>Demo Credentials</Text>
            <Text style={s.hintL}>admin@kauswagan.gov.ph / admin123</Text>
          </View>
          <Text style={s.foot}>BDRRMC v3.0 · Powered by Supabase</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: C.bg },
  center:  { flexGrow: 1, justifyContent: 'center', padding: 20, paddingVertical: 48 },
  card:    { backgroundColor: C.card, borderRadius: 20, padding: 28, borderWidth: 1, borderColor: C.border },
  logoBox: { width: 64, height: 64, borderRadius: 18, backgroundColor: C.blue + '22', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 14 },
  logo:    { fontSize: 32 },
  app:     { fontSize: 28, fontWeight: '800', color: C.blue, textAlign: 'center' },
  sub:     { fontSize: 13, color: C.t2, textAlign: 'center', marginTop: 4, lineHeight: 19 },
  brgy:    { fontSize: 10, color: C.t3, textAlign: 'center', marginTop: 3, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  div:     { height: 1, backgroundColor: C.border, marginVertical: 20 },
  lbl:     { fontSize: 12, fontWeight: '600', color: C.t2, marginBottom: 6 },
  inp:     { backgroundColor: C.inp, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 12, color: C.t1, fontSize: 14 },
  errBox:  { backgroundColor: 'rgba(232,72,85,0.12)', borderRadius: 10, padding: 11, marginTop: 12, borderWidth: 1, borderColor: C.red + '44' },
  errTxt:  { color: C.red, fontSize: 13, fontWeight: '600' },
  btn:     { backgroundColor: C.blue, borderRadius: 12, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  btnOff:  { opacity: 0.5 },
  btnTxt:  { color: '#fff', fontSize: 16, fontWeight: '700' },
  hint:    { backgroundColor: C.el, borderRadius: 10, padding: 13, marginTop: 18, borderWidth: 1, borderColor: C.border },
  hintH:   { fontSize: 10, fontWeight: '700', color: C.t3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 },
  hintL:   { fontSize: 12, color: C.t2 },
  foot:    { textAlign: 'center', fontSize: 11, color: C.t3, marginTop: 20 },
});