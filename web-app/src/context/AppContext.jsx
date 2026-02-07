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
            // Mock API call structure for now
            // const response = await fetch(import.meta.env.VITE_N8N_WEBHOOK_URL, {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify({ image: imageDataUrl })
            // });
            // const data = await response.json();

            // Simulating a delay and success for UI dev
            await new Promise(r => setTimeout(r, 2000));

            // Mock data response based on specs logic
            const mockResult = {
                scan_id: "mock-scan-123",
                identified_parts: [
                    { id: crypto.randomUUID(), part_num: "3001", color_id: 15, name: "Brick 2x4", quantity: 3, img_url: "https://rebrickable.com/media/parts/elements/300126.jpg" }
                ],
                suggested_builds: [
                    { set_id: "60000", name: "Fire Motorcycle", match_score: 92.5, num_parts: 40, set_img_url: "https://images.brickset.com/sets/images/60000-1.jpg", set_url: "#" },
                    { set_id: "30012", name: "Microlight", match_score: 88.0, num_parts: 35, set_img_url: "https://images.brickset.com/sets/images/30012-1.jpg", set_url: "#" },
                    { set_id: "40000", name: "Cool Robot", match_score: 75.0, num_parts: 120, set_img_url: "https://images.brickset.com/sets/images/40000-1.jpg", set_url: "#" }
                ]
            };

            addParts(mockResult.identified_parts);
            setBuilds(mockResult.suggested_builds);
            setScanStatus('success');

        } catch (err) {
            console.error(err);
            setError("Failed to process image. Please try again.");
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
