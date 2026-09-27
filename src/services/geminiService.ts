import { OCROutput, ChatRole } from '../types/document';

export interface OCRRequestParams {
  imageBase64: string;
  mimeType?: string;
  documentContext?: string;
  language?: string;
}

export async function performDeepOCR(params: OCRRequestParams): Promise<OCROutput> {
  const response = await fetch('/api/gemini/ocr', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(errorJson.error || `Server OCR request failed with status ${response.status}`);
  }

  const result = await response.json();
  return {
    ...result.data,
    modelUsed: result.modelUsed || 'gemini-3.1-pro-preview',
  };
}

export async function performDocAnalysis(
  text: string,
  taskType: 'summary' | 'translate' | 'simplify' | 'action_items',
  targetLanguage: string = 'Spanish'
): Promise<string> {
  const response = await fetch('/api/gemini/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      taskType,
      targetLanguage,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Document analysis request failed.');
  }

  const data = await response.json();
  return data.result || 'No response generated.';
}

export interface ChatTurn {
  sender: 'user' | 'model';
  text: string;
}

export async function sendGeminiChatMessage(
  messages: ChatTurn[],
  role: ChatRole,
  documentContext?: string
): Promise<{ reply: string; modelUsed: string; role: string }> {
  const response = await fetch('/api/gemini/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      role,
      documentContext,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to communicate with Gemini assistant.');
  }

  return await response.json();
}
