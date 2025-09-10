// Language/Internationalization Module
export const i18n = (() => {
  let currentLang = localStorage.getItem('taxi_language') || 'de';
  
  const translations = {
    de: {
      // Navigation
      home: 'Karte',
      history: 'Verlauf',
      settings: 'Einstellungen',
      
      // Onboarding
      welcome: 'Willkommen',
      welcomeDesc: 'TaxiOMeter hilft Ihnen bei der präzisen Fahrpreisberechnung mit GPS-Tracking.',
      privacy: 'Datenschutz',
      privacyDesc: 'Ihre Privatsphäre ist uns wichtig. Alle Daten werden nur lokal auf Ihrem Gerät gespeichert. Es werden keine Daten an externe Server übertragen oder gesammelt.',
      location: 'Standort',
      locationDesc: 'Für genaue Berechnungen benötigen wir Zugriff auf Ihren Standort.',
      setup: 'Einrichtung',
      setupDesc: 'Bitte geben Sie Ihren Namen ein. Dieser erscheint auf den Quittungen für Ihre Fahrgäste.',
      ready: 'Bereit',
      readyDesc: 'Alles ist eingerichtet! Sie können jetzt Ihre erste Fahrt starten.',
      getStarted: 'Los geht\'s',
      allowLocation: 'Standort erlauben',
      next: 'Weiter',
      
      // Home Screen
      newRide: 'Neue Fahrt starten',
      currentLocation: 'Aktueller Standort',
      
      // Start Ride
      startRide: 'Fahrt starten',
      rideName: 'Fahrname (optional)',
      destination: 'Zieladresse',
      discount: 'Rabatt',
      discountPercent: 'Prozent (%)',
      discountAmount: 'Betrag (€)',
      start: 'Starten',
      cancel: 'Abbrechen',
      
      // End Ride
      rideComplete: '<i class="fa-solid fa-flag-checkered"></i> Fahrt beendet',
      totalAmount: 'Gesamtbetrag',
      distance: 'Strecke',
      duration: 'Dauer',
      shareReceipt: 'Quittung teilen',
      finishRide: 'Fahrt beenden',
      
      // Settings
      language: 'Sprache',
      currency: 'Währung',
      pricePerKm: 'Preis pro Kilometer',
      baseFare: 'Grundgebühr',
      driverName: 'Fahrername',
      
      // History
      noRides: 'Noch keine Fahrten',
      paid: 'Bezahlt',
      unpaid: 'Offen',
      togglePayment: 'Zahlungsstatus ändern',
      
      // Share
      rideReceipt: 'Fahrtquittung',
      rideDetails: 'Fahrtdetails',
      
      // Common
      km: 'km',
      min: 'Min',
      euro: '€',
      loading: 'Laden...',
      error: 'Fehler',
      ok: 'OK'
    },
    
    en: {
      // Navigation
      home: 'Map',
      history: 'History',
      settings: 'Settings',
      
      // Onboarding
      welcome: 'Welcome',
      welcomeDesc: 'TaxiOMeter helps you calculate precise taxi fares using GPS tracking.',
      location: 'Location',
      locationDesc: 'We need access to your location for accurate calculations.',
      ready: 'Ready',
      readyDesc: 'Everything is set up! You can now start your first ride.',
      getStarted: 'Get Started',
      allowLocation: 'Allow Location',
      next: 'Next',
      
      // Home Screen
      newRide: 'Start New Ride',
      currentLocation: 'Current Location',
      
      // Start Ride
      startRide: 'Start Ride',
      rideName: 'Ride Name (optional)',
      destination: 'Destination Address',
      discount: 'Discount',
      discountPercent: 'Percent (%)',
      discountAmount: 'Amount (€)',
      start: 'Start',
      cancel: 'Cancel',
      
      // End Ride
      rideComplete: '<i class="fa-solid fa-flag-checkered"></i> Ride Complete',
      totalAmount: 'Total Amount',
      distance: 'Distance',
      duration: 'Duration',
      shareReceipt: 'Share Receipt',
      finishRide: 'Finish Ride',
      
      // Settings
      language: 'Language',
      currency: 'Currency',
      pricePerKm: 'Price per Kilometer',
      baseFare: 'Base Fare',
      
      // History
      noRides: 'No rides yet',
      paid: 'Paid',
      unpaid: 'Unpaid',
      togglePayment: 'Toggle Payment',
      
      // Share
      rideReceipt: 'Ride Receipt',
      rideDetails: 'Ride Details',
      
      // Common
      km: 'km',
      min: 'min',
      euro: '€',
      loading: 'Loading...',
      error: 'Error',
      ok: 'OK'
    }
  };
  
  function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('taxi_language', lang);
    updateUI();
  }
  
  function getCurrentLanguage() {
    return currentLang;
  }
  
  function t(key) {
    return translations[currentLang]?.[key] || translations.de[key] || key;
  }

  function stripTags(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || '';
  }
  
  function updateUI() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const value = t(key);

      if (el.tagName === 'INPUT' && el.type !== 'submit') {
        el.placeholder = stripTags(value);
      } else {
        const looksLikeHTML = /<\/?[a-z][\s\S]*>/i.test(value);
        if (el.hasAttribute('data-i18n-html') || looksLikeHTML) {
          el.innerHTML = value;
        } else {
          el.textContent = value;
        }
      }
    });
  }
  
  return { setLanguage, getCurrentLanguage, t, updateUI };
})();
