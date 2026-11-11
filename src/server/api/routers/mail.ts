import { z } from "zod";
import axios from "axios";
import { createTRPCRouter, privateProcedure, publicProcedure } from "../trpc";
import { OramaManager, getOramaManager } from "@/lib/orama";
import Account from "@/lib/account";
import { syncEmailsToDatabase } from "@/lib/sync-to-db";
import { db } from "@/server/db";
import { getEmailDetails } from "@/lib/aurinko";
import type { Prisma } from "@prisma/client";
import { emailAddressSchema } from "@/lib/types";
import { getUniqueAccounts, promoteAccountForMailbox, resolveCanonicalAccount } from "@/server/account-utils";
// import { FREE_CREDITS_PER_DAY } from "@/app/constants";

export const authoriseAccountAccess = async (accountId: string, userId: string) => {
    const account = await db.account.findFirst({
        where: {
            id: accountId,
            userId: userId,
        },
        select: {
            id: true, emailAddress: true, name: true, token: true, nextDeltaToken: true
        }
    })
    if (!account) throw new Error("Invalid token")

    return (await resolveCanonicalAccount(userId, account.emailAddress)) ?? account
}

const inboxFilter = (accountId: string): Prisma.ThreadWhereInput => ({
    accountId,
    inboxStatus: true
})

const sentFilter = (accountId: string): Prisma.ThreadWhereInput => ({
    accountId,
    sentStatus: true
})

const draftFilter = (accountId: string): Prisma.ThreadWhereInput => ({
    accountId,
    draftStatus: true
})

