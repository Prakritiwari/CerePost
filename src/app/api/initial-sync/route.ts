import { Account } from "@/lib/account";
import { db } from "@/server/db";
import { NextRequest, NextResponse } from "next/server";

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
    const response = await account.performInitialSync();

    if (!response) {
        return NextResponse.json({ message: "Initial sync failed" }, { status: 500 });
    }

    const { emails, deltaToken } = response
    console.log('emails', emails)

    // await db.account.update({
    //     where: {
    //         id: accountId
    //     },
    //     data: {
    //         nextDeltaToken: deltaToken
    //     }
    // })

    // await syncEmailToDatabase(emails)
    // console.log('sync completed', deltaToken)

    return NextResponse.json({ success: "true" }, { status: 200 })

}



