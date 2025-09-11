// Enhanced GPS Module for Cabra - Optimized for Mobile
export const GPS = (() => {
  let watchId = null;
  let lastPosition = null;
  let listeners = [];
  let hasPermission = false;
  let retryCount = 0;
  let lastUpdateTime = 0;
  let isMoving = false;
  let movingTimeout = null;
  
  const MAX_RETRIES = 3;
  const MIN_UPDATE_INTERVAL = 1000; // Minimum 1 second between updates
  const MOVEMENT_TIMEOUT = 30000; // 30 seconds without movement = stopped
  
  // Adaptive GPS settings based on device capabilities
  const getGPSSettings = () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    return {
      enableHighAccuracy: true,
      maximumAge: isMoving ? 2000 : 10000, // More frequent when moving
      timeout: isMobile ? 20000 : 15000, // Longer timeout for mobile
      // iOS-specific optimizations
      ...(isIOS && {
        maximumAge: isMoving ? 1000 : 5000,
        timeout: 25000
      })
    };
  };

  function start(onUpdate, onError) {
    if (!navigator.geolocation) {
      onError && onError('Geolocation not supported by this browser.');
      return;
    }

    // Reset retry count on new start
    retryCount = 0;
    
    // Start with initial position
    navigator.geolocation.getCurrentPosition(
      (pos) => handlePositionUpdate(pos, onUpdate),
      (err) => handlePositionError(err, onError),
      getGPSSettings()
    );
    
    // Then start watching
    startWatching(onUpdate, onError);
  }
  
  function startWatching(onUpdate, onError) {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
    }
    
    watchId = navigator.geolocation.watchPosition(
      (pos) => handlePositionUpdate(pos, onUpdate),
      (err) => handlePositionError(err, onError),
      getGPSSettings()
    );
  }
  
  function handlePositionUpdate(position, onUpdate) {
    const now = Date.now();
    
    // Throttle updates to prevent excessive processing
    if (now - lastUpdateTime < MIN_UPDATE_INTERVAL) {
      return;
    }
    
    hasPermission = true;
    retryCount = 0;
    
    // Check if device is moving
    if (lastPosition) {
      const distance = calculateDistance(
        lastPosition.coords.latitude,
        lastPosition.coords.longitude,
        position.coords.latitude,
        position.coords.longitude
      );
      
      // Update movement status
      const wasMoving = isMoving;
      isMoving = distance > 5; // 5 meters threshold for movement
      
      // Clear existing movement timeout
      if (movingTimeout) {
        clearTimeout(movingTimeout);
      }
      
      // Set timeout for stopped detection
      movingTimeout = setTimeout(() => {
        isMoving = false;
        // Restart watching with different settings when stopped
        if (watchId) {
          startWatching(onUpdate, onError);
        }
      }, MOVEMENT_TIMEOUT);
      
      // Restart watching if movement status changed
      if (wasMoving !== isMoving) {
        startWatching(onUpdate, onError);
      }
    }
    
    lastPosition = position;
    lastUpdateTime = now;
    
    // Notify all listeners
    listeners.forEach(fn => {
      try {
        fn(position, { isMoving, isHighAccuracy: position.coords.accuracy < 20 });
      } catch (e) {
        console.warn('GPS listener error:', e);
      }
    });
    
    // Call main update callback
    if (onUpdate) {
      try {
        onUpdate(position, { isMoving, isHighAccuracy: position.coords.accuracy < 20 });
      } catch (e) {
        console.warn('GPS update callback error:', e);
      }
    }
  }
  
  function handlePositionError(error, onError) {
    console.warn('GPS Error:', error.message, 'Code:', error.code);
    
    // Handle different error types
    if (error.code === 1) { // PERMISSION_DENIED
      hasPermission = false;
      onError && onError('Location access denied. Please enable location permissions in your browser settings.');
      return; // Don't retry for permission denied
    }
    
    retryCount++;
    if (retryCount >= MAX_RETRIES) {
      onError && onError('Unable to get location after multiple attempts. Please check your GPS settings.');
      return;
    }
    
    // For timeout or position unavailable, implement exponential backoff
    const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);
    
    if (error.code === 3) { // TIMEOUT
      console.warn(`GPS timeout, retrying in ${backoffDelay}ms...`);
    } else if (error.code === 2) { // POSITION_UNAVAILABLE
      console.warn(`GPS position unavailable, retrying in ${backoffDelay}ms...`);
    }
    
    // Retry after backoff delay
    setTimeout(() => {
      if (watchId !== null) {
        startWatching(onUpdate, onError);
      }
    }, backoffDelay);
  }
  
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const toRad = (x) => (x * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + 
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
              Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function stop() {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
    
    if (movingTimeout) {
      clearTimeout(movingTimeout);
      movingTimeout = null;
    }
    
    isMoving = false;
    listeners = [];
  }

  function getLastPosition() {
    return lastPosition;
  }

  function hasLocationPermission() {
    return hasPermission;
  }
  
  function isDeviceMoving() {
    return isMoving;
  }

  function subscribe(fn) {
    if (typeof fn === 'function') {
      listeners.push(fn);
    }
  }

  function unsubscribe(fn) {
    listeners = listeners.filter(f => f !== fn);
  }
  
  // Get current position once (for initial setup)
  function getCurrentPosition(onSuccess, onError) {
    if (!navigator.geolocation) {
      onError && onError('Geolocation not supported by this browser.');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      onError,
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000
      }
    );
  }

  return { 
    start, 
    stop, 
    getLastPosition, 
    hasLocationPermission, 
    isDeviceMoving,
    subscribe, 
    unsubscribe,
    getCurrentPosition
  };
})();
