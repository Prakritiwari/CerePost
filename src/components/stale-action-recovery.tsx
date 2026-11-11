'use client'

import { useEffect } from 'react'

const RELOAD_KEY = 'cerepost:stale-action-reload'
const STALE_ACTION_PATTERN =
    /UnrecognizedActionError|Server Action .* was not found|failed-to-find-server-action/i

/**
 * If a browser tab still holds an old Server Action manifest (common after a
 * dev-server restart or deploy), reload once so it picks up the new bundle.
 */
export function StaleActionRecovery() {
    useEffect(() => {
        const reloadOnce = () => {
            if (sessionStorage.getItem(RELOAD_KEY)) return
            sessionStorage.setItem(RELOAD_KEY, '1')
            window.location.reload()
        }

        const handleRejection = (event: PromiseRejectionEvent) => {
            const message =
                event.reason instanceof Error
                    ? event.reason.message
                    : String(event.reason ?? '')
            if (!STALE_ACTION_PATTERN.test(message)) return
            event.preventDefault()
            reloadOnce()
        }

        const handleError = (event: ErrorEvent) => {
            if (!STALE_ACTION_PATTERN.test(event.message)) return
            event.preventDefault()
            reloadOnce()
        }

        const clearTimer = window.setTimeout(() => {
            sessionStorage.removeItem(RELOAD_KEY)
        }, 10_000)

        window.addEventListener('unhandledrejection', handleRejection)
        window.addEventListener('error', handleError)
        return () => {
            window.clearTimeout(clearTimer)
            window.removeEventListener('unhandledrejection', handleRejection)
            window.removeEventListener('error', handleError)
        }
    }, [])

    return null
}

export default StaleActionRecovery
