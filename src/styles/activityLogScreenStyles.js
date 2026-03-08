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
  searchBar: {
    padding: 8,
    paddingBottom: 6,
    backgroundColor: C.card,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.el,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
    color: C.t3,
  },
  searchInput: {
    flex: 1,
    color: C.t1,
    fontSize: 14,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  clearBtn: {
    padding: 6,
    marginLeft: 4,
  },
  clearBtnText: {
    fontSize: 16,
    color: C.t2,
    fontWeight: '700',
  },
  fbar: {
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  list: {
    padding: 8,
    paddingTop: 6,
  },
  info: {
    marginBottom: 12,
  },
  countText: {
    fontSize: 12,
    color: C.t2,
    fontWeight: '500',
    marginTop: 6,
  },
  hintText: {
    fontSize: 11,
    color: C.blue,
    marginTop: 6,
    fontWeight: '500',
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 13,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: C.border,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginBottom: 9,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarTxt: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
  action: {
    fontSize: 12,
    fontWeight: '600',
    color: C.t1,
    lineHeight: 17,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 5,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeTxt: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  user: {
    fontSize: 10,
    color: C.t3,
    fontWeight: '500',
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timestamp: {
    fontSize: 10,
    color: C.t3,
  },
  urgent: {
    fontSize: 11,
    color: C.red,
    fontWeight: '700',
  },
});