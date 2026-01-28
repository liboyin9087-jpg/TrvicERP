export class CryptoError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(`[CryptoError] ${message}`);
    this.name = 'CryptoError';
    if (originalError) {
      console.error('Original Error:', originalError); // Still log original for debugging in dev
    }
  }
}

export class KeyDerivationError extends CryptoError {
  constructor(message: string, originalError?: unknown) {
    super(`Key Derivation Failed: ${message}`, originalError);
    this.name = 'KeyDerivationError';
  }
}

export class EncryptionError extends CryptoError {
  constructor(message: string, originalError?: unknown) {
    super(`Encryption Failed: ${message}`, originalError);
    this.name = 'EncryptionError';
  }
}

export class DecryptionError extends CryptoError {
  constructor(message: string, originalError?: unknown) {
    super(`Decryption Failed: ${message}`, originalError);
    this.name = 'DecryptionError';
  }
}

export class HashingError extends CryptoError {
  constructor(message: string, originalError?: unknown) {
    super(`Hashing Failed: ${message}`, originalError);
    this.name = 'HashingError';
  }
}

// --- Helper Functions (Private/Internal Scope) ---

/**
 * 将字符串转换为 Uint8Array。
 * @param str - 要转换的字符串。
 * @returns 对应的 Uint8Array。
 */
function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * 将 Uint8Array 转换为字符串。
 * @param arr - 要转换的 Uint8Array。
 * @returns 对应的字符串。
 */
function uint8ArrayToString(arr: Uint8Array): string {
  return new TextDecoder().decode(arr);
}

/**
 * 将 ArrayBuffer 转换为 Base64 字符串。
 * @param buffer - 要转换的 ArrayBuffer。
 * @returns 对应的 Base64 字符串。
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * 将 Base64 字符串转换为 ArrayBuffer。
 * @param base64 - 要转换的 Base64 字符串。
 * @returns 对应的 ArrayBuffer。
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * 将 Uint8Array 转换为十六进制字符串。
 * @param bytes - 要转换的 Uint8Array。
 * @returns 十六进制字符串。
 */
function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 将十六进制字符串转换为 Uint8Array。
 * @param hex - 要转换的十六进制字符串。
 * @returns 对应的 Uint8Array。
 */
