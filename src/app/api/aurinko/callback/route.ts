import { exchangeCodeForAccessToken, getAccountDetails } from "@/lib/aurinko";
import { db } from "@/server/db";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { waitUntil } from "@vercel/functions";
import axios from "axios";

export const GET = async (req: NextRequest) => {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const params = req.nextUrl.searchParams
    const status = params.get("status");
    if (status != 'success') {
        return NextResponse.json({ message: "Failed to link account" }, { status: 400 });
    }


    const code = params.get('code')
    if (!code) return NextResponse.json({ message: "Authorization code not found" }, { status: 400 });

    const token = await exchangeCodeForAccessToken(code);

    if (!token) return NextResponse.json({ message: "Failed to exchange code for access token" }, { status: 400 });

    const accountDetails = await getAccountDetails(token.accessToken);
    if (!accountDetails) return NextResponse.json({ message: "Failed to fetch account details" }, { status: 400 });

    // Ensure user exists in our database before creating an account linked to it
    const existingUser = await db.user.findUnique({
        where: { id: userId }
    });

    if (!existingUser) {
        const clerkUser = await currentUser();
        const primaryEmail = clerkUser?.emailAddresses[0]?.emailAddress ?? accountDetails.email;

        await db.user.upsert({
            where: { id: userId },
            update: {},
            create: {
                id: userId,
                emailAddress: primaryEmail,
                firstName: clerkUser?.firstName ?? accountDetails.name?.split(" ")[0] ?? null,
                lastName: clerkUser?.lastName ?? accountDetails.name?.split(" ").slice(1).join(" ") ?? null,
                imageUrl: clerkUser?.imageUrl ?? null,
            }
        });
    }

    await db.account.upsert({
        where: {
            id: token.accountId.toString()
        },
        update: {
            token: token.accessToken
        },
        create: {
            id: token.accountId.toString(),
            userId,
            emailAddress: accountDetails.email,
            name: accountDetails.name,
            token: token.accessToken,
            provider: 'Google'
        }
    })

    //trigger initial sync endpoint
    waitUntil(
        axios.post(`${process.env.NEXT_PUBLIC_URL}/api/initial-sync`, {
            accountId: token.accountId.toString(),
            userId,
        }).then(response => {
            console.log("Initial sync triggered", response.status);
        }).catch(error => {
            console.error("Failed to trigger initial sync", error);
        })
    )
    return NextResponse.redirect(new URL('/mail', req.url));


}