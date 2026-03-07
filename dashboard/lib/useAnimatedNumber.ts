"use client";

import { useEffect, useState, useRef } from "react";

export function useAnimatedNumber(value: number, duration: number = 500): number {
    const [displayValue, setDisplayValue] = useState(value);
    const renderValue = useRef(value);
    const animationFrame = useRef<number | null>(null);

    useEffect(() => {
        if (renderValue.current === value) return;

        const startValue = renderValue.current;
        const startTime = performance.now();

        const updateValue = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            if (elapsed >= duration) {
                renderValue.current = value;
                setDisplayValue(value);
                return;
            }

            // easeOut function
            const progress = elapsed / duration;
            const easeOutProgress = 1 - Math.pow(1 - progress, 3);

            const currentVal = startValue + (value - startValue) * easeOutProgress;
            renderValue.current = currentVal;
            setDisplayValue(Math.round(currentVal));

            animationFrame.current = requestAnimationFrame(updateValue);
        };

        animationFrame.current = requestAnimationFrame(updateValue);

        return () => {
            if (animationFrame.current !== null) {
                cancelAnimationFrame(animationFrame.current);
            }
        };
    }, [value, duration]);

    return displayValue;
}
