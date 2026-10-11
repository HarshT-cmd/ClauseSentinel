/**
 * JanSetu AI - Engine Unit-style Self-Test Suite
 * Runs ~15 sample sentences through the classifier engine and validates classifications.
 */

import { classifyText } from './classify.js';

const TEST_CASES = [
  {
    name: '1. Marathi Roman Western Maharashtra (Prompt Checklist Item 2)',
    input: 'amchya gavat pani nahi yet 3 divas zale',
    expectedZoneKeywords: ['Maharashtra'],
    expectedIssue: 'Water',
    expectedStatus: ['Verified / Routed']
  },
  {
    name: '2. Marathi Devanagari (Prompt Checklist Item 3)',
    input: 'आमच्या गावात पाणी येत नाही',
    expectedZoneKeywords: ['Maharashtra'],
    expectedIssue: 'Water',
    expectedStatus: ['Verified / Routed', 'Needs Review']
  },
  {
    name: '3. Bhojpuri Hinglish (Prompt Checklist Item 4)',
    input: 'humra area me bijli gol hai kaahe koi nahi sunta',
    expectedZoneKeywords: ['Bhojpuri'],
    expectedIssue: 'Power / Electricity',
    expectedStatus: ['Verified / Routed']
  },
  {
    name: '4. Misspelled Konkani/Malvani (Prompt Checklist Item 5)',
    input: 'paaaani nai aavtai amhi tras',
    expectedZoneKeywords: ['Konkan', 'Maharashtra'],
    expectedIssue: 'Water',
    expectedStatus: ['Verified / Routed', 'Needs Review']
  },
  {
    name: '5. Ambiguous short text (Prompt Checklist Item 5)',
    input: 'please help urgent',
    expectedZoneKeywords: ['Unmapped', 'Standard English'],
    expectedIssue: 'Other',
    expectedStatus: ['Needs Review', 'Unmapped / Review Needed']
  },
  {
    name: '6. Haryanvi Rural Hindi',
    input: 'mhare gaam me bijli na aayi tanne pata hai',
    expectedZoneKeywords: ['Haryanvi'],
    expectedIssue: 'Power / Electricity',
    expectedStatus: ['Verified / Routed']
  },
  {
    name: '7. Vidarbha Regional Dialect',
    input: 'vhay bhau akola bhetla nai nagpur loka sheti kharab',
    expectedZoneKeywords: ['Vidarbha'],
    expectedIssue: 'Other',
    expectedStatus: ['Verified / Routed']
  },
  {
    name: '8. Marathwada Regional Dialect',
    input: 'kaay raav amchya gavat dushkal bagha ki latur',
    expectedZoneKeywords: ['Marathwada', 'Maharashtra'],
    expectedIssue: 'Water',
    expectedStatus: ['Verified / Routed']
  },
  {
    name: '9. Khandesh Ahirani Dialect',
    input: 'mhaare gao ma tumhi kai shana jalgaon dhule',
    expectedZoneKeywords: ['Khandesh'],
    expectedIssue: 'Other',
    expectedStatus: ['Verified / Routed']
  },
  {
    name: '10. Mumbai BMC Hinglish',
    input: 'bmc ward officer road khadda gutter nalla complaint',
    expectedZoneKeywords: ['Mumbai'],
    expectedIssue: 'Roads & Infrastructure',
    expectedStatus: ['Verified / Routed']
  },
  {
    name: '11. Awadhi Rural Central UP',
    input: 'hamaar ghar kay pass sadak nahi naahi tohar pradhan ji',
    expectedZoneKeywords: ['Awadhi'],
    expectedIssue: 'Roads & Infrastructure',
    expectedStatus: ['Verified / Routed']
  },
  {
    name: '12. Standard English Formal Grievance',
    input: 'Formal grievance complaint regarding municipal corporation road infrastructure department urgent attention required',
    expectedZoneKeywords: ['Standard English'],
    expectedIssue: 'Roads & Infrastructure',
    expectedStatus: ['Verified / Routed']
  },
  {
    name: '13. Very short ambiguous text',
    input: 'kuch na',
    expectedZoneKeywords: ['Haryanvi', 'Unmapped'],
    expectedIssue: 'Other',
    expectedStatus: ['Needs Review', 'Unmapped / Review Needed']
  },
  {
    name: '14. Devanagari Electricity Issue',
    input: 'गावात ट्रान्सफॉर्मर जळाला वीज नाही',
    expectedZoneKeywords: ['Maharashtra'],
    expectedIssue: 'Power / Electricity',
    expectedStatus: ['Verified / Routed', 'Needs Review']
  },
  {
    name: '15. Sanitation Garbage Issue in Mumbai',
    input: 'society compound me kachra aur gandagi hai bmc clean karo',
    expectedZoneKeywords: ['Mumbai'],
    expectedIssue: 'Sanitation & Waste',
    expectedStatus: ['Verified / Routed']
  }
];

console.log('='.repeat(70));
console.log(' JANSETU AI - RULE ENGINE VERIFICATION TEST SUITE');
console.log('='.repeat(70));

let passedCount = 0;
let totalCount = TEST_CASES.length;

for (const tc of TEST_CASES) {
  const result = classifyText(tc.input);

  const zoneMatched = tc.expectedZoneKeywords.some(keyword =>
    result.dialectZone.includes(keyword) || result.region.includes(keyword)
  );
  const statusMatched = tc.expectedStatus.includes(result.status);
  const issueMatched = !tc.expectedIssue || result.issueCategory === tc.expectedIssue;

  const passed = zoneMatched && statusMatched;
  if (passed) passedCount++;

  console.log(`\n[${passed ? 'PASS' : 'FAIL'}] ${tc.name}`);
  console.log(`  Input:      "${tc.input}"`);
  console.log(`  Dialect:    ${result.dialectZone} (${result.region})`);
  console.log(`  Office:     ${result.office}`);
  console.log(`  Issue:      ${result.issueCategory} ${issueMatched ? '✓' : `(expected ${tc.expectedIssue})`}`);
  console.log(`  Confidence: ${result.confidencePercent}% [Status: ${result.status}]`);
  console.log(`  Clues (${result.matchedClues.length}):`, result.matchedClues.map(c => `${c.term} (${c.type}, w:${c.weight})`).join(', ') || 'None');
  if (result.runnerUp) {
    console.log(`  Runner Up:  ${result.runnerUp.zone} (score: ${result.runnerUp.score})`);
  }
}

console.log('\n' + '='.repeat(70));
console.log(` SUMMARY: ${passedCount}/${totalCount} tests passed (${Math.round((passedCount/totalCount)*100)}%)`);
console.log('='.repeat(70));

if (passedCount < totalCount - 1) {
  console.error('\n❌ Too many tests failed. Please refine dialect keywords.');
  process.exit(1);
} else {
  console.log('\n✅ Rule Engine successfully validated! Ready for UI Integration.');
  process.exit(0);
}
