import { AppDocument, DeviceInfo } from '../types/document';

const LOCAL_STORAGE_KEY = 'docuflow_local_documents_v1';
const DEVICE_ID_KEY = 'docuflow_device_id_v1';
const DEVICE_NAME_KEY = 'docuflow_device_name_v1';

export function getOrCreateDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `device-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function getDeviceName(): string {
  let name = localStorage.getItem(DEVICE_NAME_KEY);
  if (!name) {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    name = isIos ? 'iPhone 16 Pro' : isMobile ? 'Pixel 9 Pro' : 'Workstation Studio';
    localStorage.setItem(DEVICE_NAME_KEY, name);
  }
  return name;
}

export function detectDevicePlatform(): 'ios' | 'android' | 'desktop' | 'web' {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  if (/Macintosh|Windows|Linux/i.test(ua)) return 'desktop';
  return 'web';
}

export function loadSavedDocuments(): AppDocument[] | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load local documents from storage', e);
    return null;
  }
}

export function saveDocumentsLocally(docs: AppDocument[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(docs));
  } catch (e) {
    console.warn('Local storage quota reached or write error', e);
  }
}

export async function syncDocumentsWithCloud(
  documents: AppDocument[]
): Promise<{ success: boolean; cloudDocs?: AppDocument[]; error?: string }> {
  try {
    const deviceId = getOrCreateDeviceId();
    const platform = detectDevicePlatform();

    const response = await fetch('/api/cloud/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documents,
        deviceId,
        deviceType: platform,
      }),
    });

    if (!response.ok) {
      throw new Error(`Sync request failed with status: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      cloudDocs: data.documents,
    };
  } catch (err: any) {
    console.error('Cloud sync error:', err);
    return {
      success: false,
      error: err.message || 'Network error during cloud sync',
    };
  }
}

export const KNOWN_DEVICES: DeviceInfo[] = [
  {
    id: 'device-iphone-16',
    name: 'iPhone 16 Pro (Mobile Studio)',
    platform: 'ios',
    lastSeen: 'Just now',
    isCurrent: true,
  },
  {
    id: 'device-pixel-9-pro',
    name: 'Google Pixel 9 Pro',
    platform: 'android',
    lastSeen: '12 mins ago',
    isCurrent: false,
  },
  {
    id: 'device-macbook-pro',
    name: 'MacBook Pro 16" M3 Max',
    platform: 'desktop',
    lastSeen: '2 hours ago',
    isCurrent: false,
  },
  {
    id: 'device-ipad-air',
    name: 'iPad Air 13" (Apple Pencil)',
    platform: 'ios',
    lastSeen: 'Yesterday',
    isCurrent: false,
  },
];
