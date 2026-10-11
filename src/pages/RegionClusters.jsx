import React, { useState, useMemo } from 'react';
import {
  Network,
  Building2,
  Send,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Tag,
  CheckCircle2,
  Users,
  Compass,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { useRecords } from '../store/recordsContext';
import StatusBadge from '../components/StatusBadge';

export default function RegionClusters() {
  const { records, forwardRecord, forwardAllInRegion } = useRecords();
  const [expandedRegion, setExpandedRegion] = useState(null);

  // Group records by region/office
  const { clusters, reviewCluster } = useMemo(() => {
    const reviewItems = [];
    const map = {};

    records.forEach(r => {
      if (r.status === 'Needs Review' || r.status === 'Unmapped / Review Needed' || r.dialectZone === 'Unmapped') {
        reviewItems.push(r);
      } else {
        const key = r.region || 'Unmapped Regional Desk';
        if (!map[key]) {
          map[key] = {
            region: key,
            office: r.office || key,
            dialect: r.dialectZone,
            items: []
          };
        }
        map[key].items.push(r);
      }
    });

    const clusterList = Object.values(map).map(c => {
      // Calculate top issue
      const issueCounts = {};
      let totalConf = 0;
      c.items.forEach(item => {
        const iss = item.issueCategory || 'Other';
        issueCounts[iss] = (issueCounts[iss] || 0) + 1;
        totalConf += (item.confidence || 0);
      });

      const topIssue = Object.entries(issueCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'General';
      const avgConfidence = c.items.length > 0 ? Math.round((totalConf / c.items.length) * 100) : 0;

      return {
        ...c,
        count: c.items.length,
        topIssue,
        avgConfidence
      };
    }).sort((a, b) => b.count - a.count);

    return {
      clusters: clusterList,
      reviewCluster: reviewItems
    };
  }, [records]);

  const toggleExpand = (regionName) => {
    setExpandedRegion(prev => (prev === regionName ? null : regionName));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#16324F] flex items-center gap-2.5">
          <Network className="w-6 h-6 text-teal-500" />
          Regional Origin Clusters &amp; Administrative Desks
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Grievances dynamically grouped by predicted geographic community origin solely from linguistic cues, ready for batch forwarding to local field offices.
        </p>
      </div>

      {/* Top Banner: Dedicated Human Review Cluster */}
      {reviewCluster.length > 0 && (
        <div className="bento-card p-5 border-amber-200 bg-amber-50/40 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800">
                <ShieldAlert className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-amber-900 flex items-center gap-2">
                  Human Verification Queue ({reviewCluster.length} Submissions)
                </h3>
                <p className="text-xs text-amber-700">
                  Submissions with ambiguous dialect cues or confidence &lt; 65% requiring manual desk routing.
                </p>
              </div>
            </div>

            <button
              onClick={() => toggleExpand('__REVIEW__')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <span>{expandedRegion === '__REVIEW__' ? 'Hide Review Items' : 'Inspect Queue'}</span>
              {expandedRegion === '__REVIEW__' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {expandedRegion === '__REVIEW__' && (
            <div className="pt-3 border-t border-amber-200/80 space-y-2">
              {reviewCluster.map(item => (
                <div
                  key={item.id}
                  className="p-3 bg-white rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-medium text-slate-800 font-sans">{item.text}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>Detected: {item.dialectZone || 'Unmapped'}</span>
                      <span>&bull;</span>
                      <span>Confidence: {item.confidencePercent || 0}%</span>
                      <span>&bull;</span>
                      <span className="text-amber-700 font-medium">{item.reasoning}</span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <StatusBadge status={item.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Regional Clusters Bento Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Active Regional Clusters ({clusters.length})
          </span>
          <span className="text-xs text-slate-400">
            Click cluster card to expand full message list &amp; batch forward
          </span>
        </div>

        {clusters.length === 0 ? (
          <div className="bento-card p-10 text-center">
            <Compass className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No regional clusters formed yet. Load demo data or analyze submissions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {clusters.map(cluster => {
              const isExpanded = expandedRegion === cluster.region;

              return (
                <div
                  key={cluster.region}
                  className={`bento-card transition-all flex flex-col justify-between ${
                    isExpanded ? 'ring-2 ring-teal-500 shadow-md md:col-span-2 lg:col-span-3' : 'hover:border-teal-300'
                  }`}
                >
                  <div className="p-5 space-y-3.5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {cluster.dialect}
                        </span>
                        <h3 className="text-base font-bold text-navy-800 mt-1.5 flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
                          {cluster.office}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">{cluster.region}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-xl font-extrabold text-navy-800 block">
                          {cluster.count}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">grievances</span>
                      </div>
                    </div>

                    {/* Stats pill */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Top Issue</span>
                        <span className="font-semibold text-slate-800">{cluster.topIssue}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Avg. Confidence</span>
                        <span className="font-bold text-teal-700">{cluster.avgConfidence}%</span>
                      </div>
                    </div>

                    {/* Sample previews if not expanded */}
                    {!isExpanded && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                          Sample Messages:
                        </span>
                        {cluster.items.slice(0, 2).map((item, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-lg bg-slate-50/70 border border-slate-100 text-[11px] text-slate-700 truncate"
                            title={item.text}
                          >
                            &ldquo;{item.text}&rdquo;
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Expanded View: Full Messages List */}
                    {isExpanded && (
                      <div className="pt-4 border-t border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                            All Submissions Routed to {cluster.office}
                          </h4>
                          <button
                            onClick={() => forwardAllInRegion(cluster.region)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold shadow-xs transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Batch Dispatch All to Office
                          </button>
                        </div>

                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                          {cluster.items.map(item => (
                            <div
                              key={item.id}
                              className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                            >
                              <div className="space-y-1">
                                <p className="font-medium text-slate-800 font-sans">{item.text}</p>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                  <span className="font-semibold text-slate-700">{item.issueCategory}</span>
                                  <span>&bull;</span>
                                  <span className="text-teal-700 font-bold">{item.confidencePercent}% confidence</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <StatusBadge status={item.status} />
                                {item.status !== 'Forwarded' && (
                                  <button
                                    onClick={() => forwardRecord(item.id)}
                                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 hover:text-blue-600 text-slate-500 transition-colors"
                                    title="Dispatch to Office"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer toggle */}
                  <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => toggleExpand(cluster.region)}
                      className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span>{isExpanded ? 'Collapse Cluster' : `Expand (${cluster.count} messages)`}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => forwardAllInRegion(cluster.region)}
                      className="text-xs text-slate-500 hover:text-teal-700 font-medium flex items-center gap-1"
                    >
                      <Send className="w-3 h-3 text-teal-600" />
                      <span>Dispatch</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
