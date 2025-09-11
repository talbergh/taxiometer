// Enhanced Onboarding Module - Android Compatible
import { Storage } from '../../core/Storage.js';

export const Onboarding = (() => {
  let currentStep = 0;
  let steps = [];
  let onComplete = null;
  
  function init(completeCallback) {
    onComplete = completeCallback;
    
    // Enhanced onboarding check with storage diagnostics
    if (!Storage.isStorageAvailable()) {
      console.warn('LocalStorage not available, showing warning');
      showStorageWarning();
      return false;
    }
    
    // Check if onboarding was already completed
    if (Storage.isOnboardingComplete()) {
      console.log('Onboarding already completed');
      const container = document.querySelector('.onboarding-container');
      if (container) container.style.display = 'none';
      return false; // Skip onboarding
    }
    
    console.log('Starting onboarding process');
    steps = document.querySelectorAll('.onboarding-step');
    showStep(0);
    return true; // Show onboarding
  }
  
  function showStorageWarning() {
    const warningHtml = `
      <div class="storage-warning" style="
        position: fixed; 
        top: 50%; 
        left: 50%; 
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 300px;
        text-align: center;
      ">
        <h3>⚠️ Speicher-Problem</h3>
        <p>Ihr Browser unterstützt kein lokales Speichern. Bitte:</p>
        <ul style="text-align: left; margin: 10px 0;">
          <li>Schließen Sie den privaten Modus</li>
          <li>Aktivieren Sie Cookies</li>
          <li>Starten Sie die App neu</li>
        </ul>
        <button onclick="location.reload()" style="
          background: #007AFF;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
        ">App neu starten</button>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', warningHtml);
  }
  
  function showStep(stepIndex) {
    // Hide all steps
    steps.forEach(step => step.classList.remove('active'));
    
    // Show current step
    if (steps[stepIndex]) {
      steps[stepIndex].classList.add('active');
      currentStep = stepIndex;
      
      // Update progress dots
      updateProgressDots();
    }
  }
  
  function nextStep() {
    if (currentStep < steps.length - 1) {
      showStep(currentStep + 1);
    } else {
      complete();
    }
  }
  
  function complete() {
    // Enhanced driver name validation and saving
    const driverNameInput = document.getElementById('driver-name');
    if (!driverNameInput) {
      console.error('Driver name input not found');
      alert('Es gab ein Problem beim Speichern. Bitte laden Sie die Seite neu.');
      return;
    }
    
    const driverName = driverNameInput.value.trim();
    if (!driverName || driverName.length < 2) {
      alert('Bitte geben Sie einen gültigen Namen ein (mindestens 2 Zeichen).');
      driverNameInput.focus();
      return;
    }
    
    // Test storage before proceeding
    if (!Storage.isStorageAvailable()) {
      alert('Speicher ist nicht verfügbar. Bitte aktivieren Sie Cookies und starten die App neu.');
      return;
    }
    
    // Save driver name with enhanced error handling
    const nameSuccess = Storage.saveDriverName(driverName);
    if (!nameSuccess) {
      alert('Fehler beim Speichern des Namens. Bitte versuchen Sie es erneut.');
      return;
    }
    
    // Save onboarding completion
    const onboardingSuccess = Storage.setOnboardingComplete(true);
    if (!onboardingSuccess) {
      console.warn('Failed to save onboarding status, but continuing');
    }
    
    // Additional diagnostic info for debugging
    console.log('Onboarding completed successfully:', {
      driverName: Storage.getDriverName(),
      onboardingComplete: Storage.isOnboardingComplete(),
      storageInfo: Storage.getStorageInfo()
    });
    
    // Hide onboarding
    const container = document.querySelector('.onboarding-container');
    if (container) {
      container.style.display = 'none';
    }
    
    // Notify completion
    if (onComplete) {
      onComplete();
    }
    
    // Show success message
    showSuccessMessage(driverName);
  }
  
  function showSuccessMessage(driverName) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #34C759;
      color: white;
      padding: 15px 20px;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(52, 199, 89, 0.3);
      z-index: 10000;
      font-weight: 500;
      animation: slideIn 0.5s ease;
    `;
    toast.textContent = `Willkommen, ${driverName}! Setup erfolgreich.`;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 3000);
  }
  
  function updateProgressDots() {
    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
      if (index <= currentStep) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
      
      // Add click handler for dots
      dot.onclick = () => {
        if (index <= currentStep) {
          showStep(index);
        }
      };
    });
  }
  
  function requestLocationPermission() {
    if (!navigator.geolocation) {
      alert('GPS wird von diesem Browser nicht unterstützt');
      nextStep();
      return;
    }

    const requestViaGeolocation = () => {
      // Must be called directly in response to the user gesture for iOS PWAs
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Location permission granted:', position.coords);
          nextStep();
        },
        (error) => {
          console.warn('Location permission error:', error);
          // 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
          if (error && error.code === 1) {
            alert('GPS-Zugriff wird empfohlen für die beste Erfahrung. Sie können es später in den Einstellungen aktivieren.');
          } else {
            console.log('GPS error, but continuing onboarding');
          }
          // Continue onboarding regardless to avoid dead-ends
          nextStep();
        },
        { 
          enableHighAccuracy: true, 
          timeout: 15000, 
          maximumAge: 300000 
        }
      );
    };

    // Enhanced permission handling for different platforms
    try {
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'geolocation' })
          .then(result => {
            console.log('Permission state:', result.state);
            if (result.state === 'granted') {
              nextStep();
            } else {
              requestViaGeolocation();
            }
          })
          .catch(err => {
            console.warn('Permissions API query failed, falling back to direct request:', err);
            requestViaGeolocation();
          });
      } else {
        console.log('Permissions API not available, using direct request');
        requestViaGeolocation();
      }
    } catch (e) {
      console.warn('Permissions API not usable, falling back:', e);
      requestViaGeolocation();
    }
  }
  
  // Debug function for troubleshooting
  function debugOnboarding() {
    const info = {
      currentStep,
      stepsCount: steps.length,
      storageAvailable: Storage.isStorageAvailable(),
      onboardingComplete: Storage.isOnboardingComplete(),
      driverName: Storage.getDriverName(),
      storageInfo: Storage.getStorageInfo()
    };
    
    console.log('Onboarding Debug Info:', info);
    return info;
  }
  
  // Reset function for troubleshooting
  function resetOnboarding() {
    if (confirm('Onboarding zurücksetzen? Dadurch werden alle Daten gelöscht.')) {
      Storage.setOnboardingComplete(false);
      Storage.saveDriverName('');
      location.reload();
    }
  }
  
  return {
    init,
    nextStep,
    complete,
    requestLocationPermission,
    debugOnboarding,
    resetOnboarding
  };
})();
