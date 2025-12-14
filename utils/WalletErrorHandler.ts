/**
 * Enhanced wallet-specific error handling utilities
 * Provides comprehensive error classification, user-friendly messages, and retry mechanisms
 */

import { Alert, Linking } from 'react-native';
import { WALLET_CONFIGS, WalletType } from './DeepLinkHandler';

// Wallet error categories
export enum WalletErrorCategory {
  WALLET_NOT_INSTALLED = 'WALLET_NOT_INSTALLED',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  USER_REJECTED = 'USER_REJECTED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  UNSUPPORTED_OPERATION = 'UNSUPPORTED_OPERATION',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Enhanced wallet error interface
export interface WalletError {
  category: WalletErrorCategory;
  code: string;
  message: string;
  userMessage: string;
  walletType?: WalletType;
  retryable: boolean;
  retryDelay?: number; // milliseconds
  maxRetries?: number;
  originalError?: any;
  timestamp: number;
  context?: Record<string, any>;
}

// Retry configuration
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
}

// Default retry configurations for different error types
const DEFAULT_RETRY_CONFIGS: Record<WalletErrorCategory, RetryConfig> = {
  [WalletErrorCategory.NETWORK_ERROR]: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  },
  [WalletErrorCategory.TIMEOUT_ERROR]: {
    maxAttempts: 2,
    baseDelay: 2000,
    maxDelay: 5000,
    backoffMultiplier: 1.5
  },
  [WalletErrorCategory.CONNECTION_FAILED]: {
    maxAttempts: 2,
    baseDelay: 1500,
    maxDelay: 3000,
    backoffMultiplier: 2
  },
  [WalletErrorCategory.SESSION_EXPIRED]: {
    maxAttempts: 1,
    baseDelay: 0,
    maxDelay: 0,
    backoffMultiplier: 1
  },
  [WalletErrorCategory.WALLET_NOT_INSTALLED]: {
    maxAttempts: 0,
    baseDelay: 0,
    maxDelay: 0,
    backoffMultiplier: 1
  },
  [WalletErrorCategory.USER_REJECTED]: {
    maxAttempts: 0,
    baseDelay: 0,
    maxDelay: 0,
    backoffMultiplier: 1
  },
  [WalletErrorCategory.TRANSACTION_FAILED]: {
    maxAttempts: 1,
    baseDelay: 1000,
    maxDelay: 1000,
    backoffMultiplier: 1
  },
  [WalletErrorCategory.INSUFFICIENT_FUNDS]: {
    maxAttempts: 0,
    baseDelay: 0,
    maxDelay: 0,
    backoffMultiplier: 1
  },
  [WalletErrorCategory.UNSUPPORTED_OPERATION]: {
    maxAttempts: 0,
    baseDelay: 0,
    maxDelay: 0,
    backoffMultiplier: 1
  },
  [WalletErrorCategory.UNKNOWN_ERROR]: {
    maxAttempts: 1,
    baseDelay: 2000,
    maxDelay: 2000,
    backoffMultiplier: 1
  }
};

