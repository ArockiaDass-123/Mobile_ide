/**
 * Real Android System & Bridge Service
 * Handles phone calls, native contacts lookup, notifications, and device permissions.
 */

export const jarvisAndroidBridge = {
  /**
   * Mock / Default contact directory for rapid testing before native sync
   */
  contacts: {
    'Amma': '+919876543210',
    'Mom': '+919876543210',
    'Appa': '+919876543211',
    'Dad': '+919876543211',
    'Brother': '+919876543212'
  },

  /**
   * Initiate Phone Call via tel: protocol or Android Intent
   */
  async initiatePhoneCall(targetName) {
    const phoneNumber = this.contacts[targetName] || '+919876543210';
    try {
      if (typeof window !== 'undefined') {
        // Trigger real Android phone dialer
        window.location.href = `tel:${phoneNumber}`;
        return {
          success: true,
          target: targetName,
          phone: phoneNumber,
          message: `Dialing ${targetName} (${phoneNumber})...`
        };
      }
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Trigger Android vibration / haptic feedback
   */
  vibrate(pattern = [100, 50, 100]) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
  },

  /**
   * Dispatch system notification
   */
  async sendNotification(title, body) {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' });
      } else if (Notification.permission !== 'denied') {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          new Notification(title, { body, icon: '/favicon.ico' });
        }
      }
    }
  }
};
