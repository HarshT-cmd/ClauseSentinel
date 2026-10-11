import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ToastContainer from './components/ToastContainer';

import Dashboard from './pages/Dashboard';
import SingleAnalysis from './pages/SingleAnalysis';
import BulkProcessing from './pages/BulkProcessing';
import RecordManagement from './pages/RecordManagement';
import RegionClusters from './pages/RegionClusters';
import Evaluation from './pages/Evaluation';
import Methodology from './pages/Methodology';

export default function App() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-[#1E293B]">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Header onOpenMobileNav={() => setMobileNavOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/single" element={<SingleAnalysis />} />
            <Route path="/bulk" element={<BulkProcessing />} />
            <Route path="/records" element={<RecordManagement />} />
            <Route path="/clusters" element={<RegionClusters />} />
            <Route path="/evaluation" element={<Evaluation />} />
            <Route path="/methodology" element={<Methodology />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Global Toast System */}
      <ToastContainer />
    </div>
  );
}
