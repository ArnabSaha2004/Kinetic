import { Linking, Platform, Alert } from 'react-native';

// Wallet app package names and schemes
export const WALLET_CONFIGS = {
  METAMASK: {
    scheme: 'metamask',
    packageName: 'io.metamask',
    appStoreUrl: 'https://play.google.com/store/apps/details?id=io.metamask',
    deepLinkPrefix: 'metamask://wc?uri=',
    returnScheme: 'kinetic://metamask',
  },
  TRUST_WALLET: {
    scheme: 'trust',
    packageName: 'com.wallet.crypto.trustapp',
    appStoreUrl: 'https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp',
    deepLinkPrefix: 'trust://wc?uri=',
    returnScheme: 'kinetic://trust',
  },
  COINBASE: {
    scheme: 'coinbase',
    packageName: 'com.coinbase.android',
    appStoreUrl: 'https://play.google.com/store/apps/details?id=com.coinbase.android',
    deepLinkPrefix: 'coinbase://wc?uri=',
    returnScheme: 'kinetic://walletconnect',
  },
  RAINBOW: {
    scheme: 'rainbow',
    packageName: 'com.rainbow',
    appStoreUrl: 'https://play.google.com/store/apps/details?id=com.rainbow',
    deepLinkPrefix: 'rainbow://wc?uri=',
    returnScheme: 'kinetic://walletconnect',
  },
} as const;

export type WalletType = keyof typeof WALLET_CONFIGS;

// Deep link handler class
export class DeepLinkHandler {
  private static instance: DeepLinkHandler;
  private listeners: ((url: string) => void)[] = [];

  private constructor() {
    this.setupDeepLinkListener();
  }

  public static getInstance(): DeepLinkHandler {
    if (!DeepLinkHandler.instance) {
      DeepLinkHandler.instance = new DeepLinkHandler();
    }
    return DeepLinkHandler.instance;
  }

