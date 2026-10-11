import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import {
  Database,
  Search,
  Filter,
  Trash2,
  Edit3,
  Download,
  Send,
  X,
  CheckCircle2,
  ArrowUpDown,
  Building2,
  CheckSquare,
  Square,
  AlertTriangle
} from 'lucide-react';
import { useRecords } from '../store/recordsContext';
import StatusBadge from '../components/StatusBadge';
import dialectsData from '../engine/dialectsData';

export default function RecordManagement() {
  const {
    records,
    updateRecord,
    deleteRecord,
    bulkDeleteRecords,
    forwardRecord,
    clearAllRecords,
    addToast
  } = useRecords();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [selectedDialect, setSelectedDialect] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('date_desc'); // date_desc, date_asc, conf_desc, conf_asc
  const [selectedIds, setSelectedIds] = useState([]);

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState(null);
  const [editCategory, setEditCategory] = useState('');
  const [editRegion, setEditRegion] = useState('');
  const [editOffice, setEditOffice] = useState('');
  const [editStatus, setEditStatus] = useState('');

  // Extract unique filter options
  const regionsList = useMemo(() => {
    const set = new Set();
    records.forEach(r => { if (r.region) set.add(r.region); });
    return Array.from(set).sort();
  }, [records]);

  const dialectsList = useMemo(() => {
    const set = new Set();
    records.forEach(r => { if (r.dialectZone) set.add(r.dialectZone); });
    return Array.from(set).sort();
  }, [records]);

  // Filter & Sort Records
  const filteredRecords = useMemo(() => {
    let result = records.filter(r => {
      const matchSearch =
        !searchTerm ||
        (r.text && r.text.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.office && r.office.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.dialectZone && r.dialectZone.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchRegion = selectedRegion === 'ALL' || r.region === selectedRegion;
      const matchDialect = selectedDialect === 'ALL' || r.dialectZone === selectedDialect;
      const matchStatus = selectedStatus === 'ALL' || r.status === selectedStatus;

      return matchSearch && matchRegion && matchDialect && matchStatus;
    });

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
      if (sortBy === 'date_asc') return new Date(a.timestamp || 0) - new Date(b.timestamp || 0);
      if (sortBy === 'conf_desc') return (b.confidence || 0) - (a.confidence || 0);
      if (sortBy === 'conf_asc') return (a.confidence || 0) - (b.confidence || 0);
      return 0;
    });

    return result;
  }, [records, searchTerm, selectedRegion, selectedDialect, selectedStatus, sortBy]);

  // Handle Multi-select
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredRecords.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected record(s)?`)) {
      bulkDeleteRecords(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleDeleteSingle = (id) => {
    if (window.confirm('Delete this record from central repository?')) {
      deleteRecord(id);
      setSelectedIds(prev => prev.filter(x => x !== id));
    }
  };

  // Open Edit Modal
  const openEditModal = (record) => {
    setEditingRecord(record);
    setEditCategory(record.issueCategory || 'Other');
    setEditRegion(record.region || 'Unmapped / Review Needed');
    setEditOffice(record.office || 'Unmapped / Review Needed');
    setEditStatus(record.status || 'Needs Review');
  };

  const handleSaveEdit = () => {
    if (!editingRecord) return;
    updateRecord(editingRecord.id, {
      issueCategory: editCategory,
      region: editRegion,
      office: editOffice,
      status: 'Manually Verified'
    });
    setEditingRecord(null);
  };

  // Export Filtered Records as CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;
    const cleanRows = filteredRecords.map(r => ({
      ID: r.id,
      Grievance_Text: r.text,
      Detected_Dialect: r.dialectZone,
      Language_Style: r.languageStyle,
      Predicted_Region: r.region,
      Routing_Office: r.office,
      Issue_Category: r.issueCategory,
      Confidence: `${r.confidencePercent}%`,
      Status: r.status,
      Timestamp: r.timestamp
    }));

    const csvData = Papa.unparse(cleanRows);
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `jansetu_records_export_${Date.now()}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Records exported to CSV.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#16324F] flex items-center gap-2.5">
            <Database className="w-6 h-6 text-teal-500" />
            Central Record Repository
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Search, filter, manually verify, and dispatch grassroots submissions stored in local database.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {records.length > 0 && (
            <>
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
              >
                <Download className="w-4 h-4 text-teal-600" />
                Export CSV
              </button>

              <button
                onClick={() => {
                  if (window.confirm('Clear all stored records from database?')) {
                    clearAllRecords();
                    setSelectedIds([]);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold shadow-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bento-card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by text, office, dialect..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Region filter */}
          <div>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">All Regions</option>
              {regionsList.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Dialect filter */}
          <div>
            <select
              value={selectedDialect}
              onChange={(e) => setSelectedDialect(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">All Dialects</option>
              {dialectsList.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="Verified / Routed">Verified / Routed</option>
              <option value="Needs Review">Needs Review</option>
              <option value="Manually Verified">Manually Verified</option>
              <option value="Forwarded">Forwarded</option>
              <option value="Unmapped / Review Needed">Unmapped</option>
            </select>
          </div>
        </div>

        {/* Sub-bar: Bulk selection bar & Sorting */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-500 font-medium">
              Showing {filteredRecords.length} of {records.length} records
            </span>
            {selectedIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-semibold hover:bg-rose-100 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Selected ({selectedIds.length})
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="conf_desc">Confidence (High &rarr; Low)</option>
              <option value="conf_asc">Confidence (Low &rarr; High)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Records Table */}
      <div className="bento-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredRecords.length > 0 && selectedIds.length === filteredRecords.length}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                </th>
                <th className="py-3 px-4 min-w-[260px]">Citizen Feedback</th>
                <th className="py-3 px-4">Dialect Zone</th>
                <th className="py-3 px-4">Target Office</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Conf.</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRecords.length > 0 ? (
                filteredRecords.map(record => {
                  const isChecked = selectedIds.includes(record.id);
                  return (
                    <tr key={record.id} className={`hover:bg-slate-50/70 transition-colors ${isChecked ? 'bg-teal-50/20' : ''}`}>
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(record.id)}
                          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800 max-w-sm truncate" title={record.text}>
                        {record.text}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {record.dialectZone}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="truncate block max-w-[180px]" title={record.office}>
                          {record.office}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {record.issueCategory}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-teal-700">
                        {record.confidencePercent}%
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={record.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {record.status !== 'Forwarded' && (
                            <button
                              onClick={() => forwardRecord(record.id)}
                              title="Forward to Local Office"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(record)}
                            title="Edit Record"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSingle(record.id)}
                            title="Delete Record"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Record Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-navy-800 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-teal-600" />
                Edit &amp; Manually Verify Record
              </h3>
              <button
                onClick={() => setEditingRecord(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Original Text</label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 font-medium">
                  {editingRecord.text}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Issue Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Water">Water</option>
                  <option value="Roads & Infrastructure">Roads & Infrastructure</option>
                  <option value="Power / Electricity">Power / Electricity</option>
                  <option value="Sanitation & Waste">Sanitation & Waste</option>
                  <option value="Governance / Survey">Governance / Survey</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Assigned Region / Zone</label>
                <input
                  type="text"
                  value={editRegion}
                  onChange={(e) => setEditRegion(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Office</label>
                <input
                  type="text"
                  value={editOffice}
                  onChange={(e) => setEditOffice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                Save &amp; Mark Verified
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