// Wallet-specific error messages
const WALLET_SPECIFIC_MESSAGES: Record<WalletType, Record<WalletErrorCategory, string>> = {
  METAMASK: {
    [WalletErrorCategory.WALLET_NOT_INSTALLED]: 'MetaMask Mobile is not installed. Please install it from the Google Play Store to connect your wallet.',
    [WalletErrorCategory.CONNECTION_FAILED]: 'Failed to connect to MetaMask Mobile. Please ensure the app is updated and try again.',
    [WalletErrorCategory.USER_REJECTED]: 'Connection was cancelled in MetaMask Mobile. Please try again and approve the connection.',
    [WalletErrorCategory.NETWORK_ERROR]: 'Network error while connecting to MetaMask Mobile. Please check your internet connection.',
    [WalletErrorCategory.SESSION_EXPIRED]: 'Your MetaMask Mobile session has expired. Please reconnect your wallet.',
    [WalletErrorCategory.TRANSACTION_FAILED]: 'Transaction failed in MetaMask Mobile. Please check your wallet and try again.',
    [WalletErrorCategory.INSUFFICIENT_FUNDS]: 'Insufficient funds in your MetaMask Mobile wallet. Please add funds and try again.',
    [WalletErrorCategory.UNSUPPORTED_OPERATION]: 'This operation is not supported by MetaMask Mobile. Please try a different wallet.',
    [WalletErrorCategory.TIMEOUT_ERROR]: 'MetaMask Mobile connection timed out. Please try again.',
    [WalletErrorCategory.UNKNOWN_ERROR]: 'An unexpected error occurred with MetaMask Mobile. Please try again.'
  },
  TRUST_WALLET: {
    [WalletErrorCategory.WALLET_NOT_INSTALLED]: 'Trust Wallet is not installed. Please install it from the Google Play Store to connect your wallet.',
    [WalletErrorCategory.CONNECTION_FAILED]: 'Failed to connect to Trust Wallet. Please ensure the app is updated and try again.',
    [WalletErrorCategory.USER_REJECTED]: 'Connection was cancelled in Trust Wallet. Please try again and approve the connection.',
    [WalletErrorCategory.NETWORK_ERROR]: 'Network error while connecting to Trust Wallet. Please check your internet connection.',
    [WalletErrorCategory.SESSION_EXPIRED]: 'Your Trust Wallet session has expired. Please reconnect your wallet.',
    [WalletErrorCategory.TRANSACTION_FAILED]: 'Transaction failed in Trust Wallet. Please check your wallet and try again.',
    [WalletErrorCategory.INSUFFICIENT_FUNDS]: 'Insufficient funds in your Trust Wallet. Please add funds and try again.',
    [WalletErrorCategory.UNSUPPORTED_OPERATION]: 'This operation is not supported by Trust Wallet. Please try a different wallet.',
    [WalletErrorCategory.TIMEOUT_ERROR]: 'Trust Wallet connection timed out. Please try again.',
    [WalletErrorCategory.UNKNOWN_ERROR]: 'An unexpected error occurred with Trust Wallet. Please try again.'
  },
  COINBASE: {
    [WalletErrorCategory.WALLET_NOT_INSTALLED]: 'Coinbase Wallet is not installed. Please install it from the Google Play Store to connect your wallet.',
    [WalletErrorCategory.CONNECTION_FAILED]: 'Failed to connect to Coinbase Wallet. Please ensure the app is updated and try again.',
    [WalletErrorCategory.USER_REJECTED]: 'Connection was cancelled in Coinbase Wallet. Please try again and approve the connection.',
    [WalletErrorCategory.NETWORK_ERROR]: 'Network error while connecting to Coinbase Wallet. Please check your internet connection.',
    [WalletErrorCategory.SESSION_EXPIRED]: 'Your Coinbase Wallet session has expired. Please reconnect your wallet.',
    [WalletErrorCategory.TRANSACTION_FAILED]: 'Transaction failed in Coinbase Wallet. Please check your wallet and try again.',
    [WalletErrorCategory.INSUFFICIENT_FUNDS]: 'Insufficient funds in your Coinbase Wallet. Please add funds and try again.',
    [WalletErrorCategory.UNSUPPORTED_OPERATION]: 'This operation is not supported by Coinbase Wallet. Please try a different wallet.',
    [WalletErrorCategory.TIMEOUT_ERROR]: 'Coinbase Wallet connection timed out. Please try again.',
    [WalletErrorCategory.UNKNOWN_ERROR]: 'An unexpected error occurred with Coinbase Wallet. Please try again.'
  },
  RAINBOW: {
    [WalletErrorCategory.WALLET_NOT_INSTALLED]: 'Rainbow Wallet is not installed. Please install it from the Google Play Store to connect your wallet.',
    [WalletErrorCategory.CONNECTION_FAILED]: 'Failed to connect to Rainbow Wallet. Please ensure the app is updated and try again.',
    [WalletErrorCategory.USER_REJECTED]: 'Connection was cancelled in Rainbow Wallet. Please try again and approve the connection.',
    [WalletErrorCategory.NETWORK_ERROR]: 'Network error while connecting to Rainbow Wallet. Please check your internet connection.',
    [WalletErrorCategory.SESSION_EXPIRED]: 'Your Rainbow Wallet session has expired. Please reconnect your wallet.',
    [WalletErrorCategory.TRANSACTION_FAILED]: 'Transaction failed in Rainbow Wallet. Please check your wallet and try again.',
    [WalletErrorCategory.INSUFFICIENT_FUNDS]: 'Insufficient funds in your Rainbow Wallet. Please add funds and try again.',
    [WalletErrorCategory.UNSUPPORTED_OPERATION]: 'This operation is not supported by Rainbow Wallet. Please try a different wallet.',
    [WalletErrorCategory.TIMEOUT_ERROR]: 'Rainbow Wallet connection timed out. Please try again.',
    [WalletErrorCategory.UNKNOWN_ERROR]: 'An unexpected error occurred with Rainbow Wallet. Please try again.'
  }
};

