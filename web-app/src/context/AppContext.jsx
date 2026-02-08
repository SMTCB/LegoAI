import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AppContext = createContext();

export function AppProvider({ children }) {
    // --- Builder State ---
    const [parts, setParts] = useState([]);
    const [builds, setBuilds] = useState([]);
    const [scanStatus, setScanStatus] = useState('idle');
    const [error, setError] = useState(null);
    const [history, setHistory] = useState([]);

    // --- Batch State ---
    const [currentBatchImages, setCurrentBatchImages] = useState([]);
    const [currentBatchResults, setCurrentBatchResults] = useState([]);

    // --- Collection State (Supabase) ---
    const [myKits, setMyKits] = useState([]);
    const [loadingKits, setLoadingKits] = useState(false);

    // Initial Load of Kits
    useEffect(() => {
        fetchKits();
    }, []);

    const fetchKits = async () => {
        setLoadingKits(true);
        const { data, error } = await supabase
            .from('user_kits')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) console.error('Error fetching kits:', error);
        else setMyKits(data || []);
        setLoadingKits(false);
    };

    const addKitToCollection = async (kit) => {
        // Optimistic UI update
        const newKit = {
            set_id: kit.set_id || kit.set_num, // Rebrickable sometimes uses set_num
            set_name: kit.name,
            set_img_url: kit.set_img_url,
            status: 'todo',
            created_at: new Date().toISOString()
        };

        setMyKits(prev => [newKit, ...prev]);

        // Supabase Insert
        const { error } = await supabase
            .from('user_kits')
            .insert([{
                set_id: newKit.set_id,
                set_name: newKit.set_name,
                set_img_url: newKit.set_img_url,
                status: 'todo'
            }]);

        if (error) {
            console.error('Error adding kit:', error);
            // Revert optimistic update? Or just show error toast. For MVP console log is enough.
        } else {
            fetchKits(); // Refresh to get real ID
        }
    };

    const updateKitStatus = async (id, status) => {
        setMyKits(prev => prev.map(k => k.id === id ? { ...k, status } : k));

        const { error } = await supabase
            .from('user_kits')
            .update({ status })
            .eq('id', id);

        if (error) console.error('Error updating status:', error);
    };

    const deleteKit = async (id) => {
        setMyKits(prev => prev.filter(k => k.id !== id));

        const { error } = await supabase
            .from('user_kits')
            .delete()
            .eq('id', id);

        if (error) console.error('Error deleting kit:', error);
    };


    // --- Builder Logic ---

    const addToSession = (newParts) => {
        setHistory(prev => [...prev, parts]);
        setParts(prev => {
            const updated = [...prev];
            newParts.forEach(newPart => {
                const index = updated.findIndex(p => p.part_num === newPart.part_num && p.color_id === newPart.color_id);
                if (index >= 0) {
                    updated[index] = { ...updated[index], quantity: updated[index].quantity + newPart.quantity };
                } else {
                    updated.push(newPart);
                }
            });
            return updated;
        });
    };

    const undoLastScan = () => {
        if (history.length === 0) return;
        const previousState = history[history.length - 1];
        setParts(previousState);
        setHistory(prev => prev.slice(0, -1));
        setScanStatus('idle');
    };

    const removePart = (id) => {
        setParts(prev => prev.filter(p => p.id !== id));
    };

    const clearSession = () => {
        setParts([]);
        setBuilds([]);
        setScanStatus('idle');
        setError(null);
    };

    const addToBatch = (imageDataUrl) => {
        setCurrentBatchImages(prev => [...prev, imageDataUrl]);
    };

    const removeImageFromBatch = (index) => {
        setCurrentBatchImages(prev => prev.filter((_, i) => i !== index));
    };

    const clearCurrentBatch = () => {
        setCurrentBatchImages([]);
        setCurrentBatchResults([]);
        setScanStatus('idle');
    };

    const analyzeBatch = async () => {
        if (currentBatchImages.length === 0) return;

        setScanStatus('scanning');
        setError(null);
        try {
            const apiUrl = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/analyze_image` : '/api/analyze_image';

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ images: currentBatchImages })
            });

            if (!response.ok) {
                throw new Error(`Scan Failed: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            const partsWithIds = (data.identified_parts || []).map(p => ({
                ...p,
                id: crypto.randomUUID()
            }));

            setCurrentBatchResults(partsWithIds);
            setScanStatus('review');

        } catch (err) {
            console.error("Scan Error:", err);
            setError(err.message);
            setScanStatus('error');
        }
    };

    const commitBatch = () => {
        addToSession(currentBatchResults);
        clearCurrentBatch();
        setScanStatus('idle');
    };

    const findBuilds = async () => {
        if (parts.length === 0) return;

        setScanStatus('matching');
        setError(null);
        try {
            const apiUrl = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/find_builds` : '/api/find_builds';

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ parts })
            });

            if (!response.ok) throw new Error("Matching Failed");

            const data = await response.json();
            setBuilds(data.suggested_builds || []);
            setScanStatus('matching_success');

        } catch (err) {
            console.error("Matching Error:", err);
            setError(err.message);
            setScanStatus('error');
        }
    };

    const resetScan = () => {
        setScanStatus('idle');
        setError(null);
    };

    return (
        <AppContext.Provider value={{
            parts,
            builds,
            scanStatus,
            error,
            processImage: analyzeBatch,
            addToBatch,
            removeImageFromBatch,
            analyzeBatch,
            commitBatch,
            clearCurrentBatch,
            currentBatchImages,
            currentBatchResults,
            findBuilds,
            clearSession,
            undoLastScan,
            resetScan,
            removePart,
            // Collection
            myKits,
            loadingKits,
            addKitToCollection,
            updateKitStatus,
            deleteKit
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    return useContext(AppContext);
}
