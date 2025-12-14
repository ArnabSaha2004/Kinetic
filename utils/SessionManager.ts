/**
 * Session management utilities for WalletConnect
 * Handles session expiry detection, automatic restoration, and reconnection prompts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';

// Session storage keys
export const SESSION_STORAGE_KEYS = {
  SESSION: '@wallet_connect_session',
  WALLET_TYPE: '@wallet_type',
  LAST_ADDRESS: '@last_wallet_address',
  SESSION_EXPIRY: '@session_expiry',
  AUTO_RECONNECT_ENABLED: '@auto_reconnect_enabled',
  LAST_SUCCESSFUL_CONNECTION: '@last_successful_connection',
} as const;

// Session state interface
export interface SessionState {
  isValid: boolean;
  isExpired: boolean;
  expiryTime: number | null;
  timeUntilExpiry: number | null;
  shouldAutoReconnect: boolean;
  lastConnectionTime: number | null;
}

// Session restoration result
export interface SessionRestorationResult {
  success: boolean;
  session?: any;
  walletType?: string;
  address?: string;
  reason?: string;
  shouldPromptReconnect?: boolean;
}

// Session expiry warning thresholds (in milliseconds)
const EXPIRY_WARNING_THRESHOLDS = {
  CRITICAL: 5 * 60 * 1000, // 5 minutes
  WARNING: 30 * 60 * 1000, // 30 minutes
  INFO: 2 * 60 * 60 * 1000, // 2 hours
} as const;

// Auto-reconnection configuration
const AUTO_RECONNECT_CONFIG = {
  MAX_ATTEMPTS: 3,
  RETRY_DELAY: 2000, // 2 seconds
  BACKOFF_MULTIPLIER: 1.5,
  MAX_DELAY: 10000, // 10 seconds
} as const;

/**
 * Session Manager class for handling WalletConnect session lifecycle
 */
export class SessionManager {
  private static instance: SessionManager;
  private appStateListener: any = null;
  private expiryCheckInterval: any = null;
  private reconnectAttempts: number = 0;
  private onSessionExpiry?: (timeUntilExpiry: number) => void;
  private onReconnectNeeded?: () => Promise<void>;
  private onSessionRestored?: (session: any) => void;

