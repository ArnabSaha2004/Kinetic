import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRealWallet, WalletType } from './WalletConnectProvider';

interface WalletSelectorProps {
  onWalletSelected?: (walletType: WalletType) => void;
  style?: any;
}

// Wallet display information
const WALLET_INFO = {
  [WalletType.METAMASK]: {
    name: 'MetaMask',
    description: 'Connect with MetaMask Mobile',
    icon: '🦊',
    color: '#f6851b',
  },
  [WalletType.TRUST_WALLET]: {
    name: 'Trust Wallet',
    description: 'Connect with Trust Wallet',
    icon: '🛡️',
    color: '#3375bb',
  },
  [WalletType.COINBASE]: {
    name: 'Coinbase Wallet',
    description: 'Connect with Coinbase Wallet',
    icon: '🔵',
    color: '#0052ff',
  },
  [WalletType.RAINBOW]: {
    name: 'Rainbow',
    description: 'Connect with Rainbow Wallet',
    icon: '🌈',
    color: '#ff6b6b',
  },
  [WalletType.WALLETCONNECT]: {
    name: 'WalletConnect',
    description: 'Connect with any WalletConnect wallet',
    icon: '🔗',
    color: '#3b99fc',
  },
};

export function WalletSelector({ onWalletSelected, style }: WalletSelectorProps) {
  const { connect, isConnecting, error, getAvailableWallets } = useRealWallet();
  const [availableWallets, setAvailableWallets] = useState<WalletType[]>([]);
  const [loading, setLoading] = useState(true);

  // Load available wallets on mount
  useEffect(() => {
    loadAvailableWallets();
  }, []);

  const loadAvailableWallets = async () => {
    try {
      setLoading(true);
      const wallets = await getAvailableWallets();
      setAvailableWallets(wallets);
    } catch (error) {
      console.error('❌ Error loading available wallets:', error);
      // Fallback to showing all wallet types
      setAvailableWallets([
        WalletType.METAMASK,
        WalletType.TRUST_WALLET,
        WalletType.COINBASE,
        WalletType.RAINBOW,
        WalletType.WALLETCONNECT,
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleWalletPress = async (walletType: WalletType) => {
    try {
      // Notify parent component
      onWalletSelected?.(walletType);
      
      // Attempt connection
      await connect(walletType);
    } catch (error: any) {
      console.error('❌ Wallet connection error:', error);
      
      Alert.alert(
        'Connection Failed',
        error.message || 'Failed to connect to wallet. Please try again.',
        [
          { text: 'OK' },
          {
            text: 'Retry',
            onPress: () => handleWalletPress(walletType),
          },
        ]
      );
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, style]}>
        <ActivityIndicator size="large" color="#3b99fc" />
        <Text style={styles.loadingText}>Loading available wallets...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Select Wallet</Text>
      <Text style={styles.subtitle}>
        Choose your preferred wallet to connect
      </Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error.message}
          </Text>
        </View>
      )}

      <View style={styles.walletList}>
        {availableWallets.map((walletType) => {
          const walletInfo = WALLET_INFO[walletType];
          const isInstalled = walletType === WalletType.WALLETCONNECT || availableWallets.includes(walletType);
          
          return (
            <TouchableOpacity
              key={walletType}
              style={[
                styles.walletButton,
                { borderColor: walletInfo.color },
                !isInstalled && styles.walletButtonDisabled,
              ]}
              onPress={() => handleWalletPress(walletType)}
              disabled={isConnecting || !isInstalled}
            >
              <View style={styles.walletButtonContent}>
                <Text style={styles.walletIcon}>{walletInfo.icon}</Text>
                <View style={styles.walletInfo}>
                  <Text style={[styles.walletName, { color: walletInfo.color }]}>
                    {walletInfo.name}
                  </Text>
                  <Text style={styles.walletDescription}>
                    {walletInfo.description}
                  </Text>
                  {!isInstalled && (
                    <Text style={styles.notInstalledText}>
                      Not installed
                    </Text>
                  )}
                </View>
                {isConnecting && (
                  <ActivityIndicator size="small" color={walletInfo.color} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.footerText}>
        Don't have a wallet? Install MetaMask or Trust Wallet from your app store.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  walletList: {
    gap: 12,
  },
  walletButton: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  walletButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#f5f5f5',
  },
  walletButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  walletInfo: {
    flex: 1,
  },
  walletName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  walletDescription: {
    fontSize: 14,
    color: '#666666',
  },
  notInstalledText: {
    fontSize: 12,
    color: '#f44336',
    fontStyle: 'italic',
    marginTop: 2,
  },
  footerText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 16,
  },
});

export default WalletSelector;