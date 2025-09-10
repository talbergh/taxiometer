// QR Code Generation Module
export const QRModule = (() => {
  
  function generateQR(data, containerId, size = 150) {
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
        correctLevel: QRCode.CorrectLevel.L // Lower error correction for smaller size
      });
      
      console.log('QR Code generated successfully');
      console.log('QR Data length:', data.length);
    } catch (error) {
      console.error('QR Code generation error:', error);
      container.innerHTML = '<p style="color: var(--danger);">QR Code generation failed</p>';
    }
  }
  
  function encodeRideData(rideData) {
    // Create highly compressed data for QR code
    const compressed = {
      i: rideData.id.slice(-8), // Only last 8 chars of ID
      n: rideData.name ? rideData.name.slice(0, 20) : '', // Max 20 chars
      d: Math.round(rideData.distance), // Round to meters
      t: Math.round(rideData.duration), // Round to seconds
      f: Math.round(rideData.fare * 100), // Store cents as integer
      dt: new Date(rideData.date || rideData.startTime).getTime(), // Timestamp
      // Skip coordinates for smaller QR code - just store start/end
      s: rideData.coordinates && rideData.coordinates.length > 0 ? 
          [Math.round(rideData.coordinates[0].lat * 10000), Math.round(rideData.coordinates[0].lng * 10000)] : null,
      e: rideData.coordinates && rideData.coordinates.length > 1 ? 
          [Math.round(rideData.coordinates[rideData.coordinates.length-1].lat * 10000), Math.round(rideData.coordinates[rideData.coordinates.length-1].lng * 10000)] : null
    };
    
    // Convert to base64 with URL-safe encoding
    try {
      const json = JSON.stringify(compressed);
      // Unicode-safe base64 encoding
      const utf8 = encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode('0x' + p1));
      return btoa(utf8).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    } catch (error) {
      console.error('Failed to encode ride data:', error);
      return null;
    }
  }
  
  function decodeRideData(encodedData) {
    try {
      // Restore padding and convert back from URL-safe base64
      let padded = encodedData.replace(/-/g, '+').replace(/_/g, '/');
      while (padded.length % 4) {
        padded += '=';
      }
      
  const bin = atob(padded);
  const json = decodeURIComponent(Array.prototype.map.call(bin, c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''));
  const compressed = JSON.parse(json);
      
      // Expand back to full format
      return {
        id: compressed.i,
        name: compressed.n,
        distance: compressed.d,
        duration: compressed.t,
        fare: compressed.f / 100, // Convert cents back to euros
        date: new Date(compressed.dt).toISOString(),
        startCoords: compressed.s ? [compressed.s[0] / 10000, compressed.s[1] / 10000] : null,
        endCoords: compressed.e ? [compressed.e[0] / 10000, compressed.e[1] / 10000] : null
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