export const mailRouter = createTRPCRouter({
    getAccounts: privateProcedure.query(async ({ ctx }) => {
        return await getUniqueAccounts(ctx.auth.userId);
    }),
    getNumThreads: privateProcedure.input(z.object({
        accountId: z.string(),
        tab: z.string()
    })).query(async ({ ctx, input }) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
        let filter: Prisma.ThreadWhereInput = {}
        if (input.tab === "inbox") {
            filter = inboxFilter(account.id)
        } else if (input.tab === "sent") {
            filter = sentFilter(account.id)
        } else if (input.tab === "drafts") {
            filter = draftFilter(account.id)
        } else if (input.tab === "starred") {
            filter = { accountId: account.id, isStarred: true }
        }
        return await ctx.db.thread.count({
            where: filter
        })
    }),
    getThreads: privateProcedure.input(z.object({
        accountId: z.string(),
        tab: z.string(),
        done: z.boolean()
    })).query(async ({ ctx, input }) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)

        let filter: Prisma.ThreadWhereInput = {}
        if (input.tab === "inbox") {
            filter = inboxFilter(account.id)
        } else if (input.tab === "sent") {
            filter = sentFilter(account.id)
        } else if (input.tab === "drafts") {
            filter = draftFilter(account.id)
        } else if (input.tab === "starred") {
            filter = { accountId: account.id, isStarred: true }
        }

        filter.done = {
            equals: input.done
        }

        const threads = await ctx.db.thread.findMany({
            where: filter,
            include: {
                emails: {
                    orderBy: {
                        sentAt: "asc"
                    },
                    select: {
                        from: true,
                        to: true,
                        cc: true,
                        bcc: true,
                        body: true,
                        bodySnippet: true,
                        emailLabel: true,
                        subject: true,
                        sysLabels: true,
                        internetMessageId: true,
                        id: true,
                        sentAt: true
                    }
                }
            },
            take: 15,
            orderBy: {
                lastMessageDate: "desc"
            }
        })
        return threads
    }),

    getThreadById: privateProcedure.input(z.object({
        accountId: z.string(),
        threadId: z.string()
    })).query(async ({ ctx, input }) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
        return await ctx.db.thread.findFirst({
            where: { id: input.threadId, accountId: account.id },
            include: {
                emails: {
                    orderBy: {
                        sentAt: "asc"
                    },
                    select: {
                        from: true,
                        to: true,
                        cc: true,
                        bcc: true,
                        body: true,
                        subject: true,
                        bodySnippet: true,
                        emailLabel: true,
                        sysLabels: true,
                        internetMessageId: true,
                        id: true,
                        sentAt: true
                    }
                }
            },
        })
    }),

    getReplyDetails: privateProcedure.input(z.object({
        accountId: z.string(),
        threadId: z.string(),
        replyType: z.enum(['reply', 'replyAll'])
    })).query(async ({ ctx, input }) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)

        const thread = await ctx.db.thread.findFirst({
            where: { id: input.threadId, accountId: account.id },
            include: {
                emails: {
                    orderBy: { sentAt: 'asc' },
                    select: {
                        from: true,
                        to: true,
                        cc: true,
                        bcc: true,
                        sentAt: true,
                        subject: true,
                        internetMessageId: true,
                    },
                },
            },
        });

        if (!thread || thread.emails.length === 0) {
            throw new Error("Thread not found or empty");
        }

        const accountAddress = account.emailAddress.trim().toLowerCase();
        const lastExternalEmail = [...thread.emails]
            .reverse()
            .find((email) => email.from.address.toLowerCase() !== accountAddress);

        if (!lastExternalEmail) {
            throw new Error("No external email found in thread");
        }

        const replyTo = new Map<string, (typeof lastExternalEmail.from)>();
        const addRecipient = (address: typeof lastExternalEmail.from) => {
            const key = address.address.toLowerCase();
            if (key === accountAddress || replyTo.has(key)) return;
            replyTo.set(key, address);
        };

        addRecipient(lastExternalEmail.from);
        if (input.replyType === 'replyAll') {
            for (const address of lastExternalEmail.to) addRecipient(address);
        }

        const cc = new Map<string, (typeof lastExternalEmail.from)>();
        if (input.replyType === 'replyAll') {
            for (const address of lastExternalEmail.cc) {
                const key = address.address.toLowerCase();
                if (key === accountAddress || replyTo.has(key) || cc.has(key)) {
                    continue;
                }
                cc.set(key, address);
            }
        }

        return {
            to: [...replyTo.values()],
            cc: [...cc.values()],
            from: { name: account.name, address: account.emailAddress },
            subject: `${lastExternalEmail.subject}`,
            id: lastExternalEmail.internetMessageId
        };
    }),

    syncEmails: privateProcedure.input(z.object({
        accountId: z.string()
    })).mutation(async ({ ctx, input }) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)

        // Repeated Aurinko links can leave the mailbox with several credentials.
        // Try the newest connections until one can actually reach the mailbox.
        const candidates = await ctx.db.account.findMany({
            where: {
                userId: ctx.auth.userId,
                emailAddress: {
                    equals: account.emailAddress,
                    mode: "insensitive",
                },
            },
            select: { id: true, token: true, nextDeltaToken: true },
            orderBy: { id: "desc" },
        })

        let syncedAccountId: string | null = null
        let lastError: { code?: string; message: string } | null = null

        const readAurinkoError = (error: unknown) => {
            if (axios.isAxiosError(error)) {
                const data = error.response?.data as
                    | { code?: string; message?: string }
                    | undefined
                return {
                    code: data?.code,
                    message: data?.message ?? error.message,
                }
            }
            return {
                code: undefined,
                message:
                    error instanceof Error
                        ? error.message
                        : "Unknown sync error",
            }
        }

        for (const candidate of candidates) {
            const client = new Account(candidate.token)

            const runInitialSync = async () => {
                const initial = await client.performInitialSync()
                if (!initial) throw new Error("Initial sync failed")
                await ctx.db.account.update({
                    where: { id: candidate.id },
                    data: { nextDeltaToken: initial.deltaToken }
                })
                await syncEmailsToDatabase(initial.emails, candidate.id)
            }

            try {
                if (candidate.nextDeltaToken) {
                    try {
                        await client.syncEmails()
                    } catch (error) {
                        const deltaError = readAurinkoError(error)
                        // Billing failures apply to the whole workspace and
                        // won't be fixed by a fresh sync.
                        if (deltaError.code === "payment.required") {
                            throw error
                        }
                        // An invalid/expired delta token is connection-specific;
                        // retry this connection with a fresh sync.
                        await runInitialSync()
                    }
                } else {
                    await runInitialSync()
                }

                syncedAccountId = candidate.id
                break
            } catch (error) {
                lastError = readAurinkoError(error)
                // These failures apply to the whole Aurinko workspace, so
                // trying the other duplicate connections only wastes time.
                if (lastError.code === "payment.required") break
            }
        }

        if (!syncedAccountId) {
            if (lastError?.code === "payment.required") {
                console.warn(
                    "Mailbox refresh blocked: Aurinko requires an active billing plan.",
                )
                throw new Error(
                    "Aurinko requires an active billing plan to sync mail. Update your Aurinko subscription, then refresh again.",
                )
            }

            console.error("Mailbox refresh failed:", lastError)

            if (lastError?.code === "token.dead") {
                throw new Error(
                    "This mailbox connection has expired. Reconnect it with Add account.",
                )
            }

            throw new Error(
                lastError?.message ||
                    "Could not refresh this mailbox. Reconnect with Add account.",
            )
        }

        // The connection that worked becomes the one that owns all the mail.
        await promoteAccountForMailbox(ctx.auth.userId, syncedAccountId)

        return { syncedAt: Date.now(), accountId: syncedAccountId }
    }),
    updateThread: privateProcedure.input(z.object({
        accountId: z.string(),
        threadId: z.string(),
        isStarred: z.boolean().optional(),
        isMuted: z.boolean().optional(),
        labels: z.array(z.string()).max(10).optional(),
    })).mutation(async ({ ctx, input }) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)

        const data: Prisma.ThreadUpdateManyMutationInput = {}
        if (typeof input.isStarred === 'boolean') data.isStarred = input.isStarred
        if (typeof input.isMuted === 'boolean') data.isMuted = input.isMuted
        if (input.labels) {
            data.labels = [...new Set(input.labels.map(label => label.trim()).filter(Boolean))].slice(0, 10)
        }

        if (Object.keys(data).length === 0) return { updated: 0 }

        const result = await ctx.db.thread.updateMany({
            where: { id: input.threadId, accountId: account.id },
            data,
        })
        if (result.count === 0) throw new Error("Thread not found")
        return { updated: result.count }
    }),
    setUndone: privateProcedure.input(z.object({
        threadId: z.string().optional(),
        threadIds: z.array(z.string()).optional(),
        accountId: z.string()
    })).mutation(async ({ ctx, input }) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
        if (!account) throw new Error("Invalid token")
        if (input.threadId) {
            await ctx.db.thread.update({
                where: {
                    id: input.threadId
                },
                data: {
                    done: false
                }
            })
        }
        if (input.threadIds) {
            await ctx.db.thread.updateMany({
                where: {
                    id: {
                        in: input.threadIds
                    }
                },
                data: {
                    done: false
                }
            })
        }
    }),
    setDone: privateProcedure.input(z.object({
        threadId: z.string().optional(),
        threadIds: z.array(z.string()).optional(),
        accountId: z.string()
    })).mutation(async ({ ctx, input }) => {
        if (!input.threadId && !input.threadIds) throw new Error("No threadId or threadIds provided")
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
        if (!account) throw new Error("Invalid token")
        if (input.threadId) {
            await ctx.db.thread.update({
                where: {
                    id: input.threadId
                },
                data: {
                    done: true
                }
            })
        }
        if (input.threadIds) {
            await ctx.db.thread.updateMany({
                where: {
                    id: {
                        in: input.threadIds
                    }
                },
                data: {
                    done: true
                }
            })
        }
    }),
    getEmailDetails: privateProcedure.input(z.object({
        emailId: z.string(),
        accountId: z.string()
    })).query(async ({ ctx, input }) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
        return await getEmailDetails(account.token, input.emailId)
    }),
    sendEmail: privateProcedure.input(z.object({
        accountId: z.string(),
        body: z.string(),
        subject: z.string(),
        from: emailAddressSchema,
        to: z.array(emailAddressSchema),
        cc: z.array(emailAddressSchema).optional(),
        bcc: z.array(emailAddressSchema).optional(),
        replyTo: emailAddressSchema,
        inReplyTo: z.string().optional(),
        threadId: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
        const acc = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
        const account = new Account(acc.token)
        console.log('sendmail', input)
        await account.sendEmail({
            body: input.body,
            subject: input.subject,
            threadId: input.threadId,
            to: input.to,
            bcc: input.bcc,
            cc: input.cc,
            replyTo: input.replyTo,
            from: input.from,
            inReplyTo: input.inReplyTo,
        })
    }),
    getEmailSuggestions: privateProcedure.input(z.object({
        accountId: z.string(),
        query: z.string(),
    })).query(async ({ ctx, input }) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
        return await ctx.db.emailAddress.findMany({
            where: {
                accountId: input.accountId,
                OR: [
                    {
                        address: {
                            contains: input.query,
                            mode: 'insensitive',
                        },
                    },
                    {
                        name: {
                            contains: input.query,
                            mode: 'insensitive',
                        },
                    },
                ],
            },
            select: {
                address: true,
                name: true,
            },
            take: 10,
        })
    }),
    getMyAccount: privateProcedure.input(z.object({
        accountId: z.string()
    })).query(async ({ ctx, input }) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
        return account
    }),
    getChatbotInteraction: privateProcedure.query(async ({ ctx }) => {
        const chatbotInteraction = await ctx.db.chatbotInteraction.findUnique({
            where: {
                day: new Date().toDateString(),
                userId: ctx.auth.userId
            }, select: { count: true }
        })
        // const remainingCredits = FREE_CREDITS_PER_DAY - (chatbotInteraction?.count || 0)
        // return {
        //     remainingCredits
        // }
    }),

    searchSuggestions: privateProcedure.input(z.object({
        accountId: z.string(),
        query: z.string(),
    })).query(async ({ ctx, input }) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
        const query = input.query.trim()

        if (query.length < 2) {
            return { threads: [], people: [] }
        }

        const [threads, people] = await Promise.all([
            ctx.db.thread.findMany({
                where: {
                    accountId: account.id,
                    OR: [
                        { subject: { contains: query, mode: "insensitive" } },
                        {
                            emails: {
                                some: {
                                    from: {
                                        name: { contains: query, mode: "insensitive" },
                                    },
                                },
                            },
                        },
                        {
                            emails: {
                                some: {
                                    from: {
                                        address: { contains: query, mode: "insensitive" },
                                    },
                                },
                            },
                        },
                        {
                            emails: {
                                some: {
                                    bodySnippet: { contains: query, mode: "insensitive" },
                                },
                            },
                        },
                    ],
                },
                select: {
                    id: true,
                    subject: true,
                    lastMessageDate: true,
                    isStarred: true,
                    isMuted: true,
                    emails: {
                        orderBy: { sentAt: "desc" },
                        take: 1,
                        select: {
                            from: { select: { name: true, address: true } },
                            bodySnippet: true,
                        },
                    },
                },
                orderBy: { lastMessageDate: "desc" },
                take: 5,
            }),
            ctx.db.emailAddress.findMany({
                where: {
                    accountId: account.id,
                    OR: [
                        { address: { contains: query, mode: "insensitive" } },
                        { name: { contains: query, mode: "insensitive" } },
                    ],
                },
                select: { name: true, address: true },
                take: 4,
            }),
        ])

        return {
            threads: threads.map((thread) => ({
                id: thread.id,
                subject: thread.subject,
                snippet: thread.emails[0]?.bodySnippet ?? "",
                from: thread.emails[0]?.from ?? null,
                sentAt: thread.lastMessageDate,
                isStarred: thread.isStarred,
                isMuted: thread.isMuted,
            })),
            people,
        }
    }),

    searchEmails: privateProcedure.input(z.object({
        accountId: z.string(),
        query: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId);

        const cleanQuery = input.query.trim();
        if (!cleanQuery) {
            return { hits: [] };
        }

        type SearchHit = {
            id: string
            document: {
                title: string
                body: string
                rawBody: string
                from: string
                to: string[]
                sentAt: string
                threadId: string
            }
        }

        // Semantic hits from the vector index. This runs only when keyword
        // matching is weak, so ordinary searches stay immediate.
        const runSemantic = async (): Promise<SearchHit[]> => {
            try {
                const oramaManager = getOramaManager(account.id);
                await oramaManager.initialize();

                let results;
                try {
                    results = await oramaManager.vectorSearch({ prompt: cleanQuery });
                } catch {
                    results = await oramaManager.search({ term: cleanQuery });
                }

                return (results?.hits ?? []).flatMap((hit) => {
                    const document = hit.document as Record<string, unknown>;
                    const threadId =
                        typeof document.threadId === "string"
                            ? document.threadId
                            : "";

                    if (!threadId) return []

                    return [{
                        id: threadId,
                        document: {
                            title:
                                typeof document.title === "string"
                                    ? document.title
                                    : "(no subject)",
                            body:
                                typeof document.body === "string"
                                    ? document.body
                                    : "",
                            rawBody:
                                typeof document.rawBody === "string"
                                    ? document.rawBody
                                    : "",
                            from:
                                typeof document.from === "string"
                                    ? document.from
                                    : "",
                            to: Array.isArray(document.to)
                                ? document.to.filter(
                                      (value): value is string =>
                                          typeof value === "string",
                                  )
                                : [],
                            sentAt:
                                typeof document.sentAt === "string"
                                    ? document.sentAt
                                    : new Date().toISOString(),
                            threadId,
                        },
                    }]
                })
            } catch (error) {
                console.error("Semantic search failed, using keyword search:", error);
                return []
            }
        }

        // Always run the exact-match query too: it covers mail that is not in
        // the semantic index (for example after an account merge). Fetching a
        // compact recent window and filtering in memory is much faster than a
        // large OR over every relation.
        const dbPromise = ctx.db.email.findMany({
            where: {
                thread: {
                    accountId: account.id,
                },
            },
            select: {
                threadId: true,
                subject: true,
                bodySnippet: true,
                sentAt: true,
                from: { select: { name: true, address: true } },
                to: { select: { name: true, address: true } },
            },
            take: 1000,
            orderBy: {
                sentAt: "desc",
            },
        })

        const dbEmails = await dbPromise
        const needle = cleanQuery.toLowerCase()
        const dbMatches = dbEmails.filter((email) => {
            const searchable = [
                email.subject,
                email.bodySnippet ?? "",
                email.from.name ?? "",
                email.from.address,
                ...email.to.flatMap((recipient) => [
                    recipient.name ?? "",
                    recipient.address,
                ]),
            ]
                .join(" ")
                .toLowerCase()
            return searchable.includes(needle)
        })

        const semanticHits =
            dbMatches.length < 3
                ? await Promise.race([
                      runSemantic(),
                      new Promise<SearchHit[]>((resolve) =>
                          setTimeout(() => resolve([]), 4000),
                      ),
                  ])
                : []

        const byThread = new Map<string, SearchHit>()

        for (const email of dbMatches.slice(0, 25)) {
            if (byThread.has(email.threadId)) continue
            byThread.set(email.threadId, {
                id: email.threadId,
                document: {
                    title: email.subject,
                    body: email.bodySnippet ?? "",
                    rawBody: email.bodySnippet ?? "",
                    from: email.from.name
                        ? `${email.from.name} <${email.from.address}>`
                        : email.from.address,
                    to: email.to.map((recipient) =>
                        recipient.name
                            ? `${recipient.name} <${recipient.address}>`
                            : recipient.address,
                    ),
                    sentAt: email.sentAt.toISOString(),
                    threadId: email.threadId,
                },
            })
        }

        for (const hit of semanticHits) {
            if (!byThread.has(hit.document.threadId)) {
                byThread.set(hit.document.threadId, hit)
            }
        }

        const hits = [...byThread.values()]
            .sort(
                (a, b) =>
                    new Date(b.document.sentAt).getTime() -
                    new Date(a.document.sentAt).getTime(),
            )
            .slice(0, 20)

        return { hits };
    }),
});