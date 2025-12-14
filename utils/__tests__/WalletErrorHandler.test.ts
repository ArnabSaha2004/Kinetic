/**
 * Tests for WalletErrorHandler
 * Verifies error classification and user-friendly message generation
 */

import { 
  WalletErrorHandler, 
  WalletErrorCategory, 
  classifyWalletError 
} from '../WalletErrorHandler';

describe('WalletErrorHandler', () => {
  let errorHandler: WalletErrorHandler;

  beforeEach(() => {
    errorHandler = WalletErrorHandler.getInstance();
  });

  describe('Error Classification', () => {
    it('should classify user rejection errors correctly', () => {
      const error = new Error('User rejected the request');
      const classified = classifyWalletError(error, 'METAMASK');

      expect(classified.category).toBe(WalletErrorCategory.USER_REJECTED);
      expect(classified.code).toBe('USER_REJECTED');
      expect(classified.retryable).toBe(false);
      expect(classified.walletType).toBe('METAMASK');
      expect(classified.userMessage).toContain('MetaMask Mobile');
    });

    it('should classify network errors correctly', () => {
      const error = new Error('Network connection failed');
      const classified = classifyWalletError(error, 'TRUST_WALLET');

      expect(classified.category).toBe(WalletErrorCategory.NETWORK_ERROR);
      expect(classified.code).toBe('NETWORK_ERROR');
      expect(classified.retryable).toBe(true);
      expect(classified.walletType).toBe('TRUST_WALLET');
      expect(classified.userMessage).toContain('Trust Wallet');
    });

    it('should classify wallet not installed errors correctly', () => {
      const error = new Error('Wallet app not found');
      const classified = classifyWalletError(error, 'COINBASE');

      expect(classified.category).toBe(WalletErrorCategory.WALLET_NOT_INSTALLED);
      expect(classified.code).toBe('WALLET_NOT_INSTALLED');
      expect(classified.retryable).toBe(false);
      expect(classified.walletType).toBe('COINBASE');
      expect(classified.userMessage).toContain('Coinbase Wallet');
    });

    it('should classify timeout errors correctly', () => {
      const error = new Error('Connection timeout');
      const classified = classifyWalletError(error, 'RAINBOW');

      expect(classified.category).toBe(WalletErrorCategory.TIMEOUT_ERROR);
      expect(classified.code).toBe('TIMEOUT_ERROR');
      expect(classified.retryable).toBe(true);
      expect(classified.walletType).toBe('RAINBOW');
      expect(classified.userMessage).toContain('Rainbow Wallet');
    });

    it('should use generic messages for unknown wallet types', () => {
      const error = new Error('User rejected the request');
      const classified = classifyWalletError(error);

      expect(classified.category).toBe(WalletErrorCategory.USER_REJECTED);
      expect(classified.walletType).toBeUndefined();
      expect(classified.userMessage).not.toContain('MetaMask');
      expect(classified.userMessage).toContain('wallet');
    });
  });

  describe('Retry Configuration', () => {
    it('should provide correct retry config for network errors', () => {
      const config = errorHandler.getRetryConfig(WalletErrorCategory.NETWORK_ERROR);

      expect(config.maxAttempts).toBe(3);
      expect(config.baseDelay).toBe(1000);
      expect(config.backoffMultiplier).toBe(2);
    });

    it('should provide no retries for user rejection', () => {
      const config = errorHandler.getRetryConfig(WalletErrorCategory.USER_REJECTED);

      expect(config.maxAttempts).toBe(0);
    });

    it('should provide no retries for wallet not installed', () => {
      const config = errorHandler.getRetryConfig(WalletErrorCategory.WALLET_NOT_INSTALLED);

      expect(config.maxAttempts).toBe(0);
    });
  });

  describe('Retry Attempt Tracking', () => {
    it('should track retry attempts correctly', () => {
      const operationId = 'test_operation';

      expect(errorHandler.getRetryAttempts(operationId)).toBe(0);

      // Simulate retry attempts (this would normally be done by handleNetworkError)
      errorHandler['retryAttempts'].set(operationId, 1);
      expect(errorHandler.getRetryAttempts(operationId)).toBe(1);

      errorHandler.clearRetryAttempts(operationId);
      expect(errorHandler.getRetryAttempts(operationId)).toBe(0);
    });
  });
});