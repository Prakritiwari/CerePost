import Account from "@/lib/account";
import { syncEmailsToDatabase } from "@/lib/sync-to-db";
import { db } from "@/server/db";
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const POST = async (req: NextRequest) => {
    const { accountId, userId } = await req.json();
    if (!accountId || !userId) return NextResponse.json({ message: "Missing accountId or userId" }, { status: 400 })

    const dbAccount = await db.account.findUnique({
        where: {
            id: accountId,
            userId
        }
    })



    if (!dbAccount) return NextResponse.json({ message: "Account not found" }, { status: 404 })

    const account = new Account(dbAccount.token)
    let response
    try {
        response = await account.performInitialSync()
    } catch (error) {
        console.error("Initial sync failed:", error)
        return NextResponse.json(
            {
                message: "Initial sync failed",
                code: axios.isAxiosError(error)
                    ? (error.response?.data as { code?: string } | undefined)?.code
                    : undefined,
            },
            { status: 500 },
        )
    };

    if (!response) {
        return NextResponse.json({ message: "Initial sync failed" }, { status: 500 });
    }

    const { emails, deltaToken } = response
    // console.log('emails', emails)

    await db.account.update({
        where: {
            id: accountId
        },
        data: {
            nextDeltaToken: deltaToken
        }
    })

    await syncEmailsToDatabase(emails, accountId)
    console.log('sync completed', deltaToken)

    return NextResponse.json({ success: "true" }, { status: 200 })

}