// Generic error messages for unknown wallets
const GENERIC_ERROR_MESSAGES: Record<WalletErrorCategory, string> = {
  [WalletErrorCategory.WALLET_NOT_INSTALLED]: 'The selected wallet is not installed. Please install it from the app store.',
  [WalletErrorCategory.CONNECTION_FAILED]: 'Failed to connect to your wallet. Please ensure the wallet app is updated and try again.',
  [WalletErrorCategory.USER_REJECTED]: 'Connection was cancelled in your wallet. Please try again and approve the connection.',
  [WalletErrorCategory.NETWORK_ERROR]: 'Network error while connecting to your wallet. Please check your internet connection.',
  [WalletErrorCategory.SESSION_EXPIRED]: 'Your wallet session has expired. Please reconnect your wallet.',
  [WalletErrorCategory.TRANSACTION_FAILED]: 'Transaction failed in your wallet. Please check your wallet and try again.',
  [WalletErrorCategory.INSUFFICIENT_FUNDS]: 'Insufficient funds in your wallet. Please add funds and try again.',
  [WalletErrorCategory.UNSUPPORTED_OPERATION]: 'This operation is not supported by your wallet. Please try a different wallet.',
  [WalletErrorCategory.TIMEOUT_ERROR]: 'Wallet connection timed out. Please try again.',
  [WalletErrorCategory.UNKNOWN_ERROR]: 'An unexpected error occurred with your wallet. Please try again.'
};

/**
 * Enhanced wallet error handler class
 */
export class WalletErrorHandler {
  private static instance: WalletErrorHandler;
  private retryAttempts: Map<string, number> = new Map();

  private constructor() {}

  public static getInstance(): WalletErrorHandler {
    if (!WalletErrorHandler.instance) {
      WalletErrorHandler.instance = new WalletErrorHandler();
    }
    return WalletErrorHandler.instance;
  }

  /**
   * Classify and enhance error with wallet-specific information
   */
  public classifyError(error: any, walletType?: WalletType, context?: Record<string, any>): WalletError {
    const timestamp = Date.now();
    let category = WalletErrorCategory.UNKNOWN_ERROR;
    let code = 'UNKNOWN';
    let message = error?.message || 'Unknown error occurred';

    // Classify error based on error message and code
    if (error?.code === 4001 || message.toLowerCase().includes('user rejected') || message.toLowerCase().includes('user denied')) {
      category = WalletErrorCategory.USER_REJECTED;
      code = 'USER_REJECTED';
    } else if (message.toLowerCase().includes('not installed') || message.toLowerCase().includes('app not found')) {
      category = WalletErrorCategory.WALLET_NOT_INSTALLED;
      code = 'WALLET_NOT_INSTALLED';
    } else if (message.toLowerCase().includes('network') || message.toLowerCase().includes('connection') || error?.code === 'NETWORK_ERROR') {
      category = WalletErrorCategory.NETWORK_ERROR;
      code = 'NETWORK_ERROR';
    } else if (message.toLowerCase().includes('timeout') || error?.code === 'TIMEOUT') {
      category = WalletErrorCategory.TIMEOUT_ERROR;
      code = 'TIMEOUT_ERROR';
    } else if (message.toLowerCase().includes('session') || message.toLowerCase().includes('expired')) {
      category = WalletErrorCategory.SESSION_EXPIRED;
      code = 'SESSION_EXPIRED';
    } else if (message.toLowerCase().includes('insufficient') || message.toLowerCase().includes('balance')) {
      category = WalletErrorCategory.INSUFFICIENT_FUNDS;
      code = 'INSUFFICIENT_FUNDS';
    } else if (message.toLowerCase().includes('unsupported') || message.toLowerCase().includes('not supported')) {
      category = WalletErrorCategory.UNSUPPORTED_OPERATION;
      code = 'UNSUPPORTED_OPERATION';
    } else if (message.toLowerCase().includes('transaction') || message.toLowerCase().includes('tx')) {
      category = WalletErrorCategory.TRANSACTION_FAILED;
      code = 'TRANSACTION_FAILED';
    } else if (message.toLowerCase().includes('connect') || message.toLowerCase().includes('connection')) {
      category = WalletErrorCategory.CONNECTION_FAILED;
      code = 'CONNECTION_FAILED';
    }

    // Get wallet-specific or generic user message
    const userMessage = this.getUserMessage(category, walletType);
    
    // Get retry configuration
    const retryConfig = DEFAULT_RETRY_CONFIGS[category];
    
    return {
      category,
      code,
      message,
      userMessage,
      walletType,
      retryable: retryConfig.maxAttempts > 0,
      retryDelay: retryConfig.baseDelay,
      maxRetries: retryConfig.maxAttempts,
      originalError: error,
      timestamp,
      context
    };
  }

