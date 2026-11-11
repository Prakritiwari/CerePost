export function LandingBackground() {
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-white dark:bg-[#06050b]"
        >
            {/* Base wash */}
            <div className="absolute inset-0 bg-gradient-to-b from-white via-zinc-50 to-white dark:from-[#0b0717] dark:via-[#07060d] dark:to-black" />

            {/* Aurora mesh */}
            <div className="landing-orb landing-orb-a" />
            <div className="landing-orb landing-orb-b" />
            <div className="landing-orb landing-orb-c" />

            {/* Soft light behind the hero copy */}
            <div className="landing-spotlight absolute inset-x-0 top-0 h-[52rem]" />

            {/* Fine dot matrix */}
            <div className="landing-dot-grid absolute inset-0" />

            {/* Film grain */}
            <div className="landing-noise absolute inset-0" />

            {/* Edge vignette */}
            <div className="landing-vignette absolute inset-0" />
        </div>
    );
}

export default LandingBackground;
