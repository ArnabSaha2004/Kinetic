# Design Document

## Overview

This design outlines the replacement of the current fragmented wallet implementation with a clean, standardized Reown AppKit integration for React Native. The solution will remove the custom MetaMask hook, manual address entry, and deep linking logic, replacing them with Reown's AppKit that provides a unified wallet connection experience across multiple wallet providers.

## Architecture

The wallet integration will follow a provider pattern where the Reown AppKit provider wraps the entire application, making wallet functionality available throughout the component tree. The architecture consists of:

1. **AppKit Provider Layer**: Wraps the root application with Reown AppKit context
2. **Wallet Configuration Layer**: Centralizes network, project, and metadata configuration
3. **Application Layer**: Consumes wallet state and functions through AppKit hooks
4. **Data Minting Integration**: Connects wallet signing capabilities with IMU data minting

## Components and Interfaces

### AppKit Provider Component
- Wraps the entire application with Reown AppKit context
- Provides wallet state and functions to child components
- Handles wallet connection persistence and restoration

### Wallet Configuration Module
- Defines supported blockchain networks (Ethereum mainnet, testnets)
- Sets Reown project ID and metadata
- Configures AppKit features and options

### Application Integration Points
- Replace `useMetaMask` hook calls with Reown AppKit hooks
- Update wallet connection UI to use AppKit modal
- Integrate wallet signing with existing minting workflow

### Data Minting Integration
- Connect AppKit wallet signing with transaction preparation
- Maintain existing IMU data collection and metadata generation
- Ensure seamless transition from data collection to NFT minting

## Data Models

### Wallet State Interface
```typescript
interface WalletState {
  isConnected: boolean;
  address: string | undefined;
  chainId: number | undefined;
  isConnecting: boolean;
}
```

### Transaction Data Interface
```typescript
interface TransactionData {
  to: string;
  value?: string;
  data?: string;
  gas?: string;
  gasPrice?: string;
}
```

### AppKit Configuration Interface
```typescript
interface AppKitConfig {
  projectId: string;
  networks: Network[];
  metadata: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
  features?: {
    analytics?: boolean;
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Property 1: Wallet selection initiates connection
*For any* supported wallet selected from the AppKit modal, the connection process should start automatically without requiring additional user actions
**Validates: Requirements 1.2**

Property 2: Connected wallet state display
*For any* successfully connected wallet, the UI should display the wallet address and show connected status consistently
**Validates: Requirements 1.3**

Property 3: Disconnect clears wallet state
*For any* connected wallet, calling disconnect should completely clear all wallet-related state and return to disconnected state
**Validates: Requirements 1.4**

Property 4: Wallet connection persistence
*For any* wallet connection that existed before app restart, the connection should be automatically restored on app startup
**Validates: Requirements 1.5**

Property 5: IMU functionality preservation
*For any* IMU data collection and minting workflow, the functionality should remain identical after wallet integration changes
**Validates: Requirements 2.4**

Property 6: Transaction preparation with wallet
*For any* collected IMU data and connected wallet, requesting minting should prepare a valid transaction using the wallet's capabilities
**Validates: Requirements 3.1**

Property 7: AppKit signing interface usage
*For any* prepared transaction, the signing request should use the Reown AppKit interface rather than custom implementations
**Validates: Requirements 3.2**

Property 8: Signed transaction data receipt
*For any* completed transaction signing, the app should receive properly formatted signed transaction data suitable for blockchain submission
**Validates: Requirements 3.3**

Property 9: Signing error handling
*For any* transaction signing failure, appropriate error messages should be displayed to inform the user of the issue
**Validates: Requirements 3.4**

Property 10: Android platform optimization
*For any* wallet operation on Android devices, the functionality should work reliably and be optimized for Android platform capabilities
**Validates: Requirements 4.5**

## Error Handling

### Wallet Connection Errors
- Network connectivity issues during wallet connection
- Unsupported wallet selection attempts
- AppKit initialization failures
- Invalid project ID or configuration errors

### Transaction Signing Errors
- User rejection of transaction signing
- Insufficient gas or network fees
- Network congestion or timeout issues
- Invalid transaction data format

### State Management Errors
- Wallet state synchronization issues
- Connection persistence failures
- AppKit provider context errors
- Component unmounting during wallet operations

## Testing Strategy

### Unit Testing Approach
Unit tests will focus on:
- AppKit configuration validation
- Wallet state management functions
- Error handling for specific scenarios
- Component integration with AppKit hooks

### Property-Based Testing Approach
Property-based tests will verify:
- Wallet connection and disconnection workflows across different wallet types
- Transaction preparation and signing processes with various data inputs
- State persistence and restoration under different app lifecycle scenarios
- Android platform optimization and reliability

The testing framework will use Jest for unit tests and fast-check for property-based testing. Each property-based test will run a minimum of 100 iterations to ensure comprehensive coverage of the random input space. Property-based tests will be tagged with comments explicitly referencing the correctness properties they implement using the format: **Feature: reown-appkit-integration, Property {number}: {property_text}**.
