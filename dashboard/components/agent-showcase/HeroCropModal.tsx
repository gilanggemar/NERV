'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface HeroCropModalProps {
    file: File;
    agentId: string;
    onClose: () => void;
    onApply: (file: File) => Promise<void>;
}

export function HeroCropModal({ file, agentId, onClose, onApply }: HeroCropModalProps) {
    const [crop, setCrop] = useState<Crop>({
        unit: '%',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
    });
    const [imageSrc, setImageSrc] = useState<string>('');
    const [isApplying, setIsApplying] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    // Convert file to object URL on mount
    useEffect(() => {
        const url = URL.createObjectURL(file);
        setImageSrc(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    // "Use Full Image" — skip cropping, upload raw file
    const handleSkipCrop = useCallback(async () => {
        setIsApplying(true);
        try {
            await onApply(file);
        } finally {
            setIsApplying(false);
            onClose();
        }
    }, [file, onApply, onClose]);

    // Apply crop: draw onto canvas, export as Blob
    const handleApplyCrop = useCallback(async () => {
        if (!imgRef.current) return;
        setIsApplying(true);

        try {
            const img = imgRef.current;
            const canvas = document.createElement('canvas');

            const cropWidth = (crop.width / 100) * img.naturalWidth;
            const cropHeight = (crop.height / 100) * img.naturalHeight;
            const cropX = (crop.x / 100) * img.naturalWidth;
            const cropY = (crop.y / 100) * img.naturalHeight;

            canvas.width = cropWidth;
            canvas.height = cropHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.drawImage(
                img,
                cropX,
                cropY,
                cropWidth,
                cropHeight,
                0, 0,
                cropWidth,
                cropHeight
            );

            canvas.toBlob(async (blob) => {
                if (!blob) return;
                const croppedFile = new File([blob], 'hero-cropped.png', { type: 'image/png' });
                await onApply(croppedFile);
                setIsApplying(false);
                onClose();
            }, 'image/png', 1.0);
        } catch {
            setIsApplying(false);
        }
    }, [crop, onApply, onClose]);

    return (
        <Dialog open onOpenChange={() => !isApplying && onClose()}>
            <DialogContent className="max-w-2xl nerv-glass-3 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle className="text-[11px] uppercase tracking-[0.2em] font-mono text-white/70">
                        Adjust Hero Portrait
                    </DialogTitle>
                    <p className="text-xs text-white/40 mt-1">
                        Drag to crop, or use the full image as-is.
                    </p>
                </DialogHeader>

                <div className="overflow-auto max-h-[60vh] rounded-md mt-3">
                    {imageSrc && (
                        <ReactCrop
                            crop={crop}
                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                        >
                            <img
                                ref={imgRef}
                                src={imageSrc}
                                style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }}
                                alt="Hero preview"
                            />
                        </ReactCrop>
                    )}
                </div>

                <div className="flex gap-3 justify-end mt-4">
                    <button
                        onClick={onClose}
                        disabled={isApplying}
                        className="px-4 py-2 rounded-lg text-xs font-mono tracking-wider uppercase
                            text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer
                            disabled:opacity-50 pointer-events-auto"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSkipCrop}
                        disabled={isApplying}
                        className="px-4 py-2 rounded-lg text-xs font-mono tracking-wider uppercase
                            bg-white/10 border border-white/15 text-white/80
                            hover:bg-white/15 transition-colors cursor-pointer
                            disabled:opacity-50 pointer-events-auto"
                    >
                        {isApplying ? 'Uploading...' : 'Use Full Image'}
                    </button>
                    <button
                        onClick={handleApplyCrop}
                        disabled={isApplying}
                        className="px-4 py-2 rounded-lg text-xs font-mono tracking-wider uppercase
                            text-[#080706] font-bold cursor-pointer
                            hover:brightness-110 transition-all
                            disabled:opacity-50 pointer-events-auto"
                        style={{ background: 'var(--accent-base, #FF6D29)' }}
                    >
                        {isApplying ? 'Cropping...' : 'Apply Crop'}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
