// Language/Internationalization Module
export const i18n = (() => {
  let currentLang = localStorage.getItem('taxi_language') || 'de';
  
  const translations = {
    de: {
      // Navigation
      home: 'Karte',
      zentrale: 'Zentrale',
      settings: 'Einstellungen',
      
      // Onboarding
      welcome: 'Willkommen',
      welcomeDesc: 'Cabra hilft Ihnen bei der präzisen Fahrpreisberechnung mit GPS-Tracking.',
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
  pricePerMinute: 'Preis pro Minute',
  minimumFare: 'Mindestfahrpreis',
  rounding: 'Rundung',
  roundNone: 'Keine Rundung',
  roundTo10: 'Auf 0,10€ runden',
  roundTo50: 'Auf 0,50€ runden',
  nightSurcharge: 'Nachtzuschlag (%)',
  nightHours: 'Nachtzeit (Stunden)',
      driverName: 'Fahrername',
      
      // Zentrale & Statistics
      totalRevenue: 'Gesamtumsatz',
      totalTrips: 'Fahrten',
      totalDistance: 'Strecke',
      totalTime: 'Zeit',
      allTime: 'Gesamt',
      today: 'Heute',
      thisWeek: 'Woche',
      thisMonth: 'Monat',
      revenueChart: 'Umsatz-Verlauf',
      chartComingSoon: 'Grafische Auswertung folgt',
      recentActivity: 'Letzte Aktivitäten',
      viewAll: 'Alle anzeigen',
      searchTrips: 'Fahrten suchen...',
      allPayments: 'Alle Zahlungen',
      paidOnly: 'Nur bezahlt',
      unpaidOnly: 'Nur offen',
      newestFirst: 'Neueste zuerst',
      oldestFirst: 'Älteste zuerst',
      highestAmount: 'Höchster Betrag',
      lowestAmount: 'Niedrigster Betrag',
      noTripsInPeriod: 'Keine Fahrten im gewählten Zeitraum',
      avgTripValue: 'Ø Fahrtpreis',
      avgDistance: 'Ø Strecke',
      busyHours: 'Stoßzeiten',
      revenueGrowth: 'Umsatzentwicklung',
      
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
      zentrale: 'Control Center',
      settings: 'Settings',
      
      // Onboarding
      welcome: 'Welcome',
      welcomeDesc: 'Cabra helps you calculate precise taxi fares using GPS tracking.',
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
  pricePerMinute: 'Price per Minute',
  minimumFare: 'Minimum Fare',
  rounding: 'Rounding',
  roundNone: 'No rounding',
  roundTo10: 'Round to €0.10',
  roundTo50: 'Round to €0.50',
  nightSurcharge: 'Night surcharge (%)',
  nightHours: 'Night hours',
      
      // Zentrale & Statistics
      totalRevenue: 'Total Revenue',
      totalTrips: 'Trips',
      totalDistance: 'Distance',
      totalTime: 'Time',
      allTime: 'All Time',
      today: 'Today',
      thisWeek: 'Week',
      thisMonth: 'Month',
      revenueChart: 'Revenue Chart',
      chartComingSoon: 'Charts coming soon',
      recentActivity: 'Recent Activity',
      viewAll: 'View All',
      searchTrips: 'Search trips...',
      allPayments: 'All Payments',
      paidOnly: 'Paid Only',
      unpaidOnly: 'Unpaid Only',
      newestFirst: 'Newest First',
      oldestFirst: 'Oldest First',
      highestAmount: 'Highest Amount',
      lowestAmount: 'Lowest Amount',
      noTripsInPeriod: 'No trips in selected period',
      avgTripValue: 'Avg Trip Value',
      avgDistance: 'Avg Distance',
      busyHours: 'Busy Hours',
      revenueGrowth: 'Revenue Growth',
      
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
