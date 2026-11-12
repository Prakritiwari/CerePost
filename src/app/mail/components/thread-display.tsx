import {
    ArrowLeft,
    Bell,
    BellOff,
    CheckCircle2,
    Clock,
    Forward,
    Mail,
    MoreVertical,
    Reply,
    ReplyAll,
    Star,
    Tag,
} from "lucide-react"
import React from "react"
import DOMPurify from "dompurify"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { api } from "@/trpc/react"
import { addDays, addHours, format, nextSaturday } from "date-fns"
import { cn } from "@/lib/utils"
import EmailDisplay from "@/components/email-display"
import { LogoMark } from "@/components/logo"
import { useThread } from "./use-thread"
import useThreads from "@/hooks/use-threads"
import { useLocalStorage } from "usehooks-ts"
import ReplyBox, { type ReplyAddress, type ReplyDetails } from "./reply-box"
import { toast } from "sonner"

const escapeHtml = (value: string) =>
    value.replace(/[&<>"']/g, (character) => {
        const entities: Record<string, string> = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        }
        return entities[character]!
    })

export function ThreadDisplay({
    mobile = false,
    onBack,
}: {
    mobile?: boolean
    onBack?: () => void
} = {}) {
    const [threadId, setThreadId] = useThread()
    const { threads, account } = useThreads()
    const today = new Date()
    const _thread = threads?.find(t => t.id === threadId)
    const [accountId] = useLocalStorage('accountId', '')
    const [replyType, setReplyType] = React.useState<'reply' | 'replyAll'>('reply')
    const [labelsOpen, setLabelsOpen] = React.useState(false)
    const [labelInput, setLabelInput] = React.useState('')

    const { data: foundThread } = api.mail.getThreadById.useQuery({
        accountId: accountId,
        threadId: threadId ?? ''
    }, { enabled: !!!_thread && !!threadId })
    const thread = _thread ?? foundThread

    const replyDetails = React.useMemo<ReplyDetails | null>(() => {
        if (!thread || !account || thread.emails.length === 0) return null

        const emails = thread.emails
        const self = account.emailAddress.trim().toLowerCase()
        const lastEmail = emails[emails.length - 1]!
        const lastExternal =
            [...emails]
                .reverse()
                .find(
                    (email) =>
                        email.from.address.trim().toLowerCase() !== self,
                ) ?? lastEmail

        const to = new Map<string, ReplyAddress>()
        const addTo = (address: ReplyAddress) => {
            const key = address.address.trim().toLowerCase()
            if (!key || key === self || to.has(key)) return
            to.set(key, { name: address.name, address: address.address })
        }

        addTo(lastExternal.from)
        if (replyType === 'replyAll') {
            lastExternal.to.forEach(addTo)
        }

        // Threads made only of messages sent by this account (for example a
        // self-addressed test) have no external sender. Fall back to the
        // original recipients so the reply box is still usable.
        if (to.size === 0) {
            lastEmail.to.forEach(addTo)
            lastEmail.cc.forEach(addTo)
        }

        const cc = new Map<string, ReplyAddress>()
        if (replyType === 'replyAll') {
            for (const address of lastExternal.cc) {
                const key = address.address.trim().toLowerCase()
                if (!key || key === self || to.has(key) || cc.has(key)) {
                    continue
                }
                cc.set(key, { name: address.name, address: address.address })
            }
        }

        return {
            to: [...to.values()],
            cc: [...cc.values()],
            from: { name: account.name, address: account.emailAddress },
            subject: lastExternal.subject,
            id: lastExternal.internetMessageId,
        }
    }, [thread, account, replyType])

    const utils = api.useUtils()

    React.useEffect(() => {
        setReplyType('reply')
    }, [threadId])

    const setDone = api.mail.setDone.useMutation({
        onSuccess: () => {
            toast.success('Marked as done')
            void utils.mail.getThreads.invalidate()
        },
        onError: () => toast.error('Failed to mark as done'),
    })

    const setUndone = api.mail.setUndone.useMutation({
        onSuccess: () => {
            toast.success('Marked as undone')
            void utils.mail.getThreads.invalidate()
        },
        onError: () => toast.error('Failed to mark as undone'),
    })

    const updateThread = api.mail.updateThread.useMutation({
        onSuccess: () => {
            void utils.mail.getThreads.invalidate()
            void utils.mail.getThreadById.invalidate()
        },
        onError: () => toast.error('Could not update this thread'),
    })

    const handleMarkDone = () => {
        if (!threadId) return
        setDone.mutate({ threadId, accountId })
        setThreadId(null)
    }

    const handleMarkUnread = () => {
        if (!threadId) return
        setUndone.mutate({ threadId, accountId })
    }

    const handleReply = (type: 'reply' | 'replyAll') => {
        setReplyType(type)
        const replyBox = document.querySelector<HTMLElement>('[data-reply-box]')
        replyBox?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        window.setTimeout(() => {
            const input = replyBox?.querySelector<HTMLElement>('.ProseMirror')
            input?.focus()
        }, 120)
    }

    const handleForward = () => {
        const email = thread?.emails.at(-1)
        if (!email) return

        const body = DOMPurify.sanitize(email.body ?? email.bodySnippet ?? '')
        const forwarded = `
            <p>---------- Forwarded message ----------</p>
            <p>
                <strong>From:</strong> ${escapeHtml(email.from?.name ?? '')} &lt;${escapeHtml(email.from?.address ?? '')}&gt;<br />
                <strong>Date:</strong> ${escapeHtml(format(new Date(email.sentAt), "PPpp"))}<br />
                <strong>Subject:</strong> ${escapeHtml(email.subject)}
            </p>
            ${body}
        `

        window.dispatchEvent(new CustomEvent('cerepost:compose', {
            detail: {
                subject: `Fwd: ${email.subject}`,
                body: forwarded,
            },
        }))
        toast.success('Forward draft opened')
    }

    const toggleStar = () => {
        if (!threadId || !thread) return
        const isStarred = !thread.isStarred
        updateThread.mutate(
            { accountId, threadId, isStarred },
            {
                onSuccess: () =>
                    toast.success(isStarred ? 'Thread starred' : 'Star removed'),
            },
        )
    }

    const toggleMute = () => {
        if (!threadId || !thread) return
        const isMuted = !thread.isMuted
        updateThread.mutate(
            { accountId, threadId, isMuted },
            {
                onSuccess: () =>
                    toast.success(isMuted ? 'Thread muted' : 'Thread unmuted'),
            },
        )
    }

    const openLabelDialog = () => {
        setLabelInput((thread?.labels ?? []).join(', '))
        setLabelsOpen(true)
    }

    const saveLabels = () => {
        if (!threadId) return
        const labels = labelInput
            .split(',')
            .map((label) => label.trim())
            .filter(Boolean)

        updateThread.mutate(
            { accountId, threadId, labels },
            {
                onSuccess: () => {
                    toast.success('Labels updated')
                    setLabelsOpen(false)
                },
            },
        )
    }

    return (
        <div className="flex flex-col h-full bg-background">
            <div
                className={cn(
                    "flex items-center p-2",
                    mobile && "[&_button]:size-10 [&_button>svg]:size-5",
                )}
            >
                <div className="flex items-center gap-1">
                    {mobile && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onBack}
                            aria-label="Back to inbox"
                            className="mr-0.5"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    )}
                    <Tooltip>
                        <TooltipTrigger render={<Button variant="ghost" size="icon" disabled={!thread} onClick={handleMarkDone} />}>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="sr-only">Mark as done</span>
                        </TooltipTrigger>
                        <TooltipContent>Mark as done</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger render={<Button variant="ghost" size="icon" disabled={!thread} onClick={toggleStar} />}>
                            <Star className={cn("w-4 h-4", thread?.isStarred && "fill-amber-400 text-amber-400")} />
                            <span className="sr-only">Star thread</span>
                        </TooltipTrigger>
                        <TooltipContent>{thread?.isStarred ? 'Remove star' : 'Star thread'}</TooltipContent>
                    </Tooltip>
                    {!mobile && (
                        <Tooltip>
                            <TooltipTrigger render={<Button variant="ghost" size="icon" disabled={!thread} onClick={toggleMute} />}>
                                {thread?.isMuted ? (
                                    <BellOff className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                    <Bell className="w-4 h-4" />
                                )}
                                <span className="sr-only">Mute thread</span>
                            </TooltipTrigger>
                            <TooltipContent>{thread?.isMuted ? 'Unmute thread' : 'Mute thread'}</TooltipContent>
                        </Tooltip>
                    )}
                    <Separator orientation="vertical" className="h-6 mx-1" />
                    {!mobile && (
                        <Tooltip>
                            <Popover>
                            <PopoverTrigger render={
                                <TooltipTrigger render={<Button variant="ghost" size="icon" disabled={!thread} />}>
                                    <Clock className="w-4 h-4" />
                                    <span className="sr-only">Snooze</span>
                                </TooltipTrigger>
                            } />
                            <PopoverContent className="flex w-[535px] p-0">
                                <div className="flex flex-col gap-2 px-2 py-4 border-r">
                                    <div className="px-4 text-sm font-medium">Snooze until</div>
                                    <div className="grid min-w-[250px] gap-1">
                                        <Button
                                            variant="ghost"
                                            className="justify-start font-normal"
                                        >
                                            Later today{" "}
                                            <span className="ml-auto text-muted-foreground">
                                                {format(addHours(today, 4), "E, h:m b")}
                                            </span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="justify-start font-normal"
                                        >
                                            Tomorrow
                                            <span className="ml-auto text-muted-foreground">
                                                {format(addDays(today, 1), "E, h:m b")}
                                            </span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="justify-start font-normal"
                                        >
                                            This weekend
                                            <span className="ml-auto text-muted-foreground">
                                                {format(nextSaturday(today), "E, h:m b")}
                                            </span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="justify-start font-normal"
                                        >
                                            Next week
                                            <span className="ml-auto text-muted-foreground">
                                                {format(addDays(today, 7), "E, h:m b")}
                                            </span>
                                        </Button>
                                    </div>
                                </div>
                                <div className="p-2">
                                    <Calendar />
                                </div>
                            </PopoverContent>
                        </Popover>
                        <TooltipContent>Snooze</TooltipContent>
                    </Tooltip>
                    )}
                </div>
                <div className="flex items-center gap-2 ml-auto">
                    <Tooltip>
                        <TooltipTrigger render={<Button variant="ghost" size="icon" disabled={!thread} onClick={() => handleReply('reply')} />}>
                            <Reply className="w-4 h-4" />
                            <span className="sr-only">Reply</span>
                        </TooltipTrigger>
                        <TooltipContent>Reply</TooltipContent>
                    </Tooltip>
                    {!mobile && (
                        <>
                            <Tooltip>
                                <TooltipTrigger render={<Button variant="ghost" size="icon" disabled={!thread} onClick={() => handleReply('replyAll')} />}>
                                    <ReplyAll className="w-4 h-4" />
                                    <span className="sr-only">Reply all</span>
                                </TooltipTrigger>
                                <TooltipContent>Reply all</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger render={<Button variant="ghost" size="icon" disabled={!thread} onClick={handleForward} />}>
                                    <Forward className="w-4 h-4" />
                                    <span className="sr-only">Forward</span>
                                </TooltipTrigger>
                                <TooltipContent>Forward</TooltipContent>
                            </Tooltip>
                        </>
                    )}
                </div>
                <Separator orientation="vertical" className="h-6 mx-2" />
                <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" disabled={!thread} />}>
                        <MoreVertical className="w-4 h-4" />
                        <span className="sr-only">More</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        {mobile && (
                            <>
                                <DropdownMenuItem onClick={() => handleReply('replyAll')}>
                                    <ReplyAll className="size-4" />
                                    Reply all
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleForward}>
                                    <Forward className="size-4" />
                                    Forward
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleMarkDone}>
                                    <CheckCircle2 className="size-4" />
                                    Mark as done
                                </DropdownMenuItem>
                            </>
                        )}
                        <DropdownMenuItem onClick={handleMarkUnread}>
                            <Mail className="size-4" />
                            Mark as unread
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={toggleStar}>
                            <Star className="size-4" />
                            {thread?.isStarred ? 'Remove star' : 'Star thread'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={openLabelDialog}>
                            <Tag className="size-4" />
                            Add label
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={toggleMute}>
                            {thread?.isMuted ? (
                                <Bell className="size-4" />
                            ) : (
                                <BellOff className="size-4" />
                            )}
                            {thread?.isMuted ? 'Unmute thread' : 'Mute thread'}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <Separator />
            <>
                {thread ? (
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                            <div className="flex min-w-0 items-start gap-3 text-sm sm:gap-4">
                                <Avatar>
                                    <AvatarImage alt={'lol'} />
                                    <AvatarFallback>
                                        {thread?.emails[0]?.from?.name?.split(" ")
                                            .map((chunk) => chunk[0])
                                            .join("")}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid min-w-0 gap-1">
                                    <div className="flex min-w-0 flex-wrap items-center gap-2 text-base font-semibold sm:text-sm">
                                        <span className="truncate">
                                            {thread.emails[0]?.from?.name}
                                        </span>
                                        {thread.isMuted && (
                                            <Badge variant="outline" className="gap-1 text-[10px] font-normal text-muted-foreground">
                                                <BellOff className="size-3" />
                                                Muted
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="line-clamp-2 text-sm text-muted-foreground sm:text-xs sm:line-clamp-1">
                                        {thread.emails[0]?.subject}
                                    </div>
                                    <div className="truncate text-xs">
                                        <span className="font-medium">Reply-To:</span> {thread.emails[0]?.from?.address}
                                    </div>
                                    {(thread.labels?.length ?? 0) > 0 && (
                                        <div className="flex flex-wrap items-center gap-1 pt-1">
                                            {thread.labels.map((label) => (
                                                <Badge key={label} variant="secondary" className="text-[10px] font-normal">
                                                    {label}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {thread.emails[0]?.sentAt && (
                                <div className="text-xs text-muted-foreground sm:ml-auto sm:shrink-0">
                                    {format(new Date(thread.emails[0].sentAt), "PPpp")}
                                </div>
                            )}
                        </div>
                        <Separator />
                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                            <div className="flex flex-col gap-4 p-4 sm:p-6">
                                {thread.emails.map(email => {
                                    return <EmailDisplay key={email.id} email={email} />
                                })}
                            </div>
                        </div>
                        <div data-reply-box className="shrink-0 border-t bg-background">
                            <ReplyBox
                                replyDetails={replyDetails}
                                replyType={replyType}
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
                            <LogoMark className="size-16 opacity-80" glow />
                            <div>
                                <p className="text-sm font-semibold text-foreground">
                                    No message selected
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Pick a thread from the list, or press{" "}
                                    <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
                                        Ctrl
                                    </kbd>{" "}
                                    +{" "}
                                    <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
                                        K
                                    </kbd>{" "}
                                    to jump anywhere.
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </>

            <Dialog open={labelsOpen} onOpenChange={setLabelsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Labels</DialogTitle>
                        <DialogDescription>
                            Add labels separated by commas. Press Enter to save.
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        value={labelInput}
                        onChange={(event) => setLabelInput(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault()
                                saveLabels()
                            }
                        }}
                        placeholder="e.g. Work, Important"
                        autoFocus
                    />
                    <DialogFooter showCloseButton>
                        <Button onClick={saveLabels} disabled={updateThread.isPending}>
                            Save labels
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
