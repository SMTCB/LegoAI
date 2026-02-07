import React from 'react';
import { ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

export default function BuildCard({ build }) {
    const { set_img_url, name, match_score, set_url, num_parts } = build;
    const isHighMatch = match_score >= 85;

    return (
        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden border border-gray-100 flex flex-col h-full">
            <div className="relative h-48 bg-gray-50 flex items-center justify-center p-4">
                <img
                    src={set_img_url}
                    alt={name}
                    className="max-h-full max-w-full object-contain drop-shadow-md"
                    loading="lazy"
                />
                <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${isHighMatch ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {isHighMatch ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                    {Math.round(match_score)}% Match
                </div>
            </div>

            <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-800 text-lg leading-tight mb-1 line-clamp-2">{name}</h3>
                <p className="text-gray-500 text-sm mb-4">{num_parts} pieces</p>

                <div className="mt-auto">
                    <a
                        href={set_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg font-medium transition-colors text-sm"
                    >
                        Build Instructions <ExternalLink size={14} />
                    </a>
                </div>
            </div>
        </div>
    );
}
