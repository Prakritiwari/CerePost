'use client'

import { useAtom } from 'jotai'
import React from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
    ArrowUpRight,
    Inbox,
    Mail,
    Search,
    Sparkles,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { SmoothScrollArea } from '@/components/smooth-scroll-area'
import { cn } from '@/lib/utils'
import { api } from '@/trpc/react'
import { useDebounceValue, useLocalStorage } from 'usehooks-ts'
import { toast } from 'sonner'
import { isSearchingAtom, searchValueAtom } from './search-bar'
import { useThread } from './use-thread'

const stripHtml = (value: string | null | undefined) => {
    if (!value) return ''
    if (typeof document === 'undefined') {
        return value.replace(/<[^>]*>/g, ' ')
    }
    const parsed = new DOMParser().parseFromString(value, 'text/html')
    return (parsed.body.textContent ?? '').replace(/\s+/g, ' ').trim()
}

const parseSender = (from: string | null | undefined) => {
    if (!from) return { name: 'Unknown sender', address: '' }
    const match = /^(.*?)\s*<([^>]+)>$/.exec(from)
    if (match) {
        return {
            name: match[1]!.trim() || match[2]!,
            address: match[2]!,
        }
    }
    return { name: from, address: from }
}

const initialsOf = (name: string, address: string) =>
    (name || address || '?')
        .replace(/<|>/g, '')
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()

const formatDate = (value: unknown) => {
    if (!value) return ''
    const date = new Date(value as string | number | Date)
    if (Number.isNaN(date.getTime())) return ''
    return formatDistanceToNow(date, { addSuffix: true })
}

const quickSearches = ['LinkedIn', 'Invoices', 'Meeting notes', 'Flight details']

const SearchDisplay = () => {
    const [searchValue, setSearchValue] = useAtom(searchValueAtom)
    const [, setIsSearching] = useAtom(isSearchingAtom)
    const [, setThreadId] = useThread()
    const { mutate: searchMutate, isPending, data, isError } =
        api.mail.searchEmails.useMutation()

    const [debouncedSearch] = useDebounceValue(searchValue, 400)
    const [accountId] = useLocalStorage('accountId', '')
    const [requestedQuery, setRequestedQuery] = React.useState('')

    React.useEffect(() => {
        const query = debouncedSearch.trim()
        if (!query || !accountId) return
        setRequestedQuery(query)
        searchMutate({ accountId, query: debouncedSearch })
    }, [debouncedSearch, accountId, searchMutate])

    const query = searchValue.trim()
    const querySettled =
        query.toLowerCase() === requestedQuery.trim().toLowerCase()
    const hits = data?.hits ?? []
    const hasResults = hits.length > 0
    const showSkeletons =
        !querySettled ||
        isPending ||
        (!!query && data === undefined && !isError)

    return (
        <SmoothScrollArea
            data-search-results
            className="h-full max-h-full sm:h-auto sm:max-h-[calc(100vh-140px)]"
            contentClassName="p-4 pb-24 sm:pb-4"
        >
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    <h2 className="flex items-center gap-2 text-sm font-semibold">
                        <Search className="size-4 text-muted-foreground" />
                        Search results
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {searchValue.trim() ? (
                            <>
                                for “{searchValue.trim()}”
                                {!isPending && hasResults && (
                                    <span className="text-muted-foreground/70">
                                        {' '}
                                        · {hits.length}{' '}
                                        {hits.length === 1 ? 'match' : 'matches'}
                                    </span>
                                )}
                            </>
                        ) : (
                            'Search across subjects, senders, and message content.'
                        )}
                    </p>
                </div>
                <Badge
                    variant="outline"
                    className="shrink-0 gap-1 text-[10px] font-medium text-muted-foreground"
                >
                    <Sparkles className="size-3" />
                    Semantic search
                </Badge>
            </div>

            {showSkeletons && (
                <div className="flex flex-col gap-2" aria-busy="true">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="animate-pulse rounded-xl border border-border/70 p-3"
                        >
                            <div className="flex gap-3">
                                <div className="size-9 rounded-full bg-muted" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-1/3 rounded bg-muted" />
                                    <div className="h-3 w-2/3 rounded bg-muted" />
                                    <div className="h-3 w-full rounded bg-muted" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!showSkeletons && isError && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-center">
                    <p className="text-sm font-medium">Search is unavailable</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Please try again in a moment.
                    </p>
                </div>
            )}

            {!showSkeletons && !isError && !hasResults && (
                <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-8 text-center">
                    <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Inbox className="size-5" />
                    </div>
                    <p className="text-sm font-medium">No matches found</p>
                    <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                        Try a sender, a subject, or a natural-language phrase
                        like “LinkedIn invitations this week”.
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
                        {quickSearches.map((suggestion) => (
                            <button
                                key={suggestion}
                                type="button"
                                onClick={() => {
                                    setSearchValue(suggestion)
                                    setIsSearching(true)
                                }}
                                className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium transition-colors hover:bg-accent"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {!showSkeletons && !isError && hasResults && (
                <div className="flex flex-col gap-2">
                    {hits.map((hit) => {
                        const document = hit.document as {
                            title?: string
                            body?: string
                            rawBody?: string
                            from?: string
                            sentAt?: string | number
                            threadId?: string
                        }
                        const sender = parseSender(document.from)
                        const snippet = stripHtml(
                            document.rawBody ?? document.body,
                        )
                        const subject = document.title?.trim()
                            ? document.title
                            : '(no subject)'

                        return (
                            <button
                                key={hit.id}
                                type="button"
                                onClick={() => {
                                    if (!document.threadId) {
                                        toast.error(
                                            'This message is not part of a thread',
                                        )
                                        return
                                    }
                                    setIsSearching(false)
                                    setSearchValue('')
                                    setThreadId(document.threadId)
                                }}
                                className={cn(
                                    'group w-full rounded-xl border border-border/80 bg-card p-3 text-left shadow-sm transition-all',
                                    'hover:-translate-y-px hover:border-foreground/20 hover:bg-muted/40 hover:shadow-md',
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                                        {initialsOf(
                                            sender.name,
                                            sender.address,
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="truncate text-xs font-semibold">
                                                {sender.name}
                                            </span>
                                            {formatDate(document.sentAt) && (
                                                <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                                                    {formatDate(
                                                        document.sentAt,
                                                    )}
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-0.5 flex items-center gap-1.5">
                                            <Mail className="size-3 shrink-0 text-muted-foreground" />
                                            <span className="line-clamp-1 text-sm font-medium">
                                                {subject}
                                            </span>
                                        </div>

                                        {snippet && (
                                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                                                {snippet}
                                            </p>
                                        )}
                                    </div>

                                    <ArrowUpRight className="mt-1 size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                                </div>
                            </button>
                        )
                    })}
                </div>
            )}

            {!showSkeletons && !isError && hasResults && (
                <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
                    <Sparkles className="size-3" />
                    Results combine keyword and semantic matching.
                </div>
            )}
        </SmoothScrollArea>
    )
}

export default SearchDisplay
