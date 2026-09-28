// Apple iOS Human Interface Guidelines Design Tokens tailored for PickMi Driver
export const Colors = {
  // Apple System Blue / PickMi Primary
  primary: '#0043DC',
  primaryDark: '#0033A8',
  primaryLight: '#E6EDFC',
  primarySubtle: '#F0F4FD',
  
  // Apple System Status Colors
  success: '#34C759',       // iOS Green
  successLight: '#E8F8ED',
  successDark: '#248A3D',
  
  warning: '#FF9500',       // iOS Orange
  warningLight: '#FFF4E5',
  warningDark: '#C97500',
  
  danger: '#FF3B30',        // iOS Red
  dangerLight: '#FFEBEA',
  dangerDark: '#D70015',
  
  info: '#5856D6',          // iOS Purple
  infoLight: '#F0EFFF',
  
  // Driver Status
  online: '#34C759',
  onlineLight: '#E8F8ED',
  offline: '#8E8E93',
  offlineLight: '#F2F2F7',
  
  // Apple iOS Neutrals
  white: '#FFFFFF',
  background: '#F2F2F7',    // iOS System Grouped Background
  cardBg: '#FFFFFF',
  cardBgSolid: '#FFFFFF',
  cardBorder: 'rgba(0, 0, 0, 0.05)',
  surface: '#FFFFFF',
  border: '#E5E5EA',        // iOS Separator
  borderLight: '#F2F2F7',
  
  // iOS Typography Colors
  textPrimary: '#1C1C1E',   // iOS Label
  textSecondary: '#636366', // iOS Secondary Label
  textMuted: '#8E8E93',     // iOS Tertiary Label
  textPlaceholder: '#C7C7CC',
  textInverted: '#FFFFFF',
  
  // Accents & Overlays
  accentGold: '#FF9500',
  divider: '#E5E5EA',
  overlay: 'rgba(0, 0, 0, 0.45)',
  glassBg: 'rgba(255, 255, 255, 0.85)',
};

export const Shadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.09,
    shadowRadius: 24,
    elevation: 8,
  },
  bottomSheet: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 10,
  },
  applePuck: {
    shadowColor: '#0043DC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
};
