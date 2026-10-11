import React, { useState } from 'react';
import {
  Sparkles,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Layers,
  Languages,
  Tag,
  ArrowRight,
  Info,
  HelpCircle
} from 'lucide-react';
import { classifyText } from '../engine/classify';
import { useRecords } from '../store/recordsContext';
import StatusBadge from '../components/StatusBadge';

const SAMPLE_CHIPS = [
  {
    label: 'Marathi (Roman)',
    category: 'Western Maharashtra',
    text: 'amchya gavat pani nahi yet 3 divas zale tanker pathva'
  },
  {
    label: 'Marathi (Devanagari)',
    category: 'Western Maharashtra',
    text: 'आमच्या गावात पाणी येत नाही मुख्य पाइपलाईन फुटली आहे'
  },
  {
    label: 'Konkani / Malvani',
    category: 'Coastal Konkan',
    text: 'paaaani nai aavtai amhi tras ratnagiri bandar pipeline'
  },
  {
    label: 'Bhojpuri Hinglish',
    category: 'Bihar / East UP',
    text: 'humra area me bijli gol hai kaahe koi nahi sunta transformer jalgayi'
  },
  {
    label: 'Haryanvi Rural',
    category: 'Haryana / NCR',
    text: 'mhare gaam me bijli na aayi tanne pata hai transformer jal gaya'
  },
  {
    label: 'Standard English',
    category: 'National Helpdesk',
    text: 'Formal grievance complaint regarding municipal corporation road infrastructure department urgent attention required'
  },
  {
    label: 'Ambiguous / Needs Review',
    category: 'Review Needed',
    text: 'please help urgent problem'
  }
];

