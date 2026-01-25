/**
 * 敏感資料加密工具
 * 使用 Web Crypto API 進行 AES-GCM 加密
 */

// 從環境變數或生成密鑰
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'trvic-erp-default-key-2024';

// 將字串轉換為 Uint8Array
function stringToUint8Array(str: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

// 將 Uint8Array 轉換為字串
function uint8ArrayToString(arr: Uint8Array): string {
  const decoder = new TextDecoder();
  return decoder.decode(arr);
}

// 將 ArrayBuffer 轉換為 Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// 將 Base64 轉換為 ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// 生成加密密鑰
async function getEncryptionKey(): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    stringToUint8Array(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)),
    'AES-GCM',
    false,
    ['encrypt', 'decrypt']
  );
  return keyMaterial;
}

/**
 * 加密敏感資料
 * @param data - 要加密的資料
 * @returns 加密後的 Base64 字串
 */
export async function encryptData(data: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = stringToUint8Array(data);

    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    );

    // 組合 IV 和加密資料
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    return arrayBufferToBase64(combined.buffer);
  } catch (error) {
    console.error('加密失敗:', error);
    throw new Error('資料加密失敗');
  }
}

/**
 * 解密敏感資料
 * @param encryptedData - 加密的 Base64 字串
 * @returns 解密後的原始資料
 */
export async function decryptData(encryptedData: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const combined = new Uint8Array(base64ToArrayBuffer(encryptedData));

    // 分離 IV 和加密資料
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return uint8ArrayToString(new Uint8Array(decryptedBuffer));
  } catch (error) {
    console.error('解密失敗:', error);
    throw new Error('資料解密失敗');
  }
}

/**
 * 雜湊敏感資料 (單向，用於密碼等)
 * @param data - 要雜湊的資料
 * @returns SHA-256 雜湊值
 */
export async function hashData(data: string): Promise<string> {
  const encoded = stringToUint8Array(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  return arrayBufferToBase64(hashBuffer);
}

/**
 * 遮蔽敏感資料顯示
 * @param data - 原始資料
 * @param visibleChars - 可見字元數 (前後各多少)
 * @returns 遮蔽後的字串
 */
export function maskSensitiveData(data: string, visibleChars: number = 2): string {
  if (!data || data.length <= visibleChars * 2) {
    return '*'.repeat(data?.length || 4);
  }
  const start = data.slice(0, visibleChars);
  const end = data.slice(-visibleChars);
  const masked = '*'.repeat(Math.max(data.length - visibleChars * 2, 3));
  return `${start}${masked}${end}`;
}

/**
 * 遮蔽電話號碼
 */
export function maskPhone(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 6) return '*'.repeat(cleaned.length);
  return cleaned.slice(0, 3) + '*'.repeat(cleaned.length - 6) + cleaned.slice(-3);
}

/**
 * 遮蔽電子郵件
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [localPart, domain] = email.split('@');
  const maskedLocal = localPart.length > 2
    ? localPart[0] + '*'.repeat(localPart.length - 2) + localPart.slice(-1)
    : '*'.repeat(localPart.length);
  return `${maskedLocal}@${domain}`;
}

/**
 * 遮蔽身分證號
 */
export function maskIdNumber(idNumber: string): string {
  if (!idNumber || idNumber.length < 4) return '*'.repeat(idNumber?.length || 4);
  return idNumber.slice(0, 2) + '*'.repeat(idNumber.length - 4) + idNumber.slice(-2);
}

/**
 * 遮蔽護照號碼
 */
export function maskPassport(passport: string): string {
  if (!passport || passport.length < 4) return '*'.repeat(passport?.length || 4);
  return passport.slice(0, 2) + '*'.repeat(passport.length - 4) + passport.slice(-2);
}

/**
 * 加密儲存工具 - 用於 localStorage
 */
export const encryptedStorage = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      const encrypted = await encryptData(value);
      localStorage.setItem(key, encrypted);
    } catch {
      // 降級為普通儲存
      localStorage.setItem(key, value);
    }
  },

  async getItem(key: string): Promise<string | null> {
    const value = localStorage.getItem(key);
    if (!value) return null;

    try {
      return await decryptData(value);
    } catch {
      // 可能是未加密的舊資料
      return value;
    }
  },

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }
};
