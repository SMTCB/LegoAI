import React, { useState, useEffect } from 'react';
import { Layers, Grid, ArrowLeft, Loader2, HelpCircle, Home, Camera, X, CheckCircle } from 'lucide-react';
import CameraCapture from '../components/CameraCapture';
import BuildCard from '../components/BuildCard';
import PartsCatalog from '../components/PartsCatalog';
import TutorialOverlay from '../components/TutorialOverlay';
import VibeSlider from '../components/VibeSlider';
import { useApp } from '../context/AppContext';

export default function BuilderView({ onHome }) {
    const {
        scanStatus, builds, parts,
        addToBatch, removeImageFromBatch, analyzeBatch, commitBatch, clearCurrentBatch, currentBatchImages, currentBatchResults,
        findBuilds, clearSession, undoLastScan, removePart, updatePartQuantity, error, resetScan
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
                                                        // Try backup (Brickognize WebP)
                                                        e.target.src = p.backup_img_url;
                                                    } else {
                                                        // Give up -> Placeholder
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
        <div className="flex flex-col h-full bg-gray-900 relative overflow-hidden pb-16 font-nunito">

            {/* HEADER OVERLAY */}
            <div className="absolute top-0 left-0 right-0 z-30 p-4 flex justify-between items-start pointer-events-none">
                <div className="flex gap-2">
                    <button onClick={onHome} className="pointer-events-auto bg-white/90 shadow-lg text-gray-900 p-2.5 rounded-xl hover:bg-white border-2 border-gray-900 transition-colors">
                        <Home size={22} strokeWidth={2.5} />
                    </button>
                    {/* Only show Back if we are in a sub-mode or have parts */}
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
            {/* Loading States - High Z-Index to cover everything */}
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

            {/* FAST TRACK: If we have parts and NO current batch, show "Ready to Build" screen (Hide Camera) */}
            {!showCamera && (
                <div className="flex-1 bg-lego-yellow flex flex-col items-center justify-center p-6 relative">
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                        backgroundImage: 'radial-gradient(#000 2px, transparent 2px)',
                        backgroundSize: '24px 24px'
                    }}></div>

                    <div className="bg-white p-6 rounded-3xl shadow-lego-card border-4 border-gray-900 text-center max-w-sm w-full z-10">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-green-200">
                            <CheckCircle size={40} className="text-green-600" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">{parts.length} Parts Scanned</h2>
                        <p className="text-gray-500 font-bold mb-6">Ready to find something to build?</p>

                        <div className="flex flex-col gap-3 w-full">
                            <button
                                onClick={handleFindBuilds}
                                className={`w-full bg-lego-blue hover:bg-blue-600 text-white py-4 rounded-xl shadow-lego-card border-2 border-gray-900 flex items-center justify-center gap-2 font-black text-xl transition-transform active:scale-95 ${scanStatus === 'matching' ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                                <Grid size={24} />
                                <span>Build It!</span>
                            </button>

                            <button
                                onClick={() => { /* Resetting involves clearing? No, just showing camera. */
                                    // Actually we just need to set showCamera to true? 
                                    // But showing camera depends on state. 
                                    // We can just add more images?
                                    // Or "Clear & Start Over" is enough?
                                    // The user might want to add more to the existing list.
                                    // To do that, we need to go back to camera mode.
                                    // But camera mode is hidden if parts > 0.
                                    // We need a 'Scanning' mode toggle?
                                    // For now, let's keep Clear & Start Over. 
                                    clearSession();
                                }}
                                className="text-gray-500 font-bold hover:text-red-500 hover:underline text-sm py-2"
                            >
                                Clear & Start Over
                            </button>
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

            {/* Bottom Actions Area */}
            {/* If camera is hidden, we still show the bottom bar for "Build It" but "Vibe Slider" needs context */}
            <div className={`h-24 bg-gray-900 relative z-30 flex items-center justify-center px-6 border-t-4 border-gray-800`}>

                {/* Vibe Slider - Only Visible in Camera Mode or Ready Mode */}
                <div className="absolute -top-40 w-full max-w-md flex items-end justify-start px-4 pointer-events-none z-40">
                    <div className={`pointer-events-auto h-64 transition-opacity duration-300 ${currentBatchImages.length > 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                        <VibeSlider
                            value={vibeLevel}
                            onChange={setVibeLevel}
                            isAnalyzing={scanStatus === 'matching'}
                        />
                    </div>
                </div>

                {/* Scan More Button (Only if Camera is Hidden) */}
                {!showCamera && (
                    <div className="absolute -top-32 w-full max-w-md flex items-end justify-start px-4 pointer-events-none z-40">
                        <div className="pointer-events-auto pb-8">
                            <button
                                onClick={() => { /* Just clearing batch logic triggers camera show */ }}
                                className="w-16 h-16 bg-white hover:bg-gray-100 text-gray-900 rounded-2xl shadow-lg border-4 border-gray-200 flex items-center justify-center transition-transform hover:scale-105"
                                aria-label="Scan More"
                            >
                                <Camera size={28} />
                            </button>
                        </div>
                    </div>
                )}

                <p className="text-gray-500 font-bold text-sm">
                    {currentBatchImages.length > 0 ? "Scan different sections of your pile." : parts.length > 0 ? "Adjust the Vibe, then hit Build!" : "Set your Vibe & Start Scanning!"}
                </p>
            </div>

        </div>
    );
}

function checkError(err) {
    if (!err) return null;
    return (
        // Raised z-index to 50 to appear above buttons
        <div className="absolute bottom-48 left-4 right-4 z-50 pointer-events-none">
            <div className="bg-lego-red text-white p-4 rounded-xl shadow-lg text-center font-black border-4 border-white animate-in slide-in-from-bottom-5 max-w-sm mx-auto pointer-events-auto">
                <div className="text-lg mb-1">⚠️ Scan Failed</div>
                <div className="text-sm font-normal opacity-90 break-words">{err}</div>
            </div>
        </div>
    );
}
