import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const scryptOptions = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const recordFormat = /^scrypt:([a-f0-9]{32}):([a-f0-9]{128})$/;

function derive(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 64, scryptOptions, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `scrypt:${salt.toString("hex")}:${key.toString("hex")}`;
}

export async function verifyPassword(password: string, record?: string) {
  const parts = record?.match(recordFormat);
  // A mesma operação é executada para contas inexistentes ou desativadas.
  const salt = parts ? Buffer.from(parts[1], "hex") : Buffer.alloc(16);
  const expected = parts ? Buffer.from(parts[2], "hex") : Buffer.alloc(64);
  return timingSafeEqual(await derive(password, salt), expected) && !!parts;
}
