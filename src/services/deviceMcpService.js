/**
 * Model Context Protocol (MCP) Client & Device Integration Bridge
 * Connects the Vibe IDE web sandbox and Android Capacitor plugins to MCP tools.
 */

export const MCP_TOOLS_DEFINITIONS = [
  {
    name: 'device_vibrate',
    description: 'Trigger haptic feedback or vibration on the physical device',
    parameters: {
      type: 'object',
      properties: {
        pattern: { type: 'array', items: { type: 'number' }, description: 'Vibration pattern in ms' }
      }
    }
  },
  {
    name: 'device_battery',
    description: 'Get device battery level and charging status',
    parameters: { type: 'object', properties: {} }
  },
  {
    name: 'device_network',
    description: 'Get device online/offline status and connection details',
    parameters: { type: 'object', properties: {} }
  },
  {
    name: 'device_clipboard_read',
    description: 'Read the system clipboard text',
    parameters: { type: 'object', properties: {} }
  },
  {
    name: 'device_clipboard_write',
    description: 'Write text to the system clipboard',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to copy' }
      },
      required: ['text']
    }
  },
  {
    name: 'device_location',
    description: 'Get current GPS coordinates of the device',
    parameters: { type: 'object', properties: {} }
  }
];

export async function executeMCPTool(toolName, args = {}) {
  try {
    switch (toolName) {
      case 'device_vibrate': {
        if ('vibrate' in navigator) {
          navigator.vibrate(args.pattern || [100, 50, 100]);
          return { success: true, message: 'Haptic feedback triggered.' };
        }
        return { success: false, message: 'Vibration API not supported in this environment.' };
      }

      case 'device_battery': {
        if ('getBattery' in navigator) {
          const battery = await navigator.getBattery();
          return {
            success: true,
            level: Math.round(battery.level * 100) + '%',
            charging: battery.charging
          };
        }
        return { success: true, level: '100% (Simulated)', charging: true };
      }

      case 'device_network': {
        return {
          success: true,
          online: navigator.onLine,
          type: navigator.connection ? navigator.connection.effectiveType : '4g'
        };
      }

      case 'device_clipboard_read': {
        if (navigator.clipboard) {
          const text = await navigator.clipboard.readText();
          return { success: true, text };
        }
        return { success: false, message: 'Clipboard read permission denied.' };
      }

      case 'device_clipboard_write': {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(args.text || '');
          return { success: true, message: 'Copied to clipboard.' };
        }
        return { success: false, message: 'Clipboard API not supported.' };
      }

      case 'device_location': {
        return new Promise((resolve) => {
          if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                resolve({
                  success: true,
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                  accuracy: pos.coords.accuracy
                });
              },
              (err) => {
                resolve({ success: false, error: err.message });
              },
              { timeout: 5000 }
            );
          } else {
            resolve({ success: false, error: 'Geolocation not supported.' });
          }
        });
      }

      default:
        return { success: false, error: `Unknown MCP tool: ${toolName}` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}
