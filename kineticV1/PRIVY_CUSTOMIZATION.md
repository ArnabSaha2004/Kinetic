# Privy UI Customization

This document explains the Privy UI customizations applied to match the Kinetic app's branding and design system.

## Applied Customizations

### Theme Configuration
- **Custom Theme Color**: `#9333ea` (Brand purple from STYLE.md)
- **Auto-generated Palette**: Privy automatically generates a cohesive color palette based on our brand purple
- **Dark Theme Compatibility**: Colors are optimized for dark backgrounds

### Login Experience
- **Landing Header**: "Connect to Kinetic"
- **Login Message**: "Sign in to access your IMU data and wallet"
- **Login Methods**: Email and Google (web2 first, then wallet options)
- **Wallet Creation**: Automatic embedded wallet creation for users without wallets

### Branding
- **App Name**: Set in Privy Dashboard (should be "Kinetic")
- **Logo**: Ready to add when hosted (recommended: 180x90px PNG)
- **Consistent Messaging**: Matches app's IMU and wallet focus

## Configuration Location

The Privy configuration is in `app/_layout.tsx`:

```typescript
<PrivyProvider
  appId={Constants.expoConfig?.extra?.privyAppId}
  clientId={Constants.expoConfig?.extra?.privyClientId}
  supportedChains={[mantleSepolia]}
  config={{
    appearance: {
      theme: '#9333ea', // Brand purple
      landingHeader: 'Connect to Kinetic',
      loginMessage: 'Sign in to access your IMU data and wallet',
      showWalletLoginFirst: false,
    },
    loginMethods: ['email', 'google'],
    embeddedWallets: {
      createOnLogin: 'users-without-wallets',
    },
  }}
>
```

## Dashboard Configuration

Additional customizations can be made in the Privy Dashboard:

1. **App Name**: Set to "Kinetic" in the UI Components → Branding tab
2. **Logo**: Upload a 180x90px PNG logo in the UI Components → Branding tab
3. **Email Templates**: Customize with Kinetic branding and messaging

## Color Palette

The custom theme generates colors based on our brand purple (`#9333ea`):
- **Primary**: `#9333ea` (Purple-600)
- **Background**: Auto-generated dark variations
- **Text**: Auto-generated light variations for contrast
- **Accents**: Auto-generated complementary colors

## User Experience

- **Seamless Flow**: Email/Google login → automatic wallet creation
- **Brand Consistency**: Purple theme matches app's dark theme
- **Clear Messaging**: Users understand they're connecting to Kinetic for IMU data and wallet access
- **Mobile Optimized**: Configuration works perfectly on React Native

## Future Enhancements

1. **Custom Logo**: Host logo and add URL to `appearance.logo`
2. **CSS Overrides**: For web builds, add custom CSS variables
3. **Email Customization**: Brand the login code emails in Privy Dashboard
4. **Social Logins**: Add more social providers if needed

## Testing

Test the login flow to ensure:
- [ ] Purple theme appears correctly
- [ ] Custom header and message display
- [ ] Email and Google login work
- [ ] Embedded wallets are created automatically
- [ ] UI matches app's dark theme