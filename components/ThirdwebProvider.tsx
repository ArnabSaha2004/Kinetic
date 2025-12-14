import React from 'react';
import { Alert } from 'react-native';
import { 
  useActiveAccount, 
  useActiveWallet, 
  useConnect, 
  useDisconnect,
  useSendAndConfirmTransaction 
} from 'thirdweb/react';
// Import only MetaMask and In-App wallet to avoid Coinbase SDK dependency
import { inAppWallet } from 'thirdweb/wallets/in-app';
import { client, chain } from '../constants/thirdweb';
import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage keys for session persistence
const STORAGE_KEYS = {
  WALLET_SESSION: '@kinetic_wallet_session',
  WALLET_ADDRESS: '@kinetic_wallet_address',
  WALLET_CHAIN_ID: '@kinetic_wallet_chain_id',
  WALLET_CONNECTED: '@kinetic_wallet_connected',
} as const;

// Wallet configurations - only in-app wallet to avoid external SDK dependencies
export const wallets = [
  inAppWallet({
    auth: {
      options: [
        "google",
        "email",
        "phone",
        "passkey",
      ],
      passkeyDomain: "thirdweb.com",
    },
    smartAccount: {
      chain: chain,
      sponsorGas: true,
    },
  }),
];

// Custom hook for wallet functionality with session persistence
export function useKineticWallet() {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { connect, isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const sendTransaction = useSendAndConfirmTransaction();

  // Session persistence functions
  const saveSessionToStorage = async (address: string, chainId: number, isConnected: boolean) => {
    try {
      console.log('💾 Saving wallet session to AsyncStorage...', {
        address: address.slice(0, 10) + '...',
        chainId,
        isConnected
      });
      
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, address),
        AsyncStorage.setItem(STORAGE_KEYS.WALLET_CHAIN_ID, chainId.toString()),
        AsyncStorage.setItem(STORAGE_KEYS.WALLET_CONNECTED, isConnected.toString()),
        AsyncStorage.setItem(STORAGE_KEYS.WALLET_SESSION, new Date().toISOString())
      ]);
      
      console.log('✅ Wallet session saved to AsyncStorage successfully');
    } catch (error: any) {
      console.error('❌ Failed to save wallet session to AsyncStorage:', error?.message || error);
    }
  };

  const clearSessionFromStorage = async () => {
    try {
      console.log('🧹 Clearing wallet session from AsyncStorage...');
      
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.WALLET_ADDRESS),
        AsyncStorage.removeItem(STORAGE_KEYS.WALLET_CHAIN_ID),
        AsyncStorage.removeItem(STORAGE_KEYS.WALLET_CONNECTED),
        AsyncStorage.removeItem(STORAGE_KEYS.WALLET_SESSION)
      ]);
      
      console.log('✅ Wallet session cleared from AsyncStorage');
    } catch (error: any) {
      console.error('❌ Failed to clear session from AsyncStorage:', error?.message || error);
    }
  };

  // Connect with Email (In-App Wallet)
  const connectWithEmail = async () => {
    try {
      console.log('📧 Connecting with Email...');
      
      await connect(async () => {
        const w = inAppWallet({
          smartAccount: {
            chain,
            sponsorGas: true,
          },
        });
        await w.connect({
          client,
          strategy: "email",
        });
        return w;
      });
      
      console.log('✅ Email connection successful');
    } catch (error: any) {
      console.error('❌ Email connection failed:', error);
      Alert.alert('Connection Failed', `Failed to connect with Email: ${error.message || 'Unknown error'}`);
      throw error;
    }
  };

  // Connect with Google (In-App Wallet)
  const connectWithGoogle = async () => {
    try {
      console.log('🔗 Connecting with Google...');
      
      await connect(async () => {
        const w = inAppWallet({
          smartAccount: {
            chain,
            sponsorGas: true,
          },
        });
        await w.connect({
          client,
          strategy: "google",
        });
        return w;
      });
      
      console.log('✅ Google connection successful');
    } catch (error: any) {
      console.error('❌ Google connection failed:', error);
      Alert.alert('Connection Failed', `Failed to connect with Google: ${error.message || 'Unknown error'}`);
      throw error;
    }
  };

  // Disconnect wallet
  const disconnectWallet = async () => {
    try {
      console.log('🔌 Disconnecting wallet...');
      
      if (wallet) {
        await disconnect(wallet);
      }
      
      // Clear session from AsyncStorage
      await clearSessionFromStorage();
      
      console.log('✅ Wallet disconnected successfully');
    } catch (error: any) {
      console.error('❌ Error disconnecting wallet:', error?.message || error);
    }
  };

  // Send transaction with proper error handling
  const sendTransactionSafe = async (transaction: any): Promise<string> => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    try {
      console.log('📤 Sending transaction with Thirdweb v5...', transaction);
      
      const result = await sendTransaction.mutateAsync(transaction);
      
      console.log('✅ Transaction sent successfully:', result.transactionHash);
      return result.transactionHash;
      
    } catch (error: any) {
      console.error('❌ Transaction failed:', error);
      
      if (error.message?.includes('User rejected') || error.code === 4001) {
        throw new Error('Transaction was cancelled by user');
      }
      
      if (error.message?.includes('insufficient funds')) {
        throw new Error('Insufficient funds for transaction. Please add IP tokens to your wallet.');
      }
      
      throw new Error(`Transaction failed: ${error.message || 'Unknown error'}`);
    }
  };

  // Sign message
  const signMessage = async (message: string): Promise<string> => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    try {
      console.log('✍️ Signing message with Thirdweb v5...', message);
      
      const signature = await account.signMessage({ message });
      
      console.log('✅ Message signed successfully');
      return signature;
      
    } catch (error: any) {
      console.error('❌ Failed to sign message:', error);
      
      if (error.message?.includes('User rejected') || error.code === 4001) {
        throw new Error('User cancelled signing');
      }
      
      throw new Error(`Signing failed: ${error.message || 'Unknown error'}`);
    }
  };

  // Save session when account changes
  React.useEffect(() => {
    if (account && wallet) {
      console.log('💾 Account connected, saving session...', {
        address: account.address.slice(0, 10) + '...',
        chainId: chain.id
      });
      
      saveSessionToStorage(account.address, chain.id, true);
    }
  }, [account, wallet]);

  return {
    // State
    address: account?.address || null,
    chainId: chain.id,
    isConnected: !!account,
    isConnecting,
    wallet,
    error: null,
    
    // Actions
    connect: connectWithEmail,
    connectWithGoogle,
    disconnect: disconnectWallet,
    sendTransaction: sendTransactionSafe,
    signMessage,
    
    // Utility
    canSignTransactions: () => !!account,
  };
}