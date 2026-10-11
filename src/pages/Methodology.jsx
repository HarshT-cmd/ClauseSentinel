import React from 'react';
import {
  BookOpen,
  Cpu,
  Layers,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Workflow,
  Sparkles,
  Compass,
  AlertTriangle,
  Lightbulb,
  Building2,
  HelpCircle
} from 'lucide-react';

export default function Methodology() {
  const steps = [
    {
      num: '01',
      title: 'Raw Ingestion & Script Analysis',
      desc: 'Handles mixed scripts (Devanagari, Roman Hindi/Marathi, Hinglish), informal texting conventions, and Unicode variance without requiring pre-tagged metadata.'
    },
    {
      num: '02',
      title: 'Normalization Pipeline',
      desc: 'Applies Unicode NFC normalization, collapses repeated characters ("paaaani" → "paani", "nahiii" → "nahi"), and standardizes colloquial spelling variants.'
    },
    {
      num: '03',
      title: 'Phonetic Transliteration',
      desc: 'Converts Devanagari matras, conjuncts, and consonants into Roman phonetic equivalents so cross-script dialect patterns match uniformly.'
    },
    {
      num: '04',
      title: 'Multi-tiered Lexical Matching',
      desc: 'Extracts unigrams, bigrams, and trigrams. Performs exact token matches, multi-word phrase detection ("amchya gavat", "bijli gol"), and Levenshtein fuzzy matching.'
    },
    {
      num: '05',
      title: 'Confidence & Margin Scoring',
      desc: 'Calculates weighted evidence scores and evaluates margin of victory over runner-up dialect zones. Clamps confidence score between 0% and 98%.'
    },
    {
      num: '06',
      title: 'Administrative Dispatch & Review',
      desc: 'Directs high-confidence cases (&ge; 65%) to designated regional administrative offices. Ambiguous submissions are routed to human review desk.'
    },
    {
      num: '07',
      title: 'Continuous Feedback Loop',
      desc: 'Desk officers manually verify ambiguous grievances, which in turn flags missing keywords and enriches the rule engine dictionary.'
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#16324F] flex items-center gap-2.5">
          <BookOpen className="w-6 h-6 text-teal-500" />
          Problem Statement &amp; Architectural Methodology
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Bridging the gap between raw grassroots citizen submissions and local government desks through explainable dialect routing.
        </p>
      </div>

      {/* The Grassroots Civic Problem Section */}
      <div className="bento-card p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
            <Compass className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-navy-800">
            The Grassroots Challenge: Lost Geographic Metadata
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          National and state civic platforms (like CPGRAMS, state portals, and NGO helplines) aggregate millions of grievances every month. When submissions arrive via bulk imports, offline paper surveys, mobile SMS, or WhatsApp channels, <strong>geographic tags are frequently corrupted or completely omitted</strong>.
        </p>

        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          What remains is a disorganized repository of unstructured text written in informal styles, heavy phonetic misspellings, and localized regional vernaculars—such as <em>Ahirani in Khandesh</em>, <em>Varhadi in Vidarbha</em>, <em>Malvani along coastal Konkan</em>, or <em>Bhojpuri in Eastern UP and Bihar</em>. Without knowing the geographic or community origin, a central administrative team cannot route these complaints to the correct local sub-division, leading to backlogs and unheard citizen voices.
        </p>
      </div>

      {/* Visual Pipeline Flow */}
      <div className="bento-card p-6 space-y-5">
        <div>
          <h2 className="text-base font-bold text-navy-800 flex items-center gap-2">
            <Workflow className="w-5 h-5 text-teal-600" />
            End-to-End Processing Architecture
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            100% Client-side explainable heuristic pipeline running directly in the browser
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {steps.map((step) => (
            <div
              key={step.num}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-teal-300 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Step {step.num}
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-900">{step.title}</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Why Dialect-Origin Mapping Matters */}
      <div className="bento-card p-6 space-y-3">
        <h2 className="text-base font-bold text-navy-800 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-teal-600" />
          Why Linguistic Dialect Cues Matter for Civic Inclusivity
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <h4 className="font-bold text-slate-900">Democratizing Access</h4>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Citizens in rural and remote regions do not write in standardized legal terminology or formal English. Honoring informal regional dialects ensures their voices are not discarded as noise.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <h4 className="font-bold text-slate-900">Explainable Decisions</h4>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Unlike opaque black-box deep learning, JanSetu AI displays the exact words, n-grams, and weight contributions that caused a grievance to be assigned to a specific regional desk.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <h4 className="font-bold text-slate-900">Zero Cloud Data Leakage</h4>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              All inference executes entirely within client memory. Citizen identities and sensitive grievance details are never uploaded to commercial third-party LLM APIs.
            </p>
          </div>
        </div>
      </div>

      {/* Prototype Limitations Card (Mandatory Requirement) */}
      <div className="bento-card p-6 border-amber-200 bg-amber-50/30 space-y-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
            <AlertTriangle className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h3 className="text-base font-bold text-amber-900">
              Prototype Limitations &amp; Production Roadmap
            </h3>
            <p className="text-xs text-amber-700">
              Transparent assessment of heuristic demo boundaries and enterprise requirements
            </p>
          </div>
        </div>

        <div className="space-y-2 text-xs text-amber-900/90 leading-relaxed">
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
            <p>
              <strong>Heuristic Rule Engine:</strong> This application is a hackathon prototype powered by an explainable, dictionary-driven heuristic engine. Production deployment requires fine-tuned multilingual representation models (such as IndicBERT or MuRIL embeddings) trained on consented, diverse, and ethically curated grassroots datasets.
            </p>
          </div>

          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
            <p>
              <strong>Fuzzy Dialect Boundaries &amp; Migration:</strong> Dialect boundaries are inherently non-discrete and fluid. Furthermore, migrant workers may write in their mother dialect (e.g. Bhojpuri) while residing in Mumbai or Pune. Grounded field officers must always have the authority to re-route cases.
            </p>
          </div>

          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
            <p>
              <strong>Privacy Safeguards &amp; Bias Audits:</strong> Real-world implementations require strict anonymization, removal of personally identifiable information (PII), and regular algorithmic bias audits across minority linguistic subgroups.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
