
import React, { useState, useEffect, useRef } from 'react';

interface ImageViewerModalProps {
    src: string;
    onClose: () => void;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ src, onClose }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const imageRef = useRef<HTMLImageElement>(null);
    const isDragging = useRef(false);
    const startPos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    useEffect(() => {
        if (scale === 1) setPosition({ x: 0, y: 0 });
        if (imageRef.current) {
            imageRef.current.style.cursor = scale > 1 ? 'grab' : 'zoom-in';
        }
    }, [scale]);

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const newScale = scale - e.deltaY * 0.001;
        setScale(Math.min(Math.max(1, newScale), 5));
    };

    const startDrag = (clientX: number, clientY: number) => {
        if (scale > 1) {
            isDragging.current = true;
            startPos.current = { x: clientX - position.x, y: clientY - position.y };
            if (imageRef.current) imageRef.current.style.cursor = 'grabbing';
        }
    };

    const doDrag = (clientX: number, clientY: number) => {
        if (isDragging.current) {
            setPosition({ x: clientX - startPos.current.x, y: clientY - startPos.current.y });
        }
    };

    const endDrag = () => {
        isDragging.current = false;
        if (imageRef.current) {
            imageRef.current.style.cursor = scale > 1 ? 'grab' : 'zoom-in';
        }
    };

    const handleSingleClick = () => {
        if (scale === 1) {
            setScale(2);
        } else {
            setScale(1);
        }
    };
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onMouseMove={(e) => doDrag(e.clientX, e.clientY)} onMouseUp={endDrag} onMouseLeave={endDrag}>
            <div className="absolute inset-0 bg-black bg-opacity-80 cursor-pointer" onClick={onClose}></div>
            <button className="absolute top-4 right-4 text-white text-4xl font-bold z-50 hover:text-gray-300" onClick={onClose}>&times;</button>
            <div className="relative z-50 w-[90%] h-[90%] flex items-center justify-center">
                <img
                    ref={imageRef}
                    src={src}
                    alt="Medical Record Preview"
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-transform duration-100 ease-out"
                    style={{ transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)` }}
                    onWheel={handleWheel}
                    onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
                    onClick={scale <= 1 ? handleSingleClick : undefined}
                />
            </div>
        </div>
    );
};

export default ImageViewerModal;
