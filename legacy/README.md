# RAG Application Backend

A full-stack Retrieval Augmented Generation (RAG) application with a 3-layer architecture.

## Architecture

- **Frontend**: Next.js (To be implemented)
- **Middleware**: Express.js for authentication and API
- **Backend**: AI processing with Groq, ChromaDB for vector storage, PostgreSQL for metadata

## Prerequisites

Before setting up the backend, you need to install the following on your MacBook:

### 1. Docker Desktop for Mac

Download and install Docker Desktop from: https://www.docker.com/products/docker-desktop/

After installation:
```bash
# Verify Docker is installed
docker --version
docker compose version
```

### 2. Node.js (v18 or higher)

```bash
# Verify Node.js is installed
node --version
npm --version
```

## Setup Instructions

### Step 1: Install Docker Desktop

1. Go to https://www.docker.com/products/docker-desktop/
2. Download Docker Desktop for Mac (choose Apple Silicon or Intel based on your Mac)
3. Install and start Docker Desktop
4. Verify installation: `docker --version`

### Step 2: Configure Environment Variables

```bash
cd backend
cp .env.example .env
```

Edit `.env` and add your Groq API key:
```env
GROQ_API_KEY=your_actual_groq_api_key_here
```

Get your Groq API key from: https://console.groq.com/

### Step 3: Start Database Services

From the project root directory:

```bash
# Start Postgres and ChromaDB
docker compose up -d

# Verify services are running
docker compose ps
```

You should see:
- `rag-postgres` running on port 5432
- `rag-chromadb` running on port 8000

### Step 4: Initialize Database

```bash
cd backend

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view database
npx prisma studio
```

### Step 5: Start the Backend Server

```bash
cd backend

# Development mode with auto-reload
npm run dev

# Or production mode
npm start
```

The backend server will start on http://localhost:3001

## API Documentation

Interactive API documentation is available via Swagger UI:

**http://localhost:3001/api-docs**

The Swagger UI provides:
- Complete API reference for all endpoints
- Interactive request/response testing
- Schema definitions and examples
- Try-it-out functionality to test endpoints directly from the browser

You can also find the OpenAPI specification file at `backend/openapi.yaml`

## API Endpoints

### Health Check
```bash
GET http://localhost:3001/health
```

### Document Management

**Upload a document:**
```bash
POST http://localhost:3001/api/documents/upload
Content-Type: multipart/form-data

file: <your-pdf-or-txt-file>
userId: default-user
```

**List documents:**
```bash
GET http://localhost:3001/api/documents?userId=default-user
```

**Get document details:**
```bash
GET http://localhost:3001/api/documents/:id
```

**Delete document:**
```bash
DELETE http://localhost:3001/api/documents/:id
```

### Chat / RAG Queries

**Send a query:**
```bash
POST http://localhost:3001/api/chat/query
Content-Type: application/json

{
  "query": "What is this document about?",
  "userId": "default-user"
}
```

**Streaming response:**
```bash
POST http://localhost:3001/api/chat/stream
Content-Type: application/json

{
  "query": "Explain the main concepts",
  "userId": "default-user"
}
```

**Get chat history:**
```bash
GET http://localhost:3001/api/chat/history?userId=default-user
```

**Clear chat history:**
```bash
DELETE http://localhost:3001/api/chat/history?userId=default-user
```

## Testing the Setup

### 1. Check Docker Services

```bash
# Check Postgres
docker exec -it rag-postgres psql -U raguser -d ragdb -c "SELECT 1;"

# Check ChromaDB
curl http://localhost:8000/api/v1/heartbeat
```

### 2. Test Backend API

```bash
# Health check
curl http://localhost:3001/health

# Upload a test document
curl -X POST http://localhost:3001/api/documents/upload \
  -F "file=@/path/to/your/test.pdf" \
  -F "userId=default-user"

# Query the document
curl -X POST http://localhost:3001/api/chat/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is this about?", "userId": "default-user"}'
```

## Project Structure

```
experimental_rag/
├── docker-compose.yml          # Docker services configuration
├── backend/
│   ├── openapi.yaml           # OpenAPI 3.0 specification
│   ├── config/                 # Database and service configurations
│   │   ├── database.js        # Prisma client
│   │   ├── chromadb.js        # ChromaDB client
│   │   └── groq.js            # Groq API client
│   ├── services/              # Business logic
│   │   ├── embeddingService.js
│   │   ├── documentService.js
│   │   └── ragService.js
│   ├── routes/                # API routes
│   │   ├── documents.js
│   │   └── chat.js
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── index.js               # Express server
│   └── .env                   # Environment variables
└── frontend/                   # (To be implemented)
```

## Database Schema

### Users
- Stores user authentication information
- Links to documents and chat history

### Documents
- Tracks uploaded documents
- Stores processing status and metadata
- Links to document chunks

### DocumentChunks
- Stores individual text chunks
- References ChromaDB vector IDs
- Enables text reconstruction

### ChatHistory
- Stores conversation history
- Links to context documents used
- Supports conversation continuity

## Important Notes

### Embeddings
Currently using a **placeholder embedding service**. For production:

1. **OpenAI Embeddings**: Use `text-embedding-3-small` or `text-embedding-ada-002`
2. **Cohere Embeddings**: Use Cohere's embedding models
3. **Local Models**: Use sentence-transformers or similar

Update `backend/services/embeddingService.js` with your chosen provider.

### Security
- The current setup uses a default user ID for testing
- Implement NextAuth in Phase 2 for proper authentication
- Add JWT middleware to protect routes
- Never commit `.env` file to version control

## Troubleshooting

### Docker Issues
```bash
# Stop all containers
docker compose down

# Remove volumes and restart fresh
docker compose down -v
docker compose up -d
```

### Database Issues
```bash
# Reset database
npx prisma migrate reset

# Regenerate Prisma client
npx prisma generate
```

### Port Conflicts
If ports 5432 or 8000 are already in use, edit `docker-compose.yml` to change the ports.

## Next Steps

1. ✅ Backend setup complete
2. 📝 Implement authentication (NextAuth)
3. 📝 Build Next.js frontend
4. 📝 Add proper embedding service
5. 📝 Deploy to EC2

## Development Commands

```bash
# Backend development
cd backend
npm run dev              # Start dev server with auto-reload
npm run prisma:studio    # Open database GUI
npm run prisma:migrate   # Create new migration

# Docker
docker compose up -d     # Start services
docker compose down      # Stop services
docker compose logs -f   # View logs
```

## License

ISC