  // Set up deep link listener for incoming URLs
  private setupDeepLinkListener(): void {
    // Listen for incoming deep links when app is already running
    Linking.addEventListener('url', this.handleDeepLink);

    // Handle deep link when app is opened from a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        this.handleDeepLink({ url });
      }
    });
  }

  // Handle incoming deep link
  private handleDeepLink = ({ url }: { url: string }): void => {
    console.log('📱 Received deep link:', url);
    
    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(url);
      } catch (error) {
        console.error('❌ Error in deep link listener:', error);
      }
    });
  };

  // Add deep link listener
  public addListener(listener: (url: string) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Check if a wallet app is installed
  public async isWalletInstalled(walletType: WalletType): Promise<boolean> {
    const config = WALLET_CONFIGS[walletType];
    
    try {
      // Try to open the wallet scheme to check if it's installed
      const canOpen = await Linking.canOpenURL(`${config.scheme}://`);
      console.log(`📱 Wallet ${walletType} installed:`, canOpen);
      return canOpen;
    } catch (error) {
      console.error(`❌ Error checking wallet ${walletType}:`, error);
      return false;
    }
  }

  // Generate wallet-specific deep link for WalletConnect
  public generateWalletDeepLink(walletType: WalletType, wcUri: string): string {
    const config = WALLET_CONFIGS[walletType];
    const encodedUri = encodeURIComponent(wcUri);
    
    // Add return URL to the WalletConnect URI
    const returnUrl = encodeURIComponent(config.returnScheme);
    const deepLink = `${config.deepLinkPrefix}${encodedUri}&redirect=${returnUrl}`;
    
    console.log(`🔗 Generated ${walletType} deep link:`, deepLink);
    return deepLink;
  }

  // Open wallet app with WalletConnect URI
  public async openWallet(walletType: WalletType, wcUri: string): Promise<boolean> {
    try {
      // Check if wallet is installed
      const isInstalled = await this.isWalletInstalled(walletType);
      
      if (!isInstalled) {
        // Show installation prompt
        await this.promptWalletInstallation(walletType);
        return false;
      }

      // Generate wallet-specific deep link
      const deepLink = this.generateWalletDeepLink(walletType, wcUri);
      
      // Open the wallet app
      console.log(`📱 Opening ${walletType} with deep link:`, deepLink.substring(0, 50) + '...');
      await Linking.openURL(deepLink);
      console.log(`✅ Opened ${walletType} successfully`);
      return true;
      
    } catch (error) {
      console.error(`❌ Error opening wallet ${walletType}:`, error);
      
      // Fallback: try to open with universal WalletConnect
      return this.openUniversalWalletConnect(wcUri);
    }
  }

  // Open universal WalletConnect (for any compatible wallet)
  public async openUniversalWalletConnect(wcUri: string): Promise<boolean> {
    try {
      // Try WalletConnect universal link first
      const universalLink = `wc:${wcUri}`;
      const canOpenWC = await Linking.canOpenURL(universalLink);
      
      if (canOpenWC) {
        await Linking.openURL(universalLink);
        console.log('✅ Opened universal WalletConnect');
        return true;
      }
      
      // Fallback: show QR code or manual connection
      console.log('📱 No WalletConnect app found, showing manual connection');
      this.showManualConnectionAlert(wcUri);
      return false;
      
    } catch (error) {
      console.error('❌ Error opening universal WalletConnect:', error);
      return false;
    }
  }

  // Prompt user to install wallet
  private async promptWalletInstallation(walletType: WalletType): Promise<void> {
    const config = WALLET_CONFIGS[walletType];
    
    return new Promise((resolve) => {
      Alert.alert(
        `${walletType} Not Installed`,
        `${walletType} is required to connect your wallet. Would you like to install it?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(),
          },
          {
            text: 'Install',
            onPress: async () => {
              try {
                await Linking.openURL(config.appStoreUrl);
              } catch (error) {
                console.error(`❌ Error opening app store for ${walletType}:`, error);
              }
              resolve();
            },
          },
        ]
      );
    });
  }

  // Show manual connection alert when no wallet apps are available
  private showManualConnectionAlert(wcUri: string): void {
    Alert.alert(
      'No Wallet App Found',
      'No compatible wallet apps are installed. Please install MetaMask, Trust Wallet, or another WalletConnect-compatible wallet.',
      [
        {
          text: 'Install MetaMask',
          onPress: () => Linking.openURL(WALLET_CONFIGS.METAMASK.appStoreUrl),
        },
        {
          text: 'Install Trust Wallet',
          onPress: () => Linking.openURL(WALLET_CONFIGS.TRUST_WALLET.appStoreUrl),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  }

  // Parse deep link URL to extract wallet return data
  public parseWalletReturn(url: string): { walletType?: WalletType; success?: boolean; error?: string } {
    try {
      const parsedUrl = new URL(url);
      
      // Check if it's a wallet return URL
      if (parsedUrl.protocol === 'kinetic:') {
        const host = parsedUrl.host;
        
        // Determine wallet type from host
        let walletType: WalletType | undefined;
        if (host === 'metamask') {
          walletType = 'METAMASK';
        } else if (host === 'trust') {
          walletType = 'TRUST_WALLET';
        } else if (host === 'walletconnect') {
          // Generic WalletConnect return
          walletType = undefined;
        }
        
        // Parse query parameters for success/error status
        const params = parsedUrl.searchParams;
        const success = params.get('success') === 'true';
        const error = params.get('error') || undefined;
        
        return { walletType, success, error };
      }
      
      return {};
    } catch (error) {
      console.error('❌ Error parsing wallet return URL:', error);
      return {};
    }
  }

  // Get list of installed wallets
  public async getInstalledWallets(): Promise<WalletType[]> {
    const installedWallets: WalletType[] = [];
    
    for (const walletType of Object.keys(WALLET_CONFIGS) as WalletType[]) {
      const isInstalled = await this.isWalletInstalled(walletType);
      if (isInstalled) {
        installedWallets.push(walletType);
      }
    }
    
    console.log('📱 Installed wallets:', installedWallets);
    return installedWallets;
  }

  // Clean up listeners
  public cleanup(): void {
    this.listeners = [];
    // Note: Linking.removeEventListener is deprecated in newer React Native versions
    // The event listener will be automatically cleaned up when the component unmounts
  }
}

// Export singleton instance
export const deepLinkHandler = DeepLinkHandler.getInstance();

// Export utility functions
export const isWalletInstalled = (walletType: WalletType) => deepLinkHandler.isWalletInstalled(walletType);
export const openWallet = (walletType: WalletType, wcUri: string) => deepLinkHandler.openWallet(walletType, wcUri);
export const getInstalledWallets = () => deepLinkHandler.getInstalledWallets();