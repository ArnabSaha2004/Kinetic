// Debug base64 encoding to make sure it's working correctly
console.log('🧪 Testing Base64 Encoding...');

// Test data
const testData = {
  message: 'test',
  number: 123
};

const jsonString = JSON.stringify(testData);
console.log('📄 Original JSON:', jsonString);

// Method 1: Direct btoa (what we were using)
const method1 = btoa(jsonString);
console.log('📄 Method 1 (btoa):', method1);
console.log('📄 Method 1 length:', method1.length);

// Method 2: Demo method (data URL then split)
const dataUrl = `data:application/json;base64,${btoa(jsonString)}`;
const method2 = dataUrl.split(',')[1];
console.log('📄 Method 2 (demo):', method2);
console.log('📄 Method 2 length:', method2.length);

// Verify they're the same
console.log('📄 Methods match:', method1 === method2);

// Test decoding
try {
  const decoded1 = atob(method1);
  const decoded2 = atob(method2);
  console.log('📄 Decoded 1:', decoded1);
  console.log('📄 Decoded 2:', decoded2);
  console.log('📄 Decoding matches original:', decoded1 === jsonString && decoded2 === jsonString);
} catch (error) {
  console.error('❌ Decoding failed:', error);
}

// Test Buffer conversion (what the server does)
if (typeof Buffer !== 'undefined') {
  try {
    const buffer1 = Buffer.from(method1, 'base64');
    const buffer2 = Buffer.from(method2, 'base64');
    console.log('📄 Buffer 1 length:', buffer1.length);
    console.log('📄 Buffer 2 length:', buffer2.length);
    console.log('📄 Buffer 1 string:', buffer1.toString());
    console.log('📄 Buffer 2 string:', buffer2.toString());
  } catch (error) {
    console.error('❌ Buffer conversion failed:', error);
  }
} else {
  console.log('📄 Buffer not available (browser environment)');
}

// Test with undefined/null values
console.log('\n🧪 Testing edge cases...');
try {
  Buffer.from(undefined, 'base64');
} catch (error) {
  console.log('❌ Buffer.from(undefined) fails as expected:', error.message);
}

try {
  Buffer.from(null, 'base64');
} catch (error) {
  console.log('❌ Buffer.from(null) fails as expected:', error.message);
}

try {
  Buffer.from('', 'base64');
  console.log('✅ Buffer.from("") works');
} catch (error) {
  console.log('❌ Buffer.from("") fails:', error.message);
}

console.log('\n🎯 Base64 encoding appears to be working correctly.');
console.log('💡 The issue might be that file.data is undefined when it reaches the server.');