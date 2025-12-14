// React Native polyfills for Thirdweb
import { Platform } from "react-native";
import "react-native-get-random-values";

// Add polyfills for Node.js modules
if (typeof global.Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

if (typeof global.process === 'undefined') {
  global.process = require('process');
}

// Additional crypto polyfills if needed
if (typeof global.crypto === 'undefined') {
  global.crypto = {};
}

if (typeof global.crypto.getRandomValues === 'undefined') {
  global.crypto.getRandomValues = require('react-native-get-random-values').getRandomValues;
}

console.log('✅ Thirdweb polyfills loaded successfully');