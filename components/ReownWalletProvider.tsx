import React, { createContext, useContext, useEffect, useState } from 'react';
import { createAppKit } from '@reown/appkit';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, sepolia, polygon, base } from '@reown/appkit/networks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { appKitConfig } from '../config/walletConfig';

// Create query client for React Query
const queryClient = new QueryClient();

// Create Wagmi adapter
const wagmiAdapter = new WagmiAdapter({
  networks: [mainnet, sepolia, polygon, base],
  projectId: appKitConfig.projectId,
});

// Create AppKit instance
const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks: [mainnet, sepolia, polygon, base],
  projectId: appKitConfig.projectId,
  metadata: appKitConfig.metadata,
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
});

// Reown wallet context interface
interface ReownWalletContextType {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  error: string | null;
}

// Create context
const ReownWalletContext = createContext<ReownWalletContextType | null>(null);

interface ReownWalletProviderProps {
  children: React.ReactNode;
}

export function ReownWalletProvider({ children }: ReownWalletProviderProps) {
  const [state, setState] = useState({
    address: null as string | null,
    chainId: null as number | null,
    isConnected: false,
    isConnecting: false,
    error: null as string | null,
  });

  // Initialize AppKit and set up listeners
  useEffect(() => {
    console.log('🔧 Initializing Reown AppKit...');

    // Subscribe to account changes
    const unsubscribeAccount = appKit.subscribeAccount((account) => {
      console.log('👤 Account changed:', account);
      setState(prev => ({
        ...prev,
        address: account.address || null,
        isConnected: account.isConnected || false,
        chainId: account.chainId || null,
      }));
    });

    // Subscribe to connection state
    const unsubscribeState = appKit.subscribeState((appState) => {
      console.log('🔗 AppKit state changed:', appState);
      setState(prev => ({
        ...prev,
        isConnecting: appState.loading || false,
      }));
    });

    console.log('✅ Reown AppKit initialized successfully');

    // Cleanup on unmount
    return () => {
      unsubscribeAccount();
      unsubscribeState();
    };
  }, []);

  const connect = async (): Promise<void> => {
    try {
      console.log('🔗 Opening Reown AppKit modal...');
      setState(prev => ({ ...prev, isConnecting: true, error: null }));
      
      // Open the AppKit modal for wallet selection
      appKit.open();
      
      console.log('✅ AppKit modal opened successfully');
    } catch (error: any) {
      console.error('❌ Failed to open AppKit modal:', error);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message || 'Failed to connect wallet',
      }));
    }
  };

  const disconnect = async (): Promise<void> => {
    try {
      console.log('🔌 Disconnecting wallet...');
      await appKit.disconnect();
      
      setState(prev => ({
        ...prev,
        address: null,
        chainId: null,
        isConnected: false,
        error: null,
      }));
      
      console.log('✅ Wallet disconnected successfully');
    } catch (error: any) {
      console.error('❌ Failed to disconnect wallet:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to disconnect wallet',
      }));
    }
  };

  const signMessage = async (message: string): Promise<string> => {
    if (!state.isConnected || !state.address) {
      throw new Error('Wallet not connected');
    }

    try {
      console.log('✍️ Signing message with Reown AppKit:', message);
      
      // Use AppKit's signing functionality
      const signature = await wagmiAdapter.signMessage({
        message,
        account: state.address as `0x${string}`,
      });
      
      console.log('✅ Message signed successfully');
      return signature;
    } catch (error: any) {
      console.error('❌ Failed to sign message:', error);
      throw error;
    }
  };

  const contextValue: ReownWalletContextType = {
    address: state.address,
    chainId: state.chainId,
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    connect,
    disconnect,
    signMessage,
    error: state.error,
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ReownWalletContext.Provider value={contextValue}>
        {children}
      </ReownWalletContext.Provider>
    </QueryClientProvider>
  );
}

// Custom hook to use Reown wallet
export function useReownWallet(): ReownWalletContextType {
  const context = useContext(ReownWalletContext);
  if (!context) {
    throw new Error('useReownWallet must be used within a ReownWalletProvider');
  }
  return context;
}