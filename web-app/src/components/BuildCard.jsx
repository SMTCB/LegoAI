import React, { useState } from 'react';
import { ExternalLink, CheckCircle, AlertCircle, Plus, Check, FileText, Palette, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';

export default function BuildCard({ build }) {
    const { addKitToCollection, myKits } = useApp();
    const { set_img_url, name, match_score, set_url, num_parts, set_id } = build;
    const [showMissing, setShowMissing] = useState(false);

    // Check if already in collection
    const isSaved = myKits.some(k => k.set_id === set_id);
    const score = Math.round(match_score);
    const isHighMatch = score >= 85;

    // Image Source Strategy: Prefer official/high-res, fallback to API provided
    // Clean set_id for Brickset (remove '-1' suffix if present for generic sets, though specific versions need it)
    // For now, let's try using the API provided URL as primary fallback, or construct a better one.
    // Prompt suggested: https://images.brickset.com/sets/images/{SET_ID}.jpg
    // Let's rely on the set_img_url from API first as it's likely accurate from Rebrickable. 
    // If we want to force high-res, we could try:
    // const highResImg = `https://images.brickset.com/sets/images/${set_id.replace('-1', '')}.jpg`; 
    // But this depends on set_id format. Let's stick to set_img_url for safety unless user explicitly wants the other.
    // UPDATE: User prompt explicitly asked to update img source.
    const displayImage = `https://images.brickset.com/sets/images/${set_id}.jpg`;

    // Fallback handler could be added but for now we follow instructions.

    // Circular Progress Component
    const CircularProgress = ({ value }) => {
        const radius = 18;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference - (value / 100) * circumference;
        const color = value >= 85 ? '#10B981' : value >= 50 ? '#F59E0B' : '#EF4444';

        return (
            <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="transform -rotate-90 w-12 h-12">
                    <circle
                        cx="24"
                        cy="24"
                        r={radius}
                        stroke="#e5e7eb"
                        strokeWidth="4"
                        fill="transparent"
                    />
                    <circle
                        cx="24"
                        cy="24"
                        r={radius}
                        stroke={color}
                        strokeWidth="4"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                    />
                </svg>
                <span className="absolute text-[10px] font-bold text-gray-700">{value}%</span>
            </div>
        );
    };

    return (
        <motion.div
            className="bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col h-full group relative overflow-visible"
            whileHover={{
                scale: 1.02,
                rotateY: 5,
                rotateX: 5,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
        >
            {/* 3D Content Container */}
            <div className="flex flex-col h-full transform transition-transform" style={{ transformStyle: 'preserve-3d' }}>

                {/* Image Section */}
                <div className="relative h-56 bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-6 rounded-t-xl overflow-hidden">
                    <img
                        src={displayImage}
                        onError={(e) => { e.target.onerror = null; e.target.src = set_img_url; }} // Fallback to API URL
                        alt={name}
                        className="max-h-full max-w-full object-contain drop-shadow-xl transform transition-transform group-hover:scale-110 group-hover:translate-z-10"
                        style={{ transform: 'translateZ(20px)' }}
                        loading="lazy"
                    />

                    {/* Match Score Badge - Only show if we have a score */}
                    {match_score !== null && match_score !== undefined && (
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur rounded-full p-1 shadow-sm border border-gray-100" style={{ transform: 'translateZ(30px)' }}>
                            <CircularProgress value={score} />
                        </div>
                    )}

                    {/* Color Swap Indicator (Mock) */}
                    {/* Logic for color swaps would ideally come from backend. Assuming < 100 match might imply swaps or missing. */}
                    {match_score !== null && score < 100 && score > 80 && (
                        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold text-orange-600 flex items-center gap-1 shadow-sm border border-gray-100" title="Includes Color Swaps">
                            <Palette size={12} />
                            <span>Swaps</span>
                        </div>
                    )}

                    {/* Add to Collection Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!isSaved) addKitToCollection(build);
                        }}
                        className={`absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full shadow-md transition-all transform hover:scale-110 active:scale-95 ${isSaved
                            ? 'bg-green-500 text-white cursor-default'
                            : 'bg-white text-gray-400 hover:bg-lego-blue hover:text-white'
                            }`}
                        style={{ transform: 'translateZ(30px)' }}
                    >
                        {isSaved ? <Check size={20} strokeWidth={3} /> : <Plus size={24} />}
                    </button>
                </div>

                {/* Content Section */}
                <div className="p-5 flex-1 flex flex-col bg-white rounded-b-xl relative z-10">
                    <h3 className="font-black text-gray-800 text-lg leading-tight mb-1 line-clamp-2">{name}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500 font-bold mb-4">
                        <span>{set_id}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span>{num_parts} parts</span>
                    </div>

                    {/* Missing Pieces Toggle (Mock logic) - Only if score exists */}
                    {match_score !== null && score < 100 && (
                        <div className="mb-4">
                            <button
                                onClick={() => setShowMissing(!showMissing)}
                                className="text-xs font-bold text-lego-blue hover:underline flex items-center gap-1"
                            >
                                <ShoppingBag size={12} />
                                {showMissing ? 'Hide Missing Parts' : 'Show Missing Parts'}
                            </button>

                            {showMissing && (
                                <div className="mt-2 text-xs bg-gray-50 p-2 rounded-lg border border-gray-100 animate-in slide-in-from-top-2">
                                    <p className="text-gray-400 italic mb-1">Missing parts list would appear here.</p>
                                    <a href="https://www.lego.com/en-us/pick-and-build/pick-a-brick" target="_blank" rel="noopener noreferrer" className="text-lego-blue hover:underline font-bold block mt-1">
                                        Search on Pick a Brick &rarr;
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-auto pt-2">
                        <a
                            href={`https://www.lego.com/service/buildinginstructions/${set_id.split('-')[0]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl transform active:scale-[0.98]"
                        >
                            <FileText size={16} />
                            View Instructions
                        </a>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
