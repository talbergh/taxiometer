// LocalStorage Trip History Module for TaxiOMeter
export const Storage = (() => {
  const KEY = 'taxiometer_trips';

  function saveTrip(trip) {
    const trips = getTrips();
    trips.push(trip);
    localStorage.setItem(KEY, JSON.stringify(trips));
  }

  function getTrips() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch {
      return [];
    }
  }

  function clearTrips() {
    localStorage.removeItem(KEY);
  }

  return { saveTrip, getTrips, clearTrips };
})();
