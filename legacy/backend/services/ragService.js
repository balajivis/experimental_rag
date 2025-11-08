import groq from '../config/groq.js';
import documentService from './documentService.js';
import embeddingService from './embeddingService.js';
import prisma from '../config/database.js';

class RAGService {
  constructor() {
    this.model = 'llama-3.1-70b-versatile'; // Groq model
  }

  /**
   * Build context from retrieved documents
   */
  buildContext(searchResults) {
    if (!searchResults.documents || searchResults.documents.length === 0) {
      return '';
    }

    const contexts = searchResults.documents[0];
    return contexts.map((doc, idx) =>
      `[Context ${idx + 1}]:\n${doc}`
    ).join('\n\n');
  }

  /**
   * Build prompt with context
   */
  buildPrompt(query, context, chatHistory = []) {
    const systemPrompt = `You are a helpful AI assistant. Use the following context to answer the user's question.
If the answer cannot be found in the context, say so honestly.

Context:
${context}`;

    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add chat history (last 5 messages)
    const recentHistory = chatHistory.slice(-5);
    messages.push(...recentHistory);

    // Add current query
    messages.push({ role: 'user', content: query });

    return messages;
  }

  /**
   * Generate response using RAG
   */
  async generateResponse(userId, query, options = {}) {
    try {
      // 1. Search for relevant context
      const searchResults = await documentService.searchSimilar(
        query,
        options.topK || 5
      );

      // 2. Build context
      const context = this.buildContext(searchResults);

      // 3. Get chat history
      const chatHistory = await prisma.chatHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { role: true, content: true }
      });

      // Reverse to get chronological order
      const formattedHistory = chatHistory.reverse().map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // 4. Build prompt
      const messages = this.buildPrompt(query, context, formattedHistory);

      // 5. Generate response
      const completion = await groq.chat.completions.create({
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      });

      const response = completion.choices[0]?.message?.content || 'No response generated';

      // 6. Save to chat history
      await prisma.chatHistory.createMany({
        data: [
          {
            userId,
            role: 'user',
            content: query,
            contextDocuments: searchResults.ids ? searchResults.ids[0] : []
          },
          {
            userId,
            role: 'assistant',
            content: response,
            contextDocuments: []
          }
        ]
      });

      return {
        response,
        context: searchResults,
        sources: searchResults.metadatas ? searchResults.metadatas[0] : []
      };
    } catch (error) {
      console.error('Error generating RAG response:', error);
      throw new Error('Failed to generate response');
    }
  }

  /**
   * Generate streaming response
   */
  async *generateStreamingResponse(userId, query, options = {}) {
    try {
      // 1. Search for relevant context
      const searchResults = await documentService.searchSimilar(
        query,
        options.topK || 5
      );

      // 2. Build context
      const context = this.buildContext(searchResults);

      // 3. Get chat history
      const chatHistory = await prisma.chatHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { role: true, content: true }
      });

      const formattedHistory = chatHistory.reverse().map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // 4. Build prompt
      const messages = this.buildPrompt(query, context, formattedHistory);

      // 5. Generate streaming response
      const stream = await groq.chat.completions.create({
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
        stream: true
      });

      let fullResponse = '';

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullResponse += content;
        yield content;
      }

      // 6. Save to chat history after streaming is complete
      await prisma.chatHistory.createMany({
        data: [
          {
            userId,
            role: 'user',
            content: query,
            contextDocuments: searchResults.ids ? searchResults.ids[0] : []
          },
          {
            userId,
            role: 'assistant',
            content: fullResponse,
            contextDocuments: []
          }
        ]
      });
    } catch (error) {
      console.error('Error generating streaming response:', error);
      throw new Error('Failed to generate streaming response');
    }
  }
}

export default new RAGService();
