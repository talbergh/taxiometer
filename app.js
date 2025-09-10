// TaxiOMeter by Talbergh — Plain JS PWA (Leaflet + OSM)
// Multi-view app shell with Home (map), History, Settings, start/end modals, discount, offline, wake lock.

const els = {
  // nav
  tabs: Array.from(document.querySelectorAll('.tabbar .tab')),
  screens: Array.from(document.querySelectorAll('.screen')),
  // settings
  rate: document.getElementById('rate'),
  autoZoom: document.getElementById('autoZoom'),
  keepAwake: document.getElementById('keepAwake'),
  jitter: document.getElementById('jitter'),
  // home live
  startBtn: document.getElementById('startBtn'),
  pauseBtn: document.getElementById('pauseBtn'),
  resumeBtn: document.getElementById('resumeBtn'),
  stopBtn: document.getElementById('stopBtn'),
  status: document.getElementById('status'),
  distance: document.getElementById('distance'),
  duration: document.getElementById('duration'),
  speed: document.getElementById('speed'),
  price: document.getElementById('price'),
  map: document.getElementById('map'),
  locateBtn: document.getElementById('locateBtn'),
  // history
  historyList: document.getElementById('historyList'),
  // modals
  confirmStart: document.getElementById('confirmStart'),
  rideName: document.getElementById('rideName'),
  summaryScreen: document.getElementById('summaryScreen'),
  mName: document.getElementById('mName'),
  mDuration: document.getElementById('mDuration'),
  mDistance: document.getElementById('mDistance'),
  mAvg: document.getElementById('mAvg'),
  mBasePrice: document.getElementById('mBasePrice'),
  mTotal: document.getElementById('mTotal'),
  discountMode: document.getElementById('discountMode'),
  discountValue: document.getElementById('discountValue'),
  shareBtn: document.getElementById('shareBtn'),
  resetBtn: document.getElementById('resetBtn'),
  miniMap: document.getElementById('miniMap'),
  startScreen: document.getElementById('startScreen'),
  cancelStart: document.getElementById('cancelStart'),
  closeSummary: document.getElementById('closeSummary'),
  onboardingScreen: document.getElementById('onboardingScreen'),
  obNext1: document.getElementById('obNext1'),
  obBack2: document.getElementById('obBack2'),
  obRequestLocation: document.getElementById('obRequestLocation'),
  obBack3: document.getElementById('obBack3'),
  obNext3: document.getElementById('obNext3'),
  obFinish: document.getElementById('obFinish'),
  // PWA
  installBtn: document.getElementById('installBtn'),
};

// Persistent keys
const SETTINGS_KEY = 'taxiometer.settings.v2';
const STATE_KEY = 'taxiometer.state.v2';
const HISTORY_KEY = 'taxiometer.history.v1';

const settings = loadSettings();
applySettingsToUI(settings);

let watchId = null;
let wakeLock = null;
let beforeInstallPromptEvent = null;
let leafletMap = null;
let leafletPolyline = null;
let leafletMiniMap = null;
let userMarker = null;
let accuracyCircle = null;

const state = loadState() || {
  running: false,
  paused: false,
  startedAt: null,
  pausedAt: null,
  totalPausedMs: 0,
  points: [], // {lat, lon, ts, acc}
  distanceKm: 0,
  pricePerKm: settings.rate,
  autoZoom: settings.autoZoom,
  rideName: '',
};
applyStateToUI();
updateLiveUI();
initMap();
renderHistory();

// Show onboarding on first load
(function(){
  onboarding();
})();

// PWA registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(console.warn);
  });
}

// Install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  beforeInstallPromptEvent = e;
  els.installBtn.hidden = false;
});
els.installBtn.addEventListener('click', async () => {
  if (!beforeInstallPromptEvent) return;
  beforeInstallPromptEvent.prompt();
  const res = await beforeInstallPromptEvent.userChoice.catch(() => ({}));
  if (res && res.outcome === 'accepted') { els.installBtn.hidden = true; }
});

