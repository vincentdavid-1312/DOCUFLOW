import { AppDocument } from '../types/document';

function createSvgPageDataUrl(svgContent: string): string {
  const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1130" viewBox="0 0 800 1130">${svgContent}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(fullSvg)}`;
}

// 1. Invoice Page 1
const invoiceSvg = `
  <rect width="800" height="1130" fill="#ffffff" />
  <!-- Header bar -->
  <rect x="0" y="0" width="800" height="16" fill="#4f46e5" />
  
  <text x="50" y="70" font-family="Helvetica, Arial, sans-serif" font-size="28" font-weight="bold" fill="#0f172a">APEX LOGIC SYSTEMS</text>
  <text x="50" y="95" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="#64748b">Cloud Infrastructure &amp; AI Enterprise Solutions</text>
  <text x="50" y="112" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="#64748b">100 Tech Promenade, Suite 400, San Francisco, CA</text>
  
  <rect x="580" y="45" width="170" height="75" rx="6" fill="#f8fafc" stroke="#e2e8f0" />
  <text x="595" y="72" font-family="Helvetica, Arial, sans-serif" font-size="11" font-weight="bold" fill="#64748b">INVOICE NUMBER</text>
  <text x="595" y="94" font-family="Helvetica, Arial, sans-serif" font-size="16" font-weight="bold" fill="#4f46e5">#INV-2026-8891</text>
  <text x="595" y="110" font-family="Helvetica, Arial, sans-serif" font-size="11" fill="#64748b">Date: Oct 14, 2026</text>
  
  <!-- Client info -->
  <text x="50" y="165" font-family="Helvetica, Arial, sans-serif" font-size="11" font-weight="bold" fill="#94a3b8">BILLED TO:</text>
  <text x="50" y="188" font-family="Helvetica, Arial, sans-serif" font-size="15" font-weight="bold" fill="#0f172a">Vanguard Robotics Corp</text>
  <text x="50" y="208" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="#334155">Attn: Finance &amp; Procurement</text>
  <text x="50" y="225" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="#334155">742 Evergreen Gateway, Austin, TX 78701</text>
  
  <!-- Table Header -->
  <rect x="50" y="270" width="700" height="36" fill="#f1f5f9" rx="4" />
  <text x="65" y="293" font-family="Helvetica, Arial, sans-serif" font-size="11" font-weight="bold" fill="#475569">DESCRIPTION</text>
  <text x="460" y="293" font-family="Helvetica, Arial, sans-serif" font-size="11" font-weight="bold" fill="#475569">QTY</text>
  <text x="530" y="293" font-family="Helvetica, Arial, sans-serif" font-size="11" font-weight="bold" fill="#475569">RATE</text>
  <text x="660" y="293" font-family="Helvetica, Arial, sans-serif" font-size="11" font-weight="bold" fill="#475569">AMOUNT</text>
  
  <!-- Rows -->
  <line x1="50" y1="350" x2="750" y2="350" stroke="#f1f5f9" stroke-width="1" />
  <text x="65" y="330" font-family="Helvetica, Arial, sans-serif" font-size="13" font-weight="600" fill="#0f172a">Enterprise AI Engine Cluster (Q3 Deployment)</text>
  <text x="65" y="344" font-family="Helvetica, Arial, sans-serif" font-size="11" fill="#64748b">High-throughput GPU dedicated cluster setup &amp; optimization</text>
  <text x="470" y="336" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="#334155">1</text>
  <text x="525" y="336" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="#334155">$8,450.00</text>
  <text x="660" y="336" font-family="Helvetica, Arial, sans-serif" font-size="13" font-weight="bold" fill="#0f172a">$8,450.00</text>
  
  <line x1="50" y1="410" x2="750" y2="410" stroke="#f1f5f9" stroke-width="1" />
  <text x="65" y="380" font-family="Helvetica, Arial, sans-serif" font-size="13" font-weight="600" fill="#0f172a">Real-time Vision OCR Pipeline Integration</text>
  <text x="65" y="394" font-family="Helvetica, Arial, sans-serif" font-size="11" fill="#64748b">Sub-second document extraction API &amp; SDK configuration</text>
  <text x="470" y="386" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="#334155">2</text>
  <text x="525" y="386" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="#334155">$2,200.00</text>
  <text x="660" y="386" font-family="Helvetica, Arial, sans-serif" font-size="13" font-weight="bold" fill="#0f172a">$4,400.00</text>

  <line x1="50" y1="470" x2="750" y2="470" stroke="#f1f5f9" stroke-width="1" />
  <text x="65" y="440" font-family="Helvetica, Arial, sans-serif" font-size="13" font-weight="600" fill="#0f172a">Cloud Sync &amp; Firestore Security Hardening</text>
  <text x="65" y="454" font-family="Helvetica, Arial, sans-serif" font-size="11" fill="#64748b">End-to-end encrypted backup nodes and role-based policies</text>
  <text x="470" y="446" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="#334155">1</text>
  <text x="525" y="446" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="#334155">$1,850.00</text>
  <text x="660" y="446" font-family="Helvetica, Arial, sans-serif" font-size="13" font-weight="bold" fill="#0f172a">$1,850.00</text>
  
  <!-- Totals -->
  <rect x="440" y="500" width="310" height="150" fill="#f8fafc" rx="8" stroke="#e2e8f0" />
  <text x="460" y="530" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="#64748b">Subtotal:</text>
  <text x="665" y="530" font-family="Helvetica, Arial, sans-serif" font-size="12" font-weight="bold" fill="#0f172a">$14,700.00</text>
  <text x="460" y="555" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="#64748b">Tax (8.25%):</text>
  <text x="672" y="555" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="#0f172a">$1,212.75</text>
  <line x1="460" y1="575" x2="730" y2="575" stroke="#cbd5e1" stroke-width="1" />
  <text x="460" y="605" font-family="Helvetica, Arial, sans-serif" font-size="15" font-weight="bold" fill="#0f172a">TOTAL DUE:</text>
  <text x="635" y="605" font-family="Helvetica, Arial, sans-serif" font-size="18" font-weight="bold" fill="#4f46e5">$15,912.75</text>
  
  <!-- Payment details -->
  <text x="50" y="530" font-family="Helvetica, Arial, sans-serif" font-size="11" font-weight="bold" fill="#94a3b8">PAYMENT TERMS:</text>
  <text x="50" y="550" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="#334155">Net 30 Days. Wire transfer preferred.</text>
  <text x="50" y="570" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="#334155">Routing: 121000358 | Account: 988421099</text>
  
  <rect x="50" y="680" width="700" height="80" rx="6" fill="#fdf2f8" stroke="#fbcfe8" />
  <text x="70" y="715" font-family="Helvetica, Arial, sans-serif" font-size="12" font-weight="bold" fill="#9d174d">NOTE:</text>
  <text x="70" y="738" font-family="Helvetica, Arial, sans-serif" font-size="11" fill="#831843">Thank you for your business. For any billing queries, contact accounting@apexlogic.io within 10 days of receipt.</text>
  
  <text x="400" y="1080" font-family="Helvetica, Arial, sans-serif" font-size="10" fill="#94a3b8" text-anchor="middle">Page 1 of 1 — Generated automatically via DocuFlow Enterprise</text>
`;

