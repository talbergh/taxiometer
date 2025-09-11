// Routing and Navigation Module
export const Router = (() => {
  let currentScreen = 'home';
  let screens = {};
  
  function init() {
    // Get all screens
    document.querySelectorAll('.screen').forEach(screen => {
      screens[screen.id] = screen;
    });
    
    // Set up navigation listeners
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const screen = item.getAttribute('data-screen');
        if (screen) {
          navigateTo(screen);
        }
      });
    });
    
    // Show initial screen
    navigateTo('home');
  }
  
  function navigateTo(screenId) {
    // Hide all screens
    Object.values(screens).forEach(screen => {
      screen.classList.remove('active');
    });
    
    // Show target screen
    if (screens[screenId]) {
      screens[screenId].classList.add('active');
      currentScreen = screenId;
      
      // Update navigation
      document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-screen') === screenId) {
          item.classList.add('active');
        }
      });
      
      // Trigger screen-specific logic
      if (screenId === 'home' && window.app) {
        window.app.initHomeScreen();
      } else if (screenId === 'history' && window.app) {
        window.app.loadHistory();
      }
    }
  }
  
  function getCurrentScreen() {
    return currentScreen;
  }
  
  return { init, navigateTo, getCurrentScreen };
})();
