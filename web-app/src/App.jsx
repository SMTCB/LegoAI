import React, { useState } from 'react';
import { Camera, Layers, Grid, ArrowLeft, Loader2 } from 'lucide-react';
import CameraCapture from './components/CameraCapture';
import BuildCard from './components/BuildCard';
import PartsCatalog from './components/PartsCatalog';
import { AppProvider, useApp } from './context/AppContext';

function Main() {
  const { scanStatus, builds, parts, processImage, resetScan, removePart, error } = useApp();
  const [activeTab, setActiveTab] = useState('scan'); // 'scan', 'catalog'

  const handleCapture = (imageData) => {
    processImage(imageData);
  };

  if (activeTab === 'catalog') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
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

  // Scan Logic View
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col relative overflow-hidden">
      {scanStatus === 'idle' || scanStatus === 'error' ? (
        <>
          <div className="flex-1 relative">
            <CameraCapture onCapture={handleCapture} />

            {/* Overlay UI */}
            <div className="absolute top-4 right-4 z-20">
              <button
                onClick={() => setActiveTab('catalog')}
                className="bg-black/50 backdrop-blur-md text-white p-3 rounded-full hover:bg-black/70 transition-colors border border-white/20"
              >
                <Layers size={24} />
              </button>
            </div>

            <div className="absolute top-4 left-4 z-20">
              <div className="bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold border border-white/20">
                Master Builder AI
              </div>
            </div>

            {checkError(error)}

          </div>
        </>
      ) : scanStatus === 'scanning' || scanStatus === 'matching' ? (
        <div className="flex-1 flex flex-col items-center justify-center text-white bg-gray-900 p-8">
          <Loader2 size={64} className="animate-spin text-blue-500 mb-6" />
          <h2 className="text-2xl font-bold mb-2">Analyzing Bricks...</h2>
          <p className="text-gray-400 text-center max-w-xs">
            Identifying parts and searching Rebrickable for matches.
          </p>
        </div>
      ) : scanStatus === 'success' ? (
        <div className="flex-1 bg-gray-50 flex flex-col h-full overflow-hidden">
          <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-10">
            <button onClick={resetScan} className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft size={20} className="mr-1" /> Scan Again
            </button>
            <span className="font-bold text-green-600 text-sm">Analysis Complete</span>
          </header>

          <main className="flex-1 overflow-y-auto p-4 space-y-6">
            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                <Grid size={18} className="mr-2 text-blue-600" /> Suggested Builds
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {builds.map(build => (
                  <div key={build.set_id} className="h-full">
                    <BuildCard build={build} />
                  </div>
                ))}
              </div>
            </section>

            <section className="pt-4 border-t border-gray-200">
              <h2 className="text-lg font-bold text-gray-800 mb-3">Scanned Parts</h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-sm">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="p-3">Part</th>
                      <th className="p-3 text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parts.slice(-5).map(p => ( // Show last 5
                      <tr key={p.id} className="border-t border-gray-100">
                        <td className="p-3 flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                            {p.img_url ? <img src={p.img_url} alt="" className="max-h-full" /> : <div className="w-2 h-2 bg-gray-400 rounded-full" />}
                          </div>
                          <span className="truncate max-w-[150px]">{p.name}</span>
                        </td>
                        <td className="p-3 text-right font-mono">{p.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  onClick={() => setActiveTab('catalog')}
                  className="w-full p-3 text-center text-blue-600 hover:bg-blue-50 font-medium transition-colors"
                >
                  View All Scanned Parts
                </button>
              </div>
            </section>
          </main>
        </div>
      ) : null}
    </div>
  );
}

function checkError(err) {
  if (!err) return null;
  return (
    <div className="absolute bottom-20 left-4 right-4 z-30">
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
