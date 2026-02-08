import React from 'react';
import { Camera, Search, Trophy, ArrowRight } from 'lucide-react';

export default function WelcomeView({ onNavigate }) {
    return (
        <div className="min-h-screen bg-lego-yellow flex flex-col p-6 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                backgroundImage: 'radial-gradient(#000 2px, transparent 2px)',
                backgroundSize: '24px 24px'
            }}></div>

            <header className="flex flex-col items-center mt-12 mb-12 z-10">
                <div className="w-24 h-24 bg-white rounded-3xl shadow-lego-card flex items-center justify-center mb-6 rotate-3 transform hover:rotate-6 transition-transform">
                    <img src="/logo.svg" alt="App Logo" className="w-16 h-16" />
                </div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight text-center">
                    Master Builder
                    <span className="block text-lego-red">AI</span>
                </h1>
                <p className="text-gray-700 font-bold mt-2 opacity-80">Identify parts. Find sets. Build.</p>
            </header>

            <main className="flex-1 flex flex-col gap-4 max-w-md mx-auto w-full z-10">

                <button
                    onClick={() => onNavigate('builder')}
                    className="group relative bg-white p-6 rounded-2xl shadow-lego-card border-2 border-gray-900 hover:translate-y-[-4px] active:translate-y-[2px] active:shadow-none transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                            <Camera size={28} strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 text-left">
                            <h2 className="text-xl font-black text-gray-900">Identify Parts</h2>
                            <p className="text-sm text-gray-500 font-bold">Scan piles & find bricks</p>
                        </div>
                        <ArrowRight className="text-gray-300 group-hover:text-blue-600 transition-colors" />
                    </div>
                </button>

                <button
                    onClick={() => onNavigate('explore')}
                    className="group relative bg-white p-6 rounded-2xl shadow-lego-card border-2 border-gray-900 hover:translate-y-[-4px] active:translate-y-[2px] active:shadow-none transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                            <Search size={28} strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 text-left">
                            <h2 className="text-xl font-black text-gray-900">Find Sets</h2>
                            <p className="text-sm text-gray-500 font-bold">Search via description</p>
                        </div>
                        <ArrowRight className="text-gray-300 group-hover:text-red-600 transition-colors" />
                    </div>
                </button>

                <button
                    onClick={() => onNavigate('collection')}
                    className="group relative bg-white p-6 rounded-2xl shadow-lego-card border-2 border-gray-900 hover:translate-y-[-4px] active:translate-y-[2px] active:shadow-none transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-yellow-600 group-hover:scale-110 transition-transform">
                            <Trophy size={28} strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 text-left">
                            <h2 className="text-xl font-black text-gray-900">My Collection</h2>
                            <p className="text-sm text-gray-500 font-bold">Track your builds</p>
                        </div>
                        <ArrowRight className="text-gray-300 group-hover:text-yellow-600 transition-colors" />
                    </div>
                </button>

            </main>

            <footer className="text-center text-xs font-bold text-gray-500 py-6 opacity-60">
                v2.0 • Made with AI
            </footer>
        </div>
    );
}
