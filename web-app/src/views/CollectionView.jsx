import React from 'react';
import { Trash2, Check, Clock, Package, Home } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function CollectionView({ onHome }) {
    const { myKits, loadingKits, updateKitStatus, deleteKit } = useApp();

    const activeKits = myKits.filter(k => k.status !== 'done');
    const doneKits = myKits.filter(k => k.status === 'done');

    const KitCard = ({ kit }) => (
        <div className="bg-white p-4 rounded-xl border-2 border-gray-100 shadow-sm flex gap-4 items-center group relative overflow-hidden">
            <div className="w-20 h-20 bg-gray-50 rounded-lg flex items-center justify-center p-2 flex-shrink-0">
                <img src={kit.set_img_url} className="max-w-full max-h-full object-contain" />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-black text-gray-900 leading-tight truncate">{kit.set_name || 'Unknown Set'}</h3>
                <p className="text-xs text-gray-500 font-bold mb-2">Set #{kit.set_id}</p>

                <div className="flex gap-2">
                    {kit.status !== 'done' ? (
                        <button
                            onClick={() => updateKitStatus(kit.id, 'done')}
                            className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-green-200"
                        >
                            <Check size={12} strokeWidth={3} /> Mark Done
                        </button>
                    ) : (
                        <button
                            onClick={() => updateKitStatus(kit.id, 'wip')}
                            className="bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-yellow-200"
                        >
                            <Clock size={12} strokeWidth={3} /> Mark WIP
                        </button>
                    )}

                    <button
                        onClick={() => deleteKit(kit.id)}
                        className="bg-red-50 text-red-500 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100"
                    >
                        <Trash2 size={12} strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pb-24 font-nunito">
            <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10 flex items-center gap-3">
                <button onClick={onHome} className="bg-gray-100 p-2 rounded-lg text-gray-800 hover:bg-gray-200">
                    <Home size={20} />
                </button>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">My Collection</h1>
            </header>

            <main className="flex-1 p-4 space-y-8 overflow-y-auto">

                {loadingKits && (
                    <div className="animate-pulse space-y-4">
                        <div className="h-24 bg-gray-200 rounded-xl"></div>
                        <div className="h-24 bg-gray-200 rounded-xl"></div>
                    </div>
                )}

                {!loadingKits && myKits.length === 0 && (
                    <div className="text-center mt-20 opacity-50">
                        <Package size={64} className="mx-auto mb-4 text-gray-300" />
                        <p className="font-bold text-gray-400">Your collection is empty.</p>
                        <p className="text-sm text-gray-400">Scan bricks or search sets to add some!</p>
                    </div>
                )}

                {/* WIP Section */}
                {activeKits.length > 0 && (
                    <section>
                        <h2 className="text-lg font-black text-lego-yellow mb-3 flex items-center gap-2">
                            <Clock size={20} /> Work in Progress
                        </h2>
                        <div className="space-y-3">
                            {activeKits.map(kit => <KitCard key={kit.id} kit={kit} />)}
                        </div>
                    </section>
                )}

                {/* Done Section */}
                {doneKits.length > 0 && (
                    <section>
                        <h2 className="text-lg font-black text-green-600 mb-3 flex items-center gap-2">
                            <Check size={20} /> Completed
                        </h2>
                        <div className="space-y-3 opacity-80">
                            {doneKits.map(kit => <KitCard key={kit.id} kit={kit} />)}
                        </div>
                    </section>
                )}

            </main>
        </div>
    );
}
