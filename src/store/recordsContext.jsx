import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { classifyText } from '../engine/classify.js';
import { INITIAL_DEMO_TEXTS } from '../data/seedData.js';

const STORAGE_KEY = 'jansetu_records_v1';

const RecordsContext = createContext(null);

export function RecordsProvider({ children }) {
  const [records, setRecords] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to read from localStorage:', e);
    }
    // Return empty initially as required by prompt: "On first load with empty storage, show an empty state with a 'Load demo data' button"
    return [];
  });

  const [toasts, setToasts] = useState([]);
  const [backendOnline, setBackendOnline] = useState(false);

  // Probe backend health to seamlessly enable Gemini AI hybrid reasoning
  useEffect(() => {
    let isMounted = true;
    const checkBackend = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/health', { method: 'GET' });
        if (res.ok && isMounted) {
          setBackendOnline(true);
        } else if (isMounted) {
          setBackendOnline(false);
        }
      } catch (err) {
        if (isMounted) setBackendOnline(false);
      }
    };
    checkBackend();
    const interval = setInterval(checkBackend, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Hybrid AI prediction: Gemini API backend preferred, local dialect engine fallback
  const predictGrievance = async (text, forceLocal = false) => {
    if (!text || !text.trim()) return null;

    if (!forceLocal && backendOnline) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const res = await fetch('http://127.0.0.1:8000/api/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const isUncertain = data.predicted_region === 'Uncertain';
          return {
            dialectZone: isUncertain ? 'Unmapped' : data.predicted_region,
            dialectZoneId: isUncertain ? 'unmapped' : data.predicted_region.toLowerCase().replace(/[^a-z0-9]/g, '_'),
            region: data.predicted_region,
            office: isUncertain ? 'Unmapped / Review Needed' : `${data.predicted_region} Regional Desk`,
            issueCategory: data.predicted_category,
            confidence: data.confidence,
            confidencePercent: Math.round(data.confidence * 100),
            languageStyle: data.language,
            matchedClues: (data.regional_clues || []).map(c => ({
              term: c,
              matchedToken: c,
              type: 'evidence',
              zone: data.predicted_region,
              weight: 2.0
            })),
            runnerUp: null,
            status: data.routing_status === 'auto_routed' ? 'Verified / Routed' : 'Needs Review',
            tokensCount: text.trim().split(/\s+/).length,
            reasoning: data.regional_clues && data.regional_clues.length > 0
              ? `Evidence-based routing via ${data.regional_clues.join(', ')}`
              : (isUncertain ? 'No verified dialect/administrative cue found; queued for human review.' : 'Analyzed via Clause Sentinel Gemini AI'),
            engine: 'gemini_backend',
            backendId: data.complaint_id,
            normalizedText: text
          };
        }
      } catch (e) {
        console.warn('Backend prediction timed out or failed, falling back to local engine:', e);
      }
    }

    // High-performance local dialect & district engine
    const localRes = classifyText(text);
    return {
      ...localRes,
      engine: 'local'
    };
  };

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, [records]);

  // Toast notification helper
  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Add single record
  const addRecord = (item) => {
    const classification = item.classification || classifyText(item.text);
    const newRecord = {
      id: item.id || `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      text: item.text,
      timestamp: item.timestamp || new Date().toISOString(),
      source: item.source || 'Manual Entry',
      ...classification
    };
    setRecords(prev => [newRecord, ...prev]);
    addToast('Record saved to central database.', 'success');
    return newRecord;
  };

  // Bulk add records
  const addBulkRecords = (items) => {
    const processed = items.map((item, idx) => {
      const classification = item.classification || classifyText(item.text);
      return {
        id: item.id || `bulk_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        text: item.text,
        timestamp: item.timestamp || new Date().toISOString(),
        source: item.source || 'CSV Upload',
        ...classification
      };
    });
    setRecords(prev => [...processed, ...prev]);
    addToast(`Successfully added ${processed.length} records to database.`, 'success');
    return processed;
  };

  // Update record (manually edit)
  const updateRecord = (id, updates) => {
    setRecords(prev =>
      prev.map(r => (r.id === id ? { ...r, ...updates, status: 'Manually Verified', isEdited: true } : r))
    );
    addToast('Record updated and marked as Manually Verified.', 'info');
  };

  // Delete single record
  const deleteRecord = (id) => {
    setRecords(prev => prev.filter(r => r.id !== id));
    addToast('Record deleted.', 'warning');
  };

  // Bulk delete
  const bulkDeleteRecords = (ids) => {
    const set = new Set(ids);
    setRecords(prev => prev.filter(r => !set.has(r.id)));
    addToast(`Deleted ${ids.length} records.`, 'warning');
  };

  // Forward to office (simulated)
  const forwardRecord = (id) => {
    setRecords(prev =>
      prev.map(r => (r.id === id ? { ...r, status: 'Forwarded', forwardedAt: new Date().toISOString() } : r))
    );
    addToast('Grievance successfully dispatched to local regional desk.', 'success');
  };

  // Bulk forward by region
  const forwardAllInRegion = (regionName) => {
    let count = 0;
    setRecords(prev =>
      prev.map(r => {
        if (r.region === regionName && r.status !== 'Forwarded') {
          count++;
          return { ...r, status: 'Forwarded', forwardedAt: new Date().toISOString() };
        }
        return r;
      })
    );
    addToast(`Dispatched ${count} records from ${regionName} to local office.`, 'success');
  };

  // Seed demo data
  const seedDemoData = () => {
    const seeded = INITIAL_DEMO_TEXTS.map((item, idx) => {
      const classification = classifyText(item.text);
      return {
        id: `demo_${idx + 1}_${Date.now()}`,
        text: item.text,
        timestamp: item.timestamp,
        source: 'Demo Seed Dataset',
        ...classification
      };
    });
    setRecords(seeded);
    addToast(`Loaded ${seeded.length} realistic grassroots demo submissions.`, 'success');
  };

  // Clear all records
  const clearAllRecords = () => {
    setRecords([]);
    addToast('All stored records cleared.', 'info');
  };

  // Live computed metrics (always derived from stored records)
  const metrics = useMemo(() => {
    const total = records.length;
    let routed = 0;
    let review = 0;
    const dialectsSet = new Set();
    const regionCounts = {};
    const issueCounts = {};

    records.forEach(r => {
      if (r.status === 'Verified / Routed' || r.status === 'Forwarded' || r.status === 'Manually Verified') {
        routed++;
      } else {
        review++;
      }

      if (r.dialectZone && r.dialectZone !== 'Unmapped') {
        dialectsSet.add(r.dialectZone);
      }

      const regKey = r.region || 'Unmapped / Review Needed';
      regionCounts[regKey] = (regionCounts[regKey] || 0) + 1;

      const issueKey = r.issueCategory || 'Other';
      issueCounts[issueKey] = (issueCounts[issueKey] || 0) + 1;
    });

    const regionChartData = Object.entries(regionCounts).map(([name, count]) => ({
      name: name.length > 25 ? name.substring(0, 22) + '...' : name,
      fullName: name,
      count
    })).sort((a, b) => b.count - a.count);

    const issueChartData = Object.entries(issueCounts).map(([name, count]) => ({
      name,
      count
    })).sort((a, b) => b.count - a.count);

    return {
      total,
      routed,
      review,
      dialectsCount: dialectsSet.size,
      regionChartData,
      issueChartData,
      routingSuccessRate: total > 0 ? Math.round((routed / total) * 100) : 0
    };
  }, [records]);

  return (
    <RecordsContext.Provider
      value={{
        records,
        metrics,
        addRecord,
        addBulkRecords,
        updateRecord,
        deleteRecord,
        bulkDeleteRecords,
        forwardRecord,
        forwardAllInRegion,
        seedDemoData,
        clearAllRecords,
        toasts,
        addToast,
        removeToast,
        backendOnline,
        predictGrievance
      }}
    >
      {children}
    </RecordsContext.Provider>
  );
}

export function useRecords() {
  const ctx = useContext(RecordsContext);
  if (!ctx) {
    throw new Error('useRecords must be used within a RecordsProvider');
  }
  return ctx;
}
