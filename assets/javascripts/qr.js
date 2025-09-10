// QR Code Generation Module
export const QRModule = (() => {
  
  function generateQR(data, containerId, size = 200) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('QR container not found:', containerId);
      return;
    }
    
    // Clear previous QR code
    container.innerHTML = '';
    
    // Check if QRCode library is available
    if (typeof QRCode === 'undefined') {
      console.error('QRCode library not loaded');
      container.innerHTML = '<p style="color: var(--danger);">QR Code library not available</p>';
      return;
    }
    
    // Generate QR code using qrcode.js library
    try {
      QRCode.toCanvas(data, {
        width: size,
        margin: 2,
        color: {
          dark: '#18181b',
          light: '#ffffff'
        }
      }, (err, canvas) => {
        if (err) {
          console.error('QR Code generation failed:', err);
          container.innerHTML = '<p style="color: var(--danger);">QR Code generation failed</p>';
          return;
        }
        
        container.appendChild(canvas);
      });
    } catch (error) {
      console.error('QR Code generation error:', error);
      container.innerHTML = '<p style="color: var(--danger);">QR Code generation failed</p>';
    }
  }
  
  function encodeRideData(rideData) {
    // Create compressed data for QR code
    const compressed = {
      id: rideData.id,
      n: rideData.name || '',
      d: rideData.distance,
      t: rideData.duration,
      f: rideData.fare,
      dt: rideData.date || rideData.startTime,
      c: rideData.coordinates || []
    };
    
    // Convert to base64
    try {
      const json = JSON.stringify(compressed);
      return btoa(encodeURIComponent(json));
    } catch (error) {
      console.error('Failed to encode ride data:', error);
      return null;
    }
  }
  
  function decodeRideData(encodedData) {
    try {
      const json = decodeURIComponent(atob(encodedData));
      const compressed = JSON.parse(json);
      
      // Expand back to full format
      return {
        id: compressed.id,
        name: compressed.n,
        distance: compressed.d,
        duration: compressed.t,
        fare: compressed.f,
        date: compressed.dt,
        coordinates: compressed.c || []
      };
    } catch (error) {
      console.error('Failed to decode ride data:', error);
      return null;
    }
  }
  
  return {
    generateQR,
    encodeRideData,
    decodeRideData
  };
})();
