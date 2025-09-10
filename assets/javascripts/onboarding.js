// Onboarding Module
export const Onboarding = (() => {
  let currentStep = 0;
  let steps = [];
  let onComplete = null;
  
  function init(completeCallback) {
    onComplete = completeCallback;
    
    // Check if onboarding was already completed
    if (localStorage.getItem('taxi_onboarding_complete')) {
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
    if (navigator.geolocation) {
      // For iOS Safari, we need to request permission explicitly
      if (navigator.permissions) {
        navigator.permissions.query({name: 'geolocation'}).then(result => {
          if (result.state === 'granted') {
            nextStep();
          } else {
            // Request permission
            navigator.geolocation.getCurrentPosition(
              () => nextStep(),
              (error) => {
                console.warn('Location permission error:', error);
                if (error.code === 1) {
                  alert('Location access is recommended for best experience. You can enable it later in settings.');
                }
                nextStep();
              },
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
            );
          }
        });
      } else {
        // Fallback for older browsers or iOS
        navigator.geolocation.getCurrentPosition(
          () => nextStep(),
          (error) => {
            console.warn('Location permission error:', error);
            if (error.code === 1) {
              alert('Location access is recommended for best experience. You can enable it later in settings.');
            }
            nextStep();
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
        );
      }
    } else {
      alert('Geolocation is not supported by this browser');
      nextStep();
    }
  }
  
  return {
    init,
    nextStep,
    complete,
    requestLocationPermission
  };
})();
