"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface LogoMarkProps {
    className?: string
    /** Adds the soft violet halo used on dark backgrounds. */
    glow?: boolean
}

/**
 * CerePost mark: a violet brain folded into an envelope, orbited by a
 * sparkle. Renders inline so it stays crisp at every size.
 */
export function LogoMark({ className, glow = false }: LogoMarkProps) {
    const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
    const brain = `cerepost-brain-${uid}`
    const mail = `cerepost-mail-${uid}`
    const flap = `cerepost-flap-${uid}`
    const orbit = `cerepost-orbit-${uid}`
    const spark = `cerepost-spark-${uid}`
    const halo = `cerepost-halo-${uid}`

    return (
        <svg
            viewBox="0 0 96 96"
            role="img"
            aria-label="CerePost"
            xmlns="http://www.w3.org/2000/svg"
            className={cn("shrink-0", className)}
        >
            <defs>
                <linearGradient
                    id={brain}
                    x1="16"
                    y1="24"
                    x2="48"
                    y2="70"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#E9D5FF" />
                    <stop offset="0.45" stopColor="#C084FC" />
                    <stop offset="1" stopColor="#8B5CF6" />
                </linearGradient>
                <linearGradient
                    id={mail}
                    x1="40"
                    y1="28"
                    x2="78"
                    y2="66"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#F7F1FF" />
                    <stop offset="0.5" stopColor="#D8CAF9" />
                    <stop offset="1" stopColor="#A78BFA" />
                </linearGradient>
                <linearGradient
                    id={flap}
                    x1="44"
                    y1="29"
                    x2="76"
                    y2="50"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#FBF7FF" />
                    <stop offset="1" stopColor="#CDBDF7" />
                </linearGradient>
                <linearGradient
                    id={orbit}
                    x1="10"
                    y1="64"
                    x2="86"
                    y2="32"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#7C3AED" />
                    <stop offset="0.5" stopColor="#C4B5FD" />
                    <stop offset="1" stopColor="#A855F7" />
                </linearGradient>
                <linearGradient
                    id={spark}
                    x1="62"
                    y1="11"
                    x2="78"
                    y2="29"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#FFFFFF" />
                    <stop offset="1" stopColor="#DDD6FE" />
                </linearGradient>
                <radialGradient id={halo} cx="0.35" cy="0.4" r="0.75">
                    <stop stopColor="#A855F7" stopOpacity="0.35" />
                    <stop offset="1" stopColor="#A855F7" stopOpacity="0" />
                </radialGradient>
            </defs>

            <g transform="translate(0 6)">
                {glow ? (
                    <ellipse cx="42" cy="46" rx="42" ry="30" fill={`url(#${halo})`} />
                ) : null}

                {/* Orbit ribbon */}
                <ellipse
                    cx="48"
                    cy="48"
                    rx="41"
                    ry="20"
                    transform="rotate(-25 48 48)"
                    fill="none"
                    stroke={`url(#${orbit})`}
                    strokeWidth="5"
                    strokeLinecap="round"
                    opacity="0.16"
                />
                <ellipse
                    cx="48"
                    cy="48"
                    rx="41"
                    ry="20"
                    transform="rotate(-25 48 48)"
                    fill="none"
                    stroke={`url(#${orbit})`}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                />

                {/* Envelope */}
                <g transform="rotate(-7 58 47)">
                    <rect
                        x="36"
                        y="29"
                        width="43"
                        height="35"
                        rx="7"
                        fill={`url(#${mail})`}
                    />
                    <path
                        d="M37.4 32.2 57.5 48.4 77.6 32.2 C 77.6 30 75.8 29 73.3 29 L 41.7 29 C 39.2 29 37.4 30 37.4 32.2 Z"
                        fill={`url(#${flap})`}
                    />
                    <path
                        d="M37.4 32.2 57.5 48.4 77.6 32.2"
                        fill="none"
                        stroke="#4C1D95"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </g>

                {/* Brain */}
                <g fill={`url(#${brain})`}>
                    <circle cx="34" cy="31" r="10" />
                    <circle cx="23" cy="38" r="9.5" />
                    <circle cx="45" cy="38" r="9" />
                    <circle cx="15" cy="48" r="9" />
                    <circle cx="31" cy="46" r="12" />
                    <circle cx="46" cy="49" r="9.5" />
                    <circle cx="24" cy="57" r="10" />
                    <circle cx="38" cy="59" r="10" />
                    <circle cx="33" cy="67" r="8" />
                </g>
                <g
                    fill="none"
                    stroke="#3B0764"
                    strokeWidth="3.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M26 31c6-3 11 1 9 6-1.6 4-7 2.4-6-1.4" />
                    <path d="M38 30c4 3 5 8 2 11" />
                    <path d="M13 44c6-4 12-1 11 4-1 4.6-7 4.6-7.6.6" />
                    <path d="M30 41c5-3 10 0 10 5s-6 7-8.6 4" />
                    <path d="M45 45c3 3 2 8-1 9.6" />
                    <path d="M20 54c6-3 11 1 9 5.6-1.6 3.8-7 2.4-7.4-1" />
                    <path d="M34 55c5-3 9 0 9 4.6 0 4-4.6 5.6-7 3.4" />
                    <path d="M28 63c4-2 8 0 8 3.4 0 2.6-3 3.6-5 2.4" />
                </g>

                {/* Sparkle */}
                <path
                    d="M70 11c1.2 6 2.8 7.8 9 9-6.2 1.2-7.8 3-9 9-1.2-6-2.8-7.8-9-9 6.2-1.2 7.8-3 9-9Z"
                    fill={`url(#${spark})`}
                />
            </g>
        </svg>
    )
}

interface LogoProps {
    className?: string
    markClassName?: string
    wordmarkClassName?: string
    tagline?: string
}

/** Mark + wordmark lockup. */
export function Logo({
    className,
    markClassName,
    wordmarkClassName,
    tagline,
}: LogoProps) {
    return (
        <span className={cn("flex items-center gap-2.5", className)}>
            <LogoMark className={cn("size-9", markClassName)} />
            <span className="flex flex-col">
                <span
                    className={cn(
                        "text-base font-bold leading-none tracking-tight",
                        wordmarkClassName
                    )}
                >
                    Cere<span className="text-violet-500">post</span>
                </span>
                {tagline ? (
                    <span className="mt-1 font-mono text-[10px] uppercase leading-none tracking-wider text-muted-foreground">
                        {tagline}
                    </span>
                ) : null}
            </span>
        </span>
    )
}
