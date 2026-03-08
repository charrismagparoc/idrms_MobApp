import { StyleSheet } from 'react-native';
import { C } from '../styles/colors';

export const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: C.card,
    borderBottomColor: C.border,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 35,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 10,
  },
  hamburger: {
    padding: 6,
  },
  hamburgerText: {
    fontSize: 24,
    color: C.t1,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: C.t1,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    color: C.t3,
    marginTop: 2,
    lineHeight: 15,
  },
  webview: {
    flex: 1,
  },
  searchBar: {
    padding: 8,
    paddingBottom: 6,
    backgroundColor: C.card,
  },
});