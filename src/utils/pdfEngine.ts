import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { AppDocument, DocAnnotation } from '../types/document';

/**
 * Creates a valid PDF from an array of image page data URLs
 */
export async function createPdfFromPages(
  pages: { dataUrl: string; rotation: number }[],
  annotations: DocAnnotation[] = [],
  pageSize: 'A4' | 'LETTER' | 'FIT' = 'A4'
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // Page dimensions (points: 72 points per inch)
  const A4_WIDTH = 595.28;
  const A4_HEIGHT = 841.89;
  const LETTER_WIDTH = 612;
  const LETTER_HEIGHT = 792;

  for (let i = 0; i < pages.length; i++) {
    const pageItem = pages[i];
    const cleanBase64 = pageItem.dataUrl.replace(/^data:image\/\w+;base64,/, '');
    const isPng = pageItem.dataUrl.startsWith('data:image/png');

    let image;
    try {
      if (isPng) {
        image = await pdfDoc.embedPng(cleanBase64);
      } else {
        image = await pdfDoc.embedJpg(cleanBase64);
      }
    } catch {
      // Fallback try embedding as PNG if JPG fails or vice-versa
      try {
        image = await pdfDoc.embedPng(cleanBase64);
      } catch {
        image = await pdfDoc.embedJpg(cleanBase64);
      }
    }

    let pWidth = A4_WIDTH;
    let pHeight = A4_HEIGHT;

    if (pageSize === 'LETTER') {
      pWidth = LETTER_WIDTH;
      pHeight = LETTER_HEIGHT;
    } else if (pageSize === 'FIT') {
      pWidth = image.width;
      pHeight = image.height;
    }

    const page = pdfDoc.addPage([pWidth, pHeight]);
    page.setRotation(degrees(pageItem.rotation || 0));

    // Calculate image fitting within page margins (20pt padding)
    const padding = pageSize === 'FIT' ? 0 : 20;
    const availWidth = pWidth - padding * 2;
    const availHeight = pHeight - padding * 2;

    const scale = Math.min(availWidth / image.width, availHeight / image.height);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    const xPos = padding + (availWidth - drawWidth) / 2;
    const yPos = padding + (availHeight - drawHeight) / 2;

    page.drawImage(image, {
      x: xPos,
      y: yPos,
      width: drawWidth,
      height: drawHeight,
    });

    // Apply page-specific annotations
    const pageAnns = annotations.filter((a) => a.pageNumber === i + 1);
    for (const ann of pageAnns) {
      const annX = (ann.x / 100) * pWidth;
      const annY = pHeight - (ann.y / 100) * pHeight; // Invert for PDF coordinate system

      if (ann.type === 'signature' && ann.content.startsWith('data:image/')) {
        try {
          const sigClean = ann.content.replace(/^data:image\/\w+;base64,/, '');
          const sigImg = await pdfDoc.embedPng(sigClean);
          page.drawImage(sigImg, {
            x: annX,
            y: annY - 40,
            width: 130,
            height: 50,
          });
        } catch (e) {
          console.warn('Failed to embed signature into PDF:', e);
        }
      } else if (ann.type === 'watermark') {
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        page.drawText(ann.content || 'CONFIDENTIAL', {
          x: pWidth * 0.2,
          y: pHeight * 0.5,
          size: 44,
          font,
          color: rgb(0.85, 0.2, 0.2),
          opacity: ann.opacity || 0.25,
          rotate: degrees(ann.rotation || 35),
        });
      } else if (ann.type === 'text' || ann.type === 'date') {
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        page.drawText(ann.content, {
          x: annX,
          y: annY,
          size: ann.fontSize || 12,
          font,
          color: rgb(0.1, 0.1, 0.2),
        });
      }
    }
  }

  return await pdfDoc.save();
}

/**
 * Compress an existing PDF or set of document pages
 * Simulates and executes real image downsampling and quality reduction
 */
export async function compressDocument(
  doc: AppDocument,
  qualityFactor: number, // 0.3 (extreme), 0.6 (recommended), 0.85 (low)
  scaleFactor: number = 0.75 // downscale resolution
): Promise<{ compressedBytes: Uint8Array; estimatedSize: number; originalSize: number }> {
  const originalSize = doc.sizeBytes || 1024 * 350;

  // Process and downscale each page canvas
  const compressedPages = await Promise.all(
    doc.pages.map(async (p) => {
      const downscaled = await downscaleImageQuality(p.dataUrl, qualityFactor, scaleFactor);
      return {
        dataUrl: downscaled,
        rotation: p.rotation,
      };
    })
  );

  const compressedPdfBytes = await createPdfFromPages(compressedPages, doc.annotations, 'A4');
  const actualSize = compressedPdfBytes.byteLength;

  return {
    compressedBytes: compressedPdfBytes,
    estimatedSize: actualSize,
    originalSize,
  };
}

/**
 * Resample image quality and dimensions via Canvas
 */
