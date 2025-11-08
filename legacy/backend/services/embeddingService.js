import groq from '../config/groq.js';

class EmbeddingService {
  /**
   * Generate embeddings using Groq API
   * Note: Groq doesn't currently support embeddings, so we'll use a fallback
   * You can switch to OpenAI, Cohere, or use local models
   */
  async generateEmbedding(text) {
    try {
      // PLACEHOLDER: Replace with actual embedding API
      // For now, using a simple hash-based approach for development
      // In production, use: OpenAI embeddings, Cohere, or local models like sentence-transformers

      console.warn('⚠️  Using placeholder embeddings. Configure a real embedding service for production.');

      // Simple placeholder - returns a consistent vector for testing
      const hash = this.simpleHash(text);
      return Array(384).fill(0).map((_, i) => Math.sin(hash + i) / 2);
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  /**
   * Batch generate embeddings
   */
  async generateEmbeddings(texts) {
    return Promise.all(texts.map(text => this.generateEmbedding(text)));
  }

  /**
   * Simple hash function for placeholder embeddings
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }
}

export default new EmbeddingService();
