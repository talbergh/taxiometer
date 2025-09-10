// Address Autocomplete Module
export const AddressAutocomplete = (() => {
  let debounceTimer;
  let currentInput;
  let suggestionsContainer;
  
  function init() {
    const destinationInput = document.getElementById('destination');
    const suggestionsDiv = document.getElementById('address-suggestions');
    
    if (!destinationInput || !suggestionsDiv) {
      console.log('Address autocomplete elements not found');
      return;
    }
    
    currentInput = destinationInput;
    suggestionsContainer = suggestionsDiv;
    
    // Add event listeners
    destinationInput.addEventListener('input', handleInput);
    destinationInput.addEventListener('blur', () => {
      // Delay hiding to allow for click events
      setTimeout(() => hideSuggestions(), 150);
    });
    destinationInput.addEventListener('focus', handleFocus);
  }
  
  function handleInput(event) {
    const query = event.target.value.trim();
    
    // Clear previous timer
    clearTimeout(debounceTimer);
    
    if (query.length < 3) {
      hideSuggestions();
      return;
    }
    
    // Debounce the search
    debounceTimer = setTimeout(() => {
      searchAddresses(query);
    }, 300);
  }
  
  function handleFocus(event) {
    const query = event.target.value.trim();
    if (query.length >= 3) {
      searchAddresses(query);
    }
  }
  
  async function searchAddresses(query) {
    try {
      // Using Nominatim (OpenStreetMap) API - free and no API key required
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=de&q=${encodeURIComponent(query)}`
      );
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      displaySuggestions(data);
    } catch (error) {
      console.error('Address search error:', error);
      // Fallback: hide suggestions if API fails
      hideSuggestions();
    }
  }
  
  function displaySuggestions(addresses) {
    if (!addresses || addresses.length === 0) {
      hideSuggestions();
      return;
    }
    
    suggestionsContainer.innerHTML = '';
    
    addresses.forEach(address => {
      const suggestion = document.createElement('div');
      suggestion.className = 'address-suggestion';
      suggestion.textContent = address.display_name;
      
      suggestion.addEventListener('click', () => {
        currentInput.value = address.display_name;
        hideSuggestions();
        // Store coordinates for potential use
        currentInput.dataset.lat = address.lat;
        currentInput.dataset.lon = address.lon;
      });
      
      suggestionsContainer.appendChild(suggestion);
    });
    
    showSuggestions();
  }
  
  function showSuggestions() {
    suggestionsContainer.style.display = 'block';
  }
  
  function hideSuggestions() {
    suggestionsContainer.style.display = 'none';
  }
  
  return {
    init
  };
})();
