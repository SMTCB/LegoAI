import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
    const [parts, setParts] = useState([]);
    const [builds, setBuilds] = useState([]);
    const [scanStatus, setScanStatus] = useState('idle'); // idle, scanning, matching, upload_success, error
    const [error, setError] = useState(null);

    // Helper to aggregate parts (as per logic requirements)
    const addParts = (newParts) => {
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

    const removePart = (id) => {
        setParts(prev => prev.filter(p => p.id !== id));
    };

    const processImage = async (imageDataUrl) => {
        setScanStatus('scanning');
        setError(null);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || '/api/analyze';
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageDataUrl })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}`);
            }

            const data = await response.json();

            // Handle potential error returned from backend (e.g., parsing failure)
            if (data.error) {
                throw new Error(data.error);
            }

            // Backend returns: { identified_parts: [], suggested_builds: [] }
            // Must assign IDs to parts for React keys if not present (backend might not send unique IDs)
            const partsWithIds = (data.identified_parts || []).map(p => ({
                ...p,
                id: p.id || crypto.randomUUID() // Ensure unique ID for UI
            }));

            addParts(partsWithIds);
            setBuilds(data.suggested_builds || []);
            setScanStatus('success');

        } catch (err) {
            console.error("Scan Error:", err);
            setError(`Error: ${err.message || "Failed to process image"}. Check Vercel logs if persistent.`);
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