  /**
   * Get user-friendly error message
   */
  private getUserMessage(category: WalletErrorCategory, walletType?: WalletType): string {
    if (walletType && WALLET_SPECIFIC_MESSAGES[walletType]) {
      return WALLET_SPECIFIC_MESSAGES[walletType][category];
    }
    return GENERIC_ERROR_MESSAGES[category];
  }

  /**
   * Handle wallet not installed error with installation prompt
   */
  public async handleWalletNotInstalled(walletType: WalletType): Promise<boolean> {
    const config = WALLET_CONFIGS[walletType];
    
    return new Promise((resolve) => {
      Alert.alert(
        `${walletType} Not Installed`,
        `${walletType} is required to connect your wallet. Would you like to install it from the Google Play Store?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Install',
            onPress: async () => {
              try {
                await Linking.openURL(config.appStoreUrl);
                resolve(true);
              } catch (error) {
                console.error(`❌ Error opening app store for ${walletType}:`, error);
                resolve(false);
              }
            },
          },
        ]
      );
    });
  }

  /**
   * Handle network-related errors with retry mechanism
   */
  public async handleNetworkError(
    error: WalletError,
    retryFunction: () => Promise<any>,
    operationId: string
  ): Promise<any> {
    const currentAttempts = this.retryAttempts.get(operationId) || 0;
    
    if (currentAttempts >= (error.maxRetries || 0)) {
      this.retryAttempts.delete(operationId);
      throw error;
    }

    // Calculate delay with exponential backoff
    const retryConfig = DEFAULT_RETRY_CONFIGS[error.category];
    const delay = Math.min(
      retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, currentAttempts),
      retryConfig.maxDelay
    );

    console.log(`🔄 Retrying operation ${operationId} in ${delay}ms (attempt ${currentAttempts + 1}/${error.maxRetries})`);

    // Wait for delay
    await new Promise(resolve => setTimeout(resolve, delay));

    // Increment retry count
    this.retryAttempts.set(operationId, currentAttempts + 1);

    try {
      const result = await retryFunction();
      // Success - clear retry count
      this.retryAttempts.delete(operationId);
      return result;
    } catch (retryError) {
      // Classify the retry error
      const classifiedRetryError = this.classifyError(retryError, error.walletType);
      
      // If it's still a network error, continue retrying
      if (classifiedRetryError.category === WalletErrorCategory.NETWORK_ERROR) {
        return this.handleNetworkError(classifiedRetryError, retryFunction, operationId);
      } else {
        // Different error type - stop retrying
        this.retryAttempts.delete(operationId);
        throw classifiedRetryError;
      }
    }
  }

  /**
   * Show user-friendly error alert with appropriate actions
   */
  public showErrorAlert(error: WalletError, onRetry?: () => void, onCancel?: () => void): void {
    const actions: any[] = [];

    // Add retry button if error is retryable and retry function is provided
    if (error.retryable && onRetry) {
      actions.push({
        text: 'Retry',
        onPress: onRetry,
      });
    }

    // Add install button for wallet not installed errors
    if (error.category === WalletErrorCategory.WALLET_NOT_INSTALLED && error.walletType) {
      actions.push({
        text: 'Install Wallet',
        onPress: () => this.handleWalletNotInstalled(error.walletType!),
      });
    }

    // Add cancel/ok button
    actions.push({
      text: error.retryable ? 'Cancel' : 'OK',
      style: 'cancel',
      onPress: onCancel,
    });

    Alert.alert(
      'Wallet Error',
      error.userMessage,
      actions
    );
  }

  /**
   * Get retry configuration for error category
   */
  public getRetryConfig(category: WalletErrorCategory): RetryConfig {
    return DEFAULT_RETRY_CONFIGS[category];
  }

  /**
   * Clear retry attempts for an operation
   */
  public clearRetryAttempts(operationId: string): void {
    this.retryAttempts.delete(operationId);
  }

  /**
   * Get current retry attempt count for an operation
   */
  public getRetryAttempts(operationId: string): number {
    return this.retryAttempts.get(operationId) || 0;
  }
}

// Export singleton instance
export const walletErrorHandler = WalletErrorHandler.getInstance();

// Export utility functions
export const classifyWalletError = (error: any, walletType?: WalletType, context?: Record<string, any>) => 
  walletErrorHandler.classifyError(error, walletType, context);

export const handleWalletNotInstalled = (walletType: WalletType) => 
  walletErrorHandler.handleWalletNotInstalled(walletType);

export const showWalletErrorAlert = (error: WalletError, onRetry?: () => void, onCancel?: () => void) => 
  walletErrorHandler.showErrorAlert(error, onRetry, onCancel);