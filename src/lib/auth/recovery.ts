import { createHash, randomBytes } from "node:crypto";

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function generateRecoveryCode(): string {
  const bytes = randomBytes(16);
  let raw = "";

  for (let i = 0; i < bytes.length; i += 1) {
    raw += ALPHABET[bytes[i] % ALPHABET.length];
  }

  return raw.match(/.{1,4}/g)?.join("-") ?? raw;
}

export function normalizeRecoveryCode(code: string): string {
  return code.replace(/[^0-9A-Za-z]/g, "").toUpperCase();
}

export function hashRecoveryCode(code: string): string {
  return createHash("sha256")
    .update(normalizeRecoveryCode(code))
    .digest("hex");
}

export function createInviteToken() {
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  return { rawToken, tokenHash };
}

export function hashInviteToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}
