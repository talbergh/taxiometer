// Enhanced LocalStorage System for Cabra - Android Compatible
export const Storage = (() => {
  const KEY = 'cabra_trips';
  const SETTINGS_KEY = 'taxi_settings';
  const DRIVER_KEY = 'driver_name';
  const ONBOARDING_KEY = 'taxi_onboarding_complete';
  const LANGUAGE_KEY = 'taxi_language';
  const GPS_WARNING_KEY = 'gps_warning_shown';
  const BACKUP_PREFIX = 'cabra_backup_';
  
  // Test localStorage availability and functionality
  function isStorageAvailable() {
    try {
      const testKey = '_cabra_test_';
      const testValue = 'test';
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      return retrieved === testValue;
    } catch (e) {
      console.warn('LocalStorage not available:', e);
      return false;
    }
  }
  
  // Enhanced storage with error handling and backup
  function setStorageItem(key, value, createBackup = true) {
    try {
      if (!isStorageAvailable()) {
        console.warn('LocalStorage not available, using fallback');
        return false;
      }
      
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      // Create backup before overwriting (for important data)
      if (createBackup && localStorage.getItem(key)) {
        const backupKey = BACKUP_PREFIX + key;
        localStorage.setItem(backupKey, localStorage.getItem(key));
      }
      
      localStorage.setItem(key, stringValue);
      
      // Verify storage was successful
      const stored = localStorage.getItem(key);
      if (stored !== stringValue) {
        console.error('Storage verification failed for key:', key);
        return false;
      }
      
      return true;
    } catch (e) {
      console.error('Failed to store item:', key, e);
      return false;
    }
  }
  
  // Enhanced retrieval with fallback to backup
  function getStorageItem(key, defaultValue = null, parseJSON = true) {
    try {
      if (!isStorageAvailable()) {
        return defaultValue;
      }
      
      let item = localStorage.getItem(key);
      
      // Try backup if main storage is corrupted or empty
      if (!item || item === 'null' || item === 'undefined') {
        const backupKey = BACKUP_PREFIX + key;
        item = localStorage.getItem(backupKey);
        
        if (item && item !== 'null' && item !== 'undefined') {
          console.log('Restored from backup:', key);
          // Restore main storage from backup
          localStorage.setItem(key, item);
        }
      }
      
      if (!item || item === 'null' || item === 'undefined') {
        return defaultValue;
      }
      
      if (parseJSON) {
        try {
          return JSON.parse(item);
        } catch (e) {
          console.warn('Failed to parse JSON for key:', key, e);
          return item; // Return as string if JSON parsing fails
        }
      }
      
      return item;
    } catch (e) {
      console.error('Failed to retrieve item:', key, e);
      return defaultValue;
    }
  }
  
  // Trip management
  function saveTrip(trip) {
    const trips = getTrips();
    trips.push({
      ...trip,
      id: trip.id || Date.now().toString(),
      timestamp: Date.now(),
      version: '1.0'
    });
    
    const success = setStorageItem(KEY, trips, true);
    if (!success) {
      console.error('Failed to save trip, trying alternative method');
      // Try to save with reduced data
      const essentialTrip = {
        id: trip.id || Date.now().toString(),
        fare: trip.fare || 0,
        distance: trip.distance || 0,
        startTime: trip.startTime || new Date().toISOString(),
        paid: trip.paid || false
      };
      return setStorageItem(KEY, [...trips.slice(-20), essentialTrip], false); // Keep only last 20
    }
    return success;
  }

  function getTrips() {
    const trips = getStorageItem(KEY, [], true);
    
    // Validate trips array
    if (!Array.isArray(trips)) {
      console.warn('Trips data corrupted, returning empty array');
      return [];
    }
    
    // Filter out invalid trips and sort by timestamp
    return trips
      .filter(trip => trip && trip.id && (trip.fare !== undefined || trip.distance !== undefined))
      .sort((a, b) => {
        const aTime = new Date(a.startTime || a.date || 0).getTime();
        const bTime = new Date(b.startTime || b.date || 0).getTime();
        return bTime - aTime; // Newest first
      });
  }

  function clearTrips() {
    try {
      localStorage.removeItem(KEY);
      localStorage.removeItem(BACKUP_PREFIX + KEY);
      return true;
    } catch (e) {
      console.error('Failed to clear trips:', e);
      return false;
    }
  }
  
  // Settings management
  function saveSettings(settings) {
    return setStorageItem(SETTINGS_KEY, {
      ...settings,
      timestamp: Date.now(),
      version: '1.0'
    }, true);
  }
  
  function getSettings(defaultSettings = {}) {
    const settings = getStorageItem(SETTINGS_KEY, defaultSettings, true);
    return { ...defaultSettings, ...settings };
  }
  
  // Driver management
  function saveDriverName(name) {
    if (!name || name.trim().length === 0) {
      console.warn('Invalid driver name');
      return false;
    }
    return setStorageItem(DRIVER_KEY, name.trim(), true);
  }
  
  function getDriverName() {
    return getStorageItem(DRIVER_KEY, '', false);
  }
  
  // Onboarding management
  function setOnboardingComplete(complete = true) {
    return setStorageItem(ONBOARDING_KEY, complete ? 'true' : 'false', false);
  }
  
  function isOnboardingComplete() {
    return getStorageItem(ONBOARDING_KEY, 'false', false) === 'true';
  }
  
  // Language management
  function setLanguage(lang) {
    return setStorageItem(LANGUAGE_KEY, lang, false);
  }
  
  function getLanguage(defaultLang = 'de') {
    return getStorageItem(LANGUAGE_KEY, defaultLang, false);
  }
  
  // GPS warning management
  function setGPSWarningShown(shown = true) {
    return setStorageItem(GPS_WARNING_KEY, shown ? 'true' : 'false', false);
  }
  
  function isGPSWarningShown() {
    return getStorageItem(GPS_WARNING_KEY, 'false', false) === 'true';
  }
  
  // Diagnostic functions
  function getStorageInfo() {
    try {
      const info = {
        available: isStorageAvailable(),
        tripsCount: getTrips().length,
        driverName: !!getDriverName(),
        onboardingComplete: isOnboardingComplete(),
        language: getLanguage(),
        storageUsed: 0,
        keys: []
      };
      
      // Calculate storage usage
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          info.keys.push(key);
          info.storageUsed += localStorage[key].length;
        }
      }
      
      info.storageUsed = Math.round(info.storageUsed / 1024) + ' KB';
      
      return info;
    } catch (e) {
      return { available: false, error: e.message };
    }
  }
  
  // Storage cleanup and optimization
  function optimizeStorage() {
    try {
      // Remove old backups (keep only most recent)
      for (let key in localStorage) {
        if (key.startsWith(BACKUP_PREFIX)) {
          const originalKey = key.replace(BACKUP_PREFIX, '');
          if (localStorage.getItem(originalKey)) {
            localStorage.removeItem(key);
          }
        }
      }
      
      // Limit trips to last 100 to save space
      const trips = getTrips();
      if (trips.length > 100) {
        const limitedTrips = trips.slice(0, 100);
        setStorageItem(KEY, limitedTrips, false);
      }
      
      return true;
    } catch (e) {
      console.error('Storage optimization failed:', e);
      return false;
    }
  }
  
  // Export/Import for backup purposes
  function exportData() {
    try {
      return {
        trips: getTrips(),
        settings: getSettings(),
        driverName: getDriverName(),
        onboardingComplete: isOnboardingComplete(),
        language: getLanguage(),
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
    } catch (e) {
      console.error('Export failed:', e);
      return null;
    }
  }
  
  function importData(data) {
    try {
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data format');
      }
      
      let success = true;
      
      if (data.trips && Array.isArray(data.trips)) {
        success = setStorageItem(KEY, data.trips, true) && success;
      }
      
      if (data.settings) {
        success = saveSettings(data.settings) && success;
      }
      
      if (data.driverName) {
        success = saveDriverName(data.driverName) && success;
      }
      
      if (data.onboardingComplete !== undefined) {
        success = setOnboardingComplete(data.onboardingComplete) && success;
      }
      
      if (data.language) {
        success = setLanguage(data.language) && success;
      }
      
      return success;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }

  return { 
    // Original API (backward compatible)
    saveTrip, 
    getTrips, 
    clearTrips,
    
    // Enhanced API
    saveSettings,
    getSettings,
    saveDriverName,
    getDriverName,
    setOnboardingComplete,
    isOnboardingComplete,
    setLanguage,
    getLanguage,
    setGPSWarningShown,
    isGPSWarningShown,
    
    // Utility functions
    isStorageAvailable,
    getStorageInfo,
    optimizeStorage,
    exportData,
    importData
  };
})();