function hexToUint8Array(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('Hex string must have an even number of characters.');
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

// --- Crypto Service Implementation ---

/**
 * CryptoServiceConfig 接口定义了初始化 CryptoService 所需的配置。
 */
export interface CryptoServiceConfig {
  /**
   * 用于加密和解密操作的主密钥材料 (passphrase)。
   * 强烈建议这是一个长、随机且安全的字符串，不应硬编码在代码中。
   * 它应该在运行时安全地获取，例如从后端服务、用户输入或安全的客户端存储。
   * 如果未提供或长度不足，加密/解密操作将抛出错误，强制调用方提供安全密钥。
   */
  masterKeyMaterial: string;
  /**
   * 用于 PBKDF2 密钥派生的盐值。
   * 建议为每个应用程序或部署实例生成一个随机且固定的盐值。
   * 这个盐值不需要保密，但其存在对于增强密钥派生的安全性至关重要。
   * 默认为一个固定的应用级盐值，但最好在部署时替换为一个随机生成的字符串。
   */
  keyDerivationSalt?: string;
  /**
   * PBKDF2 迭代次数。推荐值为 100,000 或更高，以增加暴力破解难度。
   * 默认为 100,000。
   */
  pbkdf2Iterations?: number;
}

/**
 * 敏感资料加密、解密和杂凑工具服务。
 * 使用 Web Crypto API 进行 AES-GCM 加密和 SHA-256 杂凑，并包含 PBKDF2 密钥派生和盐机制。
 * 该服务旨在作为 Kintone 独立组件的一部分，通过构造函数接收所有必要的配置，
 * 避免对全局环境变量或 Store 的直接依赖。
 */
export class CryptoService {
  private _masterKeyMaterial: string;
  private _keyDerivationSalt: Uint8Array;
  private _pbkdf2Iterations: number;
  private _encryptionKey: Promise<CryptoKey> | null = null; // Promise to ensure key is only generated once

  /**
   * 构造 CryptoService 实例。
   * @param config - 初始化服务所需的配置，包括主密钥材料和密钥派生参数。
   */
  constructor(config: CryptoServiceConfig) {
    if (!config.masterKeyMaterial || config.masterKeyMaterial.length < 32) {
      // Throw an error to enforce secure key material
      throw new KeyDerivationError('Master key material must be provided and sufficiently long (min 32 chars) for secure key derivation.');
    }
    this._masterKeyMaterial = config.masterKeyMaterial;
    // Use provided keyDerivationSalt or a default (should be generated per deployment)
    // The default is for development/example purposes; for production, generate a strong random one.
    this._keyDerivationSalt = stringToUint8Array(config.keyDerivationSalt || 'trvic-erp-key-derivation-salt-2024-default-replace-me');
    this._pbkdf2Iterations = config.pbkdf2Iterations || 100000; // Recommended minimum for PBKDF2
  }

  /**
   * 内部方法，用于从主密钥材料派生加密密钥。
   * 使用 PBKDF2 确保安全性。此密钥是 AES-GCM 算法的对称密钥。
   * @returns 派生出的 CryptoKey。
   * @throws KeyDerivationError 如果密钥派生失败。
   */
  private async _deriveEncryptionKey(): Promise<CryptoKey> {
    if (this._encryptionKey) {
      return this._encryptionKey;
    }

    this._encryptionKey = (async () => {
      try {
        // Import the masterKeyMaterial as raw key material for PBKDF2
        const keyMaterial = await crypto.subtle.importKey(
          'raw',
          stringToUint8Array(this._masterKeyMaterial),
          { name: 'PBKDF2' },
          false,
          ['deriveKey']
        );

        // Derive the AES-GCM key using PBKDF2
        const derivedKey = await crypto.subtle.deriveKey(
          {
            name: 'PBKDF2',
            salt: this._keyDerivationSalt,
            iterations: this._pbkdf2Iterations,
            hash: 'SHA-256', // Use SHA-256 for PBKDF2 hashing
          },
          keyMaterial,
          { name: 'AES-GCM', length: 256 }, // Derive a 256-bit AES key
          false,
          ['encrypt', 'decrypt']
        );
        return derivedKey;
      } catch (error) {
        throw new KeyDerivationError('Failed to derive encryption key from master material.', error);
      }
    })();
    return this._encryptionKey;
  }

  /**
   * 加密敏感资料。
   * 使用 AES-GCM 算法，并通过每次生成随机 IV 增加安全性。
   * IV (Initialization Vector) 必须是随机的，且每次加密操作都不同。
   * AES-GCM 推荐 96 位 (12 字节) IV，以获得最佳性能和安全性。
   * IV 会与加密数据一起 Base64 编码后存储，IV 不需保密但需与密文一起传递。
   * @param data - 要加密的原始字符串资料。
   * @returns 加密后的 Base64 编码字符串，包含 IV 和密文。
   * @throws EncryptionError 如果加密失败。
   */
  public async encryptData(data: string): Promise<string> {
    try {
      const key = await this._deriveEncryptionKey();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encodedData = stringToUint8Array(data);

      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encodedData
      );

      // 组合 IV 和加密资料，便于传输和存储。
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);

      return arrayBufferToBase64(combined.buffer);
    } catch (error) {
      if (error instanceof CryptoError) throw error;
      throw new EncryptionError('Failed to encrypt data.', error);
    }
  }

  /**
   * 解密敏感资料。
   * 从 Base64 编码的输入中提取 IV 和密文，然后使用派生密钥进行解密。
   * @param encryptedData - 包含 IV 和密文的 Base64 编码字符串。
   * @returns 解密后的原始字符串资料。
   * @throws DecryptionError 如果解密失败。
   */
  public async decryptData(encryptedData: string): Promise<string> {
    try {
      const key = await this._deriveEncryptionKey();
      const combined = new Uint8Array(base64ToArrayBuffer(encryptedData));

      // 分离 IV (前 12 字节) 和加密资料。
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);

      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );

      return uint8ArrayToString(new Uint8Array(decryptedBuffer));
    } catch (error) {
      if (error instanceof CryptoError) throw error;
      throw new DecryptionError('Failed to decrypt data.', error);
    }
  }

  /**
   * 对敏感资料（如密码）进行安全的杂凑处理。
   * 采用 SHA-256 算法，并自动生成并使用随机盐值，以防止彩虹表攻击和提高安全性。
   * 杂凑值和盐值会以 `saltHex.hashHex` 的格式组合返回。
   * 注意：对于密码存储，更推荐使用 PBKDF2 或 Argon2 等抗暴力破解算法。
   * 此处使用 SHA-256 加盐是基于原始代码的改进，但高级应用应考虑更强的算法。
   * @param data - 要杂凑的原始字符串资料。
   * @returns 包含盐值和杂凑值的字符串 (格式: `saltHex.hashHex`)。
   * @throws HashingError 如果杂凑失败。
   */
  public async hashSensitiveData(data: string): Promise<string> {
    try {
      // 生成一个随机的 salt。建议 salt 长度至少 16 字节（128 位）。
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const encodedData = stringToUint8Array(data);

      // 将 salt 和原始数据结合进行杂凑：SHA-256(salt + data)。
      const saltedData = new Uint8Array(salt.length + encodedData.length);
      saltedData.set(salt);
      saltedData.set(encodedData, salt.length);

      const hashBuffer = await crypto.subtle.digest('SHA-256', saltedData);

      const hashHex = uint8ArrayToHex(new Uint8Array(hashBuffer));
      const saltHex = uint8ArrayToHex(salt);

      // 返回盐值和杂凑值，通过点号分隔，以便验证时可以轻松分离。
      return `${saltHex}.${hashHex}`;
    } catch (error) {
      throw new HashingError('Failed to hash sensitive data with salt.', error);
    }
  }

  /**
   * 验证原始数据是否与给定的带盐杂凑值匹配。
   * @param data - 要验证的原始字符串资料。
   * @param saltedHash - 包含盐值和杂凑值的字符串 (格式: `saltHex.hashHex`)。
   * @returns 如果匹配则为 true，否则为 false。
   * @throws HashingError 如果验证过程中发生错误（例如格式不正确）。
   */
  public async verifySensitiveDataHash(data: string, saltedHash: string): Promise<boolean> {
    try {
      const parts = saltedHash.split('.');
      if (parts.length !== 2) {
        throw new HashingError('Invalid salted hash format. Expected "saltHex.hashHex".');
      }
      const saltHex = parts[0];
      const storedHashHex = parts[1];

      const salt = hexToUint8Array(saltHex);
      const encodedData = stringToUint8Array(data);

      const saltedData = new Uint8Array(salt.length + encodedData.length);
      saltedData.set(salt);
      saltedData.set(encodedData, salt.length);

      const hashBuffer = await crypto.subtle.digest('SHA-256', saltedData);
      const currentHashHex = uint8ArrayToHex(new Uint8Array(hashBuffer));

      // 使用常量时间比较以防止侧信道攻击
      return crypto.subtle.timingSafeEqual(stringToUint8Array(currentHashHex), stringToUint8Array(storedHashHex));
    } catch (error) {
      throw new HashingError('Failed to verify sensitive data hash.', error);
    }
  }
}

