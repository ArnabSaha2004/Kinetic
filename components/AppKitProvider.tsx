import React, { useEffect, useState, createContext, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { createAppKit } from '@reown/appkit';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import { appKitConfig, validateAppKitConfig } from '../config/walletConfig';

// Error boundary component for AppKit initialization errors
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class AppKitErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ AppKit Error Boundary caught error:', error);
    console.error('Error info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Wallet Connection Error</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'Failed to initialize wallet connection'}
          </Text>
          <Text style={styles.errorDetails}>
            Please check your network connection and try again.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

// AppKit provider wrapper interface
interface WalletProviderProps {
  children: React.ReactNode;
}

// Wallet context interface
interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
}

// Wallet provider state
interface WalletProviderState {
  isInitialized: boolean;
  error: string | null;
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  retryCount: number;
}

// Create wallet context
const WalletContext = createContext<WalletContextType | null>(null);

// Error types for better error handling
enum WalletErrorType {
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

interface WalletError {
  type: WalletErrorType;
  message: string;
  originalError?: Error;
  retryable: boolean;
}

// Reown AppKit configuration
const queryClient = new QueryClient();

// Configure Wagmi adapter for Reown AppKit
const wagmiAdapter = new WagmiAdapter({
  networks: appKitConfig.networks,
  projectId: appKitConfig.projectId,
});

// Create Reown AppKit instance
const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks: appKitConfig.networks,
  projectId: appKitConfig.projectId,
  metadata: appKitConfig.metadata,
  features: {
    analytics: false,
  },
});

// Inner component that uses Wagmi hooks
function WalletProviderInner({ children }: WalletProviderProps) {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  const [state, setState] = useState<WalletProviderState>({
    isInitialized: true, // Web3Modal initializes immediately
    error: null,
    address: address || null,
    isConnected: isConnected,
    isConnecting: isPending,
    retryCount: 0,
  });

  // Update state when Wagmi state changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      address: address || null,
      isConnected: isConnected,
      isConnecting: isPending,
    }));
  }, [address, isConnected, isPending]);

  // Enhanced error classification function
  const classifyError = (error: any): WalletError => {
    const errorMessage = error?.message || 'Unknown error occurred';
    
    // Network-related errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('timeout')) {
      return {
        type: WalletErrorType.NETWORK_ERROR,
        message: 'Network connection failed. Please check your internet connection and try again.',
        originalError: error,
        retryable: true
      };
    }
    
    // Configuration errors
    if (errorMessage.includes('project') || errorMessage.includes('config') || errorMessage.includes('invalid')) {
      return {
        type: WalletErrorType.CONFIGURATION_ERROR,
        message: 'Wallet configuration error. Please check your project settings.',
        originalError: error,
        retryable: false
      };
    }
    
    // Initialization errors
    if (errorMessage.includes('initialize') || errorMessage.includes('setup') || errorMessage.includes('adapter')) {
      return {
        type: WalletErrorType.INITIALIZATION_FAILED,
        message: 'Failed to initialize wallet connection. Please restart the app.',
        originalError: error,
        retryable: true
      };
    }
    
    // Default to unknown error
    return {
      type: WalletErrorType.UNKNOWN_ERROR,
      message: `Wallet setup failed: ${errorMessage}`,
      originalError: error,
      retryable: true
    };
  };

  // Retry initialization function
  const retryInitialization = () => {
    setState(prev => ({
      ...prev,
      error: null,
      retryCount: prev.retryCount + 1
    }));
  };

  // Real Reown AppKit wallet functions
  const connectWallet = async (): Promise<void> => {
    try {
      console.log('🔗 Opening Reown AppKit modal...');
      
      // Open the AppKit modal
      modal.open();
      console.log('✅ AppKit modal opened');
    } catch (error: any) {
      console.error('❌ Failed to open AppKit modal:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to connect wallet',
      }));
    }
  };

  const disconnectWallet = async (): Promise<void> => {
    try {
      console.log('🔌 Disconnecting wallet...');
      await disconnect();
      console.log('✅ Wallet disconnected successfully');
    } catch (error: any) {
      console.error('❌ Failed to disconnect wallet:', error);
    }
  };

  const signMessage = async (message: string): Promise<string> => {
    if (!state.isConnected || !state.address) {
      throw new Error('Wallet not connected');
    }
    
    try {
      console.log('✍️ Signing message via Reown AppKit:', message);
      
      const signature = await signMessageAsync({
        message: message,
      });
      
      console.log('✅ Message signed successfully via Reown AppKit');
      return signature;
    } catch (error: any) {
      console.error('❌ Failed to sign message via Reown AppKit:', error);
      throw error;
    }
  };

  // Log platform info on mount
  useEffect(() => {
    console.log('✅ Web3Modal initialized successfully');
    console.log('📱 Platform:', Platform.OS, Platform.Version);
  }, []);

  // Create wallet context value using Web3Modal state
  const walletContextValue: WalletContextType = {
    address: state.address,
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    connect: connectWallet,
    disconnect: disconnectWallet,
    signMessage,
  };

  // Render the app with wallet context
  return (
    <WalletContext.Provider value={walletContextValue}>
      {children}
    </WalletContext.Provider>
  );
}

// Main WalletProvider that wraps everything with Wagmi and QueryClient
export function WalletProvider({ children }: WalletProviderProps) {
  return (
    <AppKitErrorBoundary>
      <WagmiProvider config={wagmiAdapter.wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <WalletProviderInner>
            {children}
          </WalletProviderInner>
        </QueryClientProvider>
      </WagmiProvider>
    </AppKitErrorBoundary>
  );
}

// Custom hook to use wallet context
export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

// Styles for error and loading states
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0f',
    padding: 20,
  },
  loadingText: {
    color: '#9333ea',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingSubtext: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0f',
    padding: 20,
  },
  errorTitle: {
    color: '#ef4444',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorDetails: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  errorHint: {
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  retryButton: {
    backgroundColor: '#9333ea',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});