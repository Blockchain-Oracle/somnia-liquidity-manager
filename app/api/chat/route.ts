import { streamText, convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { openai } from "@ai-sdk/openai";
import { systemPrompt } from "@/lib/ai/prompts";

// Import tools
import { makeTransferTransaction } from "@/lib/ai/tools/makeTransferTransaction";
import { makeSwapTransaction } from "@/lib/ai/tools/makeSwapTransaction";
import { makeBridgeTransaction } from "@/lib/ai/tools/makeBridgeTransaction";
import { getTokenBalances, setContextWalletAddress } from "@/lib/ai/tools/getTokenBalances";
import { getPoolInfo } from "@/lib/ai/tools/getPoolInfo";
import { getMarketplaceListings } from "@/lib/ai/tools/getMarketplaceListings";
import { purchaseNFT } from "@/lib/ai/tools/purchaseNFT";
import { createNFTListing } from "@/lib/ai/tools/createNFTListing";
import { analyzeNFTPrices } from "@/lib/ai/tools/analyzeNFTPrices";

export const maxDuration = 60;

// Check if OpenAI API key is configured
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const isAPIKeyConfigured = OPENAI_API_KEY && OPENAI_API_KEY !== 'your-openai-api-key-here';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, walletAddress } = body;
    
    console.log('🔵 [API] Chat request received:', {
      messageCount: messages?.length,
      walletAddress,
      lastMessage: messages?.[messages.length - 1]
    });
    
    // Set the wallet address context for tools
    if (walletAddress) {
      setContextWalletAddress(walletAddress);
      console.log('👛 [API] Set wallet context:', walletAddress);
    }

    // If API key is not configured, return a helpful message
    if (!isAPIKeyConfigured) {
      console.warn("⚠️ [API] OpenAI API key not configured. Using mock response.");
      
      // Create a mock UI message stream compatible with useChat
      const mockContent = `🤖 AI Assistant (Demo Mode)\n\nOpenAI API key is not configured.\nAdd OPENAI_API_KEY to .env.local and restart the dev server.\n\nI can still demonstrate the chat UI and tool cards.`;

      const stream = createUIMessageStream({
        execute: async ({ writer }) => {
          writer.write({ type: 'start' });
          const id = 'demo-message-1';
          writer.write({ type: 'text-start', id });
          const parts = mockContent.split(' ');
          for (let i = 0; i < parts.length; i++) {
            writer.write({ type: 'text-delta', id, delta: parts[i] + (i < parts.length - 1 ? ' ' : '') });
            await new Promise((r) => setTimeout(r, 15));
          }
          writer.write({ type: 'text-end', id });
          writer.write({ type: 'finish' });
        }
      });

      return createUIMessageStreamResponse({ stream });
    }

    console.log('🟢 [API] Using OpenAI with system prompt');
    
    // Create the system message with wallet context
    const systemMessage = systemPrompt(walletAddress);
    
    // Create tools object - pass the actual tool implementations
    const tools = {
      getTokenBalances,
      makeTransferTransaction,
      makeSwapTransaction,
      makeBridgeTransaction,
      getPoolInfo,
      getMarketplaceListings,
      purchaseNFT,
      createNFTListing,
      analyzeNFTPrices,
    };
    
    // Convert UI messages from the client to model messages
    const modelMessages = convertToModelMessages(messages, { tools });

    // Stream the response using the AI SDK
    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: systemMessage,
      messages: modelMessages,
      tools,
      temperature: 0.7,
      onStepFinish: ({ text, toolCalls, toolResults, finishReason, usage }) => {
        console.log('📊 [API] Step finished:', {
          hasText: !!text,
          textLength: text?.length,
          toolCallsCount: toolCalls?.length,
          toolResultsCount: toolResults?.length,
          finishReason,
          usage
        });
        
        // Log tool calls and results
        if (toolCalls && toolCalls.length > 0) {
          console.log('🔧 [API] Tool calls:', toolCalls.map(tc => ({
            toolName: tc.toolName
          })));
        }
        
        if (toolResults && toolResults.length > 0) {
          console.log('📦 [API] Tool results:', toolResults.map(tr => ({
            toolName: tr.toolName
          })));
        }
      }
    });
    
    console.log('📤 [API] Returning stream response');
    
    // Return UI message stream for useChat
    return result.toUIMessageStreamResponse();
    
  } catch (error) {
    console.error("❌ [API] Error in chat route:", error);
    
    // Return error as a stream
    const encoder = new TextEncoder();
    const errorMessage = `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check if your OpenAI API key is correctly configured.`;
    
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`0:"${errorMessage}"\n`));
        controller.close();
      }
    });
    
    return new Response(stream, {
      status: 200, // Return 200 to avoid breaking the stream
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Vercel-AI-Data-Stream': 'v1',
      },
    });
  }
}