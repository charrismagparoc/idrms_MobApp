import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../styles/colors';

const NAV_ITEMS = [
  { name: 'Dashboard',   icon: 'home-outline',      iconActive: 'home',        label: 'Dashboard'  },
  { name: 'Alerts',      icon: 'megaphone-outline', iconActive: 'megaphone',   label: 'Alerts'     },
  { name: 'Evacuation',  icon: 'location-outline',  iconActive: 'location',    label: 'Evacuation' },
  { name: 'Residents',   icon: 'people-outline',    iconActive: 'people',      label: 'Residents'  },
  { name: 'Resources',   icon: 'cube-outline',      iconActive: 'cube',        label: 'Resources'  },
  { name: 'Incidents',   icon: 'warning-outline',   iconActive: 'warning',     label: 'Incidents'  },
  { name: 'Risk',        icon: 'analytics-outline', iconActive: 'analytics',   label: 'Risk'       },
  { name: 'Reports',     icon: 'bar-chart-outline', iconActive: 'bar-chart',   label: 'Reports'    },
  { name: 'Map',         icon: 'map-outline',       iconActive: 'map',         label: 'Map'        },
  { name: 'Users',       icon: 'person-outline',    iconActive: 'person',      label: 'Users'      },
  { name: 'ActivityLog', icon: 'list-outline',      iconActive: 'list',        label: 'Activity'   },
];

export function ScreenHeader({ title, currentRoute, onNavigate, onLogout }) {
  const insets = useSafeAreaInsets();

  return (
    // ── The whole header is fixed/sticky because screens use it OUTSIDE the ScrollView ──
    <View style={[s.container, { paddingTop: Math.max(insets.top, 8) }]}>

      {/* ── Top bar: shield icon + title on left, Sign Out on right ── */}
      <View style={s.topBar}>
        <View style={s.logoRow}>
          <Ionicons name="shield-checkmark" size={18} color={C.blue} />
          <Text style={s.title}>{title}</Text>
        </View>
        <TouchableOpacity
          style={s.logoutBtn}
          onPress={onLogout}
          activeOpacity={0.7}
          // hitSlop gives larger tap area so Sign Out never misses taps
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="log-out-outline" size={18} color={C.red} />
          <Text style={s.logoutTxt}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* ── Horizontal scrollable nav bar ──
          keyboardShouldPersistTaps="always"  → taps register even when keyboard open
          nestedScrollEnabled                 → allows scroll inside a parent ScrollView
          scrollEventThrottle={16}            → smooth scroll tracking
          The nav does NOT scroll the page — it only scrolls horizontally within itself ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.navScroll}
        style={s.navBar}
        keyboardShouldPersistTaps="always"
        nestedScrollEnabled={true}
        scrollEventThrottle={16}
        // decelerationRate="fast" makes swipe snappier on Android
        decelerationRate="fast"
      >
        {NAV_ITEMS.map(item => {
          const active = currentRoute === item.name;
          return (
            <TouchableOpacity
              key={item.name}
              style={[s.navItem, active && s.navItemActive]}
              // onPress navigates WITHOUT resetting the whole app —
              // navigation.navigate() reuses existing screen instances
              onPress={() => onNavigate(item.name)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={active ? item.iconActive : item.icon}
                size={17}
                color={active ? C.blue : C.t3}
              />
              <Text style={[s.navLabel, active && s.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  // container is NOT position:'absolute' — it sits at top of the screen's flex column
  // This means it is always pinned above the ScrollView content in every screen
  container:      { backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  topBar:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 10 },
  logoRow:        { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title:          { fontSize: 15, fontWeight: '700', color: C.t1 },
  logoutBtn:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(232,72,85,0.12)', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 7, borderWidth: 1, borderColor: C.red + '44' },
  logoutTxt:      { color: C.red, fontSize: 11, fontWeight: '700' },
  navBar:         { borderTopWidth: 1, borderTopColor: C.border },
  navScroll:      { paddingHorizontal: 8, paddingVertical: 7, gap: 4, flexDirection: 'row' },
  navItem:        { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: 'transparent' },
  navItemActive:  { backgroundColor: C.blue + '18', borderColor: C.blue + '55' },
  navLabel:       { fontSize: 11, fontWeight: '600', color: C.t3 },
  navLabelActive: { color: C.blue, fontWeight: '700' },
});
