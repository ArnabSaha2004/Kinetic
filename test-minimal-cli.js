// Minimal test to match CLI exactly
const API_BASE_URL = 'https://surreal-base.vercel.app';
const fs = require('fs');

async function testMinimalCLI() {
  console.log('🧪 Testing minimal CLI format...');
  
  // Read the same file that worked with storylite CLI
  const fileContent = fs.readFileSync('test-storylite.txt', 'utf8');
  const base64Data = Buffer.from(fileContent).toString('base64');
  
  console.log('📄 File info:');
  console.log('- Content:', fileContent);
  console.log('- Content length:', fileContent.length);
  console.log('- Base64 length:', base64Data.length);
  
  // Try the CLI endpoint with minimal data
  const testRequest = {
    userAddress: '0xe41532f6e917e3995bbb1c7e87a65ff7a7957a83', // Same address as CLI config
    filePath: './test-storylite.txt',
    fileData: base64Data,
    filename: 'test-storylite.txt',
    contentType: 'text/plain'
  };
  
  console.log('\n📤 Minimal CLI request:');
  console.log('- User address:', testRequest.userAddress);
  console.log('- File path:', testRequest.filePath);
  console.log('- Filename:', testRequest.filename);
  console.log('- Content type:', testRequest.contentType);
  console.log('- File data length:', testRequest.fileData.length);
  
  try {
    console.log('\n🚀 Making minimal CLI request...');
    
    const response = await fetch(`${API_BASE_URL}/api/cli/mint-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'StoryLite-CLI/1.0.0' // Match CLI user agent
      },
      body: JSON.stringify(testRequest)
    });
    
    console.log('📊 Response Status:', response.status, response.statusText);
    
    const responseText = await response.text();
    
    if (response.ok) {
      console.log('🎉 SUCCESS! Minimal CLI format works!');
      const data = JSON.parse(responseText);
      console.log('✅ Response:', data);
      return true;
    } else {
      console.log('❌ Error with minimal CLI format:');
      try {
        const errorData = JSON.parse(responseText);
        console.log('Error:', errorData);
      } catch {
        console.log('Raw error:', responseText);
      }
      return false;
    }
    
  } catch (error) {
    console.error('💥 Request failed:', error.message);
    return false;
  }
}

testMinimalCLI().catch(console.error);