import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

async function testStreaming() {
  console.log('Testing AI SDK v5 streaming...');
  
  const result = streamText({
    model: openai("gpt-4o-mini"),
    prompt: "Say 'Hello world' and nothing else",
    maxTokens: 10,
  });

  console.log('Result object:', Object.keys(result));
  console.log('Result methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(result)));
  
  // Try different ways to get the response
  if (result.toDataStreamResponse) {
    console.log('✅ toDataStreamResponse exists');
  } else {
    console.log('❌ toDataStreamResponse does not exist');
  }
  
  if (result.toTextStreamResponse) {
    console.log('✅ toTextStreamResponse exists');
  } else {
    console.log('❌ toTextStreamResponse does not exist');
  }
  
  if (result.textStream) {
    console.log('✅ textStream exists');
    for await (const chunk of result.textStream) {
      console.log('Chunk:', chunk);
    }
  }
}

testStreaming().catch(console.error);