// 2. Mutual NDA Agreement Page 1
const ndaSvg = `
  <rect width="800" height="1130" fill="#ffffff" />
  <text x="400" y="80" font-family="Times New Roman, serif" font-size="22" font-weight="bold" text-anchor="middle" fill="#0f172a">MUTUAL NON-DISCLOSURE AGREEMENT</text>
  <text x="400" y="105" font-family="Times New Roman, serif" font-size="12" text-anchor="middle" fill="#64748b">Contract Reference: NDA-2026-MOD-994</text>
  
  <line x1="80" y1="125" x2="720" y2="125" stroke="#cbd5e1" stroke-width="1.5" />
  
  <text x="80" y="160" font-family="Times New Roman, serif" font-size="13" fill="#1e293b">This Mutual Non-Disclosure Agreement ("Agreement") is made effective as of October 1, 2026 by and</text>
  <text x="80" y="180" font-family="Times New Roman, serif" font-size="13" fill="#1e293b">between <tspan font-weight="bold">Meridian NextGen Inc.</tspan>, a Delaware corporation ("Disclosing Party"), and</text>
  <text x="80" y="200" font-family="Times New Roman, serif" font-size="13" fill="#1e293b"><tspan font-weight="bold">Quantum Stream Software LLC</tspan>, a California limited liability company ("Receiving Party").</text>
  
  <text x="80" y="240" font-family="Times New Roman, serif" font-size="14" font-weight="bold" fill="#0f172a">1. PURPOSE</text>
  <text x="80" y="265" font-family="Times New Roman, serif" font-size="12.5" fill="#334155">The parties wish to explore a potential business collaboration regarding next-generation optical character</text>
  <text x="80" y="285" font-family="Times New Roman, serif" font-size="12.5" fill="#334155">recognition, document intelligence compression engines, and cross-platform synchronization systems.</text>
  
  <text x="80" y="325" font-family="Times New Roman, serif" font-size="14" font-weight="bold" fill="#0f172a">2. CONFIDENTIAL INFORMATION</text>
  <text x="80" y="350" font-family="Times New Roman, serif" font-size="12.5" fill="#334155">"Confidential Information" shall include all financial data, source code, neural network model weights,</text>
  <text x="80" y="370" font-family="Times New Roman, serif" font-size="12.5" fill="#334155">customer lists, pricing schedules, and proprietary algorithms disclosed in oral, visual, or written form.</text>
  
  <text x="80" y="410" font-family="Times New Roman, serif" font-size="14" font-weight="bold" fill="#0f172a">3. OBLIGATIONS &amp; NON-USE</text>
  <text x="80" y="435" font-family="Times New Roman, serif" font-size="12.5" fill="#334155">The Receiving Party agrees to protect the Confidential Information using the same degree of care it</text>
  <text x="80" y="455" font-family="Times New Roman, serif" font-size="12.5" fill="#334155">uses for its own sensitive assets, but in no case less than a reasonable standard of care.</text>
  
  <text x="80" y="495" font-family="Times New Roman, serif" font-size="14" font-weight="bold" fill="#0f172a">4. TERM AND TERMINATION</text>
  <text x="80" y="520" font-family="Times New Roman, serif" font-size="12.5" fill="#334155">This Agreement and the confidentiality obligations herein shall remain in effect for three (3) years</text>
  <text x="80" y="540" font-family="Times New Roman, serif" font-size="12.5" fill="#334155">from the date of initial execution.</text>

  <!-- Signatures Section -->
  <line x1="80" y1="620" x2="720" y2="620" stroke="#e2e8f0" stroke-width="1" />
  <text x="80" y="650" font-family="Times New Roman, serif" font-size="13" font-weight="bold" fill="#0f172a">IN WITNESS WHEREOF, the authorized representatives have executed this agreement:</text>
  
  <text x="80" y="700" font-family="Helvetica, Arial, sans-serif" font-size="11" font-weight="bold" fill="#64748b">FOR MERIDIAN NEXTGEN INC.:</text>
  <line x1="80" y1="760" x2="350" y2="760" stroke="#0f172a" stroke-width="1" />
  <text x="80" y="778" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="#0f172a">Dr. Elena Rostova, CEO</text>
  <text x="80" y="794" font-family="Helvetica, Arial, sans-serif" font-size="11" fill="#64748b">Date: Oct 02, 2026</text>
  
  <text x="440" y="700" font-family="Helvetica, Arial, sans-serif" font-size="11" font-weight="bold" fill="#64748b">FOR QUANTUM STREAM SOFTWARE LLC:</text>
  <line x1="440" y1="760" x2="710" y2="760" stroke="#0f172a" stroke-width="1" />
  <text x="440" y="778" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="#0f172a">Marcus Vance, VP of Technology</text>
  <text x="440" y="794" font-family="Helvetica, Arial, sans-serif" font-size="11" fill="#64748b">Date: Oct 03, 2026</text>
  
  <text x="400" y="1080" font-family="Times New Roman, serif" font-size="10" fill="#94a3b8" text-anchor="middle">Confidential — Subject to Legal Privilege — Page 1 of 1</text>
`;

