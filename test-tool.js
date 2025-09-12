import { tool } from 'ai';
import { z } from 'zod';

// Test tool definition
const testTool = tool({
  description: 'A test tool',
  parameters: z.object({
    message: z.string()
  }),
  execute: async ({ message }) => {
    return { result: `Echo: ${message}` };
  }
});

console.log('Tool object:', testTool);
console.log('Tool description:', testTool.description);
console.log('Tool parameters:', testTool.parameters);
console.log('Tool execute:', typeof testTool.execute);