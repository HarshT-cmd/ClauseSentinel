import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import {
  FileSpreadsheet,
  Upload,
  Download,
  Database,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  RefreshCw,
  Search,
  ArrowDownToLine,
  Sliders
} from 'lucide-react';
import { classifyText } from '../engine/classify';
import { useRecords } from '../store/recordsContext';
import StatusBadge from '../components/StatusBadge';

const SAMPLE_CSV_CONTENT = `id,grievance_text,date,source
1,"amchya gavat pani nahi yet 3 divas zale tanker pathva",2026-10-10,SMS Helpline
2,"आमच्या गावात पाणी येत नाही मुख्य पाइपलाईन फुटली आहे",2026-10-10,Web Portal
3,"humra area me bijli gol hai kaahe koi nahi sunta",2026-10-09,Call Center
4,"mhare gaam me bijli na aayi tanne pata hai",2026-10-09,WhatsApp Grievance
5,"paaaani nai aavtai amhi tras ratnagiri bandar",2026-10-08,Panchayat Desk
6,"Formal grievance complaint regarding municipal corporation road infrastructure department",2026-10-08,Official Email
7,"please help urgent",2026-10-07,Field Survey
8,"society compound me kachra aur gandagi hai bmc clean karo",2026-10-07,Civic Mobile App`;

