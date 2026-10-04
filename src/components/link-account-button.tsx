'use client'

import { Button } from "./ui/button"
import { getAurinkoAuthorizationUrl } from "@/lib/aurinko";

const LinkButton = () => {
    return (
        <Button onClick={async () => {
            const authUrl = await getAurinkoAuthorizationUrl('Google');
            window.location.href = authUrl;
        }}>Link Account</Button>
    )
}

export default LinkButton;