export function downscaleImageQuality(
  dataUrl: string,
  quality: number,
  scale: number
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(300, Math.round(img.width * scale));
      canvas.height = Math.max(400, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'medium';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Convert plain text or Markdown to PDF with clean layout
 */
export async function createPdfFromText(
  title: string,
  content: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 45;
  const lineHeight = 16;
  const maxWidth = pageWidth - margin * 2;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // Header Title
  page.drawText(title || 'Converted Document', {
    x: margin,
    y: y - 20,
    size: 20,
    font: boldFont,
    color: rgb(0.12, 0.15, 0.25),
  });

  // Timestamp
  page.drawText(`Generated on ${new Date().toLocaleDateString()} with DocuFlow Studio`, {
    x: margin,
    y: y - 38,
    size: 9,
    font,
    color: rgb(0.4, 0.45, 0.55),
  });

  y -= 65;

  // Split lines and wrap text
  const lines = content.split('\n');

  for (const rawLine of lines) {
    if (y < margin + 40) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }

    if (rawLine.startsWith('# ')) {
      // Header 1
      y -= 10;
      page.drawText(rawLine.replace(/^#\s*/, ''), {
        x: margin,
        y,
        size: 15,
        font: boldFont,
        color: rgb(0.15, 0.18, 0.3),
      });
      y -= 22;
    } else if (rawLine.startsWith('## ')) {
      // Header 2
      y -= 6;
      page.drawText(rawLine.replace(/^##\s*/, ''), {
        x: margin,
        y,
        size: 13,
        font: boldFont,
        color: rgb(0.2, 0.25, 0.4),
      });
      y -= 18;
    } else {
      // Simple word wrapping
      const words = rawLine.split(' ');
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, 10);

        if (testWidth > maxWidth && currentLine) {
          if (y < margin + 20) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            y = pageHeight - margin;
          }
          page.drawText(currentLine, {
            x: margin,
            y,
            size: 10,
            font,
            color: rgb(0.15, 0.15, 0.2),
          });
          y -= lineHeight;
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        if (y < margin + 20) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }
        page.drawText(currentLine, {
          x: margin,
          y,
          size: 10,
          font,
          color: rgb(0.15, 0.15, 0.2),
        });
        y -= lineHeight;
      }
    }
  }

  return await pdfDoc.save();
}

/**
 * Triggers browser download of file
 */
export function downloadBlob(bytes: Uint8Array, fileName: string, mimeType: string = 'application/pdf') {
  const blob = new Blob([bytes as any], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Converts bytes to base64 Data URI
 */
export function uint8ArrayToDataUri(bytes: Uint8Array, mimeType: string = 'application/pdf'): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

/**
 * Merge multiple AppDocuments and all their pages into one single Master PDF
 */
export async function mergeMultipleDocuments(
  docs: AppDocument[],
  title: string = 'Merged_Document_Binder'
): Promise<Uint8Array> {
  const masterDoc = await PDFDocument.create();
  const A4_WIDTH = 595.28;
  const A4_HEIGHT = 841.89;

  for (const doc of docs) {
    for (let pIdx = 0; pIdx < doc.pages.length; pIdx++) {
      const pageItem = doc.pages[pIdx];
      const cleanBase64 = pageItem.dataUrl.replace(/^data:image\/\w+;base64,/, '');
      const isPng = pageItem.dataUrl.startsWith('data:image/png');

      let image;
      try {
        if (isPng) {
          image = await masterDoc.embedPng(cleanBase64);
        } else {
          image = await masterDoc.embedJpg(cleanBase64);
        }
      } catch {
        try {
          image = await masterDoc.embedJpg(cleanBase64);
        } catch {
          image = await masterDoc.embedPng(cleanBase64);
        }
      }

      const page = masterDoc.addPage([A4_WIDTH, A4_HEIGHT]);
      page.setRotation(degrees(pageItem.rotation || 0));

      const padding = 20;
      const availWidth = A4_WIDTH - padding * 2;
      const availHeight = A4_HEIGHT - padding * 2;

      const scale = Math.min(availWidth / image.width, availHeight / image.height);
      const drawWidth = image.width * scale;
      const drawHeight = image.height * scale;
      const xPos = padding + (availWidth - drawWidth) / 2;
      const yPos = padding + (availHeight - drawHeight) / 2;

      page.drawImage(image, {
        x: xPos,
        y: yPos,
        width: drawWidth,
        height: drawHeight,
      });

      // Apply annotations for this page if any
      const pageAnns = (doc.annotations || []).filter((a) => a.pageNumber === pIdx + 1);
      for (const ann of pageAnns) {
        const annX = (ann.x / 100) * A4_WIDTH;
        const annY = A4_HEIGHT - (ann.y / 100) * A4_HEIGHT;

        if (ann.type === 'signature' && ann.content.startsWith('data:image/')) {
          try {
            const sigClean = ann.content.replace(/^data:image\/\w+;base64,/, '');
            const sigImg = await masterDoc.embedPng(sigClean);
            page.drawImage(sigImg, {
              x: annX,
              y: annY - 40,
              width: 130,
              height: 50,
            });
          } catch (e) {
            console.warn('Failed to embed signature into merged PDF:', e);
          }
        }
      }
    }
  }

  return await masterDoc.save();
}

