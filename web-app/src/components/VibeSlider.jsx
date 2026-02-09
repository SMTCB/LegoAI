import React, { useRef, useEffect } from 'react';
import { Sparkles, Hammer, Zap, BrainCircuit } from 'lucide-react';

const VibeSlider = ({ value, onChange, isAnalyzing }) => {
    const sliderRef = useRef(null);
    const isDragging = useRef(false);

    // Calculate color based on value
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

    const handleInteraction = (clientY) => {
        if (!sliderRef.current) return;

        const rect = sliderRef.current.getBoundingClientRect();
        // Calculate percentage from bottom (since it's a vertical slider where bottom is 0, top is 100)
        // detailed math: (bottom_y - client_y) / height
        const height = rect.height;
        const relativeY = rect.bottom - clientY;

        let newValue = (relativeY / height) * 100;

        // Clamp
        newValue = Math.max(0, Math.min(100, newValue));

        onChange(Math.round(newValue));
    };

    const onPointerDown = (e) => {
        isDragging.current = true;
        handleInteraction(e.clientY);
        // Capture pointer to handle dragging outside the element
        e.target.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e) => {
        if (isDragging.current) {
            handleInteraction(e.clientY);
        }
    };

    const onPointerUp = (e) => {
        isDragging.current = false;
        e.target.releasePointerCapture(e.pointerId);
    };

    return (
        <div className="flex flex-col items-center justify-center h-full w-24 py-4 font-nunito relative select-none">

            {/* Top Label */}
            <div className={`mb-2 text-xs font-black tracking-widest uppercase transition-colors ${value > 80 ? 'text-lego-blue' : 'text-gray-400'}`}>
                Precision
            </div>

            {/* Scale Markers */}
            <div className="absolute right-2 top-12 bottom-12 flex flex-col justify-between items-end opacity-30 pointer-events-none">
                <div className="w-2 h-0.5 bg-gray-900"></div>
                <div className="w-1 h-0.5 bg-gray-900"></div>
                <div className="w-1 h-0.5 bg-gray-900"></div>
                <div className="w-1 h-0.5 bg-gray-900"></div>
                <div className="w-2 h-0.5 bg-gray-900"></div>
                <div className="w-1 h-0.5 bg-gray-900"></div>
                <div className="w-1 h-0.5 bg-gray-900"></div>
                <div className="w-1 h-0.5 bg-gray-900"></div>
                <div className="w-2 h-0.5 bg-gray-900"></div>
            </div>

            {/* Hit Area for Dragging (Wider than visual) */}
            <div
                ref={sliderRef}
                className="relative h-64 w-12 cursor-pointer touch-none flex justify-center"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
            >
                {/* Visual Track */}
                <div className="w-3 bg-gray-200 rounded-full h-full shadow-inner overflow-hidden relative pointer-events-none">
                    {/* Fill */}
                    <div
                        className={`absolute bottom-0 w-full transition-colors duration-100 ${getColor(value)}`}
                        style={{ height: `${value}%` }}
                    ></div>
                </div>

                {/* Handle / Thumb */}
                <div
                    className="absolute w-12 h-12 rounded-full shadow-xl bg-white border-4 border-gray-900 flex items-center justify-center transform transition-transform active:scale-110 pointer-events-none"
                    style={{
                        bottom: `calc(${value}% - 24px)`, // Center thumb on value
                        transition: isDragging.current ? 'none' : 'bottom 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                >
                    {isAnalyzing ? (
                        <div className="w-6 h-6 border-4 border-gray-200 border-t-lego-blue rounded-full animate-spin"></div>
                    ) : (
                        <div className={`transform transition-colors ${value > 80 ? 'text-lego-blue' : value < 40 ? 'text-lego-red' : 'text-gray-800'}`}>
                            {getIcon(value)}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Label */}
            <div className={`mt-2 text-xs font-black tracking-widest uppercase transition-colors ${value < 40 ? 'text-lego-red' : 'text-gray-400'}`}>
                Inspiration
            </div>

            {/* Floating Value Label (Side) */}
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 w-32 pointer-events-none">
                <div className={`text-2xl font-black ${getColor(value).replace('bg-', 'text-')}`}>
                    {Math.round(value)}%
                </div>
                <div className="text-xs font-bold text-gray-500 uppercase leading-none">
                    {getLabel(value)}
                </div>
            </div>

        </div>
    );
};

export default VibeSlider;
