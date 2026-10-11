import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import {
  CheckCheck,
  Play,
  Upload,
  AlertTriangle,
  Award,
  Layers,
  Sparkles,
  HelpCircle,
  FileSpreadsheet,
  Target,
  RefreshCw,
  Search
} from 'lucide-react';
import { classifyText } from '../engine/classify';
import dialectsData from '../engine/dialectsData';
import defaultLabeledCsv from '../data/labeled_sample.csv?raw';

export default function Evaluation() {
  const [isRunning, setIsRunning] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState(null);
  const [customCsvName, setCustomCsvName] = useState(null);
  const [misclassifiedSearch, setMisclassifiedSearch] = useState('');
  const fileInputRef = useRef(null);

  // Load and evaluate built-in sample or custom CSV
  const runEvaluationWithDataset = (csvText, datasetName = 'Built-in Benchmark (89 records)') => {
    setIsRunning(true);
    setCustomCsvName(datasetName);

    // Artificial short delay for realistic UI transition
    setTimeout(() => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (parsed) => {
          const rows = parsed.data;
          if (!rows || rows.length === 0) {
            alert('Dataset is empty or malformed.');
            setIsRunning(false);
            return;
          }

          let correctOverall = 0;
          let correctAutoRouted = 0;
          let autoRoutedCount = 0;
          let needsReviewCount = 0;

          const detailedRows = [];
          const misclassified = [];
          const regionStats = {};
          const confusionMatrix = {};

          // Initialize regions list from dialects + unmapped
          const allTargetRegions = [
            ...dialectsData.dialectZones.map(z => z.region),
            'Unmapped / Review Needed'
          ];

          allTargetRegions.forEach(r1 => {
            confusionMatrix[r1] = {};
            allTargetRegions.forEach(r2 => {
              confusionMatrix[r1][r2] = 0;
            });
            regionStats[r1] = { truePositives: 0, falsePositives: 0, falseNegatives: 0, totalGroundTruth: 0 };
          });

          rows.forEach((row, idx) => {
            const rawText = (row.text || row.grievance_text || row.submission || '').toString();
            const trueRegion = (row.true_region || row.region || '').trim();

            if (!rawText || !trueRegion) return;

            const pred = classifyText(rawText);
            const predictedRegion = pred.region;
            const isAutoRouted = pred.status === 'Verified / Routed';

            const isCorrect = predictedRegion.toLowerCase() === trueRegion.toLowerCase();

            if (isCorrect) correctOverall++;
            if (isAutoRouted) {
              autoRoutedCount++;
              if (isCorrect) correctAutoRouted++;
            } else {
              needsReviewCount++;
            }

            // Update confusion matrix
            if (confusionMatrix[trueRegion] && confusionMatrix[trueRegion][predictedRegion] !== undefined) {
              confusionMatrix[trueRegion][predictedRegion]++;
            }

            // Update per-region stats
            if (!regionStats[trueRegion]) {
              regionStats[trueRegion] = { truePositives: 0, falsePositives: 0, falseNegatives: 0, totalGroundTruth: 0 };
            }
            regionStats[trueRegion].totalGroundTruth++;

            if (isCorrect) {
              regionStats[trueRegion].truePositives++;
            } else {
              regionStats[trueRegion].falseNegatives++;
              if (regionStats[predictedRegion]) {
                regionStats[predictedRegion].falsePositives++;
              }
              misclassified.push({
                id: idx + 1,
                text: rawText,
                trueRegion,
                predictedRegion,
                detectedDialect: pred.dialectZone,
                confidence: pred.confidencePercent,
                status: pred.status,
                matchedClues: pred.matchedClues
              });
            }

            detailedRows.push({
              text: rawText,
              trueRegion,
              predictedRegion,
              isCorrect,
              confidence: pred.confidencePercent,
              status: pred.status
            });
          });

          const totalEvaluated = detailedRows.length;
          const overallAccuracy = totalEvaluated > 0 ? Math.round((correctOverall / totalEvaluated) * 100) : 0;
          const autoRoutedAccuracy = autoRoutedCount > 0 ? Math.round((correctAutoRouted / autoRoutedCount) * 100) : 0;
          const coveragePercent = totalEvaluated > 0 ? Math.round((autoRoutedCount / totalEvaluated) * 100) : 0;

          // Compute Precision, Recall, F1 for regions
          const regionMetricsTable = Object.entries(regionStats)
            .filter(([_, stats]) => stats.totalGroundTruth > 0)
            .map(([regionName, stats]) => {
              const pDenom = stats.truePositives + stats.falsePositives;
              const precision = pDenom > 0 ? Math.round((stats.truePositives / pDenom) * 100) : 0;

              const rDenom = stats.truePositives + stats.falseNegatives;
              const recall = rDenom > 0 ? Math.round((stats.truePositives / rDenom) * 100) : 0;

              const f1 = (precision + recall) > 0 ? Math.round((2 * precision * recall) / (precision + recall)) : 0;

              return {
                region: regionName,
                support: stats.totalGroundTruth,
                precision,
                recall,
                f1
              };
            });

          setEvaluationResults({
            totalEvaluated,
            correctOverall,
            overallAccuracy,
            autoRoutedCount,
            correctAutoRouted,
            autoRoutedAccuracy,
            coveragePercent,
            needsReviewCount,
            regionMetricsTable,
            confusionMatrix,
            activeRegions: regionMetricsTable.map(r => r.region),
            misclassified
          });

          setIsRunning(false);
        }
      });
    }, 600);
  };

  // Run on built-in CSV
  const handleRunDefaultEvaluation = () => {
    runEvaluationWithDataset(defaultLabeledCsv, 'Built-in Benchmark (89 labeled cases)');
  };

  // Handle custom labeled CSV upload
  const handleCustomFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        runEvaluationWithDataset(content, `Custom Dataset: ${file.name}`);
      }
    };
    reader.readAsText(file);
  };

  // Auto-run evaluation on first render so results are immediately visible!
  useEffect(() => {
    handleRunDefaultEvaluation();
  }, []);

  const filteredMisclassified = evaluationResults?.misclassified.filter(m =>
    !misclassifiedSearch ||
    m.text.toLowerCase().includes(misclassifiedSearch.toLowerCase()) ||
    m.trueRegion.toLowerCase().includes(misclassifiedSearch.toLowerCase()) ||
    m.predictedRegion.toLowerCase().includes(misclassifiedSearch.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#16324F] flex items-center gap-2.5">
            <CheckCheck className="w-6 h-6 text-teal-500" />
            Empirical Accuracy &amp; Heuristic Evaluation
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Auditing rule-based classification precision, recall, and confusion matrix against ground-truth labeled grassroots records.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleCustomFileUpload}
            accept=".csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-teal-600" />
            Upload Labeled CSV
          </button>

          <button
            onClick={handleRunDefaultEvaluation}
            disabled={isRunning}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Evaluating...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                Re-Run Evaluation
              </>
            )}
          </button>
        </div>
      </div>

      {/* Dataset Status Banner */}
      <div className="p-3.5 rounded-xl bg-slate-100/80 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Active Test Corpus:</span>
          <span className="font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-semibold">
            {customCsvName || 'Built-in Benchmark (89 cases)'}
          </span>
        </div>
        <span className="text-[11px] text-slate-400 hidden sm:inline">
          Covers Marathi (Roman &amp; Devanagari), Bhojpuri, Awadhi, Haryanvi, Khandesh, Konkan, Mumbai, English
        </span>
      </div>

      {evaluationResults && (
        <>
          {/* Key Metric Ribbon */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Auto-Routed Accuracy */}
            <div className="bento-card p-5 border-emerald-100 bg-emerald-50/20">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                Auto-Routed Accuracy
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-800">
                  {evaluationResults.autoRoutedAccuracy}%
                </span>
                <span className="text-xs text-emerald-600 font-medium">
                  ({evaluationResults.correctAutoRouted}/{evaluationResults.autoRoutedCount})
                </span>
              </div>
              <p className="text-[11px] text-emerald-700/90 mt-1 font-medium">
                Accuracy on submissions with confidence &ge; 65%
              </p>
            </div>

            {/* Overall Accuracy */}
            <div className="bento-card p-5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Overall Accuracy
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#16324F]">
                  {evaluationResults.overallAccuracy}%
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  ({evaluationResults.correctOverall}/{evaluationResults.totalEvaluated})
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Across all rows including ambiguous / review cases
              </p>
            </div>

            {/* Coverage */}
            <div className="bento-card p-5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Routing Coverage
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-teal-700">
                  {evaluationResults.coveragePercent}%
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  ({evaluationResults.autoRoutedCount} auto-routed)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Proportion of submissions confidently routed
              </p>
            </div>

            {/* Human Review Rate */}
            <div className="bento-card p-5 border-amber-100 bg-amber-50/20">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                Human Review Rate
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-800">
                  {Math.round((evaluationResults.needsReviewCount / evaluationResults.totalEvaluated) * 100)}%
                </span>
                <span className="text-xs text-amber-700 font-medium">
                  ({evaluationResults.needsReviewCount} flagged)
                </span>
              </div>
              <p className="text-[11px] text-amber-700/90 mt-1">
                Safely redirected to human desk review
              </p>
            </div>
          </div>

          {/* Per-Region Precision / Recall / F1 Table */}
          <div className="bento-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#16324F] flex items-center gap-2">
                  <Target className="w-4 h-4 text-teal-600" />
                  Per-Region Precision, Recall &amp; F1-Score Breakdown
                </h3>
                <p className="text-xs text-slate-500">Real performance numbers calculated across each regional jurisdiction</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Regional Administrative Desk</th>
                    <th className="py-3 px-4">Ground Truth Cases</th>
                    <th className="py-3 px-4">Precision</th>
                    <th className="py-3 px-4">Recall</th>
                    <th className="py-3 px-4">F1-Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {evaluationResults.regionMetricsTable.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">{row.region}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{row.support}</td>
                      <td className="py-3 px-4">
                        <span className={`font-semibold ${row.precision >= 80 ? 'text-emerald-700' : 'text-slate-700'}`}>
                          {row.precision}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-semibold ${row.recall >= 80 ? 'text-emerald-700' : 'text-slate-700'}`}>
                          {row.recall}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                          {row.f1}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Confusion Matrix Heatmap */}
          <div className="bento-card p-5 space-y-3 overflow-hidden">
            <div>
              <h3 className="text-sm font-bold text-[#16324F] flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                Confusion Matrix Heatmap
              </h3>
              <p className="text-xs text-slate-500">
                Rows = True Regional Origin &bull; Columns = Predicted Destination Desk
              </p>
            </div>

            <div className="overflow-x-auto pt-2">
              <table className="text-[11px] border-collapse w-full">
                <thead>
                  <tr>
                    <th className="p-2 border border-slate-200 bg-slate-100 text-slate-700 text-left font-semibold">
                      True \ Pred
                    </th>
                    {evaluationResults.activeRegions.map(reg => (
                      <th
                        key={reg}
                        className="p-2 border border-slate-200 bg-slate-100 text-slate-700 font-semibold max-w-[100px] truncate text-center"
                        title={reg}
                      >
                        {reg.split('(')[0].trim()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {evaluationResults.activeRegions.map(trueReg => (
                    <tr key={trueReg}>
                      <td className="p-2 border border-slate-200 bg-slate-50 font-semibold text-slate-800 whitespace-nowrap">
                        {trueReg.split('(')[0].trim()}
                      </td>
                      {evaluationResults.activeRegions.map(predReg => {
                        const count = evaluationResults.confusionMatrix[trueReg]?.[predReg] || 0;
                        const isDiag = trueReg === predReg;

                        let cellClass = 'bg-white text-slate-400';
                        if (isDiag && count > 0) {
                          cellClass = 'bg-emerald-100/80 text-emerald-900 font-bold';
                        } else if (!isDiag && count > 0) {
                          cellClass = 'bg-rose-100/80 text-rose-900 font-bold';
                        }

                        return (
                          <td
                            key={predReg}
                            className={`p-2 border border-slate-200 text-center font-mono transition-colors ${cellClass}`}
                            title={`True: ${trueReg} -> Pred: ${predReg} (${count})`}
                          >
                            {count}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Error Analysis / Misclassified Cases */}
          <div className="bento-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#16324F] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Error Analysis &amp; Lexicon Refinement Log ({evaluationResults.misclassified.length} Cases)
                </h3>
                <p className="text-xs text-slate-500">
                  Submissions where predicted desk diverged from ground truth (or required human review).
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter misclassifications..."
                  value={misclassifiedSearch}
                  onChange={(e) => setMisclassifiedSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4 min-w-[260px]">Citizen Grievance Text</th>
                    <th className="py-3 px-4">True Region</th>
                    <th className="py-3 px-4">Predicted Region</th>
                    <th className="py-3 px-4">Conf.</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredMisclassified.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400">{row.id}</td>
                      <td className="py-3 px-4 text-slate-800 font-medium max-w-sm" title={row.text}>
                        {row.text}
                      </td>
                      <td className="py-3 px-4 text-emerald-800 font-semibold">{row.trueRegion}</td>
                      <td className="py-3 px-4 text-rose-700 font-medium">{row.predictedRegion}</td>
                      <td className="py-3 px-4 font-bold text-slate-600">{row.confidence}%</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredMisclassified.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-400">
                No misclassifications matching search criteria.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
