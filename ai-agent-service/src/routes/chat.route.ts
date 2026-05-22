import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { runAgent } from '../agent/agent';

const router = Router();

/**
 * @swagger
 * /api/v1/ai/chat:
 *   post:
 *     summary: Chat with the AI hotel booking assistant
 *     tags: [AI Agent]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 description: User message
 *                 example: "Find me a hotel in Istanbul for 2 nights next weekend"
 *               conversationHistory:
 *                 type: array
 *                 description: Previous conversation messages for context
 *                 items:
 *                   type: object
 *               userToken:
 *                 type: string
 *                 description: JWT Bearer token for authenticated users
 *     responses:
 *       200:
 *         description: AI assistant response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reply:
 *                   type: string
 *                 toolsUsed:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, conversationHistory = [], userToken = '' } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ error: 'message is required and must be a non-empty string' });
    }

    const history: Anthropic.MessageParam[] = Array.isArray(conversationHistory)
      ? conversationHistory
      : [];

    const result = await runAgent(message.trim(), history, userToken);
    return res.json(result);
  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
