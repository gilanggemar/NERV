'use client'

import FloatingLines from '@/components/FloatingLines'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-black">
            {/* Full-screen FloatingLines background — persists across login/signup */}
            <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                <FloatingLines
                    linesGradient={["#f54747", "#611515", "#f54747"]}
                    animationSpeed={1}
                    interactive
                    bendRadius={5}
                    bendStrength={-0.5}
                    mouseDamping={0.05}
                    parallax
                    parallaxStrength={0.2}
                />
            </div>

            {/* Card container — pointer-events passthrough for FloatingLines interactivity */}
            <div
                className="relative z-10 flex min-h-screen w-full items-center justify-center"
                style={{ pointerEvents: 'none' }}
            >
                {children}
            </div>
        </div>
    )
}
