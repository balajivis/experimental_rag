import express from 'express';
import prisma from '../config/database.js';
import ragService from '../services/ragService.js';

const router = express.Router();

/**
 * POST /api/chat/query
 * Send a chat query and get RAG response
 */
router.post('/query', async (req, res) => {
  try {
    const { query, userId } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // TODO: Get userId from auth middleware
    const effectiveUserId = userId || 'default-user';

    const result = await ragService.generateResponse(effectiveUserId, query);

    res.json({
      response: result.response,
      sources: result.sources
    });
  } catch (error) {
    console.error('Error processing chat query:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/chat/stream
 * Send a chat query and get streaming RAG response
 */
router.post('/stream', async (req, res) => {
  try {
    const { query, userId } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // TODO: Get userId from auth middleware
    const effectiveUserId = userId || 'default-user';

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = ragService.generateStreamingResponse(effectiveUserId, query);

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Error processing streaming chat query:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/chat/history
 * Get chat history for a user
 */
router.get('/history', async (req, res) => {
  try {
    // TODO: Get userId from auth middleware
    const userId = req.query.userId || 'default-user';
    const limit = parseInt(req.query.limit) || 50;

    const history = await prisma.chatHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
        contextDocuments: true
      }
    });

    res.json({
      history: history.reverse() // Return in chronological order
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/chat/history
 * Clear chat history for a user
 */
router.delete('/history', async (req, res) => {
  try {
    // TODO: Get userId from auth middleware
    const userId = req.query.userId || 'default-user';

    await prisma.chatHistory.deleteMany({
      where: { userId }
    });

    res.json({ message: 'Chat history cleared successfully' });
  } catch (error) {
    console.error('Error clearing chat history:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