export default function SingleAnalysis() {
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  const { addRecord } = useRecords();

  const handleAnalyze = () => {
    if (!inputText.trim()) return;
    setIsAnalyzing(true);
    setIsSaved(false);

    // Artificial 550ms delay to convey realistic processing & transition
    setTimeout(() => {
      const res = classifyText(inputText);
      setResult(res);
      setIsAnalyzing(false);
    }, 550);
  };

  const handleSelectSample = (sampleText) => {
    setInputText(sampleText);
    setIsSaved(false);
    setIsAnalyzing(true);
    setTimeout(() => {
      const res = classifyText(sampleText);
      setResult(res);
      setIsAnalyzing(false);
    }, 450);
  };

  const handleClear = () => {
    setInputText('');
    setResult(null);
    setIsSaved(false);
  };

  const handleSaveToRecords = () => {
    if (!result || !inputText) return;
    addRecord({
      text: inputText,
      classification: result,
      source: 'Single Analysis Interface'
    });
    setIsSaved(true);
  };

  // Helper to render original text with matched keywords highlighted
  const renderHighlightedText = () => {
    if (!result || !inputText || !result.matchedClues || result.matchedClues.length === 0) {
      return <p className="text-slate-800 leading-relaxed font-sans">{inputText}</p>;
    }

    // Extract terms to highlight (including tokens)
    const termsToHighlight = [];
    result.matchedClues.forEach(c => {
      if (c.matchedToken) {
        // if matchedToken contains ~, split
        c.matchedToken.split('~').forEach(t => {
          const clean = t.trim();
          if (clean && clean.length > 2) termsToHighlight.push(clean);
        });
      }
      if (c.term && c.term.length > 2) termsToHighlight.push(c.term);
    });

    if (termsToHighlight.length === 0) {
      return <p className="text-slate-800 leading-relaxed font-sans">{inputText}</p>;
    }

    // Escape regex special chars
    const escaped = termsToHighlight
      .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .sort((a, b) => b.length - a.length)
      .join('|');

    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = inputText.split(regex);

    return (
      <p className="text-slate-800 leading-relaxed font-sans">
        {parts.map((part, i) => {
          const isMatch = termsToHighlight.some(t => t.toLowerCase() === part.toLowerCase());
          if (isMatch) {
            return (
              <mark
                key={i}
                className="bg-teal-100 text-teal-900 font-semibold px-1 py-0.5 rounded border border-teal-300 mx-0.5"
                title="Dialect Clue Match"
              >
                {part}
              </mark>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </p>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#16324F] flex items-center gap-2.5">
          <Sparkles className="w-6 h-6 text-teal-500" />
          Single Grievance Dialect Analysis
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Analyze raw citizen complaints in Devanagari or Roman Hindi/Marathi/Hinglish to predict regional origins and administrative routing.
        </p>
      </div>

      {/* Main Bento Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Form (lg:col-span-6) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bento-card p-5">
            <label htmlFor="grievance-input" className="block text-sm font-semibold text-slate-700 mb-2">
              Citizen Grievance / Feedback Text
            </label>

            <textarea
              id="grievance-input"
              rows={5}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste raw citizen message here (e.g., 'amchya gavat pani nahi yet 3 divas zale' or 'गावात पाणी येत नाही')..."
              className="w-full px-3.5 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-800 text-sm leading-relaxed placeholder:text-slate-400 bg-slate-50/50 resize-y"
            />

            {/* Quick Action Buttons */}
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                {inputText.length} characters &bull; {inputText.trim() ? inputText.trim().split(/\s+/).length : 0} words
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={!inputText && !result}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={!inputText.trim() || isAnalyzing}
                  className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-1.5"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Analyzing Clues...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Analyze Submission
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Clickable Sample Chips */}
          <div className="bento-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Test With Grassroots Samples
              </span>
              <span className="text-[11px] text-teal-600 font-medium">Click to run immediately</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSample(chip.text)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100/90 text-slate-700 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-200 border border-slate-200/80 transition-all text-left"
                >
                  <span className="font-semibold">{chip.label}</span>
                  <span className="text-[10px] text-slate-400 block">{chip.category}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Explainable Results (lg:col-span-6) */}
        <div className="lg:col-span-6">
          {result ? (
            <div className="bento-card p-6 space-y-5 animate-in fade-in duration-200">
              {/* Header Status & Save */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <StatusBadge status={result.status} />
                <button
                  onClick={handleSaveToRecords}
                  disabled={isSaved}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isSaved
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                      : 'bg-[#16324F] hover:bg-navy-700 text-white shadow-xs'
                  }`}
                >
                  {isSaved ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Saved in Records
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Save to Records
                    </>
                  )}
                </button>
              </div>

              {/* Original Text with Clue Highlighting */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Extracted Grievance (Highlighted Dialect Markers)
                </span>
                {renderHighlightedText()}
              </div>

              {/* Predicted Destination Office */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-teal-50/70 to-emerald-50/40 border border-teal-200">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-medium text-teal-800 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-teal-600" />
                      Recommended Routing Destination
                    </span>
                    <h3 className="text-base font-bold text-navy-800 mt-0.5">
                      {result.office}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Region: <span className="font-medium text-slate-800">{result.region}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Confidence Score Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Classification Confidence</span>
                  <span className="font-bold text-teal-700">{result.confidencePercent}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      result.confidence >= 0.65
                        ? 'bg-emerald-500'
                        : result.confidence >= 0.40
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.max(5, result.confidencePercent)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 pt-0.5">{result.reasoning}</p>
              </div>

              {/* Meta details grid */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Language / Script Style
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                    <Languages className="w-3.5 h-3.5 text-teal-600" />
                    <span>{result.languageStyle}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Issue Category
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                    <Tag className="w-3.5 h-3.5 text-teal-600" />
                    <span>{result.issueCategory}</span>
                  </div>
                </div>
              </div>

              {/* Matched Dialect Clues List */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-teal-600" />
                    Explainable Dialect Evidence ({result.matchedClues.length})
                  </span>
                  {result.runnerUp && (
                    <span className="text-[11px] text-slate-400">
                      Runner-up: <span className="font-semibold text-slate-600">{result.runnerUp.zone}</span>
                    </span>
                  )}
                </div>

                {result.matchedClues.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {result.matchedClues.map((clue, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-teal-50/50 border border-teal-100 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-teal-900">{clue.term}</span>
                          <span className="text-[10px] text-teal-700/80 block">
                            Type: {clue.type} &bull; token: {clue.matchedToken}
                          </span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white text-teal-700 border border-teal-200">
                          +{clue.weight}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-amber-50 text-amber-800 text-xs flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>No strong dialect keywords detected. Forwarded to human review queue.</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bento-card p-10 text-center flex flex-col items-center justify-center min-h-[380px]">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Awaiting Submission Analysis</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Enter text in the left panel or click any sample chip to see explainable regional dialect routing with clue evidence.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
