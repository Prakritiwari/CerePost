'use client'

import dynamic from "next/dynamic"


const Mail = dynamic(() => import("./mail"), {
    ssr: false,
})

const MailDashboard = () => {
    return (
        <div className="w-full h-screen flex flex-row">
            <Mail />
        </div>
    )
}

export default MailDashboard