// --- Masking Utilities (No Changes Needed) ---

/**
 * 遮蔽敏感资料显示。
 * @param data - 原始资料。
 * @param visibleChars - 可见字元数 (前后各多少)。
 * @returns 遮蔽后的字串。
 */
export function maskSensitiveData(data: string, visibleChars: number = 2): string {
  if (!data) return '****'; // Handle null/undefined data
  if (data.length <= visibleChars * 2) {
    return '*'.repeat(data.length);
  }
  const start = data.slice(0, visibleChars);
  const end = data.slice(-visibleChars);
  const masked = '*'.repeat(Math.max(data.length - visibleChars * 2, 3)); // Ensure at least 3 stars
  return `${start}${masked}${end}`;
}

/**
 * 遮蔽电话号码。
 * @param phone - 原始电话号码字符串。
 * @returns 遮蔽后的电话号码。
 */
export function maskPhone(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, ''); // 移除所有非数字字符
  if (cleaned.length < 6) return '*'.repeat(cleaned.length);
  // 保留前3位和后3位，中间用星号遮蔽
  return cleaned.slice(0, 3) + '*'.repeat(cleaned.length - 6) + cleaned.slice(-3);
}

/**
 * 遮蔽电子邮箱地址。
 * @param email - 原始电子邮箱字符串。
 * @returns 遮蔽后的电子邮箱。
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [localPart, domain] = email.split('@');
  // 邮箱本地部分：如果长度大于2，保留首位和末位，中间遮蔽；否则全部遮蔽。
  const maskedLocal = localPart.length > 2
    ? localPart[0] + '*'.repeat(localPart.length - 2) + localPart.slice(-1)
    : '*'.repeat(localPart.length);
  return `${maskedLocal}@${domain}`;
}

/**
 * 遮蔽身分证号。
 * @param idNumber - 原始身分证号字符串。
 * @returns 遮蔽后的身分证号。
 */
