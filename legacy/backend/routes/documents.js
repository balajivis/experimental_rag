import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import prisma from '../config/database.js';
import documentService from '../services/documentService.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = './uploads';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, TXT, and MD files are allowed.'));
    }
  }
});

/**
 * Extract text from PDF using pdfjs-dist
 */
async function extractPdfText(filePath) {
  const dataBuffer = await fs.readFile(filePath);
  const uint8Array = new Uint8Array(dataBuffer);

  const loadingTask = pdfjsLib.getDocument({
    data: uint8Array,
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const textContent = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    textContent.push(pageText);
  }

  return textContent.join('\n\n');
}

/**
 * Extract text from file based on type
 */
async function extractText(filePath, mimeType) {
  if (mimeType === 'application/pdf') {
    return await extractPdfText(filePath);
  } else if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
    return await fs.readFile(filePath, 'utf-8');
  }
  throw new Error('Unsupported file type');
}

/**
 * POST /api/documents/upload
 * Upload and process a document
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // TODO: Get userId from auth middleware
    const userId = req.body.userId || 'default-user';

    // Create document record
    const document = await prisma.document.create({
      data: {
        userId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        status: 'PROCESSING'
      }
    });

    // Extract text from file
    const text = await extractText(req.file.path, req.file.mimetype);

    // Process document asynchronously
    documentService.processDocument(document.id, text)
      .catch(error => console.error('Error processing document:', error));

    res.status(202).json({
      message: 'Document uploaded and processing started',
      document: {
        id: document.id,
        filename: document.originalName,
        status: document.status
      }
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/documents
 * List all documents for a user
 */
router.get('/', async (req, res) => {
  try {
    // TODO: Get userId from auth middleware
    const userId = req.query.userId || 'default-user';

    const documents = await prisma.document.findMany({
      where: { userId },
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        size: true,
        status: true,
        uploadedAt: true,
        processedAt: true,
        chunkCount: true,
        error: true
      }
    });

    res.json({ documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/documents/:id
 * Get document details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        chunks: {
          select: {
            chunkIndex: true,
            content: true
          },
          orderBy: { chunkIndex: 'asc' }
        }
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ document });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/documents/:id
 * Delete a document
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await documentService.deleteDocument(id);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
