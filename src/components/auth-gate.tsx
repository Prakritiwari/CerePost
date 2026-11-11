'use client'

import { useAuth } from '@clerk/nextjs'
import React from 'react'

type AuthGateProps = {
    signedIn: React.ReactNode
    signedOut: React.ReactNode
    fallback?: React.ReactNode
}

/**
 * Render auth-dependent UI from the live Clerk client session. This prevents
 * stale server-rendered "Sign in" buttons from opening a modal while the user
 * is already signed in.
 */
export function AuthGate({ signedIn, signedOut, fallback = null }: AuthGateProps) {
    const { isLoaded, isSignedIn } = useAuth()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted || !isLoaded) {
        return <>{fallback}</>
    }

    return <>{isSignedIn ? signedIn : signedOut}</>
}

export default AuthGate
