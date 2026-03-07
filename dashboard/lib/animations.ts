// Reusable animation variants for Framer Motion

export const fadeInUp = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
};

export const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.06,
            delayChildren: 0.1,
        },
    },
};

export const scaleIn = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.25, ease: 'easeOut' },
};

export const slideInRight = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
};

export const pulseGlow = {
    animate: {
        boxShadow: [
            '0 0 0px 0px rgba(255, 109, 41, 0)',
            '0 0 12px 2px rgba(255, 109, 41, 0.15)',
            '0 0 0px 0px rgba(255, 109, 41, 0)',
        ],
    },
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
};

export const numberCount = (from: number, to: number) => ({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    // Use with useMotionValue + useTransform for count-up effect
});

export const achievementUnlock = {
    initial: { scale: 0, rotate: -180, opacity: 0 },
    animate: { scale: 1, rotate: 0, opacity: 1 },
    transition: { type: 'spring', stiffness: 200, damping: 15 },
};

export const streakFlame = {
    animate: {
        rotate: [-2, 2, -1, 1.5, 0],
        scale: [1, 1.05, 1, 1.03, 1],
    },
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
};
