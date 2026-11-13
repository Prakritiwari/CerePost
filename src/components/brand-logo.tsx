import Image from "next/image"

import { cn } from "@/lib/utils"

interface BrandLogoProps {
    className?: string
    glow?: boolean
    priority?: boolean
}

/**
 * CerePost brand logo. Rendered as a perfect circle with the edges clipped
 * so the mark reads the same at every size.
 */
export function BrandLogo({ className, glow = false, priority = false }: BrandLogoProps) {
    return (
        <Image
            src="/newapp-logo.png"
            alt="CerePost"
            width={773}
            height={772}
            priority={priority}
            className={cn(
                "aspect-square w-auto shrink-0 select-none rounded-full object-cover",
                glow &&
                    "drop-shadow-[0_0_18px_rgba(139,92,246,0.35)]",
                className,
            )}
        />
    )
}

export default BrandLogo
