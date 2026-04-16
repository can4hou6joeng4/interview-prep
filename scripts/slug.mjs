const TOKEN_PATTERN = /[A-Za-z][A-Za-z0-9]*/g;
const CAMEL_SPLIT_PATTERN = /([a-z0-9])([A-Z])|([A-Z]+)([A-Z][a-z])/g;
const MAX_TOKENS = 6;
const MAX_LENGTH = 80;

function splitCamelCase(token) {
  return token.replace(CAMEL_SPLIT_PATTERN, (_, a1, a2, b1, b2) => {
    const left = a1 ?? b1 ?? '';
    const right = a2 ?? b2 ?? '';
    return `${left} ${right}`;
  });
}

function joinWithinLimit(tokens, maxLen) {
  let result = '';
  for (const token of tokens) {
    const candidate = result ? `${result}-${token}` : token;
    if (candidate.length > maxLen) break;
    result = candidate;
  }
  return result;
}

export function slugify(text) {
  const matches = String(text).match(TOKEN_PATTERN) || [];
  const tokens = matches
    .flatMap((token) => splitCamelCase(token).split(/\s+/))
    .map((t) => t.toLowerCase())
    .filter(Boolean)
    .slice(0, MAX_TOKENS);
  return joinWithinLimit(tokens, MAX_LENGTH);
}

export function buildQuestionSlug(question, id) {
  const head = slugify(question);
  if (!head) return id;
  return `${head}-${id}`;
}
