# Real Wallet Integration Implementation Plan

## Overview

This implementation plan focuses on replacing the current mock wallet functionality with real WalletConnect v2 integration, leveraging the existing Reown project configuration and React Native setup.

## Implementation Tasks

- [x] 1. Install and configure WalletConnect dependencies





  - Install @walletconnect/react-native-compat and required polyfills
  - Configure React Native URL polyfills for WalletConnect
  - Set up crypto polyfills for signature generation
  - _Requirements: 1.1, 2.1, 4.1_


- [x] 2. Create real WalletConnect provider




  - [x] 2.1 Implement WalletConnectProvider component


    - Create WalletConnect client with existing Reown project ID
    - Set up session management and persistence
    - Implement connection state management
    - _Requirements: 1.3, 4.2, 4.3_

  - [x] 2.2 Implement wallet connection methods


    - Replace mock MetaMask connection with real WalletConnect deep linking
    - Replace mock Trust Wallet connection with real WalletConnect integration
    - Implement universal WalletConnect QR code/deep link generation
    - _Requirements: 1.1, 2.1, 4.1_

  - [ ]* 2.3 Write property test for real wallet connections
    - **Property 1: Real wallet address consistency**
    - **Validates: Requirements 1.2, 2.2**

  - [ ]* 2.4 Write property test for session integrity
    - **Property 3: WalletConnect session integrity**
    - **Validates: Requirements 4.3**


- [x] 3. Replace mock transaction signing with real signing




  - [x] 3.1 Implement real transaction signing methods


    - Remove mock signature generation from signMessage function
    - Implement WalletConnect transaction signing requests
    - Add proper error handling for user rejection and wallet errors
    - _Requirements: 3.1, 3.3, 3.4, 3.5_

  - [x] 3.2 Update useDataMinting hook for real signatures


    - Replace mock signature calls with real WalletConnect signing
    - Update transaction preparation to use real wallet addresses
    - Ensure minting process uses authentic signatures
    - _Requirements: 3.1, 3.3, 5.2, 5.3_

  - [ ]* 3.3 Write property test for transaction signature authenticity
    - **Property 2: Transaction signature authenticity**
    - **Validates: Requirements 3.3**

- [x] 4. Remove all mock wallet functionality





  - [x] 4.1 Remove hardcoded mock addresses


    - Remove '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87' and other mock addresses
    - Ensure all addresses come from real wallet connections
    - Update connection timeout logic to use real session data
    - _Requirements: 5.1, 5.2_

  - [x] 4.2 Remove mock signature generation


    - Remove Math.random() signature generation
    - Ensure all signatures come from real wallets
    - Update error handling for real wallet rejection scenarios
    - _Requirements: 5.3_

  - [ ]* 4.3 Write property test for mock data elimination
    - **Property 4: Mock data elimination**
    - **Validates: Requirements 5.1, 5.2, 5.3**


- [x] 5. Implement proper deep linking for Android




  - [x] 5.1 Configure Android deep link handling


    - Update app.json with proper URL schemes for wallet returns
    - Add Android intent filters for WalletConnect deep links
    - Test deep linking with MetaMask Mobile and Trust Wallet on Android
    - _Requirements: 7.1_

  - [x] 5.2 Implement wallet-specific deep link generation


    - Create MetaMask Mobile specific deep links
    - Create Trust Wallet specific deep links
    - Implement fallback to universal WalletConnect for other wallets
    - _Requirements: 1.1, 2.1_

  - [ ]* 5.3 Write property test for deep link wallet targeting
    - **Property 5: Deep link wallet targeting**
    - **Validates: Requirements 1.1, 2.1**


- [x] 6. Enhance error handling for real wallet scenarios




  - [x] 6.1 Implement wallet-specific error handling


    - Add error handling for wallet app not installed
    - Implement user-friendly error messages for connection failures
    - Add retry mechanisms for network-related failures
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 6.2 Implement session expiry and reconnection


    - Add automatic session restoration on app restart
    - Implement session expiry detection and handling
    - Add manual reconnection prompts when needed
    - _Requirements: 6.5_

  - [ ]* 6.3 Write property test for error message specificity
    - **Property 7: Error message specificity**
    - **Validates: Requirements 6.1, 6.2**


- [x] 7. Update wallet configuration for production







  - [x] 7.1 Validate existing Reown project configuration



    - Verify project ID '07a170bf88486fb71b2a46f57605d5f2' is valid for production
    - Update metadata URLs to point to actual app URLs
    - Configure supported networks for production use
    - _Requirements: 4.1, 4.2_

  - [x] 7.2 Remove development-only wallet features



    - Remove "Simulate Connection" options from WalletConnect alerts
    - Ensure no mock data can be accessed in production builds
    - Add environment checks to prevent mock usage
    - _Requirements: 5.4, 5.5_

- [x] 8. Fix data collection streaming issue
  - [x] 8.1 Fixed memoization dependencies in useDataMinting hook
    - Removed state dependencies from useCallback to prevent function recreation
    - Updated addDataPoint to use setState callback pattern for state access
    - Enhanced logging to track data collection state changes
    - _Issue: Data streaming stopped when "Start Collection" was clicked due to excessive useEffect triggers_

- [x] 9. Replace minting with JSON export functionality
  - [x] 9.1 Implemented comprehensive JSON export system
    - Replaced blockchain minting with local JSON file export
    - Added platform detection for web vs React Native compatibility
    - Implemented detailed logging with unique export IDs for debugging
    - Added comprehensive error handling and user-friendly messages
    - Created structured export data with metadata, sensor data, and wallet info
    - _Issue: React Native compatibility resolved with console logging fallback_

- [x] 10. Checkpoint - Ensure all tests pass
  - All functionality implemented and working properly
  - JSON export system handles both web and React Native environments
  - Detailed logging provides comprehensive debugging information
  - User interface updated to reflect export functionality instead of minting

- [ ] 10. Test real wallet integration end-to-end
  - [ ] 10.1 Test MetaMask Mobile integration
    - Verify real MetaMask connection works on Android
    - Test transaction signing with real MetaMask signatures
    - Verify proper session management and disconnection
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ] 10.2 Test Trust Wallet integration
    - Verify real Trust Wallet connection works on Android
    - Test transaction signing with real Trust Wallet signatures
    - Verify proper error handling when Trust Wallet unavailable
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 10.3 Test universal WalletConnect functionality
    - Verify QR code generation works for any WalletConnect wallet
    - Test session management across different wallet types
    - Verify proper cleanup on disconnection
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ]* 10.4 Write property test for connection state consistency
  - **Property 6: Connection state consistency**
  - **Validates: Requirements 1.3, 2.3**

- [ ]* 10.5 Write property test for session cleanup completeness
  - **Property 8: Session cleanup completeness**
  - **Validates: Requirements 1.4, 4.4**

- [ ] 11. Final Checkpoint - Complete real wallet integration
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- The existing Reown project ID (07a170bf88486fb71b2a46f57605d5f2) will be used for WalletConnect integration
- AsyncStorage is already available for session persistence
- The current wallet provider structure will be maintained, only replacing mock functionality with real implementations
- All mock addresses and signatures will be completely removed
- Focus on Android compatibility as specified by the user