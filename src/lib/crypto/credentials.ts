import crypto from "node:crypto";

const algorithm = "aes-256-gcm";

function getEncryptionKey() {
  const raw = process.env.ENCRYPTION_KEY;

  if (!raw) {
    throw new Error("ENCRYPTION_KEY is required to encrypt credentials.");
  }

  if (/^[a-f0-9]{64}$/i.test(raw)) {
    return Buffer.from(raw, "hex");
  }

  const base64 = Buffer.from(raw, "base64");
  if (base64.length === 32) {
    return base64;
  }

  return crypto.createHash("sha256").update(raw).digest();
}

export function encryptSecret(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();

  return [iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(":");
}

export function decryptSecret(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const [iv, tag, encrypted] = value.split(":");
  if (!iv || !tag || !encrypted) {
    throw new Error("Invalid encrypted credential payload.");
  }

  const decipher = crypto.createDecipheriv(
    algorithm,
    getEncryptionKey(),
    Buffer.from(iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(tag, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64")),
    decipher.final()
  ]).toString("utf8");
}
