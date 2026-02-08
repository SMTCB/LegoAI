import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
    const [parts, setParts] = useState([]); // This is now the Session List
    const [builds, setBuilds] = useState([]);
    const [scanStatus, setScanStatus] = useState('idle'); // idle, scanning, success, matching, matching_error
    const [error, setError] = useState(null);

    const [history, setHistory] = useState([]); // Array of arrays (past states)

    // Add new parts to the existing list (aggregating quantities)
    const addToSession = (newParts) => {
        setHistory(prev => [...prev, parts]); // Save current state before modifying
        setParts(prev => {
            const updated = [...prev];
            newParts.forEach(newPart => {
                // Fuzzy match based on Part Num + Color
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
        setScanStatus('idle'); // interactions reset status
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

    // Step 1: Analyze Image (Vision Only)
    const processImage = async (imageDataUrl) => {
        setScanStatus('scanning');
        setError(null);
        try {
            const apiUrl = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/analyze_image` : '/api/analyze_image';

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageDataUrl })
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

            addToSession(partsWithIds);
            setScanStatus('success'); // Ready for next scan

        } catch (err) {
            console.error("Scan Error:", err);
            setError(err.message);
            setScanStatus('error');
        }
    };

    // Step 2: Find Builds (Logic Only)
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
            processImage,
            findBuilds,
            clearSession,
            undoLastScan,
            resetScan,
            removePart
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    return useContext(AppContext);
}
