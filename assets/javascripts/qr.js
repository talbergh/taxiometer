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
    
    // Generate QR code using local qrcode.js library
    try {
      const qr = new QRCode(container, {
        text: data,
        width: size,
        height: size,
        colorDark: '#18181b',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
      
      console.log('QR Code generated successfully');
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
