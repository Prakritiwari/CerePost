import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "../trpc";

export const mailRouter = createTRPCRouter({
    getNumThreads: privateProcedure
        .input(z.object({
            accountId: z.string(),
            tab: z.enum(["inbox", "drafts", "sent"]),
        }))
        .query(async ({ ctx, input }) => {
            const statusFilter = {
                inbox: { inboxStatus: true },
                drafts: { draftStatus: true },
                sent: { sentStatus: true },
            }[input.tab];

            return ctx.db.thread.count({
                where: {
                    accountId: input.accountId,
                    account: {
                        userId: ctx.auth.userId,
                    },
                    ...statusFilter,
                },
            });
        }),
});
