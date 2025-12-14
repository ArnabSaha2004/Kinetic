import { Platform } from "react-native";
import "react-native-get-random-values";

// Add polyfills for Node.js modules
if (typeof global.Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

if (typeof global.process === 'undefined') {
  global.process = require('process');
}

// Import Thirdweb React Native adapter for non-web platforms
if (Platform.OS !== "web") {
  import("@thirdweb-dev/react-native-adapter");
}

// Import the main Expo entry point
import "expo/AppEntry";