// 3. Meeting Notes & Brainstorm (Handwriting look)
const notesSvg = `
  <rect width="800" height="1130" fill="#fffef7" />
  <!-- Notepad margin line -->
  <line x1="100" y1="0" x2="100" y2="1130" stroke="#fca5a5" stroke-width="1.5" />
  <!-- Lined paper horizontal rules -->
  <pattern id="lines" width="800" height="32" patternUnits="userSpaceOnUse">
    <line x1="0" y1="31" x2="800" y2="31" stroke="#e0e7ff" stroke-width="1" />
  </pattern>
  <rect x="0" y="100" width="800" height="1030" fill="url(#lines)" />

  <text x="120" y="75" font-family="Courier New, monospace" font-size="20" font-weight="bold" fill="#1e1b4b">PRODUCT STRATEGY NOTES: MOBILE DOC STUDIO</text>
  <text x="120" y="94" font-family="Courier New, monospace" font-size="12" fill="#6366f1">Date: 27 Sept 2026 | Location: San Francisco Hub</text>

  <text x="120" y="155" font-family="cursive, 'Comic Sans MS', sans-serif" font-size="15" fill="#1e3a8a">Key Objectives for Q4 Launch:</text>
  <text x="140" y="187" font-family="cursive, 'Comic Sans MS', sans-serif" font-size="14" fill="#1e3a8a">&#10004; 1. Fast Document Scanner with edge detection and B&amp;W filters</text>
  <text x="140" y="219" font-family="cursive, 'Comic Sans MS', sans-serif" font-size="14" fill="#1e3a8a">&#10004; 2. Gemini 3.1 Pro OCR with High Thinking for complex table parsing</text>
  <text x="140" y="251" font-family="cursive, 'Comic Sans MS', sans-serif" font-size="14" fill="#1e3a8a">&#10004; 3. PDF Editor with digital signatures &amp; drag-and-drop page reorder</text>
  <text x="140" y="283" font-family="cursive, 'Comic Sans MS', sans-serif" font-size="14" fill="#1e3a8a">&#10004; 4. High-efficiency client-side PDF compressor (reduce size by 65%+)</text>
  <text x="140" y="315" font-family="cursive, 'Comic Sans MS', sans-serif" font-size="14" fill="#1e3a8a">&#10004; 5. Instant multi-device sync across iOS, Android, and Desktop</text>

  <rect x="120" y="360" width="600" height="180" rx="8" fill="#eff6ff" stroke="#93c5fd" />
  <text x="140" y="395" font-family="cursive, 'Comic Sans MS', sans-serif" font-size="15" font-weight="bold" fill="#1e40af">Action Items &amp; Owners:</text>
  <text x="140" y="430" font-family="cursive, 'Comic Sans MS', sans-serif" font-size="14" fill="#1d4ed8">- Sarah: Finalize camera shutter sound &amp; haptic touch on mobile</text>
  <text x="140" y="462" font-family="cursive, 'Comic Sans MS', sans-serif" font-size="14" fill="#1d4ed8">- David: Test Gemini 3.1 Pro reasoning with handwritten prescriptions</text>
  <text x="140" y="494" font-family="cursive, 'Comic Sans MS', sans-serif" font-size="14" fill="#1d4ed8">- Maya: Deploy cloud sync endpoints with real-time replication</text>

  <text x="120" y="600" font-family="cursive, 'Comic Sans MS', sans-serif" font-size="14" fill="#334155">Next sync scheduled for Tuesday 10:00 AM PST.</text>
`;

