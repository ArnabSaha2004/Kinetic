import { mainnet, sepolia } from 'wagmi/chains';
import type { AppKitNetwork } from '@reown/appkit/networks';
import { isProduction, preventMockDataUsage, getEnvironmentConfig } from './environment';

// Reown project ID from https://cloud.reown.com
export const projectId = '07a170bf88486fb71b2a46f57605d5f2';

// Validate project ID
if (!projectId) {
  throw new Error('REOWN_PROJECT_ID is required. Get one from https://cloud.reown.com');
}

// App metadata for wallet connection - Using app scheme for mobile app
export const metadata = {
  name: 'Kinetic IMU Dashboard',
  description: 'Collect and mint IMU sensor data as NFTs on the blockchain',
  url: 'kinetic://app', // Using your app's deep link scheme from app.json
  icons: [
    'https://via.placeholder.com/192x192/0a0a0f/ffffff?text=K', // Temporary placeholder matching your app colors
    'https://via.placeholder.com/512x512/0a0a0f/ffffff?text=K'  // You should replace these with your actual icons
  ]
};

// Supported blockchain networks for production (mainnet first, testnet for development)
export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [
  mainnet, // Production network first
  sepolia, // Keep testnet for development/testing
];

// Default network for initial connection - use mainnet for production
export const defaultNetwork = mainnet;

// AppKit configuration interface
export interface AppKitConfig {
  projectId: string;
  networks: [AppKitNetwork, ...AppKitNetwork[]];
  defaultNetwork: AppKitNetwork;
  metadata: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
  features?: {
    analytics?: boolean;
    email?: boolean;
    socials?: false;
  };
}

// Complete AppKit configuration
export const appKitConfig: AppKitConfig = {
  projectId,
  networks,
  defaultNetwork,
  metadata,
  features: {
    analytics: false, // Keep analytics disabled for privacy
    email: false,     // Keep email login disabled for security
    socials: false,   // Keep social logins disabled for security
  },
};

// Validation function for configuration with production safety
export function validateAppKitConfig(config: AppKitConfig): void {
  const envConfig = getEnvironmentConfig();
  
  if (!config.projectId || config.projectId.length === 0) {
    throw new Error('AppKit configuration error: projectId is required');
  }
  
  if (!config.networks || config.networks.length === 0) {
    throw new Error('AppKit configuration error: at least one network must be configured');
  }
  
  if (!config.metadata.name || config.metadata.name.length === 0) {
    throw new Error('AppKit configuration error: metadata.name is required');
  }
  
  if (!config.metadata.description || config.metadata.description.length === 0) {
    throw new Error('AppKit configuration error: metadata.description is required');
  }
  
  if (!config.metadata.url || config.metadata.url.length === 0) {
    throw new Error('AppKit configuration error: metadata.url is required');
  }
  
  // Production-specific validations
  if (envConfig.isProduction) {
    // Allow both HTTPS URLs and app scheme URLs for mobile apps
    if (!config.metadata.url.startsWith('https://') && !config.metadata.url.startsWith('kinetic://')) {
      throw new Error('Production error: metadata.url must use HTTPS or app scheme (kinetic://) in production');
    }
    
    // Ensure no mock or test data in production
    if (config.metadata.name.toLowerCase().includes('test') || 
        config.metadata.name.toLowerCase().includes('mock')) {
      throw new Error('Production error: test/mock metadata not allowed in production');
    }
    
    // Ensure mainnet is included in production
    const hasMainnet = config.networks.some(network => network.id === 1);
    if (!hasMainnet) {
      console.warn('⚠️ Production warning: Ethereum mainnet not included in supported networks');
    }
  }
}

// Validate configuration on module load
validateAppKitConfig(appKitConfig);