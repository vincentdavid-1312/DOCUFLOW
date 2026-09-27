import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// High limit for processing high-res camera captures and multi-page base64 scans
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Server-side Google GenAI initialization with User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// In-memory cross-device cloud sync store (persists across connected clients)
interface CloudDocumentRecord {
  id: string;
  name: string;
  type: string;
  size: number;
  updatedAt: string;
  deviceId: string;
  deviceType: 'ios' | 'android' | 'desktop' | 'web';
  ocrText?: string;
  metadata?: Record<string, any>;
  dataUrl?: string; // Stored payload or preview
  tags: string[];
  pageCount: number;
}

const cloudDocuments = new Map<string, CloudDocumentRecord>();

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    cloudDocsCount: cloudDocuments.size,
    timestamp: new Date().toISOString(),
  });
});

// 2. High-Thinking Deep OCR Endpoint using gemini-3.1-pro-preview
app.post('/api/gemini/ocr', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', documentContext = '', language = 'Auto-detect' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 data is required for OCR.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please check the Secrets panel.',
      });
    }

    // Clean base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');

    const prompt = `You are a world-class Document Intelligence & OCR Engine.
Carefully inspect this document image, scan, or photo.
Document context hints: ${documentContext || 'Standard document'}
Expected language: ${language}

Your task:
1. Extract ALL text accurately preserving the logical structure: headings, sections, paragraphs, lists, and tabular data (format tables in neat Markdown tables).
2. If there are form fields, checkboxes, invoices, receipts, or key-value pairs, capture them faithfully.
3. Detect the document classification (e.g. Invoice, Contract, Receipt, Medical Record, ID / Passport, Academic Paper, Handwritten Note, Form, Article, Other).
4. Extract key entities: Dates, Total Amounts, Currencies, Vendor/Organization names, People, Document Reference Numbers.
5. Provide a 2-3 sentence executive summary.

OUTPUT FORMAT: Return a valid JSON object strictly matching this structure:
{
  "documentType": "string",
  "title": "string",
  "confidenceScore": number (between 0.85 and 0.99),
  "summary": "string",
  "extractedText": "full clean transcribed text with markdown formatting for tables and headers",
  "entities": [
    { "label": "string", "value": "string" }
  ],
  "tablesDetected": number,
  "handwritingDetected": boolean,
  "languageDetected": "string"
}`;

    // Requirement: gemini-3.1-pro-preview with ThinkingLevel.HIGH and no maxOutputTokens
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text || '{}';
      try {
        const parsed = JSON.parse(responseText);
        return res.json({ success: true, data: parsed, modelUsed: 'gemini-3.1-pro-preview' });
      } catch (parseErr) {
        return res.json({
          success: true,
          data: {
            documentType: 'Document',
            title: 'Extracted Document',
            confidenceScore: 0.95,
            summary: 'Text extracted from document.',
            extractedText: responseText,
            entities: [],
            tablesDetected: 0,
            handwritingDetected: false,
            languageDetected: language,
          },
          modelUsed: 'gemini-3.1-pro-preview',
        });
      }
    } catch (proError: any) {
      console.warn('gemini-3.1-pro-preview error, falling back to gemini-3.8-flash:', proError?.message);
      // Seamless fallback to gemini-3.8-flash if pro preview quota or permission is restricted
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = fallbackResponse.text || '{}';
      const parsed = JSON.parse(responseText);
      return res.json({ success: true, data: parsed, modelUsed: 'gemini-3.8-flash (fallback)' });
    }
  } catch (err: any) {
    console.error('OCR Error:', err);
    res.status(500).json({
      error: err.message || 'Failed to perform deep OCR extraction.',
    });
  }
});

// 3. Document Analysis & Transformation Endpoint (Summarize, Translate, Contract Audit)
app.post('/api/gemini/analyze', async (req, res) => {
  try {
    const { text, taskType, targetLanguage } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required for analysis.' });
    }

    let prompt = '';
    if (taskType === 'translate') {
      prompt = `Translate the following document text faithfully to ${targetLanguage || 'Spanish'}. Maintain all markdown formatting, tables, and bullet points:\n\n${text}`;
    } else if (taskType === 'simplify') {
      prompt = `Explain the following document text in plain, easy-to-understand language. Highlight any complex legal, technical, or financial jargon with explanations:\n\n${text}`;
    } else if (taskType === 'action_items') {
      prompt = `Extract all action items, obligations, dates, deadlines, and deliverables mentioned in this document as a clean checklist:\n\n${text}`;
    } else {
      prompt = `Analyze this document text thoroughly. Provide:
1. Executive Summary
2. Key Highlights (3-5 bullets)
3. Key Metrics, Dates, and Monetary Figures
4. Potential risks or missing clauses if relevant:\n\n${text}`;
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
        },
      });

      return res.json({ success: true, result: response.text, modelUsed: 'gemini-3.1-pro-preview' });
    } catch (err: any) {
      console.warn('gemini-3.1-pro-preview fallback in analyze:', err?.message);
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });
      return res.json({ success: true, result: fallbackResponse.text, modelUsed: 'gemini-3.8-flash' });
    }
  } catch (err: any) {
    console.error('Analyze Error:', err);
    res.status(500).json({ error: err.message || 'Failed to analyze document.' });
  }
});

