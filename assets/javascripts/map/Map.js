// Enhanced Map Module using Leaflet.js - Optimized for Mobile Tracking
export const MapModule = (() => {
  let map = null;
  let userMarker = null;
  let routeLayer = null;
  let currentPosition = null;
  let followMode = true;
  let lastFollowTime = 0;
  let animationFrame = null;
  let smoothMarker = null;
  
  // Smooth animation settings
  const FOLLOW_ZOOM_LEVEL = 17;
  const FOLLOW_TIMEOUT = 10000; // 10 seconds after manual pan/zoom
  const MIN_FOLLOW_INTERVAL = 2000; // Minimum 2 seconds between auto-follows
  const SMOOTH_ANIMATION_DURATION = 800;
  
  function initMap(containerId) {
    if (typeof L === 'undefined') {
      console.warn('Leaflet (L) not loaded. Skipping map init (likely offline).');
      map = null;
      return null;
    }
    
    // Initialize Leaflet map with optimized settings
    map = L.map(containerId, {
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true, // Better performance for mobile
      worldCopyJump: false,
      maxZoom: 19,
      minZoom: 10,
      zoomSnap: 0.5,
      zoomDelta: 0.5,
      wheelDebounceTime: 60,
      wheelPxPerZoomLevel: 120
    }).setView([51.1657, 10.4515], 10); // Default to Germany center
    
    // Add OpenStreetMap tiles with optimized settings
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: false,
      updateWhenIdle: true,
      updateWhenZooming: false,
      keepBuffer: 2
    }).addTo(map);
    
    // Add zoom control to bottom right
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);
    
    // Set up follow mode management
    setupFollowMode();
    
    return map;
  }
  
  function setupFollowMode() {
    if (!map) return;
    
    // Disable follow mode when user interacts with map
    map.on('dragstart zoomstart', () => {
      followMode = false;
    });
    
    // Re-enable follow mode after timeout
    map.on('dragend zoomend', () => {
      setTimeout(() => {
        followMode = true;
      }, FOLLOW_TIMEOUT);
    });
  }
  
  function updateUserLocation(lat, lng, options = {}) {
    if (!map) return; // Guard if map couldn't initialize
    
    const newPosition = { lat, lng };
    const isHighAccuracy = options.isHighAccuracy !== false;
    const isMoving = options.isMoving !== false;
    
    // Update current position
    currentPosition = newPosition;
    
    // Create or update marker with smooth animation
    updateMarkerPosition(lat, lng, isHighAccuracy);
    
    // Handle map following
    if (followMode && shouldFollowLocation()) {
      followLocation(lat, lng, isMoving);
    }
  }
  
  function updateMarkerPosition(lat, lng, isHighAccuracy) {
    const position = [lat, lng];
    
    if (userMarker) {
      // Smooth marker animation
      if (smoothMarker && isHighAccuracy) {
        animateMarkerToPosition(userMarker, position);
      } else {
        userMarker.setLatLng(position);
      }
      
      // Update marker style based on accuracy
      const icon = createTaxiIcon(isHighAccuracy);
      userMarker.setIcon(icon);
    } else {
      // Create new marker
      const icon = createTaxiIcon(isHighAccuracy);
      userMarker = L.marker(position, { 
        icon: icon,
        zIndexOffset: 1000 // Keep on top
      }).addTo(map);
      
      smoothMarker = true; // Enable smooth animation for subsequent updates
    }
  }
  
  function createTaxiIcon(isHighAccuracy = true) {
    const color = isHighAccuracy ? '#0a84ff' : '#FF9500';
    const size = isHighAccuracy ? 24 : 20;
    const pulse = isHighAccuracy ? '' : 'animation: pulse 2s infinite;';
    
    return L.divIcon({
      html: `
        <div style="position: relative; ${pulse}">
          <i class="fas fa-taxi" style="color: ${color}; font-size: ${size}px; filter: drop-shadow(0 1px 3px rgba(0,0,0,0.3));"></i>
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: ${size * 2}px;
            height: ${size * 2}px;
            border: 2px solid ${color};
            border-radius: 50%;
            opacity: 0.2;
            pointer-events: none;
          "></div>
        </div>
      `,
      className: 'taxi-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
  }
  
  function animateMarkerToPosition(marker, targetPosition) {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
    
    const currentLatLng = marker.getLatLng();
    const startLat = currentLatLng.lat;
    const startLng = currentLatLng.lng;
    const targetLat = targetPosition[0];
    const targetLng = targetPosition[1];
    
    const startTime = performance.now();
    
    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / SMOOTH_ANIMATION_DURATION, 1);
      
      // Use easing function for smooth animation
      const eased = easeOutCubic(progress);
      
      const lat = startLat + (targetLat - startLat) * eased;
      const lng = startLng + (targetLng - startLng) * eased;
      
      marker.setLatLng([lat, lng]);
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    }
    
    animationFrame = requestAnimationFrame(animate);
  }
  
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }
  
  function shouldFollowLocation() {
    const now = Date.now();
    if (now - lastFollowTime < MIN_FOLLOW_INTERVAL) {
      return false;
    }
    return followMode;
  }
  
  function followLocation(lat, lng, isMoving) {
    const targetZoom = isMoving ? FOLLOW_ZOOM_LEVEL : Math.max(map.getZoom(), FOLLOW_ZOOM_LEVEL - 1);
    
    // Use different animation based on current map position
    const currentCenter = map.getCenter();
    const distance = map.distance(currentCenter, [lat, lng]);
    
    if (distance > 1000) { // Far away - quick pan
      map.setView([lat, lng], targetZoom, {
        animate: true,
        duration: 0.5
      });
    } else if (distance > 100) { // Moderate distance - smooth fly
      map.flyTo([lat, lng], targetZoom, {
        duration: 1.0,
        easeLinearity: 0.25
      });
    } else { // Close - gentle pan
      map.panTo([lat, lng], {
        duration: 0.8,
        easeLinearity: 0.1
      });
      
      // Adjust zoom if needed
      const currentZoom = map.getZoom();
      if (Math.abs(currentZoom - targetZoom) > 0.5) {
        map.setZoom(targetZoom, {
          animate: true,
          duration: 0.5
        });
      }
    }
    
    lastFollowTime = Date.now();
  }
  
  function centerOnUser(forceZoom = false) {
    if (!map || !currentPosition) return;
    
    const targetZoom = forceZoom ? FOLLOW_ZOOM_LEVEL : Math.max(map.getZoom(), FOLLOW_ZOOM_LEVEL - 1);
    
    map.flyTo([currentPosition.lat, currentPosition.lng], targetZoom, {
      duration: 1.5,
      easeLinearity: 0.25
    });
    
    // Re-enable follow mode
    followMode = true;
    lastFollowTime = Date.now();
  }
  
  function addRoute(coordinates) {
    if (!map) return; // Guard if map couldn't initialize
    
    if (routeLayer) {
      map.removeLayer(routeLayer);
    }
    
    if (!coordinates || coordinates.length < 2) return;
    
    const latLngs = coordinates.map(coord => [coord.lat, coord.lng]);
    
    // Create route with enhanced styling
    routeLayer = L.polyline(latLngs, {
      color: '#0a84ff',
      weight: 4,
      opacity: 0.8,
      lineJoin: 'round',
      lineCap: 'round',
      smoothFactor: 1
    }).addTo(map);
    
    // Add route markers
    if (latLngs.length > 1) {
      // Start marker (green)
      L.circleMarker(latLngs[0], {
        color: '#34C759',
        fillColor: '#34C759',
        fillOpacity: 0.8,
        radius: 6,
        weight: 2
      }).addTo(map);
      
      // End marker (red)
      L.circleMarker(latLngs[latLngs.length - 1], {
        color: '#FF3B30',
        fillColor: '#FF3B30',
        fillOpacity: 0.8,
        radius: 6,
        weight: 2
      }).addTo(map);
    }
    
    // Fit map to route with padding
    try {
      const bounds = routeLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { 
          padding: [20, 20],
          maxZoom: 16
        });
        
        // Disable follow mode when showing route
        followMode = false;
      }
    } catch (e) {
      console.warn('Error fitting route bounds:', e);
    }
  }
  
  function clearRoute() {
    if (!map) return;
    
    if (routeLayer) {
      map.removeLayer(routeLayer);
      routeLayer = null;
    }
    
    // Remove route markers
    map.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker && layer !== userMarker) {
        map.removeLayer(layer);
      }
    });
    
    // Re-enable follow mode
    followMode = true;
  }
  
  function setFollowMode(enabled) {
    followMode = enabled;
    if (enabled && currentPosition) {
      centerOnUser();
    }
  }
  
  function isFollowing() {
    return followMode;
  }
  
  function getCurrentPosition() {
    return currentPosition;
  }
  
  function getMap() {
    return map;
  }
  
  // Cleanup function
  function destroy() {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    
    if (map) {
      map.remove();
      map = null;
    }
    
    userMarker = null;
    routeLayer = null;
    currentPosition = null;
    followMode = true;
    smoothMarker = null;
  }

  return {
    initMap,
    updateUserLocation,
    addRoute,
    clearRoute,
    centerOnUser,
    setFollowMode,
    isFollowing,
    getCurrentPosition,
    getMap,
    destroy
  };
})();
