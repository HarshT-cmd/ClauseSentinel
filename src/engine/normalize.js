/**
 * JanSetu AI - Text Normalization Pipeline
 * Handles Unicode NFC normalization, Devanagari transliteration,
 * repeated-character collapsing, spelling variant mapping,
 * and n-gram extraction (unigrams, bigrams, trigrams).
 */

// Devanagari Unicode mapping tables
const DEVANAGARI_VOWELS = {
  'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo',
  'ऋ': 'ri', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au', 'अं': 'am', 'अः': 'ah'
};

const DEVANAGARI_MATRAS = {
  'ा': 'a', 'ि': 'i', 'ी': 'i', 'ु': 'u', 'ू': 'u',
  'ृ': 'ri', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au',
  'ं': 'n', 'ँ': 'n', 'ः': 'h'
};

const DEVANAGARI_CONSONANTS = {
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
  'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
  'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
  'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'ळ': 'l',
  'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
  'क्ष': 'ksh', 'ज्ञ': 'gy'
};

const VIRAMA = '्';

/**
 * Transliterates Devanagari text into simplified Roman phonetic representation
 */
export function devanagariToRoman(text) {
  if (!text) return '';
  let result = '';
  const chars = Array.from(text.normalize('NFC'));

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const next = chars[i + 1];

    if (DEVANAGARI_VOWELS[ch]) {
      result += DEVANAGARI_VOWELS[ch];
    } else if (DEVANAGARI_CONSONANTS[ch]) {
      const cons = DEVANAGARI_CONSONANTS[ch];
      if (next === VIRAMA) {
        result += cons;
        i++; // skip virama
      } else if (DEVANAGARI_MATRAS[next]) {
        result += cons + DEVANAGARI_MATRAS[next];
        i++; // skip matra
      } else if (next && (DEVANAGARI_CONSONANTS[next] || next === ' ' || !next.match(/[\u0900-\u097F]/))) {
        // In Hindi/Marathi last consonant has schwa deleted; medial has light 'a'
        const isLastInWord = !next || next === ' ' || !next.match(/[\u0900-\u097F]/);
        result += cons + (isLastInWord ? '' : 'a');
      } else {
        result += cons;
      }
    } else if (DEVANAGARI_MATRAS[ch]) {
      result += DEVANAGARI_MATRAS[ch];
    } else {
      result += ch;
    }
  }

  return result;
}

/**
 * Common phonetic and informal spelling variants map
 */
const CANONICAL_SPELLINGS = {
  // Water
  'paani': 'pani',
  'panni': 'pani',
  'paanee': 'pani',
  'panie': 'pani',
  'पाणी': 'pani',
  'पानी': 'pani',
  'peeyjal': 'peyjal',

  // Electricity
  'bijlee': 'bijli',
  'bijlii': 'bijli',
  'vijj': 'vij',
  'बिजली': 'bijli',
  'वीज': 'vij',
  'currentt': 'current',

  // Roads
  'sarak': 'sadak',
  'raasta': 'rasta',
  'raste': 'rasta',
  'रस्ता': 'rasta',
  'सड़क': 'sadak',
  'khadda': 'khadda',
  'khadde': 'khadda',
  'khaddaa': 'khadda',
  'खड्डा': 'khadda',

  // Village / Ours
  'gaam': 'gaam',
  'gaaw': 'gaon',
  'gavat': 'gavat',
  'gaavat': 'gavat',
  'गावात': 'gavat',
  'गाव': 'gaon',
  'amcha': 'amchya',
  'aamcha': 'amchya',
  'aamchya': 'amchya',
  'आमच्या': 'amchya',
  'humre': 'humra',
  'हमरा': 'humra',
  'हमार': 'hamar',
  'mhaara': 'mhare',
  'म्‍हारे': 'mhare',

  // Negation / verbs
  'nahii': 'nahi',
  'naahi': 'nahi',
  'nahiii': 'nahi',
  'naii': 'nai',
  'naheen': 'nahi',
  'naikhe': 'naikhe',
  'नईखे': 'naikhe',
  'नाही': 'nahi',
  'yet': 'yet',
  'yeat': 'yet',
  'येत': 'yet',

  // Interrogatives & Cues
  'kaay': 'kay',
  'kaahe': 'kahe',
  'kahe': 'kahe',
  'काहे': 'kahe',
  'koni': 'koni',
  'manney': 'manne',
  'tanney': 'tanne',
  'मन्ने': 'manne',
  'तन्ने': 'tanne'
};

/**
 * Collapses elongated words (e.g. "paaaani" -> "pani", "nahiiii" -> "nahi", "pleaaase" -> "please")
 */
