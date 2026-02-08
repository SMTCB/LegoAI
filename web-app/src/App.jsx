import React, { useState } from 'react';
import { Camera, Layers, Grid, ArrowLeft, Loader2 } from 'lucide-react';
import CameraCapture from './components/CameraCapture';
import BuildCard from './components/BuildCard';
import PartsCatalog from './components/PartsCatalog';
import { AppProvider, useApp } from './context/AppContext';

function Main() {
  const { scanStatus, builds, parts, processImage, findBuilds, clearSession, undoLastScan, removePart, error, resetScan } = useApp();
  const [activeTab, setActiveTab] = useState('scan');

  const handleCapture = (imageData) => {
    processImage(imageData);
  };

  // 1. Catalog View
  if (activeTab === 'catalog') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center shadow-sm sticky top-0 z-10">
          <button onClick={() => setActiveTab('scan')} className="p-2 mr-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            My Parts Collection
          </h1>
        </header>
        <main className="flex-1 overflow-y-auto">
          <PartsCatalog parts={parts} onRemove={removePart} />
        </main>
      </div>
    );
  }

  // 2. Builds View (Matching Success)
  if (scanStatus === 'matching_success') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-10">
          <button onClick={resetScan} className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20} className="mr-1" /> Back to Scan
          </button>
          <span className="font-bold text-green-600 text-sm">Builds Found!</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {builds.map(build => (
              <div key={build.set_id} className="h-full">
                <BuildCard build={build} />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // 3. Main Scanning / Session View
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col relative overflow-hidden">

      {/* Loading States */}
      {scanStatus === 'scanning' && (
        <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center text-white">
          <Loader2 size={64} className="animate-spin text-blue-500 mb-6" />
          <h2 className="text-2xl font-bold mb-2">Identifying Parts...</h2>
        </div>
      )}

      {scanStatus === 'matching' && (
        <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center text-white">
          <Loader2 size={64} className="animate-spin text-purple-500 mb-6" />
          <h2 className="text-2xl font-bold mb-2">Finding Builds...</h2>
          <p className="text-gray-400">Checking {parts.length} parts against Rebrickable...</p>
        </div>
      )}

      {/* Main Camera UI */}
      <div className="flex-1 relative">
        <CameraCapture onCapture={handleCapture} />

        {/* Top Controls */}
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={() => setActiveTab('catalog')}
            className="bg-black/50 backdrop-blur-md text-white p-3 rounded-full hover:bg-black/70 transition-colors border border-white/20 relative"
          >
            <Layers size={24} />
            {parts.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
                {parts.length}
              </span>
            )}
          </button>
        </div>

        {/* Tips Overlay */}
        <div className="absolute top-4 left-4 z-20 hidden sm:block">
          <div className="bg-black/40 backdrop-blur-sm text-white/80 px-3 py-2 rounded-lg text-xs max-w-[200px] border border-white/10">
            <p className="font-bold mb-1">💡 Session Mode:</p>
            <ul className="list-disc pl-3 space-y-1">
              <li>Take multiple photos.</li>
              <li>Angle at 45° for depth.</li>
              <li>Click "Find Builds" when done.</li>
            </ul>
          </div>
        </div>

        {checkError(error)}

        {/* Session Action Bar (Bottom) */}
        {scanStatus === 'success' || scanStatus === 'idle' || scanStatus === 'error' ? (
          <div className="absolute bottom-8 left-0 right-0 z-30 flex flex-col items-center gap-3 px-4 pointer-events-none">
            {/* Action Buttons */}
            <div className="flex items-center gap-3 pointer-events-auto">

              {/* Undo Button (Only if we have parts) */}
              {parts.length > 0 && (
                <button
                  onClick={undoLastScan}
                  className="bg-gray-800/80 backdrop-blur text-white px-4 py-3 rounded-full shadow-lg font-medium text-sm flex items-center gap-2 border border-white/10 hover:bg-gray-700 transition"
                >
                  <ArrowLeft size={16} /> Undo Add
                </button>
              )}

              {/* Find Builds Button */}
              {parts.length > 0 && (
                <button
                  onClick={findBuilds}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 font-bold text-lg animate-in slide-in-from-bottom-5 fade-in duration-300 hover:scale-105 transition-transform"
                >
                  <Grid size={24} />
                  Find Builds ({parts.length})
                </button>
              )}
            </div>
          </div>
        ) : null}

      </div>
    </div>
  );
}

function checkError(err) {
  if (!err) return null;
  return (
    <div className="absolute bottom-24 left-4 right-4 z-30">
      <div className="bg-red-500 text-white p-3 rounded-lg shadow-lg text-center font-medium opacity-90">
        {err}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Main />
    </AppProvider>
  );
}
