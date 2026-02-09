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
        <div className="relative w-full h-full bg-black overflow-hidden">
            {error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-gray-900">
                    <p className="text-red-400 font-bold mb-4">{error}</p>
                    <button onClick={startCamera} className="px-6 py-3 bg-lego-red text-white rounded-xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-transform">
                        <RefreshCw size={20} /> Retry Camera
                    </button>
                </div>
            ) : (
                <>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Shutter Button - Floating Bottom Center */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
                        <button
                            onClick={takePhoto}
                            className="w-16 h-16 rounded-full border-4 border-white bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/30 active:scale-95 transition-all shadow-lego-sm"
                            aria-label="Take Photo"
                        >
                            <div className="w-12 h-12 bg-white rounded-full shadow-inner" />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
