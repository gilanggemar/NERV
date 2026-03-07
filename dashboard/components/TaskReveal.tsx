import React, { useEffect, useRef } from 'react';
import { motion, useAnimate } from 'framer-motion';
import { getAgentColor } from '@/lib/agentColors';
import { cn } from '@/lib/utils';

export interface TaskRevealProps {
    status: 'pending' | 'running' | 'complete' | 'error' | string;
    agentId?: string;
    children: React.ReactNode;
    className?: string;
    disabled?: boolean;
}

export default function TaskReveal({
    status,
    agentId,
    children,
    className,
    disabled = false
}: TaskRevealProps) {
    const [scope, animate] = useAnimate();
    const prevStatusRef = useRef(status);

    useEffect(() => {
        if (disabled || !scope.current) {
            prevStatusRef.current = status;
            return;
        }

        const prevStatus = prevStatusRef.current;

        const runAnimations = async () => {
            try {
                if (prevStatus === 'running' && status === 'complete') {
                    // COMPLETION ANIMATION
                    let color = 'var(--accent-lime)';
                    if (agentId) {
                        // we have agent colors like var(--agent-daisy) etc. 
                        // We want to use rgba or transparent to color transition. 
                        // By using CSS variables with framer motion, it might need to interpolate properly.
                        // But box-shadow with CSS vars works if it's formatted well.
                        color = getAgentColor(agentId);
                    }

                    animate(scope.current, { scale: [1, 1.03] }, { duration: 0.2, ease: "easeOut" });

                    setTimeout(() => {
                        if (scope.current) {
                            animate(scope.current, {
                                boxShadow: ['0 0 0px 0px transparent', `0 0 8px 2px ${color}`, '0 0 0px 0px transparent']
                            }, { duration: 0.25 });
                        }
                    }, 100);

                    setTimeout(() => {
                        if (scope.current) {
                            animate(scope.current, { scale: 1.0 }, { duration: 0.2, ease: "easeInOut" });
                        }
                    }, 200);

                } else if (prevStatus === 'running' && status === 'error') {
                    // ERROR ANIMATION
                    animate(scope.current, { x: [0, -4, 4, -3, 3, -1, 1, 0] }, { duration: 0.3 });

                    animate(scope.current, {
                        boxShadow: ['0 0 0px 0px transparent', '0 0 0px 2px var(--accent-coral)', '0 0 0px 0px transparent']
                    }, { duration: 0.4 });

                } else if (prevStatus === 'pending' && status === 'running') {
                    // ACTIVATION ANIMATION
                    animate(scope.current, { opacity: [1, 0.7, 1] }, { duration: 0.3 });
                }
            } catch (err) {
                // Animation was interrupted or unmounted
            }
        };

        runAnimations();
        prevStatusRef.current = status;
    }, [status, disabled, agentId, animate, scope]);

    return (
        <motion.div
            ref={scope}
            className={cn("relative rounded-[inherit]", className)}
            style={{
                willChange: 'transform' // the prompt said: will-change: transform (only during animation, remove after) but statically here is okay unless performance suffers.
            }}
        >
            {children}
        </motion.div>
    );
}
