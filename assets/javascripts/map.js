// Map Module using Leaflet.js
export const MapModule = (() => {
  let map = null;
  let userMarker = null;
  let routeLayer = null;
  let currentPosition = null;
  
  function initMap(containerId) {
    if (typeof L === 'undefined') {
      console.warn('Leaflet (L) not loaded. Skipping map init (likely offline).');
      map = null;
      return null;
    }
    // Initialize Leaflet map
    map = L.map(containerId, {
      zoomControl: false,
      attributionControl: false
    }).setView([51.1657, 10.4515], 10); // Default to Germany center
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);
    
    // Add zoom control to bottom right
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);
    
    return map;
  }
  
  function updateUserLocation(lat, lng) {
  if (!map) return; // Guard if map couldn't initialize
    currentPosition = { lat, lng };
    
    if (userMarker) {
      userMarker.setLatLng([lat, lng]);
    } else {
      // Create custom taxi icon
      const taxiIcon = L.divIcon({
        html: '<i class="fas fa-taxi" style="color: #0a84ff; font-size: 24px;"></i>',
        className: 'taxi-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      
      userMarker = L.marker([lat, lng], { icon: taxiIcon }).addTo(map);
    }
    
    // Auto-zoom to user location with smooth animation
    map.flyTo([lat, lng], 16, {
      duration: 1.5
    });
  }
  
  function addRoute(coordinates) {
  if (!map) return; // Guard if map couldn't initialize
    if (routeLayer) {
      map.removeLayer(routeLayer);
    }
    
    const latLngs = coordinates.map(coord => [coord.lat, coord.lng]);
    routeLayer = L.polyline(latLngs, {
      color: '#0a84ff',
      weight: 4,
      opacity: 0.8
    }).addTo(map);
    
    // Fit map to route
    if (latLngs.length > 1) {
      map.fitBounds(routeLayer.getBounds(), { padding: [20, 20] });
    }
  }
  
  function clearRoute() {
  if (!map) return;
    if (routeLayer) {
      map.removeLayer(routeLayer);
      routeLayer = null;
    }
  }
  
  function getCurrentPosition() {
    return currentPosition;
  }
  
  function getMap() {
    return map;
  }
  
  return {
    initMap,
    updateUserLocation,
    addRoute,
    clearRoute,
    getCurrentPosition,
    getMap
  };
})();
