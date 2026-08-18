import { createHash } from "node:crypto";

export function sanitizePlainText(value: string, maxLength: number) {
  const normalized = value.normalize("NFKC").replace(/\r\n?/g, "\n");
  const withoutControlCharacters = Array.from(normalized).filter((character) => {
    const code = character.charCodeAt(0);
    return code === 9 || code === 10 || (code >= 32 && code !== 127);
  }).join("");
  return withoutControlCharacters
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

export function createSubmissionHash(scope: string, parts: string[]) {
  return createHash("sha256")
    .update([scope, ...parts.map((part) => sanitizePlainText(part, 5000).toLowerCase())].join("\u001f"))
    .digest("hex");
}
