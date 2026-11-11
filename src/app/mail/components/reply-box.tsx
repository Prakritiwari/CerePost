'use client'
import React from 'react'
import EmailEditor from './email-editor'
import { useThread } from './use-thread'
import useThreads from '@/hooks/use-threads'
import { api } from '@/trpc/react'
import { toast } from 'sonner'

export type ReplyAddress = {
    name: string | null
    address: string
}

export type ReplyDetails = {
    to: ReplyAddress[]
    cc: ReplyAddress[]
    from: ReplyAddress
    subject: string
    id: string
}

const ReplyBox = ({
    replyDetails,
    replyType,
}: {
    replyDetails: ReplyDetails | null
    replyType: 'reply' | 'replyAll'
}) => {
    const [threadId] = useThread()

    if (!replyDetails) {
        return (
            <div className="p-4">
                <div className="h-28 animate-pulse rounded-lg bg-muted/40" />
            </div>
        )
    }

    return (
        <Component
            key={`${threadId}-${replyType}-${replyDetails.id}`}
            replyDetails={replyDetails}
        />
    )
}

const Component = ({ replyDetails }: { replyDetails: ReplyDetails }) => {
    const [threadId] = useThread()
    const { accountId } = useThreads()

    const [subject, setSubject] = React.useState(
        replyDetails.subject.startsWith('Re:')
            ? replyDetails.subject
            : `Re: ${replyDetails.subject}`,
    )
    const [toValues, setToValues] = React.useState<
        { label: string; value: string }[]
    >(
        replyDetails.to.map((to) => ({
            label: to.name ?? to.address,
            value: to.address,
        })),
    )
    const [ccValues, setCcValues] = React.useState<
        { label: string; value: string }[]
    >(
        replyDetails.cc.map((cc) => ({
            label: cc.name ?? cc.address,
            value: cc.address,
        })),
    )

    const sendEmail = api.mail.sendEmail.useMutation()
    const syncEmails = api.mail.syncEmails.useMutation()
    const utils = api.useUtils()

    const handleSend = async (value: string) => {
        if (toValues.length === 0) {
            toast.error('Add at least one recipient')
            return
        }

        sendEmail.mutate(
            {
                accountId,
                threadId: threadId ?? undefined,
                body: value,
                subject,
                from: {
                    name:
                        replyDetails.from.name ??
                        replyDetails.from.address,
                    address: replyDetails.from.address,
                },
                to: toValues.map((to) => ({
                    name: to.label,
                    address: to.value,
                })),
                cc: ccValues.map((cc) => ({
                    name: cc.label,
                    address: cc.value,
                })),
                replyTo: {
                    name:
                        replyDetails.from.name ??
                        replyDetails.from.address,
                    address: replyDetails.from.address,
                },
                inReplyTo: replyDetails.id,
            },
            {
                onSuccess: () => {
                    toast.success('Email sent')
                    void utils.mail.getThreads.invalidate()
                    void utils.mail.getThreadById.invalidate()
                    void utils.mail.getNumThreads.invalidate()
                    syncEmails.mutate({ accountId })
                },
                onError: (error) => {
                    toast.error(error.message || 'Could not send the email')
                },
            },
        )
    }

    return (
        <EmailEditor
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
            to={toValues.map((to) => to.value)}
            handleSend={handleSend}
            isSending={sendEmail.isPending}
            isComposing={false}
        />
    )
}

export default ReplyBox
