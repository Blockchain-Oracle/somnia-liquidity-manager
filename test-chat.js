import fetch from 'node-fetch';

async function testChat() {
  console.log('🔵 Testing AI Chat Interface...\n');
  
  const testWallet = '0xC6969eC3C5dFE5A8eCe77ECee940BC52883602E6';
  
  // Test message
  const messages = [
    {
      role: 'user',
      content: 'Check my wallet balance'
    }
  ];
  
  console.log('📤 Sending request to /api/chat');
  console.log('   Wallet:', testWallet);
  console.log('   Message:', messages[0].content);
  console.log('');
  
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        walletAddress: testWallet
      })
    });
    
    console.log('📥 Response status:', response.status);
    console.log('   Headers:', Object.fromEntries(response.headers.entries()));
    console.log('');
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Error:', error);
      return;
    }
    
    // Read the stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    
    console.log('📖 Reading stream...\n');
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      process.stdout.write(chunk);
      fullContent += chunk;
    }
    
    console.log('\n\n✅ Stream complete!');
    console.log('   Total bytes received:', fullContent.length);
    
    // Parse to see if we got structured data
    const lines = fullContent.split('\n').filter(line => line.trim());
    console.log('   Lines received:', lines.length);
    
    // Check for text content (format: 0:"text")
    const textLines = lines.filter(line => line.startsWith('0:'));
    if (textLines.length > 0) {
      console.log('   Text chunks:', textLines.length);
    }
    
    // Check for tool calls
    const toolLines = lines.filter(line => line.includes('tool'));
    if (toolLines.length > 0) {
      console.log('   Tool-related events:', toolLines.length);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testChat().catch(console.error);