# Kinetic Mobile App Style Guide

## Brand Colors

### Primary Palette
```javascript
const colors = {
  // Dark Theme Base
  background: '#0a0a0f',        // Main dark background
  foreground: '#ffffff',        // White text
  card: '#1a1a1f',              // Card backgrounds
  cardForeground: '#ffffff',    // Text on cards
  
  // Brand Colors
  primary: '#9333ea',           // Purple-600 (main brand)
  primaryForeground: '#ffffff', // White on purple
  
  // Accent Colors
  accent: '#06b6d4',            // Cyan-500 (data highlights)
  destructive: '#ef4444',       // Red-500 (errors/warnings)
  
  // Grays
  gray: {
    400: '#9ca3af',             // Secondary text
    500: '#6b7280',             // Tertiary text  
    700: '#374151',             // Borders
    800: '#1f2937',             // Muted backgrounds
  },
  
  // Purple Scale
  purple: {
    300: '#c084fc',             // Light purple
    500: '#a855f7',             // Medium purple
    600: '#9333ea',             // Main purple (primary)
    700: '#7c3aed',             // Dark purple
  }
}
```

## Typography

### Font Sizes
- **Title**: 28px, weight 600, letter-spacing -0.5
- **Card Title**: 18px, weight 600
- **Body**: 16px, weight 400-500
- **Secondary**: 14px, weight 400-500
- **Caption**: 12px, weight 400
- **Data Values**: 16px, weight 600, monospace

### Text Colors
- **Primary**: `colors.foreground` (white)
- **Secondary**: `colors.gray[400]` 
- **Accent**: `colors.accent` or `colors.purple[500]`
- **Error**: `colors.destructive`

## Components

### Cards
```javascript
{
  backgroundColor: colors.card,
  padding: 20,
  borderRadius: 12,
  marginBottom: 16,
  borderWidth: 1,
  borderColor: colors.border,
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 3,
}
```

### Primary Buttons
```javascript
{
  backgroundColor: colors.primary,
  paddingVertical: 16,
  paddingHorizontal: 24,
  borderRadius: 12,
  shadowColor: colors.primary,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 4,
}
```

### Secondary Buttons
```javascript
{
  backgroundColor: 'transparent',
  paddingVertical: 16,
  paddingHorizontal: 24,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: colors.border,
}
```

### Status Indicators
```javascript
// Status Pill
{
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 16,
  paddingVertical: 8,
  backgroundColor: colors.card,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: colors.border,
  alignSelf: 'center',
}

// Status Dot
{
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: colors.accent, // or destructive/gray[500]
}
```

## Layout

### Container Spacing
- **Main padding**: 20px
- **Top padding**: 60px (account for status bar)
- **Card margins**: 16px bottom
- **Button margins**: 16px bottom

### Border Radius
- **Cards**: 12px
- **Buttons**: 12px  
- **Status pills**: 20px
- **Small elements**: 8px

### Shadows
- **Cards**: elevation 3, shadowOpacity 0.1
- **Primary buttons**: elevation 4, shadowOpacity 0.3 with brand color
- **Secondary elements**: elevation 1-2

## Data Display

### IMU Data Cards
- **Accelerometer**: Cyan accent (`colors.accent`)
- **Gyroscope**: Purple accent (`colors.purple[500]`)
- **Stale data**: Red border and text (`colors.destructive`)
- **Values**: Monospace font, centered alignment

### Device Cards
- **Header**: Flex row with device name and status dot
- **Status dot**: 6px cyan dot for available devices
- **Loading state**: 60% opacity with "Connecting..." text

## States

### Loading States
- **Opacity**: 0.6 for disabled elements
- **Text**: Show loading message in `colors.primary`
- **Buttons**: Disable interaction, show loading text

### Error States  
- **Border**: 2px `colors.destructive`
- **Text**: `colors.destructive` 
- **Icons**: ⚠️ warning emoji

### Success States
- **Accent colors**: Cyan or purple highlights
- **Status dots**: Colored indicators
- **Subtle animations**: Active opacity 0.7

## Best Practices

1. **Consistency**: Always use defined colors and spacing
2. **Accessibility**: Maintain contrast ratios for readability
3. **Touch targets**: Minimum 44px for interactive elements
4. **Visual hierarchy**: Use color and typography to guide attention
5. **Brand alignment**: Purple primary, cyan accents, dark theme
6. **Simplicity**: Minimal UI elements, focus on data display
7. **Feedback**: Clear loading and error states for all interactions

## Usage Examples

```javascript
// Good: Using defined colors
<Text style={{ color: colors.gray[400] }}>Secondary text</Text>

// Bad: Using arbitrary colors  
<Text style={{ color: '#999999' }}>Secondary text</Text>

// Good: Consistent spacing
<View style={{ marginBottom: 16 }}>

// Bad: Inconsistent spacing
<View style={{ marginBottom: 13 }}>
```