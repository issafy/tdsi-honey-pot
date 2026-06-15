/**
 * Check if WebGL is available in the current browser.
 * Returns { supported: boolean, reason: string }
 */
export function checkWebGL() {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');

    if (!gl) {
      return {
        supported: false,
        reason: 'WebGL API not available — browser may have it disabled or running in a sandboxed environment (Docker/Virtual Machine without GPU passthrough).',
      };
    }

    return { supported: true, reason: '' };
  } catch (e) {
    return {
      supported: false,
      reason: `WebGL check threw: ${e.message}`,
    };
  }
}
