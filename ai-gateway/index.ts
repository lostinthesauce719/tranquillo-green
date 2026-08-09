import { config } from 'dotenv';
import { streamText } from 'ai';

// dotenv only reads `.env` by default, so point it at `.env.local` explicitly.
config({ path: '.env.local' });

if (!process.env.AI_GATEWAY_API_KEY) {
  console.error('Missing AI_GATEWAY_API_KEY — add it to ai-gateway/.env.local');
  process.exit(1);
}

const result = streamText({
  model: 'openai/gpt-5.4',
  prompt: 'Explain what an AI gateway is, in three sentences.',
});

for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}

const usage = await result.totalUsage;

console.log('\n\n--- usage ---');
console.log(`finish reason : ${await result.finishReason}`);
console.log(`input tokens  : ${usage.inputTokens ?? 'n/a'}`);
console.log(`output tokens : ${usage.outputTokens ?? 'n/a'}`);
console.log(`total tokens  : ${usage.totalTokens ?? 'n/a'}`);
