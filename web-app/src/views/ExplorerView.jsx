import React, { useState, useEffect } from 'react';
import { Search, Loader2, Home, Filter, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import BuildCard from '../components/BuildCard';
import { motion, AnimatePresence } from 'framer-motion';

export default function ExplorerView({ onHome }) {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Filters & Sorting
    const [minParts, setMinParts] = useState(10); // Default to >=10 to filter gear
    const [sortBy, setSortBy] = useState('-num_parts'); // Default to most parts
    const [showFilters, setShowFilters] = useState(false);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query !== debouncedQuery) {
                setDebouncedQuery(query);
                setPage(1); // Reset page on new query
                setResults([]); // Clear results immediately on new query to avoid confusion
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [query]);

    // Effect to trigger search when debounced query or filters change
    useEffect(() => {
        if (debouncedQuery.trim()) {
            fetchSets(1, true);
        }
    }, [debouncedQuery, minParts, sortBy]);

    const fetchSets = async (pageToFetch, reset = false) => {
        if (!debouncedQuery.trim()) return;

        setLoading(true);
        setError(null);
        if (reset) setResults([]);

        try {
            const baseUrl = import.meta.env.VITE_API_URL || '/api';
            const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
            const apiUrl = `${cleanBase}/search_sets?query=${encodeURIComponent(debouncedQuery)}&page=${pageToFetch}&min_parts=${minParts}&ordering=${sortBy}`;

            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Failed to fetch sets');

            const data = await response.json();

            const newResults = data.results || [];

            if (reset) {
                setResults(newResults);
            } else {
                // Filter out duplicates just in case
                setResults(prev => {
                    const existingIds = new Set(prev.map(r => r.set_id));
                    const uniqueNew = newResults.filter(r => !existingIds.has(r.set_id));
                    return [...prev, ...uniqueNew];
                });
            }

            setHasMore(!!data.next);
            if (reset) setPage(1);

        } catch (err) {
            console.error(err);
            setError('Could not find sets. Try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchSets(nextPage, false);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        // Trigger immediate search (bypass debounce wait if user hits enter)
        if (query.trim() && query !== debouncedQuery) {
            setDebouncedQuery(query);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pb-32 font-nunito">
            <header className="bg-lego-red px-4 py-4 shadow-lego-sm z-10 sticky top-0 flex flex-col gap-4">
                <div className="flex items-center gap-3 justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={onHome} className="bg-white/20 p-2 rounded-lg text-white hover:bg-white/30 transition-colors">
                            <Home size={20} />
                        </button>
                        <h1 className="text-2xl font-black text-white tracking-tight">Find a Set</h1>
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-white text-lego-red' : 'bg-white/20 text-white hover:bg-white/30'}`}
                    >
                        <Filter size={20} />
                    </button>
                </div>

                <form onSubmit={handleSearchSubmit} className="relative w-full">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="e.g. Star Wars X-Wing..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl border-4 border-black/10 focus:border-black/30 shadow-sm focus:outline-none focus:ring-0 font-bold text-gray-800 placeholder-gray-500 bg-white"
                    />
                    <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                    {loading && <Loader2 className="absolute right-4 top-3.5 animate-spin text-lego-blue" size={20} />}
                </form>

                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-white/10 rounded-xl p-3 flex flex-col gap-3 overflow-hidden"
                        >
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-white/80 uppercase">Show</label>
                                <div className="flex gap-2 bg-white/10 p-1 rounded-lg">
                                    <button
                                        onClick={() => setMinParts(10)}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${minParts === 10 ? 'bg-white text-lego-red shadow-sm' : 'text-white hover:bg-white/10'}`}
                                    >
                                        Sets Only ({'>'}10 pcs)
                                    </button>
                                    <button
                                        onClick={() => setMinParts(0)}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${minParts === 0 ? 'bg-white text-lego-red shadow-sm' : 'text-white hover:bg-white/10'}`}
                                    >
                                        All Items
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-white/80 uppercase">Sort By</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full bg-white text-gray-800 text-sm font-bold rounded-lg p-2 border-0 focus:ring-0 cursor-pointer"
                                >
                                    <option value="-num_parts">Biggest First (Most Parts)</option>
                                    <option value="num_parts">Smallest First</option>
                                    <option value="-year">Newest First</option>
                                    <option value="year">Oldest First</option>
                                </select>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            <main className="flex-1 p-4 overflow-y-auto">
                {error && (
                    <div className="bg-red-100 text-red-700 p-4 rounded-xl border-2 border-red-200 font-bold text-center mb-4">
                        {error}
                    </div>
                )}

                {results.length > 0 && (
                    <div className="flex justify-between items-center mb-4 px-2">
                        <p className="text-sm font-bold text-gray-500">Found {results.length}+ sets</p>
                    </div>
                )}

                {results.length === 0 && !loading && !error && (
                    <div className="text-center mt-20 opacity-50">
                        <Search size={64} className="mx-auto mb-4 text-gray-300" />
                        <p className="font-bold text-gray-400">Search for any Lego set</p>
                        <p className="text-sm text-gray-400 mt-2">Tap + to add to collection</p>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {results.map(set => (
                        <div key={set.set_id} className="h-full">
                            <BuildCard build={{
                                set_id: set.set_id,
                                name: set.name,
                                set_img_url: set.set_img_url,
                                set_url: set.set_url,
                                num_parts: set.parts_count || set.num_parts,
                                match_score: null // Explicitly null for search results to hide match meter
                            }} />
                        </div>
                    ))}
                </div>

                {results.length > 0 && hasMore && (
                    <div className="mt-8 flex justify-center">
                        <button
                            onClick={handleLoadMore}
                            disabled={loading}
                            className="bg-white border-2 border-gray-200 text-gray-600 hover:border-lego-blue hover:text-lego-blue px-6 py-3 rounded-xl font-bold shadow-sm transition-all flex items-center gap-2 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <ChevronDown size={20} />}
                            {loading ? 'Loading...' : 'Load More Results'}
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
