'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

import { cn } from '@/lib/utils';

interface SmoothScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Classes applied to the inner content wrapper (usually layout/padding). */
    contentClassName?: string;
    /** Lenis interpolation factor — lower is smoother and slower. */
    lerp?: number;
    [dataAttribute: `data-${string}`]: unknown;
}

/**
 * A scroll pane with its own Lenis instance. Used inside the inbox so the
 * thread list and message body scroll with the same inertia as the rest of
 * the app instead of native wheel stepping.
 */
export function SmoothScrollArea({
    className,
    contentClassName,
    children,
    lerp = 0.08,
    ...props
}: SmoothScrollAreaProps) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const wrapper = wrapperRef.current;
        const content = contentRef.current;
        if (!wrapper || !content) return;

        const lenis = new Lenis({
            wrapper,
            content,
            lerp,
            smoothWheel: true,
            syncTouch: false,
            touchMultiplier: 1.4,
            wheelMultiplier: 1,
            autoRaf: true,
            overscroll: true,
        });

        return () => lenis.destroy();
    }, [lerp]);

    return (
        <div
            ref={wrapperRef}
            className={cn('overflow-y-auto overscroll-contain', className)}
            {...props}
        >
            <div ref={contentRef} className={contentClassName}>
                {children}
            </div>
        </div>
    );
}

export default SmoothScrollArea;
