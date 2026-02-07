import React from 'react';
import { Package, Trash2 } from 'lucide-react';

export default function PartsCatalog({ parts, onRemove }) {
    if (!parts || parts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 p-8 text-center border-2 border-dashed border-gray-200 rounded-xl m-4">
                <Package size={48} className="mb-4 opacity-50" />
                <p>Your collection is empty. Start scanning bricks!</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
            {parts.map((part) => (
                <div key={part.id} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow relative group">
                    <div className="h-24 bg-gray-50 rounded-md mb-2 flex items-center justify-center overflow-hidden">
                        {part.img_url ? (
                            <img src={part.img_url} alt={part.name} className="max-h-full max-w-full object-contain" />
                        ) : (
                            <Package size={32} className="text-gray-300" />
                        )}
                    </div>

                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-medium text-gray-800 text-sm truncate" title={part.name}>{part.name}</p>
                            <p className="text-xs text-gray-500 font-mono">{part.part_num}</p>
                        </div>
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-bold">
                            x{part.quantity}
                        </span>
                    </div>

                    {onRemove && (
                        <button
                            onClick={() => onRemove(part.id)}
                            className="absolute top-2 right-2 p-1.5 bg-white text-red-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                            aria-label="Remove part"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
}
