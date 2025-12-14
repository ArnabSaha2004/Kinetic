const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add polyfill configuration for WalletConnect
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Configure polyfills for React Native
config.resolver.alias = {
  ...config.resolver.alias,
  crypto: 'react-native-get-random-values',
  stream: 'readable-stream',
  url: 'react-native-url-polyfill',
};

// Add node modules that need to be resolved
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Configure transformer for better compatibility
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

module.exports = config;