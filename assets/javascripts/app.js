// TaxiOMeter Complete App Logic
import { GPS } from './gps.js';
import { Fare } from './fare.js';
import { Storage } from './storage.js';
import { UI } from './ui.js';
import { i18n } from './i18n.js';
import { MapModule } from './map.js';
import { Router } from './router.js';
import { QRModule } from './qr.js';
import { Onboarding } from './onboarding.js';
import { AddressAutocomplete } from './autocomplete.js';

class TaxiOMeterApp {
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
  }

  async init() {
    // Initialize modules
    Router.init();
    
    // Check for onboarding
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
      min: 0.5 // Fixed per minute rate
    });
  }
  
  setupEventListeners() {
    // Start Ride Screen
    document.getElementById('start-new-ride').onclick = () => this.showStartRideScreen();
    document.getElementById('start-ride-btn').onclick = () => this.startRide();
    document.getElementById('cancel-ride-btn').onclick = () => Router.navigateTo('home');
    
    // End Ride Screen
    document.getElementById('end-ride-btn').onclick = () => this.endRide();
    document.getElementById('share-receipt-btn').onclick = () => this.shareReceipt();
    
    // Settings
    document.getElementById('language-select').onchange = (e) => this.updateLanguage(e.target.value);
    document.getElementById('price-per-km').onchange = (e) => this.updatePricePerKm(e.target.value);
    document.getElementById('base-fare').onchange = (e) => this.updateBaseFare(e.target.value);
    document.getElementById('driver-name-setting').onchange = (e) => this.updateDriverName(e.target.value);
    
    // Settings tabs
    this.setupSettingsTabs();
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
    const currentDriverName = localStorage.getItem('driver_name');
    if (currentDriverName && driverNameInput) {
      driverNameInput.value = currentDriverName;
    }
  }
  
  updateDriverName(name) {
    localStorage.setItem('driver_name', name);
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
    
    MapModule.clearRoute();
    Router.navigateTo('home');
  }
  
  initGPS() {
    GPS.start(
      (position) => this.onLocationUpdate(position),
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
    // Show a one-time message about GPS being needed
    if (!localStorage.getItem('gps_warning_shown')) {
      alert('TaxiOMeter works best with location access enabled. You can still use the app manually, but distance tracking will not be available.');
      localStorage.setItem('gps_warning_shown', 'true');
    }
  }
  
  initHomeScreen() {
    // Initialize map if not already done
    if (!MapModule.getMap()) {
      const map = MapModule.initMap('map');
      
      // Get current location and center map
      if (navigator.geolocation && GPS.hasLocationPermission()) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            MapModule.updateUserLocation(
              position.coords.latitude,
              position.coords.longitude
            );
          },
          (error) => {
            console.warn('Home screen location error:', error.message);
            // Set default location (center of Germany) if GPS fails
            MapModule.updateUserLocation(51.1657, 10.4515);
          }
        );
      } else {
        // Set default location if no GPS permission
        MapModule.updateUserLocation(51.1657, 10.4515);
      }
    }
  }
  
  onLocationUpdate(position) {
    const { latitude, longitude } = position.coords;
    
    // Update map
    MapModule.updateUserLocation(latitude, longitude);
    
    // Handle active ride tracking
    if (!this.rideActive || this.ridePaused) return;
    
    if (this.lastCoords) {
      const distance = this.haversine(
        this.lastCoords.lat, this.lastCoords.lon,
        latitude, longitude
      );
      
      if (distance > 2) { // Only count significant movements
        this.rideDistance += distance;
        this.rideCoords.push({ lat: latitude, lng: longitude });
      }
    } else {
      this.rideCoords.push({ lat: latitude, lng: longitude });
    }
    
    this.lastCoords = { lat: latitude, lon: longitude };
    this.updateRideDisplay();
  }
  
  haversine(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const toRad = (x) => (x * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + 
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
              Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
    
    // Show message if GPS is not available
    if (!GPS.hasLocationPermission()) {
      setTimeout(() => {
        alert('GPS is not available. Distance will be calculated manually or you can enable location access.');
      }, 500);
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
      <div><strong>Fahrt läuft</strong></div>
      <div>Strecke: <span id="ride-distance-display">0.00</span> km</div>
      <div>Zeit: <span id="ride-time-display">00:00</span></div>
      <div>Preis: <span id="ride-price-display">€0.00</span></div>
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
    
    // Calculate fare
    const baseFare = Fare.calculate(this.rideDistance, this.rideDuration);
    let finalFare = baseFare;
    
    // Apply discount
    if (this.currentRide.discount && this.currentRide.discount.value > 0) {
      if (this.currentRide.discount.type === 'percent') {
        finalFare = baseFare * (1 - this.currentRide.discount.value / 100);
      } else if (this.currentRide.discount.type === 'amount') {
        finalFare = Math.max(0, baseFare - this.currentRide.discount.value);
      }
    }
    
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
    
    // Show completion message
    alert(i18n.t('rideComplete'));
  }
  
  updateRideDisplay() {
    if (!this.rideActive) return;
    
    const now = Date.now();
    const currentDuration = this.rideDuration + (this.ridePaused ? 0 : (now - this.rideStartTime) / 1000);
    const currentFare = Fare.calculate(this.rideDistance, currentDuration);
    
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
    
    const shareUrl = `${window.location.origin}/share.html?data=${encodedData}`;
    QRModule.generateQR(shareUrl, 'qr-code', 200);
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
    
    const shareUrl = `${window.location.origin}/share.html?data=${encodedData}`;
    
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
  
  loadHistory() {
    const trips = Storage.getTrips();
    const historyContainer = document.getElementById('history-list');
    
    if (trips.length === 0) {
      historyContainer.innerHTML = `<div class="card"><p data-i18n="noRides">${i18n.t('noRides')}</p></div>`;
      return;
    }
    
    historyContainer.innerHTML = trips.map(trip => `
      <div class="history-item" onclick="app.togglePaymentStatus('${trip.id}')">
        <div class="history-header">
          <div class="history-title">${trip.name || `${i18n.t('ride')} #${trip.id.slice(-4)}`}</div>
          <div class="history-amount">${trip.fare.toFixed(2)}€</div>
        </div>
        <div class="history-details">
          <span>${new Date(trip.startTime || trip.date).toLocaleDateString()}</span>
          <span>${(trip.distance / 1000).toFixed(2)} ${i18n.t('km')}</span>
          <span class="payment-status ${trip.paid ? 'paid' : 'unpaid'}">
            <i class="fas fa-${trip.paid ? 'check-circle' : 'clock'}"></i>
            ${i18n.t(trip.paid ? 'paid' : 'unpaid')}
          </span>
        </div>
      </div>
    `).join('');
  }
  
  togglePaymentStatus(rideId) {
    const trips = Storage.getTrips();
    const trip = trips.find(t => t.id === rideId);
    if (trip) {
      trip.paid = !trip.paid;
      localStorage.setItem('taxiometer_trips', JSON.stringify(trips));
      this.loadHistory();
    }
  }
  
  loadSettings() {
    const defaults = {
      language: 'de',
      currency: 'EUR',
      pricePerKm: 1.5,
      baseFare: 3.0
    };
    
    try {
      const saved = localStorage.getItem('taxi_settings');
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch {
      return defaults;
    }
  }
  
  saveSettings() {
    localStorage.setItem('taxi_settings', JSON.stringify(this.settings));
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
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
  }
  
  // Initialize app
  window.app = new TaxiOMeterApp();
  window.app.init();
});
