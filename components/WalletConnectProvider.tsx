import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Platform, Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { getSdkError } from '@walletconnect/utils';
import { walletConnectConfig, validateWalletConnectConfig } from '../config/walletConnectConfig';
import { deepLinkHandler, WALLET_CONFIGS, WalletType as DeepLinkWalletType } from '../utils/DeepLinkHandler';
import { isProduction, preventMockDataUsage, getEnvironmentConfig } from '../config/environment';
import { 
  walletErrorHandler, 
  WalletError as EnhancedWalletError, 
  WalletErrorCategory,
  classifyWalletError,
  showWalletErrorAlert 
} from '../utils/WalletErrorHandler';
import { 
  sessionManager, 
  SessionState,
  storeSession,
  checkSessionRestoration,
  clearSession,
  setAutoReconnectEnabled 
} from '../utils/SessionManager';

// Import polyfills for React Native
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

// WalletConnect session interface
interface WalletConnectSession {
  topic: string;
  accounts: string[];
  chainId: number;
  metadata: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
  expiry: number;
}

// Transaction request interface
interface TransactionRequest {
  to: string;
  value?: string;
  data?: string;
  gas?: string;
  gasPrice?: string;
  nonce?: number;
}

// Wallet types enum (extending the deep link handler types)
enum WalletType {
  METAMASK = 'METAMASK',
  TRUST_WALLET = 'TRUST_WALLET',
  COINBASE = 'COINBASE',
  RAINBOW = 'RAINBOW',
  WALLETCONNECT = 'WALLETCONNECT'
}

// Wallet error interface (using enhanced error from WalletErrorHandler)
interface WalletError extends EnhancedWalletError {}

// Real wallet context interface
interface RealWalletContextType {
  // Connection state
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  
  // Connection methods
  connect: (walletType?: WalletType) => Promise<void>;
  disconnect: () => Promise<void>;
  getAvailableWallets: () => Promise<WalletType[]>;
  
  // Transaction methods
  signMessage: (message: string) => Promise<string>;
  signTransaction: (transaction: TransactionRequest) => Promise<string>;
  sendTransaction: (transaction: TransactionRequest) => Promise<string>;
  
  // Session management
  session: WalletConnectSession | null;
  reconnect: () => Promise<void>;
  
  // Session expiry and auto-reconnection
  sessionInfo: SessionInfo | null;
  enableAutoReconnect: (enabled: boolean) => Promise<void>;
  
  // Error handling
  error: WalletError | null;
  clearError: () => void;
}

// Wallet state interface
interface WalletState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  address: string | null;
  chainId: number | null;
  walletType: WalletType | null;
  session: WalletConnectSession | null;
  error: WalletError | null;
  lastConnectionAttempt: number | null;
}

// Create the context
const RealWalletContext = createContext<RealWalletContextType | null>(null);

// Session state interface
interface SessionInfo {
  state: SessionState;
  timeUntilExpiryString: string | null;
  needsRenewal: boolean;
}

interface WalletConnectProviderProps {
  children: React.ReactNode;
}

