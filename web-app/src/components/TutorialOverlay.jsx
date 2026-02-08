import React, { useState } from 'react';
import { Camera, Layers, CheckCircle, ArrowRight, X } from 'lucide-react';

const steps = [
    {
        title: "Scan a Batch",
        desc: "Pour a small pile of parts on a white table. Don't worry about stacking them neatly.",
        icon: <Camera size={48} className="text-lego-blue" />,
        color: "bg-blue-50 border-blue-200"
    },
    {
        title: "Multiple Angles",
        desc: "Take 2-3 photos of the SAME pile from different sides. This helps AI see depth (Bricks vs Plates).",
        icon: <Layers size={48} className="text-lego-yellow" />,
        color: "bg-yellow-50 border-yellow-200"
    },
    {
        title: "Review & Commit",
        desc: "Check the AI results. If correct, add them to your collection and clear the table for the next pile!",
        icon: <CheckCircle size={48} className="text-lego-red" />,
        color: "bg-red-50 border-red-200"
    }
];

export default function TutorialOverlay({ onClose }) {
    const [step, setStep] = useState(0);

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(s => s + 1);
        } else {
            onClose();
        }
    };

    return (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <X size={24} />
                </button>

                {/* Progress Bar */}
                <div className="flex p-1 gap-1">
                    {steps.map((_, i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-lego-blue' : 'bg-gray-200'}`} />
                    ))}
                </div>

                <div className="p-8 flex-1 flex flex-col items-center text-center justify-center">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 border-4 ${steps[step].color}`}>
                        {steps[step].icon}
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">{steps[step].title}</h2>
                    <p className="text-gray-600 font-medium leading-relaxed">{steps[step].desc}</p>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100">
                    <button
                        onClick={handleNext}
                        className="w-full bg-lego-blue hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                        {step === steps.length - 1 ? "Let's Build!" : "Next"}
                        {step < steps.length - 1 && <ArrowRight size={20} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
