'use client'
import React from 'react'
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

import { Loader2, Sparkles, Check, X, HelpCircle } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import useThreads from '@/hooks/use-threads'
import { useThread } from '../use-thread'
import { turndown } from '@/lib/turndown'
import { toast } from 'sonner'
import { api } from '@/trpc/react'

type Props = {
    onGenerate: (value: string, isFirst: boolean) => void
    isComposing?: boolean
}

const AIComposeButton = (props: Props) => {
    const [prompt, setPrompt] = React.useState('')
    const [open, setOpen] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const { account, threads, accountId } = useThreads()
    const [threadId] = useThread()
    const thread = threads?.find(t => t.id === threadId)
    const { data: foundThread } = api.mail.getThreadById.useQuery({
        accountId,
        threadId: threadId ?? ''
    }, { enabled: !thread && !!threadId })
    const currentThread = thread ?? foundThread

    const aiGenerate = async (customPrompt?: string) => {
        try {
            setLoading(true)
            setOpen(false)

            let context = ''
            if (!props.isComposing && currentThread?.emails?.length) {
                context = currentThread.emails
                    .map(m => {
                        const fromStr = m.from?.name ? `${m.from.name} <${m.from.address}>` : (m.from?.address || 'Unknown')
                        const bodyStr = turndown.turndown(m.body ?? m.bodySnippet ?? '')
                        return `From: ${fromStr}\nSubject: ${m.subject || ''}\nDate: ${m.sentAt ? new Date(m.sentAt).toLocaleString() : ''}\n\n${bodyStr}`
                    })
                    .join('\n\n---\n\n')
            }

            const userName = account?.name || 'Me'
            const effectivePrompt = customPrompt?.trim()
                ? `${customPrompt.trim()} (Reply on behalf of ${userName} based on the email context)`
                : `Read the latest email in the thread and automatically write a thoughtful, professional, and natural reply on behalf of ${userName}. Directly address the sender and any questions or topics mentioned.`

            const response = await fetch('/api/ai/compose', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    context:
                        (context ? `THREAD HISTORY:\n${context}\n\n` : '') +
                        `MY NAME: ${userName}`,
                    prompt: effectivePrompt,
                }),
            })

            if (!response.ok) {
                const data = (await response.json().catch(() => null)) as
                    | { error?: string }
                    | null
                throw new Error(data?.error || 'Failed to generate email')
            }

            if (!response.body) throw new Error('No response body')

            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let isFirst = true

            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                const chunk = decoder.decode(value, { stream: true })
                if (chunk) {
                    props.onGenerate(chunk, isFirst)
                    isFirst = false
                }
            }

            const tail = decoder.decode()
            if (tail) props.onGenerate(tail, isFirst)

            toast.success("AI reply generated!")
        } catch (error: any) {
            console.error("AI email generation error:", error)
            toast.error(error?.message || "Failed to generate email")
        } finally {
            setLoading(false)
            setPrompt('')
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
                render={
                    <Button
                        size='sm'
                        variant={'outline'}
                        disabled={loading}
                        className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="size-3.5 animate-spin text-primary" />
                                <span>Generating...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="size-3.5 text-purple-500" />
                                <span>AI {props.isComposing ? 'Compose' : 'Reply'}</span>
                            </>
                        )}
                    </Button>
                }
            />
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="size-5 text-purple-500" />
                        {props.isComposing ? 'AI Email Composer' : 'AI Auto-Reply'}
                    </DialogTitle>
                    <DialogDescription>
                        {props.isComposing
                            ? 'Describe what you want to write or give bullet points.'
                            : 'AI will read the previous emails and draft a context-aware response.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3 py-2">
                    {/* Primary 1-Click Auto Generate Button */}
                    {!props.isComposing && (
                        <div className="flex flex-col gap-2 p-3 bg-muted/40 rounded-lg border">
                            <span className="text-xs font-medium text-foreground">
                                Instant One-Click Reply:
                            </span>
                            <Button
                                className="w-full gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700"
                                onClick={() => aiGenerate()}
                                disabled={loading}
                            >
                                <Sparkles className="size-4" />
                                Auto-Generate Reply from Context
                            </Button>

                            {/* Quick Tone Chips */}
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                <Button
                                    size="xs"
                                    variant="outline"
                                    className="gap-1 text-xs"
                                    onClick={() => aiGenerate("Write a positive response accepting or confirming what was proposed.")}
                                >
                                    <Check className="size-3 text-green-500" />
                                    Accept / Confirm
                                </Button>
                                <Button
                                    size="xs"
                                    variant="outline"
                                    className="gap-1 text-xs"
                                    onClick={() => aiGenerate("Write a polite, professional response declining the request.")}
                                >
                                    <X className="size-3 text-red-500" />
                                    Politely Decline
                                </Button>
                                <Button
                                    size="xs"
                                    variant="outline"
                                    className="gap-1 text-xs"
                                    onClick={() => aiGenerate("Write a reply asking for more details, clarification, or next steps.")}
                                >
                                    <HelpCircle className="size-3 text-blue-500" />
                                    Ask for Details
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Custom prompt textarea */}
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs text-muted-foreground font-medium">
                            {props.isComposing ? 'Your prompt / bullet points:' : 'Or add custom instructions (optional):'}
                        </span>
                        <Textarea
                            placeholder={
                                props.isComposing
                                    ? "e.g. Schedule a catch-up call next Tuesday at 3 PM..."
                                    : "e.g. Tell them I will review and reply by Friday afternoon..."
                            }
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={3}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    aiGenerate(prompt)
                                }
                            }}
                        />
                    </div>

                    <Button
                        variant={props.isComposing ? "default" : "secondary"}
                        className="w-full"
                        disabled={loading || (props.isComposing && !prompt.trim())}
                        onClick={() => aiGenerate(prompt)}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="size-4 animate-spin mr-2" />
                                Generating...
                            </>
                        ) : (
                            prompt.trim() ? "Generate with Instructions" : (props.isComposing ? "Generate" : "Auto-Generate Reply")
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default AIComposeButton