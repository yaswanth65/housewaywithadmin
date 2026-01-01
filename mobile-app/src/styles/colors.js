/**
 * GLOBAL COLOR PALETTE - Houseway App
 * White Theme with Gold Accents - Premium home design
 * 
 * Usage: import { COLORS } from '../styles/colors';
 */

// Premium White Theme with Gold Accents
export const COLORS = {
    // Primary - Dark Gold (brand color)
    primary: '#D4AF37',           // Dark Golden Rod
    primaryDark: '#8B6914',       // Darker gold
    primaryLight: '#D4A84B',      // Lighter gold
    primaryMuted: 'rgba(184, 134, 11, 0.15)',  // Very light gold for backgrounds

    // Secondary - Warm Neutrals
    secondary: '#8B7355',         // Warm brown
    secondaryDark: '#6B5A45',     // Dark brown
    secondaryLight: '#A89178',    // Light brown

    // Background colors - Clean White
    background: '#FFFFFF',        // Clean white background
    backgroundSecondary: '#FFFFFF', // White
    backgroundTertiary: '#FAFAFA', // Very light gray
    backgroundLight: '#FFFFFF',   // Light background for gradients
    surface: '#FFFFFF',           // Cards and surfaces
    card: '#FFFFFF',              // Card backgrounds
    overlay: 'rgba(0, 0, 0, 0.5)', // Modal overlays

    // Decorative Circle Colors (for background decorations)
    circleLight: 'rgba(184, 134, 11, 0.08)',   // Very light gold circle
    circleMedium: 'rgba(184, 134, 11, 0.15)',  // Medium gold circle
    circleDark: 'rgba(184, 134, 11, 0.2)',     // Darker gold circle
    circleGradient: ['rgba(184, 134, 11, 0.1)', 'rgba(212, 168, 75, 0.08)'], // Circle gradient

    // Backward compatibility aliases
    cardBg: '#FFFFFF',            // Alias for card
    cardBorder: 'rgba(184, 134, 11, 0.1)', // Light gold border

    // Text colors
    text: '#1A1A1A',              // Primary text - near black
    textSecondary: '#4A4A4A',     // Secondary text
    textTertiary: '#666666',      // Tertiary text
    textMuted: '#999999',         // Muted/placeholder text
    textLight: '#FFFFFF',         // White text for dark backgrounds
    textBrand: '#D4AF37',         // Gold brand text

    // Status colors - Modern palette
    success: '#22C55E',           // Green for success
    successLight: '#DCFCE7',      // Light green background
    warning: '#F59E0B',           // Amber for warnings
    warningLight: '#FEF3C7',      // Light amber background
    error: '#EF4444',             // Red for errors
    errorLight: '#FEE2E2',        // Light red background
    info: '#3B82F6',              // Blue for info
    infoLight: '#DBEAFE',         // Light blue background

    // Backward compatibility for status
    danger: '#EF4444',            // Alias for error

    // Tab colors
    activeTab: '#D4AF37',         // Active tab color (gold)
    pastTab: '#666666',           // Inactive/past tab color

    // Neutral colors
    gray100: '#F5F5F5',
    gray200: '#EEEEEE',
    gray300: '#E0E0E0',
    gray400: '#BDBDBD',
    gray500: '#9E9E9E',
    gray600: '#757575',
    gray700: '#616161',
    gray800: '#424242',
    gray900: '#212121',

    // Input field colors
    inputBg: '#FAFAFA',           // Input background
    inputBorder: 'rgba(184, 134, 11, 0.15)', // Input border

    // Additional text aliases
    textDim: '#999999',           // Alias for textMuted

    // Border colors
    border: 'rgba(229, 163, 59, 0.2)',        // Light golden border
    borderLight: 'rgba(0, 0, 0, 0.08)',       // Very subtle border
    borderMedium: 'rgba(0, 0, 0, 0.12)',      // Medium border
    borderDark: 'rgba(0, 0, 0, 0.2)',         // Dark border
    borderPrimary: '#E5A33B',                 // Golden border
    borderFocus: '#C88A2E',                   // Focused input border

    // Special colors
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',

    // Gradient support (use with LinearGradient)
    gradientPrimary: ['#E5A33B', '#C88A2E'],
    gradientSecondary: ['#F2C36B', '#E5A33B'],
};

// Complete theme object for more structured usage
export const theme = {
    colors: COLORS,

    // Typography
    fonts: {
        regular: 'System',
        medium: 'System',
        bold: 'System',
    },

    fontSizes: {
        xs: 10,
        sm: 12,
        md: 14,
        lg: 16,
        xl: 18,
        xxl: 20,
        xxxl: 24,
        display: 28,
        displayLg: 32,
    },

    // Spacing
    spacing: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
        xxl: 24,
        xxxl: 32,
        xxxxl: 40,
    },

    // Border Radius
    borderRadius: {
        sm: 4,
        md: 8,
        lg: 12,
        xl: 16,
        xxl: 20,
        full: 9999,
    },

    // Shadows (React Native style)
    shadows: {
        sm: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
        },
        md: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 4,
        },
        lg: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 8,
        },
    },
};

export default COLORS;
