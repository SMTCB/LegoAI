import React from 'react';
import { Camera, Search, Trophy } from 'lucide-react';

export default function NavBar({ activeTab, onTabChange }) {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            <div className="flex justify-around items-center h-16">
                <button
                    onClick={() => onTabChange('builder')}
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${activeTab === 'builder' ? 'text-lego-blue' : 'text-gray-400'}`}
                >
                    <Camera size={24} strokeWidth={activeTab === 'builder' ? 2.5 : 2} />
                    <span className="text-[10px] font-bold">Builder</span>
                </button>

                <button
                    onClick={() => onTabChange('explore')}
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${activeTab === 'explore' ? 'text-lego-red' : 'text-gray-400'}`}
                >
                    <Search size={24} strokeWidth={activeTab === 'explore' ? 2.5 : 2} />
                    <span className="text-[10px] font-bold">Explore</span>
                </button>

                <button
                    onClick={() => onTabChange('collection')}
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${activeTab === 'collection' ? 'text-lego-yellow' : 'text-gray-400'}`}
                >
                    <Trophy size={24} strokeWidth={activeTab === 'collection' ? 2.5 : 2} />
                    <span className="text-[10px] font-bold">Collection</span>
                </button>
            </div>
        </div>
    );
}
