'use client';

import { useEffect, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { ReactLenis, useLenis } from 'lenis/react';
import 'lenis/dist/lenis.css';

function ScrollBehaviour() {
    const pathname = usePathname();
    const lenis = useLenis();
    const firstRender = useRef(true);
    const lockedRef = useRef(false);

    // Start each page at the top when navigating (skip the initial render).
    useEffect(() => {
        if (!lenis) return;
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        if (window.location.hash) return;
        lenis.scrollTo(0, { immediate: true });
    }, [pathname, lenis]);

    // Let dialogs / the command palette lock the page without fighting Lenis.
    useEffect(() => {
        if (!lenis) return;
        const body = document.body;

        const isLocked = () =>
            body.hasAttribute('data-scroll-locked') ||
            window.getComputedStyle(body).overflowY === 'hidden';

        const sync = () => {
            const locked = isLocked();
            if (locked === lockedRef.current) return;
            lockedRef.current = locked;
            if (locked) lenis.stop();
            else lenis.start();
        };

        sync();
        const observer = new MutationObserver(sync);
        observer.observe(body, {
            attributes: true,
            attributeFilter: ['style', 'class', 'data-scroll-locked'],
        });

        return () => observer.disconnect();
    }, [lenis]);

    return null;
}

export function SmoothScroll({ children }: { children: React.ReactNode }) {
    const options = useMemo(
        () => ({
            lerp: 0.1,
            smoothWheel: true,
            syncTouch: false,
            wheelMultiplier: 1,
            touchMultiplier: 1.5,
            autoRaf: true,
            anchors: true,
            stopInertiaOnNavigate: true,
            // Panes, dropdowns and editors keep their native scrolling.
            prevent: (node: HTMLElement) => {
                if (
                    node === document.body ||
                    node === document.documentElement
                ) {
                    return false;
                }

                const style = window.getComputedStyle(node);
                return (
                    (style.overflowY === 'auto' ||
                        style.overflowY === 'scroll') &&
                    node.scrollHeight > node.clientHeight + 1
                );
            },
        }),
        [],
    );

    return (
        <ReactLenis root options={options}>
            <ScrollBehaviour />
            {children}
        </ReactLenis>
    );
}

export default SmoothScroll;
