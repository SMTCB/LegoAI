import React from 'react';
import { Sparkles, Hammer, Zap, BrainCircuit } from 'lucide-react';

const VibeSlider = ({ value, onChange, isAnalyzing }) => {
    // Calculate color based on value (Red -> Blue -> Purple)
    const getColor = (val) => {
        if (val > 80) return 'bg-lego-blue'; // Precision
        if (val > 40) return 'bg-lego-yellow'; // Balanced
        return 'bg-lego-red'; // Chaos
    };

    const getIcon = (val) => {
        if (val > 80) return <Hammer size={24} className="text-white" />;
        if (val > 40) return <BrainCircuit size={24} className="text-gray-900" />;
        return <Zap size={24} className="text-white" />;
    };

    const getLabel = (val) => {
        if (val > 80) return "Master Builder";
        if (val > 40) return "Free Spirit";
        return "Chaos Creator";
    };

    const getDescription = (val) => {
        if (val > 80) return "Strict accuracy. High confidence matches only.";
        if (val > 40) return "Balanced using most parts.";
        return "Wild ideas! Uses obscure and partial matches.";
    };

    return (
        <div className="flex flex-col items-center justify-center h-full w-20 py-4 font-nunito relative group">

            {/* Value Tooltip (Appears on Hover/Drag) */}
            <div className="absolute left-full ml-4 bg-white p-3 rounded-xl shadow-xl w-48 border-2 border-gray-900 transform transition-all opacity-0 group-hover:opacity-100 pointer-events-none z-50">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Vibe Mode</div>
                <div className={`text-lg font-black ${value > 80 ? 'text-lego-blue' : value > 40 ? 'text-yellow-600' : 'text-lego-red'}`}>
                    {getLabel(value)}
                </div>
                <div className="text-xs text-gray-600 leading-tight mt-1">{getDescription(value)}</div>

                {/* Arrow */}
                <div className="absolute top-1/2 -left-2 w-4 h-4 bg-white border-l-2 border-b-2 border-gray-900 transform rotate-45 -translate-y-1/2"></div>
            </div>

            {/* Top Icon */}
            <div className="mb-4 text-xs font-bold text-gray-400 rotate-180" style={{ writingMode: 'vertical-rl' }}>PRECISION</div>

            {/* Slider Track */}
            <div className="relative h-64 w-3 bg-gray-200 rounded-full shadow-inner">
                {/* Fill */}
                <div
                    className={`absolute bottom-0 w-full rounded-full transition-all duration-300 ${getColor(value)}`}
                    style={{ height: `${value}%` }}
                ></div>

                {/* Thumb */}
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => onChange(parseInt(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    orient="vertical" // Firefox support
                />

                {/* Visual Thumb Handle */}
                <div
                    className="absolute left-1/2 -translate-x-1/2 w-10 h-10 bg-white border-4 border-gray-900 rounded-full shadow-lg flex items-center justify-center transition-all duration-75 pointer-events-none"
                    style={{ bottom: `calc(${value}% - 20px)` }}
                >
                    {isAnalyzing ? (
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-lego-blue rounded-full animate-spin"></div>
                    ) : (
                        <div className={`transform transition-colors ${value > 80 ? 'text-lego-blue' : value < 40 ? 'text-lego-red' : 'text-gray-800'}`}>
                            {getIcon(value)}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Icon */}
            <div className="mt-4 text-xs font-bold text-gray-400 rotate-180" style={{ writingMode: 'vertical-rl' }}>INSPIRATION</div>
        </div>
    );
};

export default VibeSlider;
