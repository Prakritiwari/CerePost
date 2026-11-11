'use client'
import { Button } from "@/components/ui/button"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { Pencil } from "lucide-react"

import React from 'react'
import EmailEditor from "./email-editor"
import { api } from "@/trpc/react"
import { useLocalStorage } from "usehooks-ts"
import { toast } from "sonner"

type ComposeDetail = {
    subject?: string
    body?: string
}

const ComposeButton = ({ isCollapsed = false }: { isCollapsed?: boolean }) => {
    const [open, setOpen] = React.useState(false)
    const [composeKey, setComposeKey] = React.useState(0)
    const [accountId] = useLocalStorage('accountId', '')
    const [toValues, setToValues] = React.useState<{ label: string; value: string; }[]>([])
    const [ccValues, setCcValues] = React.useState<{ label: string; value: string; }[]>([])
    const [subject, setSubject] = React.useState<string>('')
    const [initialBody, setInitialBody] = React.useState<string>('')
    const { data: account } = api.mail.getMyAccount.useQuery({ accountId }, { enabled: !!accountId })
    const utils = api.useUtils()

    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'c' && (event.ctrlKey || event.metaKey) && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName ?? '')) {
                event.preventDefault();
                setOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Thread actions (forward) can pre-fill the composer through this event.
    React.useEffect(() => {
        const handleCompose = (event: Event) => {
            const detail = (event as CustomEvent<ComposeDetail>).detail
            if (!detail) return
            setSubject(detail.subject ?? '')
            setInitialBody(detail.body ?? '')
            setToValues([])
            setCcValues([])
            setComposeKey(key => key + 1)
            setOpen(true)
        }
        window.addEventListener('cerepost:compose', handleCompose)
        return () => window.removeEventListener('cerepost:compose', handleCompose)
    }, [])

    const sendEmail = api.mail.sendEmail.useMutation()
    const syncEmails = api.mail.syncEmails.useMutation()

    const resetComposer = () => {
        setSubject('')
        setInitialBody('')
        setToValues([])
        setCcValues([])
        setComposeKey(key => key + 1)
    }

    const handleSend = async (value: string) => {
        if (!account) return
        sendEmail.mutate({
            accountId,
            threadId: undefined,
            body: value,
            subject,
            from: { name: account?.name ?? 'Me', address: account?.emailAddress ?? 'me@example.com' },
            to: toValues.map(to => ({ name: to.value, address: to.value })),
            cc: ccValues.map(cc => ({ name: cc.value, address: cc.value })),
            replyTo: { name: account?.name ?? 'Me', address: account?.emailAddress ?? 'me@example.com' },
            inReplyTo: undefined,
        }, {
            onSuccess: () => {
                toast.success("Email sent")
                setOpen(false)
                resetComposer()
                void utils.mail.getThreads.invalidate()
                void utils.mail.getNumThreads.invalidate()
                syncEmails.mutate({ accountId })
            },
            onError: (error) => {
                console.log(error)
                toast.error(error.message)
            }
        })
    }

    return (
        <Drawer
            open={open}
            onOpenChange={(next) => {
                setOpen(next)
                if (next) setComposeKey(key => key + 1)
                else resetComposer()
            }}
        >
            <DrawerTrigger
                render={
                    isCollapsed ? (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            title="Compose"
                        >
                            <Pencil className='size-4' />
                            <span className="sr-only">Compose</span>
                        </Button>
                    ) : (
                        <Button className="w-full justify-center gap-2 h-10 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 font-semibold shadow-sm rounded-lg transition-all">
                            <Pencil className='size-4' />
                            <span>Compose</span>
                            <kbd className="ml-auto hidden sm:inline-block font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 dark:bg-zinc-200 dark:text-zinc-700">
                                Ctrl+C
                            </kbd>
                        </Button>
                    )
                }
            />
            <DrawerContent className="">
                <DrawerHeader>
                    <DrawerTitle>Compose Email</DrawerTitle>
                    <EmailEditor
                        key={composeKey}
                        toValues={toValues}
                        ccValues={ccValues}

                        onToChange={(values) => {
                            setToValues(values)
                        }}
                        onCcChange={(values) => {
                            setCcValues(values)
                        }}

                        subject={subject}
                        setSubject={setSubject}
                        initialBody={initialBody}

                        to={toValues.map(to => to.value)}
                        handleSend={handleSend}
                        isSending={sendEmail.isPending}

                        defaultToolbarExpand
                        isComposing={true}
                    />
                </DrawerHeader>
            </DrawerContent>

        </Drawer>
    )
}

export default ComposeButton
