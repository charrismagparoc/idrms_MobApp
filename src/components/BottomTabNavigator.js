import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { C } from '../styles/colors';

const TAB_ITEMS = [
  { name: 'Dashboard',   icon: 'home-outline',      iconActive: 'home' },
  { name: 'Alerts',      icon: 'megaphone-outline', iconActive: 'megaphone' },
  { name: 'Evacuation',  icon: 'location-outline',  iconActive: 'location' },
  { name: 'Residents',   icon: 'people-outline',    iconActive: 'people' },
  { name: 'Resources',   icon: 'cube-outline',      iconActive: 'cube' },
  { name: 'Incidents',   icon: 'warning-outline',   iconActive: 'warning' },
  { name: 'Risk',        icon: 'analytics-outline', iconActive: 'analytics' },
  { name: 'Reports',     icon: 'bar-chart-outline', iconActive: 'bar-chart' },
  { name: 'Map',         icon: 'map-outline',       iconActive: 'map' },
  { name: 'Users',       icon: 'person-outline',    iconActive: 'person' },
  { name: 'ActivityLog', icon: 'list-outline',      iconActive: 'list' },
];

const MAIN_TABS = TAB_ITEMS.slice(0, 5);
const MORE_TABS = TAB_ITEMS.slice(5);

export function BottomTabNavigator({ currentRoute, onNavigate }) {
  const insets = useSafeAreaInsets();
  const { logout, user } = useAuth();
  const { log } = useApp();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const handleNavigate = (screenName) => {
    onNavigate(screenName);
    setShowMoreMenu(false);
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    if (user) log(`Signed out: ${user.name}`, 'Auth', user.name);
    logout();
  };

  return (
    <>
      <View style={[s.container, { paddingBottom: insets.bottom }]}>
        <View style={s.tabBar}>
          {MAIN_TABS.map((item) => {
            const active = currentRoute === item.name;
            return (
              <TouchableOpacity
                key={item.name}
                style={[s.tabItem, active && s.tabItemActive]}
                onPress={() => onNavigate(item.name)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={active ? item.iconActive : item.icon}
                  size={22}
                  color={active ? C.blue : C.t3}
                />
                {active && <Text style={s.tabLabel}>{item.name}</Text>}
              </TouchableOpacity>
            );
          })}

          {/* More Menu */}
          <TouchableOpacity
            style={s.tabItem}
            onPress={() => setShowMoreMenu(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-horizontal" size={22} color={C.t3} />
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity
            style={[s.tabItem, s.logoutTabItem]}
            onPress={() => setShowLogoutModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={22} color={C.red} />
          </TouchableOpacity>
        </View>
      </View>

      {/* More Menu Modal */}
      <Modal
        visible={showMoreMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMoreMenu(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowMoreMenu(false)}>
          <View style={moreMenuStyles.overlay}>
            <TouchableWithoutFeedback>
              <View style={moreMenuStyles.sheet}>
                <View style={moreMenuStyles.handle} />
                <Text style={moreMenuStyles.title}>More Screens</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {MORE_TABS.map((item) => {
                    const active = currentRoute === item.name;
                    return (
                      <TouchableOpacity
                        key={item.name}
                        style={[moreMenuStyles.menuItem, active && moreMenuStyles.menuItemActive]}
                        onPress={() => handleNavigate(item.name)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={active ? item.iconActive : item.icon}
                          size={20}
                          color={active ? C.blue : C.t3}
                          style={moreMenuStyles.menuIcon}
                        />
                        <Text style={[moreMenuStyles.menuText, active && moreMenuStyles.menuTextActive]}>
                          {item.name}
                        </Text>
                        {active && (
                          <Ionicons name="checkmark-circle" size={18} color={C.blue} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <TouchableOpacity
                  style={moreMenuStyles.closeBtn}
                  onPress={() => setShowMoreMenu(false)}
                >
                  <Text style={moreMenuStyles.closeBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowLogoutModal(false)}>
          <View style={s.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={s.modalContent}>
                <View style={s.modalHeader}>
                  <Ionicons name="log-out-outline" size={24} color={C.red} />
                  <Text style={s.modalTitle}>Sign Out?</Text>
                </View>
                <Text style={s.modalText}>
                  Are you sure you want to sign out?
                </Text>
                <View style={s.modalActions}>
                  <TouchableOpacity
                    style={[s.modalBtn, s.modalBtnCancel]}
                    onPress={() => setShowLogoutModal(false)}
                  >
                    <Text style={s.modalBtnTxtCancel}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.modalBtn, s.modalBtnLogout]}
                    onPress={handleLogout}
                  >
                    <Text style={s.modalBtnTxt}>Sign Out</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: C.blue + '18',
  },
  logoutTabItem: {
    marginLeft: 'auto',
    marginRight: 8,
  },
  tabLabel: {
    fontSize: 9,
    color: C.blue,
    fontWeight: '700',
    marginTop: 4,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: C.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.t1,
  },
  modalText: {
    fontSize: 13,
    color: C.t2,
    marginBottom: 18,
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalBtnCancel: {
    backgroundColor: C.el,
    borderColor: C.border,
  },
  modalBtnTxtCancel: {
    color: C.t1,
    fontSize: 13,
    fontWeight: '700',
  },
  modalBtnLogout: {
    backgroundColor: C.red + '18',
    borderColor: C.red + '55',
  },
  modalBtnTxt: {
    color: C.red,
    fontSize: 13,
    fontWeight: '700',
  },
});

const moreMenuStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    maxHeight: '80%',
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  handle: {
    width: 38,
    height: 4,
    backgroundColor: C.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: C.t1,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 4,
    borderRadius: 10,
    gap: 12,
  },
  menuItemActive: {
    backgroundColor: C.blue + '18',
  },
  menuIcon: {
    minWidth: 20,
  },
  menuText: {
    fontSize: 14,
    color: C.t1,
    fontWeight: '500',
    flex: 1,
  },
  menuTextActive: {
    color: C.blue,
    fontWeight: '700',
  },
  closeBtn: {
    backgroundColor: C.el,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.t1,
  },
});