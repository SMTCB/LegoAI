import React from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

export default function FilterBar({ searchQuery, onSearchChange, sortBy, onSortChange, filterType, onFilterTypeChange }) {
    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Search your parts..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lego-yellow focus:border-transparent transition-all"
                />
            </div>

            <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                {/* Sort Dropdown */}
                <div className="relative group">
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors whitespace-nowrap">
                        <ArrowUpDown size={16} />
                        <span>Sort: {sortBy === 'newest' ? 'Newest' : sortBy === 'quantity' ? 'Quantity' : 'Name'}</span>
                    </button>
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 p-1 hidden group-hover:block z-20">
                        <button onClick={() => onSortChange('newest')} className={`w-full text-left px-3 py-2 rounded-md text-sm ${sortBy === 'newest' ? 'bg-yellow-50 text-yellow-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>Last Scanned</button>
                        <button onClick={() => onSortChange('quantity')} className={`w-full text-left px-3 py-2 rounded-md text-sm ${sortBy === 'quantity' ? 'bg-yellow-50 text-yellow-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>Quantity</button>
                        <button onClick={() => onSortChange('name')} className={`w-full text-left px-3 py-2 rounded-md text-sm ${sortBy === 'name' ? 'bg-yellow-50 text-yellow-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>Name</button>
                    </div>
                </div>

                {/* Filter Type Pills */}
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    {['all', 'brick', 'plate', 'technic'].map((type) => (
                        <button
                            key={type}
                            onClick={() => onFilterTypeChange(type)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${filterType === type ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
