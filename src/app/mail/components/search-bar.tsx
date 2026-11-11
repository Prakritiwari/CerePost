'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import {
    ArrowUpRight,
    Clock,
    Loader2,
    Mail,
    Search,
    User,
    X,
} from 'lucide-react'
import React from 'react'
import { atom, useAtom } from 'jotai'
import { useDebounceValue } from 'usehooks-ts'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { api } from '@/trpc/react'
import useThreads from '@/hooks/use-threads'
import { useThread } from './use-thread'

export const isSearchingAtom = atom(false)
export const searchValueAtom = atom('')

type ThreadSuggestion = {
    id: string
    subject: string
    snippet: string
    from: { name: string | null; address: string } | null
    sentAt: Date | string
    isStarred?: boolean
    isMuted?: boolean
}

type PersonSuggestion = {
    name: string | null
    address: string
}

type Option =
    | { kind: 'thread'; key: string; thread: ThreadSuggestion }
    | { kind: 'person'; key: string; person: PersonSuggestion }
    | { kind: 'all'; key: string }

const escapeRegExp = (value: string) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const Highlight = ({ text, query }: { text: string; query: string }) => {
    if (!query.trim()) return <>{text}</>

    const parts = text.split(
        new RegExp(`(${escapeRegExp(query.trim())})`, 'ig'),
    )

    return (
        <>
            {parts.map((part, index) =>
                part.toLowerCase() === query.trim().toLowerCase() ? (
                    <mark
                        key={index}
                        className="rounded bg-amber-200/80 px-0.5 text-foreground dark:bg-amber-400/30"
                    >
                        {part}
                    </mark>
                ) : (
                    <React.Fragment key={index}>{part}</React.Fragment>
                ),
            )}
        </>
    )
}

const initialsOf = (name?: string | null, address?: string) => {
    const trimmedName = name?.trim()
    const source = trimmedName && trimmedName.length > 0 ? trimmedName : (address ?? '?')
    return source
        .split(/\s+/)
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
}

const formatSuggestionDate = (value: Date | string) => {
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return formatDistanceToNow(date, { addSuffix: true })
}

