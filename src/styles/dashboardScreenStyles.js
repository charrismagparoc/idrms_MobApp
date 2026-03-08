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
  screen: { 
    flex: 1, 
    backgroundColor: C.bg 
  },
  pad: { 
    padding: 8,
    paddingTop: 6
  },
  hdr: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    justifyContent: 'space-between', 
    marginBottom: 8
  },
  appName: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: C.t1 
  },
  appSub: { 
    fontSize: 10, 
    color: C.t3, 
    marginTop: 2, 
    fontWeight: '600' 
  },
  hdrR: { 
    alignItems: 'flex-end', 
    gap: 6 
  },
  wchip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 5, 
    backgroundColor: C.el, 
    borderRadius: 20, 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderWidth: 1 
  },
  wTxt: { 
    fontSize: 11, 
    color: C.t1, 
    fontWeight: '600' 
  },
  rpill: { 
    paddingHorizontal: 7, 
    paddingVertical: 2, 
    borderRadius: 10, 
    marginLeft: 4 
  },
  rpillTxt: { 
    fontSize: 9, 
    fontWeight: '800', 
    letterSpacing: 0.4 
  },
  banner: { 
    borderRadius: 12, 
    borderWidth: 1.5, 
    padding: 13, 
    marginBottom: 11, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  bannerLbl: { 
    fontSize: 10, 
    color: C.t3, 
    fontWeight: '700', 
    textTransform: 'uppercase', 
    letterSpacing: 0.4 
  },
  bannerVal: { 
    fontSize: 17, 
    fontWeight: '800', 
    marginTop: 2 
  },
  dot: { 
    width: 13, 
    height: 13, 
    borderRadius: 7 
  },
  row: { 
    flexDirection: 'row', 
    gap: 7, 
    marginBottom: 7 
  },
  mt0: { 
    marginTop: 0 
  },
  card: { 
    backgroundColor: C.card, 
    borderRadius: 13, 
    padding: 13, 
    marginBottom: 11, 
    borderWidth: 1, 
    borderColor: C.border 
  },
  empty: { 
    color: C.t3, 
    fontSize: 13, 
    textAlign: 'center', 
    paddingVertical: 8 
  },
  irow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 9, 
    paddingVertical: 7, 
    borderBottomWidth: 1, 
    borderBottomColor: C.border 
  },
  idot: { 
    width: 7, 
    height: 7, 
    borderRadius: 4, 
    flexShrink: 0 
  },
  ititle: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: C.t1 
  },
  isub: { 
    fontSize: 11, 
    color: C.t3, 
    marginTop: 1 
  },
  zrow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 7, 
    marginBottom: 9 
  },
  zname: { 
    fontSize: 11, 
    fontWeight: '700', 
    color: C.t2, 
    width: 46 
  },
  ztrack: { 
    flex: 1, 
    height: 7, 
    backgroundColor: C.el, 
    borderRadius: 4, 
    overflow: 'hidden' 
  },
  zfill: { 
    height: '100%', 
    borderRadius: 4 
  },
  zscore: { 
    fontSize: 12, 
    fontWeight: '800', 
    width: 24, 
    textAlign: 'right' 
  },
  arow: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    gap: 9, 
    paddingVertical: 6, 
    borderBottomWidth: 1, 
    borderBottomColor: C.border 
  },
  adot: { 
    width: 6, 
    height: 6, 
    borderRadius: 3, 
    marginTop: 5, 
    flexShrink: 0 
  },
  atxt: { 
    fontSize: 12, 
    color: C.t1, 
    fontWeight: '500' 
  },
  ameta: { 
    fontSize: 10, 
    color: C.t3, 
    marginTop: 2 
  },
});