import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Compass,
  ArrowRight,
  Sparkles,
  FileSpreadsheet,
  Building2,
  Database,
  BarChart3,
  PieChart as PieIcon
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useRecords } from '../store/recordsContext';
import StatusBadge from '../components/StatusBadge';

const CHART_COLORS = ['#0D9488', '#16324F', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#10B981', '#6366F1'];

export default function Dashboard() {
  const navigate = useNavigate();
  const { records, metrics, seedDemoData } = useRecords();

  return (
    <div className="space-y-6">
      {/* Hero Title & Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
            Dialect-Aware Civic Intake
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#16324F] mt-2">
            Routing Unstructured Grassroots Voices to Local Experts
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Empowering central civic platforms and NGOs to map lost geographic tags from raw, multilingual, and misspelled citizen submissions.
          </p>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => navigate('/single')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Analyze Submission
          </button>
          <button
            onClick={() => navigate('/bulk')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
            Process Bulk CSV
          </button>
        </div>
      </div>

      {/* Empty State Banner if 0 records */}
      {records.length === 0 && (
        <div className="bento-card p-8 text-center bg-gradient-to-b from-white to-slate-50/50 flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3.5 shadow-xs">
            <Compass className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-navy-800">No Submissions in Database Yet</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mt-1">
            Explore how JanSetu AI identifies regional dialects and civic grievance issues by loading 30 realistic grassroots samples.
          </p>
          <button
            onClick={seedDemoData}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Load Demo Data (30 Submissions)
          </button>
        </div>
      )}

      {/* 4 Live Metric Cards (computed from stored records) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total */}
        <div className="bento-card p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Submissions</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#16324F]">{metrics.total}</span>
            <span className="text-xs text-slate-500 ml-2">records recorded</span>
          </div>
          <div className="mt-2 text-[11px] text-teal-700 font-medium">
            100% Client-side privacy
          </div>
        </div>

        {/* Metric 2: Routed */}
        <div className="bento-card p-5 border-emerald-100 bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Successfully Routed</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-800">{metrics.routed}</span>
            <span className="text-xs text-emerald-700/80 ml-2">
              ({metrics.routingSuccessRate}% auto-routed)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-700 font-medium">
            High-confidence local desk match
          </div>
        </div>

        {/* Metric 3: Human Review */}
        <div className="bento-card p-5 border-amber-100 bg-amber-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Needs Human Review</span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-800">{metrics.review}</span>
            <span className="text-xs text-amber-700/80 ml-2">flagged or unmapped</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-700 font-medium">
            Low confidence or ambiguous cues
          </div>
        </div>

        {/* Metric 4: Distinct Dialects */}
        <div className="bento-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Regional Dialects</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#16324F]">{metrics.dialectsCount}</span>
            <span className="text-xs text-slate-500 ml-2">distinct zones</span>
          </div>
          <div className="mt-2 text-[11px] text-teal-700 font-medium">
            Covering 10+ Indic zones
          </div>
        </div>
      </div>

      {/* Bento Grid: Charts & Visualizations (Recharts only) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Regional Dialects Bar Chart (lg:col-span-7) */}
        <div className="lg:col-span-7 bento-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#16324F] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-teal-600" />
                Regional Dialect Distribution
              </h3>
              <p className="text-[11px] text-slate-500">Predicted origin zones from grassroots content</p>
            </div>
            <span className="text-xs text-slate-400 font-medium">{metrics.regionChartData.length} Regions</span>
          </div>

          <div className="h-64 w-full">
            {metrics.regionChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.regionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#16324F',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      border: 'none'
                    }}
                    formatter={(val, name, item) => [`${val} grievances`, item.payload.fullName]}
                  />
                  <Bar dataKey="count" fill="#0D9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Load demo data or analyze submissions to render regional chart.
              </div>
            )}
          </div>
        </div>

        {/* Issue Category Donut Chart (lg:col-span-5) */}
        <div className="lg:col-span-5 bento-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#16324F] flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-teal-600" />
                Civic Issue Categories
              </h3>
              <p className="text-[11px] text-slate-500">Extracted civic grievance domains</p>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {metrics.issueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.issueChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {metrics.issueChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#16324F',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      border: 'none'
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px', color: '#64748B' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No issue data available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Submissions Table */}
      <div className="bento-card overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#16324F] flex items-center gap-2">
              <Database className="w-4 h-4 text-teal-600" />
              Recent Submissions &amp; Administrative Targets
            </h3>
            <p className="text-xs text-slate-500">Live preview of stored citizen grievances and routing targets</p>
          </div>
          <button
            onClick={() => navigate('/records')}
            className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1 transition-colors"
          >
            View all records
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Raw Citizen Feedback</th>
                <th className="py-3 px-4">Detected Dialect</th>
                <th className="py-3 px-4">Target Local Office</th>
                <th className="py-3 px-4">Issue Domain</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {records.length > 0 ? (
                records.slice(0, 8).map(record => (
                  <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 max-w-xs font-medium text-slate-800 truncate" title={record.text}>
                      {record.text}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {record.dialectZone}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 flex items-center gap-1.5 mt-2">
                      <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span className="truncate max-w-[200px]">{record.office}</span>
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    No submissions currently stored. Use "Load Demo Data" above to view records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