export function WalletConnectProvider({ children }: WalletConnectProviderProps) {
  const [state, setState] = useState<WalletState>({
    status: 'disconnected',
    address: null,
    chainId: null,
    walletType: null,
    session: null,
    error: null,
    lastConnectionAttempt: null,
  });

  const [provider, setProvider] = useState<any>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize WalletConnect Ethereum Provider
  const initializeWalletConnect = useCallback(async () => {
    // Prevent multiple initializations
    if (isInitialized || provider) {
      console.log('⚠️ WalletConnect already initialized, skipping...');
      return;
    }

    try {
      console.log('🔧 Initializing WalletConnect...');
      
      // Production safety check
      const envConfig = getEnvironmentConfig();
      if (envConfig.isProduction) {
        console.log('🔒 Production mode - ensuring no mock data usage');
        preventMockDataUsage('WalletConnect initialization');
      }
      
      // Validate configuration first
      validateWalletConnectConfig();
      
      // Initialize Ethereum Provider with explicit relay configuration
      console.log('🔧 Initializing with project ID:', walletConnectConfig.projectId);
      
      const providerInstance = await EthereumProvider.init({
        projectId: walletConnectConfig.projectId,
        chains: walletConnectConfig.chains,
        metadata: walletConnectConfig.metadata,
        methods: walletConnectConfig.methods,
        events: walletConnectConfig.events,
        ...(walletConnectConfig.optionalChains.length > 0 && { 
          optionalChains: walletConnectConfig.optionalChains as [number, ...number[]] 
        }),
        optionalMethods: walletConnectConfig.optionalMethods,
        optionalEvents: walletConnectConfig.optionalEvents,
        showQrModal: false, // Don't show QR modal automatically
        // Remove custom relay configuration - let WalletConnect use defaults
        // The issue might be with custom relay settings
      });
      
      setProvider(providerInstance);
      setIsInitialized(true);
      
      console.log('✅ WalletConnect initialized successfully');
      
      // Set up event listeners
      setupEventListeners(providerInstance);
      
      // Try to restore previous session
      await restoreSession(providerInstance);
      
    } catch (error: any) {
      console.error('❌ Failed to initialize WalletConnect:', error);
      
      // Use enhanced error handling
      const enhancedError = classifyWalletError(error, undefined, { operation: 'initialization' });
      
      setState(prev => ({
        ...prev,
        status: 'error',
        error: enhancedError,
      }));
    }
  }, []);

  // Set up WalletConnect event listeners
  const setupEventListeners = useCallback((providerInstance: any) => {
    // Account changed event
    providerInstance.on('accountsChanged', (accounts: string[]) => {
      console.log('👤 Accounts changed:', accounts);
      
      if (accounts.length > 0) {
        setState(prev => ({
          ...prev,
          address: accounts[0],
          status: 'connected',
        }));
      } else {
        setState(prev => ({
          ...prev,
          address: null,
          status: 'disconnected',
          session: null,
        }));
      }
    });

    // Chain changed event
    providerInstance.on('chainChanged', (chainId: string) => {
      console.log('🔗 Chain changed:', chainId);
      
      setState(prev => ({
        ...prev,
        chainId: parseInt(chainId, 16),
      }));
    });

    // Connect event
    providerInstance.on('connect', (connectInfo: any) => {
      console.log('✅ Connected:', connectInfo);
      
      setState(prev => ({
        ...prev,
        status: 'connected',
        chainId: parseInt(connectInfo.chainId, 16),
      }));
    });

    // Disconnect event
    providerInstance.on('disconnect', async (error: any) => {
      console.log('🔌 Disconnected:', error);
      
      setState(prev => ({
        ...prev,
        status: 'disconnected',
        session: null,
        address: null,
        chainId: null,
        walletType: null,
      }));
      
      // Clear session data using session manager
      await clearSession();
      setSessionInfo(null);
    });
    
  }, []);



  // Restore previous session using session manager
  const restoreSession = useCallback(async (providerInstance: any) => {
    try {
      console.log('🔄 Checking for session restoration...');
      
      const restorationResult = await checkSessionRestoration();
      
      if (restorationResult.success && restorationResult.session && providerInstance.connected) {
        console.log('✅ Restoring previous session:', restorationResult.session);
        
        // Get current accounts from provider
        const accounts = await providerInstance.request({ method: 'eth_accounts' }) as string[];
        
        setState(prev => ({
          ...prev,
          status: 'connected',
          session: restorationResult.session,
          address: accounts[0] || restorationResult.address || null,
          chainId: restorationResult.session.chainId,
          walletType: restorationResult.walletType as WalletType || null,
        }));
        
        // Update session info
        await updateSessionInfo();
        
      } else if (restorationResult.shouldPromptReconnect) {
        console.log('⚠️ Session expired or invalid - may prompt for reconnection');
        // Session manager will handle reconnection prompts
      } else {
        console.log('ℹ️ No valid session to restore');
      }
    } catch (error: any) {
      console.error('❌ Failed to restore session:', error);
      
      // Clear potentially corrupted session data
      await clearSession();
    }
  }, [isInitialized, provider]);

  // Connect to wallet with wallet-specific deep linking
  const connect = useCallback(async (walletType: WalletType = WalletType.WALLETCONNECT) => {
    if (!provider) {
      const error = classifyWalletError(
        new Error('WalletConnect not initialized'), 
        walletType as DeepLinkWalletType, 
        { operation: 'connect' }
      );
      setState(prev => ({ ...prev, status: 'error', error }));
      return;
    }

    setState(prev => ({
      ...prev,
      status: 'connecting',
      error: null,
      lastConnectionAttempt: Date.now(),
    }));

    const operationId = `connect_${walletType}_${Date.now()}`;

    try {
      console.log('🔗 Connecting to wallet:', walletType);

      // Handle wallet-specific connection with enhanced error handling
      if (walletType !== WalletType.WALLETCONNECT) {
        await connectSpecificWalletWithRetry(walletType, operationId);
      } else {
        // Use universal WalletConnect with retry
        await connectUniversalWalletWithRetry(operationId);
      }

    } catch (error: any) {
      console.error('❌ Connection failed:', error);
      
      // Use enhanced error classification
      const enhancedError = classifyWalletError(
        error, 
        walletType as DeepLinkWalletType, 
        { operation: 'connect', operationId }
      );
      
      setState(prev => ({
        ...prev,
        status: 'error',
        error: enhancedError,
      }));

      // Show user-friendly error alert with retry option
      showWalletErrorAlert(
        enhancedError,
        enhancedError.retryable ? () => connect(walletType) : undefined,
        () => setState(prev => ({ ...prev, status: 'disconnected', error: null }))
      );
    }
  }, [provider]);

  // Connect to specific wallet using deep links with enhanced error handling
  const connectSpecificWallet = useCallback(async (walletType: WalletType) => {
    try {
      console.log('🔗 Starting specific wallet connection for:', walletType);
      
      // Ensure provider is ready
      if (!provider) {
        throw new Error('WalletConnect provider not initialized');
      }
      
      // Comprehensive network connectivity check
      try {
        console.log('🌐 Checking WalletConnect relay connectivity...');
        
        // Test multiple endpoints
        const tests = [
          fetch('https://relay.walletconnect.com', { method: 'HEAD' }),
          fetch('https://relay.walletconnect.org', { method: 'HEAD' }),
          fetch('https://bridge.walletconnect.org', { method: 'HEAD' })
        ];
        
        const results = await Promise.allSettled(tests.map(test => 
          Promise.race([test, new Promise((_, reject) => 
            setTimeout(() => reject(new Error('timeout')), 3000)
          )])
        ));
        
        const successful = results.filter(result => result.status === 'fulfilled').length;
        console.log(`🌐 Network test results: ${successful}/${tests.length} endpoints reachable`);
        
        if (successful === 0) {
          console.error('❌ No WalletConnect endpoints reachable - network issue detected');
          throw new Error('Network connectivity issue detected. Please check your internet connection.');
        }
        
      } catch (networkError) {
        console.warn('⚠️ Network connectivity check failed:', networkError);
        // Continue anyway but warn user
      }
      
      // Map our wallet type to deep link handler type
      const deepLinkWalletType = walletType as DeepLinkWalletType;
      
      // Check if wallet is installed
      console.log('📱 Checking if wallet is installed...');
      const isInstalled = await deepLinkHandler.isWalletInstalled(deepLinkWalletType);
      console.log('📱 Wallet installed check result:', isInstalled);
      
      if (!isInstalled) {
        // Use enhanced error handling for wallet not installed
        const notInstalledError = classifyWalletError(
          new Error('Wallet not installed'),
          deepLinkWalletType,
          { operation: 'connect', walletType }
        );
        
        // Handle wallet installation with enhanced UI
        const shouldInstall = await walletErrorHandler.handleWalletNotInstalled(deepLinkWalletType);
        
        if (!shouldInstall) {
          setState(prev => ({ ...prev, status: 'disconnected' }));
          throw notInstalledError;
        }
        
        // User chose to install - set state to disconnected and return
        setState(prev => ({ ...prev, status: 'disconnected' }));
        return;
      }

      // Create WalletConnect URI with timeout and debugging
      console.log('🔗 Creating WalletConnect URI...');
      console.log('🔍 Provider status:', {
        connected: provider?.connected,
        session: provider?.session,
        accounts: provider?.accounts,
        chainId: provider?.chainId
      });
      
      // Check if provider is ready
      if (!provider || typeof provider.connect !== 'function') {
        throw new Error('WalletConnect provider not ready');
      }
      
      // If already connected, disconnect first to ensure clean state
      if (provider.connected) {
        console.log('🔄 Provider already connected, disconnecting first...');
        try {
          await provider.disconnect();
          console.log('✅ Disconnected existing session');
        } catch (disconnectError) {
          console.warn('⚠️ Failed to disconnect existing session:', disconnectError);
        }
      }
      
      let uri;
      try {
        // Try to connect with timeout
        uri = await Promise.race([
          provider.connect(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('URI generation timeout - WalletConnect relay may be unreachable')), 15000)
          )
        ]);
      } catch (timeoutError) {
        console.error('❌ URI generation failed:', timeoutError);
        
        // Provide user-friendly error with troubleshooting steps
        throw new Error(
          'Failed to connect to WalletConnect. This could be due to:\n' +
          '• Network connectivity issues\n' +
          '• WalletConnect relay server problems\n' +
          '• Firewall blocking the connection\n\n' +
          'Please check your internet connection and try again.'
        );
      }
      
      if (uri) {
        console.log('📱 Opening wallet with URI:', uri.substring(0, 50) + '...');
        
        // Open specific wallet with deep link
        const opened = await deepLinkHandler.openWallet(deepLinkWalletType, uri);
        
        if (!opened) {
          // Fallback to universal WalletConnect
          console.log('🔄 Falling back to universal WalletConnect');
          await deepLinkHandler.openUniversalWalletConnect(uri);
        }
        
        // Wait for connection to be established
        await waitForConnection();
      } else {
        throw new Error('Failed to generate WalletConnect URI');
      }
      
    } catch (error: any) {
      console.error('❌ Specific wallet connection failed:', error);
      throw error;
    }
  }, [provider]);

  // Connect to specific wallet with retry mechanism
  const connectSpecificWalletWithRetry = useCallback(async (walletType: WalletType, operationId: string) => {
    const connectFunction = () => connectSpecificWallet(walletType);
    
    try {
      return await connectFunction();
    } catch (error: any) {
      const enhancedError = classifyWalletError(
        error, 
        walletType as DeepLinkWalletType, 
        { operation: 'connect', operationId }
      );
      
      // Handle network errors with retry
      if (enhancedError.category === WalletErrorCategory.NETWORK_ERROR && enhancedError.retryable) {
        return await walletErrorHandler.handleNetworkError(enhancedError, connectFunction, operationId);
      }
      
      throw enhancedError;
    }
  }, [connectSpecificWallet]);

  // Connect using universal WalletConnect
  const connectUniversalWallet = useCallback(async () => {
    try {
      console.log('🔗 Starting universal WalletConnect connection...');
      
      // Ensure provider is ready
      if (!provider) {
        throw new Error('WalletConnect provider not initialized');
      }
      
      console.log('🔍 Provider status:', {
        connected: provider?.connected,
        session: provider?.session,
        accounts: provider?.accounts,
        chainId: provider?.chainId
      });
      
      // If already connected, disconnect first to ensure clean state
      if (provider.connected) {
        console.log('🔄 Provider already connected, disconnecting first...');
        try {
          await provider.disconnect();
          console.log('✅ Disconnected existing session');
        } catch (disconnectError) {
          console.warn('⚠️ Failed to disconnect existing session:', disconnectError);
        }
      }
      
      // Create WalletConnect URI with timeout and fallback
      console.log('🔗 Creating WalletConnect URI for universal connection...');
      
      let uri;
      try {
        // Try the standard approach first
        uri = await Promise.race([
          provider.connect(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('URI generation timeout')), 10000)
          )
        ]);
      } catch (timeoutError) {
        console.warn('⚠️ Standard URI generation failed, trying alternative approach...');
        
        // Alternative approach: try to create a new provider instance
        try {
          console.log('🔄 Attempting provider reset...');
          
          // Force a new connection attempt
          const freshUri = await Promise.race([
            provider.connect(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Alternative URI generation also timed out')), 8000)
            )
          ]);
          
          uri = freshUri;
          console.log('✅ Alternative URI generation succeeded');
          
        } catch (alternativeError) {
          console.error('❌ Both URI generation methods failed');
          throw new Error(
            'WalletConnect connection failed. This appears to be a network connectivity issue.\n\n' +
            'Possible solutions:\n' +
            '• Check your internet connection\n' +
            '• Try connecting to a different network (WiFi vs mobile data)\n' +
            '• Restart the app and try again\n' +
            '• Check if your firewall is blocking WalletConnect'
          );
        }
      }
      
      if (uri) {
        console.log('📱 Opening universal WalletConnect with URI:', uri.substring(0, 50) + '...');
        
        // Try universal WalletConnect first
        console.log('🔗 Attempting to open universal WalletConnect...');
        const opened = await deepLinkHandler.openUniversalWalletConnect(uri);
        console.log('📱 Universal WalletConnect opened:', opened);
        
        if (!opened) {
          // Show manual connection options
          console.log('📋 Showing manual connection options...');
          showWalletSelectionAlert(uri);
        }
        
        // Wait for connection to be established
        console.log('⏳ Waiting for universal wallet connection...');
        await waitForConnection();
        console.log('✅ Universal wallet connection established');
      } else {
        throw new Error('Failed to generate WalletConnect URI');
      }
      
    } catch (error: any) {
      console.error('❌ Universal wallet connection failed:', error);
      throw error;
    }
  }, [provider]);

  // Connect using universal WalletConnect with retry mechanism
  const connectUniversalWalletWithRetry = useCallback(async (operationId: string) => {
    const connectFunction = () => connectUniversalWallet();
    
    try {
      return await connectFunction();
    } catch (error: any) {
      const enhancedError = classifyWalletError(
        error, 
        undefined, 
        { operation: 'connect_universal', operationId }
      );
      
      // Handle network errors with retry
      if (enhancedError.category === WalletErrorCategory.NETWORK_ERROR && enhancedError.retryable) {
        return await walletErrorHandler.handleNetworkError(enhancedError, connectFunction, operationId);
      }
      
      throw enhancedError;
    }
  }, [connectUniversalWallet]);

  // Wait for WalletConnect session to be established
  const waitForConnection = useCallback(async () => {
    console.log('⏳ Starting to wait for wallet connection...');
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.log('⏰ Connection timeout after 30 seconds');
        reject(new Error('Connection timeout - wallet did not respond within 30 seconds'));
      }, 30000); // Reduced to 30 second timeout for better UX

      // Listen for session approval
      const handleSessionApproval = async (session: any) => {
        console.log('🎉 Session approval received:', session);
        clearTimeout(timeout);
        
        const accounts = session.namespaces?.eip155?.accounts || [];
        const chainId = session.namespaces?.eip155?.chains?.[0] || '0x1';
        console.log('📋 Accounts:', accounts);
        console.log('⛓️ Chain ID:', chainId);
        
        if (accounts.length > 0) {
          // Extract address from account string (format: "eip155:1:0x...")
          const address = accounts[0].split(':')[2];
          
          const walletSession: WalletConnectSession = {
            topic: session.topic,
            accounts: [address],
            chainId: parseInt(chainId.split(':')[1], 10),
            metadata: session.peer?.metadata || {
              name: 'Connected Wallet',
              description: 'WalletConnect Session',
              url: '',
              icons: [],
            },
            expiry: session.expiry,
          };

          setState(prev => ({
            ...prev,
            status: 'connected',
            session: walletSession,
            address,
            chainId: parseInt(chainId.split(':')[1], 10),
          }));

          // Store session using session manager
          await storeSession(walletSession, state.walletType || 'WALLETCONNECT', address);
          
          // Update session info
          await updateSessionInfo();
          
          console.log('✅ Connected successfully:', address);
          resolve();
        } else {
          reject(new Error('No accounts returned from wallet'));
        }
      };

      // Listen for session rejection
      const handleSessionRejection = (error: any) => {
        console.log('❌ Session rejected:', error);
        clearTimeout(timeout);
        reject(new Error('User rejected connection'));
      };

      // Set up event listeners
      console.log('👂 Setting up session event listeners...');
      provider.on('session_approve', handleSessionApproval);
      provider.on('session_reject', handleSessionRejection);
      console.log('✅ Event listeners set up successfully');
      
      // Clean up listeners after resolution
      const cleanup = () => {
        provider.removeListener('session_approve', handleSessionApproval);
        provider.removeListener('session_reject', handleSessionRejection);
      };
      
      // Add cleanup to both resolve and reject
      const originalResolve = resolve;
      const originalReject = reject;
      
      resolve = (...args) => {
        cleanup();
        originalResolve(...args);
      };
      
      reject = (...args) => {
        cleanup();
        originalReject(...args);
      };
    });
  }, [provider]);

  // Show wallet selection alert when universal connection fails
  const showWalletSelectionAlert = useCallback((uri: string) => {
    Alert.alert(
      'Select Wallet',
      'Choose how you want to connect your wallet:',
      [
        {
          text: 'MetaMask',
          onPress: () => deepLinkHandler.openWallet('METAMASK', uri),
        },
        {
          text: 'Trust Wallet',
          onPress: () => deepLinkHandler.openWallet('TRUST_WALLET', uri),
        },
        {
          text: 'Other Wallet',
          onPress: () => {
            // Show QR code or copy URI
            Alert.alert(
              'Manual Connection',
              'Copy this URI and paste it in your wallet app, or scan the QR code if available.',
              [
                {
                  text: 'Copy URI',
                  onPress: () => {
                    // Note: Clipboard API would need to be imported
                    console.log('URI to copy:', uri);
                  },
                },
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
              ]
            );
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            setState(prev => ({ ...prev, status: 'disconnected' }));
          },
        },
      ]
    );
  }, []);



  // Disconnect wallet
  const disconnect = useCallback(async () => {
    try {
      console.log('🔌 Disconnecting wallet...');
      
      if (provider && provider.connected) {
        // Disconnect WalletConnect session
        await provider.disconnect();
      }
      
      // Clear state
      setState(prev => ({
        ...prev,
        status: 'disconnected',
        session: null,
        address: null,
        chainId: null,
        walletType: null,
        error: null,
      }));
      
      // Clear session data using session manager
      await clearSession();
      
      // Update session info
      setSessionInfo(null);
      
      // Reset initialization state
      setIsInitialized(false);
      
      console.log('✅ Wallet disconnected successfully');
      
    } catch (error: any) {
      console.error('❌ Failed to disconnect wallet:', error);
      
      // Force clear state even if disconnect fails
      setState(prev => ({
        ...prev,
        status: 'disconnected',
        session: null,
        address: null,
        chainId: null,
        walletType: null,
      }));
    }
  }, [provider]);

  // Sign message with enhanced error handling
  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!provider || !state.address) {
      const error = classifyWalletError(
        new Error('Wallet not connected'), 
        state.walletType as DeepLinkWalletType, 
        { operation: 'sign_message' }
      );
      throw error;
    }

    // Production safety check - prevent mock signatures
    if (isProduction()) {
      preventMockDataUsage('message signing');
    }

    const operationId = `sign_message_${Date.now()}`;

    try {
      console.log('✍️ Signing message:', message);
      
      // Use the provider to sign the message
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, state.address],
      }) as string;
      
      console.log('✅ Message signed successfully');
      return signature;
      
    } catch (error: any) {
      console.error('❌ Failed to sign message:', error);
      
      const enhancedError = classifyWalletError(
        error, 
        state.walletType as DeepLinkWalletType, 
        { operation: 'sign_message', operationId, message }
      );
      
      // Handle network errors with retry
      if (enhancedError.category === WalletErrorCategory.NETWORK_ERROR && enhancedError.retryable) {
        const retryFunction = () => provider.request({
          method: 'personal_sign',
          params: [message, state.address],
        }) as Promise<string>;
        
        return await walletErrorHandler.handleNetworkError(enhancedError, retryFunction, operationId);
      }
      
      throw enhancedError;
    }
  }, [provider, state.address, state.walletType]);

  // Sign transaction with enhanced error handling
  const signTransaction = useCallback(async (transaction: TransactionRequest): Promise<string> => {
    if (!provider || !state.address) {
      const error = classifyWalletError(
        new Error('Wallet not connected'), 
        state.walletType as DeepLinkWalletType, 
        { operation: 'sign_transaction' }
      );
      throw error;
    }

    // Production safety check - prevent mock transactions
    if (isProduction()) {
      preventMockDataUsage('transaction signing');
    }

    const operationId = `sign_transaction_${Date.now()}`;

    try {
      console.log('📝 Signing transaction:', transaction);
      
      // Use the provider to sign the transaction
      const signature = await provider.request({
        method: 'eth_signTransaction',
        params: [transaction],
      }) as string;
      
      console.log('✅ Transaction signed successfully');
      return signature;
      
    } catch (error: any) {
      console.error('❌ Failed to sign transaction:', error);
      
      const enhancedError = classifyWalletError(
        error, 
        state.walletType as DeepLinkWalletType, 
        { operation: 'sign_transaction', operationId, transaction }
      );
      
      // Handle network errors with retry
      if (enhancedError.category === WalletErrorCategory.NETWORK_ERROR && enhancedError.retryable) {
        const retryFunction = () => provider.request({
          method: 'eth_signTransaction',
          params: [transaction],
        }) as Promise<string>;
        
        return await walletErrorHandler.handleNetworkError(enhancedError, retryFunction, operationId);
      }
      
      throw enhancedError;
    }
  }, [provider, state.address, state.walletType]);

  // Send transaction with enhanced error handling
  const sendTransaction = useCallback(async (transaction: TransactionRequest): Promise<string> => {
    if (!provider || !state.address) {
      const error = classifyWalletError(
        new Error('Wallet not connected'), 
        state.walletType as DeepLinkWalletType, 
        { operation: 'send_transaction' }
      );
      throw error;
    }

    const operationId = `send_transaction_${Date.now()}`;

    try {
      console.log('💸 Sending transaction:', transaction);
      
      // Use the provider to send the transaction
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [transaction],
      }) as string;
      
      console.log('✅ Transaction sent successfully');
      return txHash;
      
    } catch (error: any) {
      console.error('❌ Failed to send transaction:', error);
      
      const enhancedError = classifyWalletError(
        error, 
        state.walletType as DeepLinkWalletType, 
        { operation: 'send_transaction', operationId, transaction }
      );
      
      // Handle network errors with retry
      if (enhancedError.category === WalletErrorCategory.NETWORK_ERROR && enhancedError.retryable) {
        const retryFunction = () => provider.request({
          method: 'eth_sendTransaction',
          params: [transaction],
        }) as Promise<string>;
        
        return await walletErrorHandler.handleNetworkError(enhancedError, retryFunction, operationId);
      }
      
      throw enhancedError;
    }
  }, [provider, state.address, state.walletType]);

  // Reconnect to wallet
  const reconnect = useCallback(async () => {
    if (state.walletType) {
      await connect(state.walletType);
    } else {
      await connect();
    }
  }, [connect, state.walletType]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Get available wallets (installed on device)
  const getAvailableWallets = useCallback(async (): Promise<WalletType[]> => {
    try {
      const installedWallets = await deepLinkHandler.getInstalledWallets();
      
      // Map deep link wallet types to our wallet types
      const availableWallets: WalletType[] = [WalletType.WALLETCONNECT]; // Always available
      
      installedWallets.forEach(wallet => {
        switch (wallet) {
          case 'METAMASK':
            availableWallets.push(WalletType.METAMASK);
            break;
          case 'TRUST_WALLET':
            availableWallets.push(WalletType.TRUST_WALLET);
            break;
          case 'COINBASE':
            availableWallets.push(WalletType.COINBASE);
            break;
          case 'RAINBOW':
            availableWallets.push(WalletType.RAINBOW);
            break;
        }
      });
      
      return availableWallets;
    } catch (error) {
      console.error('❌ Error getting available wallets:', error);
      return [WalletType.WALLETCONNECT]; // Fallback to universal WalletConnect
    }
  }, []);

  // Handle deep link returns from wallets with enhanced error handling
  const handleWalletReturn = useCallback((url: string) => {
    console.log('📱 Handling wallet return:', url);
    
    const returnData = deepLinkHandler.parseWalletReturn(url);
    
    if (returnData.walletType) {
      console.log(`✅ Wallet ${returnData.walletType} returned`);
      
      if (returnData.success === false && returnData.error) {
        // Handle wallet rejection or error with enhanced error handling
        const enhancedError = classifyWalletError(
          new Error(returnData.error || 'Wallet connection was rejected'),
          returnData.walletType,
          { operation: 'wallet_return', returnData }
        );
        
        setState(prev => ({
          ...prev,
          status: 'error',
          error: enhancedError,
        }));

        // Show user-friendly error alert
        showWalletErrorAlert(
          enhancedError,
          enhancedError.retryable ? () => connect(returnData.walletType as WalletType) : undefined,
          () => setState(prev => ({ ...prev, status: 'disconnected', error: null }))
        );
      }
      // Success case is handled by WalletConnect session events
    }
  }, [connect]);

  // Update session info
  const updateSessionInfo = useCallback(async () => {
    try {
      const sessionState = await sessionManager.getSessionState();
      const timeUntilExpiryString = await sessionManager.getTimeUntilExpiryString();
      const needsRenewal = await sessionManager.needsRenewal();
      
      setSessionInfo({
        state: sessionState,
        timeUntilExpiryString,
        needsRenewal,
      });
    } catch (error) {
      console.error('❌ Failed to update session info:', error);
      setSessionInfo(null);
    }
  }, []);

  // Handle session expiry warnings
  const handleSessionExpiry = useCallback((timeUntilExpiry: number) => {
    console.log('⚠️ Session expiring soon:', timeUntilExpiry);
    
    // Show user-friendly expiry warning
    const minutes = Math.floor(timeUntilExpiry / (60 * 1000));
    
    if (minutes <= 5) {
      Alert.alert(
        'Session Expiring Soon',
        `Your wallet session will expire in ${minutes} minute${minutes !== 1 ? 's' : ''}. Please reconnect to continue using the app.`,
        [
          {
            text: 'Reconnect Now',
            onPress: () => reconnect(),
          },
          {
            text: 'Later',
            style: 'cancel',
          },
        ]
      );
    }
  }, []);

  // Handle automatic reconnection
  const handleAutoReconnect = useCallback(async () => {
    console.log('🔄 Attempting automatic reconnection...');
    
    try {
      // Try to reconnect with the last used wallet type
      if (state.walletType) {
        await connect(state.walletType);
      } else {
        await connect();
      }
    } catch (error) {
      console.error('❌ Auto-reconnection failed:', error);
      
      // Show manual reconnection prompt
      Alert.alert(
        'Reconnection Required',
        'Your wallet session has expired. Please reconnect to continue using the app.',
        [
          {
            text: 'Reconnect',
            onPress: () => connect(),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    }
  }, [state.walletType, connect]);

  // Handle session restored
  const handleSessionRestored = useCallback((session: any) => {
    console.log('✅ Session restored by session manager');
    
    setState(prev => ({
      ...prev,
      status: 'connected',
      session,
      error: null,
    }));
    
    updateSessionInfo();
  }, [updateSessionInfo]);

  // Enable/disable auto-reconnection
  const enableAutoReconnect = useCallback(async (enabled: boolean) => {
    try {
      await setAutoReconnectEnabled(enabled);
      await updateSessionInfo();
      console.log('⚙️ Auto-reconnect', enabled ? 'enabled' : 'disabled');
    } catch (error) {
      console.error('❌ Failed to set auto-reconnect:', error);
    }
  }, [updateSessionInfo]);

  // Initialize on mount - run only once
  useEffect(() => {
    if (!isInitialized) {
      initializeWalletConnect();
    }
  }, []); // Empty dependency array - run only once on mount

  // Set up listeners and callbacks after initialization
  useEffect(() => {
    if (!isInitialized || !provider) return;

    // Set up deep link listener for wallet returns
    const unsubscribe = deepLinkHandler.addListener(handleWalletReturn);
    
    // Set up session manager callbacks
    sessionManager.setOnSessionExpiry(handleSessionExpiry);
    sessionManager.setOnReconnectNeeded(handleAutoReconnect);
    sessionManager.setOnSessionRestored(handleSessionRestored);
    
    // Initial session info update
    updateSessionInfo();
    
    // Update session info periodically
    const sessionInfoInterval = setInterval(updateSessionInfo, 60000); // Every minute
    
    // Cleanup on unmount
    return () => {
      unsubscribe();
      clearInterval(sessionInfoInterval);
      sessionManager.cleanup();
    };
  }, [isInitialized, provider, handleWalletReturn, handleSessionExpiry, handleAutoReconnect, handleSessionRestored, updateSessionInfo]);

  // Create context value
  const contextValue: RealWalletContextType = {
    address: state.address,
    chainId: state.chainId,
    isConnected: state.status === 'connected',
    isConnecting: state.status === 'connecting',
    connect,
    disconnect,
    getAvailableWallets,
    signMessage,
    signTransaction,
    sendTransaction,
    session: state.session,
    reconnect,
    sessionInfo,
    enableAutoReconnect,
    error: state.error,
    clearError,
  };

  return React.createElement(
    RealWalletContext.Provider,
    { value: contextValue },
    children
  );
}

// Custom hook to use the real wallet context
export function useRealWallet(): RealWalletContextType {
  const context = useContext(RealWalletContext);
  if (!context) {
    throw new Error('useRealWallet must be used within a WalletConnectProvider');
  }
  return context;
}

// Export types for external use
export type { RealWalletContextType, WalletConnectSession, TransactionRequest, WalletError, SessionInfo };
export { WalletType };