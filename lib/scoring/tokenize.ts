const WORD_PATTERN = /[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu;

export function normalizeToken(token: string) {
  return token
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/[’]/g, "'");
}

export function tokenize(text: string) {
  return Array.from(text.matchAll(WORD_PATTERN), (match) => normalizeToken(match[0]));
}

export function countWords(text: string) {
  return tokenize(text).length;
}