export function maskIdNumber(idNumber: string): string {
  if (!idNumber) return '****';
  if (idNumber.length < 4) return '*'.repeat(idNumber.length);
  // 保留前2位和后2位，中间用星号遮蔽
  return idNumber.slice(0, 2) + '*'.repeat(idNumber.length - 4) + idNumber.slice(-2);
}

/**
 * 遮蔽护照号码。
 * @param passport - 原始护照号码字符串。
 * @returns 遮蔽后的护照号码。
 */
export function maskPassport(passport: string): string {
  if (!passport) return '****';
  if (passport.length < 4) return '*'.repeat(passport.length);
  // 保留前2位和后2位，中间用星号遮蔽
  return passport.slice(0, 2) + '*'.repeat(passport.length - 4) + passport.slice(-2);
}


// --- Encrypted Storage Utility ---

/**
 * 创建一个用于 localStorage 的加密存储工具。
 * 依赖于提供的 CryptoService 实例进行加密和解密操作。
 * 遵循 Kintone 独立性原则，通过参数注入依赖。
 *
 * @param cryptoService - 已初始化并配置好的 CryptoService 实例。
 * @returns 一个实现类似 localStorage 接口但具有加密/解密功能的工具对象。
 */
export function createEncryptedStorage(cryptoService: CryptoService) {
  return {
    /**
     * 加密并保存资料到 localStorage。
     * 如果加密失败，会降级为普通保存，并发出警告。
     * @param key - localStorage 键。
     * @param value - 要保存的字符串值。
     */
    async setItem(key: string, value: string): Promise<void> {
      try {
        const encrypted = await cryptoService.encryptData(value);
        localStorage.setItem(key, encrypted);
      } catch (error) {
        // Log the error for debugging. This behavior might need to be adjusted based on security requirements.
        console.warn(`[EncryptedStorage] Failed to encrypt data for key "${key}". Falling back to unencrypted storage. Error:`, error);
        localStorage.setItem(key, value);
      }
    },

    /**
     * 从 localStorage 获取并解密资料。
     * 如果解密失败（例如，资料未加密、密钥不匹配或数据损坏），
     * 会尝试返回原始未解密的值，并发出警告。
     * @param key - localStorage 键。
     * @returns 解密后的字符串值，如果不存在则为 null。
     */
    async getItem(key: string): Promise<string | null> {
      const value = localStorage.getItem(key);
      if (!value) return null;

      try {
        return await cryptoService.decryptData(value);
      } catch (error) {
        // Log the error for debugging. This could be due to wrong key, corrupted data, or unencrypted old data.
        console.warn(`[EncryptedStorage] Failed to decrypt data for key "${key}". Attempting to return raw value. Error:`, error);
        // Fallback: If decryption fails, it might be an old, unencrypted item or corrupted data.
        // This is a design choice: allow retrieving old data or strictly fail.
        return value;
      }
    },

    /**
     * 从 localStorage 移除资料。
     * @param key - localStorage 键。
     */
    removeItem(key: string): void {
      localStorage.removeItem(key);
    },

    /**
     * 清空 localStorage 中的所有数据。
     * 注意：这将移除所有项，包括非加密的。请谨慎使用。
     */
    clear(): void {
      localStorage.clear();
    }
  };
}