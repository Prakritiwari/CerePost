import { getAurinkoToken, getAccountDetails } from "@/lib/aurinko";
import { db } from "@/server/db";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { waitUntil } from "@vercel/functions";
import axios from "axios";

export const GET = async (req: NextRequest) => {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    const fail = (reason: string) =>
        NextResponse.redirect(
            new URL(`/mail?link=failed&reason=${encodeURIComponent(reason)}`, req.url),
        );

    const params = req.nextUrl.searchParams;
    const status = params.get("status");
    if (status !== "success") {
        const error = params.get("error");
        return fail(error && error.length > 0 ? error : "access_denied");
    }

    const code = params.get("code");
    if (!code) return fail("missing_code");

    let token: Awaited<ReturnType<typeof getAurinkoToken>>;
    try {
        token = await getAurinkoToken(code);
    } catch (error) {
        const errorCode = (error as { code?: string }).code;
        const reason =
            errorCode && errorCode.length > 0
                ? errorCode
                : /not configured/i.test((error as Error).message)
                  ? "configuration"
                  : "token_exchange_failed";
        console.error("Aurinko token exchange failed:", {
            reason,
            message: (error as Error).message,
        });
        return fail(reason);
    }

    let accountDetails: Awaited<ReturnType<typeof getAccountDetails>>;
    try {
        accountDetails = await getAccountDetails(token.accessToken);
    } catch {
        return fail("account_details_failed");
    }

    try {
        // Ensure user exists in our database before creating an account linked to it
        const existingUser = await db.user.findUnique({
            where: { id: userId },
        });

        if (!existingUser) {
            const clerkUser = await currentUser();
            const primaryEmail =
                clerkUser?.emailAddresses[0]?.emailAddress ?? accountDetails.email;

            await db.user.upsert({
                where: { id: userId },
                update: {},
                create: {
                    id: userId,
                    emailAddress: primaryEmail,
                    firstName:
                        clerkUser?.firstName ??
                        accountDetails.name?.split(" ")[0] ??
                        null,
                    lastName:
                        clerkUser?.lastName ??
                        accountDetails.name?.split(" ").slice(1).join(" ") ??
                        null,
                    imageUrl: clerkUser?.imageUrl ?? null,
                },
            });
        }

        const normalizedEmail = accountDetails.email.trim().toLowerCase();
        const emailAccounts = await db.account.findMany({
            where: {
                userId,
                emailAddress: { equals: normalizedEmail, mode: "insensitive" },
            },
            include: { _count: { select: { threads: true } } },
            orderBy: { id: "asc" },
        });

        const tokenAccountId = token.accountId.toString();
        const tokenAccount = emailAccounts.find((a) => a.id === tokenAccountId);

        // Re-use an existing row for the same mailbox instead of creating a new
        // account on every re-link. Prefer the freshly authorized row, then the
        // row that holds the most mail.
        const canonical =
            tokenAccount ??
            [...emailAccounts].sort(
                (a, b) =>
                    b._count.threads - a._count.threads ||
                    a.id.localeCompare(b.id),
            )[0];

        let accountId: string;

        if (canonical) {
            let deltaToken = canonical.nextDeltaToken;

            for (const duplicate of emailAccounts) {
                if (duplicate.id === canonical.id) continue;

                // Move any mail synced under the duplicate onto the canonical row.
                await db.thread.updateMany({
                    where: { accountId: duplicate.id },
                    data: { accountId: canonical.id },
                });

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

            await db.account.update({
                where: { id: canonical.id },
                data: {
                    token: token.accessToken,
                    emailAddress: accountDetails.email,
                    name: accountDetails.name,
                    provider: "Google",
                    nextDeltaToken: deltaToken,
                },
            });
            accountId = canonical.id;
        } else {
            const created = await db.account.create({
                data: {
                    id: tokenAccountId,
                    userId,
                    emailAddress: accountDetails.email,
                    name: accountDetails.name,
                    token: token.accessToken,
                    provider: "Google",
                },
            });
            accountId = created.id;
        }

        // Trigger initial sync in the background.
        const baseUrl = process.env.NEXT_PUBLIC_URL?.trim().replace(/\/+$/, "");
        if (baseUrl) {
            waitUntil(
                axios
                    .post(`${baseUrl}/api/initial-sync`, {
                        accountId,
                        userId,
                    })
                    .then((response) => {
                        console.log("Initial sync triggered", response.status);
                    })
                    .catch((error) => {
                        console.error("Failed to trigger initial sync", error);
                    }),
            );
        }

        return NextResponse.redirect(new URL("/mail?linked=1", req.url));
    } catch (error) {
        console.error("Failed to save linked Aurinko account:", error);
        return fail("link_failed");
    }
};