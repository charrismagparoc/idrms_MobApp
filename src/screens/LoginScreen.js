import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { C } from '../styles/colors';

export default function LoginScreen() {
  const { loginUser } = useApp();
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [pass,  setPass]  = useState('');
  const [err,   setErr]   = useState('');
  const [busy,  setBusy]  = useState(false);
  const [showPass, setShowPass] = useState(false);

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
      <ScrollView
        style={{ flex: 1, backgroundColor: C.bg }}
        contentContainerStyle={[s.center, { paddingTop: Math.max(insets.top, 20) + 20, paddingBottom: Math.max(insets.bottom, 20) + 20 }]}
        keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          {/* Logo */}
          <View style={s.logoBox}>
            <Ionicons name="shield-checkmark" size={36} color={C.blue} />
          </View>
          <Text style={s.app}>IDRMS</Text>
          <Text style={s.sub}>Integrated Disaster Risk Management System</Text>
          <Text style={s.brgy}>Brgy. Kauswagan · Cagayan de Oro City</Text>

          <View style={s.div} />

          {/* Email */}
          <Text style={s.lbl}>Email Address</Text>
          <View style={s.inpWrap}>
            <Ionicons name="mail-outline" size={16} color={C.t3} style={{ marginRight: 8 }} />
            <TextInput style={s.inp} value={email} onChangeText={setEmail}
              placeholder="admin@kauswagan.gov.ph" placeholderTextColor={C.t3}
              keyboardType="email-address" autoCapitalize="none" />
          </View>

          {/* Password */}
          <Text style={[s.lbl, { marginTop: 12 }]}>Password</Text>
          <View style={s.inpWrap}>
            <Ionicons name="lock-closed-outline" size={16} color={C.t3} style={{ marginRight: 8 }} />
            <TextInput style={s.inp} value={pass} onChangeText={setPass}
              placeholder="••••••••" placeholderTextColor={C.t3}
              secureTextEntry={!showPass} autoCapitalize="none" />
            <TouchableOpacity onPress={() => setShowPass(p => !p)}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.t3} />
            </TouchableOpacity>
          </View>

          {!!err && (
            <View style={s.errBox}>
              <Ionicons name="alert-circle-outline" size={14} color={C.red} />
              <Text style={s.errTxt}>{err}</Text>
            </View>
          )}

          <TouchableOpacity style={[s.btn, busy && s.btnOff]} onPress={submit} disabled={busy} activeOpacity={0.85}>
            {busy
              ? <ActivityIndicator color="#fff" />
              : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="log-in-outline" size={18} color="#fff" />
                  <Text style={s.btnTxt}>Sign In</Text>
                </View>
              )}
          </TouchableOpacity>

          <View style={s.hint}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 }}>
              <Ionicons name="information-circle-outline" size={13} color={C.t3} />
              <Text style={s.hintH}>Demo Credentials</Text>
            </View>
            <Text style={s.hintL}>admin@kauswagan.gov.ph  /  admin123</Text>
          </View>

          <Text style={s.foot}>BDRRMC v3.0 · Powered by Supabase</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  center:  { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20 },
  card:    { backgroundColor: C.card, borderRadius: 16, padding: 26, borderWidth: 1, borderColor: C.border },
  logoBox: { width: 64, height: 64, borderRadius: 16, backgroundColor: C.blue + '22', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 14 },
  app:     { fontSize: 26, fontWeight: '800', color: C.blue, textAlign: 'center' },
  sub:     { fontSize: 12, color: C.t2, textAlign: 'center', marginTop: 4, lineHeight: 18 },
  brgy:    { fontSize: 9, color: C.t3, textAlign: 'center', marginTop: 3, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  div:     { height: 1, backgroundColor: C.border, marginVertical: 20 },
  lbl:     { fontSize: 11, fontWeight: '600', color: C.t2, marginBottom: 6 },
  inpWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.inp, borderRadius: 8, borderWidth: 1, borderColor: C.border, paddingHorizontal: 13, paddingVertical: 11 },
  inp:     { flex: 1, color: C.t1, fontSize: 14 },
  errBox:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(232,72,85,0.12)', borderRadius: 8, padding: 11, marginTop: 12, borderWidth: 1, borderColor: C.red + '44' },
  errTxt:  { color: C.red, fontSize: 12, fontWeight: '600' },
  btn:     { backgroundColor: C.blue, borderRadius: 10, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  btnOff:  { opacity: 0.5 },
  btnTxt:  { color: '#fff', fontSize: 15, fontWeight: '700' },
  hint:    { backgroundColor: C.el, borderRadius: 8, padding: 13, marginTop: 18, borderWidth: 1, borderColor: C.border },
  hintH:   { fontSize: 10, fontWeight: '700', color: C.t3, textTransform: 'uppercase', letterSpacing: 0.5 },
  hintL:   { fontSize: 12, color: C.t2 },
  foot:    { textAlign: 'center', fontSize: 10, color: C.t3, marginTop: 18 },
});
