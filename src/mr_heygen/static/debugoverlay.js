export function debugLog(msg) {
    try {
      const overlay = document.getElementById('debug-overlay');
      //if (!overlay) return;
      console.log('Debug:', msg); // Backup console log
      const line = document.createElement('div');
      line.className = 'debug-line';
      line.textContent = `${new Date().toLocaleTimeString()}: ${msg}`;
      
      overlay.insertBefore(line, overlay.firstChild);
      
      // Keep only last 10 messages
      while (overlay.children.length > 10) {
        overlay.removeChild(overlay.lastChild);
      }
      
      // Auto-clear after 5 seconds
      setTimeout(() => line.remove(), 5000);
    } catch (e) {
      console.error("Error logging debug message:", e, msg)
    }
  }


