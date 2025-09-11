// Cabra Complete App Logic
import { GPS } from '../map/GPS.js';
import { Fare } from '../map/FareCalculator.js';
import { Storage } from './Storage.js';
import { UI } from '../interface/UI.js';
import { i18n } from '../interface/I18N.js';
import { MapModule } from '../map/Map.js';
import { Router } from "./Router.js"
import { QRModule } from '../interface/QRCode.js';
import { Onboarding } from '../interface/screens/Onboarding.js';
import { AddressAutocomplete } from '../interface/AutoComplete.js';

class CabraApp {
  constructor() {
    this.currentRide = null;
    this.rideActive = false;
    this.ridePaused = false;
    this.rideStartTime = null;
    this.ridePauseTime = null;
    this.rideDuration = 0;
    this.rideDistance = 0;
    this.lastCoords = null;
    this.rideCoords = [];
    this.settings = this.loadSettings();
  // Cached last computed fare snapshot to keep views consistent during a ride
  this.lastComputedFare = 0;
  }

  async init() {
  // Check for onboarding FIRST to avoid initializing heavy modules under overlay
    if (Onboarding.init(() => this.onOnboardingComplete())) {
      this.setupOnboarding();
      return;
    }
    
    this.onOnboardingComplete();
  }
  
  setupOnboarding() {
    // Set up onboarding event listeners
    document.getElementById('onboarding-next-1').onclick = () => Onboarding.nextStep();
    document.getElementById('onboarding-next-2').onclick = () => Onboarding.nextStep();
    document.getElementById('onboarding-location').onclick = () => Onboarding.requestLocationPermission();
    document.getElementById('onboarding-complete').onclick = () => Onboarding.complete();
  }
  
  onOnboardingComplete() {
  // Initialize Router now that onboarding is done (or was already completed)
  Router.init();
    
    // Apply language settings
    i18n.setLanguage(this.settings.language);
    
    // Initialize app components
    this.setupEventListeners();
    this.initGPS();
    
    // Initialize address autocomplete
    AddressAutocomplete.init();
    
    // Update Fare rates
    Fare.setRates({
      base: this.settings.baseFare,
      km: this.settings.pricePerKm,
      minPerMinute: this.settings.pricePerMinute || 0
    });

  // Ensure we land on home after onboarding
  Router.navigateTo('home');
  }
  
  setupEventListeners() {
    // Start Ride Screen
    document.getElementById('start-new-ride').onclick = () => this.showStartRideScreen();
    document.getElementById('start-ride-btn').onclick = () => this.startRide();
    document.getElementById('cancel-ride-btn').onclick = () => Router.navigateTo('home');
    
    // End Ride Screen
    document.getElementById('share-receipt-btn').onclick = () => this.shareReceipt();
    
    // Settings with improved feedback
    document.getElementById('language-select').onchange = (e) => {
      this.updateLanguage(e.target.value);
      this.showToast('Sprache geändert');
    };
    document.getElementById('price-per-km').onchange = (e) => {
      this.updatePricePerKm(e.target.value);
      this.showToast('Preis pro Kilometer aktualisiert');
    };
    document.getElementById('base-fare').onchange = (e) => {
      this.updateBaseFare(e.target.value);
      this.showToast('Grundgebühr aktualisiert');
    };
    document.getElementById('driver-name-setting').onchange = (e) => this.updateDriverName(e.target.value);
    
    // New settings handlers
    const ppm = document.getElementById('price-per-minute');
    if (ppm) ppm.onchange = (e) => {
      this.updatePricePerMinute(e.target.value);
      this.showToast('Preis pro Minute aktualisiert');
    };
    const minFare = document.getElementById('minimum-fare');
    if (minFare) minFare.onchange = (e) => {
      this.updateMinimumFare(e.target.value);
      this.showToast('Mindestfahrpreis aktualisiert');
    };
    const rounding = document.getElementById('rounding');
    if (rounding) rounding.onchange = (e) => {
      this.updateRounding(e.target.value);
      this.showToast('Rundungseinstellung geändert');
    };
    const night = document.getElementById('night-surcharge');
    if (night) night.onchange = (e) => {
      this.updateNightSurcharge(e.target.value);
      this.showToast('Nachtzuschlag aktualisiert');
    };
    const nightStart = document.getElementById('night-start');
    const nightEnd = document.getElementById('night-end');
    if (nightStart && nightEnd) {
      nightStart.onchange = () => {
        this.updateNightHours(nightStart.value, nightEnd.value);
        this.showToast('Nachtzeiten aktualisiert');
      };
      nightEnd.onchange = () => {
        this.updateNightHours(nightStart.value, nightEnd.value);
        this.showToast('Nachtzeiten aktualisiert');
      };
    }
    
    // Settings tabs
    this.setupSettingsTabs();
    
    // Add haptic feedback for supported devices
    this.setupHapticFeedback();
  }
  
