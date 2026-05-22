import Anthropic from '@anthropic-ai/sdk';
import { tools } from './tools';
import { executeTool } from './toolExecutor';
import { config } from '../config';

const client = new Anthropic({ apiKey: config.anthropicApiKey });

const SYSTEM_PROMPT = `You are a helpful and friendly hotel booking assistant for a premium hotel booking platform.

You can help users:
1. Search for available hotels by destination and dates
2. View hotel details and room options
3. Make hotel bookings (requires user authentication)
4. View their existing bookings

Always present search results clearly with hotel names, ratings, room types, and prices.
When a user wants to book, always summarize the booking details and ask for confirmation before calling bookHotel.
If the user is not authenticated (no userToken), inform them they need to log in to make bookings or view their booking history.
Be friendly, concise, and helpful.`;

export interface AgentResult {
  reply: string;
  toolsUsed: string[];
}

export async function runAgent(
  userMessage: string,
  conversationHistory: Anthropic.MessageParam[],
  userToken: string
): Promise<AgentResult> {
  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];

  const toolsUsed: string[] = [];

  while (true) {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      tools,
      messages
    });

    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find(b => b.type === 'text');
      return {
        reply: textBlock ? (textBlock as Anthropic.TextBlock).text : 'I was unable to generate a response.',
        toolsUsed
      };
    }

    if (response.stop_reason === 'tool_use') {
      messages.push({ role: 'assistant', content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type === 'tool_use') {
          toolsUsed.push(block.name);
          let result: unknown;
          try {
            result = await executeTool(block.name, block.input as Record<string, unknown>, userToken);
          } catch (error) {
            result = { error: error instanceof Error ? error.message : 'Tool execution failed' };
          }
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify(result)
          });
        }
      }
      messages.push({ role: 'user', content: toolResults });
    } else {
      const textBlock = response.content.find(b => b.type === 'text');
      return {
        reply: textBlock ? (textBlock as Anthropic.TextBlock).text : 'Unexpected response.',
        toolsUsed
      };
    }
  }
}
