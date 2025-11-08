import chromaClient from '../config/chromadb.js';
import prisma from '../config/database.js';
import embeddingService from './embeddingService.js';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

class DocumentService {
  constructor() {
    this.collectionName = 'rag_documents';
  }

  /**
   * Get or create ChromaDB collection
   */
  async getCollection() {
    try {
      return await chromaClient.getOrCreateCollection({
        name: this.collectionName,
        metadata: { 'hnsw:space': 'cosine' }
      });
    } catch (error) {
      console.error('Error getting ChromaDB collection:', error);
      throw new Error('Failed to access vector database');
    }
  }

  /**
   * Chunk text into smaller pieces
   */
  async chunkText(text, options = {}) {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: options.chunkSize || 1000,
      chunkOverlap: options.chunkOverlap || 200,
    });

    return await splitter.splitText(text);
  }

  /**
   * Process and store document
   */
  async processDocument(documentId, content) {
    try {
      // Update document status
      await prisma.document.update({
        where: { id: documentId },
        data: { status: 'PROCESSING' }
      });

      // Chunk the content
      const chunks = await this.chunkText(content);

      // Generate embeddings for all chunks
      const embeddings = await embeddingService.generateEmbeddings(chunks);

      // Get ChromaDB collection
      const collection = await this.getCollection();

      // Prepare data for ChromaDB
      const ids = chunks.map((_, idx) => `${documentId}_chunk_${idx}`);
      const metadatas = chunks.map((chunk, idx) => ({
        documentId,
        chunkIndex: idx,
        text: chunk
      }));

      // Store in ChromaDB
      await collection.add({
        ids,
        embeddings,
        metadatas,
        documents: chunks
      });

      // Store chunk metadata in Postgres
      const chunkRecords = chunks.map((chunk, idx) => ({
        documentId,
        chunkIndex: idx,
        content: chunk,
        chromaId: ids[idx]
      }));

      await prisma.documentChunk.createMany({
        data: chunkRecords
      });

      // Update document status
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'COMPLETED',
          processedAt: new Date(),
          chunkCount: chunks.length,
          chromaCollectionId: this.collectionName
        }
      });

      return { success: true, chunkCount: chunks.length };
    } catch (error) {
      console.error('Error processing document:', error);

      // Update document with error status
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'FAILED',
          error: error.message
        }
      });

      throw error;
    }
  }

  /**
   * Search similar chunks in vector database
   */
  async searchSimilar(query, topK = 5) {
    try {
      const collection = await this.getCollection();
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      const results = await collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: topK
      });

      return results;
    } catch (error) {
      console.error('Error searching similar chunks:', error);
      throw new Error('Failed to search documents');
    }
  }

  /**
   * Delete document from both Postgres and ChromaDB
   */
  async deleteDocument(documentId) {
    try {
      const collection = await this.getCollection();

      // Get all chunk IDs for this document
      const chunks = await prisma.documentChunk.findMany({
        where: { documentId },
        select: { chromaId: true }
      });

      // Delete from ChromaDB
      if (chunks.length > 0) {
        const chromaIds = chunks.map(c => c.chromaId).filter(Boolean);
        if (chromaIds.length > 0) {
          await collection.delete({ ids: chromaIds });
        }
      }

      // Delete from Postgres (cascade will delete chunks)
      await prisma.document.delete({
        where: { id: documentId }
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }
}

export default new DocumentService();
