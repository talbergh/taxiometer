// Fare Calculation Module for Cabra
// Responsibility: provide raw fare based on distance/time and configured base rates.
// Important: This module returns UNROUNDED raw totals. Rounding/min fare/discounts are applied at app level.
export const Fare = (() => {
  let baseFare = 3.0; // default base fare
  let perKm = 1.5;    // default per km
  let perMin = 0.0;   // default per minute

  function setRates({ base, km, minPerMinute }) {
    if (base !== undefined) baseFare = parseFloat(base);
    if (km !== undefined) perKm = parseFloat(km);
    if (minPerMinute !== undefined) perMin = parseFloat(minPerMinute);
  }

  function getRates() {
    return { base: baseFare, km: perKm, minPerMinute: perMin };
  }

  function calculate(distanceMeters, durationSeconds) {
    const km = (distanceMeters || 0) / 1000;
    const mins = (durationSeconds || 0) / 60;
    return baseFare + km * perKm + mins * perMin;
  }

  return { setRates, getRates, calculate };
})();
