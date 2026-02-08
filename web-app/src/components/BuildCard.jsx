import React from 'react';
import { ExternalLink, CheckCircle, AlertCircle, Plus, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function BuildCard({ build }) {
    const { addKitToCollection, myKits } = useApp();
    const { set_img_url, name, match_score, set_url, num_parts, set_id } = build;

    // Check if already in collection
    const isSaved = myKits.some(k => k.set_id === set_id);
    const isHighMatch = match_score >= 85;

    return (
        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden border border-gray-100 flex flex-col h-full group">
            <div className="relative h-48 bg-gray-50 flex items-center justify-center p-4">
                <img
                    src={set_img_url}
                    alt={name}
                    className="max-h-full max-w-full object-contain drop-shadow-md group-hover:scale-105 transition-transform"
                    loading="lazy"
                />

                {/* Match Score Badge */}
                <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${isHighMatch ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {isHighMatch ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                    {Math.round(match_score)}% Match
                </div>

                {/* Save Button */}
                <button
                    onClick={() => !isSaved && addKitToCollection(build)}
                    className={`absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full shadow-md transition-colors ${isSaved
                            ? 'bg-green-500 text-white cursor-default'
                            : 'bg-white text-gray-600 hover:bg-lego-blue hover:text-white'
                        }`}
                >
                    {isSaved ? <Check size={16} strokeWidth={3} /> : <Plus size={20} />}
                </button>
            </div>

            <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-800 text-lg leading-tight mb-1 line-clamp-2">{name}</h3>
                <p className="text-gray-500 text-sm mb-4 font-bold">{num_parts} pieces</p>

                <div className="mt-auto">
                    <a
                        href={set_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold transition-colors text-sm"
                    >
                        Instructions <ExternalLink size={14} />
                    </a>
                </div>
            </div>
        </div>
    );
}
