import React from 'react';
import { useApp } from '../context/AppContext';

export default function CollectionView() {
    const { myKits, loadingKits, updateKitStatus, deleteKit } = useApp();

    const activeKits = myKits.filter(k => k.status === 'todo');
    const doneKits = myKits.filter(k => k.status === 'done');

    if (loadingKits) return <div className="p-4">Loading collection...</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
            <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
                <h1 className="text-2xl font-bold text-gray-900">My Collection</h1>
            </header>

            <main className="flex-1 p-4 space-y-6 overflow-y-auto">

                {/* Active Section */}
                <section>
                    <h2 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                        Work in Progress
                    </h2>
                    {activeKits.length === 0 ? (
                        <div className="bg-white rounded-xl p-6 text-center text-gray-400 border border-gray-100 border-dashed">
                            No active builds. Go find some!
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activeKits.map(kit => (
                                <div key={kit.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex gap-3">
                                    <img src={kit.set_img_url} className="w-20 h-20 object-contain bg-gray-50 rounded-lg" />
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 className="font-bold text-gray-900 line-clamp-2">{kit.set_name}</h3>
                                            <p className="text-xs text-gray-500">{kit.set_id}</p>
                                        </div>
                                        <div className="flex justify-end gap-2 mt-2">
                                            <button
                                                onClick={() => deleteKit(kit.id)}
                                                className="text-xs text-red-400 font-medium px-2 py-1"
                                            >
                                                Give Up
                                            </button>
                                            <button
                                                onClick={() => updateKitStatus(kit.id, 'done')}
                                                className="text-xs bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full"
                                            >
                                                Mark Done
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Done Section */}
                <section>
                    <h2 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Completed
                    </h2>
                    {doneKits.length === 0 ? (
                        <p className="text-sm text-gray-400 italic ml-4">No completed sets yet.</p>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {doneKits.map(kit => (
                                <div key={kit.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 opacity-75">
                                    <img src={kit.set_img_url} className="w-full h-24 object-contain mb-2" />
                                    <h3 className="text-xs font-bold text-gray-900 truncate">{kit.set_name}</h3>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-[10px] text-green-600 font-bold">Done</span>
                                        <button onClick={() => deleteKit(kit.id)} className="text-[10px] text-gray-400">×</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

            </main>
        </div>
    );
}
