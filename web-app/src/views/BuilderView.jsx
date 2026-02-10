import React, { useState, useEffect } from 'react';
import { Layers, Grid, ArrowLeft, Loader2, HelpCircle, Home, Camera, X, CheckCircle, Plus, BrickWall } from 'lucide-react';
import CameraCapture from '../components/CameraCapture';
import BuildCard from '../components/BuildCard';
import PartsCatalog from '../components/PartsCatalog';
import TutorialOverlay from '../components/TutorialOverlay';
import { useApp } from '../context/AppContext';

export default function BuilderView({ onHome }) {
    const {
        scanStatus, builds, parts, setParts,
        addToBatch, removeImageFromBatch, analyzeBatch, commitBatch, clearCurrentBatch, currentBatchImages, currentBatchResults,
        findBuilds, clearSession, undoLastScan, removePart, updatePartQuantity, error, resetScan, setScanStatus, setCurrentBatchImages
    } = useApp();

    // 'intro' (landing), 'camera' (scanning), 'parts_list' (review)
    const [mode, setMode] = useState('intro');
    const [showTutorial, setShowTutorial] = useState(false);

    // Vibe Slider State (Default 90 = Precision)
    const [vibeLevel, setVibeLevel] = useState(90);

    const handleFindBuilds = () => {
        // Filter parts based on Vibe Level
        // High Vibe (>80) = High Confidence only (>80%)
        // Low Vibe (<40) = Anything goes (>20%)
        // Medium = Balanced (>50%)

        const minConfidence = vibeLevel > 80 ? 80 : vibeLevel < 40 ? 20 : 50;

        // Filter active parts. Note: We need 'confidence' in parts data. 
        // If not present (legacy scans), we assume 100%.
        const filteredParts = parts.filter(p => (p.confidence || 100) >= minConfidence);

        console.log(`[Vibe Check] Level: ${vibeLevel}, MinConf: ${minConfidence}, Parts: ${filteredParts.length}/${parts.length}`);

        findBuilds(filteredParts, vibeLevel);
    };

    // Auto-switch to camera if we have images (e.g. returning from another tab)
    useEffect(() => {
        if (currentBatchImages.length > 0) {
            setMode('camera');
        }
    }, [currentBatchImages]);

    const handleCapture = (imageData) => {
        addToBatch(imageData);
    };

    // 1. INTRO / LANDING SCREEN
    if (mode === 'intro' && scanStatus === 'idle') {
        return (
            <div className="flex flex-col h-full bg-lego-yellow font-nunito p-6 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                    backgroundImage: 'radial-gradient(#000 2px, transparent 2px)',
                    backgroundSize: '24px 24px'
                }}></div>

                {/* Header */}
                <div className="flex justify-between items-center z-10 mb-8">
                    <button onClick={onHome} className="bg-white/90 p-3 rounded-full shadow-sm hover:bg-white text-gray-800 transition-transform hover:scale-105">
                        <Home size={24} />
                    </button>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center text-center z-10 max-w-sm mx-auto">
                    <div className="w-32 h-32 bg-white rounded-3xl shadow-lego-card flex items-center justify-center mb-6 rotate-3 border-4 border-gray-900">
                        <Camera size={64} className="text-lego-blue" strokeWidth={2} />
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Identify Parts</h1>
                    <p className="text-gray-900 font-bold opacity-80 mb-8 leading-relaxed max-w-xs">
                        Scan piles of bricks, find out what they are, and build something new.
                    </p>

                    <div className="flex flex-col gap-4 w-full">
                        <button
                            onClick={() => setMode('camera')}
                            className="w-full bg-lego-blue hover:bg-blue-600 text-white font-black py-4 rounded-xl shadow-lego-card border-2 border-gray-900 flex items-center justify-center gap-3 transform active:translate-y-[2px] active:shadow-none transition-all text-xl"
                        >
                            <Camera size={28} />
                            Start Scanning
                        </button>
                        <button
                            onClick={() => setShowTutorial(true)}
                            className="text-gray-900 font-bold underline hover:text-lego-red decoration-2 py-2"
                        >
                            How does it work?
                        </button>
                    </div>
                </div>

                {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}
            </div>
        );
    }

    // 2. Internal Parts Catalog View
    if (mode === 'parts_list') {
        return (
            <div className="flex flex-col h-full bg-gray-50 pb-20 font-nunito">
                <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center shadow-sm sticky top-0 z-10">
                    <button onClick={() => setMode('camera')} className="p-2 mr-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-black text-gray-800">Current Session Parts</h1>
                </header>
                <main className="flex-1 overflow-y-auto">
                    <PartsCatalog parts={parts} onRemove={removePart} onUpdateQuantity={updatePartQuantity} />
                </main>
            </div>
        );
    }

    // 3. Builds View (Matching Success)
    if (scanStatus === 'matching_success') {
        return (
            <div className="flex flex-col h-full bg-gray-50 pb-20 font-nunito">
                <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <button onClick={onHome} className="p-2 hover:bg-gray-100 rounded-full text-gray-800">
                            <Home size={20} />
                        </button>
                        <button onClick={resetScan} className="flex items-center text-gray-600 hover:text-gray-900 font-bold bg-gray-100 px-3 py-1 rounded-lg">
                            <ArrowLeft size={18} className="mr-1" /> Scan More
                        </button>
                    </div>
                    <span className="font-bold text-green-600 text-sm bg-green-50 px-2 py-1 rounded-lg border border-green-200">Builds Found!</span>
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

    // 4. Batch Review View
    if (scanStatus === 'review') {
        return (
            <div className="flex flex-col h-full bg-lego-yellow text-gray-900 pb-20 font-nunito relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                    backgroundImage: 'radial-gradient(#000 2px, transparent 2px)',
                    backgroundSize: '24px 24px'
                }}></div>

                <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 z-10 w-full max-w-md mx-auto">
                    <h2 className="text-3xl font-black text-center text-lego-red drop-shadow-sm bg-white px-6 py-3 rounded-xl shadow-lego-sm border-2 border-gray-900 -rotate-2 transform hover:rotate-0 transition-transform">
                        Scan Complete!
                    </h2>

                    <div className="bg-white rounded-2xl p-6 w-full shadow-lego-card border-4 border-gray-900 flex flex-col max-h-[50vh]">
                        <div className="flex justify-between items-center mb-4 border-b-2 border-gray-100 pb-4">
                            <span className="text-gray-500 font-bold text-lg">Found:</span>
                            <span className="text-2xl font-black text-lego-blue">{currentBatchResults.length} parts</span>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                            {currentBatchResults.map((p, i) => (
                                <div key={i} className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
                                    <div className="w-16 h-16 bg-white rounded-lg border border-gray-200 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                        {p.part_img_url ? (
                                            <img
                                                src={p.part_img_url}
                                                className="w-full h-full object-contain"
                                                referrerPolicy="no-referrer"
                                                alt={p.name}
                                                onError={(e) => {
                                                    // Fallback Strategy
                                                    if (p.backup_img_url && e.target.src !== p.backup_img_url) {
                                                        e.target.src = p.backup_img_url;
                                                    } else {
                                                        e.target.style.display = 'none';
                                                        e.target.parentNode.classList.add('bg-gray-100');
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">
                                                <Layers size={20} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-800 text-lg leading-tight">{p.quantity}x {p.name}</span>
                                        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">{p.color_name || 'Lego Part'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 w-full">
                        <button onClick={commitBatch} className="w-full bg-lego-blue hover:bg-blue-600 text-white font-black py-4 rounded-xl shadow-lego-card border-2 border-gray-900 transform active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-3 text-xl">
                            <Layers size={28} />
                            Add to Collection
                        </button>
                        <button onClick={clearCurrentBatch} className="w-full bg-white hover:bg-red-50 text-red-600 font-bold py-4 rounded-xl border-2 border-red-600 flex items-center justify-center gap-2 text-lg shadow-sm">
                            <X size={24} />
                            Trash & Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 5. Main Scanning View (Camera) - Polished
    const showCamera = (currentBatchImages.length > 0 || parts.length === 0) && scanStatus === 'idle';

    return (
        <div className="flex flex-col h-full bg-gray-900 relative overflow-hidden pb-0 font-nunito">

            {/* HEADER OVERLAY */}
            <div className="absolute top-0 left-0 right-0 z-30 p-4 flex justify-between items-start pointer-events-none">
                <div className="flex gap-2">
                    <button onClick={onHome} className="pointer-events-auto bg-white/90 shadow-lg text-gray-900 p-2.5 rounded-xl hover:bg-white border-2 border-gray-900 transition-colors">
                        <Home size={22} strokeWidth={2.5} />
                    </button>
                    {(mode !== 'intro' || parts.length > 0) && (
                        <button onClick={() => setMode('intro')} className="pointer-events-auto bg-white/90 shadow-lg text-gray-900 p-2.5 rounded-xl hover:bg-white border-2 border-gray-900 transition-colors">
                            <ArrowLeft size={22} strokeWidth={2.5} />
                        </button>
                    )}
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setShowTutorial(true)}
                        className="pointer-events-auto bg-white/90 shadow-lg text-gray-900 p-2.5 rounded-xl hover:bg-white border-2 border-gray-900 transition-colors"
                    >
                        <HelpCircle size={22} strokeWidth={2.5} />
                    </button>

                    <button
                        onClick={() => setMode('parts_list')}
                        className="pointer-events-auto bg-white/90 shadow-lg text-gray-900 p-2.5 rounded-xl hover:bg-white border-2 border-gray-900 transition-colors relative"
                    >
                        <Layers size={22} strokeWidth={2.5} />
                        {parts.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-lego-red text-white text-xs w-6 h-6 flex items-center justify-center rounded-full font-black border-2 border-white shadow-sm transform scale-110">
                                {parts.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Loading States */}
            {scanStatus === 'scanning' && (
                <div className="absolute inset-0 z-[100] bg-lego-yellow flex flex-col items-center justify-center text-gray-900">
                    <Loader2 size={64} className="animate-spin text-lego-red mb-6" />
                    <h2 className="text-3xl font-black mb-2 tracking-tight">Analyzing...</h2>
                    <p className="font-bold opacity-75 text-lg">Identifying your bricks</p>
                </div>
            )}

            {scanStatus === 'matching' && (
                <div className="absolute inset-0 z-[100] bg-lego-blue flex flex-col items-center justify-center text-white">
                    <Loader2 size={64} className="animate-spin text-white mb-6" />
                    <h2 className="text-3xl font-black mb-2 tracking-tight">Finding Builds...</h2>
                    <p className="font-bold opacity-75 text-lg">Matching {parts.length} parts</p>
                </div>
            )}

            {/* "Ready to Build" / Analysis Summary Screen */}
            {!showCamera && (
                <div className="flex-1 bg-lego-yellow flex flex-col relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                        backgroundImage: 'radial-gradient(#000 2px, transparent 2px)',
                        backgroundSize: '24px 24px'
                    }}></div>

                    {/* Centered Content */}
                    <div className="flex-1 flex flex-col items-center justify-center p-6 pb-32">
                        <div className="bg-white p-8 rounded-3xl shadow-lego-card border-4 border-gray-900 text-center max-w-sm w-full z-10">
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-200">
                                <CheckCircle size={48} className="text-green-600" />
                            </div>
                            <h2 className="text-4xl font-black text-gray-900 mb-3">{parts.length} Parts</h2>
                            <p className="text-gray-500 font-bold text-lg mb-2">Ready to find leads?</p>
                            <p className="text-gray-400 text-sm font-semibold">Adding more parts helps finding better sets!</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Camera UI */}
            <div className={`flex-1 relative bg-black flex flex-col overflow-hidden ${!showCamera ? 'hidden' : ''}`}>
                {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}

                <div className="flex-1 relative">
                    <CameraCapture onCapture={handleCapture} />

                    {/* LEGO FRAME BORDER OVERLAY */}
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>

                    {/* Batch Thumbnails */}
                    {currentBatchImages.length > 0 && (
                        <div className="absolute top-24 left-4 z-20 flex flex-col gap-3">
                            {currentBatchImages.map((img, idx) => (
                                <div key={idx} className="w-16 h-20 border-4 border-white rounded-xl overflow-hidden bg-black shadow-lg relative group transition-transform hover:scale-105 rotate-1">
                                    <img src={img} className="w-full h-full object-cover" />
                                    <div className="absolute -top-2 -right-2 bg-lego-blue text-white text-xs w-6 h-6 flex items-center justify-center rounded-full font-black border-2 border-white shadow-sm">
                                        {idx + 1}
                                    </div>
                                    <button
                                        onClick={() => removeImageFromBatch(idx)}
                                        className="absolute inset-0 bg-lego-red/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                                    >
                                        <X size={24} strokeWidth={3} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {checkError(error)}

                {/* Analyze Batch Button (Floating) */}
                {currentBatchImages.length > 0 && (
                    <div className="absolute bottom-32 left-0 right-0 flex justify-center z-40 px-6">
                        <button
                            onClick={analyzeBatch}
                            className="w-full max-w-xs bg-lego-blue hover:bg-blue-600 text-white px-6 py-4 rounded-2xl shadow-lego-card border-4 border-white flex items-center justify-center gap-2 font-black text-xl animate-in slide-in-from-bottom-5 transform active:translate-y-[2px] active:shadow-none transition-all"
                        >
                            Analyze Batch ({currentBatchImages.length})
                        </button>
                    </div>
                )}
            </div>

            {/* Bottom Actions Area - Redesigned for cleaner layout */}
            <div className="bg-gray-900 border-t-4 border-gray-800 p-6 flex flex-col gap-4 z-40">

                {/* Vibe Control - Inline & Cleaner */}
                {!showCamera && parts.length > 0 && (
                    <div className="flex items-center justify-between bg-gray-800/50 p-4 rounded-xl border-2 border-dashed border-gray-700">
                        <div className="flex flex-col">
                            <span className="text-lego-yellow font-black uppercase text-xs tracking-wider">Vibe Check</span>
                            <span className="text-white font-bold text-lg">{vibeLevel > 80 ? 'Precision' : vibeLevel < 40 ? 'Chaos' : 'Balanced'} Mode</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="range"
                                min="10"
                                max="100"
                                value={vibeLevel}
                                onChange={(e) => setVibeLevel(Number(e.target.value))}
                                className="w-32 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-lego-red"
                            />
                            <span className="text-lego-red font-black text-xl w-10 text-right">{vibeLevel}%</span>
                        </div>
                    </div>
                )}

                {/* Main Action Button */}
                {!showCamera && parts.length > 0 && (
                    <button
                        onClick={handleFindBuilds}
                        disabled={scanStatus === 'matching'}
                        className="w-full bg-lego-blue hover:bg-blue-600 text-white font-black text-2xl py-4 rounded-2xl shadow-[0_6px_0_0_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-3 border-4 border-white/10"
                    >
                        {scanStatus === 'matching' ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            <BrickWall size={28} />
                        )}
                        BUILD IT!
                    </button>
                )}

                {/* Scan More / Clear Actions */}
                <div className="flex gap-3">
                    {!showCamera && (
                        <button
                            onClick={() => {
                                setParts([]);
                                setScanStatus('idle');
                                setCurrentBatchImages([]);
                                setMode('intro');
                            }}
                            className="flex-1 bg-gray-800 text-gray-400 font-bold py-3 rounded-xl border-2 border-gray-700 hover:bg-gray-700 hover:text-white transition-colors"
                        >
                            Clear All
                        </button>
                    )}

                    {!showCamera && (
                        <button
                            onClick={() => {
                                setScanStatus('idle');
                                setCurrentBatchImages([]);
                                // Stay in camera mode effectively
                            }}
                            className="flex-1 bg-lego-green text-white font-bold py-3 rounded-xl shadow-[0_4px_0_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={20} />
                            Scan More
                        </button>
                    )}
                </div>

                {/* Tips if in camera mode */}
                {showCamera && (
                    <p className="text-gray-500 font-bold text-center text-sm">
                        {currentBatchImages.length > 0 ? "Scan different sections of your pile." : "Point at your Lego pile and tap capture!"}
                    </p>
                )}
            </div>

        </div>
    );
}

function checkError(err) {
    if (!err) return null;
    return (
        <div className="absolute bottom-48 left-4 right-4 z-[200] pointer-events-none">
            <div className="bg-lego-red text-white p-4 rounded-xl shadow-lg text-center font-black border-4 border-white animate-in slide-in-from-bottom-5 max-w-sm mx-auto pointer-events-auto">
                <div className="text-lg mb-1">⚠️ Scan Failed</div>
                <div className="text-sm font-normal opacity-90 break-words">{err}</div>
            </div>
        </div>
    );
}
