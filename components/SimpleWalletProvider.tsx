import React, { createContext, useContext, useState } from 'react';
import { Alert, Linking } from 'react-native';

// Simple wallet provider that just opens wallet apps directly
// This bypasses WalletConnect entirely for testing

interface SimpleWalletContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  error: string | null;
}

const SimpleWalletContext = createContext<SimpleWalletContextType | null>(null);

interface SimpleWalletProviderProps {
  children: React.ReactNode;
}

export function SimpleWalletProvider({ children }: SimpleWalletProviderProps) {
  const [state, setState] = useState({
    address: null as string | null,
    isConnected: false,
    isConnecting: false,
    error: null as string | null,
  });

  const connect = async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }));
      
      Alert.alert(
        'Connect Wallet',
        'Choose how you want to connect your wallet:',
        [
          {
            text: 'Open MetaMask',
            onPress: async () => {
              try {
                const canOpen = await Linking.canOpenURL('metamask://');
                if (canOpen) {
                  await Linking.openURL('metamask://');
                  
                  // Simulate connection for testing
                  setTimeout(() => {
                    Alert.prompt(
                      'Enter Wallet Address',
                      'For testing: paste your wallet address from MetaMask',
                      [
                        { text: 'Cancel', style: 'cancel', onPress: () => setState(prev => ({ ...prev, isConnecting: false })) },
                        {
                          text: 'Connect',
                          onPress: (address?: string) => {
                            if (address && address.startsWith('0x') && address.length === 42) {
                              setState(prev => ({
                                ...prev,
                                address,
                                isConnected: true,
                                isConnecting: false,
                              }));
                              Alert.alert('Success!', `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`);
                            } else {
                              Alert.alert('Invalid Address', 'Please enter a valid Ethereum address');
                              setState(prev => ({ ...prev, isConnecting: false }));
                            }
                          }
                        }
                      ],
                      'plain-text',
                      '0x...'
                    );
                  }, 1000);
                } else {
                  Alert.alert(
                    'MetaMask Not Found',
                    'MetaMask Mobile is not installed. Install it from the app store?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Install', onPress: () => Linking.openURL('https://metamask.io/download/') }
                    ]
                  );
                  setState(prev => ({ ...prev, isConnecting: false }));
                }
              } catch (error: any) {
                console.error('❌ Failed to open MetaMask:', error);
                setState(prev => ({ ...prev, isConnecting: false, error: 'Failed to open MetaMask' }));
              }
            }
          },
          {
            text: 'Manual Address Entry',
            onPress: () => {
              Alert.prompt(
                'Enter Wallet Address',
                'Enter your Ethereum wallet address for testing:',
                [
                  { text: 'Cancel', style: 'cancel', onPress: () => setState(prev => ({ ...prev, isConnecting: false })) },
                  {
                    text: 'Connect',
                    onPress: (address?: string) => {
                      if (address && address.startsWith('0x') && address.length === 42) {
                        setState(prev => ({
                          ...prev,
                          address,
                          isConnected: true,
                          isConnecting: false,
                        }));
                        Alert.alert('Success!', `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`);
                      } else {
                        Alert.alert('Invalid Address', 'Please enter a valid Ethereum address (0x...)');
                        setState(prev => ({ ...prev, isConnecting: false }));
                      }
                    }
                  }
                ],
                'plain-text',
                '0x...'
              );
            }
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setState(prev => ({ ...prev, isConnecting: false }))
          }
        ]
      );
    } catch (error: any) {
      console.error('❌ Connection failed:', error);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message || 'Connection failed',
      }));
    }
  };

  const disconnect = async (): Promise<void> => {
    setState({
      address: null,
      isConnected: false,
      isConnecting: false,
      error: null,
    });
    console.log('✅ Wallet disconnected');
  };

  const signMessage = async (message: string): Promise<string> => {
    if (!state.isConnected || !state.address) {
      throw new Error('Wallet not connected');
    }

    return new Promise((resolve, reject) => {
      Alert.alert(
        'Sign Message',
        `Sign this message in your wallet:\n\n"${message}"`,
        [
          {
            text: 'Signed',
            onPress: () => {
              // Generate a mock signature for testing
              const mockSignature = `0x${'a'.repeat(128)}1b`;
              console.log('✅ Message signed (mock):', mockSignature);
              resolve(mockSignature);
            }
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => reject(new Error('User cancelled signing'))
          }
        ]
      );
    });
  };

  const contextValue: SimpleWalletContextType = {
    address: state.address,
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    connect,
    disconnect,
    signMessage,
    error: state.error,
  };

  return (
    <SimpleWalletContext.Provider value={contextValue}>
      {children}
    </SimpleWalletContext.Provider>
  );
}

export function useSimpleWallet(): SimpleWalletContextType {
  const context = useContext(SimpleWalletContext);
  if (!context) {
    throw new Error('useSimpleWallet must be used within a SimpleWalletProvider');
  }
  return context;
}