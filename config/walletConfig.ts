import { mainnet, sepolia } from 'wagmi/chains';
import type { AppKitNetwork } from '@reown/appkit/networks';

// Reown project ID from https://cloud.reown.com
export const projectId = '07a170bf88486fb71b2a46f57605d5f2';

// Validate project ID
if (!projectId) {
  throw new Error('REOWN_PROJECT_ID is required. Get one from https://cloud.reown.com');
}

// App metadata for wallet connection
export const metadata = {
  name: 'Kinetic IMU Dashboard',
  description: 'Collect and mint IMU sensor data as NFTs on the blockchain',
  url: 'https://kinetic-dashboard.app',
  icons: [
    'https://kinetic-dashboard.app/icon-192x192.png',
    'https://kinetic-dashboard.app/icon-512x512.png'
  ]
};

// Supported blockchain networks (Ethereum mainnet and testnets)
export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [
  mainnet,
  sepolia,
];

// Default network for initial connection
export const defaultNetwork = sepolia;

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
    analytics: false, // Disable analytics for privacy
    email: false,     // Disable email login
    socials: false,   // Disable social logins
  },
};

// Validation function for configuration
export function validateAppKitConfig(config: AppKitConfig): void {
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
}

// Validate configuration on module load
validateAppKitConfig(appKitConfig);