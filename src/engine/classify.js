/**
 * JanSetu AI - Classification Engine
 * Explainable, rule-based grassroots dialect classifier with fuzzy matching,
 * confidence scoring, script style detection, and administrative routing.
 */

import dialectsData from './dialectsData.js';
import { normalizePipeline } from './normalize.js';

/**
 * Computes Levenshtein distance between two strings
 */
export function levenshteinDistance(a, b) {
  if (!a || !b) return (a || b || '').length;
  if (a === b) return 0;

  const al = a.length;
  const bl = b.length;
  const matrix = Array.from({ length: al + 1 }, () => new Int32Array(bl + 1));

  for (let i = 0; i <= al; i++) matrix[i][0] = i;
  for (let j = 0; j <= bl; j++) matrix[0][j] = j;

  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[al][bl];
}

/**
 * Checks if candidate is within allowed fuzzy distance
 */
export function isFuzzyMatch(token, target) {
  if (!token || !target) return false;
  const t1 = token.toLowerCase();
  const t2 = target.toLowerCase();
  if (t1 === t2) return true;

  const len = Math.max(t1.length, t2.length);
  // Do not fuzzy match very short tokens (< 4 letters) to avoid false positives
  if (len < 4) return false;

  const dist = levenshteinDistance(t1, t2);
  if (len <= 5 && dist <= 1) return true;
  if (len > 5 && dist <= 2) return true;

  return false;
}

/**
 * Classifies issue category from text and normalization tokens
 */
export function classifyIssueCategory(normalizedData) {
  const { normalized, transliterated, allTokens, bigrams } = normalizedData;
  const issueCategories = dialectsData.issueCategories || [];

  let bestCat = 'Other';
  let bestScore = 0;

  for (const cat of issueCategories) {
    let catScore = 0;
    for (const kw of cat.keywords) {
      const kwLower = kw.toLowerCase();
      // Multi-word issue phrase check
      if (kwLower.includes(' ')) {
        if (bigrams.includes(kwLower) || normalized.includes(kwLower) || transliterated.includes(kwLower)) {
          catScore += 2.5;
        }
      } else {
        // Single word exact check
        if (allTokens.includes(kwLower)) {
          catScore += 2.0;
        } else if (isFuzzyMatch(kwLower, allTokens.find(t => isFuzzyMatch(t, kwLower)))) {
          catScore += 1.0;
        }
      }
    }

    if (catScore > bestScore) {
      bestScore = catScore;
      bestCat = cat.label || cat.id;
    }
  }

  return bestCat;
}

/**
 * Detects language / script style of the input text
 */
export function detectLanguageStyle(rawText, scriptInfo, topZoneId) {
  if (!rawText) return 'Unknown';

  const devRatio = scriptInfo?.devanagariRatio || 0;
  const latinRatio = scriptInfo?.latinRatio || 0;

  if (devRatio > 0.45) {
    if (['western_maharashtra', 'marathwada', 'vidarbha', 'khandesh', 'konkan'].includes(topZoneId)) {
      return 'Marathi (Devanagari)';
    }
    if (['bhojpuri_east_up', 'awadhi_central_up', 'haryanvi_west_up'].includes(topZoneId)) {
      return 'Hindi / Regional Dialect (Devanagari)';
    }
    return 'Devanagari Script';
  }

  if (latinRatio > 0.45) {
    if (topZoneId === 'standard_english') {
      return 'Standard English';
    }
    if (topZoneId === 'mumbai_central') {
      return 'Mumbai Hinglish';
    }
    if (['western_maharashtra', 'marathwada', 'vidarbha', 'konkan', 'khandesh'].includes(topZoneId)) {
      return 'Marathi (Roman Script)';
    }
    if (['bhojpuri_east_up', 'awadhi_central_up', 'haryanvi_west_up'].includes(topZoneId)) {
      return 'Hinglish / Regional Hindi (Roman)';
    }
    return 'Hinglish / Roman Script';
  }

  return 'Mixed Script';
}

/**
 * Main Classifier Function
 * @param {string} text - Raw input message from citizen
 * @returns {object} Classification report
 */
