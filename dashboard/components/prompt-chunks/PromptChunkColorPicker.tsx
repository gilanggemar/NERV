'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Props {
    color: string;
    onChange: (color: string) => void;
}

const PRESET_COLORS = [
    '#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4',
    '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280', '#FFFFFF'
];

function hsvToHex(h: number, s: number, v: number): string {
    const f = (n: number) => {
        const k = (n + h / 60) % 6;
        return v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
    };
    const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
    return `#${toHex(f(5))}${toHex(f(3))}${toHex(f(1))}`;
}

function hexToHsv(hex: string): { h: number; s: number; v: number } {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
        if (max === r) h = 60 * (((g - b) / d) % 6);
        else if (max === g) h = 60 * ((b - r) / d + 2);
        else h = 60 * ((r - g) / d + 4);
    }
    if (h < 0) h += 360;
    const s = max === 0 ? 0 : d / max;
    return { h, s, v: max };
}

export function PromptChunkColorPicker({ color, onChange }: Props) {
    const [{ h, s, v }, setHsv] = useState(() => {
        try {
            return hexToHsv(color.length === 7 ? color : '#6B7280');
        } catch {
            return { h: 0, s: 0, v: 0.5 };
        }
    });

    // Sync external changes
    useEffect(() => {
        if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
            const newHsv = hexToHsv(color);
            setHsv(newHsv);
        }
    }, [color]);

    const handleHsvChange = (newH: number, newS: number, newV: number) => {
        setHsv({ h: newH, s: newS, v: newV });
        onChange(hsvToHex(newH, newS, newV));
    };

    // Pad drag logic
    const padRef = useRef<HTMLDivElement>(null);
    const handlePadInteraction = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        if (!padRef.current) return;
        const rect = padRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        let x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        let y = Math.max(0, Math.min(clientY - rect.top, rect.height));

        const newS = x / rect.width;
        const newV = 1 - (y / rect.height);
        handleHsvChange(h, newS, newV);
    };

    const startPadDrag = (e: React.MouseEvent | React.TouchEvent) => {
        handlePadInteraction(e);
        const onMove = (e: MouseEvent | TouchEvent) => handlePadInteraction(e);
        const onEnd = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onEnd);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
    };

    // Slider drag logic
    const sliderRef = useRef<HTMLDivElement>(null);
    const handleSliderInteraction = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        if (!sliderRef.current) return;
        const rect = sliderRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        let x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const newH = (x / rect.width) * 360;
        handleHsvChange(newH, s, v);
    };

    const startSliderDrag = (e: React.MouseEvent | React.TouchEvent) => {
        handleSliderInteraction(e);
        const onMove = (e: MouseEvent | TouchEvent) => handleSliderInteraction(e);
        const onEnd = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onEnd);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
    };

    return (
        <div className="flex flex-col gap-3">
            {/* Saturation/Brightness Pad */}
            <div
                ref={padRef}
                onMouseDown={startPadDrag}
                onTouchStart={startPadDrag}
                className="w-full h-[140px] rounded-md relative cursor-crosshair overflow-hidden touch-none"
                style={{ backgroundColor: `hsl(${Math.round(h)}, 100%, 50%)` }}
            >
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #fff, transparent)' }} />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #000, transparent)' }} />
                <div
                    className="absolute w-3 h-3 -ml-1.5 -mt-1.5 border-2 border-white rounded-full pointer-events-none shadow"
                    style={{
                        left: `${s * 100}%`,
                        top: `${(1 - v) * 100}%`
                    }}
                />
            </div>

            {/* Hue Slider */}
            <div
                ref={sliderRef}
                onMouseDown={startSliderDrag}
                onTouchStart={startSliderDrag}
                className="w-full h-3 rounded-full relative cursor-ew-resize touch-none"
                style={{ background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)' }}
            >
                <div
                    className="absolute w-4 h-4 -ml-2 top-1/2 -translate-y-1/2 bg-white rounded-full pointer-events-none shadow"
                    style={{ left: `${(h / 360) * 100}%` }}
                />
            </div>

            {/* Hex Input & Preset Swatches */}
            <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-2">
                    <div
                        className="w-5 h-5 rounded-sm border border-black/20"
                        style={{ backgroundColor: color }}
                    />
                    <input
                        type="text"
                        value={color}
                        onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            onChange(val);
                        }}
                        className="w-20 bg-transparent text-sm font-mono text-white/90 outline-none border border-white/10 rounded px-1.5 py-0.5 uppercase"
                    />
                </div>

                <div className="flex items-center gap-1.5">
                    {PRESET_COLORS.map(c => (
                        <button
                            key={c}
                            onClick={() => onChange(c)}
                            style={{ backgroundColor: c }}
                            className="w-4 h-4 rounded-full border border-black/20 hover:scale-110 transition-transform cursor-pointer"
                            aria-label={`Select color ${c}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
