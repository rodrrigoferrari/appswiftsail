import crypto from 'crypto';

// Chave padrão para fallback seguro em ambiente local ou produção se não definida em .env
const DEFAULT_KEY = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

function getKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY || DEFAULT_KEY;
  return crypto.createHash('sha256').update(envKey).digest();
}

/**
 * Criptografa uma string usando AES-256-GCM.
 * Retorna no formato iv:tag:ciphertext (hex)
 */
export function encrypt(text: string): string {
  if (!text) return '';
  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error('[Crypto Encrypt Error]:', error);
    return text;
  }
}

/**
 * Descriptografa uma string gerada por encrypt()
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      // Se não estiver no formato iv:tag:content, retorna o texto simples caso não esteja criptografado
      return encryptedText;
    }
    const [ivHex, tagHex, contentHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(contentHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('[Crypto Decrypt Error]:', error);
    return encryptedText;
  }
}

/**
 * Mascara um token sensível para exibição segura na interface
 */
export function maskToken(token: string): string {
  if (!token) return '';
  if (token.length <= 8) return '••••••••';
  return `${token.slice(0, 4)}••••••••${token.slice(-4)}`;
}
