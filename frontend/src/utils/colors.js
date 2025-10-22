/**
 * Centralized Color Palette for POS Mobile
 * All colors used across the application
 */

export const colors = {
  // Primary Colors
  primary: '#DC3535',      // Red - Primary actions, alerts, delete
  accent: '#D17842',       // Orange - Accent, highlights, warnings
  
  // Background Colors
  background: {
    primary: '#0C0F14',    // Very dark - Main background
    secondary: '#252A32',  // Dark gray - Cards, panels, secondary backgrounds
    search: '#141921',     // Search component background
  },
  
  // Neutral Colors
  neutral: {
    medium: '#52555A',     // Medium gray - Borders, dividers, disabled states
    light: '#AEAEAE',      // Light gray - Secondary text, icons
  },
  
  // Base Colors
  white: '#FFFFFF',        // White - Primary text, backgrounds
  
  // Semantic Colors (aliases for better readability)
  text: {
    primary: '#FFFFFF',
    secondary: '#AEAEAE',
    disabled: '#52555A',
    placeholder: '#AEAEAE',
  },
  
  border: {
    primary: '#52555A',
    secondary: '#252A32',
  },
  
  status: {
    error: '#DC3535',
    warning: '#D17842',
  },
};

// Export individual color objects for easier imports
export const {
  primary,
  accent,
  background,
  neutral,
  white,
  text,
  border,
  status,
} = colors;

export default colors;

