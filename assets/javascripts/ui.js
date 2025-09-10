// UI Module for TaxiOMeter
export const UI = (() => {
  function showError(msg) {
    const el = document.getElementById('error-msg');
    if (el) {
      el.textContent = msg;
      el.style.display = 'block';
      setTimeout(() => (el.style.display = 'none'), 4000);
    }
  }

  function updateTripDisplay({ fare, distance, duration }) {
    document.getElementById('fare').textContent = fare.toFixed(2);
    document.getElementById('distance').textContent = (distance / 1000).toFixed(2);
    document.getElementById('duration').textContent = Math.round(duration / 60);
  }

  function updateRatesDisplay({ base, km, min }) {
    document.getElementById('rate-base').value = base;
    document.getElementById('rate-km').value = km;
    document.getElementById('rate-min').value = min;
  }

  function renderTripHistory(trips) {
    const el = document.getElementById('trip-history');
    if (!el) return;
    el.innerHTML = '';
    if (!trips.length) {
      el.innerHTML = '<li>No trips yet.</li>';
      return;
    }
    trips.forEach(trip => {
      const li = document.createElement('li');
      li.innerHTML = `<b>${trip.date}</b>: ${trip.fare} € | ${(trip.distance/1000).toFixed(2)} km | ${Math.round(trip.duration/60)} min`;
      el.appendChild(li);
    });
  }

  return { showError, updateTripDisplay, updateRatesDisplay, renderTripHistory };
})();