// Tabs
els.tabs.forEach((btn) => btn.addEventListener('click', () => {
  const target = btn.getAttribute('data-target');
  showScreen(target);
  els.tabs.forEach(b => b.classList.toggle('active', b === btn));
  if (target === 'homeView') setTimeout(() => leafletMap?.invalidateSize(), 50);
}));

// Settings listeners
els.keepAwake.addEventListener('change', async () => {
  settings.keepAwake = els.keepAwake.checked; saveSettings(); if (settings.keepAwake) await requestWakeLock(); else releaseWakeLock();
});
els.rate.addEventListener('change', () => { const v = parseFloat(els.rate.value.replace(',', '.')); if (!isNaN(v)) { settings.rate = v; state.pricePerKm = v; saveSettings(); persistState(); updateLiveUI(); }});
els.autoZoom.addEventListener('change', () => { settings.autoZoom = els.autoZoom.checked; state.autoZoom = settings.autoZoom; saveSettings(); fitPolyline(); });
els.jitter.addEventListener('change', () => { const v = parseFloat(els.jitter.value); if (!isNaN(v) && v >= 0) { settings.jitterM = v; saveSettings(); }});

// Home controls
els.startBtn.addEventListener('click', () => openStartFlow());
els.confirmStart.addEventListener('click', (e) => { e.preventDefault(); confirmStartFlow(); });
els.cancelStart?.addEventListener('click', () => cancelStartFlow());
els.pauseBtn.addEventListener('click', pauseRide);
els.resumeBtn.addEventListener('click', resumeRide);
els.stopBtn.addEventListener('click', stopRide);
els.locateBtn.addEventListener('click', () => centerOnLast(true));

// End modal controls
els.discountMode.addEventListener('change', updateEndTotals);
els.discountValue.addEventListener('input', updateEndTotals);
els.shareBtn.addEventListener('click', shareSummary);
els.resetBtn.addEventListener('click', () => { resetAll(); showScreen('homeView'); });
els.closeSummary?.addEventListener('click', () => { showScreen('homeView'); });

// Visibility change: re-acquire wake lock if needed
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && settings.keepAwake && state.running) requestWakeLock(); });

function onboarding(){
  const KEY = 'taxiometer.onboarded.v3';
  const splash = document.getElementById('splash');
  setTimeout(()=> splash?.classList.add('hide'), 1400);
  if(localStorage.getItem(KEY)) { hideOnboarding(); return; }
  showScreen('onboardingScreen', false);
  let current=1;
  const steps = Array.from(document.querySelectorAll('.ob-step'));
  function activate(i){ steps.forEach((s,idx)=> s.classList.toggle('active', idx===i-1)); current=i; }
  function setDots(step){ const group = steps[step-1].querySelectorAll('.progress-dot'); /* already embedded per step */ }
  const rateInput = document.getElementById('onboardingRate');
  els.obNext1?.addEventListener('click', ()=> activate(2));
  els.obBack2?.addEventListener('click', ()=> activate(1));
  els.obRequestLocation?.addEventListener('click', ()=> {
    if(!navigator.geolocation){ alert('Kein Geolocation Support'); return; }
    navigator.geolocation.getCurrentPosition(
      ()=>{ rateInput.value = settings.rate; activate(3); },
      (err)=>{
        let msg = 'Standort verweigert. Bitte in den Einstellungen freigeben.';
        if(err && err.code === 1) msg = 'Standortzugriff abgelehnt. Prüfe die Browser- oder App-Berechtigungen.';
        else if(err && err.code === 2) msg = 'Standort nicht verfügbar. Prüfe GPS oder Internet.';
        else if(err && err.code === 3) msg = 'Standortabfrage abgebrochen oder zu langsam.';
        else if(err && err.message) msg = err.message;
        alert(msg);
      },
      { enableHighAccuracy:true, timeout:10000 }
    );
  });
  els.obBack3?.addEventListener('click', ()=> activate(2));
  els.obNext3?.addEventListener('click', ()=> {
    const v = parseFloat(rateInput.value);
    if(v>0){ settings.rate=v; saveSettings(); els.rate.value=v; activate(4);} else alert('Bitte gültigen Preis eingeben');
  });
  els.obFinish?.addEventListener('click', ()=> { localStorage.setItem(KEY,'1'); hideOnboarding(); showScreen('homeView'); });
  activate(1);
  function hideOnboarding(){ els.onboardingScreen?.classList.remove('active'); els.onboardingScreen?.classList.add('gone'); }
}

