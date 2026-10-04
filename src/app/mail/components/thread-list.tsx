'use client'

import { useThreads } from "@/hooks/use-threads"
import React from "react";
import { format } from "date-fns"


const ThreadList = () => {
    const { threads } = useThreads()

    const groupedThreads = threads?.reduce((acc, thread) => {
        const date = format(thread.lastMessageDate ?? new Date(), "yyyy-MM-dd");
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(thread);
        return acc;
    }, {} as Record<string, typeof threads>);
    return (
        <div className="max-w-full overflow-y-scroll max-h-[calc(100vh-120px)] no-scrollbar px-4">
            <div className='flex-col gap-2 p-4 pt-0'>
                {Object.entries(groupedThreads ?? {}).map(([date, threads]) => {
                    return (
                        <React.Fragment key={date}>
                            <div className="text-xs font-medium text-muted-foreground mt-4 first:mt-0">
                                {date}
                            </div>
                            {threads?.map(thread => (
                                <div
                                    key={thread.id}
                                    className="flex flex-col gap-1 rounded-lg border p-3 text-sm cursor-pointer hover:bg-accent"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold">
                                            {thread.emails[0]?.from?.name ?? thread.emails[0]?.from?.address}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {thread.emails[0]?.sentAt
                                                ? format(new Date(thread.emails[0].sentAt), 'MMM d')
                                                : ''}
                                        </span>
                                    </div>
                                    <div className="font-medium">{thread.emails[0]?.subject}</div>
                                    <div className="text-xs text-muted-foreground line-clamp-2">
                                        {thread.emails[0]?.bodySnippet}
                                    </div>
                                </div>
                            ))}
                        </React.Fragment>
                    )
                }
                )
                }

            </div>
        </div>
    );
};
export default ThreadList
