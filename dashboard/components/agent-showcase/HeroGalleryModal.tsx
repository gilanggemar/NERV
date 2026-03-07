'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Check, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeroCropModal } from './HeroCropModal';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface HeroImage {
    id: number;
    imageData: string;
    sortOrder: number;
}

interface HeroGalleryModalProps {
    agentId: string;
    agentName: string;
    agentColor: string;
    images: HeroImage[];
    activeIndex: number;
    onSelectImage: (index: number) => void;
    onImageAdded: () => void;
    onImageDeleted: () => void;
    onClose: () => void;
}

async function uploadHeroImage(agentId: string, file: File): Promise<boolean> {
    const formData = new FormData();
    formData.append('agentId', agentId);
    formData.append('heroImage', file);
    const res = await fetch('/api/agents/hero', { method: 'POST', body: formData });
    const data = await res.json();
    return !!data.success;
}

async function deleteHeroImage(imageId: number, agentId: string): Promise<boolean> {
    const res = await fetch('/api/agents/hero', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId, agentId }),
    });
    const data = await res.json();
    return !!data.success;
}

export function HeroGalleryModal({
    agentId,
    agentName,
    agentColor,
    images,
    activeIndex,
    onSelectImage,
    onImageAdded,
    onImageDeleted,
    onClose,
}: HeroGalleryModalProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setPendingFile(file);
        if (inputRef.current) inputRef.current.value = '';
    };

    const handleCropApply = async (file: File) => {
        setIsUploading(true);
        try {
            await uploadHeroImage(agentId, file);
            onImageAdded();
        } finally {
            setIsUploading(false);
            setPendingFile(null);
        }
    };

    const handleDelete = async (img: HeroImage) => {
        setDeletingId(img.id);
        try {
            await deleteHeroImage(img.id, agentId);
            onImageDeleted();
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <>
            <Dialog open onOpenChange={() => !isUploading && onClose()}>
                <DialogContent className="max-w-2xl nerv-glass-3 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-[11px] uppercase tracking-[0.2em] font-mono text-white/70">
                            {agentName} — Portrait Gallery
                        </DialogTitle>
                        <p className="text-xs text-white/40 mt-1">
                            Select a portrait to display, or add a new one.
                        </p>
                    </DialogHeader>

                    <div className="mt-4">
                        {/* Grid of images */}
                        <div className="grid grid-cols-4 gap-3">
                            {images.map((img, idx) => {
                                const isActive = idx === activeIndex;
                                const isDeleting = deletingId === img.id;

                                return (
                                    <motion.div
                                        key={img.id}
                                        className="relative group aspect-[3/4] rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-200"
                                        style={{
                                            borderColor: isActive ? agentColor : 'rgba(255,255,255,0.08)',
                                            boxShadow: isActive ? `0 0 16px ${agentColor}40` : 'none',
                                        }}
                                        onClick={() => {
                                            onSelectImage(idx);
                                        }}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        <img
                                            src={img.imageData}
                                            alt={`Portrait ${idx + 1}`}
                                            className="w-full h-full object-cover object-top"
                                        />

                                        {/* Active check */}
                                        {isActive && (
                                            <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                                                style={{ background: agentColor }}
                                            >
                                                <Check size={12} className="text-black" />
                                            </div>
                                        )}

                                        {/* Delete button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(img);
                                            }}
                                            disabled={isDeleting}
                                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full
                                                bg-black/70 flex items-center justify-center
                                                opacity-0 group-hover:opacity-100 transition-opacity
                                                hover:bg-red-900/80 cursor-pointer pointer-events-auto"
                                        >
                                            {isDeleting ? (
                                                <Loader2 size={12} className="animate-spin text-white/60" />
                                            ) : (
                                                <Trash2 size={12} className="text-red-400" />
                                            )}
                                        </button>

                                        {/* Hover overlay */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none" />
                                    </motion.div>
                                );
                            })}

                            {/* Add new image button */}
                            <motion.button
                                onClick={() => inputRef.current?.click()}
                                disabled={isUploading}
                                className="aspect-[3/4] rounded-lg border-2 border-dashed border-white/15
                                    flex flex-col items-center justify-center gap-2
                                    hover:border-white/30 hover:bg-white/5 transition-all cursor-pointer
                                    disabled:opacity-50 pointer-events-auto"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                {isUploading ? (
                                    <Loader2 size={24} className="text-white/40 animate-spin" />
                                ) : (
                                    <Plus size={24} className="text-white/40" />
                                )}
                                <span className="text-[10px] font-mono uppercase tracking-wider text-white/30">
                                    {isUploading ? 'Uploading...' : 'Add'}
                                </span>
                            </motion.button>
                        </div>

                        {images.length === 0 && (
                            <p className="text-center text-white/30 text-sm mt-4 font-mono">
                                No portraits yet. Click + to add one.
                            </p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Hidden file input */}
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />

            {/* Crop modal after file selection */}
            {pendingFile && (
                <HeroCropModal
                    file={pendingFile}
                    agentId={agentId}
                    onClose={() => setPendingFile(null)}
                    onApply={handleCropApply}
                />
            )}
        </>
    );
}
