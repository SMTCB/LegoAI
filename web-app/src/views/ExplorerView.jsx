import React, { useState } from 'react';
import { Search, Loader2, Home } from 'lucide-react';
import { useApp } from '../context/AppContext';
import BuildCard from '../components/BuildCard';

export default function ExplorerView({ onHome }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError(null);
        setResults([]);

        try {
            // Robust API URL construction
            const baseUrl = import.meta.env.VITE_API_URL || '/api';
            const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
            // If we are using the Vercel/Node API, it's just /api/search_sets
            // We don't need to replace analyze_image, just construct correctly.
            const apiUrl = `${cleanBase}/search_sets?query=${encodeURIComponent(query)}`;

            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Failed to fetch sets');

            const data = await response.json();
            setResults(data.results || []);
        } catch (err) {
            console.error(err);
            setError('Could not find sets. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pb-32 font-nunito">
            <header className="bg-lego-red px-4 py-4 shadow-lego-sm z-10 sticky top-0 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <button onClick={onHome} className="bg-white/20 p-2 rounded-lg text-white hover:bg-white/30 transition-colors">
                        <Home size={20} />
                    </button>
                    <h1 className="text-2xl font-black text-white tracking-tight">Find a Set</h1>
                </div>

                <form onSubmit={handleSearch} className="relative w-full">
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
            </header>

            <main className="flex-1 p-4 overflow-y-auto">
                {error && (
                    <div className="bg-red-100 text-red-700 p-4 rounded-xl border-2 border-red-200 font-bold text-center mb-4">
                        {error}
                    </div>
                )}

                {results.length > 0 && (
                    <p className="text-sm font-bold text-gray-500 mb-4 px-2">Found {results.length} sets</p>
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
            </main>
        </div>
    );
}
