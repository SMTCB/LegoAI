import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw } from 'lucide-react';

export default function CameraCapture({ onCapture }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsStreaming(true);
            }
        } catch (err) {
            setError("Camera access denied or not available. " + err.message);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            setIsStreaming(false);
        }
    };

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            const { videoWidth, videoHeight } = videoRef.current;

            // Calculate scale to fit within max dimension (e.g., 1024px)
            const MAX_SIZE = 1024;
            let width = videoWidth;
            let height = videoHeight;

            if (width > height) {
                if (width > MAX_SIZE) {
                    height *= MAX_SIZE / width;
                    width = MAX_SIZE;
                }
            } else {
                if (height > MAX_SIZE) {
                    width *= MAX_SIZE / height;
                    height = MAX_SIZE;
                }
            }

            canvasRef.current.width = width;
            canvasRef.current.height = height;
            context.drawImage(videoRef.current, 0, 0, width, height);

            // Compress to JPEG with 0.8 quality
            const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
            onCapture(dataUrl);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 w-full h-full bg-gray-900 text-white">
            {error ? (
                <div className="text-red-500 p-4 border border-red-500 rounded bg-red-900/20">
                    <p>{error}</p>
                    <button onClick={startCamera} className="mt-4 px-4 py-2 bg-red-600 rounded flex items-center gap-2">
                        <RefreshCw size={18} /> Retry
                    </button>
                </div>
            ) : (
                <div className="relative w-full max-w-md aspect-[3/4] bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-700">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                        <button
                            onClick={takePhoto}
                            className="w-20 h-20 rounded-full border-4 border-white bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 active:scale-95 transition-all"
                            aria-label="Take Photo"
                        >
                            <div className="w-16 h-16 bg-white rounded-full shadow-lg" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