export function collapseRepeatedLetters(str) {
  if (!str) return '';
  // Collapse 3 or more repeated letters to 1 or 2
  return str.replace(/([a-zA-Z\u0900-\u097F])\1{2,}/gu, (match, char) => {
    // Keep double 'a' or 'o' or 'e' if desirable, or default to single
    if (['a', 'e', 'o'].includes(char.toLowerCase())) {
      return char + char;
    }
    return char;
  });
}

/**
 * Cleans punctuation and non-informative symbols while retaining Devanagari and Latin text
 */
export function cleanPunctuationAndSymbols(text) {
  if (!text) return '';
  // Strip emojis, punctuation, symbols, keep Devanagari (\u0900-\u097F), letters, numbers, spaces
  return text
    .replace(/[^\w\s\u0900-\u097F-]/gu, ' ')
    .replace(/[_\t\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Maps a single token to its canonical form if available
 */
export function mapToCanonical(token) {
  if (!token) return '';
  const lower = token.toLowerCase();
  return CANONICAL_SPELLINGS[lower] || lower;
}

/**
 * Checks script character distributions
 */
export function analyzeScript(text) {
  if (!text) return { isDevanagari: false, devanagariRatio: 0, englishRatio: 0 };
  const cleaned = text.replace(/\s+/g, '');
  if (!cleaned.length) return { isDevanagari: false, devanagariRatio: 0, englishRatio: 0 };

  const devanagariCount = (cleaned.match(/[\u0900-\u097F]/g) || []).length;
  const latinCount = (cleaned.match(/[a-zA-Z]/g) || []).length;
  const total = devanagariCount + latinCount || 1;

  return {
    devanagariCount,
    latinCount,
    devanagariRatio: devanagariCount / total,
    latinRatio: latinCount / total,
    isDevanagari: devanagariCount / total > 0.4
  };
}

/**
 * Full Normalization Pipeline
 * Returns clean text, tokens, canonical tokens, transliterated tokens,
 * and n-grams (bigrams and trigrams).
 */
export function normalizePipeline(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return {
      raw: '',
      normalized: '',
      transliterated: '',
      tokens: [],
      canonicalTokens: [],
      bigrams: [],
      trigrams: [],
      scriptInfo: { isDevanagari: false, devanagariRatio: 0, latinRatio: 0 }
    };
  }

  // 1. NFC Normalize & Trim
  const nfc = rawText.normalize('NFC').trim();
  const scriptInfo = analyzeScript(nfc);

  // 2. Transliterate Devanagari if present
  const transliteratedRaw = devanagariToRoman(nfc);

  // 3. Clean punctuation & collapse whitespace for both
  const cleanedOriginal = cleanPunctuationAndSymbols(nfc.toLowerCase());
  const cleanedTranslit = cleanPunctuationAndSymbols(transliteratedRaw.toLowerCase());

  // 4. Collapse repeated characters
  const collapsedOriginal = collapseRepeatedLetters(cleanedOriginal);
  const collapsedTranslit = collapseRepeatedLetters(cleanedTranslit);

  // 5. Tokenize
  const rawTokens = collapsedOriginal.split(' ').filter(Boolean);
  const translitTokens = collapsedTranslit.split(' ').filter(Boolean);

  // 6. Build canonical tokens
  const canonicalTokens = rawTokens.map(mapToCanonical);
  const canonicalTranslitTokens = translitTokens.map(mapToCanonical);

  // Union of canonical representations for maximum match coverage
  const allTokens = Array.from(new Set([
    ...rawTokens,
    ...translitTokens,
    ...canonicalTokens,
    ...canonicalTranslitTokens
  ]));

  // 7. Generate Bigrams & Trigrams for phrases
  const generateNgrams = (tokenList, n) => {
    const ngrams = [];
    for (let i = 0; i <= tokenList.length - n; i++) {
      ngrams.push(tokenList.slice(i, i + n).join(' '));
    }
    return ngrams;
  };

  const bigrams = Array.from(new Set([
    ...generateNgrams(rawTokens, 2),
    ...generateNgrams(translitTokens, 2),
    ...generateNgrams(canonicalTokens, 2),
    ...generateNgrams(canonicalTranslitTokens, 2)
  ]));

  const trigrams = Array.from(new Set([
    ...generateNgrams(rawTokens, 3),
    ...generateNgrams(translitTokens, 3),
    ...generateNgrams(canonicalTokens, 3),
    ...generateNgrams(canonicalTranslitTokens, 3)
  ]));

  return {
    raw: rawText,
    normalized: collapsedOriginal,
    transliterated: collapsedTranslit,
    rawTokens,
    allTokens,
    canonicalTokens,
    bigrams,
    trigrams,
    scriptInfo
  };
}
