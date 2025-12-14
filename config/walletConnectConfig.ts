// WalletConnect v2 configuration for React Native
import { projectId } from './walletConfig';
import { isProduction, preventMockDataUsage, getEnvironmentConfig } from './environment';

// WalletConnect v2 configuration
export const walletConnectConfig = {
  projectId: projectId, // Using existing Reown project ID
  metadata: {
    name: 'Kinetic IMU Dashboard',
    description: 'Collect and mint IMU sensor data as NFTs on the blockchain',
    url: 'kinetic://app', // Using your app's deep link scheme from app.json
    icons: [
      'https://via.placeholder.com/192x192/0a0a0f/ffffff?text=K', // Temporary placeholder matching your app colors
      'https://via.placeholder.com/512x512/0a0a0f/ffffff?text=K'  // You should replace these with your actual icons
    ]
  },
  // Supported chains for production (mainnet networks prioritized)
  chains: [1, 137, 8453], // Ethereum Mainnet, Polygon, Base (production networks)
  // Supported methods for wallet interactions
  methods: [
    'eth_sendTransaction',
    'eth_signTransaction',
    'eth_sign',
    'personal_sign',
    'eth_signTypedData',
    'eth_signTypedData_v4'
  ],
  // Supported events
  events: [
    'chainChanged',
    'accountsChanged',
    'disconnect'
  ],
  // Optional chains for development/testing
  optionalChains: [11155111], // Sepolia testnet for development
  optionalMethods: [
    'eth_accounts',
    'eth_requestAccounts',
    'eth_sendRawTransaction',
    'eth_signTypedData_v1',
    'eth_signTypedData_v3'
  ],
  optionalEvents: [
    'connect',
    'message'
  ]
};

// Validate WalletConnect configuration for production
export function validateWalletConnectConfig() {
  // Validate project ID format (should be a valid UUID-like string)
  if (!walletConnectConfig.projectId) {
    throw new Error('WalletConnect project ID is required');
  }
  
  if (walletConnectConfig.projectId.length !== 32) {
    console.warn('⚠️ Project ID format may be invalid - expected 32 character string');
  }
  
  // Validate metadata completeness
  if (!walletConnectConfig.metadata.name) {
    throw new Error('WalletConnect metadata name is required');
  }
  
  if (!walletConnectConfig.metadata.description) {
    throw new Error('WalletConnect metadata description is required');
  }
  
  if (!walletConnectConfig.metadata.url) {
    throw new Error('WalletConnect metadata URL is required');
  }
  
  // Validate production URLs - allow both HTTPS and app scheme URLs for mobile apps
  if (!walletConnectConfig.metadata.url.startsWith('https://') && !walletConnectConfig.metadata.url.startsWith('kinetic://')) {
    throw new Error('Production metadata URL must use HTTPS or app scheme (kinetic://)');
  }
  
  // Validate icons are HTTPS URLs (icons must be web-accessible)
  walletConnectConfig.metadata.icons.forEach((icon, index) => {
    if (!icon.startsWith('https://')) {
      throw new Error(`Icon ${index + 1} must use HTTPS URL for production (icons must be web-accessible)`);
    }
  });
  
  // Validate chain configuration
  if (!walletConnectConfig.chains || walletConnectConfig.chains.length === 0) {
    throw new Error('At least one chain must be configured');
  }
  
  // Ensure mainnet is included for production
  if (!walletConnectConfig.chains.includes(1)) {
    console.warn('⚠️ Ethereum mainnet (chain ID 1) not included in supported chains');
  }
  
  console.log('✅ WalletConnect configuration validated successfully for production');
  console.log(`📋 Project ID: ${walletConnectConfig.projectId}`);
  console.log(`🌐 Metadata URL: ${walletConnectConfig.metadata.url}`);
  console.log(`⛓️ Supported chains: ${walletConnectConfig.chains.join(', ')}`);
  
  return true;
}

// Export configuration for use in WalletConnect provider
export default walletConnectConfig;