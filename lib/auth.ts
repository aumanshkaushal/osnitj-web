import crypto from "crypto";

const JWT_SECRET = process.env.SESSION_SECRET || "osnitj-admin-panel-secret-2026-key";

/**
 * Hash a password using PBKDF2 with a random salt.
 * Returns a string formatted as "salt:hash".
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a stored "salt:hash" string.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split(":");
    if (parts.length !== 2) return false;
    const [salt, hash] = parts;
    const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(verifyHash, "hex"));
  } catch {
    return false;
  }
}

/**
 * Sign a lightweight JWT token using HMAC-SHA256.
 */
export function signToken(payload: object, expiresInSeconds = 86400): string {
  const exp = Date.now() + expiresInSeconds * 1000;
  const fullPayload = { ...payload, exp };
  
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
    
  return `${header}.${body}.${signature}`;
}

/**
 * Verify and parse a JWT token. Returns payload or null if invalid/expired.
 */
export function verifyToken(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    
    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${body}`)
      .digest("base64url");
      
    if (signature !== expectedSignature) return null;
    
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
