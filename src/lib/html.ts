/**
 * HTML → readable plain text.
 *
 * Shared HTML-to-text logic. Keep `src/lib/html.ts` and
 * `functions/src/utils/html.ts` in sync so the browser app and Cloud
 * Functions produce identical text.
 */

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ensp: ' ',
  emsp: ' ',
  thinsp: ' ',
  shy: '',
  zwj: '',
  zwnj: '',
  lrm: '',
  rlm: '',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  sbquo: '‚',
  bdquo: '„',
  bull: '•',
  middot: '·',
  copy: '©',
  reg: '®',
  trade: '™',
  euro: '€',
  pound: '£',
  yen: '¥',
  cent: '¢',
  curren: '¤',
  sect: '§',
  para: '¶',
  deg: '°',
  plusmn: '±',
  times: '×',
  divide: '÷',
  micro: 'µ',
  frac12: '½',
  frac14: '¼',
  frac34: '¾',
  laquo: '«',
  raquo: '»',
  iexcl: '¡',
  iquest: '¿',
  agrave: 'à',
  aacute: 'á',
  acirc: 'â',
  atilde: 'ã',
  auml: 'ä',
  aring: 'å',
  aelig: 'æ',
  ccedil: 'ç',
  egrave: 'è',
  eacute: 'é',
  ecirc: 'ê',
  euml: 'ë',
  igrave: 'ì',
  iacute: 'í',
  icirc: 'î',
  iuml: 'ï',
  ntilde: 'ñ',
  ograve: 'ò',
  oacute: 'ó',
  ocirc: 'ô',
  otilde: 'õ',
  ouml: 'ö',
  oslash: 'ø',
  ugrave: 'ù',
  uacute: 'ú',
  ucirc: 'û',
  uuml: 'ü',
  yacute: 'ý',
  yuml: 'ÿ',
  szlig: 'ß',
  Agrave: 'À',
  Aacute: 'Á',
  Acirc: 'Â',
  Atilde: 'Ã',
  Auml: 'Ä',
  Aring: 'Å',
  AElig: 'Æ',
  Ccedil: 'Ç',
  Egrave: 'È',
  Eacute: 'É',
  Ecirc: 'Ê',
  Euml: 'Ë',
  Igrave: 'Ì',
  Iacute: 'Í',
  Icirc: 'Î',
  Iuml: 'Ï',
  Ntilde: 'Ñ',
  Ograve: 'Ò',
  Oacute: 'Ó',
  Ocirc: 'Ô',
  Otilde: 'Õ',
  Ouml: 'Ö',
  Oslash: 'Ø',
  Ugrave: 'Ù',
  Uacute: 'Ú',
  Ucirc: 'Û',
  Uuml: 'Ü',
  Yacute: 'Ý',
}

function decodeEntities(value: string): string {
  let current = value
  for (let pass = 0; pass < 3; pass += 1) {
    const next = current.replace(
      /&(#(?:x[0-9a-fA-F]+|[0-9]+)|[a-zA-Z][a-zA-Z0-9]+);/g,
      (match, code: string) => {
        if (code.startsWith('#')) {
          const hex = code[1]?.toLowerCase() === 'x'
          const numeric = Number.parseInt(
            hex ? code.slice(2) : code.slice(1),
            hex ? 16 : 10,
          )
          if (!Number.isFinite(numeric)) {
            return match
          }
          try {
            return String.fromCodePoint(numeric)
          } catch {
            return match
          }
        }
        return NAMED_ENTITIES[code] ?? NAMED_ENTITIES[code.toLowerCase()] ?? match
      },
    )
    if (next === current) {
      break
    }
    current = next
  }
  return current
}

function removeNonContent(value: string): string {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
}

/**
 * Converts an HTML job description into readable plain text with paragraph
 * breaks and bullet lines. Idempotent for already-plain text.
 */
export function stripHtml(value: string): string {
  if (!value) {
    return ''
  }

  // Remove scripts/styles/comments once before decoding (single-encoded HTML)
  // and again after decoding (double-encoded HTML such as &lt;p&gt;).
  let text = removeNonContent(value)
  text = decodeEntities(text)
  text = removeNonContent(text)

  // Only HTML input should lose its source line-wrapping. Plain text (including
  // output from a previous sanitize pass) keeps its paragraphs and bullets, so
  // running the sanitizer twice is a no-op.
  if (/<[a-zA-Z!/][^>]*>/.test(text)) {
    // Source formatting (line wraps/indentation) is not a paragraph break.
    // Collapse it now; real breaks are inserted from tags below.
    text = text.replace(/\s+/g, ' ')

    text = text
      .replace(/<\s*br\s*\/?>/gi, '\n')
      .replace(/<\s*hr\b[^>]*>/gi, '\n\n')
      .replace(/<\s*(ul|ol)\b[^>]*>/gi, '\n')
      .replace(/<\s*li\b[^>]*>/gi, '• ')
      .replace(
        /<\s*\/\s*(p|div|section|article|header|footer|h[1-6]|blockquote|pre|ul|ol)\s*>/gi,
        '\n\n',
      )
      .replace(/<\s*\/\s*li\s*>/gi, '\n')
      .replace(/<\s*\/\s*tr\s*>/gi, '\n')
      .replace(/<\s*\/\s*(td|th)\s*>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
  }

  return text
    .replace(/\r\n?/g, '\n')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
