import fetch from 'node-fetch';

async function testAIChat() {
  console.log('Testing AI chat endpoint...');
  
  const response = await fetch('http://localhost:3002/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: 'Check my balance' }
      ],
      walletAddress: '0x1234567890123456789012345678901234567890'
    })
  });

  console.log('Response status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));
  
  if (response.ok) {
    const reader = response.body;
    const decoder = new TextDecoder();
    
    console.log('\n📊 Streaming response:');
    console.log('==================');
    
    for await (const chunk of reader) {
      const text = decoder.decode(chunk, { stream: true });
      console.log('Chunk:', text);
    }
  } else {
    const error = await response.text();
    console.error('Error:', error);
  }
}

testAIChat().catch(console.error);