// Map initialization
// Map initialization
function initMap() {
  leafletMap = L.map('map', { zoomControl: false, attributionControl: true }).setView([51.1657, 10.4515], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
    maxZoom: 20, 
    attribution: '&copy; OpenStreetMap-Mitwirkende',
    className: 'dark-tiles'
  }).addTo(leafletMap);
  leafletPolyline = L.polyline([], { color: '#007aff', weight: 5, opacity: 0.8 }).addTo(leafletMap);
  
  // Add custom dark style
  const style = document.createElement('style');
  style.textContent = `
    .dark-tiles { filter: invert(1) hue-rotate(180deg) brightness(0.8) contrast(1.2); }
    .leaflet-control-attribution { background: rgba(28,28,30,0.8) !important; color: #ffffff !important; }
    .leaflet-control-attribution a { color: #007aff !important; }
  `;
  document.head.appendChild(style);
}

function updateUserMarker(lat, lon, acc){
  const latlng = [lat,lon];
  if(!userMarker){ 
    userMarker = L.marker(latlng, { 
      title:'Aktuelle Position',
      icon: L.divIcon({
        className: 'user-location-marker',
        html: '<div style="background: #007aff; width: 16px; height: 16px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 2px 8px rgba(0,122,255,0.4);"></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      })
    }).addTo(leafletMap); 
  } else {
    userMarker.setLatLng(latlng);
  }
  
  if(!accuracyCircle){ 
    accuracyCircle = L.circle(latlng, { 
      radius: acc||10, 
      color:'#007aff', 
      fillColor:'#007aff', 
      fillOpacity:0.1, 
      weight:1,
      opacity: 0.3
    }); 
    accuracyCircle.addTo(leafletMap); 
  } else { 
    accuracyCircle.setLatLng(latlng); 
    accuracyCircle.setRadius(acc||10); 
  }
}

function fitPolyline() {
  const pts = state.points.map(p => [p.lat, p.lon]);
  leafletPolyline.setLatLngs(pts);
  if (pts.length === 0) return;
  if (settings.autoZoom && pts.length > 1) leafletMap.fitBounds(leafletPolyline.getBounds(), { padding: [30,30] });
}

function centerOnLast(force=false){
  const last = state.points[state.points.length-1];
  if (last) leafletMap.setView([last.lat,last.lon], force? 18 : Math.max(leafletMap.getZoom(), 16));
}

// Ride flow
function openStartFlow(){ els.rideName.value = state.rideName || ''; showScreen('startScreen', false); }
function confirmStartFlow(){ const name = els.rideName.value.trim(); showScreen('homeView'); startRide(name); }
function cancelStartFlow(){ showScreen('homeView'); }

function startRide(name) {
  if (!navigator.geolocation) { setStatus('Geolocation wird nicht unterstützt.'); return; }
  if (state.running) return;
  state.running = true; state.paused = false; state.startedAt = Date.now(); state.pausedAt = null; state.totalPausedMs = 0;
  state.points = []; state.distanceKm = 0; state.pricePerKm = parseFloat(els.rate.value || settings.rate) || 0; state.rideName = name || '';
  setStatus('Starte GPS…'); applyStateToUI(); persistState(); if (settings.keepAwake) requestWakeLock();
  watchId = navigator.geolocation.watchPosition(onPosition, onPositionError, { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 });
}

function pauseRide(){ if (!state.running || state.paused) return; state.paused = true; state.pausedAt = Date.now(); if (watchId!==null){ navigator.geolocation.clearWatch(watchId); watchId=null;} setStatus('Pausiert'); applyStateToUI(); persistState(); }
function resumeRide(){ if (!state.running || !state.paused) return; state.paused = false; if (state.pausedAt) state.totalPausedMs += Date.now()-state.pausedAt; state.pausedAt=null; setStatus('Weiter…'); applyStateToUI(); persistState(); watchId = navigator.geolocation.watchPosition(onPosition,onPositionError,{enableHighAccuracy:true,maximumAge:1000,timeout:10000}); }

function stopRide(){
  if (!state.running) return;
  if (watchId!==null){ navigator.geolocation.clearWatch(watchId); watchId=null; }
  releaseWakeLock();
  if (state.paused && state.pausedAt) state.totalPausedMs += Date.now()-state.pausedAt;
  state.paused = false; state.pausedAt = null; state.running = false;
  setStatus('Beendet'); applyStateToUI(); persistState();
  showEndModal();
}

function resetAll(){ state.running=false; state.paused=false; state.startedAt=null; state.pausedAt=null; state.totalPausedMs=0; state.points=[]; state.distanceKm=0; setStatus('Bereit'); applyStateToUI(); updateLiveUI(); persistState(); fitPolyline(); }

function onPosition(pos){
  const { latitude: lat, longitude: lon, accuracy, speed } = pos.coords; const ts = pos.timestamp || Date.now();
  updateUserMarker(lat,lon,accuracy);
  const last = state.points[state.points.length-1]; const pt = { lat, lon, ts, acc: accuracy };
  if (last){
    const d = haversineKm(last.lat,last.lon,lat,lon);
    const jitter = (settings.jitterM ?? 3);
    if (d*1000 < jitter && (!speed || speed*3.6 < 1)) { updateLiveUI(pos); if (settings.autoZoom) centerOnLast(); return; }
    state.distanceKm += d;
  }
  state.points.push(pt);
  updateLiveUI(pos); persistState();
  leafletPolyline.addLatLng([lat,lon]);
  if (settings.autoZoom) centerOnLast(true);
}

function onPositionError(err){ setStatus('GPS Fehler: ' + (err && err.message ? err.message : String(err))); }

function updateLiveUI(lastPos){
  els.distance.textContent = state.distanceKm.toFixed(2);
  const dur = computeDurationMs(); els.duration.textContent = formatDuration(dur);
  const kmh = computeInstantSpeedKmh(lastPos); els.speed.textContent = Math.round(kmh);
  const price = state.distanceKm * (state.pricePerKm || 0); els.price.textContent = price.toFixed(2);
}

function computeDurationMs(){ if (!state.startedAt) return 0; const now = state.running && !state.paused ? Date.now() : (state.points[state.points.length-1]?.ts || Date.now()); return Math.max(0, now - state.startedAt - state.totalPausedMs); }
function computeInstantSpeedKmh(lastPos){ if (lastPos && lastPos.coords && typeof lastPos.coords.speed==='number' && lastPos.coords.speed>=0) return lastPos.coords.speed*3.6; const n=state.points.length; if (n<2) return 0; const a=state.points[n-2], b=state.points[n-1]; const dKm=haversineKm(a.lat,a.lon,b.lat,b.lon); const dtH=Math.max(1,(b.ts-a.ts))/3600000; return dKm/dtH; }

// End modal + history
function showEndModal(){
  const dist = state.distanceKm; const durMs = computeDurationMs(); const hours = durMs/3600000; const avg = hours>0 ? dist/hours : 0; const base = dist * (state.pricePerKm||0);
  els.mName.textContent = state.rideName || 'Unbenannt';
  els.mDuration.textContent = formatDuration(durMs);
  els.mDistance.textContent = dist.toFixed(2);
  els.mAvg.textContent = avg.toFixed(1);
  els.mBasePrice.textContent = base.toFixed(2);
  els.discountMode.value = 'none'; els.discountValue.value = '0';
  updateEndTotals();
  initMiniMap();
  saveRideToHistory({
    id: 'r' + Date.now(),
    name: state.rideName || 'Unbenannt',
    startedAt: state.startedAt,
    durationMs: durMs,
    distanceKm: dist,
    pricePerKm: state.pricePerKm,
    basePrice: base,
    points: state.points,
  });
  renderHistory();
  showScreen('summaryScreen', false);
}
function closeEndModal(){ showScreen('homeView'); }

function updateEndTotals(){
  const base = parseFloat(els.mBasePrice.textContent) || 0; const mode = els.discountMode.value; const val = parseFloat(els.discountValue.value) || 0;
  let total = base;
  if (mode==='percent') total = Math.max(0, base * (1 - val/100));
  if (mode==='amount') total = Math.max(0, base - val);
  els.mTotal.textContent = total.toFixed(2);
}

async function shareSummary(){
  const name = state.rideName || 'Unbenannte Fahrt';
  const distance = state.distanceKm.toFixed(2);
  const duration = computeDurationMs();
  const rate = state.pricePerKm || 0;
  const price = parseFloat(els.mTotal.textContent) || (distance * rate);
  const points = encodeURIComponent(JSON.stringify(state.points));
  
  // Create shareable URL
  const shareUrl = `${window.location.origin}${window.location.pathname.replace('index.html', '')}share.html?name=${encodeURIComponent(name)}&date=${state.startedAt}&duration=${duration}&distance=${distance}&rate=${rate}&price=${price.toFixed(2)}&points=${points}`;
  
  const text = `TaxiOMeter – Fahrt\nName: ${name}\nDistanz: ${distance} km\nDauer: ${formatDuration(duration)}\nGesamt: €${price.toFixed(2)}\n\nDetails: ${shareUrl}`;
  
  if (navigator.share) { 
    try { 
      await navigator.share({ 
        title: 'TaxiOMeter Fahrt', 
        text: text,
        url: shareUrl
      }); 
    } catch {} 
  } else if (navigator.clipboard) { 
    try { 
      await navigator.clipboard.writeText(text); 
      setStatus('Link kopiert - kann jetzt geteilt werden'); 
    } catch {} 
  } else {
    // Fallback: open share page
    window.open(shareUrl, '_blank');
  }
}

// History
function loadHistory(){ try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch { return []; } }
function saveHistory(arr){ try { localStorage.setItem(HISTORY_KEY, JSON.stringify(arr)); } catch {} }
function saveRideToHistory(ride){ const arr = loadHistory(); arr.unshift(ride); saveHistory(arr); }
function renderHistory(){
  const arr = loadHistory(); els.historyList.innerHTML = '';
  if (arr.length===0){ const li=document.createElement('li'); li.innerHTML='<span class="meta">Noch keine Fahrten</span>'; els.historyList.appendChild(li); return; }
  for (const r of arr){
    const li = document.createElement('li');
    const title = document.createElement('div'); title.className='title'; title.textContent = r.name;
    const meta = document.createElement('div'); meta.className='meta'; meta.textContent = `${new Date(r.startedAt).toLocaleString()} · ${formatDuration(r.durationMs)} · ${r.distanceKm.toFixed(2)} km`;
    const open = document.createElement('button'); open.className='ghost'; open.innerHTML='<i class="fa-solid fa-up-right-from-square"></i>';
    open.addEventListener('click', () => openRidePreview(r));
    li.appendChild(title); li.appendChild(meta); li.appendChild(open);
    els.historyList.appendChild(li);
  }
}

function openRidePreview(r){
  // populate end modal-like view for history review
  els.mName.textContent = r.name; els.mDuration.textContent = formatDuration(r.durationMs); els.mDistance.textContent = r.distanceKm.toFixed(2);
  const hours = r.durationMs/3600000; const avg = hours>0? r.distanceKm/hours : 0; els.mAvg.textContent = avg.toFixed(1);
  els.mBasePrice.textContent = (r.distanceKm * (r.pricePerKm||settings.rate)).toFixed(2);
  els.discountMode.value='none'; els.discountValue.value='0'; updateEndTotals();
  initMiniMap(r.points);
  showScreen('summaryScreen', false);
}

function initMiniMap(points){
  const pts = points || state.points;
  if (!leafletMiniMap){ leafletMiniMap = L.map('miniMap', { attributionControl: false, zoomControl: false, dragging:true, scrollWheelZoom:false }).setView([0,0], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(leafletMiniMap);
  }
  const poly = L.polyline(pts.map(p=>[p.lat,p.lon]), { color:'#f5c84b', weight:3 }).addTo(leafletMiniMap);
  setTimeout(()=>{ leafletMiniMap.invalidateSize(); if (pts.length>1) leafletMiniMap.fitBounds(poly.getBounds(), { padding:[20,20] }); }, 50);
  // clean up when leaving summary screen
  const observer = new MutationObserver(()=>{
    if(!els.summaryScreen.classList.contains('active')){
      leafletMiniMap.eachLayer(l => { if (l instanceof L.Polyline) leafletMiniMap.removeLayer(l); });
      observer.disconnect();
    }
  });
  observer.observe(els.summaryScreen,{attributes:true,attributeFilter:['class']});
}

// Helpers
function toRad(v){ return v * Math.PI / 180; }
function haversineKm(lat1, lon1, lat2, lon2){ const R=6371; const dLat=toRad(lat2-lat1), dLon=toRad(lon2-lon1); const a=Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2; return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); }
function formatDuration(ms){ const s=Math.floor(ms/1000); const hh=Math.floor(s/3600); const mm=Math.floor((s%3600)/60); const ss=s%60; return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`; }
function setStatus(msg){ els.status.textContent = msg; }

// Settings & state persistence
function loadSettings(){ try{ const raw=localStorage.getItem(SETTINGS_KEY); if(!raw) return { rate:1.5, autoZoom:true, keepAwake:true, jitterM:3 }; const obj=JSON.parse(raw); return { rate: obj.rate??1.5, autoZoom: !!obj.autoZoom, keepAwake: !!obj.keepAwake, jitterM: obj.jitterM??3 }; } catch { return { rate:1.5, autoZoom:true, keepAwake:true, jitterM:3 }; }}
function saveSettings(){ localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }
function loadState(){ try{ return JSON.parse(localStorage.getItem(STATE_KEY)); } catch { return null; } }
function persistState(){ try{ localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch {}
}
function applySettingsToUI(s){ els.rate.value = s.rate; els.autoZoom.checked=!!s.autoZoom; els.keepAwake.checked=!!s.keepAwake; els.jitter.value = s.jitterM ?? 3; }
function applyStateToUI(){ els.startBtn.disabled = state.running; els.pauseBtn.disabled = !state.running || state.paused; els.resumeBtn.disabled = !state.running || !state.paused; els.stopBtn.disabled = !state.running; }

// Screen navigation helper
function showScreen(id, updateTabs=true){
  els.screens.forEach(s => s.classList.toggle('active', s.id === id));
  if(updateTabs){ els.tabs.forEach(t=> t.classList.toggle('active', t.getAttribute('data-target')===id)); }
  if(id==='homeView') setTimeout(()=> leafletMap?.invalidateSize(), 60);
  const tabbar = document.getElementById('tabbar');
  if(['startScreen','summaryScreen','onboardingScreen'].includes(id)) tabbar.style.display='none'; else tabbar.style.display='flex';
}

// Wake Lock
async function requestWakeLock(){ try{ if('wakeLock' in navigator){ wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', ()=>{}); } } catch(e){ console.warn('WakeLock failed', e);} }
function releaseWakeLock(){ try{ wakeLock && wakeLock.release(); } catch {} finally { wakeLock = null; } }

// Periodic UI refresh
setInterval(() => { if (state.running && !state.paused) updateLiveUI(); }, 1000);
