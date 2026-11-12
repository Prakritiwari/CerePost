import axios from 'axios'
import type { EmailMessage } from './types';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/server/db';

const cleanEnv = (value?: string) =>
    value
        ?.trim()
        .replace(/^['"]+|['"]+$/g, '')
        .trim();

const getAurinkoConfig = () => {
    const clientId = cleanEnv(process.env.AURINKO_CLIENT_ID);
    const clientSecret = cleanEnv(process.env.AURINKO_CLIENT_SECRET);
    const baseUrl = cleanEnv(process.env.NEXT_PUBLIC_URL)?.replace(/\/+$/, '');

    return { clientId, clientSecret, baseUrl };
};

const ensureUser = async (userId: string) => {
    const existing = await db.user.findUnique({
        where: { id: userId },
        select: { id: true },
    });
    if (existing) return;

    const clerkUser = await currentUser();
    const primaryEmail =
        clerkUser?.emailAddresses[0]?.emailAddress ??
        `${userId}@users.cerepost.local`;

    await db.user.upsert({
        where: { id: userId },
        update: {},
        create: {
            id: userId,
            emailAddress: primaryEmail,
            firstName: clerkUser?.firstName ?? null,
            lastName: clerkUser?.lastName ?? null,
            imageUrl: clerkUser?.imageUrl ?? null,
        },
    });
};

export const getAurinkoAuthorizationUrl = async (serviceType: 'Google' | 'Office365') => {
    const { userId } = await auth()
    if (!userId) throw new Error('User not found')

    await ensureUser(userId)

    const { clientId, baseUrl } = getAurinkoConfig()
    if (!clientId || !baseUrl) {
        throw new Error('Aurinko is not configured on the server')
    }

    const params = new URLSearchParams({
        clientId,
        serviceType,
        scopes: 'Mail.Read Mail.ReadWrite Mail.Send Mail.Drafts Mail.All',
        responseType: 'code',
        returnUrl: `${baseUrl}/api/aurinko/callback`,
    });

    return `https://api.aurinko.io/v1/auth/authorize?${params.toString()}`;
};


export const getAurinkoToken = async (code: string) => {    const { clientId, clientSecret } = getAurinkoConfig()
    if (!clientId || !clientSecret) {
        throw new Error('Aurinko is not configured on the server')
    }

    try {
        const response = await axios.post(`https://api.aurinko.io/v1/auth/token/${code}`,
            {},
            {
                auth: {
                    username: clientId,
                    password: clientSecret,
                }
            }
        );

        return response.data as {
            accountId: number,
            accessToken: string,
            userId: string,
            userSession: string
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error fetching Aurinko token:', {
                status: error.response?.status,
                data: error.response?.data as unknown,
            });

            const data = error.response?.data as
                | { code?: string; message?: string }
                | undefined;
            const wrapped = new Error(
                data?.message ??
                    'Failed to exchange Aurinko authorization code',
            ) as Error & { code?: string };
            wrapped.code = data?.code;
            throw wrapped;
        }

        console.error('Unexpected error fetching Aurinko token:', error);
        throw error;
    }
}

export const checkAurinkoCredentials = async (): Promise<{
    ok: boolean;
    code?: string;
}> => {
    const { clientId, clientSecret } = getAurinkoConfig();
    if (!clientId || !clientSecret) {
        return { ok: false, code: 'configuration' };
    }

    try {
        const response = await axios.post(
            'https://api.aurinko.io/v1/auth/token/__cerepost_config_check__',
            {},
            {
                auth: { username: clientId, password: clientSecret },
                validateStatus: () => true,
                timeout: 15_000,
            },
        );

        const code = (response.data as { code?: string } | undefined)?.code;
        if (code === 'application.notfound') {
            return { ok: false, code };
        }

        return { ok: true };
    } catch (error) {
        // A network problem shouldn't block the actual OAuth attempt.
        console.error(
            'Could not verify Aurinko credentials:',
            (error as Error).message,
        );
        return { ok: true };
    }
};

export const getAccountDetails = async (accessToken: string) => {
    try {
        const response = await axios.get('https://api.aurinko.io/v1/account', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        return response.data as {
            email: string,
            name: string
        };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error fetching account details:', error.response?.data);
        } else {
            console.error('Unexpected error fetching account details:', error);
        }
        throw error;
    }
}

export const getEmailDetails = async (accessToken: string, emailId: string) => {
    try {
        const response = await axios.get<EmailMessage>(`https://api.aurinko.io/v1/email/messages/${emailId}`, {
            params: {
                loadInlines: true
            },
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        return response.data
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error fetching email details:', error.response?.data);
        } else {
            console.error('Unexpected error fetching email details:', error);
        }
        throw error;
    }
}