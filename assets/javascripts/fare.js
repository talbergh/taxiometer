// Fare Calculation Module for TaxiOMeter
export const Fare = (() => {
  let baseFare = 3.0; // default base fare
  let perKm = 1.5;    // default per km
  let perMin = 0.5;   // default per minute

  function setRates({ base, km, min }) {
    if (base !== undefined) baseFare = parseFloat(base);
    if (km !== undefined) perKm = parseFloat(km);
    if (min !== undefined) perMin = parseFloat(min);
  }

  function getRates() {
    return { base: baseFare, km: perKm, min: perMin };
  }

  function calculate(distanceMeters, durationSeconds) {
    const km = distanceMeters / 1000;
    const min = durationSeconds / 60;
    return parseFloat((baseFare + km * perKm + min * perMin).toFixed(2));
  }

  return { setRates, getRates, calculate };
})();
