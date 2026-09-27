export type DocumentCategory = 'all' | 'scans' | 'pdfs' | 'ocr' | 'invoices' | 'contracts' | 'notes';

export interface DocAnnotation {
  id: string;
  pageNumber: number;
  type: 'signature' | 'watermark' | 'text' | 'date';
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  content: string; // text or base64 image
  color?: string;
  fontSize?: number;
  opacity?: number;
  rotation?: number;
}

export interface DocumentPage {
  pageNumber: number;
  dataUrl: string; // image representation of page
  rotation: number; // 0, 90, 180, 270
}

export interface DocAttachment {
  id: string;
  name: string;
  type: string; // mime type
  sizeBytes: number;
  dataUrl: string;
  uploadedAt: string;
}

export interface OCROutput {
  documentType: string;
  title: string;
  confidenceScore: number;
  summary: string;
  extractedText: string;
  entities: Array<{ label: string; value: string }>;
  tablesDetected: number;
  handwritingDetected: boolean;
  languageDetected: string;
  modelUsed?: string;
}

export interface AppDocument {
  id: string;
  name: string;
  category: 'scans' | 'pdfs' | 'ocr' | 'invoices' | 'contracts' | 'notes';
  type: 'pdf' | 'image' | 'text';
  sizeBytes: number;
  updatedAt: string;
  createdAt: string;
  pageCount: number;
  pages: DocumentPage[];
  pdfDataUri?: string;
  ocrData?: OCROutput;
  annotations: DocAnnotation[];
  attachments?: DocAttachment[];
  tags: string[];
  isCloudSynced: boolean;
  deviceId: string;
  favorite?: boolean;
}

export interface DeviceInfo {
  id: string;
  name: string;
  platform: 'ios' | 'android' | 'desktop' | 'web';
  lastSeen: string;
  isCurrent: boolean;
}

export type ChatRole = 'legal_auditor' | 'doc_analyst' | 'speed_assistant';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: string;
  attachedDocNames?: string[];
}
