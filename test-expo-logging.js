// Test Expo logging configuration
// Run this with: npx expo start --web to test in browser first

console.log('🧪 EXPO LOGGING TEST - Starting...');

// Test different console methods
console.log('📝 Regular console.log message');
console.warn('⚠️ Console.warn message');
console.error('❌ Console.error message');
console.info('ℹ️ Console.info message');

// Test with objects
console.log('📊 Object logging test:', {
  timestamp: new Date().toISOString(),
  platform: 'expo',
  testId: Math.random().toString(36).slice(2, 8)
});

// Test with arrays
console.log('📋 Array logging test:', [1, 2, 3, 'test', { nested: true }]);

// Test with multiple arguments
console.log('🔢 Multiple args test:', 'arg1', 'arg2', 123, { test: true });

// Test timing
console.time('⏱️ Timer test');
setTimeout(() => {
  console.timeEnd('⏱️ Timer test');
  console.log('✅ Expo logging test completed');
}, 1000);

console.log('🎯 If you can see this, basic logging is working');