const SearchBar = () => {
    const { threads, accountId } = useThreads()
    const [searchValue, setSearchValue] = useAtom(searchValueAtom)
    const [isSearching, setIsSearching] = useAtom(isSearchingAtom)
    const [, setThreadId] = useThread()

    const inputRef = React.useRef<HTMLInputElement>(null)
    const containerRef = React.useRef<HTMLDivElement>(null)
    const [showSuggestions, setShowSuggestions] = React.useState(false)
    const [activeIndex, setActiveIndex] = React.useState(-1)

    const [debouncedQuery] = useDebounceValue(searchValue, 220)
    const query = searchValue.trim()
    const suggestionsStale =
        query.length >= 2 &&
        query.toLowerCase() !== debouncedQuery.trim().toLowerCase()

    const { data: suggestions, isFetching: suggestionsFetching } =
        api.mail.searchSuggestions.useQuery(
            { accountId, query: debouncedQuery },
            {
                enabled: !!accountId && debouncedQuery.trim().length >= 2,
                staleTime: 30_000,
            },
        )

    const suggestionsLoading = suggestionsFetching || suggestionsStale

    const recentThreads: ThreadSuggestion[] = React.useMemo(
        () =>
            (threads ?? []).slice(0, 4).map((thread) => ({
                id: thread.id,
                subject: thread.subject,
                snippet: thread.emails.at(-1)?.bodySnippet ?? '',
                from: thread.emails.at(-1)?.from
                    ? {
                          name: thread.emails.at(-1)?.from?.name ?? null,
                          address: thread.emails.at(-1)?.from?.address ?? '',
                      }
                    : null,
                sentAt: thread.lastMessageDate,
                isStarred: thread.isStarred,
                isMuted: thread.isMuted,
            })),
        [threads],
    )

    const options: Option[] = React.useMemo(() => {
        if (query.length === 0) {
            return recentThreads.map((thread) => ({
                kind: 'thread' as const,
                key: `recent-${thread.id}`,
                thread,
            }))
        }

        if (query.length < 2) return []

        const threadOptions: Option[] = (suggestionsStale
            ? []
            : suggestions?.threads ?? []
        ).map(
            (thread) => ({
                kind: 'thread' as const,
                key: `thread-${thread.id}`,
                thread,
            }),
        )

        const personOptions: Option[] = (suggestionsStale
            ? []
            : suggestions?.people ?? []
        ).map(
            (person) => ({
                kind: 'person' as const,
                key: `person-${person.address}`,
                person,
            }),
        )

        return [
            ...threadOptions,
            ...personOptions,
            { kind: 'all' as const, key: 'all-results' },
        ]
    }, [query, recentThreads, suggestions, suggestionsStale])

    const isOpen =
        showSuggestions &&
        (options.length > 0 ||
            (query.length >= 2 && suggestionsLoading))

    const closeAndBlur = () => {
        setShowSuggestions(false)
        setActiveIndex(-1)
        inputRef.current?.blur()
    }

    const selectOption = (option: Option) => {
        if (option.kind === 'thread') {
            setThreadId(option.thread.id)
            setSearchValue('')
            setIsSearching(false)
            closeAndBlur()
            return
        }

        if (option.kind === 'person') {
            setSearchValue(option.person.address)
            setIsSearching(true)
            setShowSuggestions(false)
            setActiveIndex(-1)
            inputRef.current?.focus()
            return
        }

        setShowSuggestions(false)
        setActiveIndex(-1)
        setIsSearching(query.length > 0)
        inputRef.current?.blur()
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            if (options.length === 0) return
            event.preventDefault()
            setShowSuggestions(true)
            setActiveIndex((current) => {
                if (event.key === 'ArrowDown') {
                    return (current + 1) % options.length
                }
                return current <= 0 ? options.length - 1 : current - 1
            })
            return
        }

        if (event.key === 'Enter') {
            if (isOpen && activeIndex >= 0 && options[activeIndex]) {
                event.preventDefault()
                selectOption(options[activeIndex])
                return
            }
            if (query.length > 0) {
                event.preventDefault()
                setShowSuggestions(false)
                setIsSearching(true)
                inputRef.current?.blur()
            }
            return
        }

        if (event.key === 'Escape') {
            if (isOpen) {
                event.preventDefault()
                setShowSuggestions(false)
                setActiveIndex(-1)
                return
            }
            setSearchValue('')
            setIsSearching(false)
            inputRef.current?.blur()
        }
    }

    const handleBlur = (event?: React.FocusEvent) => {
        if (
            event?.relatedTarget &&
            (containerRef.current?.contains(event.relatedTarget) ||
                (event.relatedTarget as HTMLElement).closest?.(
                    '[data-search-results]',
                ))
        ) {
            return
        }
        setShowSuggestions(false)
        setActiveIndex(-1)
    }

    React.useEffect(() => {
        if (
            !isSearching &&
            searchValue === '' &&
            document.activeElement !== inputRef.current
        ) {
            setShowSuggestions(false)
        }
    }, [isSearching, searchValue])

    React.useEffect(() => {
        const handleShortcut = (event: KeyboardEvent) => {
            const tag = document.activeElement?.tagName ?? ''
            if (event.key === 'Escape') {
                if (isOpen) {
                    setShowSuggestions(false)
                    setActiveIndex(-1)
                }
            }
            if (
                event.key === '/' &&
                !['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)
            ) {
                event.preventDefault()
                inputRef.current?.focus()
                setShowSuggestions(true)
            }
        }

        window.addEventListener('keydown', handleShortcut)
        return () => window.removeEventListener('keydown', handleShortcut)
    }, [isOpen])

    return (
        <div className="relative z-40 bg-background/90 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <motion.div
                ref={containerRef}
                layoutId="search-bar"
                className="relative"
            >
                <div className="relative flex h-10 items-center rounded-xl border border-border bg-background/80 shadow-sm transition-shadow focus-within:border-ring/60 focus-within:shadow-md">
                    <Search className="ml-3 size-4 shrink-0 text-muted-foreground" />
                    <Input
                        ref={inputRef}
                        type="search"
                        name="cerepost-mail-search"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        enterKeyHint="search"
                        role="combobox"
                        aria-expanded={isOpen}
                        aria-controls="search-suggestions"
                        aria-autocomplete="list"
                        aria-activedescendant={
                            activeIndex >= 0
                                ? `search-option-${activeIndex}`
                                : undefined
                        }
                        placeholder="Search emails, people, or ask a question…"
                        className="h-10 flex-1 border-0 bg-transparent pl-2 pr-20 text-sm shadow-none focus-visible:ring-0 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
                        value={searchValue}
                        onChange={(event) => {
                            const value = event.target.value
                            setSearchValue(value)
                            setActiveIndex(-1)
                            setShowSuggestions(true)
                            setIsSearching(value.trim().length > 0)
                        }}
                        onFocus={() => {
                            setShowSuggestions(true)
                            if (query.length > 0) setIsSearching(true)
                        }}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                    />
                    <div className="absolute right-2 flex items-center gap-1">
                        {query.length >= 2 && suggestionsLoading && (
                            <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        )}
                        {searchValue ? (
                            <button
                                type="button"
                                aria-label="Clear search"
                                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                onClick={() => {
                                    setSearchValue('')
                                    setIsSearching(false)
                                    setActiveIndex(-1)
                                    setShowSuggestions(true)
                                    inputRef.current?.focus()
                                }}
                            >
                                <X className="size-4" />
                            </button>
                        ) : (
                            <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
                                /
                            </kbd>
                        )}
                    </div>
                </div>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            id="search-suggestions"
                            role="listbox"
                            initial={{ opacity: 0, y: -4, scale: 0.99 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.99 }}
                            transition={{ duration: 0.12 }}
                            className="absolute inset-x-0 top-[calc(100%+6px)] z-50 max-h-[min(70vh,32rem)] overflow-y-auto rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-2xl"
                        >
                            {query.length === 0 && options.length > 0 && (
                                <div className="flex items-center gap-2 px-2 py-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                                    <Clock className="size-3" />
                                    Recent
                                </div>
                            )}

                            {query.length >= 2 && suggestionsLoading && options.length === 0 && (
                                <div className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground">
                                    <Loader2 className="size-3.5 animate-spin" />
                                    Searching…
                                </div>
                            )}

                            {query.length >= 2 && options.length === 1 && !suggestionsLoading && (
                                <div className="px-3 py-3 text-xs text-muted-foreground">
                                    No quick matches. Press Enter to search all mail.
                                </div>
                            )}

                            {options.map((option, index) => {
                                const previousKind =
                                    index > 0 ? options[index - 1]!.kind : null
                                const showEmailHeader =
                                    option.kind === 'thread' &&
                                    query.length > 0 &&
                                    previousKind !== 'thread'
                                const showPeopleHeader =
                                    option.kind === 'person' &&
                                    previousKind !== 'person'

                                return (
                                    <React.Fragment key={option.key}>
                                        {showEmailHeader && (
                                            <div className="flex items-center gap-2 px-2 pt-2 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                                                <Mail className="size-3" />
                                                Emails
                                            </div>
                                        )}
                                        {showPeopleHeader && (
                                            <div className="flex items-center gap-2 px-2 pt-2 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                                                <User className="size-3" />
                                                People
                                            </div>
                                        )}

                                        <button
                                            id={`search-option-${index}`}
                                            type="button"
                                            role="option"
                                            aria-selected={activeIndex === index}
                                            onMouseDown={(event) =>
                                                event.preventDefault()
                                            }
                                            onMouseEnter={() =>
                                                setActiveIndex(index)
                                            }
                                            onClick={() =>
                                                selectOption(option)
                                            }
                                            className={cn(
                                                'flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left transition-colors',
                                                activeIndex === index
                                                    ? 'bg-accent'
                                                    : 'hover:bg-accent/60',
                                            )}
                                        >
                                            {option.kind === 'thread' && (
                                                <>
                                                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                                                        {initialsOf(
                                                            option.thread.from?.name,
                                                            option.thread.from?.address,
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="truncate text-xs font-semibold">
                                                                <Highlight
                                                                    text={
                                                                        option.thread.from?.name ??
                                                                        option.thread.from?.address ??
                                                                        'Unknown sender'
                                                                    }
                                                                    query={query}
                                                                />
                                                            </span>
                                                            <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                                                                {formatSuggestionDate(
                                                                    option.thread.sentAt,
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="truncate text-xs font-medium text-foreground">
                                                            <Highlight
                                                                text={option.thread.subject}
                                                                query={query}
                                                            />
                                                        </div>
                                                        <p className="line-clamp-1 text-[11px] text-muted-foreground">
                                                            <Highlight
                                                                text={
                                                                    option.thread.snippet ??
                                                                    option.thread.from?.address ??
                                                                    ''
                                                                }
                                                                query={query}
                                                            />
                                                        </p>
                                                    </div>
                                                </>
                                            )}

                                            {option.kind === 'person' && (
                                                <>
                                                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                                        <User className="size-4" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="truncate text-xs font-semibold">
                                                            <Highlight
                                                                text={
                                                                    option.person.name ??
                                                                    option.person.address
                                                                }
                                                                query={query}
                                                            />
                                                        </div>
                                                        <div className="truncate text-[11px] text-muted-foreground">
                                                            <Highlight
                                                                text={option.person.address}
                                                                query={query}
                                                            />
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            {option.kind === 'all' && (
                                                <div className="flex w-full items-center gap-2 px-1 py-0.5">
                                                    <div className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                                        <Search className="size-3.5" />
                                                    </div>
                                                    <span className="text-xs font-medium">
                                                        View all results for “
                                                        {query}”
                                                    </span>
                                                    <ArrowUpRight className="ml-auto size-3.5 text-muted-foreground" />
                                                </div>
                                            )}
                                        </button>
                                    </React.Fragment>
                                )
                            })}

                            {options.length > 0 && (
                                <div className="mt-1 flex items-center gap-3 border-t border-border/60 px-2 pt-1.5 pb-0.5 text-[10px] text-muted-foreground">
                                    <span>↑↓ to navigate</span>
                                    <span>↵ to open</span>
                                    <span>esc to close</span>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    )
}

export default SearchBar