  private constructor() {
    this.setupAppStateListener();
    this.startExpiryMonitoring();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Set up app state listener for automatic session restoration
   */
  private setupAppStateListener(): void {
    this.appStateListener = AppState.addEventListener('change', this.handleAppStateChange);
  }

  /**
   * Handle app state changes for session restoration
   */
  private handleAppStateChange = async (nextAppState: AppStateStatus): Promise<void> => {
    if (nextAppState === 'active') {
      console.log('📱 App became active - checking session status');
      
      // Check if session needs restoration
      const restorationResult = await this.checkSessionRestoration();
      
      if (restorationResult.shouldPromptReconnect && this.onReconnectNeeded) {
        console.log('🔄 Prompting user for reconnection');
        await this.onReconnectNeeded();
      } else if (restorationResult.success && restorationResult.session && this.onSessionRestored) {
        console.log('✅ Session restored automatically');
        this.onSessionRestored(restorationResult.session);
      }
    }
  };

  /**
   * Start monitoring session expiry
   */
  private startExpiryMonitoring(): void {
    // Check every minute for session expiry
    this.expiryCheckInterval = setInterval(async () => {
      const sessionState = await this.getSessionState();
      
      if (sessionState.isValid && sessionState.timeUntilExpiry !== null) {
        // Check if we need to warn about expiry
        if (sessionState.timeUntilExpiry <= EXPIRY_WARNING_THRESHOLDS.CRITICAL) {
          console.log('⚠️ Session expiring in', Math.round(sessionState.timeUntilExpiry / 1000), 'seconds');
          
          if (this.onSessionExpiry) {
            this.onSessionExpiry(sessionState.timeUntilExpiry);
          }
        } else if (sessionState.timeUntilExpiry <= EXPIRY_WARNING_THRESHOLDS.WARNING) {
          console.log('⏰ Session expiring in', Math.round(sessionState.timeUntilExpiry / (60 * 1000)), 'minutes');
        }
      }
      
      // If session is expired, trigger reconnection if enabled
      if (sessionState.isExpired && sessionState.shouldAutoReconnect && this.onReconnectNeeded) {
        console.log('🔄 Session expired - triggering auto-reconnection');
        await this.attemptAutoReconnection();
      }
    }, 60000); // Check every minute
  }

  /**
   * Store session data with expiry information
   */
  public async storeSession(
    session: any, 
    walletType: string, 
    address: string
  ): Promise<void> {
    try {
      const now = Date.now();
      const expiryTime = session.expiry ? session.expiry * 1000 : now + (24 * 60 * 60 * 1000); // Default 24 hours
      
      await AsyncStorage.multiSet([
        [SESSION_STORAGE_KEYS.SESSION, JSON.stringify(session)],
        [SESSION_STORAGE_KEYS.WALLET_TYPE, walletType],
        [SESSION_STORAGE_KEYS.LAST_ADDRESS, address],
        [SESSION_STORAGE_KEYS.SESSION_EXPIRY, expiryTime.toString()],
        [SESSION_STORAGE_KEYS.LAST_SUCCESSFUL_CONNECTION, now.toString()],
      ]);
      
      console.log('💾 Session stored with expiry:', new Date(expiryTime).toISOString());
    } catch (error) {
      console.error('❌ Failed to store session:', error);
    }
  }

  /**
   * Get current session state
   */
  public async getSessionState(): Promise<SessionState> {
    try {
      const [
        sessionData,
        expiryData,
        autoReconnectData,
        lastConnectionData
      ] = await AsyncStorage.multiGet([
        SESSION_STORAGE_KEYS.SESSION,
        SESSION_STORAGE_KEYS.SESSION_EXPIRY,
        SESSION_STORAGE_KEYS.AUTO_RECONNECT_ENABLED,
        SESSION_STORAGE_KEYS.LAST_SUCCESSFUL_CONNECTION,
      ]);

      const session = sessionData[1] ? JSON.parse(sessionData[1]) : null;
      const expiryTime = expiryData[1] ? parseInt(expiryData[1], 10) : null;
      const autoReconnectEnabled = autoReconnectData[1] === 'true';
      const lastConnectionTime = lastConnectionData[1] ? parseInt(lastConnectionData[1], 10) : null;

      const now = Date.now();
      const isValid = session !== null;
      const isExpired = expiryTime ? now > expiryTime : false;
      const timeUntilExpiry = expiryTime ? Math.max(0, expiryTime - now) : null;

      return {
        isValid,
        isExpired,
        expiryTime,
        timeUntilExpiry,
        shouldAutoReconnect: autoReconnectEnabled,
        lastConnectionTime,
      };
    } catch (error) {
      console.error('❌ Failed to get session state:', error);
      return {
        isValid: false,
        isExpired: true,
        expiryTime: null,
        timeUntilExpiry: null,
        shouldAutoReconnect: false,
        lastConnectionTime: null,
      };
    }
  }

  /**
   * Check if session can be restored and return restoration result
   */
  public async checkSessionRestoration(): Promise<SessionRestorationResult> {
    try {
      const sessionState = await this.getSessionState();
      
      if (!sessionState.isValid) {
        return {
          success: false,
          reason: 'No stored session found',
          shouldPromptReconnect: false,
        };
      }

      if (sessionState.isExpired) {
        return {
          success: false,
          reason: 'Session has expired',
          shouldPromptReconnect: sessionState.shouldAutoReconnect,
        };
      }

      // Session is valid and not expired - try to restore
      const [sessionData, walletTypeData, addressData] = await AsyncStorage.multiGet([
        SESSION_STORAGE_KEYS.SESSION,
        SESSION_STORAGE_KEYS.WALLET_TYPE,
        SESSION_STORAGE_KEYS.LAST_ADDRESS,
      ]);

      const session = sessionData[1] ? JSON.parse(sessionData[1]) : null;
      const walletType = walletTypeData[1] || undefined;
      const address = addressData[1] || undefined;

      if (session && address) {
        return {
          success: true,
          session,
          walletType,
          address,
          reason: 'Session restored successfully',
        };
      } else {
        return {
          success: false,
          reason: 'Incomplete session data',
          shouldPromptReconnect: true,
        };
      }
    } catch (error) {
      console.error('❌ Failed to check session restoration:', error);
      return {
        success: false,
        reason: 'Error checking session',
        shouldPromptReconnect: false,
      };
    }
  }

  /**
   * Attempt automatic reconnection with exponential backoff
   */
  private async attemptAutoReconnection(): Promise<void> {
    if (this.reconnectAttempts >= AUTO_RECONNECT_CONFIG.MAX_ATTEMPTS) {
      console.log('❌ Max reconnection attempts reached');
      this.reconnectAttempts = 0;
      return;
    }

    this.reconnectAttempts++;
    
    const delay = Math.min(
      AUTO_RECONNECT_CONFIG.RETRY_DELAY * Math.pow(AUTO_RECONNECT_CONFIG.BACKOFF_MULTIPLIER, this.reconnectAttempts - 1),
      AUTO_RECONNECT_CONFIG.MAX_DELAY
    );

    console.log(`🔄 Attempting auto-reconnection (${this.reconnectAttempts}/${AUTO_RECONNECT_CONFIG.MAX_ATTEMPTS}) in ${delay}ms`);

    setTimeout(async () => {
      if (this.onReconnectNeeded) {
        try {
          await this.onReconnectNeeded();
          this.reconnectAttempts = 0; // Reset on success
        } catch (error) {
          console.error('❌ Auto-reconnection failed:', error);
          // Will retry on next interval if attempts < max
        }
      }
    }, delay);
  }

  /**
   * Enable or disable auto-reconnection
   */
  public async setAutoReconnectEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(SESSION_STORAGE_KEYS.AUTO_RECONNECT_ENABLED, enabled.toString());
      console.log('⚙️ Auto-reconnect', enabled ? 'enabled' : 'disabled');
    } catch (error) {
      console.error('❌ Failed to set auto-reconnect preference:', error);
    }
  }

  /**
   * Clear all session data
   */
  public async clearSession(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        SESSION_STORAGE_KEYS.SESSION,
        SESSION_STORAGE_KEYS.WALLET_TYPE,
        SESSION_STORAGE_KEYS.LAST_ADDRESS,
        SESSION_STORAGE_KEYS.SESSION_EXPIRY,
        SESSION_STORAGE_KEYS.LAST_SUCCESSFUL_CONNECTION,
      ]);
      
      console.log('🧹 Session data cleared');
    } catch (error) {
      console.error('❌ Failed to clear session:', error);
    }
  }

  /**
   * Set callback for session expiry warnings
   */
  public setOnSessionExpiry(callback: (timeUntilExpiry: number) => void): void {
    this.onSessionExpiry = callback;
  }

  /**
   * Set callback for reconnection needed
   */
  public setOnReconnectNeeded(callback: () => Promise<void>): void {
    this.onReconnectNeeded = callback;
  }

  /**
   * Set callback for session restored
   */
  public setOnSessionRestored(callback: (session: any) => void): void {
    this.onSessionRestored = callback;
  }

  /**
   * Get time until session expiry in human-readable format
   */
  public async getTimeUntilExpiryString(): Promise<string | null> {
    const sessionState = await this.getSessionState();
    
    if (!sessionState.isValid || sessionState.timeUntilExpiry === null) {
      return null;
    }

    if (sessionState.isExpired) {
      return 'Expired';
    }

    const minutes = Math.floor(sessionState.timeUntilExpiry / (60 * 1000));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      return 'Less than 1 minute';
    }
  }

  /**
   * Check if session needs renewal (within warning threshold)
   */
  public async needsRenewal(): Promise<boolean> {
    const sessionState = await this.getSessionState();
    
    return sessionState.isValid && 
           sessionState.timeUntilExpiry !== null && 
           sessionState.timeUntilExpiry <= EXPIRY_WARNING_THRESHOLDS.WARNING;
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    if (this.appStateListener) {
      this.appStateListener.remove();
      this.appStateListener = null;
    }
    
    if (this.expiryCheckInterval) {
      clearInterval(this.expiryCheckInterval);
      this.expiryCheckInterval = null;
    }
    
    this.reconnectAttempts = 0;
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();

// Export utility functions
export const storeSession = (session: any, walletType: string, address: string) => 
  sessionManager.storeSession(session, walletType, address);

export const getSessionState = () => sessionManager.getSessionState();

export const checkSessionRestoration = () => sessionManager.checkSessionRestoration();

export const setAutoReconnectEnabled = (enabled: boolean) => 
  sessionManager.setAutoReconnectEnabled(enabled);

export const clearSession = () => sessionManager.clearSession();