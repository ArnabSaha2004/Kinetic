// Environment configuration and checks for production safety

// Environment detection
export const isProduction = (): boolean => {
  // In React Native development builds, __DEV__ should be true
  // Only consider it production if __DEV__ is explicitly false
  return typeof __DEV__ !== 'undefined' && __DEV__ === false;
};

export const isDevelopment = (): boolean => {
  return !isProduction();
};

// Production safety checks
export const ensureProductionSafety = (): void => {
  console.log(`🔍 Environment check: __DEV__ = ${typeof __DEV__ !== 'undefined' ? __DEV__ : 'undefined'}`);
  console.log(`🔍 Environment mode: ${isProduction() ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  
  if (isProduction()) {
    console.log('🔒 Production mode detected - enforcing production safety checks');
    
    // Ensure no development-only features are accessible
    if (typeof global !== 'undefined') {
      // Remove any development-only globals
      delete (global as any).mockWallet;
      delete (global as any).simulateConnection;
      delete (global as any).devTools;
    }
    
    // Log production mode confirmation
    console.log('✅ Production safety checks completed');
  } else {
    console.log('🔧 Development mode detected - development features available');
  }
};

// Mock data prevention
export const preventMockDataUsage = (operation: string): void => {
  if (isProduction()) {
    throw new Error(`Mock data usage prevented in production: ${operation}`);
  }
};

// Development-only feature guard
export const requireDevelopmentMode = (feature: string): void => {
  if (isProduction()) {
    throw new Error(`Development-only feature not available in production: ${feature}`);
  }
};

// Environment-specific configuration
export const getEnvironmentConfig = () => {
  return {
    isProduction: isProduction(),
    isDevelopment: isDevelopment(),
    allowMockData: isDevelopment(),
    allowSimulatedConnections: isDevelopment(),
    enableDebugLogging: isDevelopment(),
    enforceHTTPS: isProduction(),
  };
};

// Initialize environment safety on module load
ensureProductionSafety();