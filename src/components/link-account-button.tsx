'use client'

import { Button } from "./ui/button"
import { getAurinkoAuthUrl } from "@/lib/aurinko";

const LinkButton = () => {
    return (
        <Button onClick={async () => {
            const authUrl = await getAurinkoAuthUrl('Google');
            window.location.href = authUrl;
        }}>Link Account</Button>
    )
}

export default LinkButton;