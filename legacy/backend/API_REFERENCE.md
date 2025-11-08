# RAG Backend API Reference

## Interactive Documentation

The easiest way to explore the API is through the interactive Swagger UI:

**🔗 http://localhost:3001/api-docs**

## Quick Reference

### Base URL
```
http://localhost:3001
```

### Available Endpoints

#### Health & Status
- `GET /health` - Check server health

#### Documents
- `POST /api/documents/upload` - Upload a document (PDF, TXT, MD)
- `GET /api/documents` - List all documents
- `GET /api/documents/{id}` - Get document details
- `DELETE /api/documents/{id}` - Delete a document

#### Chat
- `POST /api/chat/query` - Send a query (returns complete response)
- `POST /api/chat/stream` - Send a query (returns streaming response)
- `GET /api/chat/history` - Get chat history
- `DELETE /api/chat/history` - Clear chat history

## OpenAPI Specification

The complete OpenAPI 3.0 specification is available at:
- **File**: `backend/openapi.yaml`
- **Interactive UI**: http://localhost:3001/api-docs

## Using the OpenAPI Spec

### 1. Generate Client SDKs

You can use the OpenAPI spec to generate client libraries in various languages:

```bash
# Install openapi-generator
npm install -g @openapitools/openapi-generator-cli

# Generate TypeScript client
openapi-generator-cli generate \
  -i backend/openapi.yaml \
  -g typescript-axios \
  -o ./frontend/src/api

# Generate Python client
openapi-generator-cli generate \
  -i backend/openapi.yaml \
  -g python \
  -o ./python-client
```

### 2. Import into Postman

1. Open Postman
2. Click "Import"
3. Select `backend/openapi.yaml`
4. All endpoints will be available as a collection

### 3. Import into Insomnia

1. Open Insomnia
2. Create new Request Collection
3. Import from File → Select `backend/openapi.yaml`

### 4. Use with API Testing Tools

```bash
# Validate the spec
npx @stoplight/spectral-cli lint backend/openapi.yaml

# Generate documentation
npx redoc-cli bundle backend/openapi.yaml -o api-docs.html
```

## Example Requests

### Upload a Document

```bash
curl -X POST http://localhost:3001/api/documents/upload \
  -F "file=@document.pdf" \
  -F "userId=user123"
```

### Query with RAG

```bash
curl -X POST http://localhost:3001/api/chat/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the main topics?",
    "userId": "user123"
  }'
```

### Streaming Response

```bash
curl -X POST http://localhost:3001/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Explain in detail",
    "userId": "user123"
  }'
```

## Response Formats

All responses (except streaming) are JSON:

### Success Response
```json
{
  "data": {...}
}
```

### Error Response
```json
{
  "error": "Error message"
}
```

### Streaming Response (SSE)
```
data: {"content":"token"}

data: {"content":"token"}

data: [DONE]
```

## Authentication

Currently using `userId` parameter for testing. Phase 2 will add:
- NextAuth integration
- JWT tokens
- Protected routes with middleware

## Rate Limiting

- **Rate Limit**: 100 requests per 15 minutes per IP
- **Applies to**: All `/api/*` endpoints
- **Response when exceeded**: HTTP 429 Too Many Requests

## File Upload Limits

- **Max file size**: 10MB
- **Allowed types**:
  - PDF (`application/pdf`)
  - Text (`text/plain`)
  - Markdown (`text/markdown`)

## CORS Configuration

Currently configured to allow:
- **Origin**: `http://localhost:3000` (Next.js frontend)
- **Credentials**: Enabled

Modify in `backend/index.js` if you need different origins.
