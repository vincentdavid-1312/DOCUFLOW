# Implementation Plan: DocuFlow — Mobile-First Document & PDF Studio

DocuFlow is a cross-platform, mobile-first productivity studio designed for iOS, Android, and Desktop. It combines camera/document scanning, advanced AI OCR powered by `gemini-3.1-pro-preview` with `ThinkingLevel.HIGH`, interactive PDF page editing & digital signatures, format conversion, PDF compression, and cross-device cloud synchronization.

---

## 1. User Experience & Architecture

### 1.1 Responsive Mobile-First Studio UI
- **Device-Agnostic Layout**: Tailored for iOS (safe-area spacing, bottom action sheets) and Android (bottom navigation bar, floating action buttons), while seamlessly scaling to desktop with a clean slate and indigo theme.
- **Top Bar**: Search bar, device indicator (iOS/Android/Web), cloud sync status with real-time sync pill, and storage quota visualizer.
- **Navigation Modes**:
  1. **Library & Files**: Folder management, tag filters, file size breakdown, batch export/delete, search.
  2. **Smart Scanner**: Real-time camera capture & image upload, edge detection/crop, color filters (Original, Magic Color, B&W, Grayscale, High Contrast).
  3. **PDF & Document Editor**: Page thumbnail reordering, page rotation, page deletion, watermark, freehand signature & stamps, text annotations.
  4. **AI OCR & Intelligence (Gemini 3.1 Pro High Thinking)**: Extract text, transcribe complex tabular data, receipts, invoices, translation, and structured data export (Markdown, TXT, JSON).
  5. **Converter & Compressor**: Convert between PDF, Images, Text, and Markdown; optimize PDF file size with live preview and compression ratio.
  6. **Cloud Sync & Devices**: View synced files, device management, cloud backup status, and offline queue.

---

## 2. Technical Stack & Key Modules

### 2.1 Dependencies
- **UI & Animation**: `lucide-react`, `motion`, Tailwind CSS v4.
- **PDF Manipulation**: `pdf-lib` (client-side PDF creation, merging, splitting, watermark, signatures, compression).
- **AI OCR**: `@google/genai` TypeScript SDK with `gemini-3.1-pro-preview` and `thinkingConfig: { thinkingLevel: 'HIGH' }`.
- **Backend Proxy**: Express server (`server.ts`) for secure server-side Gemini API calls, preventing client-side key leakage.
- **Offline & Cloud Storage**: LocalStorage / IndexedDB with simulated cloud sync and Firestore readiness.

### 2.2 Deep Document Intelligence with High Thinking
- Implements `gemini-3.1-pro-preview` with `thinkingLevel: 'HIGH'` for:
  - Complex table structure preservation.
  - Multi-lingual handwriting and low-light document transcription.
  - Automatic document categorization (Invoice, Contract, ID, Note, Receipt).
  - Smart summarization and actionable entity extraction (dates, amounts, parties).

---

## 3. Verification Plan
- **Build & Quality Check**: Run `compile_applet` and verify no TypeScript or Vite bundling issues.
- **Functionality Verification**:
  - Verify Scanner upload and filter processing.
  - Verify High Thinking OCR execution and editable output.
  - Verify PDF generation, page reordering, signature drawing, and download.
  - Verify PDF compression calculation and size reduction.
  - Verify offline persistence and cloud sync simulation.
