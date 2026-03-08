import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { ScreenHeader } from '../components/ScreenHeader';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ZONE_SUBDIVISIONS } from '../data/constants';
import { C } from '../styles/colors';

export default function MapScreen({ navigation }) {
  const { evacCenters, incidents, residents } = useApp();
  const { logout } = useAuth();
  const webViewRef   = useRef(null);
  const [filter, setFilter]       = useState('all');
  const [showRings, setShowRings] = useState(true);

  const activeInc   = incidents.filter(i => ['Active','Pending'].includes(i.status)).length;
  const openCenters = evacCenters.filter(c => c.status === 'Open').length;
  const evacuated   = residents.filter(r => r.evacuationStatus === 'Evacuated').length;

  const mapHTML = `<!DOCTYPE html><html><head>
    <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{background:#0c1120}
      #map{width:100vw;height:100vh}
      .stats{position:fixed;top:10px;left:10px;right:10px;background:rgba(19,29,48,.96);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:10px;z-index:500;display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
      .stat{text-align:center;padding:7px;background:rgba(255,255,255,.04);border-radius:6px;border:1px solid rgba(255,255,255,.08)}
      .sv{display:block;font-size:16px;font-weight:800;margin-bottom:1px}
      .sl{color:#8892a8;font-size:9px;text-transform:uppercase;font-weight:600}
      .ctrl{position:fixed;bottom:20px;left:10px;right:10px;background:rgba(19,29,48,.96);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:9px;z-index:500;display:flex;gap:5px;flex-wrap:wrap}
      .cb{flex:1;min-width:55px;padding:7px 4px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#a8b5c7;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;text-align:center}
      .cb.on{background:#5bc0eb;border-color:#5bc0eb;color:#fff}
      .ck{padding:7px 10px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#a8b5c7;border-radius:6px;font-size:11px;cursor:pointer;display:flex;align-items:center;gap:5px}
    </style>
  </head><body>
  <div id="map"></div>
  <div class="stats">
    <div class="stat"><span class="sv" style="color:#e84855">${activeInc}</span><span class="sl">Active</span></div>
    <div class="stat"><span class="sv" style="color:#00d68f">${openCenters}</span><span class="sl">Centers</span></div>
    <div class="stat"><span class="sv" style="color:#5bc0eb">${evacuated}</span><span class="sl">Evacuated</span></div>
    <div class="stat"><span class="sv" style="color:#5bc0eb">${residents.length}</span><span class="sl">Residents</span></div>
  </div>
  <div class="ctrl">
    <button class="cb ${filter==='all'?'on':''}" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type:'filter',value:'all'}))">All</button>
    <button class="cb ${filter==='evacuation'?'on':''}" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type:'filter',value:'evacuation'}))">Evac</button>
    <button class="cb ${filter==='incidents'?'on':''}" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type:'filter',value:'incidents'}))">Incidents</button>
    <button class="cb ${filter==='residents'?'on':''}" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type:'filter',value:'residents'}))">Residents</button>
    <label class="ck"><input type="checkbox" ${showRings?'checked':''} onchange="window.ReactNativeWebView.postMessage(JSON.stringify({type:'rings',value:this.checked}))"><span>Rings</span></label>
  </div>
  <script>
    const map=L.map('map',{center:[8.4942,124.6447],zoom:16,minZoom:13,maxZoom:19,attributionControl:false,zoomControl:false});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
    function pin(color,size=28){return L.divIcon({className:'',html:'<div style="width:'+size+'px;height:'+size+'px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:'+color+';border:2px solid rgba(255,255,255,.85);box-shadow:0 3px 10px rgba(0,0,0,.55)"></div>',iconSize:[size,size],iconAnchor:[size/2,size],popupAnchor:[0,-size-4]})}
    let layers={};
    const evac=${JSON.stringify(evacCenters)};
    const inc=${JSON.stringify(incidents)};
    const res=${JSON.stringify(residents)};
    const IC={Flood:'#5bc0eb',Fire:'#e84855',Earthquake:'#9b72cf',Landslide:'#f4a35a',Storm:'#f7c541'};
    const filt='${filter}';
    const rings=${showRings};
    function render(){
      Object.values(layers).forEach(l=>map.removeLayer(l));layers={};
      if(filt==='all'||filt==='evacuation'){const lg=L.layerGroup().addTo(map);evac.forEach(c=>{if(!c.lat||!c.lng)return;const col=c.status==='Open'?'#00d68f':c.status==='Full'?'#f4a35a':'#e84855';L.marker([c.lat,c.lng],{icon:pin(col,32)}).addTo(lg).bindPopup('<b>'+c.name+'</b><br>'+c.zone+' · '+c.status+'<br>'+c.occupancy+'/'+c.capacity)});layers.evac=lg;}
      if(filt==='all'||filt==='incidents'){const lg=L.layerGroup().addTo(map);inc.forEach(i=>{if(!i.lat||!i.lng)return;L.marker([i.lat,i.lng],{icon:pin(IC[i.type]||'#5bc0eb',26)}).addTo(lg).bindPopup('<b>'+i.type+'</b><br>'+i.zone+' · '+i.severity)});layers.inc=lg;}
      if(filt==='all'||filt==='residents'){const lg=L.layerGroup().addTo(map);res.filter(r=>r.lat&&r.lng).slice(0,400).forEach(r=>{const col={Safe:'#00d68f',Evacuated:'#5bc0eb',Unaccounted:'#e84855'}[r.evacuationStatus]||'#5bc0eb';L.marker([r.lat,r.lng],{icon:pin(col,20)}).addTo(lg).bindPopup('<b>'+r.name+'</b><br>'+r.zone+' · '+r.evacuationStatus)});layers.res=lg;}
      if(rings){const lg2=L.layerGroup().addTo(map);const zs=${JSON.stringify(ZONE_SUBDIVISIONS)};Object.values(zs).forEach(s=>{if(!s||!s[0])return;L.circle([s[0].lat,s[0].lng],{radius:90,color:'#5bc0eb',fillColor:'#5bc0eb',fillOpacity:.04,weight:1.5,dashArray:'5 5'}).addTo(lg2)});layers.rings=lg2;}
    }
    render();
    L.marker([8.4942,124.6447],{icon:L.divIcon({html:'<div style="background:#9b72cf;color:#fff;border-radius:6px;padding:4px 10px;font-size:10px;font-weight:800;border:1.5px solid rgba(255,255,255,.7)">HALL</div>',iconAnchor:[28,14]})}).addTo(map).bindPopup('<b>Barangay Hall</b><br>BDRRMC');
  </script></body></html>`;

  const handleMsg = (e) => {
    try {
      const m = JSON.parse(e.nativeEvent.data);
      if (m.type === 'filter') setFilter(m.value);
      else if (m.type === 'rings') setShowRings(m.value);
    } catch (_) {}
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScreenHeader
        title="GIS Map"
        currentRoute="Map"
        onNavigate={n => navigation.navigate(n)}
        onLogout={logout}
      />
      <WebView ref={webViewRef} source={{ html: mapHTML }} style={{ flex: 1 }}
        onMessage={handleMsg} originWhitelist={['*']} />
      </View>
  );
}
