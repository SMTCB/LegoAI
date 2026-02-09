import React, { useState, useMemo } from 'react';
import { Package, Trash2, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FilterBar from './FilterBar';

export default function PartsCatalog({ parts, onRemove, onUpdateQuantity }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('newest'); // 'newest', 'quantity', 'name'
    const [filterType, setFilterType] = useState('all'); // 'all', 'brick', 'plate', 'technic'

    // Filter and Sort Logic
    const filteredParts = useMemo(() => {
        if (!parts) return [];

        let result = [...parts];

        // 1. Filter by Type (Mock logic for now, utilizing name keywords if category is missing)
        if (filterType !== 'all') {
            result = result.filter(p =>
                (p.category && p.category.toLowerCase().includes(filterType)) ||
                p.name.toLowerCase().includes(filterType)
            );
        }

        // 2. Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(query) ||
                p.part_num.includes(query)
            );
        }

        // 3. Sort
        result.sort((a, b) => {
            if (sortBy === 'quantity') return b.quantity - a.quantity;
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            // Default to newest (assuming array order is newest first or we depend on a date field if available)
            // If parts have a 'created_at', use that. Otherwise rely on list order.
            return 0;
        });

        return result;
    }, [parts, searchQuery, sortBy, filterType]);

    if (!parts || parts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 p-8 text-center border-2 border-dashed border-gray-200 rounded-xl m-4 bg-gray-50/50">
                <Package size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium">Your collection is empty.</p>
                <p className="text-sm mt-2">Start scanning bricks to build your digital inventory!</p>
            </div>
        );
    }

    return (
        <div>
            <FilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sortBy={sortBy}
                onSortChange={setSortBy}
                filterType={filterType}
                onFilterTypeChange={setFilterType}
            />

            <motion.div
                layout
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-1"
            >
                <AnimatePresence>
                    {filteredParts.map((part) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            key={part.id}
                            className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm hover:shadow-lg transition-all duration-300 relative group flex flex-col"
                        >
                            {/* Card Image Area with "Isometric" feel */}
                            <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden border border-gray-100 relative group-hover:border-lego-yellow/30 transition-colors">
                                {part.part_img_url || part.img_url ? (
                                    <img
                                        src={part.part_img_url || part.img_url}
                                        alt={part.name}
                                        className="max-h-[80%] max-w-[80%] object-contain drop-shadow-md transform transition-transform group-hover:scale-110 group-hover:-rotate-2"
                                        loading="lazy"
                                    />
                                ) : (
                                    <Package size={32} className="text-gray-300" />
                                )}

                                {/* Color Badge (Mockup if color name exists) */}
                                {part.color_name && (
                                    <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold text-gray-600 border border-gray-200 shadow-sm">
                                        {part.color_name}
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-gray-800 text-sm truncate pr-2 w-full" title={part.name}>
                                        {part.name}
                                    </h3>
                                </div>
                                <p className="text-xs text-gray-400 font-mono mb-3">{part.part_num}</p>

                                <div className="flex items-center justify-between mt-auto">
                                    {/* Quantity Controls */}
                                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border border-gray-100">
                                        <button
                                            onClick={() => onUpdateQuantity && onUpdateQuantity(part.id, Math.max(0, part.quantity - 1))}
                                            className="w-6 h-6 flex items-center justify-center rounded-md bg-white shadow-sm text-gray-400 hover:text-lego-red hover:bg-red-50 disabled:opacity-50 transition-colors"
                                            disabled={!onUpdateQuantity || part.quantity <= 1}
                                        >
                                            <Minus size={12} />
                                        </button>
                                        <span className="text-xs font-bold text-gray-700 w-4 text-center">{part.quantity}</span>
                                        <button
                                            onClick={() => onUpdateQuantity && onUpdateQuantity(part.id, part.quantity + 1)}
                                            className="w-6 h-6 flex items-center justify-center rounded-md bg-white shadow-sm text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                                            disabled={!onUpdateQuantity}
                                        >
                                            <Plus size={12} />
                                        </button>
                                    </div>

                                    {/* Remove Button */}
                                    {onRemove && (
                                        <button
                                            onClick={() => onRemove(part.id)}
                                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                            title="Remove Part"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            {filteredParts.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <p>No parts found matching your criteria.</p>
                </div>
            )}
        </div>
    );
}
