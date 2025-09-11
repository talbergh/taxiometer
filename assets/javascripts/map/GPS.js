// GPS Module for Cabra
export const GPS = (() => {
  let watchId = null;
  let lastPosition = null;
  let listeners = [];
  let hasPermission = false;
  let retryCount = 0;
  const MAX_RETRIES = 3;

  function start(onUpdate, onError) {
    if (!navigator.geolocation) {
      onError && onError('Geolocation not supported by this browser.');
      return;
    }

    // Reset retry count on new start
    retryCount = 0;
    
    watchId = navigator.geolocation.watchPosition(
      pos => {
        hasPermission = true;
        retryCount = 0; // Reset on success
        lastPosition = pos;
        listeners.forEach(fn => fn(pos));
        onUpdate && onUpdate(pos);
      },
      err => {
        console.warn('GPS Error:', err.message, 'Code:', err.code);
        
        // Handle different error types
        if (err.code === 1) { // PERMISSION_DENIED
          hasPermission = false;
          onError && onError('Location access denied. Please enable location permissions in your browser settings.');
          return; // Don't retry for permission denied
        }
        
        retryCount++;
        if (retryCount >= MAX_RETRIES) {
          onError && onError('Unable to get location after multiple attempts. Please check your GPS settings.');
          return;
        }
        
        // For timeout or position unavailable, just log but don't show error to user repeatedly
        if (err.code === 3) { // TIMEOUT
          console.warn('GPS timeout, retrying...');
        } else if (err.code === 2) { // POSITION_UNAVAILABLE
          console.warn('GPS position unavailable, retrying...');
        }
      },
      { 
        enableHighAccuracy: true, 
        maximumAge: 5000, // Accept 5 second old positions
        timeout: 15000 // Increase timeout to 15 seconds
      }
    );
  }

  function stop() {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  }

  function getLastPosition() {
    return lastPosition;
  }

  function hasLocationPermission() {
    return hasPermission;
  }

  function subscribe(fn) {
    listeners.push(fn);
  }

  function unsubscribe(fn) {
    listeners = listeners.filter(f => f !== fn);
  }

  return { start, stop, getLastPosition, hasLocationPermission, subscribe, unsubscribe };
})();
