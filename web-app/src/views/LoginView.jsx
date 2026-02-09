import React, { useState } from 'react';
import { Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function LoginView() {
    const { login, error } = useApp();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError(null);
        setLoading(true);

        try {
            await login(username, password);
        } catch (err) {
            setLocalError('Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-lego-yellow flex flex-col items-center justify-center p-6 relative overflow-hidden font-nunito">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                backgroundImage: 'radial-gradient(#000 2px, transparent 2px)',
                backgroundSize: '24px 24px'
            }}></div>

            <div className="bg-white p-8 rounded-2xl shadow-lego-card border-2 border-gray-900 w-full max-w-md z-10 relative">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-lego-red rounded-xl flex items-center justify-center mb-4 transform rotate-3 shadow-sm">
                        <Lock className="text-white" size={32} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Master Builder AI</h1>
                    <p className="text-gray-500 font-bold text-sm">Restricted Access</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-black text-gray-700 uppercase mb-1">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-black focus:outline-none font-bold text-gray-800 transition-colors"
                            placeholder="Enter username"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-gray-700 uppercase mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-black focus:outline-none font-bold text-gray-800 transition-colors"
                            placeholder="Enter password"
                        />
                    </div>

                    {(localError || error) && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold flex items-center gap-2">
                            <AlertCircle size={16} />
                            {localError || error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black text-white py-4 rounded-xl font-black text-lg shadow-lg hover:bg-gray-800 transform active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? 'Verifying...' : 'Unlock'}
                        {!loading && <ArrowRight size={20} />}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-400 font-bold">Personal use only</p>
                </div>
            </div>
        </div>
    );
}
