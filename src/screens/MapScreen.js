import { useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Sidebar } from '../components/Sidebar';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ZONE_SUBDIVISIONS } from '../data/constants';
import { C } from '../styles/colors';
import { styles } from '../styles/mapScreenStyles';

const MAP_CENTER = [8.4942, 124.6447];
const INC_COLOR = {
  Flood: '#5bc0eb',
  Fire: '#e84855',
  Earthquake: '#9b72cf',
  Landslide: '#f4a35a',
  Storm: '#f7c541',
};

export default function MapScreen({ navigation }) {
  const { evacCenters, incidents, residents, reload } = useApp();
  const { logout } = useAuth();
  const webViewRef = useRef(null);
  const [filter, setFilter] = useState('all');
  const [showRings, setShowRings] = useState(true);
  const [busy, setBusy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeInc = incidents.filter(i => ['Active', 'Pending'].includes(i.status)).length;
  const openCenters = evacCenters.filter(c => c.status === 'Open').length;
  const evacuated = residents.filter(r => r.evacuationStatus === 'Evacuated').length;

  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>IDRMS Map</title>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
      <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui; background: #0c1120; }
        #map { width: 100vw; height: 100vh; }
        .leaflet-popup-content { font-size: 12px; }
        .leaflet-popup-content b { color: #4287f5; }
        .info-box {
          position: fixed;
          top: 12px; left: 12px; right: 12px;
          background: rgba(26, 37, 65, 0.95);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 10px;
          padding: 12px;
          backdrop-filter: blur(10px);
          z-index: 500;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          font-size: 11px;
        }
        .stat {
          text-align: center;
          padding: 8px;
          background: rgba(255,255,255,.04);
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,.08);
        }
        .stat-val {
          display: block;
          font-size: 16px;
          font-weight: 800;
          margin-bottom: 2px;
        }
        .stat-red { color: #e84855; }
        .stat-green { color: #00d68f; }
        .stat-blue { color: #4287f5; }
        .stat-lbl { color: #8892a8; }
        .controls {
          position: fixed;
          bottom: 24px; left: 12px; right: 12px;
          background: rgba(26, 37, 65, 0.95);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 10px;
          padding: 10px;
          backdrop-filter: blur(10px);
          z-index: 500;
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .ctrl-btn {
          flex: 1;
          min-width: 70px;
          padding: 8px 10px;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.15);
          color: #a8b5c7;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all .2s;
        }
        .ctrl-btn.active {
          background: #4287f5;
          border-color: #4287f5;
          color: #fff;
        }
        .ctrl-btn:hover { background: rgba(255,255,255,.12); }
        .ctrl-check {
          padding: 8px 12px;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.15);
          color: #a8b5c7;
          border-radius: 6px;
          font-size: 11px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <div class="info-box">
        <div class="stat">
          <span class="stat-val stat-red">${activeInc}</span>
          <span class="stat-lbl">Active Inc.</span>
        </div>
        <div class="stat">
          <span class="stat-val stat-green">${openCenters}</span>
          <span class="stat-lbl">Open Centers</span>
        </div>
        <div class="stat">
          <span class="stat-val stat-blue">${evacuated}</span>
          <span class="stat-lbl">Evacuated</span>
        </div>
        <div class="stat">
          <span class="stat-val stat-blue">${residents.length}</span>
          <span class="stat-lbl">Residents</span>
        </div>
      </div>
      <div class="controls">
        <button class="ctrl-btn ${filter === 'all' ? 'active' : ''}" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type: 'filter', value: 'all'}))">All</button>
        <button class="ctrl-btn ${filter === 'evacuation' ? 'active' : ''}" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type: 'filter', value: 'evacuation'}))">Evac</button>
        <button class="ctrl-btn ${filter === 'incidents' ? 'active' : ''}" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type: 'filter', value: 'incidents'}))">Inc.</button>
        <button class="ctrl-btn ${filter === 'residents' ? 'active' : ''}" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type: 'filter', value: 'residents'}))">Res.</button>
        <label class="ctrl-check">
          <input type="checkbox" ${showRings ? 'checked' : ''} onchange="window.ReactNativeWebView.postMessage(JSON.stringify({type: 'rings', value: this.checked}))" />
          <span>Risk</span>
        </label>
      </div>

      <script>
        const MAP_CENTER = [8.4942, 124.6447];
        const INC_COLOR = {
          Flood: '#5bc0eb', Fire: '#e84855', Earthquake: '#9b72cf',
          Landslide: '#f4a35a', Storm: '#f7c541'
        };

        const map = L.map('map', {
          center: MAP_CENTER, zoom: 16, minZoom: 13, maxZoom: 19,
          attributionControl: false, zoomControl: false
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19
        }).addTo(map);

        function makePin(color, emoji, size = 28) {
          return L.divIcon({
            className: '',
            html: \`<div style="width:\${size}px;height:\${size}px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:\${color};border:2px solid rgba(255,255,255,.85);box-shadow:0 3px 10px rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);font-size:\${Math.round(size*.38)}px;line-height:1">\${emoji}</span></div>\`,
            iconSize: [size, size], iconAnchor: [size/2, size], popupAnchor: [0, -size-4],
          });
        }

        let dataLayers = {};
        let labelLayer = null;

        function updateLayers() {
          Object.values(dataLayers).forEach(lg => map.removeLayer(lg));
          dataLayers = {};

          const showEvac = '${filter}' === 'all' || '${filter}' === 'evacuation';
          const showInc = '${filter}' === 'all' || '${filter}' === 'incidents';
          const showRes = '${filter}' === 'all' || '${filter}' === 'residents';

          const evacData = ${JSON.stringify(evacCenters)};
          const incData = ${JSON.stringify(incidents)};
          const resData = ${JSON.stringify(residents)};

          if (showEvac && evacData.length > 0) {
            const lg = L.layerGroup().addTo(map);
            evacData.forEach(c => {
              if (!c.lat || !c.lng) return;
              const color = c.status === 'Open' ? '#00d68f' : c.status === 'Full' ? '#f4a35a' : '#e84855';
              L.marker([c.lat, c.lng], { icon: makePin(color, '🏠', 32) })
                .addTo(lg)
                .bindPopup(\`<b>\${c.name}</b><br><span style="color:#5bc0eb">\${c.zone}</span> · <b style="color:\${color}">\${c.status}</b><br>👥 \${c.occupancy}/\${c.capacity}\`);
            });
            dataLayers.evacuation = lg;
          }

          if (showInc && incData.length > 0) {
            const lg = L.layerGroup().addTo(map);
            incData.forEach(inc => {
              if (!inc.lat || !inc.lng) return;
              const color = INC_COLOR[inc.type] || '#5bc0eb';
              L.marker([inc.lat, inc.lng], { icon: makePin(color, '⚠', 26) })
                .addTo(lg)
                .bindPopup(\`<b>\${inc.type}</b><br>\${inc.zone} - \${inc.location || '—'}<br><b>\${inc.severity}</b> · \${inc.status}\`);
            });
            dataLayers.incidents = lg;
          }

          if (showRes && resData.length > 0) {
            const lg = L.layerGroup().addTo(map);
            resData.filter(r => r.lat && r.lng).slice(0, 500).forEach(r => {
              const color = {Safe: '#00d68f', Evacuated: '#5bc0eb', Unaccounted: '#e84855'}[r.evacuationStatus] || '#5bc0eb';
              L.marker([r.lat, r.lng], { icon: makePin(color, '👤', 22) })
                .addTo(lg)
                .bindPopup(\`<b>\${r.name}</b><br>\${r.zone} · <b>\${r.evacuationStatus}</b>\`);
            });
            dataLayers.residents = lg;
          }
        }

        function updateLabels() {
          if (labelLayer) map.removeLayer(labelLayer);
          labelLayer = L.layerGroup().addTo(map);

          if (${showRings}) {
            const zones = ${JSON.stringify(ZONE_SUBDIVISIONS)};
            Object.entries(zones).forEach(([zoneName, subs]) => {
              if (!subs || !subs[0]) return;
              const colors = { high: '#e84855', medium: '#f4a35a', low: '#00d68f' };
              const color = colors['low'] || '#5bc0eb';
              L.circle([subs[0].lat, subs[0].lng], {
                radius: 90, color, fillColor: color, fillOpacity: .04, weight: 1.5, dashArray: '5 5'
              }).addTo(labelLayer);
            });
          }
        }

        updateLayers();
        updateLabels();

        L.marker(MAP_CENTER, {
          icon: L.divIcon({
            html: '<div style="background:linear-gradient(135deg,#9b72cf,#7050a8);color:#fff;border-radius:8px;padding:4px 11px;font-size:10px;font-weight:800;border:1.5px solid rgba(255,255,255,.7);box-shadow:0 3px 10px rgba(0,0,0,.5)">🏛 HALL</div>',
            iconAnchor: [35, 14],
          })
        }).addTo(map).bindPopup('<b>Barangay Hall</b><br>BDRRMC Command');
      </script>
    </body>
    </html>
  `;

  async function onRefresh() {
    setBusy(true);
    await reload();
    setBusy(false);
  }

  const handleWebViewMessage = (event) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'filter') {
        setFilter(msg.value);
      } else if (msg.type === 'rings') {
        setShowRings(msg.value);
      }
    } catch (e) {
      console.warn('WebView message error:', e);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* HEADER */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.hamburger}>
          <Text style={styles.hamburgerText}>☰</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>GIS Map</Text>
          <Text style={styles.headerSub} numberOfLines={2}>Live situational awareness</Text>
        </View>
      </View>

      {/* MAP */}
      <WebView
        ref={webViewRef}
        source={{ html: mapHTML }}
        style={styles.webview}
        onMessage={handleWebViewMessage}
        originWhitelist={['*']}
        scalesPageToFit={true}
      />

      {/* SIDEBAR */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentRoute="Map"
        onNavigate={(screenName) => {
          navigation.navigate(screenName);
          setSidebarOpen(false);
        }}
        onLogout={() => {
          setSidebarOpen(false);
          logout();
        }}
        userName="User"
      />
    </View>
  );
}