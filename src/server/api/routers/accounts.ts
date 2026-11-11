import z from "zod";
import { createTRPCRouter, privateProcedure } from "../trpc";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { OramaManager } from "@/lib/orama";
import { consolidateAccounts, getUniqueAccounts, resolveCanonicalAccount } from "@/server/account-utils";


export const authoriseAccountAccess = async (accountId: string, userId: string) => {
    const account = await db.account.findFirst({
        where: {
            id: accountId,
            userId
        },
        select: {
            token: true,
            emailAddress: true,
            name: true,
            id: true,

        }
    })
    if (!account) {
        throw new Error("Account not found");
    }

    return (await resolveCanonicalAccount(userId, account.emailAddress)) ?? account
}

export const accountRouter = createTRPCRouter({
    getAccounts: privateProcedure.query(({ ctx }) => {
        return getUniqueAccounts(ctx.auth.userId);
    }),

    consolidateAccounts: privateProcedure.mutation(async ({ ctx }) => {
        await consolidateAccounts(ctx.auth.userId);
        return { success: true };
    }),

    getNumThreads: privateProcedure.input(z.object({
        accountId: z.string(),
        tab: z.string(),
    })).query(async ({ ctx, input }) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)

        let filter: Prisma.ThreadWhereInput = {}

        if (input.tab === 'inbox') {
            filter.inboxStatus = true
        } else if (input.tab === 'drafts') {
            filter.draftStatus = true
        } else if (input.tab === 'sent') {
            filter.sentStatus = true
        } else if (input.tab === 'starred') {
            filter.isStarred = true
        }

        return await ctx.db.thread.count({
            where: {
                accountId: account.id,
                ...filter
            }
        })
    }),

    getThreads: privateProcedure.input(z.object({
        accountId: z.string(),
        tab: z.string(),
        done: z.boolean()
    })).query(async ({ ctx, input }) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)

        let filter: Prisma.ThreadWhereInput = {}

        if (input.tab === 'inbox') {
            filter.inboxStatus = true
        } else if (input.tab === 'drafts') {
            filter.draftStatus = true
        } else if (input.tab === 'sent') {
            filter.sentStatus = true
        } else if (input.tab === 'starred') {
            filter.isStarred = true
        }

        filter.done = {
            equals: input.done
        }

        return await ctx.db.thread.findMany({
            where: {
                accountId: account.id,
                ...filter
            },
            include: {
                emails: {
                    orderBy: {
                        sentAt: 'asc'
                    },
                    select: {
                        from: {
                            select: {
                                name: true,
                                address: true,
                            }
                        },
                        body: true,
                        bodySnippet: true,
                        emailLabel: true,
                        subject: true,
                        sysLabels: true,
                        id: true,
                        sentAt: true,
                    }
                }
            },
            take: 15,
            orderBy: {
                lastMessageDate: 'desc'
            }
        })
    }),
    getSuggestions: privateProcedure.input(z.object({
        accountId: z.string()
    })).query(async ({ ctx, input }) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
        return await ctx.db.emailAddress.findMany({
            where: {
                accountId: account.id
            },
            select: {
                address: true,
                name: true
            }
        })
    }),
    searchEmails: privateProcedure.input(z.object({
        accountId: z.string(),
        query: z.string()
    })).mutation(async ({ ctx, input }) => {
        const account = authoriseAccountAccess(input.accountId, ctx.auth.userId)
        const orama = new OramaManager((await account).id)
        await orama.initialize()
        const results = await orama.search({ term: input.query })
        return results

    })

})