export const INITIAL_SAMPLE_DOCUMENTS: AppDocument[] = [
  {
    id: 'doc-invoice-01',
    name: 'Apex Logic - Invoice #8891.pdf',
    category: 'invoices',
    type: 'pdf',
    sizeBytes: 1024 * 342, // ~342 KB
    updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    pageCount: 1,
    pages: [
      {
        pageNumber: 1,
        dataUrl: createSvgPageDataUrl(invoiceSvg),
        rotation: 0,
      },
    ],
    tags: ['Invoice', 'Billed', 'Hardware', 'Finance'],
    isCloudSynced: true,
    deviceId: 'device-iphone-16',
    favorite: true,
    annotations: [
      {
        id: 'ann-1',
        pageNumber: 1,
        type: 'watermark',
        content: 'PAID',
        x: 50,
        y: 50,
        opacity: 0.18,
        rotation: 30,
      },
    ],
    ocrData: {
      documentType: 'Invoice',
      title: 'Apex Logic Systems Invoice #INV-2026-8891',
      confidenceScore: 0.98,
      summary:
        'Tax invoice from Apex Logic Systems to Vanguard Robotics Corp for Enterprise AI Cluster, Vision OCR pipeline, and Firestore hardening totaling $15,912.75.',
      extractedText: `# APEX LOGIC SYSTEMS
Cloud Infrastructure & AI Enterprise Solutions
100 Tech Promenade, Suite 400, San Francisco, CA

**INVOICE #INV-2026-8891**
Date: Oct 14, 2026
Billed to: Vanguard Robotics Corp (Attn: Finance & Procurement)

| Description | Qty | Rate | Amount |
| :--- | :--- | :--- | :--- |
| Enterprise AI Engine Cluster (Q3 Deployment) | 1 | $8,450.00 | $8,450.00 |
| Real-time Vision OCR Pipeline Integration | 2 | $2,200.00 | $4,400.00 |
| Cloud Sync & Firestore Security Hardening | 1 | $1,850.00 | $1,850.00 |

**Subtotal:** $14,700.00  
**Tax (8.25%):** $1,212.75  
**TOTAL DUE:** $15,912.75  
Payment Terms: Net 30 Days`,
      entities: [
        { label: 'Invoice Number', value: '#INV-2026-8891' },
        { label: 'Total Due', value: '$15,912.75' },
        { label: 'Date', value: 'Oct 14, 2026' },
        { label: 'Vendor', value: 'Apex Logic Systems' },
        { label: 'Client', value: 'Vanguard Robotics Corp' },
      ],
      tablesDetected: 1,
      handwritingDetected: false,
      languageDetected: 'English',
      modelUsed: 'gemini-3.1-pro-preview',
    },
  },
  {
    id: 'doc-nda-02',
    name: 'Meridian Mutual NDA 2026.pdf',
    category: 'contracts',
    type: 'pdf',
    sizeBytes: 1024 * 512, // ~512 KB
    updatedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    pageCount: 1,
    pages: [
      {
        pageNumber: 1,
        dataUrl: createSvgPageDataUrl(ndaSvg),
        rotation: 0,
      },
    ],
    tags: ['Legal', 'NDA', 'Signed', 'Confidential'],
    isCloudSynced: true,
    deviceId: 'device-macbook-pro',
    favorite: false,
    annotations: [],
  },
  {
    id: 'doc-notes-03',
    name: 'Product Strategy & Roadmap Notes.pdf',
    category: 'notes',
    type: 'pdf',
    sizeBytes: 1024 * 180, // ~180 KB
    updatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    pageCount: 1,
    pages: [
      {
        pageNumber: 1,
        dataUrl: createSvgPageDataUrl(notesSvg),
        rotation: 0,
      },
    ],
    tags: ['Meeting', 'Product', 'Brainstorm', 'Mobile'],
    isCloudSynced: false,
    deviceId: 'device-pixel-9-pro',
    favorite: true,
    annotations: [],
  },
];