  setupHapticFeedback() {
    if ('vibrate' in navigator) {
      // Add subtle haptic feedback to buttons
      document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('touchstart', () => {
          navigator.vibrate(10); // Very subtle 10ms vibration
        });
      });
    }
  }
  
  showToast(message, type = 'info') {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: calc(var(--spacing-lg) + env(safe-area-inset-top));
      left: 50%;
      transform: translateX(-50%);
      background: var(--card-elevated);
      color: var(--text-primary);
      padding: var(--spacing-md) var(--spacing-lg);
      border-radius: var(--radius-xl);
      font-size: var(--font-size-subhead);
      font-weight: 500;
      z-index: var(--z-toast);
      box-shadow: var(--shadow-3);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--border);
      opacity: 0;
      transition: all 0.3s ease;
      pointer-events: none;
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });
    
    // Remove after delay
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(-20px)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }
  
  setupSettingsTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetTab = button.dataset.tab;
        
        // Remove active class from all buttons and contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked button and corresponding content
        button.classList.add('active');
        document.getElementById(`${targetTab}-tab`).classList.add('active');
      });
    });
    
  // Load current driver name in settings
    const driverNameInput = document.getElementById('driver-name-setting');
    const currentDriverName = Storage.getDriverName();
    if (currentDriverName && driverNameInput) {
      driverNameInput.value = currentDriverName;
    }

  // Initialize settings inputs from saved settings
  const s = this.settings;
  const setVal = (id, v) => { const el = document.getElementById(id); if (el != null) el.value = v; };
  setVal('price-per-km', s.pricePerKm);
  setVal('base-fare', s.baseFare);
  setVal('price-per-minute', s.pricePerMinute ?? 0);
  setVal('minimum-fare', s.minimumFare ?? 0);
  setVal('rounding', s.rounding ?? 'none');
  setVal('night-surcharge', s.nightSurchargePercent ?? 0);
  setVal('night-start', (s.nightSurchargeHours?.start ?? 22));
  setVal('night-end', (s.nightSurchargeHours?.end ?? 6));
  }
  
  updateDriverName(name) {
    const success = Storage.saveDriverName(name);
    if (!success) {
      console.error('Failed to save driver name');
      this.showToast && this.showToast('Fehler beim Speichern des Namens', 'error');
    }
  }
  
  resetRide() {
    this.rideActive = false;
    this.ridePaused = false;
    this.currentRide = null;
    this.rideStartTime = null;
    this.ridePauseTime = null;
    this.rideDuration = 0;
    this.rideDistance = 0;
    this.lastCoords = null;
    this.rideCoords = [];
    
    // Update UI
    this.updateRideActiveUI();
    this.hideRideInfoOverlay();
    
    // Clear map route and re-enable follow mode
    MapModule.clearRoute();
    MapModule.setFollowMode(true);
    
    // Update follow button state
    const followBtn = document.getElementById('follow-btn');
    if (followBtn) {
      followBtn.classList.add('active');
    }
    
    Router.navigateTo('home');
  }
  
  initGPS() {
    GPS.start(
      (position, options) => this.onLocationUpdate(position, options),
      (error) => {
        console.warn('GPS initialization error:', error);
        // Show user-friendly message for GPS issues
        if (error.includes('denied')) {
          this.showLocationDeniedMessage();
        }
        // Don't spam console with repeated errors
      }
    );
  }
  
  showLocationDeniedMessage() {
    // Show a one-time message about GPS being needed using enhanced storage
    if (!Storage.isGPSWarningShown()) {
      alert('Cabra funktioniert am besten mit aktiviertem Standortzugriff. Sie können die App weiterhin manuell verwenden, aber die Entfernungsberechnung ist dann nicht verfügbar.');
      Storage.setGPSWarningShown(true);
    }
  }
  
  initHomeScreen() {
    // Initialize map if not already done
    if (!MapModule.getMap()) {
      const map = MapModule.initMap('map');
      
      // Add GPS accuracy indicator and follow button
      this.addMapControls();
      
      // Get current location and center map
      if (navigator.geolocation && GPS.hasLocationPermission()) {
        GPS.getCurrentPosition(
          (position) => {
            MapModule.updateUserLocation(
              position.coords.latitude,
              position.coords.longitude,
              { isHighAccuracy: position.coords.accuracy < 20 }
            );
            this.updateGPSAccuracy(position.coords.accuracy);
          },
          (error) => {
            console.warn('Home screen location error:', error.message);
            // Set default location (center of Germany) if GPS fails
            MapModule.updateUserLocation(51.1657, 10.4515, { isHighAccuracy: false });
          }
        );
      } else {
        // Set default location if no GPS permission
        MapModule.updateUserLocation(51.1657, 10.4515, { isHighAccuracy: false });
      }
    }
  }

  addMapControls() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    // Add GPS accuracy indicator
    const accuracyIndicator = document.createElement('div');
    accuracyIndicator.id = 'gps-accuracy';
    accuracyIndicator.className = 'gps-accuracy';
    accuracyIndicator.style.display = 'none';
    mapContainer.appendChild(accuracyIndicator);

    // Add follow mode button
    const followBtn = document.createElement('button');
    followBtn.id = 'follow-btn';
    followBtn.className = 'follow-btn active';
    followBtn.innerHTML = '<i class="fas fa-crosshairs"></i>';
    followBtn.title = 'Follow Location';
    followBtn.onclick = () => this.toggleFollowMode();
    mapContainer.appendChild(followBtn);
  }

  toggleFollowMode() {
    const followBtn = document.getElementById('follow-btn');
    if (!followBtn) return;

    const isFollowing = MapModule.isFollowing();
    
    if (isFollowing) {
      MapModule.setFollowMode(false);
      followBtn.classList.remove('active');
      followBtn.title = 'Enable Follow Mode';
      this.showToast('Follow mode disabled', 'info');
    } else {
      MapModule.setFollowMode(true);
      MapModule.centerOnUser(true);
      followBtn.classList.add('active');
      followBtn.title = 'Disable Follow Mode';
      this.showToast('Follow mode enabled', 'success');
    }
  }

  updateGPSAccuracy(accuracy) {
    const indicator = document.getElementById('gps-accuracy');
    if (!indicator) return;

    if (accuracy) {
      indicator.style.display = 'block';
      
      let accuracyClass = 'low';
      let accuracyText = `${Math.round(accuracy)}m`;
      
      if (accuracy <= 5) {
        accuracyClass = 'high';
        accuracyText = `${Math.round(accuracy)}m (Sehr gut)`;
      } else if (accuracy <= 20) {
        accuracyClass = 'medium';
        accuracyText = `${Math.round(accuracy)}m (Gut)`;
      } else {
        accuracyClass = 'low';
        accuracyText = `${Math.round(accuracy)}m (Ungenau)`;
      }
      
      indicator.className = `gps-accuracy ${accuracyClass}`;
      indicator.textContent = accuracyText;
      
      // Hide after 5 seconds if accuracy is good
      if (accuracy <= 20) {
        setTimeout(() => {
          if (indicator) {
            indicator.style.display = 'none';
          }
        }, 5000);
      }
    } else {
      indicator.style.display = 'none';
    }
  }

  onLocationUpdate(position, options = {}) {
    const { latitude, longitude, accuracy } = position.coords;
    const { isHighAccuracy = true, isMoving = false } = options;
    
    // Update GPS accuracy indicator
    this.updateGPSAccuracy(accuracy);
    
    // Update map with enhanced options
    MapModule.updateUserLocation(latitude, longitude, {
      isHighAccuracy,
      isMoving
    });
    
    // Handle active ride tracking
    if (!this.rideActive || this.ridePaused) return;
    
    // Enhanced GPS filtering for ride tracking
    if (accuracy > 30) { // Stricter accuracy requirement for billing
      console.log('GPS reading too inaccurate for billing:', accuracy + 'm');
      return;
    }
    
    if (this.lastCoords) {
      const distance = this.haversineDistance(
        this.lastCoords.lat, this.lastCoords.lon,
        latitude, longitude
      );
      
      // Enhanced movement detection with time-based filtering
      const timeDiff = Date.now() - (this.lastCoords.timestamp || 0);
      const minDistance = this.calculateMinDistance(timeDiff, isMoving);
      
      if (distance > minDistance) {
        this.rideDistance += distance;
        this.rideCoords.push({ 
          lat: latitude, 
          lng: longitude, 
          timestamp: Date.now(),
          accuracy: accuracy
        });
        
        // Update route visualization
        if (this.rideCoords.length > 1) {
          MapModule.addRoute(this.rideCoords);
        }
        
        console.log(`Valid movement: ${distance.toFixed(2)}m (${accuracy.toFixed(1)}m accuracy)`);
      } else if (distance > 0) {
        console.log(`Movement filtered: ${distance.toFixed(2)}m (below ${minDistance.toFixed(2)}m threshold)`);
      }
    } else {
      // Always add first coordinate with timestamp
      this.rideCoords.push({ 
        lat: latitude, 
        lng: longitude, 
        timestamp: Date.now(),
        accuracy: accuracy
      });
    }
    
    this.lastCoords = { 
      lat: latitude, 
      lon: longitude, 
      timestamp: Date.now()
    };
    
    this.updateRideDisplay();
  }

  // Calculate minimum distance threshold based on time and movement status
  calculateMinDistance(timeDiff, isMoving) {
    const baseDistance = isMoving ? 8 : 15; // Lower threshold when moving
    const timeBonus = Math.min(timeDiff / 1000, 10) * 0.5; // Bonus for longer time gaps
    return Math.max(baseDistance - timeBonus, 3); // Never below 3 meters
  }

  // Renamed for clarity and enhanced precision
  haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const toRad = (x) => (x * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + 
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
              Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // Legacy function for compatibility
  haversine(lat1, lon1, lat2, lon2) {
    return this.haversineDistance(lat1, lon1, lat2, lon2);
  }
  
  showStartRideScreen() {
    Router.navigateTo('start-ride');
  }
  
  startRide() {
    const rideName = document.getElementById('ride-name').value;
    const destination = document.getElementById('destination').value;
    const discountType = document.getElementById('discount-type').value;
    const discountValue = parseFloat(document.getElementById('discount-value').value) || 0;
    
    this.currentRide = {
      id: Date.now().toString(),
      name: rideName,
      destination: destination,
      discount: { type: discountType, value: discountValue },
      startTime: new Date().toISOString(),
      coordinates: []
    };
    
    this.rideActive = true;
    this.ridePaused = false;
    this.rideStartTime = Date.now();
    this.rideDuration = 0;
    this.rideDistance = 0;
    this.lastCoords = null;
    this.rideCoords = [];
    
    // Navigate back to home screen and update UI for active ride
    Router.navigateTo('home');
    this.updateRideActiveUI();
    
    // Clear any existing route and enable follow mode for tracking
    MapModule.clearRoute();
    MapModule.setFollowMode(true);
    
    // Ensure follow button is active during ride
    const followBtn = document.getElementById('follow-btn');
    if (followBtn) {
      followBtn.classList.add('active');
    }
    
    // Show message if GPS is not available
    if (!GPS.hasLocationPermission()) {
      setTimeout(() => {
        alert('GPS is not available. Distance will be calculated manually or you can enable location access.');
      }, 500);
    } else {
      this.showToast('Fahrt gestartet - GPS-Tracking aktiviert', 'success');
    }
  }
  
  updateRideActiveUI() {
    if (this.rideActive) {
      // Update button text and functionality
      const startBtn = document.getElementById('start-new-ride');
      startBtn.textContent = 'Fahrt beenden';
      startBtn.className = 'btn danger map-start-btn';
      startBtn.onclick = () => this.showEndRideScreen();
      
      // Add pause button
      this.addPauseButton();
      
      // Show ride info overlay
      this.showRideInfoOverlay();
    } else {
      // Reset to original state
      const startBtn = document.getElementById('start-new-ride');
      startBtn.textContent = 'Neue Fahrt starten';
      startBtn.className = 'btn map-start-btn';
      startBtn.onclick = () => this.showStartRideScreen();
      
      // Remove pause button and overlay
      this.removePauseButton();
      this.hideRideInfoOverlay();
    }
  }
  
  addPauseButton() {
    // Remove existing pause button if any
    this.removePauseButton();
    
    const pauseBtn = document.createElement('button');
    pauseBtn.id = 'pause-ride-btn';
    pauseBtn.className = 'btn secondary map-pause-btn';
    pauseBtn.textContent = this.ridePaused ? 'Fortsetzen' : 'Pausieren';
    pauseBtn.onclick = () => this.togglePauseRide();
    
    document.querySelector('.map-container').appendChild(pauseBtn);
  }
  
  removePauseButton() {
    const pauseBtn = document.getElementById('pause-ride-btn');
    if (pauseBtn) {
      pauseBtn.remove();
    }
  }
  
  togglePauseRide() {
    if (this.ridePaused) {
      // Resume ride
      this.ridePaused = false;
      this.rideStartTime = Date.now() - (this.ridePauseTime || 0);
      document.getElementById('pause-ride-btn').textContent = 'Pausieren';
    } else {
      // Pause ride
      this.ridePaused = true;
      this.ridePauseTime = Date.now() - this.rideStartTime;
      document.getElementById('pause-ride-btn').textContent = 'Fortsetzen';
    }
  }
  
  showRideInfoOverlay() {
    // Remove existing overlay if any
    this.hideRideInfoOverlay();
    
    const overlay = document.createElement('div');
    overlay.id = 'ride-info-overlay';
    overlay.className = 'map-overlay ride-info';
    overlay.innerHTML = `
      <div><i class="fa-solid fa-road"></i> <span id="ride-distance-display">0.00</span> km <i class="fa-solid fa-clock"></i> Zeit: <span id="ride-time-display">00:00</span> <i class="fa-solid fa-euro-sign"></i> Preis: <span id="ride-price-display">€0.00</span></div>
    `;
    
    document.querySelector('.map-container').appendChild(overlay);
    
    // Start updating the display
    this.startRideDisplayUpdate();
  }
  
  hideRideInfoOverlay() {
    const overlay = document.getElementById('ride-info-overlay');
    if (overlay) {
      overlay.remove();
    }
    this.stopRideDisplayUpdate();
  }
  
  startRideDisplayUpdate() {
    this.rideDisplayInterval = setInterval(() => {
      if (this.rideActive) {
        this.updateRideDisplay();
      }
    }, 1000);
  }
  
  stopRideDisplayUpdate() {
    if (this.rideDisplayInterval) {
      clearInterval(this.rideDisplayInterval);
      this.rideDisplayInterval = null;
    }
  }
  
  showEndRideScreen() {
    // Calculate current totals before showing end screen
    if (!this.ridePaused) {
      this.rideDuration = (Date.now() - this.rideStartTime) / 1000;
    } else {
      this.rideDuration = this.ridePauseTime / 1000;
    }
    this.endRide()
    Router.navigateTo('end-ride');
    this.updateRideDisplay();
  }
  
  endRide() {
    if (!this.rideActive || !this.currentRide) {
      alert('No active ride to end.');
      return;
    }
    
    this.rideActive = false;
    this.ridePaused = false;
    
    // Calculate final duration
    if (!this.ridePaused) {
      this.rideDuration = (Date.now() - this.rideStartTime) / 1000;
    } else {
      this.rideDuration = this.ridePauseTime / 1000;
    }
    
    // Calculate final fare consistently
    const finalFare = this.computeFinalFare({
      distance: this.rideDistance,
      duration: this.rideDuration,
      discount: this.currentRide.discount
    });
    
    // Complete ride data
    this.currentRide.endTime = new Date().toISOString();
    this.currentRide.distance = this.rideDistance;
    this.currentRide.duration = this.rideDuration;
  this.currentRide.fare = finalFare;
    this.currentRide.coordinates = this.rideCoords;
    this.currentRide.paid = false;
    this.currentRide.date = this.currentRide.startTime; // Ensure date is set
    
    // Save to storage
    Storage.saveTrip(this.currentRide);
    
    // Generate QR code
    this.generateReceiptQR();
    
    // Update UI back to normal state
    this.updateRideActiveUI();
  }
  
  updateRideDisplay() {
    if (!this.rideActive) return;
    
    const now = Date.now();
    const currentDuration = this.rideDuration + (this.ridePaused ? 0 : (now - this.rideStartTime) / 1000);
    // Keep a consistent computed fare snapshot across views during the ride
    const currentFare = this.computeFinalFare({
      distance: this.rideDistance,
      duration: currentDuration,
      discount: this.currentRide?.discount
    });
    this.lastComputedFare = currentFare;
    
    // Update end ride screen elements
    const fareElement = document.getElementById('current-fare');
    const distanceElement = document.getElementById('current-distance');
    const durationElement = document.getElementById('current-duration');
    
    if (fareElement) fareElement.textContent = currentFare.toFixed(2);
    if (distanceElement) distanceElement.textContent = (this.rideDistance / 1000).toFixed(2);
    if (durationElement) durationElement.textContent = Math.round(currentDuration / 60);
    
    // Update ride info overlay elements
    const rideDistanceDisplay = document.getElementById('ride-distance-display');
    const rideTimeDisplay = document.getElementById('ride-time-display');
    const ridePriceDisplay = document.getElementById('ride-price-display');
    
    if (rideDistanceDisplay) {
      rideDistanceDisplay.textContent = (this.rideDistance / 1000).toFixed(2);
    }
    
    if (rideTimeDisplay) {
      const hours = Math.floor(currentDuration / 3600);
      const minutes = Math.floor((currentDuration % 3600) / 60);
      rideTimeDisplay.textContent = hours > 0 ? 
        `${hours}:${minutes.toString().padStart(2, '0')}` : 
        `${minutes}:${Math.floor(currentDuration % 60).toString().padStart(2, '0')}`;
    }
    
    if (ridePriceDisplay) {
      ridePriceDisplay.textContent = `€${currentFare.toFixed(2)}`;
    }
    
    // Update route on map
    if (this.rideCoords.length > 1) {
      MapModule.addRoute(this.rideCoords);
    }
  }
  
  generateReceiptQR() {
    if (!this.currentRide) {
      console.error('No current ride to generate QR for');
      return;
    }
    
    const encodedData = QRModule.encodeRideData(this.currentRide);
    if (!encodedData) {
      console.error('Failed to encode ride data');
      document.getElementById('qr-code').innerHTML = '<p style="color: var(--danger);">Unable to generate QR code</p>';
      return;
    }
    
    // Use shorter URL structure - try just the domain root with parameter
    const shareUrl = `${window.location.origin}/cabra/share.html?r=${encodedData}`;
    console.log('Share URL length:', shareUrl.length);
    
    // Generate smaller QR code for better scannability
    QRModule.generateQR(shareUrl, 'qr-code', 250);
  }
  
  shareReceipt() {
    if (!this.currentRide) {
      alert('No ride data available to share.');
      return;
    }
    
    const encodedData = QRModule.encodeRideData(this.currentRide);
    if (!encodedData) {
      alert('Unable to encode ride data for sharing.');
      return;
    }
    
    const shareUrl = `${window.location.origin}/cabra/share.html?data=${encodedData}`;
    
    if (navigator.share) {
      navigator.share({
        title: i18n.t('rideReceipt'),
        text: `${i18n.t('totalAmount')}: ${this.currentRide.fare.toFixed(2)}€`,
        url: shareUrl
      }).catch(err => console.log('Share cancelled:', err));
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Receipt link copied to clipboard');
      }).catch(() => {
        alert('Unable to copy link. Please share manually: ' + shareUrl);
      });
    }
  }
  
  // Zentrale (Control Center) functionality
  loadZentrale() {
    this.zentralePeriod = this.zentralePeriod || 'all';
    this.setupZentralePeriodSelector();
    this.updateZentraleStats();
    this.loadZentraleActivity();
    this.setupZentraleControls();
  }

  setupZentralePeriodSelector() {
    const periodBtns = document.querySelectorAll('.period-btn');
    periodBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.period === this.zentralePeriod);
      btn.onclick = () => {
        this.zentralePeriod = btn.dataset.period;
        periodBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.updateZentraleStats();
        this.updateChartPeriodDisplay();
      };
    });
  }

  updateZentraleStats() {
    const trips = this.getTripsForPeriod(this.zentralePeriod);
    const stats = this.calculateStats(trips);
    
    // Update stat cards
    document.getElementById('total-revenue').textContent = `${stats.totalRevenue.toFixed(2)}€`;
    document.getElementById('total-trips').textContent = stats.totalTrips;
    document.getElementById('total-distance').textContent = `${stats.totalDistance.toFixed(1)} km`;
    document.getElementById('total-time').textContent = stats.totalTimeFormatted;
    
    this.updateChartPeriodDisplay();
  }

  getTripsForPeriod(period) {
    const trips = Storage.getTrips();
    if (period === 'all') return trips;
    
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        return trips;
    }
    
    return trips.filter(trip => {
      const tripDate = new Date(trip.startTime || trip.date);
      return tripDate >= startDate;
    });
  }

  calculateStats(trips) {
    if (trips.length === 0) {
      return {
        totalRevenue: 0,
        totalTrips: 0,
        totalDistance: 0,
        totalTime: 0,
        totalTimeFormatted: '0h 0m'
      };
    }

    const totalRevenue = trips.reduce((sum, trip) => sum + (trip.fare || 0), 0);
    const totalDistance = trips.reduce((sum, trip) => sum + (trip.distance || 0), 0) / 1000; // Convert to km
    const totalTime = trips.reduce((sum, trip) => {
      if (trip.endTime && trip.startTime) {
        return sum + (new Date(trip.endTime) - new Date(trip.startTime));
      }
      return sum + (trip.duration || 0);
    }, 0);

    // Format total time
    const hours = Math.floor(totalTime / (1000 * 60 * 60));
    const minutes = Math.floor((totalTime % (1000 * 60 * 60)) / (1000 * 60));
    const totalTimeFormatted = `${hours}h ${minutes}m`;

    return {
      totalRevenue,
      totalTrips: trips.length,
      totalDistance,
      totalTime,
      totalTimeFormatted
    };
  }

  updateChartPeriodDisplay() {
    const display = document.getElementById('chart-period-display');
    if (display) {
      const periodLabels = {
        all: i18n.t('allTime'),
        today: i18n.t('today'),
        week: i18n.t('thisWeek'),
        month: i18n.t('thisMonth')
      };
      display.textContent = periodLabels[this.zentralePeriod] || i18n.t('allTime');
    }
  }

  loadZentraleActivity() {
    const trips = Storage.getTrips().slice(-5); // Last 5 trips for preview
    const previewContainer = document.getElementById('zentrale-history-preview');
    
    if (trips.length === 0) {
      previewContainer.innerHTML = `
        <div class="no-data">
          <i class="fas fa-car"></i>
          <h3 data-i18n="noRides">${i18n.t('noRides')}</h3>
          <p data-i18n="startFirstRide">Starten Sie Ihre erste Fahrt</p>
        </div>
      `;
      return;
    }

    previewContainer.innerHTML = trips.reverse().map(trip => this.renderHistoryItem(trip)).join('');
  }

  renderHistoryItem(trip, includeSearchHighlight = false) {
    const tripDate = new Date(trip.startTime || trip.date);
    const dateStr = tripDate.toLocaleDateString();
    const timeStr = tripDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return `
      <div class="history-item" onclick="app.togglePaymentStatus('${trip.id}')">
        <div class="history-header">
          <div class="history-title">${trip.name || `${i18n.t('ride')} #${trip.id.slice(-4)}`}</div>
          <div class="history-amount">${trip.fare.toFixed(2)}€</div>
        </div>
        <div class="history-details">
          <span>${dateStr} ${timeStr}</span>
          <span>${(trip.distance / 1000).toFixed(2)} ${i18n.t('km')}</span>
          <span class="payment-status ${trip.paid ? 'paid' : 'unpaid'}">
            <i class="fas fa-${trip.paid ? 'check-circle' : 'clock'}"></i>
            ${i18n.t(trip.paid ? 'paid' : 'unpaid')}
          </span>
        </div>
      </div>
    `;
  }

  toggleHistoryView() {
    const detailedHistory = document.getElementById('detailed-history');
    const isVisible = detailedHistory.style.display !== 'none';
    
    detailedHistory.style.display = isVisible ? 'none' : 'block';
    
    if (!isVisible) {
      this.loadFullHistory();
      // Animate scroll to detailed history
      setTimeout(() => {
        detailedHistory.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }

  loadFullHistory(searchTerm = '', paymentFilter = 'all', sortBy = 'newest') {
    let trips = Storage.getTrips();
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      trips = trips.filter(trip => 
        (trip.name && trip.name.toLowerCase().includes(term)) ||
        trip.id.toLowerCase().includes(term) ||
        trip.fare.toString().includes(term)
      );
    }
    
    // Apply payment filter
    if (paymentFilter !== 'all') {
      trips = trips.filter(trip => 
        paymentFilter === 'paid' ? trip.paid : !trip.paid
      );
    }
    
    // Apply sorting
    trips.sort((a, b) => {
      const aDate = new Date(a.startTime || a.date);
      const bDate = new Date(b.startTime || b.date);
      
      switch (sortBy) {
        case 'oldest':
          return aDate - bDate;
        case 'amount-high':
          return b.fare - a.fare;
        case 'amount-low':
          return a.fare - b.fare;
        case 'newest':
        default:
          return bDate - aDate;
      }
    });
    
    const fullContainer = document.getElementById('zentrale-history-full');
    
    if (trips.length === 0) {
      fullContainer.innerHTML = `
        <div class="no-data">
          <i class="fas fa-search"></i>
          <h3 data-i18n="noTripsInPeriod">${i18n.t('noTripsInPeriod')}</h3>
          <p>Ändern Sie die Suchkriterien oder Filter</p>
        </div>
      `;
      return;
    }

    fullContainer.innerHTML = trips.map(trip => this.renderHistoryItem(trip, true)).join('');
  }

  setupZentraleControls() {
    // Search functionality
    const searchInput = document.getElementById('history-search');
    const paymentFilter = document.getElementById('payment-filter');
    const sortSelect = document.getElementById('sort-history');
    
    if (searchInput) {
      searchInput.oninput = () => this.debounce(() => {
        this.loadFullHistory(
          searchInput.value,
          paymentFilter.value,
          sortSelect.value
        );
      }, 300)();
    }
    
    if (paymentFilter) {
      paymentFilter.onchange = () => {
        this.loadFullHistory(
          searchInput.value,
          paymentFilter.value,
          sortSelect.value
        );
      };
    }
    
    if (sortSelect) {
      sortSelect.onchange = () => {
        this.loadFullHistory(
          searchInput.value,
          paymentFilter.value,
          sortSelect.value
        );
      };
    }
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Legacy function kept for compatibility
  loadHistory() {
    this.loadZentrale();
  }
  
  togglePaymentStatus(rideId) {
    const trips = Storage.getTrips();
    const trip = trips.find(t => t.id === rideId);
    if (trip) {
      trip.paid = !trip.paid;
      
      // Save updated trip data using enhanced storage
      const success = Storage.saveTrip({ ...trip });
      if (!success) {
        console.error('Failed to update payment status');
        this.showToast('Fehler beim Speichern des Zahlungsstatus', 'error');
        return;
      }
      
      // Clear and re-save all trips to maintain consistency
      Storage.clearTrips();
      trips.forEach(t => Storage.saveTrip(t));
      
      // Update both preview and full history if visible
      this.loadZentraleActivity();
      const detailedHistory = document.getElementById('detailed-history');
      if (detailedHistory && detailedHistory.style.display !== 'none') {
        const searchInput = document.getElementById('history-search');
        const paymentFilter = document.getElementById('payment-filter');
        const sortSelect = document.getElementById('sort-history');
        this.loadFullHistory(
          searchInput.value,
          paymentFilter.value,
          sortSelect.value
        );
      }
      
      // Update stats as well
      this.updateZentraleStats();
      
      // Show feedback
      this.showToast(`${i18n.t('togglePayment')}: ${i18n.t(trip.paid ? 'paid' : 'unpaid')}`, 'success');
    }
  }

  // Diagnostic functions for troubleshooting storage issues
  runDiagnostics() {
    console.log('Running system diagnostics...');
    
    // Storage diagnostics
    const storageInfo = Storage.getStorageInfo();
    document.getElementById('storage-available').textContent = storageInfo.available ? '✅ Verfügbar' : '❌ Nicht verfügbar';
    document.getElementById('storage-available').className = storageInfo.available ? 'status-good' : 'status-error';
    
    document.getElementById('trips-count').textContent = `${storageInfo.tripsCount} Fahrten`;
    document.getElementById('trips-count').className = storageInfo.tripsCount > 0 ? 'status-good' : 'status-warning';
    
    const driverName = Storage.getDriverName();
    document.getElementById('driver-name-status').textContent = driverName ? `✅ ${driverName}` : '❌ Nicht gesetzt';
    document.getElementById('driver-name-status').className = driverName ? 'status-good' : 'status-error';
    
    const onboardingComplete = Storage.isOnboardingComplete();
    document.getElementById('onboarding-status').textContent = onboardingComplete ? '✅ Abgeschlossen' : '❌ Nicht abgeschlossen';
    document.getElementById('onboarding-status').className = onboardingComplete ? 'status-good' : 'status-error';
    
    document.getElementById('storage-used').textContent = storageInfo.storageUsed || 'Unbekannt';
    
    // Browser diagnostics
    const browserInfo = this.getBrowserInfo();
    document.getElementById('browser-info').textContent = `${browserInfo.name} ${browserInfo.version}`;
    document.getElementById('platform-info').textContent = browserInfo.platform;
    
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    document.getElementById('pwa-status').textContent = isPWA ? '✅ PWA-Modus' : '⚠️ Browser-Modus';
    document.getElementById('pwa-status').className = isPWA ? 'status-good' : 'status-warning';
    
    // GPS diagnostics
    document.getElementById('geolocation-available').textContent = navigator.geolocation ? '✅ Verfügbar' : '❌ Nicht verfügbar';
    document.getElementById('geolocation-available').className = navigator.geolocation ? 'status-good' : 'status-error';
    
    const hasGPSPermission = GPS.hasLocationPermission();
    document.getElementById('gps-permission').textContent = hasGPSPermission ? '✅ Erteilt' : '⚠️ Nicht erteilt';
    document.getElementById('gps-permission').className = hasGPSPermission ? 'status-good' : 'status-warning';
    
    this.showToast('Diagnose aktualisiert', 'success');
  }
  
  getBrowserInfo() {
    const ua = navigator.userAgent;
    let browserName = 'Unbekannt';
    let browserVersion = 'Unbekannt';
    let platform = navigator.platform || 'Unbekannt';
    
    // Detect browser
    if (ua.includes('Chrome') && !ua.includes('Edg')) {
      browserName = 'Chrome';
      const match = ua.match(/Chrome\/([0-9.]+)/);
      browserVersion = match ? match[1] : 'Unbekannt';
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
      browserName = 'Safari';
      const match = ua.match(/Version\/([0-9.]+)/);
      browserVersion = match ? match[1] : 'Unbekannt';
    } else if (ua.includes('Firefox')) {
      browserName = 'Firefox';
      const match = ua.match(/Firefox\/([0-9.]+)/);
      browserVersion = match ? match[1] : 'Unbekannt';
    } else if (ua.includes('Edg')) {
      browserName = 'Edge';
      const match = ua.match(/Edg\/([0-9.]+)/);
      browserVersion = match ? match[1] : 'Unbekannt';
    }
    
    // Detect platform
    if (ua.includes('Android')) {
      platform = 'Android';
    } else if (ua.includes('iPhone') || ua.includes('iPad')) {
      platform = 'iOS';
    } else if (ua.includes('Windows')) {
      platform = 'Windows';
    } else if (ua.includes('Mac')) {
      platform = 'macOS';
    }
    
    return { name: browserName, version: browserVersion, platform };
  }
  
  exportStorageData() {
    const data = Storage.exportData();
    if (!data) {
      this.showToast('Fehler beim Exportieren der Daten', 'error');
      return;
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cabra-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.showToast('Daten erfolgreich exportiert', 'success');
  }
  
  optimizeStorage() {
    const success = Storage.optimizeStorage();
    if (success) {
      this.showToast('Speicher erfolgreich optimiert', 'success');
      this.runDiagnostics(); // Refresh diagnostics
    } else {
      this.showToast('Fehler bei der Speicher-Optimierung', 'error');
    }
  }
  
  resetApp() {
    if (!confirm('⚠️ ACHTUNG: Dadurch werden ALLE Daten gelöscht!\n\nDies umfasst:\n- Alle Fahrten und Verlauf\n- Einstellungen\n- Fahrername\n- Onboarding-Status\n\nMöchten Sie wirklich fortfahren?')) {
      return;
    }
    
    if (!confirm('Sind Sie WIRKLICH sicher? Diese Aktion kann nicht rückgängig gemacht werden!')) {
      return;
    }
    
    try {
      // Clear all localStorage
      localStorage.clear();
      
      // Clear IndexedDB if available
      if ('indexedDB' in window) {
        indexedDB.deleteDatabase('cabra');
      }
      
      this.showToast('App wurde zurückgesetzt. Seite wird neu geladen...', 'success');
      
      setTimeout(() => {
        location.reload();
      }, 2000);
    } catch (e) {
      console.error('Reset failed:', e);
      this.showToast('Fehler beim Zurücksetzen', 'error');
    }
  }
  
  loadSettings() {
    const defaults = {
      language: 'de',
      currency: 'EUR',
      pricePerKm: 1.5,
      baseFare: 3.0,
      pricePerMinute: 0.0,
      minimumFare: 0.0,
      rounding: 'none', // 'none' | 'nearest-0.10' | 'nearest-0.50'
      nightSurchargePercent: 0, // 0-100
      nightSurchargeHours: { start: 22, end: 6 }
    };
    
    // Use enhanced storage system
    return Storage.getSettings(defaults);
  }
  
  saveSettings() {
    // Use enhanced storage system with error handling
    const success = Storage.saveSettings(this.settings);
    if (!success) {
      console.error('Failed to save settings');
      this.showToast && this.showToast('Fehler beim Speichern der Einstellungen', 'error');
    }
  }
  
  updateLanguage(language) {
    this.settings.language = language;
    this.saveSettings();
    i18n.setLanguage(language);
  }
  
  updatePricePerKm(price) {
    this.settings.pricePerKm = parseFloat(price);
    this.saveSettings();
  Fare.setRates({ km: this.settings.pricePerKm });
  }
  
  updateBaseFare(fare) {
    this.settings.baseFare = parseFloat(fare);
    this.saveSettings();
    Fare.setRates({ base: this.settings.baseFare });
  }

  updatePricePerMinute(price) {
    this.settings.pricePerMinute = parseFloat(price) || 0;
    this.saveSettings();
    Fare.setRates({ minPerMinute: this.settings.pricePerMinute });
  }

  updateMinimumFare(value) {
    this.settings.minimumFare = parseFloat(value) || 0;
    this.saveSettings();
  }

  updateRounding(mode) {
    this.settings.rounding = mode;
    this.saveSettings();
  }

  updateNightSurcharge(percent) {
    this.settings.nightSurchargePercent = parseFloat(percent) || 0;
    this.saveSettings();
  }

  updateNightHours(startHour, endHour) {
    this.settings.nightSurchargeHours = { start: parseInt(startHour, 10) || 0, end: parseInt(endHour, 10) || 0 };
    this.saveSettings();
  }

  // Compute final fare consistently in one place
  computeFinalFare({ distance, duration, discount }) {
    let total = Fare.calculate(distance, duration);

    // Night surcharge
    const now = new Date();
    const hours = now.getHours();
    const { start, end } = this.settings.nightSurchargeHours || { start: 22, end: 6 };
    let night = false;
    if (start < end) {
      night = hours >= start && hours < end;
    } else {
      // Wrap over midnight
      night = hours >= start || hours < end;
    }
    if (night && (this.settings.nightSurchargePercent || 0) > 0) {
      total = total * (1 + (this.settings.nightSurchargePercent / 100));
    }

    // Minimum fare
    if ((this.settings.minimumFare || 0) > 0) {
      total = Math.max(total, this.settings.minimumFare);
    }

    // Discount
    if (discount && discount.value > 0) {
      if (discount.type === 'percent') {
        total = total * (1 - discount.value / 100);
      } else if (discount.type === 'amount') {
        total = Math.max(0, total - discount.value);
      }
    }

    // Rounding
    switch (this.settings.rounding) {
      case 'nearest-0.10':
        total = Math.round(total * 10) / 10; // to 10 cents
        break;
      case 'nearest-0.50':
        total = Math.round(total * 2) / 2; // to 50 cents
        break;
      default:
        total = Math.round(total * 100) / 100; // standard 2-decimal currency rounding
        break;
    }

    return total;
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('ServiceWorker.js');
  }
  
  // Initialize app
  window.app = new CabraApp();
  window.app.init();
});
