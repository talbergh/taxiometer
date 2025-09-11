// Onboarding Module
export const Onboarding = (() => {
  let currentStep = 0;
  let steps = [];
  let onComplete = null;
  
  function init(completeCallback) {
    onComplete = completeCallback;
    
    // Check if onboarding was already completed
    if (localStorage.getItem('taxi_onboarding_complete')) {
  const container = document.querySelector('.onboarding-container');
  if (container) container.style.display = 'none';
  return false; // Skip onboarding
    }
    
    steps = document.querySelectorAll('.onboarding-step');
    showStep(0);
    return true; // Show onboarding
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
    // Save driver name
    const driverName = document.getElementById('driver-name').value.trim();
    if (!driverName) {
      alert('Bitte geben Sie Ihren Namen ein.');
      return;
    }
    
    localStorage.setItem('driver_name', driverName);
    localStorage.setItem('taxi_onboarding_complete', 'true');
    document.querySelector('.onboarding-container').style.display = 'none';
    
    if (onComplete) {
      onComplete();
    }
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
      alert('Geolocation is not supported by this browser');
      nextStep();
      return;
    }

    const requestViaGeolocation = () => {
      // Must be called directly in response to the user gesture for iOS PWAs
      navigator.geolocation.getCurrentPosition(
        () => nextStep(),
        (error) => {
          console.warn('Location permission error:', error);
          // 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
          if (error && error.code === 1) {
            alert('Location access is recommended for best experience. You can enable it later in settings.');
          }
          // Continue onboarding regardless to avoid dead-ends
          nextStep();
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    };

    // Some platforms (notably iOS PWAs) don't support Permissions API or throw on query
    try {
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'geolocation' })
          .then(result => {
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
        requestViaGeolocation();
      }
    } catch (e) {
      console.warn('Permissions API not usable, falling back:', e);
      requestViaGeolocation();
    }
  }
  
  return {
    init,
    nextStep,
    complete,
    requestLocationPermission
  };
})();