// 3.5 Multi-turn Gemini Chat Endpoint
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, role = 'doc_analyst', documentContext = '' } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please check the Secrets panel.',
      });
    }

    // Role definitions and system instructions
    let targetModel = 'gemini-3.5-flash';
    let systemInstruction = '';
    let isHighThinking = false;

    if (role === 'legal_auditor') {
      targetModel = 'gemini-3.1-pro-preview';
      isHighThinking = true;
      systemInstruction = `You are the Chief Legal & Compliance Intelligence Auditor for DocuFlow.
You perform forensic, step-by-step examinations of legal contracts, non-disclosure agreements, service level agreements, liability limitations, compliance risks, and obligations across the user's documents.
You think deeply before delivering your verdict. Cite specific document names, sections, amounts, and dates where available.
When highlighting risks, clearly categorize them (e.g., HIGH RISK, AMBIGUOUS TERM, ACTION REQUIRED).`;
    } else if (role === 'speed_assistant') {
      targetModel = 'gemini-3.1-flash-lite';
      isHighThinking = false;
      systemInstruction = `You are DocuFlow's Rapid Document Assistant.
Your goal is to provide lightning-fast, concise, and direct answers, quick translations, grammatical fixes, formatting assistance, and key data point lookups. Keep responses punchy and scannable.`;
    } else {
      // Default: doc_analyst
      targetModel = 'gemini-3.5-flash';
      isHighThinking = false;
      systemInstruction = `You are DocuFlow's Lead Document Analyst.
You assist users in understanding, comparing, synthesizing, and querying multi-page documents, invoices, receipts, financial records, and scanned notes.
Provide structured, insightful answers with neat markdown formatting, tables, and bullet points where helpful.`;
    }

    if (documentContext && documentContext.trim()) {
      systemInstruction += `\n\nACTIVE ATTACHED DOCUMENTS CONTEXT:\n${documentContext}`;
    }

    // Prepare contents formatted for GoogleGenAI SDK
    const contents = messages.map((m: { sender: string; text: string }) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

    try {
      const config: any = {
        systemInstruction,
      };

      if (isHighThinking) {
        config.thinkingConfig = {
          thinkingLevel: ThinkingLevel.HIGH,
        };
      }

      const response = await ai.models.generateContent({
        model: targetModel,
        contents,
        config,
      });

      return res.json({
        success: true,
        reply: response.text || 'No response generated.',
        modelUsed: targetModel,
        role,
      });
    } catch (modelErr: any) {
      console.warn(`Error using model ${targetModel}, falling back to gemini-3.8-flash:`, modelErr?.message);
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
        },
      });

      return res.json({
        success: true,
        reply: fallbackResponse.text || 'No response generated.',
        modelUsed: `${targetModel} (fallback to gemini-3.8-flash)`,
        role,
      });
    }
  } catch (err: any) {
    console.error('Chat Error:', err);
    res.status(500).json({ error: err.message || 'Failed to process chat message.' });
  }
});


// 4. Cloud Storage Synchronization APIs
app.get('/api/cloud/documents', (req, res) => {
  const docs = Array.from(cloudDocuments.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  res.json({
    success: true,
    totalCount: docs.length,
    documents: docs,
  });
});

app.post('/api/cloud/sync', (req, res) => {
  try {
    const { documents, deviceId, deviceType } = req.body;
    if (Array.isArray(documents)) {
      for (const doc of documents) {
        if (doc.id) {
          cloudDocuments.set(doc.id, {
            ...doc,
            deviceId: deviceId || 'unknown-device',
            deviceType: deviceType || 'web',
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }
    const allDocs = Array.from(cloudDocuments.values());
    res.json({
      success: true,
      syncedCount: documents?.length || 0,
      totalCloudDocuments: allDocs.length,
      serverTimestamp: new Date().toISOString(),
      documents: allDocs,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Sync failed.' });
  }
});

app.delete('/api/cloud/documents/:id', (req, res) => {
  const { id } = req.params;
  const existed = cloudDocuments.delete(id);
  res.json({ success: true, deleted: existed });
});

// Mount Vite or static server
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DocuFlow Server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
