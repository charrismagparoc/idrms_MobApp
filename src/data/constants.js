export const SB_URL = 'https://qfclthshdqngpjixzjlz.supabase.co';
export const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmY2x0aHNoZHFuZ3BqaXh6amx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMDkyNzIsImV4cCI6MjA4NzU4NTI3Mn0.eauPhAsfm3sbnW6uj_opQPxBy6fN4szJIXpJV-tRq4g';

export const ZONES      = ['Zone 1','Zone 2','Zone 3','Zone 4','Zone 5','Zone 6'];
export const TYPES      = ['Flood','Fire','Earthquake','Landslide','Storm'];
export const SEVERITIES = ['Low','Medium','High'];
export const INC_STATUS = ['Pending','Verified','Active','Responded','Resolved'];
export const ALT_LEVELS = ['Advisory','Warning','Danger','Resolved'];
export const EVAC_STAT  = ['Open','Full','Closed'];
export const RES_STAT   = ['Safe','Evacuated','Unaccounted'];
export const VULN_TAGS  = ['Senior Citizen','PWD','Pregnant','Infant','Bedridden'];
export const FACILITIES = ['Water','Restroom','Medical','Power','Food','Sleeping Area','Wifi'];
export const RES_CATS   = ['Equipment','Medical','Food Supply','Vehicle','Safety Gear'];

export const ZONE_COORDS = {
  'Zone 1':{lat:8.4945,lng:124.6415},
  'Zone 2':{lat:8.4932,lng:124.6462},
  'Zone 3':{lat:8.4908,lng:124.6508},
  'Zone 4':{lat:8.4893,lng:124.6478},
  'Zone 5':{lat:8.4872,lng:124.6448},
  'Zone 6':{lat:8.4860,lng:124.6502},
};

export const ZONE_BASE = {
  'Zone 1':25,'Zone 2':42,'Zone 3':78,
  'Zone 4':18,'Zone 5':82,'Zone 6':48,
};

export const ZONE_HAZARD = {
  'Zone 1':'Fire','Zone 2':'Flood','Zone 3':'Flood',
  'Zone 4':'Storm','Zone 5':'Landslide','Zone 6':'Storm',
};

export const SCORING_RULES = [
  ['Zone Base Score',   'Zone 5=82, Zone 3=78, Zone 6=48, Zone 2=42, Zone 1=25, Zone 4=18'],
  ['Vulnerability Tags','Bedridden+12, PWD+10, Senior+8, Pregnant+8, Infant+7 (cap +40)'],
  ['Evacuation Status', 'Unaccounted +18 pts · Evacuated -15 pts'],
  ['Household Size',    'Each extra member +1.8 pts, capped at +12'],
  ['Active Incidents',  'Each zone incident +6 pts, capped at +20'],
  ['Weather Risk',      'High +15 pts · Medium +7 pts'],
  ['Rainy Season',      'June–November automatically adds +8 pts'],
];
