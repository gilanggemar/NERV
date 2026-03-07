'use client';
import { motion } from 'framer-motion';

export function AtmosphereLayer({ colorHex }: { colorHex: string }) {
    return (
        <motion.div
            className="absolute inset-0 z-0 pointer-events-none mix-blend-screen opacity-40 transition-colors duration-1000"
            style={{
                background: `radial-gradient(circle at center, ${colorHex} 0%, transparent 70%)`
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
        />
    );
}
