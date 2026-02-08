import React, { useState, useEffect } from 'react';
import { Layers, Grid, ArrowLeft, Loader2, HelpCircle } from 'lucide-react';
import CameraCapture from '../components/CameraCapture';
import BuildCard from '../components/BuildCard';
import PartsCatalog from '../components/PartsCatalog';
import TutorialOverlay from '../components/TutorialOverlay';
import { useApp } from '../context/AppContext';

export default function BuilderView() {
    const {
        scanStatus, builds, parts,
        addToBatch, removeImageFromBatch, analyzeBatch, commitBatch, clearCurrentBatch, currentBatchImages, currentBatchResults,
        findBuilds, clearSession, undoLastScan, removePart, error, resetScan
    } = useApp();

    const [localTab, setLocalTab] = useState('scan'); // 'scan' or 'parts_list'
    const [showTutorial, setShowTutorial] = useState(false);

    useEffect(() => {
        const hasSeen = localStorage.getItem('hasSeenTutorial');
        if (!hasSeen) {
            setShowTutorial(true);
        }
    }, []);

    const closeTutorial = () => {
        setShowTutorial(false);
        localStorage.setItem('hasSeenTutorial', 'true');
    };

    const handleCapture = (imageData) => {
        addToBatch(imageData);
    };

    // 1. Internal Parts Catalog View (Accumulated Parts)
    if (localTab === 'parts_list') {
        return (
            <div className="flex flex-col h-full bg-gray-50 pb-20 font-nunito">
                <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center shadow-sm sticky top-0 z-10">
                    <button onClick={() => setLocalTab('scan')} className="p-2 mr-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-black text-gray-800">Current Session Parts</h1>
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
            <div className="flex flex-col h-full bg-gray-50 pb-20 font-nunito">
                <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-10">
                    <button onClick={resetScan} className="flex items-center text-gray-600 hover:text-gray-900 font-bold">
                        <ArrowLeft size={20} className="mr-1" /> Scan More
                    </button>
                    <span className="font-bold text-green-600 text-sm">Builds Found!</span>
                </header>
                <main className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

    // 3. Batch Review View
    if (scanStatus === 'review') {
        return (
            <div className="flex flex-col h-full bg-gray-900 text-white pb-20 font-nunito">
                <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
                    <h2 className="text-2xl font-black text-center">Batch Analysis Complete</h2>
                    <div className="bg-gray-800 rounded-xl p-4 w-full max-w-sm border border-gray-700 shadow-lego-card">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-400 font-bold">Found in this pile:</span>
                            <span className="text-xl font-black text-lego-yellow">{currentBatchResults.length} parts</span>
                        </div>

                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {currentBatchResults.slice(0, 5).map((p, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm border-b border-gray-700 pb-2 last:border-0">
                                    {p.part_img_url ? (
                                        <img src={p.part_img_url} className="w-8 h-8 object-contain bg-white rounded" />
                                    ) : <div className="w-8 h-8 bg-gray-600 rounded" />}
                                    <span className="font-bold">{p.quantity}x {p.name}</span>
                                </div>
                            ))}
                            {currentBatchResults.length > 5 && (
                                <div className="text-center text-xs text-gray-500 italic font-bold">...and {currentBatchResults.length - 5} more</div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 w-full max-w-xs">
                        <button onClick={commitBatch} className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-xl shadow-lg transform active:scale-95 transition-transform">
                            Add to Collection
                        </button>
                        <button onClick={clearCurrentBatch} className="w-full bg-red-900/50 hover:bg-red-900 text-red-200 font-bold py-3 rounded-xl border border-red-800">
                            Retry Pile
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 4. Main Scanning View
    return (
        <div className="flex flex-col h-full bg-gray-900 relative overflow-hidden pb-16 font-nunito">

            {/* Loading States */}
            {scanStatus === 'scanning' && (
                <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center text-white">
                    <Loader2 size={64} className="animate-spin text-lego-blue mb-6" />
                    <h2 className="text-2xl font-black mb-2">Analyzing Photos...</h2>
                </div>
            )}

            {scanStatus === 'matching' && (
                <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center text-white">
                    <Loader2 size={64} className="animate-spin text-lego-yellow mb-6" />
                    <h2 className="text-2xl font-black mb-2">Finding Builds...</h2>
                </div>
            )}

            {/* Main Camera UI */}
            <div className="flex-1 relative">
                {showTutorial && <TutorialOverlay onClose={closeTutorial} />}

                <CameraCapture onCapture={handleCapture} />

                {/* Batch Thumbnails */}
                {currentBatchImages.length > 0 && (
                    <div className="absolute top-4 left-4 z-20 flex gap-2">
                        {currentBatchImages.map((img, idx) => (
                            <div key={idx} className="w-12 h-16 border-2 border-white rounded-lg overflow-hidden bg-black shadow-lg relative group transition-transform hover:scale-105">
                                <img src={img} className="w-full h-full object-cover opacity-80" />
                                <div className="absolute -top-1 -right-1 bg-lego-blue text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold border border-white">
                                    {idx + 1}
                                </div>
                                <button
                                    onClick={() => removeImageFromBatch(idx)}
                                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                                >
                                    <span className="text-xs font-bold">X</span>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Parts Bag Icon */}
                <div className="absolute top-4 right-4 z-20 flex gap-2">
                    <button
                        onClick={() => setShowTutorial(true)}
                        className="bg-black/50 backdrop-blur-md text-white p-3 rounded-full hover:bg-black/70 transition-colors border border-white/20"
                    >
                        <HelpCircle size={24} />
                    </button>

                    <button
                        onClick={() => setLocalTab('parts_list')}
                        className="bg-black/50 backdrop-blur-md text-white p-3 rounded-full hover:bg-black/70 transition-colors border border-white/20 relative"
                    >
                        <Layers size={24} />
                        {parts.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-lego-red text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold border border-white">
                                {parts.length}
                            </span>
                        )}
                    </button>
                </div>

                {checkError(error)}

                {/* Bottom Actions */}
                <div className="absolute bottom-10 left-0 right-0 z-30 flex flex-col items-center gap-4 px-6 pointer-events-none">

                    {/* Analyze Batch Button */}
                    {currentBatchImages.length > 0 && (
                        <button
                            onClick={analyzeBatch}
                            className="pointer-events-auto w-full max-w-sm bg-lego-blue hover:bg-blue-600 text-white px-6 py-4 rounded-xl shadow-lego-card border-2 border-blue-800 flex items-center justify-center gap-2 font-black text-lg animate-in slide-in-from-bottom-5 transform active:translate-y-[2px] active:shadow-none transition-all"
                        >
                            Analyze Batch ({currentBatchImages.length})
                        </button>
                    )}

                    {/* Find Builds Button */}
                    {parts.length > 0 && currentBatchImages.length === 0 && (
                        <button
                            onClick={findBuilds}
                            className="pointer-events-auto bg-lego-yellow hover:bg-yellow-400 text-black px-8 py-3 rounded-full shadow-lg border-2 border-yellow-600 flex items-center gap-2 font-black transition-transform hover:scale-105"
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
            <div className="bg-lego-red text-white p-3 rounded-lg shadow-lg text-center font-bold border-2 border-red-800 opacity-90">
                {err}
            </div>
        </div>
    );
}
