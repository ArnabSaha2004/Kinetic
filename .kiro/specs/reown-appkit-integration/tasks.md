# Implementation Plan

- [x] 1. Update dependencies and configuration





  - Remove legacy wallet dependencies and add proper Reown AppKit packages
  - Update package.json with correct Reown AppKit version for React Native
  - Configure proper project ID and network settings for AppKit
  - _Requirements: 4.1, 4.2, 4.3_


- [x] 2. Create new AppKit provider and configuration



  - [x] 2.1 Create proper AppKit configuration module


    - Write centralized configuration with project ID, networks, and metadata
    - Define supported blockchain networks (Ethereum mainnet and testnets)
    - Set up proper app metadata including name, description, and icons
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 2.2 Write property test for AppKit configuration
    - **Property 1: Configuration validation**
    - **Validates: Requirements 4.1, 4.2, 4.3**

  - [x] 2.3 Create AppKit provider wrapper component







    - Implement provider component that wraps the entire application
    - Configure AppKit with proper settings and error handling
    - Ensure provider makes wallet functionality available throughout component tree
    - _Requirements: 1.1, 4.1_

  - [ ]* 2.4 Write property test for provider functionality
    - **Property 4: Wallet connection persistence**
    - **Validates: Requirements 1.5**


- [x] 3. Remove legacy wallet implementation




  - [x] 3.1 Delete custom MetaMask hook and related files


    - Remove hooks/useMetaMask.ts file completely
    - Remove SecureStore wallet address storage logic
    - Remove manual address entry and deep linking code
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.2 Clean up wallet configuration files







    - Remove or update config/walletConfig.ts to use proper AppKit setup
    - Remove any remaining custom wallet provider components
    - _Requirements: 2.1, 2.5_


- [x] 4. Implement AppKit wallet integration in main app




  - [x] 4.1 Replace wallet hooks in App.tsx


    - Replace useMetaMask hook calls with Reown AppKit hooks
    - Update wallet connection UI to use AppKit modal and components
    - Implement proper wallet state management using AppKit
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 4.2 Write property test for wallet connection workflow
    - **Property 1: Wallet selection initiates connection**
    - **Validates: Requirements 1.2**

  - [ ]* 4.3 Write property test for wallet state display
    - **Property 2: Connected wallet state display**
    - **Validates: Requirements 1.3**

  - [x]* 4.4 Write property test for disconnect functionality


    - **Property 3: Disconnect clears wallet state**

    - **Validates: Requirements 1.4**








  - [ ] 4.5 Update wallet connection UI components

    - Replace custom MetaMask button with AppKit connect button
    - Update connected wallet display to use AppKit wallet info
    - Implement proper disconnect functionality through AppKit
    - _Requirements: 1.1, 1.3, 1.4_

- [x] 5. Integrate AppKit signing with data minting



  - [x] 5.1 Update data minting hook to use AppKit signing

    - Modify useDataMinting hook to work with AppKit wallet signing
    - Replace custom transaction signing with AppKit signing methods
    - Ensure proper error handling for AppKit signing failures
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [-]* 5.2 Write property test for transaction preparation

    - **Property 6: Transaction preparation with wallet**
    - **Validates: Requirements 3.1**

  - [ ]* 5.3 Write property test for AppKit signing interface
    - **Property 7: AppKit signing interface usage**
    - **Validates: Requirements 3.2**

  - [ ]* 5.4 Write property test for signed transaction data
    - **Property 8: Signed transaction data receipt**
    - **Validates: Requirements 3.3**

  - [x] 5.5 Update minting workflow integration





    - Ensure minting button properly checks AppKit wallet connection
    - Update minting process to use AppKit transaction signing
    - Maintain existing IMU data collection and metadata generation
    - _Requirements: 2.4, 3.1, 3.5_

  - [ ]* 5.6 Write property test for IMU functionality preservation
    - **Property 5: IMU functionality preservation**
    - **Validates: Requirements 2.4**


- [x] 6. Add proper error handling and validation




  - [x] 6.1 Implement AppKit error handling


    - Add proper error handling for wallet connection failures
    - Implement user-friendly error messages for signing failures
    - Add validation for wallet connection requirements before minting
    - _Requirements: 3.4, 3.5_

  - [ ]* 6.2 Write property test for error handling
    - **Property 9: Signing error handling**
    - **Validates: Requirements 3.4**

  - [x] 6.3 Add wallet connection guards


    - Prevent minting attempts when no wallet is connected
    - Display connection requirements when wallet is needed
    - Ensure proper UI state for disconnected wallet scenarios
    - _Requirements: 3.5_

- [x] 7. Checkpoint - Ensure all tests pass


  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Test Android functionality and optimization
  - [x] 8.1 Verify Android compatibility and performance


    - Test AppKit functionality on Android builds
    - Ensure wallet connection works properly on Android devices
    - Verify transaction signing works reliably on Android
    - Test app performance and responsiveness on Android
    - _Requirements: 4.5_

  - [ ]* 8.2 Write property test for Android platform optimization
    - **Property 10: Android platform optimization**
    - **Validates: Requirements 4.5**

- [ ] 9. Final cleanup and optimization
  - [x] 9.1 Remove unused dependencies


    - Clean up package.json to remove unused wallet-related packages
    - Ensure only necessary Reown AppKit dependencies remain
    - Update any remaining import statements
    - _Requirements: 2.1, 2.5_

  - [x] 9.2 Update app wrapper and exports


    - Ensure App.tsx properly exports the AppKit-wrapped application
    - Verify all wallet functionality is accessible throughout the app
    - Clean up any remaining legacy wallet code references
    - _Requirements: 1.1, 2.5_

- [x] 10. Final Checkpoint - Ensure all tests pass



  - Ensure all tests pass, ask the user if questions arise.