export default function BulkProcessing() {
  const [file, setFile] = useState(null);
  const [columns, setColumns] = useState([]);
  const [selectedTextCol, setSelectedTextCol] = useState('');
  const [previewRows, setPreviewRows] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedRows, setProcessedRows] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fileInputRef = useRef(null);
  const { addBulkRecords } = useRecords();

  // Download Sample CSV with UTF-8 BOM
  const handleDownloadSample = () => {
    const bom = '\uFEFF';
    const blob = new Blob([bom + SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'jansetu_sample_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Robust text column auto-detection that analyzes actual sample values and penalizes ID columns
  const detectTextColumn = (headers, previewData = []) => {
    if (!headers || headers.length === 0) return '';

    const idRegex = /(_id$|^id$|_no$|^no$|sno|sr_no|ticket|code|date|time|timestamp|status|division|department)/i;

    const textKeywords = [
      'complaint_text', 'grievance_text', 'feedback_text', 'issue_text', 'message_text',
      'complaint', 'grievance', 'feedback', 'text', 'message', 'description', 'issue',
      'submission', 'details', 'comment', 'remarks', 'body', 'content', 'query', 'takrar'
    ];

    let bestCol = '';
    let bestScore = -999;

    for (const h of headers) {
      const lower = h.toLowerCase().trim();
      let score = 0;

      // Penalize identifier / metadata columns heavily
      if (idRegex.test(lower)) {
        score -= 100;
      }

      // Check text keyword matches
      for (let i = 0; i < textKeywords.length; i++) {
        const kw = textKeywords[i];
        if (lower === kw) {
          score += 50 - i;
          break;
        } else if (lower.includes(kw) && !lower.endsWith('_id') && !lower.endsWith('id')) {
          score += 30 - i;
          break;
        }
      }

      // Check actual sample cell lengths from previewData
      if (previewData && previewData.length > 0) {
        let totalLen = 0;
        let spaces = 0;
        let valid = 0;

        for (const row of previewData) {
          const val = (row[h] || '').toString().trim();
          if (val) {
            valid++;
            totalLen += val.length;
            if (val.includes(' ')) spaces++;
          }
        }

        if (valid > 0) {
          const avgLen = totalLen / valid;
          if (avgLen > 15 && spaces > 0) {
            score += 40 + Math.min(30, avgLen);
          } else if (avgLen < 10 && spaces === 0) {
            score -= 40; // Looks like an ID code
          }
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestCol = h;
      }
    }

    return bestCol || headers[0] || '';
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    setErrorMessage('');
    setProcessedRows([]);
    setFile(selectedFile);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      preview: 5,
      complete: (results) => {
        if (!results.meta || !results.meta.fields || results.meta.fields.length === 0) {
          setErrorMessage('Could not find header row or columns in this CSV file.');
          return;
        }
        const fields = results.meta.fields;
        const pRows = results.data || [];
        setColumns(fields);
        setPreviewRows(pRows);
        const autoDetected = detectTextColumn(fields, pRows);
        setSelectedTextCol(autoDetected);
      },
      error: (err) => {
        setErrorMessage(`CSV parsing error: ${err.message}`);
      }
    });
  };

  const handleProcessCSV = () => {
    if (!file || !selectedTextCol) return;
    setIsProcessing(true);
    setErrorMessage('');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        const rows = results.data;
        if (!rows || rows.length === 0) {
          setErrorMessage('The CSV file does not contain any valid data rows.');
          setIsProcessing(false);
          return;
        }

        // Find potential ID column for display
        const idCol = columns.find(c => /(_id$|^id$|ticket|sno|sr_no)/i.test(c.toLowerCase()));

        const enriched = rows.map((row, index) => {
          const rawText = (row[selectedTextCol] ?? '').toString().trim();
          const classification = classifyText(rawText);
          const rowId = idCol && row[idCol] ? row[idCol] : `#${index + 1}`;

          return {
            ...row,
            __id: `bulk_${index + 1}`,
            __displayId: rowId,
            __rawText: rawText,
            Detected_Dialect: classification.dialectZone,
            Predicted_Region: classification.region,
            Issue_Category: classification.issueCategory,
            Confidence: `${classification.confidencePercent}%`,
            Routing_Status: classification.status,
            _classification: classification
          };
        });

        setProcessedRows(enriched);
        setIsProcessing(false);
      },
      error: (err) => {
        setErrorMessage(`Failed to process CSV rows: ${err.message}`);
        setIsProcessing(false);
      }
    });
  };

  // Add all processed rows to global Records store
  const handleAddAllToRecords = () => {
    if (processedRows.length === 0) return;
    const itemsToAdd = processedRows.map(r => ({
      text: r.__rawText,
      source: `Bulk CSV: ${file?.name || 'File'}`,
      classification: r._classification
    }));
    addBulkRecords(itemsToAdd);
  };

  // Export processed CSV with UTF-8 BOM
  const handleExportProcessedCSV = () => {
    if (processedRows.length === 0) return;

    // Clean internal keys
    const exportable = processedRows.map(r => {
      const copy = { ...r };
      delete copy.__id;
      delete copy.__rawText;
      delete copy._classification;
      return copy;
    });

    const csvString = Papa.unparse(exportable);
    const bom = '\uFEFF'; // Crucial UTF-8 BOM so Marathi/Hindi text is preserved in Excel
    const blob = new Blob([bom + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `jansetu_processed_${Date.now()}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Summary counts
  const summaryCounts = processedRows.reduce(
    (acc, row) => {
      acc.total++;
      if (row.Routing_Status === 'Verified / Routed') acc.verified++;
      else if (row.Routing_Status === 'Needs Review') acc.needsReview++;
      else acc.unmapped++;
      return acc;
    },
    { total: 0, verified: 0, needsReview: 0, unmapped: 0 }
  );

  // Filtered rows for preview table
  const filteredRows = processedRows.filter(row => {
    const matchesSearch =
      !searchTerm ||
      (row.__rawText && row.__rawText.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (row.Detected_Dialect && row.Detected_Dialect.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (row.Issue_Category && row.Issue_Category.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' || row.Routing_Status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#16324F] flex items-center gap-2.5">
            <FileSpreadsheet className="w-6 h-6 text-teal-500" />
            Bulk CSV Dialect Routing
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Batch-process raw grievances in CSV spreadsheets and append dialect tags, regional destinations, and confidence scores.
          </p>
        </div>

        <button
          onClick={handleDownloadSample}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <ArrowDownToLine className="w-4 h-4 text-teal-600" />
          Download Sample CSV
        </button>
      </div>

      {/* Upload Zone & Mapping Settings */}
      <div className="bento-card p-6">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFileSelect(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          className="border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-2xl p-8 text-center cursor-pointer bg-slate-50/50 hover:bg-teal-50/20 transition-all"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
            accept=".csv"
            className="hidden"
          />

          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Upload className="w-6 h-6" />
          </div>

          <h3 className="text-sm font-bold text-slate-800">
            {file ? file.name : 'Drag and drop your grievance CSV here, or browse files'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Supports UTF-8 encoded CSV files (Devanagari and Roman script safe)
          </p>
          {file && (
            <p className="text-xs text-teal-700 font-medium mt-2">
              Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Text column mapping & Process Trigger */}
        {columns.length > 0 && (
          <div className="mt-5 pt-5 border-t border-slate-100 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <label htmlFor="col-select" className="text-xs font-semibold text-slate-700 shrink-0 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-teal-600" />
                  Text Column:
                </label>
                <select
                  id="col-select"
                  value={selectedTextCol}
                  onChange={(e) => setSelectedTextCol(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
                >
                  {columns.map(col => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-teal-700 font-medium bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                  Auto-selected
                </span>
              </div>

              <button
                onClick={handleProcessCSV}
                disabled={isProcessing || !selectedTextCol}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all shrink-0"
              >
                {isProcessing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing All Rows...
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    Run Batch Classification
                  </>
                )}
              </button>
            </div>

            {/* Column Preview & Warning */}
            {selectedTextCol && previewRows.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="font-semibold text-teal-800">Preview 1st Row Value:</span>
                  <span className="italic text-slate-800 truncate font-mono max-w-xl">
                    "{previewRows[0]?.[selectedTextCol] || 'Empty'}"
                  </span>
                </div>
                {previewRows[0]?.[selectedTextCol] &&
                 previewRows[0][selectedTextCol].toString().length < 10 &&
                 !previewRows[0][selectedTextCol].toString().includes(' ') && (
                  <div className="flex items-center gap-1.5 text-amber-700 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      Notice: "{selectedTextCol}" appears to contain short ID codes (e.g., "{previewRows[0][selectedTextCol]}"). 
                      Make sure to select the column containing the full citizen grievance text above.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Section */}
      {processedRows.length > 0 && (
        <div className="space-y-4">
          {/* Summary Metric Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bento-card p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Rows</span>
              <p className="text-xl font-bold text-navy-800 mt-1">{summaryCounts.total}</p>
            </div>
            <div className="bento-card p-4 border-emerald-100 bg-emerald-50/30">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Auto-Routed</span>
              <p className="text-xl font-bold text-emerald-700 mt-1">{summaryCounts.verified}</p>
            </div>
            <div className="bento-card p-4 border-amber-100 bg-amber-50/30">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Needs Review</span>
              <p className="text-xl font-bold text-amber-700 mt-1">{summaryCounts.needsReview}</p>
            </div>
            <div className="bento-card p-4 border-rose-100 bg-rose-50/30">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Unmapped</span>
              <p className="text-xl font-bold text-rose-700 mt-1">{summaryCounts.unmapped}</p>
            </div>
          </div>

          {/* Table Controls & Batch Actions */}
          <div className="bento-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search processed results..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="Verified / Routed">Verified / Routed</option>
                <option value="Needs Review">Needs Review</option>
                <option value="Unmapped / Review Needed">Unmapped</option>
              </select>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                onClick={handleAddAllToRecords}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#16324F] hover:bg-navy-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Database className="w-3.5 h-3.5" />
                Add All to Records
              </button>

              <button
                onClick={handleExportProcessedCSV}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold shadow-xs transition-colors"
                title="Exports UTF-8 with BOM for Excel compatibility"
              >
                <Download className="w-3.5 h-3.5" />
                Download Processed CSV
              </button>
            </div>
          </div>

          {/* Enriched CSV Preview Table */}
          <div className="bento-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4"># / ID</th>
                    <th className="py-3 px-4 min-w-[280px]">Citizen Grievance</th>
                    <th className="py-3 px-4">Detected Dialect</th>
                    <th className="py-3 px-4">Predicted Region</th>
                    <th className="py-3 px-4">Issue Category</th>
                    <th className="py-3 px-4">Confidence</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredRows.slice(0, 50).map((row, idx) => (
                    <tr key={row.__id || idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        <span className="text-slate-400">{idx + 1}</span>
                        {row.__displayId && !row.__displayId.startsWith('#') && (
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-700 font-semibold border border-slate-200">
                            {row.__displayId}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium max-w-sm truncate" title={row.__rawText}>
                        {row.__rawText}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{row.Detected_Dialect}</td>
                      <td className="py-3 px-4 text-slate-600">{row.Predicted_Region}</td>
                      <td className="py-3 px-4 font-medium text-slate-700">{row.Issue_Category}</td>
                      <td className="py-3 px-4 font-bold text-teal-700">{row.Confidence}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={row.Routing_Status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredRows.length > 50 && (
              <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500">
                Showing first 50 of {filteredRows.length} rows. Full dataset available via Download CSV.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
