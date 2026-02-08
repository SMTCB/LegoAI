import React, { useState } from 'react';
import { Camera, Layers, Grid, ArrowLeft, Loader2 } from 'lucide-react';
import CameraCapture from './components/CameraCapture';
import BuildCard from './components/BuildCard';
import PartsCatalog from './components/PartsCatalog';
import { AppProvider, useApp } from './context/AppContext';

function Main() {
  const {
    scanStatus, builds, parts,
    addToBatch, analyzeBatch, commitBatch, clearCurrentBatch, currentBatchImages, currentBatchResults,
    findBuilds, clearSession, undoLastScan, removePart, error, resetScan
  } = useApp();

  const [activeTab, setActiveTab] = useState('scan');

  const handleCapture = (imageData) => {
    addToBatch(imageData);
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
            <ArrowLeft size={20} className="mr-1" /> Scan More Piles
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

  // 3. Batch Review View (New!)
  if (scanStatus === 'review') {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col text-white">
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
          <h2 className="text-2xl font-bold text-center">Batch Analysis Complete</h2>
          <div className="bg-gray-800 rounded-xl p-4 w-full max-w-sm border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-400">Found in this pile:</span>
              <span className="text-xl font-bold text-green-400">{currentBatchResults.length} parts</span>
            </div>
            {/* Tiny preview list */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {currentBatchResults.slice(0, 5).map((p, i) => (
                <div key={i} className="flex items-center gap-3 text-sm border-b border-gray-700 pb-2 last:border-0">
                  {p.part_img_url ? (
                    <img src={p.part_img_url} className="w-8 h-8 object-contain bg-white rounded" />
                  ) : <div className="w-8 h-8 bg-gray-600 rounded" />}
                  <span>{p.quantity}x {p.name}</span>
                </div>
              ))}
              {currentBatchResults.length > 5 && (
                <div className="text-center text-xs text-gray-500 italic">...and {currentBatchResults.length - 5} more</div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={commitBatch}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2"
            >
              Add to Collection
            </button>
            <button
              onClick={clearCurrentBatch}
              className="w-full bg-red-900/50 hover:bg-red-900 text-red-200 font-medium py-3 rounded-xl border border-red-800 flex items-center justify-center gap-2"
            >
              Retry Pile
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Main Scanning View
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col relative overflow-hidden">

      {/* Loading States */}
      {scanStatus === 'scanning' && (
        <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center text-white">
          <Loader2 size={64} className="animate-spin text-blue-500 mb-6" />
          <h2 className="text-2xl font-bold mb-2">Analyzing {currentBatchImages.length} Photos...</h2>
        </div>
      )}

      {scanStatus === 'matching' && (
        <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center text-white">
          <Loader2 size={64} className="animate-spin text-purple-500 mb-6" />
          <h2 className="text-2xl font-bold mb-2">Finding Builds...</h2>
          <p className="text-gray-400">Checking {parts.length} total parts...</p>
        </div>
      )}

      {/* Main Camera UI */}
      <div className="flex-1 relative">
        <CameraCapture onCapture={handleCapture} />

        {/* Batch Thumbnails (Top Left) */}
        {currentBatchImages.length > 0 && (
          <div className="absolute top-4 left-4 z-20 flex gap-2">
            {currentBatchImages.map((img, idx) => (
              <div key={idx} className="w-12 h-16 border-2 border-white rounded-lg overflow-hidden bg-black shadow-lg relative">
                <img src={img} className="w-full h-full object-cover opacity-80" />
                <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                  {idx + 1}
                </div>
              </div>
            ))}
          </div>
        )}

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

        {checkError(error)}

        {/* Bottom Actions */}
        <div className="absolute bottom-10 left-0 right-0 z-30 flex flex-col items-center gap-4 px-6 pointer-events-none">

          {/* Analyze Batch Button (Visible if photos taken) */}
          {currentBatchImages.length > 0 && (
            <button
              onClick={analyzeBatch}
              className="pointer-events-auto w-full max-w-sm bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-xl shadow-xl flex items-center justify-center gap-2 font-bold text-lg animate-in slide-in-from-bottom-5"
            >
              <Loader2 size={24} className="animate-spin hidden" /> {/* Placeholder for logic */}
              Analyze Batch ({currentBatchImages.length})
            </button>
          )}

          {/* Find Builds Button (Collection Exists) */}
          {parts.length > 0 && currentBatchImages.length === 0 && (
            <button
              onClick={findBuilds}
              className="pointer-events-auto bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-full shadow-lg flex items-center gap-2 font-bold transition-transform hover:scale-105"
            >
              <Grid size={20} />
              Find Builds (Total: {parts.length})
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

function checkError(err) {
  if (!err) return null;
  return (
    <div className="absolute bottom-32 left-4 right-4 z-30">
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
