import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

async function testOpenAI() {
  console.log('Testing OpenAI API...');
  console.log('API Key configured:', process.env.OPENAI_API_KEY ? 'Yes' : 'No');
  
  try {
    const result = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: "Say hello in one word",
      maxTokens: 10,
    });
    
    console.log('✅ OpenAI API works!');
    console.log('Response:', result.text);
  } catch (error) {
    console.error('❌ OpenAI API error:', error);
  }
}

testOpenAI();