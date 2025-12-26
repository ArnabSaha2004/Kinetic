import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PrivyProvider } from '@privy-io/expo';
import { PrivyElements } from '@privy-io/expo/ui';
import Constants from 'expo-constants';
import { defineChain } from 'viem';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

// Define Mantle Mainnet
const mantleMainnet = defineChain({
  id: 5000,
  name: 'Mantle',
  network: 'mantle',
  nativeCurrency: {
    decimals: 18,
    name: 'Mantle',
    symbol: 'MNT'
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.mantle.xyz']
    },
    public: {
      http: ['https://rpc.mantle.xyz']
    }
  },
  blockExplorers: {
    default: {
      name: 'Mantle Explorer',
      url: 'https://mantlescan.xyz'
    }
  }
});

// Define Mantle Sepolia testnet
const mantleSepolia = defineChain({
  id: 5003,
  name: 'Mantle Sepolia',
  network: 'mantle-sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Mantle',
    symbol: 'MNT'
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.sepolia.mantle.xyz']
    },
    public: {
      http: ['https://rpc.sepolia.mantle.xyz']
    }
  },
  blockExplorers: {
    default: {
      name: 'Mantle Sepolia Explorer',
      url: 'https://sepolia.mantlescan.xyz'
    }
  },
  testnet: true
});

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <PrivyProvider
      appId={Constants.expoConfig?.extra?.privyAppId}
      clientId={Constants.expoConfig?.extra?.privyClientId}
      supportedChains={[mantleSepolia]}
      config={{
        appearance: {
          theme: '#9333ea', // Use our brand purple as custom theme color
          landingHeader: 'Connect to Kinetic', // Custom header text
          loginMessage: 'Sign in to access your IMU data and wallet', // Custom message
          showWalletLoginFirst: false, // Show email/Google first, then wallet options
          // Custom logo - replace with your hosted logo URL (180x90px PNG recommended)
          // logo: 'https://your-domain.com/kinetic-logo.png',
        },
        // Customize login methods order - email and Google first
        loginMethods: ['email', 'google'],
        // Enable embedded wallets for seamless UX
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
      <PrivyElements />
    </PrivyProvider>
  );
}
