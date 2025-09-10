// Fare Calculation Module for TaxiOMeter (no per-minute charges)
export const Fare = (() => {
  let baseFare = 3.0; // default base fare
  let perKm = 1.5;    // default per km

  function setRates({ base, km }) {
    if (base !== undefined) baseFare = parseFloat(base);
    if (km !== undefined) perKm = parseFloat(km);
  }

  function getRates() {
    return { base: baseFare, km: perKm };
  }

  function calculate(distanceMeters, _durationSeconds) {
    const km = distanceMeters / 1000;
    return parseFloat((baseFare + km * perKm).toFixed(2));
  }

  return { setRates, getRates, calculate };
})();
