import { Prisma } from "@prisma/client";
import { db } from "@/server/db";

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

/**
 * Resolve a stale/duplicate account id to the row that currently owns the
 * mailbox's mail (the one with the most threads).
 */
export async function resolveCanonicalAccount(userId: string, email: string) {
    const accounts = await db.account.findMany({
        where: {
            userId,
            emailAddress: { equals: email, mode: "insensitive" },
        },
        select: {
            id: true,
            emailAddress: true,
            name: true,
            token: true,
            nextDeltaToken: true,
            _count: { select: { threads: true } },
        },
    });

    accounts.sort(
        (a, b) =>
            b._count.threads - a._count.threads || a.id.localeCompare(b.id),
    );

    const canonical = accounts[0];
    if (!canonical) return null;

    return {
        id: canonical.id,
        emailAddress: canonical.emailAddress,
        name: canonical.name,
        token: canonical.token,
        nextDeltaToken: canonical.nextDeltaToken,
    };
}

/**
 * A single mailbox can end up linked more than once (one row per Aurinko
 * authorization). Collapse those rows by email and keep the one that holds
 * the most threads, so the UI only ever shows one entry per real account.
 */
export async function getUniqueAccounts(userId: string) {    const accounts = await db.account.findMany({
        where: { userId },
        select: {
            id: true,
            emailAddress: true,
            name: true,
            provider: true,
            _count: { select: { threads: true } },
        },
        orderBy: { id: "asc" },
    });

    const byEmail = new Map<string, (typeof accounts)[number]>();
    for (const account of accounts) {
        const key = normalizeEmail(account.emailAddress);
        const current = byEmail.get(key);
        if (!current || account._count.threads > current._count.threads) {
            byEmail.set(key, account);
        }
    }

    return [...byEmail.values()].map(({ _count, ...account }) => account);
}

/**
 * Merge duplicate account rows for the same mailbox into the row that already
 * has the most mail, then delete duplicate rows that no longer hold anything.
 */
/**
 * Move contact rows onto the canonical account where possible, so recipient
 * suggestions and contact search keep seeing the whole mailbox.
 */
async function moveEmailAddresses(fromAccountId: string, toAccountId: string) {
    await db.$executeRaw(
        Prisma.sql`
            UPDATE "EmailAddress" AS target
            SET "accountId" = ${toAccountId}
            WHERE target."accountId" = ${fromAccountId}
              AND NOT EXISTS (
                  SELECT 1
                  FROM "EmailAddress" AS existing
                  WHERE existing."accountId" = ${toAccountId}
                    AND existing."address" = target."address"
              )
        `,
    );
}

export async function consolidateAccounts(userId: string) {
    const accounts = await db.account.findMany({
        where: { userId },
        select: {
            id: true,
            emailAddress: true,
            nextDeltaToken: true,
            _count: { select: { threads: true } },
        },
        orderBy: { id: "asc" },
    });

    const groups = new Map<string, typeof accounts>();
    for (const account of accounts) {
        const key = normalizeEmail(account.emailAddress);
        const group = groups.get(key);
        if (group) group.push(account);
        else groups.set(key, [account]);
    }

    for (const group of groups.values()) {
        if (group.length < 2) continue;

        group.sort(
            (a, b) =>
                b._count.threads - a._count.threads ||
                a.id.localeCompare(b.id),
        );

        const canonical = group[0]!;
        const duplicates = group.slice(1);

        // Once all mail is already on one row there is nothing left to merge.
        if (duplicates.every((duplicate) => duplicate._count.threads === 0)) {
            continue;
        }

        let deltaToken = canonical.nextDeltaToken;

        for (const duplicate of duplicates) {
            await db.thread.updateMany({
                where: { accountId: duplicate.id },
                data: { accountId: canonical.id },
            });
            await moveEmailAddresses(duplicate.id, canonical.id);

            if (!deltaToken && duplicate.nextDeltaToken) {
                deltaToken = duplicate.nextDeltaToken;
            }

            const addressCount = await db.emailAddress.count({
                where: { accountId: duplicate.id },
            });
            if (addressCount === 0) {
                await db.account
                    .delete({ where: { id: duplicate.id } })
                    .catch(() => undefined);
            }
        }

        if (deltaToken !== canonical.nextDeltaToken) {
            await db.account.update({
                where: { id: canonical.id },
                data: { nextDeltaToken: deltaToken },
            });
        }
    }
}

/**
 * Move every thread in a mailbox onto a specific account row. Used after a
 * sync succeeds so the account with working credentials owns all the mail.
 */
export async function promoteAccountForMailbox(
    userId: string,
    accountId: string,
) {
    const account = await db.account.findFirst({
        where: { id: accountId, userId },
        select: { id: true, emailAddress: true },
    });
    if (!account) return null;

    const siblings = await db.account.findMany({
        where: {
            userId,
            emailAddress: {
                equals: account.emailAddress,
                mode: "insensitive",
            },
        },
        select: { id: true },
    });

    for (const sibling of siblings) {
        if (sibling.id === account.id) continue;
        await db.thread.updateMany({
            where: { accountId: sibling.id },
            data: { accountId: account.id },
        });
        await moveEmailAddresses(sibling.id, account.id);
    }

    return account.id;
}
