'use client'

import dynamic from "next/dynamic"
import { ThemeToggle } from "@/components/theme-toggle"
import type { ComponentProps } from "react"
import type { Mail as MailType } from "./mail"

const Mail = dynamic<ComponentProps<typeof MailType>>(() =>
    import("./mail").then((mod) => mod.Mail), {
    ssr: false,
})

const MailDashboard = () => {
    return (
        <>
            <div className="absolute bottom-4 left-4 z-50 hidden md:block">
                <ThemeToggle />
            </div>
            <div className="w-full h-dvh flex flex-row overflow-hidden">
                <Mail
                    defaultLayout={[20, 32, 48]}
                    defaultCollapsed={false}
                    navCollapsedSize={4}
                />
            </div>
        </>
    )
}

export default MailDashboard