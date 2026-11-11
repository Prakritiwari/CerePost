'use client'

import { Button } from "./ui/button"

const LinkButton = () => {
    return (
        <Button onClick={() => {
            window.location.href = '/api/aurinko/authorize?service=Google';
        }}>Link Account</Button>
    )
}

export default LinkButton;