/**
 * Tests for SessionManager
 * Verifies session state management and expiry detection
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SessionManager, SESSION_STORAGE_KEYS } from '../SessionManager';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock AppState
jest.mock('react-native', () => ({
  AppState: {
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  Alert: {
    alert: jest.fn(),
  },
  Linking: {
    openURL: jest.fn(),
  },
}));

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

  beforeEach(() => {
    jest.clearAllMocks();
    sessionManager = SessionManager.getInstance();
  });

  describe('Session Storage', () => {
    it('should store session data correctly', async () => {
      const mockSession = {
        topic: 'test-topic',
        accounts: ['0x123'],
        chainId: 1,
        expiry: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      };

      await sessionManager.storeSession(mockSession, 'METAMASK', '0x123');

      expect(mockAsyncStorage.multiSet).toHaveBeenCalledWith([
        [SESSION_STORAGE_KEYS.SESSION, JSON.stringify(mockSession)],
        [SESSION_STORAGE_KEYS.WALLET_TYPE, 'METAMASK'],
        [SESSION_STORAGE_KEYS.LAST_ADDRESS, '0x123'],
        [SESSION_STORAGE_KEYS.SESSION_EXPIRY, expect.any(String)],
        [SESSION_STORAGE_KEYS.LAST_SUCCESSFUL_CONNECTION, expect.any(String)],
      ]);
    });
  });

  describe('Session State', () => {
    it('should return valid session state for non-expired session', async () => {
      const futureExpiry = Date.now() + 3600000; // 1 hour from now
      const mockSession = { topic: 'test', accounts: ['0x123'] };

      mockAsyncStorage.multiGet.mockResolvedValue([
        [SESSION_STORAGE_KEYS.SESSION, JSON.stringify(mockSession)],
        [SESSION_STORAGE_KEYS.SESSION_EXPIRY, futureExpiry.toString()],
        [SESSION_STORAGE_KEYS.AUTO_RECONNECT_ENABLED, 'true'],
        [SESSION_STORAGE_KEYS.LAST_SUCCESSFUL_CONNECTION, Date.now().toString()],
      ]);

      const sessionState = await sessionManager.getSessionState();

      expect(sessionState.isValid).toBe(true);
      expect(sessionState.isExpired).toBe(false);
      expect(sessionState.shouldAutoReconnect).toBe(true);
      expect(sessionState.timeUntilExpiry).toBeGreaterThan(0);
    });

    it('should return expired session state for past expiry', async () => {
      const pastExpiry = Date.now() - 3600000; // 1 hour ago
      const mockSession = { topic: 'test', accounts: ['0x123'] };

      mockAsyncStorage.multiGet.mockResolvedValue([
        [SESSION_STORAGE_KEYS.SESSION, JSON.stringify(mockSession)],
        [SESSION_STORAGE_KEYS.SESSION_EXPIRY, pastExpiry.toString()],
        [SESSION_STORAGE_KEYS.AUTO_RECONNECT_ENABLED, 'false'],
        [SESSION_STORAGE_KEYS.LAST_SUCCESSFUL_CONNECTION, Date.now().toString()],
      ]);

      const sessionState = await sessionManager.getSessionState();

      expect(sessionState.isValid).toBe(true);
      expect(sessionState.isExpired).toBe(true);
      expect(sessionState.shouldAutoReconnect).toBe(false);
      expect(sessionState.timeUntilExpiry).toBe(0);
    });

    it('should return invalid session state when no session exists', async () => {
      mockAsyncStorage.multiGet.mockResolvedValue([
        [SESSION_STORAGE_KEYS.SESSION, null],
        [SESSION_STORAGE_KEYS.SESSION_EXPIRY, null],
        [SESSION_STORAGE_KEYS.AUTO_RECONNECT_ENABLED, null],
        [SESSION_STORAGE_KEYS.LAST_SUCCESSFUL_CONNECTION, null],
      ]);

      const sessionState = await sessionManager.getSessionState();

      expect(sessionState.isValid).toBe(false);
      expect(sessionState.isExpired).toBe(true);
      expect(sessionState.shouldAutoReconnect).toBe(false);
      expect(sessionState.timeUntilExpiry).toBeNull();
    });
  });

  describe('Session Restoration', () => {
    it('should successfully restore valid session', async () => {
      const futureExpiry = Date.now() + 3600000; // 1 hour from now
      const mockSession = { topic: 'test', accounts: ['0x123'], chainId: 1 };

      // Mock getSessionState to return valid session
      mockAsyncStorage.multiGet
        .mockResolvedValueOnce([
          [SESSION_STORAGE_KEYS.SESSION, JSON.stringify(mockSession)],
          [SESSION_STORAGE_KEYS.SESSION_EXPIRY, futureExpiry.toString()],
          [SESSION_STORAGE_KEYS.AUTO_RECONNECT_ENABLED, 'true'],
          [SESSION_STORAGE_KEYS.LAST_SUCCESSFUL_CONNECTION, Date.now().toString()],
        ])
        .mockResolvedValueOnce([
          [SESSION_STORAGE_KEYS.SESSION, JSON.stringify(mockSession)],
          [SESSION_STORAGE_KEYS.WALLET_TYPE, 'METAMASK'],
          [SESSION_STORAGE_KEYS.LAST_ADDRESS, '0x123'],
        ]);

      const result = await sessionManager.checkSessionRestoration();

      expect(result.success).toBe(true);
      expect(result.session).toEqual(mockSession);
      expect(result.walletType).toBe('METAMASK');
      expect(result.address).toBe('0x123');
    });

    it('should fail to restore expired session', async () => {
      const pastExpiry = Date.now() - 3600000; // 1 hour ago

      mockAsyncStorage.multiGet.mockResolvedValue([
        [SESSION_STORAGE_KEYS.SESSION, JSON.stringify({ topic: 'test' })],
        [SESSION_STORAGE_KEYS.SESSION_EXPIRY, pastExpiry.toString()],
        [SESSION_STORAGE_KEYS.AUTO_RECONNECT_ENABLED, 'true'],
        [SESSION_STORAGE_KEYS.LAST_SUCCESSFUL_CONNECTION, Date.now().toString()],
      ]);

      const result = await sessionManager.checkSessionRestoration();

      expect(result.success).toBe(false);
      expect(result.reason).toBe('Session has expired');
      expect(result.shouldPromptReconnect).toBe(true);
    });
  });

  describe('Time Until Expiry', () => {
    it('should return correct time string for hours', async () => {
      const futureExpiry = Date.now() + 2 * 60 * 60 * 1000; // 2 hours from now
      const mockSession = { topic: 'test' };

      mockAsyncStorage.multiGet.mockResolvedValue([
        [SESSION_STORAGE_KEYS.SESSION, JSON.stringify(mockSession)],
        [SESSION_STORAGE_KEYS.SESSION_EXPIRY, futureExpiry.toString()],
        [SESSION_STORAGE_KEYS.AUTO_RECONNECT_ENABLED, 'false'],
        [SESSION_STORAGE_KEYS.LAST_SUCCESSFUL_CONNECTION, Date.now().toString()],
      ]);

      const timeString = await sessionManager.getTimeUntilExpiryString();

      expect(timeString).toBe('2 hours');
    });

    it('should return "Expired" for expired sessions', async () => {
      const pastExpiry = Date.now() - 3600000; // 1 hour ago
      const mockSession = { topic: 'test' };

      mockAsyncStorage.multiGet.mockResolvedValue([
        [SESSION_STORAGE_KEYS.SESSION, JSON.stringify(mockSession)],
        [SESSION_STORAGE_KEYS.SESSION_EXPIRY, pastExpiry.toString()],
        [SESSION_STORAGE_KEYS.AUTO_RECONNECT_ENABLED, 'false'],
        [SESSION_STORAGE_KEYS.LAST_SUCCESSFUL_CONNECTION, Date.now().toString()],
      ]);

      const timeString = await sessionManager.getTimeUntilExpiryString();

      expect(timeString).toBe('Expired');
    });
  });

  describe('Auto-reconnect Settings', () => {
    it('should enable auto-reconnect', async () => {
      await sessionManager.setAutoReconnectEnabled(true);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        SESSION_STORAGE_KEYS.AUTO_RECONNECT_ENABLED,
        'true'
      );
    });

    it('should disable auto-reconnect', async () => {
      await sessionManager.setAutoReconnectEnabled(false);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        SESSION_STORAGE_KEYS.AUTO_RECONNECT_ENABLED,
        'false'
      );
    });
  });

  describe('Session Cleanup', () => {
    it('should clear all session data', async () => {
      await sessionManager.clearSession();

      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
        SESSION_STORAGE_KEYS.SESSION,
        SESSION_STORAGE_KEYS.WALLET_TYPE,
        SESSION_STORAGE_KEYS.LAST_ADDRESS,
        SESSION_STORAGE_KEYS.SESSION_EXPIRY,
        SESSION_STORAGE_KEYS.LAST_SUCCESSFUL_CONNECTION,
      ]);
    });
  });
});