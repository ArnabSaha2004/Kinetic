/**
 * Wallet connection guards and validation utilities
 * Provides centralized wallet connection validation and user-friendly error messages
 */

export interface WalletConnectionState {
  isConnected: boolean;
  address?: string;
  hasProvider: boolean;
  status?: string;
}

export interface WalletGuardResult {
  canProceed: boolean;
  errorMessage?: string;
  requirementMessage?: string;
}

/**
 * Validates wallet connection requirements for minting operations
 */
export function validateWalletForMinting(walletState: WalletConnectionState): WalletGuardResult {
  // Check if wallet is connected
  if (!walletState.isConnected) {
    return {
      canProceed: false,
      errorMessage: 'Wallet not connected',
      requirementMessage: 'Please connect your wallet through AppKit to mint IMU data as NFTs'
    };
  }

  // Check if wallet address is available
  if (!walletState.address) {
    return {
      canProceed: false,
      errorMessage: 'Wallet address not available',
      requirementMessage: 'Wallet address is required for minting. Please reconnect your wallet.'
    };
  }

  // Check if wallet provider is available
  if (!walletState.hasProvider) {
    return {
      canProceed: false,
      errorMessage: 'Wallet provider not available',
      requirementMessage: 'Wallet provider is required for signing transactions. Please reconnect your wallet.'
    };
  }

  // Check wallet connection status
  if (walletState.status === 'connecting') {
    return {
      canProceed: false,
      errorMessage: 'Wallet connection in progress',
      requirementMessage: 'Please wait for wallet connection to complete before minting.'
    };
  }

  if (walletState.status === 'disconnected') {
    return {
      canProceed: false,
      errorMessage: 'Wallet disconnected',
      requirementMessage: 'Wallet connection lost. Please reconnect your wallet to continue.'
    };
  }

  // All checks passed
  return {
    canProceed: true
  };
}

/**
 * Validates wallet connection requirements for data collection operations
 */
export function validateWalletForCollection(walletState: WalletConnectionState): WalletGuardResult {
  // Data collection doesn't require wallet connection, but we can provide helpful hints
  if (!walletState.isConnected) {
    return {
      canProceed: true,
      requirementMessage: 'Tip: Connect your wallet before collecting data to streamline the minting process'
    };
  }

  return {
    canProceed: true
  };
}

/**
 * Validates data requirements for minting operations
 */
export function validateDataForMinting(collectedData: any[], isCollecting: boolean): WalletGuardResult {
  // Check if currently collecting
  if (isCollecting) {
    return {
      canProceed: false,
      errorMessage: 'Data collection in progress',
      requirementMessage: 'Please stop data collection before minting. You cannot mint while actively collecting data.'
    };
  }

  // Check if any data is collected
  if (!collectedData || collectedData.length === 0) {
    return {
      canProceed: false,
      errorMessage: 'No data collected',
      requirementMessage: 'Please collect IMU sensor data first. Start data collection and gather some sensor readings.'
    };
  }

  // Check minimum data requirements
  if (collectedData.length < 5) {
    return {
      canProceed: false,
      errorMessage: 'Insufficient data points',
      requirementMessage: `You have ${collectedData.length} data points. Please collect at least 5 data points for a valid NFT.`
    };
  }

  // All checks passed
  return {
    canProceed: true
  };
}

/**
 * Validates device connection requirements
 */
export function validateDeviceConnection(isConnected: boolean, hasStaleData: boolean): WalletGuardResult {
  if (!isConnected) {
    return {
      canProceed: false,
      errorMessage: 'Device not connected',
      requirementMessage: 'Please connect to a Kinetic device first to collect IMU sensor data.'
    };
  }

  if (hasStaleData) {
    return {
      canProceed: false,
      errorMessage: 'Device connection unstable',
      requirementMessage: 'Device data appears stale. Please reconnect to your Kinetic device for fresh data.'
    };
  }

  return {
    canProceed: true
  };
}

/**
 * Comprehensive validation for the complete minting workflow
 */
export function validateMintingWorkflow(
  walletState: WalletConnectionState,
  collectedData: any[],
  isCollecting: boolean,
  deviceConnected: boolean,
  hasStaleData: boolean
): WalletGuardResult {
  // Check device connection first
  const deviceValidation = validateDeviceConnection(deviceConnected, hasStaleData);
  if (!deviceValidation.canProceed) {
    return deviceValidation;
  }

  // Check data requirements
  const dataValidation = validateDataForMinting(collectedData, isCollecting);
  if (!dataValidation.canProceed) {
    return dataValidation;
  }

  // Check wallet requirements
  const walletValidation = validateWalletForMinting(walletState);
  if (!walletValidation.canProceed) {
    return walletValidation;
  }

  // All validations passed
  return {
    canProceed: true
  };
}

/**
 * Gets user-friendly status message for wallet connection
 */
export function getWalletStatusMessage(walletState: WalletConnectionState): string {
  if (!walletState.isConnected) {
    return 'Wallet not connected - Connect to mint IMU data';
  }

  if (walletState.status === 'connecting') {
    return 'Connecting to wallet...';
  }

  if (walletState.status === 'disconnected') {
    return 'Wallet disconnected - Please reconnect';
  }

  if (!walletState.address) {
    return 'Wallet connected but address unavailable';
  }

  if (!walletState.hasProvider) {
    return 'Wallet connected but provider unavailable';
  }

  return `Wallet connected: ${walletState.address.slice(0, 6)}...${walletState.address.slice(-4)}`;
}

/**
 * Validates requirements for simulation (no wallet needed)
 */
export function validateSimulationWorkflow(
  collectedData: any[],
  isCollecting: boolean,
  deviceConnected: boolean,
  hasStaleData: boolean
): WalletGuardResult {
  // Check device connection first
  const deviceValidation = validateDeviceConnection(deviceConnected, hasStaleData);
  if (!deviceValidation.canProceed) {
    return deviceValidation;
  }

  // Check data requirements (same as minting)
  const dataValidation = validateDataForMinting(collectedData, isCollecting);
  if (!dataValidation.canProceed) {
    return dataValidation;
  }

  // Simulation doesn't require wallet - all checks passed
  return {
    canProceed: true
  };
}

/**
 * Gets user-friendly status message for data collection
 */
export function getDataCollectionStatusMessage(
  collectedData: any[],
  isCollecting: boolean,
  collectionDuration: number
): string {
  if (isCollecting) {
    const seconds = Math.round(collectionDuration / 1000);
    return `Collecting data: ${collectedData.length} points in ${seconds}s`;
  }

  if (collectedData.length === 0) {
    return 'No data collected - Start collection to gather IMU data';
  }

  if (collectedData.length < 5) {
    return `${collectedData.length} data points - Need at least 5 to mint`;
  }

  return `${collectedData.length} data points ready for minting`;
}