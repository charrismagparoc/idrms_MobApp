import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { C } from '../styles/colors';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 998,
  },
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: C.card,
    borderRightColor: C.border,
    borderRightWidth: 1,
    zIndex: 999,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingTop: 40,
    borderBottomColor: C.border,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: C.t1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: C.t3,
    fontWeight: '500',
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    paddingTop: 20,
    paddingHorizontal: 0,
  },
  sectionTitle: {
    paddingHorizontal: 20,
    fontSize: 11,
    fontWeight: '700',
    color: C.t3,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  navItem: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
    marginBottom: 2,
  },
  navItemActive: {
    borderLeftColor: C.blue,
    backgroundColor: 'rgba(66, 135, 245, 0.1)',
  },
  navIcon: {
    fontSize: 20,
    marginRight: 14,
    width: 28,
    textAlign: 'center',
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: C.t1,
  },
  navLabelInactive: {
    color: C.t2,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopColor: C.border,
    borderTopWidth: 1,
    marginTop: 'auto',
  },
  logoutBtn: {
    backgroundColor: 'rgba(232, 72, 85, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: C.red,
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },
});

export function Sidebar({
  isOpen,
  onClose,
  currentRoute,
  onNavigate,
  onLogout,
  userName = 'User',
}) {
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 0 : -SIDEBAR_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  const handleNavPress = (screenName) => {
    onNavigate(screenName);
    onClose();
  };

  const handleLogout = () => {
    onLogout();
    onClose();
  };

  const mainNavItems = [
    { name: 'Dashboard', icon: '🏠', label: 'Dashboard' },
    { name: 'Incidents', icon: '⚠️', label: 'Incidents' },
    { name: 'Alerts', icon: '📢', label: 'Alerts' },
    { name: 'Evacuation', icon: '🏕️', label: 'Evacuation' },
  ];

  const secondaryNavItems = [
    { name: 'Residents', icon: '👥', label: 'Residents' },
    { name: 'Resources', icon: '📦', label: 'Resources' },
    { name: 'Risk', icon: '📊', label: 'Risk' },
    { name: 'Reports', icon: '📈', label: 'Reports' },
    { name: 'Users', icon: '👤', label: 'Users' },
    { name: 'ActivityLog', icon: '📋', label: 'Activity Log' },
    { name: 'Map', icon: '🗺️', label: 'GIS Map' },
  ];

  return (
    <>
      {isOpen && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        />
      )}

      <Animated.View
        style={[
          styles.container,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        <SafeAreaView style={{ flex: 1, flexDirection: 'column' }}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>IDRMS</Text>
            <Text style={styles.subtitle}>Welcome, {userName}</Text>
          </View>

          {/* Navigation Items */}
          <ScrollView
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Main Navigation */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Main</Text>
              {mainNavItems.map((item) => (
                <TouchableOpacity
                  key={item.name}
                  style={[
                    styles.navItem,
                    currentRoute === item.name && styles.navItemActive,
                  ]}
                  onPress={() => handleNavPress(item.name)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.navIcon}>{item.icon}</Text>
                  <Text
                    style={[
                      styles.navLabel,
                      currentRoute !== item.name && styles.navLabelInactive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Secondary Navigation */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>More</Text>
              {secondaryNavItems.map((item) => (
                <TouchableOpacity
                  key={item.name}
                  style={[
                    styles.navItem,
                    currentRoute === item.name && styles.navItemActive,
                  ]}
                  onPress={() => handleNavPress(item.name)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.navIcon}>{item.icon}</Text>
                  <Text
                    style={[
                      styles.navLabel,
                      currentRoute !== item.name && styles.navLabelInactive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 16 }}></Text>
              <Text style={styles.logoutText}>Sign out</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>
    </>
  );
}