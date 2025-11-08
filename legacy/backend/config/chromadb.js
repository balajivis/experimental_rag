import { ChromaClient } from 'chromadb';

const chromaClient = new ChromaClient({
  path: `http://${process.env.CHROMA_HOST}:${process.env.CHROMA_PORT}`,
  auth: {
    provider: 'token',
    credentials: process.env.CHROMA_AUTH_TOKEN,
  },
});

export default chromaClient;
