import { QACopilotPreferences, CopilotDisplayState, CopilotAutoCollapse } from '../types';

export const DEFAULT_COPILOT_PREFERENCES: QACopilotPreferences = {
  showButton: true,
  state: 'minimized',
  position: { x: -1, y: -1 }, // -1 means default bottom-right calculation
  autoCollapse: '5m',
  edgeSnapping: true,
  smartDimming: true,
};

export function getPreferencesKey(userId?: string): string {
  return `qasgard_copilot_prefs_${userId || 'usr-1'}`;
}

export function loadCopilotPreferences(userId?: string): QACopilotPreferences {
  if (typeof window === 'undefined') return DEFAULT_COPILOT_PREFERENCES;
  try {
    const raw = localStorage.getItem(getPreferencesKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_COPILOT_PREFERENCES,
        ...parsed,
      };
    }
  } catch (e) {
    console.warn('Failed to load QA Copilot preferences from localStorage', e);
  }
  return DEFAULT_COPILOT_PREFERENCES;
}

export function saveCopilotPreferences(prefs: QACopilotPreferences, userId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getPreferencesKey(userId), JSON.stringify(prefs));
  } catch (e) {
    console.warn('Failed to save QA Copilot preferences to localStorage', e);
  }
}

/**
 * Clamps coordinates within viewport margins and snaps to screen edges if within threshold.
 * Prevents dragging outside the visible viewport on desktop and mobile.
 */
export function clampAndSnapPosition(
  pos: { x: number; y: number },
  width = 160,
  height = 48,
  snapToEdge = true,
  margin = 16
): { x: number; y: number } {
  if (typeof window === 'undefined') return pos;

  const screenW = window.innerWidth;
  const screenH = window.innerHeight;

  const isMobile = screenW < 640;
  // Ensure we avoid top fixed navbar (56px) and mobile bottom bar/gestures (70px on mobile)
  const topMargin = isMobile ? 64 : 58;
  const bottomMargin = isMobile ? 74 : 24;

  // Strict viewport clamping so the widget can never escape visible bounds
  let x = Math.max(margin, Math.min(pos.x, screenW - width - margin));
  let y = Math.max(topMargin, Math.min(pos.y, screenH - height - bottomMargin));

  if (snapToEdge) {
    const snapThreshold = 100;
    // Snap to left edge if near
    if (x <= margin + snapThreshold) {
      x = margin;
    }
    // Snap to right edge if near
    else if (x >= screenW - width - margin - snapThreshold) {
      x = screenW - width - margin;
    }
  }

  return { x, y };
}