export function classifyText(text) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return {
      dialectZone: 'Unmapped',
      languageStyle: 'None',
      region: 'Unmapped / Review Needed',
      office: 'Unmapped / Review Needed',
      issueCategory: 'Other',
      confidence: 0,
      matchedClues: [],
      runnerUp: null,
      status: 'Unmapped / Review Needed',
      tokensCount: 0,
      reasoning: 'Empty or blank submission provided.'
    };
  }

  const norm = normalizePipeline(text);
  const tokenCount = norm.rawTokens.length;

  const dialectZones = dialectsData.dialectZones || [];
  const zoneScores = {};
  const zoneClues = {};

  dialectZones.forEach(zone => {
    zoneScores[zone.id] = 0;
    zoneClues[zone.id] = [];
  });

  // Evaluate each dialect zone
  for (const zone of dialectZones) {
    const matchedTermsSet = new Set();

    for (const kw of zone.keywords) {
      const term = kw.term;
      const baseWeight = kw.weight || 1.0;
      const variants = [kw.term, ...(kw.variants || [])];

      let matchedVariant = null;
      let matchType = null;
      let effectiveWeight = 0;

      // 1. Check Multi-word Phrase match (highest priority)
      for (const variant of variants) {
        const vLower = variant.toLowerCase();
        if (vLower.includes(' ')) {
          if (
            norm.bigrams.includes(vLower) ||
            norm.trigrams.includes(vLower) ||
            norm.normalized.includes(vLower) ||
            norm.transliterated.includes(vLower)
          ) {
            matchedVariant = variant;
            matchType = 'phrase';
            effectiveWeight = baseWeight * 1.5;
            break;
          }
        }
      }

      // 2. Exact word / token match
      if (!matchedVariant) {
        for (const variant of variants) {
          const vLower = variant.toLowerCase();
          if (!vLower.includes(' ')) {
            if (norm.allTokens.includes(vLower)) {
              matchedVariant = variant;
              matchType = 'exact';
              effectiveWeight = baseWeight * 1.0;
              break;
            }
          }
        }
      }

      // 3. Fuzzy match
      if (!matchedVariant) {
        for (const variant of variants) {
          const vLower = variant.toLowerCase();
          if (!vLower.includes(' ')) {
            const fuzzyHit = norm.allTokens.find(token => isFuzzyMatch(token, vLower));
            if (fuzzyHit) {
              matchedVariant = `${fuzzyHit} ~ ${variant}`;
              matchType = 'fuzzy';
              effectiveWeight = baseWeight * 0.65;
              break;
            }
          }
        }
      }

      // Record clue if matched
      if (matchedVariant && !matchedTermsSet.has(term)) {
        matchedTermsSet.add(term);
        zoneScores[zone.id] += effectiveWeight;
        zoneClues[zone.id].push({
          term,
          matchedToken: matchedVariant,
          type: matchType,
          zone: zone.label,
          weight: Math.round(effectiveWeight * 100) / 100
        });
      }
    }
  }

  // Sort dialect zones by score descending
  const sortedZones = dialectZones
    .map(zone => ({
      zone,
      score: zoneScores[zone.id],
      clues: zoneClues[zone.id]
    }))
    .sort((a, b) => b.score - a.score);

  const top = sortedZones[0];
  const second = sortedZones[1];

  const topScore = top ? top.score : 0;
  const secondScore = second ? second.score : 0;

  // Margin calculation
  const margin = topScore > 0 ? (topScore - secondScore) / topScore : 0;

  // Issue Category
  const issueCategory = classifyIssueCategory(norm);

  // Confidence computation (0 to 1)
  let rawConfidence = 0;
  if (topScore > 0) {
    const scoreFactor = Math.min(1.0, topScore / 3.2);
    rawConfidence = scoreFactor * 0.55 + margin * 0.45;
    // Boost slightly if strong phrase clues
    if (top.clues.some(c => c.type === 'phrase')) {
      rawConfidence = Math.min(1.0, rawConfidence + 0.1);
    }
  }
  const confidence = Math.min(0.98, Math.max(0, Math.round(rawConfidence * 100) / 100));

  // Determine language style
  const languageStyle = detectLanguageStyle(text, norm.scriptInfo, top?.zone?.id);

  // Status determination
  let status = 'Verified / Routed';
  let routingReason = '';

  if (topScore === 0 || top.clues.length === 0 || confidence < 0.40) {
    status = 'Unmapped / Review Needed';
    routingReason = 'No distinctive dialect signatures matched above baseline threshold.';
  } else if (tokenCount < 3) {
    status = 'Needs Review';
    routingReason = 'Input message is very short (< 3 words) requiring manual verification.';
  } else if (topScore > 0 && secondScore > 0 && margin < 0.12) {
    status = 'Needs Review';
    routingReason = `Ambiguous cues: Top candidate (${top.zone.label}) has close competitor (${second.zone.label}) with margin ${(margin * 100).toFixed(0)}%.`;
  } else if (confidence >= 0.65) {
    status = 'Verified / Routed';
    routingReason = `High confidence (${(confidence * 100).toFixed(0)}%) match with ${top.clues.length} clear dialect cue(s).`;
  } else {
    status = 'Needs Review';
    routingReason = `Moderate confidence (${(confidence * 100).toFixed(0)}%); recommend human desk review before forwarding.`;
  }

  // Final Output
  const isUnmapped = status === 'Unmapped / Review Needed';

  return {
    dialectZone: isUnmapped ? 'Unmapped' : top.zone.label,
    dialectZoneId: isUnmapped ? 'unmapped' : top.zone.id,
    languageStyle,
    region: isUnmapped ? 'Unmapped / Review Needed' : top.zone.region,
    office: isUnmapped ? 'Unmapped / Review Needed' : top.zone.office,
    issueCategory,
    confidence,
    confidencePercent: Math.round(confidence * 100),
    matchedClues: isUnmapped ? [] : top.clues,
    runnerUp: second && second.score > 0 ? {
      zone: second.zone.label,
      score: Math.round(second.score * 100) / 100,
      office: second.zone.office
    } : null,
    status,
    tokensCount: tokenCount,
    reasoning: routingReason,
    topScore: Math.round(topScore * 100) / 100,
    normalizedText: norm.normalized
  };
}
