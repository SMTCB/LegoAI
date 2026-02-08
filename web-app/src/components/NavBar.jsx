import React from 'react';
import { Camera, Search, Trophy } from 'lucide-react';

export default function NavBar({ activeTab, onTabChange }) {
    return (
        <div className="fixed bottom-6 left-4 right-4 z-50 pb-safe pointer-events-none">
            <div className="bg-white rounded-full border-4 border-gray-900 shadow-lego-card p-2 flex justify-between items-center max-w-sm mx-auto pointer-events-auto">

                <TabButton
                    isActive={activeTab === 'builder'}
                    onClick={() => onTabChange('builder')}
                    icon={<Camera size={24} strokeWidth={2.5} />}
                    label="Builder"
                    activeColor="bg-lego-blue text-white"
                    inactiveColor="text-gray-400 hover:text-gray-600"
                />

                <TabButton
                    isActive={activeTab === 'explore'}
                    onClick={() => onTabChange('explore')}
                    icon={<Search size={24} strokeWidth={2.5} />}
                    label="Explore"
                    activeColor="bg-lego-red text-white"
                    inactiveColor="text-gray-400 hover:text-gray-600"
                />

                <TabButton
                    isActive={activeTab === 'collection'}
                    onClick={() => onTabChange('collection')}
                    icon={<Trophy size={24} strokeWidth={2.5} />}
                    label="Collection"
                    activeColor="bg-lego-yellow text-gray-900"
                    inactiveColor="text-gray-400 hover:text-gray-600"
                />

            </div>
        </div>
    );
}

function TabButton({ isActive, onClick, icon, label, activeColor, inactiveColor }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-black transition-all duration-200 ${isActive ? activeColor : inactiveColor}`}
        >
            {icon}
            {isActive && <span className="text-sm">{label}</span>}
        </button>
    );
}
